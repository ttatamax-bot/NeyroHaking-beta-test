import { ArrowRight, Check, ChevronLeft, LockKeyhole, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { MemoryModeLogo } from "./MemoryModeLogo";
import { MemorySymbol } from "./MemorySymbol";
import {
  MEMORY_ACCENT,
  MEMORY_ACCENT_BORDER,
  MEMORY_KEYS_COST,
  MEMORY_POTENTIAL_PERCENT,
  memoryModeMeta,
  type MemoryMode,
} from "./config";

interface MemoryPreviewProps {
  mode: MemoryMode;
  keysBalance?: number;
  isPurchasing?: boolean;
  onPurchase?: (mode: MemoryMode) => void;
  onBack?: () => void;
}

function PreviewVisual({ mode }: { mode: MemoryMode }) {
  if (mode === "reverse") {
    return (
      <div className="flex items-center justify-center gap-2" aria-label="Пример обратной последовательности">
        {["4", "7", "1"].map((digit, index) => (
          <motion.span
            key={digit}
            animate={{ y: [0, -3, 0] }}
            transition={{ duration: 2.2, repeat: Infinity, delay: index * 0.12 }}
            className="num flex h-12 w-10 items-center justify-center rounded-xl border text-xl text-primary"
            style={{ background: "rgba(249,115,22,.12)", borderColor: MEMORY_ACCENT_BORDER }}
          >
            {digit}
          </motion.span>
        ))}
        <ArrowRight size={17} className="mx-1 text-tertiary" />
        <span className="num text-xl" style={{ color: MEMORY_ACCENT }}>
          174
        </span>
      </div>
    );
  }

  if (mode === "matrix") {
    const litCells = new Set([1, 5, 7, 10]);
    return (
      <div className="mx-auto grid w-[152px] grid-cols-4 gap-2" aria-label="Пример матрицы">
        {Array.from({ length: 16 }, (_, index) => (
          <span
            key={index}
            className="aspect-square rounded-[7px] border"
            style={{
              background: litCells.has(index) ? MEMORY_ACCENT : "rgba(147,197,253,.08)",
              borderColor: litCells.has(index) ? "rgba(249,115,22,.8)" : "rgba(147,197,253,.12)",
              boxShadow: litCells.has(index) ? "0 0 18px rgba(249,115,22,.3)" : "none",
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center gap-2" aria-label="Пример последовательности символов">
      {(["dot", "triangle", "star", "diamond"] as const).map((symbol, index) => (
        <span
          key={symbol}
          className="flex h-11 w-11 items-center justify-center rounded-xl border text-lg"
          style={{
            color: index === 1 ? MEMORY_ACCENT : "#b7cee4",
            background: index === 1 ? "rgba(249,115,22,.13)" : "rgba(147,197,253,.08)",
            borderColor: index === 1 ? MEMORY_ACCENT_BORDER : "rgba(147,197,253,.14)",
          }}
        >
          <MemorySymbol symbol={symbol} className="h-6 w-6" />
        </span>
      ))}
    </div>
  );
}

export function MemoryPreview({ mode, keysBalance, isPurchasing = false, onPurchase, onBack }: MemoryPreviewProps) {
  const meta = memoryModeMeta(mode);
  const cannotAfford = keysBalance !== undefined && keysBalance < MEMORY_KEYS_COST;

  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative flex min-h-[100dvh] flex-col overflow-y-auto px-5 pb-8 pt-8"
      data-testid={`memory-preview-${mode}`}
    >
      <div className="mb-8 flex items-center justify-between">
        {onBack ? (
          <button type="button" onClick={onBack} className="p-1 text-tertiary" aria-label="Назад" data-testid="button-memory-preview-back">
            <ChevronLeft size={28} />
          </button>
        ) : <span />}
        <div className="flex flex-col items-center gap-1">
          <MemoryModeLogo mode={mode} large />
          <span
            className="font-medium uppercase leading-none tracking-[0.12em]"
            style={{ color: MEMORY_ACCENT, fontSize: 12 }}
          >
            {meta.shortTitle}
          </span>
        </div>
        <span className="w-8" />
      </div>

      <div className="glass mb-6 rounded-[24px] p-5">
        <p className="caption mb-4 text-tertiary">КАК ЭТО ВЫГЛЯДИТ</p>
        <div className="min-h-[126px] content-center rounded-[18px] border border-white/[.06] bg-[#091a2d] px-3 py-5">
          <PreviewVisual mode={mode} />
        </div>
        <p className="body-s mt-4 text-secondary">
          Информация держится на экране ровно <span className="text-primary">2 секунды</span>. С каждым уровнем её становится больше, но темп не меняется.
        </p>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-2">
        <div className="rounded-[18px] border border-white/[.08] bg-[#0b2037] p-4">
          <p className="caption text-tertiary">ЦИКЛ</p>
          <p className="title-s mt-2 text-primary">1 → 5</p>
          <p className="body-s mt-1 text-secondary">для награды</p>
        </div>
        <div className="rounded-[18px] border border-white/[.08] bg-[#0b2037] p-4">
          <p className="caption text-tertiary">ПРОГРЕСС</p>
          <p className="title-s mt-2 text-primary">Рекорд</p>
          <p className="body-s mt-1 text-secondary">сохраняется</p>
        </div>
      </div>

      <div className="mt-auto rounded-[20px] border p-4" style={{ borderColor: "rgba(249,115,22,.25)", background: "rgba(249,115,22,.07)" }}>
        <div className="flex items-center gap-3">
          <Sparkles size={19} style={{ color: MEMORY_ACCENT }} />
          <p className="body-s text-primary">
            Уровень 5 открывает <strong style={{ color: MEMORY_ACCENT }}>+{MEMORY_POTENTIAL_PERCENT}% потенциала дня</strong>
          </p>
        </div>
        <div className="mt-4 flex items-center justify-between gap-3">
          <span className="body-s text-secondary">Доступ навсегда</span>
          <button
            type="button"
            onClick={() => onPurchase?.(mode)}
            disabled={!onPurchase || isPurchasing || cannotAfford}
            className="flex min-h-11 items-center gap-2 rounded-[14px] px-4 text-sm font-semibold text-[#201308] disabled:cursor-not-allowed disabled:opacity-45"
            style={{ background: MEMORY_ACCENT }}
            data-testid={`button-purchase-memory-${mode}`}
          >
            <LockKeyhole size={16} />
            {isPurchasing ? "Открываем…" : `${MEMORY_KEYS_COST} ключей`}
          </button>
        </div>
        {cannotAfford && <p className="caption mt-3 text-right text-secondary">Недостаточно ключей</p>}
      </div>
      <div className="sr-only" aria-live="polite" data-testid="text-preview-state">
        {meta.previewExample}
      </div>
    </motion.section>
  );
}

export function MemoryModeFacts({ mode }: { mode: MemoryMode }) {
  const meta = memoryModeMeta(mode);
  return (
    <div className="mt-3 flex items-center gap-2 text-xs text-secondary">
      <Check size={14} style={{ color: MEMORY_ACCENT }} />
      <span>{meta.previewExample}</span>
    </div>
  );
}