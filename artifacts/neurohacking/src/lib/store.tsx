import { createContext, useContext, useEffect, useState } from 'react';

export type UserState = 'new' | 'onboarding' | 'email' | 'active' | 'dayDone';

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
  completedAt?: string;
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
}

const defaultState: AppState = {
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
};

type UpdateFn = Partial<AppState> | ((prev: AppState) => Partial<AppState>);

interface AppContextType extends AppState {
  updateState: (updates: UpdateFn) => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function getTodayKeysFromSource(keysHistory: KeyEntry[], source: string): number {
  const today = new Date().toDateString();
  return keysHistory
    .filter(e => e.type === 'earn' && e.source === source && new Date(e.date).toDateString() === today)
    .reduce((sum, e) => sum + e.amount, 0);
}

export function getTodayPotentialFromSource(potentialHistory: ResourceEntry[], source: string): number {
  const today = new Date().toDateString();
  return potentialHistory
    .filter(e => e.source === source && new Date(e.date).toDateString() === today)
    .reduce((sum, e) => sum + e.amount, 0);
}

export function computeStreakUpdate(prev: AppState): Partial<AppState> {
  const today = new Date().toDateString();
  if (prev.lastCompletedDate && new Date(prev.lastCompletedDate).toDateString() === today) {
    return {};
  }
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const wasYesterday = prev.lastCompletedDate &&
    new Date(prev.lastCompletedDate).toDateString() === yesterday.toDateString();
  const missedDays = prev.lastCompletedDate &&
    new Date(prev.lastCompletedDate).toDateString() !== yesterday.toDateString() &&
    new Date(prev.lastCompletedDate).toDateString() !== today;
  const newStreak = wasYesterday
    ? prev.streak + 1
    : missedDays
      ? 1
      : !prev.lastCompletedDate
        ? 1
        : prev.streak;
  const now = new Date().toISOString();
  return {
    streak: newStreak,
    lastCompletedDate: now,
    streakHistory: [{ date: now, value: newStreak }, ...prev.streakHistory],
  };
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem('neyro_state');
    if (saved) {
      try {
        return { ...defaultState, ...JSON.parse(saved) };
      } catch {
        return defaultState;
      }
    }
    return defaultState;
  });

  useEffect(() => {
    localStorage.setItem('neyro_state', JSON.stringify(state));
  }, [state]);

  const updateState = (updates: UpdateFn) => {
    setState(prev => {
      const resolved = typeof updates === 'function' ? updates(prev) : updates;
      return { ...prev, ...resolved };
    });
  };

  return (
    <AppContext.Provider value={{ ...state, updateState }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppStore() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppStore must be used within AppProvider');
  return ctx;
}
