import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppStore } from "@/lib/store";

const MESSAGES: Record<string, string[]> = {
  T1: [
    "Планер нужен чтобы совершать действия приближающие к цели..",
    "Добавь задачи, привяжи к цели, отмечай их выполнение — это приносит потенциал и ключи.",
    "Работай честно с таймером предсказания, это даст тебе максимальную пользу.",
  ],
  T2: [
    "Нейровизуализация - техника создания опыта успеха.",
    "Отвечай на вопросы максимально ярко и эмоционально.",
    "После вопросов визуализируй события будущей успешной жизни.",
  ],
  T3: [
    "Нейромедитация снижает активность амигдалы и уменьшает кортизол.",
    "Фокусируй все мысли на фазах дыхания.",
    "После ее выполнения разблокируй вторую статью..",
  ],
  T4: [
    "Прогулка — лучший вид отдыха, восстанавливает перегруженную нервную систему.",
    "Активирует DMN сеть мозга, она обрабатывает опыт и бессознательно генерирует инсайты.",
    "Старайся проходить не менее 20 минут каждый день, после прогулки легче войти в режим потока в работе.",
  ],
  T5: [
    "Хобби перестраивают твою систему вознаграждения.",
    "В отличии от телефона в хобби награда приходит после усилий.",
    "Выбери свое хобби. Запусти таймер — и полностью погрузись в процесс.",
  ],
  T6: [
    "Сон — основа для поддержания эффективности.",
    "Без качественного сна все остальные техники работают хуже.",
    "Обязательно прочитай большую статью про сон в Академии.",
  ],
};

export function TechniqueIntroPanel({ techniqueId }: { techniqueId: string }) {
  const { techniquesSeen, updateState } = useAppStore();
  const updateRef = useRef(updateState);
  updateRef.current = updateState;

  const messages = MESSAGES[techniqueId] ?? [];
  const alreadySeen = (techniquesSeen ?? []).includes(techniqueId);

  const [idx, setIdx] = useState(0);
  const [visible, setVisible] = useState(!alreadySeen);

  if (!visible || messages.length === 0) return null;

  const isLast = idx >= messages.length - 1;

  const advance = () => {
    if (isLast) {
      setVisible(false);
      updateRef.current(prev => ({
        techniquesSeen: [...(prev.techniquesSeen ?? []), techniqueId],
      }));
    } else {
      setIdx(i => i + 1);
    }
  };

  return (
    <>
      {/* Full-screen tap catcher — no dark overlay */}
      <div className="fixed inset-0 z-[50] cursor-pointer" onClick={advance} />

      {/* Right-aligned Maxim bubble */}
      <div
        className="fixed left-0 right-0 z-[55] flex justify-end px-4 pointer-events-none"
        style={{ top: '54%' }}
      >
        <div className="flex flex-row-reverse items-end gap-2" style={{ maxWidth: 'min(300px, calc(100% - 8px))' }}>
          <img
            src="/maxim-avatar.png"
            alt="Максим"
            className="w-[44px] h-[44px] rounded-full object-cover shrink-0"
            style={{ boxShadow: '0 0 0 2px #2563EB' }}
          />
          <div className="flex flex-col items-end gap-[3px]">
            <span style={{
              fontSize: 11, fontWeight: 700, color: '#93c5fd',
              letterSpacing: '0.03em', paddingRight: 4,
            }}>
              Татаринов Максим
            </span>
            <AnimatePresence mode="wait">
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.94, y: 6 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.94, y: -6 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="rounded-[16px] rounded-br-[4px] px-4 py-3 text-left"
                style={{
                  background: 'rgba(10,13,26,0.98)',
                  border: '1.5px solid rgba(37,99,235,0.5)',
                  boxShadow: '0 4px 24px rgba(0,0,0,0.6)',
                }}
              >
                <p className="body text-primary leading-snug">{messages[idx]}</p>
              </motion.div>
            </AnimatePresence>
            <span style={{
              fontSize: 11, color: 'rgba(147,197,253,0.45)',
              paddingRight: 6, marginTop: 2,
            }}>
              {isLast ? 'начать →' : 'далее →'}
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
