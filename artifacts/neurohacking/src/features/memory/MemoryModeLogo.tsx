import { motion } from "framer-motion";
import type { MemoryMode } from "./config";
import { MemorySymbol } from "./MemorySymbol";

export function MemoryModeLogo({ mode, large = false }: { mode: MemoryMode; large?: boolean }) {
  const cellClass = large ? "h-5 w-5 rounded-[6px]" : "h-3.5 w-3.5 rounded-[4px]";
  const digitClass = large ? "h-8 w-7 rounded-[8px] text-base" : "h-6 w-5 rounded-[6px] text-xs";
  const symbolClass = large ? "h-8 w-7 rounded-[8px] text-base" : "h-6 w-5 rounded-[6px] text-xs";

  if (mode === "reverse") {
    return (
      <div className={`flex items-center ${large ? "gap-1" : "gap-0.5"}`} aria-label="Логотип обратной последовательности">
        {["4", "7", "1"].map((digit) => (
          <motion.span
            key={digit}
            animate={{ y: [0, large ? -5 : -3, 0], opacity: [0.72, 1, 0.72] }}
            transition={{ duration: 2.2, repeat: Infinity, delay: Number(digit) * 0.04 }}
            className={`flex items-center justify-center border border-orange-400/45 bg-orange-500/[.12] font-semibold text-orange-300 ${digitClass}`}
          >
            {digit}
          </motion.span>
        ))}
      </div>
    );
  }

  if (mode === "matrix") {
    return (
      <div className={`grid grid-cols-3 ${large ? "gap-2" : "gap-1.5"}`} aria-label="Логотип матрицы">
        {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((cell) => {
          const active = [1, 3, 4].includes(cell);
          return (
            <motion.span
              key={cell}
              animate={{ scale: [1, active ? (large ? 1.2 : 1.14) : 1, 1], opacity: [0.68, 1, 0.68] }}
              transition={{ duration: 2.1, repeat: Infinity, delay: cell * 0.06 }}
              className={cellClass}
              style={{
                background: active ? "#F97316" : "rgba(147,197,253,.14)",
                boxShadow: active ? `0 0 ${large ? 15 : 9}px rgba(249,115,22,.68)` : "none",
              }}
            />
          );
        })}
      </div>
    );
  }

  return (
    <div className={`flex items-center ${large ? "gap-1" : "gap-0.5"}`} aria-label="Логотип последовательности символов">
      {(["diamond", "sparkle", "dot"] as const).map((symbol, index) => (
        <motion.span
          key={symbol}
          animate={{ y: [0, large ? -5 : -3, 0], rotate: [0, index % 2 === 0 ? 5 : -5, 0], opacity: [0.72, 1, 0.72] }}
          transition={{ duration: 2.2, repeat: Infinity, delay: index * 0.12 }}
          className={`flex items-center justify-center border border-orange-400/45 bg-orange-500/[.12] text-orange-300 ${symbolClass}`}
        >
          <MemorySymbol symbol={symbol} className={large ? "h-5 w-5" : "h-4 w-4"} />
        </motion.span>
      ))}
    </div>
  );
}