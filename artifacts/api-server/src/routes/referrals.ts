import { randomBytes } from "node:crypto";
import { clerkClient, getAuth } from "@clerk/express";
import { db, eq, referralCouponsTable, sql, userProfilesTable, keyTransactionsTable, usersTable } from "../../../../lib/db/src/index.js";
import { createCompatibleRouter } from "./compatRouter.js";
import { z } from "zod";

const router = createCompatibleRouter();
const DEFAULT_REFERRAL_AMOUNT = 1000;
const REFERRAL_CODE_PATTERN = /^[A-Z0-9]{10,32}$/;

function clerkUserId(req: any): string | null {
  const auth = getAuth(req);
  return auth?.userId || (auth?.sessionClaims?.userId as string | undefined) || null;
}

function normalizedEmail(value: unknown): string | null {
  return typeof value === "string" && value.includes("@") ? value.trim().toLowerCase() : null;
}

async function verifiedClerkEmail(req: any, clerkId: string): Promise<string | null> {
  const claims = getAuth(req)?.sessionClaims as Record<string, unknown> | undefined;
  const claimEmail = normalizedEmail(claims?.email ?? claims?.primaryEmail);
  if (claimEmail) return claimEmail;

  try {
    const user = await clerkClient.users.getUser(clerkId);
    return normalizedEmail(user.primaryEmailAddress?.emailAddress);
  } catch (error) {
    req.log?.warn?.({ err: error }, "Could not verify Clerk email for referral admin");
    return null;
  }
}

async function getUser(clerkId: string) {
  const existing = await db.query.usersTable.findFirst({
    where: eq(usersTable.clerkId, clerkId),
  });
  if (existing) return existing;
  const [created] = await db.insert(usersTable).values({ clerkId }).onConflictDoNothing().returning();
  return created ?? (await db.query.usersTable.findFirst({ where: eq(usersTable.clerkId, clerkId) }))!;
}

function allowedReferralAdmins(): Set<string> {
  const configured = process.env.REFERRAL_ADMIN_EMAILS
    ?.split(",")
    .map((email) => normalizedEmail(email))
    .filter((email): email is string => Boolean(email));
  return new Set(configured?.length ? configured : ["ttatamax@gmail.com"]);
}

function newReferralCode(): string {
  return randomBytes(9).toString("base64url").replace(/[^A-Za-z0-9]/g, "").slice(0, 12).toUpperCase();
}

router.post("/referrals", async (req, res): Promise<void> => {
  const clerkId = clerkUserId(req);
  if (!clerkId) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  const email = await verifiedClerkEmail(req, clerkId);
  if (!email || !allowedReferralAdmins().has(email)) {
    res.status(403).json({ error: "Referral issuing is not available for this account" });
    return;
  }

  const parsed = z.object({
    amount: z.number().int().min(1).max(100000).optional(),
  }).safeParse(req.body ?? {});
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid referral amount" });
    return;
  }

  const creator = await getUser(clerkId);
  const amount = parsed.data.amount ?? DEFAULT_REFERRAL_AMOUNT;
  let coupon: typeof referralCouponsTable.$inferSelect | undefined;
  for (let attempt = 0; attempt < 3 && !coupon; attempt += 1) {
    try {
      [coupon] = await db.insert(referralCouponsTable).values({
        code: newReferralCode(),
        amount,
        createdByUserId: creator.id,
      }).returning();
    } catch (error: any) {
      if (error?.code !== "23505") throw error;
    }
  }
  if (!coupon) {
    res.status(503).json({ error: "Could not create a unique referral link" });
    return;
  }

  res.status(201).json({
    code: coupon.code,
    amount: coupon.amount,
    createdAt: coupon.createdAt,
  });
});

router.get("/referrals/:code", async (req, res): Promise<void> => {
  const rawCode = Array.isArray(req.params.code) ? req.params.code[0] : req.params.code;
  const code = rawCode.toUpperCase();
  if (!REFERRAL_CODE_PATTERN.test(code)) {
    res.status(404).json({ error: "Referral link not found" });
    return;
  }

  const coupon = await db.query.referralCouponsTable.findFirst({
    where: eq(referralCouponsTable.code, code),
  });
  if (!coupon) {
    res.status(404).json({ error: "Referral link not found" });
    return;
  }
  res.json({
    code: coupon.code,
    amount: coupon.amount,
    available: !coupon.claimedAt,
  });
});

router.post("/referrals/:code/claim", async (req, res): Promise<void> => {
  const clerkId = clerkUserId(req);
  if (!clerkId) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  const rawCode = Array.isArray(req.params.code) ? req.params.code[0] : req.params.code;
  const code = rawCode.toUpperCase();
  if (!REFERRAL_CODE_PATTERN.test(code)) {
    res.status(404).json({ error: "Referral link not found" });
    return;
  }

  const user = await getUser(clerkId);
  const result = await db.transaction(async (tx) => {
    const lock = await tx.execute(sql`SELECT id FROM referral_coupons WHERE code = ${code} FOR UPDATE`);
    if (lock.rows.length === 0) return { status: "missing" as const };

    const coupon = await tx.query.referralCouponsTable.findFirst({
      where: eq(referralCouponsTable.code, code),
    });
    if (!coupon) return { status: "missing" as const };
    if (coupon.claimedAt) return { status: "already_claimed" as const };

    const profile = await tx.query.userProfilesTable.findFirst({
      where: eq(userProfilesTable.userId, user.id),
    }) ?? (await tx.insert(userProfilesTable).values({ userId: user.id }).returning())[0];
    const totalKeys = profile.totalKeys + coupon.amount;

    await tx.insert(keyTransactionsTable).values({
      userId: user.id,
      amount: coupon.amount,
      reason: `referral:${coupon.code}`,
      relatedEntityId: coupon.id,
    });
    const [nextProfile] = await tx.update(userProfilesTable)
      .set({ totalKeys, updatedAt: new Date() })
      .where(eq(userProfilesTable.userId, user.id))
      .returning();
    await tx.update(referralCouponsTable)
      .set({ claimedAt: new Date(), claimedByUserId: user.id })
      .where(eq(referralCouponsTable.id, coupon.id));

    return { status: "success" as const, amount: coupon.amount, totalKeys, profile: nextProfile };
  });

  if (result.status === "missing") {
    res.status(404).json({ error: "Referral link not found" });
    return;
  }
  if (result.status === "already_claimed") {
    res.status(409).json({ error: "Referral link has already been used" });
    return;
  }
  res.json({
    code,
    amount: result.amount,
    totalKeys: result.totalKeys,
    profile: result.profile,
  });
});

export default router;