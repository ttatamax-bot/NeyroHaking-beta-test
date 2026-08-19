import { useEffect, useRef, useState } from "react";
import { useMotionValue, type MotionValue } from "framer-motion";

export const RING_BURST_DURATION_MS = 1500;

export function useRingBurst(duration = RING_BURST_DURATION_MS) {
  const [isBursting, setIsBursting] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => setIsBursting(false), duration);
    return () => window.clearTimeout(timer);
  }, [duration]);

  return isBursting;
}

export function ringRotationTarget(
  direction: number,
  baseDuration: number,
  isBursting: boolean,
  start = 0,
) {
  return start + direction * 360;
}

export function ringRotationTransition(baseDuration: number, isBursting: boolean) {
  return { duration: baseDuration, repeat: Infinity, ease: "linear" as const };
}

export function useSmoothRingBurstRotation(
  enabled = true,
  extraTurns = 1.15,
): MotionValue<number> {
  const rotation = useMotionValue(0);
  const configRef = useRef({ enabled, extraTurns });
  configRef.current = { enabled, extraTurns };

  useEffect(() => {
    if (!enabled) {
      rotation.set(0);
      return undefined;
    }

    let frame = 0;
    const startedAt = performance.now();
    const tick = (now: number) => {
      const progress = Math.min(1, (now - startedAt) / RING_BURST_DURATION_MS);
      const smoothStep = progress * progress * (3 - 2 * progress);
      rotation.set(configRef.current.extraTurns * 360 * smoothStep);
      if (progress < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [enabled, rotation]);

  return rotation;
}