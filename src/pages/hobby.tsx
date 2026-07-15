import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { useAppStore, getTodayKeysFromSource, getTodayPotentialFromSource, computeStreakUpdate } from "@/lib/store";
import { TechniqueIntroPanel } from "@/components/TechniqueIntroPanel";
import { MaximInfoModal } from "@/components/MaximInfoModal";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, Plus, X, Pause, Play, Brain } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

const DURATION_OPTIONS = [
  { label: "30 мин", seconds: 30  * 60, keys: 10, potential: 0.1  },
  { label: "1 ч",    seconds: 60  * 60, keys: 20, potential: 0.15 },
  { label: "2 ч",    seconds: 120 * 60, keys: 40, potential: 0.25 },
  { label: "3 ч",    seconds: 180 * 60, keys: 60, potential: 0.35 },
];

const REMINDER_INTERVALS = [
  { label: '30с',   seconds: 30   },
  { label: '1мин',  seconds: 60   },
  { label: '2мин',  seconds: 120  },
  { label: '5мин',  seconds: 300  },
  { label: '10мин', seconds: 600  },
  { label: '20мин', seconds: 1200 },
  { label: '30мин', seconds: 1800 },
];

const MAX_KEYS = 60;
const SOURCE = 'Техника: Хобби';

export default function Hobby() {
  const { hobbyList, hobbyChallenges, updateState, keysHistory, potentialHistory, todayTechniques, attentionRemindersEnabled, attentionReminderInterval, timerWarningShown } = useAppStore();
  const [, setLocation] = useLocation();

  const todayEarned = getTodayKeysFromSource(keysHistory, SOURCE);
  const isMaxedOut = todayEarned >= MAX_KEYS;

  const [selectedHobby, setSelectedHobby] = useState<string | null>(null);
  const [addingNew, setAddingNew] = useState(false);
  const [newHobbyText, setNewHobbyText] = useState("");
  const [selectedDur, setSelectedDur] = useState<typeof DURATION_OPTIONS[0] | null>(null);
  const [running, setRunning] = useState(false);
  const [paused, setPaused] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [completedKeys, setCompletedKeys] = useState<number | null>(null);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [showTimerWarning, setShowTimerWarning] = useState(false);
  const pendingDurRef = useRef<typeof DURATION_OPTIONS[0] | null>(null);

  const [challengeStep, setChallengeStep] = useState<"setup" | null>(null);
  const [challengeInput, setChallengeInput] = useState("");
  const [challengeQuestion, setChallengeQuestion] = useState(false);
  const pendingSessionRef = useRef<typeof DURATION_OPTIONS[0] | null>(null);

  const completedRef = useRef(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const reminderRef = useRef<NodeJS.Timeout | null>(null);
  const pausedRef = useRef(paused);
  pausedRef.current = paused;
  const durRef = useRef(selectedDur);
  durRef.current = selectedDur;

  const clearTimer = useCallback(() => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
  }, []);

  const clearReminder = useCallback(() => {
    if (reminderRef.current) { clearTimeout(reminderRef.current); reminderRef.current = null; }
  }, []);

  const reminderEnabledRef = useRef(attentionRemindersEnabled);
  reminderEnabledRef.current = attentionRemindersEnabled;
  const reminderIntervalRef = useRef(attentionReminderInterval);
  reminderIntervalRef.current = attentionReminderInterval;

  const finalizeSession = useCallback((dur: typeof DURATION_OPTIONS[0], challengeResult?: 'done' | 'partial' | 'none') => {
    const now = new Date().toISOString();
    const hobbyName = selectedHobby ?? '';
    const activeChallengeText = (hobbyChallenges || {})[hobbyName];
    let challengeBonus = 0;
    if (challengeResult === 'done') challengeBonus = 0.2;
    else if (challengeResult === 'partial') challengeBonus = 0.1;
    updateState(prev => {
      const keysActual = Math.min(dur.keys, Math.max(0, MAX_KEYS - getTodayKeysFromSource(prev.keysHistory, SOURCE)));
      const prevTodayPot = getTodayPotentialFromSource(prev.potentialHistory, SOURCE);
      const potActual = Math.max(0, (dur.potential + challengeBonus) - prevTodayPot);
      const streakUpdate = computeStreakUpdate(prev);
      const updatedChallenges = { ...(prev.hobbyChallenges || {}) };
      if (challengeResult === 'done') {
        delete updatedChallenges[hobbyName];
      }
      return {
        todayTechniques: { ...prev.todayTechniques, T5: true },
        keys: prev.keys + keysActual,
        potential: potActual > 0 ? Math.min(100, prev.potential + potActual) : prev.potential,
        keysHistory: keysActual > 0 ? [{ date: now, source: SOURCE, amount: keysActual, type: 'earn' as const }, ...prev.keysHistory] : prev.keysHistory,
        potentialHistory: potActual > 0 ? [{ date: now, source: SOURCE, amount: potActual }, ...prev.potentialHistory] : prev.potentialHistory,
        hobbyChallenges: updatedChallenges,
        activityLog: [
          { id: `act_${Date.now()}`, date: now, type: 'hobby' as const, keysGained: keysActual, potentialGained: potActual, details: { hobbyName, durationLabel: dur.label, hobbyChallenge: activeChallengeText, challengeResult } },
          ...prev.activityLog,
        ],
        ...streakUpdate,
      };
    });
    setCompletedKeys(dur.keys);
    setChallengeQuestion(false);
    pendingSessionRef.current = null;
  }, [updateState, selectedHobby, hobbyChallenges]);

  const doComplete = useCallback((dur: typeof DURATION_OPTIONS[0]) => {
    if (completedRef.current) return;
    completedRef.current = true;
    clearTimer();
    clearReminder();
    setRunning(false);
    const activeChallengeText = selectedHobby ? (hobbyChallenges || {})[selectedHobby] : undefined;
    if (activeChallengeText) {
      pendingSessionRef.current = dur;
      setChallengeQuestion(true);
    } else {
      finalizeSession(dur);
    }
  }, [clearTimer, clearReminder, selectedHobby, hobbyChallenges, finalizeSession]);

  const answerChallenge = (result: 'done' | 'partial' | 'none') => {
    const dur = pendingSessionRef.current;
    if (!dur) return;
    finalizeSession(dur, result);
  };

  useEffect(() => {
    if (!running) return;
    intervalRef.current = setInterval(() => {
      if (pausedRef.current) return;
      setTimeLeft(t => { if (t <= 1) { doComplete(durRef.current!); return 0; } return t - 1; });
    }, 1000);
    return clearTimer;
  }, [running, doComplete, clearTimer]);

  useEffect(() => {
    clearReminder();
    if (!running || !attentionRemindersEnabled) return;
    let cancelled = false;
    const scheduleNext = () => {
      reminderRef.current = setTimeout(() => {
        if (cancelled) return;
        if (!cancelled) scheduleNext();
      }, reminderIntervalRef.current * 1000);
    };
    scheduleNext();
    return () => { cancelled = true; clearReminder(); };
  }, [running, attentionRemindersEnabled, attentionReminderInterval, clearReminder]);

  const doStartSession = (dur: typeof DURATION_OPTIONS[0]) => {
    completedRef.current = false;
    setSelectedDur(dur);
    setTimeLeft(dur.seconds);
    setPaused(false);
    setRunning(true);
    setShowExitConfirm(false);
  };

  const startSession = (dur: typeof DURATION_OPTIONS[0]) => {
    if (!timerWarningShown) {
      pendingDurRef.current = dur;
      setShowTimerWarning(true);
    } else {
      doStartSession(dur);
    }
  };

  const handleTimerWarningClose = () => {
    setShowTimerWarning(false);
    updateState({ timerWarningShown: true });
    if (pendingDurRef.current) {
      doStartSession(pendingDurRef.current);
      pendingDurRef.current = null;
    }
  };

  const exitEarly = () => {
    clearTimer(); clearReminder();
    setRunning(false); setSelectedDur(null);
    completedRef.current = false; setShowExitConfirm(false);
  };

  const addHobby = () => {
    const t = newHobbyText.trim();
    if (!t) return;
    updateState(prev => ({ hobbyList: [...(prev.hobbyList || []), t] }));
    setNewHobbyText(""); setAddingNew(false);
  };

  const removeHobby = (name: string) => {
    updateState(prev => ({ hobbyList: (prev.hobbyList || []).filter(h => h !== name) }));
    if (selectedHobby === name) setSelectedHobby(null);
  };

  const selectHobbyCard = (name: string) => {
    setSelectedHobby(name);
    const hasChallenge = !!(hobbyChallenges || {})[name];
    setChallengeInput("");
    setChallengeStep(hasChallenge ? null : 'setup');
  };

  const saveChallenge = () => {
    const t = challengeInput.trim();
    if (!t || !selectedHobby) return;
    updateState(prev => ({ hobbyChallenges: { ...(prev.hobbyChallenges || {}), [selectedHobby]: t } }));
    setChallengeInput("");
    setChallengeStep(null);
  };

  const skipChallenge = () => {
    setChallengeInput("");
    setChallengeStep(null);
  };

  const formatTime = (s: number) =>
    `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  const totalSeconds = selectedDur?.seconds ?? 1;
  const progress = running ? 1 - timeLeft / totalSeconds : 0;
  const list = hobbyList || [];

  if (challengeQuestion) {
    const challengeText = selectedHobby ? (hobbyChallenges || {})[selectedHobby] : undefined;
    return (
      <div className="flex flex-col h-[100dvh] items-center justify-center relative overflow-hidden px-8">
        <div className="relative z-10 text-center w-full max-w-[340px]">
          <p className="title-s text-primary mb-2">Стало ли лучше получаться с:</p>
          <p className="body text-secondary mb-8">«{challengeText}»?</p>
          <button onClick={() => answerChallenge('done')}
            className="w-full h-[52px] rounded-[14px] btn-grad btn-shimmer text-white title-s mb-3">
            ✅ Да
          </button>
          <button onClick={() => answerChallenge('partial')}
            className="w-full h-[52px] rounded-[14px] bg-surface-1 border border-border text-primary body mb-3 active:opacity-70">
            🔄 Частично
          </button>
          <button onClick={() => answerChallenge('none')}
            className="w-full h-[52px] rounded-[14px] bg-surface-1 border border-border text-secondary body active:opacity-70">
            ❌ Нет
          </button>
        </div>
      </div>
    );
  }

  if (completedKeys !== null) {
    return (
      <div className="flex flex-col h-[100dvh] items-center justify-center relative overflow-hidden">
        <div className="relative z-10 text-center px-8">
          <div className="text-6xl mb-4">✦</div>
          <h1 className="display-l text-primary mb-2">{selectedHobby}</h1>
          <p className="body text-secondary mb-8">+{completedKeys} ключей начислено</p>
          {!isMaxedOut && (
            <button onClick={() => { setCompletedKeys(null); setSelectedDur(null); completedRef.current = false; }}
              className="w-full h-[52px] rounded-[14px] btn-grad btn-shimmer text-white title-s mb-3">
              Ещё сессию
            </button>
          )}
          <button onClick={() => setLocation('/techniques')}
            className="w-full h-[52px] rounded-[14px] bg-surface-1 border border-border text-primary body active:opacity-70">
            Назад к техникам
          </button>
        </div>
      </div>
    );
  }

  if (running) {
    return (
      <div className="flex flex-col h-[100dvh] items-center justify-center relative overflow-hidden">
        <motion.div animate={{ opacity: paused ? 0.3 : [0.4, 0.9, 0.4] }}
          transition={{ duration: 4, repeat: paused ? 0 : Infinity }}
          className="absolute inset-0"
          style={{ background: 'radial-gradient(circle, rgba(37,99,235,0.1) 0%, transparent 65%)' }} />
        <div className="relative z-10 flex flex-col items-center w-full px-8">
          <h2 className="title-s text-secondary mb-1">{selectedHobby}</h2>
          {selectedHobby && (hobbyChallenges || {})[selectedHobby] && (
            <p className="body-s text-warning mb-2 text-center">
              🎯 Твой вызов: «{(hobbyChallenges || {})[selectedHobby]}»
            </p>
          )}
          {paused && (
            <div className="mb-4 mt-2 px-4 py-2 rounded-[10px] bg-surface-2 border border-[rgba(245,158,11,0.3)]">
              <span className="caption text-warning">Пауза</span>
            </div>
          )}
          <div className="w-52 h-52 relative mb-8 mt-4">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 208 208">
              <circle cx="104" cy="104" r="96" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="4" />
              <circle cx="104" cy="104" r="96" fill="none" stroke="#2563EB" strokeWidth="4" strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 96}`}
                strokeDashoffset={`${2 * Math.PI * 96 * (1 - progress)}`}
                style={{ transition: 'stroke-dashoffset 1s linear' }} />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="display-l text-primary num">{formatTime(timeLeft)}</span>
              <span className="caption text-tertiary mt-1">осталось</span>
            </div>
          </div>
          <button onClick={() => setPaused(p => !p)}
            className="w-14 h-14 rounded-full bg-surface-1 border border-border flex items-center justify-center mb-6 active:opacity-70">
            {paused ? <Play size={22} className="text-primary ml-1" /> : <Pause size={22} className="text-primary" />}
          </button>
          <button onClick={() => setShowExitConfirm(true)} className="body-s text-tertiary active:opacity-60">
            Выйти без награды
          </button>
        </div>
        <AnimatePresence>
          {showExitConfirm && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 flex items-center justify-center px-6"
              style={{ background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(8px)' }}>
              <motion.div initial={{ scale: 0.88, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.88, opacity: 0 }} transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                className="glass rounded-[20px] p-6 w-full max-w-[320px]">
                <h2 className="title-s text-primary mb-2">Выйти без награды?</h2>
                <p className="body-s text-secondary mb-6">Прогресс сессии не будет сохранён. Ключи не начислятся.</p>
                <button onClick={exitEarly}
                  className="w-full h-[48px] rounded-[12px] mb-3"
                  style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.35)', color: '#EF4444' }}>
                  <span className="title-s">Выйти</span>
                </button>
                <button onClick={() => setShowExitConfirm(false)}
                  className="w-full h-[48px] rounded-[12px] bg-surface-1 border border-border text-primary body active:opacity-70">
                  Продолжить
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  if (selectedHobby && challengeStep === 'setup' && !selectedDur) {
    return (
      <div className="flex flex-col h-[100dvh] relative overflow-hidden">
        <div className="relative z-10 flex flex-col h-full">
          <div className="flex items-center px-4 pt-6 pb-4">
            <button onClick={() => { setSelectedHobby(null); setChallengeStep(null); }} className="p-1 text-tertiary mr-3">
              <ChevronLeft size={28} />
            </button>
            <h1 className="title-l text-primary">{selectedHobby}</h1>
          </div>
          <div className="flex-1 flex flex-col justify-center px-4 pb-4">
            <p className="title-s text-primary mb-4">Что у тебя не получается в этом хобби?</p>
            <Input value={challengeInput} onChange={e => setChallengeInput(e.target.value)}
              placeholder="Например: взять аккорд F" autoFocus
              onKeyDown={e => e.key === 'Enter' && saveChallenge()}
              className="h-[48px] bg-surface-1 border-border text-primary body mb-4" />
            <div className="flex gap-2">
              <button onClick={saveChallenge} disabled={!challengeInput.trim()}
                className="flex-1 h-[52px] rounded-[14px] btn-grad btn-shimmer text-white title-s disabled:opacity-40">
                Сохранить
              </button>
              <button onClick={skipChallenge}
                className="h-[52px] px-5 rounded-[14px] bg-surface-1 border border-border text-secondary body active:opacity-70">
                Пропустить
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (selectedHobby && !selectedDur) {
    const remaining = MAX_KEYS - todayEarned;
    const activeChallenge = (hobbyChallenges || {})[selectedHobby];
    return (
      <div className="flex flex-col h-[100dvh] relative overflow-hidden">
        <div className="relative z-10 flex flex-col h-full">
          <div className="flex items-center px-4 pt-6 pb-4">
            <button onClick={() => { setSelectedHobby(null); setChallengeStep(null); }} className="p-1 text-tertiary mr-3">
              <ChevronLeft size={28} />
            </button>
            <h1 className="title-l text-primary">{selectedHobby}</h1>
          </div>
          <div className="flex-1 flex flex-col justify-center px-4 overflow-y-auto pb-4">
            {activeChallenge && (
              <div className="mb-6 px-4 py-3 rounded-[12px]" style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)' }}>
                <p className="caption text-warning">🎯 Твой вызов: «{activeChallenge}»</p>
              </div>
            )}
            {todayEarned > 0 && !isMaxedOut && (
              <div className="mb-6 px-4 py-3 rounded-[12px] bg-blue-ultra-soft border border-[rgba(37,99,235,0.2)]">
                <p className="caption text-blue-light">Сегодня: {todayEarned} / {MAX_KEYS} ключей</p>
              </div>
            )}
            {isMaxedOut ? (
              <div className="text-center">
                <p className="title-s text-primary mb-2">Максимум за сегодня</p>
                <p className="body text-secondary">Ты заработал {MAX_KEYS} ключей на хобби сегодня.</p>
              </div>
            ) : (
              <>
                <p className="caption text-tertiary mb-3 uppercase tracking-wider">Длительность</p>
                <div className="space-y-3 mb-5">
                  {DURATION_OPTIONS.filter(o => o.keys <= remaining || remaining >= MAX_KEYS).map(opt => (
                    <button key={opt.label} onClick={() => startSession(opt)}
                      className="w-full h-[56px] rounded-[14px] flex justify-between items-center px-5 active:brightness-110 transition-all btn-shimmer"
                      style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.22) 0%, rgba(245,158,11,0.08) 100%)', border: '1px solid rgba(245,158,11,0.28)', boxShadow: '0 6px 28px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,255,255,0.08), 0 1px 0 rgba(255,255,255,0.07) inset' }}>
                      <span className="title-s text-primary">{opt.label}</span>
                      <div className="flex flex-col items-end gap-0.5">
                        <span className="body-s text-blue-light">+{opt.keys} ключей</span>
                        <span className="caption text-tertiary flex items-center gap-1">+{opt.potential}% <Brain size={11} color="var(--text-tertiary)" /></span>
                      </div>
                    </button>
                  ))}
                </div>
                <div className="rounded-[14px] p-4" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div className="flex justify-between items-center mb-3">
                    <span className="body-s text-primary">Напоминания во время сессии</span>
                    <Switch checked={attentionRemindersEnabled} onCheckedChange={c => updateState({ attentionRemindersEnabled: c })} className="data-[state=checked]:bg-[#F59E0B] transition-colors" />
                  </div>
                  {attentionRemindersEnabled && (
                    <div className="flex flex-wrap gap-1.5">
                      {REMINDER_INTERVALS.map(opt => (
                        <button key={opt.seconds} onClick={() => updateState({ attentionReminderInterval: opt.seconds })}
                          className="px-2.5 py-1 rounded-[8px] caption transition-all"
                          style={{ background: attentionReminderInterval === opt.seconds ? 'rgba(245,158,11,0.18)' : 'rgba(255,255,255,0.06)', border: attentionReminderInterval === opt.seconds ? '1px solid rgba(245,158,11,0.4)' : '1px solid rgba(255,255,255,0.1)', color: attentionReminderInterval === opt.seconds ? '#F59E0B' : 'var(--text-tertiary)' }}>
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
        <MaximInfoModal show={showTimerWarning} message={"Из-за технических ограничений таймер в приложении не работает фоном, пожалуйста, не закрывай приложение."} onClose={handleTimerWarningClose} />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[100dvh] relative overflow-hidden">
      <div className="relative z-10 flex flex-col h-full">
        <div className="flex items-center px-4 pt-6 pb-4">
          <button onClick={() => setLocation('/techniques')} className="p-1 text-tertiary mr-3">
            <ChevronLeft size={28} />
          </button>
          <h1 className="title-l text-primary">Хобби</h1>
        </div>
        <div className="flex-1 overflow-y-auto px-4 pb-8">
          {list.length === 0 && !addingNew && (
            <p className="body text-secondary mb-6 leading-relaxed">
              Добавь хобби в список — чтение, рисование, музыка, программирование. Каждую сессию выбирай, чем занимаешься.
            </p>
          )}
          <div className="space-y-2 mb-4">
            {list.map(name => {
              const challenge = (hobbyChallenges || {})[name];
              return (
                <motion.div key={name} whileTap={{ scale: 0.98 }}
                  className="flex items-center bg-surface-1 border border-border rounded-[14px] overflow-hidden">
                  <button onClick={() => selectHobbyCard(name)} className="flex-1 min-h-[56px] flex flex-col items-start justify-center px-4 py-2.5 text-left">
                    <span className="title-s text-primary">{name}</span>
                    {challenge ? (
                      <span className="caption text-warning mt-0.5 truncate max-w-[240px]">🎯 {challenge}</span>
                    ) : (
                      <span className="caption text-tertiary mt-0.5">Нет активного вызова</span>
                    )}
                  </button>
                  <button onClick={() => removeHobby(name)}
                    className="w-12 h-[56px] flex items-center justify-center text-tertiary active:opacity-60 shrink-0">
                    <X size={18} />
                  </button>
                </motion.div>
              );
            })}
          </div>
          {addingNew ? (
            <div className="bg-surface-1 border border-border rounded-[14px] p-4">
              <Input value={newHobbyText} onChange={e => setNewHobbyText(e.target.value)}
                placeholder="Название хобби..." autoFocus
                onKeyDown={e => e.key === 'Enter' && addHobby()}
                className="h-[44px] bg-surface-2 border-border text-primary body mb-3" />
              <div className="flex gap-2">
                <button onClick={addHobby} disabled={!newHobbyText.trim()}
                  className="flex-1 h-[40px] rounded-[10px] btn-grad text-white body-s disabled:opacity-40">
                  Добавить
                </button>
                <button onClick={() => { setAddingNew(false); setNewHobbyText(""); }}
                  className="h-[40px] px-4 rounded-[10px] bg-surface-2 border border-border text-secondary body-s active:opacity-70">
                  Отмена
                </button>
              </div>
            </div>
          ) : (
            <button onClick={() => setAddingNew(true)}
              className="w-full h-[52px] rounded-[14px] border border-dashed border-[rgba(37,99,235,0.4)] text-blue-light body-s flex items-center justify-center gap-2 active:opacity-70">
              <Plus size={18} /> Добавить хобби
            </button>
          )}
        </div>
      </div>
      <TechniqueIntroPanel techniqueId="T5" />
    </div>
  );
}
