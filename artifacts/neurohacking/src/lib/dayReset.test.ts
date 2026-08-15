import assert from 'node:assert';
import {
  defaultState,
  AppState,
  computeStreakUpdate,
  getTodayKeysFromSource,
  getAppDayStart,
  getAppDayKey,
} from './store.tsx';

function makeDate(iso: string): Date {
  // ISO 8601 without timezone is parsed as local time, matching the app's local-time logic.
  return new Date(iso);
}

function applyUpdates(state: AppState, updates: Partial<AppState>): AppState {
  return { ...state, ...updates } as AppState;
}

// Mirrors the AppProvider useState initializer logic for day reset.
function simulateAppProviderInitialLoad(savedState: Partial<AppState>, now: Date): AppState {
  const todayKey = getAppDayKey(now);
  const merged = { ...defaultState, ...savedState } as AppState;
  const savedDate = merged.todayTechniquesDate ? getAppDayKey(new Date(merged.todayTechniquesDate)) : null;

  if (savedDate !== todayKey) {
    return {
      ...merged,
      userState: merged.userState === 'dayDone' ? 'active' : merged.userState,
      todayTechniques: { T1: false, T2: false, T3: false, T4: false, T5: false, T6: false },
      todayTechniquesDate: getAppDayStart(now).toISOString(),
    };
  }
  return merged;
}

// Mirrors the AppLogic day reset check.
function simulateAppLogicCheck(currentState: AppState, now: Date): Partial<AppState> | null {
  const todayKey = getAppDayKey(now);
  const lastTechDate = currentState.todayTechniquesDate
    ? getAppDayKey(new Date(currentState.todayTechniquesDate))
    : null;

  if (!lastTechDate || lastTechDate !== todayKey) {
    const streakUpdates: Partial<AppState> = {};
    if (currentState.lastCompletedDate) {
      const todayStart = getAppDayStart(now);
      const yesterdayStart = new Date(todayStart);
      yesterdayStart.setDate(yesterdayStart.getDate() - 1);
      const lastCompleted = getAppDayStart(new Date(currentState.lastCompletedDate));
      if (lastCompleted.getTime() < yesterdayStart.getTime()) {
        streakUpdates.streak = 0;
      }
    }
    return {
      userState: currentState.userState === 'dayDone' ? 'active' : currentState.userState,
      todayTechniques: { T1: false, T2: false, T3: false, T4: false, T5: false, T6: false },
      todayTechniquesDate: getAppDayStart(now).toISOString(),
      ...streakUpdates,
    };
  }
  return null;
}

// Mirrors the sleep.tsx handleConfirm reducer.
function simulateSleepConfirm(currentState: AppState, now: Date): Partial<AppState> {
  const streakUpdate = computeStreakUpdate(currentState, now);
  const newStreak = (streakUpdate.streak as number | undefined) ?? currentState.streak;
  return {
    todayTechniques: { ...currentState.todayTechniques, T6: true },
    userState: 'dayDone' as const,
    lastCompletedDate: now.toISOString(),
    streak: newStreak,
    streakHistory: streakUpdate.streakHistory ?? currentState.streakHistory,
  };
}

console.log('Running 5 AM day-boundary assertions...\n');

const sleepTime = makeDate('2026-07-18T23:00:00');
const nextDay04 = makeDate('2026-07-19T04:00:00');
const nextDay05 = makeDate('2026-07-19T05:00:00');
const nextDay23 = makeDate('2026-07-19T23:00:00');

// 1. Before 5:00 on the next calendar day the app is still locked (same app day).
let saved: Partial<AppState> = {
  userState: 'dayDone',
  todayTechniques: { T1: true, T2: true, T3: true, T4: true, T5: true, T6: true },
  todayTechniquesDate: sleepTime.toISOString(),
  lastCompletedDate: sleepTime.toISOString(),
  streak: 5,
};
let loaded = simulateAppProviderInitialLoad(saved, nextDay04);
assert.strictEqual(loaded.userState, 'dayDone', '04:00 next calendar day: should still be locked (same app day)');
assert.strictEqual(loaded.todayTechniques.T6, true, '04:00 next calendar day: T6 should remain done');
assert.strictEqual(loaded.streak, 5, '04:00 next calendar day: streak should not change');
console.log('✓ 04:00 next calendar day still locked (same app day as sleep)');

// 2. At 5:00 on the next calendar day the app unlocks and techniques reset.
loaded = simulateAppProviderInitialLoad(saved, nextDay05);
assert.strictEqual(loaded.userState, 'active', '05:00 next calendar day: should unlock');
assert.strictEqual(loaded.todayTechniques.T6, false, '05:00 next calendar day: T6 should be reset');
assert.strictEqual(loaded.streak, 5, '05:00 next calendar day: streak should not be reset if previous day was completed');
console.log('✓ 05:00 next calendar day unlocks app and resets techniques');

// 3. Same day after sleep stays locked.
loaded = simulateAppProviderInitialLoad(saved, makeDate('2026-07-18T23:30:00'));
assert.strictEqual(loaded.userState, 'dayDone', 'same day after sleep: should stay locked');
assert.strictEqual(loaded.todayTechniques.T6, true, 'same day after sleep: T6 should stay done');
console.log('✓ same-day dayDone is preserved');

// 4. AppLogic interval check on a new app day resets the day.
let state: AppState = { ...defaultState, todayTechniquesDate: sleepTime.toISOString(), userState: 'dayDone' } as AppState;
const updates = simulateAppLogicCheck(state, nextDay05);
assert.ok(updates, 'AppLogic: new app day should trigger reset');
assert.strictEqual(updates!.userState, 'active', 'AppLogic: should unlock');
assert.strictEqual(updates!.todayTechniques!.T6, false, 'AppLogic: T6 should be reset');
console.log('✓ AppLogic interval check resets at 5:00');

// 5. AppLogic on the same app day does nothing.
const noUpdates = simulateAppLogicCheck(state, nextDay04);
assert.strictEqual(noUpdates, null, 'AppLogic: same app day should not trigger reset');
console.log('✓ AppLogic does nothing on same app day');

// 6. Full lifecycle: sleep -> 5:00 next day -> unlock.
state = defaultState;
state = applyUpdates(state, simulateSleepConfirm(state, sleepTime));
assert.strictEqual(state.userState, 'dayDone', 'sleep: userState should become dayDone');
assert.strictEqual(state.todayTechniques.T6, true, 'sleep: T6 should be done');
state = simulateAppProviderInitialLoad({ ...state, todayTechniquesDate: sleepTime.toISOString() }, nextDay05);
assert.strictEqual(state.userState, 'active', 'next day 5:00: userState should be active after sleep');
assert.strictEqual(state.todayTechniques.T6, false, 'next day 5:00: T6 should be reset');
console.log('✓ full lifecycle: sleep -> 5:00 next day resets correctly');

// 7. Consecutive days increase streak.
state = defaultState;
state = applyUpdates(state, simulateSleepConfirm(state, sleepTime));
assert.strictEqual(state.streak, 1, 'first sleep: streak starts at 1');
state = simulateAppProviderInitialLoad({ ...state, todayTechniquesDate: sleepTime.toISOString() }, nextDay05);
state = applyUpdates(state, simulateSleepConfirm(state, nextDay23));
assert.strictEqual(state.streak, 2, 'second consecutive sleep: streak should be 2');
console.log('✓ consecutive days increase streak');

// 8. Missing a day resets streak to 0 (AppLogic path).
state = {
  ...defaultState,
  userState: 'dayDone',
  todayTechniquesDate: makeDate('2026-07-16T23:00:00').toISOString(),
  lastCompletedDate: makeDate('2026-07-16T23:00:00').toISOString(),
  streak: 7,
} as AppState;
const missedUpdates = simulateAppLogicCheck(state, nextDay05);
assert.strictEqual(missedUpdates!.streak, 0, 'missed day: streak should be reset to 0');
console.log('✓ missed day resets streak');

// 9. Daily key cap uses the 5:00 app day boundary.
const keyHistory = [
  { date: sleepTime.toISOString(), source: 'Техника: Сон', amount: 30, type: 'earn' as const },
];
// At 04:00 next calendar day the sleep entry is still part of the current app day.
const before5Keys = getTodayKeysFromSource(keyHistory, 'Техника: Сон', nextDay04);
assert.strictEqual(before5Keys, 30, 'keys cap: before 5:00 next calendar day still counts as same app day');
// At 05:00 the entry belongs to the previous app day and should not count.
const after5Keys = getTodayKeysFromSource(keyHistory, 'Техника: Сон', nextDay05);
assert.strictEqual(after5Keys, 0, 'keys cap: after 5:00 the previous app day entry does not count');
console.log('✓ daily key cap uses 5:00 app day boundary');

// 10. Direct helper sanity checks.
assert.strictEqual(getAppDayKey(makeDate('2026-07-19T04:59:59')), getAppDayKey(sleepTime), '04:59 belongs to previous app day');
assert.strictEqual(getAppDayKey(makeDate('2026-07-19T05:00:00')), getAppDayKey(nextDay05), '05:00 belongs to current app day');
console.log('✓ getAppDayKey boundary is correct');

console.log('\nAll 5 AM day-boundary assertions passed.');
