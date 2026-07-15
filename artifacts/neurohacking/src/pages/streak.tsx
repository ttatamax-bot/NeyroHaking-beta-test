import { useAppStore } from "@/lib/store";
import { ScreenTransition } from "@/components/ScreenTransition";
import { BackButton } from "@/components/BackButton";
import { motion } from "framer-motion";

const MULTIPLIER_TIERS = [
  { min: 0,  max: 6,   bonus: 0,  label: '0–6 дней' },
  { min: 7,  max: 13,  bonus: 5,  label: '7–13 дней' },
  { min: 14, max: 29,  bonus: 10, label: '14–29 дней' },
  { min: 30, max: 59,  bonus: 15, label: '30–59 дней' },
  { min: 60, max: Infinity, bonus: 20, label: '60+ дней' },
];

function getCurrentTierIdx(streak: number): number {
  return MULTIPLIER_TIERS.findIndex(t => streak >= t.min && streak <= t.max);
}

export default function Streak() {
  const { streak, streakHistory } = useAppStore();

  const dots = Array.from({ length: 7 }).map((_, i) => i < Math.min(streak, 7));
  const currentTierIdx = getCurrentTierIdx(streak);
  const currentBonus = MULTIPLIER_TIERS[currentTierIdx]?.bonus ?? 0;

  return (
    <ScreenTransition className="pt-[64px] px-4 pb-24 space-y-6 flex flex-col items-center">
      <BackButton />
      
      <div className="w-full">
        <h1 className="title-l text-primary mb-6">Серия</h1>
      </div>

      <div className="bg-surface-1 border border-border rounded-[24px] p-8 flex flex-col items-center w-full relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4">
          <div className="bg-blue-ultra-soft border border-[rgba(37,99,235,0.2)] rounded-full px-2 py-1">
            <span className="caption text-blue-light">+{currentBonus}% к ключам</span>
          </div>
        </div>
        
        <span className="display-xl text-primary mt-4">{streak}</span>
        <span className="title-s text-secondary mb-6">дней</span>

        <div className="flex gap-2 mb-6">
          {dots.map((active, i) => (
            <div 
              key={i} 
              className={`w-3 h-3 rounded-full ${active ? 'bg-blue-core' : 'bg-surface-2 border border-border'}`}
            />
          ))}
        </div>

        <p className="body-s text-tertiary text-center px-4">
          Серия сохраняется если ты завершил день через технику Сон и выполнил хотя бы одну другую технику.
        </p>
      </div>

      {/* Multiplier Tiers Card */}
      <div className="w-full glass rounded-[20px] overflow-hidden">
        <div className="px-4 pt-4 pb-3" style={{ borderBottom: '1px solid rgba(100,160,230,0.1)' }}>
          <p className="caption text-tertiary uppercase tracking-wider">Бонус серии</p>
        </div>
        <div className="p-4 space-y-2">
          {MULTIPLIER_TIERS.map((tier, i) => {
            const isActive = i === currentTierIdx;
            const isPast = i < currentTierIdx;
            return (
              <motion.div
                key={tier.label}
                animate={isActive ? { scale: [1, 1.02, 1] } : { scale: 1 }}
                transition={{ duration: 0.4, delay: 0.1 }}
                className="flex items-center justify-between rounded-[12px] px-4 py-3 transition-all"
                style={{
                  background: isActive
                    ? 'linear-gradient(135deg, rgba(245,158,11,0.22) 0%, rgba(245,158,11,0.08) 100%)'
                    : isPast
                    ? 'rgba(34,197,94,0.06)'
                    : 'rgba(255,255,255,0.03)',
                  border: isActive
                    ? '1px solid rgba(245,158,11,0.35)'
                    : isPast
                    ? '1px solid rgba(34,197,94,0.18)'
                    : '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <span className={`body-s ${isActive ? 'text-primary' : isPast ? 'text-secondary' : 'text-tertiary'}`}>
                  {tier.label}
                </span>
                <div className="flex items-center gap-2">
                  {isPast && (
                    <span className="caption" style={{ color: '#22C55E' }}>✓</span>
                  )}
                  {isActive && (
                    <span className="caption" style={{ color: '#F59E0B' }}>← ты здесь</span>
                  )}
                  <span
                    className="num"
                    style={{
                      fontSize: 16,
                      fontWeight: 700,
                      color: isActive ? '#F59E0B' : isPast ? '#22C55E' : 'var(--text-tertiary)',
                    }}
                  >
                    {tier.bonus === 0 ? '0%' : `+${tier.bonus}%`}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      <div className="w-full">
        <h2 className="title-s text-primary mb-4">История</h2>
        {streakHistory.length === 0 ? (
          <p className="body-s text-secondary text-center py-4">Последовательность важнее мотивации. Начни с первого дня.</p>
        ) : (
          <div className="space-y-2">
            {streakHistory.map((sh, idx) => (
              <div key={idx} className="bg-surface-1 border border-border rounded-[12px] p-3 flex justify-between items-center">
                <span className="body-s text-secondary">{new Date(sh.date).toLocaleDateString('ru-RU')}</span>
                <span className="body-s text-primary">{sh.value} дней</span>
              </div>
            ))}
          </div>
        )}
      </div>

    </ScreenTransition>
  );
}
