import { useMemo, useRef, useState, type TouchEvent } from "react";
import { createPortal } from "react-dom";
import { useLocation } from "wouter";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowLeft, CalendarCheck, Check, ChevronRight, Clock3, Flame, History, KeyRound, Pencil,
  Plus, X, type LucideIcon,
} from "lucide-react";
import { useAppStore, type Goal } from "@/lib/store";
import { KnowledgeBaseMark } from "./academy";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { GOAL_ICONS, GoalIcon, getGoalIcon } from "@/components/GoalIconPicker";
import { TechniqueArtwork } from "@/components/TechniqueArtwork";

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];
type StatKey = "days" | "keys" | "streak" | "history";

function Atmosphere() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <div className="absolute -left-36 top-20 h-96 w-96 rounded-full bg-blue-500/[.035] blur-3xl" />
    </div>
  );
}

function SteelDetails({ color = "#60A5FA", compact = false }: { color?: string; compact?: boolean }) {
  return (
    <>
      <span className="pointer-events-none absolute left-2 top-2 h-2 w-2 rounded-full border" style={{ borderColor: `${color}88`, background: `${color}30`, boxShadow: `0 0 8px ${color}50` }} />
      <span className="pointer-events-none absolute right-2 top-2 h-2 w-2 rounded-full border" style={{ borderColor: `${color}55`, background: `${color}18` }} />
      <span className="pointer-events-none absolute bottom-2 left-2 h-2 w-2 rounded-full border" style={{ borderColor: `${color}55`, background: `${color}18` }} />
      <span className="pointer-events-none absolute bottom-2 right-2 h-2 w-2 rounded-full border" style={{ borderColor: `${color}88`, background: `${color}30`, boxShadow: `0 0 8px ${color}40` }} />
    </>
  );
}

function RocketMark({ flame = false, size = 108 }: { flame?: boolean; size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
      {!flame && <path d="M12 9V6" strokeLinejoin="round" />}
      {!flame && <path d="M8.5 15.4736H15.5M8.5 15.4736L6.66384 16.7848C6.26237 17.1167 5.67767 17.0727 5.46234 16.5962C4.73447 14.9855 4.53071 11.8868 7.42582 10.5364M8.5 15.4736C7.88981 13.6532 7.52235 11.9545 7.42582 10.5364M15.5 15.4736L17.3378 16.7848C17.7392 17.1167 18.3239 17.0728 18.5391 16.5963C19.2665 14.9856 19.4677 11.8868 16.5666 10.5364M7.42582 10.5364C7.16746 6.17174 9.05309 3.23691 10.7871 1.91037C11.5084 1.35858 12.4919 1.36399 13.2085 1.92212C14.9207 3.25581 16.7377 6.16394 16.5666 10.5364C16.5102 11.9795 16.0859 13.6174 15.5 15.4736" strokeLinejoin="round" />}
      {flame && <path d="M13.5 18.5V21M10.5 18.5V22.5" />}
    </svg>
  );
}

function PreviousRocketFlightRemoved({ reduced }: { reduced: boolean }) {
  const flight = reduced ? undefined : {
    y: [18, 18, 14, 7, -5, -19, -30, -37, -31, -18, -4, 8, 16, 18],
    x: [0, 0, -.4, -.9, -1.2, -.6, .6, 1.1, .8, .2, -.5, -.7, -.2, 0],
    rotate: [1.2, 1.2, .8, -.2, -2.2, -4.8, -5.8, -4.2, -1.7, .8, 2.4, 2, 1.4, 1.2],
    scaleX: [1, 1, .998, .996, .994, .99, .988, .99, .995, .998, 1, 1, 1, 1],
    scaleY: [1, 1, 1.002, 1.006, 1.012, 1.02, 1.024, 1.018, 1.01, 1.004, 1.001, 1, 1, 1],
  };
  return (
    <motion.div
      className="relative z-10 h-[132px] w-[132px]"
      animate={flight}
      transition={{ duration: 7.4, repeat: Infinity, ease: "easeInOut", times: [0, .035, .1, .19, .3, .41, .5, .58, .67, .76, .84, .9, .96, 1] }}
    >
      <motion.div
        className="absolute left-1/2 top-[7px] h-[108px] w-[108px] -translate-x-1/2 text-[#e9e5d9] drop-shadow-[0_0_12px_rgba(255,237,170,.3)]"
        animate={reduced ? undefined : { rotate: [0, 0, -.15, .25, -.35, .2, -.15, .25, -.2, .12, 0], scale: [1, 1, 1.002, .998, 1.004, .998, 1.002, .999, 1.001, 1, 1] }}
        transition={{ duration: 1.85, repeat: Infinity, ease: "easeInOut" }}
      >
        <RocketMark />
        <motion.span
          className="absolute left-1/2 top-[23px] h-3 w-3 -translate-x-1/2 rounded-full bg-amber-100/80 blur-[2px]"
          animate={reduced ? undefined : { opacity: [.55, .9, .62, .82, .55], scale: [1, 1.12, .96, 1.08, 1] }}
          transition={{ duration: 1.7, repeat: Infinity, ease: "easeInOut" }}
        />
      </motion.div>
      <motion.span className="absolute left-[36px] top-[68px] h-5 w-5 rounded-full bg-orange-500/55 blur-[9px]" animate={reduced ? undefined : { y: [0, 8, 18, 5, 0], scale: [1, 1.2, .7, 1.1, 1], opacity: [.5, .9, .35, .72, .5] }} transition={{ duration: 1.15, repeat: Infinity, ease: "easeInOut" }} />
      <motion.span className="absolute left-[70px] top-[68px] h-5 w-5 rounded-full bg-orange-500/55 blur-[9px]" animate={reduced ? undefined : { y: [0, 5, 16, 7, 0], scale: [.95, 1.16, .65, 1.08, .95], opacity: [.48, .86, .3, .7, .48] }} transition={{ duration: 1.05, delay: .18, repeat: Infinity, ease: "easeInOut" }} />
      {[{ left: 39, delay: 0 }, { left: 73, delay: .16 }].map(({ left, delay }) => (
        <motion.svg key={left} className="absolute top-[71px] h-[59px] w-[23px] -translate-x-1/2 origin-top" style={{ left }} viewBox="0 0 24 64" fill="none" aria-hidden="true"
          animate={reduced ? undefined : { scaleY: [1, 1.16, .72, 1.32, .86, 1.12, 1], scaleX: [1, .92, 1.08, .82, 1.12, .9, 1], opacity: [.78, 1, .62, 1, .7, .94, .78], skewX: [0, -2, 2, -3, 2, -1, 0] }}
          transition={{ duration: 1.05, delay, repeat: Infinity, ease: "easeInOut", times: [0, .16, .3, .47, .64, .82, 1] }}>
          <path d="M12 2C8 12 5 20 7 31C8 38 10 47 12 62C14 47 16 38 17 31C19 20 16 12 12 2Z" fill="#F97316" fillOpacity=".92" />
          <path d="M12 13C10 22 9 29 10 36C10.5 40 11.5 46 12 52C12.5 46 13.5 40 14 36C15 29 14 22 12 13Z" fill="#FFE1A6" />
        </motion.svg>
      ))}
      {[0, 1, 2, 3, 4, 5].map((index) => (
        <motion.span key={`spark-${index}`} className="absolute h-1 w-1 rounded-full bg-amber-200 shadow-[0_0_7px_#F97316]" style={{ left: 43 + (index % 2) * 30, top: 101 + (index % 3) * 5 }}
          animate={reduced ? undefined : { y: [0, 18 + index * 3, 38 + index * 4], x: [0, (index % 2 ? 1 : -1) * (4 + index * 1.5), (index % 2 ? 1 : -1) * (9 + index * 2)], opacity: [0, .95, 0], scale: [.4, 1, .15] }}
          transition={{ duration: 1.25 + index * .12, delay: index * .17, repeat: Infinity, ease: "easeOut" }} />
      ))}
      {[0, 1, 2].map((index) => (
        <motion.span key={`smoke-${index}`} className="absolute rounded-full border border-orange-200/20 bg-orange-200/10 blur-[1px]" style={{ left: 47 + index * 10, top: 114 + index * 2, width: 12 + index * 3, height: 8 + index * 3 }}
          animate={reduced ? undefined : { y: [0, 18, 34], x: [0, (index - 1) * 8, (index - 1) * 15], scale: [.65, 1.25, 1.8], opacity: [.3, .16, 0] }}
          transition={{ duration: 2.1, delay: index * .48, repeat: Infinity, ease: "easeOut" }} />
      ))}
      {[0, 1, 2, 3].map((index) => (
        <motion.span key={`speed-${index}`} className="absolute right-[-10px] h-px origin-right bg-gradient-to-l from-orange-300/70 to-transparent" style={{ top: 24 + index * 17, width: 15 + index * 7 }}
          animate={reduced ? undefined : { x: [0, 14, 0], opacity: [0, .55, 0], scaleX: [.4, 1, .4] }}
          transition={{ duration: 1.3, delay: index * .23, repeat: Infinity, ease: "easeOut" }} />
      ))}
    </motion.div>
  );
}

function FreshRocketFlight({ reduced }: { reduced: boolean }) {
  const motionPath = reduced ? undefined : {
    y: [22, 22, 18, 8, -7, -23, -34, -37, -31, -18, -4, 10, 20, 22],
    x: [0, 0, -.4, -1, -1.8, -1.7, -.8, .4, 1.6, 2.1, 1.6, .8, .2, 0],
    rotate: [0, 0, -.8, -2.4, -4.8, -6.5, -5.4, -2.5, 1.4, 3.8, 3.2, 1.5, .3, 0],
    scaleX: [1, 1, 1, .998, .994, .99, .992, .997, 1.002, 1.004, 1.002, 1, 1, 1],
    scaleY: [1, 1, 1.002, 1.006, 1.014, 1.022, 1.018, 1.008, 1.002, 1, 1, 1, 1, 1],
  };
  return (
    <motion.div
      className="relative z-10 h-[132px] w-[132px]"
      animate={motionPath}
      transition={{ duration: 8.6, repeat: Infinity, ease: "easeInOut", times: [0, .05, .11, .19, .29, .4, .5, .58, .66, .74, .82, .89, .96, 1] }}
    >
      <motion.div
        className="absolute left-1/2 top-[14px] h-[88px] w-[88px] -translate-x-1/2 text-[#e9e5d9] drop-shadow-[0_0_13px_rgba(255,237,170,.38)]"
        animate={reduced ? undefined : { scale: [1, 1, 1.004, .998, 1.006, 1], rotate: [0, -.12, .18, -.16, .12, 0] }}
        transition={{ duration: 2.1, repeat: Infinity, ease: "easeInOut" }}
      >
        <RocketMark size={88} />
        <motion.span className="absolute left-1/2 top-[19px] h-2.5 w-2.5 -translate-x-1/2 rounded-full bg-amber-100 blur-[2px]"
          animate={reduced ? undefined : { opacity: [.5, .95, .5], scale: [1, 1.22, 1] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }} />
      </motion.div>
      <motion.div className="absolute left-1/2 top-[68px] h-7 w-9 -translate-x-1/2 rounded-full bg-orange-500/35 blur-[10px]"
        animate={reduced ? undefined : { scale: [.75, 1.15, .8, 1], opacity: [.25, .75, .3, .25] }}
        transition={{ duration: 1.05, repeat: Infinity, ease: "easeInOut" }} />
      {[39, 73].map((left, index) => (
        <motion.svg key={left} className="absolute top-[69px] h-[35px] w-[13px] -translate-x-1/2 origin-top"
          style={{ left }} viewBox="0 0 14 38" aria-hidden="true"
          animate={reduced ? undefined : { scaleY: [1, 1.2, .82, 1.12, 1], scaleX: [1, .9, 1.08, .94, 1], opacity: [.78, 1, .7, 1, .78] }}
          transition={{ duration: .9, delay: index * .13, repeat: Infinity, ease: "easeInOut" }}>
          <path d="M7 1C4 10 3 15 4.5 23C5.2 27 6.2 32 7 37C7.8 32 8.8 27 9.5 23C11 15 10 10 7 1Z" fill="#F97316" />
          <path d="M7 8C5.8 15 5.7 20 6.2 24C6.5 26 6.8 29 7 31C7.2 29 7.5 26 7.8 24C8.3 20 8.2 15 7 8Z" fill="#FFE9B8" />
        </motion.svg>
      ))}
      {[0, 1, 2, 3].map((index) => (
        <motion.span key={index} className="absolute h-1 w-1 rounded-full bg-amber-100 shadow-[0_0_6px_#F97316]"
          style={{ left: 43 + (index % 2) * 30, top: 97 + (index % 2) * 4 }}
          animate={reduced ? undefined : { y: [0, 11, 24], x: [0, (index % 2 ? 1 : -1) * 4, (index % 2 ? 1 : -1) * 8], opacity: [0, .9, 0], scale: [.3, 1, .1] }}
          transition={{ duration: 1.2, delay: index * .2, repeat: Infinity, ease: "easeOut" }} />
      ))}
      {[0, 1].map((index) => (
        <motion.span key={`smoke-${index}`} className="absolute rounded-full border border-orange-100/20 bg-orange-200/10"
          style={{ left: 49 + index * 13, top: 108, width: 13, height: 9 }}
          animate={reduced ? undefined : { y: [0, 16, 29], x: [0, index ? 8 : -8, index ? 14 : -14], scale: [.7, 1.2, 1.8], opacity: [.28, .12, 0] }}
          transition={{ duration: 1.8, delay: index * .5, repeat: Infinity, ease: "easeOut" }} />
      ))}
    </motion.div>
  );
}

function StaticRocketMark() {
  return (
    <div className="relative z-10 h-[108px] w-[108px] text-[#e9e5d9] drop-shadow-[0_0_12px_rgba(255,237,170,.3)]">
      <RocketMark size={108} />
      <span className="pointer-events-none absolute inset-0 text-orange-500 drop-shadow-[0_0_5px_rgba(249,115,22,.7)]">
        <RocketMark flame size={108} />
      </span>
    </div>
  );
}

function PathRings({ reduced: _reduced }: { reduced: boolean }) {
  return (
    <div className="pointer-events-none absolute left-1/2 top-1/2 z-0 flex h-[168px] w-[168px] -translate-x-1/2 -translate-y-1/2 items-center justify-center">
      <KnowledgeBaseMark icon={<StaticRocketMark />} showStar={false} />
    </div>
  );
}

function PathRocket({ reduced }: { reduced: boolean }) {
  return (
    <div className="relative flex h-[168px] w-[168px] shrink-0 items-center justify-center">
      <PathRings reduced={reduced} />
    </div>
  );
}

const CARD_ACCENTS = [
  { color: "#60A5FA", soft: "rgba(96,165,250,.16)", border: "rgba(96,165,250,.64)" },
  { color: "#C084FC", soft: "rgba(192,132,252,.16)", border: "rgba(192,132,252,.64)" },
  { color: "#F59E0B", soft: "rgba(245,158,11,.16)", border: "rgba(245,158,11,.64)" },
  { color: "#22D3EE", soft: "rgba(34,211,238,.14)", border: "rgba(34,211,238,.62)" },
];

function GoalMetrics({ hours, visualizations, accent = CARD_ACCENTS[0] }: { hours: number; visualizations: number; accent?: typeof CARD_ACCENTS[number] }) {
  return (
    <div className="mt-auto flex items-center gap-4 border-t border-white/[.1] pt-3">
      <span className="flex items-center gap-1.5 text-[12px] text-white/65">
        <Clock3 size={15} color={accent.color} strokeWidth={1.6} />
        <span className="num text-[13px]" style={{ color: accent.color }}>{hours.toFixed(1)}</span> ч
      </span>
      <span className="flex items-center gap-1.5 text-[12px] text-white/65">
        <span className="relative h-[15px] w-[15px] shrink-0 overflow-visible">
          <span className="absolute left-1/2 top-1/2 h-[148px] w-[136px] -translate-x-1/2 -translate-y-1/2 scale-[0.24]" style={{ transformOrigin: "center" }}>
            <TechniqueArtwork kind="visualization" color={accent.color} bare static />
          </span>
        </span>
        <span className="num text-[13px]" style={{ color: accent.color }}>{visualizations}</span>
      </span>
    </div>
  );
}

function GoalCarousel({
  goals,
  goalStats,
  isOnboarding,
  reduced,
  onSelect,
  onCreate,
}: {
  goals: Goal[];
  goalStats: Record<string, { hours: number; visualizations: number }>;
  isOnboarding: boolean;
  reduced: boolean;
  onSelect: (goal: Goal) => void;
  onCreate: () => void;
}) {
  const [activeIndex, setActiveIndex] = useState(goals.length >= 2 ? 1 : 0);
  const wheelLock = useRef(false);
  const wasDragged = useRef(false);
  const pointerStart = useRef<{ x: number; y: number } | null>(null);
  const safeIndex = ((activeIndex % 3) + 3) % 3;
  const slots = [0, 1, 2].map((index) => goals[index] ?? null);
  const move = (direction: number) => setActiveIndex((current) => (current + direction + 3) % 3);
  const horizontalOffset = typeof window !== "undefined" && window.innerWidth < 768 ? 132 : 158;

  return (
    <div className="relative -mx-4 min-h-[238px] overflow-visible px-1 pb-2 pt-2">
      <motion.div
        className="relative mx-auto h-[218px] w-full max-w-[540px] overflow-visible"
        style={{ perspective: "760px", touchAction: "pan-y" }}
        onWheelCapture={(event) => {
          const delta = event.deltaX || (event.shiftKey ? event.deltaY : 0);
          if (Math.abs(delta) > 2) {
            event.preventDefault();
            if (!wheelLock.current) {
              move(delta > 0 ? 1 : -1);
              wheelLock.current = true;
              window.setTimeout(() => { wheelLock.current = false; }, 360);
            }
          }
        }}
      >
        {[-1, 0, 1].map((offset) => {
          const goalIndex = (safeIndex + offset + 3) % 3;
          const goal = slots[goalIndex];
          const isActive = offset === 0;
           const iconAccent = goal ? getGoalIcon(goal.icon) : null;
           const accent = iconAccent
             ? { color: iconAccent.color, soft: `${iconAccent.color}22`, border: `${iconAccent.color}A6` }
             : CARD_ACCENTS[Math.max(0, goalIndex) % CARD_ACCENTS.length];
          const stats = goal ? (goalStats[goal.id] ?? { hours: 0, visualizations: 0 }) : { hours: 0, visualizations: 0 };
          return (
            <motion.button
              key={goal?.id ?? `goal-empty-${goalIndex}`}
              type="button"
              onPointerDown={(event) => {
                if (event.pointerType === "mouse" && event.button !== 0) return;
                event.currentTarget.setPointerCapture(event.pointerId);
                pointerStart.current = { x: event.clientX, y: event.clientY };
              }}
              onPointerMove={(event) => {
                if (!pointerStart.current) return;
                const dx = event.clientX - pointerStart.current.x;
                const dy = event.clientY - pointerStart.current.y;
                if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 8) event.preventDefault();
              }}
              onPointerUp={(event) => {
                if (!pointerStart.current) return;
                const distance = event.clientX - pointerStart.current.x;
                if (Math.abs(distance) > 30) {
                  wasDragged.current = true;
                  move(distance < 0 ? 1 : -1);
                  window.setTimeout(() => { wasDragged.current = false; }, 80);
                }
                pointerStart.current = null;
              }}
              onPointerCancel={() => { pointerStart.current = null; }}
              onClick={() => {
                if (wasDragged.current) return;
                if (!isActive) setActiveIndex(goalIndex);
                else if (!goal) onCreate();
                else if (!isOnboarding) onSelect(goal);
              }}
              initial={{ opacity: 0, y: 12, scale: .9 }}
              animate={{
                opacity: isActive ? 1 : .62,
                x: offset * horizontalOffset,
                y: isActive ? 0 : 10,
                scale: isActive ? .98 : .77,
                rotateY: offset * -22,
                rotateZ: offset * (offset > 0 ? 1.4 : -1.4),
              }}
              transition={{ duration: reduced ? 0 : .55, ease: EASE }}
              className="absolute left-1/2 top-0 flex h-[204px] w-[70vw] max-w-[276px] -translate-x-1/2 flex-col rounded-[18px] p-4 text-left shadow-[0_18px_45px_rgba(0,0,0,.42)]"
              style={{
                zIndex: 3 - Math.abs(offset),
                 background: goal ? "#10263b" : "#132a40",
                border: `1px solid ${isActive ? accent.border : "rgba(137,188,224,.18)"}`,
                boxShadow: isActive ? `0 0 0 1px ${accent.soft}, 0 0 32px ${accent.soft}, 0 18px 45px rgba(0,0,0,.34)` : undefined,
                transformStyle: "preserve-3d",
              }}
              aria-label={goal ? (isActive ? `Открыть цель ${goal.name}` : `Выбрать цель ${goal.name}`) : "Добавить цель"}
            >
              <SteelDetails color={accent.color} />
              <span className="pointer-events-none absolute -right-10 -top-12 h-32 w-32 rounded-full blur-3xl" style={{ background: accent.color, opacity: isActive ? .2 : .08 }} />
              {goal ? (
                <>
                  <span className="relative z-10 mb-4 flex items-center justify-between">
                    <span className="flex h-12 w-12 items-center justify-center rounded-[14px]" style={{ color: accent.color, background: accent.soft, border: `1px solid ${accent.border}` }}>
                      <GoalIcon iconId={goal.icon} size={25} />
                    </span>
                    <span className="flex items-center gap-1 text-[10px] uppercase tracking-[.16em]" style={{ color: accent.color }}>
                      {isActive ? "Подробнее" : `${Math.abs(offset)} далее`} <ChevronRight size={14} />
                    </span>
                  </span>
                  <h3 className="relative z-10 line-clamp-2 text-[19px] font-semibold leading-tight tracking-[-.02em] text-[#F59E0B]">{goal.name}</h3>
                  <div className="relative z-10 mt-auto"><GoalMetrics hours={stats.hours} visualizations={stats.visualizations} accent={accent} /></div>
                </>
              ) : (
                <span className="relative z-10 flex h-full flex-col items-center justify-center gap-3 text-center" style={{ color: accent.color }}>
                  <span className="flex h-12 w-12 items-center justify-center rounded-full border border-dashed" style={{ borderColor: accent.border, background: accent.soft }}><Plus size={22} /></span>
                  <span className="text-[12px] uppercase tracking-[.14em]">Добавить цель</span>
                </span>
              )}
            </motion.button>
          );
        })}
      </motion.div>
      {true && (
        <div className="absolute bottom-0 left-0 right-0 flex justify-center gap-1.5">
          {[0, 1, 2].map((index) => (
            <button key={`dot-${index}`} type="button" onClick={() => setActiveIndex(index)} className="h-1.5 rounded-full transition-all" style={{ width: index === safeIndex ? 24 : 6, background: index === safeIndex ? CARD_ACCENTS[index % CARD_ACCENTS.length].color : "rgba(255,255,255,.22)" }} aria-label={`Карточка ${index + 1}`} />
          ))}
        </div>
      )}
    </div>
  );
}

function ProgressCarousel({
  items,
  onOpen,
}: {
  items: { id: StatKey; icon: LucideIcon; value: number; label: string; route: string; color: string }[];
  onOpen: (route: string) => void;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const wheelLock = useRef(false);
  const wasDragged = useRef(false);
  const pointerStart = useRef<{ x: number; y: number } | null>(null);
  const safeIndex = ((activeIndex % items.length) + items.length) % items.length;
  const move = (direction: number) => setActiveIndex((current) => (current + direction + items.length) % items.length);
  const horizontalOffset = typeof window !== "undefined" && window.innerWidth < 768 ? 88 : 108;
  return (
     <div className="relative -mx-4 min-h-[184px] overflow-visible px-1 pb-4 pt-2">
       <motion.div className="relative mx-auto h-[158px] w-full max-w-[540px]" style={{ perspective: "760px", touchAction: "pan-y" }}
        onWheelCapture={(event) => {
          const delta = event.deltaX || (event.shiftKey ? event.deltaY : 0);
          if (Math.abs(delta) > 2) {
            event.preventDefault();
            if (!wheelLock.current) {
              move(delta > 0 ? 1 : -1);
              wheelLock.current = true;
              window.setTimeout(() => { wheelLock.current = false; }, 360);
            }
          }
        }}>
      {[-1, 0, 1].map((offset) => {
        const index = (safeIndex + offset + items.length) % items.length;
        const { id, icon: Icon, value, label, route, color } = items[index];
        const isActive = offset === 0;
         const valueLength = String(value).length;
         const valueSize = valueLength >= 5 ? 18 : valueLength === 4 ? 22 : 29;
        return (
        <motion.button
          key={id}
          type="button"
          onPointerDown={(event) => {
            if (event.pointerType === "mouse" && event.button !== 0) return;
            event.currentTarget.setPointerCapture(event.pointerId);
            pointerStart.current = { x: event.clientX, y: event.clientY };
          }}
          onPointerMove={(event) => {
            if (!pointerStart.current) return;
            const dx = event.clientX - pointerStart.current.x;
            const dy = event.clientY - pointerStart.current.y;
            if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 8) event.preventDefault();
          }}
          onPointerUp={(event) => {
            if (!pointerStart.current) return;
            const distance = event.clientX - pointerStart.current.x;
            if (Math.abs(distance) > 30) {
              wasDragged.current = true;
              move(distance < 0 ? 1 : -1);
              window.setTimeout(() => { wasDragged.current = false; }, 80);
            }
            pointerStart.current = null;
          }}
          onPointerCancel={() => { pointerStart.current = null; }}
          whileTap={{ scale: .96 }}
           onClick={() => {
             if (wasDragged.current) return;
             if (!isActive) setActiveIndex(index);
             else onOpen(route);
           }}
           className="absolute left-1/2 top-0 flex h-[154px] w-[42vw] max-w-[164px] -translate-x-1/2 flex-col justify-between rounded-[20px] border p-3"
           animate={{ opacity: isActive ? 1 : .62, x: offset * horizontalOffset, y: isActive ? 0 : 8, scale: isActive ? 1 : .78, rotateY: offset * -20, rotateZ: offset * (offset > 0 ? 1 : -1) }}
           transition={{ duration: .45, ease: EASE }}
          style={{
            zIndex: 3 - Math.abs(offset),
             background: "linear-gradient(155deg, #122c45 0%, #0c2035 72%)",
            borderColor: `${color}80`,
             boxShadow: isActive ? `0 0 0 1px ${color}30, 0 0 28px ${color}28, inset 0 1px 0 rgba(255,255,255,.08), inset 0 -18px 28px rgba(1,8,17,.28)` : `0 0 22px ${color}18, inset 0 1px 0 rgba(255,255,255,.05)`,
            transformStyle: "preserve-3d",
          }}
        >
          <SteelDetails color={color} compact />
           <span className="relative z-10 flex min-h-[94px] flex-1 items-center justify-center gap-3" style={{ color }}>
             <span className="num shrink-0 leading-none text-amber-50" style={{ fontSize: valueSize }}>{value}</span>
             <Icon className="shrink-0" size={62} strokeWidth={1.5} aria-hidden="true" />
           </span>
            <span className="relative z-10 block px-1 pb-0.5 text-center">
              <span className="block text-[10px] uppercase leading-[1.15] tracking-[.08em] text-white/55">{label}</span>
           </span>
        </motion.button>
      );})}
      </motion.div>
      <div className="absolute bottom-0 left-0 right-0 flex justify-center gap-1.5">
        {items.map(({ id }, index) => <button key={`progress-dot-${id}`} type="button" onClick={() => setActiveIndex(index)} className="h-1.5 rounded-full transition-all" style={{ width: index === safeIndex ? 24 : 6, background: index === safeIndex ? items[index].color : "rgba(255,255,255,.22)" }} aria-label={`Показать ${items[index].label}`} />)}
      </div>
    </div>
  );
}

function GoalEditor({
  goal,
  onClose,
  onSave,
}: {
  goal?: Goal;
  onClose: () => void;
  onSave: (name: string, description: string, icon: string) => void;
}) {
  const [name, setName] = useState(goal?.name ?? "");
  const [description, setDescription] = useState(goal?.description ?? "");
  const [icon, setIcon] = useState(goal?.icon ?? "rocket");
  return (
    <div className="flex min-h-full flex-col">
      <div className="relative shrink-0 overflow-hidden border-b border-orange-200/10 px-5 pb-6 pt-[max(24px,env(safe-area-inset-top))]">
        <div className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full bg-orange-400/[.08] blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 left-8 h-40 w-40 rounded-full bg-purple-400/[.06] blur-3xl" />
        <div className="relative flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[.22em] text-orange-300/70">Академия · намерение</p>
            <h2 className="mt-2 text-[30px] font-semibold leading-[1.08] tracking-[-.04em] text-[#fff8e8]">{goal ? "Изменить цель" : "Новая цель"}</h2>
          </div>
          <button onClick={onClose} className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[.04] text-orange-100/70 active:scale-95" aria-label="Закрыть"><X size={20} /></button>
        </div>
        <p className="relative mt-4 max-w-[310px] text-[14px] leading-6 text-slate-300/70">
          Сформулируй направление, которое поможет тебе двигаться осознанно.
        </p>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-6">
        <div className="space-y-7">
          <div>
            <label className="mb-2 block text-[13px] font-medium text-orange-100/80">Как назовём это направление?</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Например, выучить английский" autoFocus className="h-14 rounded-2xl border-orange-200/20 bg-[#102942] px-4 text-[16px] text-primary placeholder:text-slate-500 focus-visible:border-orange-300/70 focus-visible:ring-orange-400/20" />
          </div>
          <div>
            <div className="mb-2 flex items-end justify-between">
              <label className="block text-[13px] font-medium text-orange-100/80">Зачем тебе это?</label>
              <span className="text-[11px] text-slate-500">необязательно</span>
            </div>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Опиши, что изменится в твоей жизни..." className="min-h-[136px] resize-none rounded-2xl border-orange-200/20 bg-[#102942] px-4 py-4 text-[15px] leading-6 text-primary placeholder:text-slate-500 focus-visible:border-orange-300/70 focus-visible:ring-orange-400/20" />
          </div>
          <div>
            <div className="mb-3 flex items-end justify-between">
              <div>
                <label className="block text-[13px] font-medium text-orange-100/80">Выбери символ</label>
                <p className="mt-1 text-[12px] text-slate-400/70">Пусть он напоминает о твоём фокусе</p>
              </div>
              <span className="rounded-full border border-orange-200/15 bg-orange-300/[.07] px-2.5 py-1 text-[11px] text-orange-200/75">{getGoalIcon(icon).label}</span>
            </div>
            <div className="grid grid-cols-5 gap-2 rounded-3xl border border-white/[.09] bg-[#0a1c30] p-3">
              {GOAL_ICONS.map(({ id, color, Icon, label }) => (
                <button type="button" key={id} title={label} aria-label={label} onClick={() => setIcon(id)}
                  className="group flex min-h-[58px] flex-col items-center justify-center gap-1 rounded-2xl border transition-all active:scale-95"
                  style={{ background: icon === id ? `${color}20` : "rgba(255,255,255,.025)", borderColor: icon === id ? `${color}90` : "rgba(255,255,255,.06)", boxShadow: icon === id ? `0 0 20px ${color}24, inset 0 0 14px ${color}0d` : "none" }}>
                  <Icon size={22} color={color} strokeWidth={1.55} />
                  <span className="max-w-full truncate px-1 text-[9px] text-slate-400/75">{label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="shrink-0 border-t border-white/[.08] bg-[#0b2035]/95 px-5 pb-[max(20px,env(safe-area-inset-bottom))] pt-4 backdrop-blur-xl">
        <button disabled={!name.trim()} onClick={() => onSave(name.trim(), description.trim(), icon)} className="btn-gold h-14 w-full rounded-2xl text-[15px] font-semibold tracking-[.01em] shadow-[0_8px_26px_rgba(245,158,11,.18)] disabled:opacity-40">
          {goal ? "Сохранить изменения" : "Запустить цель"} <ChevronRight size={18} className="ml-1 inline-block" />
        </button>
        <p className="mt-3 text-center text-[11px] text-slate-500">До 3 активных направлений одновременно</p>
      </div>
    </div>
  );
}

function Modal({ children, onClose, fullScreen = false }: { children: React.ReactNode; onClose: () => void; fullScreen?: boolean }) {
  const content = (
    <div className={`fixed inset-0 z-[200] flex items-end justify-center bg-[#020814]/75 backdrop-blur-sm sm:items-center ${fullScreen ? "p-0" : "p-3"}`}>
      <button className="absolute inset-0 cursor-default" onClick={onClose} aria-label="Закрыть окно" />
      <motion.div
        initial={{ y: 30, opacity: 0, scale: 0.98 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        className={fullScreen
          ? "relative z-10 h-[100dvh] w-full overflow-hidden bg-[#0b2035] shadow-[0_20px_80px_rgba(0,0,0,.7)]"
          : "relative z-10 max-h-[88dvh] w-full max-w-md overflow-y-auto rounded-[26px] border border-orange-300/20 bg-[#0c2036]/[.98] p-5 shadow-[0_20px_80px_rgba(0,0,0,.7)]"}
      >
        {children}
      </motion.div>
    </div>
  );
  return createPortal(content, document.body);
}

function GoalEditorReframed({
  goal,
  onClose,
  onSave,
}: {
  goal?: Goal;
  onClose: () => void;
  onSave: (name: string, description: string, icon: string) => void;
}) {
  const [name, setName] = useState(goal?.name ?? "");
  const [description, setDescription] = useState(goal?.description ?? "");
  const [icon, setIcon] = useState(goal?.icon ?? "rocket");
  const selected = getGoalIcon(icon);

  return (
    <div className="relative flex h-full min-h-0 flex-col overflow-hidden bg-[#091b2c] text-[#f8f1df]">
      <div className="pointer-events-none absolute -right-28 -top-32 h-80 w-80 rounded-full bg-orange-400/[.09] blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-20 h-72 w-72 rounded-full bg-indigo-400/[.07] blur-3xl" />
      <header className="relative flex shrink-0 items-center justify-between px-6 pb-5 pt-[max(22px,env(safe-area-inset-top))]">
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-full border border-orange-200/25 bg-orange-300/10 text-[11px] font-semibold text-orange-200">01</span>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[.24em] text-orange-300/75">Новая глава</p>
            <p className="mt-0.5 text-[12px] text-slate-400">Настрой своё направление</p>
          </div>
        </div>
        <button onClick={onClose} aria-label="Закрыть" className="flex h-10 w-10 items-center justify-center rounded-full border border-white/[.14] text-slate-300 active:scale-95"><X size={19} /></button>
      </header>

      <div className="relative min-h-0 flex-1 overflow-y-auto px-6 pb-8">
        <section className="relative overflow-hidden rounded-[30px] border border-orange-200/15 bg-[linear-gradient(145deg,rgba(42,37,34,.92),rgba(13,34,53,.96))] px-5 pb-6 pt-5 shadow-[0_18px_50px_rgba(0,0,0,.22)]">
          <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full border border-orange-200/10" />
          <div className="absolute -right-2 top-0 h-20 w-20 rounded-full border border-orange-200/[.07]" />
          <p className="relative text-[10px] font-semibold uppercase tracking-[.22em] text-orange-300/65">Точка назначения</p>
          <div className="relative mt-5 flex items-center gap-4">
            <motion.div
              key={icon}
              initial={{ opacity: 0, scale: .72, rotate: -12 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 240, damping: 18 }}
              className="flex h-[74px] w-[74px] shrink-0 items-center justify-center rounded-[24px] border border-orange-200/20 bg-[#102a42] shadow-[inset_0_0_20px_rgba(255,255,255,.04),0_8px_20px_rgba(0,0,0,.22)]"
              style={{ boxShadow: `0 0 30px ${selected.color}20, inset 0 0 20px rgba(255,255,255,.04)` }}
            >
              <selected.Icon size={34} color={selected.color} strokeWidth={1.45} />
            </motion.div>
            <div className="min-w-0">
              <h1 className="serif text-[31px] leading-[1.05] tracking-[-.035em] text-[#fff8e8]">{goal ? "Измени курс" : "Задай курс"}</h1>
              <p className="mt-2 text-[13px] leading-5 text-slate-300/70">Одна ясная цель превращает движение в путь.</p>
            </div>
          </div>
        </section>

        <section className="mt-8">
          <label className="block text-[11px] font-semibold uppercase tracking-[.18em] text-orange-200/70">Твоя цель</label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Что ты хочешь изменить?" autoFocus
            className="mt-3 h-auto rounded-none border-0 border-b border-white/20 bg-transparent px-0 py-3 text-[21px] font-medium tracking-[-.02em] text-[#fff8e8] shadow-none placeholder:text-slate-500/80 focus-visible:border-orange-300 focus-visible:ring-0" />
          <p className="mt-2 text-[12px] text-slate-500">Назови результат так, будто он уже стал частью твоей жизни.</p>
        </section>

        <section className="mt-8">
          <div className="flex items-center justify-between">
            <label className="block text-[11px] font-semibold uppercase tracking-[.18em] text-orange-200/70">Личный смысл</label>
            <span className="text-[11px] text-slate-500">необязательно</span>
          </div>
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Почему тебе важно прийти именно сюда?"
            className="mt-3 min-h-[96px] resize-none rounded-2xl border border-white/[.12] bg-[#0d263e] px-4 py-3.5 text-[15px] leading-6 text-[#f8f1df] placeholder:text-slate-500 focus-visible:border-orange-300/60 focus-visible:ring-2 focus-visible:ring-orange-300/10" />
        </section>

        <section className="mt-8">
          <div className="flex items-end justify-between">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-[.18em] text-orange-200/70">Твой символ</label>
              <p className="mt-1.5 text-[12px] text-slate-400">Выбери знак, который будет возвращать фокус.</p>
            </div>
            <span className="text-[12px] font-medium" style={{ color: selected.color }}>{selected.label}</span>
          </div>
          <div className="mt-4 grid grid-cols-4 gap-2.5">
            {GOAL_ICONS.map(({ id, color, Icon, label }) => {
              const isSelected = icon === id;
              return (
                <button type="button" key={id} title={label} aria-label={label} onClick={() => setIcon(id)}
                  className="relative flex min-h-[70px] flex-col items-center justify-center gap-2 rounded-[20px] border transition-all active:scale-95"
                  style={{ borderColor: isSelected ? `${color}a8` : "rgba(255,255,255,.09)", background: isSelected ? `${color}18` : "rgba(10,31,49,.62)", boxShadow: isSelected ? `0 8px 22px ${color}18, inset 0 0 18px ${color}0c` : "none" }}>
                  {isSelected && <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full" style={{ background: color, boxShadow: `0 0 7px ${color}` }} />}
                  <Icon size={24} color={color} strokeWidth={1.5} />
                  <span className="max-w-full truncate px-1 text-[10px] text-slate-400">{label}</span>
                </button>
              );
            })}
          </div>
        </section>
      </div>

      <footer className="relative shrink-0 border-t border-white/[.1] bg-[#091b2c]/95 px-6 pb-[max(18px,env(safe-area-inset-bottom))] pt-4 backdrop-blur-xl">
        <button disabled={!name.trim()} onClick={() => onSave(name.trim(), description.trim(), icon)}
          className="flex h-[58px] w-full items-center justify-center gap-2 rounded-[20px] bg-[#f4a51c] text-[15px] font-bold text-[#241607] shadow-[0_10px_30px_rgba(244,165,28,.22)] transition-transform active:scale-[.98] disabled:cursor-not-allowed disabled:bg-[#314153] disabled:text-slate-500 disabled:shadow-none">
          {goal ? "Сохранить новый курс" : "Начать путь"} <ChevronRight size={19} strokeWidth={2.4} />
        </button>
        <p className="mt-2.5 text-center text-[10px] uppercase tracking-[.14em] text-slate-500">Шаг 1 из 1 · максимум 3 активные цели</p>
      </footer>
    </div>
  );
}

function GoalEditorMinimal({
  goal,
  onClose,
  onSave,
}: {
  goal?: Goal;
  onClose: () => void;
  onSave: (name: string, description: string, icon: string) => void;
}) {
  const [name, setName] = useState(goal?.name ?? "");
  const [description, setDescription] = useState(goal?.description ?? "");
  const [icon, setIcon] = useState(goal?.icon ?? "rocket");
  const selected = getGoalIcon(icon);

  return (
    <div className="relative flex h-full min-h-0 flex-col overflow-hidden bg-[#101e2b]">
      <div className="pointer-events-none absolute -left-24 top-20 h-64 w-64 rounded-full border border-orange-300/[.08]" />
      <div className="pointer-events-none absolute -left-16 top-28 h-48 w-48 rounded-full border border-orange-300/[.06]" />
      <div className="pointer-events-none absolute -right-24 bottom-24 h-72 w-72 rounded-full border border-orange-300/[.06]" />
      <header className="relative flex shrink-0 items-center gap-4 px-6 pt-[max(20px,env(safe-area-inset-top))]">
        <button onClick={onClose} aria-label="Назад" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/[.12] text-slate-300 active:scale-95"><ArrowLeft size={21} /></button>
        <h1 className="text-[25px] font-semibold tracking-[-.035em] text-[#F59E0B]">{goal ? "Изменить цель" : "Новая цель"}</h1>
      </header>

      <main className="relative min-h-0 flex-1 overflow-y-auto px-6 pb-8 pt-7">
        <div className="mt-7 space-y-7">
          <div>
            <label className="block text-[15px] font-semibold tracking-[-.01em] text-[#F59E0B]">Цель</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Например, выучить английский" autoFocus
              className="mt-2 h-12 rounded-xl border-white/[.13] bg-[#162d42] px-4 text-[16px] text-[#f8f1df] placeholder:text-slate-500 focus-visible:border-orange-300/60 focus-visible:ring-orange-300/10" />
          </div>
          <div>
            <label className="block text-[15px] font-semibold tracking-[-.01em] text-[#F59E0B]">Описание <span className="ml-2 text-[12px] font-normal tracking-normal text-slate-500">необязательно</span></label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Почему это важно?"
              className="mt-2 min-h-[82px] resize-none rounded-xl border-white/[.13] bg-[#162d42] px-4 py-3 text-[15px] leading-6 text-[#f8f1df] placeholder:text-slate-500 focus-visible:border-orange-300/60 focus-visible:ring-orange-300/10" />
          </div>
          <div>
            <label className="block text-[15px] font-semibold tracking-[-.01em] text-[#F59E0B]">Символ</label>
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {GOAL_ICONS.map(({ id, color, Icon, label }) => {
                const active = id === icon;
                return (
                  <button type="button" key={id} title={label} aria-label={label} onClick={() => setIcon(id)}
                    className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border transition-all active:scale-95"
                    style={{ borderColor: active ? `${color}b0` : "rgba(255,255,255,.1)", background: active ? `${color}20` : "#14283b", boxShadow: active ? `0 0 18px ${color}22` : "none" }}>
                    <Icon size={23} color={color} strokeWidth={1.5} />
                  </button>
                );
              })}
            </div>
          </div>
          <button disabled={!name.trim()} onClick={() => onSave(name.trim(), description.trim(), icon)}
            className="h-14 w-full rounded-2xl bg-[#f0a21a] text-[16px] font-semibold text-[#241707] shadow-[0_8px_25px_rgba(240,162,26,.2)] transition-transform active:scale-[.98] disabled:bg-[#2b3b4a] disabled:text-slate-500 disabled:shadow-none">
            {goal ? "Сохранить" : "Создать цель"}
          </button>
        </div>
      </main>
    </div>
  );
}

export default function Path() {
  const {
    closedDays, keys, streak, goals, history, activityLog, plannerTasks, userState,
    onboardingHighlight, updateState,
  } = useAppStore();
  const [, setLocation] = useLocation();
  const reduced = useReducedMotion();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [editor, setEditor] = useState<"new" | Goal | null>(() => (
    new URLSearchParams(window.location.search).get("create") === "1" ? "new" : null
  ));
  const isOnboarding = userState === "onboarding";
  const highlight = (id: string) => isOnboarding && onboardingHighlight.includes(id);

  const activeGoals = goals.filter((goal) => goal.status === "active");
  const goalStats = useMemo(() => Object.fromEntries(activeGoals.map((goal) => [
    goal.id,
    {
      hours: plannerTasks.filter((task) => task.goalId === goal.id).reduce((sum, task) => sum + task.durationMin, 0) / 60,
      visualizations: activityLog.filter((entry) => entry.type === "visualization" && entry.details.goalId === goal.id).length,
    },
  ])), [activeGoals, plannerTasks, activityLog]);
  const closeModal = () => { setSelectedGoal(null); setEditor(null); };
  const saveGoal = (name: string, description: string, icon: string) => {
    if (editor === "new") {
      const id = `goal_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      updateState((prev) => ({
        goals: [...prev.goals, { id, name, description, icon, createdAt: new Date().toISOString(), status: "active" }],
        scenes: [...prev.scenes, { id: `scene_${Date.now()}`, goalId: id, answers: [], createdAt: new Date().toISOString(), status: "active" }],
      }));
    } else if (editor) {
      updateState((prev) => ({ goals: prev.goals.map((item) => item.id === editor.id ? { ...item, name, description, icon } : item) }));
    }
    closeModal();
  };
  const changeGoalStatus = (status: "completed" | "cancelled") => {
    if (!selectedGoal) return;
    updateState((prev) => ({ goals: prev.goals.map((item) => item.id === selectedGoal.id ? { ...item, status, completedAt: new Date().toISOString() } : item) }));
    closeModal();
  };

  const statItems: { id: StatKey; icon: LucideIcon; value: number; label: string; route: string; color: string }[] = [
    { id: "days", icon: CalendarCheck, value: closedDays, label: "дней на 100%", route: "/my-progress", color: "#F59E0B" },
    { id: "keys", icon: KeyRound, value: keys, label: "ключей", route: "/keys-stats", color: "#FACC15" },
    { id: "streak", icon: Flame, value: streak, label: "дней серии", route: "/streak", color: "#FB7185" },
    { id: "history", icon: History, value: history.length, label: "дней истории", route: "/history", color: "#22D3EE" },
  ];
  const selectedIcon = selectedGoal ? getGoalIcon(selectedGoal.icon) : null;

  return (
    <div ref={scrollRef} data-testid="path-scroll-container" className="path-page relative h-full min-h-0 overflow-x-hidden overflow-y-auto overscroll-x-none overscroll-y-none px-4 pb-[max(112px,calc(88px+env(safe-area-inset-bottom)))] pt-0">
      <Atmosphere />
      <div className="relative z-10">
        <motion.section initial={{ opacity: 0, y: -18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .8, ease: EASE }} className="flex items-center justify-start gap-2 pb-1 pt-12">
          <PathRocket reduced={Boolean(reduced)} />
          <h1
            className="shrink-0 whitespace-nowrap text-left uppercase tracking-wider"
            style={{ color: "#F59E0B", fontSize: 22, fontWeight: 600, letterSpacing: "0.08em" }}
          >
            Мой путь
          </h1>
        </motion.section>

        <section className="mt-1">
          <div className="mb-3 flex items-end justify-between">
            <div>
              <h2 className="title-s uppercase tracking-[.14em] text-[#F59E0B]">Цели</h2>
            </div>
            <span className="num text-[13px] text-orange-200/60">{activeGoals.length}/3</span>
          </div>
          <GoalCarousel goals={activeGoals} goalStats={goalStats} isOnboarding={isOnboarding} reduced={Boolean(reduced)} onSelect={setSelectedGoal} onCreate={() => setEditor("new")} />
        </section>

        <section className="mt-9">
          <div className="mb-3">
            <h2 className="title-s uppercase tracking-[.14em] text-[#F59E0B]">Мой прогресс</h2>
          </div>
          <ProgressCarousel items={statItems} onOpen={setLocation} />
        </section>
      </div>

      {selectedGoal && (
        <Modal onClose={() => setSelectedGoal(null)} fullScreen>
          <div className="h-full overflow-y-auto px-5 pb-[max(24px,env(safe-area-inset-bottom))] pt-[max(24px,env(safe-area-inset-top))]">
            <div className="flex items-start gap-3">
              <button onClick={() => setSelectedGoal(null)} className="mt-[-4px] flex h-11 w-11 shrink-0 items-center justify-center text-slate-300 active:scale-95" aria-label="Назад">
                <ArrowLeft size={23} />
              </button>
              <div className="flex h-11 w-11 shrink-0 items-center justify-center" style={{ color: selectedIcon?.color }}>
                <GoalIcon iconId={selectedGoal.icon} size={29} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="caption uppercase tracking-[.14em] text-orange-200/60">цель</p>
                <h2 className="title-m mt-1 text-[#F59E0B]">{selectedGoal.name}</h2>
              </div>
            </div>
            <p className="body mt-5 whitespace-pre-wrap text-slate-200/80">{selectedGoal.description || "Описание этой цели ещё не добавлено."}</p>
            <GoalMetrics hours={goalStats[selectedGoal.id]?.hours ?? 0} visualizations={goalStats[selectedGoal.id]?.visualizations ?? 0} />
            <div className="mt-5 grid grid-cols-2 gap-2">
              <button onClick={() => { setEditor(selectedGoal); setSelectedGoal(null); }} className="flex h-11 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[.05] text-[13px] text-slate-200"><Pencil size={15} /> Изменить</button>
              <button onClick={() => changeGoalStatus("completed")} className="flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600/80 text-[13px] text-white"><Check size={15} /> Выполнено</button>
            </div>
            <button onClick={() => changeGoalStatus("cancelled")} className="mt-2 h-10 w-full rounded-xl text-[12px] text-slate-400 active:text-rose-300">Отказаться от цели</button>
          </div>
        </Modal>
      )}
      {editor && (
        <Modal onClose={closeModal} fullScreen>
          <GoalEditorMinimal goal={editor === "new" ? undefined : editor} onClose={closeModal} onSave={saveGoal} />
        </Modal>
      )}
    </div>
  );
}