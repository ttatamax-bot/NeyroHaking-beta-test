import { useAppStore } from "@/lib/store";
import { useLocation } from "wouter";
import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState, type UIEvent } from "react";
import { Sparkles, ChevronRight, LogIn } from "lucide-react";
import { DataLoadingScreen } from "@/components/DataLoadingScreen";
import { DEV_POTENTIAL_EVENT, getDevPotential } from "@/lib/dev-potential";
import { hasDeveloperTools } from "@/lib/developer-mode";
import { useAuthInfo } from "@/lib/clerk";
import { ringRotationTarget, ringRotationTransition, useSmoothRingBurstRotation } from "@/lib/ring-burst";

const NEWS_ITEMS = [
  { id: '1', title: "Новая техника нейровизуализации", description: "Обновлён алгоритм прохождения техники T2 — визуализация теперь более структурированная и точная.", date: "28.05.2026" },
  { id: '2', title: "Важно о серии", description: "Серия сохраняется после выполнения любой техники за день. Следи за этим.", date: "20.05.2026" },
  { id: '3', title: "Академия пополнилась", description: "Добавлены новые статьи по нейробиологии дофамина и силе воли.", date: "10.05.2026" },
];

const SCALE_BAR_COUNT = 12;
const NEWS_STACK_OFFSET = 82;
const NEWS_STACK_START = 364;
const NEWS_STACK_RELEASE = 300;
const NEWS_EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];
const NEWS_CARD_INTRO_DELAY = 0;
const NEWS_CARD_STAGGER = 0.07;
const NEWS_ICON_PARTICLES = [
  { left: "12%", top: "22%", size: 4, color: "#F97316", delay: 0 },
  { left: "82%", top: "18%", size: 3, color: "#FFD29A", delay: 0.7 },
  { left: "88%", top: "76%", size: 4, color: "#FFB45E", delay: 1.2 },
  { left: "18%", top: "82%", size: 3, color: "#FFE4B5", delay: 1.7 },
];

function getTodayLabels() {
  const today = new Date();
  return {
    weekday: new Intl.DateTimeFormat('ru-RU', { weekday: 'short' })
      .format(today)
      .replace(/\.$/, ''),
    date: new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long' }).format(today),
  };
}

function NewsSystemMark() {
  const reduced = useReducedMotion();
  const ringBurst = false;
  const burstRotation = useSmoothRingBurstRotation(!reduced);
  const ringTickAngles = Array.from({ length: 24 }, (_, index) => index * 15);

  return (
    <motion.div
      className="relative left-5 flex h-[144px] w-[144px] shrink-0 items-center justify-center"
      initial={{ opacity: 0, scale: 0.72, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.9, ease: NEWS_EASE }}
      aria-hidden="true"
    >
      <motion.div
        className="pointer-events-none absolute inset-0"
        style={{ rotate: burstRotation }}
      >
      <motion.span
        className="pointer-events-none absolute inset-[-34px] z-0 rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(255,211,133,.28) 0%, rgba(249,115,22,.16) 34%, rgba(249,115,22,.06) 56%, transparent 74%)",
        }}
        initial={{ opacity: 0, scale: 0.62, filter: "blur(28px)" }}
        animate={reduced
          ? { opacity: 0.28, scale: 1, filter: "blur(16px)" }
          : {
              opacity: [0, 0.82, 0.28],
              scale: [0.62, 1.12, 1],
              filter: ["blur(28px)", "blur(9px)", "blur(2px)"],
            }}
        transition={reduced
          ? { duration: 0.4 }
          : { duration: 1.45, ease: NEWS_EASE, times: [0, 0.58, 1] }}
      />
      <motion.span
        className="pointer-events-none absolute inset-[8px] z-[2] rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(255,240,208,.2), rgba(249,115,22,.08) 44%, transparent 72%)",
          mixBlendMode: "screen",
        }}
        initial={{ opacity: 0, scale: 0.72, filter: "blur(20px)" }}
        animate={reduced
          ? { opacity: 0.22, scale: 1, filter: "blur(10px)" }
          : { opacity: [0, 0.64, 0.16], scale: [0.72, 1.08, 1], filter: ["blur(20px)", "blur(6px)", "blur(1px)"] }}
        transition={reduced
          ? { duration: 0.4 }
          : { duration: 1.2, delay: 0.12, ease: NEWS_EASE, times: [0, 0.64, 1] }}
      />
      <motion.span
        className="pointer-events-none absolute inset-[-20px] rounded-full"
        style={{ background: "radial-gradient(circle, rgba(245,158,11,.22), rgba(249,115,22,.10) 38%, transparent 72%)" }}
        animate={reduced ? { opacity: 0.55, scale: 1 } : { opacity: [.35, .78, .35], scale: [.94, 1.06, .94] }}
        transition={reduced ? { duration: 0.4 } : { duration: 4.2, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.span
        className="pointer-events-none absolute inset-[-18px] rounded-full border"
        style={{ borderColor: "rgba(255,210,125,.16)", boxShadow: "0 0 14px rgba(249,115,22,.08)" }}
         animate={reduced ? { opacity: 0.22, rotate: 0 } : { opacity: [.12, .26, .12], rotate: ringRotationTarget(1, 24, ringBurst) }}
        transition={reduced
          ? { duration: 0.4 }
          : {
              opacity: { duration: 4.8, repeat: Infinity, ease: "easeInOut" },
              rotate: ringRotationTransition(24, ringBurst),
            }}
      />
      <motion.span
        className="pointer-events-none absolute inset-[2px] rounded-full border"
        style={{ borderColor: "rgba(249,115,22,.2)" }}
         animate={reduced ? { opacity: 0.26, rotate: 0 } : { opacity: [.16, .34, .16], rotate: ringRotationTarget(-1, 16, ringBurst) }}
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
         animate={reduced ? { rotate: 0 } : { rotate: ringRotationTarget(1, 22, ringBurst) }}
         transition={reduced ? { duration: 0.4 } : ringRotationTransition(22, ringBurst)}
        style={{ filter: "drop-shadow(0 0 3px rgba(255,210,125,.12))" }}
      >
        <g opacity="0.1" stroke="#FFE8B0" strokeWidth="2.6" strokeLinecap="butt">
          {ringTickAngles.map((angle) => (
            <line key={`news-ring-tick-${angle}`} x1="115" y1="7" x2="115" y2="20" transform={`rotate(${angle} 115 115)`} />
          ))}
        </g>
      </motion.svg>
      <motion.span
        className="pointer-events-none absolute inset-[-8px] rounded-full"
        style={{
          background: "repeating-conic-gradient(from -34deg, rgba(255,237,170,.38) 0deg .8deg, transparent .8deg 18deg)",
          maskImage: "radial-gradient(circle, transparent 78%, #000 79.5%, #000 82%, transparent 83.5%)",
          WebkitMaskImage: "radial-gradient(circle, transparent 78%, #000 79.5%, #000 82%, transparent 83.5%)",
        }}
         animate={reduced ? { rotate: 0, opacity: .28 } : { rotate: ringRotationTarget(1, 17, ringBurst), opacity: [.22, .38, .22] }}
        transition={reduced
          ? { duration: 0.4 }
          : {
              rotate: ringRotationTransition(17, ringBurst),
              opacity: { duration: 9, repeat: Infinity, ease: "easeInOut" },
            }}
      />
      <motion.span
        className="pointer-events-none absolute inset-[16px] rounded-full"
        style={{
          background: "repeating-conic-gradient(from 14deg, rgba(255,237,170,.26) 0deg .8deg, transparent .8deg 24deg)",
          maskImage: "radial-gradient(circle, transparent 78%, #000 79.5%, #000 82%, transparent 83.5%)",
          WebkitMaskImage: "radial-gradient(circle, transparent 78%, #000 79.5%, #000 82%, transparent 83.5%)",
        }}
         animate={reduced ? { rotate: 0, opacity: .18 } : { rotate: ringRotationTarget(-1, 13, ringBurst), opacity: [.12, .26, .12] }}
        transition={reduced
          ? { duration: 0.4 }
          : {
              rotate: ringRotationTransition(13, ringBurst),
              opacity: { duration: 7, repeat: Infinity, ease: "easeInOut" },
            }}
      />
      </motion.div>
      <motion.div
        className="pointer-events-none absolute inset-0 z-[10] origin-center scale-[0.75]"
        initial={{ opacity: 0, y: 8, filter: "blur(16px)" }}
        animate={reduced
          ? { opacity: 1, y: 0, filter: "blur(0px)" }
          : { opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={reduced
          ? { duration: 0.4 }
          : { duration: 1.1, delay: 0.18, ease: NEWS_EASE }}
      >
      <motion.div
        className="pointer-events-none absolute inset-0 z-[10]"
        initial={{ opacity: 0, scale: 0.88, filter: "blur(18px)" }}
        animate={reduced
          ? { opacity: 1, scale: 1, filter: "blur(0px)" }
          : { opacity: 1, scale: 1, filter: "blur(0px)" }}
        transition={reduced
          ? { duration: 0.4 }
          : { duration: 1, delay: 0.26, ease: NEWS_EASE }}
      >
      <motion.svg
        xmlns="http://www.w3.org/2000/svg"
        width="96"
        height="96"
        fill="currentColor"
        viewBox="0 0 256 256"
        className="absolute bottom-0 left-[3px] z-10 text-[#FFE4B5]"
        animate={reduced
          ? { y: 0, rotate: 0, scale: 1 }
          : { y: [0, -3, 1, -2, 0], rotate: [0, 1.8, -1.4, 1, 0], scale: [1, 1.045, .99, 1.02, 1] }}
        transition={reduced
          ? { duration: 0.3 }
          : {
              y: { duration: 5.2, repeat: Infinity, ease: "easeInOut" },
              rotate: { duration: 5.2, repeat: Infinity, ease: "easeInOut" },
              scale: { duration: 5.2, repeat: Infinity, ease: "easeInOut" },
            }}
      >
        <defs>
          <clipPath id="news-paper-corner-cut" clipPathUnits="userSpaceOnUse">
            <path d="M0,0H150V40Q150,56 134,56V84Q134,100 150,100H256V256H0Z" />
          </clipPath>
        </defs>
        <g clipPath="url(#news-paper-corner-cut)">
          <path d="M216,40H40A16,16,0,0,0,24,56V216a8,8,0,0,0,11.58,7.15L64,208.94l28.42,14.21a8,8,0,0,0,7.16,0L128,208.94l28.42,14.21a8,8,0,0,0,7.16,0L192,208.94l28.42,14.21A8,8,0,0,0,232,216V56A16,16,0,0,0,216,40Zm0,163.06-20.42-10.22a8,8,0,0,0-7.16,0L160,207.06l-28.42-14.22a8,8,0,0,0-7.16,0L96,207.06,67.58,192.84a8,8,0,0,0-7.16,0L40,203.06V56H216Z" />
          <path d="M64,168h48a8,8,0,0,0,8-8V96a8,8,0,0,0-8-8H64a8,8,0,0,0-8,8v64A8,8,0,0,0,64,168Zm8-64h32v48H72Z" />
          <motion.rect
            x="136"
            y="104"
            height="16"
            rx="8"
            fill="currentColor"
            initial={reduced ? { width: 64, opacity: 1 } : { width: 0, opacity: 0 }}
            animate={reduced ? { width: 64, opacity: 1 } : { width: [0, 64, 64, 0], opacity: [0, 1, 1, 0] }}
            transition={reduced ? { duration: 0.4 } : { duration: 3.8, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.rect
            x="136"
            y="136"
            height="16"
            rx="8"
            fill="currentColor"
            initial={reduced ? { width: 64, opacity: 1 } : { width: 0, opacity: 0 }}
            animate={reduced ? { width: 64, opacity: 1 } : { width: [0, 64, 64, 0], opacity: [0, 1, 1, 0] }}
            transition={reduced ? { duration: 0.4 } : { duration: 3.8, delay: 0.42, repeat: Infinity, ease: "easeInOut" }}
          />
        </g>
      </motion.svg>
      </motion.div>
      <motion.span
        className="pointer-events-none absolute right-[31px] top-[51px] z-[12] h-[18px] w-[42px] rounded-full"
        style={{
          background: "radial-gradient(ellipse, rgba(255,240,208,.38), rgba(249,115,22,.16) 52%, transparent 76%)",
          filter: "blur(3px)",
          mixBlendMode: "screen",
        }}
        animate={reduced ? { opacity: 0.24, scaleX: 1 } : { opacity: [0.12, .55, .12], scaleX: [.8, 1.18, .8] }}
        transition={reduced ? { duration: 0.4 } : { duration: 4.6, delay: 0.18, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute right-[13px] top-[18px] z-20 origin-top"
        style={{ transformOrigin: "50% 8%", filter: "drop-shadow(0 0 0.55px #FFF0D0)" }}
        animate={reduced
          ? { rotate: 0, x: 0, y: 0 }
          : { rotate: [0, -27, 23, -18, 11, -6, 0], x: [0, -3, 3, -2, 2, -1, 0], y: [0, 3, -3, 2, -1, 1, 0], scale: [1, 1.06, .97, 1.04, .985, 1.015, 1] }}
        transition={reduced ? { duration: 0.3 } : { duration: 4.6, repeat: Infinity, ease: "easeInOut" }}
      >
        <svg
          width="62"
          height="62"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="text-[#FFF0D0]"
        >
          <path d="M18 8.4C18 6.70261 17.3679 5.07475 16.2426 3.87452C15.1174 2.67428 13.5913 2 12 2C10.4087 2 8.88258 2.67428 7.75736 3.87452C6.63214 5.07475 6 6.70261 6 8.4C6 15.8667 3 18 3 18H21C21 18 18 15.8667 18 8.4Z" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </motion.div>
      <motion.svg
        className="absolute right-[13px] top-[18px] z-[21] h-[62px] w-[62px] origin-top"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
        style={{ transformOrigin: "50% 8%", filter: "drop-shadow(0 0 0.55px #FFF0D0)" }}
        animate={reduced
          ? { rotate: 0, x: 0, y: 0, scale: 1 }
          : { rotate: [0, -27, 23, -18, 11, -6, 0], x: [0, -3, 3, -2, 2, -1, 0], y: [0, 3, -3, 2, -1, 1, 0], scale: [1, 1.18, .94, 1.1, .97, 1.02, 1] }}
        transition={reduced
          ? { duration: 0.4 }
          : { duration: 4.6, delay: 0.3, repeat: Infinity, ease: "easeInOut" }}
      >
        <path d="M13.73 21C13.5542 21.3039 13.302 21.5558 12.9984 21.7309C12.6948 21.906 12.3501 21.9984 12 21.9984C11.6499 21.9984 11.3052 21.906 11.0016 21.7309C10.698 21.5558 10.4458 21.3039 10.27 21" stroke="#FFF0D0" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" />
      </motion.svg>
      </motion.div>
      {NEWS_ICON_PARTICLES.map((particle, index) => (
        <motion.span
          key={`news-icon-particle-${index}`}
          className="pointer-events-none absolute z-[22] rounded-full"
          style={{
            left: particle.left,
            top: particle.top,
            width: particle.size,
            height: particle.size,
            background: particle.color,
            boxShadow: `0 0 12px ${particle.color}`,
          }}
          initial={reduced
            ? { opacity: 0.6, scale: 1 }
            : { opacity: 0, scale: 0.2, filter: "blur(8px)" }}
          animate={reduced
            ? { opacity: 0.6, scale: 1 }
            : { y: [0, -7, 0], opacity: [.2, .9, .2], scale: [.75, 1.2, .75] }}
          transition={reduced
            ? { duration: 0.4 }
            : { duration: 2.2 + index * 0.25, delay: particle.delay, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}
      <motion.span
        className="pointer-events-none absolute right-[9px] top-[17px] z-[23] h-2 w-2 rounded-full bg-[#F97316]"
        initial={reduced
          ? { opacity: 0.75, scale: 1 }
          : { opacity: 0, scale: 0.2, filter: "blur(8px)" }}
        animate={reduced ? { opacity: 0.75, scale: 1 } : { opacity: [0.5, 1, 0.5], scale: [0.8, 1.25, 0.8] }}
        transition={reduced ? { duration: 0.3 } : { duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
      />
    </motion.div>
  );
}

function NewsCardMotion({
  newsIdx,
  children,
}: {
  newsIdx: number;
  children: React.ReactNode;
}) {
  return (
    <div
      className="news-stack-card relative w-full"
      style={{ zIndex: newsIdx + 1 }}
    >
      {children}
    </div>
  );
}

function NewsCardVisualMotion({
  children,
  newsIdx,
  stackProgress,
}: {
  children: React.ReactNode;
  newsIdx: number;
  stackProgress: number;
}) {
  const hasMounted = useRef(false);
  const stackRelease = 1 - stackProgress;
  const stackOffset = newsIdx * NEWS_STACK_OFFSET * stackRelease;
  const perspectiveTilt = -(16 + newsIdx * 0.5) * stackRelease;

  useEffect(() => {
    hasMounted.current = true;
  }, []);

  return (
    <motion.div
      className="pointer-events-none relative flex min-h-[196px] w-full flex-col overflow-hidden rounded-[20px] p-4 text-left"
      style={{
        transformOrigin: "top center",
        transformStyle: "preserve-3d",
        background: 'linear-gradient(135deg, rgba(245,158,11,0.22) 0%, rgba(255,255,255,0.035) 52%, rgba(0,0,0,0.1)), #3E2E1D',
        border: '1px solid rgba(245,158,11,0.34)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.68), 0 0 0 1px rgba(255,255,255,0.1), 0 1px 0 rgba(255,237,213,0.09) inset',
        willChange: "transform, opacity, filter",
      }}
      initial={{
        opacity: 0,
        y: 46 - stackOffset,
        rotateX: perspectiveTilt + 16,
        scale: 0.94,
        filter: "blur(6px)",
        transformPerspective: 680,
      }}
      animate={{
        opacity: 1,
        y: -stackOffset,
        rotateX: perspectiveTilt,
        scale: 1,
        filter: "blur(0px)",
        transformPerspective: 680,
      }}
      transition={hasMounted.current
        ? { duration: 0.2, ease: "easeOut" }
        : {
            duration: 0.9 + newsIdx * 0.06,
            delay: NEWS_CARD_INTRO_DELAY + newsIdx * NEWS_CARD_STAGGER,
            ease: NEWS_EASE,
          }}
    >
      {children}
    </motion.div>
  );
}

export function PotentialScale({
  value,
  hideReadout = false,
  maxActiveHeightScale = 1,
}: {
  value: number;
  hideReadout?: boolean;
  maxActiveHeightScale?: number;
}) {
  const displayValue = Math.round(Math.min(100, Math.max(0, value)));
  const [animatedValue, setAnimatedValue] = useState(0);
  const [demoValue, setDemoValue] = useState(0);
  const visualValue = displayValue === 0 ? demoValue : displayValue;
  const activeBars = Math.round((visualValue / 100) * SCALE_BAR_COUNT);
  const activeColors = visualValue >= 100
    ? ['#FFF7E6', '#FFEDD5', '#FFF1D6', '#FFE4B5']
    : ['#F97316', '#FF9F43', '#F47B20', '#FFAA4A'];
  const particles = [
    { left: '7%', top: '18%', size: 5, color: '#F97316', delay: 0 },
    { left: '18%', top: '82%', size: 4, color: '#FFB45E', delay: .7 },
    { left: '88%', top: '23%', size: 4, color: '#F59E0B', delay: 1.2 },
    { left: '94%', top: '68%', size: 6, color: '#F97316', delay: .35 },
    { left: '77%', top: '8%', size: 3, color: '#FFD29A', delay: 1.7 },
    { left: '30%', top: '7%', size: 3, color: '#F97316', delay: 2.1 },
  ];
  const ringProgress = Math.min(1, visualValue / 70);
  const particleCount = visualValue === 0 ? 0 : Math.ceil(ringProgress * particles.length);
  const glowFactor = .28 + ringProgress * .72;
  const highProgress = Math.max(0, (visualValue - 70) / 30);
  const speedFactor = 1 - highProgress * .55;
  const ringBurst = false;
  const burstRotation = useSmoothRingBurstRotation();
  useEffect(() => {
    const duration = 3200;
    const startedAt = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const progress = Math.min(1, (now - startedAt) / duration);
      const eased = 1 - Math.pow(1 - progress, 2.2);
      setAnimatedValue(Math.round(displayValue * eased));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [displayValue]);

  useEffect(() => {
    if (displayValue !== 0) {
      setDemoValue(0);
      return;
    }

    const fillDuration = 2300;
    const dropDuration = 500;
    const holdDuration = 4000;
    const cycleDuration = fillDuration + dropDuration + holdDuration;
    const startedAt = performance.now();
    let frame = 0;

    const tick = (now: number) => {
      const elapsed = (now - startedAt) % cycleDuration;
      let nextValue = 0;

      if (elapsed < fillDuration) {
        const progress = elapsed / fillDuration;
        nextValue = Math.round(60 * (1 - Math.pow(1 - progress, 3)));
      } else if (elapsed < fillDuration + dropDuration) {
        const progress = (elapsed - fillDuration) / dropDuration;
        nextValue = Math.round(60 * (1 - Math.pow(progress, 1.35)));
      }

      setDemoValue(nextValue);
      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [displayValue]);

  return (
    <div className="relative w-full max-w-[360px] h-[370px]" aria-label={`Потенциал дня ${displayValue}%`}>
      <motion.div
        className="pointer-events-none absolute inset-[-22px] rounded-[48px]"
        style={{ background: 'radial-gradient(ellipse at center, rgba(245,158,11,.11), transparent 68%)' }}
        animate={{ opacity: [.3 * glowFactor, .58 * glowFactor, .3 * glowFactor], scale: [.97, 1.02, .97] }}
          transition={{ duration: 4.2 * speedFactor, repeat: Infinity, ease: 'easeInOut' }}
      />
      {visualValue >= 100 && (
        <motion.div
          className="pointer-events-none absolute inset-[-38px] rounded-[56px]"
          style={{ background: 'radial-gradient(ellipse at center, rgba(255,250,235,.24), rgba(255,237,170,.10) 36%, transparent 72%)' }}
          animate={{ opacity: [.45, .95, .45], scale: [.96, 1.04, .96] }}
          transition={{ duration: 3.2 * speedFactor, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}
      <motion.div className="pointer-events-none absolute inset-0" style={{ rotate: burstRotation }}>
      <div
        className="absolute left-1/2 top-[120px] z-0 h-0 w-0"
        style={{ opacity: .18 + ringProgress * .82, transform: "translate(-50%, -50%)" }}
      >
        <motion.div
          className="absolute left-1/2 top-1/2 h-[390px] w-[390px] -translate-x-1/2 -translate-y-1/2 rounded-full"
          animate={{ opacity: [.34, .7, .34], scale: [.92, 1.05, .92] }}
          transition={{ duration: 4.8 * speedFactor, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            background: 'radial-gradient(circle, rgba(249,115,22,.4) 0%, rgba(245,158,11,.16) 34%, transparent 70%)',
            filter: 'blur(14px)',
          }}
        />
        <motion.div
          className="absolute left-1/2 top-1/2 h-[360px] w-[360px] -translate-x-1/2 -translate-y-1/2 rounded-full border"
           animate={{ rotate: ringRotationTarget(1, 16 * speedFactor, ringBurst) }}
           transition={ringRotationTransition(16 * speedFactor, ringBurst)}
          style={{
            borderColor: 'rgba(249,115,22,.08)',
            borderTopColor: 'rgba(255,237,170,.4)',
            borderRightColor: 'rgba(249,115,22,.25)',
            maskImage: 'radial-gradient(circle, transparent 64%, #000 66%, #000 69%, transparent 72%)',
            WebkitMaskImage: 'radial-gradient(circle, transparent 64%, #000 66%, #000 69%, transparent 72%)',
          }}
        />
        {visualValue >= 15 && (
          <motion.div
            className="absolute left-1/2 top-1/2 h-[344px] w-[344px] -translate-x-1/2 -translate-y-1/2 rounded-full border-[0.5px]"
             animate={{ rotate: ringRotationTarget(-1, 20 * speedFactor, ringBurst), opacity: [.24, .48, .24] }}
            transition={{
               rotate: ringRotationTransition(20 * speedFactor, ringBurst),
              opacity: { duration: 5.2 * speedFactor, repeat: Infinity, ease: 'easeInOut' },
            }}
            style={{
              borderColor: 'rgba(255,224,166,.24)',
              borderTopColor: 'rgba(255,237,170,.5)',
              borderLeftColor: 'rgba(249,115,22,.34)',
            }}
          />
        )}
        <motion.div
          className="absolute left-1/2 top-1/2 h-[320px] w-[320px] -translate-x-1/2 -translate-y-1/2 rounded-full"
           animate={{ rotate: ringRotationTarget(-1, 22 * speedFactor, ringBurst) }}
           transition={ringRotationTransition(22 * speedFactor, ringBurst)}
          style={{
            background: 'conic-gradient(from 20deg, transparent 0deg, rgba(255,237,170,.42) 40deg, transparent 78deg, transparent 174deg, rgba(249,115,22,.3) 218deg, transparent 266deg)',
            maskImage: 'radial-gradient(circle, transparent 67%, #000 69%, #000 73%, transparent 76%)',
            WebkitMaskImage: 'radial-gradient(circle, transparent 67%, #000 69%, #000 73%, transparent 76%)',
          }}
        />
        {visualValue >= 30 && (
          <motion.div
            className="absolute left-1/2 top-1/2 h-[302px] w-[302px] -translate-x-1/2 -translate-y-1/2 rounded-full border-[0.5px]"
             animate={{ rotate: ringRotationTarget(1, 14 * speedFactor, ringBurst), opacity: [.2, .42, .2] }}
            transition={{
               rotate: ringRotationTransition(14 * speedFactor, ringBurst),
              opacity: { duration: 4.4 * speedFactor, repeat: Infinity, ease: 'easeInOut' },
            }}
            style={{
              borderColor: 'rgba(255,224,166,.22)',
              borderRightColor: 'rgba(255,237,170,.44)',
              borderBottomColor: 'rgba(249,115,22,.3)',
            }}
          />
        )}
        {visualValue >= 80 && (
          <motion.div
            className="absolute left-1/2 top-1/2 h-[288px] w-[288px] -translate-x-1/2 -translate-y-1/2 rounded-full border-[0.5px]"
             animate={{ rotate: ringRotationTarget(-1, 12 * speedFactor, ringBurst), opacity: [.16, .36, .16] }}
            transition={{
               rotate: ringRotationTransition(12 * speedFactor, ringBurst),
              opacity: { duration: 3.6 * speedFactor, repeat: Infinity, ease: 'easeInOut' },
            }}
            style={{
              borderColor: 'rgba(255,224,166,.18)',
              borderTopColor: 'rgba(255,237,170,.38)',
              borderRightColor: 'rgba(249,115,22,.28)',
            }}
          />
        )}
        {visualValue >= 90 && (
          <motion.div
            className="absolute left-1/2 top-1/2 h-[246px] w-[246px] -translate-x-1/2 -translate-y-1/2 rounded-full border-[0.5px]"
             animate={{ rotate: ringRotationTarget(1, 10 * speedFactor, ringBurst), opacity: [.15, .34, .15] }}
            transition={{
               rotate: ringRotationTransition(10 * speedFactor, ringBurst),
              opacity: { duration: 3.2 * speedFactor, repeat: Infinity, ease: 'easeInOut' },
            }}
            style={{
              borderColor: 'rgba(255,224,166,.16)',
              borderBottomColor: 'rgba(255,237,170,.36)',
              borderLeftColor: 'rgba(249,115,22,.26)',
            }}
          />
        )}
        {visualValue >= 100 && (
          <motion.div
            className="absolute left-1/2 top-1/2 h-[206px] w-[206px] -translate-x-1/2 -translate-y-1/2 rounded-full border-[0.5px]"
             animate={{ rotate: ringRotationTarget(-1, 8 * speedFactor, ringBurst), opacity: [.14, .32, .14] }}
            transition={{
               rotate: ringRotationTransition(8 * speedFactor, ringBurst),
              opacity: { duration: 2.8 * speedFactor, repeat: Infinity, ease: 'easeInOut' },
            }}
            style={{
              borderColor: 'rgba(255,224,166,.15)',
              borderTopColor: 'rgba(255,237,170,.34)',
              borderRightColor: 'rgba(249,115,22,.24)',
            }}
          />
        )}
        {visualValue >= 100 && (
          <motion.div
            className="absolute left-1/2 top-1/2 h-[184px] w-[184px] -translate-x-1/2 -translate-y-1/2 rounded-full border-[0.5px]"
            animate={{ rotate: ringRotationTarget(1, 6.2 * speedFactor, ringBurst), opacity: [.18, .42, .18] }}
            transition={{
              rotate: ringRotationTransition(6.2 * speedFactor, ringBurst),
              opacity: { duration: 2.2 * speedFactor, repeat: Infinity, ease: 'easeInOut' },
            }}
            style={{
              borderColor: 'rgba(255,248,225,.24)',
              borderTopColor: 'rgba(255,255,245,.58)',
              borderLeftColor: 'rgba(255,224,166,.34)',
            }}
          />
        )}
        {visualValue >= 100 && (
          <motion.div
            className="absolute left-1/2 top-1/2 h-[160px] w-[160px] -translate-x-1/2 -translate-y-1/2 rounded-full border-[0.5px]"
            animate={{ rotate: ringRotationTarget(-1, 4.8 * speedFactor, ringBurst), opacity: [.16, .38, .16] }}
            transition={{
              rotate: ringRotationTransition(4.8 * speedFactor, ringBurst),
              opacity: { duration: 1.9 * speedFactor, repeat: Infinity, ease: 'easeInOut' },
            }}
            style={{
              borderColor: 'rgba(255,248,225,.2)',
              borderRightColor: 'rgba(255,255,245,.52)',
              borderBottomColor: 'rgba(255,224,166,.3)',
            }}
          />
        )}
        {visualValue >= 40 && (
          <motion.div
            className="absolute left-1/2 top-1/2 h-[276px] w-[276px] -translate-x-1/2 -translate-y-1/2 rounded-full"
            animate={{ rotate: ringRotationTarget(1, 11 * speedFactor, ringBurst), opacity: [.154, .385, .154] }}
            transition={{
              rotate: ringRotationTransition(11 * speedFactor, ringBurst),
              opacity: { duration: 3.8 * speedFactor, repeat: Infinity, ease: 'easeInOut' },
            }}
            style={{
              background: 'repeating-conic-gradient(from 4deg, rgba(255,215,145,.28) 0deg 1.5deg, transparent 1.5deg 14deg)',
              maskImage: 'radial-gradient(circle, transparent 65%, #000 67%, #000 70%, transparent 73%)',
              WebkitMaskImage: 'radial-gradient(circle, transparent 65%, #000 67%, #000 70%, transparent 73%)',
            }}
          />
        )}
        {visualValue >= 50 && (
          <motion.div
            className="absolute left-1/2 top-1/2 h-[270px] w-[270px] -translate-x-1/2 -translate-y-1/2 rounded-full"
            animate={{ rotate: ringRotationTarget(-1, 17 * speedFactor, ringBurst), opacity: [.18, .38, .18] }}
            transition={{
              rotate: ringRotationTransition(17 * speedFactor, ringBurst),
              opacity: { duration: 4.8 * speedFactor, repeat: Infinity, ease: 'easeInOut' },
            }}
            style={{
              background: 'conic-gradient(from -34deg, rgba(255,237,170,.5) 0deg 166deg, transparent 166deg 360deg)',
              maskImage: 'radial-gradient(circle, transparent 76%, #000 77.5%, #000 79%, transparent 80.5%)',
              WebkitMaskImage: 'radial-gradient(circle, transparent 76%, #000 77.5%, #000 79%, transparent 80.5%)',
            }}
          />
        )}
        {visualValue >= 60 && (
          <motion.div
            className="absolute left-1/2 top-1/2 h-[236px] w-[236px] -translate-x-1/2 -translate-y-1/2 rounded-full border-[0.5px]"
            animate={{ rotate: ringRotationTarget(-1, 14 * speedFactor, ringBurst), opacity: [.2, .5, .2] }}
            transition={{
              rotate: ringRotationTransition(14 * speedFactor, ringBurst),
              opacity: { duration: 4.2 * speedFactor, repeat: Infinity, ease: 'easeInOut' },
            }}
            style={{
              borderColor: 'rgba(255,210,125,.13)',
              borderLeftColor: 'rgba(249,115,22,.36)',
              borderBottomColor: 'rgba(255,237,170,.24)',
              maskImage: 'radial-gradient(circle, transparent 73%, #000 75%, #000 77%, transparent 79%)',
              WebkitMaskImage: 'radial-gradient(circle, transparent 73%, #000 75%, #000 77%, transparent 79%)',
            }}
          />
        )}
        {visualValue > 0 && (
          <motion.div
            className="absolute left-1/2 top-1/2 h-[360px] w-[360px] -translate-x-1/2 -translate-y-1/2"
            animate={{ rotate: ringRotationTarget(1, 19 * speedFactor, ringBurst) }}
            transition={ringRotationTransition(19 * speedFactor, ringBurst)}
          >
            <span className="absolute left-1/2 top-0 h-[5px] w-[5px] -translate-x-1/2 rounded-full" style={{ background: '#FFD29A', boxShadow: '0 0 14px 5px rgba(249,115,22,.72)' }} />
            <span className="absolute bottom-[13%] right-[6%] h-[3px] w-[3px] rounded-full" style={{ background: '#F97316', boxShadow: '0 0 10px 3px rgba(249,115,22,.62)' }} />
            <span className="absolute bottom-[16%] left-[8%] h-[4px] w-[4px] rounded-full" style={{ background: '#FFE4B5', boxShadow: '0 0 12px 4px rgba(255,224,166,.55)' }} />
          </motion.div>
        )}
      </div>
      </motion.div>
      {particles.slice(0, particleCount).map((particle, index) => (
        <motion.span
          key={index}
          className="pointer-events-none absolute z-[2] rounded-full"
          style={{
            left: particle.left,
            top: particle.top,
            width: particle.size,
            height: particle.size,
            background: particle.color,
            boxShadow: `0 0 12px ${particle.color}`,
          }}
          animate={{ y: [0, -7, 0], opacity: [.2, .9, .2], scale: [.75, 1.2, .75] }}
          transition={{ duration: (2.7 + index * .15) * speedFactor, delay: particle.delay, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}
      <div className="relative z-[1] h-[365px] pt-[64px] mt-[2px] mb-[2px]">
        <div className="relative flex h-[116px] items-center justify-center gap-[13px]" role="img" aria-label={`Шкала потенциала: ${activeBars} из ${SCALE_BAR_COUNT} полосок активны`}>
          {Array.from({ length: SCALE_BAR_COUNT }, (_, index) => {
            const isActive = index < activeBars;
            const distanceFromFront = activeBars - 1 - index;
            const barHeight = distanceFromFront >= 0 && distanceFromFront < 3
              ? [104, 84, 72][distanceFromFront]
              : 64;
            const activeHeightScale = Math.min(1, Math.max(0, maxActiveHeightScale));
            const fullActiveBarHeight = Math.round(barHeight * 1.3);
            const activeBarHeight = Math.round(64 + (fullActiveBarHeight - 64) * activeHeightScale);
            const peakOvershoot = Math.round(8 * activeHeightScale);
            const settleOvershoot = Math.round(2 * activeHeightScale);
            const color = activeColors[index % activeColors.length];
            const fillDelay = .18 + index * .13;
            return (
              <motion.div
                key={`${displayValue}-${index}`}
                className="relative w-[10px] shrink-0 rounded-full origin-center"
                style={{
                  height: 64,
                  backgroundColor: 'rgba(224,232,237,.58)',
                  transform: 'rotate(-16deg)',
                }}
                initial={{ opacity: .56, scaleY: 1, y: 0, height: 64, filter: 'blur(0px) brightness(1)', backgroundColor: 'rgba(224,232,237,.58)' }}
                animate={isActive
                  ? {
                      opacity: [.56, 1, .86, 1],
                      scaleY: [1, 1.12, .94, 1],
                      y: [0, -4, 1, 0],
                      height: [64, activeBarHeight + peakOvershoot, activeBarHeight - settleOvershoot, activeBarHeight],
                      backgroundColor: ['rgba(224,232,237,.58)', '#FFB45E', color, color],
                      filter: ['blur(0px) brightness(1)', 'blur(0px) brightness(1.45)', 'blur(1px) brightness(1)', 'blur(0px) brightness(1.12)'],
                      boxShadow: [`0 0 0 ${color}00`, `0 0 28px ${color}dd`, `0 0 8px ${color}66`],
                    }
                  : { opacity: .56, scaleY: 1, y: 0, height: 64, filter: 'blur(0px) brightness(1)', backgroundColor: 'rgba(224,232,237,.58)', boxShadow: '0 0 6px rgba(224,232,237,.12)' }}
                transition={{
                  opacity: isActive
                    ? { duration: .95, delay: fillDelay, ease: [0.16, 1, 0.3, 1] }
                    : { duration: 0 },
                  scaleY: isActive
                    ? { duration: .95, delay: fillDelay, ease: [0.16, 1, 0.3, 1] }
                    : { duration: 0 },
                  y: isActive
                    ? { duration: .95, delay: fillDelay, ease: [0.16, 1, 0.3, 1] }
                    : { duration: 0 },
                  height: isActive
                    ? { duration: .95, delay: fillDelay, ease: [0.16, 1, 0.3, 1] }
                    : { duration: 0 },
                  backgroundColor: isActive
                    ? { duration: .95, delay: fillDelay, ease: 'easeOut' }
                    : { duration: 0 },
                  filter: isActive
                    ? { duration: .95, delay: fillDelay, ease: 'easeOut' }
                    : { duration: 0 },
                  boxShadow: isActive
                    ? { duration: 2.4, delay: fillDelay + .75, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }
                    : { duration: 0 },
                }}
              >
                {isActive && (
                  <motion.span
                    className="pointer-events-none absolute left-1/2 top-0 h-[6px] w-[6px] -translate-x-1/2 rounded-full"
                    style={{ background: '#FFD29A', boxShadow: `0 0 14px 5px ${color}cc` }}
                    initial={{ opacity: 0, scale: .2, y: 10 }}
                    animate={{ opacity: [0, 1, 0], scale: [.2, 1.4, .2], y: [10, -20, -32] }}
                    transition={{ duration: 1.25, delay: fillDelay + .35, repeat: Infinity, repeatDelay: 2.8 + index * .12, ease: 'easeOut' }}
                  />
                )}
              </motion.div>
            );
          })}
        </div>
        {!hideReadout && (
          <div className="relative mt-[18px] flex items-baseline justify-center">
            <motion.span
              className="num"
              style={{ fontSize: 48, fontWeight: 300, lineHeight: 1, color: 'var(--text-primary)', letterSpacing: '-0.08em' }}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: .5 }}
            >
              {displayValue === 0 ? demoValue : animatedValue}
            </motion.span>
            <span
              style={{ marginLeft: 6, color: 'rgba(245,158,11,.7)', fontSize: 16, fontWeight: 300 }}
            >
              %
            </span>
          </div>
        )}
      </div>
      {!hideReadout && (
        <p
          className="pointer-events-none absolute left-0 right-0 top-[318px] z-[1] text-center uppercase"
          style={{ color: 'rgba(245,158,11,.82)', fontSize: 15, fontWeight: 600, letterSpacing: '.14em', lineHeight: 1.2 }}
        >
          Потенциал дня
        </p>
      )}
    </div>
  );
}

export default function Home() {
  const {
    userState,
    potential,
    readNews,
    updateState,
    isSignedIn,
    isAuthLoaded,
    isAccountReady,
    accountLoadError,
    retryAccountHydration,
  } = useAppStore();
  const { email: authEmail } = useAuthInfo();
  const [, setLocation] = useLocation();
  const [accountWaitExpired, setAccountWaitExpired] = useState(false);

  const { weekday, date } = getTodayLabels();
  const developerToolsEnabled = hasDeveloperTools(authEmail, isSignedIn);
  const [devPotential, setDevPotentialState] = useState(() => getDevPotential());
  const [newsStackProgress, setNewsStackProgress] = useState(0);
  const ringBurst = false;
  const burstRotation = useSmoothRingBurstRotation();
  const newsScrollFrame = useRef<number | null>(null);

  const waitingForAccount =
    !import.meta.env.DEV && (!isAuthLoaded || (isSignedIn && !isAccountReady));

  useEffect(() => {
    if (!waitingForAccount) {
      setAccountWaitExpired(false);
      return undefined;
    }
    const timer = window.setTimeout(() => setAccountWaitExpired(true), 15_000);
    return () => window.clearTimeout(timer);
  }, [waitingForAccount]);

  useEffect(() => {
    if (!developerToolsEnabled) return;
    const syncDevPotential = () => setDevPotentialState(getDevPotential());
    syncDevPotential();
    window.addEventListener(DEV_POTENTIAL_EVENT, syncDevPotential);
    return () => window.removeEventListener(DEV_POTENTIAL_EVENT, syncDevPotential);
  }, [developerToolsEnabled]);

  useEffect(() => {
    return () => {
      if (newsScrollFrame.current !== null) {
        cancelAnimationFrame(newsScrollFrame.current);
      }
    };
  }, []);

  const handleHomeScroll = (event: UIEvent<HTMLDivElement>) => {
    if (newsScrollFrame.current !== null) {
      cancelAnimationFrame(newsScrollFrame.current);
    }
    const nextProgress = Math.min(
      1,
      Math.max(0, (event.currentTarget.scrollTop - NEWS_STACK_START) / NEWS_STACK_RELEASE),
    );
    newsScrollFrame.current = requestAnimationFrame(() => {
      newsScrollFrame.current = null;
      setNewsStackProgress(nextProgress);
    });
  };

  const visualPotential = developerToolsEnabled ? devPotential : potential;

  if (isSignedIn && accountLoadError) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center px-6">
        <div className="text-center max-w-[320px]">
          <p className="body text-secondary mb-5">{accountLoadError}</p>
          <button
            className="btn-grad w-full h-[52px] rounded-[14px] title-s"
            onClick={retryAccountHydration}
          >
            Повторить
          </button>
        </div>
      </div>
    );
  }

  if (waitingForAccount && accountWaitExpired) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center px-6">
        <div className="text-center max-w-[320px]">
          <p className="body text-secondary mb-5">
            Не удалось завершить вход и загрузить данные аккаунта. Повтори попытку или войди заново.
          </p>
          <div className="flex flex-col gap-3">
            <button
              className="btn-grad w-full h-[52px] rounded-[14px] title-s"
              onClick={() => window.location.reload()}
            >
              Повторить
            </button>
            <button
              className="w-full h-[48px] rounded-[14px] title-s text-secondary border border-white/10"
              onClick={() => setLocation('/sign-in')}
            >
              Вернуться ко входу
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (waitingForAccount) {
    return <DataLoadingScreen />;
  }

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
            <button
              className="w-full h-[50px] rounded-[16px] body flex items-center justify-center gap-2 mt-3"
              style={{ border: '1px solid rgba(100,160,230,0.25)', color: 'rgba(147,197,253,0.75)' }}
              onClick={() => setLocation('/sign-in')}
            >
              <LogIn size={17} />
              Уже есть аккаунт? Войти
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-[calc(100dvh-60px)] overflow-x-hidden overflow-y-auto overscroll-contain pb-[110px]" onScroll={handleHomeScroll}>
      <div className="relative z-10">

        <div className="flex items-center justify-between px-6 pt-[38px] pb-1">
          <span
            style={{
              color: 'rgba(167,185,201,.68)',
              fontSize: 15,
              fontWeight: 400,
              lineHeight: 1,
              letterSpacing: '.02em',
            }}
          >
            {date}
          </span>
          <span
            style={{
              color: 'rgba(167,185,201,.68)',
              fontSize: 15,
              fontWeight: 400,
              lineHeight: 1,
              letterSpacing: '.02em',
            }}
          >
            {weekday}
          </span>
        </div>

        <div className="flex flex-col items-center pt-[78px] pb-2 px-5">
          <PotentialScale value={visualPotential} />
        </div>

        <div className="mx-5 mt-4 mb-6 h-px" style={{ background: 'rgba(100,160,230,0.1)' }} />

        <section className="px-5 pb-8 pt-[44px]">
          <motion.div
            initial={{ opacity: 0, y: 12, filter: "blur(16px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ delay: 0, duration: 1.05, ease: NEWS_EASE }}
            className="mb-5 flex items-center gap-5 pl-8"
          >
            <NewsSystemMark />
            <h2
              className="ml-2 min-w-0 text-left uppercase"
            style={{ color: 'rgba(245,158,11,.82)', fontSize: 15, fontWeight: 600, letterSpacing: '0.14em', lineHeight: 1.2 }}
            >
              <span className="block">Новости</span>
              <span className="block">системы</span>
            </h2>
          </motion.div>

          <div className="news-stack-list relative z-10 space-y-3 overflow-x-hidden">
            {NEWS_ITEMS.map((item, i) => {
              const isRead = readNews.includes(item.id);
              return (
                <NewsCardMotion key={item.id} newsIdx={i}>
                  <motion.button
                    type="button"
                    onClick={() => {
                      if (!isRead) updateState(prev => ({ readNews: [...prev.readNews, item.id] }));
                      setLocation(`/news/${item.id}`);
                    }}
                    className="group relative min-h-[196px] w-full overflow-visible rounded-[20px] p-0 text-left transition-[filter] active:brightness-110"
                    whileHover={{ y: -2, scale: 1.006 }}
                    whileTap={{ scale: 0.968, y: 3, rotateX: -3, filter: "brightness(1.18) saturate(1.14)" }}
                    transition={{ type: "spring", stiffness: 420, damping: 25, mass: 0.65 }}
                  >
                    <NewsCardVisualMotion newsIdx={i} stackProgress={newsStackProgress}>
                       <motion.div className="pointer-events-none absolute inset-0" style={{ rotate: burstRotation }}>
                      <motion.div
                        aria-hidden="true"
                        className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full border"
                        style={{
                          borderColor: 'rgba(255,224,166,.24)',
                          boxShadow: '0 0 32px rgba(249,115,22,.16)',
                        }}
                        animate={{ rotate: ringRotationTarget(1, 22 + i * 3, ringBurst), opacity: [0.24, 0.48, 0.24] }}
                         transition={{ rotate: ringRotationTransition(22 + i * 3, ringBurst), opacity: { duration: 4.2, repeat: Infinity, ease: "easeInOut" } }}
                      />
                      <motion.div
                        aria-hidden="true"
                        className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full"
                        style={{
                          background: 'repeating-conic-gradient(from 12deg, rgba(255,237,170,.42) 0deg 1.4deg, transparent 1.4deg 15deg)',
                          maskImage: 'radial-gradient(circle, transparent 76%, #000 78%, #000 82%, transparent 84%)',
                          WebkitMaskImage: 'radial-gradient(circle, transparent 76%, #000 78%, #000 82%, transparent 84%)',
                        }}
                        animate={{ rotate: ringRotationTarget(-1, 16 + i * 2, ringBurst), opacity: [0.18, 0.42, 0.18] }}
                         transition={{ rotate: ringRotationTransition(16 + i * 2, ringBurst) }}
                       />
                       </motion.div>
                      <div className="relative z-10 flex items-start justify-between gap-3 pr-20">
                        <h3 className="title-s min-w-0 flex-1 text-primary leading-snug">
                          {item.title}
                        </h3>
                      </div>
                      <span
                        className="caption absolute right-10 top-4 z-10"
                        style={{ color: 'rgba(255,228,181,.72)' }}
                      >
                        {item.date}
                      </span>
                      {!isRead && (
                        <span
                          aria-label="Непрочитано"
                          className="absolute right-3 top-3 z-20 h-2.5 w-2.5 rounded-full"
                          style={{ background: '#EF4444', boxShadow: '0 0 8px rgba(239,68,68,0.9)' }}
                        />
                      )}
                      <p className="relative z-10 mt-2 line-clamp-3 text-secondary body-s leading-relaxed">
                        {item.description}
                      </p>
                    </NewsCardVisualMotion>
                  </motion.button>
                </NewsCardMotion>
              );
            })}
          </div>
        </section>

      </div>
    </div>
  );
}
