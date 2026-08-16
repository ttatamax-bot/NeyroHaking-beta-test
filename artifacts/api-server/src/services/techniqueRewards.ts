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
  dayCloseReward,
  isDayClosed,
  normalizeDayPotential,
  potentialForTechnique,
  type TechniqueId as EconomyTechniqueId,
} from "../../../../lib/economy/src/index.js";

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
  dayClosed: boolean;
  closedDays: number;
  alreadyCompleted?: boolean;
}

const techniqueIds: TechniqueId[] = ["T1", "T2", "T3", "T4", "T5", "T6"];

/** T1 (Planner) and T6 (Sleep) can be completed only once per app-day. */
const singleCompletionTechniques = new Set<TechniqueId>(["T1", "T6"]);

export function isTechniqueId(value: string): value is TechniqueId {
  return techniqueIds.includes(value as TechniqueId);
}

/**
 * Returns the YYYY-MM-DD app-day key.
 * The day starts at 05:00 local time; anything before 05:00 belongs to
 * the previous calendar day.
 */
export function appDayKey(now: Date, timezoneOffsetMinutes: number): string {
  // Convert to "local" UTC by subtracting the offset (offset is + east, - west).
  const local = new Date(now.getTime() - timezoneOffsetMinutes * 60_000);
  if (local.getUTCHours() < 5) local.setUTCDate(local.getUTCDate() - 1);
  return local.toISOString().slice(0, 10);
}

function previousDay(day: string): string {
  const date = new Date(`${day}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() - 1);
  return date.toISOString().slice(0, 10);
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
    // Serialize all writes for this user inside the transaction.
    await tx.execute(sql`select pg_advisory_xact_lock(${userId})`);

    // ── 1. Idempotency: return the same result for a duplicate request ──────
    const existingByKey = await tx.query.completedTechniquesTable.findFirst({
      where: and(
        eq(completedTechniquesTable.userId, userId),
        eq(completedTechniquesTable.idempotencyKey, idempotencyKey),
      ),
    });
    const currentProfile = await tx.query.userProfilesTable.findFirst({
      where: eq(userProfilesTable.userId, userId),
    });
    if (existingByKey) {
      return {
        keys: existingByKey.keysAwarded,
        potential: existingByKey.potentialAwarded,
        completedTechniqueId: existingByKey.id,
        newStreak: currentProfile?.currentStreak ?? 0,
        longestStreak: currentProfile?.longestStreak ?? 0,
        totalKeys: currentProfile?.totalKeys ?? 0,
        totalPotential: currentProfile?.dayPotential ?? 0,
        dayClosed: false,
        closedDays: currentProfile?.closedDays ?? 0,
        alreadyCompleted: true,
      };
    }

    // ── 2. Single-completion guard (T1, T6 once per day) ────────────────────
    if (singleCompletionTechniques.has(techniqueId)) {
      const existingToday = await tx.query.completedTechniquesTable.findFirst({
        where: and(
          eq(completedTechniquesTable.userId, userId),
          eq(completedTechniquesTable.techniqueId, techniqueId),
          eq(completedTechniquesTable.appDay, day),
        ),
      });
      if (existingToday) {
        return {
          keys: 0,
          potential: 0,
          completedTechniqueId: existingToday.id,
          newStreak: currentProfile?.currentStreak ?? 0,
          longestStreak: currentProfile?.longestStreak ?? 0,
          totalKeys: currentProfile?.totalKeys ?? 0,
          totalPotential: currentProfile?.dayPotential ?? 0,
          dayClosed: false,
          closedDays: currentProfile?.closedDays ?? 0,
          alreadyCompleted: true,
        };
      }
    }

    // ── 3. Calculate potential this technique earns ──────────────────────────
    const rawPotential = potentialForTechnique(techniqueId as EconomyTechniqueId, metadata);
    const potential = normalizeDayPotential(rawPotential);

    // ── 4. Day-potential bookkeeping ─────────────────────────────────────────
    // Reset to 0 if the stored day key is from a previous day.
    const profileDay = currentProfile?.dayPotentialDay ?? null;
    const dayPotentialBefore = profileDay === day
      ? normalizeDayPotential(currentProfile?.dayPotential ?? 0)
      : 0;
    const dayPotentialAfter = normalizeDayPotential(dayPotentialBefore + potential);

    // Day closes the FIRST time potential crosses 100 % on this day.
    const wasAlreadyClosed = isDayClosed(dayPotentialBefore);
    const isNowClosed = isDayClosed(dayPotentialAfter);
    const dayClosed = isNowClosed && !wasAlreadyClosed;

    // ── 5. Streak (tracked per app-day regardless of day closing) ────────────
    const yesterday = previousDay(day);
    const yesterdayRow = await tx.query.streakHistoryTable.findFirst({
      where: and(eq(streakHistoryTable.userId, userId), eq(streakHistoryTable.date, yesterday)),
    });
    const alreadyToday = await tx.query.streakHistoryTable.findFirst({
      where: and(eq(streakHistoryTable.userId, userId), eq(streakHistoryTable.date, day)),
    });
    // Streak day count: continue from yesterday, or start fresh.
    const currentStreak = alreadyToday?.streakCount
      ?? (yesterdayRow ? (currentProfile?.currentStreak ?? 0) + 1 : 1);
    const longestStreak = Math.max(currentProfile?.longestStreak ?? 0, currentStreak);

    // ── 6. Keys – awarded only on day close, based on current streak ─────────
    const keys = dayClosed ? dayCloseReward(currentStreak) : 0;

    // ── 7. Persist the completion row ────────────────────────────────────────
    const [inserted] = await tx.insert(completedTechniquesTable).values({
      userId,
      techniqueId,
      appDay: day,
      idempotencyKey,
      completedAt,
      keysAwarded: keys,
      potentialAwarded: potential,
      metadata,
    }).returning({
      id: completedTechniquesTable.id,
      keysAwarded: completedTechniquesTable.keysAwarded,
      potentialAwarded: completedTechniquesTable.potentialAwarded,
    });

    // ── 8. Ledger entries ────────────────────────────────────────────────────
    if (keys > 0) {
      await tx.insert(keyTransactionsTable).values({
        userId,
        amount: keys,
        reason: `day_close:${day}`,
        relatedEntityId: inserted.id,
      });
    }
    if (potential > 0) {
      await tx.insert(potentialTransactionsTable).values({
        userId,
        amount: potential,
        reason: `technique:${techniqueId}`,
        relatedEntityId: inserted.id,
      });
    }

    // ── 9. Streak history row ────────────────────────────────────────────────
    await tx.insert(streakHistoryTable).values({
      userId,
      date: day,
      status: "completed",
      streakCount: currentStreak,
    }).onConflictDoUpdate({
      target: [streakHistoryTable.userId, streakHistoryTable.date],
      set: { status: "completed", streakCount: currentStreak },
    });

    // ── 10. Update profile ───────────────────────────────────────────────────
    const totalKeys = (currentProfile?.totalKeys ?? 0) + keys;
    const closedDays = (currentProfile?.closedDays ?? 0) + (dayClosed ? 1 : 0);

    const [profile] = await tx.insert(userProfilesTable).values({
      userId,
      totalKeys,
      // totalPotential mirrors dayPotential for frontend compatibility
      totalPotential: dayPotentialAfter,
      dayPotential: dayPotentialAfter,
      dayPotentialDay: day,
      closedDays,
      currentStreak,
      longestStreak,
    }).onConflictDoUpdate({
      target: userProfilesTable.userId,
      set: {
        totalKeys,
        totalPotential: dayPotentialAfter,
        dayPotential: dayPotentialAfter,
        dayPotentialDay: day,
        closedDays,
        currentStreak,
        longestStreak,
        updatedAt: new Date(),
      },
    }).returning();

    return {
      keys,
      potential,
      completedTechniqueId: inserted.id,
      newStreak: currentStreak,
      longestStreak,
      totalKeys: profile.totalKeys,
      totalPotential: profile.dayPotential,
      dayClosed,
      closedDays: profile.closedDays,
    };
  });
}
