import { useLocation } from "wouter";
  import { useAppStore } from "@/lib/store";
  import { Lock, Unlock } from "lucide-react";
  import { motion } from "framer-motion";

  const ARTICLES = [
    {
      id: 'A1',
      title: "Лучшая стратегия нейрохакинга, которая изменит жизнь за короткий срок",
      desc: "Вот как получить максимальную пользу от приложения",
      cost: 0,
    },
    {
      id: 'A2',
      title: "Как ставить цели, чтобы мозг хотел их достичь?",
      desc: "Работа будет вызывать столько же дофамина сколько и соцсети.",
      cost: 5,
    },
    {
      id: 'A3',
      title: "Научись управлять своим дофамином с помощью нейровизуализации",
      desc: "Как применять этот мощный инструмент в приложении, чтобы всегда оставаться мотивированным и верить в достижимость цели.",
      cost: 10,
    },
    {
      id: 'A4',
      title: "Гайд на планирование дел на день. Научись точно предсказывать время на задачу.",
      desc: "Как укладываться в запланированные сроки и не стрессовать от того, что ничего не успеваешь.",
      cost: 20,
    },
    {
      id: 'A5',
      title: "Гайд на сон. Как засыпать за 3–5 минут и просыпаться восстановленным.",
      desc: "Эволюционное несоответствие сна: как спали наши предки, почему мы не высыпаемся, какие есть техники для осознанного ввода мозга в режим сна.",
      cost: 400,
    },
  ];

  const PURPLE = {
    color: '#C084FC',
    bg: 'linear-gradient(135deg, rgba(192,132,252,0.22) 0%, rgba(192,132,252,0.08) 100%)',
    border: 'rgba(192,132,252,0.28)',
    glow: 'rgba(192,132,252,0.18)',
    darkBg: 'rgba(192,132,252,0.08)',
  };

  const GOLD = {
    color: '#F59E0B',
    bg: 'linear-gradient(135deg, rgba(245,158,11,0.22) 0%, rgba(245,158,11,0.08) 100%)',
    border: 'rgba(245,158,11,0.28)',
    glow: 'rgba(245,158,11,0.18)',
    light: 'rgba(245,158,11,0.35)',
  };

  const CARD_SHADOW = '0 8px 32px rgba(0,0,0,0.68), 0 0 0 1px rgba(255,255,255,0.1)';

  const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

  function formatKeys(n: number) {
    return n >= 1000 ? `${(n / 1000).toFixed(0)}к` : `${n}`;
  }

  export default function Academy() {
    const { unlockedArticles, keys, userState, onboardingHighlight, readArticles } = useAppStore();
    const [, setLocation] = useLocation();

    const isOnboarding = userState === 'onboarding';
    const hasHL       = isOnboarding && onboardingHighlight.length > 0;
    const hlServices  = hasHL && onboardingHighlight.includes('ACAD_services');
    const hlArticles  = hasHL && onboardingHighlight.includes('ACAD_articles');
    const dimServices = hasHL && !onboardingHighlight.includes('ACAD_services');
    const dimArticles = hasHL && !onboardingHighlight.includes('ACAD_articles');

    const SERVICES = [
      { title: 'Консультация', desc: 'Разбор твоей ситуации', cost: 25000, costRub: 999, route: '/consultation' },
      { title: 'Личное ведение', desc: 'Системная работа со мной', cost: 100000, costRub: 9999, route: '/mentoring' },
    ];

    const serviceDirections = [-1, 1];

    return (
      <div className="flex flex-col h-[calc(100dvh-60px)] pt-2 overflow-hidden">
        <motion.div
          animate={{ opacity: dimServices ? 0.2 : 1 }}
          transition={{ duration: 0.25 }}
          className="px-4 pt-4 pb-4 shrink-0 relative z-10"
        >
          <h2 className="text-tertiary uppercase tracking-wider mb-3"
            style={{ fontSize: 16, fontWeight: 600, letterSpacing: '0.08em' }}>
            Услуги
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {SERVICES.map((s, idx) => (
              <motion.button
                key={s.route}
                initial={{ opacity: 0, x: serviceDirections[idx] * 60 }}
                animate={{ opacity: hlServices ? 1 : 1, x: 0, scale: hlServices ? 1.03 : 1 }}
                transition={{ duration: 1.5, delay: idx * 0.15, ease: EASE }}
                whileTap={isOnboarding ? {} : { scale: 0.95 }}
                onClick={() => !isOnboarding && setLocation(s.route)}
                className="rounded-[20px] p-4 flex flex-col text-left active:brightness-110 transition-all overflow-hidden relative btn-shimmer"
                style={{
                  background: GOLD.bg,
                  border: `1px solid ${GOLD.border}`,
                  boxShadow: CARD_SHADOW,
                  minHeight: 160,
                }}
              >
                <span className="inline-block self-start rounded-[8px] px-2.5 py-1 mb-2 relative text-[17px]"
                  style={{
                    background: 'rgba(255,255,255,0.1)',
                    border: `1px solid ${GOLD.light}`,
                    color: '#FFFFFF',
                    fontSize: 14,
                    fontWeight: 700,
                    lineHeight: 1.3,
                    textShadow: '0 1px 2px rgba(0,0,0,0.4)',
                  }}>
                  {s.title}
                </span>
                <p className="text-secondary leading-snug relative"
                  style={{ fontSize: 12, opacity: 0.7 }}>
                  {s.desc}
                </p>
                <div className="mt-auto flex flex-col gap-0.5 relative">
                  <span className="label" style={{ color: GOLD.color, fontSize: 11 }}>
                    {formatKeys(s.cost)} ключей
                  </span>
                  <span className="label" style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10 }}>
                    {s.costRub.toLocaleString('ru-RU')} руб.
                  </span>
                </div>
              </motion.button>
            ))}
          </div>
        </motion.div>

        <motion.div
          animate={{ opacity: dimArticles ? 0.2 : 1 }}
          transition={{ duration: 0.25 }}
          className="px-4 pb-2 shrink-0 relative z-10"
        >
          <h2 className="text-tertiary uppercase tracking-wider"
            style={{ fontSize: 16, fontWeight: 600, letterSpacing: '0.08em' }}>
            База знаний
          </h2>
        </motion.div>

        <motion.div
          animate={{ opacity: dimArticles ? 0.2 : 1 }}
          transition={{ duration: 0.25 }}
          className="flex-1 overflow-y-auto px-4 pb-20 space-y-2 relative z-10"
        >
          {ARTICLES.map((a, articleIdx) => {
            const isUnlocked = unlockedArticles.includes(a.id) || a.id === 'A1';
            const isRead      = readArticles.includes(a.id);
            const canAfford   = keys >= a.cost;
            const isFree      = a.cost === 0;
            const showUnreadDot = isUnlocked && !isRead;

            return (
              <motion.button
                key={a.id}
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0, scale: hlArticles ? 1.01 : 1 }}
                transition={{ duration: 1.5, delay: 0.1 + articleIdx * 0.07, ease: EASE }}
                whileTap={isOnboarding ? {} : { scale: 0.985 }}
                onClick={() => !isOnboarding && setLocation(`/article/${a.id}`)}
                className="w-full rounded-[20px] p-4 text-left active:brightness-110 transition-all overflow-hidden relative flex items-start gap-3"
                style={{
                  background: isUnlocked
                    ? PURPLE.bg.replace(/0\.22/g, '0.28').replace(/0\.08/g, '0.14')
                    : PURPLE.bg,
                  border: `1px solid ${isUnlocked ? PURPLE.border.replace('0.28','0.45') : PURPLE.border}`,
                  boxShadow: isUnlocked
                    ? `0 4px 20px ${PURPLE.glow}, 0 1px 0 rgba(255,255,255,0.06) inset, ${CARD_SHADOW}`
                    : `${CARD_SHADOW}`,
                  opacity: isUnlocked ? 1 : 0.65,
                }}
              >
                <div className="flex-1 min-w-0 relative">
                  <div className="flex items-start gap-2 mb-1">
                    <h3 className="title-s text-primary leading-snug"
                      style={{ opacity: isUnlocked ? 1 : 0.6 }}>
                      {a.title}
                    </h3>
                    {isRead && (
                      <span className="label px-2 py-0.5 rounded-[6px] shrink-0 mt-0.5"
                        style={{
                          background: 'rgba(34,197,94,0.1)',
                          border: '1px solid rgba(34,197,94,0.2)',
                          color: '#22C55E',
                          fontSize: 10,
                          fontWeight: 600,
                        }}>
                        Прочитано
                      </span>
                    )}
                  </div>
                  <p className="body-s text-secondary leading-tight line-clamp-2"
                    style={{ opacity: isUnlocked ? 0.8 : 0.45 }}>
                    {a.desc}
                  </p>
                </div>
                <div className="shrink-0 flex flex-col items-center justify-start pt-0.5 min-w-[36px] text-right relative">
                  {isUnlocked ? (
                    <div className="relative">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center"
                        style={{ background: PURPLE.darkBg, border: `1px solid ${PURPLE.border}` }}>
                        <Unlock size={13} color={PURPLE.color} />
                      </div>
                      {showUnreadDot && (
                        <span
                          className="absolute -top-1 -right-1 w-[9px] h-[9px] rounded-full"
                          style={{ background: '#EF4444', boxShadow: '0 0 6px rgba(239,68,68,0.9)' }}
                        />
                      )}
                    </div>
                  ) : (
                    <div className="w-7 h-7 rounded-full flex items-center justify-center"
                      style={{ background: PURPLE.darkBg, border: `1px solid ${PURPLE.border}` }}>
                      <Lock size={13} color={canAfford ? PURPLE.color : 'var(--text-tertiary)'} />
                    </div>
                  )}
                  {!isUnlocked && !isFree && (
                    <span className="label mt-1" style={{ color: canAfford ? PURPLE.color : 'var(--text-tertiary)' }}>
                      {formatKeys(a.cost)}
                    </span>
                  )}
                  {isFree && !isUnlocked && (
                    <span className="label mt-1" style={{ color: '#22C55E' }}>
                      free
                    </span>
                  )}
                </div>
              </motion.button>
            );
          })}

          {/* Coming soon */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.5, delay: 0.1 + ARTICLES.length * 0.07, ease: EASE }}
            className="w-full flex justify-center py-6"
          >
            <span style={{
              fontSize: 15,
              fontWeight: 500,
              color: 'rgba(255,255,255,0.18)',
              letterSpacing: '0.02em',
              userSelect: 'none',
            }}>
              Скоро новые статьи
            </span>
          </motion.div>
        </motion.div>
      </div>
    );
  }
