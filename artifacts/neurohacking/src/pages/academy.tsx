import { useLocation } from "wouter";
import { useAppStore } from "@/lib/store";
import { CalendarDays, Brain, Lightbulb, Lock, MoonStar, Repeat2, Target, Unlock, type LucideIcon } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState, type ReactNode, type UIEvent } from "react";
import { HABIT_GUIDE_TITLE } from "@/content/habit-guide";
import { isArticleRequirementSatisfied } from "@/content/article-access";
import { ringRotationTarget, ringRotationTransition, useRingBurst } from "@/lib/ring-burst";

  const ARTICLES = [
    {
      id: 'A1',
      title: "Лучшая стратегия нейрохакинга, которая изменит жизнь за короткий срок",
      desc: "Вот как получить максимальную пользу от приложения",
      cost: 0,
      visual: { Icon: Brain, color: "#F59E0B", glow: "rgba(245,158,11,0.16)", surface: "#3E2E1D" },
    },
    {
      id: 'A2',
      title: "Как ставить цели, чтобы мозг хотел их достичь?",
      desc: "Работа будет вызывать столько же дофамина сколько и соцсети.",
      cost: 0,
      visual: { Icon: Target, color: "#C084FC", glow: "rgba(192,132,252,0.14)", surface: "#2F293A" },
    },
    {
      id: 'A3',
      title: "Научись управлять своим дофамином с помощью нейровизуализации",
      desc: "Как применять этот мощный инструмент в приложении, чтобы всегда оставаться мотивированным и верить в достижимость цели.",
      cost: 0,
      visual: { Icon: Lightbulb, color: "#06B6D4", glow: "rgba(6,182,212,0.14)", surface: "#1D3337" },
    },
    {
      id: 'A4',
      title: "Гайд на планирование дел на день. Научись точно предсказывать время на задачу.",
      desc: "Как укладываться в запланированные сроки и не стрессовать от того, что ничего не успеваешь.",
      cost: 0,
      visual: { Icon: CalendarDays, color: "#3DB770", glow: "rgba(61,183,112,0.14)", surface: "#23342C" },
    },
    {
      id: 'A5',
      title: "Гайд на сон. Как засыпать за 3–5 минут и просыпаться восстановленным.",
      desc: "Эволюционное несоответствие сна: как спали наши предки, почему мы не высыпаемся, какие есть техники для осознанного ввода мозга в режим сна.",
      cost: 400,
      visual: { Icon: MoonStar, color: "#3B82F6", glow: "rgba(59,130,246,0.15)", surface: "#243047" },
    },
    {
      id: 'A6',
      title: HABIT_GUIDE_TITLE,
      desc: "Как перестать заставлять себя действовать 21 день, сделать привычку привлекательной и запустить её по новой системе уже сегодня.",
      cost: 400,
      visual: { Icon: Repeat2, color: "#FB7185", glow: "rgba(251,113,133,0.14)", surface: "#3D2931" },
    },
  ];
  const ACADEMY_ACCENT = '#F59E0B';
  const CARD_SHADOW = '0 8px 32px rgba(0,0,0,0.68), 0 0 0 1px rgba(255,255,255,0.1)';

  const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];
  const ARTICLE_STACK_OFFSET = 76;
  const ARTICLE_STACK_RELEASE = 300;
  const POTENTIAL_PARTICLES = [
    { left: '7%', top: '18%', size: 5, color: '#F97316', delay: 0 },
    { left: '18%', top: '82%', size: 4, color: '#FFB45E', delay: .7 },
    { left: '88%', top: '23%', size: 4, color: '#F59E0B', delay: 1.2 },
    { left: '94%', top: '68%', size: 6, color: '#F97316', delay: .35 },
    { left: '77%', top: '8%', size: 3, color: '#FFD29A', delay: 1.7 },
    { left: '30%', top: '7%', size: 3, color: '#F97316', delay: 2.1 },
  ];
  const POTENTIAL_RING_STYLES = [
    { inset: '16px', duration: 13, direction: -1, opacity: 0.48, spacing: 24 },
  ];
  type ArticleRingLayer = {
    size: number;
    left?: number;
    right?: number;
    top?: number;
    bottom?: number;
    width: number;
    alpha: string;
    duration: number;
    direction?: 1 | -1;
    dashArray?: string;
    opacity?: number;
  };
  type ArticleRingStyle = {
    outer: ArticleRingLayer;
    dash: ArticleRingLayer & { dashArray: string; opacity: number; direction: 1 | -1 };
    fine: ArticleRingLayer & { dashArray: string; opacity: number; direction: 1 | -1 };
  };
  const ARTICLE_RING_STYLES: ArticleRingStyle[] = [
    {
      outer: { size: 256, right: -44, top: -86, width: 1.4, alpha: '6A', duration: 19 },
      dash: { size: 224, right: -30, top: -68, width: 1.8, dashArray: '8 14', alpha: '78', opacity: 0.3, duration: 24, direction: 1 },
      fine: { size: 150, right: 5, top: -10, width: 1, dashArray: '2 9', alpha: '55', opacity: 0.3, duration: 13, direction: -1 },
    },
    {
      outer: { size: 220, left: -30, top: -60, width: 1, alpha: '72', duration: 14 },
      dash: { size: 184, left: -14, top: -43, width: 2.4, dashArray: '13 9', alpha: '68', opacity: 0.3, duration: 18, direction: -1 },
      fine: { size: 124, left: 14, top: -5, width: 0.8, dashArray: '1.5 12', alpha: '48', opacity: 0.3, duration: 11, direction: 1 },
    },
    {
      outer: { size: 280, right: -70, bottom: -92, width: 1.8, alpha: '58', duration: 23 },
      dash: { size: 244, right: -50, bottom: -75, width: 1.2, dashArray: '4 9', alpha: '72', opacity: 0.3, duration: 16, direction: 1 },
      fine: { size: 168, right: -15, bottom: -18, width: 1.4, dashArray: '3 16', alpha: '42', opacity: 0.3, duration: 27, direction: -1 },
    },
    {
      outer: { size: 238, left: -62, bottom: -70, width: 1.2, alpha: '6A', duration: 17 },
      dash: { size: 196, left: -44, bottom: -54, width: 1.6, dashArray: '6 18', alpha: '70', opacity: 0.3, duration: 28, direction: -1 },
      fine: { size: 138, left: -8, bottom: -8, width: 0.9, dashArray: '2 7', alpha: '4C', opacity: 0.3, duration: 12, direction: 1 },
    },
    {
      outer: { size: 296, left: 50, bottom: -108, width: 1, alpha: '60', duration: 26 },
      dash: { size: 260, left: 68, bottom: -90, width: 2, dashArray: '10 20', alpha: '64', opacity: 0.3, duration: 31, direction: 1 },
      fine: { size: 178, left: 100, bottom: -16, width: 1.1, dashArray: '2 13', alpha: '5A', opacity: 0.3, duration: 15, direction: -1 },
    },
  ];

  function formatKeys(n: number) {
    return n >= 1000 ? `${(n / 1000).toFixed(0)}к` : `${n}`;
  }

  function KnowledgeBaseMark() {
    const reduced = useReducedMotion();
    const ringBurst = useRingBurst();
    const ringTickAngles = Array.from({ length: 24 }, (_, index) => index * 15);

    return (
      <motion.div
        className="relative flex h-[168px] w-[168px] shrink-0 items-center justify-center"
        initial={{ opacity: 0, scale: 0.72, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.9, ease: EASE }}
        aria-hidden="true"
      >
        <motion.span
          className="pointer-events-none absolute inset-[-20px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(245,158,11,.34), rgba(249,115,22,.18) 38%, transparent 72%)' }}
          animate={reduced ? { opacity: 0.72, scale: 1 } : { opacity: [.52, .98, .52], scale: [.94, 1.08, .94] }}
          transition={reduced ? { duration: 0.4 } : { duration: 4.2, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.span
          className="pointer-events-none absolute inset-[-3px] z-[3] rounded-full"
          style={{
            background: "conic-gradient(from -34deg, rgba(255,237,170,.72) 0deg 166deg, transparent 166deg 360deg)",
            maskImage: "radial-gradient(circle, transparent 76%, #000 77.5%, #000 79%, transparent 80.5%)",
            WebkitMaskImage: "radial-gradient(circle, transparent 76%, #000 77.5%, #000 79%, transparent 80.5%)",
            filter: "drop-shadow(0 0 4px rgba(255,215,145,.24))",
          }}
           animate={reduced ? { rotate: 0, opacity: 0.38 } : { rotate: ringRotationTarget(-1, ringBurst), opacity: [.24, .42, .24] }}
          transition={reduced
            ? { duration: 0.4 }
            : {
                 rotate: ringRotationTransition(17, ringBurst),
                opacity: { duration: 3.8, repeat: Infinity, ease: "easeInOut" },
              }}
        />
        <motion.span
          className="pointer-events-none absolute inset-[2px] rounded-full border"
          style={{ borderColor: "rgba(249,115,22,.42)" }}
           animate={reduced ? { opacity: 0.48, rotate: 0 } : { opacity: [.32, .72, .32], rotate: ringRotationTarget(-1, ringBurst) }}
          transition={reduced
            ? { duration: 0.4 }
            : {
                opacity: { duration: 3.8, repeat: Infinity, ease: "easeInOut" },
                 rotate: ringRotationTransition(16, ringBurst),
              }}
        />
        <motion.svg
          className="pointer-events-none absolute inset-[-31px] z-[1] h-auto w-auto"
          viewBox="0 0 230 230"
          fill="none"
          aria-hidden="true"
           animate={reduced ? { rotate: 0 } : { rotate: ringRotationTarget(1, ringBurst) }}
           transition={reduced ? { duration: 0.4 } : ringRotationTransition(22, ringBurst)}
          style={{ filter: "drop-shadow(0 0 5px rgba(255,210,125,.24))" }}
        >
          <g opacity="0.24" stroke="#FFE8B0" strokeWidth="2.6" strokeLinecap="butt">
            {ringTickAngles.map((angle) => (
              <line key={`knowledge-ring-tick-${angle}`} x1="115" y1="7" x2="115" y2="20" transform={`rotate(${angle} 115 115)`} />
            ))}
          </g>
        </motion.svg>
        {POTENTIAL_RING_STYLES.map((ring, index) => (
          <motion.span
            key={`academy-potential-ring-${index}`}
            className="pointer-events-none absolute rounded-full"
            style={{
              inset: ring.inset,
              background: `repeating-conic-gradient(from ${index === 0 ? -34 : 14}deg, rgba(255,237,170,${ring.opacity}) 0deg 0.8deg, transparent 0.8deg ${ring.spacing}deg)`,
              maskImage: "radial-gradient(circle, transparent 78%, #000 79.5%, #000 82%, transparent 83.5%)",
              WebkitMaskImage: "radial-gradient(circle, transparent 78%, #000 79.5%, #000 82%, transparent 83.5%)",
            }}
             animate={reduced ? { rotate: 0, opacity: ring.opacity } : { rotate: ringRotationTarget(ring.direction, ringBurst), opacity: [ring.opacity * 0.65, ring.opacity, ring.opacity * 0.65] }}
            transition={reduced
              ? { duration: 0.4 }
              : {
                   rotate: ringRotationTransition(ring.duration, ringBurst),
                  opacity: { duration: ring.duration * 0.55, repeat: Infinity, ease: "easeInOut" },
                }}
          />
        ))}
        {POTENTIAL_PARTICLES.map((particle, index) => (
          <motion.span
            key={`academy-potential-particle-${index}`}
            className="pointer-events-none absolute z-[2] rounded-full"
            style={{
              left: particle.left,
              top: particle.top,
              width: particle.size,
              height: particle.size,
              background: particle.color,
              boxShadow: `0 0 12px ${particle.color}`,
            }}
            animate={reduced ? { opacity: 0.6, scale: 1 } : { y: [0, -7, 0], opacity: [.2, .9, .2], scale: [.75, 1.2, .75] }}
            transition={reduced
              ? { duration: 0.4 }
              : { duration: 2.7 + index * .15, delay: particle.delay, repeat: Infinity, ease: "easeInOut" }}
          />
        ))}
        <motion.span
          className="pointer-events-none absolute inset-[22px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(255,210,125,.28), transparent 70%)' }}
          animate={reduced ? { opacity: 0.45 } : { opacity: [.2, .62, .2] }}
          transition={reduced ? { duration: 0.4 } : { duration: 3.6, repeat: Infinity, ease: "easeInOut" }}
        />
        <div
          className="academy-star-motion pointer-events-none absolute z-[12] h-[108px] w-[108px]"
          style={{ left: 30, top: 30 }}
          aria-hidden="true"
        >
          <svg
            width="108"
            height="108"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#F97316"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="academy-star-glow h-full w-full"
            aria-hidden="true"
          >
            <path d="M18.5 2.9375V4.5M18.5 4.5V6.0625M18.5 4.5H17.25M18.5 4.5H19.75M21 4.5L19.9156 4.13852C19.4179 3.97263 19.0274 3.58211 18.8615 3.08443L18.5 2L18.1385 3.08443C17.9726 3.58211 17.5821 3.97263 17.0844 4.13852L16 4.5L17.0844 4.86148C17.5821 5.02737 17.9726 5.41789 18.1385 5.91557L18.5 7L18.8615 5.91557C19.0274 5.41789 19.4179 5.02763 19.9156 4.86148L21 4.5Z" />
          </svg>
        </div>
        <div
          className="academy-book-motion relative z-10 h-[108px] w-[108px]"
        >
          <svg
            width="108"
            height="108"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-full w-full text-[#FFE4B5]"
            aria-hidden="true"
          >
            <path d="M8 2V18" />
            <path d="M20 22H6C4.89543 22 4 21.1046 4 20M4 20C4 18.8954 4.89543 18 6 18H20V10M4 20V8C4 5.17157 4 3.75736 4.87868 2.87868C5.75736 2 7.17157 2 10 2H13" />
            <path d="M19.5 18C19.5 18 18.5 18.7628 18.5 20C18.5 21.2372 19.5 22 19.5 22" />
          </svg>
        </div>
      </motion.div>
    );
  }

  function ArticleIcon({
    Icon,
    color,
    glow,
    unread,
  }: {
    Icon: LucideIcon;
    color: string;
    glow: string;
    unread: boolean;
  }) {
    const reduced = useReducedMotion();

    return (
      <motion.div
        className="relative flex h-[42px] w-[42px] shrink-0 items-center justify-center"
        style={{ filter: `drop-shadow(0 0 8px ${glow})` }}
        animate={reduced ? { y: 0 } : { y: [0, -1, 0], rotate: [0, 0.8, 0] }}
        transition={reduced ? { duration: 0.3 } : { duration: 4.6, repeat: Infinity, ease: "easeInOut" }}
      >
        <motion.span
          className="pointer-events-none absolute inset-[-6px] rounded-full blur-lg"
          style={{ background: `radial-gradient(circle, ${glow}, transparent 72%)` }}
          animate={reduced ? { opacity: 0.34, scale: 1 } : { opacity: [.1, .34, .1], scale: [.82, 1.1, .82] }}
          transition={reduced ? { duration: 0.3 } : { duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
        />
        <Icon size={24} strokeWidth={1.55} color={color} className="relative z-10" aria-hidden="true" />
        {unread && (
          <motion.span
            className="absolute -right-1 -top-1 z-20 h-2 w-2 rounded-full bg-rose-400"
            animate={reduced ? { opacity: 1 } : { opacity: [0.55, 1, 0.55], scale: [0.86, 1.15, 0.86] }}
            transition={reduced ? { duration: 0.3 } : { duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          />
        )}
      </motion.div>
    );
  }

  function ArticleAccessMark({
    isUnlocked,
    cost,
    canAfford,
    color,
    showUnreadDot,
  }: {
    isUnlocked: boolean;
    cost: number;
    canAfford: boolean;
    color: string;
    showUnreadDot: boolean;
  }) {
    const reduced = useReducedMotion();
    const priceLabel = !isUnlocked && cost === 400 ? "400 ключей" : null;

    return (
      <div className="ml-0 flex min-w-[88px] shrink-0 flex-col items-end text-right">
        <motion.div
          className="relative flex h-8 w-8 items-center justify-center"
          style={{
            color: isUnlocked ? color : canAfford ? ACADEMY_ACCENT : "var(--text-tertiary)",
            filter: isUnlocked
              ? `drop-shadow(0 0 6px ${color}) drop-shadow(0 0 11px ${color}66)`
              : "none",
          }}
          animate={reduced
            ? { scale: isUnlocked ? 1.02 : 1, opacity: isUnlocked ? 1 : 0.82 }
            : isUnlocked
              ? { scale: [1, 1.04, 1], y: [0, -1, 0], rotate: [0, -2, 0], opacity: [0.82, 1, 0.82] }
              : { scale: [1, 0.96, 1], y: [0, 1, 0], opacity: [0.68, 0.88, 0.68] }}
          transition={reduced
            ? { duration: 0.3 }
            : { duration: isUnlocked ? 2.6 : 3.8, repeat: Infinity, ease: "easeInOut" }}
        >
          {isUnlocked ? <Unlock size={21} strokeWidth={1.65} /> : <Lock size={19} strokeWidth={1.65} />}
          {showUnreadDot && (
            <span
              className="absolute -right-0.5 -top-0.5 h-[7px] w-[7px] rounded-full"
              style={{ background: "#EF4444", boxShadow: "0 0 6px rgba(239,68,68,0.9)" }}
            />
          )}
        </motion.div>
        {priceLabel && (
          <span
            className="label mt-0.5 block whitespace-nowrap leading-tight"
            style={{
              color: canAfford ? ACADEMY_ACCENT : "var(--text-tertiary)",
              fontSize: cost === 400 ? 14 : 10,
              fontWeight: cost === 400 ? 700 : 500,
              letterSpacing: "0.01em",
            }}
          >
            {priceLabel}
          </span>
        )}
      </div>
    );
  }

  function ArticleCardMotion({
    children,
    articleIdx,
    stackOffset,
    perspectiveTilt,
    stackTilt,
  }: {
    children: ReactNode;
    articleIdx: number;
    stackOffset: number;
    perspectiveTilt: number;
    stackTilt: number;
  }) {
    const hasMounted = useRef(false);

    useEffect(() => {
      hasMounted.current = true;
    }, []);

    return (
      <motion.div
        className="article-stack-card relative w-full"
        style={{
          transformOrigin: 'top center',
          transformStyle: 'preserve-3d',
          willChange: 'transform, opacity, filter',
          zIndex: articleIdx + 1,
        }}
        initial={{
          opacity: 0,
          y: 58 - stackOffset,
          rotateX: perspectiveTilt + 18,
          rotateZ: stackTilt + (articleIdx % 2 === 0 ? -2.5 : 2.5),
          scale: 0.94,
          filter: "blur(7px)",
          transformPerspective: 560,
        }}
        animate={{
          opacity: 1,
          y: -stackOffset,
          rotateX: perspectiveTilt,
          rotateZ: stackTilt,
          scale: 1,
          filter: "blur(0px)",
          transformPerspective: 560,
        }}
        transition={hasMounted.current
          ? { duration: 0.18, ease: "easeOut" }
          : {
              duration: 1.05 + articleIdx * 0.07,
              delay: 0.12 + articleIdx * 0.11,
              ease: EASE,
            }}
      >
        {children}
      </motion.div>
    );
  }

  export default function Academy() {
    const {
      unlockedArticles,
      keys,
      activityLog,
      goals,
      userState,
      onboardingHighlight,
      readArticles,
    } = useAppStore();
    const [, setLocation] = useLocation();
    const reducedMotion = useReducedMotion();
    const ringBurst = useRingBurst();
    const [stackProgress, setStackProgress] = useState(0);
    const scrollFrame = useRef<number | null>(null);

    const isOnboarding = userState === 'onboarding';
    const hasHL       = isOnboarding && onboardingHighlight.length > 0;
    const dimArticles = hasHL && !onboardingHighlight.includes('ACAD_articles');

    useEffect(() => {
      return () => {
        if (scrollFrame.current !== null) {
          cancelAnimationFrame(scrollFrame.current);
        }
      };
    }, []);

    const handleScroll = (event: UIEvent<HTMLDivElement>) => {
      const nextProgress = Math.min(1, Math.max(0, event.currentTarget.scrollTop / ARTICLE_STACK_RELEASE));
      if (scrollFrame.current !== null) {
        cancelAnimationFrame(scrollFrame.current);
      }
      scrollFrame.current = requestAnimationFrame(() => {
        scrollFrame.current = null;
        setStackProgress(nextProgress);
      });
    };

    return (
      <div
        className="h-[calc(100dvh-60px)] overflow-y-auto overscroll-contain px-4 pb-20"
        onScroll={handleScroll}
      >
        <motion.div
          animate={{ opacity: dimArticles ? 0.2 : 1 }}
          transition={{ duration: 0.25 }}
          className="relative z-10 pb-6 pt-12"
        >
          <div className="flex items-center gap-2">
            <KnowledgeBaseMark />
            <h2 className="min-w-0 text-left uppercase tracking-wider"
              style={{ color: 'rgba(245,158,11,.82)', fontSize: 22, fontWeight: 600, letterSpacing: '0.08em' }}>
              База знаний
            </h2>
          </div>
        </motion.div>

        <motion.div
          animate={{ opacity: dimArticles ? 0.2 : 1 }}
          transition={{ duration: 0.25 }}
          className="article-stack-list relative z-10 space-y-3"
        >
          {ARTICLES.map((a, articleIdx) => {
            const isUnlocked = a.id === 'A1'
              || isArticleRequirementSatisfied(a.id, { activityLog, goals })
              || (a.cost > 0 && unlockedArticles.includes(a.id));
            const isRead      = readArticles.includes(a.id);
            const canAfford   = a.cost > 0 && keys >= a.cost;
            const showUnreadDot = isUnlocked && !isRead;

            const visual = a.visual;
            const ringStyle = ARTICLE_RING_STYLES[articleIdx % ARTICLE_RING_STYLES.length];
            const stackRelease = 1 - stackProgress;
            const stackOffset = articleIdx * ARTICLE_STACK_OFFSET * stackRelease;
            const stackTilt = articleIdx === 0
              ? 0
              : (articleIdx % 2 === 0 ? 0.35 : -0.45) * stackRelease;
            const perspectiveTilt = -(16 + articleIdx * 0.5) * stackRelease;

            return (
              <ArticleCardMotion
                key={a.id}
                articleIdx={articleIdx}
                stackOffset={stackOffset}
                perspectiveTilt={perspectiveTilt}
                stackTilt={stackTilt}
              >
                <motion.button
                  onClick={() => !isOnboarding && setLocation(`/article/${a.id}`)}
                  className="group relative flex w-full flex-col overflow-hidden rounded-[20px] p-4 text-left transition-[filter] active:brightness-110"
                  whileHover={{ y: -2, scale: 1.006 }}
                  whileTap={{ scale: 0.968, y: 3, rotateX: -3, filter: "brightness(1.18) saturate(1.14)" }}
                  transition={{ type: "spring", stiffness: 420, damping: 25, mass: 0.65 }}
                  style={{
                    transformOrigin: "top center",
                    transformStyle: "preserve-3d",
                  background: `linear-gradient(135deg, ${visual.glow}, rgba(255,255,255,0.035) 52%, rgba(0,0,0,0.1)), ${visual.surface}`,
                  border: `1px solid ${visual.color}45`,
                  boxShadow: `0 5px 24px ${visual.glow}, 0 1px 0 rgba(255,237,213,0.09) inset, ${CARD_SHADOW}`,
                  }}
                >
                <motion.div
                  aria-hidden="true"
                  className="pointer-events-none absolute z-[1] rounded-full border"
                  style={{
                    width: ringStyle.outer.size,
                    height: ringStyle.outer.size,
                    left: ringStyle.outer.left,
                    right: ringStyle.outer.right,
                    top: ringStyle.outer.top,
                    bottom: ringStyle.outer.bottom,
                    borderWidth: ringStyle.outer.width,
                    borderColor: `${visual.color}${ringStyle.outer.alpha}`,
                    boxShadow: `0 0 32px ${visual.color}40`,
                  }}
                  animate={reducedMotion
                    ? { rotate: 0, opacity: 0.55 }
                     : { rotate: ringRotationTarget(1, ringBurst), opacity: [0.45, 0.72, 0.45] }}
                  transition={reducedMotion
                    ? { duration: 0.3 }
                    : {
                         rotate: ringRotationTransition(ringStyle.outer.duration, ringBurst),
                        opacity: { duration: 4.4 + articleIdx * 0.35, repeat: Infinity, ease: "easeInOut", delay: articleIdx * 0.18 },
                      }}
                />
                <motion.svg
                  aria-hidden="true"
                  className="pointer-events-none absolute z-[1]"
                  width={ringStyle.dash.size}
                  height={ringStyle.dash.size}
                  viewBox={`0 0 ${ringStyle.dash.size} ${ringStyle.dash.size}`}
                  fill="none"
                  style={{
                    left: ringStyle.dash.left,
                    right: ringStyle.dash.right,
                    top: ringStyle.dash.top,
                    bottom: ringStyle.dash.bottom,
                    filter: `drop-shadow(0 0 12px ${visual.color}66)`,
                  }}
                  animate={reducedMotion
                    ? { rotate: 0, opacity: 0.3 }
                     : { rotate: ringRotationTarget(ringStyle.dash.direction, ringBurst), opacity: [0.28, 0.48, 0.28] }}
                  transition={reducedMotion
                    ? { duration: 0.3 }
                    : {
                         rotate: ringRotationTransition(ringStyle.dash.duration, ringBurst),
                        opacity: { duration: 3.5 + articleIdx * 0.28, repeat: Infinity, ease: "easeInOut", delay: articleIdx * 0.24 },
                      }}
                >
                  <circle
                    cx={ringStyle.dash.size / 2}
                    cy={ringStyle.dash.size / 2}
                    r={(ringStyle.dash.size / 2) - 4}
                    stroke={visual.color}
                    strokeWidth={ringStyle.dash.width}
                    strokeDasharray={ringStyle.dash.dashArray}
                    strokeLinecap="butt"
                    opacity={ringStyle.dash.opacity}
                  />
                </motion.svg>
                <motion.svg
                  aria-hidden="true"
                  className="pointer-events-none absolute z-[1]"
                  width={ringStyle.fine.size}
                  height={ringStyle.fine.size}
                  viewBox={`0 0 ${ringStyle.fine.size} ${ringStyle.fine.size}`}
                  fill="none"
                  style={{
                    left: ringStyle.fine.left,
                    right: ringStyle.fine.right,
                    top: ringStyle.fine.top,
                    bottom: ringStyle.fine.bottom,
                  }}
                  animate={reducedMotion
                    ? { rotate: 0, opacity: 0.3 }
                     : { rotate: ringRotationTarget(ringStyle.fine.direction, ringBurst), opacity: [0.26, 0.42, 0.26] }}
                  transition={reducedMotion
                    ? { duration: 0.3 }
                    : {
                         rotate: ringRotationTransition(ringStyle.fine.duration, ringBurst),
                        opacity: { duration: 2.8 + articleIdx * 0.22, repeat: Infinity, ease: "easeInOut", delay: articleIdx * 0.3 },
                      }}
                >
                  <circle
                    cx={ringStyle.fine.size / 2}
                    cy={ringStyle.fine.size / 2}
                    r={(ringStyle.fine.size / 2) - 3}
                    stroke={visual.color}
                    strokeWidth={ringStyle.fine.width}
                    strokeDasharray={ringStyle.fine.dashArray}
                    strokeLinecap="butt"
                    opacity={ringStyle.fine.opacity}
                  />
                </motion.svg>
                  <div className="relative z-10 flex w-full min-h-[42px] items-start justify-between gap-3 self-stretch">
                  <ArticleIcon Icon={visual.Icon} color={visual.color} glow={visual.glow} unread={showUnreadDot} />
                   <ArticleAccessMark
                     isUnlocked={isUnlocked}
                     cost={a.cost}
                     canAfford={canAfford}
                     color={visual.color}
                     showUnreadDot={showUnreadDot}
                   />
                </div>
                <div className="relative z-10 mt-1 min-w-0">
                  <h3 className="title-s w-full text-primary leading-snug"
                    style={{ opacity: 0.96 }}>
                    {a.title}
                  </h3>
                  <p className="body-s mt-1 text-secondary leading-tight line-clamp-2"
                    style={{ opacity: 0.74 }}>
                    {a.desc}
                  </p>
                  {isRead && (
                    <span className="label mt-2 inline-flex rounded-[6px] px-2 py-0.5"
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
                </motion.button>
              </ArticleCardMotion>
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
