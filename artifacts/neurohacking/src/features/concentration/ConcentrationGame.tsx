import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, Crosshair, RotateCcw, Target, Trophy } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  CONCENTRATION_ACCENT,
  CONCENTRATION_ACCENT_BORDER,
  CONCENTRATION_ACCENT_SOFT,
  CONCENTRATION_REWARD_LEVEL,
  concentrationModeMeta,
  levelHint,
  randomUniqueIndexes,
  searchTimeForLevel,
  signalCountForLevel,
  signalThresholdForLevel,
  trackingObjectsForLevel,
  type ConcentrationMode,
} from "./config";
import { ConcentrationModeLogo } from "./ConcentrationModeLogo";
import { ConcentrationOnboarding } from "./ConcentrationOnboarding";
import { ConcentrationPreview } from "./ConcentrationPreview";

type GamePhase = "idle" | "signals" | "tracking-show" | "tracking-move" | "tracking-input" | "search" | "success" | "failed";
type SignalName = "orange" | "red" | "green" | "blue" | "yellow";

interface Signal {
  name: SignalName;
  color: string;
  isTarget: boolean;
}

interface TrackingObject {
  id: number;
  left: number;
  top: number;
  driftX: number;
  driftY: number;
}

interface ConcentrationStats {
  bestReactionMs?: number;
  averageReactionMs?: number;
  stabilityPercent?: number;
}

export interface ConcentrationGameProps {
  mode: ConcentrationMode;
  purchased?: boolean;
  bestLevel?: number;
  keysBalance?: number;
  rewardAwardedToday?: boolean;
  showOnboarding?: boolean;
  isPurchasing?: boolean;
  onPurchase?: (mode: ConcentrationMode) => void;
  onStartMode?: (mode: ConcentrationMode) => void;
  onBack?: () => void;
  onBestLevelUpdate?: (mode: ConcentrationMode, bestLevel: number, stats?: ConcentrationStats) => void;
  onReward?: (mode: ConcentrationMode) => void;
  onLevelFiveComplete?: (mode: ConcentrationMode) => void;
  onOnboardingComplete?: (mode: ConcentrationMode) => void;
}

const SIGNALS: Record<SignalName, { color: string; label: string }> = {
  orange: { color: "#F97316", label: "оранжевый" },
  red: { color: "#EF4444", label: "красный" },
  green: { color: "#22C55E", label: "зелёный" },
  blue: { color: "#3B82F6", label: "синий" },
  yellow: { color: "#EAB308", label: "жёлтый" },
};

function createSignal(level: number, index: number): Signal {
  const isTarget = index % Math.max(2, 4 - Math.floor(level / 3)) === 0 || Math.random() < .3;
  if (isTarget) return { name: "orange", color: SIGNALS.orange.color, isTarget: true };
  const decoys: SignalName[] = level < 3 ? ["red"] : level < 4 ? ["red", "green"] : ["red", "green", "blue", "yellow"];
  const name = decoys[Math.floor(Math.random() * decoys.length)] ?? "red";
  return { name, color: SIGNALS[name].color, isTarget: false };
}

function createTrackingObjects(level: number): { objects: TrackingObject[]; targets: number[] } {
  const { total, targets } = trackingObjectsForLevel(level);
  const objects = Array.from({ length: total }, (_, id) => ({
    id,
    left: 8 + Math.random() * 84,
    top: 9 + Math.random() * 80,
    driftX: (Math.random() * 2 - 1) * (7 + level * 1.5),
    driftY: (Math.random() * 2 - 1) * (7 + level * 1.2),
  }));
  return { objects, targets: randomUniqueIndexes(total, targets) };
}

function createSearchShapes(level: number): { targetIndex: number; shapes: string[] } {
  const targetIndex = Math.floor(Math.random() * 100);
  const distractor = level === 1 ? "○" : level === 2 ? "□" : level === 3 ? "◇" : level === 4 ? "◉" : "⬡";
  const target = level === 1 ? "△" : level === 2 ? "◇" : level === 3 ? "◈" : level === 4 ? "◌" : "⬢";
  return {
    targetIndex,
    shapes: Array.from({ length: 100 }, (_, index) => index === targetIndex ? target : distractor),
  };
}

function LevelRail({ level, bestLevel, phase }: { level: number; bestLevel: number; phase: GamePhase }) {
  return (
    <div className="flex items-end justify-between gap-3" data-testid="concentration-level-status">
      <div>
        <p className="caption text-tertiary">ТЕКУЩИЙ УРОВЕНЬ</p>
        <p className="num mt-1 min-w-[2ch] text-[38px] leading-none tabular-nums" style={{ color: CONCENTRATION_ACCENT }}>{level}</p>
      </div>
      <div className="text-right">
        <p className="caption text-tertiary">ЛУЧШИЙ</p>
        <p className="num mt-1 min-w-[2ch] text-center text-lg tabular-nums text-primary">{bestLevel}</p>
      </div>
      <span className="sr-only" aria-live="polite">
        {phase === "signals" ? "Нажми только оранжевый" : phase === "tracking-show" ? "Запомни цели" : phase === "tracking-input" ? "Выбери цели" : ""}
      </span>
    </div>
  );
}

function StepDots({ level, phase }: { level: number; phase: GamePhase }) {
  const failed = phase === "failed";
  return (
    <div className="flex gap-1.5" aria-label={`Прогресс первых пяти уровней: ${Math.min(level, 5)} из 5`}>
      {[1, 2, 3, 4, 5].map((step) => (
        <span
          key={step}
          className="h-1.5 flex-1 rounded-full"
          style={{
            background: failed ? "rgba(244,63,94,.9)" : step <= Math.min(level, 5) ? CONCENTRATION_ACCENT : "rgba(147,197,253,.14)",
            boxShadow: failed ? "0 0 10px rgba(244,63,94,.72)" : step <= Math.min(level, 5) ? "0 0 10px rgba(249,115,22,.72)" : "none",
          }}
        />
      ))}
    </div>
  );
}

function StateShell({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <motion.div initial={{ opacity: 0, scale: .98 }} animate={{ opacity: 1, scale: 1 }} className={`game-card flex min-h-[330px] flex-col items-center justify-center rounded-[25px] border border-orange-400/40 px-5 text-center ${className}`}>{children}</motion.div>;
}

export function ConcentrationGame({
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
}: ConcentrationGameProps) {
  const meta = concentrationModeMeta(mode);
  const [phase, setPhase] = useState<GamePhase>("idle");
  const [level, setLevel] = useState(1);
  const [signal, setSignal] = useState<Signal>(() => createSignal(1, 0));
  const [signalIndex, setSignalIndex] = useState(0);
  const [reactionStart, setReactionStart] = useState<number | null>(null);
  const [reactionTimes, setReactionTimes] = useState<number[]>([]);
  const [lastReaction, setLastReaction] = useState<number | null>(null);
  const [trackingObjects, setTrackingObjects] = useState<TrackingObject[]>([]);
  const [trackingTargets, setTrackingTargets] = useState<number[]>([]);
  const [selectedTracking, setSelectedTracking] = useState<number[]>([]);
  const [searchShapes, setSearchShapes] = useState<string[]>([]);
  const [searchTarget, setSearchTarget] = useState<number | null>(null);
  const [searchRemaining, setSearchRemaining] = useState(0);
  const [failureReason, setFailureReason] = useState("");
  const [rewardFlash, setRewardFlash] = useState(false);
  const [onboardingVisible, setOnboardingVisible] = useState(showOnboarding);
  const timerRef = useRef<number | null>(null);
  const intervalRef = useRef<number | null>(null);
  const searchDeadlineRef = useRef(0);
  const rewardSentRef = useRef(false);

  useEffect(() => {
    setLevel(1);
    setPhase("idle");
    setReactionTimes([]);
    setLastReaction(null);
    setSelectedTracking([]);
    setFailureReason("");
    setRewardFlash(false);
    setOnboardingVisible(showOnboarding);
    rewardSentRef.current = false;
    return () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
      if (intervalRef.current !== null) window.clearInterval(intervalRef.current);
    };
  }, [mode, showOnboarding]);

  const clearTimers = () => {
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    if (intervalRef.current !== null) window.clearInterval(intervalRef.current);
    timerRef.current = null;
    intervalRef.current = null;
  };

  const failGame = (reason: string) => {
    clearTimers();
    setFailureReason(reason);
    setPhase("failed");
  };

  const beginRound = (nextLevel: number) => {
    clearTimers();
    onStartMode?.(mode);
    setLevel(nextLevel);
    setReactionTimes([]);
    setLastReaction(null);
    setSelectedTracking([]);
    setFailureReason("");
    if (mode === "signals") {
      setPhase("signals");
      const nextSignal = createSignal(nextLevel, 0);
      setSignal(nextSignal);
      setSignalIndex(0);
      if (nextSignal.isTarget) {
        const started = performance.now();
        setReactionStart(started);
        timerRef.current = window.setTimeout(() => failGame("Оранжевый сигнал пропущен"), signalThresholdForLevel(nextLevel));
      } else {
        setReactionStart(null);
        timerRef.current = window.setTimeout(() => showSignal(nextLevel, 1), 600);
      }
    } else if (mode === "tracking") {
      const next = createTrackingObjects(nextLevel);
      setTrackingObjects(next.objects);
      setTrackingTargets(next.targets);
      setPhase("tracking-show");
      timerRef.current = window.setTimeout(() => {
        setPhase("tracking-move");
        timerRef.current = window.setTimeout(() => setPhase("tracking-input"), trackingObjectsForLevel(nextLevel).moveMs);
      }, 1050);
    } else {
      const next = createSearchShapes(nextLevel);
      setSearchShapes(next.shapes);
      setSearchTarget(next.targetIndex);
      setSearchRemaining(searchTimeForLevel(nextLevel));
      setPhase("search");
      searchDeadlineRef.current = performance.now() + searchTimeForLevel(nextLevel);
      intervalRef.current = window.setInterval(() => {
        const remaining = Math.max(0, searchDeadlineRef.current - performance.now());
        setSearchRemaining(remaining);
        if (remaining <= 0) failGame("Время поиска закончилось");
      }, 50);
    }
  };

  const showSignal = (roundLevel: number, nextIndex: number, completedTimes = reactionTimes) => {
    clearTimers();
    if (nextIndex >= signalCountForLevel(roundLevel)) {
      completeRound(roundLevel, {
        bestReactionMs: Math.min(...completedTimes),
        averageReactionMs: Math.round(completedTimes.reduce((sum, value) => sum + value, 0) / Math.max(1, completedTimes.length)),
        stabilityPercent: 100,
      });
      return;
    }
    const nextSignal = createSignal(roundLevel, nextIndex);
    setSignal(nextSignal);
    setSignalIndex(nextIndex);
    if (nextSignal.isTarget) {
      const started = performance.now();
      setReactionStart(started);
      timerRef.current = window.setTimeout(() => failGame("Оранжевый сигнал пропущен"), signalThresholdForLevel(roundLevel));
    } else {
      setReactionStart(null);
      timerRef.current = window.setTimeout(() => showSignal(roundLevel, nextIndex + 1), 520 + Math.min(420, roundLevel * 42));
    }
  };

  const completeRound = (completedLevel: number, stats: ConcentrationStats = {}) => {
    clearTimers();
    if (completedLevel >= bestLevel) onBestLevelUpdate?.(mode, completedLevel, stats);
    const showReward = completedLevel === CONCENTRATION_REWARD_LEVEL && !rewardAwardedToday && !rewardSentRef.current;
    if (completedLevel === CONCENTRATION_REWARD_LEVEL && showReward) {
      rewardSentRef.current = true;
      setRewardFlash(true);
      onReward?.(mode);
      onLevelFiveComplete?.(mode);
    }
    setPhase("success");
    timerRef.current = window.setTimeout(() => {
      setRewardFlash(false);
      beginRound(completedLevel + 1);
    }, 1600);
  };

  const handleSignalClick = () => {
    if (phase !== "signals") return;
    if (!signal.isTarget || reactionStart === null) {
      failGame(`Нельзя нажимать на ${SIGNALS[signal.name].label} сигнал`);
      return;
    }
    const reaction = Math.round(performance.now() - reactionStart);
    const threshold = signalThresholdForLevel(level);
    const currentBest = reactionTimes.length > 0 ? Math.min(...reactionTimes) : reaction;
    if (reaction > threshold) {
      failGame(`Реакция медленнее порога: ${reaction} мс`);
      return;
    }
    if (reactionTimes.length > 0 && reaction > currentBest * 1.15) {
      failGame(`Потеря стабильности: ${reaction} мс вместо ${currentBest} мс`);
      return;
    }
    const nextTimes = [...reactionTimes, reaction];
    setReactionTimes(nextTimes);
    setLastReaction(reaction);
    showSignal(level, signalIndex + 1, nextTimes);
  };

  const handleTrackingObject = (id: number) => {
    if (phase !== "tracking-input") return;
    if (!trackingTargets.includes(id)) {
      failGame("Выбран отвлекающий объект");
      return;
    }
    if (selectedTracking.includes(id)) return;
    const next = [...selectedTracking, id];
    setSelectedTracking(next);
    if (next.length === trackingTargets.length) completeRound(level);
  };

  const handleSearchObject = (index: number) => {
    if (phase !== "search") return;
    if (index !== searchTarget) {
      failGame("Это отвлекающий объект");
      return;
    }
    completeRound(level);
  };

  if (!purchased) {
    return <ConcentrationPreview mode={mode} keysBalance={keysBalance} isPurchasing={isPurchasing} onPurchase={onPurchase} onBack={onBack} />;
  }

  const finishOnboarding = () => {
    setOnboardingVisible(false);
    onOnboardingComplete?.(mode);
  };

  return (
    <div className="relative isolate min-h-[100dvh] overflow-y-auto px-4 pb-8 pt-6" data-testid={`concentration-game-${mode}`}>
      <div className="relative z-10">
      <div className="mb-7 flex items-center justify-between">
        <button type="button" onClick={onBack} className="p-1 text-tertiary" aria-label="Назад" data-testid="button-concentration-back">
          <ChevronLeft size={28} />
        </button>
        <div className="flex flex-col items-center gap-1">
          <ConcentrationModeLogo mode={mode} large />
          <span className="font-medium uppercase leading-none tracking-[0.12em]" style={{ color: CONCENTRATION_ACCENT, fontSize: 12 }}>{meta.shortTitle}</span>
        </div>
        <span className="w-8" />
      </div>

      <LevelRail level={level} bestLevel={Math.max(1, bestLevel)} phase={phase} />
      <div className="my-5"><StepDots level={level} phase={phase} /></div>

      <AnimatePresence mode="wait">
        {phase === "idle" && (
          <StateShell key="idle">
            <motion.div
              animate={{ y: [0, -4, 0], boxShadow: ["0 0 0 rgba(249,115,22,0)", "0 0 22px rgba(249,115,22,.25)", "0 0 0 rgba(249,115,22,0)"] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
              className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border"
              style={{ borderColor: CONCENTRATION_ACCENT_BORDER, background: CONCENTRATION_ACCENT_SOFT }}
            >
              <Trophy size={24} style={{ color: CONCENTRATION_ACCENT }} />
            </motion.div>
            <p className="title-m text-primary">Готов к уровню {level}?</p>
            <p className="body-s mt-2 max-w-[280px] text-secondary">{levelHint(mode, level)}. Удерживай внимание до конца серии.</p>
            <button type="button" onClick={() => beginRound(level)} className="mt-7 min-h-12 rounded-[15px] px-7 text-sm font-semibold text-[#201308]" style={{ background: CONCENTRATION_ACCENT }} data-testid="button-concentration-start">
              Начать уровень
            </button>
          </StateShell>
        )}

        {phase === "signals" && (
          <StateShell key="signals" className="cursor-pointer">
            <button type="button" onClick={handleSignalClick} className="flex min-h-[330px] w-full flex-col items-center justify-center outline-none">
              <p className="caption text-tertiary">СИГНАЛ {Math.min(signalIndex + 1, signalCountForLevel(level))} / {signalCountForLevel(level)}</p>
              <span className="relative mt-8 flex h-32 w-32 items-center justify-center">
                <motion.span
                  animate={{ scale: signal.isTarget ? [1, 1.06, 1] : [1, .98, 1], opacity: signal.isTarget ? [0.78, 1, .78] : 1 }}
                  transition={{ duration: signal.isTarget ? .7 : 1.1, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute inset-0 rounded-full border-[3px]"
                  style={{ background: `${signal.color}28`, borderColor: `${signal.color}dd`, boxShadow: `0 0 44px ${signal.color}66, inset 0 0 28px ${signal.color}22` }}
                />
                <motion.span
                  animate={{ rotate: signal.isTarget ? [0, 360] : 0 }}
                  transition={{ duration: 3.2, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-[-9px] rounded-full border border-dashed"
                  style={{ borderColor: `${signal.color}80` }}
                />
                <span className="relative h-2 w-2 rounded-full" style={{ background: signal.color, boxShadow: `0 0 12px ${signal.color}` }} />
              </span>
              <p className="title-m mt-7 text-primary">{signal.isTarget ? "НАЖМИ" : "НЕ НАЖИМАЙ"}</p>
              <p className="body-s mt-2 text-secondary">{lastReaction ? `${lastReaction} мс` : `порог ≤ ${signalThresholdForLevel(level)} мс`}</p>
            </button>
          </StateShell>
        )}

        {(phase === "tracking-show" || phase === "tracking-move" || phase === "tracking-input") && (
          <StateShell key="tracking" className="!p-3">
            <div className="mb-3 flex w-full items-center justify-between px-2">
              <span className="caption text-tertiary">{phase === "tracking-show" ? "ЗАПОМНИ ЦЕЛИ" : phase === "tracking-move" ? "СЛЕДИ" : "ВЫБЕРИ ЦЕЛИ"}</span>
              <span className="caption text-secondary">{selectedTracking.length}/{trackingTargets.length}</span>
            </div>
            <div className="game-instrument relative h-[300px] w-full overflow-hidden rounded-[20px]">
              {trackingObjects.map((object) => {
                const isTarget = trackingTargets.includes(object.id);
                const isSelected = selectedTracking.includes(object.id);
                return (
                  <motion.button
                    type="button"
                    key={object.id}
                    onClick={() => handleTrackingObject(object.id)}
                    animate={phase === "tracking-show" ? { x: 0, y: 0, scale: isTarget ? [1, 1.18, 1] : 1, opacity: isTarget ? [1, .72, 1] : .68 } : { x: [0, object.driftX, -object.driftX, 0], y: [0, object.driftY, -object.driftY, 0], scale: isSelected ? 1.2 : 1 }}
                    transition={phase === "tracking-show"
                      ? { duration: 1.1, repeat: isTarget ? Infinity : 0, ease: "easeInOut" }
                      : { duration: 2.8 + (object.id % 4) * .2, repeat: phase === "tracking-input" ? 0 : Infinity, ease: "easeInOut", delay: object.id * .02 }}
                    whileTap={{ scale: .78 }}
                    whileHover={{ scale: 1.25 }}
                    className="absolute h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border"
                    style={{
                      left: `${object.left}%`,
                      top: `${object.top}%`,
                      background: phase === "tracking-show" && isTarget ? "rgba(249,115,22,.88)" : isSelected ? "rgba(249,115,22,.72)" : "rgba(147,197,253,.12)",
                      borderColor: phase === "tracking-show" && isTarget ? "rgba(255,224,166,.95)" : isSelected ? CONCENTRATION_ACCENT : "rgba(147,197,253,.3)",
                      boxShadow: phase === "tracking-show" && isTarget ? "0 0 18px rgba(249,115,22,.76)" : isSelected ? "0 0 14px rgba(249,115,22,.58)" : "none",
                    }}
                    aria-label={isSelected ? "Выбранный объект" : "Объект"}
                  />
                );
              })}
            </div>
          </StateShell>
        )}

        {phase === "search" && (
          <StateShell key="search" className="!p-3">
            <div className="mb-3 flex w-full items-center justify-between px-2">
              <span className="caption text-tertiary">НАЙДИ ЦЕЛЬ</span>
              <span className="num text-sm tabular-nums" style={{ color: searchRemaining < 1000 ? "#FB7185" : CONCENTRATION_ACCENT }}>{(searchRemaining / 1000).toFixed(1)} с</span>
            </div>
            <div className="game-instrument relative grid w-full grid-cols-10 gap-1.5 rounded-[18px] p-2">
              <motion.span
                aria-hidden="true"
                initial={{ x: "-100%" }}
                animate={{ x: "1000%" }}
                transition={{ duration: 2.4, repeat: Infinity, ease: "linear" }}
                className="pointer-events-none absolute bottom-1 left-0 top-1 z-10 w-0.5 bg-orange-300 shadow-[0_0_12px_rgba(249,115,22,.85)]"
              />
              {searchShapes.map((shape, index) => (
                <motion.button
                  type="button"
                  key={index}
                  onClick={() => handleSearchObject(index)}
                  whileTap={{ scale: .82 }}
                  whileHover={{ scale: 1.08, borderColor: "rgba(249,115,22,.65)" }}
                  className="game-control flex aspect-square items-center justify-center rounded-[5px] text-[12px] transition-none"
                  style={{
                    color: "rgba(183,206,228,.72)",
                    background: "rgba(147,197,253,.055)",
                    borderColor: "rgba(147,197,253,.12)",
                  }}
                  aria-label="Объект поиска"
                >
                  {shape}
                </motion.button>
              ))}
            </div>
            <p className="body-s mt-4 text-secondary">Один объект отличается от остальных.</p>
          </StateShell>
        )}

        {phase === "success" && (
          <StateShell key="success" className="game-card--success">
            <motion.div
              initial={{ scale: .7, rotate: -18 }}
              animate={{ scale: [1, 1.08, 1], rotate: 0 }}
              transition={{ duration: .55, ease: "easeOut" }}
              className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-orange-300/45 bg-[#25404a]"
            >
              <Target size={25} style={{ color: CONCENTRATION_ACCENT }} />
            </motion.div>
            {rewardFlash && <div className="absolute top-5 rounded-full border border-orange-300/50 bg-orange-500/15 px-4 py-2 text-sm font-semibold text-orange-200">+10% потенциала дня</div>}
            <p className="title-m text-primary">Уровень пройден</p>
            <p className="body-s mt-2 text-secondary">Фокус удержан. Следующий уровень уже готовится.</p>
            {lastReaction !== null && <p className="num mt-5 text-2xl" style={{ color: CONCENTRATION_ACCENT }}>{lastReaction} мс</p>}
          </StateShell>
        )}

        {phase === "failed" && (
          <StateShell key="failed" className="game-card--failed">
            <motion.div
              animate={{ x: [-3, 3, -2, 2, 0], rotate: [-4, 4, -3, 3, 0] }}
              transition={{ duration: .42, ease: "easeOut" }}
              className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-rose-300/45 bg-[#42253a]"
            >
              <Crosshair size={24} className="text-rose-300" />
            </motion.div>
            <p className="title-m text-primary">Потеря концентрации</p>
            <p className="body-s mt-2 max-w-[280px] text-secondary">{failureReason || "Ошибка сбрасывает серию на первый уровень."}</p>
            <button type="button" onClick={() => beginRound(1)} className="mt-8 flex min-h-12 min-w-[178px] items-center justify-center gap-2 rounded-[15px] bg-rose-500 px-6 text-sm font-semibold text-white shadow-[0_0_18px_rgba(244,63,94,.28)]" data-testid="button-concentration-retry">
              <RotateCcw size={16} /> Начать сначала
            </button>
          </StateShell>
        )}
      </AnimatePresence>

      {onboardingVisible && <ConcentrationOnboarding mode={mode} onComplete={finishOnboarding} />}
      </div>
    </div>
  );
}