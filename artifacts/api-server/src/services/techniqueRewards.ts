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
import {
  DAY_POTENTIAL_TARGET,
  TECHNIQUE_IDS,
  clampDayPotential,
  dayCloseReward,
  normalizeDayPotential,
  potentialForTechnique,
  type TechniqueId,
} from "@workspace/economy";

export type { TechniqueId };
export type TechniqueMetadata = Record<string, unknown>;

export interface CompletionResult {
  /** Ключи, начисленные этим действием. Только за закрытие дня. */
  keys: number;
  /** Потенциал, начисленный этим действием, в процентах. */
  potential: number;
  completedTechniqueId: number;
  newStreak: number;
  longestStreak: number;
  totalKeys: number;
  /** Потенциал дня после начисления, 0–100. */
  totalPotential: number;
  /** День закрыт этим действием. */
  dayClosed: boolean;
  /** Всего дней, закрытых на 100%. */
  closedDays: number;
  alreadyCompleted?: boolean;
}

const singleCompletionTechniques = new Set<TechniqueId>(["T1", "T6"]);

export function isTechniqueId(value: string): value is TechniqueId {
  return TECHNIQUE_IDS.includes(value as TechniqueId);
}

export function appDayKey(now: Date, timezoneOffsetMinutes: number): string {
  const local = new Date(now.getTime() - timezoneOffsetMinutes * 60_000);
  if (local.getUTCHours() < 5) local.setUTCDate(local.getUTCDate() - 1);
  return local.toISOString().slice(0, 10);
}

/**
 * Ключи за техники больше не начисляются. Они выдаются только при закрытии дня.
 */
export function rewardForMetadata(
  techniqueId: TechniqueId,
  metadata: TechniqueMetadata,
): { keys: number; potential: number } {
  return { keys: 0, potential: potentialForTechnique(techniqueId, metadata) };
}

function previousDay(day: string): string {
  const date = new Date(`${day}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() - 1);
  return date.toISOString().slice(0, 10);
}

interface ProfileSnapshot {
  currentStreak: number;
  longestStreak: number;
  totalKeys: number;
  dayPotential: number;
  dayPotentialDay: string | null;
  closedDays: number;
}

function dayPotentialFor(profile: ProfileSnapshot | null | undefined, day: string): number {
  if (!profile || profile.dayPotentialDay !== day) return 0;
  return normalizeDayPotential(profile.dayPotential);
}

function resultFromRow(
  row: { id: number; keysAwarded: number; potentialAwarded: number },
  profile: ProfileSnapshot | null | undefined,
  day: string,
): CompletionResult {
  const dayPotential = dayPotentialFor(profile, day);
  return {
    keys: row.keysAwarded,
    potential: row.potentialAwarded,
    completedTechniqueId: row.id,
    newStreak: profile?.currentStreak ?? 0,
    longestStreak: profile?.longestStreak ?? 0,
    totalKeys: profile?.totalKeys ?? 0,
    totalPotential: dayPotential,
    dayClosed: dayPotential >= DAY_POTENTIAL_TARGET,
    closedDays: profile?.closedDays ?? 0,
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
    if (existingByKey) return resultFromRow(existingByKey, currentProfile, day);

    if (singleCompletionTechniques.has(techniqueId)) {
      const existingToday = await tx.query.completedTechniquesTable.findFirst({
        where: and(
          eq(completedTechniquesTable.userId, userId),
          eq(completedTechniquesTable.techniqueId, techniqueId),
          eq(completedTechniquesTable.appDay, day),
        ),
      });
      if (existingToday) return resultFromRow(existingToday, currentProfile, day);
    }

    const potential = Math.max(0, potentialForTechnique(techniqueId, metadata));
    const potentialBefore = dayPotentialFor(currentProfile, day);
    const dayPotential = normalizeDayPotential(potentialBefore + potential);
    const closesDay =
      potentialBefore < DAY_POTENTIAL_TARGET && dayPotential >= DAY_POTENTIAL_TARGET;

    let streak = currentProfile?.currentStreak ?? 0;
    let closedDays = currentProfile?.closedDays ?? 0;
    let keys = 0;

    if (closesDay) {
      const yesterdayRow = await tx.query.streakHistoryTable.findFirst({
        where: and(
          eq(streakHistoryTable.userId, userId),
          eq(streakHistoryTable.date, previousDay(day)),
          eq(streakHistoryTable.status, "completed"),
        ),
      });
      streak = yesterdayRow ? (currentProfile?.currentStreak ?? 0) + 1 : 1;
      closedDays += 1;
      keys = dayCloseReward(streak);
    }

    const [inserted] = await tx
      .insert(completedTechniquesTable)
      .values({
        userId,
        techniqueId,
        appDay: day,
        idempotencyKey,
        completedAt,
        keysAwarded: keys,
        potentialAwarded: potential,
        metadata,
      })
      .returning({
        id: completedTechniquesTable.id,
        keysAwarded: completedTechniquesTable.keysAwarded,
        potentialAwarded: completedTechniquesTable.potentialAwarded,
      });

    await tx.insert(potentialTransactionsTable).values({
      userId,
      amount: potential,
      reason: `technique:${techniqueId}`,
      relatedEntityId: inserted!.id,
    });

    if (closesDay) {
      await tx.insert(keyTransactionsTable).values({
        userId,
        amount: keys,
        reason: `day-close:${day}`,
        relatedEntityId: inserted!.id,
      });
      await tx
        .insert(streakHistoryTable)
        .values({ userId, date: day, status: "completed", streakCount: streak })
        .onConflictDoUpdate({
          target: [streakHistoryTable.userId, streakHistoryTable.date],
          set: { status: "completed", streakCount: streak },
        });
    }

    const longest = Math.max(currentProfile?.longestStreak ?? 0, streak);
    const totalKeys = (currentProfile?.totalKeys ?? 0) + keys;
    const [profile] = await tx
      .insert(userProfilesTable)
      .values({
        userId,
        totalKeys,
        // Preserve the legacy field but make the new day field authoritative.
        totalPotential: currentProfile?.totalPotential ?? 0,
        dayPotential,
        dayPotentialDay: day,
        closedDays,
        currentStreak: streak,
        longestStreak: longest,
      })
      .onConflictDoUpdate({
        target: userProfilesTable.userId,
        set: {
          totalKeys,
          dayPotential,
          dayPotentialDay: day,
          closedDays,
          currentStreak: streak,
          longestStreak: longest,
          updatedAt: new Date(),
        },
      })
      .returning();

    return {
      keys,
      potential,
      completedTechniqueId: inserted!.id,
      newStreak: profile!.currentStreak,
      longestStreak: profile!.longestStreak,
      totalKeys: profile!.totalKeys,
      totalPotential: profile!.dayPotential,
      dayClosed: closesDay,
      closedDays: profile!.closedDays,
    };
  });
}