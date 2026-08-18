import { getAuth } from "@clerk/express";
import { and, db, eq, usersTable } from "../../../../lib/db/src/index.js";
import { z } from "zod";
import {
  isTechniqueId,
  recordTechniqueCompletion,
  type TechniqueId,
  type TechniqueMetadata,
} from "../services/techniqueRewards.js";
import { createCompatibleRouter } from "./compatRouter.js";
import { logger } from "../lib/logger.js";

const router = createCompatibleRouter();

const metadataSchemas: Record<TechniqueId, z.ZodTypeAny> = {
  T1: z.object({
    actualSeconds: z.number().int().min(0).max(86400),
    estimatedSeconds: z.number().int().min(1).max(86400),
    taskText: z.string().trim().min(1).max(1000),
    durationMin: z.number().int().min(1).max(1440),
  }),
  T2: z.object({
    goalId: z.string().trim().min(1).max(128),
    answers: z.array(z.string().trim().min(20).max(5000)).min(5).max(20),
  }),
  T3: z.object({ durationLabel: z.string().trim().min(1).max(32) }),
  T4: z.object({ steps: z.number().int().min(0).max(200000) }),
  T5: z.object({
    hobbyName: z.string().trim().min(1).max(200),
    durationLabel: z.string().trim().min(1).max(32),
    challengeResult: z.enum(["done", "partial", "none"]).optional(),
  }),
  T6: z.object({
    sleepTime: z.string().trim().min(1).max(64),
    timezoneOffsetMinutes: z.number().int().min(-840).max(840).optional(),
  }),
  T7: z.object({
    mode: z.enum(["reverse", "matrix", "symbols"]),
    level: z.number().int().min(1).max(1000000),
  }),
  T8: z.object({
    mode: z.enum(["signals", "tracking", "search"]),
    level: z.number().int().min(1).max(1000000),
    bestReactionMs: z.number().int().min(0).max(60000).optional(),
    averageReactionMs: z.number().int().min(0).max(60000).optional(),
    stabilityPercent: z.number().min(0).max(100).optional(),
  }),
};

router.post("/techniques/complete", async (req, res) => {
  const auth = getAuth(req);
  const clerkId = auth?.userId || (auth?.sessionClaims?.userId as string | undefined);
  if (!clerkId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const parsed = z.object({
    techniqueId: z.string(),
    // Kept for compatibility with the static client. It is never used for rewards or app-day.
    clientDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    idempotencyKey: z.string().trim().min(16).max(128),
    timezoneOffsetMinutes: z.number().int().min(-840).max(840).default(0),
    metadata: z.record(z.string(), z.any()),
  }).safeParse(req.body);
  if (!parsed.success || !isTechniqueId(parsed.data?.techniqueId ?? "")) {
    res.status(400).json({ error: "Invalid payload" });
    return;
  }
  const techniqueId = parsed.data.techniqueId as TechniqueId;
  const metadata = metadataSchemas[techniqueId].safeParse(parsed.data.metadata);
  if (!metadata.success) {
    res.status(400).json({ error: "Invalid technique metadata" });
    return;
  }
  const user = await db.query.usersTable.findFirst({
    where: eq(usersTable.clerkId, clerkId),
  }) ?? (await db.insert(usersTable).values({ clerkId })
    .onConflictDoNothing()
    .returning())[0] ?? (await db.query.usersTable.findFirst({
    where: eq(usersTable.clerkId, clerkId),
  }))!;
  try {
    res.json(await recordTechniqueCompletion(
      user.id,
      techniqueId,
      metadata.data as TechniqueMetadata,
      parsed.data.timezoneOffsetMinutes,
      parsed.data.idempotencyKey,
    ));
  } catch (error) {
    const code = typeof error === "object" && error !== null && "code" in error
      ? String(error.code)
      : "completion_transaction_failed";
    logger.error({ err: error, techniqueId, code }, "Technique completion failed");
    res.status(500).json({ error: "Technique completion failed", code });
  }
});

export default router;