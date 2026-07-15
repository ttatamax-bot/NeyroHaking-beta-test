import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppProvider, useAppStore } from "@/lib/store";
import { NavBar } from "@/components/NavBar";
import { TopBar } from "@/components/TopBar";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { InstallPrompt } from "@/components/InstallPrompt";
import { Moon } from "lucide-react";

import Home from "@/pages/home";
import Path from "@/pages/path";
import Techniques from "@/pages/techniques";
import Academy from "@/pages/academy";
import EmailScreen from "@/pages/email";
import Goals from "@/pages/goals";
import ArticlePreview from "@/pages/article-preview";
import ArticleRead from "@/pages/article-read";
import History from "@/pages/history";
import Streak from "@/pages/streak";
import KeysStats from "@/pages/keys-stats";
import PotentialStats from "@/pages/potential-stats";
import Settings from "@/pages/settings";
import Notifications from "@/pages/notifications";
import Planner from "@/pages/planner";
import Visualization from "@/pages/visualization";
import Meditation from "@/pages/meditation";
import Walk from "@/pages/walk";
import Hobby from "@/pages/hobby";
import Sleep from "@/pages/sleep";
import NewsArticle from "@/pages/news";
import Consultation from "@/pages/consultation";
import Mentoring from "@/pages/mentoring";
import PrivacyPolicy from "@/pages/privacy-policy";
import MyProgress from "@/pages/my-progress";

const queryClient = new QueryClient();

const TECH_MESSAGES: { text: string; highlight: string[] }[] = [
  { text: 'Техники — твой главный инструмент', highlight: [] },
  { text: 'Все изменения начинаются здесь.', highlight: [] },
  { text: 'Каждая техника решает свою задачу.', highlight: [] },
  { text: 'Планер помогает двигаться к целям.', highlight: ['T1'] },
  { text: 'Нейровизуализация укрепляет мотивацию.', highlight: ['T2'] },
  { text: 'Нейромедитация развивает осознанность.', highlight: ['T3'] },
  { text: 'Хобби и Прогулки помогают мозгу получать здоровые источники дофамина.', highlight: ['T4', 'T5'] },
  { text: 'Раздел про сон — поможет наладить твой режим сна.', highlight: ['T6'] },
];

const KNOWLEDGE_MESSAGES: { text: string; highlight: string[] }[] = [
  { text: 'Здесь — знания, которые меняют мышление.', highlight: [] },
  { text: 'Каждая статья обоснована нейронаукой.', highlight: ['ACAD_articles'] },
  { text: 'Ключи открывают доступ к материалам.', highlight: ['ACAD_services'] },
  { text: 'Оставь почту — получай уведомления о новых статьях.', highlight: [] },
];

type TabMessage = {
  text: string;
  highlight?: string[];
  blurStart?: number;
  topBlurBot?: number;
  msgTop?: string;
};

const PATH_MESSAGES: TabMessage[] = [
  { text: 'Путь — вся твоя статистика в одном месте.',                         highlight: ['PATH_potential', 'PATH_keys', 'PATH_streak'],                      msgTop: '55%' },
  { text: 'Потенциал растёт с каждой выполненной техникой.',                   highlight: ['PATH_potential'],                              blurStart: 185, msgTop: '205px' },
  { text: 'Серия дней показывает сколько дней подряд ты работаешь над собой.', highlight: ['PATH_streak'],                                 blurStart: 185, msgTop: '205px' },
  { text: 'Ключи открывают доступ к материалам из Академии.',                  highlight: ['PATH_keys'],                                   blurStart: 185, msgTop: '205px' },
];

const ACADEMY_MESSAGES: TabMessage[] = [
  { text: 'К статьям по нейробиологии и консультациям.',                               highlight: ['ACAD_articles', 'ACAD_services'],      msgTop: '50%'  },
  { text: 'За выполнение техник ты получаешь ключи.',                                  highlight: ['ACAD_services'],                      blurStart: 258, msgTop: '268px' },
  { text: 'Оставь свою почту — получай уведомления о новых материалах и обновлениях.', highlight: [],                                     blurStart: 48,  msgTop: '50%'  },
];

const MSG_TOP_PX: Record<number, string> = {
  0: '70%', 1: '70%', 2: '38%',
  3: '195px',
  4: '310px',
  5: '425px',
  6: '70%',
  7: '70%',
};

const COACHING_SEQUENCES: {
  id: string;
  condition: (s: { readArticles: string[]; keys: number; unlockedArticles: string[]; firstGoalBonusGiven: boolean; activityLog: { type: string }[] }) => boolean;
  messages: string[];
}[] = [
  {
    id: 'after_A1',
    condition: s => s.readArticles.includes('A1'),
    messages: ['Выполните медитацию на 3 минуты!'],
  },
  {
    id: 'keys_for_A2',
    condition: s => s.keys >= 5 && s.readArticles.includes('A1') && !s.unlockedArticles.includes('A2'),
    messages: ['У тебя достаточно ключей для покупки статьи', 'Прочитай про постановку целей — это очень важно!'],
  },
  {
    id: 'after_goals',
    condition: s => s.firstGoalBonusGiven,
    messages: [
      'Чтобы всегда оставаться мотивированным, освой мощную технику Нейровизуализации',
      'У тебя достаточно ключей, чтобы прочитать статью про Нейровизуализацию в Академии',
    ],
  },
  {
    id: 'after_viz',
    condition: s => s.activityLog.some(e => e.type === 'visualization'),
    messages: [
      'Теперь тебе пора начать двигаться к цели',
      'Прочитай статью про эффективную постановку задач на день',
    ],
  },
];

function MaximBubble({
  idx,
  messages,
  isLast,
  msgTopOverride,
}: {
  idx: number;
  messages: { text: string }[];
  isLast: boolean;
  msgTopOverride?: string;
}) {
  const msg = messages[Math.min(idx, messages.length - 1)];
  const top = msgTopOverride ?? MSG_TOP_PX[idx] ?? '38%';

  return (
    <motion.div
      className="fixed left-0 right-0 z-[40] flex justify-end px-4 pointer-events-none"
      animate={{ top }}
      transition={{ type: 'spring', stiffness: 220, damping: 30 }}
      style={{ top }}
    >
      <div className="flex flex-row-reverse items-end gap-2" style={{ maxWidth: 'min(300px, calc(100% - 8px))' }}>
        <img src="/maxim-avatar.png" alt="Максим"
          className="w-[44px] h-[44px] rounded-full object-cover shrink-0"
          style={{ boxShadow: '0 0 0 2px #2563EB' }} />
        <div className="flex flex-col items-end gap-[3px]">
          <span style={{ fontSize: 11, fontWeight: 700, color: '#93c5fd', letterSpacing: '0.03em', paddingRight: 4 }}>
            Татаринов Максим
          </span>
          <AnimatePresence mode="wait">
            <motion.div key={idx}
              initial={{ opacity: 0, scale: 0.94, y: 6 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: -6 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="rounded-[16px] rounded-br-[4px] px-4 py-3 text-left"
              style={{ background: 'rgba(10,13,26,0.98)', border: '1.5px solid rgba(37,99,235,0.5)', boxShadow: '0 4px 24px rgba(0,0,0,0.6)' }}>
              <p className="body text-primary leading-snug">{msg?.text}</p>
            </motion.div>
          </AnimatePresence>
          <span style={{ fontSize: 11, color: 'rgba(147,197,253,0.45)', paddingRight: 6, marginTop: 2 }}>
            {isLast ? 'продолжить →' : 'далее →'}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

function TechChatPanel({ onDone }: { onDone: () => void }) {
  const { updateState } = useAppStore();
  const updateRef = useRef(updateState);
  updateRef.current = updateState;
  const [idx, setIdx] = useState(0);
  const isLast = idx >= TECH_MESSAGES.length - 1;
  const msg = TECH_MESSAGES[idx];
  useEffect(() => { updateRef.current({ onboardingHighlight: msg?.highlight ?? [] }); }, [idx]);
  const advance = () => {
    if (isLast) { updateRef.current({ onboardingHighlight: [] }); onDone(); }
    else setIdx(i => i + 1);
  };
  return (
    <>
      <div className="fixed inset-0 z-[35] cursor-pointer" onClick={advance} onTouchMove={e => e.preventDefault()} style={{ touchAction: 'none' }} />
      <MaximBubble idx={idx} messages={TECH_MESSAGES} isLast={isLast} />
    </>
  );
}

function TabChatPanel({ messages, onDone }: { messages: TabMessage[]; onDone: () => void }) {
  const { updateState } = useAppStore();
  const updateRef = useRef(updateState);
  updateRef.current = updateState;
  const [idx, setIdx] = useState(0);
  const safeIdx = Math.min(idx, messages.length - 1);
  const isLast = safeIdx >= messages.length - 1;
  const msg = messages[safeIdx];
  useEffect(() => { updateRef.current({ onboardingHighlight: msg?.highlight ?? [] }); }, [safeIdx]);
  const advance = () => {
    if (isLast) { updateRef.current({ onboardingHighlight: [] }); onDone(); }
    else setIdx(i => i + 1);
  };
  const msgTopOverride = msg?.msgTop ?? '54%';
  return (
    <>
      <div className="fixed inset-0 z-[35] cursor-pointer" onClick={advance} />
      <MaximBubble idx={safeIdx} messages={messages} isLast={isLast} msgTopOverride={msgTopOverride} />
    </>
  );
}

function KnowledgeChatPanel({ onDone }: { onDone: () => void }) {
  const { updateState } = useAppStore();
  const updateRef = useRef(updateState);
  updateRef.current = updateState;
  const [idx, setIdx] = useState(0);
  const isLast = idx >= KNOWLEDGE_MESSAGES.length - 1;
  const msg = KNOWLEDGE_MESSAGES[idx];
  useEffect(() => { updateRef.current({ onboardingHighlight: msg?.highlight ?? [] }); }, [idx]);
  const advance = () => {
    if (isLast) { updateRef.current({ onboardingHighlight: [] }); onDone(); }
    else setIdx(i => i + 1);
  };
  return (
    <>
      <div className="fixed inset-0 z-[35] cursor-pointer" onClick={advance} />
      <MaximBubble idx={idx} messages={KNOWLEDGE_MESSAGES} isLast={isLast} msgTopOverride="50%" />
    </>
  );
}

function OnboardingTutorial() {
  const { userState, onboardingStep, updateState } = useAppStore();
  const [, setLocation] = useLocation();
  if (userState !== 'onboarding') return null;
  if (onboardingStep === 0) {
    return <TechChatPanel onDone={() => { updateState({ onboardingStep: 1, onboardingHighlight: [] }); setLocation('/path'); }} />;
  }
  if (onboardingStep === 1) {
    return <TabChatPanel messages={PATH_MESSAGES} onDone={() => { updateState({ onboardingStep: 2 }); setLocation('/academy'); }} />;
  }
  if (onboardingStep === 2) {
    return <KnowledgeChatPanel onDone={() => { updateState({ onboardingHighlight: [], userState: 'email' }); setLocation('/onboarding/email'); }} />;
  }
  return null;
}

function CoachingBubble() {
  const { userState, readArticles, keys, unlockedArticles, firstGoalBonusGiven, activityLog, coachingShown, updateState } = useAppStore();
  const updateRef = useRef(updateState);
  updateRef.current = updateState;
  const [active, setActive] = useState<{ id: string; messages: string[]; idx: number } | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (userState === 'onboarding' || userState === 'new') return;
    if (active) return;
    const storeSnap = { readArticles, keys, unlockedArticles, firstGoalBonusGiven, activityLog };
    const shown = coachingShown ?? [];
    for (const seq of COACHING_SEQUENCES) {
      if (!shown.includes(seq.id) && seq.condition(storeSnap)) {
        const timer = setTimeout(() => { setActive({ id: seq.id, messages: seq.messages, idx: 0 }); setVisible(true); }, 900);
        return () => clearTimeout(timer);
      }
    }
    return;
  }, [userState, readArticles, keys, unlockedArticles, firstGoalBonusGiven, activityLog, coachingShown, active]);

  const handleTap = () => {
    if (!active) return;
    const nextIdx = active.idx + 1;
    if (nextIdx < active.messages.length) {
      setActive(prev => prev ? { ...prev, idx: nextIdx } : null);
    } else {
      const id = active.id;
      updateRef.current(prev => ({ coachingShown: [...(prev.coachingShown ?? []), id] }));
      setVisible(false);
      setActive(null);
    }
  };

  if (!visible || !active) return null;
  const messages = active.messages.map(text => ({ text }));
  const isLast = active.idx >= messages.length - 1;

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[40] cursor-pointer" onClick={handleTap} />
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed left-0 right-0 z-[41] flex justify-end px-4 pointer-events-none"
        style={{ bottom: 175 }}>
        <div className="flex flex-row-reverse items-end gap-2" style={{ maxWidth: 'min(300px, calc(100% - 8px))' }}>
          <img src="/maxim-avatar.png" alt="Максим"
            className="w-[44px] h-[44px] rounded-full object-cover shrink-0"
            style={{ boxShadow: '0 0 0 2px #2563EB' }} />
          <div className="flex flex-col items-end gap-[3px]">
            <span style={{ fontSize: 11, fontWeight: 700, color: '#93c5fd', letterSpacing: '0.03em', paddingRight: 4 }}>Татаринов Максим</span>
            <AnimatePresence mode="wait">
              <motion.div key={active.idx}
                initial={{ opacity: 0, scale: 0.94, y: 6 }} animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.94, y: -6 }} transition={{ duration: 0.2, ease: 'easeOut' }}
                className="rounded-[16px] rounded-br-[4px] px-4 py-3 text-left"
                style={{ background: 'rgba(10,13,26,0.98)', border: '1.5px solid rgba(37,99,235,0.5)', boxShadow: '0 4px 24px rgba(0,0,0,0.6)', pointerEvents: 'auto' }}>
                <p className="body text-primary leading-snug">{messages[active.idx]?.text}</p>
              </motion.div>
            </AnimatePresence>
            <span style={{ fontSize: 11, color: 'rgba(147,197,253,0.45)', paddingRight: 6, marginTop: 2 }}>
              {isLast ? 'продолжить →' : 'далее →'}
            </span>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

function DevResetButton() {
  if (!import.meta.env.DEV) return null;
  return (
    <button
      onClick={() => { localStorage.clear(); window.location.href = '/'; }}
      style={{ position: 'fixed', bottom: 72, right: 8, zIndex: 9999, background: 'rgba(220,38,38,0.9)', color: '#fff', borderRadius: 8, padding: '4px 10px', fontSize: 11, fontWeight: 700, letterSpacing: '0.03em', border: '1px solid rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)', boxShadow: '0 2px 8px rgba(0,0,0,0.5)' }}
    >
      DEV: сброс
    </button>
  );
}

function AppLogic() {
  const store = useAppStore();
  const { userState, updateState } = store;

  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  // Global Wake Lock — keep screen on while app is open
  useEffect(() => {
    if (!('wakeLock' in navigator)) return;
    let wakeLock: WakeLockSentinel | null = null;

    const acquire = async () => {
      try {
        wakeLock = await (navigator as any).wakeLock.request('screen');
        wakeLock.addEventListener('release', () => { wakeLock = null; });
      } catch {
        // Not supported or denied — silently ignore
      }
    };

    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && !wakeLock) {
        acquire();
      } else if (document.visibilityState === 'hidden' && wakeLock) {
        wakeLock.release().catch(() => {});
        wakeLock = null;
      }
    };

    acquire();
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      if (wakeLock) { wakeLock.release().catch(() => {}); }
    };
  }, []);

  // Day reset — on every new day, reset all techniques and unlock app.
  // Also check streak: if user missed days, reset streak.
  useEffect(() => {
    const check = () => {
      const now = new Date();
      const todayStr = now.toDateString();
      const lastSessionStr = store.lastSessionDate
        ? new Date(store.lastSessionDate).toDateString()
        : null;
      const isNewDay = !lastSessionStr || lastSessionStr !== todayStr;

      if (isNewDay) {
        // Reset streak if missed days
        const streakUpdates: Partial<AppState> = {};
        if (store.lastCompletedDate) {
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          const lastCompleted = new Date(store.lastCompletedDate).toDateString();
          if (lastCompleted !== todayStr && lastCompleted !== yesterday.toDateString()) {
            streakUpdates.streak = 0;
          }
        }
        updateState(prev => ({
          userState: prev.userState === 'dayDone' ? 'active' : prev.userState,
          todayTechniques: {
            T1: false,
            T2: false,
            T3: false,
            T4: false,
            T5: false,
            T6: false,
          },
          ...streakUpdates,
        }));
      }
      // Always update lastSessionDate
      if (lastSessionStr !== todayStr) {
        updateState({ lastSessionDate: now.toISOString() });
      }
    };
    check();
    const id = setInterval(check, 30_000);
    return () => clearInterval(id);
  }, [store.lastSessionDate]);

  useEffect(() => {
    const tryRequest = () => {
      const win = window as any;
      if (win.OneSignal && win.OneSignal.Notifications) {
        // Push notification permission is handled via Settings → Notifications
      }
    };
    const timer = setTimeout(tryRequest, 2000);
    return () => clearTimeout(timer);
  }, []);

  return null;
}

export const APP_BG: React.CSSProperties = {
  background: `
    radial-gradient(ellipse 80% 55% at 50% -5%, rgba(37,99,235,0.32) 0%, rgba(59,130,246,0.12) 45%, transparent 65%),
    #0F2035`,
};

function AnimatedBgOverlay() {
  return (
    <>
      <motion.div className="absolute inset-0 pointer-events-none z-0"
        animate={{ opacity: [0.4, 0.7, 0.5, 0.7, 0.4], x: [0, 15, -8, 10, 0] }}
        transition={{ duration: 24, repeat: Infinity, ease: 'easeInOut' }}
        style={{ background: `radial-gradient(ellipse 70% 45% at 50% 15%, rgba(37,99,235,0.12) 0%, rgba(59,130,246,0.06) 50%, transparent 70%)` }} />
      <motion.div className="absolute inset-0 pointer-events-none z-0"
        animate={{ opacity: [0.0, 0.30, 0.12, 0.28, 0.0], x: [0, -20, 12, -15, 0], y: [0, 10, -8, 12, 0] }}
        transition={{ duration: 30, repeat: Infinity, ease: 'easeInOut', delay: 3 }}
        style={{ background: `radial-gradient(ellipse 50% 40% at 55% 55%, rgba(245,158,11,0.10) 0%, rgba(236,72,153,0.07) 50%, transparent 65%)` }} />
      <motion.div className="absolute inset-0 pointer-events-none z-0"
        animate={{ opacity: [0.0, 0.22, 0.08, 0.20, 0.0], x: [0, 10, -15, 8, 0], y: [0, -8, 6, -10, 0] }}
        transition={{ duration: 28, repeat: Infinity, ease: 'easeInOut', delay: 8 }}
        style={{ background: `radial-gradient(ellipse 45% 35% at 20% 40%, rgba(192,132,252,0.10) 0%, rgba(236,72,153,0.06) 50%, transparent 65%)` }} />
      <motion.div className="absolute inset-0 pointer-events-none z-0"
        animate={{ opacity: [0.05, 0.18, 0.08, 0.16, 0.05] }}
        transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut', delay: 5 }}
        style={{ background: `radial-gradient(ellipse 75% 30% at 50% 100%, rgba(6,182,212,0.08) 0%, rgba(245,158,11,0.06) 50%, transparent 70%)` }} />
      <motion.div className="absolute inset-0 pointer-events-none z-0"
        animate={{ opacity: [0.0, 0.15, 0.05, 0.14, 0.0], x: [0, 12, -8, 10, 0] }}
        transition={{ duration: 26, repeat: Infinity, ease: 'easeInOut', delay: 12 }}
        style={{ background: `radial-gradient(ellipse 40% 30% at 80% 75%, rgba(236,72,153,0.08) 0%, transparent 65%)` }} />
    </>
  );
}

function DayDoneOverlay() {
  const { userState } = useAppStore();
  const [location] = useLocation();
  if (userState !== 'dayDone') return null;
  if (location.startsWith('/onboarding/email')) return null;
  return (
    <div className="fixed inset-0 z-[50] flex flex-col items-center justify-center text-primary overflow-hidden" style={APP_BG}>
      <div className="relative z-10 text-center px-8 w-full max-w-[390px]">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
          <div className="flex justify-center mb-8">
            <div className="w-20 h-20 rounded-full border border-blue-core bg-surface-1 flex items-center justify-center">
              <Moon size={36} className="text-blue-light" />
            </div>
          </div>
          <h1 className="display-l text-primary mb-10">
            День завершён. Продолжай <span className="text-blue">серию</span>.
          </h1>
        </motion.div>
        <p className="caption text-tertiary">Приложение разблокируется после 5:00</p>
      </div>
    </div>
  );
}

function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[100dvh] w-full max-w-[390px] mx-auto text-primary relative overflow-hidden flex flex-col" style={APP_BG}>
      <AppLogic />
      <TopBar />
      <div className="flex-1 overflow-y-auto relative z-10">{children}</div>
      <OnboardingTutorial />
      <CoachingBubble />
      <NavBar />
      <InstallPrompt />
      <DevResetButton />
      <DayDoneOverlay />
    </div>
  );
}

function FullscreenLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[100dvh] w-full max-w-[390px] mx-auto text-primary relative overflow-hidden flex flex-col" style={APP_BG}>
      <div className="flex-1 overflow-hidden relative z-10">{children}</div>
      <DayDoneOverlay />
    </div>
  );
}

function Router() {
  const [location] = useLocation();
  const isFullscreen =
    location.startsWith('/onboarding/email') ||
    location.startsWith('/technique/') ||
    location === '/privacy-policy' ||
    location === '/my-progress' ||
    location.includes('/read');
  const Layout = isFullscreen ? FullscreenLayout : AppLayout;
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/onboarding/email" component={EmailScreen} />
        <Route path="/path" component={Path} />
        <Route path="/techniques" component={Techniques} />
        <Route path="/academy" component={Academy} />
        <Route path="/goals" component={Goals} />
        <Route path="/history" component={History} />
        <Route path="/streak" component={Streak} />
        <Route path="/keys-stats" component={KeysStats} />
        <Route path="/potential-stats" component={PotentialStats} />
        <Route path="/settings" component={Settings} />
        <Route path="/notifications" component={Notifications} />
        <Route path="/article/:id/read" component={ArticleRead} />
        <Route path="/article/:id" component={ArticlePreview} />
        <Route path="/news/:id" component={NewsArticle} />
        <Route path="/consultation" component={Consultation} />
        <Route path="/mentoring" component={Mentoring} />
        <Route path="/technique/planner" component={Planner} />
        <Route path="/technique/visualization" component={Visualization} />
        <Route path="/technique/meditation" component={Meditation} />
        <Route path="/technique/walk" component={Walk} />
        <Route path="/technique/hobby" component={Hobby} />
        <Route path="/technique/sleep" component={Sleep} />
        <Route path="/privacy-policy" component={PrivacyPolicy} />
        <Route path="/my-progress" component={MyProgress} />
        <Route>
          <div className="p-4 pt-16 text-center body text-secondary">Экран не найден</div>
        </Route>
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AppProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
        </AppProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
