export type ConcentrationMode = "signals" | "tracking" | "search";

export const CONCENTRATION_TECHNIQUE_ID = "T8";
export const CONCENTRATION_KEYS_COST = 400;
export const CONCENTRATION_REWARD_LEVEL = 5;
export const CONCENTRATION_POTENTIAL_PERCENT = 10;
export const SIGNALS_PREPARE_MS = 3000;
export const SIGNALS_RESULT_MS = 1500;
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
  "Концентрация — это способность замечать нужный сигнал, удерживать цель и не реагировать на отвлекающие детали. Пройди пять уровней в любой практике.";

export const CONCENTRATION_MODES: ConcentrationModeMeta[] = [
  {
    mode: "signals",
    title: "Сигналы",
    shortTitle: "Сигналы",
    onboarding: "Нажимай только на оранжевый сигнал. Любой другой цвет — отвлекающий: его нужно игнорировать.",
    previewHint: "Оранжевый нужно нажать быстро. Красный, зелёный, синий и жёлтый нажимать нельзя.",
    previewExample: "🟠  →  реакция в мс",
  },
  {
    mode: "tracking",
    title: "Отслеживание объектов",
    shortTitle: "Объекты",
    onboarding: "Запомни подсвеченные цели. Затем следи за ними в движущейся группе и выбери их после остановки.",
    previewHint: "Сначала цели подсветятся, затем все объекты станут одинаковыми и начнут двигаться.",
    previewExample: "3 цели  →  группа 20+",
  },
  {
    mode: "search",
    title: "Поиск",
    shortTitle: "Поиск",
    onboarding: "Найди один нужный объект среди большой сетки похожих отвлекающих фигур за ограниченное время.",
    previewHint: "Сетка остаётся большой, а время поиска сокращается и объекты становятся похожее.",
    previewExample: "10×10  →  1 цель",
  },
];

export function concentrationModeMeta(mode: ConcentrationMode): ConcentrationModeMeta {
  return CONCENTRATION_MODES.find((item) => item.mode === mode) ?? CONCENTRATION_MODES[0];
}

export function signalCountForLevel(level: number): number {
  return Math.max(10, 10 + Math.min(20, level - 1) * 5);
}

export function signalThresholdForLevel(level: number): number {
  if (level <= 3) return 500;
  if (level === 4) return 450;
  return Math.max(280, 400 - Math.floor((level - 5) / 2) * 12);
}

export function trackingObjectsForLevel(level: number): { total: number; targets: number; moveMs: number } {
  return {
    total: 20 + Math.min(7, Math.max(0, level - 1)) * 5,
    targets: Math.min(12, 3 + Math.max(0, level - 1)),
    moveMs: Math.max(1100, 2400 - Math.min(7, Math.max(0, level - 1)) * 170),
  };
}

export function searchTimeForLevel(level: number): number {
  if (level <= 1) return 5000;
  if (level === 2) return 4000;
  if (level === 3) return 3000;
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
  if (mode === "signals") return `${signalCountForLevel(level)} сигналов · ≤ ${signalThresholdForLevel(level)} мс`;
  if (mode === "tracking") {
    const { total, targets } = trackingObjectsForLevel(level);
    return `${targets} цели · ${total} объектов`;
  }
  return `10×10 · ${Math.round(searchTimeForLevel(level) / 100) / 10} с`;
}