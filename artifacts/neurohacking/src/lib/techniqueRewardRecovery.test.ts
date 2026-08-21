import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import {
  db,
  completedTechniquesTable,
  eq,
  potentialTransactionsTable,
  userProfilesTable,
  userStatesTable,
  usersTable,
} from "../../../../lib/db/src/index.js";
import {
  appDayKey,
  recordTechniqueCompletion,
  type TechniqueId,
} from "../../../api-server/src/services/techniqueRewards.js";
import {
  applyServerCompletion,
  applyServerCompletions,
  defaultState,
  findRecoveredCompletion,
  type AppState,
} from "./store.tsx";

type RewardRun = {
  label: string;
  techniqueId: TechniqueId;
  mode: "reverse" | "signals";
  stateKey: "memory" | "concentration";
};

const rewardRuns: RewardRun[] = [
  { label: "Memory / T7", techniqueId: "T7", mode: "reverse", stateKey: "memory" },
  { label: "Concentration / T8", techniqueId: "T8", mode: "signals", stateKey: "concentration" },
];

function completionMetadata(run: RewardRun, level: number): Record<string, unknown> {
  return run.techniqueId === "T7"
    ? { mode: run.mode, level }
    : {
        mode: run.mode,
        level,
        bestReactionMs: 240,
        averageReactionMs: 310,
        stabilityPercent: 100,
      };
}

async function runRewardRecoveryScenario(run: RewardRun): Promise<void> {
  const clerkId = `technique-recovery-test:${randomUUID()}`;
  const [user] = await db.insert(usersTable).values({ clerkId }).returning();
  assert.ok(user, `${run.label}: temporary user should be created`);

  try {
    await db.insert(userStatesTable).values({
      userId: user.id,
      state: {
        [run.stateKey]: {
          purchasedModes: [run.mode],
          bestLevels: {},
          rewardDay: null,
        },
      },
    });

    const timezoneOffsetMinutes = 0;
    const appDay = appDayKey(new Date(), timezoneOffsetMinutes);
    const levelKeys = new Map<number, string>();
    let levelFiveReceipt: Awaited<ReturnType<typeof recordTechniqueCompletion>> | null = null;
    for (let level = 1; level <= 5; level += 1) {
      const key = `${run.techniqueId}:recovery:${randomUUID()}`;
      levelKeys.set(level, key);
      const result = await recordTechniqueCompletion(
        user.id,
        run.techniqueId,
        completionMetadata(run, level),
        timezoneOffsetMinutes,
        key,
      );
      assert.equal(result.potential, level === 5 ? 10 : 0, `${run.label}: only level five awards +10%`);
      assert.equal(result.totalPotential, level === 5 ? 10 : 0, `${run.label}: run 1→5 has the expected balance`);
      if (level === 5) levelFiveReceipt = result;
    }
    assert.ok(levelFiveReceipt, `${run.label}: level-five receipt should exist`);

    const levelFiveKey = levelKeys.get(5)!;
    const retryWithSameKey = await recordTechniqueCompletion(
      user.id,
      run.techniqueId,
      completionMetadata(run, 5),
      timezoneOffsetMinutes,
      levelFiveKey,
    );
    assert.equal(retryWithSameKey.alreadyCompleted, true, `${run.label}: identical retry is idempotent`);
    assert.equal(retryWithSameKey.potential, 10, `${run.label}: identical retry returns the original receipt`);
    assert.equal(retryWithSameKey.totalPotential, 10, `${run.label}: identical retry does not add potential`);

    const localOnce = {
      ...defaultState,
      memory: run.stateKey === "memory"
        ? { ...defaultState.memory, purchasedModes: ["reverse"] }
        : defaultState.memory,
      concentration: run.stateKey === "concentration"
        ? { ...defaultState.concentration, purchasedModes: ["signals"] }
        : defaultState.concentration,
    } as AppState;
    const localAfterFirstReceipt = {
      ...localOnce,
      ...applyServerCompletion(localOnce, run.techniqueId, levelFiveReceipt, completionMetadata(run, 5)),
    } as AppState;
    const localAfterDuplicateReceipt = {
      ...localAfterFirstReceipt,
      ...applyServerCompletion(
        localAfterFirstReceipt,
        run.techniqueId,
        retryWithSameKey,
        completionMetadata(run, 5),
      ),
    } as AppState;
    assert.equal(localAfterDuplicateReceipt.potential, 10, `${run.label}: replayed receipt preserves the local balance`);
    assert.equal(localAfterDuplicateReceipt.potentialHistory.length, 1, `${run.label}: replayed receipt does not duplicate local potential history`);
    assert.equal(localAfterDuplicateReceipt.activityLog.length, 1, `${run.label}: replayed receipt does not duplicate local activity`);

    const retryWithNewKey = await recordTechniqueCompletion(
      user.id,
      run.techniqueId,
      completionMetadata(run, 5),
      timezoneOffsetMinutes,
      `${run.techniqueId}:recovery:new:${randomUUID()}`,
    );
    assert.equal(retryWithNewKey.potential, 0, `${run.label}: new key after a lost response earns no second +10%`);
    assert.equal(retryWithNewKey.totalPotential, 10, `${run.label}: new key preserves the one awarded balance`);

    const [profile] = await db.select().from(userProfilesTable)
      .where(eq(userProfilesTable.userId, user.id));
    assert.equal(profile?.dayPotential, 10, `${run.label}: persisted balance is exactly +10%`);

    const potentialRows = await db.select().from(potentialTransactionsTable)
      .where(eq(potentialTransactionsTable.userId, user.id));
    assert.equal(potentialRows.length, 1, `${run.label}: ledger contains one potential transaction`);
    assert.equal(potentialRows[0]?.amount, 10, `${run.label}: ledger transaction is +10%`);

    const completionRows = await db.select({
      id: completedTechniquesTable.id,
      techniqueId: completedTechniquesTable.techniqueId,
      appDay: completedTechniquesTable.appDay,
      completedAt: completedTechniquesTable.completedAt,
      keysAwarded: completedTechniquesTable.keysAwarded,
      potentialAwarded: completedTechniquesTable.potentialAwarded,
      metadata: completedTechniquesTable.metadata,
    }).from(completedTechniquesTable)
      .where(eq(completedTechniquesTable.userId, user.id));
    const serializedCompletions = completionRows.map((row) => ({
      ...row,
      completedAt: row.completedAt.toISOString(),
      metadata: row.metadata as Record<string, unknown>,
    }));

    const levelFive = findRecoveredCompletion(
      serializedCompletions,
      run.techniqueId,
      completionMetadata(run, 5),
      new Date(),
    );
    assert.ok(levelFive, `${run.label}: hydration can find the committed level five completion`);

    const rehydrated = applyServerCompletions(
      { ...defaultState } as AppState,
      serializedCompletions,
    );
    const techniqueState = run.stateKey === "memory" ? rehydrated.memory : rehydrated.concentration;
    assert.equal(techniqueState.bestLevels[run.mode], 5, `${run.label}: hydration restores five completed divisions`);
    assert.equal(techniqueState.rewardDay, appDay, `${run.label}: hydration restores rewardDay`);

    console.log(`✓ ${run.label}: lost response recovery keeps exactly one +10% reward`);
  } finally {
    // All dependent rows use ON DELETE CASCADE, so the development database is
    // left exactly as it was before this isolated integration scenario.
    await db.delete(usersTable).where(eq(usersTable.id, user.id));
  }
}

console.log("Running level-five reward recovery assertions…\n");
for (const run of rewardRuns) {
  await runRewardRecoveryScenario(run);
}
console.log("\nAll level-five reward recovery assertions passed.");