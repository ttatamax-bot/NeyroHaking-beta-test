import { useAppStore } from "@/lib/store";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Sparkles, ChevronRight, Target, Map as MapIcon, Eye, LogIn } from "lucide-react";
import { DataLoadingScreen } from "@/components/DataLoadingScreen";
import { DEV_POTENTIAL_EVENT, getDevPotential } from "@/lib/dev-potential";
import { hasDeveloperTools } from "@/lib/developer-mode";
import { useAuthInfo } from "@/lib/clerk";

const NEWS_ITEMS = [
  { id: '1', title: "Новая техника нейровизуализации", description: "Обновлён алгоритм прохождения техники T2 — визуализация теперь более структурированная и точная.", date: "28.05.2026" },
  { id: '2', title: "Важно о серии", description: "Серия сохраняется после выполнения любой техники за день. Следи за этим.", date: "20.05.2026" },
  { id: '3', title: "Академия пополнилась", description: "Добавлены новые статьи по нейробиологии дофамина и силе воли.", date: "10.05.2026" },
];

const SCALE_BAR_COUNT = 12;

function getTodayLabels() {
  const today = new Date();
  return {
    weekday: new Intl.DateTimeFormat('ru-RU', { weekday: 'short' })
      .format(today)
      .replace(/\.$/, ''),
    date: new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long' }).format(today),
  };
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
      <div
        className="pointer-events-none absolute left-1/2 top-[120px] z-0 h-0 w-0 -translate-x-1/2 -translate-y-1/2"
        style={{ opacity: .18 + ringProgress * .82 }}
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
          animate={{ rotate: 360 }}
          transition={{ duration: 16 * speedFactor, repeat: Infinity, ease: 'linear' }}
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
            animate={{ rotate: -360, opacity: [.24, .48, .24] }}
            transition={{
              rotate: { duration: 20 * speedFactor, repeat: Infinity, ease: 'linear' },
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
          animate={{ rotate: -360 }}
          transition={{ duration: 22 * speedFactor, repeat: Infinity, ease: 'linear' }}
          style={{
            background: 'conic-gradient(from 20deg, transparent 0deg, rgba(255,237,170,.42) 40deg, transparent 78deg, transparent 174deg, rgba(249,115,22,.3) 218deg, transparent 266deg)',
            maskImage: 'radial-gradient(circle, transparent 67%, #000 69%, #000 73%, transparent 76%)',
            WebkitMaskImage: 'radial-gradient(circle, transparent 67%, #000 69%, #000 73%, transparent 76%)',
          }}
        />
        {visualValue >= 30 && (
          <motion.div
            className="absolute left-1/2 top-1/2 h-[302px] w-[302px] -translate-x-1/2 -translate-y-1/2 rounded-full border-[0.5px]"
            animate={{ rotate: 360, opacity: [.2, .42, .2] }}
            transition={{
              rotate: { duration: 14 * speedFactor, repeat: Infinity, ease: 'linear' },
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
            animate={{ rotate: -360, opacity: [.16, .36, .16] }}
            transition={{
              rotate: { duration: 12 * speedFactor, repeat: Infinity, ease: 'linear' },
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
            animate={{ rotate: 360, opacity: [.15, .34, .15] }}
            transition={{
              rotate: { duration: 10 * speedFactor, repeat: Infinity, ease: 'linear' },
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
            animate={{ rotate: -360, opacity: [.14, .32, .14] }}
            transition={{
              rotate: { duration: 8 * speedFactor, repeat: Infinity, ease: 'linear' },
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
            animate={{ rotate: 360, opacity: [.18, .42, .18] }}
            transition={{
              rotate: { duration: 6.2 * speedFactor, repeat: Infinity, ease: 'linear' },
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
            animate={{ rotate: -360, opacity: [.16, .38, .16] }}
            transition={{
              rotate: { duration: 4.8 * speedFactor, repeat: Infinity, ease: 'linear' },
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
            animate={{ rotate: 360, opacity: [.154, .385, .154] }}
            transition={{
              rotate: { duration: 11 * speedFactor, repeat: Infinity, ease: 'linear' },
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
            animate={{ rotate: -360, opacity: [.18, .38, .18] }}
            transition={{
              rotate: { duration: 17 * speedFactor, repeat: Infinity, ease: 'linear' },
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
            animate={{ rotate: -360, opacity: [.2, .5, .2] }}
            transition={{
              rotate: { duration: 14 * speedFactor, repeat: Infinity, ease: 'linear' },
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
            animate={{ rotate: 360 }}
            transition={{ duration: 19 * speedFactor, repeat: Infinity, ease: 'linear' }}
          >
            <span className="absolute left-1/2 top-0 h-[5px] w-[5px] -translate-x-1/2 rounded-full" style={{ background: '#FFD29A', boxShadow: '0 0 14px 5px rgba(249,115,22,.72)' }} />
            <span className="absolute bottom-[13%] right-[6%] h-[3px] w-[3px] rounded-full" style={{ background: '#F97316', boxShadow: '0 0 10px 3px rgba(249,115,22,.62)' }} />
            <span className="absolute bottom-[16%] left-[8%] h-[4px] w-[4px] rounded-full" style={{ background: '#FFE4B5', boxShadow: '0 0 12px 4px rgba(255,224,166,.55)' }} />
          </motion.div>
        )}
      </div>
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
    goals,
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

  const activeGoals = goals.filter(g => g.status === 'active');
  const { weekday, date } = getTodayLabels();
  const developerToolsEnabled = hasDeveloperTools(authEmail, isSignedIn);
  const [devPotential, setDevPotentialState] = useState(() => getDevPotential());

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
    <div className="relative pb-[110px] overflow-y-auto min-h-[100dvh]">
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

        {activeGoals.length > 0 && (
          <motion.section
            className="px-5 mt-[24px] mb-5 space-y-3"
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
                      <MapIcon size={14} color="#FDE68A" />
                      <span style={{ color: 'rgba(255,255,255,0.9)' }}>Приблизиться</span>
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.section>
        )}

        <div className="mx-5 mt-6 mb-5 h-px" style={{ background: 'rgba(100,160,230,0.1)' }} />

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
