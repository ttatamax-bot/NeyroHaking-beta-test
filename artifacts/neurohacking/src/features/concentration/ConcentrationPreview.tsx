import { ArrowRight, Check, ChevronLeft, Crosshair, LockKeyhole, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import {
  CONCENTRATION_ACCENT,
  CONCENTRATION_ACCENT_BORDER,
  CONCENTRATION_KEYS_COST,
  CONCENTRATION_POTENTIAL_PERCENT,
  concentrationModeMeta,
  type ConcentrationMode,
} from "./config";
import { ConcentrationModeLogo } from "./ConcentrationModeLogo";
import { MemorySymbol } from "../memory/MemorySymbol";

interface ConcentrationPreviewProps {
  mode: ConcentrationMode;
  keysBalance?: number;
  isPurchasing?: boolean;
  onPurchase?: (mode: ConcentrationMode) => void;
  onBack?: () => void;
}

function PreviewVisual({ mode }: { mode: ConcentrationMode }) {
  if (mode === "signals") {
    return (
      <div className="flex items-center justify-center gap-3" aria-label="Пример сигналов">
        {["#F97316", "#EF4444", "#22C55E", "#3B82F6", "#F97316"].map((color, index) => (
          <motion.span
            key={`${color}-${index}`}
            animate={{ scale: color === "#F97316" ? [1, 1.14, 1] : [1, .92, 1] }}
            transition={{ duration: 1.7, repeat: Infinity, delay: index * .12 }}
            className="h-10 w-10 rounded-full border"
            style={{ background: `${color}32`, borderColor: `${color}aa`, boxShadow: `0 0 18px ${color}55` }}
          />
        ))}
      </div>
    );
  }

  if (mode === "tracking") {
    return (
      <div className="relative mx-auto h-[126px] w-full max-w-[246px] overflow-hidden rounded-[18px] border border-white/[.06] bg-[#08182a]" aria-label="Пример отслеживания объектов">
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((index) => (
          <motion.span
            key={index}
            animate={{ x: [0, (index % 2 ? 18 : -16), 0], y: [0, (index % 3 - 1) * 18, 0] }}
            transition={{ duration: 2.8 + (index % 3) * .35, repeat: Infinity, ease: "easeInOut", delay: index * .08 }}
            className="absolute h-4 w-4 rounded-full border"
            style={{
              left: `${12 + (index * 19) % 76}%`,
              top: `${15 + (index * 31) % 68}%`,
              background: index < 3 ? "rgba(249,115,22,.72)" : "rgba(147,197,253,.15)",
              borderColor: index < 3 ? "rgba(255,224,166,.9)" : "rgba(147,197,253,.3)",
              boxShadow: index < 3 ? "0 0 14px rgba(249,115,22,.62)" : "none",
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="mx-auto grid w-[226px] grid-cols-10 gap-1.5" aria-label="Пример поиска">
      {Array.from({ length: 100 }, (_, index) => {
        const target = index === 47;
        const rotations = [-24, -18, -12, -8, 8, 12, 18, 24];
        const rotation = target ? 0 : rotations[index % rotations.length];
        const symbol = target || index % 5 !== 0 ? "triangle" : index % 10 === 0 ? "half" : "diamond";
        return (
          <span
            key={index}
            className="flex aspect-square items-center justify-center text-[#b7cee4]/60"
          >
            <span style={{ transform: `rotate(${rotation}deg) scale(${target ? 1 : index % 3 === 0 ? 0.86 : 0.94})` }}>
              <MemorySymbol symbol={symbol} className="h-3.5 w-3.5" />
            </span>
          </span>
        );
      })}
    </div>
  );
}

export function ConcentrationPreview({ mode, keysBalance, isPurchasing = false, onPurchase, onBack }: ConcentrationPreviewProps) {
  const meta = concentrationModeMeta(mode);
  const cannotAfford = keysBalance !== undefined && keysBalance < CONCENTRATION_KEYS_COST;

  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative flex min-h-[100dvh] flex-col overflow-y-auto px-5 pb-8 pt-8"
      data-testid={`concentration-preview-${mode}`}
    >
      <div className="mb-8 flex items-center justify-between">
        {onBack ? (
          <button type="button" onClick={onBack} className="p-1 text-tertiary" aria-label="Назад" data-testid="button-concentration-preview-back">
            <ChevronLeft size={28} />
          </button>
        ) : <span />}
        <div className="flex flex-col items-center gap-1">
          <ConcentrationModeLogo mode={mode} large />
          <span className="font-medium uppercase leading-none tracking-[0.12em]" style={{ color: CONCENTRATION_ACCENT, fontSize: 12 }}>{meta.shortTitle}</span>
        </div>
        <span className="w-8" />
      </div>

      <div className="glass mb-6 rounded-[24px] p-5">
        <p className="caption mb-4 text-tertiary">КАК ЭТО ВЫГЛЯДИТ</p>
        <div className="min-h-[126px] content-center rounded-[18px] border border-white/[.06] bg-[#091a2d] px-3 py-5">
          <PreviewVisual mode={mode} />
        </div>
        <p className="body-s mt-4 text-secondary">{meta.previewHint}</p>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-2">
        <div className="rounded-[18px] border border-white/[.08] bg-[#0b2037] p-4">
          <p className="caption text-tertiary">ЦИКЛ</p>
            <p className="title-s mt-2 text-primary">1–5</p>
          <p className="body-s mt-1 text-secondary">для награды</p>
        </div>
        <div className="rounded-[18px] border border-white/[.08] bg-[#0b2037] p-4">
          <p className="caption text-tertiary">ФОКУС</p>
          <p className="title-s mt-2 text-primary">Рекорд</p>
          <p className="body-s mt-1 text-secondary">сохраняется</p>
        </div>
      </div>

      <div className="mt-auto rounded-[20px] border p-4" style={{ borderColor: "rgba(249,115,22,.25)", background: "rgba(249,115,22,.07)" }}>
        <div className="flex items-center gap-3">
          <Sparkles size={19} style={{ color: CONCENTRATION_ACCENT }} />
            <p className="body-s text-primary">Уровень 5 открывает <strong style={{ color: CONCENTRATION_ACCENT }}>+{CONCENTRATION_POTENTIAL_PERCENT}% потенциала дня</strong></p>
        </div>
        <div className="mt-4 flex items-center justify-between gap-3">
          <span className="body-s text-secondary">Доступ навсегда</span>
          <button
            type="button"
            onClick={() => onPurchase?.(mode)}
            disabled={!onPurchase || isPurchasing || cannotAfford}
            className="flex min-h-11 items-center gap-2 rounded-[14px] px-4 text-sm font-semibold text-[#201308] disabled:cursor-not-allowed disabled:opacity-45"
            style={{ background: CONCENTRATION_ACCENT }}
            data-testid={`button-purchase-concentration-${mode}`}
          >
            <LockKeyhole size={16} />
            {isPurchasing ? "Открываем…" : `${CONCENTRATION_KEYS_COST} ключей`}
          </button>
        </div>
        {cannotAfford && <p className="caption mt-3 text-right text-secondary">Недостаточно ключей</p>}
      </div>
      <div className="sr-only" aria-live="polite" data-testid="text-concentration-preview-state">{meta.previewExample}</div>
    </motion.section>
  );
}

export function ConcentrationModeFacts({ mode }: { mode: ConcentrationMode }) {
  const meta = concentrationModeMeta(mode);
  return (
    <div className="mt-3 flex items-center gap-2 text-xs text-secondary">
      <Check size={14} style={{ color: CONCENTRATION_ACCENT }} />
      <span>{meta.previewExample}</span>
    </div>
  );
}