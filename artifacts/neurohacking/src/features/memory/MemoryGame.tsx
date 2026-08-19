import { ChevronLeft, Clock3, RotateCcw, Trophy } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import {
  digitsForLevel,
  matrixForLevel,
  MEMORY_ACCENT,
  MEMORY_ACCENT_BORDER,
  MEMORY_ACCENT_SOFT,
  MEMORY_PRE_INPUT_PAUSE_MS,
  MEMORY_REWARD_LEVEL,
  MEMORY_SHOW_MS,
  memoryModeMeta,
  randomCells,
  randomDigits,
  randomSymbols,
  symbolKeypad,
  symbolsForLevel,
  type MemorySymbolId,
  type MemoryMode,
} from "./config";
import { initMemorySound, playCorrect, playFail, playLevelUp, playReward, playTap } from "./sounds";
import { MemoryOnboarding } from "./MemoryOnboarding";
import { MemoryPreview } from "./MemoryPreview";
import { MemoryModeLogo } from "./MemoryModeLogo";
import { memorySymbolLabel, MemorySymbol } from "./MemorySymbol";
import { GameInstrumentBackdrop } from "../shared/GameInstrumentBackdrop";

type GamePhase = "idle" | "showing" | "waiting" | "input" | "success" | "failed";

interface ReverseChallenge {
  mode: "reverse";
  digits: number[];
}

interface MatrixChallenge {
  mode: "matrix";
  size: number;
  cells: number[];
}

interface SymbolsChallenge {
  mode: "symbols";
  symbols: MemorySymbolId[];
  keypad: MemorySymbolId[];
}

type MemoryChallenge = ReverseChallenge | MatrixChallenge | SymbolsChallenge;

export interface MemoryGameProps {
  mode: MemoryMode;
  purchased?: boolean;
  bestLevel?: number;
  keysBalance?: number;
  rewardAwardedToday?: boolean;
  showOnboarding?: boolean;
  isPurchasing?: boolean;
  onPurchase?: (mode: MemoryMode) => void;
  onStartMode?: (mode: MemoryMode) => void;
  onBack?: () => void;
  onBestLevelUpdate?: (mode: MemoryMode, bestLevel: number) => void;
  onReward?: (mode: MemoryMode) => void;
  onLevelFiveComplete?: (mode: MemoryMode) => void;
  onOnboardingComplete?: (mode: MemoryMode) => void;
}

function createChallenge(mode: MemoryMode, level: number): MemoryChallenge {
  if (mode === "reverse") return { mode, digits: randomDigits(digitsForLevel(level)) };
  if (mode === "matrix") {
    const { size, cells } = matrixForLevel(level);
    return { mode, size, cells: randomCells(size, cells) };
  }
  const symbols = randomSymbols(symbolsForLevel(level));
  return { mode, symbols, keypad: symbolKeypad(symbols) };
}

function LevelRail({ level, bestLevel, phase }: { level: number; bestLevel: number; phase: GamePhase }) {
  return (
    <div className="flex items-end justify-between gap-3" data-testid="memory-level-status">
      <div>
        <p className="caption text-tertiary">ТЕКУЩИЙ УРОВЕНЬ</p>
        <div className="mt-1 flex items-baseline gap-2">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={level}
              initial={{ opacity: 0, y: 12, filter: "blur(4px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -12, filter: "blur(4px)" }}
              transition={{ duration: .24, ease: "easeOut" }}
              className="num inline-block min-w-[2ch] text-center text-[38px] leading-none tabular-nums"
              style={{ color: MEMORY_ACCENT, fontVariantNumeric: "tabular-nums" }}
              data-testid="text-memory-level"
            >
              {level}
            </motion.span>
          </AnimatePresence>
        </div>
      </div>
      <div className="text-right">
        <p className="caption text-tertiary">ЛУЧШИЙ</p>
        <p className="num mt-1 min-w-[2ch] text-center text-lg tabular-nums text-primary" style={{ fontVariantNumeric: "tabular-nums" }} data-testid="text-memory-best-level">{bestLevel}</p>
      </div>
      <span className="sr-only" aria-live="polite">
        {phase === "showing" ? "Запомни" : phase === "waiting" ? "Приготовься" : phase === "input" ? "Твой ход" : ""}
      </span>
    </div>
  );
}

function StepDots({ level, phase }: { level: number; phase: GamePhase }) {
  const failed = phase === "failed";
  const cycleLevel = ((Math.max(1, level) - 1) % 5) + 1;
  return (
    <div className="flex gap-1.5" aria-label={`Прогресс цикла уровней: ${cycleLevel} из 5`}>
      {[1, 2, 3, 4, 5].map((step) => (
        <motion.span
          key={step}
          initial={{ scaleX: .45, opacity: .35 }}
          animate={{ scaleX: 1, opacity: step <= cycleLevel || failed ? 1 : .72 }}
          transition={{ duration: .38, delay: step * .055, ease: "easeOut" }}
          className={`level-step h-1.5 flex-1 rounded-full ${failed ? "level-step-failed" : step <= cycleLevel ? "level-step-active" : ""}`}
          style={{
            background: failed ? "rgba(244,63,94,.9)" : step <= cycleLevel ? MEMORY_ACCENT : "rgba(147,197,253,.14)",
            boxShadow: failed ? "0 0 10px rgba(244,63,94,.72)" : step <= cycleLevel ? "0 0 10px rgba(249,115,22,.72)" : "none",
          }}
        />
      ))}
    </div>
  );
}

function MemoryPauseState() {
  return (
    <motion.div
      key="waiting"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="game-card flex min-h-[330px] flex-col items-center justify-center rounded-[25px] border border-orange-400/40 px-7 text-center"
      data-testid="memory-pre-input-pause"
    >
      <motion.div
        animate={{ rotate: [0, -8, 8, 0], scale: [1, 1.08, 1] }}
        transition={{ duration: 1, ease: "easeInOut" }}
        className="flex h-14 w-14 items-center justify-center rounded-2xl border border-orange-300/45 bg-[#153653]"
      >
        <Clock3 size={22} style={{ color: MEMORY_ACCENT }} />
      </motion.div>
      <p className="title-m mt-4 text-primary">Приготовься</p>
      <div className="mt-5 h-1 w-32 overflow-hidden rounded-full bg-[#183957]">
        <motion.span
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 1, ease: "linear" }}
          className="block h-full origin-left rounded-full"
          style={{ background: MEMORY_ACCENT }}
        />
      </div>
    </motion.div>
  );
}

function ShowingState({ challenge, level }: { challenge: MemoryChallenge; level: number }) {
  return (
    <motion.div
      key={`show-${level}`}
      initial={{ opacity: 0, scale: 0.94 }}
      animate={{ opacity: 1, scale: 1 }}
      className="game-card flex min-h-[330px] flex-col items-center justify-center rounded-[25px] border border-orange-400/40 px-4"
      data-testid="memory-show-state"
    >
      <div className="mb-7 flex items-center gap-2 text-xs text-secondary">
        <Clock3 size={14} style={{ color: MEMORY_ACCENT }} />
        <span>Запомни за 2 секунды</span>
      </div>
      {challenge.mode === "reverse" && (
        <div className="num flex flex-wrap justify-center gap-2 text-[34px] text-primary" data-testid="memory-sequence-display">
          {challenge.digits.map((digit, index) => (
            <motion.span
              key={`${digit}-${index}`}
              initial={{ opacity: 0, y: 12, scale: .82 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: index * .08, type: "spring", stiffness: 420, damping: 22 }}
            >
              {digit}
            </motion.span>
          ))}
        </div>
      )}
      {challenge.mode === "symbols" && (
        <div className="flex max-w-full flex-wrap justify-center gap-2 text-[28px] text-primary" data-testid="memory-sequence-display">
          {challenge.symbols.map((symbol, index) => (
            <motion.span
              key={`${symbol}-${index}`}
              initial={{ opacity: 0, y: 10, scale: .7 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: index * .08, type: "spring", stiffness: 420, damping: 22 }}
              className="flex h-9 w-9 items-center justify-center"
            >
              <MemorySymbol symbol={symbol} className="h-8 w-8" />
            </motion.span>
          ))}
        </div>
      )}
      {challenge.mode === "matrix" && (
        <div className="memory-grid grid w-[min(70vw,246px)] gap-2" style={{ gridTemplateColumns: `repeat(${challenge.size}, minmax(0, 1fr))` }} data-testid="memory-matrix-display">
          {Array.from({ length: challenge.size * challenge.size }, (_, index) => (
            <motion.span
              key={index}
              initial={{ opacity: 0, scale: .6 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * .035, duration: .18 }}
              className="aspect-square rounded-[8px] border"
              style={{
                background: challenge.cells.includes(index) ? MEMORY_ACCENT : "rgba(147,197,253,.07)",
                borderColor: challenge.cells.includes(index) ? "rgba(249,115,22,.85)" : "rgba(147,197,253,.12)",
                boxShadow: challenge.cells.includes(index) ? "0 0 18px rgba(249,115,22,.32)" : "none",
              }}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
}

function ReverseInput({ digits, entered, onDigit }: { digits: number[]; entered: number[]; onDigit: (digit: number) => void }) {
  const expected = [...digits].reverse();
  return (
    <div className="game-card flex min-h-[330px] flex-col justify-between rounded-[25px] border border-orange-300/35 p-5" data-testid="memory-reverse-input">
      <div>
        <p className="caption text-tertiary">ВВЕДИ ОБРАТНО</p>
        <div className="mt-4 flex min-h-12 items-center justify-center gap-2 rounded-[15px] border border-orange-400/25 bg-orange-500/[.06]">
          {expected.map((_, index) => (
            <span key={index} className="num text-lg" style={{ color: entered[index] === undefined ? "rgba(167,185,201,.38)" : MEMORY_ACCENT }}>
              {entered[index] ?? "·"}
            </span>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-5 gap-2">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((digit) => (
            <motion.button
            key={digit}
            type="button"
            onClick={() => onDigit(digit)}
              whileTap={{ scale: .9, y: 2 }}
              whileHover={{ y: -2 }}
              className="game-control num min-h-12 rounded-[13px] text-lg text-primary"
            data-testid={`button-memory-digit-${digit}`}
            >
            {digit}
            </motion.button>
        ))}
      </div>
    </div>
  );
}

function MatrixInput({ challenge, selected, onCell }: { challenge: MatrixChallenge; selected: number[]; onCell: (cell: number) => void }) {
  return (
    <div className="game-card flex min-h-[330px] flex-col items-center justify-center rounded-[25px] border border-orange-300/35 p-5" data-testid="memory-matrix-input">
      <p className="caption mb-5 text-tertiary">ВОССТАНОВИ КЛЕТКИ · {selected.length}/{challenge.cells.length}</p>
      <div className="memory-grid grid w-[min(70vw,246px)] gap-2" style={{ gridTemplateColumns: `repeat(${challenge.size}, minmax(0, 1fr))` }}>
        {Array.from({ length: challenge.size * challenge.size }, (_, index) => {
          const active = selected.includes(index);
          return (
              <motion.button
              key={index}
              type="button"
              onClick={() => onCell(index)}
                whileTap={{ scale: .88 }}
                whileHover={{ scale: 1.04 }}
                animate={{ scale: active ? [1, 1.06, 1] : 1 }}
                transition={{ duration: .24, ease: "easeOut" }}
                className="game-control aspect-square rounded-[8px] border transition-none"
              style={{
                background: active ? MEMORY_ACCENT : "#102b46",
                borderColor: active ? "rgba(249,115,22,.9)" : "rgba(147,197,253,.12)",
                boxShadow: active ? "0 0 18px rgba(249,115,22,.3)" : "none",
              }}
              data-testid={`button-memory-cell-${index}`}
              aria-label={`Клетка ${index + 1}${active ? ", выбрана" : ""}`}
            />
          );
        })}
      </div>
    </div>
  );
}

function SymbolsInput({ challenge, entered, onSymbol }: { challenge: SymbolsChallenge; entered: MemorySymbolId[]; onSymbol: (symbol: MemorySymbolId) => void }) {
  return (
    <div className="game-card flex min-h-[330px] flex-col justify-between rounded-[25px] border border-orange-300/35 p-5" data-testid="memory-symbols-input">
      <div>
        <p className="caption text-tertiary">ПОВТОРИ ПОРЯДОК</p>
        <div className="mt-4 flex min-h-12 flex-wrap items-center justify-center gap-2 rounded-[15px] border border-orange-400/25 bg-orange-500/[.06]">
          {challenge.symbols.map((_, index) => (
            <span key={index} className="flex h-7 w-7 items-center justify-center" style={{ color: entered[index] ? MEMORY_ACCENT : "rgba(167,185,201,.38)" }}>
              {entered[index] ? <MemorySymbol symbol={entered[index]} className="h-6 w-6" /> : "·"}
            </span>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {challenge.keypad.map((symbol, index) => (
            <motion.button
            key={symbol}
            type="button"
            onClick={() => onSymbol(symbol)}
              whileTap={{ scale: .9, rotate: index % 2 === 0 ? -3 : 3 }}
              whileHover={{ y: -2 }}
            className="game-control min-h-12 rounded-[13px] text-xl text-primary"
            aria-label={`Символ: ${memorySymbolLabel(symbol)}`}
            data-testid={`button-memory-symbol-${symbol}`}
          >
            <MemorySymbol symbol={symbol} className="mx-auto h-7 w-7" />
           </motion.button>
        ))}
      </div>
    </div>
  );
}

function SuccessGlowState({
  challenge,
  enteredDigits,
  enteredSymbols,
  selectedCells,
  rewardFlash,
}: {
  challenge: MemoryChallenge;
  enteredDigits: number[];
  enteredSymbols: MemorySymbolId[];
  selectedCells: number[];
  rewardFlash: boolean;
}) {
  return (
    <motion.div
      key="success"
      initial={{ opacity: 0.65, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.22 }}
      className="game-card game-card--success relative flex min-h-[330px] flex-col items-center justify-center rounded-[25px] border"
      data-testid="memory-success-state"
    >
      {rewardFlash && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-5 rounded-full border border-orange-300/50 bg-orange-500/15 px-4 py-2 text-sm font-semibold text-orange-200"
          data-testid="text-memory-reward"
        >
          +10% потенциала дня
        </motion.div>
      )}
      {challenge.mode === "matrix" ? (
        <div className="grid w-[min(70vw,246px)] gap-2" style={{ gridTemplateColumns: `repeat(${challenge.size}, minmax(0, 1fr))` }}>
          {Array.from({ length: challenge.size * challenge.size }, (_, index) => {
            const active = selectedCells.includes(index) || challenge.cells.includes(index);
            return (
              <span
                key={index}
                className="aspect-square rounded-[8px] border transition-none"
                style={{
                  background: active ? MEMORY_ACCENT : "rgba(147,197,253,.07)",
                  borderColor: active ? "rgba(249,115,22,.95)" : "rgba(147,197,253,.12)",
                  boxShadow: active ? "0 0 22px rgba(249,115,22,.72)" : "none",
                }}
              />
            );
          })}
        </div>
      ) : (
        <div className="flex flex-wrap justify-center gap-2">
          {challenge.mode === "reverse"
            ? enteredDigits.map((tile, index) => (
                <span
                  key={`${tile}-${index}`}
                  className="num flex h-12 min-w-10 items-center justify-center rounded-xl border px-2 text-xl text-orange-100 shadow-[0_0_22px_rgba(249,115,22,.62)]"
                  style={{ background: "rgba(249,115,22,.22)", borderColor: "rgba(249,115,22,.85)" }}
                >
                  {tile}
                </span>
              ))
            : enteredSymbols.map((tile, index) => (
                <span
                  key={`${tile}-${index}`}
                  className="flex h-12 min-w-10 items-center justify-center rounded-xl border px-2 text-orange-100 shadow-[0_0_22px_rgba(249,115,22,.62)]"
                  style={{ background: "rgba(249,115,22,.22)", borderColor: "rgba(249,115,22,.85)" }}
                >
                  <MemorySymbol symbol={tile} className="h-7 w-7" />
                </span>
              ))}
        </div>
      )}
    </motion.div>
  );
}

function FailedGlowState({
  challenge,
}: {
  challenge: MemoryChallenge;
}) {
  return (
    <motion.div
      key="failed"
      initial={{ opacity: 0.7, x: -4 }}
      animate={{ opacity: 1, x: 0 }}
       className="game-card game-card--failed flex min-h-[330px] items-center justify-center rounded-[25px] border px-6"
      data-testid="memory-failed-state"
    >
      {challenge.mode === "matrix" ? (
        <div className="grid w-[min(70vw,246px)] gap-2" style={{ gridTemplateColumns: `repeat(${challenge.size}, minmax(0, 1fr))` }}>
          {Array.from({ length: challenge.size * challenge.size }, (_, index) => {
            const active = challenge.cells.includes(index);
            return (
              <motion.span
                key={index}
                animate={active ? { scale: [1, 1.08, 1], opacity: [0.75, 1, 0.75] } : { opacity: 0.38 }}
                transition={{ duration: 0.8, repeat: active ? Infinity : 0, delay: index * 0.03 }}
                className="aspect-square rounded-[8px] border"
                style={{
                  background: active ? "rgba(244,63,94,.55)" : "rgba(147,197,253,.07)",
                  borderColor: active ? "rgba(251,113,133,.95)" : "rgba(147,197,253,.12)",
                  boxShadow: active ? "0 0 22px rgba(244,63,94,.82)" : "none",
                }}
              />
            );
          })}
        </div>
      ) : (
        <div className="flex flex-wrap justify-center gap-2">
          {challenge.mode === "reverse"
            ? challenge.digits.map((tile, index) => (
                <motion.span
                  key={`${tile}-${index}`}
                  animate={{ scale: [1, 1.08, 1], opacity: [0.76, 1, 0.76] }}
                  transition={{ duration: 0.8, repeat: Infinity, delay: index * 0.08 }}
                  className="num flex h-12 min-w-10 items-center justify-center rounded-xl border px-2 text-xl text-rose-100"
                  style={{ background: "rgba(244,63,94,.28)", borderColor: "rgba(251,113,133,.95)", boxShadow: "0 0 22px rgba(244,63,94,.82)" }}
                >
                  {tile}
                </motion.span>
              ))
            : challenge.symbols.map((tile, index) => (
                <motion.span
                  key={`${tile}-${index}`}
                  animate={{ scale: [1, 1.08, 1], opacity: [0.76, 1, 0.76] }}
                  transition={{ duration: 0.8, repeat: Infinity, delay: index * 0.08 }}
                  className="flex h-12 min-w-10 items-center justify-center rounded-xl border px-2 text-rose-100"
                  style={{ background: "rgba(244,63,94,.28)", borderColor: "rgba(251,113,133,.95)", boxShadow: "0 0 22px rgba(244,63,94,.82)" }}
                >
                  <MemorySymbol symbol={tile} className="h-7 w-7" />
                </motion.span>
              ))}
        </div>
      )}
    </motion.div>
  );
}

function RetryBonusCard({ onRetry }: { onRetry: () => void }) {
  return (
    <motion.button
      type="button"
      onClick={onRetry}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileTap={{ scale: 0.98 }}
      className="relative mt-4 flex min-h-[78px] w-full items-center gap-3 overflow-hidden rounded-[24px] border border-rose-300/45 bg-[linear-gradient(135deg,rgba(116,42,78,.98),rgba(40,30,67,.98)_58%,rgba(13,31,57,.98))] px-4 py-3 text-left shadow-[0_0_0_5px_rgba(244,63,94,.06),0_12px_28px_rgba(0,0,0,.24),inset_0_1px_0_rgba(255,255,255,.12)]"
      data-testid="button-memory-retry"
    >
      <span className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px] border border-rose-200/45 bg-[linear-gradient(145deg,rgba(255,145,169,.95),rgba(212,47,103,.9))] text-white shadow-[0_0_22px_rgba(244,63,94,.42),inset_0_1px_0_rgba(255,255,255,.45)]">
        <RotateCcw size={21} strokeWidth={2.2} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-rose-100/65">Восстановить ритм</span>
        <span className="mt-1 block text-[16px] font-semibold leading-tight text-white">Начать сначала</span>
        <span className="mt-0.5 block text-xs text-rose-100/65">Новая попытка с первого уровня</span>
      </span>
      <span className="text-xl text-rose-100/75" aria-hidden="true">→</span>
    </motion.button>
  );
}

export function MemoryGame({
  mode,
  purchased = true,
  bestLevel = 1,
  keysBalance,
  rewardAwardedToday = false,
  showOnboarding = false,
  isPurchasing = false,
  onPurchase,
  onStartMode,
  onBack,
  onBestLevelUpdate,
  onReward,
  onLevelFiveComplete,
  onOnboardingComplete,
}: MemoryGameProps) {
  const meta = memoryModeMeta(mode);
  const [phase, setPhase] = useState<GamePhase>("idle");
  const [level, setLevel] = useState(1);
  const [challenge, setChallenge] = useState<MemoryChallenge>(() => createChallenge(mode, 1));
  const [enteredDigits, setEnteredDigits] = useState<number[]>([]);
  const [enteredSymbols, setEnteredSymbols] = useState<MemorySymbolId[]>([]);
  const [selectedCells, setSelectedCells] = useState<number[]>([]);
  const [onboardingVisible, setOnboardingVisible] = useState(showOnboarding);
  const [rewardFlash, setRewardFlash] = useState(false);
  const timerRef = useRef<number | null>(null);
  const rewardSentRef = useRef(false);

  useEffect(() => {
    setChallenge(createChallenge(mode, 1));
    setLevel(1);
    setPhase("idle");
    setEnteredDigits([]);
    setEnteredSymbols([]);
    setSelectedCells([]);
    setOnboardingVisible(showOnboarding);
    setRewardFlash(false);
    rewardSentRef.current = false;
    return () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    };
  }, [mode, showOnboarding]);

  const clearGameTimer = () => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const beginRound = (nextLevel: number) => {
    clearGameTimer();
    initMemorySound();
    playTap();
    onStartMode?.(mode);
    setLevel(nextLevel);
    setChallenge(createChallenge(mode, nextLevel));
    setEnteredDigits([]);
    setEnteredSymbols([]);
    setSelectedCells([]);
    setPhase("showing");
    timerRef.current = window.setTimeout(() => {
      setPhase("waiting");
      timerRef.current = window.setTimeout(() => setPhase("input"), MEMORY_PRE_INPUT_PAUSE_MS);
    }, MEMORY_SHOW_MS);
  };

  const success = () => {
    clearGameTimer();
    const completedLevel = level;
    if (completedLevel >= bestLevel) onBestLevelUpdate?.(mode, completedLevel);
    const showReward = completedLevel === MEMORY_REWARD_LEVEL && !rewardAwardedToday && !rewardSentRef.current;
    if (completedLevel === MEMORY_REWARD_LEVEL) {
      playReward();
      if (showReward) {
        rewardSentRef.current = true;
        setRewardFlash(true);
        onReward?.(mode);
        onLevelFiveComplete?.(mode);
      }
    } else {
      playCorrect();
      playLevelUp();
    }
    setPhase("success");
    timerRef.current = window.setTimeout(() => {
      setRewardFlash(false);
      beginRound(completedLevel + 1);
    }, 1800);
  };

  const fail = () => {
    clearGameTimer();
    playFail();
    setPhase("failed");
  };

  const handleDigit = (digit: number) => {
    if (phase !== "input" || challenge.mode !== "reverse") return;
    initMemorySound();
    playTap();
    const expected = [...challenge.digits].reverse();
    const index = enteredDigits.length;
    if (digit !== expected[index]) {
      fail();
      return;
    }
    const next = [...enteredDigits, digit];
    setEnteredDigits(next);
    if (next.length === expected.length) success();
  };

  const handleCell = (cell: number) => {
    if (phase !== "input" || challenge.mode !== "matrix") return;
    initMemorySound();
    playTap();
    if (!challenge.cells.includes(cell)) {
      fail();
      return;
    }
    if (selectedCells.includes(cell)) return;
    const next = [...selectedCells, cell];
    setSelectedCells(next);
    if (next.length === challenge.cells.length) success();
  };

  const handleSymbol = (symbol: string) => {
    if (phase !== "input" || challenge.mode !== "symbols") return;
    initMemorySound();
    playTap();
    const index = enteredSymbols.length;
    if (symbol !== challenge.symbols[index]) {
      fail();
      return;
    }
    const next = [...enteredSymbols, symbol];
    setEnteredSymbols(next);
    if (next.length === challenge.symbols.length) success();
  };

  if (!purchased) {
    return (
      <MemoryPreview
        mode={mode}
        keysBalance={keysBalance}
        isPurchasing={isPurchasing}
        onPurchase={onPurchase}
        onBack={onBack}
      />
    );
  }

  const finishOnboarding = () => {
    setOnboardingVisible(false);
    onOnboardingComplete?.(mode);
  };

  return (
    <div className="relative isolate min-h-[100dvh] overflow-y-auto px-4 pb-8 pt-6" data-testid={`memory-game-${mode}`}>
      <GameInstrumentBackdrop accent={MEMORY_ACCENT} phase={phase} />
      <div className="relative z-10">
      <div className="mb-7 flex items-center justify-between">
        <button type="button" onClick={onBack} className="p-1 text-tertiary" aria-label="Назад" data-testid="button-memory-back">
          <ChevronLeft size={28} />
        </button>
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

      <LevelRail level={level} bestLevel={Math.max(1, bestLevel)} phase={phase} />
      <div className="my-5"><StepDots level={level} phase={phase} /></div>

      <AnimatePresence mode="wait">
        {phase === "idle" && (
          <motion.div key="idle" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="game-card flex min-h-[330px] flex-col items-center justify-center rounded-[25px] border border-orange-400/40 px-7 text-center" data-testid="memory-idle-state">
            <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full border" style={{ borderColor: MEMORY_ACCENT_BORDER, background: MEMORY_ACCENT_SOFT }}>
              <Trophy size={24} style={{ color: MEMORY_ACCENT }} />
            </div>
            <p className="title-m text-primary">Готов к уровню {level}?</p>
            <p className="body-s mt-2 max-w-[270px] text-secondary">На экране будет ровно две секунды информации. Затем повтори её без спешки.</p>
            <motion.button type="button" onClick={() => beginRound(level)} whileTap={{ scale: .96 }} whileHover={{ y: -2 }} className="mt-7 min-h-12 rounded-[15px] px-7 text-sm font-semibold text-[#201308]" style={{ background: MEMORY_ACCENT }} data-testid="button-memory-start">
              Начать уровень
            </motion.button>
          </motion.div>
        )}
        {phase === "showing" && <ShowingState challenge={challenge} level={level} />}
        {phase === "waiting" && <MemoryPauseState />}
        {phase === "input" && challenge.mode === "reverse" && <ReverseInput digits={challenge.digits} entered={enteredDigits} onDigit={handleDigit} />}
        {phase === "input" && challenge.mode === "matrix" && <MatrixInput challenge={challenge} selected={selectedCells} onCell={handleCell} />}
        {phase === "input" && challenge.mode === "symbols" && <SymbolsInput challenge={challenge} entered={enteredSymbols} onSymbol={handleSymbol} />}
        {phase === "success" && (
          <SuccessGlowState
            challenge={challenge}
            enteredDigits={enteredDigits}
            enteredSymbols={enteredSymbols}
            selectedCells={selectedCells}
            rewardFlash={rewardFlash}
          />
        )}
        {phase === "failed" && <FailedGlowState challenge={challenge} />}
      </AnimatePresence>
      {phase === "failed" && <RetryBonusCard onRetry={() => beginRound(1)} />}

      {onboardingVisible && <MemoryOnboarding mode={mode} onComplete={finishOnboarding} />}
      </div>
    </div>
  );
}