import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { useAppStore, getTodayKeysFromSource, computeStreakUpdate } from "@/lib/store";
import { TechniqueIntroPanel } from "@/components/TechniqueIntroPanel";
import { MaximInfoModal } from "@/components/MaximInfoModal";
import { ScreenTransition } from "@/components/ScreenTransition";
import { BackButton } from "@/components/BackButton";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Plus, X, Clock, Pause, Play, Target, ChevronLeft } from "lucide-react";

function fmtDur(min: number) {
  if (min < 60) return `${min} мин`;
  if (min % 60 === 0) return `${min / 60} ч`;
  return `${Math.floor(min / 60)} ч ${min % 60} мин`;
}

function fmtSec(s: number) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  if (m < 60) return `${m}:${sec.toString().padStart(2,'0')}`;
  const h = Math.floor(m / 60);
  return `${h}:${(m % 60).toString().padStart(2,'0')}:${sec.toString().padStart(2,'0')}`;
}

const DURATION_OPTIONS = [
  { label: "10 мин",  minutes: 10,  keys: 3,   potential: 0.03 },
  { label: "15 мин",  minutes: 15,  keys: 5,   potential: 0.05 },
  { label: "30 мин",  minutes: 30,  keys: 10,  potential: 0.10 },
  { label: "1 ч",     minutes: 60,  keys: 20,  potential: 0.15 },
  { label: "1.5 ч",   minutes: 90,  keys: 30,  potential: 0.20 },
  { label: "2 ч",     minutes: 120, keys: 40,  potential: 0.25 },
  { label: "2.5 ч",   minutes: 150, keys: 50,  potential: 0.30 },
  { label: "3 ч",     minutes: 180, keys: 60,  potential: 0.35 },
  { label: "3.5 ч",   minutes: 210, keys: 70,  potential: 0.40 },
  { label: "4 ч",     minutes: 240, keys: 80,  potential: 0.45 },
  { label: "4.5 ч",   minutes: 270, keys: 90,  potential: 0.50 },
  { label: "5 ч",     minutes: 300, keys: 100, potential: 0.55 },
  { label: "5.5 ч",   minutes: 330, keys: 110, potential: 0.60 },
  { label: "6 ч",     minutes: 360, keys: 120, potential: 0.65 },
  { label: "6.5 ч",   minutes: 390, keys: 130, potential: 0.70 },
  { label: "7 ч",     minutes: 420, keys: 140, potential: 0.75 },
  { label: "7.5 ч",   minutes: 450, keys: 150, potential: 0.80 },
  { label: "8 ч",     minutes: 480, keys: 160, potential: 0.85 },
];

const SOURCE = 'Техника: Планер';
const MAX_ACTIVE_TASKS = 3;

type ActiveTask = {
  taskId: string;
  text: string;
  totalSeconds: number;
  estimatedMinutes: number;
  startedAt: number;
};

type CompletionResult = {
  taskText: string;
  predictedSec: number;
  actualSec: number;
  keysEarned: number;
  potentialEarned: number;
  accuracyPercent: number;
};

function getBaseReward(actualMinutes: number): { keys: number; potential: number } {
  if (actualMinutes <= 0) return { keys: 0, potential: 0 };
  const first = DURATION_OPTIONS[0];
  const last = DURATION_OPTIONS[DURATION_OPTIONS.length - 1];
  if (actualMinutes < first.minutes) {
    const ratio = actualMinutes / first.minutes;
    return { keys: first.keys * ratio, potential: first.potential * ratio };
  }
  if (actualMinutes >= last.minutes) return { keys: last.keys, potential: last.potential };
  for (let i = 0; i < DURATION_OPTIONS.length - 1; i++) {
    const lo = DURATION_OPTIONS[i];
    const hi = DURATION_OPTIONS[i + 1];
    if (actualMinutes >= lo.minutes && actualMinutes < hi.minutes) {
      const t = (actualMinutes - lo.minutes) / (hi.minutes - lo.minutes);
      return { keys: lo.keys + (hi.keys - lo.keys) * t, potential: lo.potential + (hi.potential - lo.potential) * t };
    }
  }
  return { keys: 0, potential: 0 };
}

function calculateT1Reward(actualMinutes: number, estimatedMinutes: number): { keys: number; potential: number; accuracyPercent: number } {
  if (actualMinutes < estimatedMinutes * 0.3) return { keys: 0, potential: 0, accuracyPercent: 0 };
  const deviation = Math.abs(actualMinutes - estimatedMinutes) / Math.max(actualMinutes, estimatedMinutes);
  const accuracyPercent = Math.exp(-1.5 * deviation * deviation);
  const actualForCalc = Math.min(actualMinutes, estimatedMinutes);
  const base = getBaseReward(actualForCalc);
  return { keys: Math.floor(base.keys * accuracyPercent), potential: Math.round(base.potential * accuracyPercent * 100) / 100, accuracyPercent };
}

function getAccuracyLabel(actualMin: number, estimatedMin: number): { text: string; color: string } {
  if (actualMin < estimatedMin * 0.3) return { text: '', color: '#EF4444' };
  const deviation = Math.abs(actualMin - estimatedMin) / Math.max(actualMin, estimatedMin);
  const pct = Math.exp(-1.5 * deviation * deviation);
  if (pct >= 0.97) return { text: '', color: '#22C55E' };
  if (pct >= 0.88) return { text: '', color: '#22C55E' };
  if (pct >= 0.70) return { text: '', color: '#F59E0B' };
  if (pct >= 0.50) return { text: '', color: '#F97316' };
  return { text: '', color: '#EF4444' };
}

export default function Planner() {
  const { goals, plannerTasks, updateState, timerWarningShown } = useAppStore();
  const [, setLocation] = useLocation();

  const [showForm, setShowForm] = useState(false);
  const [taskText, setTaskText] = useState("");
  const [selectedGoalId, setSelectedGoalId] = useState("");
  const [selectedDuration, setSelectedDuration] = useState<typeof DURATION_OPTIONS[0] | null>(null);

  const [activeTask, setActiveTask] = useState<ActiveTask | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [paused, setPaused] = useState(false);
  const [completionResult, setCompletionResult] = useState<CompletionResult | null>(null);
  const [showTimerWarning, setShowTimerWarning] = useState(false);
  const pendingTaskRef = useRef<typeof plannerTasks[0] | null>(null);

  const completedRef = useRef(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const pausedRef = useRef(paused);
  pausedRef.current = paused;
  const activeRef = useRef(activeTask);
  activeRef.current = activeTask;

  const activeGoals = goals.filter(g => g.status === 'active');
  const activeTasks = plannerTasks.filter(t => !t.completed);
  const canAddTask = activeTasks.length < MAX_ACTIVE_TASKS;

  const clearTimer = useCallback(() => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
  }, []);

  const doComplete = useCallback((elapsedSec: number) => {
    const task = activeRef.current;
    if (!task || completedRef.current) return;
    completedRef.current = true;
    clearTimer();

    const actualMinutes = elapsedSec / 60;
    const { keys: keysEarned, potential: potentialEarned, accuracyPercent } =
      calculateT1Reward(actualMinutes, task.estimatedMinutes);

    const now = new Date().toISOString();
    updateState(prev => {
      const streakUpdate = computeStreakUpdate(prev);
      return {
        plannerTasks: prev.plannerTasks.map(t => t.id === task.taskId ? { ...t, completed: true } : t),
        keys: prev.keys + keysEarned,
        potential: potentialEarned > 0 ? Math.min(100, prev.potential + potentialEarned) : prev.potential,
        todayTechniques: { ...prev.todayTechniques, T1: prev.todayTechniques.T1 || keysEarned >= 1 },
        keysHistory: keysEarned > 0
          ? [{ date: now, source: SOURCE, amount: keysEarned, type: 'earn' as const }, ...prev.keysHistory]
          : prev.keysHistory,
        potentialHistory: potentialEarned > 0
          ? [{ date: now, source: SOURCE, amount: potentialEarned }, ...prev.potentialHistory]
          : prev.potentialHistory,
        activityLog: [
          { id: `act_${Date.now()}`, date: now, type: 'planner' as const, keysGained: keysEarned, potentialGained: potentialEarned, details: { taskText: task.text, durationMin: task.estimatedMinutes, durationLabel: DURATION_OPTIONS.find(d => d.minutes === task.estimatedMinutes)?.label ?? fmtDur(task.estimatedMinutes) } },
          ...prev.activityLog,
        ],
        ...streakUpdate,
      };
    });
    setCompletionResult({ taskText: task.text, predictedSec: task.totalSeconds, actualSec: elapsedSec, keysEarned, potentialEarned, accuracyPercent });
    setActiveTask(null);
    setElapsed(0);
  }, [clearTimer, updateState]);

  const doStartTask = (task: typeof plannerTasks[0]) => {
    completedRef.current = false;
    setActiveTask({ taskId: task.id, text: task.text, totalSeconds: task.durationMin * 60, estimatedMinutes: task.durationMin, startedAt: Date.now() });
    setElapsed(0);
    setPaused(false);
  };

  const startTask = (task: typeof plannerTasks[0]) => {
    if (!timerWarningShown) {
      pendingTaskRef.current = task;
      setShowTimerWarning(true);
    } else {
      doStartTask(task);
    }
  };

  const handleTimerWarningClose = () => {
    setShowTimerWarning(false);
    updateState({ timerWarningShown: true });
    if (pendingTaskRef.current) {
      doStartTask(pendingTaskRef.current);
      pendingTaskRef.current = null;
    }
  };

  useEffect(() => {
    if (!activeTask) return;
    intervalRef.current = setInterval(() => {
      if (pausedRef.current) return;
      setElapsed(e => {
        const next = e + 1;
        if (next >= activeRef.current!.totalSeconds) { doComplete(next); return next; }
        return next;
      });
    }, 1000);
    return clearTimer;
  }, [activeTask?.taskId, doComplete, clearTimer]);

  const handleAddTask = () => {
    if (!taskText.trim() || !selectedGoalId || !selectedDuration) return;
    if (!canAddTask) return;
    const id = `task_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    updateState(prev => ({
      plannerTasks: [...prev.plannerTasks, { id, goalId: selectedGoalId, text: taskText.trim(), durationMin: selectedDuration.minutes, completed: false, createdAt: new Date().toISOString() }],
    }));
    setTaskText(""); setSelectedGoalId(""); setSelectedDuration(null); setShowForm(false);
  };

  if (completionResult) {
    const { taskText: ct, predictedSec, actualSec, keysEarned, potentialEarned, accuracyPercent } = completionResult;
    const accuracyLabel = getAccuracyLabel(actualSec / 60, predictedSec / 60);
    const pctDisplay = Math.round(accuracyPercent * 100);
    return (
      <div className="flex flex-col h-[100dvh] items-center justify-center px-6 relative overflow-hidden">
        <div className="relative z-10 w-full max-w-[360px]">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{ background: 'rgba(34,197,94,0.15)', border: '2px solid rgba(34,197,94,0.3)' }}>
            <Target size={32} color="#22C55E" />
          </div>
          <h2 className="title-l text-primary text-center mb-1">Задача завершена</h2>
          <p className="body-s text-secondary text-center mb-8 line-clamp-2">{ct}</p>
          <div className="rounded-[18px] p-5 mb-3"
            style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.22) 0%, rgba(245,158,11,0.08) 100%)', border: '1px solid rgba(245,158,11,0.28)', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
            <div className="flex justify-between items-end mb-4">
              <div>
                <p className="body-s mb-1" style={{ color: '#F59E0B', fontWeight: 600 }}>Предсказал</p>
                <p className="num text-primary" style={{ fontSize: 32, fontWeight: 300, color: '#FDE68A' }}>{fmtSec(predictedSec)}</p>
              </div>
              <div className="text-right">
                <p className="body-s mb-1" style={{ color: '#F59E0B', fontWeight: 600 }}>Потратил</p>
                <p className="num text-primary" style={{ fontSize: 32, fontWeight: 300, color: '#FDE68A' }}>{fmtSec(actualSec)}</p>
              </div>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden mb-2" style={{ background: 'rgba(255,255,255,0.08)' }}>
              <div className="h-full rounded-full transition-all" style={{ width: `${pctDisplay}%`, background: accuracyLabel.color }} />
            </div>
            <div className="flex justify-between items-center">
              <span className="caption" style={{ color: accuracyLabel.color }}>{accuracyLabel.text}</span>
              <span className="caption text-secondary">{pctDisplay}%</span>
            </div>
          </div>
          <div className="rounded-[14px] p-4 mb-4 flex justify-between items-center"
            style={{ background: 'rgba(34,197,94,0.07)', border: '1px solid rgba(34,197,94,0.2)' }}>
            <div className="text-center flex-1">
              <p className="caption text-tertiary mb-0.5">Ключей</p>
              <p className="num" style={{ color: '#22C55E', fontSize: 24, fontWeight: 600 }}>+{keysEarned}</p>
            </div>
            {potentialEarned > 0 && (
              <>
                <div className="w-px h-8 bg-border mx-3" />
                <div className="text-center flex-1">
                  <p className="caption text-tertiary mb-0.5">Потенциал</p>
                  <p className="num" style={{ color: '#60A5FA', fontSize: 24, fontWeight: 600 }}>+{potentialEarned.toFixed(2)}%</p>
                </div>
              </>
            )}
          </div>
          <button onClick={() => setCompletionResult(null)} className="btn-grad btn-shimmer w-full h-[52px] rounded-[14px] title-s text-white">
            Продолжить
          </button>
        </div>
        <MaximInfoModal show={showTimerWarning} message={"Из-за технических ограничений таймер в приложении не работает фоном, пожалуйста, не закрывай приложение."} onClose={handleTimerWarningClose} />
      </div>
    );
  }

  if (activeTask) {
    const predicted = activeTask.totalSeconds;
    const progress = Math.min(1, elapsed / predicted);
    return (
      <div className="flex flex-col h-[100dvh] items-center justify-center relative overflow-hidden">
        <div className="relative z-10 flex flex-col items-center w-full px-8">
          <h2 className="title-s text-secondary mb-0.5 text-center">{activeTask.text}</h2>
          <p className="body-s mb-4" style={{ color: '#F59E0B', fontWeight: 600 }}>Предсказание: {fmtSec(predicted)}</p>
          {paused && (
            <div className="mb-4 px-4 py-2 rounded-[10px]" style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)' }}>
              <span className="caption" style={{ color: '#F59E0B' }}>Пауза</span>
            </div>
          )}
          <div className="w-52 h-52 relative mb-2">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 208 208">
              <circle cx="104" cy="104" r="96" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="6" />
              <circle cx="104" cy="104" r="96" fill="none" stroke="url(#plannerGrad)" strokeWidth="6" strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 96}`}
                strokeDashoffset={`${2 * Math.PI * 96 * (1 - progress)}`}
                style={{ transition: 'stroke-dashoffset 1s linear' }} />
              <defs>
                <linearGradient id="plannerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#FDE68A" />
                  <stop offset="100%" stopColor="#F59E0B" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="display-l text-primary num" style={{ fontSize: 52, fontWeight: 300, letterSpacing: '-0.03em' }}>{fmtSec(elapsed)}</span>
              <span className="caption text-tertiary mt-0.5">прошло</span>
            </div>
          </div>
          <div className="flex items-center gap-3 mb-6">
            <button onClick={() => setPaused(p => !p)}
              className="w-14 h-14 rounded-[10px] flex items-center justify-center active:opacity-70"
              style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.22) 0%, rgba(245,158,11,0.08) 100%)', border: '1px solid rgba(245,158,11,0.35)', color: 'rgba(255,255,255,0.9)' }}>
              {paused ? <Play size={22} className="ml-1" style={{ color: '#FDE68A' }} /> : <Pause size={22} style={{ color: '#FDE68A' }} />}
            </button>
            <button onClick={() => doComplete(elapsed)}
              className="h-[52px] px-8 rounded-[14px] title-s flex items-center justify-center gap-2"
              style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.22) 0%, rgba(245,158,11,0.08) 100%)', border: '1px solid rgba(245,158,11,0.35)', color: 'rgba(255,255,255,0.9)' }}>
              Готово
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (showForm) {
    return (
      <ScreenTransition className="pt-[56px] px-4 pb-24">
        <div className="flex items-center gap-3 mt-4 mb-8">
          <button onClick={() => setShowForm(false)} className="p-1 text-tertiary"><X size={24} /></button>
          <h1 className="title-l text-primary">Новая задача</h1>
        </div>
        <div className="space-y-5">
          <div>
            <label className="caption text-secondary mb-2 block">Цель</label>
            <div className="space-y-2">
              {activeGoals.map(g => (
                <button key={g.id} onClick={() => setSelectedGoalId(g.id)}
                  className={`w-full text-left p-3 rounded-[12px] border transition-colors ${selectedGoalId === g.id ? 'border-blue-core bg-blue-ultra-soft text-primary' : 'border-border bg-surface-1 text-secondary'} body-s`}>
                  {g.name}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="caption text-secondary mb-2 block">Задача</label>
            <Input placeholder="Что нужно сделать?" value={taskText} onChange={e => setTaskText(e.target.value)}
              className="h-[52px] bg-surface-1 border-border text-primary body" autoFocus />
          </div>
          <div>
            <label className="caption text-secondary mb-2 block">
              Предсказание времени
              <span className="ml-2 text-tertiary" style={{ fontSize: 11, fontWeight: 400 }}>Сколько ты думаешь, займёт эта задача?</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {DURATION_OPTIONS.map(opt => (
                <button key={opt.label} onClick={() => setSelectedDuration(opt)}
                  className="h-[44px] rounded-[10px] transition-all body-s"
                  style={selectedDuration?.minutes === opt.minutes ? {
                    background: 'linear-gradient(135deg, rgba(245,158,11,0.35) 0%, rgba(245,158,11,0.18) 100%)',
                    border: '1.5px solid rgba(245,158,11,0.8)', color: '#FDE68A', fontWeight: 600,
                  } : {
                    background: 'linear-gradient(135deg, rgba(245,158,11,0.12) 0%, rgba(245,158,11,0.04) 100%)',
                    border: '1px solid rgba(245,158,11,0.25)', color: 'var(--text-secondary)',
                  }}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          {selectedDuration && (
            <div className="rounded-[12px] p-3 flex justify-between items-center"
              style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)' }}>
              <span className="caption text-secondary">Максимальная награда</span>
              <div className="flex items-center gap-3">
                <span className="caption" style={{ color: '#F59E0B' }}>+{selectedDuration.keys} ключей</span>
                <span className="caption" style={{ color: '#60A5FA' }}>+{selectedDuration.potential.toFixed(2)}% пот.</span>
              </div>
            </div>
          )}
          {selectedDuration && (
            <div className="rounded-[12px] p-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <p className="caption text-tertiary">Чем точнее предсказание — тем больше ключей. Если потратишь менее 30% от предсказанного — награды нет.</p>
            </div>
          )}
          <button onClick={handleAddTask}
            disabled={!taskText.trim() || !selectedGoalId || !selectedDuration}
            className="btn-grad btn-shimmer w-full h-[52px] rounded-[14px] title-s text-white disabled:opacity-40"
            style={!taskText.trim() || !selectedGoalId || !selectedDuration ? { background: 'var(--bg-surface-2)', boxShadow: 'none' } : {}}>
            Добавить задачу
          </button>
        </div>
        <TechniqueIntroPanel techniqueId="T1" />
        <MaximInfoModal show={showTimerWarning} message={"Из-за технических ограничений таймер в приложении не работает фоном, пожалуйста, не закрывай приложение."} onClose={handleTimerWarningClose} />
      </ScreenTransition>
    );
  }

  return (
    <ScreenTransition className="pt-[56px] px-4 pb-24">
      <BackButton />
      <h1 className="title-l text-primary mt-4 mb-1">Планер</h1>
      <p className="body-s text-secondary mb-6">Активных задач: {activeTasks.length}/{MAX_ACTIVE_TASKS}</p>
      {activeGoals.length === 0 ? (
        <div className="bg-surface-1 border border-border rounded-[16px] p-8 text-center">
          <button onClick={() => setLocation('/techniques')} className="text-tertiary mb-4 inline-flex"><ChevronLeft size={24} /></button>
          <p className="body-s text-secondary mb-4">Сначала создай цель в разделе Путь</p>
          <button onClick={() => setLocation('/goals')}
            className="h-[44px] px-6 rounded-[12px] bg-blue-ultra-soft border border-[rgba(37,99,235,0.2)] text-blue-light body-s active:opacity-70">
            Перейти к целям
          </button>
        </div>
      ) : (
        <>
          {plannerTasks.length === 0 ? (
            <div className="bg-surface-1 border border-border rounded-[16px] p-8 text-center mb-4">
              <p className="body-s text-secondary">Добавь задачу к одной из своих целей</p>
            </div>
          ) : (
            <div className="space-y-3 mb-4">
              {plannerTasks.map(task => {
                const goal = goals.find(g => g.id === task.goalId);
                const opt = DURATION_OPTIONS.find(d => d.minutes === task.durationMin);
                return (
                  <div key={task.id} className={`rounded-[16px] overflow-hidden ${task.completed ? 'opacity-60' : ''}`}
                    style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.14) 0%, rgba(245,158,11,0.05) 100%)', border: task.completed ? '1px solid rgba(34,197,94,0.25)' : '1px solid rgba(245,158,11,0.25)', boxShadow: '0 4px 20px rgba(0,0,0,0.4)' }}>
                    <div className="p-4">
                      <div className="flex items-start gap-3 mb-2">
                        <Checkbox checked={task.completed} disabled className="mt-0.5 data-[state=checked]:bg-success data-[state=checked]:border-success" />
                        <div className={`body-s text-primary flex-1 ${task.completed ? 'opacity-50 line-through' : ''}`}>{task.text}</div>
                      </div>
                      <div className="flex items-center justify-between mt-2 ml-7">
                        <div className="flex items-center gap-3 flex-wrap">
                          {goal && <span className="caption" style={{ color: 'rgba(245,158,11,0.7)' }}>{goal.name}</span>}
                          <span className="flex items-center gap-1 caption text-tertiary">
                            <Clock size={11} />Предсказание: {fmtDur(task.durationMin)}
                          </span>
                          {opt && <span className="caption" style={{ color: 'rgba(96,165,250,0.7)' }}>до +{opt.potential.toFixed(2)}% пот.</span>}
                        </div>
                        {!task.completed && (
                          <button onClick={() => startTask(task)}
                            className="h-[30px] px-3 rounded-[8px] caption active:opacity-70"
                            style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.3) 0%, rgba(245,158,11,0.15) 100%)', border: '1px solid rgba(245,158,11,0.5)', color: '#FDE68A', fontWeight: 600 }}>
                            Старт
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {canAddTask && (
            <button onClick={() => setShowForm(true)}
              className="w-full h-[52px] rounded-[14px] flex items-center justify-center gap-2 body-s active:opacity-70"
              style={{ border: '1px dashed rgba(245,158,11,0.4)', color: 'rgba(245,158,11,0.7)' }}>
              <Plus size={18} />Добавить задачу
            </button>
          )}
          {!canAddTask && (
            <div className="px-4 py-2 rounded-[10px]" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <p className="caption text-tertiary text-center">Максимум активных задач: {MAX_ACTIVE_TASKS}</p>
            </div>
          )}
        </>
      )}
      <MaximInfoModal show={showTimerWarning} message={"Из-за технических ограничений приложение не работает в фоне.\nЧтобы таймер продолжал считать, экран не должен быть заблокирован."} onClose={handleTimerWarningClose} />
    </ScreenTransition>
  );
}
