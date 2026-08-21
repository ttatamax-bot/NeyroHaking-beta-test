import { useContext, useEffect, useRef, useState, useCallback } from 'react';
import { useAuth, useUser } from '@clerk/react';
import {
  getServerState,
  saveServerState,
  migrateLegacyState,
  completeTechnique as apiCompleteTechnique,
  purchaseMemoryMode as apiPurchaseMemoryMode,
  purchaseConcentrationMode as apiPurchaseConcentrationMode,
  setApiAuthTokenProvider,
  ApiError,
  type CompleteTechniqueResult,
  type ServerCompletion,
  type ServerProfile,
} from './api';
import { AppContext } from './app-context';
import {
  DAY_POTENTIAL_TARGET,
  clampDayPotential,
  dayCloseReward,
  normalizeDayPotential,
  potentialForTechnique,
  type TechniqueId,
} from '@workspace/economy';

export type UserState = 'new' | 'onboarding' | 'active' | 'dayDone';

export interface Goal {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  status: 'active' | 'completed' | 'cancelled';
  completedAt?: string;
}

export interface Scene {
  id: string;
  goalId: string;
  answers: string[];
  createdAt: string;
  status: 'active' | 'completed' | 'hidden';
}

export interface DayRecord {
  date: string;
  potential: number;
  keys: number;
  streak: number;
  techniques: { T1: boolean; T2: boolean; T3: boolean; T4: boolean; T5: boolean; T6: boolean; };
}

export interface ActivityEntry {
  id: string;
  date: string;
    type: 'planner' | 'visualization' | 'meditation' | 'walk' | 'hobby' | 'sleep' | 'memory' | 'concentration' | 'article';
  keysGained: number;
  potentialGained: number;
  details: {
    taskText?: string;
    durationMin?: number;
    durationLabel?: string;
    goalName?: string;
    goalId?: string;
    answers?: string[];
    steps?: number;
    hobbyName?: string;
    sleepTime?: string;
    articleTitle?: string;
    hobbyChallenge?: string;
    challengeResult?: 'done' | 'partial' | 'none';
      mode?: 'reverse' | 'matrix' | 'symbols' | 'signals' | 'tracking' | 'search';
     level?: number;
      bestReactionMs?: number;
      averageReactionMs?: number;
      stabilityPercent?: number;
  };
}

export interface ResourceEntry {
  date: string;
  source: string;
  amount: number;
}

export interface KeyEntry {
  date: string;
  source: string;
  amount: number;
  type: 'earn' | 'spend';
}

export interface PurchaseEntry {
  id: string;
  type: 'consultation' | 'mentoring';
  method: 'keys' | 'rub';
  amount: number;
  date: string;
}

export interface StreakEntry {
  date: string;
  value: number;
}

export interface PlannerTask {
  id: string;
  goalId: string;
  text: string;
  durationMin: number;
  completed: boolean;
  createdAt: string;
}

export type MemoryMode = 'reverse' | 'matrix' | 'symbols';
export type ConcentrationMode = 'signals' | 'tracking' | 'search';

export interface MemoryState {
  purchasedModes: MemoryMode[];
  bestLevels: Partial<Record<MemoryMode, number>>;
  rewardDay: string | null;
  onboardingSeen: MemoryMode[];
}

export interface ConcentrationState {
  purchasedModes: ConcentrationMode[];
  bestLevels: Partial<Record<ConcentrationMode, number>>;
  rewardDay: string | null;
  onboardingSeen: ConcentrationMode[];
}

export interface AppState {
  userState: UserState;
  onboardingStep: number;
  onboardingHighlight: string[];
  email: string | null;
  onboardingComplete: boolean;
  potential: number;
  closedDays: number;
  keys: number;
  streak: number;
  todayTechniques: {
    T1: boolean; T2: boolean; T3: boolean; T4: boolean; T5: boolean; T6: boolean;
  };
  lastCompletedDate: string | null;
  lastSessionDate: string | null;
  todayTechniquesDate: string | null;
  goals: Goal[];
  scenes: Scene[];
  history: DayRecord[];
  activityLog: ActivityEntry[];
  potentialHistory: ResourceEntry[];
  keysHistory: KeyEntry[];
  streakHistory: StreakEntry[];
  unlockedArticles: string[];
  readArticles: string[];
  readNews: string[];
  plannerTasks: PlannerTask[];
  hobbyName: string;
  hobbyList: string[];
  hobbyChallenges: Record<string, string>;
  notificationsEnabled: boolean;
  techniqueReminderTime: string;
  articleNotificationsEnabled: boolean;
  newsNotificationsEnabled: boolean;
  techniquesSeen: string[];
  purchaseHistory: PurchaseEntry[];
  firstGoalBonusGiven: boolean;
  attentionRemindersEnabled: boolean;
  attentionReminderInterval: number;
  goalFormOpen: boolean;
  memoryHubOnboardingSeen: boolean;
  coachingShown: string[];
  timerWarningShown: boolean;
  walkWarningShown: boolean;
  memoryOnboardingSeen: MemoryMode[];
  memory: MemoryState;
  concentrationHubOnboardingSeen: boolean;
  concentration: ConcentrationState;
  profile?: ServerProfile | null;
}

export const defaultState: AppState = {
  userState: 'new',
  onboardingStep: 0,
  onboardingHighlight: [],
  email: null,
  onboardingComplete: false,
  potential: 0,
  closedDays: 0,
  keys: 0,
  streak: 0,
  todayTechniques: {
    T1: false, T2: false, T3: false, T4: false, T5: false, T6: false,
  },
  lastCompletedDate: null,
  lastSessionDate: null,
  todayTechniquesDate: null,
  goals: [],
  scenes: [],
  history: [],
  activityLog: [],
  potentialHistory: [],
  keysHistory: [],
  streakHistory: [],
  unlockedArticles: ['A1'],
  readArticles: [],
  readNews: [],
  plannerTasks: [],
  hobbyName: '',
  hobbyList: [],
  hobbyChallenges: {},
  notificationsEnabled: true,
  techniqueReminderTime: '20:00',
  articleNotificationsEnabled: true,
  newsNotificationsEnabled: true,
  techniquesSeen: [],
  purchaseHistory: [],
  firstGoalBonusGiven: false,
  attentionRemindersEnabled: true,
  attentionReminderInterval: 120,
  goalFormOpen: false,
  memoryHubOnboardingSeen: false,
  coachingShown: [],
  timerWarningShown: false,
  walkWarningShown: false,
  memoryOnboardingSeen: [],
  memory: {
    purchasedModes: [],
    bestLevels: {},
    rewardDay: null,
    onboardingSeen: [],
  },
  concentrationHubOnboardingSeen: false,
  concentration: {
    purchasedModes: [],
    bestLevels: {},
    rewardDay: null,
    onboardingSeen: [],
  },
  profile: null,
};

function hasMeaningfulSyncState(state: Partial<AppState> | Record<string, unknown> | null): boolean {
  if (!state) return false;
  return (
    Number(state.keys ?? 0) > 0 ||
    Number(state.potential ?? 0) > 0 ||
    Number(state.closedDays ?? 0) > 0 ||
    Number(state.streak ?? 0) > 0 ||
    Boolean(state.lastCompletedDate) ||
    Boolean(state.lastSessionDate) ||
    state.userState === 'active' ||
    state.userState === 'dayDone' ||
    state.onboardingComplete === true ||
    (Array.isArray(state.activityLog) && state.activityLog.length > 0) ||
    (Array.isArray(state.history) && state.history.length > 0) ||
    (Array.isArray(state.goals) && state.goals.length > 0) ||
    (Array.isArray(state.scenes) && state.scenes.length > 0) ||
    (Array.isArray(state.keysHistory) && state.keysHistory.length > 0) ||
    (Array.isArray(state.potentialHistory) && state.potentialHistory.length > 0) ||
    (Array.isArray(state.streakHistory) && state.streakHistory.length > 0) ||
    (Array.isArray(state.unlockedArticles) &&
      state.unlockedArticles.some((article) => article !== 'A1')) ||
    (Array.isArray(state.readArticles) && state.readArticles.length > 0) ||
    (Array.isArray(state.readNews) && state.readNews.length > 0) ||
    (Array.isArray(state.plannerTasks) && state.plannerTasks.length > 0) ||
    (Array.isArray(state.purchaseHistory) && state.purchaseHistory.length > 0)
  );
}

type UpdateFn = Partial<AppState> | ((prev: AppState) => Partial<AppState>);

export const TECHNIQUE_SOURCES: Record<string, string> = {
  T1: 'Техника: Планер',
  T2: 'Техника: Визуализация',
  T3: 'Техника: Медитация',
  T4: 'Техника: Прогулка',
  T5: 'Техника: Хобби',
  T6: 'Техника: Сон',
  T7: 'Техника: Память',
  T8: 'Техника: Концентрация',
};

// The app day starts at 05:00 local time. Sleeping before 23:00 locks the app
// until the next 05:00, so the "today" boundary must be 05:00, not midnight.
export function getAppDayStart(date: Date = new Date()): Date {
  const d = new Date(date);
  if (d.getHours() < 5) {
    d.setDate(d.getDate() - 1);
  }
  d.setHours(5, 0, 0, 0);
  return d;
}

export function getAppDayKey(date: Date = new Date()): string {
  return getAppDayStart(date).toDateString();
}

function getServerAppDayKey(date: Date = new Date()): string {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  if (local.getUTCHours() < 5) local.setUTCDate(local.getUTCDate() - 1);
  return local.toISOString().slice(0, 10);
}

/** Потенциал дня из серверного профиля; на новом дне он равен нулю. */
export function profileDayPotential(profile: ServerProfile | null | undefined, now: Date = new Date()): number {
  if (!profile) return 0;
  if (typeof profile.dayPotentialDay !== 'string') {
    return clampDayPotential(profile.totalPotential);
  }
  if (profile.dayPotentialDay !== getServerAppDayKey(now)) return 0;
  return clampDayPotential(profile.dayPotential ?? 0);
}

function sameStateValue(left: unknown, right: unknown): boolean {
  if (Object.is(left, right)) return true;
  try {
    return JSON.stringify(left) === JSON.stringify(right);
  } catch {
    return false;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function sameCompletionMetadata(left: unknown, right: unknown): boolean {
  if (Object.is(left, right)) return true;
  if (Array.isArray(left) || Array.isArray(right)) {
    return Array.isArray(left) &&
      Array.isArray(right) &&
      left.length === right.length &&
      left.every((value, index) => sameCompletionMetadata(value, right[index]));
  }
  if (!isRecord(left) || !isRecord(right)) return false;
  const leftKeys = Object.keys(left).sort();
  const rightKeys = Object.keys(right).sort();
  return leftKeys.length === rightKeys.length &&
    leftKeys.every((key, index) => (
      key === rightKeys[index] &&
      sameCompletionMetadata(left[key], right[key])
    ));
}

function sameServerProfile(left: ServerProfile | null | undefined, right: ServerProfile | null | undefined): boolean {
  if (!left || !right) return left === right;
  for (const key of [
    'id',
    'userId',
    'nickname',
    'displayName',
    'bio',
    'avatarUrl',
    'totalKeys',
    'totalPotential',
    'dayPotential',
    'dayPotentialDay',
    'closedDays',
    'currentStreak',
    'longestStreak',
    'createdAt',
  ] as const) {
    if (!Object.is(left[key], right[key])) return false;
  }
  return true;
}

function mergeSavedServerState(
  previous: AppState,
  savedState: Record<string, unknown> | null | undefined,
  profile: ServerProfile | null | undefined,
): AppState {
  let next = previous;
  let changed = false;

  for (const [key, value] of Object.entries(savedState ?? {})) {
    if (key === 'profile') continue;
    const stateKey = key as keyof AppState;
    if (!sameStateValue(previous[stateKey], value)) {
      if (!changed) {
        next = { ...previous };
        changed = true;
      }
      (next as unknown as Record<string, unknown>)[key] = value;
    }
  }

  if (profile && !sameServerProfile(previous.profile, profile)) {
    if (!changed) {
      next = { ...previous };
      changed = true;
    }
    next = {
      ...next,
      keys: profile.totalKeys,
      potential: profileDayPotential(profile),
      closedDays: profile.closedDays ?? 0,
      streak: profile.currentStreak,
      profile,
    };
  }

  return next;
}

/**
 * Локальное начисление для гостя: потенциал копится в пределах дня,
 * а ключи появляются только при закрытии дня на 100%.
 */
export function applyLocalCompletion(
  prev: AppState,
  techniqueId: TechniqueId,
  metadata: Record<string, unknown>,
  activityType: ActivityEntry['type'],
  now: Date = new Date(),
): Partial<AppState> {
  const nowISO = now.toISOString();
  const source = TECHNIQUE_SOURCES[techniqueId] ?? techniqueId;
  const potential = potentialForTechnique(techniqueId, metadata);
  const potentialBefore = normalizeDayPotential(prev.potential);
  const potentialAfter = normalizeDayPotential(potentialBefore + potential);
  const closesDay = potentialBefore < DAY_POTENTIAL_TARGET && potentialAfter >= DAY_POTENTIAL_TARGET;
  const streakUpdate = closesDay ? computeStreakUpdate(prev, now) : {};
  const streak = (streakUpdate as Partial<AppState>).streak ?? prev.streak;
  const keys = closesDay ? dayCloseReward(streak) : 0;

  return {
    todayTechniques: { ...prev.todayTechniques, [techniqueId]: true },
    potential: potentialAfter,
    keys: prev.keys + keys,
    potentialHistory: potential > 0
      ? [{ date: nowISO, source, amount: potential }, ...prev.potentialHistory]
      : prev.potentialHistory,
    keysHistory: keys > 0
      ? [{ date: nowISO, source: 'Закрытие дня на 100%', amount: keys, type: 'earn' as const }, ...prev.keysHistory]
      : prev.keysHistory,
    closedDays: prev.closedDays + (closesDay ? 1 : 0),
    userState: closesDay ? 'dayDone' : prev.userState,
    activityLog: [
      {
        id: `act_${now.getTime()}`,
        date: nowISO,
        type: activityType,
        keysGained: keys,
        potentialGained: potential,
        details: metadata as ActivityEntry['details'],
      },
      ...prev.activityLog,
    ],
    ...streakUpdate,
  };
}

function completionActivityType(techniqueId: string): ActivityEntry['type'] {
  return techniqueId === 'T1'
    ? 'planner'
    : techniqueId === 'T2'
      ? 'visualization'
      : techniqueId === 'T3'
        ? 'meditation'
        : techniqueId === 'T4'
          ? 'walk'
          : techniqueId === 'T5'
             ? 'hobby'
             : techniqueId === 'T6'
               ? 'sleep'
                : techniqueId === 'T7'
                  ? 'memory'
                  : 'concentration';
}

/**
 * Finds the completion that a client can safely reconcile after a transport
 * failure. The server owns the app-day, so a matching row is proof that this
 * exact level was committed even when the POST response never reached us.
 */
export function findRecoveredCompletion(
  completions: ServerCompletion[],
  techniqueId: string,
  metadata: Record<string, unknown>,
  now: Date = new Date(),
): ServerCompletion | undefined {
  const appDay = getServerAppDayKey(now);
  return completions.find((completion) => (
    completion.techniqueId === techniqueId &&
    completion.appDay === appDay &&
    sameCompletionMetadata(completion.metadata, metadata)
  ));
}

export function applyServerCompletions(prev: AppState, completions: ServerCompletion[]): AppState {
  const rows = completions.filter(row => row && Number.isFinite(row.id));
  if (rows.length === 0) return prev;

  const today = getServerAppDayKey();
  const todayRows = rows.filter(row => row.appDay === today);
  const todayTechniques = { ...prev.todayTechniques };
  todayRows.forEach(row => {
    if (row.techniqueId in todayTechniques) {
      todayTechniques[row.techniqueId as keyof typeof todayTechniques] = true;
    }
  });

  const activityLog = [...prev.activityLog];
  const keysHistory = [...prev.keysHistory];
  const potentialHistory = [...prev.potentialHistory];
  let memory = prev.memory;
  let concentration = prev.concentration;
  for (const row of rows) {
    const completedAt = new Date(row.completedAt);
    const dateMs = completedAt.getTime();
    const type = completionActivityType(row.techniqueId);
    const metadata = row.metadata && typeof row.metadata === 'object'
      ? row.metadata
      : {};
    const level = Number(metadata.level);
    if (
      row.techniqueId === 'T7' &&
      (metadata.mode === 'reverse' || metadata.mode === 'matrix' || metadata.mode === 'symbols') &&
      Number.isFinite(level)
    ) {
      const mode = metadata.mode;
      memory = {
        ...memory,
        bestLevels: {
          ...memory.bestLevels,
          [mode]: Math.max(memory.bestLevels[mode] ?? 1, level),
        },
        ...(row.potentialAwarded > 0 && row.appDay >= (memory.rewardDay ?? '')
          ? { rewardDay: row.appDay }
          : {}),
      };
    }
    if (
      row.techniqueId === 'T8' &&
      (metadata.mode === 'signals' || metadata.mode === 'tracking' || metadata.mode === 'search') &&
      Number.isFinite(level)
    ) {
      const mode = metadata.mode;
      concentration = {
        ...concentration,
        bestLevels: {
          ...concentration.bestLevels,
          [mode]: Math.max(concentration.bestLevels[mode] ?? 1, level),
        },
        ...(row.potentialAwarded > 0 && row.appDay >= (concentration.rewardDay ?? '')
          ? { rewardDay: row.appDay }
          : {}),
      };
    }
    const activityId = `completion:${row.id}`;
    const hasActivity = activityLog.some(entry => (
      entry.id === activityId ||
      (
        entry.type === type &&
        entry.keysGained === row.keysAwarded &&
        Math.abs(new Date(entry.date).getTime() - dateMs) < 120_000
      )
    ));
    if (!hasActivity) {
      activityLog.push({
        id: activityId,
        date: row.completedAt,
        type,
        keysGained: row.keysAwarded,
        potentialGained: row.potentialAwarded,
        details: metadata as ActivityEntry['details'],
      });
    }

    const source = TECHNIQUE_SOURCES[row.techniqueId] ?? row.techniqueId;
    if (row.keysAwarded > 0 && !keysHistory.some(entry => (
      entry.type === 'earn' &&
      entry.source === source &&
      entry.amount === row.keysAwarded &&
      Math.abs(new Date(entry.date).getTime() - dateMs) < 120_000
    ))) {
      keysHistory.push({
        date: row.completedAt,
        source,
        amount: row.keysAwarded,
        type: 'earn',
      });
    }
    if (row.potentialAwarded > 0 && !potentialHistory.some(entry => (
      entry.source === source &&
      entry.amount === row.potentialAwarded &&
      Math.abs(new Date(entry.date).getTime() - dateMs) < 120_000
    ))) {
      potentialHistory.push({
        date: row.completedAt,
        source,
        amount: row.potentialAwarded,
      });
    }
  }

  const latestCompletion = rows[0]?.completedAt;
  return {
    ...prev,
    todayTechniques,
    todayTechniquesDate: todayRows.length > 0 ? getAppDayStart().toISOString() : prev.todayTechniquesDate,
    activityLog,
    keysHistory,
    potentialHistory,
    memory,
    concentration,
    lastCompletedDate: latestCompletion && (
      !prev.lastCompletedDate ||
      new Date(latestCompletion).getTime() > new Date(prev.lastCompletedDate).getTime()
    ) ? latestCompletion : prev.lastCompletedDate,
  };
}

export function getTodayKeysFromSource(keysHistory: KeyEntry[], source: string, now: Date = new Date()): number {
  const todayKey = getAppDayKey(now);
  return keysHistory
    .filter(e => e.type === 'earn' && e.source === source && getAppDayKey(new Date(e.date)) === todayKey)
    .reduce((sum, e) => sum + e.amount, 0);
}

export function getTodayPotentialFromSource(potentialHistory: ResourceEntry[], source: string, now: Date = new Date()): number {
  const todayKey = getAppDayKey(now);
  return potentialHistory
    .filter(e => e.source === source && getAppDayKey(new Date(e.date)) === todayKey)
    .reduce((sum, e) => sum + e.amount, 0);
}

export function computeStreakUpdate(prev: AppState, now: Date = new Date()): Partial<AppState> {
  const todayStart = getAppDayStart(now);
  const yesterdayStart = new Date(todayStart);
  yesterdayStart.setDate(yesterdayStart.getDate() - 1);

  const lastCompleted = prev.lastCompletedDate ? getAppDayStart(new Date(prev.lastCompletedDate)) : null;

  if (lastCompleted && lastCompleted.getTime() === todayStart.getTime()) {
    return {};
  }

  const wasYesterday = lastCompleted && lastCompleted.getTime() === yesterdayStart.getTime();
  const missedDays = lastCompleted && lastCompleted.getTime() < yesterdayStart.getTime();

  const newStreak = wasYesterday
    ? prev.streak + 1
    : missedDays
      ? 1
      : !prev.lastCompletedDate
        ? 1
        : prev.streak;

  const nowISO = now.toISOString();
  return {
    streak: newStreak,
    lastCompletedDate: nowISO,
    streakHistory: [{ date: nowISO, value: newStreak }, ...prev.streakHistory],
  };
}

export function applyServerCompletion(
  prev: AppState,
  techniqueId: string,
  result: CompleteTechniqueResult,
  metadata: Record<string, unknown>,
): Partial<AppState> {
  const now = new Date();
  const nowISO = now.toISOString();
  const source = TECHNIQUE_SOURCES[techniqueId] ?? techniqueId;
  const completionActivityId = `completion:${result.completedTechniqueId}`;
  // A retry can legitimately return the original server receipt. Apply its
  // authoritative totals, but do not mirror the same ledger row locally twice.
  const alreadyRecorded = prev.activityLog.some((entry) => entry.id === completionActivityId);
  const closedDays = result.closedDays ?? prev.closedDays;
  const updates: Partial<AppState> = {
    keys: result.totalKeys,
    potential: clampDayPotential(result.totalPotential),
    closedDays,
    streak: result.newStreak,
    profile: prev.profile
      ? {
          ...prev.profile,
          totalKeys: result.totalKeys,
           ...(typeof result.dayClosed === 'boolean'
             ? {
                 dayPotential: clampDayPotential(result.totalPotential),
                 dayPotentialDay: getServerAppDayKey(now),
                 closedDays,
               }
             : {}),
          currentStreak: result.newStreak,
          longestStreak: result.longestStreak,
        }
      : prev.profile,
     todayTechniques: techniqueId in prev.todayTechniques
       ? { ...prev.todayTechniques, [techniqueId]: true }
       : prev.todayTechniques,
    keysHistory: result.keys > 0 && !alreadyRecorded
      ? [{ date: nowISO, source, amount: result.keys, type: 'earn' as const }, ...prev.keysHistory]
      : prev.keysHistory,
    potentialHistory: result.potential > 0 && !alreadyRecorded
      ? [{ date: nowISO, source, amount: result.potential }, ...prev.potentialHistory]
      : prev.potentialHistory,
    activityLog: alreadyRecorded
      ? prev.activityLog
      : [
          {
            id: completionActivityId,
            date: nowISO,
            type: completionActivityType(techniqueId),
            keysGained: result.keys,
            potentialGained: result.potential,
            details: metadata as ActivityEntry['details'],
          },
          ...prev.activityLog,
        ],
    lastCompletedDate: alreadyRecorded ? prev.lastCompletedDate : nowISO,
    streakHistory: alreadyRecorded
      ? prev.streakHistory
      : [{ date: nowISO, value: result.newStreak }, ...prev.streakHistory],
  };

  if (techniqueId === 'T7') {
    const mode = metadata.mode;
    const level = Number(metadata.level);
    if (mode === 'reverse' || mode === 'matrix' || mode === 'symbols') {
      updates.memory = {
        ...prev.memory,
        bestLevels: {
          ...prev.memory.bestLevels,
          [mode]: Math.max(prev.memory.bestLevels[mode] ?? 1, Number.isFinite(level) ? level : 1),
        },
        ...(result.potential > 0 ? { rewardDay: getServerAppDayKey(now) } : {}),
      };
    }
  }

  if (techniqueId === 'T8') {
    const mode = metadata.mode;
    const level = Number(metadata.level);
    if (mode === 'signals' || mode === 'tracking' || mode === 'search') {
      updates.concentration = {
        ...prev.concentration,
        bestLevels: {
          ...prev.concentration.bestLevels,
          [mode]: Math.max(prev.concentration.bestLevels[mode] ?? 1, Number.isFinite(level) ? level : 1),
        },
        ...(result.potential > 0 ? { rewardDay: getServerAppDayKey(now) } : {}),
      };
    }
  }

  if (result.dayClosed) {
    updates.userState = 'dayDone';
    updates.history = [
      {
        date: nowISO,
        potential: result.potential,
        keys: result.keys,
        streak: result.newStreak,
        techniques: { ...prev.todayTechniques, T6: true },
      },
      ...prev.history,
    ];
  }

  return updates;
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem('neyro_state');
    const todayKey = getAppDayKey();
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
         const merged = {
           ...defaultState,
           ...parsed,
           userState: parsed.userState === 'email' ? 'active' : parsed.userState,
         } as AppState;
        const savedDate = merged.todayTechniquesDate
          ? getAppDayKey(new Date(merged.todayTechniquesDate))
          : null;
        if (savedDate !== todayKey) {
          return {
            ...merged,
            userState: merged.userState === 'dayDone' ? 'active' : merged.userState,
            potential: 0,
            todayTechniques: { T1: false, T2: false, T3: false, T4: false, T5: false, T6: false },
            todayTechniquesDate: getAppDayStart().toISOString(),
          };
        }
        return merged;
      } catch {
        return defaultState;
      }
    }
    return { ...defaultState, todayTechniquesDate: getAppDayStart().toISOString() };
  });

  const { isLoaded, isSignedIn, user } = useUser();
  const { getToken } = useAuth();
  const userId = user?.id ?? null;
  const hydratedUserRef = useRef<string | null>(null);
  const hydrationRequestRef = useRef<string | null>(null);
  const stateRef = useRef(state);
  stateRef.current = state;
  const [hydrationRetryTick, setHydrationRetryTick] = useState(0);
  const [accountLoadError, setAccountLoadError] = useState<string | null>(null);

  const retryAccountHydration = useCallback(() => {
    hydrationRequestRef.current = null;
    setAccountLoadError(null);
    setHydrationRetryTick((tick) => tick + 1);
  }, []);

  useEffect(() => {
    setApiAuthTokenProvider((forceRefresh = false) =>
      getToken(forceRefresh ? { skipCache: true } : undefined),
    );
    return () => setApiAuthTokenProvider(null);
  }, [getToken]);

  useEffect(() => {
    // Once an account has hydrated, local storage is no longer an authority.
    // It remains available only for an unauthenticated guest snapshot that
    // can be migrated on the first successful sign-in.
    if (!isSignedIn || !hydratedUserRef.current) {
      localStorage.setItem('neyro_state', JSON.stringify(state));
    }
  }, [state, isSignedIn]);

  useEffect(() => {
    if (!isLoaded) return undefined;
    if (!isSignedIn || !userId) {
      hydrationRequestRef.current = null;
      hydratedUserRef.current = null;
      setAccountLoadError(null);
      const saved = localStorage.getItem('neyro_state');
      if (saved) {
        try {
          setState({ ...defaultState, ...JSON.parse(saved) } as AppState);
        } catch {
          setState({ ...defaultState, todayTechniquesDate: getAppDayStart().toISOString() });
        }
      }
      return undefined;
    }
    if (hydratedUserRef.current === userId || hydrationRequestRef.current === userId) return undefined;
    setAccountLoadError(null);
    hydrationRequestRef.current = userId;
    const guestSnapshot = stateRef.current;
    getServerState()
      .then(({ state: serverState, profile, completedTechniques }) => {
        if (hydrationRequestRef.current !== userId) return;
        const applyServer = (
          nextState: Record<string, unknown>,
          nextProfile: ServerProfile | null,
          completions: ServerCompletion[] = [],
        ) => {
          hydratedUserRef.current = userId;
          const serverPartial = nextState as Partial<AppState>;
          const hasSavedNickname = Boolean(nextProfile?.nickname);
          const completedProfileFallback =
            hasSavedNickname && (!serverPartial.userState || serverPartial.userState === 'new')
              ? { userState: 'active' as const, onboardingComplete: true }
              : {};
          setState(prev => applyServerCompletions({
            ...prev,
            ...serverPartial,
            ...completedProfileFallback,
            ...(nextProfile
              ? {
                  keys: nextProfile.totalKeys,
                  potential: profileDayPotential(nextProfile),
                  closedDays: nextProfile.closedDays,
                  streak: nextProfile.currentStreak,
                  profile: nextProfile,
                }
              : {}),
          }, completions));
        };
        const localHasProgress = hasMeaningfulSyncState(guestSnapshot);
        const serverHasProgress = hasMeaningfulSyncState(serverState) || (completedTechniques?.length ?? 0) > 0;
        if (serverHasProgress || !localHasProgress) {
          applyServer(serverState ?? {}, profile, completedTechniques);
          localStorage.removeItem('neyro_legacy_migration_key');
          return;
        }

        const existingMigrationKey = localStorage.getItem('neyro_legacy_migration_key');
        const migrationKey = existingMigrationKey ?? `legacy:${crypto.randomUUID()}`;
        localStorage.setItem('neyro_legacy_migration_key', migrationKey);
        migrateLegacyState({
          migrationKey,
          state: JSON.parse(JSON.stringify(guestSnapshot)) as Record<string, unknown>,
        })
          .then(({ state: migratedState, profile: migratedProfile }) => {
            localStorage.removeItem('neyro_state');
            applyServer(migratedState, migratedProfile, completedTechniques);
          })
          .catch(() => {
            setAccountLoadError('Не удалось синхронизировать прогресс. Проверь соединение и повтори попытку.');
            hydrationRequestRef.current = null;
          });
      })
      .catch((error) => {
        if (import.meta.env.DEV) {
          console.error('Progress hydration failed', error instanceof ApiError ? error.status : error);
        }
        setAccountLoadError(
          error instanceof ApiError && error.status === 401
            ? 'Сессия не подтверждена. Повтори попытку входа.'
            : 'Не удалось загрузить прогресс. Проверь соединение и повтори попытку.',
        );
        hydrationRequestRef.current = null;
      });
  }, [isLoaded, isSignedIn, userId, hydrationRetryTick, retryAccountHydration]);

  useEffect(() => {
    if (!isSignedIn || !userId || hydratedUserRef.current !== userId) return;
    const id = setTimeout(() => {
      saveServerState(stateRef.current)
        .then(({ state: savedState, profile }) => {
          if (hydratedUserRef.current !== userId) return;
          setState(prev => mergeSavedServerState(prev, savedState, profile));
        })
        .catch(() => {});
    }, 2000);
    return () => clearTimeout(id);
  }, [state, isSignedIn, userId]);

  const updateState = (updates: UpdateFn) => {
    setState(prev => {
      const resolved = typeof updates === 'function' ? updates(prev) : updates;
      if (!isSignedIn || !hydratedUserRef.current) return { ...prev, ...resolved };
      const safeUpdates = { ...resolved };
      for (const key of [
        'keys', 'potential', 'streak', 'lastCompletedDate', 'todayTechniques',
        'todayTechniquesDate', 'keysHistory', 'potentialHistory', 'streakHistory',
        'activityLog', 'history', 'unlockedArticles', 'purchaseHistory',
        'firstGoalBonusGiven', 'memory', 'concentration',
      ] as const) {
        delete safeUpdates[key];
      }
      return { ...prev, ...safeUpdates };
    });
  };

  const completeTechnique = useCallback(async (
    techniqueId: string,
    metadata: Record<string, unknown>,
    idempotencyKey = `${techniqueId}:${Date.now()}:${Math.random().toString(36).slice(2)}`,
  ) => {
    if (import.meta.env.DEV && !isSignedIn) {
      const previewState = stateRef.current;
      const level = Number(metadata.level);
      const isMemoryReward =
        techniqueId === 'T7' &&
        Number.isFinite(level) &&
        level >= 5 &&
        previewState.memory.rewardDay !== getServerAppDayKey();
      const isConcentrationReward =
        techniqueId === 'T8' &&
        Number.isFinite(level) &&
        level >= 5 &&
        previewState.concentration.rewardDay !== getServerAppDayKey();
      const previewPotential = techniqueId === 'T7'
        ? (isMemoryReward ? 10 : 0)
        : techniqueId === 'T8'
          ? (isConcentrationReward ? 10 : 0)
        : potentialForTechnique(techniqueId as TechniqueId);
      const previewResult: CompleteTechniqueResult = {
        keys: 0,
        potential: previewPotential,
        completedTechniqueId: Date.now(),
        newStreak: previewState.streak + 1,
        longestStreak: Math.max(previewState.streak + 1, previewState.profile?.longestStreak ?? 0),
        totalKeys: previewState.keys,
        totalPotential: previewState.potential + previewPotential,
        dayClosed: false,
        closedDays: previewState.closedDays,
      };
      const immediateUpdates = applyServerCompletion(previewState, techniqueId, previewResult, metadata);
      stateRef.current = { ...previewState, ...immediateUpdates };
      setState(prev => ({ ...prev, ...applyServerCompletion(prev, techniqueId, previewResult, metadata) }));
      return previewResult;
    }

    const clientDate = getAppDayStart().toISOString().slice(0, 10);
    const input = {
      techniqueId,
      clientDate,
      idempotencyKey,
      timezoneOffsetMinutes: new Date().getTimezoneOffset(),
      metadata,
    };
    const reconcileLostCompletion = async (): Promise<CompleteTechniqueResult | null> => {
      const { state: serverState, profile, completedTechniques = [] } = await getServerState();
      const committed = findRecoveredCompletion(completedTechniques, techniqueId, metadata);
      if (!profile || !committed) return null;

      const applyReconciledState = (previous: AppState): AppState => applyServerCompletions({
        ...previous,
        ...(serverState as Partial<AppState> | null),
        keys: profile.totalKeys,
        potential: profileDayPotential(profile),
        closedDays: profile.closedDays,
        streak: profile.currentStreak,
        profile,
      }, completedTechniques);

      const reconciled = applyReconciledState(stateRef.current);
      stateRef.current = reconciled;
      setState((previous) => applyReconciledState(previous));

      return {
        keys: committed.keysAwarded,
        potential: committed.potentialAwarded,
        completedTechniqueId: committed.id,
        newStreak: profile.currentStreak,
        longestStreak: profile.longestStreak,
        totalKeys: profile.totalKeys,
        totalPotential: profileDayPotential(profile),
        dayClosed: false,
        closedDays: profile.closedDays,
        alreadyCompleted: true,
        recovered: true,
      };
    };
    let result: CompleteTechniqueResult;
    try {
      result = await apiCompleteTechnique(input);
    } catch (error) {
      // A completed transaction can outlive a dropped response. The same
      // idempotency key makes this retry safe for the server ledger.
      if (error instanceof TypeError || (error instanceof Error && "status" in error && Number(error.status) >= 500)) {
        await new Promise((resolve) => window.setTimeout(resolve, 600));
        try {
          // Mark this response so level five can still show a single,
          // meaningful reward completion after the response was lost.
          result = { ...await apiCompleteTechnique(input), recovered: true };
        } catch (retryError) {
          const recovered = await reconcileLostCompletion().catch(() => null);
          if (!recovered) throw retryError;
          result = recovered;
        }
      } else {
        throw error;
      }
    }
    if (isSignedIn && userId) {
      const immediateUpdates = applyServerCompletion(stateRef.current, techniqueId, result, metadata);
      const immediateState = { ...stateRef.current, ...immediateUpdates };
      stateRef.current = immediateState;
      setState(prev => {
        if (!isSignedIn || !userId) return prev;
        const updates = applyServerCompletion(prev, techniqueId, result, metadata);
        return { ...prev, ...updates };
      });
      if (hydratedUserRef.current === userId) {
        void saveServerState(immediateState).catch(() => {});
      }
    }
    return result;
  }, [isSignedIn, userId]);

  const refreshProfile = useCallback(async () => {
    // /me also returns entitlements, so a purchase is visible immediately on
    // this device and not only after the next full hydration.
    const { state: serverState, profile, completedTechniques } = await getServerState();
    if (profile) {
      setState(prev => applyServerCompletions({
        ...prev,
        ...(serverState as Partial<AppState> | null),
        keys: profile.totalKeys,
        potential: profileDayPotential(profile),
        closedDays: profile.closedDays ?? 0,
        streak: profile.currentStreak,
        profile,
      }, completedTechniques ?? []));
    }
  }, []);

  const applyTrustedServerResult = useCallback((
    serverState: Record<string, unknown> | null | undefined,
    profile: ServerProfile,
  ) => {
    setState(prev => mergeSavedServerState(prev, serverState, profile));
  }, []);

  const purchaseMemoryMode = useCallback(async (mode: MemoryMode) => {
    const result = await apiPurchaseMemoryMode(mode);
    setState(prev => ({
      ...mergeSavedServerState(prev, result.state, result.profile),
      memory: {
        ...prev.memory,
        ...result.memory,
        onboardingSeen: prev.memory.onboardingSeen,
      },
    }));
  }, []);

  const purchaseConcentrationMode = useCallback(async (mode: ConcentrationMode) => {
    const result = await apiPurchaseConcentrationMode(mode);
    setState(prev => ({
      ...mergeSavedServerState(prev, result.state, result.profile),
      concentration: {
        ...prev.concentration,
        ...result.concentration,
        onboardingSeen: prev.concentration.onboardingSeen,
      },
    }));
  }, []);

  const previewGuestReady = import.meta.env.DEV && !isSignedIn;

  return (
    <AppContext.Provider value={{
      ...state,
      isSignedIn: Boolean(isSignedIn),
      isAuthLoaded: isLoaded || previewGuestReady,
      isAccountReady: previewGuestReady || (isLoaded && (!isSignedIn || hydratedUserRef.current === userId)),
      accountLoadError,
      retryAccountHydration,
      updateState,
      completeTechnique,
      refreshProfile,
      applyTrustedServerResult,
      purchaseMemoryMode,
      purchaseConcentrationMode,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppStore() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppStore must be used within AppProvider');
  return ctx;
}
