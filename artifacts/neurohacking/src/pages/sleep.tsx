import { useState } from "react";
import { useLocation } from "wouter";
import { useAppStore } from "@/lib/store";
import { applyLocalCompletion } from "@/lib/store";
import { TechniqueIntroPanel } from "@/components/TechniqueIntroPanel";
import { motion } from "framer-motion";
import { Moon, ChevronLeft, Lock } from "lucide-react";

function getSleepLabel(): string {
  const hour = new Date().getHours();
  if (hour < 22) return "До 22:00 — хороший момент завершить день";
  if (hour < 23) return "22:00–23:00 — заверши день до 23:00";
  return "После 23:00 — день закроется без дополнительного бонуса";
}

function isTooLateForSleep(): boolean {
  const hour = new Date().getHours();
  return hour >= 23 || hour < 5;
}

function isTooEarlyForSleep(): boolean {
  const hour = new Date().getHours();
  return !isTooLateForSleep() && hour < 21;
}

export default function Sleep() {
  const { todayTechniques, updateState, isSignedIn, completeTechnique } = useAppStore();
  const [, setLocation] = useLocation();

  const activeTechniquesCount = Object.values(todayTechniques).filter(Boolean).length;
  const sleepLabel = getSleepLabel();
  const [completedKeys, setCompletedKeys] = useState(0);
  const isDone = todayTechniques.T6;
  const tooEarly = isTooEarlyForSleep();
  const isTooLate = isTooLateForSleep();

  const handleConfirm = async () => {
    if (tooEarly) return;
    const now = new Date();
    const nowISO = now.toISOString();
    if (isSignedIn) {
      try {
          const result = await completeTechnique("T6", {
          sleepTime: nowISO,
          timezoneOffsetMinutes: now.getTimezoneOffset(),
        });
          setCompletedKeys(result.keys);
      } catch {
        window.alert("Не удалось сохранить результат. Проверь соединение и попробуй ещё раз.");
      }
      return;
    }

    let keysAwarded = 0;
    updateState(prev => {
      const updates = applyLocalCompletion(
        prev,
        'T6',
        { sleepTime: now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }) },
        'sleep',
        now,
      );
      const historyRecord = {
        date: nowISO,
        potential: updates.potential ?? prev.potential,
        keys: (updates.keys ?? prev.keys) - prev.keys,
        streak: updates.streak ?? prev.streak,
        techniques: { ...prev.todayTechniques, T6: true },
      };

      keysAwarded = (updates.keys ?? prev.keys) - prev.keys;
      return {
        ...updates,
        history: [historyRecord, ...prev.history],
      };
    });
    setCompletedKeys(keysAwarded);
  };

  if (isDone) {
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
               <span className="title-s text-primary">{completedKeys > 0 ? `+${completedKeys}` : '0'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="body-s text-secondary">Потенциал</span>
              <span className="title-s text-blue">+10%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="body-s text-secondary">Техник выполнено</span>
              <span className="title-s text-primary">{activeTechniquesCount}/6</span>
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
          ) : isTooLate ? (
            <div className="bg-surface-1 border border-border rounded-[16px] p-5 mb-6 text-center">
              <p className="title-s text-primary mb-2">Награда зачисляется только за завершение дня раньше 23:00</p>
              <p className="body-s text-secondary">
                В следующий раз ложись раньше!
              </p>
              <button
                onClick={handleConfirm}
                className="btn-grad btn-shimmer w-full h-[56px] rounded-[14px] text-white title-s mt-6"
              >
                Завершить день
              </button>
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
                   +10% потенциала · ключи за закрытие дня
                </p>
                <p className="body-s text-secondary">{sleepLabel}</p>
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
