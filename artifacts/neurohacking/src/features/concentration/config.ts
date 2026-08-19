export type ConcentrationMode = "signals" | "tracking" | "search";

export const CONCENTRATION_TECHNIQUE_ID = "T8";
export const CONCENTRATION_KEYS_COST = 400;
export const CONCENTRATION_REWARD_LEVEL = 5;
export const CONCENTRATION_POTENTIAL_PERCENT = 10;
export const SIGNALS_PREPARE_MS = 3000;
export const SIGNALS_RESULT_MS = 1500;
export const SIGNALS_FALSE_MS = 1500;
export const CONCENTRATION_ACCENT = "#F97316";
export const CONCENTRATION_ACCENT_SOFT = "rgba(249,115,22,0.14)";
export const CONCENTRATION_ACCENT_BORDER = "rgba(249,115,22,0.42)";

export interface ConcentrationModeMeta {
  mode: ConcentrationMode;
  title: string;
  shortTitle: string;
  onboarding: string;
  previewHint: string;
  previewExample: string;
}

export const CONCENTRATION_INTRO =
  "Концентрация — это способность замечать нужный сигнал, удерживать цель и не реагировать на отвлекающие детали. Пройди пять уровней в одной практике.";

export const CONCENTRATION_MODES: ConcentrationModeMeta[] = [
  {
    mode: "signals",
    title: "Сигналы",
    shortTitle: "Сигналы",
    onboarding: "Нажимай только на оранжевый сигнал. Любой другой цвет — отвлекающий: его нужно игнорировать.",
    previewHint: "Оранжевый нужно нажать быстро. Красный, зелёный, синий и жёлтый нажимать нельзя.",
    previewExample: "Оранжевый · реакция в мс",
  },
  {
    mode: "tracking",
    title: "Отслеживание объектов",
    shortTitle: "Объекты",
    onboarding: "Запомни подсвеченные цели. Затем следи за ними в движущейся группе и выбери их после остановки.",
    previewHint: "Сначала цели подсветятся, затем все объекты станут одинаковыми и начнут двигаться.",
    previewExample: "3 цели · группа 20+",
  },
  {
    mode: "search",
    title: "Поиск",
    shortTitle: "Поиск",
    onboarding: "Найди один нужный объект среди большой сетки похожих отвлекающих фигур за ограниченное время.",
    previewHint: "Сетка остаётся большой, а время поиска сокращается и объекты становятся похожее.",
    previewExample: "10×10 · 1 цель",
  },
];

export function concentrationModeMeta(mode: ConcentrationMode): ConcentrationModeMeta {
  return CONCENTRATION_MODES.find((item) => item.mode === mode) ?? CONCENTRATION_MODES[0];
}

export function concentrationRewardLevelForMode(mode: ConcentrationMode): number {
  return CONCENTRATION_REWARD_LEVEL;
}

export function signalDifficultyLevel(level: number): number {
  return Math.max(8, level);
}

export function signalCountForLevel(level: number): number {
  const difficultyLevel = signalDifficultyLevel(level);
  return Math.max(6, 6 + Math.min(9, Math.max(0, difficultyLevel - 1)) * 4);
}

export function signalThresholdForLevel(level: number): number {
  const difficultyLevel = signalDifficultyLevel(level);
  if (difficultyLevel <= 1) return 700;
  if (difficultyLevel <= 10) return Math.round(700 - ((difficultyLevel - 1) / 9) * 200);
  if (difficultyLevel <= 20) return Math.round(500 - ((difficultyLevel - 10) / 10) * 100);
  return 400;
}

export function signalPrepareDurationForLevel(level: number): number {
  const normalizedLevel = Math.min(10, Math.max(1, signalDifficultyLevel(level)));
  const progress = (normalizedLevel - 1) / 9;
  const minimum = Math.round((SIGNALS_PREPARE_MS - progress * 1000) / 100) * 100;
  const maximum = Math.round((3600 + progress * 4400) / 100) * 100;
  return minimum + Math.floor(Math.random() * (maximum - minimum + 1));
}

export function signalFalseDurationForLevel(_level: number): number {
  return SIGNALS_FALSE_MS;
}

export function trackingObjectsForLevel(level: number): { total: number; targets: number; moveMs: number } {
  const progress = Math.min(9, Math.max(0, level - 1)) / 9;
  return {
    total: 12 + Math.min(7, Math.max(0, level - 1)) * 4,
    targets: Math.min(11, 2 + Math.max(0, level - 1)),
    moveMs: Math.round(5000 + progress * 5000),
  };
}

export function searchGridSizeForLevel(level: number): number {
  if (level <= 2) return 8;
  if (level <= 4) return 9;
  return 10;
}

export function searchTimeForLevel(level: number): number {
  if (level <= 1) return 6500;
  if (level === 2) return 5500;
  if (level === 3) return 4000;
  if (level === 4) return 2500;
  return Math.max(1200, 2000 - Math.max(0, level - 5) * 90);
}

export function randomUniqueIndexes(total: number, count: number): number[] {
  const indexes = Array.from({ length: total }, (_, index) => index);
  for (let index = indexes.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [indexes[index], indexes[swapIndex]] = [indexes[swapIndex], indexes[index]];
  }
  return indexes.slice(0, count);
}

export function levelHint(mode: ConcentrationMode, level: number): string {
  if (mode === "signals") return `1 сигнал · ≤ ${signalThresholdForLevel(level)} мс`;
  if (mode === "tracking") {
    const { total, targets } = trackingObjectsForLevel(level);
    return `${targets} цели · ${total} объектов`;
  }
  const gridSize = searchGridSizeForLevel(level);
  return `${gridSize}×${gridSize} · ${Math.round(searchTimeForLevel(level) / 100) / 10} с`;
}