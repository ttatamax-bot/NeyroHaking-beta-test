import { motion } from "framer-motion";
import type { ConcentrationMode } from "./config";
import { CONCENTRATION_ACCENT } from "./config";

const INK = CONCENTRATION_ACCENT;
const SOFT = "rgba(249,115,22,.42)";
const STEEL = "rgba(163,195,217,.46)";
const SIGNAL_COLORS = ["#F97316", "#EF4444", "#22C55E", "#3B82F6", "#EAB308"];

function SignalsMark({ large }: { large: boolean }) {
  return (
    <svg viewBox="0 0 72 72" className={large ? "h-[86px] w-[86px]" : "h-[58px] w-[58px]"} role="img" aria-label="Разноцветные сигналы, среди которых только один оранжевый">
      {SIGNAL_COLORS.map((color, index) => {
        const cx = 10 + index * 13;
        const cy = index % 2 === 0 ? 36 : 32;
        const isTarget = index === 0;
        return (
          <motion.g key={color} animate={{ y: isTarget ? [0, -2, 0] : [0, index % 2 ? 1.5 : -1.5, 0], opacity: isTarget ? [1, .72, 1] : [.48, .8, .48] }} transition={{ duration: isTarget ? 1.1 : 1.8 + index * .12, repeat: Infinity, ease: "easeInOut", delay: index * .08 }}>
            <circle cx={cx} cy={cy} r={isTarget ? 6 : 4.7} fill={color} fillOpacity={isTarget ? .95 : .38} />
            <circle cx={cx} cy={cy} r={isTarget ? 9 : 6.5} fill="none" stroke={color} strokeOpacity={isTarget ? .7 : .22} strokeWidth="1" />
          </motion.g>
        );
      })}
      <motion.circle cx="10" cy="36" r="13" fill="none" stroke={INK} strokeWidth="1" animate={{ scale: [.72, 1.18], opacity: [.7, 0] }} transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" }} />
    </svg>
  );
}

function TrackingMark({ large }: { large: boolean }) {
  return (
    <svg viewBox="0 0 72 72" className={large ? "h-[86px] w-[86px]" : "h-[58px] w-[58px]"} role="img" aria-label="Летающие объекты, среди которых одна оранжевая цель">
      <motion.circle cx="13" cy="50" r="4" fill={STEEL} animate={{ cx: [13, 26, 43, 58, 13], cy: [50, 17, 48, 23, 50], opacity: [.35, .7, .35] }} transition={{ duration: 4.2, repeat: Infinity, ease: "easeInOut" }} />
      <motion.circle cx="25" cy="18" r="5" fill={STEEL} animate={{ cx: [25, 40, 57, 29, 25], cy: [18, 43, 19, 55, 18], opacity: [.45, .75, .45] }} transition={{ duration: 3.7, repeat: Infinity, ease: "easeInOut", delay: .2 }} />
      <motion.circle cx="55" cy="51" r="3.7" fill={STEEL} animate={{ cx: [55, 42, 17, 51, 55], cy: [51, 27, 34, 12, 51], opacity: [.35, .7, .35] }} transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: .45 }} />
      <motion.circle cx="48" cy="24" r="4.2" fill={STEEL} animate={{ cx: [48, 18, 36, 60, 48], cy: [24, 38, 15, 44, 24], opacity: [.4, .7, .4] }} transition={{ duration: 3.9, repeat: Infinity, ease: "easeInOut", delay: .65 }} />
      <motion.circle cx="34" cy="38" r="6" fill={INK} animate={{ cx: [34, 50, 22, 40, 34], cy: [38, 52, 23, 12, 38], scale: [1, 1.18, 1] }} transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }} />
      <motion.circle cx="34" cy="38" r="10" fill="none" stroke={SOFT} strokeWidth="1" animate={{ scale: [.7, 1.25], opacity: [.6, 0] }} transition={{ duration: 1.8, repeat: Infinity, ease: "easeOut" }} />
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
    <svg viewBox="0 0 72 72" className={large ? "h-[86px] w-[86px]" : "h-[58px] w-[58px]"} role="img" aria-label="Поиск цели среди объектов">
      <g fill={STEEL}>
        {points.map(([cx, cy], index) => <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="2.2" opacity={index % 5 === 0 ? .7 : .38} />)}
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
    </svg>
  );
}

export function ConcentrationModeLogo({ mode, large = false }: { mode: ConcentrationMode; large?: boolean }) {
  if (mode === "signals") return <SignalsMark large={large} />;
  if (mode === "tracking") return <TrackingMark large={large} />;
  return <SearchMark large={large} />;
}