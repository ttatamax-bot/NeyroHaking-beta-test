import { motion, useReducedMotion, useMotionValue, useAnimationFrame } from "framer-motion";
import { KeyRound } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export const DEV_SURVEY_REWARD_PREVIEW_EVENT = "neurohacking:dev-survey-reward-preview";

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
  { x: "34%", y: "25%", size: 3, delay: 0.35, drift: -16 },
  { x: "58%", y: "31%", size: 2, delay: 1.5, drift: 20 },
  { x: "43%", y: "48%", size: 2, delay: 0.72, drift: -24 },
  { x: "63%", y: "58%", size: 3, delay: 1.9, drift: 16 },
];

const STREAKS = [
  { x: "14%", y: "56%", rotate: -24, height: 42, delay: 0.1 },
  { x: "31%", y: "72%", rotate: 18, height: 30, delay: 0.42 },
  { x: "69%", y: "67%", rotate: -15, height: 50, delay: 0.28 },
  { x: "85%", y: "47%", rotate: 22, height: 34, delay: 0.64 },
  { x: "47%", y: "90%", rotate: -6, height: 54, delay: 0.82 },
];

type Phase = "build" | "reward" | "hold" | "fade";

export function SurveyRewardCinematic({
  amount,
  onComplete,
}: {
  amount: number;
  onComplete: () => void;
}) {
  const reducedMotion = useReducedMotion();
  const reward = Math.max(0, Math.round(amount));
  const [phase, setPhase] = useState<Phase>("build");
  const startedAtRef = useRef<number | null>(null);
  const rotation = useMotionValue(0);
  const pulse = useMotionValue(0);

  useEffect(() => {
    const rewardTimer = window.setTimeout(() => setPhase("reward"), reducedMotion ? 300 : 1700);
    const holdTimer = window.setTimeout(() => setPhase("hold"), reducedMotion ? 500 : 2700);
    const fadeTimer = window.setTimeout(() => setPhase("fade"), reducedMotion ? 3000 : 6700);
    const completeTimer = window.setTimeout(onComplete, reducedMotion ? 3500 : 7800);
    return () => {
      window.clearTimeout(rewardTimer);
      window.clearTimeout(holdTimer);
      window.clearTimeout(fadeTimer);
      window.clearTimeout(completeTimer);
    };
  }, [onComplete, reducedMotion]);

  useAnimationFrame((time) => {
    if (startedAtRef.current === null) startedAtRef.current = time;
    if (reducedMotion) {
      rotation.set(0);
      pulse.set(0);
      return;
    }
    const elapsed = time - startedAtRef.current;
    const acceleration = Math.min(1, elapsed / 6100);
    rotation.set(elapsed * (0.012 + acceleration * 0.075));
    pulse.set(Math.sin(elapsed * 0.0045) * (0.5 + acceleration * 0.5));
  });

  const leaving = phase === "fade";
  const cardVisible = phase === "reward" || phase === "hold";

  return (
    <motion.div
      className="survey-reward-cinematic fixed inset-0 z-[12000] overflow-hidden"
      role="dialog"
      aria-modal="true"
      aria-label={`Получено ${reward} ключей`}
      data-testid="overlay-survey-reward"
      initial={{ opacity: 0 }}
      animate={{ opacity: leaving ? 0 : 1 }}
      transition={{ duration: leaving ? 1.05 : 0.35, ease: "easeInOut" }}
    >
      <style>{`
        .survey-reward-cinematic {
          isolation: isolate;
          color: #f6f3ed;
          background:
            radial-gradient(ellipse 92% 48% at 50% 56%, rgba(29,78,216,.18), transparent 70%),
            radial-gradient(ellipse 54% 35% at 50% 101%, rgba(249,115,22,.17), transparent 72%),
            #050b18;
          font-family: var(--font-sans, "IBM Plex Sans", sans-serif);
        }
        .survey-reward-cinematic::before {
          content: "";
          position: absolute;
          inset: 0;
          z-index: -1;
          pointer-events: none;
          opacity: .18;
          background: radial-gradient(ellipse 70% 52% at 50% 55%, rgba(255, 188, 112, .22), transparent 68%);
          filter: blur(18px);
        }
        .survey-reward-stage {
          position: absolute;
          top: 50%;
          left: 50%;
          width: min(100vw, 430px);
          height: min(100vw, 430px);
          translate: -50% -50%;
        }
        .survey-reward-stage-shake {
          position: absolute;
          inset: -18%;
          display: grid;
          place-items: center;
          transform-origin: center;
        }
        .survey-reward-haze {
          position: absolute;
          width: 78%;
          height: 78%;
          border-radius: 50%;
          background: rgba(249,115,22,.22);
          opacity: .72;
          transform: scale(.72);
          filter: blur(28px);
          will-change: transform, opacity;
        }
        .survey-reward-haze-blue {
          width: 120%;
          height: 120%;
          background: rgba(37,99,235,.14);
          opacity: .66;
          filter: blur(42px);
        }
        .survey-reward-ring {
          position: absolute;
          top: 50%;
          left: 50%;
          border-radius: 50%;
          translate: -50% -50%;
          transform-origin: center;
          background: transparent;
          will-change: transform, opacity;
        }
        .survey-reward-ring-outer {
          width: 84%;
          height: 84%;
          border: 1px solid rgba(249,115,22,.08);
          border-top-color: rgba(255,237,170,.4);
          border-right-color: rgba(249,115,22,.25);
          mask-image: radial-gradient(circle, transparent 64%, #000 66%, #000 69%, transparent 72%);
          -webkit-mask-image: radial-gradient(circle, transparent 64%, #000 66%, #000 69%, transparent 72%);
        }
        .survey-reward-ring-middle {
          width: 80%;
          height: 80%;
          border: .5px solid rgba(255,224,166,.24);
          border-top-color: rgba(255,237,170,.5);
          border-left-color: rgba(249,115,22,.34);
        }
        .survey-reward-ring-inner {
          width: 74%;
          height: 74%;
          background: conic-gradient(from 20deg, transparent 0deg, rgba(255,237,170,.42) 40deg, transparent 78deg, transparent 174deg, rgba(249,115,22,.3) 218deg, transparent 266deg);
          mask-image: radial-gradient(circle, transparent 67%, #000 69%, #000 73%, transparent 76%);
          -webkit-mask-image: radial-gradient(circle, transparent 67%, #000 69%, #000 73%, transparent 76%);
        }
        .survey-reward-ring-dashed {
          width: 64%;
          height: 64%;
          background: repeating-conic-gradient(from 4deg, rgba(255,215,145,.28) 0deg 1.5deg, transparent 1.5deg 14deg);
          mask-image: radial-gradient(circle, transparent 65%, #000 67%, #000 70%, transparent 73%);
          -webkit-mask-image: radial-gradient(circle, transparent 65%, #000 67%, #000 70%, transparent 73%);
        }
        .survey-reward-ring-arc {
          width: 63%;
          height: 63%;
          background: conic-gradient(from -34deg, rgba(255,237,170,.5) 0deg 166deg, transparent 166deg 360deg);
          mask-image: radial-gradient(circle, transparent 76%, #000 77.5%, #000 79%, transparent 80.5%);
          -webkit-mask-image: radial-gradient(circle, transparent 76%, #000 77.5%, #000 79%, transparent 80.5%);
        }
        .survey-reward-ring-core {
          width: 57%;
          height: 57%;
          border: .5px solid rgba(255,224,166,.22);
          border-right-color: rgba(255,237,170,.44);
          border-bottom-color: rgba(249,115,22,.3);
          mask-image: radial-gradient(circle, transparent 73%, #000 75%, #000 77%, transparent 79%);
          -webkit-mask-image: radial-gradient(circle, transparent 73%, #000 75%, #000 77%, transparent 79%);
        }
        .survey-reward-orbit-dot {
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
        .survey-reward-particle {
          position: absolute;
          z-index: 3;
          border-radius: 50%;
          background: #ffd39c;
          box-shadow: 0 0 13px 3px rgba(249,115,22,.6);
          will-change: transform, opacity;
        }
        .survey-reward-streak {
          position: absolute;
          z-index: 2;
          width: 1px;
          border-radius: 99px;
          background: linear-gradient(180deg, transparent, #ffbd70, transparent);
          box-shadow: 0 0 10px rgba(249,115,22,.75);
          transform-origin: center;
          will-change: transform, opacity;
        }
        .survey-reward-aura {
          position: absolute;
          inset: -28%;
          z-index: 9;
          pointer-events: none;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(255,239,204,.45) 0%, rgba(249,115,22,.28) 20%, rgba(249,115,22,.08) 44%, transparent 72%);
          filter: blur(22px);
          will-change: transform, opacity;
        }
        .survey-reward-flash {
          position: absolute;
          inset: -20%;
          z-index: 7;
          pointer-events: none;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(255,249,235,.84) 0%, rgba(255,190,112,.24) 23%, transparent 62%);
          filter: blur(16px);
          mix-blend-mode: screen;
        }
        .survey-reward-card {
          position: absolute;
          top: 50%;
          left: 50%;
          z-index: 10;
          display: flex;
          min-width: min(286px, 84vw);
          align-items: center;
          gap: 18px;
          padding: 21px 25px 21px 20px;
          border: 1px solid rgba(255,222,171,.84);
          border-radius: 24px;
          background: linear-gradient(135deg, rgba(77,35,13,.99), rgba(18,20,32,.99));
          box-shadow: 0 0 0 7px rgba(249,115,22,.1), 0 0 65px rgba(249,115,22,.62), 0 20px 55px rgba(0,0,0,.62);
          translate: -50% -50%;
          transform-origin: center;
          will-change: transform, opacity, filter;
        }
        .survey-reward-card::before {
          content: "";
          position: absolute;
          inset: -34%;
          z-index: -1;
          pointer-events: none;
          border-radius: 50%;
          background: radial-gradient(ellipse at center, rgba(255,191,112,.52) 0%, rgba(249,115,22,.3) 30%, rgba(249,115,22,.1) 56%, transparent 74%);
          filter: blur(24px);
          opacity: .82;
        }
        .survey-reward-icon {
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
        .survey-reward-label { color: rgba(255,219,174,.7); font-size: 12px; font-weight: 600; letter-spacing: .17em; }
        .survey-reward-count { margin-top: 1px; color: #fff4e5; font-family: var(--font-num, "Space Mono", monospace); font-size: 32px; font-weight: 500; letter-spacing: -.03em; }
        .survey-reward-body { display: flex; min-width: 0; flex-direction: column; align-items: flex-start; }
        @media (prefers-reduced-motion: reduce) {
          .survey-reward-particle, .survey-reward-streak { opacity: .35 !important; }
        }
      `}</style>

      <div className="survey-reward-stage" aria-hidden="true">
        <motion.div
          className="survey-reward-stage-shake"
          initial={{ y: "35vh", scale: .42, opacity: 0 }}
          animate={reducedMotion
            ? { y: 0, scale: 1, opacity: 1 }
            : { y: ["35vh", "0vh", "0vh"], scale: [.42, .62, 1], opacity: [0, .72, 1] }}
          transition={reducedMotion ? { duration: .5 } : { duration: 2.8, times: [0, .55, 1], ease: [0.16, 1, 0.3, 1] }}
          style={{ rotate: pulse, willChange: "transform, opacity" }}
        >
          <motion.div className="survey-reward-haze survey-reward-haze-blue" animate={reducedMotion ? { opacity: .45, scale: 1 } : { opacity: [.12, .72, .4], scale: [.55, 1.15, 1] }} transition={{ duration: 2.6, ease: "easeOut" }} />
          <motion.div className="survey-reward-haze" animate={reducedMotion ? { opacity: .55, scale: 1 } : { opacity: [.1, .86, .48], scale: [.4, 1.25, 1] }} transition={{ duration: 2.8, ease: "easeOut" }} />
          <motion.div className="survey-reward-ring survey-reward-ring-outer" style={{ rotate: rotation }} />
          <motion.div className="survey-reward-ring survey-reward-ring-middle" style={{ rotate: rotation }} />
          <motion.div className="survey-reward-ring survey-reward-ring-inner" style={{ rotate: rotation }} />
          <motion.div className="survey-reward-ring survey-reward-ring-dashed" style={{ rotate: rotation }} />
          <motion.div className="survey-reward-ring survey-reward-ring-arc" style={{ rotate: rotation }} />
          <motion.div className="survey-reward-ring survey-reward-ring-core" style={{ rotate: rotation }} />
          <div className="survey-reward-ring survey-reward-ring-outer"><span className="survey-reward-orbit-dot" /></div>
          <motion.div className="survey-reward-aura" style={{ scale: pulse }} animate={cardVisible ? { opacity: [.5, .95, .72] } : { opacity: 0 }} transition={{ duration: 1.1, repeat: cardVisible && !reducedMotion ? Infinity : 0, ease: "easeInOut" }} />
          <motion.div className="survey-reward-flash" initial={{ opacity: 0, scale: .3 }} animate={phase === "reward" ? { opacity: [0, .95, 0], scale: [.3, 1.4, 2] } : { opacity: 0, scale: .3 }} transition={{ duration: 1.25, ease: "easeOut" }} />
        </motion.div>

        {PARTICLES.map((particle, index) => (
          <motion.span
            key={`particle-${index}`}
            className="survey-reward-particle"
            style={{ left: particle.x, top: particle.y, width: particle.size, height: particle.size }}
            animate={reducedMotion
              ? { opacity: .35, scale: 1, x: 0, y: 0 }
              : leaving
                ? { opacity: 0, scale: .2 }
                : { opacity: [.08, .92, .18], scale: [.45, 1.25, .55], x: [0, particle.drift, 0], y: [18, -18, 8] }}
            transition={{ duration: 2.4 + (index % 4) * .35, delay: particle.delay, repeat: reducedMotion || leaving ? 0 : Infinity, ease: "easeInOut" }}
          />
        ))}
        {STREAKS.map((streak, index) => (
          <motion.span
            key={`streak-${index}`}
            className="survey-reward-streak"
            style={{ left: streak.x, top: streak.y, height: streak.height, rotate: streak.rotate }}
            animate={reducedMotion ? { opacity: .12, scaleY: 1, y: 0 } : leaving ? { opacity: 0, y: 0 } : { opacity: [0, .72, 0], scaleY: [.25, 1.35, .3], y: [38, -14, -60] }}
            transition={{ duration: 1.8, delay: streak.delay, repeat: reducedMotion || leaving ? 0 : Infinity, ease: "easeOut" }}
          />
        ))}
      </div>

      <motion.div
        className="survey-reward-card"
        initial={{ opacity: 0, scale: .72, y: 16 }}
        animate={leaving
          ? { opacity: 0, scale: .82, y: -20, filter: "blur(7px)" }
          : cardVisible
            ? { opacity: 1, scale: [1, 1.035, 1], y: [0, -3, 0], filter: "blur(0px)" }
            : { opacity: 0, scale: .72, y: 16, filter: "blur(8px)" }}
        transition={leaving ? { duration: 1, ease: "easeInOut" } : cardVisible ? { duration: 1.05, ease: "easeOut" } : { duration: .4 }}
      >
        <span className="survey-reward-icon"><KeyRound size={27} strokeWidth={1.8} /></span>
        <span className="survey-reward-body">
          <span className="survey-reward-label">Награда</span>
          <span className="survey-reward-count">+{reward} ключей</span>
        </span>
      </motion.div>
    </motion.div>
  );
}