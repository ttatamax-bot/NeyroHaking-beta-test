/**
 * Presentational configuration for the «Память» technique.
 * Progress and economy are intentionally kept outside these components.
 */

export type MemoryMode = "reverse" | "matrix" | "symbols";

export const MEMORY_TECHNIQUE_ID = "T7";
export const MEMORY_KEYS_COST = 400;
export const MEMORY_SHOW_MS = 2000;
export const MEMORY_REVERSE_PAUSE_MS = 1000;
export const MEMORY_REWARD_LEVEL = 5;
export const MEMORY_POTENTIAL_PERCENT = 10;
export const MEMORY_ACCENT = "#F97316";
export const MEMORY_ACCENT_SOFT = "rgba(249,115,22,0.14)";
export const MEMORY_ACCENT_BORDER = "rgba(249,115,22,0.42)";

/** These are deliberately geometric rather than pictographic. */
export const MEMORY_SYMBOLS = ["●", "▲", "★", "◆", "■", "✦", "⬟", "◗"] as const;

export interface MemoryModeMeta {
  mode: MemoryMode;
  title: string;
  shortTitle: string;
  onboarding: string;
  previewHint: string;
  previewExample: string;
}

export const MEMORY_INTRO =
  "Память можно тренировать. Запоминай всё больше информации с каждым уровнем. Ошибка возвращает попытку на первый уровень. Пройди пять уровней.";

export const MEMORY_MODES: MemoryModeMeta[] = [
  {
    mode: "reverse",
    title: "Обратная последовательность",
    shortTitle: "Обратная",
    onboarding: "Запомни цифры. После исчезновения введи их в обратном порядке.",
    previewHint: "Цифры появляются на две секунды — затем ты вводишь их наоборот.",
    previewExample: "47  →  74",
  },
  {
    mode: "matrix",
    title: "Матрица",
    shortTitle: "Матрица",
    onboarding: "Запомни подсвеченные клетки. После исчезновения восстанови их расположение.",
    previewHint: "Запоминай расположение оранжевых клеток в поле.",
    previewExample: "подсветка  →  восстановление",
  },
  {
    mode: "symbols",
    title: "Последовательность символов",
    shortTitle: "Символы",
    onboarding: "Запомни порядок символов. После исчезновения нажми их в правильной последовательности.",
    previewHint: "Символы появляются рядом — затем повтори их порядок.",
    previewExample: "●  ▲  ★  →  ●  ▲  ★",
  },
];

export function memoryModeMeta(mode: MemoryMode): MemoryModeMeta {
  return MEMORY_MODES.find((item) => item.mode === mode) ?? MEMORY_MODES[0];
}

export function digitsForLevel(level: number): number {
  return Math.max(3, level + 2);
}

export function symbolsForLevel(level: number): number {
  return Math.max(3, level + 2);
}

export interface MatrixLevel {
  size: number;
  cells: number;
}

export function matrixForLevel(level: number): MatrixLevel {
  const cells = Math.max(4, level + 3);
  let size = level <= 2 ? 4 : level <= 5 ? 5 : level <= 8 ? 6 : 7 + Math.floor((level - 9) / 3);
  while (cells > Math.floor((size * size) / 2)) size += 1;
  return { size: Math.min(size, 9), cells };
}

export function levelHint(mode: MemoryMode, level: number): string {
  if (mode === "matrix") {
    const { size, cells } = matrixForLevel(level);
    return `${size}×${size} · ${cells} клеток`;
  }
  return `${mode === "symbols" ? symbolsForLevel(level) : digitsForLevel(level)} ${mode === "symbols" ? "символов" : "цифр"}`;
}

export function randomDigits(count: number): number[] {
  return Array.from({ length: count }, () => Math.floor(Math.random() * 10));
}

export function randomSymbols(count: number): string[] {
  return Array.from({ length: count }, () => MEMORY_SYMBOLS[Math.floor(Math.random() * MEMORY_SYMBOLS.length)]);
}

export function randomCells(size: number, count: number): number[] {
  const cells = Array.from({ length: size * size }, (_, index) => index);
  for (let index = cells.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [cells[index], cells[swapIndex]] = [cells[swapIndex], cells[index]];
  }
  return cells.slice(0, count);
}

export function symbolKeypad(sequence: string[]): string[] {
  const unique = Array.from(new Set(sequence));
  const keypad = [...unique];
  for (const symbol of MEMORY_SYMBOLS) {
    if (keypad.length >= Math.max(5, unique.length + 2)) break;
    if (!keypad.includes(symbol)) keypad.push(symbol);
  }
  return keypad;
}