import { createHash } from "node:crypto";
import { and, eq, sql } from "drizzle-orm";
import {
  completedTechniquesTable,
  db,
  keyTransactionsTable,
  legacyMigrationsTable,
  potentialTransactionsTable,
  streakHistoryTable,
  userProfilesTable,
  userStatesTable,
} from "@workspace/db";
import {
  appDayKey,
  isTechniqueId,
  rewardForMetadata,
  type TechniqueId,
  type TechniqueMetadata,
} from "./techniqueRewards";

type JsonObject = Record<string, unknown>;
type LegacyActivity = {
  id?: string;
  date: Date;
  type: string;
  keysGained?: number;
  potentialGained?: number;
  details: TechniqueMetadata;
};
type LegacySpend = { articleId: string; amount: number; date: Date };

export interface LegacyAudit {
  keysExpected: number | null;
  keysFromHistory: number;
  potentialExpected: number | null;
  potentialFromHistory: number;
  activityEntries: number;
  verifiedActivities: number;
  importedActivities: number;
  rejectedActivities: number;
  verifiedKeys: number;
  verifiedPotential: number;
  warnings: string[];
}

export interface LegacyMigrationResult {
  status: "imported" | "imported_with_warnings" | "already_imported";
  audit: LegacyAudit;
  state: JsonObject;
  profile: typeof userProfilesTable.$inferSelect;
}

const activityTypes: Record<string, TechniqueId> = {
  planner: "T1",
  visualization: "T2",
  meditation: "T3",
  walk: "T4",
  hobby: "T5",
  sleep: "T6",
};

const protectedStateKeys = new Set([
  "keys",
  "potential",
  "streak",
  "lastCompletedDate",
  "todayTechniques",
  "todayTechniquesDate",
  "profile",
  "unlockedArticles",
  "purchaseHistory",
  "firstGoalBonusGiven",
]);

const legacyArticles: Record<string, { title: string; cost: number }> = {
  A1: { title: "Лучшая стратегия нейрохакинга, которая изменит жизнь за короткий срок", cost: 0 },
  A2: { title: "Как ставить цели, чтобы мозг хотел их достичь?", cost: 5 },
  A3: { title: "Научись управлять своим дофамином с помощью нейровизуализации", cost: 10 },
  A4: { title: "Гайд на планирование дел на день. Научись точно предсказывать время на задачу.", cost: 20 },
  A5: { title: "Гайд на сон. Как засыпать за 3–5 минут и просыпаться восстановленным.", cost: 400 },
};

const dailyKeyCaps: Partial<Record<TechniqueId, number>> = {
  T2: 40,
  T3: 40,
  T4: 80,
  T5: 60,
};

export function stripNonAuthoritativeState(state: JsonObject): JsonObject {
  return Object.fromEntries(
    Object.entries(state).filter(([key]) => !protectedStateKeys.has(key)),
  );
}

function finiteNonNegative(value: unknown): number | null {
  const number = typeof value === "number" ? value : Number(value);
  return Number.isFinite(number) && number >= 0 ? number : null;
}

function parseDate(value: unknown): Date | null {
  if (typeof value !== "string") return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function objectValue(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function warning(audit: LegacyAudit, value: string): void {
  if (audit.warnings.length < 100) audit.warnings.push(value);
}

function parseHistoryAmounts(state: JsonObject, audit: LegacyAudit): void {
  const keysHistory = state.keysHistory;
  if (Array.isArray(keysHistory)) {
    for (const [index, raw] of keysHistory.entries()) {
      if (!objectValue(raw)) {
        warning(audit, `invalid_keys_history:${index}`);
        continue;
      }
      const amount = finiteNonNegative(raw.amount);
      const date = parseDate(raw.date);
      if (amount === null || !date || (raw.type !== "earn" && raw.type !== "spend")) {
        warning(audit, `invalid_keys_history:${index}`);
        continue;
      }
      audit.keysFromHistory += raw.type === "spend" ? -amount : amount;
    }
  }

  const potentialHistory = state.potentialHistory;
  if (Array.isArray(potentialHistory)) {
    for (const [index, raw] of potentialHistory.entries()) {
      if (!objectValue(raw)) {
        warning(audit, `invalid_potential_history:${index}`);
        continue;
      }
      const amount = finiteNonNegative(raw.amount);
      if (amount === null || !parseDate(raw.date)) {
        warning(audit, `invalid_potential_history:${index}`);
        continue;
      }
      audit.potentialFromHistory += amount;
    }
  }
}

function validatedArticlePurchases(state: JsonObject, audit: LegacyAudit): string[] {
  const unlocked = new Set<string>(["A1"]);
  if (Array.isArray(state.unlockedArticles)) {
    for (const id of state.unlockedArticles) {
      if (typeof id === "string" && legacyArticles[id]) unlocked.add(id);
    }
  }
  if (!Array.isArray(state.keysHistory)) return [...unlocked];
  for (const [index, raw] of state.keysHistory.entries()) {
    if (!objectValue(raw) || raw.type !== "spend") continue;
    const source = typeof raw.source === "string" ? raw.source : "";
    const amount = finiteNonNegative(raw.amount);
    const article = Object.entries(legacyArticles).find(([, item]) =>
      source === `Статья: ${item.title}`,
    );
    if (!article || amount !== article[1].cost) {
      warning(audit, `unverified_article_purchase:${index}`);
      continue;
    }
    unlocked.add(article[0]);
  }
  return [...unlocked];
}

function validatedArticleSpends(state: JsonObject, audit: LegacyAudit): LegacySpend[] {
  if (!Array.isArray(state.keysHistory)) return [];
  const spends: LegacySpend[] = [];
  for (const [index, raw] of state.keysHistory.entries()) {
    if (!objectValue(raw) || raw.type !== "spend") continue;
    const source = typeof raw.source === "string" ? raw.source : "";
    const amount = finiteNonNegative(raw.amount);
    const date = parseDate(raw.date);
    const article = Object.entries(legacyArticles).find(([, item]) =>
      source === `Статья: ${item.title}`,
    );
    if (!article || amount === null || amount !== article[1].cost || !date) {
      warning(audit, `unverified_article_purchase:${index}`);
      continue;
    }
    spends.push({ articleId: article[0], amount, date });
  }
  return spends;
}

function parseActivities(state: JsonObject, audit: LegacyAudit): LegacyActivity[] {
  if (!Array.isArray(state.activityLog)) return [];
  const activities: LegacyActivity[] = [];
  for (const [index, raw] of state.activityLog.entries()) {
    if (!objectValue(raw)) {
      warning(audit, `invalid_activity:${index}`);
      continue;
    }
    const date = parseDate(raw.date);
    const details = objectValue(raw.details) ? raw.details : null;
    if (!date || !details || typeof raw.type !== "string" || !activityTypes[raw.type]) {
      warning(audit, `invalid_activity:${index}`);
      continue;
    }
    const id = typeof raw.id === "string" && raw.id.length <= 128 ? raw.id : undefined;
    activities.push({
      id,
      date,
      type: raw.type,
      keysGained: finiteNonNegative(raw.keysGained) ?? undefined,
      potentialGained: finiteNonNegative(raw.potentialGained) ?? undefined,
      details,
    });
  }
  return activities.sort((a, b) => a.date.getTime() - b.date.getTime());
}

function metadataForActivity(activity: LegacyActivity): TechniqueMetadata | null {
  const techniqueId = activityTypes[activity.type];
  const details = activity.details;
  if (techniqueId === "T1") {
    if (
      typeof details.taskText !== "string" ||
      details.taskText.trim().length === 0 ||
      finiteNonNegative(details.actualSeconds) === null ||
      finiteNonNegative(details.estimatedSeconds) === null
    ) return null;
    return {
      taskText: details.taskText,
      actualSeconds: Number(details.actualSeconds),
      estimatedSeconds: Number(details.estimatedSeconds),
      durationMin: Math.max(1, Math.round(Number(details.durationMin) || Number(details.estimatedSeconds) / 60)),
    };
  }
  if (techniqueId === "T2") {
    if (
      typeof details.goalId !== "string" ||
      !Array.isArray(details.answers) ||
      details.answers.length < 5 ||
      details.answers.some((answer) => typeof answer !== "string" || answer.trim().length < 20)
    ) return null;
    return { goalId: details.goalId, answers: details.answers };
  }
  if (techniqueId === "T3") {
    return typeof details.durationLabel === "string" ? { durationLabel: details.durationLabel } : null;
  }
  if (techniqueId === "T4") {
    const steps = finiteNonNegative(details.steps);
    return steps !== null && Number.isInteger(steps) ? { steps } : null;
  }
  if (techniqueId === "T5") {
    return typeof details.hobbyName === "string" && typeof details.durationLabel === "string"
      ? {
          hobbyName: details.hobbyName,
          durationLabel: details.durationLabel,
          challengeResult: details.challengeResult,
        }
      : null;
  }
  if (!/^\d{1,2}:\d{2}(?::\d{2})?$/.test(String(details.sleepTime ?? ""))) return null;
  const timezoneOffsetMinutes = Number(details.timezoneOffsetMinutes);
  return Number.isInteger(timezoneOffsetMinutes) && timezoneOffsetMinutes >= -840 && timezoneOffsetMinutes <= 840
    ? { sleepTime: details.sleepTime, timezoneOffsetMinutes }
    : { sleepTime: details.sleepTime };
}

function legacyIdempotencyKey(migrationKey: string, activity: LegacyActivity, index: number): string {
  const source = `${migrationKey}:${activity.id ?? index}:${activity.date.toISOString()}`;
  return `legacy:${createHash("sha256").update(source).digest("hex")}`;
}

async function profileFor(
  executor: any,
  userId: number,
): Promise<typeof userProfilesTable.$inferSelect> {
  const existing = await executor.query.userProfilesTable.findFirst({
    where: eq(userProfilesTable.userId, userId),
  });
  if (existing) return existing;
  const [created] = await executor.insert(userProfilesTable).values({ userId }).returning();
  return created;
}

export async function migrateLegacyState(
  userId: number,
  migrationKey: string,
  sourceState: JsonObject,
): Promise<LegacyMigrationResult> {
  const audit: LegacyAudit = {
    keysExpected: finiteNonNegative(sourceState.keys),
    keysFromHistory: 0,
    potentialExpected: finiteNonNegative(sourceState.potential),
    potentialFromHistory: 0,
    activityEntries: Array.isArray(sourceState.activityLog) ? sourceState.activityLog.length : 0,
    verifiedActivities: 0,
    importedActivities: 0,
    rejectedActivities: 0,
    verifiedKeys: 0,
    verifiedPotential: 0,
    warnings: [],
  };
  parseHistoryAmounts(sourceState, audit);
  if (audit.keysExpected !== null && Math.floor(audit.keysExpected) !== Math.floor(audit.keysFromHistory)) {
    warning(audit, "keys_history_mismatch");
  }
  if (audit.potentialExpected !== null && Math.abs(audit.potentialExpected - audit.potentialFromHistory) > 0.001) {
    warning(audit, "potential_history_mismatch");
  }

  const safeState = stripNonAuthoritativeState(sourceState);
  const importedUnlockedArticles = validatedArticlePurchases(sourceState, audit);
  const validatedSpends = validatedArticleSpends(sourceState, audit);
  safeState.unlockedArticles = importedUnlockedArticles;
  const activities = parseActivities(sourceState, audit);
  const now = new Date();
  const result = await db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(${userId})`);
    const existing = await tx.query.legacyMigrationsTable.findFirst({
      where: eq(legacyMigrationsTable.userId, userId),
    });
    if (existing) {
      return {
        existing,
        profile: await profileFor(tx, userId),
      };
    }

    const profileBefore = await profileFor(tx, userId);
    const dailyKeys = new Map<string, number>();
    const seededDays = new Set<string>();
    const importedDays = new Set<string>();
    let totalKeys = profileBefore.totalKeys;
    let totalPotential = profileBefore.totalPotential;
    let currentStreak = profileBefore.currentStreak;
    let longestStreak = profileBefore.longestStreak;

    for (const [index, activity] of activities.entries()) {
      if (activity.date > now) {
        audit.rejectedActivities += 1;
        warning(audit, `future_activity:${index}`);
        continue;
      }
      const techniqueId = activityTypes[activity.type];
      const metadata = metadataForActivity(activity);
      if (!metadata) {
        audit.rejectedActivities += 1;
        warning(audit, `unverifiable_activity:${index}:${techniqueId}`);
        continue;
      }
      audit.verifiedActivities += 1;
      const rawOffset = Number(activity.details.timezoneOffsetMinutes);
      const timezoneOffsetMinutes = Number.isInteger(rawOffset) && rawOffset >= -840 && rawOffset <= 840
        ? rawOffset
        : 0;
      const day = appDayKey(activity.date, timezoneOffsetMinutes);
      const idempotencyKey = legacyIdempotencyKey(migrationKey, activity, index);
      const existingCompletion = await tx.query.completedTechniquesTable.findFirst({
        where: and(
          eq(completedTechniquesTable.userId, userId),
          eq(completedTechniquesTable.idempotencyKey, idempotencyKey),
        ),
      });
      if (existingCompletion) continue;

      const existingForActivity = await tx.select({
        metadata: completedTechniquesTable.metadata,
      }).from(completedTechniquesTable).where(and(
        eq(completedTechniquesTable.userId, userId),
        eq(completedTechniquesTable.techniqueId, techniqueId),
        eq(completedTechniquesTable.appDay, day),
      ));
      if (existingForActivity.some((row) => JSON.stringify(row.metadata) === JSON.stringify(metadata))) {
        warning(audit, `duplicate_activity:${index}`);
        continue;
      }

      if (techniqueId === "T1" || techniqueId === "T6") {
        const sameDay = await tx.query.completedTechniquesTable.findFirst({
          where: and(
            eq(completedTechniquesTable.userId, userId),
            eq(completedTechniquesTable.techniqueId, techniqueId),
            eq(completedTechniquesTable.appDay, day),
          ),
        });
        if (sameDay) {
          audit.rejectedActivities += 1;
          warning(audit, `duplicate_activity:${index}`);
          continue;
        }
      }

      const rawReward = rewardForMetadata(techniqueId, metadata);
      const dailyCap = dailyKeyCaps[techniqueId];
      const dayKey = `${techniqueId}:${day}`;
      if (!seededDays.has(dayKey) && dailyCap !== undefined) {
        const [{ total }] = await tx.select({
          total: sql<number>`coalesce(sum(${completedTechniquesTable.keysAwarded}), 0)`,
        }).from(completedTechniquesTable).where(and(
          eq(completedTechniquesTable.userId, userId),
          eq(completedTechniquesTable.techniqueId, techniqueId),
          eq(completedTechniquesTable.appDay, day),
        ));
        dailyKeys.set(dayKey, Number(total ?? 0));
        seededDays.add(dayKey);
      }
      let keys = Math.max(0, Math.floor(rawReward.keys));
      if (dailyCap !== undefined) {
        const remaining = Math.max(0, dailyCap - (dailyKeys.get(dayKey) ?? 0));
        keys = Math.min(keys, remaining);
        dailyKeys.set(dayKey, (dailyKeys.get(dayKey) ?? 0) + keys);
      }
      const potential = Math.max(0, rawReward.potential);
      const [completion] = await tx.insert(completedTechniquesTable).values({
        userId,
        techniqueId,
        appDay: day,
        idempotencyKey,
        completedAt: activity.date,
        keysAwarded: keys,
        potentialAwarded: potential,
        metadata,
      }).returning({ id: completedTechniquesTable.id });
      await tx.insert(keyTransactionsTable).values({
        userId, amount: keys, reason: `legacy:${techniqueId}`, relatedEntityId: completion.id,
      });
      await tx.insert(potentialTransactionsTable).values({
        userId, amount: potential, reason: `legacy:${techniqueId}`, relatedEntityId: completion.id,
      });
      audit.importedActivities += 1;
      audit.verifiedKeys += keys;
      audit.verifiedPotential += potential;
      totalKeys += keys;
      totalPotential = Math.min(100, totalPotential + potential);
      importedDays.add(day);

      const previous = new Date(`${day}T00:00:00Z`);
      previous.setUTCDate(previous.getUTCDate() - 1);
      const previousDay = previous.toISOString().slice(0, 10);
      const existingStreak = await tx.query.streakHistoryTable.findFirst({
        where: and(eq(streakHistoryTable.userId, userId), eq(streakHistoryTable.date, day)),
      });
      const previousStreak = await tx.query.streakHistoryTable.findFirst({
        where: and(eq(streakHistoryTable.userId, userId), eq(streakHistoryTable.date, previousDay)),
      });
      currentStreak = existingStreak?.streakCount
        ?? (previousStreak ? currentStreak + 1 : 1);
      longestStreak = Math.max(longestStreak, currentStreak);
      await tx.insert(streakHistoryTable).values({
        userId, date: day, status: "completed", streakCount: currentStreak,
      }).onConflictDoUpdate({
        target: [streakHistoryTable.userId, streakHistoryTable.date],
        set: { status: "completed", streakCount: currentStreak },
      });
    }

    // Article unlocks are imported only when the legacy ledger contains a
    // recognizable article/cost pair. Their negative transactions are part
    // of the authoritative balance just like technique rewards.
    for (const spend of validatedSpends) {
      const amount = Math.min(spend.amount, Math.max(0, totalKeys));
      if (amount !== spend.amount) warning(audit, "article_spend_exceeds_verified_balance");
      if (amount <= 0) continue;
      await tx.insert(keyTransactionsTable).values({
        userId,
        amount: -amount,
        reason: `legacy:article:${spend.articleId}`,
      });
      totalKeys -= amount;
    }

    if (activities.some((activity) => activity.details.timezoneOffsetMinutes === undefined)) {
      warning(audit, "timezone_missing_for_some_activities");
    }
    await tx.insert(legacyMigrationsTable).values({
      userId,
      migrationKey,
      sourceState: safeState,
      audit,
      status: audit.warnings.length ? "imported_with_warnings" : "imported",
    });
    await tx.insert(userStatesTable).values({
      userId,
      state: safeState,
    }).onConflictDoUpdate({
      target: userStatesTable.userId,
      set: { state: safeState, updatedAt: new Date() },
    });
    const [profile] = await tx.insert(userProfilesTable).values({
      userId,
      totalKeys,
      totalPotential,
      currentStreak: importedDays.size ? currentStreak : profileBefore.currentStreak,
      longestStreak,
    }).onConflictDoUpdate({
      target: userProfilesTable.userId,
      set: {
        totalKeys,
        totalPotential,
        currentStreak: importedDays.size ? currentStreak : profileBefore.currentStreak,
        longestStreak,
        updatedAt: new Date(),
      },
    }).returning();
    return { existing: null, profile };
  });

  if (result.existing) {
    return {
      status: "already_imported",
      audit: result.existing.audit as LegacyAudit,
      state: result.existing.sourceState as JsonObject,
      profile: result.profile,
    };
  }
  return {
    status: audit.warnings.length ? "imported_with_warnings" : "imported",
    audit,
    state: safeState,
    profile: result.profile,
  };
}