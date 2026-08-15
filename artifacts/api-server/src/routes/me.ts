import { getAuth } from "@clerk/express";
import {
  and,
  completedTechniquesTable,
  db,
  desc,
  eq,
  ilike,
  keyTransactionsTable,
  legacyMigrationsTable,
  potentialTransactionsTable,
  sql,
  updateUserProfileSchema,
  userProfilesTable,
  userStatesTable,
  usersTable,
} from "@workspace/db";
import {
  migrateLegacyState,
  stripNonAuthoritativeState,
} from "../services/legacyMigration.js";
import { createCompatibleRouter } from "./compatRouter.js";

const router = createCompatibleRouter();

function clerkUserId(req: any): string | null {
  const auth = getAuth(req);
  return auth?.userId || (auth?.sessionClaims?.userId as string | undefined) || null;
}

function requireUser(req: any, res: any): string | null {
  const id = clerkUserId(req);
  if (!id) res.status(401).json({ error: "Unauthorized" });
  return id;
}

function objectBody(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

const ARTICLE_COSTS: Record<string, number> = {
  A2: 5,
  A3: 10,
  A4: 20,
  A5: 400,
};
const SERVICE_COSTS: Record<string, number> = {
  consultation: 25_000,
  mentoring: 100_000,
};

async function getUser(clerkId: string) {
  const existing = await db.query.usersTable.findFirst({
    where: eq(usersTable.clerkId, clerkId),
  });
  if (existing) return existing;
  const [created] = await db.insert(usersTable)
    .values({ clerkId })
    .onConflictDoNothing()
    .returning();
  return created ?? (await db.query.usersTable.findFirst({
    where: eq(usersTable.clerkId, clerkId),
  }))!;
}

async function getProfile(userId: number) {
  const existing = await db.query.userProfilesTable.findFirst({
    where: eq(userProfilesTable.userId, userId),
  });
  if (existing) return existing;
  const [created] = await db.insert(userProfilesTable)
    .values({ userId })
    .onConflictDoNothing()
    .returning();
  return created ?? (await db.query.userProfilesTable.findFirst({
    where: eq(userProfilesTable.userId, userId),
  }))!;
}

router.get("/me", async (req, res) => {
  const clerkId = requireUser(req, res);
  if (!clerkId) return;
  const user = await getUser(clerkId);
  const state = await db.query.userStatesTable.findFirst({
    where: eq(userStatesTable.userId, user.id),
  });
  res.json({
    user: { id: user.id, clerkId: user.clerkId, email: user.email },
    state: state?.state ?? null,
    profile: await getProfile(user.id),
  });
});

router.get("/me/profile", async (req, res) => {
  const clerkId = requireUser(req, res);
  if (!clerkId) return;
  res.json(await getProfile((await getUser(clerkId)).id));
});

router.post("/me/profile", async (req, res) => {
  const clerkId = requireUser(req, res);
  if (!clerkId) return;
  const parsed = updateUserProfileSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid profile payload" });
    return;
  }
  const user = await getUser(clerkId);
  if (parsed.data.nickname) {
    const owner = await db.query.userProfilesTable.findFirst({
      where: ilike(userProfilesTable.nickname, parsed.data.nickname),
    });
    if (owner && owner.userId !== user.id) {
      res.status(409).json({ error: "Nickname is already taken" });
      return;
    }
  }
  try {
    const [profile] = await db.update(userProfilesTable)
      .set({ ...parsed.data, updatedAt: new Date() })
      .where(eq(userProfilesTable.userId, user.id))
      .returning();
    res.json(profile);
  } catch (error: unknown) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "23505") {
      res.status(409).json({ error: "Nickname is already taken" });
      return;
    }
    throw error;
  }
});

router.get("/me/history", async (req, res) => {
  const clerkId = requireUser(req, res);
  if (!clerkId) return;
  const user = await getUser(clerkId);
  const limit = Math.min(200, Math.max(1, Number(req.query.limit) || 50));
  res.json(await db.select().from(completedTechniquesTable)
    .where(eq(completedTechniquesTable.userId, user.id))
    .orderBy(desc(completedTechniquesTable.completedAt))
    .limit(limit));
});

router.get("/me/transactions", async (req, res) => {
  const clerkId = requireUser(req, res);
  if (!clerkId) return;
  const user = await getUser(clerkId);
  const limit = Math.min(200, Math.max(1, Number(req.query.limit) || 50));
  const type = req.query.type;
  const keys = type === "potential" ? [] : await db.select().from(keyTransactionsTable)
    .where(eq(keyTransactionsTable.userId, user.id))
    .orderBy(desc(keyTransactionsTable.createdAt))
    .limit(limit);
  const potential = type === "keys" ? [] : await db.select().from(potentialTransactionsTable)
    .where(eq(potentialTransactionsTable.userId, user.id))
    .orderBy(desc(potentialTransactionsTable.createdAt))
    .limit(limit);
  res.json({ keys, potential });
});

router.post("/me/state", async (req, res) => {
  const clerkId = requireUser(req, res);
  if (!clerkId || !objectBody(req.body)) {
    if (clerkId) res.status(400).json({ error: "Invalid state payload" });
    return;
  }
  const user = await getUser(clerkId);
  const result = await db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(${user.id})`);
    const safe = stripNonAuthoritativeState(req.body);
    const existing = await tx.query.userStatesTable.findFirst({
      where: eq(userStatesTable.userId, user.id),
    });
    const existingState = objectBody(existing?.state) ? existing.state : {};
    const nextState: Record<string, unknown> = { ...existingState, ...safe };
    let profile = await tx.query.userProfilesTable.findFirst({
      where: eq(userProfilesTable.userId, user.id),
    }) ?? (await tx.insert(userProfilesTable).values({ userId: user.id }).returning())[0];

    // The first-three-goals reward is granted by the server exactly once.
    // The client can submit goals, but cannot submit the balance mutation.
    const activeGoals = Array.isArray(nextState.goals)
      ? nextState.goals.filter((goal) =>
          objectBody(goal) && goal.status === "active",
        ).length
      : 0;
    if (activeGoals >= 3 && nextState.firstGoalBonusGiven !== true) {
      const [updatedProfile] = await tx.update(userProfilesTable)
        .set({ totalKeys: profile.totalKeys + 10, updatedAt: new Date() })
        .where(eq(userProfilesTable.userId, user.id))
        .returning();
      await tx.insert(keyTransactionsTable).values({
        userId: user.id,
        amount: 10,
        reason: "goal:first-three",
      });
      profile = updatedProfile;
      nextState.firstGoalBonusGiven = true;
    }

    const [row] = await tx.insert(userStatesTable).values({
      userId: user.id,
      state: nextState,
    }).onConflictDoUpdate({
      target: userStatesTable.userId,
      set: { state: nextState, updatedAt: new Date() },
    }).returning();
    return { state: row.state, profile };
  });
  res.json(result);
});

router.post("/me/articles/:articleId/purchase", async (req, res) => {
  const clerkId = requireUser(req, res);
  if (!clerkId) return;
  const articleId = String(req.params.articleId);
  const cost = ARTICLE_COSTS[articleId];
  if (!cost) {
    res.status(400).json({ error: "Unknown or free article" });
    return;
  }
  const user = await getUser(clerkId);

  const result = await db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(${user.id})`);
    const profile = await tx.query.userProfilesTable.findFirst({
      where: eq(userProfilesTable.userId, user.id),
    }) ?? (await tx.insert(userProfilesTable).values({ userId: user.id }).returning())[0];
    const row = await tx.query.userStatesTable.findFirst({
      where: eq(userStatesTable.userId, user.id),
    });
    const currentState = objectBody(row?.state) ? row.state : {};
    const currentUnlocked = Array.isArray(currentState.unlockedArticles)
      ? currentState.unlockedArticles.filter((id: unknown): id is string => typeof id === "string")
      : ["A1"];
    if (currentUnlocked.includes(articleId)) {
      return { profile, state: currentState, alreadyUnlocked: true };
    }
    if (profile.totalKeys < cost) return null;

    const nextKeys = profile.totalKeys - cost;
    await tx.insert(keyTransactionsTable).values({
      userId: user.id,
      amount: -cost,
      reason: `article:${articleId}`,
    });
    const [nextProfile] = await tx.update(userProfilesTable)
      .set({ totalKeys: nextKeys, updatedAt: new Date() })
      .where(eq(userProfilesTable.userId, user.id))
      .returning();
    const nextState = {
      ...currentState,
      unlockedArticles: [...new Set([...currentUnlocked, articleId])],
    };
    await tx.insert(userStatesTable).values({
      userId: user.id,
      state: nextState,
    }).onConflictDoUpdate({
      target: userStatesTable.userId,
      set: { state: nextState, updatedAt: new Date() },
    });
    return { profile: nextProfile, state: nextState, alreadyUnlocked: false };
  });

  if (!result) {
    res.status(409).json({ error: "Not enough keys" });
    return;
  }
  res.json({
    articleId,
    alreadyUnlocked: result.alreadyUnlocked,
    keys: result.profile.totalKeys,
    state: result.state,
    profile: result.profile,
  });
});

router.post("/me/articles/:articleId/read", async (req, res) => {
  const clerkId = requireUser(req, res);
  if (!clerkId) return;
  const articleId = String(req.params.articleId);
  if (!/^A[1-5]$/.test(articleId)) {
    res.status(400).json({ error: "Unknown article" });
    return;
  }
  const user = await getUser(clerkId);
  const result = await db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(${user.id})`);
    const profile = await tx.query.userProfilesTable.findFirst({
      where: eq(userProfilesTable.userId, user.id),
    }) ?? (await tx.insert(userProfilesTable).values({ userId: user.id }).returning())[0];
    const row = await tx.query.userStatesTable.findFirst({
      where: eq(userStatesTable.userId, user.id),
    });
    const currentState = objectBody(row?.state) ? row.state : {};
    const unlocked = Array.isArray(currentState.unlockedArticles)
      ? currentState.unlockedArticles : ["A1"];
    if (!unlocked.includes(articleId)) return { forbidden: true } as const;
    const already = await tx.query.potentialTransactionsTable.findFirst({
      where: and(
        eq(potentialTransactionsTable.userId, user.id),
        eq(potentialTransactionsTable.reason, `article-read:${articleId}`),
      ),
    });
    if (already) return { profile, state: currentState, alreadyRead: true } as const;
    const reward = 0.15;
    await tx.insert(potentialTransactionsTable).values({
      userId: user.id,
      amount: reward,
      reason: `article-read:${articleId}`,
    });
    const [nextProfile] = await tx.update(userProfilesTable)
      .set({
        totalPotential: Math.min(100, profile.totalPotential + reward),
        updatedAt: new Date(),
      })
      .where(eq(userProfilesTable.userId, user.id))
      .returning();
    const nextState = {
      ...currentState,
      readArticles: [
        ...new Set([
          ...(Array.isArray(currentState.readArticles) ? currentState.readArticles : []),
          articleId,
        ]),
      ],
    };
    await tx.insert(userStatesTable).values({
      userId: user.id,
      state: nextState,
    }).onConflictDoUpdate({
      target: userStatesTable.userId,
      set: { state: nextState, updatedAt: new Date() },
    });
    return { profile: nextProfile, state: nextState, alreadyRead: false } as const;
  });
  if ("forbidden" in result) {
    res.status(403).json({ error: "Article is not unlocked" });
    return;
  }
  res.json({
    articleId,
    alreadyRead: result.alreadyRead,
    potential: result.alreadyRead ? 0 : 0.15,
    state: result.state,
    profile: result.profile,
  });
});

router.post("/me/services/:serviceId/purchase", async (req, res) => {
  const clerkId = requireUser(req, res);
  if (!clerkId) return;
  const serviceId = String(req.params.serviceId);
  const cost = SERVICE_COSTS[serviceId];
  const purchaseKey = objectBody(req.body) && typeof req.body.purchaseKey === "string"
    ? req.body.purchaseKey : "";
  if (!cost || purchaseKey.length < 16 || purchaseKey.length > 128) {
    res.status(400).json({ error: "Invalid service purchase payload" });
    return;
  }
  const user = await getUser(clerkId);
  const reason = `service:${serviceId}:${purchaseKey}`;
  const result = await db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(${user.id})`);
    const existingPurchase = await tx.query.keyTransactionsTable.findFirst({
      where: and(
        eq(keyTransactionsTable.userId, user.id),
        eq(keyTransactionsTable.reason, reason),
      ),
    });
    const profile = await tx.query.userProfilesTable.findFirst({
      where: eq(userProfilesTable.userId, user.id),
    }) ?? (await tx.insert(userProfilesTable).values({ userId: user.id }).returning())[0];
    if (existingPurchase) return { profile, alreadyPurchased: true } as const;
    if (profile.totalKeys < cost) return null;
    await tx.insert(keyTransactionsTable).values({
      userId: user.id,
      amount: -cost,
      reason,
    });
    const [nextProfile] = await tx.update(userProfilesTable)
      .set({ totalKeys: profile.totalKeys - cost, updatedAt: new Date() })
      .where(eq(userProfilesTable.userId, user.id))
      .returning();
    return { profile: nextProfile, alreadyPurchased: false } as const;
  });
  if (!result) {
    res.status(409).json({ error: "Not enough keys" });
    return;
  }
  res.json({ serviceId, alreadyPurchased: result.alreadyPurchased, profile: result.profile });
});

router.post("/me/migrate-legacy", async (req, res) => {
  const clerkId = requireUser(req, res);
  if (!clerkId) return;
  const body = req.body as { migrationKey?: unknown; state?: unknown };
  if (
    typeof body.migrationKey !== "string" ||
    body.migrationKey.length < 16 ||
    body.migrationKey.length > 128 ||
    !objectBody(body.state)
  ) {
    res.status(400).json({ error: "Invalid migration payload" });
    return;
  }
  const user = await getUser(clerkId);
  res.json(await migrateLegacyState(user.id, body.migrationKey, body.state));
});

export default router;