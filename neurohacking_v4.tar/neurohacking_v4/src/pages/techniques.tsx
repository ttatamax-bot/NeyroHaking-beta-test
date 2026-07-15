import { useLocation } from "wouter";
import { useAppStore } from "@/lib/store";
import { ClipboardList, Eye, Wind, Footprints, Palette, Moon, Check } from "lucide-react";
import { motion } from "framer-motion";

const TECHNIQUES = [
  {
    id: 'T1', title: 'Планер', desc: 'Задачи к целям',
    icon: ClipboardList, route: '/technique/planner',
    color: '#F59E0B',
    bg: 'linear-gradient(135deg, rgba(245,158,11,0.22) 0%, rgba(245,158,11,0.08) 100%)',
    border: 'rgba(245,158,11,0.28)', glow: 'rgba(245,158,11,0.18)',
  },
  {
    id: 'T2', title: 'Нейровизуализация', desc: 'Визуализируй цели',
    icon: Eye, route: '/technique/visualization',
    color: '#C084FC',
    bg: 'linear-gradient(135deg, rgba(192,132,252,0.22) 0%, rgba(192,132,252,0.08) 100%)',
    border: 'rgba(192,132,252,0.28)', glow: 'rgba(192,132,252,0.18)',
  },
  {
    id: 'T3', title: 'Нейромедитация', desc: 'Квадратное дыхание',
    icon: Wind, route: '/technique/meditation',
    color: '#06B6D4',
    bg: 'linear-gradient(135deg, rgba(6,182,212,0.22) 0%, rgba(6,182,212,0.08) 100%)',
    border: 'rgba(6,182,212,0.28)', glow: 'rgba(6,182,212,0.18)',
  },
  {
    id: 'T4', title: 'Прогулка', desc: 'Мин. 20 минут',
    icon: Footprints, route: '/technique/walk',
    color: '#22C55E',
    bg: 'linear-gradient(135deg, rgba(34,197,94,0.22) 0%, rgba(34,197,94,0.08) 100%)',
    border: 'rgba(34,197,94,0.28)', glow: 'rgba(34,197,94,0.18)',
  },
  {
    id: 'T5', title: 'Хобби', desc: 'Любимое занятие',
    icon: Palette, route: '/technique/hobby',
    color: '#F43F5E',
    bg: 'linear-gradient(135deg, rgba(244,63,94,0.22) 0%, rgba(244,63,94,0.08) 100%)',
    border: 'rgba(244,63,94,0.28)', glow: 'rgba(244,63,94,0.18)',
  },
  {
    id: 'T6', title: 'Сон', desc: 'Завершай день',
    icon: Moon, route: '/technique/sleep',
    color: '#3B82F6',
    bg: 'linear-gradient(135deg, rgba(59,130,246,0.22) 0%, rgba(59,130,246,0.08) 100%)',
    border: 'rgba(59,130,246,0.28)', glow: 'rgba(59,130,246,0.18)',
  },
];

function hexToRgb(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r},${g},${b}`;
}

export default function Techniques() {
  const { userState, todayTechniques, onboardingHighlight } = useAppStore();
  const [, setLocation] = useLocation();

  const isOnboarding = userState === 'onboarding';
  const hasHighlight = isOnboarding && onboardingHighlight.length > 0;
  const doneCount = TECHNIQUES.filter(t => todayTechniques[t.id as keyof typeof todayTechniques]).length;

  const handleTap = (route: string, isDone: boolean) => {
    if (userState === 'new') return;
    if (isOnboarding) return;
    if (isDone) return;
    setLocation(route);
  };

  return (
    <div className="pt-[56px] px-4 pb-24">

      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="flex items-center justify-between mb-4"
      >
        <p className="text-tertiary uppercase tracking-wider" style={{ fontSize: 16, fontWeight: 500, letterSpacing: '0.06em' }}>Техники дня</p>
        <span className="num" style={{ fontSize: 13, color: doneCount === 6 ? '#22C55E' : 'var(--text-secondary)' }}>
          {doneCount} / 6
        </span>
      </motion.div>

      <div className="grid grid-cols-2 gap-3">
        {TECHNIQUES.map((t, idx) => {
          const isDone        = todayTechniques[t.id as keyof typeof todayTechniques];
          const isHighlighted = hasHighlight && onboardingHighlight.includes(t.id);
          const isDimmed      = hasHighlight && !onboardingHighlight.includes(t.id);
          const Icon          = t.icon;

          return (
            <motion.button
              key={t.id}
              initial={{ opacity: 0, y: 70, scale: 0.95 }}
              animate={isDimmed
                ? { opacity: 0.25, y: 0, scale: 1 }
                : { opacity: 1, y: 0, scale: isHighlighted ? 1.03 : 1 }
              }
              transition={{ delay: isOnboarding ? 0 : idx * 0.07, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              whileTap={isOnboarding || isDone ? {} : { scale: 1.04, boxShadow: `0 0 0 2px ${t.border}, 0 0 32px rgba(255,255,255,0.15)` }}
              onClick={() => handleTap(t.route, isDone)}
              className="relative rounded-[20px] p-4 text-left flex flex-col overflow-hidden btn-shimmer"
              style={{
                background: isDone
                  ? t.bg.replace(/0\.22/g, '0.28').replace(/0\.08/g, '0.14')
                  : t.bg,
                border: `1px solid ${isDone ? t.border.replace('0.28','0.45') : t.border}`,
                boxShadow: isHighlighted
                  ? `0 0 0 2px ${t.border}, 0 8px 32px rgba(0,0,0,0.68), 0 1px 0 rgba(255,255,255,0.06) inset`
                  : isDone
                  ? `0 4px 20px ${t.glow}, 0 1px 0 rgba(255,255,255,0.06) inset, 0 8px 32px rgba(0,0,0,0.68)`
                  : `0 8px 32px rgba(0,0,0,0.68), 0 1px 0 rgba(255,255,255,0.04) inset`,
                minHeight: 130,
                cursor: isDone ? 'default' : 'pointer',
              }}
            >

              <div className="w-11 h-11 rounded-[13px] flex items-center justify-center mb-3 relative"
                style={{
                  background: `rgba(${hexToRgb(t.color)}, 0.18)`,
                  border: `2px solid rgba(${hexToRgb(t.color)}, 0.3)`,
                  boxShadow: `0 4px 12px rgba(0,0,0,0.35)`,
                }}>
                <Icon size={20} color={t.color} />
              </div>

              <div className="flex-1">
                <h3 className="text-primary leading-tight mb-1"
                  style={{ fontSize: 15, fontWeight: 700, opacity: isDone ? 0.6 : 1, wordBreak: 'break-word' }}>
                  {t.title}
                </h3>
                <p className="text-secondary leading-snug"
                  style={{ fontSize: 12, opacity: isDone ? 0.5 : 0.7, whiteSpace: 'pre-line' }}>
                  {t.desc}
                </p>
              </div>

              {isDone && (
                <div className="absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center"
                  style={{ background: 'rgba(34,197,94,0.2)', border: '1px solid rgba(34,197,94,0.4)' }}>
                  <Check size={12} color="#22C55E" />
                </div>
              )}
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
            Все техники выполнены — день засчитан!
          </p>
        </motion.div>
      )}
    </div>
  );
}
