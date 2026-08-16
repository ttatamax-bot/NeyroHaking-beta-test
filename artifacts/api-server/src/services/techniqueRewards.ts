import {
  and,
  completedTechniquesTable,
  db,
  eq,
  keyTransactionsTable,
  potentialTransactionsTable,
  sql,
  streakHistoryTable,
  userProfilesTable,
} from "../../../../lib/db/src/index.js";

export type TechniqueId = "T1" | "T2" | "T3" | "T4" | "T5" | "T6";
export type TechniqueMetadata = Record<string, unknown>;

export interface CompletionResult {
  keys: number;
  potential: number;
  completedTechniqueId: number;
  newStreak: number;
  longestStreak: number;
  totalKeys: number;
  totalPotential: number;
  alreadyCompleted?: boolean;
}

const techniqueIds: TechniqueId[] = ["T1", "T2", "T3", "T4", "T5", "T6"];
const singleCompletionTechniques = new Set<TechniqueId>(["T1", "T6"]);
const dailyKeyCaps: Partial<Record<TechniqueId, number>> = {
  T2: 40,
  T3: 40,
  T4: 80,
  T5: 60,
};

export function isTechniqueId(value: string): value is TechniqueId {
  return techniqueIds.includes(value as TechniqueId);
}

export function appDayKey(now: Date, timezoneOffsetMinutes: number): string {
  const local = new Date(now.getTime() - timezoneOffsetMinutes * 60_000);
  if (local.getUTCHours() < 5) local.setUTCDate(local.getUTCDate() - 1);
  return local.toISOString().slice(0, 10);
}

function numeric(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : Number(value);
}

function parseMinutes(label: unknown): number {
  const match = String(label ?? "").match(/\d+(?:[.,]\d+)?/u);
  return match ? Number(match[0].replace(",", ".")) : 0;
}

function plannerBaseReward(minutes: number): { keys: number; potential: number } {
  const options = [
    [10, 3, 0.03], [15, 5, 0.05], [30, 10, 0.1], [60, 20, 0.15],
    [90, 30, 0.2], [120, 40, 0.25], [150, 50, 0.3], [180, 60, 0.35],
    [210, 70, 0.4], [240, 80, 0.45], [270, 90, 0.5], [300, 100, 0.55],
    [330, 110, 0.6], [360, 120, 0.65], [390, 130, 0.7], [420, 140, 0.75],
    [450, 150, 0.8], [480, 160, 0.85],
  ] as const;
  if (minutes <= 0) return { keys: 0, potential: 0 };
  if (minutes < options[0][0]) {
    const ratio = minutes / options[0][0];
    return { keys: options[0][1] * ratio, potential: options[0][2] * ratio };
  }
  if (minutes >= options.at(-1)![0]) {
    const last = options.at(-1)!;
    return { keys: last[1], potential: last[2] };
  }
  for (let i = 0; i < options.length - 1; i += 1) {
    const [lowMinutes, lowKeys, lowPotential] = options[i];
    const [highMinutes, highKeys, highPotential] = options[i + 1];
    if (minutes >= lowMinutes && minutes < highMinutes) {
      const ratio = (minutes - lowMinutes) / (highMinutes - lowMinutes);
      return {
        keys: lowKeys + (highKeys - lowKeys) * ratio,
        potential: lowPotential + (highPotential - lowPotential) * ratio,
      };
    }
  }
  return { keys: 0, potential: 0 };
}

export function rewardForMetadata(
  techniqueId: TechniqueId,
  metadata: TechniqueMetadata,
): { keys: number; potential: number } {
  if (techniqueId === "T1") {
    const actualSeconds = numeric(metadata.actualSeconds);
    const estimatedSeconds = numeric(metadata.estimatedSeconds);
    if (actualSeconds <= 0 || estimatedSeconds <= 0 || actualSeconds < estimatedSeconds * 0.3) {
      return { keys: 0, potential: 0 };
    }
    const actualMinutes = Math.min(actualSeconds, estimatedSeconds) / 60;
    const deviation = Math.abs(actualSeconds - estimatedSeconds) / Math.max(actualSeconds, estimatedSeconds);
    const accuracy = Math.exp(-1.5 * deviation * deviation);
    const base = plannerBaseReward(actualMinutes);
    return {
      keys: Math.floor(base.keys * accuracy),
      potential: Math.round(base.potential * accuracy * 100) / 100,
    };
  }
  if (techniqueId === "T2") return { keys: 20, potential: 0.2 };
  if (techniqueId === "T3") {
    const values: Record<number, { keys: number; potential: number }> = {
      3: { keys: 5, potential: 0.05 },
      5: { keys: 10, potential: 0.1 },
      10: { keys: 20, potential: 0.15 },
      15: { keys: 30, potential: 0.2 },
      20: { keys: 40, potential: 0.25 },
    };
    return values[parseMinutes(metadata.durationLabel)] ?? { keys: 0, potential: 0 };
  }
  if (techniqueId === "T4") {
    const steps = numeric(metadata.steps);
    const milestones = [
      [2500, 10, 0.1], [5000, 20, 0.15], [7500, 30, 0.2], [10000, 40, 0.25],
      [12500, 50, 0.3], [15000, 60, 0.35], [20000, 80, 0.5],
    ] as const;
    let result = { keys: 0, potential: 0 };
    for (const [minimum, keys, potential] of milestones) {
      if (steps >= minimum) result = { keys, potential };
    }
    return result;
  }
  if (techniqueId === "T5") {
    const durationRewards: Record<number, { keys: number; potential: number }> = {
      30: { keys: 10, potential: 0.1 },
      60: { keys: 20, potential: 0.15 },
      120: { keys: 40, potential: 0.25 },
      180: { keys: 60, potential: 0.35 },
    };
    const base = durationRewards[parseMinutes(metadata.durationLabel)] ?? { keys: 0, potential: 0 };
    const challenge = metadata.challengeResult === "done"
      ? { keys: 0, potential: 0.2 }
      : metadata.challengeResult === "partial"
        ? { keys: 0, potential: 0.1 }
        : { keys: 0, potential: 0 };
    return { keys: base.keys, potential: base.potential + challenge.potential };
  }
  const sleepTime = String(metadata.sleepTime ?? "");
  let hour = Number(sleepTime.slice(0, 2));
  if (sleepTime.includes("T")) {
    const parsed = new Date(sleepTime);
    if (Number.isNaN(parsed.getTime())) return { keys: 0, potential: 0 };
    const offset = numeric(metadata.timezoneOffsetMinutes);
    const local = new Date(parsed.getTime() - (Number.isFinite(offset) ? offset : 0) * 60_000);
    hour = local.getUTCHours();
  }
  if (hour >= 21 && hour < 22) return { keys: 30, potential: 0.2 };
  if (hour === 22) return { keys: 20, potential: 0.1 };
  return { keys: 0, potential: 0 };
}

function previousDay(day: string): string {
  const date = new Date(`${day}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() - 1);
  return date.toISOString().slice(0, 10);
}

function resultFromRow(
  row: { id: number; keysAwarded: number; potentialAwarded: number },
  profile: { currentStreak: number; longestStreak: number; totalKeys: number; totalPotential: number } | null | undefined,
): CompletionResult {
  return {
    keys: row.keysAwarded,
    potential: row.potentialAwarded,
    completedTechniqueId: row.id,
    newStreak: profile?.currentStreak ?? 0,
    longestStreak: profile?.longestStreak ?? 0,
    totalKeys: profile?.totalKeys ?? 0,
    totalPotential: profile?.totalPotential ?? 0,
    alreadyCompleted: true,
  };
}

export async function recordTechniqueCompletion(
  userId: number,
  techniqueId: TechniqueId,
  metadata: TechniqueMetadata,
  timezoneOffsetMinutes: number,
  idempotencyKey: string,
): Promise<CompletionResult> {
  const completedAt = new Date();
  const day = appDayKey(completedAt, timezoneOffsetMinutes);

  return db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(${userId})`);

    const existingByKey = await tx.query.completedTechniquesTable.findFirst({
      where: and(
        eq(completedTechniquesTable.userId, userId),
        eq(completedTechniquesTable.idempotencyKey, idempotencyKey),
      ),
    });
    const currentProfile = await tx.query.userProfilesTable.findFirst({
      where: eq(userProfilesTable.userId, userId),
    });
    if (existingByKey) return resultFromRow(existingByKey, currentProfile);

    if (singleCompletionTechniques.has(techniqueId)) {
      const existingToday = await tx.query.completedTechniquesTable.findFirst({
        where: and(
          eq(completedTechniquesTable.userId, userId),
          eq(completedTechniquesTable.techniqueId, techniqueId),
          eq(completedTechniquesTable.appDay, day),
        ),
      });
      if (existingToday) return resultFromRow(existingToday, currentProfile);
    }

    const rawReward = rewardForMetadata(techniqueId, metadata);
    const dailyCap = dailyKeyCaps[techniqueId];
    let keys = Math.max(0, Math.floor(rawReward.keys));
    if (dailyCap !== undefined) {
      const [{ total }] = await tx
        .select({ total: sql<number>`coalesce(sum(${completedTechniquesTable.keysAwarded}), 0)` })
        .from(completedTechniquesTable)
        .where(and(
          eq(completedTechniquesTable.userId, userId),
          eq(completedTechniquesTable.techniqueId, techniqueId),
          eq(completedTechniquesTable.appDay, day),
        ));
      keys = Math.min(keys, Math.max(0, dailyCap - Number(total ?? 0)));
    }
    const potential = Math.max(0, rawReward.potential);
    const [inserted] = await tx.insert(completedTechniquesTable).values({
      userId,
      techniqueId,
      appDay: day,
      idempotencyKey,
      completedAt,
      keysAwarded: keys,
      potentialAwarded: potential,
      metadata,
    }).returning({ id: completedTechniquesTable.id, keysAwarded: completedTechniquesTable.keysAwarded, potentialAwarded: completedTechniquesTable.potentialAwarded });

    await tx.insert(keyTransactionsTable).values({
      userId,
      amount: keys,
      reason: `technique:${techniqueId}`,
      relatedEntityId: inserted.id,
    });
    await tx.insert(potentialTransactionsTable).values({
      userId,
      amount: potential,
      reason: `technique:${techniqueId}`,
      relatedEntityId: inserted.id,
    });

    const yesterday = previousDay(day);
    const yesterdayRow = await tx.query.streakHistoryTable.findFirst({
      where: and(eq(streakHistoryTable.userId, userId), eq(streakHistoryTable.date, yesterday)),
    });
    const alreadyToday = await tx.query.streakHistoryTable.findFirst({
      where: and(eq(streakHistoryTable.userId, userId), eq(streakHistoryTable.date, day)),
    });
    const current = alreadyToday?.streakCount
      ?? (yesterdayRow ? (currentProfile?.currentStreak ?? 0) + 1 : 1);
    const longest = Math.max(currentProfile?.longestStreak ?? 0, current);
    await tx.insert(streakHistoryTable).values({
      userId, date: day, status: "completed", streakCount: current,
    }).onConflictDoUpdate({
      target: [streakHistoryTable.userId, streakHistoryTable.date],
      set: { status: "completed", streakCount: current },
    });

    const totalKeys = (currentProfile?.totalKeys ?? 0) + keys;
    const totalPotential = Math.min(100, (currentProfile?.totalPotential ?? 0) + potential);
    const [profile] = await tx.insert(userProfilesTable).values({
      userId,
      totalKeys,
      totalPotential,
      currentStreak: current,
      longestStreak: longest,
    }).onConflictDoUpdate({
      target: userProfilesTable.userId,
      set: {
        totalKeys,
        totalPotential,
        currentStreak: current,
        longestStreak: longest,
        updatedAt: new Date(),
      },
    }).returning();

    return {
      keys,
      potential,
      completedTechniqueId: inserted.id,
      newStreak: current,
      longestStreak: longest,
      totalKeys: profile.totalKeys,
      totalPotential: profile.totalPotential,
    };
  });
}