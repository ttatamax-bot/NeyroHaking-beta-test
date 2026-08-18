import { useEffect, useRef, useState, type ReactNode } from "react";
import { useLocation } from "wouter";
import { useAppStore } from "@/lib/store";
import { motion, useReducedMotion } from "framer-motion";
import { Check } from "lucide-react";
import { TechniqueArtwork, type TechniqueArtworkKind } from "@/components/TechniqueArtwork";

type Technique = {
  id: string;
  title: string;
  artwork: TechniqueArtworkKind;
  route: string | null;
  color: string;
  dayKey?: 'T1' | 'T2' | 'T3' | 'T4' | 'T5' | 'T6';
  repeatable: boolean;
};

const TECHNIQUES: Technique[] = [
  {
    id: 'T1', title: 'Планер', artwork: 'planner', route: '/technique/planner', dayKey: 'T1',
    color: '#F59E0B',
    repeatable: false,
  },
  {
    id: 'T2', title: 'Визуализация', artwork: 'visualization', route: '/technique/visualization', dayKey: 'T2',
    color: '#C084FC',
    repeatable: true,
  },
  {
    id: 'T3', title: 'Медитация', artwork: 'meditation', route: '/technique/meditation', dayKey: 'T3',
    color: '#06B6D4',
    repeatable: true,
  },
  {
    id: 'T4', title: 'Прогулка', artwork: 'walk', route: '/technique/walk', dayKey: 'T4',
    color: '#3DB770',
    repeatable: true,
  },
  {
    id: 'T5', title: 'Хобби', artwork: 'hobby', route: '/technique/hobby', dayKey: 'T5',
    color: '#DC576C',
    repeatable: true,
  },
  {
    id: 'T6', title: 'Сон', artwork: 'sleep', route: '/technique/sleep', dayKey: 'T6',
    color: '#3B82F6',
    repeatable: false,
  },
  {
    id: 'T7', title: 'Память', artwork: 'memory', route: '/technique/memory',
    color: '#F97316',
    repeatable: true,
  },
  {
    id: 'T8', title: 'Концентрация', artwork: 'concentration', route: null,
    color: '#A78BFA',
    repeatable: false,
  },
];

const TECHNIQUE_RINGS = [
  { size: "156vw", maxSize: 760, opacity: 0.28, color: "rgba(197,211,222,.42)", duration: 32, direction: 1, scale: [1, 1, 1] },
  { size: "142vw", maxSize: 690, opacity: 0.34, color: "rgba(249,115,22,.36)", duration: 27, direction: -1, scale: [1, 1, 1] },
  { size: "128vw", maxSize: 620, opacity: 0.23, color: "rgba(155,171,185,.36)", duration: 23, direction: 1, scale: [1, 1, 1] },
  { size: "114vw", maxSize: 550, opacity: 0.3, color: "rgba(220,228,232,.4)", duration: 29, direction: -1, scale: [1, 1, 1] },
  { size: "100vw", maxSize: 484, opacity: 0.28, color: "rgba(249,115,22,.32)", duration: 19, direction: 1, scale: [1, 1, 1] },
  { size: "86vw", maxSize: 418, opacity: 0.32, color: "rgba(183,197,207,.4)", duration: 24, direction: -1, scale: [1, 1, 1] },
  { size: "72vw", maxSize: 350, opacity: 0.24, color: "rgba(126,145,161,.34)", duration: 17, direction: 1, scale: [1, 1, 1] },
  { size: "60vw", maxSize: 292, opacity: 0.38, color: "rgba(234,239,238,.44)", duration: 21, direction: -1, scale: [1, 1, 1] },
  { size: "48vw", maxSize: 234, opacity: 0.3, color: "rgba(249,115,22,.34)", duration: 15, direction: 1, scale: [1, 1, 1] },
  { size: "36vw", maxSize: 176, opacity: 0.36, color: "rgba(211,222,228,.46)", duration: 12, direction: -1, scale: [1, 1, 1] },
];

const TECHNIQUE_TICK_RINGS = [
  { size: "138vw", maxSize: 668, duration: 34, direction: 1, opacity: 0.34, start: 4, spacing: 12 },
  { size: "106vw", maxSize: 514, duration: 23, direction: -1, opacity: 0.42, start: 18, spacing: 16 },
  { size: "78vw", maxSize: 378, duration: 15, direction: 1, opacity: 0.3, start: 7, spacing: 20 },
];

const TECHNIQUE_PARTICLES = [
  { left: "8%", top: "17%", size: 3, color: "#FFD29A", delay: 0, drift: -14 },
  { left: "18%", top: "31%", size: 2, color: "#F97316", delay: 0.7, drift: 12 },
  { left: "29%", top: "12%", size: 2, color: "#FFE4B5", delay: 1.3, drift: -9 },
  { left: "43%", top: "24%", size: 3, color: "#FFB45E", delay: 0.25, drift: 15 },
  { left: "57%", top: "10%", size: 2, color: "#FFD29A", delay: 1.6, drift: -13 },
  { left: "71%", top: "21%", size: 3, color: "#F97316", delay: 0.5, drift: 11 },
  { left: "88%", top: "15%", size: 2, color: "#FFE4B5", delay: 1.1, drift: -16 },
  { left: "94%", top: "38%", size: 3, color: "#FFB45E", delay: 0.15, drift: 14 },
  { left: "6%", top: "52%", size: 2, color: "#F97316", delay: 1.8, drift: -12 },
  { left: "22%", top: "66%", size: 3, color: "#FFD29A", delay: 0.85, drift: 16 },
  { left: "37%", top: "48%", size: 2, color: "#FFB45E", delay: 1.45, drift: -10 },
  { left: "53%", top: "61%", size: 2, color: "#FFE4B5", delay: 0.4, drift: 13 },
  { left: "68%", top: "49%", size: 3, color: "#F97316", delay: 1.05, drift: -15 },
  { left: "81%", top: "63%", size: 2, color: "#FFD29A", delay: 0.65, drift: 10 },
  { left: "96%", top: "76%", size: 2, color: "#FFB45E", delay: 1.9, drift: -13 },
  { left: "12%", top: "84%", size: 3, color: "#FFE4B5", delay: 1.25, drift: 12 },
  { left: "31%", top: "91%", size: 2, color: "#F97316", delay: 0.35, drift: -14 },
  { left: "49%", top: "78%", size: 2, color: "#FFD29A", delay: 1.7, drift: 9 },
  { left: "66%", top: "88%", size: 3, color: "#FFB45E", delay: 0.9, drift: -12 },
  { left: "84%", top: "93%", size: 2, color: "#FFE4B5", delay: 1.55, drift: 15 },
];

const TECHNIQUE_STACK_OFFSET = 8;
const TECHNIQUE_STACK_RELEASE = 260;
const TECHNIQUE_EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

function TechniqueCardMotion({
  children,
  techniqueIdx,
  stackProgress,
  isDimmed,
}: {
  children: ReactNode;
  techniqueIdx: number;
  stackProgress: number;
  isDimmed: boolean;
}) {
  const hasMounted = useRef(false);
  const row = Math.floor(techniqueIdx / 2);
  const column = techniqueIdx % 2;
  const stackRelease = 1 - stackProgress;
  const stackOffset = row * TECHNIQUE_STACK_OFFSET * stackRelease;
  const stackTilt = row === 0
    ? 0
    : (column === 0 ? -1.2 : 1.2) * stackRelease;
  const perspectiveTilt = -(11 + row * 0.8) * stackRelease;
  const convergeX = (column === 0 ? -1 : 1) * row * 1.5 * stackRelease;

  useEffect(() => {
    hasMounted.current = true;
  }, []);

  return (
    <motion.div
      className="technique-stack-card relative w-full"
      style={{
        transformOrigin: "top center",
        transformStyle: "preserve-3d",
        willChange: "transform, opacity, filter",
        zIndex: TECHNIQUES.length - techniqueIdx,
      }}
      initial={{
        opacity: 0,
        x: convergeX,
        y: 44 - stackOffset,
        rotateX: perspectiveTilt + 16,
        rotateZ: stackTilt + (column === 0 ? -1.8 : 1.8),
        scale: 0.94,
        filter: "blur(6px)",
        transformPerspective: 680,
      }}
      animate={{
        opacity: isDimmed ? 0.24 : 1,
        x: convergeX,
        y: -stackOffset,
        rotateX: perspectiveTilt,
        rotateZ: stackTilt,
        scale: 1,
        filter: "blur(0px)",
        transformPerspective: 680,
      }}
      transition={hasMounted.current
        ? { duration: 0.2, ease: "easeOut" }
        : {
            duration: 0.9 + row * 0.06,
            delay: 0.1 + techniqueIdx * 0.07,
            ease: TECHNIQUE_EASE,
          }}
    >
      {children}
    </motion.div>
  );
}

function TechniqueAtmosphere() {
  const reducedMotion = useReducedMotion();

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
      style={{
        background: [
          "radial-gradient(ellipse 90% 42% at 50% 42%, rgba(245,158,11,.08), transparent 70%)",
          "linear-gradient(90deg, rgba(168,183,194,.025) 1px, transparent 1px), linear-gradient(rgba(168,183,194,.02) 1px, transparent 1px)",
        ].join(", "),
        backgroundSize: "auto, 46px 46px",
      }}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-50"
        style={{
          background: "radial-gradient(ellipse 68% 42% at 50% 42%, transparent 0%, transparent 54%, rgba(8,19,32,.36) 88%, rgba(8,19,32,.72) 100%)",
        }}
      />
      <div
        className="absolute left-1/2 top-[42%] h-0 w-0"
        style={{ transform: "translate(-50%, -50%)" }}
      >
        {TECHNIQUE_RINGS.map((ring, index) => {
          const isArc = index % 3 === 1;
          const conicStart = (index * 29) % 360;
          return (
            <div
              key={`technique-ring-${index}`}
              className="absolute left-1/2 top-1/2 rounded-full"
              style={{
                width: `min(${ring.size}, ${ring.maxSize}px)`,
                height: `min(${ring.size}, ${ring.maxSize}px)`,
                transform: "translate(-50%, -50%)",
              }}
            >
              <motion.div
                className="absolute inset-0 rounded-full"
                initial={{ rotate: 0, scale: 1, opacity: ring.opacity * 0.68 }}
                animate={reducedMotion
                  ? { rotate: 0, scale: 1, opacity: ring.opacity }
                  : {
                      rotate: ring.direction * 360,
                      scale: ring.scale,
                      opacity: [ring.opacity * 0.68, ring.opacity, ring.opacity * 0.68],
                    }}
                transition={reducedMotion
                  ? { duration: 0 }
                  : {
                      rotate: { duration: ring.duration, repeat: Infinity, ease: "linear" },
                      scale: { duration: ring.duration * 0.62, repeat: Infinity, ease: "easeInOut" },
                      opacity: { duration: ring.duration * 0.62, repeat: Infinity, ease: "easeInOut" },
                    }}
                style={{
                  border: isArc ? "0.5px solid transparent" : "0.5px solid",
                  borderColor: isArc ? "transparent" : ring.color,
                  background: isArc
                    ? `conic-gradient(from ${conicStart}deg, ${ring.color} 0deg 52deg, transparent 52deg 128deg, ${ring.color} 128deg 176deg, transparent 176deg 360deg)`
                    : "transparent",
                  maskImage: isArc
                    ? "radial-gradient(circle, transparent 95.5%, #000 96.5%, #000 98%, transparent 99%)"
                    : undefined,
                  WebkitMaskImage: isArc
                    ? "radial-gradient(circle, transparent 95.5%, #000 96.5%, #000 98%, transparent 99%)"
                    : undefined,
                }}
              />
            </div>
          );
        })}
        <div
          className="absolute left-1/2 top-1/2 rounded-full"
          style={{
            width: "min(150vw, 728px)",
            height: "min(150vw, 728px)",
            transform: "translate(-50%, -50%)",
          }}
        >
          <motion.div
            className="absolute inset-0 rounded-full"
            initial={{ rotate: 0, opacity: 0.42 }}
            animate={reducedMotion
              ? { rotate: 0, opacity: 0.42 }
              : { rotate: 360, opacity: [0.42, 0.76, 0.42] }}
            transition={reducedMotion
              ? { duration: 0 }
              : {
                  rotate: { duration: 36, repeat: Infinity, ease: "linear" },
                  opacity: { duration: 5.5, repeat: Infinity, ease: "easeInOut" },
                }}
            style={{
              background: "repeating-conic-gradient(from 8deg, rgba(208,220,226,.62) 0deg 1.2deg, transparent 1.2deg 10deg)",
              maskImage: "radial-gradient(circle, transparent 96%, #000 96.8%, #000 98.2%, transparent 99%)",
              WebkitMaskImage: "radial-gradient(circle, transparent 96%, #000 96.8%, #000 98.2%, transparent 99%)",
            }}
          />
        </div>
        <div
          className="absolute left-1/2 top-1/2 rounded-full"
          style={{
            width: "min(112vw, 542px)",
            height: "min(112vw, 542px)",
            transform: "translate(-50%, -50%)",
          }}
        >
          <motion.div
            className="absolute inset-0 rounded-full"
            initial={{ rotate: 0, opacity: 0.24 }}
            animate={reducedMotion
              ? { rotate: 0, opacity: 0.24 }
              : { rotate: -360, opacity: [0.18, 0.34, 0.18] }}
            transition={reducedMotion
              ? { duration: 0 }
              : {
                  rotate: { duration: 26, repeat: Infinity, ease: "linear" },
                  opacity: { duration: 6, repeat: Infinity, ease: "easeInOut" },
                }}
            style={{
              background: "repeating-conic-gradient(from 2deg, rgba(216,226,231,.5) 0deg 0.8deg, transparent 0.8deg 13deg)",
              maskImage: "radial-gradient(circle, transparent 91%, #000 91.8%, #000 94%, transparent 94.8%)",
              WebkitMaskImage: "radial-gradient(circle, transparent 91%, #000 91.8%, #000 94%, transparent 94.8%)",
            }}
          />
        </div>
        {TECHNIQUE_TICK_RINGS.map((tickRing, index) => (
          <div
            key={`technique-tick-ring-${index}`}
            className="absolute left-1/2 top-1/2 rounded-full"
            style={{
              width: `min(${tickRing.size}, ${tickRing.maxSize}px)`,
              height: `min(${tickRing.size}, ${tickRing.maxSize}px)`,
              transform: "translate(-50%, -50%)",
            }}
          >
            <motion.div
              className="absolute inset-0 rounded-full"
              initial={{ rotate: tickRing.start, opacity: tickRing.opacity }}
              animate={reducedMotion
                ? { rotate: tickRing.start, opacity: tickRing.opacity }
                : { rotate: tickRing.direction * 360 + tickRing.start, opacity: [tickRing.opacity * 0.7, tickRing.opacity, tickRing.opacity * 0.7] }}
              transition={reducedMotion
                ? { duration: 0 }
                : {
                    rotate: { duration: tickRing.duration, repeat: Infinity, ease: "linear" },
                    opacity: { duration: tickRing.duration * 0.55, repeat: Infinity, ease: "easeInOut" },
                  }}
              style={{
                background: `repeating-conic-gradient(from ${tickRing.start}deg, rgba(201,213,222,.72) 0deg 0.8deg, transparent 0.8deg ${tickRing.spacing}deg)`,
                maskImage: "radial-gradient(circle, transparent 90.5%, #000 91.2%, #000 94%, transparent 94.8%)",
                WebkitMaskImage: "radial-gradient(circle, transparent 90.5%, #000 91.2%, #000 94%, transparent 94.8%)",
              }}
            >
            </motion.div>
          </div>
        ))}
      </div>

      {TECHNIQUE_PARTICLES.map((particle, index) => (
        <motion.span
          key={`technique-particle-${index}`}
          className="absolute z-[2] rounded-full"
          initial={false}
          animate={reducedMotion
            ? { opacity: 0.52, scale: 1 }
            : { opacity: [0.28, 0.92, 0.28], scale: [0.72, 1.18, 0.72] }}
          transition={reducedMotion
            ? { duration: 0 }
            : { duration: 3.2 + (index % 5) * 0.32, delay: particle.delay, repeat: Infinity, ease: "easeInOut" }}
          style={{
            left: particle.left,
            top: particle.top,
            width: particle.size,
            height: particle.size,
            background: particle.color,
            boxShadow: `0 0 8px 2px ${particle.color}`,
            mixBlendMode: "screen",
          }}
        />
      ))}
    </div>
  );
}

function InstrumentGear({
  left,
  top,
  size,
  duration,
  direction,
  accent,
}: {
  left: string;
  top: string;
  size: string;
  duration: number;
  direction: 1 | -1;
  accent: string;
}) {
  const reducedMotion = useReducedMotion();
  const animate = reducedMotion ? { rotate: 0, opacity: 0.28 } : { rotate: direction * 360, opacity: [0.16, 0.38, 0.16] };
  const transition = reducedMotion
    ? { duration: 0 }
    : {
        rotate: { duration, repeat: Infinity, ease: "linear" },
        opacity: { duration: duration * 0.4, repeat: Infinity, ease: "easeInOut" },
      };

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute z-0 rounded-full"
      style={{ left, top, width: size, height: size, transform: "translate(-50%, -50%)" }}
    >
      <motion.div
        className="absolute inset-0 rounded-full"
        animate={animate}
        transition={transition}
        style={{
          background: `repeating-conic-gradient(from 7deg, ${accent} 0deg 4deg, transparent 4deg 16deg)`,
          maskImage: "radial-gradient(circle, transparent 95.8%, #000 96.4%, #000 97.3%, transparent 97.9%)",
          WebkitMaskImage: "radial-gradient(circle, transparent 95.8%, #000 96.4%, #000 97.3%, transparent 97.9%)",
        }}
      />
      <motion.div
        className="absolute inset-[8%] rounded-full"
        animate={reducedMotion ? { rotate: 0 } : { rotate: direction * -360 }}
        transition={reducedMotion ? { duration: 0 } : { duration: duration * 1.34, repeat: Infinity, ease: "linear" }}
        style={{
          background: `conic-gradient(from 18deg, ${accent} 0deg 24deg, transparent 24deg 76deg, rgba(249,115,22,.35) 76deg 98deg, transparent 98deg 188deg, ${accent} 188deg 206deg, transparent 206deg 360deg)`,
          maskImage: "radial-gradient(circle, transparent 78%, #000 79.5%, #000 83%, transparent 84.5%)",
          WebkitMaskImage: "radial-gradient(circle, transparent 78%, #000 79.5%, #000 83%, transparent 84.5%)",
        }}
      />
      <motion.div
        className="absolute inset-[17%] rounded-full"
        animate={reducedMotion ? { rotate: 0 } : { rotate: direction * 360 }}
        transition={reducedMotion ? { duration: 0 } : { duration: duration * 0.72, repeat: Infinity, ease: "linear" }}
        style={{
          background: "repeating-conic-gradient(from 3deg, rgba(224,232,237,.5) 0deg 2.4deg, transparent 2.4deg 20deg)",
          maskImage: "radial-gradient(circle, transparent 86%, #000 87%, #000 91%, transparent 92%)",
          WebkitMaskImage: "radial-gradient(circle, transparent 86%, #000 87%, #000 91%, transparent 92%)",
        }}
      />
    </div>
  );
}

function MainLikeInstrumentAtmosphere() {
  const reducedMotion = useReducedMotion();
  const particles = [
    { left: "4%", top: "13%", size: 4, color: "#EF4444", delay: 0 },
    { left: "96%", top: "18%", size: 5, color: "#F97316", delay: 0.8 },
    { left: "3%", top: "36%", size: 3, color: "#F43F5E", delay: 1.4 },
    { left: "97%", top: "43%", size: 4, color: "#EA580C", delay: 0.4 },
    { left: "4%", top: "61%", size: 5, color: "#F97316", delay: 1.8 },
    { left: "96%", top: "67%", size: 3, color: "#EF4444", delay: 1.1 },
    { left: "12%", top: "91%", size: 4, color: "#F43F5E", delay: 2.2 },
    { left: "88%", top: "93%", size: 5, color: "#F97316", delay: 0.6 },
  ];

  const spin = (duration: number, direction: 1 | -1 = 1) => reducedMotion
    ? { rotate: 0, opacity: 0.28 }
    : { rotate: direction * 360, opacity: [0.16, 0.42, 0.16] };
  const transition = (duration: number) => reducedMotion
    ? { duration: 0 }
    : {
        rotate: { duration, repeat: Infinity, ease: "linear" },
        opacity: { duration: duration * 0.32, repeat: Infinity, ease: "easeInOut" },
      };

  return (
    <div
      aria-hidden="true"
      className="technique-atmosphere pointer-events-none absolute inset-0 z-0 overflow-hidden"
      style={{
        transform: "translate3d(0, 8%, 0)",
        WebkitTransform: "translate3d(0, 8%, 0)",
        WebkitBackfaceVisibility: "hidden",
        background: [
          "radial-gradient(ellipse 76% 42% at 50% 42%, rgba(245,158,11,.12), transparent 68%)",
          "radial-gradient(ellipse 58% 34% at 50% 43%, rgba(255,237,170,.06), transparent 66%)",
        ].join(", "),
      }}
    >
      <div
        className="technique-atmosphere-rings pointer-events-none absolute left-1/2 top-[42%] h-0 w-0"
        style={{
          opacity: 0.92,
          transform: "translate3d(-50%, -50%, 0)",
          WebkitTransform: "translate3d(-50%, -50%, 0)",
          WebkitBackfaceVisibility: "hidden",
        }}
      >
        <motion.div
          className="absolute left-1/2 top-1/2 h-[640px] w-[640px] -translate-x-1/2 -translate-y-1/2 rounded-full"
          animate={reducedMotion ? { opacity: 0.2, scale: 1 } : { opacity: [0.12, 0.28, 0.12], scale: [0.96, 1.03, 0.96] }}
          transition={reducedMotion ? { duration: 0 } : { duration: 4.8, repeat: Infinity, ease: "easeInOut" }}
          style={{
            background: "radial-gradient(circle, rgba(249,115,22,.3) 0%, rgba(245,158,11,.12) 34%, transparent 70%)",
            filter: "blur(18px)",
          }}
        />
        <div
          className="absolute left-1/2 top-1/2 h-[620px] w-[620px] rounded-full"
          style={{
            left: "50%",
            top: "50%",
            transform: "translate(-50%, -50%)",
          }}
        >
          <motion.div
            className="absolute inset-0 rounded-full"
            animate={spin(18, 1)}
            transition={transition(18)}
            style={{
              background: "repeating-conic-gradient(from 8deg, rgba(224,232,237,.58) 0deg 4.2deg, transparent 4.2deg 17deg)",
              maskImage: "radial-gradient(circle, transparent 95.4%, #000 96%, #000 97.1%, transparent 97.8%)",
              WebkitMaskImage: "radial-gradient(circle, transparent 95.4%, #000 96%, #000 97.1%, transparent 97.8%)",
            }}
          />
        </div>
        <motion.div
          className="absolute left-1/2 top-1/2 h-[592px] w-[592px] -translate-x-1/2 -translate-y-1/2 rounded-full border-[0.5px]"
          animate={spin(22, -1)}
          transition={transition(22)}
          style={{
            borderColor: "rgba(255,224,166,.2)",
            borderTopColor: "rgba(255,237,170,.48)",
            borderLeftColor: "rgba(249,115,22,.3)",
          }}
        />
        <motion.div
          className="absolute left-1/2 top-1/2 h-[564px] w-[564px] -translate-x-1/2 -translate-y-1/2 rounded-full"
          animate={spin(24, -1)}
          transition={transition(24)}
          style={{
            background: "conic-gradient(from 20deg, transparent 0deg, rgba(255,237,170,.48) 40deg, transparent 78deg, transparent 174deg, rgba(249,115,22,.32) 218deg, transparent 266deg)",
            maskImage: "radial-gradient(circle, transparent 67%, #000 69%, #000 73%, transparent 76%)",
            WebkitMaskImage: "radial-gradient(circle, transparent 67%, #000 69%, #000 73%, transparent 76%)",
          }}
        />
        <div
          className="absolute left-1/2 top-1/2 h-[536px] w-[536px] rounded-full"
          style={{
            left: "50%",
            top: "50%",
            transform: "translate(-50%, -50%)",
          }}
        >
          <motion.div
            className="absolute inset-0 rounded-full"
            animate={spin(15, 1)}
            transition={transition(15)}
            style={{
              background: "repeating-conic-gradient(from -18deg, rgba(255,224,166,.52) 0deg 5deg, transparent 5deg 20deg)",
              maskImage: "radial-gradient(circle, transparent 95.2%, #000 95.9%, #000 97%, transparent 97.7%)",
              WebkitMaskImage: "radial-gradient(circle, transparent 95.2%, #000 95.9%, #000 97%, transparent 97.7%)",
            }}
          />
        </div>
        <motion.div
          className="absolute left-1/2 top-1/2 h-[510px] w-[510px] -translate-x-1/2 -translate-y-1/2 rounded-full"
          animate={spin(12, 1)}
          transition={transition(12)}
          style={{
            background: "repeating-conic-gradient(from 4deg, rgba(255,215,145,.38) 0deg 1.5deg, transparent 1.5deg 14deg)",
            maskImage: "radial-gradient(circle, transparent 65%, #000 67%, #000 70%, transparent 73%)",
            WebkitMaskImage: "radial-gradient(circle, transparent 65%, #000 67%, #000 70%, transparent 73%)",
          }}
        />
        <motion.div
          className="absolute left-1/2 top-1/2 h-[486px] w-[486px] -translate-x-1/2 -translate-y-1/2 rounded-full"
          animate={spin(19, -1)}
          transition={transition(19)}
          style={{
            background: "conic-gradient(from -34deg, rgba(255,237,170,.5) 0deg 166deg, transparent 166deg 360deg)",
            maskImage: "radial-gradient(circle, transparent 76%, #000 77.5%, #000 79%, transparent 80.5%)",
            WebkitMaskImage: "radial-gradient(circle, transparent 76%, #000 77.5%, #000 79%, transparent 80.5%)",
          }}
        />
        <motion.div
          className="absolute left-1/2 top-1/2 h-[452px] w-[452px] -translate-x-1/2 -translate-y-1/2 rounded-full border-[0.5px]"
          animate={spin(16, -1)}
          transition={transition(16)}
          style={{
            borderColor: "rgba(255,210,125,.16)",
            borderLeftColor: "rgba(249,115,22,.42)",
            borderBottomColor: "rgba(255,237,170,.28)",
          }}
        />
        <motion.div
          className="absolute left-1/2 top-1/2 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full border-[0.5px]"
          animate={spin(10, 1)}
          transition={transition(10)}
          style={{
            borderColor: "rgba(255,224,166,.16)",
            borderTopColor: "rgba(255,237,170,.42)",
            borderRightColor: "rgba(249,115,22,.3)",
          }}
        />
        <motion.div
          className="absolute left-1/2 top-1/2 h-[394px] w-[394px] -translate-x-1/2 -translate-y-1/2 rounded-full border-[0.5px]"
          animate={spin(7, 1)}
          transition={transition(7)}
          style={{
            borderColor: "rgba(255,248,225,.24)",
            borderTopColor: "rgba(255,255,245,.58)",
            borderLeftColor: "rgba(255,224,166,.34)",
          }}
        />
      </div>

      <InstrumentGear left="calc(17% - 50px)" top="calc(27% + 50px)" size="min(96vw, 464px)" duration={22} direction={-1} accent="rgba(218,226,230,.5)" />
      <InstrumentGear left="84%" top="27%" size="min(88vw, 426px)" duration={19} direction={1} accent="rgba(255,224,166,.54)" />
      <InstrumentGear left="14%" top="73%" size="min(88vw, 426px)" duration={25} direction={1} accent="rgba(249,115,22,.48)" />
      <InstrumentGear left="84%" top="73%" size="min(88vw, 426px)" duration={27} direction={1} accent="rgba(255,224,166,.54)" />

      {particles.map((particle, index) => (
        <motion.span
          key={`main-like-particle-${index}`}
          className="pointer-events-none absolute z-[2] rounded-full"
          initial={false}
          animate={reducedMotion
            ? { opacity: 0.7, scale: 1 }
            : { opacity: [0.35, 0.95, 0.35], scale: [0.78, 1.16, 0.78] }}
          transition={reducedMotion
            ? { duration: 0 }
            : { duration: 3.4 + (index % 4) * 0.45, delay: particle.delay, repeat: Infinity, ease: "easeInOut" }}
          style={{
            left: particle.left,
            top: particle.top,
            width: particle.size,
            height: particle.size,
            background: particle.color,
            boxShadow: `0 0 10px 2px ${particle.color}`,
            mixBlendMode: "screen",
          }}
        />
      ))}
    </div>
  );
}

export default function Techniques() {
  const { userState, todayTechniques, onboardingHighlight } = useAppStore();
  const [, setLocation] = useLocation();
  const [pressedTechnique, setPressedTechnique] = useState<string | null>(null);
  const [stackProgress, setStackProgress] = useState(0);
  const techniquesRef = useRef<HTMLDivElement | null>(null);
  const scrollFrame = useRef<number | null>(null);
  const lastTechniqueActivation = useRef(0);

  const isOnboarding = userState === 'onboarding';
  const hasHighlight = isOnboarding && onboardingHighlight.length > 0;
  const doneCount = TECHNIQUES.filter(t => t.dayKey && todayTechniques[t.dayKey]).length;

  useEffect(() => {
    const page = techniquesRef.current;
    const scrollParent = page?.parentElement;
    if (!scrollParent) return;

    const handleScroll = () => {
      if (scrollFrame.current !== null) {
        cancelAnimationFrame(scrollFrame.current);
      }
      scrollFrame.current = requestAnimationFrame(() => {
        scrollFrame.current = null;
        setStackProgress(Math.min(1, Math.max(0, scrollParent.scrollTop / TECHNIQUE_STACK_RELEASE)));
      });
    };

    handleScroll();
    scrollParent.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      scrollParent.removeEventListener("scroll", handleScroll);
      if (scrollFrame.current !== null) {
        cancelAnimationFrame(scrollFrame.current);
        scrollFrame.current = null;
      }
    };
  }, []);

  const handleTap = (technique: Technique) => {
    if (!technique.route) return;
    setLocation(technique.route);
  };

  const activateTechnique = (technique: Technique) => {
    if (!technique.route) return;
    const now = Date.now();
    if (now - lastTechniqueActivation.current < 450) return;
    lastTechniqueActivation.current = now;
    handleTap(technique);
  };

  return (
    <div ref={techniquesRef} className="relative isolate min-h-full pt-[56px] px-4 pb-24">
      <MainLikeInstrumentAtmosphere />

      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="relative z-10 mb-7 flex items-center justify-between"
      >
        <p className="text-tertiary uppercase tracking-[0.12em]" style={{ fontSize: 14, fontWeight: 500 }}>Техники дня</p>
        <span className="num tabular-nums" style={{ fontSize: 13, color: doneCount === 6 ? '#22C55E' : 'var(--text-secondary)' }}>
          {doneCount} / {TECHNIQUES.length}
        </span>
      </motion.div>

      <div className="technique-stack-list relative z-10 mx-auto -mx-2 grid w-[calc(100%+16px)] grid-cols-2 gap-x-0 gap-y-0">
        {TECHNIQUES.map((t, idx) => {
          const isDone        = Boolean(t.dayKey && todayTechniques[t.dayKey]);
          const isHighlighted = hasHighlight && onboardingHighlight.includes(t.id);
          const isDimmed      = hasHighlight && !onboardingHighlight.includes(t.id);

          return (
            <TechniqueCardMotion
              key={t.id}
              techniqueIdx={idx}
              stackProgress={stackProgress}
              isDimmed={isDimmed}
            >
              <button
                type="button"
                disabled={!t.route}
                 onPointerDown={() => t.route && setPressedTechnique(t.id)}
                 onPointerUp={() => {
                   setPressedTechnique(null);
                   activateTechnique(t);
                 }}
                 onTouchEnd={(event) => {
                   event.preventDefault();
                   activateTechnique(t);
                 }}
                 onClick={() => activateTechnique(t)}
                onPointerCancel={() => setPressedTechnique(null)}
                onPointerLeave={() => setPressedTechnique(null)}
                 onKeyDown={(event) => {
                   if ((event.key === "Enter" || event.key === " ") && t.route) {
                     event.preventDefault();
                     handleTap(t);
                   }
                 }}
                aria-label={t.title}
                 className="group relative flex min-h-[172px] w-full flex-col items-center justify-center overflow-visible rounded-[24px] px-0 py-1 text-center outline-none focus-visible:ring-1 focus-visible:ring-white/40 disabled:cursor-default"
                style={{
                  cursor: t.route && !isDone ? "pointer" : "default",
                   touchAction: "manipulation",
                   WebkitTapHighlightColor: "transparent",
                   zIndex: 1,
                }}
              >
                {isHighlighted && (
                  <motion.span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-2 rounded-[28px] border border-white/25"
                    animate={{ opacity: [0.25, 0.8, 0.25], scale: [0.96, 1.03, 0.96] }}
                    transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
                  />
                )}
                <TechniqueArtwork
                  kind={t.artwork}
                  color={t.color}
                  done={isDone}
                  highlighted={isHighlighted}
                  pressed={pressedTechnique === t.id}
                />
                <h3
                  className="max-w-full px-1 text-primary leading-tight"
                  style={{ fontSize: 12, fontWeight: 300, letterSpacing: "0.06em", textTransform: "uppercase", opacity: isDone ? 0.58 : 0.88, wordBreak: "break-word" }}
                >
                  {t.title}
                </h3>
              </button>
            </TechniqueCardMotion>
          );
        })}
      </div>

      {doneCount === 6 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
           className="relative z-10 mt-4 rounded-[16px] p-4 flex items-center gap-3"
          style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)' }}
        >
          <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
            style={{ background: 'rgba(34,197,94,0.15)' }}>
            <Check size={16} color="#22C55E" />
          </div>
          <p className="body-s" style={{ color: '#22C55E' }}>
            Все техники дня выполнены — день засчитан!
          </p>
        </motion.div>
      )}
    </div>
  );
}
