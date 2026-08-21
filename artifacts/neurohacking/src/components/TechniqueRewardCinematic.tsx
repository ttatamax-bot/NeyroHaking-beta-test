import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { ConcentrationModeLogo } from "@/features/concentration/ConcentrationModeLogo";
import type { ConcentrationMode } from "@/features/concentration/config";
import { MemoryModeLogo } from "@/features/memory/MemoryModeLogo";
import type { MemoryMode } from "@/features/memory/config";

export interface TechniqueCompletionReceipt {
  potential: number;
  totalPotential: number;
  alreadyCompleted?: boolean;
  recovered?: boolean;
}

export const DEV_REWARD_PREVIEW_EVENT = "neurohacking:dev-reward-preview";

type TechniqueRewardCinematicProps =
  | {
      technique: "memory";
      mode: MemoryMode;
      amount: number;
      totalPotential: number;
      onComplete: () => void;
    }
  | {
      technique: "concentration";
      mode: ConcentrationMode;
      amount: number;
      totalPotential: number;
      onComplete: () => void;
    };

const PARTICLES = [
  { x: "9%", y: "18%", delay: 0.1, size: 3 },
  { x: "18%", y: "72%", delay: 0.45, size: 2 },
  { x: "28%", y: "29%", delay: 0.72, size: 2 },
  { x: "41%", y: "83%", delay: 0.25, size: 3 },
  { x: "57%", y: "16%", delay: 0.58, size: 2 },
  { x: "69%", y: "77%", delay: 0.9, size: 3 },
  { x: "83%", y: "31%", delay: 0.35, size: 2 },
  { x: "92%", y: "64%", delay: 0.68, size: 3 },
  { x: "8%", y: "48%", delay: 1.05, size: 2 },
  { x: "76%", y: "53%", delay: 1.2, size: 2 },
  { x: "35%", y: "13%", delay: 0.82, size: 2 },
  { x: "52%", y: "68%", delay: 1.35, size: 3 },
];

export function TechniqueRewardCinematic(props: TechniqueRewardCinematicProps) {
  const reducedMotion = useReducedMotion();
  const reward = Math.max(0, Math.round(props.amount));
  const [displayReward, setDisplayReward] = useState(reducedMotion ? reward : 0);
  const onCompleteRef = useRef(props.onComplete);
  const completedRef = useRef(false);

  useEffect(() => {
    onCompleteRef.current = props.onComplete;
  }, [props.onComplete]);

  useEffect(() => {
    if (reducedMotion) {
      setDisplayReward(reward);
      return undefined;
    }
    const startedAt = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const progress = Math.min(1, Math.max(0, (now - startedAt - 620) / 1150));
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayReward(Math.round(reward * eased));
      if (progress < 1) {
        frame = requestAnimationFrame(tick);
      }
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [reducedMotion, reward]);

  const techniqueLabel = props.technique === "memory" ? "ПАМЯТЬ" : "КОНЦЕНТРАЦИЯ";
  const ringSegments = useMemo(() => Array.from({ length: 12 }, (_, index) => index), []);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      if (completedRef.current) return;
      completedRef.current = true;
      onCompleteRef.current();
    }, reducedMotion ? 1350 : 4300);
    return () => window.clearTimeout(timeout);
  }, [reducedMotion]);

  return (
    <motion.div
      className="technique-reward-cinematic"
      role="dialog"
      aria-modal="true"
      aria-label={`Начислено ${reward} процентов потенциала дня`}
      data-testid={`overlay-${props.technique}-reward`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: reducedMotion ? 0.12 : 0.42 }}
    >
      <style>{`
        .technique-reward-cinematic {
          position: fixed;
          inset: 0;
          z-index: 11000;
          isolation: isolate;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 100dvh;
          padding:
            max(24px, env(safe-area-inset-top))
            max(20px, env(safe-area-inset-right))
            max(24px, env(safe-area-inset-bottom))
            max(20px, env(safe-area-inset-left));
          color: #fff7ed;
          background:
            radial-gradient(circle at 50% 44%, rgba(249,115,22,.22), transparent 33%),
            radial-gradient(ellipse 84% 48% at 50% 110%, rgba(37,99,235,.25), transparent 72%),
            linear-gradient(180deg, #050b16 0%, #081728 58%, #0b1d31 100%);
          font-family: var(--font-sans, "IBM Plex Sans", sans-serif);
        }
        .technique-reward-cinematic::before {
          content: "";
          position: absolute;
          inset: 0;
          z-index: -2;
          opacity: .22;
          background-image:
            linear-gradient(rgba(142,203,255,.09) 1px, transparent 1px),
            linear-gradient(90deg, rgba(142,203,255,.09) 1px, transparent 1px);
          background-size: 32px 32px;
          mask-image: radial-gradient(circle at 50% 44%, #000 0%, transparent 72%);
          -webkit-mask-image: radial-gradient(circle at 50% 44%, #000 0%, transparent 72%);
        }
        .technique-reward-cinematic::after {
          content: "";
          position: absolute;
          inset: -20%;
          z-index: -1;
          background: conic-gradient(from 0deg at 50% 44%, transparent, rgba(249,115,22,.09), transparent 24%, rgba(59,130,246,.08), transparent 52%);
          animation: reward-atmosphere-spin 18s linear infinite;
        }
        @keyframes reward-atmosphere-spin {
          to { transform: rotate(360deg); }
        }
        @media (prefers-reduced-motion: reduce) {
          .technique-reward-cinematic::after { animation: none; }
        }
      `}</style>

      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        {PARTICLES.map((particle, index) => (
          <motion.span
            key={`${particle.x}-${particle.y}`}
            className="absolute rounded-full bg-orange-200"
            style={{
              left: particle.x,
              top: particle.y,
              width: particle.size,
              height: particle.size,
              boxShadow: "0 0 14px rgba(255,198,109,.9)",
            }}
            initial={{ opacity: 0, scale: 0 }}
            animate={reducedMotion ? { opacity: .5, scale: 1 } : {
              opacity: [0, .9, .18, .7, 0],
              scale: [0, 1.35, .7, 1.1, 0],
              y: [16, -12, -31],
            }}
            transition={{ duration: 3.2 + index * .08, repeat: Infinity, delay: particle.delay, ease: "easeInOut" }}
          />
        ))}
      </div>

      <div className="relative flex w-full max-w-[390px] flex-col items-center">
        <motion.div
          className="relative flex h-[min(78vw,310px)] w-[min(78vw,310px)] items-center justify-center"
          initial={{ opacity: 0, scale: .72, rotate: -14 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ duration: reducedMotion ? .15 : .8, type: "spring", stiffness: 95, damping: 14 }}
          aria-hidden="true"
        >
          <motion.div
            className="absolute inset-0 rounded-full border border-orange-300/20"
            animate={reducedMotion ? undefined : { rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          >
            {ringSegments.map((segment) => (
              <span
                key={segment}
                className="absolute left-1/2 top-1/2 h-1 w-3 rounded-full bg-orange-300/55"
                style={{ transform: `translate(-50%, -50%) rotate(${segment * 30}deg) translateY(-151px)` }}
              />
            ))}
          </motion.div>

          <motion.svg
            viewBox="0 0 300 300"
            className="absolute inset-[7%] h-[86%] w-[86%]"
            animate={reducedMotion ? undefined : { rotate: -360 }}
            transition={{ duration: 13, repeat: Infinity, ease: "linear" }}
          >
            <circle cx="150" cy="150" r="132" fill="none" stroke="rgba(142,203,255,.16)" strokeWidth="1" strokeDasharray="2 10" />
            <circle cx="150" cy="150" r="113" fill="none" stroke="rgba(249,115,22,.7)" strokeWidth="2.5" strokeDasharray="96 24 26 35" strokeLinecap="round" />
            <circle cx="150" cy="150" r="93" fill="none" stroke="rgba(255,210,154,.22)" strokeWidth="1" strokeDasharray="1 7" />
          </motion.svg>

          <motion.div
            className="absolute inset-[19%] rounded-full border border-orange-200/30"
            animate={reducedMotion ? undefined : {
              rotate: 360,
              boxShadow: [
                "0 0 28px rgba(249,115,22,.18), inset 0 0 28px rgba(249,115,22,.08)",
                "0 0 58px rgba(249,115,22,.42), inset 0 0 42px rgba(249,115,22,.18)",
                "0 0 28px rgba(249,115,22,.18), inset 0 0 28px rgba(249,115,22,.08)",
              ],
            }}
            transition={{
              rotate: { duration: 9, repeat: Infinity, ease: "linear" },
              boxShadow: { duration: 2.1, repeat: Infinity, ease: "easeInOut" },
            }}
            style={{ background: "radial-gradient(circle, rgba(249,115,22,.12), rgba(13,33,57,.84) 67%)" }}
          />

          <motion.div
            className="relative z-10 flex h-[118px] w-[118px] items-center justify-center rounded-[34px] border border-orange-200/30 bg-[#0d2139]/95 shadow-[0_0_42px_rgba(249,115,22,.28),inset_0_1px_0_rgba(255,255,255,.12)]"
            initial={{ scale: 0, rotate: 18 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: reducedMotion ? 0 : .42, type: "spring", stiffness: 180, damping: 14 }}
          >
            {props.technique === "memory"
              ? <MemoryModeLogo mode={props.mode} large />
              : <ConcentrationModeLogo mode={props.mode} large />}
          </motion.div>

          <motion.div
            className="absolute inset-[30%] rounded-full border-2 border-orange-200/80"
            initial={{ opacity: 0, scale: .25 }}
            animate={reducedMotion ? { opacity: .25, scale: 1 } : { opacity: [0, .85, 0], scale: [.25, 1.55, 2.1] }}
            transition={{ duration: 1.2, delay: .92, ease: "easeOut" }}
          />
        </motion.div>

        <motion.div
          className="-mt-8 text-center"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: reducedMotion ? 0 : .62, duration: .55 }}
        >
          <p className="text-[10px] font-semibold tracking-[.28em] text-orange-200/65">{techniqueLabel}</p>
          <div className="mt-1 flex items-baseline justify-center gap-2">
            <span className="font-[var(--font-num)] text-[66px] font-medium leading-none tracking-[-.08em] text-[#fff7ed] drop-shadow-[0_0_18px_rgba(249,115,22,.75)]">
              +{displayReward}
            </span>
            <span className="text-[22px] font-semibold text-orange-300">%</span>
          </div>
          <p className="mt-2 text-[12px] font-semibold uppercase tracking-[.18em] text-orange-100/80">ПОТЕНЦИАЛ ДНЯ</p>
        </motion.div>
      </div>

    </motion.div>
  );
}