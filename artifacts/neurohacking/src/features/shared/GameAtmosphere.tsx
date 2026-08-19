import { motion, useReducedMotion } from "framer-motion";
import { useSmoothRingBurstRotation } from "@/lib/ring-burst";

interface GameAtmosphereProps {
  accent: string;
  phase: string;
}

const RING_LAYERS = [
  { size: 520, duration: 42, direction: 1, dash: "1 15", opacity: 0.24, width: 0.8 },
  { size: 410, duration: 29, direction: -1, dash: "4 10 1 18", opacity: 0.32, width: 1 },
  { size: 302, duration: 21, direction: 1, dash: "1 7", opacity: 0.28, width: 0.8 },
];

function AtmosphereRing({
  size,
  duration,
  direction,
  dash,
  opacity,
  width,
  accent,
  index,
  reducedMotion,
}: (typeof RING_LAYERS)[number] & { accent: string; index: number; reducedMotion: boolean | null }) {
  const burstRotation = useSmoothRingBurstRotation(!reducedMotion, 0.12 + index * 0.025);

  return (
    <div
      className="absolute left-1/2 top-[43%] -translate-x-1/2 -translate-y-1/2"
      style={{ width: `min(${size}px, 126vw)`, height: `min(${size}px, 126vw)` }}
    >
      <motion.div className="absolute inset-0" style={{ rotate: burstRotation }}>
        <motion.svg
          viewBox="0 0 320 320"
          className="h-full w-full"
          initial={{ rotate: direction < 0 ? 180 : 0 }}
          animate={reducedMotion ? { opacity } : { rotate: direction * 360 + (direction < 0 ? 180 : 0), opacity: [opacity * 0.72, opacity, opacity * 0.72] }}
          transition={reducedMotion ? { duration: 0 } : { rotate: { duration, repeat: Infinity, ease: "linear" }, opacity: { duration: duration * 0.7, repeat: Infinity, ease: "easeInOut" } }}
          aria-hidden="true"
        >
          <circle cx="160" cy="160" r="142" fill="none" stroke={accent} strokeDasharray={dash} strokeLinecap="round" strokeOpacity={opacity} strokeWidth={width} />
          <circle cx="160" cy="160" r="132" fill="none" stroke={accent} strokeDasharray="1 28" strokeLinecap="round" strokeOpacity={opacity * 0.42} strokeWidth={0.7} />
        </motion.svg>
      </motion.div>
    </div>
  );
}

export function GameAtmosphere({ accent, phase }: GameAtmosphereProps) {
  const reducedMotion = useReducedMotion();
  const isFailed = phase === "failed";
  const isSuccess = phase === "success";
  const phaseOpacity = isFailed ? 0.9 : isSuccess ? 1 : 0.72;

  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden="true">
      <motion.div
        className="absolute left-1/2 top-[43%] h-[min(230px,58vw)] w-[min(230px,58vw)] -translate-x-1/2 -translate-y-1/2 rounded-full"
        animate={reducedMotion ? { opacity: phaseOpacity * 0.22 } : { opacity: [phaseOpacity * 0.13, phaseOpacity * 0.3, phaseOpacity * 0.13], scale: [0.97, 1.02, 0.97] }}
        transition={reducedMotion ? { duration: 0 } : { duration: isFailed ? 2.2 : 5.5, repeat: Infinity, ease: "easeInOut" }}
        style={{ background: `radial-gradient(circle, ${accent}2e 0%, ${accent}0c 38%, transparent 72%)`, filter: "blur(12px)" }}
      />
      {RING_LAYERS.map((ring, index) => <AtmosphereRing key={ring.size} {...ring} accent={accent} index={index} reducedMotion={reducedMotion} />)}
      <div className="absolute left-1/2 top-[43%] h-[min(10px,2.5vw)] w-[min(10px,2.5vw)] -translate-x-1/2 -translate-y-1/2 rounded-full" style={{ background: accent, boxShadow: `0 0 20px ${accent}99` }} />
    </div>
  );
}