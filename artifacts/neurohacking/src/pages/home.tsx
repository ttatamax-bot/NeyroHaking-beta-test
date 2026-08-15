import { useAppStore } from "@/lib/store";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Sparkles, ChevronRight, Target, Map, Eye, Brain } from "lucide-react";

const NEWS_ITEMS = [
  { id: '1', title: "Новая техника нейровизуализации", description: "Обновлён алгоритм прохождения техники T2 — визуализация теперь более структурированная и точная.", date: "28.05.2026" },
  { id: '2', title: "Важно о серии", description: "Серия сохраняется после выполнения любой техники за день. Следи за этим.", date: "20.05.2026" },
  { id: '3', title: "Академия пополнилась", description: "Добавлены новые статьи по нейробиологии дофамина и силе воли.", date: "10.05.2026" },
];

const R    = 82;
const CX   = 100;
const CY   = 100;
const CIRC = 2 * Math.PI * R;
const ARC  = CIRC * (240 / 360);
const GAP  = CIRC - ARC;

export default function Home() {
  const { userState, potential, goals, readNews, updateState } = useAppStore();
  const [, setLocation] = useLocation();

  const activeGoals = goals.filter(g => g.status === 'active');
  const filledArc   = ARC * (Math.min(100, potential) / 100);

  if (userState === 'new') {
    return (
      <div className="relative flex flex-col min-h-[100dvh] overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div style={{
            position: 'absolute', top: '-15%', left: '50%', transform: 'translateX(-50%)',
            width: '160%', height: '80%',
            background: 'radial-gradient(ellipse 65% 55% at 52% 20%, rgba(37,99,235,0.60) 0%, rgba(37,99,235,0.26) 42%, transparent 68%)',
          }} />
          <div style={{
            position: 'absolute', top: '0%', left: '30%', transform: 'translateX(-50%)',
            width: '70%', height: '45%',
            background: 'radial-gradient(ellipse, rgba(96,165,250,0.26) 0%, transparent 65%)',
          }} />
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0, height: '45%',
            background: 'linear-gradient(to top, #0F2035 30%, transparent)',
          }} />
        </div>
        <div className="relative z-10 flex flex-col flex-1">
          <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
            className="pt-14 px-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full"
              style={{ background: 'rgba(37,99,235,0.15)', border: '1px solid rgba(37,99,235,0.3)' }}>
              <Sparkles size={13} className="text-blue-light" />
              <span className="label text-blue-light tracking-widest uppercase">НейроХакинг</span>
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="px-6 mt-6 flex-1 flex flex-col justify-center">
            <h1 className="display-xl mb-5" style={{ lineHeight: 1.06 }}>
              Твой мозг{' '}
              <span style={{ fontStyle: 'italic', color: 'var(--text-blue)' }}>создан</span>{' '}
              для&nbsp;большего.
            </h1>
            <p className="body text-secondary leading-relaxed max-w-[320px]">
              Социальные сети и короткий контент перехватили управление. Система НейроХакинга
              возвращает тебе контроль — через ежедневные техники, проверенные нейронаукой.
            </p>
            <p className="body-s mt-4" style={{ color: 'var(--text-tertiary)' }}>
              Никакой магии. Только система — пройди её, и твоя жизнь изменится навсегда.
            </p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="px-6 pb-16 mt-10">
            <button
              className="btn-grad btn-shimmer w-full h-[58px] rounded-[16px] title-s flex items-center justify-center gap-2"
              onClick={() => {
                updateState({ userState: 'onboarding', onboardingStep: 0 });
                setLocation('/techniques');
              }}
            >
              Изучить систему <ChevronRight size={20} />
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative pb-[110px] overflow-y-auto min-h-[100dvh]">
      <div className="relative z-10">

        <div className="flex flex-col items-center pt-[52px] pb-2 px-5">

          <motion.p
            className="label uppercase tracking-[0.14em]"
            style={{ color: 'rgba(147,197,253,0.45)', fontSize: 18 }}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            Накопленный потенциал
          </motion.p>

          <motion.div
            className="relative mt-3"
            initial={{ opacity: 0, scale: 0.88 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            <motion.div
              animate={{ opacity: [0.4, 0.85, 0.4] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
              style={{
                position: 'absolute', inset: -36,
                background: 'radial-gradient(circle, rgba(245,158,11,0.62) 0%, rgba(245,158,11,0.22) 45%, transparent 70%)',
                borderRadius: '50%',
                pointerEvents: 'none',
              }}
            />

            <svg
              viewBox="0 0 200 190"
              style={{ width: 'min(360px, 92vw)', height: 'auto', position: 'relative', overflow: 'visible' }}
            >
              <defs>
                <linearGradient id="arcGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#FDE68A" />
                  <stop offset="40%" stopColor="#F59E0B" />
                  <stop offset="100%" stopColor="#D97706" />
                </linearGradient>
                <filter id="arcGlow" x="-30%" y="-30%" width="160%" height="160%">
                  <feGaussianBlur stdDeviation="5" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
                <filter id="arcGlow2" x="-40%" y="-40%" width="180%" height="180%">
                  <feGaussianBlur stdDeviation="9" result="blur2" />
                  <feColorMatrix in="blur2" type="matrix" values="1 0.6 0 0 0  0.6 0.3 0 0 0  0 0 0 0 0  0 0 0 0.7 0" result="gold" />
                  <feMerge>
                    <feMergeNode in="gold" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              <circle
                cx={CX} cy={CY} r={R}
                fill="none"
                stroke="rgba(245,158,11,0.12)"
                strokeWidth={10}
                strokeDasharray={`${ARC} ${GAP}`}
                strokeLinecap="round"
                transform={`rotate(150 ${CX} ${CY})`}
              />
              {/* Gold border ring — full circle around the gauge */}
              <circle
                cx={CX} cy={CY} r={R + 6}
                fill="none"
                stroke="rgba(245,158,11,0.85)"
                strokeWidth={1.5}
              />

              <motion.circle
                cx={CX} cy={CY} r={R}
                fill="none"
                stroke="url(#arcGrad)"
                strokeWidth={10}
                strokeLinecap="round"
                filter="url(#arcGlow2)"
                transform={`rotate(150 ${CX} ${CY})`}
                initial={{ strokeDasharray: `0 ${CIRC}` }}
                animate={{ strokeDasharray: `${filledArc} ${CIRC - filledArc}` }}
                transition={{ duration: 1.8, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
              />
            </svg>

            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              paddingBottom: 5, transform: 'translateY(5px)',
            }}>
              <Brain size={36} color="#F59E0B" style={{ marginBottom: 4 }} />
              <motion.span
                className="num"
                style={{ fontSize: 94, fontWeight: 300, lineHeight: 1, color: 'var(--text-primary)', letterSpacing: '-0.04em' }}
                initial={{ opacity: 0, scale: 0.75 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              >
                {Math.round(potential)}
              </motion.span>
              <span style={{ fontSize: 31, fontWeight: 300, color: '#F59E0B', marginTop: 2, marginLeft: -2 }}>%</span>
            </div>
          </motion.div>
        </div>

        <motion.div
          className="px-5 pt-5 pb-6"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
        >
          <h1 style={{
            fontSize: 26,
            fontWeight: 800,
            lineHeight: 1.18,
            letterSpacing: '-0.5px',
            color: 'var(--text-primary)',
          }}>
            Если не знаешь,<br />
            что делать —<br />
            начни накапливать{' '}
            <span style={{ fontStyle: 'italic', color: 'var(--text-blue)' }}>потенциал</span>.
          </h1>
        </motion.div>

        {activeGoals.length > 0 && (
          <motion.section
            className="px-5 mb-5 space-y-3"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            {activeGoals.map((goal, i) => (
              <motion.div
                key={goal.id}
                initial={false}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + i * 0.06 }}
              >
                <div
                  style={{
                    borderRadius: 18,
                    background: 'rgba(12, 28, 60, 0.96)',
                    border: '1px solid rgba(37,99,235,0.4)',
                    padding: 16,
                    boxShadow: '0 0 28px rgba(37,99,235,0.18), 0 6px 24px rgba(0,0,0,0.5), 0 1px 0 rgba(96,165,250,0.15) inset',
                  }}
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0 mt-0.5"
                      style={{ background: 'rgba(37,99,235,0.2)', border: '1px solid rgba(37,99,235,0.4)' }}>
                      <Target size={16} color="#60A5FA" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="title-s text-primary mb-1">{goal.name}</p>
                      <p className="body-s text-secondary line-clamp-2">{goal.description}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-1">
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setLocation('/technique/visualization')}
                      className="flex-1 h-[40px] rounded-[10px] flex items-center justify-center gap-1.5"
                      style={{
                        fontSize: 13, fontWeight: 600,
                        background: 'linear-gradient(135deg, rgba(245,158,11,0.22) 0%, rgba(245,158,11,0.08) 100%)',
                        border: '1px solid rgba(245,158,11,0.35)',
                        backdropFilter: 'blur(12px)',
                        color: 'rgba(255,255,255,0.9)',
                      }}
                    >
                      <Eye size={14} color="#FDE68A" />
                      <span style={{ color: 'rgba(255,255,255,0.9)' }}>Визуализировать</span>
                    </motion.button>
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setLocation('/technique/planner')}
                      className="flex-1 h-[40px] rounded-[10px] flex items-center justify-center gap-1.5"
                      style={{
                        fontSize: 13, fontWeight: 600,
                        background: 'linear-gradient(135deg, rgba(245,158,11,0.22) 0%, rgba(245,158,11,0.08) 100%)',
                        border: '1px solid rgba(245,158,11,0.35)',
                        backdropFilter: 'blur(12px)',
                        color: 'rgba(255,255,255,0.9)',
                      }}
                    >
                      <Map size={14} color="#FDE68A" />
                      <span style={{ color: 'rgba(255,255,255,0.9)' }}>Приблизиться</span>
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.section>
        )}

        <div className="mx-5 mb-5 h-px" style={{ background: 'rgba(100,160,230,0.1)' }} />

        <section className="px-5">
          <motion.h2
            className="title-l text-primary mb-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35 }}
          >
            Новости системы
          </motion.h2>

          <div className="space-y-3">
            {NEWS_ITEMS.map((item, i) => {
              const isRead = readNews.includes(item.id);
              return (
                <motion.div
                  key={item.id}
                  initial={false}
                  animate={{ opacity: isRead ? 0.55 : 1 }}
                  transition={{ duration: 0.25 }}
                  whileTap={{ scale: 0.985 }}
                  className="rounded-[16px] p-4 cursor-pointer relative active:brightness-110 transition-all btn-shimmer"
                  style={{
                    background: 'linear-gradient(135deg, rgba(245,158,11,0.22) 0%, rgba(245,158,11,0.08) 100%)',
                    border: '1px solid rgba(245,158,11,0.28)',
                    boxShadow: '0 6px 28px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,255,255,0.08), 0 1px 0 rgba(255,255,255,0.07) inset',
                  }}
                  onClick={() => {
                    if (!isRead) updateState(prev => ({ readNews: [...prev.readNews, item.id] }));
                    setLocation(`/news/${item.id}`);
                  }}
                >
                  {!isRead && (
                    <span className="absolute top-4 right-4 w-2 h-2 rounded-full"
                      style={{ background: '#EF4444', boxShadow: '0 0 8px rgba(239,68,68,0.9)' }} />
                  )}
                  <h3 className="title-s text-primary mb-1.5 pr-4">{item.title}</h3>
                  <p className="body-s text-secondary mb-2.5 line-clamp-2">{item.description}</p>
                  <span className="caption" style={{ color: 'var(--text-tertiary)' }}>{item.date}</span>
                </motion.div>
              );
            })}
          </div>
        </section>

      </div>
    </div>
  );
}
