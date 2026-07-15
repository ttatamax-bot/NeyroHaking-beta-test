import { useState } from "react";
import { useLocation } from "wouter";
import { ChevronLeft } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { motion } from "framer-motion";

function parseDurationMinutes(label: string | undefined): number {
  if (!label) return 0;
  const hourMatch = label.match(/(\d+)\s*ч/);
  const minMatch  = label.match(/(\d+)\s*мин/);
  const hours   = hourMatch  ? parseInt(hourMatch[1])  : 0;
  const minutes = minMatch   ? parseInt(minMatch[1])   : 0;
  return hours * 60 + minutes;
}

function fmtHours(minutes: number): string {
  if (minutes < 60) return `${minutes} мин`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (m === 0) return `${h} ч`;
  return `${h} ч ${m} мин`;
}

type Tab = 'goals' | 'activities';

export default function MyProgress() {
  const [, setLocation] = useLocation();
  const { goals, activityLog } = useAppStore();
  const [tab, setTab] = useState<Tab>('goals');

  const activeAndCompletedGoals = goals.filter(g => g.status !== 'cancelled');

  const goalStats = activeAndCompletedGoals.map(goal => {
    const vizEntries = activityLog.filter(e => e.type === 'visualization' && e.details.goalId === goal.id);
    const vizSessions = vizEntries.length;
    const vizMinutes = vizSessions * 3;

    const plannerEntries = activityLog.filter(e => e.type === 'planner');
    const taskMinutes = plannerEntries.reduce((sum, e) => sum + (e.details.durationMin ?? 0), 0);
    const taskCount = plannerEntries.length;

    return { goal, vizSessions, vizMinutes, taskMinutes, taskCount };
  });

  const walkEntries = activityLog.filter(e => e.type === 'walk');
  const walkMinutes = walkEntries.reduce((sum, e) => sum + parseDurationMinutes(e.details.durationLabel), 0);
  const walkCount   = walkEntries.length;

  const hobbyEntries = activityLog.filter(e => e.type === 'hobby');
  const hobbyMinutes = hobbyEntries.reduce((sum, e) => sum + parseDurationMinutes(e.details.durationLabel), 0);
  const hobbyCount   = hobbyEntries.length;

  const meditEntries = activityLog.filter(e => e.type === 'meditation');
  const meditMinutes = meditEntries.reduce((sum, e) => sum + parseDurationMinutes(e.details.durationLabel), 0);
  const meditCount   = meditEntries.length;

  return (
    <div className="min-h-[100dvh]">
      <div
        className="fixed top-0 left-0 right-0 z-50 flex items-center px-4"
        style={{
          height: 52,
          background: 'rgba(12,24,40,0.92)',
          borderBottom: '1px solid rgba(100,160,230,0.1)',
          backdropFilter: 'blur(12px)',
        }}
      >
        <button
          onClick={() => {
            if (window.history.length > 1) window.history.back();
            else setLocation('/path');
          }}
          className="flex items-center gap-1 text-primary active:opacity-60 mr-4"
        >
          <ChevronLeft size={24} />
        </button>
        <h1 className="title-s text-primary">Мой прогресс</h1>
      </div>

      <div className="pt-[68px] px-4 pb-24">
        <div
          className="flex rounded-[14px] p-1 mb-6"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(100,160,230,0.12)' }}
        >
          {([['goals', 'По целям'], ['activities', 'По активностям']] as const).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className="flex-1 h-[38px] rounded-[10px] transition-all body-s font-medium"
              style={{
                background: tab === key ? 'rgba(37,99,235,0.25)' : 'transparent',
                color: tab === key ? '#fff' : 'var(--text-tertiary)',
                border: tab === key ? '1px solid rgba(37,99,235,0.4)' : '1px solid transparent',
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === 'goals' && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            {goalStats.length === 0 && (
              <div className="glass rounded-[16px] p-6 text-center">
                <p className="body-s text-secondary">Добавь цели в разделе Путь</p>
              </div>
            )}
            {goalStats.map(({ goal, vizSessions, vizMinutes, taskMinutes, taskCount }) => (
              <div key={goal.id} className="glass rounded-[18px] p-4">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <h3 className="title-s text-primary leading-snug">«{goal.name}»</h3>
                  <span
                    className="caption shrink-0"
                    style={{
                      color: goal.status === 'completed' ? '#22C55E' : goal.status === 'cancelled' ? 'var(--text-tertiary)' : 'var(--text-blue)',
                    }}
                  >
                    {goal.status === 'completed' ? 'Выполнена' : goal.status === 'cancelled' ? 'Отменена' : 'Активна'}
                  </span>
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="body-s text-secondary">Визуализаций:</span>
                    <span className="body-s text-primary num">
                      {fmtHours(vizMinutes)} ({vizSessions} {vizSessions === 1 ? 'сессия' : vizSessions < 5 ? 'сессии' : 'сессий'})
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="body-s text-secondary">Задач:</span>
                    <span className="body-s text-primary num">
                      {fmtHours(taskMinutes)} ({taskCount} {taskCount === 1 ? 'задача' : taskCount < 5 ? 'задачи' : 'задач'})
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </motion.div>
        )}

        {tab === 'activities' && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            {[
              {
                label: 'Прогулки',
                minutes: walkMinutes,
                count: walkCount,
                countLabel: (n: number) => `${n} ${n === 1 ? 'прогулка' : n < 5 ? 'прогулки' : 'прогулок'}`,
                color: '#22C55E',
              },
              {
                label: 'Хобби',
                minutes: hobbyMinutes,
                count: hobbyCount,
                countLabel: (n: number) => `${n} ${n === 1 ? 'сессия' : n < 5 ? 'сессии' : 'сессий'}`,
                color: '#F43F5E',
              },
              {
                label: 'Нейромедитации',
                minutes: meditMinutes,
                count: meditCount,
                countLabel: (n: number) => `${n} ${n === 1 ? 'сессия' : n < 5 ? 'сессии' : 'сессий'}`,
                color: '#06B6D4',
              },
            ].map(item => (
              <div key={item.label} className="glass rounded-[18px] p-4">
                <div className="flex justify-between items-center">
                  <h3 className="title-s" style={{ color: item.color }}>{item.label}</h3>
                </div>
                <div className="mt-2 flex justify-between items-end">
                  <span className="body-s text-secondary">{fmtHours(item.minutes)}</span>
                  <span className="body-s text-tertiary">{item.countLabel(item.count)}</span>
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}
