import { useLocation } from "wouter";
  import { Home, TrendingUp, Zap, BookOpen } from "lucide-react";
  import { motion, useAnimation } from "framer-motion";
  import { useRef, useEffect } from "react";
  import { useAppStore } from "@/lib/store";
  import { setSlideDir } from "@/components/ScreenTransition";

  const TABS = [
    { path: "/",           icon: Home,       label: "Главная"  },
    { path: "/path",       icon: TrendingUp, label: "Путь"     },
    { path: "/techniques", icon: Zap,        label: "Техники"  },
    { path: "/academy",    icon: BookOpen,   label: "Академия" },
  ];

  const NEWS_IDS = ['1', '2', '3'];
  const ARTICLE_IDS = ['A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8'];

  export function NavBar() {
    const [location, setLocation] = useLocation();
    const { userState, readNews, unlockedArticles, readArticles, goalFormOpen } = useAppStore();

    // Compute safeIdx before hooks so it's stable
    const activeIdx = TABS.findIndex(t =>
      t.path === '/' ? location === '/' : location.startsWith(t.path)
    );
    const safeIdx = Math.max(0, activeIdx);

    // ─── ALL HOOKS MUST BE HERE, BEFORE ANY CONDITIONAL RETURN ───
    const sliderControls = useAnimation();
    const prevIdxRef     = useRef(safeIdx);
    const initRef        = useRef(false);

    useEffect(() => {
      if (!initRef.current) {
        initRef.current = true;
        sliderControls.set({ left: `${safeIdx * 25}%`, scaleX: 1, scaleY: 1 });
        prevIdxRef.current = safeIdx;
        return;
      }
      if (prevIdxRef.current !== safeIdx) {
        prevIdxRef.current = safeIdx;
        sliderControls.start({
          left:   `${safeIdx * 25}%`,
          scaleX: [1, 1.12, 1.02, 1],
          scaleY: [1, 0.88, 0.98, 1],
          transition: {
            left:   { type: 'tween', ease: [0.4, 0, 0.2, 1], duration: 0.5 },
            scaleX: { duration: 0.5, ease: [0.4, 0, 0.2, 1], times: [0, 0.45, 0.85, 1] },
            scaleY: { duration: 0.5, ease: [0.4, 0, 0.2, 1], times: [0, 0.45, 0.85, 1] },
          },
        });
      }
    }, [safeIdx]);
    // ─────────────────────────────────────────────────────────────

    const isOnboarding = userState === 'onboarding';

    const hiddenRoutes = [
      '/technique/sleep', '/technique/visualization', '/technique/meditation',
      '/consultation', '/mentoring', '/onboarding/email',
      '/goals', '/history', '/settings', '/notifications',
    ];

    const isHidden =
      goalFormOpen ||
      userState === 'new' ||
      userState === 'dayDone' ||
      userState === 'onboarding' ||
      hiddenRoutes.some(r => location.startsWith(r)) ||
      location.includes('/article/');

    if (isHidden) return null;

    const hasUnreadNews    = NEWS_IDS.some(id => !readNews.includes(id));
    const hasUnreadAcademy = ARTICLE_IDS.some(id => {
      const isUnlocked = unlockedArticles.includes(id) || id === 'A1';
      return isUnlocked && !readArticles.includes(id);
    });

    const OVERFLOW = 10;

    return (
      <>
        {/* Bottom fade — NO backdropFilter to avoid iOS WebKit touch-intercept bug */}
        <div
          className="fixed left-0 right-0 z-40 pointer-events-none"
          style={{
            bottom: 0,
            height: 130,
            background: 'linear-gradient(to top, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.18) 45%, transparent 100%)',
          }}
        />

        <div
          className="fixed left-0 right-0 z-50 flex justify-center"
          style={{ bottom: 'max(20px, env(safe-area-inset-bottom, 20px))', padding: '0 16px' }}
        >
          <div className="w-full max-w-[390px]">
            <div
              className="relative h-[62px] flex items-center justify-around"
              style={{
                borderRadius: 22,
                background: 'linear-gradient(135deg, rgba(245,158,11,0.22) 0%, rgba(245,158,11,0.08) 100%)',
                border: '1px solid rgba(245,158,11,1)',
                backdropFilter: 'blur(28px) saturate(180%)',
                WebkitBackdropFilter: 'blur(28px) saturate(180%)',
                boxShadow:
                  '0 1px 0 rgba(255,255,255,0.08) inset,' +
                  '0 -1px 0 rgba(0,0,0,0.3) inset,' +
                  '0 12px 40px rgba(0,0,0,0.6)',
                overflow: 'visible',
              }}
            >
              {/* Active indicator — border 100% opacity, fill 80% opacity */}
              <motion.div
                initial={{ left: `${safeIdx * 25}%`, scaleX: 1, scaleY: 1 }}
                animate={sliderControls}
                style={{
                  position: 'absolute',
                  top: -OVERFLOW,
                  bottom: -OVERFLOW,
                  width: '25%',
                  borderRadius: 22,
                  background: 'linear-gradient(135deg, rgba(245,158,11,0.56) 0%, rgba(245,158,11,0.36) 100%)',
                  border: '2px solid rgba(245,158,11,1)',
                  backdropFilter: 'blur(18px) saturate(180%)',
                  WebkitBackdropFilter: 'blur(18px) saturate(180%)',
                  boxShadow: '0 1px 0 rgba(255,255,255,0.18) inset, 0 4px 22px rgba(245,158,11,0.3)',
                  pointerEvents: 'none',
                  zIndex: 0,
                  transformOrigin: 'center center',
                }}
              />

              {TABS.map((tab) => {
                const isActive = tab.path === '/'
                  ? location === '/'
                  : location.startsWith(tab.path);
                const Icon = tab.icon;
                const showNewsDot    = tab.path === '/'         && hasUnreadNews    && !isActive;
                const showAcademyDot = tab.path === '/academy'  && hasUnreadAcademy && !isActive;

                return (
                  <button
                    key={tab.path}
                    onClick={() => {
                      if (isOnboarding) return;
                      const curIdx = TABS.findIndex(t => t.path === '/' ? location === '/' : location.startsWith(t.path));
                      const newIdx = TABS.findIndex(t => t.path === tab.path);
                      setSlideDir(newIdx - curIdx);
                      setLocation(tab.path);
                    }}
                    className="flex-1 h-full flex flex-col items-center justify-center gap-[3px]"
                    style={{ position: 'relative', zIndex: 1 }}
                  >
                    <motion.div
                      animate={{ scale: isActive ? 1.18 : 1 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 22 }}
                      className="relative"
                    >
                      <Icon size={isActive ? 22 : 19} color={isActive ? '#ffffff' : 'var(--text-tertiary)'} />
                      {(showNewsDot || showAcademyDot) && (
                        <span
                          className="absolute -top-0.5 -right-0.5 w-[7px] h-[7px] rounded-full"
                          style={{ background: '#EF4444', boxShadow: '0 0 6px rgba(239,68,68,0.9)' }}
                        />
                      )}
                    </motion.div>
                    <motion.span
                      animate={{ scale: isActive ? 1.14 : 1 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 22 }}
                      style={{
                        fontSize: 10,
                        fontWeight: isActive ? 700 : 500,
                        letterSpacing: '0.04em',
                        color: isActive ? 'rgba(255,255,255,0.95)' : 'var(--text-tertiary)',
                        lineHeight: 1,
                        display: 'block',
                      }}
                    >
                      {tab.label}
                    </motion.span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </>
    );
  }
