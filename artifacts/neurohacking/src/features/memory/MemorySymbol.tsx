import type { MemorySymbolId } from "./config";

const SYMBOL_LABELS: Record<MemorySymbolId, string> = {
  dot: "точка",
  triangle: "треугольник",
  star: "звезда",
  diamond: "ромб",
  square: "квадрат",
  sparkle: "искра",
  hexagon: "шестиугольник",
  half: "полукруг",
};

export function memorySymbolLabel(symbol: MemorySymbolId): string {
  return SYMBOL_LABELS[symbol];
}

export function MemorySymbol({
  symbol,
  className = "h-7 w-7",
}: {
  symbol: MemorySymbolId;
  className?: string;
}) {
  const common = {
    fill: "currentColor",
    vectorEffect: "non-scaling-stroke" as const,
  };

  return (
    <svg
      viewBox="0 0 32 32"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      {symbol === "dot" && <circle cx="16" cy="16" r="8.5" {...common} />}
      {symbol === "triangle" && <path d="M16 4 28 27H4L16 4Z" {...common} />}
      {symbol === "star" && (
        <path d="m16 3 3.1 8.9 9.4.2-7.4 5.6 2.7 9.1-7.8-5.3-7.8 5.3 2.7-9.1-7.4-5.6 9.4-.2L16 3Z" {...common} />
      )}
      {symbol === "diamond" && <path d="m16 3 13 13-13 13L3 16 16 3Z" {...common} />}
      {symbol === "square" && <rect x="5" y="5" width="22" height="22" rx="3" {...common} />}
      {symbol === "sparkle" && (
        <path d="m16 2.5 3.6 9.9 9.9 3.6-9.9 3.6-3.6 9.9-3.6-9.9-9.9-3.6 9.9-3.6L16 2.5Z" {...common} />
      )}
      {symbol === "hexagon" && <path d="m9 4.5 14 0 7 11.5-7 11.5H9L2 16 9 4.5Z" {...common} />}
      {symbol === "half" && <path d="M16 4a12 12 0 0 1 0 24V4Z" {...common} />}
    </svg>
  );
}