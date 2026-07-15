import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { useAppStore, getTodayKeysFromSource, getTodayPotentialFromSource, computeStreakUpdate } from "@/lib/store";
import { TechniqueIntroPanel } from "@/components/TechniqueIntroPanel";
import { MaximInfoModal } from "@/components/MaximInfoModal";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, Pause, Play, Brain } from "lucide-react";

const DURATION_OPTIONS = [
  { label: "3 мин",  seconds: 180,  keys: 5,  potential: 0.05 },
  { label: "5 мин",  seconds: 300,  keys: 10, potential: 0.1  },
  { label: "10 мин", seconds: 600,  keys: 20, potential: 0.15 },
  { label: "15 мин", seconds: 900,  keys: 30, potential: 0.2  },
  { label: "20 мин", seconds: 1200, keys: 40, potential: 0.25 },
];
const MAX_KEYS = 40;
const SOURCE = 'Техника: Нейромедитация';
type Phase = 'inhale' | 'hold1' | 'exhale' | 'hold2';
const PHASES: Phase[] = ['inhale', 'hold1', 'exhale', 'hold2'];
const PHASE_DURATION = 4;
const PHASE_LABELS: Record<Phase, string> = { inhale: 'Вдох', hold1: 'Задержка', exhale: 'Выдох', hold2: 'Задержка' };
const SIDE_LENGTH = 152;
const SIDES = [
  { x1: 4,   y1: 156, x2: 156, y2: 156 },
  { x1: 156, y1: 156, x2: 156, y2: 4   },
  { x1: 156, y1: 4,   x2: 4,   y2: 4   },
  { x1: 4,   y1: 4,   x2: 4,   y2: 156 },
];
const PHASE_COLORS = [
  'radial-gradient(circle, rgba(6,182,212,0.55) 0%, rgba(37,99,235,0.28) 40%, transparent 70%)',
  'radial-gradient(circle, rgba(37,99,235,0.45) 0%, rgba(37,99,235,0.18) 40%, transparent 70%)',
  'radial-gradient(circle, rgba(192,132,252,0.45) 0%, rgba(37,99,235,0.18) 40%, transparent 70%)',
  'radial-gradient(circle, rgba(37,99,235,0.35) 0%, rgba(37,99,235,0.12) 40%, transparent 70%)',
];
const BALL_SCALE: Record<number, { scale: number[], times?: number[] }> = {
  0: { scale: [0.38, 1.0] },
  1: { scale: [1.0, 1.06, 1.0], times: [0, 0.5, 1] },
  2: { scale: [1.0, 0.38] },
  3: { scale: [0.38, 0.33, 0.38], times: [0, 0.5, 1] },
};

export default function Meditation() {
  const { keysHistory, potentialHistory, updateState, timerWarningShown } = useAppStore();
  const [, setLocation] = useLocation();
  const todayEarned = getTodayKeysFromSource(keysHistory, SOURCE);
  const isMaxedOut = todayEarned >= MAX_KEYS;
  const todayPotential = getTodayPotentialFromSource(potentialHistory, SOURCE);

  const [selected, setSelected] = useState<typeof DURATION_OPTIONS[0] | null>(null);
  const [running, setRunning] = useState(false);
  const [paused, setPaused] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [phaseCountdown, setPhaseCountdown] = useState(PHASE_DURATION);
  const [completedKeys, setCompletedKeys] = useState<number | null>(null);
  const [showTimerWarning, setShowTimerWarning] = useState(false);
  const pendingDurRef = useRef<typeof DURATION_OPTIONS[0] | null>(null);

  const completedRef = useRef(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const phaseIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const phaseCountdownRef = useRef<NodeJS.Timeout | null>(null);
  const pausedRef = useRef(paused);
  pausedRef.current = paused;
  const selectedRef = useRef(selected);
  selectedRef.current = selected;

  const clearAll = useCallback(() => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    if (phaseIntervalRef.current) { clearInterval(phaseIntervalRef.current); phaseIntervalRef.current = null; }
    if (phaseCountdownRef.current) { clearInterval(phaseCountdownRef.current); phaseCountdownRef.current = null; }
  }, []);

  const doComplete = useCallback((dur: typeof DURATION_OPTIONS[0]) => {
    if (completedRef.current) return;
    completedRef.current = true;
    clearAll();
    const now = new Date().toISOString();
    updateState(prev => {
      const keysActual = Math.min(dur.keys, Math.max(0, MAX_KEYS - getTodayKeysFromSource(prev.keysHistory, SOURCE)));
      const potActual = Math.max(0, dur.potential - getTodayPotentialFromSource(prev.potentialHistory, SOURCE));
      const streakUpdate = computeStreakUpdate(prev);
      return {
        todayTechniques: { ...prev.todayTechniques, T3: true },
        keys: prev.keys + keysActual,
        potential: potActual > 0 ? Math.min(100, prev.potential + potActual) : prev.potential,
        keysHistory: keysActual > 0
          ? [{ date: now, source: SOURCE, amount: keysActual, type: 'earn' as const }, ...prev.keysHistory]
          : prev.keysHistory,
        potentialHistory: potActual > 0
          ? [{ date: now, source: SOURCE, amount: potActual }, ...prev.potentialHistory]
          : prev.potentialHistory,
        activityLog: [
          { id: `act_${Date.now()}`, date: now, type: 'meditation' as const, keysGained: keysActual, potentialGained: potActual, details: { durationLabel: dur.label } },
          ...prev.activityLog,
        ],
        ...streakUpdate,
      };
    });
    setCompletedKeys(dur.keys);
    setRunning(false);
  }, [clearAll, updateState]);

  const doStart = (dur: typeof DURATION_OPTIONS[0]) => {
    completedRef.current = false;
    setSelected(dur); setTimeLeft(dur.seconds); setPhaseIdx(0);
    setPhaseCountdown(PHASE_DURATION); setPaused(false); setCompletedKeys(null); setRunning(true);
  };

  const startSession = (dur: typeof DURATION_OPTIONS[0]) => {
    if (!timerWarningShown) {
      pendingDurRef.current = dur;
      setShowTimerWarning(true);
    } else {
      doStart(dur);
    }
  };

  const handleTimerWarningClose = () => {
    setShowTimerWarning(false);
    updateState({ timerWarningShown: true });
    if (pendingDurRef.current) {
      doStart(pendingDurRef.current);
      pendingDurRef.current = null;
    }
  };

  const togglePause = () => setPaused(p => !p);
  const exitEarly = () => { clearAll(); setRunning(false); setSelected(null); completedRef.current = false; };

  useEffect(() => {
    if (!running) return;
    intervalRef.current = setInterval(() => {
      if (pausedRef.current) return;
      setTimeLeft(t => { if (t <= 1) { doComplete(selectedRef.current!); return 0; } return t - 1; });
    }, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running, doComplete]);

  useEffect(() => {
    if (!running) return;
    phaseIntervalRef.current = setInterval(() => {
      if (pausedRef.current) return;
      setPhaseIdx(p => (p + 1) % 4); setPhaseCountdown(PHASE_DURATION);
    }, PHASE_DURATION * 1000);
    return () => { if (phaseIntervalRef.current) clearInterval(phaseIntervalRef.current); };
  }, [running]);

  useEffect(() => {
    if (!running) return;
    phaseCountdownRef.current = setInterval(() => {
      if (pausedRef.current) return;
      setPhaseCountdown(p => Math.max(0, p - 1));
    }, 1000);
    return () => { if (phaseCountdownRef.current) clearInterval(phaseCountdownRef.current); };
  }, [running, phaseIdx]);

  const phase = PHASES[phaseIdx];
  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  if (completedKeys !== null) {
    return (
      <div className="flex flex-col h-[100dvh] items-center justify-center relative overflow-hidden">
        <div className="relative z-10 text-center px-8">
          <div className="text-5xl mb-6">✦</div>
          <h1 className="display-l text-primary mb-3">Медитация завершена</h1>
          <p className="body text-secondary mb-8">+{completedKeys} ключей начислено</p>
          {!isMaxedOut && (
            <button onClick={() => { setCompletedKeys(null); setSelected(null); }}
              className="w-full h-[52px] rounded-[14px] btn-grad btn-shimmer text-white title-s mb-3 active:opacity-90">
              Ещё раз
            </button>
          )}
          <button onClick={() => { setLocation('/techniques'); }}
            className="w-full h-[52px] rounded-[14px] bg-surface-1 border border-border text-primary body active:opacity-70">
            Назад к техникам
          </button>
        </div>
      </div>
    );
  }

  if (!running) {
    const remaining = MAX_KEYS - todayEarned;
    return (
      <div className="flex flex-col h-[100dvh] relative overflow-hidden">
        <div className="relative z-10 flex flex-col h-full">
          <div className="flex items-center px-4 pt-6 pb-4">
            <button onClick={() => setLocation('/techniques')} className="p-1 text-tertiary mr-3">
              <ChevronLeft size={28} />
            </button>
            <h1 className="title-l text-primary">Нейромедитация</h1>
          </div>
          {isMaxedOut ? (
            <div className="flex-1 flex flex-col justify-center px-4 text-center">
              <div className="text-4xl mb-4">✓</div>
              <p className="title-s text-primary mb-2">Максимум за сегодня</p>
              <p className="body text-secondary">Ты уже заработал {todayEarned} ключей на медитации сегодня. Максимум — {MAX_KEYS}.</p>
            </div>
          ) : (
            <div className="flex-1 flex flex-col justify-center px-4 overflow-y-auto pb-4">
              {todayEarned > 0 && (
                <div className="mb-6 px-4 py-3 rounded-[12px] bg-blue-ultra-soft border border-[rgba(37,99,235,0.2)]">
                  <p className="caption text-blue-light">Сегодня заработано: {todayEarned} / {MAX_KEYS} ключей. Осталось: {remaining}.</p>
                </div>
              )}
              <p className="body text-secondary mb-8 leading-relaxed">
                Квадратное дыхание: вдох — задержка — выдох — задержка. 4 секунды каждая фаза.
              </p>
              <p className="caption text-tertiary mb-3 uppercase tracking-wider">Длительность</p>
              <div className="space-y-3 mb-5">
                {DURATION_OPTIONS.filter(o => o.keys <= remaining || remaining === MAX_KEYS).map((opt, idx) => (
                  <motion.button key={opt.label}
                    initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.07, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                    whileTap={{ scale: 0.97 }} onClick={() => startSession(opt)}
                    className="w-full h-[56px] rounded-[14px] flex justify-between items-center px-5 active:brightness-110 transition-all btn-shimmer"
                    style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.22) 0%, rgba(245,158,11,0.08) 100%)', border: '1px solid rgba(245,158,11,0.28)', boxShadow: '0 6px 28px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,255,255,0.08), 0 1px 0 rgba(255,255,255,0.07) inset' }}>
                    <span className="title-s text-primary">{opt.label}</span>
                    <div className="flex flex-col items-end gap-0.5">
                      <span className="body-s text-blue-light">+{opt.keys} ключей</span>
                      <span className="caption text-tertiary flex items-center gap-1">+{opt.potential}% <Brain size={11} color="var(--text-tertiary)" /></span>
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>
          )}
        </div>
        <TechniqueIntroPanel techniqueId="T3" />
        <MaximInfoModal
          show={showTimerWarning}
          message={"Из-за технических ограничений приложение не работает в фоне.\nЧтобы таймер продолжал считать, экран не должен быть заблокирован."}
          onClose={handleTimerWarningClose}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[100dvh] items-center justify-center relative overflow-hidden">
      <motion.div animate={{ opacity: paused ? 0.3 : [0.5, 1, 0.5] }}
        transition={{ duration: 8, repeat: paused ? 0 : Infinity, ease: 'easeInOut' }}
        className="absolute inset-0"
        />

      <div className="relative z-10 flex flex-col items-center w-full px-8">
        <div className="mb-3 caption text-tertiary num">{formatTime(timeLeft)}</div>
        {paused && (
          <div className="mb-4 px-4 py-2 rounded-[10px] bg-surface-2 border border-[rgba(245,158,11,0.3)]">
            <span className="caption text-warning">Пауза</span>
          </div>
        )}

        <div className="relative mb-8" style={{ width: 180, height: 180 }}>
          <div style={{ position: 'absolute', top: '50%', left: '50%', width: 220, height: 220, transform: 'translate(-50%, -50%)', pointerEvents: 'none', zIndex: 0 }}>
            <motion.div key={phaseIdx}
              style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: PHASE_COLORS[phaseIdx] }}
              animate={{ scale: BALL_SCALE[phaseIdx].scale } as any}
              transition={{ duration: PHASE_DURATION, ease: 'easeInOut', times: BALL_SCALE[phaseIdx].times, repeat: 0 }} />
          </div>
          <svg width={180} height={180} viewBox="0 0 160 160" style={{ position: 'relative', zIndex: 1 }}>
            <rect x={4} y={4} width={152} height={152} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={2} />
            {SIDES.map((side, i) => {
              const isPast = i < phaseIdx; const isCurrent = i === phaseIdx;
              return (
                <motion.line key={`${i}-${phaseIdx}`} x1={side.x1} y1={side.y1} x2={side.x2} y2={side.y2}
                  stroke={isPast || isCurrent ? '#2563EB' : 'rgba(255,255,255,0.06)'}
                  strokeWidth={isCurrent ? 3 : 2} strokeLinecap="round" strokeDasharray={SIDE_LENGTH}
                  initial={{ strokeDashoffset: isPast ? 0 : SIDE_LENGTH }}
                  animate={{ strokeDashoffset: (isPast || isCurrent) ? 0 : SIDE_LENGTH }}
                  transition={{ duration: isCurrent ? PHASE_DURATION : 0, ease: 'linear' }} />
              );
            })}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ zIndex: 2 }}>
            <AnimatePresence mode="wait">
              <motion.span key={phase} initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.85 }} transition={{ duration: 0.25 }}
                className="title-s text-primary text-center">
                {paused ? '—' : PHASE_LABELS[phase]}
              </motion.span>
            </AnimatePresence>
            {!paused && <span className="caption text-tertiary mt-1 num">{phaseCountdown}с</span>}
          </div>
        </div>

        <div className="flex items-center justify-center">
          <button onClick={togglePause}
            className="w-16 h-16 rounded-full bg-surface-1 border border-border flex items-center justify-center active:opacity-70">
            {paused ? <Play size={26} className="text-primary ml-1" /> : <Pause size={26} className="text-primary" />}
          </button>
        </div>
        <button onClick={exitEarly} className="mt-6 body-s text-tertiary active:opacity-60">
          Выйти без награды
        </button>
      </div>
    </div>
  );
}
