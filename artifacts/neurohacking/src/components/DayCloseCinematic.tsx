import { useAnimationFrame, useMotionValue, useReducedMotion, useTransform, motion } from "framer-motion";
import { KeyRound } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { PotentialScale } from "@/pages/home";

const DURATION_MS = 16680;
const SCALE_BAR_COUNT = 12;
const POTENTIAL_COMPLETE_MS = 6600;
const POTENTIAL_START_MS = 720;
const SHAKE_START_POTENTIAL = 62;
const SHAKE_START_DELAY_MS = 1000;
const FLASH_DURATION_MS = 9800;
const POTENTIAL_LOCK_PROGRESS = 0.995;
const BLUR_START_MS = 8760;
const SERIES_START_MS = 10200;
const BONUS_CARD_START_MS = SERIES_START_MS - 1000;
const FLY_START_MS = 11640;
const ZERO_REWARD_CARD_FLY_START_MS = FLY_START_MS;
const FADE_START_MS = 14520;
const FINAL_FADE_DURATION_S = 0.82;

const PARTICLES = [
  { x: "8%", y: "24%", size: 3, delay: 0, drift: -22 },
  { x: "17%", y: "72%", size: 2, delay: 0.4, drift: 16 },
  { x: "27%", y: "14%", size: 2, delay: 0.8, drift: -10 },
  { x: "39%", y: "82%", size: 3, delay: 0.2, drift: 24 },
  { x: "52%", y: "19%", size: 2, delay: 1.1, drift: -18 },
  { x: "64%", y: "76%", size: 2, delay: 0.55, drift: 12 },
  { x: "76%", y: "29%", size: 3, delay: 0.15, drift: -28 },
  { x: "91%", y: "63%", size: 2, delay: 1.35, drift: 18 },
  { x: "5%", y: "48%", size: 2, delay: 1.6, drift: -12 },
  { x: "22%", y: "42%", size: 3, delay: 0.95, drift: 20 },
  { x: "82%", y: "12%", size: 2, delay: 0.65, drift: -15 },
   { x: "94%", y: "87%", size: 3, delay: 1.8, drift: 14 },
   { x: "13%", y: "91%", size: 2, delay: 1.25, drift: -18 },
   { x: "72%", y: "52%", size: 2, delay: 1.05, drift: 26 },
   { x: "34%", y: "25%", size: 3, delay: .35, drift: -16 },
   { x: "58%", y: "31%", size: 2, delay: 1.5, drift: 20 },
   { x: "43%", y: "48%", size: 2, delay: .72, drift: -24 },
   { x: "63%", y: "58%", size: 3, delay: 1.9, drift: 16 },
   { x: "19%", y: "33%", size: 2, delay: 1.1, drift: 12 },
   { x: "87%", y: "35%", size: 3, delay: .5, drift: -20 },
   { x: "29%", y: "61%", size: 2, delay: 1.75, drift: 22 },
   { x: "78%", y: "76%", size: 2, delay: .9, drift: -14 },
   { x: "51%", y: "88%", size: 3, delay: 1.35, drift: 18 },
   { x: "7%", y: "17%", size: 2, delay: 2.1, drift: -10 },
   { x: "96%", y: "52%", size: 2, delay: 1.55, drift: 15 },
   { x: "38%", y: "68%", size: 3, delay: .25, drift: -18 },
   { x: "67%", y: "18%", size: 2, delay: 1.25, drift: 24 },
];

const STREAKS = [
  { x: "14%", y: "56%", rotate: -24, height: 42, delay: 0.1 },
  { x: "31%", y: "72%", rotate: 18, height: 30, delay: 0.42 },
  { x: "69%", y: "67%", rotate: -15, height: 50, delay: 0.28 },
  { x: "85%", y: "47%", rotate: 22, height: 34, delay: 0.64 },
  { x: "47%", y: "90%", rotate: -6, height: 54, delay: 0.82 },
];

function clamp(value: number, min = 0, max = 100) {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}

function potentialAtElapsedMs(elapsedMs: number) {
  const surge = clamp((elapsedMs - POTENTIAL_START_MS) / (POTENTIAL_COMPLETE_MS - POTENTIAL_START_MS));
  const eased = 1 - Math.pow(1 - surge, 2.7);
  return Number.isFinite(eased) ? Math.round(clamp(eased * 100)) : 0;
}

function potentialProgressAtElapsedMs(elapsedMs: number) {
  const surge = clamp((elapsedMs - POTENTIAL_START_MS) / (POTENTIAL_COMPLETE_MS - POTENTIAL_START_MS));
  const eased = 1 - Math.pow(1 - surge, 2.7);
  return Number.isFinite(eased) ? clamp(eased, 0, 1) : 0;
}

function elapsedAtPotentialProgress(progress: number) {
  const safeProgress = clamp(progress, 0, 1);
  const surge = 1 - Math.pow(1 - safeProgress, 1 / 2.7);
  return POTENTIAL_START_MS + surge * (POTENTIAL_COMPLETE_MS - POTENTIAL_START_MS);
}

const POTENTIAL_LOCK_MS = elapsedAtPotentialProgress(POTENTIAL_LOCK_PROGRESS);

function smoothstep(progress: number) {
  const safeProgress = clamp(progress, 0, 1);
  return safeProgress * safeProgress * (3 - 2 * safeProgress);
}

function todayInRussian() {
  return new Intl.DateTimeFormat("ru-RU", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());
}

export default function DayCloseCinematic({
  fromPotential,
  gainedPotential,
  keysAwarded,
  streakDay,
  onComplete,
}: {
  fromPotential: number;
  gainedPotential: number;
  keysAwarded: number;
  streakDay: number;
  onComplete: () => void;
}) {
  const reducedMotion = useReducedMotion();
  const timeline = useMotionValue(0);
  const stageShakeX = useMotionValue(0);
  const stageShakeRotate = useMotionValue(0);
  const shakeClockRef = useRef(0);
  const shakeSpeedRef = useRef(1);
  const lastShakeTimeRef = useRef<number | null>(null);
  const completedRef = useRef(false);
  const startedAtRef = useRef<number | null>(null);
  const potentialLockedRef = useRef(false);
  const onCompleteRef = useRef(onComplete);
  const [displayPotential, setDisplayPotential] = useState(0);
  const [phase, setPhase] = useState<"build" | "surge" | "reward" | "blur" | "series" | "fly" | "fade">("build");
  const [bonusCardStarted, setBonusCardStarted] = useState(false);
  const [zeroRewardCardFlyStarted, setZeroRewardCardFlyStarted] = useState(false);
  const rewardCount = Math.max(100, Number.isFinite(keysAwarded) ? Math.round(keysAwarded) : 100);
  const baseReward = 100;
  const bonusReward = Math.max(0, rewardCount - baseReward);
  const hasSeriesBonus = bonusReward > 0;
  const isZeroSeriesScenario = !hasSeriesBonus;
  const finalFadeDurationS = hasSeriesBonus ? FINAL_FADE_DURATION_S : 0.24;
  onCompleteRef.current = onComplete;

  useEffect(() => {
    const finishTimer = window.setTimeout(() => {
      if (completedRef.current) return;
      completedRef.current = true;
      onCompleteRef.current();
    }, DURATION_MS);

    return () => window.clearTimeout(finishTimer);
  }, []);

  useAnimationFrame((time) => {
    if (completedRef.current) return;
    if (startedAtRef.current === null) startedAtRef.current = time;
    const nextTime = Math.min((time - startedAtRef.current) / DURATION_MS, 1);
    timeline.set(nextTime);
    const elapsedMs = nextTime * DURATION_MS;
    const calculatedPotential = potentialAtElapsedMs(elapsedMs);
    const reachedPotential = potentialLockedRef.current || calculatedPotential >= 100;
      const shakeStartMs =
        elapsedAtPotentialProgress(SHAKE_START_POTENTIAL / 100) + SHAKE_START_DELAY_MS;
      const shakeBuildProgress = smoothstep(
        (elapsedMs - shakeStartMs) / (POTENTIAL_COMPLETE_MS - shakeStartMs),
    );
      const anticipation = reachedPotential ? 0 : shakeBuildProgress;
    if (reducedMotion) {
        shakeSpeedRef.current = 1;
      stageShakeX.set(0);
      stageShakeRotate.set(0);
    } else {
      if (lastShakeTimeRef.current === null) lastShakeTimeRef.current = time;
      const frameDelta = Math.min(40, Math.max(0, time - lastShakeTimeRef.current));
      lastShakeTimeRef.current = time;
        const targetShakeSpeed = 1 + anticipation * 1.5;
        const speedSmoothing = 1 - Math.exp(-frameDelta / 220);
        shakeSpeedRef.current +=
          (targetShakeSpeed - shakeSpeedRef.current) * speedSmoothing;
        shakeClockRef.current += frameDelta * 0.038 * shakeSpeedRef.current;
      const shakeTime = shakeClockRef.current;
      stageShakeX.set(
          Math.sin(shakeTime) * 4.2 * anticipation,
      );
      stageShakeRotate.set(
          Math.sin(shakeTime * 0.92 + 0.4) * 0.46 * anticipation,
      );
    }
    if (reachedPotential) potentialLockedRef.current = true;
    const nextPotential = reachedPotential
      ? 100
      : calculatedPotential;
    setDisplayPotential((current) => current === nextPotential ? current : nextPotential);
    const nextPhase =
      elapsedMs >= FADE_START_MS ? "fade" :
      elapsedMs >= FLY_START_MS ? "fly" :
      hasSeriesBonus && elapsedMs >= SERIES_START_MS ? "series" :
      hasSeriesBonus && elapsedMs >= BLUR_START_MS ? "blur" :
      reachedPotential ? "reward" :
      nextTime >= 0.17 ? "surge" :
      "build";
    const nextBonusCardStarted = hasSeriesBonus && elapsedMs >= BONUS_CARD_START_MS;
    const nextZeroRewardCardFlyStarted =
      isZeroSeriesScenario && elapsedMs >= ZERO_REWARD_CARD_FLY_START_MS;
    setBonusCardStarted((current) => current === nextBonusCardStarted ? current : nextBonusCardStarted);
    setZeroRewardCardFlyStarted((current) =>
      current === nextZeroRewardCardFlyStarted ? current : nextZeroRewardCardFlyStarted,
    );
    setPhase((current) => current === nextPhase ? current : nextPhase);
  });

  const potential = useTransform(timeline, (value) => {
    const safeTimeline = Number.isFinite(value) ? value : 0;
    const elapsedMs = safeTimeline * DURATION_MS;
    const calculatedPotential = potentialAtElapsedMs(elapsedMs);
    if (potentialLockedRef.current || calculatedPotential >= 100) {
      potentialLockedRef.current = true;
      return 100;
    }
    return calculatedPotential;
  });
  const potentialNumberLabel = useTransform(potential, (value) => `${Number.isFinite(value) ? Math.round(clamp(value)) : 0}`);

  const safeStreakDay = Math.max(1, Number.isFinite(streakDay) ? Math.round(streakDay) : 1);
  const safeOrigin = Math.round(clamp(fromPotential));
  const shouldFlyZeroRewardCard = isZeroSeriesScenario && zeroRewardCardFlyStarted;

  return (
    <motion.div
      className="day-close-cinematic"
      role="dialog"
      aria-modal="true"
      aria-label={`Закрытие дня. Потенциал вырос с ${safeOrigin}% до 100%`}
      data-origin-potential={safeOrigin}
      data-gained-potential={Math.round(gainedPotential)}
      data-testid="overlay-day-close"
      initial={{ opacity: 1 }}
      animate={reducedMotion
        ? { opacity: phase === "fade" ? 0 : 1, x: 0 }
        : {
            opacity: phase === "fade" ? 0 : 1,
            x: phase === "surge" ? [0, -2, 2, -1, 0] : 0,
          }}
      transition={reducedMotion
        ? { duration: phase === "fade" ? finalFadeDurationS : 0, ease: hasSeriesBonus ? "easeInOut" : "easeIn" }
        : {
            opacity: { duration: phase === "fade" ? finalFadeDurationS : 0, ease: hasSeriesBonus ? "easeInOut" : "easeIn" },
            x: { duration: 0.8, ease: [0.16, 1, 0.3, 1] },
          }}
    >
      <style>{`
        .day-close-cinematic {
          --close-ink: var(--text-primary, #f6f3ed);
          --close-muted: var(--text-secondary, #a7b9c9);
          --close-orange: #f97316;
          --close-amber: #ffbd70;
          position: fixed;
          inset: 0;
           z-index: 10000;
          isolation: isolate;
          overflow: hidden;
          color: var(--close-ink);
          background:
            radial-gradient(ellipse 92% 48% at 50% 56%, rgba(29, 78, 216, .18), transparent 70%),
            radial-gradient(ellipse 54% 35% at 50% 101%, rgba(249, 115, 22, .17), transparent 72%),
            #050b18;
          font-family: var(--font-sans, "IBM Plex Sans", sans-serif);
          -webkit-font-smoothing: antialiased;
        }
        .day-close-cinematic::before {
          content: "";
          position: absolute;
          inset: 0;
          z-index: -1;
          pointer-events: none;
          opacity: .14;
          background-image: radial-gradient(rgba(255,255,255,.22) .6px, transparent .6px);
          background-size: 5px 5px;
          mix-blend-mode: screen;
        }
        .close-date {
          position: absolute;
          top: max(25px, env(safe-area-inset-top));
          left: 16px;
          right: 16px;
          z-index: 10;
          text-align: center;
          color: rgba(220, 231, 240, .68);
          font-size: 12px;
          font-weight: 500;
          letter-spacing: .075em;
          text-transform: capitalize;
        }
        .close-date::after {
          content: "";
          display: block;
          width: 32px;
          height: 1px;
          margin: 12px auto 0;
          background: linear-gradient(90deg, transparent, rgba(249,115,22,.72), transparent);
        }
        .close-stage {
          position: absolute;
          top: 50%;
          left: 50%;
          width: min(100vw, 430px);
          height: min(100vw, 430px);
           translate: -50% -50%;
           transform: none;
        }
        .close-stage-shake {
          position: absolute;
          inset: -18%;
          display: grid;
          place-items: center;
          transform-origin: center;
        }
        .close-haze {
          position: absolute;
          width: 78%;
          height: 78%;
          border-radius: 50%;
          background: rgba(249, 115, 22, .22);
          opacity: .72;
          transform: scale(.72);
        }
        .close-haze-blue {
          width: 120%;
          height: 120%;
          background: rgba(37, 99, 235, .14);
          opacity: .66;
        }
        .close-ring {
          position: absolute;
          left: 50%;
          top: 50%;
          border-radius: 50%;
           translate: -50% -50%;
           transform: none;
           background: transparent;
           border: 0;
           box-shadow: none;
           filter: none;
        }
        .close-ring::after {
           display: none;
        }
          .close-ring-outer {
            width: 84%;
            height: 84%;
            border: 1px solid rgba(249,115,22,.08);
            border-top-color: rgba(255,237,170,.4);
            border-right-color: rgba(249,115,22,.25);
            mask-image: radial-gradient(circle, transparent 64%, #000 66%, #000 69%, transparent 72%);
            -webkit-mask-image: radial-gradient(circle, transparent 64%, #000 66%, #000 69%, transparent 72%);
            opacity: .82;
          }
          .close-ring-middle {
            width: 80%;
            height: 80%;
            border: .5px solid rgba(255,224,166,.24);
            border-top-color: rgba(255,237,170,.5);
            border-left-color: rgba(249,115,22,.34);
          }
          .close-ring-inner {
            width: 74%;
            height: 74%;
            background: conic-gradient(
              from 20deg,
              transparent 0deg,
              rgba(255,237,170,.42) 40deg,
              transparent 78deg,
              transparent 174deg,
              rgba(249,115,22,.3) 218deg,
              transparent 266deg
            );
            mask-image: radial-gradient(circle, transparent 67%, #000 69%, #000 73%, transparent 76%);
            -webkit-mask-image: radial-gradient(circle, transparent 67%, #000 69%, #000 73%, transparent 76%);
          }
          .close-ring-dashed {
            width: 64%;
            height: 64%;
            background: repeating-conic-gradient(from 4deg, rgba(255,215,145,.28) 0deg 1.5deg, transparent 1.5deg 14deg);
            mask-image: radial-gradient(circle, transparent 65%, #000 67%, #000 70%, transparent 73%);
            -webkit-mask-image: radial-gradient(circle, transparent 65%, #000 67%, #000 70%, transparent 73%);
          }
          .close-ring-arc {
            width: 63%;
            height: 63%;
            background: conic-gradient(
              from -34deg,
              rgba(255,237,170,.5) 0deg 166deg,
              transparent 166deg 360deg
            );
            mask-image: radial-gradient(circle, transparent 76%, #000 77.5%, #000 79%, transparent 80.5%);
            -webkit-mask-image: radial-gradient(circle, transparent 76%, #000 77.5%, #000 79%, transparent 80.5%);
          }
        .close-ring-core {
           width: 57%;
           height: 57%;
           border: .5px solid rgba(255,224,166,.22);
           border-right-color: rgba(255,237,170,.44);
           border-bottom-color: rgba(249,115,22,.3);
           mask-image: radial-gradient(circle, transparent 73%, #000 75%, #000 77%, transparent 79%);
           -webkit-mask-image: radial-gradient(circle, transparent 73%, #000 75%, #000 77%, transparent 79%);
        }
          .close-ring-fine-outer {
            width: 108%;
            height: 108%;
            border: .5px solid rgba(255,237,190,.34);
          }
         .close-ring-fine-upper {
           width: 96%;
           height: 96%;
            border: .5px solid rgba(255,246,220,.3);
            border-top-color: rgba(255,237,170,.58);
            border-left-color: rgba(249,115,22,.32);
         }
         .close-ring-fine-center {
           width: 46%;
           height: 46%;
            border: .5px solid rgba(255,241,204,.36);
            border-right-color: rgba(249,115,22,.42);
         }
         .close-ring-fine-core {
           width: 35%;
           height: 35%;
            border: .5px solid rgba(255,250,232,.38);
            border-bottom-color: rgba(249,115,22,.46);
         }
         .close-ring-many {
           border: .5px solid rgba(255,235,190,.32);
            opacity: .62;
         }
          .close-ring-many-1 { width: 116%; height: 116%; border-color: rgba(255,241,204,.34); }
          .close-ring-many-2 { width: 111%; height: 111%; border-color: rgba(249,115,22,.28); }
          .close-ring-many-3 { width: 102%; height: 102%; border-color: rgba(255,222,160,.32); }
          .close-ring-many-4 { width: 94%; height: 94%; border-color: rgba(249,115,22,.3); }
          .close-ring-many-5 { width: 87%; height: 87%; border-color: rgba(255,237,170,.34); }
          .close-ring-many-6 { width: 79%; height: 79%; border-color: rgba(249,115,22,.28); }
          .close-ring-many-7 { width: 69%; height: 69%; border-color: rgba(255,241,204,.36); }
          .close-ring-many-8 { width: 59%; height: 59%; border-color: rgba(249,115,22,.3); }
          .close-ring-many-9 { width: 49%; height: 49%; border-color: rgba(255,237,170,.38); }
          .close-ring-many-10 { width: 39%; height: 39%; border-color: rgba(249,115,22,.34); }
         .close-orbit-dot-two { top: 50%; left: -4px; transform: translateY(-50%); }
         .close-orbit-dot-three { top: auto; left: auto; right: 16%; bottom: -4px; }
         .close-scale-legacy {
           display: none;
         }
         .close-home-scale {
           position: absolute;
           left: 50%;
           top: calc(24% + 80px);
           z-index: 6;
           width: min(350px, 90vw);
           height: 140px;
           pointer-events: none;
         }
         .close-home-scale > div {
           position: absolute;
           left: 50%;
           top: -122px;
           width: min(360px, 100%);
           max-width: 360px;
           height: 370px;
           transform: translateX(-50%);
         }
         .close-home-scale > div > .pointer-events-none {
           display: none;
         }
         .close-scale {
           position: absolute;
           left: 50%;
            top: calc(24% - 10px);
           z-index: 6;
           display: flex;
            width: min(360px, 100%);
            height: 116px;
            align-items: center;
           justify-content: center;
            gap: 13px;
            transform: translate(-50%, -50%);
         }
         .close-scale-bar {
           position: relative;
            width: 10px;
            height: 64px;
           flex: 0 0 auto;
           border-radius: 999px;
           transform-origin: center;
            background: rgba(224,232,237,.58);
           will-change: height, transform, opacity, background-color;
         }
         .close-scale-bar::after {
            display: none;
         }
        .close-orbit-dot {
          position: absolute;
          top: -4px;
          left: 50%;
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #fff5df;
          box-shadow: 0 0 13px 5px rgba(249,115,22,.82);
          transform: translateX(-50%);
        }
        .close-particle {
          position: absolute;
          z-index: 3;
          border-radius: 50%;
          background: #ffd39c;
          box-shadow: 0 0 13px 3px rgba(249,115,22,.6);
          will-change: transform, opacity;
        }
        .close-streak {
          position: absolute;
          z-index: 2;
          width: 1px;
          border-radius: 99px;
          background: linear-gradient(180deg, transparent, #ffbd70, transparent);
          box-shadow: 0 0 10px rgba(249,115,22,.75);
          transform-origin: center;
          will-change: transform, opacity;
        }
        .close-readout {
          position: absolute;
          z-index: 5;
          inset: 0;
           left: 0;
           right: 0;
           width: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
           justify-content: flex-start;
           padding-top: 49%;
          text-align: center;
        }
         .close-readout-kicker {
           order: 2;
           margin-top: 12px;
          color: rgba(255, 199, 132, .88);
           font-size: 17px;
           font-weight: 600;
           letter-spacing: .04em;
        }
        .close-number {
           display: block;
           order: 1;
          font-family: var(--font-num, "Space Mono", monospace);
           font-size: clamp(58px, 18vw, 82px);
          font-weight: 300;
          line-height: .86;
          letter-spacing: -.1em;
          text-shadow: 0 0 28px rgba(255, 229, 191, .34), 0 0 70px rgba(249,115,22,.24);
        }
         .close-number-row {
            position: relative;
            display: block;
             width: max-content;
             left: -10px;
             margin-inline: auto;
         }
         .close-number-percent {
            position: absolute;
             left: calc(100% + 8px);
            bottom: 3px;
            margin: 0;
           color: rgba(255, 237, 210, .88);
           font-family: var(--font-num, "Space Mono", monospace);
            font-size: clamp(20px, 5.5vw, 28px);
           line-height: 1;
            white-space: nowrap;
         }
         .close-finished-label {
           position: absolute;
           left: 50%;
           top: 50%;
           z-index: 11;
           display: flex;
           align-items: center;
           gap: 12px;
           color: rgba(255, 242, 218, .96);
           font-size: clamp(22px, 6vw, 30px);
           font-weight: 600;
           letter-spacing: .04em;
           text-shadow: 0 0 22px rgba(249,115,22,.65), 0 0 54px rgba(255,237,170,.24);
           translate: -50% -50%;
           transform: none;
           white-space: nowrap;
         }
         .close-finished-label::before {
           content: "✦";
           color: #ffbd70;
           font-size: .82em;
         }
        .close-reward {
          position: absolute;
          left: 50%;
          top: 50%;
           z-index: 10;
          display: flex;
           min-width: min(286px, 84vw);
          align-items: center;
           gap: 18px;
           padding: 21px 25px 21px 20px;
           border: 1px solid rgba(255, 222, 171, .84);
           border-radius: 24px;
           background: linear-gradient(135deg, rgba(77, 35, 13, .99), rgba(18, 20, 32, .99));
           box-shadow: 0 0 0 7px rgba(249,115,22,.1), 0 0 65px rgba(249,115,22,.62), 0 20px 55px rgba(0,0,0,.62);
          translate: -50% -50%;
          transform: none;
          will-change: transform, opacity;
        }
         .close-reward-aura {
           position: absolute;
           inset: -28%;
           z-index: 9;
           pointer-events: none;
           border-radius: 50%;
           background: radial-gradient(circle, rgba(255, 239, 204, .45) 0%, rgba(249,115,22,.28) 20%, rgba(249,115,22,.08) 44%, transparent 72%);
           will-change: transform, opacity;
         }
          .close-reward-zero-series {
            z-index: 13;
          }
         .close-bonus-card {
           position: absolute;
           left: 50%;
           top: 50%;
           z-index: 12;
           display: flex;
           min-width: min(300px, 88vw);
           align-items: center;
           gap: 18px;
           padding: 23px 27px 23px 22px;
           border: 1px solid rgba(255, 246, 218, .98);
           border-radius: 25px;
           background: linear-gradient(135deg, rgba(255, 161, 55, .99), rgba(194, 67, 4, .99) 54%, rgba(46, 19, 10, .99));
           box-shadow:
             0 0 0 8px rgba(255, 154, 48, .14),
             0 0 34px rgba(255, 170, 68, .92),
             0 0 110px rgba(249, 115, 22, .72),
             0 24px 58px rgba(0,0,0,.7);
           filter: saturate(1.4) brightness(1.12);
           translate: -50% -50%;
           transform: none;
           will-change: transform, opacity, filter;
         }
         .close-bonus-card .close-reward-icon {
           background: linear-gradient(145deg, #fff3c7, #ff8a18 58%, #d84a04);
           box-shadow: 0 0 25px rgba(255, 229, 158, .9), inset 0 1px 0 rgba(255,255,255,.72);
         }
         .close-bonus-card .close-reward-count {
           color: #fffaf0;
           font-size: 36px;
           text-shadow: 0 0 18px rgba(255, 245, 205, .85);
         }
         .close-backdrop-blur {
           position: absolute;
           inset: 0;
           z-index: 7;
           pointer-events: none;
           background: rgba(5, 11, 24, .08);
            will-change: opacity;
         }
        .close-reward-icon {
          display: grid;
           width: 62px;
           height: 62px;
          flex: 0 0 auto;
          place-items: center;
           border-radius: 17px;
          color: #fff1dc;
          background: linear-gradient(145deg, #ffb25f, #e26010);
          box-shadow: 0 0 18px rgba(249,115,22,.55), inset 0 1px 0 rgba(255,255,255,.4);
        }
        .close-reward-label {
          color: rgba(255, 219, 174, .7);
           font-size: 12px;
           font-weight: 600;
           letter-spacing: .17em;
        }
        .close-reward-count {
          margin-top: 1px;
          color: #fff4e5;
           font-family: var(--font-num, "Space Mono", monospace);
           font-size: 32px;
           font-weight: 500;
          letter-spacing: -.03em;
        }
         .close-reward-body {
           display: flex;
           min-width: 0;
           flex-direction: column;
           align-items: flex-start;
         }
         .close-streak-bonus {
           margin-top: 5px;
           color: #ffbf72;
           font-size: 11px;
           font-weight: 600;
           letter-spacing: .02em;
           white-space: nowrap;
         }
        .close-flash {
          position: absolute;
          inset: -20%;
          z-index: 7;
          pointer-events: none;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(255,249,235,.84) 0%, rgba(255,190,112,.24) 23%, transparent 62%);
          mix-blend-mode: screen;
        }
        @media (prefers-reduced-motion: reduce) {
          .day-close-cinematic *,
          .day-close-cinematic *::before,
          .day-close-cinematic *::after {
            scroll-behavior: auto !important;
          }
          .close-particle { opacity: .35 !important; }
        }
      `}</style>

      <div className="close-date" data-testid="text-day-close-date">{todayInRussian()}</div>

      <div className="close-stage" aria-hidden="true">
        <motion.div
          className="close-stage-shake"
          initial={{ y: "42vh", scale: 0.4, opacity: 0, rotate: 0 }}
          animate={reducedMotion
            ? { y: 0, scale: 1, opacity: 1, rotate: 0 }
            : {
                y: ["42vh", "0vh", "0vh", "0vh"],
                scale: [0.4, 0.48, 1.15, 1.04],
                opacity: [0, 0.76, 1, 1],
              }}
          transition={reducedMotion
            ? { duration: 1.15, ease: [0.16, 1, 0.3, 1] }
             : {
                 y: { duration: 6.2, times: [0, .72, .9, 1], ease: [0.16, 1, 0.3, 1] },
                 scale: { duration: 6.4, times: [0, .25, .58, 1], ease: [0.16, 1, 0.3, 1] },
                 opacity: { duration: 6.4, times: [0, .25, .58, 1], ease: [0.16, 1, 0.3, 1] },
               }}
          style={{ x: stageShakeX, rotate: stageShakeRotate, willChange: "transform, opacity" }}
        >
          <motion.div
            className="close-haze close-haze-blue"
            animate={reducedMotion ? { opacity: .45, scale: 1 } : { opacity: [.15, .72, .4], scale: [.55, 1.15, 1] }}
            transition={reducedMotion ? { duration: 1 } : { duration: 3.2, times: [0, .55, 1], ease: "easeOut" }}
          />
          <motion.div
            className="close-haze"
            animate={reducedMotion ? { opacity: .55, scale: 1 } : { opacity: [.1, .86, .48], scale: [.4, 1.25, 1] }}
            transition={reducedMotion ? { duration: 1.1 } : { duration: 3.3, times: [0, .62, 1], ease: "easeOut" }}
          />
          <motion.div
            className="close-ring close-ring-outer"
             animate={reducedMotion ? { rotate: 0, scale: 1, opacity: .65 } : { rotate: 360, scale: [1, 1.08, .98], opacity: [.28, .92, .56] }}
            transition={reducedMotion
              ? { duration: 1 }
              : {
                  rotate: { duration: 16, repeat: Infinity, ease: "linear" },
                  scale: { duration: 4.8, repeat: Infinity, ease: "easeInOut" },
                  opacity: { duration: 4.8, repeat: Infinity, ease: "easeInOut" },
                }}
          >
            <span className="close-orbit-dot" />
             <span className="close-orbit-dot close-orbit-dot-two" />
             <span className="close-orbit-dot close-orbit-dot-three" />
          </motion.div>
          <motion.div
            className="close-ring close-ring-middle"
             animate={reducedMotion ? { rotate: 0, scale: 1, opacity: .7 } : { rotate: -360, scale: [1, 1.12, .98], opacity: [.18, .78, .42] }}
            transition={reducedMotion
              ? { duration: 1.1 }
              : {
                  rotate: { duration: 13, repeat: Infinity, ease: "linear", delay: .08 },
                  scale: { duration: 5.4, repeat: Infinity, ease: "easeInOut", delay: .08 },
                  opacity: { duration: 5.4, repeat: Infinity, ease: "easeInOut", delay: .08 },
                }}
          />
          <motion.div
            className="close-ring close-ring-inner"
             animate={reducedMotion ? { rotate: 0, scale: 1, opacity: .8 } : { rotate: 360, scale: [1, 1.16, .96], opacity: [.2, .84, .46] }}
            transition={reducedMotion
              ? { duration: 1.2 }
              : {
                  rotate: { duration: 10, repeat: Infinity, ease: "linear", delay: .18 },
                  scale: { duration: 4.2, repeat: Infinity, ease: "easeInOut", delay: .18 },
                  opacity: { duration: 4.2, repeat: Infinity, ease: "easeInOut", delay: .18 },
                }}
          />
           <motion.div
             className="close-ring close-ring-dashed"
             animate={reducedMotion ? { rotate: 0, opacity: .62 } : { rotate: -360, opacity: [.22, .72, .3] }}
             transition={reducedMotion
               ? { duration: 1.1 }
               : {
                   rotate: { duration: 18, repeat: Infinity, ease: "linear" },
                   opacity: { duration: 3.8, repeat: Infinity, ease: "easeInOut" },
                 }}
           />
           <motion.div
             className="close-ring close-ring-arc"
             animate={reducedMotion ? { rotate: 0, opacity: .7 } : { rotate: 360, opacity: [.2, .88, .34] }}
             transition={reducedMotion
               ? { duration: 1.1 }
               : {
                   rotate: { duration: 7.5, repeat: Infinity, ease: "linear" },
                   opacity: { duration: 3.2, repeat: Infinity, ease: "easeInOut" },
                 }}
           />
          <motion.div
            className="close-ring close-ring-core"
             animate={reducedMotion ? { rotate: 0, scale: 1, opacity: 1 } : { rotate: -360, scale: [1, 1.18, .94], opacity: [.22, .92, .5] }}
            transition={reducedMotion
              ? { duration: 1.25 }
              : {
                  rotate: { duration: 8.5, repeat: Infinity, ease: "linear", delay: .24 },
                  scale: { duration: 3.6, repeat: Infinity, ease: "easeInOut", delay: .24 },
                  opacity: { duration: 3.6, repeat: Infinity, ease: "easeInOut", delay: .24 },
                }}
          />
          <motion.div
            className="close-ring close-ring-fine-outer"
            animate={reducedMotion ? { rotate: 0, opacity: .42 } : { rotate: -360, opacity: [.16, .52, .28] }}
            transition={reducedMotion
              ? { duration: 1 }
              : { rotate: { duration: 22, repeat: Infinity, ease: "linear" }, opacity: { duration: 5.8, repeat: Infinity, ease: "easeInOut" } }}
          />
          <motion.div
            className="close-ring close-ring-fine-upper"
            animate={reducedMotion ? { rotate: 0, opacity: .5 } : { rotate: 360, opacity: [.18, .62, .3] }}
            transition={reducedMotion
              ? { duration: 1 }
              : { rotate: { duration: 19, repeat: Infinity, ease: "linear", delay: .12 }, opacity: { duration: 4.6, repeat: Infinity, ease: "easeInOut" } }}
          />
          <motion.div
            className="close-ring close-ring-fine-center"
            animate={reducedMotion ? { rotate: 0, opacity: .48 } : { rotate: -360, opacity: [.18, .68, .3] }}
            transition={reducedMotion
              ? { duration: 1 }
              : { rotate: { duration: 11, repeat: Infinity, ease: "linear", delay: .2 }, opacity: { duration: 4.1, repeat: Infinity, ease: "easeInOut" } }}
          />
          <motion.div
            className="close-ring close-ring-fine-core"
            animate={reducedMotion ? { rotate: 0, opacity: .58 } : { rotate: 360, opacity: [.22, .78, .36] }}
            transition={reducedMotion
              ? { duration: 1 }
              : { rotate: { duration: 8, repeat: Infinity, ease: "linear", delay: .28 }, opacity: { duration: 3.7, repeat: Infinity, ease: "easeInOut" } }}
          />
          {Array.from({ length: 10 }, (_, index) => (
            <motion.div
              key={`fine-orbit-${index}`}
              className={`close-ring close-ring-many close-ring-many-${index + 1}`}
              animate={reducedMotion
                ? { rotate: 0 }
                : { rotate: index % 2 === 0 ? 360 : -360 }}
              transition={reducedMotion
                ? { duration: 1 }
                : { duration: 16 + index * 1.7, repeat: Infinity, ease: "linear", delay: index * .08 }}
            />
          ))}
          <motion.div
            className="close-scale-legacy"
            aria-hidden="true"
            animate={phase === "fade" || phase === "fly"
              ? { opacity: 0, x: "-50%", y: -20 }
              : { opacity: 1, x: "-50%", y: 0 }}
            transition={{ duration: phase === "fly" || phase === "fade" ? .55 : .3, ease: "easeInOut" }}
          >
            {Array.from({ length: SCALE_BAR_COUNT }, (_, index) => {
              const activeBars = Math.round((displayPotential / 100) * SCALE_BAR_COUNT);
              const isActive = index < activeBars;
              const distanceFromFront = activeBars - 1 - index;
              const barHeight = distanceFromFront >= 0 && distanceFromFront < 3
                ? [104, 84, 72][distanceFromFront]
                : 64;
              const activeBarHeight = Math.round(barHeight * 1.3);
              const activeColors = displayPotential >= 100
                ? ["#FFF7E6", "#FFEDD5", "#FFF1D6", "#FFE4B5"]
                : ["#F97316", "#FF9F43", "#F47B20", "#FFAA4A"];
              const color = activeColors[index % activeColors.length];
              const fillDelay = .18 + index * .13;
              return (
                <motion.div
                  key={`scale-bar-${index}`}
                  className="close-scale-bar"
                  style={{
                    height: 64,
                    backgroundColor: "rgba(224,232,237,.58)",
                    transform: "rotate(-16deg)",
                  }}
                  initial={{
                    opacity: .56,
                    scaleY: 1,
                    y: 0,
                    height: 64,
                    filter: "brightness(1)",
                    backgroundColor: "rgba(224,232,237,.58)",
                  }}
                  animate={isActive
                    ? {
                        opacity: [.56, 1, .86, 1],
                        scaleY: [1, 1.12, .94, 1],
                        y: [0, -4, 1, 0],
                        height: [64, activeBarHeight + 8, activeBarHeight - 2, activeBarHeight],
                        backgroundColor: ["rgba(224,232,237,.58)", "#FFB45E", color, color],
                        filter: ["brightness(1)", "brightness(1.45)", "brightness(1)", "brightness(1.12)"],
                        boxShadow: [`0 0 0 ${color}00`, `0 0 28px ${color}dd`, `0 0 8px ${color}66`],
                      }
                    : {
                        opacity: .56,
                        scaleY: 1,
                        y: 0,
                        height: 64,
                        filter: "brightness(1)",
                        backgroundColor: "rgba(224,232,237,.58)",
                        boxShadow: "0 0 6px rgba(224,232,237,.12)",
                      }}
                  transition={{
                    opacity: isActive ? { duration: .95, delay: fillDelay, ease: [0.16, 1, 0.3, 1] } : { duration: 0 },
                    scaleY: isActive ? { duration: .95, delay: fillDelay, ease: [0.16, 1, 0.3, 1] } : { duration: 0 },
                    y: isActive ? { duration: .95, delay: fillDelay, ease: [0.16, 1, 0.3, 1] } : { duration: 0 },
                    height: isActive ? { duration: .95, delay: fillDelay, ease: [0.16, 1, 0.3, 1] } : { duration: 0 },
                    backgroundColor: isActive ? { duration: .95, delay: fillDelay, ease: "easeOut" } : { duration: 0 },
                    filter: isActive ? { duration: .95, delay: fillDelay, ease: "easeOut" } : { duration: 0 },
                    boxShadow: isActive
                      ? { duration: 2.4, delay: fillDelay + .75, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }
                      : { duration: 0 },
                  }}
                >
                  {isActive && (
                    <motion.span
                      className="pointer-events-none absolute left-1/2 top-0 h-[6px] w-[6px] -translate-x-1/2 rounded-full"
                      style={{ background: "#FFD29A", boxShadow: `0 0 14px 5px ${color}cc` }}
                      initial={{ opacity: 0, scale: .2, y: 10 }}
                      animate={{ opacity: [0, 1, 0], scale: [.2, 1.4, .2], y: [10, -20, -32] }}
                      transition={{ duration: 1.25, delay: fillDelay + .35, repeat: Infinity, repeatDelay: 2.8 + index * .12, ease: "easeOut" }}
                    />
                  )}
                </motion.div>
              );
            })}
          </motion.div>
          <motion.div
            className="close-home-scale"
            aria-hidden="true"
            animate={phase === "fade" || phase === "fly"
              ? { opacity: 0, x: "-50%", y: -20 }
              : { opacity: 1, x: "-50%", y: 0 }}
            transition={{ duration: phase === "fly" || phase === "fade" ? .55 : .3, ease: "easeInOut" }}
          >
             <PotentialScale value={100} hideReadout maxActiveHeightScale={0.7} />
          </motion.div>
          <motion.div
            className="close-readout"
            animate={phase === "fade" || phase === "fly"
              ? { opacity: 0, y: -16 }
              : { opacity: 1, y: 0 }}
            transition={{ duration: phase === "fly" || phase === "fade" ? .55 : .3, ease: "easeInOut" }}
          >
            <div className="close-number-row">
              <motion.span className="close-number" data-testid="text-day-close-potential">{potentialNumberLabel}</motion.span>
              <span className="close-number-percent">%</span>
            </div>
            <span className="close-readout-kicker">Потенциал дня</span>
          </motion.div>
        </motion.div>

        {PARTICLES.map((particle, index) => (
          <motion.span
            key={`particle-${index}`}
            className="close-particle"
            style={{ left: particle.x, top: particle.y, width: particle.size, height: particle.size }}
            animate={reducedMotion
              ? { opacity: .35, scale: 1, x: 0, y: 0 }
              : { opacity: [.08, .92, .18], scale: [.45, 1.25, .55], x: [0, particle.drift, 0], y: [18, -18, 8] }}
            transition={reducedMotion
              ? { duration: .4 }
              : { duration: 2.4 + (index % 4) * .35, delay: particle.delay, repeat: Infinity, ease: "easeInOut" }}
          />
        ))}

        {STREAKS.map((streak, index) => (
          <motion.span
            key={`streak-${index}`}
            className="close-streak"
            style={{ left: streak.x, top: streak.y, height: streak.height, rotate: streak.rotate }}
            animate={reducedMotion
              ? { opacity: .12, scaleY: 1, y: 0 }
              : { opacity: [0, .72, 0], scaleY: [.25, 1.35, .3], y: [38, -14, -60] }}
            transition={reducedMotion
              ? { duration: .4 }
              : { duration: 1.8, delay: streak.delay, repeat: Infinity, ease: "easeOut" }}
          />
        ))}
      </div>

      <motion.div
        className="close-flash"
        initial={{ opacity: 0 }}
        animate={reducedMotion
          ? { opacity: [.0, .75, 0] }
          : { opacity: [0, .04, .16, .62, .62, 0] }}
        transition={{
          duration: reducedMotion ? 0.8 : FLASH_DURATION_MS / 1000,
          times: reducedMotion
            ? [0, .35, 1]
            : [0, .35, .5, POTENTIAL_LOCK_MS / FLASH_DURATION_MS, .82, 1],
          ease: "easeOut",
        }}
        aria-hidden="true"
      />

       <motion.div
         className="close-backdrop-blur"
         initial={{ opacity: 0 }}
           animate={hasSeriesBonus && (phase === "blur" || phase === "series" || phase === "fade")
            ? { opacity: 1 }
            : { opacity: 0 }}
          transition={{
            duration: phase === "fade" && hasSeriesBonus
              ? FINAL_FADE_DURATION_S
              : hasSeriesBonus && phase === "blur"
                ? 0.35
                : 0.25,
            ease: "easeInOut",
          }}
          style={{ background: "rgba(5, 11, 24, .08)" }}
         aria-hidden="true"
       />

       <motion.div
         className="close-reward-aura"
         initial={{ opacity: 0, scale: 0.7 }}
         animate={
           phase === "reward"
             ? { opacity: [0, 0.92, 0.72], scale: [0.7, 1.08, 1] }
              : phase === "blur" || phase === "series"
               ? { opacity: 0.96, scale: 1.45 }
               : phase === "fly"
                 ? isZeroSeriesScenario
                   ? { opacity: [0.72, 0], scale: [1, 2.2] }
                   : { opacity: [0.96, 0], scale: [1.45, 2.2] }
                 : { opacity: 0, scale: 0.7 }
         }
         transition={
           phase === "reward"
             ? { duration: 1.15, ease: "easeOut" }
             : phase === "blur"
               ? { duration: 0.45, ease: "easeInOut" }
               : phase === "fly"
                 ? { duration: 1.2, ease: "easeIn" }
                 : { duration: 0.2, ease: "easeOut" }
         }
         aria-hidden="true"
       />

        <motion.div
          className="close-finished-label"
          data-testid="text-day-closed"
            initial={{ opacity: 0, y: 12, scale: .94 }}
           animate={phase === "fly" || phase === "fade"
              ? { opacity: 1, y: 0, scale: 1 }
              : { opacity: 0, y: 12, scale: .94 }}
          transition={{ duration: phase === "fade" ? .7 : .25, ease: "easeOut" }}
        >
          День закрыт
        </motion.div>

       <motion.div
         className={`close-reward ${isZeroSeriesScenario ? "close-reward-zero-series" : ""}`}
         data-testid="reward-day-close-keys"
         initial={{ opacity: 0, scale: 1, x: 0, y: 0 }}
         animate={
            phase === "fade" && shouldFlyZeroRewardCard
              ? { opacity: 0, scale: .36, x: 340, y: -135, rotate: 18 }
            : phase === "reward" && !shouldFlyZeroRewardCard
              ? { opacity: 1, scale: [1, 1.03, 1], x: 0, y: 0 }
             : phase === "blur"
                ? { opacity: 1, scale: 1.04, x: 0, y: 0 }
                 : phase === "series" && bonusReward > 0
                   ? { opacity: [.92, .55, 0], scale: [1.04, .98, .9], x: 0, y: 0 }
                  : shouldFlyZeroRewardCard
                     ? {
                           opacity: 1,
                          scale: [1, .36],
                          x: [0, 340],
                          y: [0, -135],
                          rotate: [0, 18],
                       }
                     : phase === "series"
                       ? { opacity: 1, scale: 1.04, x: 0, y: 0 }
                       : { opacity: 0, scale: 1, x: 0, y: 0 }
         }
         transition={
            phase === "fade" && shouldFlyZeroRewardCard
               ? { duration: .2, ease: "easeOut" }
            : phase === "reward" && !shouldFlyZeroRewardCard
              ? { duration: 1.1, ease: "easeOut" }
             : phase === "blur"
               ? { duration: .5, ease: "easeInOut" }
                  : shouldFlyZeroRewardCard
                    ? { duration: 2.75, ease: "easeInOut" }
                : phase === "series" && bonusReward > 0
                 ? { duration: 1.15, ease: "easeIn" }
                 : { duration: .3, ease: "easeOut" }
         }
       >
         <span className="close-reward-icon"><KeyRound size={27} strokeWidth={1.8} /></span>
         <span className="close-reward-body">
           <span className="close-reward-label">Награда</span>
           <span className="close-reward-count">+{baseReward} ключей</span>
         </span>
       </motion.div>

        {bonusReward > 0 && (
        <motion.div
          className="close-bonus-card"
         initial={{ opacity: 0, scale: .76, x: 0, y: -260, rotate: -6 }}
         animate={
           bonusCardStarted && (phase === "blur" || phase === "series")
             ? {
                 opacity: [0, 1, 1],
                 scale: [.76, 1.12, 1.06],
                 x: 0,
                 y: [-260, 12, 0],
                 rotate: [-6, 2, 0],
               }
             : phase === "fly"
               ? {
                      opacity: 1,
                     scale: [1.06, .36],
                     x: [0, 340],
                     y: [0, -135],
                     rotate: [0, 18],
                 }
               : { opacity: 0, scale: .76, x: 0, y: -260, rotate: -6 }
         }
         transition={
           bonusCardStarted && (phase === "blur" || phase === "series")
             ? { duration: 1.55, times: [0, .62, 1], ease: [0.16, 1, 0.3, 1] }
             : phase === "fly"
                 ? { duration: 2.75, ease: "easeInOut" }
               : { duration: .3, ease: "easeOut" }
         }
       >
         <span className="close-reward-icon"><KeyRound size={29} strokeWidth={1.8} /></span>
         <span className="close-reward-body">
           <span className="close-reward-label">Бонус серии</span>
           <span className="close-reward-count">+{rewardCount} ключей</span>
           <span className="close-streak-bonus">
             Серия {safeStreakDay} {safeStreakDay === 1 ? "день" : safeStreakDay < 5 ? "дня" : "дней"} · +{bonusReward}
           </span>
         </span>
        </motion.div>
        )}
    </motion.div>
  );
}