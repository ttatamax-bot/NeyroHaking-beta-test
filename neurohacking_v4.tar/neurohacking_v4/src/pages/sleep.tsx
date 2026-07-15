import { useState } from "react";
import { useLocation } from "wouter";
import { useAppStore, computeStreakUpdate, getTodayKeysFromSource } from "@/lib/store";
import { TechniqueIntroPanel } from "@/components/TechniqueIntroPanel";
import { motion } from "framer-motion";
import { Moon, ChevronLeft, Lock } from "lucide-react";

function getSleepReward(): { keys: number; potential: number; label: string } {
  const hour = new Date().getHours();
  if (hour < 22) return { keys: 30, potential: 0.2, label: "До 22:00 — максимальная награда" };
  if (hour < 23) return { keys: 20, potential: 0.1, label: "22:00–23:00 — стандартная награда" };
  return { keys: 0, potential: 0, label: "После 23:00 — награда не начисляется" };
}

function isTooEarlyForSleep(): boolean {
  return new Date().getHours() < 21;
}

export default function Sleep() {
  const { todayTechniques, updateState } = useAppStore();
  const [, setLocation] = useLocation();
  const [confirmed, setConfirmed] = useState(false);

  const activeTechniquesCount = Object.values(todayTechniques).filter(Boolean).length;
  const reward = getSleepReward();
  const isDone = todayTechniques.T6;
  const tooEarly = isTooEarlyForSleep();

  const handleConfirm = () => {
    if (tooEarly) return;
    const now = new Date();
    const nowISO = now.toISOString();

    updateState(prev => {
      const streakUpdate = computeStreakUpdate(prev);
      const newStreak = (streakUpdate.streak as number | undefined) ?? prev.streak;
      // Hard cap: max 30 keys per day from sleep technique
      const alreadyEarned = getTodayKeysFromSource(prev.keysHistory, 'Техника: Сон');
      const cappedKeys = Math.max(0, Math.min(reward.keys, 30 - alreadyEarned));

      const historyRecord = {
        date: nowISO,
        potential: reward.potential,
        keys: cappedKeys,
        streak: newStreak,
        techniques: { ...prev.todayTechniques, T6: true },
      };

      return {
        todayTechniques: { ...prev.todayTechniques, T6: true },
        keys: prev.keys + cappedKeys,
        potential: reward.potential > 0 ? Math.min(100, prev.potential + reward.potential) : prev.potential,
        userState: 'dayDone' as const,
        history: [historyRecord, ...prev.history],
        keysHistory: cappedKeys > 0
          ? [{ date: nowISO, source: 'Техника: Сон', amount: cappedKeys, type: 'earn' as const }, ...prev.keysHistory]
          : prev.keysHistory,
        potentialHistory: reward.potential > 0
          ? [{ date: nowISO, source: 'Техника: Сон', amount: reward.potential }, ...prev.potentialHistory]
          : prev.potentialHistory,
        activityLog: [
          {
            id: `act_${Date.now()}`,
            date: nowISO,
            type: 'sleep' as const,
            keysGained: cappedKeys,
            potentialGained: reward.potential,
            details: {
              sleepTime: now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
            },
          },
          ...prev.activityLog,
        ],
        streakHistory: [{ date: nowISO, value: newStreak }, ...(prev.streakHistory || [])],
        streak: newStreak,
        lastCompletedDate: nowISO,
      };
    });
    setConfirmed(true);
  };

  if (isDone || confirmed) {
    return (
      <div className="flex flex-col h-[100dvh] items-center justify-center relative overflow-hidden">
        <div className="relative z-10 text-center px-8 w-full max-w-[390px]">
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
            <h1 className="display-l text-primary mb-10">
              День завершён. Продолжай <span className="text-blue">серию</span>.
            </h1>
          </motion.div>

          <div className="bg-surface-1 border border-border rounded-[20px] p-6 flex flex-col gap-4 mb-8">
            <div className="flex justify-between items-center">
              <span className="body-s text-secondary">Ключи</span>
              <span className="title-s text-primary">{reward.keys > 0 ? `+${reward.keys}` : '±0'}</span>
            </div>
            {reward.potential > 0 && (
              <div className="flex justify-between items-center">
                <span className="body-s text-secondary">Потенциал</span>
                <span className="title-s text-blue">+{reward.potential}%</span>
              </div>
            )}
            <div className="flex justify-between items-center">
              <span className="body-s text-secondary">Техник выполнено</span>
              <span className="title-s text-primary">{activeTechniquesCount + (confirmed ? 1 : 0)}/6</span>
            </div>
          </div>

          <p className="caption text-tertiary">Приложение разблокируется после 5:00</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[100dvh] relative overflow-hidden">
      <div className="relative z-10 flex flex-col h-full px-4">
        <div className="flex items-center pt-6 pb-4">
          <button onClick={() => setLocation('/techniques')} className="p-1 text-tertiary mr-3">
            <ChevronLeft size={28} />
          </button>
          <h1 className="title-l text-primary">Сон</h1>
        </div>

        <div className="flex-1 flex flex-col justify-center">
          <div className="flex justify-center mb-8">
            <div className={`w-20 h-20 rounded-full border flex items-center justify-center ${
              tooEarly ? 'bg-surface-1 border-border' : 'bg-surface-1 border-blue-core'
            }`}>
              {tooEarly
                ? <Lock size={32} className="text-tertiary" />
                : <Moon size={36} className="text-blue-light" />
              }
            </div>
          </div>

          {tooEarly ? (
            <div className="bg-surface-1 border border-border rounded-[16px] p-5 mb-6 text-center">
              <p className="title-s text-primary mb-2">Ещё рано ложиться</p>
              <p className="body-s text-secondary">
                Техника Сон доступна с 21:00. Сейчас{' '}
                {new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}.
              </p>
            </div>
          ) : (
            <>
              <div className="bg-surface-1 border border-border rounded-[16px] p-4 mb-4">
                <p className="caption text-tertiary mb-1">Текущее время</p>
                <p className="title-m text-primary">
                  {new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>

              <div className="bg-surface-1 border border-border rounded-[16px] p-4 mb-8">
                <p className="caption text-tertiary mb-1">Награда за завершение</p>
                <p className="title-s text-primary mb-1">
                  {reward.keys > 0 ? `+${reward.keys} ключей · +${reward.potential}% потенциал` : '0 ключей'}
                </p>
                <p className="body-s text-secondary">{reward.label}</p>
              </div>

              <p className="body-s text-secondary text-center mb-8 leading-relaxed">
                После завершения дня техники блокируются до 5:00 утра.
              </p>

              <button
                onClick={handleConfirm}
                className="btn-grad btn-shimmer w-full h-[56px] rounded-[14px] text-white title-s"
              >
                Завершить день
              </button>
            </>
          )}
        </div>
      </div>
      <TechniqueIntroPanel techniqueId="T6" />
    </div>
  );
}
