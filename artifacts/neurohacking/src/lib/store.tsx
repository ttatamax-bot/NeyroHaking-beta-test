import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { useAuth, useUser } from '@clerk/react';
import {
  getServerState,
  saveServerState,
  migrateLegacyState,
  completeTechnique as apiCompleteTechnique,
  setApiAuthTokenProvider,
  type CompleteTechniqueResult,
  type ServerProfile,
} from './api';

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
  type: 'planner' | 'visualization' | 'meditation' | 'walk' | 'hobby' | 'sleep' | 'article';
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

export interface AppState {
  userState: UserState;
  onboardingStep: number;
  onboardingHighlight: string[];
  email: string | null;
  onboardingComplete: boolean;
  potential: number;
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
  coachingShown: string[];
  timerWarningShown: boolean;
  walkWarningShown: boolean;
  profile?: ServerProfile | null;
}

export const defaultState: AppState = {
  userState: 'new',
  onboardingStep: 0,
  onboardingHighlight: [],
  email: null,
  onboardingComplete: false,
  potential: 0,
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
  coachingShown: [],
  timerWarningShown: false,
  walkWarningShown: false,
  profile: null,
};

function hasMeaningfulSyncState(state: Partial<AppState> | Record<string, unknown> | null): boolean {
  if (!state) return false;
  return (
    Number(state.keys ?? 0) > 0 ||
    Number(state.potential ?? 0) > 0 ||
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

interface AppContextType extends AppState {
  isSignedIn: boolean;
  isAuthLoaded: boolean;
  isAccountReady: boolean;
  updateState: (updates: UpdateFn) => void;
  completeTechnique: (techniqueId: string, metadata: Record<string, unknown>) => Promise<CompleteTechniqueResult>;
  refreshProfile: () => Promise<void>;
}

const AppContext = createContext<AppContextType | null>(null);

export const TECHNIQUE_SOURCES: Record<string, string> = {
  T1: 'Техника: Планер',
  T2: 'Техника: Визуализация',
  T3: 'Техника: Медитация',
  T4: 'Техника: Прогулка',
  T5: 'Техника: Хобби',
  T6: 'Техника: Сон',
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
  const updates: Partial<AppState> = {
    keys: result.totalKeys,
    potential: Math.min(100, result.totalPotential),
    streak: result.newStreak,
    todayTechniques: { ...prev.todayTechniques, [techniqueId]: true },
    keysHistory: result.keys > 0
      ? [{ date: nowISO, source, amount: result.keys, type: 'earn' as const }, ...prev.keysHistory]
      : prev.keysHistory,
    potentialHistory: result.potential > 0
      ? [{ date: nowISO, source, amount: result.potential }, ...prev.potentialHistory]
      : prev.potentialHistory,
    activityLog: [
      {
        id: `act_${Date.now()}`,
        date: nowISO,
        type: (techniqueId === 'T1' ? 'planner' : techniqueId === 'T2' ? 'visualization' : techniqueId === 'T3' ? 'meditation' : techniqueId === 'T4' ? 'walk' : techniqueId === 'T5' ? 'hobby' : 'sleep') as ActivityEntry['type'],
        keysGained: result.keys,
        potentialGained: result.potential,
        details: metadata as ActivityEntry['details'],
      },
      ...prev.activityLog,
    ],
    lastCompletedDate: nowISO,
    streakHistory: [{ date: nowISO, value: result.newStreak }, ...prev.streakHistory],
  };

  if (techniqueId === 'T6') {
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
  const [, setHydrationRetryTick] = useState(0);

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
    hydrationRequestRef.current = userId;
    const guestSnapshot = stateRef.current;
    let retryTimer: number | null = null;
    const retryHydration = () => {
      if (retryTimer !== null) window.clearTimeout(retryTimer);
      retryTimer = window.setTimeout(() => {
        setHydrationRetryTick((tick) => tick + 1);
      }, 3000);
    };
    getServerState()
      .then(({ state: serverState, profile }) => {
        if (hydrationRequestRef.current !== userId) return;
        const applyServer = (nextState: Record<string, unknown>, nextProfile: ServerProfile | null) => {
          hydratedUserRef.current = userId;
          const serverPartial = nextState as Partial<AppState>;
          const hasSavedNickname = Boolean(nextProfile?.nickname);
          const completedProfileFallback =
            hasSavedNickname && (!serverPartial.userState || serverPartial.userState === 'new')
              ? { userState: 'active' as const, onboardingComplete: true }
              : {};
          setState(prev => ({
            ...prev,
            ...serverPartial,
            ...completedProfileFallback,
            ...(nextProfile
              ? {
                  keys: nextProfile.totalKeys,
                  potential: Math.min(100, nextProfile.totalPotential),
                  streak: nextProfile.currentStreak,
                  profile: nextProfile,
                }
              : {}),
          }));
        };
        const localHasProgress = hasMeaningfulSyncState(guestSnapshot);
        const serverHasProgress = hasMeaningfulSyncState(serverState);
        if (serverHasProgress || !localHasProgress) {
          applyServer(serverState ?? {}, profile);
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
            applyServer(migratedState, migratedProfile);
          })
          .catch(() => {
            // Do not mark hydration complete when the server is unavailable:
            // a retry after the next auth/network event can still migrate.
            hydrationRequestRef.current = null;
            retryHydration();
          });
      })
      .catch(() => {
        hydrationRequestRef.current = null;
        retryHydration();
      });
    return () => {
      if (retryTimer !== null) window.clearTimeout(retryTimer);
    };
  }, [isLoaded, isSignedIn, userId, setHydrationRetryTick]);

  useEffect(() => {
    if (!isSignedIn || !userId || hydratedUserRef.current !== userId) return;
    const id = setTimeout(() => {
      saveServerState(stateRef.current)
        .then(({ state: savedState, profile }) => {
          if (hydratedUserRef.current !== userId) return;
          setState(prev => ({
            ...prev,
            ...(savedState as Partial<AppState>),
            ...(profile
              ? {
                  keys: profile.totalKeys,
                  potential: Math.min(100, profile.totalPotential),
                  streak: profile.currentStreak,
                  profile,
                }
              : {}),
          }));
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
        'firstGoalBonusGiven',
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
    const clientDate = getAppDayStart().toISOString().slice(0, 10);
    const input = {
      techniqueId,
      clientDate,
      idempotencyKey,
      timezoneOffsetMinutes: new Date().getTimezoneOffset(),
      metadata,
    };
    let result: CompleteTechniqueResult;
    try {
      result = await apiCompleteTechnique(input);
    } catch (error) {
      // A completed transaction can outlive a dropped response. The same
      // idempotency key makes this retry safe for the server ledger.
      if (error instanceof TypeError || (error instanceof Error && "status" in error && Number(error.status) >= 500)) {
        await new Promise((resolve) => window.setTimeout(resolve, 600));
        result = await apiCompleteTechnique(input);
      } else {
        throw error;
      }
    }
    setState(prev => {
      if (!isSignedIn || hydratedUserRef.current !== userId) return prev;
      const updates = applyServerCompletion(prev, techniqueId, result, metadata);
      return { ...prev, ...updates };
    });
    return result;
  }, [isSignedIn, userId]);

  const refreshProfile = useCallback(async () => {
    // /me also returns entitlements, so a purchase is visible immediately on
    // this device and not only after the next full hydration.
    const { state: serverState, profile } = await getServerState();
    if (profile) {
      setState(prev => ({
        ...prev,
        ...(serverState as Partial<AppState> | null),
        keys: profile.totalKeys,
        potential: Math.min(100, profile.totalPotential),
        streak: profile.currentStreak,
        profile,
      }));
    }
  }, []);

  return (
    <AppContext.Provider value={{
      ...state,
      isSignedIn: Boolean(isSignedIn),
      isAuthLoaded: isLoaded,
      isAccountReady: isLoaded && (!isSignedIn || hydratedUserRef.current === userId),
      updateState,
      completeTechnique,
      refreshProfile,
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
