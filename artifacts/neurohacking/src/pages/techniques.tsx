import { useLocation } from "wouter";
import { useAppStore } from "@/lib/store";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { TechniqueArtwork, type TechniqueArtworkKind } from "@/components/TechniqueArtwork";

type Technique = {
  id: string;
  title: string;
  artwork: TechniqueArtworkKind;
  route: string | null;
  color: string;
  dayKey?: 'T1' | 'T2' | 'T3' | 'T4' | 'T5' | 'T6';
  repeatable: boolean;
};

const TECHNIQUES: Technique[] = [
  {
    id: 'T1', title: 'Планер', artwork: 'planner', route: '/technique/planner', dayKey: 'T1',
    color: '#F59E0B',
    repeatable: false,
  },
  {
    id: 'T2', title: 'Нейровизуализация', artwork: 'visualization', route: '/technique/visualization', dayKey: 'T2',
    color: '#C084FC',
    repeatable: true,
  },
  {
    id: 'T3', title: 'Нейромедитация', artwork: 'meditation', route: '/technique/meditation', dayKey: 'T3',
    color: '#06B6D4',
    repeatable: true,
  },
  {
    id: 'T4', title: 'Прогулка', artwork: 'walk', route: '/technique/walk', dayKey: 'T4',
    color: '#22C55E',
    repeatable: true,
  },
  {
    id: 'T5', title: 'Хобби', artwork: 'hobby', route: '/technique/hobby', dayKey: 'T5',
    color: '#F43F5E',
    repeatable: true,
  },
  {
    id: 'T6', title: 'Сон', artwork: 'sleep', route: '/technique/sleep', dayKey: 'T6',
    color: '#3B82F6',
    repeatable: false,
  },
  {
    id: 'T7', title: 'Память', artwork: 'memory', route: '/technique/memory',
    color: '#F97316',
    repeatable: true,
  },
  {
    id: 'T8', title: 'Концентрация', artwork: 'concentration', route: null,
    color: '#A78BFA',
    repeatable: false,
  },
];

export default function Techniques() {
  const { userState, todayTechniques, onboardingHighlight } = useAppStore();
  const [, setLocation] = useLocation();

  const isOnboarding = userState === 'onboarding';
  const hasHighlight = isOnboarding && onboardingHighlight.length > 0;
  const doneCount = TECHNIQUES.filter(t => t.dayKey && todayTechniques[t.dayKey]).length;

  const handleTap = (technique: Technique, isDone: boolean) => {
    if (userState === 'new') return;
    if (isOnboarding) return;
    if (!technique.route) return;
    if (isDone && !technique.repeatable) return;
    setLocation(technique.route);
  };

  return (
    <div className="pt-[56px] px-4 pb-24">

      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="mb-7 flex items-center justify-between"
      >
        <p className="text-tertiary uppercase tracking-[0.12em]" style={{ fontSize: 14, fontWeight: 500 }}>Техники дня</p>
        <span className="num tabular-nums" style={{ fontSize: 13, color: doneCount === 6 ? '#22C55E' : 'var(--text-secondary)' }}>
          {doneCount} / {TECHNIQUES.length}
        </span>
      </motion.div>

      <div className="grid grid-cols-2 gap-x-3 gap-y-5">
        {TECHNIQUES.map((t, idx) => {
          const isDone        = Boolean(t.dayKey && todayTechniques[t.dayKey]);
          const isHighlighted = hasHighlight && onboardingHighlight.includes(t.id);
          const isDimmed      = hasHighlight && !onboardingHighlight.includes(t.id);

          return (
            <motion.button
              key={t.id}
              type="button"
              disabled={!t.route}
              initial={{ opacity: 0, y: 24 }}
              animate={isDimmed
                ? { opacity: 0.24, y: 0 }
                : { opacity: 1, y: 0 }
              }
              transition={{ delay: isOnboarding ? 0 : idx * 0.08, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              whileTap={isOnboarding || isDone || !t.route ? {} : { scale: 0.97 }}
              onClick={() => handleTap(t, isDone)}
              aria-label={t.title}
              className="group relative flex min-h-[188px] flex-col items-center justify-center overflow-visible rounded-[24px] px-1 py-2 text-center outline-none focus-visible:ring-1 focus-visible:ring-white/40 disabled:cursor-default"
              style={{
                cursor: t.route && !isDone ? 'pointer' : 'default',
              }}
            >
              {isHighlighted && (
                <motion.span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-2 rounded-[28px] border border-white/25"
                  animate={{ opacity: [0.25, 0.8, 0.25], scale: [0.96, 1.03, 0.96] }}
                  transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
                />
              )}
              <TechniqueArtwork kind={t.artwork} color={t.color} done={isDone} highlighted={isHighlighted} />
              <h3
                className="max-w-full px-1 text-primary leading-tight"
                style={{ fontSize: 12, fontWeight: 400, letterSpacing: '0.02em', opacity: isDone ? 0.58 : 0.88, wordBreak: 'break-word' }}
              >
                {t.title}
              </h3>
            </motion.button>
          );
        })}
      </div>

      {doneCount === 6 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="mt-4 rounded-[16px] p-4 flex items-center gap-3"
          style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)' }}
        >
          <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
            style={{ background: 'rgba(34,197,94,0.15)' }}>
            <Check size={16} color="#22C55E" />
          </div>
          <p className="body-s" style={{ color: '#22C55E' }}>
            Все техники дня выполнены — день засчитан!
          </p>
        </motion.div>
      )}
    </div>
  );
}
