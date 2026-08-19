import { motion, useReducedMotion } from "framer-motion";
import { useSmoothRingBurstRotation } from "@/lib/ring-burst";

interface GameInstrumentBackdropProps {
  accent: string;
  phase: string;
}

const RINGS = [
  { size: 760, duration: 52, direction: 1, opacity: 0.11, dash: "180 120", extraTurns: 0.14 },
  { size: 610, duration: 39, direction: -1, opacity: 0.15, dash: "1 18", extraTurns: 0.18 },
  { size: 470, duration: 29, direction: 1, opacity: 0.1, dash: "240 80 12 120", extraTurns: 0.22 },
];

function BackdropRing({
  size,
  duration,
  direction,
  opacity,
  dash,
  extraTurns,
  accent,
  reducedMotion,
}: (typeof RINGS)[number] & { accent: string; reducedMotion: boolean | null }) {
  const burstRotation = useSmoothRingBurstRotation(!reducedMotion, extraTurns);

  return (
    <div
      className="game-backdrop-anchor"
      style={{ width: `min(${size}px, 190vw)`, height: `min(${size}px, 190vw)` }}
    >
      <motion.div className="absolute inset-0" style={{ rotate: burstRotation }}>
        <motion.svg
          viewBox="0 0 320 320"
          className="h-full w-full"
          initial={{ rotate: direction < 0 ? 180 : 0 }}
          animate={reducedMotion ? { opacity } : { rotate: direction * 360 + (direction < 0 ? 180 : 0), opacity: [opacity * 0.7, opacity, opacity * 0.7] }}
          transition={reducedMotion ? { duration: 0 } : { rotate: { duration, repeat: Infinity, ease: "linear" }, opacity: { duration: duration * .7, repeat: Infinity, ease: "easeInOut" } }}
          style={{ filter: `drop-shadow(0 0 5px ${accent}55)` }}
          aria-hidden="true"
        >
          <circle cx="160" cy="160" r="145" fill="none" stroke={accent} strokeOpacity={opacity} strokeWidth="0.9" strokeDasharray={dash} strokeLinecap="round" />
          <ellipse cx="160" cy="160" rx="76" ry="145" fill="none" stroke={accent} strokeOpacity={opacity * 0.8} strokeWidth="0.8" strokeDasharray="2 14" strokeLinecap="round" transform="rotate(18 160 160)" />
          <ellipse cx="160" cy="160" rx="42" ry="145" fill="none" stroke={accent} strokeOpacity={opacity * 0.46} strokeWidth="0.65" strokeDasharray="1 24" transform="rotate(-18 160 160)" />
        </motion.svg>
      </motion.div>
    </div>
  );
}

export function GameInstrumentBackdrop({ accent, phase }: GameInstrumentBackdropProps) {
  const reducedMotion = useReducedMotion();
  const phaseOpacity = phase === "success" ? 1.15 : phase === "failed" ? 0.9 : 1;

  return (
    <div className="game-backdrop" aria-hidden="true" style={{ opacity: phaseOpacity }}>
      <motion.div
        className="absolute left-1/2 top-[43%] h-[min(300px,74vw)] w-[min(300px,74vw)] -translate-x-1/2 -translate-y-1/2 rounded-full"
        animate={reducedMotion ? { opacity: .08 } : { opacity: [.035, .11, .035], scale: [.94, 1.03, .94] }}
        transition={reducedMotion ? { duration: 0 } : { duration: 7, repeat: Infinity, ease: "easeInOut" }}
        style={{ background: `radial-gradient(circle, ${accent}26 0%, transparent 68%)`, filter: "blur(16px)" }}
      />
      {RINGS.map((ring) => <BackdropRing key={ring.size} {...ring} accent={accent} reducedMotion={reducedMotion} />)}
    </div>
  );
}