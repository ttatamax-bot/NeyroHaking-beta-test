import { useEffect, useState } from "react";

export const RING_BURST_DURATION_MS = 1500;
const RING_BURST_TURNS = 2;

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
  isBursting: boolean,
  start = 0,
) {
  return start + direction * 360 * (isBursting ? RING_BURST_TURNS : RING_BURST_TURNS + 1);
}

export function ringRotationTransition(baseDuration: number, isBursting: boolean) {
  return isBursting
    ? { duration: RING_BURST_DURATION_MS / 1000, ease: "linear" as const }
    : { duration: baseDuration, repeat: Infinity, ease: "linear" as const };
}