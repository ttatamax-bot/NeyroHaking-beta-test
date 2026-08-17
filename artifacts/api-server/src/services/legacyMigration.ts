import { createHash } from "node:crypto";
import {
  and,
  completedTechniquesTable,
  db,
  eq,
  keyTransactionsTable,
  legacyMigrationsTable,
  sql,
  userProfilesTable,
  userStatesTable,
} from "../../../../lib/db/src/index.js";
import {
  appDayKey,
  isTechniqueId,
  type TechniqueId,
  type TechniqueMetadata,
} from "./techniqueRewards.js";

type JsonObject = Record<string, unknown>;
type LegacyActivity = {
  id?: string;
  date: Date;
  type: string;
  keysGained?: number;
  potentialGained?: number;
  details: TechniqueMetadata;
};
type LegacyKeyEntry = {
  index: number;
  date: Date;
  source: string;
  amount: number;
  type: "earn" | "spend";
};

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
  keyHistoryImported?: boolean;
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
  "closedDays",
  "lastCompletedDate",
  "todayTechniques",
  "todayTechniquesDate",
  "profile",
  "unlockedArticles",
  "firstGoalBonusGiven",
  "memory",
]);

const legacyArticles: Record<string, { title: string; cost: number }> = {
  A1: { title: "Лучшая стратегия нейрохакинга, которая изменит жизнь за короткий срок", cost: 0 },
  A2: { title: "Как ставить цели, чтобы мозг хотел их достичь?", cost: 5 },
  A3: { title: "Научись управлять своим дофамином с помощью нейровизуализации", cost: 10 },
  A4: { title: "Гайд на планирование дел на день. Научись точно предсказывать время на задачу.", cost: 20 },
  A5: { title: "Гайд на сон. Как засыпать за 3–5 минут и просыпаться восстановленным.", cost: 400 },
};

export function stripNonAuthoritativeState(state: JsonObject): JsonObject {
  return Object.fromEntries(
    Object.entries(state).filter(([key]) => !protectedStateKeys.has(key)),
  );
}

function hasMeaningfulState(state: JsonObject): boolean {
  return (
    (finiteNonNegative(state.keys) ?? 0) > 0 ||
    (finiteNonNegative(state.potential) ?? 0) > 0 ||
    (finiteNonNegative(state.streak) ?? 0) > 0 ||
    Boolean(state.lastCompletedDate) ||
    Boolean(state.lastSessionDate) ||
    state.userState === "active" ||
    state.userState === "dayDone" ||
    state.onboardingComplete === true ||
    (Array.isArray(state.activityLog) && state.activityLog.length > 0) ||
    (Array.isArray(state.history) && state.history.length > 0) ||
    (Array.isArray(state.goals) && state.goals.length > 0) ||
    (Array.isArray(state.scenes) && state.scenes.length > 0) ||
    (Array.isArray(state.keysHistory) && state.keysHistory.length > 0) ||
    (Array.isArray(state.potentialHistory) && state.potentialHistory.length > 0) ||
    (Array.isArray(state.streakHistory) && state.streakHistory.length > 0) ||
    (Array.isArray(state.unlockedArticles) &&
      state.unlockedArticles.some((article) => article !== "A1")) ||
    (Array.isArray(state.readArticles) && state.readArticles.length > 0) ||
    (Array.isArray(state.readNews) && state.readNews.length > 0) ||
    (Array.isArray(state.plannerTasks) && state.plannerTasks.length > 0) ||
    (Array.isArray(state.purchaseHistory) && state.purchaseHistory.length > 0)
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

function parseKeyHistory(state: JsonObject, audit: LegacyAudit): LegacyKeyEntry[] {
  const entries: LegacyKeyEntry[] = [];
  const keysHistory = state.keysHistory;
  if (Array.isArray(keysHistory)) {
    for (const [index, raw] of keysHistory.entries()) {
      if (!objectValue(raw)) {
        warning(audit, `invalid_keys_history:${index}`);
        continue;
      }
      const amount = finiteNonNegative(raw.amount);
      const date = parseDate(raw.date);
      const source = typeof raw.source === "string" ? raw.source.trim() : "";
      if (
        amount === null ||
        !Number.isInteger(amount) ||
        !date ||
        source.length === 0 ||
        source.length > 500 ||
        (raw.type !== "earn" && raw.type !== "spend")
      ) {
        warning(audit, `invalid_keys_history:${index}`);
        continue;
      }
      audit.keysFromHistory += raw.type === "spend" ? -amount : amount;
      entries.push({
        index,
        date,
        source,
        amount,
        type: raw.type,
      });
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
  // Keep the user's original order in user state. Ledger rows retain each
  // source timestamp, so transaction ordering does not depend on this array.
  return entries;
}

function stateWithoutPotentialAndStreak(
  sourceState: JsonObject,
  keyHistory: LegacyKeyEntry[],
): JsonObject {
  const safeState = stripNonAuthoritativeState(sourceState);

  // These values belong to the new server-side economy and must not be
  // reconstructed from a client-controlled legacy snapshot.
  for (const key of [
    "potential",
    "potentialHistory",
    "totalPotential",
    "dayPotential",
    "dayPotentialDay",
    "streak",
    "streakHistory",
    "currentStreak",
    "longestStreak",
    "closedDays",
    "lastCompletedDate",
    "todayTechniques",
    "todayTechniquesDate",
  ]) {
    delete safeState[key];
  }

  safeState.keysHistory = keyHistory.map(({ date, source, amount, type }) => ({
    date: date.toISOString(),
    source,
    amount,
    type,
  }));

  if (Array.isArray(safeState.activityLog)) {
    safeState.activityLog = safeState.activityLog
      .filter(objectValue)
      .map((activity) => {
        const next = { ...activity };
        delete next.potentialGained;
        return next;
      });
  }

  if (Array.isArray(safeState.history)) {
    safeState.history = safeState.history
      .filter(objectValue)
      .map((day) => {
        const next = { ...day };
        delete next.potential;
        delete next.streak;
        return next;
      });
  }

  // A legacy dayDone flag was derived from the old potential/streak rules.
  // It must not lock the user after migration when no current day was moved.
  if (safeState.userState === "dayDone") safeState.userState = "active";
  return safeState;
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

/**
 * Repairs accounts that completed the earlier migration implementation.
 * That version kept keysHistory in user state but did not import the full
 * ledger into key_transactions. The repair is idempotent and never imports
 * potential or streak data.
 */
export async function reconcileLegacyKeyLedger(userId: number): Promise<void> {
  await db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(${userId})`);
    const migration = await tx.query.legacyMigrationsTable.findFirst({
      where: eq(legacyMigrationsTable.userId, userId),
    });
    if (!migration) return;

    const existingAudit = objectValue(migration.audit) ? migration.audit : {};
    if (existingAudit.keyHistoryImported === true) return;

    const sourceState = objectValue(migration.sourceState) ? migration.sourceState : {};
    const repairAudit: LegacyAudit = {
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
    const keyHistory = parseKeyHistory(sourceState, repairAudit);
    const transactions = await tx.select({
      amount: keyTransactionsTable.amount,
      reason: keyTransactionsTable.reason,
    }).from(keyTransactionsTable).where(eq(keyTransactionsTable.userId, userId));
    const existingReasons = new Set(transactions.map((transaction) => transaction.reason));

    for (const entry of keyHistory) {
      const reason = `legacy-key:${migration.migrationKey}:${entry.index}`;
      if (existingReasons.has(reason)) continue;
      await tx.insert(keyTransactionsTable).values({
        userId,
        amount: entry.type === "spend" ? -entry.amount : entry.amount,
        reason,
        createdAt: entry.date,
      });
      existingReasons.add(reason);
    }

    // Replace the old migration-era legacy balance with the source ledger,
    // while retaining any legitimate server transactions created afterwards.
    const nonLegacyBalance = transactions
      .filter((transaction) => !transaction.reason.startsWith("legacy"))
      .reduce((sum, transaction) => sum + transaction.amount, 0);
    const importedKeyBalance = keyHistory.reduce(
      (sum, entry) => sum + (entry.type === "spend" ? -entry.amount : entry.amount),
      0,
    );
    await profileFor(tx, userId);
    await tx.update(userProfilesTable)
      .set({
        totalKeys: Math.max(0, nonLegacyBalance + importedKeyBalance),
        updatedAt: new Date(),
      })
      .where(eq(userProfilesTable.userId, userId));

    repairAudit.verifiedKeys = keyHistory
      .filter((entry) => entry.type === "earn")
      .reduce((sum, entry) => sum + entry.amount, 0);
    repairAudit.keyHistoryImported = true;
    repairAudit.warnings = [
      ...(Array.isArray(existingAudit.warnings)
        ? existingAudit.warnings.filter((item): item is string => typeof item === "string")
        : []),
      "legacy_key_history_reconciled",
    ];
    const repairedState = stateWithoutPotentialAndStreak(sourceState, keyHistory);
    await tx.update(legacyMigrationsTable)
      .set({
        sourceState: repairedState,
        audit: repairAudit,
        status: repairAudit.warnings.length ? "imported_with_warnings" : "imported",
        importedAt: new Date(),
      })
      .where(eq(legacyMigrationsTable.id, migration.id));
    await tx.update(userStatesTable)
      .set({ state: repairedState, updatedAt: new Date() })
      .where(eq(userStatesTable.userId, userId));
  });
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
  const keyHistory = parseKeyHistory(sourceState, audit);
  if (audit.keysExpected !== null && Math.floor(audit.keysExpected) !== Math.floor(audit.keysFromHistory)) {
    warning(audit, "keys_history_mismatch");
  }
  if (audit.potentialExpected !== null && Math.abs(audit.potentialExpected - audit.potentialFromHistory) > 0.001) {
    warning(audit, "potential_history_mismatch");
  }

  const safeState = stateWithoutPotentialAndStreak(sourceState, keyHistory);
  const importedUnlockedArticles = validatedArticlePurchases(sourceState, audit);
  safeState.unlockedArticles = importedUnlockedArticles;
  const activities = parseActivities(sourceState, audit);
  const now = new Date();
  const result = await db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(${userId})`);
    const existing = await tx.query.legacyMigrationsTable.findFirst({
      where: eq(legacyMigrationsTable.userId, userId),
    });
    const incomingHasProgress = hasMeaningfulState(sourceState);
    const existingHasProgress = existing
      ? hasMeaningfulState(existing.sourceState as JsonObject)
      : false;
    if (existing && (!incomingHasProgress || existingHasProgress)) {
      return {
        existing,
        profile: await profileFor(tx, userId),
      };
    }

    const profileBefore = await profileFor(tx, userId);
    const importedKeyBalance = keyHistory.reduce(
      (sum, entry) => sum + (entry.type === "spend" ? -entry.amount : entry.amount),
      0,
    );
    const totalKeys = Math.max(0, profileBefore.totalKeys + importedKeyBalance);

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

      await tx.insert(completedTechniquesTable).values({
        userId,
        techniqueId,
        appDay: day,
        idempotencyKey,
        completedAt: activity.date,
        // Historical activities are preserved as history only. The current
        // economy must not derive new potential or streak rewards from them.
        keysAwarded: 0,
        potentialAwarded: 0,
        metadata,
      });
      audit.importedActivities += 1;
    }

    // Import the complete validated key ledger, including historical earnings
    // that were not tied to a technique (and article spends).
    for (const entry of keyHistory) {
      await tx.insert(keyTransactionsTable).values({
        userId,
        amount: entry.type === "spend" ? -entry.amount : entry.amount,
        reason: `legacy-key:${migrationKey}:${entry.index}`,
        createdAt: entry.date,
      });
      if (entry.type === "earn") audit.verifiedKeys += entry.amount;
    }
    audit.keyHistoryImported = true;

    if (activities.some((activity) => activity.details.timezoneOffsetMinutes === undefined)) {
      warning(audit, "timezone_missing_for_some_activities");
    }
    const migrationValues = {
      userId,
      migrationKey,
      sourceState: safeState,
      audit,
      status: audit.warnings.length ? "imported_with_warnings" : "imported",
      importedAt: now,
    };
    if (existing) {
      await tx.update(legacyMigrationsTable)
        .set(migrationValues)
        .where(eq(legacyMigrationsTable.id, existing.id));
    } else {
      await tx.insert(legacyMigrationsTable).values(migrationValues);
    }
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
    }).onConflictDoUpdate({
      target: userProfilesTable.userId,
      set: {
        totalKeys,
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