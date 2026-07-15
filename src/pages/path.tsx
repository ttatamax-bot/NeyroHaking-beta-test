import { useLocation } from "wouter";
import { useAppStore } from "@/lib/store";
import { Brain, Key, Flame, Check, ClipboardList, Eye, Wind, Footprints, Palette, Moon, Target, History, ChevronRight, BarChart2 } from "lucide-react";
import { motion } from "framer-motion";

const TECHNIQUES = [
  { id: 'T1', title: 'Планер',          desc: 'Задачи к целям',    icon: ClipboardList, color: '#F59E0B', bg: 'rgba(245,158,11,0.12)',  border: 'rgba(245,158,11,0.25)',  route: '/technique/planner'       },
  { id: 'T2', title: 'Нейровизуал.',    desc: 'Визуализируй цели', icon: Eye,           color: '#C084FC', bg: 'rgba(192,132,252,0.12)',  border: 'rgba(192,132,252,0.25)',  route: '/technique/visualization'  },
  { id: 'T3', title: 'Нейромедит.',     desc: 'Квадратное дыхание',icon: Wind,          color: '#06B6D4', bg: 'rgba(6,182,212,0.12)',   border: 'rgba(6,182,212,0.25)',   route: '/technique/meditation'     },
  { id: 'T4', title: 'Прогулка',        desc: 'Минимум 20 минут',  icon: Footprints,    color: '#22C55E', bg: 'rgba(34,197,94,0.12)',   border: 'rgba(34,197,94,0.25)',   route: '/technique/walk'           },
  { id: 'T5', title: 'Хобби',           desc: 'Любимое занятие',   icon: Palette,       color: '#F43F5E', bg: 'rgba(244,63,94,0.12)',   border: 'rgba(244,63,94,0.25)',   route: '/technique/hobby'          },
  { id: 'T6', title: 'Сон',             desc: 'Завершай день',     icon: Moon,          color: '#3B82F6', bg: 'rgba(59,130,246,0.12)',  border: 'rgba(59,130,246,0.25)',  route: '/technique/sleep'          },
];

const NAV_CARD_STYLE = {
  background: 'linear-gradient(135deg, rgba(245,158,11,0.14) 0%, rgba(245,158,11,0.05) 100%)',
  border: '1px solid rgba(245,158,11,0.30)',
  boxShadow: '0 4px 24px rgba(0,0,0,0.4), 0 1px 0 rgba(255,255,255,0.06) inset',
};

const STAT_CARD_STYLE = {
  background: 'linear-gradient(135deg, rgba(245,158,11,0.14) 0%, rgba(245,158,11,0.05) 100%)',
  border: '1px solid rgba(245,158,11,0.30)',
  boxShadow: '0 4px 24px rgba(0,0,0,0.4), 0 1px 0 rgba(255,255,255,0.06) inset',
};

const CHECKLIST_STYLE = {
  background: 'linear-gradient(135deg, rgba(245,158,11,0.14) 0%, rgba(245,158,11,0.05) 100%)',
  border: '1px solid rgba(245,158,11,0.30)',
  boxShadow: '0 4px 24px rgba(0,0,0,0.4), 0 1px 0 rgba(255,255,255,0.06) inset',
};

const GOLD = '#F59E0B';
const GOLD_D = 'rgba(245,158,11,0.7)';
const GOLD_X = 'rgba(245,158,11,0.8)';
const WHITE = '#ffffff';
const WHITE_D = 'rgba(255,255,255,0.7)';
const WHITE_X = 'rgba(255,255,255,0.8)';

const ICON_COLORS = {
  stat: ['#F59E0B', '#F59E0B', '#F59E0B'] as const,
  nav:  ['#C084FC', '#22C55E', '#06B6D4'] as const,
};

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

export default function Path() {
  const { potential, keys, streak, todayTechniques, goals, history, activityLog, userState, onboardingHighlight } = useAppStore();
  const [, setLocation] = useLocation();

  const isOnboarding = userState === 'onboarding';
  const hasHL = isOnboarding && onboardingHighlight.length > 0;
  const hl  = (id: string) => hasHL && onboardingHighlight.includes(id);
  const dim = (id: string) => hasHL && !onboardingHighlight.includes(id);

  const activeGoalsCount    = goals.filter(g => g.status === 'active').length;
  const completedGoalsCount = goals.filter(g => g.status === 'completed').length;
  const activeDaysCount     = history.length;
  const lastActiveDate      = activityLog.length > 0
    ? new Date(activityLog[0].date).toLocaleDateString('ru-RU')
    : history.length > 0
      ? new Date(history[0].date).toLocaleDateString('ru-RU')
      : 'Нет';

  const statCards = [
    { id: 'PATH_potential', icon: Brain, value: `${Math.round(potential)}%`, label: 'Потенциал', route: '/potential-stats', iconColor: ICON_COLORS.stat[0], labelColor: WHITE },
    { id: 'PATH_keys',      icon: Key,   value: `${keys}`,                   label: 'Ключи',     route: '/keys-stats',      iconColor: ICON_COLORS.stat[1], labelColor: WHITE },
    { id: 'PATH_streak',    icon: Flame, value: `${streak}`,                 label: 'Дней подряд',route: '/streak',         iconColor: ICON_COLORS.stat[2], labelColor: WHITE },
  ];

  const doneCount = TECHNIQUES.filter(t => todayTechniques[t.id as keyof typeof todayTechniques]).length;

  return (
    <div className="pt-[40px] px-4 pb-24 space-y-3">

      {/* Resources — slide from top */}
      <div className="flex gap-2.5">
        {statCards.map((s, i) => {
          const Icon = s.icon;
          const isHl  = hl(s.id);
          const isDim = dim(s.id);
          return (
            <motion.div
              key={s.id}
              initial={{ y: -30, opacity: 0 }}
              animate={{ y: 0, opacity: isDim ? 0.25 : 1 }}
              transition={{ duration: 1.5, ease: EASE, delay: i * 0.08 }}
              onClick={() => !isOnboarding && setLocation(s.route)}
              style={{
                ...(isHl ? {} : STAT_CARD_STYLE),
                flex: 1,
                borderRadius: 18,
                padding: 16,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                position: 'relative',
                overflow: 'hidden',
              }}
              className={isHl ? 'glass-blue' : ''}
            >
              {isHl && (
                <div style={{
                  position: 'absolute', top: '-30%', left: '50%', transform: 'translateX(-50%)',
                  width: '80%', height: '70%',
                  background: `radial-gradient(ellipse, rgba(37,99,235,0.3) 0%, transparent 70%)`,
                  pointerEvents: 'none',
                }} />
              )}
              <Icon size={24} color={isHl ? '#60A5FA' : s.iconColor} style={{ marginBottom: 8, position: 'relative' }} />
              <span className="num" style={{ fontSize: 26, fontWeight: 300, color: GOLD, lineHeight: 1, position: 'relative' }}>{s.value}</span>
              <span className="caption" style={{ marginTop: 4, position: 'relative', textAlign: 'center', lineHeight: 1.2, color: s.labelColor }}>{s.label}</span>
            </motion.div>
          );
        })}
      </div>

      {/* Checklist — slide from right */}
      <motion.div
        initial={{ x: 60, opacity: 0 }}
        animate={{ x: 0, opacity: hasHL ? 0.2 : 1 }}
        transition={{ duration: 1.5, ease: EASE, delay: 0.15 }}
        style={{
          ...CHECKLIST_STYLE,
          borderRadius: 20,
          overflow: 'hidden',
        }}
      >
        <div className="px-4 pt-4 pb-3 flex items-center justify-between"
          style={{ borderBottom: '1px solid rgba(245,158,11,0.12)' }}>
          <p className="caption uppercase tracking-wider" style={{ color: WHITE }}>Сегодня</p>
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              {TECHNIQUES.map((t) => (
                <div key={t.id} className="w-1.5 h-1.5 rounded-full transition-all" style={{
                  background: todayTechniques[t.id as keyof typeof todayTechniques]
                    ? GOLD
                    : 'rgba(245,158,11,0.2)',
                }} />
              ))}
            </div>
            <span className="num" style={{ fontSize: 13, color: doneCount === 6 ? GOLD : GOLD_D }}>
              {doneCount}/6
            </span>
          </div>
        </div>

        <div className="px-3 pt-2 pb-3 grid grid-cols-3 gap-2">
          {TECHNIQUES.map((t) => {
            const isDone = todayTechniques[t.id as keyof typeof todayTechniques];
            const Icon = t.icon;
            return (
              <motion.button
                key={t.id}
                whileTap={isOnboarding ? {} : { scale: 0.88 }}
                onClick={() => !isOnboarding && setLocation(t.route)}
                className="flex flex-col items-center gap-1 py-2 active:brightness-110"
              >
                <div className="w-[18px] h-[18px] rounded-[5px] flex items-center justify-center mb-0.5"
                  style={{
                    background: isDone ? 'rgba(245,158,11,0.2)' : 'rgba(245,158,11,0.06)',
                    border: `1.5px solid ${isDone ? 'rgba(245,158,11,0.6)' : 'rgba(245,158,11,0.2)'}`,
                  }}>
                  {isDone && <Check size={10} color={GOLD} strokeWidth={3} />}
                </div>
                <div className="w-[52px] h-[52px] rounded-[16px] flex items-center justify-center"
                  style={{
                    background: isDone ? t.bg.replace('0.12', '0.22') : t.bg,
                    border: `2px solid ${isDone ? t.border.replace('0.25', '0.5') : t.border}`,
                    boxShadow: isDone ? `0 0 18px ${t.bg.replace('0.12', '0.46')}, 0 4px 12px rgba(0,0,0,0.35)` : `0 4px 12px rgba(0,0,0,0.35)`,
                  }}>
                  <Icon size={22} color={t.color} style={{ opacity: isDone ? 1 : 0.7 }} />
                </div>
              </motion.button>
            );
          })}
        </div>

        {doneCount === 6 && (
          <div className="px-4 py-3 flex items-center gap-2"
            style={{ borderTop: '1px solid rgba(245,158,11,0.2)', background: 'rgba(245,158,11,0.08)' }}>
            <Check size={14} color={GOLD} />
            <span className="body-s" style={{ color: GOLD, fontSize: 13 }}>День завершён — Продолжай накапливать потенциал.</span>
          </div>
        )}
      </motion.div>

      {/* Мой прогресс — slide from left */}
      <motion.div
        initial={{ x: -60, opacity: 0 }}
        animate={{ x: 0, opacity: hasHL ? 0.2 : 1 }}
        transition={{ duration: 1.5, ease: EASE, delay: 0.23 }}
        onClick={() => !isOnboarding && setLocation('/my-progress')}
        style={{ ...NAV_CARD_STYLE, borderRadius: 18 }}
        className="p-4 flex items-center gap-3 cursor-pointer active:brightness-110"
      >
        <div className="w-10 h-10 rounded-[12px] flex items-center justify-center shrink-0"
          style={{ background: 'rgba(192,132,252,0.12)', border: '2px solid rgba(192,132,252,0.25)', boxShadow: '0 4px 12px rgba(0,0,0,0.35)' }}>
          <BarChart2 size={20} color="#C084FC" strokeWidth={2} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="title-s mb-0.5" style={{ color: WHITE }}>Мой прогресс</h3>
          <p className="body-s" style={{ color: GOLD_D }}>Статистика по целям и активностям</p>
        </div>
        <ChevronRight size={16} color={GOLD_D} />
      </motion.div>

      {/* Цели — slide from right */}
      <motion.div
        initial={{ x: 60, opacity: 0 }}
        animate={{ x: 0, opacity: hasHL ? 0.2 : 1 }}
        transition={{ duration: 1.5, ease: EASE, delay: 0.30 }}
        onClick={() => !isOnboarding && setLocation('/goals')}
        style={{ ...NAV_CARD_STYLE, borderRadius: 18 }}
        className="p-4 flex items-center gap-3 cursor-pointer active:brightness-110"
      >
        <div className="w-10 h-10 rounded-[12px] flex items-center justify-center shrink-0"
          style={{ background: 'rgba(34,197,94,0.12)', border: '2px solid rgba(34,197,94,0.25)', boxShadow: '0 4px 12px rgba(0,0,0,0.35)' }}>
          <Target size={20} color="#22C55E" strokeWidth={2} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="title-s mb-0.5" style={{ color: WHITE }}>Цели</h3>
          <p className="body-s" style={{ color: GOLD_D }}>
            Активных: <span className="num">{activeGoalsCount}</span>
            <span className="mx-1.5" style={{ color: GOLD_D }}>·</span>
            Завершённых: <span className="num">{completedGoalsCount}</span>
          </p>
        </div>
        <ChevronRight size={16} color={GOLD_D} />
      </motion.div>

      {/* История активности — slide from left */}
      <motion.div
        initial={{ x: -60, opacity: 0 }}
        animate={{ x: 0, opacity: hasHL ? 0.2 : 1 }}
        transition={{ duration: 1.5, ease: EASE, delay: 0.38 }}
        onClick={() => !isOnboarding && setLocation('/history')}
        style={{ ...NAV_CARD_STYLE, borderRadius: 18 }}
        className="p-4 flex items-center gap-3 cursor-pointer active:brightness-110"
      >
        <div className="w-10 h-10 rounded-[12px] flex items-center justify-center shrink-0"
          style={{ background: 'rgba(6,182,212,0.12)', border: '2px solid rgba(6,182,212,0.25)', boxShadow: '0 4px 12px rgba(0,0,0,0.35)' }}>
          <History size={20} color="#06B6D4" strokeWidth={2} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="title-s mb-0.5" style={{ color: WHITE }}>История активности</h3>
          <p className="body-s" style={{ color: GOLD_D }}>
            Дней: <span className="num">{activeDaysCount}</span>
            <span className="mx-1.5" style={{ color: GOLD_D }}>·</span>
            Последний: {lastActiveDate}
            </p>
        </div>
        <ChevronRight size={16} color={GOLD_D} />
      </motion.div>

    </div>
  );
}
