/**
 * Единый источник правды по экономике приложения.
 *
 * Потенциал дня обнуляется на новый день приложения (05:00 локального времени).
 * Ключи выдаются только при закрытии дня на 100%.
 */

export type TechniqueId = "T1" | "T2" | "T3" | "T4" | "T5" | "T6" | "T7" | "T8";

export const TECHNIQUE_IDS: TechniqueId[] = ["T1", "T2", "T3", "T4", "T5", "T6", "T7", "T8"];
export const PLANNER_TECHNIQUE_ID: TechniqueId = "T1";
export const TECHNIQUE_POTENTIAL_PERCENT = 10;
export const DAY_POTENTIAL_TARGET = 100;
export const DAY_CLOSE_BASE_KEYS = 100;
export const DAY_CLOSE_STEP_KEYS = 25;
export const DAY_CLOSE_MAX_KEYS = 450;
export const DAY_CLOSE_MAX_STREAK_DAY = 15;

/** [фактические минуты, базовый потенциал в процентах]. */
export const PLANNER_POTENTIAL_TABLE: ReadonlyArray<readonly [number, number]> = [
  [10, 3],
  [15, 5],
  [30, 10],
  [60, 20],
  [90, 30],
  [120, 40],
  [150, 48],
  [180, 55],
  [210, 60],
  [240, 65],
  [270, 68],
  [300, 71],
  [330, 74],
  [360, 77],
  [390, 80],
  [420, 83],
  [450, 86],
  [480, 90],
];

export function plannerBasePotential(actualMinutes: number): number {
  if (!Number.isFinite(actualMinutes) || actualMinutes <= 0) return 0;
  const first = PLANNER_POTENTIAL_TABLE[0]!;
  const last = PLANNER_POTENTIAL_TABLE[PLANNER_POTENTIAL_TABLE.length - 1]!;
  if (actualMinutes < first[0]) return (first[1] * actualMinutes) / first[0];
  if (actualMinutes >= last[0]) return last[1];
  for (let i = 0; i < PLANNER_POTENTIAL_TABLE.length - 1; i += 1) {
    const [lowMinutes, lowPercent] = PLANNER_POTENTIAL_TABLE[i]!;
    const [highMinutes, highPercent] = PLANNER_POTENTIAL_TABLE[i + 1]!;
    if (actualMinutes >= lowMinutes && actualMinutes < highMinutes) {
      const ratio = (actualMinutes - lowMinutes) / (highMinutes - lowMinutes);
      return lowPercent + (highPercent - lowPercent) * ratio;
    }
  }
  return 0;
}

export function plannerAccuracy(actualSeconds: number, estimatedSeconds: number): number {
  if (actualSeconds <= 0 || estimatedSeconds <= 0) return 0;
  const deviation =
    Math.abs(actualSeconds - estimatedSeconds) / Math.max(actualSeconds, estimatedSeconds);
  return Math.exp(-1.5 * deviation * deviation);
}

export function plannerPotential(actualSeconds: number, estimatedSeconds: number): number {
  if (
    !Number.isFinite(actualSeconds) ||
    !Number.isFinite(estimatedSeconds) ||
    actualSeconds <= 0 ||
    estimatedSeconds <= 0
  ) return 0;
  const base = plannerBasePotential(actualSeconds / 60);
  const value = base * plannerAccuracy(actualSeconds, estimatedSeconds);
  return Math.round(value * 10) / 10;
}

export function potentialForTechnique(
  techniqueId: TechniqueId,
  metadata: Record<string, unknown> = {},
): number {
  if (techniqueId !== PLANNER_TECHNIQUE_ID) return TECHNIQUE_POTENTIAL_PERCENT;

  const actualSeconds = Number(metadata.actualSeconds ?? 0);
  const estimatedSeconds = Number(metadata.estimatedSeconds ?? 0);
  if (!Number.isFinite(actualSeconds) || !Number.isFinite(estimatedSeconds)) return 0;
  if (actualSeconds < estimatedSeconds * 0.3) return 0;
  return plannerPotential(actualSeconds, estimatedSeconds);
}

export function dayCloseReward(streakDay: number): number {
  if (!Number.isFinite(streakDay) || streakDay <= 0) return 0;
  if (streakDay >= DAY_CLOSE_MAX_STREAK_DAY) return DAY_CLOSE_MAX_KEYS;
  return DAY_CLOSE_BASE_KEYS + DAY_CLOSE_STEP_KEYS * (streakDay - 1);
}

export function clampDayPotential(value: number): number {
  return Math.min(DAY_POTENTIAL_TARGET, normalizeDayPotential(value));
}

/** Внутреннее значение потенциала дня. Может быть выше 100 после закрытия. */
export function normalizeDayPotential(value: number): number {
  if (!Number.isFinite(value) || value <= 0) return 0;
  return Math.round(value * 10) / 10;
}

export function isDayClosed(dayPotential: number): boolean {
  return dayPotential >= DAY_POTENTIAL_TARGET;
}