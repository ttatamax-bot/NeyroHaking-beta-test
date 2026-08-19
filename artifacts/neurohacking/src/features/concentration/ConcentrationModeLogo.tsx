import { motion } from "framer-motion";
import type { ConcentrationMode } from "./config";
import { CONCENTRATION_ACCENT } from "./config";

const INK = CONCENTRATION_ACCENT;
const SOFT = "rgba(249,115,22,.42)";
const STEEL = "rgba(163,195,217,.46)";

function SignalsMark({ large }: { large: boolean }) {
  return (
    <svg viewBox="0 0 72 72" className={large ? "h-[72px] w-[72px]" : "h-[48px] w-[48px]"} role="img" aria-label="Импульсный сигнал">
      <motion.path
        d="M7 37h10l5-15 8 30 8-38 8 25h19"
        fill="none"
        stroke={INK}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2.6"
        initial={{ pathLength: .35, opacity: .55 }}
        animate={{ pathLength: [0.35, 1, .35], opacity: [.55, 1, .55] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.circle
        cx="57"
        cy="37"
        r="4"
        fill={INK}
        animate={{ r: [3, 5, 3], opacity: [.55, 1, .55] }}
        transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.circle cx="57" cy="37" r="9" fill="none" stroke={SOFT} strokeWidth="1" animate={{ scale: [0.7, 1.35], opacity: [0.7, 0] }} transition={{ duration: 1.8, repeat: Infinity, ease: "easeOut" }} />
      <path d="M8 52h56" stroke={STEEL} strokeDasharray="1 5" strokeLinecap="round" strokeWidth="1" />
    </svg>
  );
}

function TrackingMark({ large }: { large: boolean }) {
  return (
    <svg viewBox="0 0 72 72" className={large ? "h-[72px] w-[72px]" : "h-[48px] w-[48px]"} role="img" aria-label="Отслеживание движущихся объектов">
      <path d="M8 52C18 18 28 56 38 25S54 15 65 35" fill="none" stroke={STEEL} strokeDasharray="2 5" strokeLinecap="round" strokeWidth="1.4" />
      <path d="M8 52C18 18 28 56 38 25S54 15 65 35" fill="none" stroke={SOFT} strokeLinecap="round" strokeWidth="1" opacity=".8" />
      <motion.circle cx="14" cy="43" r="5.5" fill={INK} animate={{ cx: [14, 25, 38, 51, 63], cy: [43, 42, 25, 22, 35], opacity: [1, .65, 1, .65, 1] }} transition={{ duration: 3.4, repeat: Infinity, ease: "easeInOut" }} />
      <motion.circle cx="38" cy="25" r="3.5" fill="none" stroke={INK} strokeWidth="1.4" animate={{ r: [3.5, 6, 3.5], opacity: [1, .45, 1] }} transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut", delay: .2 }} />
      <circle cx="60" cy="35" r="3" fill="none" stroke={STEEL} strokeWidth="1.2" />
      <path d="M34 25h8M38 21v8" stroke="#ffe0a6" strokeLinecap="round" strokeWidth="1" />
    </svg>
  );
}

function SearchMark({ large }: { large: boolean }) {
  const points = [
    [14, 18], [27, 18], [40, 18], [53, 18],
    [14, 31], [27, 31], [40, 31], [53, 31],
    [14, 44], [27, 44], [40, 44], [53, 44],
    [14, 57], [27, 57], [40, 57], [53, 57],
  ];

  return (
    <svg viewBox="0 0 72 72" className={large ? "h-[72px] w-[72px]" : "h-[48px] w-[48px]"} role="img" aria-label="Поиск цели среди объектов">
      <g fill={STEEL}>
        {points.map(([cx, cy], index) => <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="1.8" opacity={index % 5 === 0 ? .7 : .38} />)}
      </g>
      <motion.path
        d="M9 10v52"
        stroke={INK}
        strokeLinecap="round"
        strokeWidth="1.4"
        animate={{ x: [0, 48, 0], opacity: [.25, 1, .25] }}
        transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.g animate={{ x: [0, 1.5, 0], y: [0, -1.5, 0], opacity: [.65, 1, .65] }} transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}>
        <path d="m53 39 8 8-8 8-8-8 8-8Z" fill="none" stroke={INK} strokeWidth="1.8" />
        <circle cx="53" cy="47" r="2" fill={INK} />
      </motion.g>
      <path d="M8 64h56" stroke={SOFT} strokeDasharray="1 5" strokeLinecap="round" strokeWidth="1" />
    </svg>
  );
}

export function ConcentrationModeLogo({ mode, large = false }: { mode: ConcentrationMode; large?: boolean }) {
  if (mode === "signals") return <SignalsMark large={large} />;
  if (mode === "tracking") return <TrackingMark large={large} />;
  return <SearchMark large={large} />;
}