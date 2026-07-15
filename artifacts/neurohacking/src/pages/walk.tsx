import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { useAppStore, getTodayKeysFromSource, computeStreakUpdate } from "@/lib/store";
import { TechniqueIntroPanel } from "@/components/TechniqueIntroPanel";
import { MaximInfoModal } from "@/components/MaximInfoModal";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, Footprints, Brain, AlertCircle } from "lucide-react";

const MIN_STEPS_TO_COMPLETE = 2500;

const STEP_MILESTONES = [
  { steps: 2500,  keys: 10, potential: 0.10 },
  { steps: 5000,  keys: 20, potential: 0.15 },
  { steps: 7500,  keys: 30, potential: 0.20 },
  { steps: 10000, keys: 40, potential: 0.25 },
  { steps: 12500, keys: 50, potential: 0.30 },
  { steps: 15000, keys: 60, potential: 0.35 },
  { steps: 20000, keys: 80, potential: 0.50 },
];

const MAX_KEYS = 80;
const SOURCE = 'Техника: Прогулка с эспандером';

function getRewardForSteps(steps: number) {
  let reward = null;
  for (const m of STEP_MILESTONES) {
    if (steps >= m.steps) reward = m;
    else break;
  }
  return reward;
}

function getNextMilestone(steps: number) {
  for (const m of STEP_MILESTONES) {
    if (steps < m.steps) return m;
  }
  return null;
}

export default function Walk() {
  const { keysHistory, updateState, walkWarningShown } = useAppStore();
  const [, setLocation] = useLocation();

  const todayEarned = getTodayKeysFromSource(keysHistory, SOURCE);
  const isMaxedOut = todayEarned >= MAX_KEYS;

  const [running, setRunning] = useState(false);
  const [steps, setSteps] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [showMinStepsAlert, setShowMinStepsAlert] = useState(false);
  const [showWalkWarning, setShowWalkWarning] = useState(false);

  const lastAccRef = useRef<number>(0);
  const lastStepTimeRef = useRef<number>(Date.now());
  const stepCooldownRef = useRef<boolean>(false);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  const currentReward = getRewardForSteps(steps);
  const nextMilestone = getNextMilestone(steps);

  const acquireWakeLock = useCallback(async () => {
    if (!('wakeLock' in navigator)) return;
    try {
      const lock = await (navigator as any).wakeLock.request('screen');
      wakeLockRef.current = lock;
      lock.addEventListener('release', () => {
        wakeLockRef.current = null;
      });
    } catch {
      // not supported or denied
    }
  }, []);

  const releaseWakeLock = useCallback(() => {
    if (wakeLockRef.current) {
      wakeLockRef.current.release().catch(() => {});
      wakeLockRef.current = null;
    }
  }, []);

  // Re-acquire wake lock when page becomes visible again
  useEffect(() => {
    if (!running) return;
    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && !wakeLockRef.current) {
        acquireWakeLock();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [running, acquireWakeLock]);

  // Show walk warning on first entry to this page
  useEffect(() => {
    if (!walkWarningShown) {
      setShowWalkWarning(true);
    }
  }, []);

  const handleWalkWarningClose = () => {
    setShowWalkWarning(false);
    updateState({ walkWarningShown: true });
  };

  const doComplete = useCallback(() => {
    if (steps < MIN_STEPS_TO_COMPLETE) {
      setShowMinStepsAlert(true);
      setTimeout(() => setShowMinStepsAlert(false), 3500);
      return;
    }

    const reward = getRewardForSteps(steps);
    const now = new Date().toISOString();

    updateState(prev => {
      const keysActual = reward
        ? Math.min(reward.keys, Math.max(0, MAX_KEYS - getTodayKeysFromSource(prev.keysHistory, SOURCE)))
        : 0;
      const streakUpdate = computeStreakUpdate(prev);
      return {
        todayTechniques: { ...prev.todayTechniques, T4: true },
        keys: prev.keys + keysActual,
        potential: reward ? Math.min(100, prev.potential + reward.potential) : prev.potential,
        keysHistory: keysActual > 0
          ? [{ date: now, source: SOURCE, amount: keysActual, type: 'earn' as const }, ...prev.keysHistory]
          : prev.keysHistory,
        potentialHistory: reward
          ? [{ date: now, source: SOURCE, amount: reward.potential }, ...prev.potentialHistory]
          : prev.potentialHistory,
        activityLog: [
          {
            id: `act_${Date.now()}`,
            date: now,
            type: 'walk' as const,
            keysGained: keysActual,
            potentialGained: reward?.potential ?? 0,
            details: { steps },
          },
          ...prev.activityLog,
        ],
        ...streakUpdate,
      };
    });
    setCompleted(true);
    setRunning(false);
    releaseWakeLock();
  }, [updateState, steps, releaseWakeLock]);

  const startSession = async () => {
    setSteps(0);
    setRunning(true);
    setCompleted(false);
    setShowExitConfirm(false);
    lastStepTimeRef.current = Date.now();
    const DeviceMotionEvent_ = DeviceMotionEvent as any;
    if (typeof DeviceMotionEvent_.requestPermission === 'function') {
      try {
        const state = await DeviceMotionEvent_.requestPermission();
        if (state !== 'granted') {
          setRunning(false);
          return;
        }
      } catch {
        // ignore
      }
    }
    await acquireWakeLock();
  };

  const exitEarly = () => {
    setRunning(false);
    setShowExitConfirm(false);
    releaseWakeLock();
  };

  useEffect(() => {
    if (!running) return;
    const handleMotion = (e: DeviceMotionEvent) => {
      const acc = e.accelerationIncludingGravity;
      if (!acc) return;
      const x = acc.x ?? 0;
      const y = acc.y ?? 0;
      const z = acc.z ?? 0;
      const magnitude = Math.sqrt(x * x + y * y + z * z);
      const threshold = 12;
      if (magnitude > threshold && !stepCooldownRef.current) {
        const now = Date.now();
        if (now - lastStepTimeRef.current > 300) {
          setSteps(s => s + 1);
          lastStepTimeRef.current = now;
          stepCooldownRef.current = true;
          setTimeout(() => { stepCooldownRef.current = false; }, 400);
        }
      }
      lastAccRef.current = magnitude;
    };
    const DeviceMotionEvent_ = DeviceMotionEvent as any;
    if (typeof DeviceMotionEvent_.requestPermission === 'function') {
      DeviceMotionEvent_.requestPermission().then((state: string) => {
        if (state === 'granted') window.addEventListener('devicemotion', handleMotion);
      }).catch(() => {});
    } else {
      window.addEventListener('devicemotion', handleMotion);
    }
    return () => window.removeEventListener('devicemotion', handleMotion);
  }, [running]);

  useEffect(() => {
    return () => releaseWakeLock();
  }, [releaseWakeLock]);

  const progressToNext = nextMilestone ? Math.min(1, steps / nextMilestone.steps) : 1;

  if (completed) {
    const reward = getRewardForSteps(steps);
    const keysEarned = reward
      ? Math.min(reward.keys, Math.max(0, MAX_KEYS - (todayEarned - (reward.keys))))
      : 0;
    return (
      <div className="flex flex-col h-[100dvh] items-center justify-center relative overflow-hidden">
        <div className="relative z-10 text-center px-8">
          <div className="text-6xl mb-4">✦</div>
          <h1 className="display-l text-primary mb-3">Прогулка завершена</h1>
          <p className="body text-secondary mb-1 num">{steps} шагов</p>
          {reward ? (
            <>
              <p className="body text-secondary mb-1">+{keysEarned} ключей начислено</p>
              <p className="caption text-tertiary mb-8">+{reward.potential}% потенциал</p>
            </>
          ) : (
            <p className="body-s text-tertiary mb-8">Достигни 2500 шагов для награды</p>
          )}
          {!isMaxedOut && (
            <button onClick={() => { setCompleted(false); setSteps(0); }}
              className="w-full h-[52px] rounded-[14px] btn-grad btn-shimmer text-white title-s mb-3">
              Ещё прогулку
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

  if (!running) {
    const remaining = MAX_KEYS - todayEarned;
    return (
      <div className="flex flex-col h-[100dvh] relative overflow-hidden">
        <div className="relative z-10 flex flex-col h-full">
          <div className="flex items-center px-4 pt-6 pb-4">
            <button onClick={() => setLocation('/techniques')} className="p-1 text-tertiary mr-3">
              <ChevronLeft size={28} />
            </button>
            <h1 className="title-l text-primary">Прогулка с эспандером</h1>
          </div>
          <div className="flex-1 flex flex-col justify-center px-4 overflow-y-auto pb-4">
            {isMaxedOut ? (
              <div className="text-center">
                <p className="title-s text-primary mb-2">Лимит ключей за сегодня</p>
                <p className="body text-secondary">Ты заработал {todayEarned} ключей на прогулках сегодня. Максимум — {MAX_KEYS}.</p>
              </div>
            ) : (
              <>
                {todayEarned > 0 && (
                  <div className="mb-5 px-4 py-3 rounded-[12px] bg-blue-ultra-soft border border-[rgba(37,99,235,0.2)]">
                    <p className="caption text-blue-light">Сегодня: {todayEarned} / {MAX_KEYS} ключей</p>
                  </div>
                )}
                <p className="body text-secondary mb-6 leading-relaxed">
                  Выйди на прогулку с эспандером. Шаги отслеживаются через датчик движения.
                </p>
                <p className="caption text-tertiary mb-3 uppercase tracking-wider">Ступени награды</p>
                <div className="space-y-2 mb-6">
                  {STEP_MILESTONES.filter(m => m.keys <= remaining || remaining >= MAX_KEYS).map(m => (
                    <div key={m.steps}
                      className="flex justify-between items-center px-4 py-3 rounded-[12px]"
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                      <span className="body-s text-primary num">{m.steps.toLocaleString('ru')} шагов</span>
                      <div className="flex items-center gap-3">
                        <span className="caption text-blue-light">+{m.keys} ключей</span>
                        <span className="caption text-tertiary flex items-center gap-1">+{m.potential}% <Brain size={10} color="var(--text-tertiary)" /></span>
                      </div>
                    </div>
                  ))}
                </div>
                <button onClick={startSession}
                  className="w-full h-[56px] rounded-[14px] btn-grad btn-shimmer text-white title-s">
                  Начать прогулку
                </button>
              </>
            )}
          </div>
        </div>
        <TechniqueIntroPanel techniqueId="T4" />
        <MaximInfoModal
          show={showWalkWarning}
          message={"Из-за технических ограничений шагомер не работает фоном, снизь яркость экрана на минимум, и оставь его включенным."}
          onClose={handleWalkWarningClose}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[100dvh] items-center justify-center relative overflow-hidden">
      <motion.div
        animate={{ opacity: [0.4, 0.9, 0.4] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute inset-0"
        style={{ background: 'radial-gradient(circle, rgba(34,197,94,0.1) 0%, transparent 65%)' }}
      />
      <div className="relative z-10 flex flex-col items-center w-full px-8">
        <div className="flex items-center gap-2 mb-3">
          <Footprints size={28} className="text-[#22C55E]" />
          <span className="num text-primary" style={{ fontSize: 64, fontWeight: 300, lineHeight: 1 }}>{steps.toLocaleString('ru')}</span>
        </div>
        <p className="caption text-tertiary mb-8">шагов</p>
        {nextMilestone ? (
          <div className="w-full mb-8">
            <div className="flex justify-between items-center mb-2">
              <span className="caption text-tertiary">До награды</span>
              <span className="caption text-blue-light num">{nextMilestone.steps.toLocaleString('ru')} шагов → +{nextMilestone.keys} ключей</span>
            </div>
            <div className="h-1.5 w-full rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }}>
              <motion.div className="h-full rounded-full" style={{ background: '#22C55E' }}
                animate={{ width: `${progressToNext * 100}%` }}
                transition={{ ease: 'linear', duration: 0.5 }} />
            </div>
          </div>
        ) : (
          <div className="mb-8 px-4 py-2 rounded-[10px]" style={{ background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.3)' }}>
            <span className="caption" style={{ color: '#22C55E' }}>Максимальная награда достигнута!</span>
          </div>
        )}
        {currentReward && (
          <div className="mb-6 px-4 py-2 rounded-[10px]" style={{ background: 'rgba(37,99,235,0.1)', border: '1px solid rgba(37,99,235,0.2)' }}>
            <span className="caption text-blue-light">Текущая награда: +{currentReward.keys} ключей</span>
          </div>
        )}
        {steps < MIN_STEPS_TO_COMPLETE && steps > 0 && (
          <div className="mb-4 px-4 py-2 rounded-[10px]" style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)' }}>
            <span className="caption" style={{ color: '#F59E0B' }}>Ещё {(MIN_STEPS_TO_COMPLETE - steps).toLocaleString('ru')} шагов до завершения</span>
          </div>
        )}
        <div className="flex items-center gap-5 mb-8">
          <motion.button whileTap={{ scale: 0.95 }} onClick={doComplete}
            className="h-[52px] px-8 rounded-[14px] btn-grad btn-shimmer text-white title-s"
            style={{ opacity: steps < MIN_STEPS_TO_COMPLETE ? 0.6 : 1 }}>
            Завершить
          </motion.button>
        </div>
        <button onClick={() => setShowExitConfirm(true)} className="body-s text-tertiary active:opacity-60">
          Выйти без награды
        </button>
      </div>
      <AnimatePresence>
        {showMinStepsAlert && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-28 left-4 right-4 z-50 rounded-[14px] px-4 py-3 flex items-center gap-3"
            style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.4)', backdropFilter: 'blur(8px)' }}>
            <AlertCircle size={18} color="#F59E0B" className="shrink-0" />
            <span className="body-s" style={{ color: '#F59E0B' }}>
              Для завершения прогулки необходимо пройти минимум 2500 шагов
            </span>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showExitConfirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center px-6"
            style={{ background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(8px)' }}>
            <motion.div initial={{ scale: 0.88, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.88, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className="glass rounded-[20px] p-6 w-full max-w-[320px]">
              <h2 className="title-s text-primary mb-2">Выйти без награды?</h2>
              <p className="body-s text-secondary mb-6">Ключи не будут начислены. Продолжи прогулку.</p>
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
