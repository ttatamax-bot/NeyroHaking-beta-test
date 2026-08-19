import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, RotateCcw } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  CONCENTRATION_ACCENT,
  CONCENTRATION_REWARD_LEVEL,
  signalFalseDurationForLevel,
  SIGNALS_RESULT_MS,
  concentrationModeMeta,
  levelHint,
  randomUniqueIndexes,
  searchTimeForLevel,
  signalPrepareDurationForLevel,
  signalCountForLevel,
  signalThresholdForLevel,
  trackingObjectsForLevel,
  type ConcentrationMode,
} from "./config";
import { ConcentrationModeLogo } from "./ConcentrationModeLogo";
import { ConcentrationOnboarding } from "./ConcentrationOnboarding";
import { ConcentrationPreview } from "./ConcentrationPreview";
import { initConcentrationSound, playConcentrationCorrect, playConcentrationFail, playConcentrationPrepare, playConcentrationResult, playConcentrationSignal } from "./sounds";

type GamePhase = "idle" | "preparing" | "signal-result" | "signals" | "tracking-show" | "tracking-move" | "tracking-input" | "search" | "success" | "failed";
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
  pathLeft: number[];
  pathTop: number[];
  finalLeft: number;
  finalTop: number;
}

function TrackingBall({
  object,
  phase,
  isTarget,
  isSelected,
  moveMs,
  onSelect,
}: {
  object: TrackingObject;
  phase: "tracking-show" | "tracking-move" | "tracking-input";
  isTarget: boolean;
  isSelected: boolean;
  moveMs: number;
  onSelect: () => void;
}) {
  const ballRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const ball = ballRef.current;
    if (!ball) return;

    let animationFrame = 0;
    const setPosition = (left: number, top: number) => {
      ball.style.left = `${left}%`;
      ball.style.top = `${top}%`;
    };

    if (phase === "tracking-show") {
      setPosition(object.left, object.top);
    } else if (phase === "tracking-input") {
      setPosition(object.finalLeft, object.finalTop);
    } else {
      const startedAt = performance.now();
      const segments = object.pathLeft.length - 1;
      const tick = (now: number) => {
        const progress = Math.min(1, (now - startedAt) / moveMs);
        const scaled = progress * segments;
        const segment = Math.min(segments - 1, Math.floor(scaled));
        const localProgress = scaled - segment;
        const eased = localProgress;
        const left = object.pathLeft[segment] + (object.pathLeft[segment + 1] - object.pathLeft[segment]) * eased;
        const top = object.pathTop[segment] + (object.pathTop[segment + 1] - object.pathTop[segment]) * eased;
        setPosition(left, top);
        if (progress < 1) animationFrame = requestAnimationFrame(tick);
      };
      animationFrame = requestAnimationFrame(tick);
    }

    return () => cancelAnimationFrame(animationFrame);
  }, [moveMs, object, phase]);

  return (
    <button
      ref={ballRef}
      type="button"
      onClick={onSelect}
      className="absolute h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border transition-transform active:scale-[.78]"
      style={{
        left: `${object.left}%`,
        top: `${object.top}%`,
        background: phase === "tracking-show" && isTarget ? "#F97316" : isSelected ? "#F97316" : "#52718A",
        borderColor: phase === "tracking-show" && isTarget ? "#FFD29A" : isSelected ? CONCENTRATION_ACCENT : "#9AB2C4",
        boxShadow: phase === "tracking-show" && isTarget ? "0 0 12px rgba(249,115,22,.55)" : isSelected ? "0 0 10px rgba(249,115,22,.45)" : "none",
      }}
      aria-label={isSelected ? "Выбранный объект" : "Объект"}
    />
  );
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
  const signalLimit = signalCountForLevel(level);
  if (level === 1) return { name: "orange", color: SIGNALS.orange.color, isTarget: true };
  const targetChance = Math.max(.16, .42 - Math.min(9, Math.max(0, level - 1)) * .025);
  const isTarget = index === signalLimit - 1 || (level <= 3 && index % 2 === 1) || Math.random() < targetChance;
  if (isTarget) return { name: "orange", color: SIGNALS.orange.color, isTarget: true };
  const decoys: SignalName[] =
    level <= 5
      ? ["red"]
      : level <= 9
        ? ["red", "green", "blue"]
        : ["red", "green", "blue", "yellow"];
  const name = decoys[Math.floor(Math.random() * decoys.length)] ?? "red";
  return { name, color: SIGNALS[name].color, isTarget: false };
}

function createTrackingObjects(level: number): { objects: TrackingObject[]; targets: number[] } {
  const { total, targets } = trackingObjectsForLevel(level);
  const minDistance = 22;
  const bounds = { minX: 12, maxX: 288, minY: 12, maxY: 288 };
  const positions: Array<{ x: number; y: number }> = [];
  const paths = Array.from({ length: total }, () => ({ left: [] as number[], top: [] as number[] }));
  const velocities = Array.from({ length: total }, () => {
    const angle = Math.random() * Math.PI * 2;
    return { angle, speed: 7 + Math.random() * 5 };
  });

  for (let id = 0; id < total; id += 1) {
    let candidate = { x: 24 + Math.random() * 252, y: 24 + Math.random() * 252 };
    for (let attempt = 0; attempt < 30000; attempt += 1) {
      candidate = { x: 24 + Math.random() * 252, y: 24 + Math.random() * 252 };
      if (positions.every((position) => Math.hypot(candidate.x - position.x, candidate.y - position.y) >= minDistance)) break;
    }
    positions.push(candidate);
    paths[id].left.push(candidate.x / 3);
    paths[id].top.push(candidate.y / 3);
  }

  for (let step = 0; step < 31; step += 1) {
    positions.forEach((position, id) => {
      const velocity = velocities[id];
      velocity.angle += (Math.random() - 0.5) * 0.42;
      const nextX = position.x + Math.cos(velocity.angle) * velocity.speed;
      const nextY = position.y + Math.sin(velocity.angle) * velocity.speed;
      if (nextX < bounds.minX || nextX > bounds.maxX) velocity.angle = Math.PI - velocity.angle;
      if (nextY < bounds.minY || nextY > bounds.maxY) velocity.angle = -velocity.angle;
      position.x = Math.max(bounds.minX, Math.min(bounds.maxX, position.x + Math.cos(velocity.angle) * velocity.speed));
      position.y = Math.max(bounds.minY, Math.min(bounds.maxY, position.y + Math.sin(velocity.angle) * velocity.speed));
    });

    for (let pass = 0; pass < 10; pass += 1) {
      for (let first = 0; first < positions.length; first += 1) {
        for (let second = first + 1; second < positions.length; second += 1) {
          const a = positions[first];
          const b = positions[second];
          let dx = b.x - a.x;
          let dy = b.y - a.y;
          const distance = Math.hypot(dx, dy);
          if (distance >= minDistance) continue;
          if (distance < 0.01) {
            dx = 1;
            dy = 0;
          }
          const push = (minDistance - Math.max(distance, 0.01)) / 2;
          const unitX = dx / Math.max(distance, 0.01);
          const unitY = dy / Math.max(distance, 0.01);
          a.x -= unitX * push;
          a.y -= unitY * push;
          b.x += unitX * push;
          b.y += unitY * push;
        }
      }
      positions.forEach((position) => {
        position.x = Math.max(bounds.minX, Math.min(bounds.maxX, position.x));
        position.y = Math.max(bounds.minY, Math.min(bounds.maxY, position.y));
      });
    }

    positions.forEach((position, id) => {
      paths[id].left.push(position.x / 3);
      paths[id].top.push(position.y / 3);
    });
  }

  const objects = positions.map((position, id) => ({
    id,
    left: paths[id].left[0],
    top: paths[id].top[0],
    pathLeft: paths[id].left,
    pathTop: paths[id].top,
    finalLeft: paths[id].left[paths[id].left.length - 1],
    finalTop: paths[id].top[paths[id].top.length - 1],
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
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.p
            key={level}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: .24, ease: "easeOut" }}
            className="num mt-1 min-w-[2ch] text-[38px] leading-none tabular-nums"
            style={{ color: CONCENTRATION_ACCENT }}
          >
            {level}
          </motion.p>
        </AnimatePresence>
      </div>
      <div className="text-right">
        <p className="caption text-tertiary">ЛУЧШИЙ</p>
        <p className="num mt-1 min-w-[2ch] text-center text-lg tabular-nums text-primary">{bestLevel}</p>
      </div>
      <span className="sr-only" aria-live="polite">
        {phase === "preparing" ? "Приготовься" : phase === "signal-result" ? "Результат прошлого попадания" : phase === "signals" ? "Нажми только оранжевый" : phase === "tracking-show" ? "Запомни цели" : phase === "tracking-input" ? "Выбери цели" : ""}
      </span>
    </div>
  );
}

function StepDots({ level, phase }: { level: number; phase: GamePhase }) {
  const failed = phase === "failed";
  return (
    <div className="flex gap-1.5" aria-label={`Прогресс десяти уровней: ${Math.min(level, 10)} из 10`}>
      {Array.from({ length: 10 }, (_, index) => index + 1).map((step) => (
        <motion.span
          key={step}
          initial={{ scaleX: .45, opacity: .35 }}
          animate={{ scaleX: 1, opacity: step <= Math.min(level, 10) || failed ? 1 : .72 }}
          transition={{ duration: .38, delay: step * .055, ease: "easeOut" }}
          className={`level-step h-1.5 flex-1 rounded-full ${failed ? "level-step-failed" : step <= Math.min(level, 10) ? "level-step-active" : ""}`}
          style={{
            background: failed ? "rgba(244,63,94,.9)" : step <= Math.min(level, 10) ? CONCENTRATION_ACCENT : "rgba(147,197,253,.14)",
            boxShadow: failed ? "0 0 10px rgba(244,63,94,.72)" : step <= Math.min(level, 10) ? "0 0 10px rgba(249,115,22,.72)" : "none",
          }}
        />
      ))}
    </div>
  );
}

function StateShell({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`game-card flex min-h-[330px] flex-col items-center justify-center rounded-[25px] border border-orange-400/40 px-5 text-center ${className}`}>{children}</motion.div>;
}

function ConcentrationActionCard({
  onClick,
  accent,
  icon,
  eyebrow,
  title,
  subtitle,
  testId,
}: {
  onClick: () => void;
  accent: "orange" | "red";
  icon: React.ReactNode;
  eyebrow?: string;
  title: string;
  subtitle?: string;
  testId: string;
}) {
  const isOrange = accent === "orange";
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileTap={{ scale: 0.98 }}
       className={`relative mt-4 flex min-h-[78px] w-full items-center gap-3 overflow-hidden rounded-[24px] border px-4 py-3 text-left shadow-[0_0_0_5px_rgba(249,115,22,.06),0_12px_28px_rgba(0,0,0,.24),inset_0_1px_0_rgba(255,255,255,.12)] ${isOrange ? "border-orange-300/50 bg-[linear-gradient(135deg,rgba(249,115,22,.98),rgba(154,63,11,.98)_58%,rgba(13,31,57,.98))]" : "border-red-400/55 bg-[linear-gradient(135deg,rgba(127,29,29,.98),rgba(69,24,31,.98)_58%,rgba(13,31,57,.98))]"}`}
      data-testid={testId}
    >
       <span className={`relative flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px] border text-white ${isOrange ? "border-orange-100/50 bg-orange-300/80 shadow-[0_0_22px_rgba(249,115,22,.42),inset_0_1px_0_rgba(255,255,255,.45)]" : "border-red-200/55 bg-[linear-gradient(145deg,rgba(248,113,113,.95),rgba(185,28,28,.92))] shadow-[0_0_22px_rgba(239,68,68,.48),inset_0_1px_0_rgba(255,255,255,.45)]"}`}>
        {icon}
      </span>
      <span className="min-w-0 flex-1">
         {eyebrow && <span className={`block text-[10px] font-semibold uppercase tracking-[0.16em] ${isOrange ? "text-orange-100/75" : "text-red-100/75"}`}>{eyebrow}</span>}
        <span className="mt-1 block text-[16px] font-semibold leading-tight text-white">{title}</span>
         {subtitle && <span className={`mt-0.5 block text-xs ${isOrange ? "text-orange-100/70" : "text-red-100/75"}`}>{subtitle}</span>}
      </span>
       <span className={`text-xl ${isOrange ? "text-orange-100/80" : "text-red-100/85"}`} aria-hidden="true">→</span>
    </motion.button>
  );
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
    if (mode === "signals") playConcentrationFail();
    setFailureReason(reason);
    setPhase("failed");
  };

  const beginSignalPreparation = (roundLevel: number, nextIndex: number) => {
    clearTimers();
    const duration = signalPrepareDurationForLevel(roundLevel);
    setSignalIndex(nextIndex);
    setReactionStart(null);
    setPhase("preparing");
    playConcentrationPrepare();
    timerRef.current = window.setTimeout(() => showSignal(roundLevel, nextIndex), duration);
  };

  const beginRound = (nextLevel: number) => {
    clearTimers();
    if (mode === "signals") initConcentrationSound();
    onStartMode?.(mode);
    setLevel(nextLevel);
    setReactionTimes([]);
    setLastReaction(null);
    setSelectedTracking([]);
    setFailureReason("");
    if (mode === "signals") {
      beginSignalPreparation(nextLevel, 0);
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
    playConcentrationSignal();
    setPhase("signals");
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
      timerRef.current = window.setTimeout(() => beginSignalPreparation(roundLevel, nextIndex + 1), signalFalseDurationForLevel(roundLevel));
    }
  };

  const showSignalResult = (roundLevel: number, completedTimes: number[], reaction: number) => {
    clearTimers();
    setLastReaction(reaction);
    setReactionStart(null);
    setPhase("signal-result");
    playConcentrationResult();
    timerRef.current = window.setTimeout(() => {
      completeRound(roundLevel, {
        bestReactionMs: Math.min(...completedTimes),
        averageReactionMs: Math.round(completedTimes.reduce((sum, value) => sum + value, 0) / Math.max(1, completedTimes.length)),
        stabilityPercent: 100,
      });
    }, SIGNALS_RESULT_MS);
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
    }, 2000);
  };

  const handleSignalClick = () => {
    if (phase !== "signals") return;
    if (!signal.isTarget || reactionStart === null) {
      failGame(`Нельзя нажимать на ${SIGNALS[signal.name].label} сигнал`);
      return;
    }
    const reaction = Math.round(performance.now() - reactionStart);
    const threshold = signalThresholdForLevel(level);
    if (reaction > threshold) {
      failGame(`Реакция медленнее порога: ${reaction} мс`);
      return;
    }
    const nextTimes = [...reactionTimes, reaction];
    setReactionTimes(nextTimes);
    setLastReaction(reaction);
    playConcentrationCorrect();
    showSignalResult(level, nextTimes, reaction);
  };

  const handlePreparationClick = () => {
    if (phase === "preparing") failGame("Слишком рано");
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

  const signalSurface =
    mode !== "signals"
      ? undefined
      : phase === "signals"
        ? undefined
        : phase === "failed"
            ? "#3b2031"
            : phase === "success"
              ? "#4a240d"
            : phase === "preparing"
              ? "#102b46"
              : undefined;

  const signalIndicatorScale = Math.max(.48, 1 - Math.min(8, Math.max(0, level - 1)) * .065);

  return (
    <div
      className={`relative isolate min-h-[100dvh] overflow-y-auto px-4 pb-8 pt-6 ${mode === "signals" ? "signals-screen" : ""}`}
      style={signalSurface ? { backgroundColor: signalSurface } : undefined}
      data-testid={`concentration-game-${mode}`}
    >
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
              className="mb-5 flex h-36 w-36 items-center justify-center"
              aria-hidden="true"
              animate={{ y: [0, -3, 0], rotate: [0, -2, 0] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
            >
              <svg viewBox="0 0 24 24" className="h-36 w-36" fill="none" stroke={CONCENTRATION_ACCENT} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5.67181 13.9095C10 15.9322 14 7.84169 21 11.8869L18 2.78502C13.4239 -0.299918 8.56286 6.85641 3 4.62523L8.00007 22" />
                <path d="M19 7.00073C13.5 3.00076 9 12.0007 4.5 9.00064" />
                <path d="M8 4.90476L10.8235 13M13.1765 3L16 10.619" />
              </svg>
            </motion.div>
            <p className="title-m" style={{ color: CONCENTRATION_ACCENT }}>Готов к уровню {level}?</p>
            <p className="body-s mt-2 max-w-[280px] text-secondary">
              {mode === "signals"
                ? `Жми на оранжевый. Порог ${signalThresholdForLevel(level)} мс. Удерживай концентрацию.`
                : `${levelHint(mode, level)}. Удерживай внимание до конца серии.`}
            </p>
          </StateShell>
        )}

        {phase === "preparing" && (
          <motion.button
            key="preparing"
            type="button"
            onClick={handlePreparationClick}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="game-card flex min-h-[330px] w-full flex-col items-center justify-center rounded-[25px] border border-orange-400/40 px-7 text-center outline-none"
            data-testid="concentration-preparing-state"
          >
            <motion.svg
              viewBox="0 0 256 256"
              className="mb-7 h-36 w-36"
              role="img"
              aria-label="Часы подготовки"
            >
              <path
                d="M128,40a96,96,0,1,0,96,96A96.11,96.11,0,0,0,128,40Zm0,176a80,80,0,1,1,80-80A80.09,80.09,0,0,1,128,216Z"
                fill={CONCENTRATION_ACCENT}
              />
              <g className="concentration-timer-hand">
                <path
                  d="M173.66,90.34a8,8,0,0,1,0,11.32l-40,40a8,8,0,0,1-11.32-11.32l40-40A8,8,0,0,1,173.66,90.34Z"
                  fill={CONCENTRATION_ACCENT}
                />
              </g>
              <path
                d="M96,16a8,8,0,0,1,8-8h48a8,8,0,0,1,0,16H104A8,8,0,0,1,96,16Z"
                fill={CONCENTRATION_ACCENT}
              />
            </motion.svg>
            <p className="title-m text-[24px]" style={{ color: CONCENTRATION_ACCENT }}>Приготовьтесь</p>
          </motion.button>
        )}

        {phase === "signal-result" && (
          <motion.div key="signal-result" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="game-card flex min-h-[330px] w-full items-center justify-center rounded-[25px] border">
            <motion.div
              initial={{ opacity: .5 }}
              animate={{ opacity: [1, .75, 1] }}
              transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
              className="flex h-[min(42vw,180px)] w-[min(72vw,280px)] items-center justify-center rounded-[28px] border-[3px] border-orange-200/75 bg-orange-500/20 shadow-[0_0_42px_rgba(249,115,22,.32),inset_0_0_28px_rgba(249,115,22,.18)]"
            >
              <span className="num text-[36px] text-orange-100" aria-label={`Результат ${lastReaction ?? 0} миллисекунд`}>{lastReaction ?? 0}</span>
            </motion.div>
          </motion.div>
        )}

        {phase === "signals" && (
          <motion.button
            key="signals"
            type="button"
            onClick={handleSignalClick}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="game-card flex min-h-[330px] w-full items-center justify-center rounded-[25px] border border-orange-400/40 p-0 outline-none"
            data-testid="concentration-signal-hit-area"
          >
            <motion.span
              animate={{ scale: [signalIndicatorScale, signalIndicatorScale * 1.025, signalIndicatorScale], opacity: signal.isTarget ? [0.82, 1, .82] : [.7, .9, .7] }}
              transition={{ duration: signal.isTarget ? .72 : 1.05, repeat: Infinity, ease: "easeInOut" }}
              className="block h-[190px] w-[min(76vw,296px)] rounded-[28px] border-[3px]"
              style={{ background: `${signal.color}30`, borderColor: `${signal.color}e6`, boxShadow: `0 0 52px ${signal.color}72, inset 0 0 32px ${signal.color}2e` }}
              aria-hidden="true"
            />
          </motion.button>
        )}

        {(phase === "tracking-show" || phase === "tracking-move" || phase === "tracking-input") && (
          <StateShell key="tracking" className="!p-3">
            <div className="mb-4 flex w-full flex-col items-center px-2 text-center">
              <span className={`caption ${phase === "tracking-input" ? "text-orange-200" : "text-tertiary"}`}>
                {phase === "tracking-show" ? "ЗАПОМНИ ЦЕЛИ" : phase === "tracking-move" ? "ОТСЛЕЖИВАЙ ДВИЖЕНИЕ" : "ВОССТАНОВИ ЦЕЛИ"}
              </span>
              <span className="mt-1 text-[11px] text-secondary">
                {phase === "tracking-show" ? "Запомни оранжевые шарики" : phase === "tracking-move" ? "Не нажимай" : "Нажми на оранжевые шарики"}
              </span>
              {phase === "tracking-input" && (
                <span className="num mt-1 text-xs tabular-nums text-orange-200">{selectedTracking.length}/{trackingTargets.length}</span>
              )}
            </div>
            <div className="game-instrument relative h-[300px] w-full overflow-hidden rounded-[20px]">
                {trackingObjects.map((object) => (
                  <TrackingBall
                    key={object.id}
                    object={object}
                    phase={phase}
                    moveMs={trackingObjectsForLevel(level).moveMs}
                    isTarget={trackingTargets.includes(object.id)}
                    isSelected={selectedTracking.includes(object.id)}
                    onSelect={() => handleTrackingObject(object.id)}
                  />
                ))}
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
              className="mb-6 mt-7 flex h-20 w-20 translate-y-3 items-center justify-center"
            >
              <motion.svg viewBox="0 0 24 24" className="h-20 w-20" role="img" aria-label="Уровень пройден" animate={{ scale: [1, 1.08, 1], rotate: [0, 2, 0] }} transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}>
                <path
                  d="M4.5 9.5C4.5 13.6421 7.85786 17 12 17C16.1421 17 19.5 13.6421 19.5 9.5C19.5 5.35786 16.1421 2 12 2C7.85786 2 4.5 5.35786 4.5 9.5Z"
                  fill="none"
                  stroke={CONCENTRATION_ACCENT}
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
                <motion.path
                  d="M9 10.1667C9 10.1667 9.75 10.1667 10.5 11.5C10.5 11.5 12.8824 8.16667 15 7.5"
                  fill="none"
                  stroke={CONCENTRATION_ACCENT}
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: [0, 1, 1, 0], opacity: [0, 1, 1, 0] }}
                  transition={{ duration: 2.2, repeat: Infinity, times: [0, .35, .78, 1], ease: "easeInOut" }}
                />
                <path d="M16.8825 15L17.5527 18.2099C17.9833 20.2723 18.1986 21.3035 17.7563 21.7923C17.3141 22.281 16.546 21.8606 15.0099 21.0198L12.7364 19.7753C12.3734 19.5766 12.1919 19.4773 12 19.4773C11.8081 19.4773 11.6266 19.5766 11.2636 19.7753L8.99008 21.0198C7.45397 21.8606 6.68592 22.281 6.24365 21.7923C5.80139 21.3035 6.01669 20.2723 6.44731 18.2099L7.11752 15" fill="none" stroke={CONCENTRATION_ACCENT} strokeWidth="1.5" strokeLinejoin="round" />
              </motion.svg>
            </motion.div>
            {rewardFlash && <div className="absolute top-5 rounded-full border border-orange-300/50 bg-orange-500/15 px-4 py-2 text-sm font-semibold text-orange-200">+10% потенциала дня</div>}
            <p className="title-m translate-y-3 uppercase text-primary">УРОВЕНЬ ПРОЙДЕН</p>
            <p className="num mt-5 translate-y-3 text-2xl" style={{ color: "#FFF7ED" }}>
              {mode === "signals" ? `порог ${signalThresholdForLevel(level + 1)} мс` : levelHint(mode, level + 1)}
            </p>
          </StateShell>
        )}

        {phase === "failed" && (
          <StateShell key="failed" className="game-card--failed">
            <motion.div
              animate={{ x: [-3, 3, -2, 2, 0], rotate: [-4, 4, -3, 3, 0] }}
              transition={{ duration: .42, ease: "easeOut" }}
              className="mb-5 flex h-20 w-20 items-center justify-center"
            >
              <motion.svg viewBox="0 0 24 24" className="h-20 w-20" role="img" aria-label="Поражение">
                <path d="M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z" fill="none" stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <motion.path
                  d="M8.5 9C8.22386 9 8 8.77614 8 8.5C8 8.22386 8.22386 8 8.5 8C8.77614 8 9 8.22386 9 8.5C9 8.77614 8.77614 9 8.5 9Z"
                  fill="#EF4444" stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
                  animate={{ d: ["M8.5 9C8.22386 9 8 8.77614 8 8.5C8 8.22386 8.22386 8 8.5 8C8.77614 8 9 8.22386 9 8.5C9 8.77614 8.77614 9 8.5 9Z", "M8.5 14C8.22386 14 8 13.7761 8 13.5C8 13.2239 8.22386 13 8.5 13C8.77614 13 9 13.2239 9 13.5C9 13.7761 8.77614 14 8.5 14Z"] }}
                  transition={{ duration: 2.2, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
                />
                <motion.path
                  d="M15.5 9C15.2239 9 15 8.77614 15 8.5C15 8.22386 15.2239 8 15.5 8C15.7761 8 16 8.22386 16 8.5C16 8.77614 15.7761 9 15.5 9Z"
                  fill="#EF4444" stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
                  animate={{ d: ["M15.5 9C15.2239 9 15 8.77614 15 8.5C15 8.22386 15.2239 8 15.5 8C15.7761 8 16 8.22386 16 8.5C16 8.77614 15.7761 9 15.5 9Z", "M15.5 14C15.2239 14 15 13.7761 15 13.5C15 13.2239 15.2239 13 15.5 13C15.7761 13 16 13.2239 16 13.5C16 13.7761 15.7761 14 15.5 14Z"] }}
                  transition={{ duration: 2.2, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
                />
                <motion.path
                  d="M9 15H15"
                  fill="none" stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round"
                  animate={{ d: ["M9 15H15", "M10 18H14"] }}
                  transition={{ duration: 2.2, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
                />
              </motion.svg>
            </motion.div>
            <p className="title-m uppercase text-primary">{(failureReason || "Потеря концентрации").toUpperCase()}</p>
          </StateShell>
        )}
      </AnimatePresence>

      {phase === "idle" && (
        <ConcentrationActionCard
          onClick={() => beginRound(level)}
          accent="orange"
          icon={<span className="text-[24px] leading-none">▶</span>}
          title="Начать уровень"
          testId="button-concentration-start"
        />
      )}

      {phase === "failed" && (
        <ConcentrationActionCard
          onClick={() => beginRound(1)}
          accent="red"
          icon={<RotateCcw size={21} strokeWidth={2.2} />}
          eyebrow="ВЕРНИ КОНЦЕНТРАЦИЮ"
          title="Начать сначала"
          subtitle="Новая попытка с первого уровня"
          testId="button-concentration-retry"
        />
      )}

      {onboardingVisible && <ConcentrationOnboarding mode={mode} onComplete={finishOnboarding} />}
      </div>
    </div>
  );
}