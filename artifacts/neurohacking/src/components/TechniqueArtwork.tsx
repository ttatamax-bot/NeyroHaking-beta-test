import { Check } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";

export type TechniqueArtworkKind =
  | "planner"
  | "visualization"
  | "meditation"
  | "walk"
  | "hobby"
  | "sleep"
  | "memory"
  | "concentration";

interface TechniqueArtworkProps {
  kind: TechniqueArtworkKind;
  color: string;
  done?: boolean;
  highlighted?: boolean;
  pressed?: boolean;
}

const ICON_SIZE = 74;

function iconMotion(reduced: boolean | null, kind: TechniqueArtworkKind, pressed: boolean) {
  if (reduced) return {};
  if (pressed) {
    return {
      animate: {
        y: [0, 2, -1, 0],
        rotate: [0, -3, 2, 0],
        scale: [1, 0.84, 1.06, 0.96],
      },
      transition: {
        duration: 0.48,
        ease: "easeOut" as const,
      },
    };
  }
  const direction = kind === "sleep" || kind === "visualization" ? -1 : 1;
  return {
    animate: {
      y: [0, direction * -5, 0],
      rotate: kind === "meditation" ? [0, 1.5, 0] : [0, direction * 1.4, 0],
      scale: [1, 1.025, 1],
    },
    transition: {
      duration: kind === "concentration" ? 4.8 : 5.8,
      repeat: Infinity,
      ease: "easeInOut" as const,
    },
  };
}

function ArtworkSvg({ kind, color, reduced, pressed }: { kind: TechniqueArtworkKind; color: string; reduced: boolean | null; pressed: boolean }) {
  const common = {
    width: ICON_SIZE,
    height: ICON_SIZE,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: color,
    strokeWidth: 1.5,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    overflow: "visible" as const,
    "aria-hidden": true,
  };

  if (kind === "walk") {
    return (
      <motion.svg {...common} strokeWidth={1.4}>
        <motion.g
          animate={reduced ? undefined : pressed
            ? { opacity: [0.7, 1, 0.78], scale: [1, 1.035, 1], y: [0, -0.8, 0] }
            : { opacity: [0.52, 0.92, 0.52], scale: [0.98, 1.025, 0.98], y: [0.5, 0, 0.5] }}
          transition={pressed
            ? { duration: 0.42, ease: "easeOut" }
            : { duration: 1.9, repeat: Infinity, repeatDelay: 0.6, ease: "easeInOut" }}
          style={{ transformOrigin: "6px 9px" }}
        >
          <path d="M4 16v-2.38C4 11.5 2.97 10.5 3 8c.03-2.72 1.49-6 4.5-6C9.37 2 10 3.8 10 5.5c0 3.11-2 5.66-2 8.68V16a2 2 0 1 1-4 0Z" />
          <path d="M4 13h4" />
        </motion.g>
        <motion.g
          animate={reduced ? undefined : pressed
            ? { opacity: [0.7, 1, 0.78], scale: [1, 1.035, 1], y: [0, -0.8, 0] }
            : { opacity: [0.52, 0.92, 0.52], scale: [0.98, 1.025, 0.98], y: [0.5, 0, 0.5] }}
          transition={pressed
            ? { duration: 0.42, ease: "easeOut", delay: 0.08 }
            : { duration: 1.9, repeat: Infinity, repeatDelay: 0.6, delay: 0.92, ease: "easeInOut" }}
          style={{ transformOrigin: "18px 13px" }}
        >
          <path d="M20 20v-2.38c0-2.12 1.03-3.12 1-5.62-.03-2.72-1.49-6-4.5-6C14.63 6 14 7.8 14 9.5c0 3.11 2 5.66 2 8.68V20a2 2 0 1 0 4 0Z" />
          <path d="M16 17h4" />
        </motion.g>
      </motion.svg>
    );
  }
  if (kind === "hobby") {
    return (
      <motion.svg {...common}>
        <path d="M22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22C12.8417 22 14 22.1163 14 21C14 20.391 13.6832 19.9212 13.3686 19.4544C12.9082 18.7715 12.4523 18.0953 13 17C13.6667 15.6667 14.7778 15.6667 16.4815 15.6667C17.3334 15.6667 18.3334 15.6667 19.5 15.5C21.601 15.1999 22 13.9084 22 12Z" />
        <circle cx="9.5" cy="8.5" r="1.5" />
        <circle cx="16.5" cy="9.5" r="1.5" />
        <path d="M7.125 15H7M7.25 15C7.25 15.1381 7.13807 15.25 7 15.25C6.86193 15.25 6.75 15.1381 6.75 15C6.75 14.8619 6.86193 14.75 7 14.75C7.13807 14.75 7.25 14.8619 7.25 15Z" strokeLinecap="round" strokeLinejoin="round" />
      </motion.svg>
    );
  }

  if (kind === "planner") {
    return (
      <motion.svg {...common}>
        <path d="M4 3H3C2.44772 3 2 3.44772 2 4V18L3.5 21L5 18V4C5 3.44772 4.55228 3 4 3Z" />
        <path d="M21 12.0013V8.00072C21 5.64336 21 4.46468 20.2678 3.73234C19.5355 3 18.357 3 16 3H13C10.643 3 9.46447 3 8.73223 3.73234C8 4.46468 8 5.64336 8 8.00072V16.0019C8 18.3592 8 19.5379 8.73223 20.2703C9.35264 20.8908 10.2934 20.9855 12 21" />
        <motion.g
          animate={reduced ? undefined : { opacity: [0.55, 1, 0.55], x: [0, 1.5, 0] }}
          transition={{ duration: 2.7, repeat: Infinity, ease: "easeInOut" }}
        >
          <path d="M12 7H17" />
          <path d="M12 11H17" />
        </motion.g>
        <motion.path
          d="M14 19C14 19 15.5 19.5 16.5 21C16.5 21 18 17 22 15"
          animate={reduced ? undefined : { pathLength: [0.02, 1], opacity: [0.25, 1] }}
          transition={pressed
            ? { duration: 0.5, ease: "easeOut" }
            : { duration: 2.8, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
        />
        <path d="M2 7H5M2 7H5" />
      </motion.svg>
    );
  }

  if (kind === "visualization") {
    return (
      <motion.svg {...common}>
        <motion.path
          d="M13.5001 22L13.7318 20.8445C13.8936 20.0376 14.5333 19.4121 15.3436 19.2685L16.156 19.1244C17.214 18.9261 17.9047 17.9391 17.6987 16.9201L17.3258 15.0749L18.7846 13.9936C18.9503 13.8708 19.0298 13.6683 18.9898 13.4705C18.9714 13.3797 18.9288 13.295 18.866 13.2249L16.752 10.9684C16.5071 10.707 16.3452 10.3827 16.2275 10.0444C15.5249 8.02369 13.1412 5.11904 8.23162 6.25555C3.07736 7.44871 2.78666 11.9991 3.07736 13.4378C3.46185 15.3407 4.31306 16.452 5.18511 17.4085C6.24497 18.5711 6.26308 20.2323 5.32602 21.4957L4.95195 22"
          animate={reduced ? undefined : pressed
            ? { y: [0, -2.2, 0], rotate: [0, -6, 0], opacity: [0.85, 1, 0.95] }
            : { y: [0, -1.5], rotate: [0, -4.5], opacity: [0.82, 1] }}
          transition={pressed
            ? { duration: 0.5, ease: "easeOut" }
            : { duration: 4.6, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
          style={{ transformOrigin: "12px 15px" }}
        />
        <motion.g
          animate={reduced ? undefined : { scale: [0.9, 1.1, 0.9], opacity: [0.45, 1, 0.45] }}
          transition={{ duration: 2.1, repeat: Infinity, ease: "easeInOut" }}
          style={{ transformOrigin: "19.5px 4.5px" }}
        >
          <path d="M19.5 2.9375V4.5M19.5 4.5V6.0625M19.5 4.5H18.25M19.5 4.5H20.75M22 4.5L20.9156 4.13852C20.4179 3.97263 20.0274 3.58211 19.8615 3.08443L19.5 2L19.1385 3.08443C18.9726 3.58211 18.5821 3.97237 18.0844 4.13852L17 4.5L18.0844 4.86148C18.5821 5.02737 18.9726 5.41789 19.1385 5.91557L19.5 7L19.8615 5.91557C20.0274 5.41789 20.4179 5.02763 20.9156 4.86148L22 4.5Z" />
        </motion.g>
      </motion.svg>
    );
  }

  if (kind === "meditation") {
    return (
      <motion.svg {...common}>
        <motion.g
          animate={reduced ? undefined : pressed
            ? { y: [0, 2, -1, 0], scaleX: [1, 0.92, 1.04, 1] }
            : { y: [0, 1.5, 0], scaleX: [1, 1.025, 1] }}
          transition={pressed
            ? { duration: 0.5, ease: "easeOut" }
            : { duration: 4.2, repeat: Infinity, ease: "easeInOut" }}
          style={{ transformOrigin: "12px 15px" }}
        >
          <path d="M7.88598 10C8.57173 11.3968 9.30442 12.7049 9.1352 14.3142C8.86468 16.8869 5.74512 17.8552 3.75022 19.0404C2.44325 19.8169 2.9319 22 4.53582 22C6.48047 22 8.21607 21.8448 9.9706 21.0201L13.4111 18.9028C13.8887 18.6783 14.4913 18.774 15 19" />
          <path d="M16.0105 10C15.3102 11.3968 14.562 12.7049 14.7348 14.3142C15.0111 16.8869 18.1967 17.8552 20.2339 19.0404C21.5685 19.8169 21.0695 22 19.4316 22C17.4458 22 15.6734 21.8448 13.8817 21.0201L10.3683 18.9028C9.95819 18.714 9.45777 18.7517 9 18.9028" />
          <path d="M3 16C5.44586 16 6.54368 13.2949 6.89335 11.4291C6.98463 10.9421 7.13246 10.4565 7.45625 10.0814C8.55651 8.80674 10.184 8 12 8C13.816 8 15.4435 8.80674 16.5437 10.0814C16.8675 10.4565 17.0154 10.9421 17.1067 11.4291C17.4561 13.2949 18.5541 16 21 16" />
        </motion.g>
        <motion.path
          d="M10 4C10 5.10457 10.8954 6 12 6C13.1046 6 14 5.10457 14 4C14 2.89543 13.1046 2 12 2C10.8954 2 10 2.89543 10 4Z"
          animate={reduced ? undefined : pressed
            ? { y: [0, 1, -1, 0], scale: [1, 0.82, 1.08, 1], opacity: [0.7, 1, 0.8, 1] }
            : { y: [0, 0.8, 0], opacity: [0.65, 1, 0.65] }}
          transition={pressed
            ? { duration: 0.5, ease: "easeOut" }
            : { duration: 3.1, repeat: Infinity, ease: "easeInOut" }}
        />
      </motion.svg>
    );
  }

  if (kind === "sleep") {
    return (
      <motion.svg {...common}>
        <motion.g
          animate={reduced ? undefined : pressed ? { y: [0, -1.2, 0], rotate: [0, -3, 0] } : { y: [0, -0.7, 0], rotate: [0, 2, 0] }}
          transition={pressed
            ? { duration: 0.55, ease: "easeOut" }
            : { duration: 4.8, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
          style={{ transformOrigin: "12px 12px" }}
        >
          <motion.path
            d="M19.5483 18C20.7476 16.9645 21.5819 15.6272 22 14.1756C19.5473 14.4746 17.0369 13.3432 15.7234 11.1113C14.4099 8.87928 14.6664 6.1807 16.1567 4.2463C14.1701 3.75234 11.9929 3.98823 10.0779 5.07295C7.30713 6.64236 5.83056 9.56635 6.0155 12.5"
            animate={reduced ? undefined : { y: [0, -0.5, 0], rotate: [0, 2, 0], opacity: [0.72, 1, 0.72] }}
            transition={{ duration: 3.8, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
            style={{ transformOrigin: "15px 10px" }}
          />
        </motion.g>
        <motion.path
          d="M2 15.3739C3.13649 16.1865 4.59053 16.1865 5.72702 15.3739C6.41225 14.8754 7.31476 14.8754 7.99999 15.3739C9.13648 16.1865 10.6072 16.2049 11.727 15.3924M17 19.6352C15.8635 18.8226 14.4095 18.8226 13.273 19.6352C12.5877 20.1338 11.6685 20.1153 10.9833 19.6167C9.8468 18.8042 8.39277 18.8042 7.27299 19.6167C6.57104 20.1153 5.68524 20.1153 5 19.6167"
          animate={reduced ? undefined : { pathLength: [0.82, 1], opacity: [0.5, 1] }}
          transition={{ duration: 2.6, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
        />
      </motion.svg>
    );
  }

  if (kind === "memory") {
    return (
      <motion.svg {...common}>
        <motion.g
          animate={reduced ? undefined : { scale: [1, 1.05, 1], rotate: [0, -1.5, 0] }}
          transition={{ duration: 3.6, repeat: Infinity, ease: "easeInOut" }}
          style={{ transformOrigin: "12px 12px" }}
        >
          <path d="M16 21.9995V21.4995C16 20.395 16.9321 19.5 17.9223 19.0106C18.8846 18.5349 19.6943 17.7507 19.7965 16.8308L20 14.9995L22 13.9995L19.5 10.2495C19.5 5.94601 16.2049 2.41209 12 2.03317" />
          <path d="M6.5 16.9957V21.9995M6.5 16.9957C5.46656 16.2668 4.60808 15.3063 4 14.1898M6.5 16.9957C7.25065 17.5253 8.09362 17.9326 9 18.189" />
          <motion.g
            animate={reduced ? undefined : pressed
              ? { opacity: [0.45, 1, 0.35, 1], scale: [0.94, 1.04, 0.96, 1] }
              : { opacity: [0.3, 1, 0.3], scale: [0.96, 1, 0.96] }}
            transition={pressed
              ? { duration: 0.65, ease: "easeOut" }
              : { duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
            style={{ transformOrigin: "7px 7px" }}
          >
            <path d="M8 4H6C5.05719 4 4.58579 4 4.29289 4.29289C4 4.58579 4 5.05719 4 6V8C4 8.94281 4 9.41421 4.29289 9.70711C4.58579 10 5.05719 10 6 10H8C8.94281 10 9.41421 10 9.70711 9.70711C10 9.41421 10 9.05719 10 8V6C10 5.05719 9.70711 4.29289 9.29289 4.29289C9 4 9 4 8 4Z" />
            <path d="M5.5 9.99997V12M8.5 9.99997V12M5.5 1.99997V3.99997M8.5 1.99997V3.99997M4 5.49997H2M4 8.49997H2M12 5.49997H10M12 8.49997H10" />
          </motion.g>
        </motion.g>
      </motion.svg>
    );
  }

  return (
    <motion.svg {...common} strokeWidth={1.7}>
      <motion.g
        animate={reduced ? undefined : { rotate: [0, 360] }}
        transition={{ duration: 7.5, repeat: Infinity, ease: "linear" }}
        style={{ transformOrigin: "11px 12px" }}
      >
        <motion.g
          animate={reduced ? undefined : pressed
            ? { scale: [1, 1.06, 1.26, 0.95, 1], opacity: [0.8, 1, 0.16, 0.5, 0.72] }
            : { scale: [1, 1, 1, 1.26, 0.95, 1], opacity: [0.72, 1, 1, 0.12, 0.5, 0.72] }}
          transition={pressed
            ? { duration: 0.7, ease: "easeOut" }
            : { duration: 4.8, repeat: Infinity, ease: "easeInOut", times: [0, 0.48, 0.62, 0.78, 0.88, 1] }}
          style={{ transformOrigin: "11px 12px" }}
        >
          <circle cx="11" cy="12.002" r="8" />
          <path d="M11 11.752V12.002M11.5 12.002C11.5 12.2781 11.2761 12.502 11 12.502C10.7239 12.502 10.5 12.2781 10.5 12.002C10.5 11.7258 10.7239 11.502 11 11.502C11.2761 11.502 11.5 11.7258 11.5 12.002Z" />
          <path d="M11 2.00195V6.00195M11 18.002V22.002M21 12.002L17 12.001M5 12.002H1" />
        </motion.g>
      </motion.g>
    </motion.svg>
  );
}

export function TechniqueArtwork({ kind, color, done = false, highlighted = false, pressed = false }: TechniqueArtworkProps) {
  const reduced = useReducedMotion();
  const animation = iconMotion(reduced, kind, pressed);
  const rgb = color.slice(1).match(/.{2}/g)?.map((part) => parseInt(part, 16)).join(",") ?? "249,115,22";

  return (
    <div className="relative flex h-[clamp(124px,31vw,150px)] w-full items-center justify-center">
      <motion.div
        className="relative flex aspect-square w-[clamp(108px,29vw,136px)] items-center justify-center overflow-visible rounded-[21px] border"
        style={{
          background: `linear-gradient(145deg, rgba(${rgb},0.2), rgba(${rgb},0.07))`,
          borderColor: highlighted ? `${color}a6` : `${color}58`,
          boxShadow: highlighted
            ? `0 0 0 2px ${color}26, 0 0 28px ${color}32, inset 0 1px 0 rgba(255,255,255,0.12)`
            : `0 0 20px ${color}16, inset 0 1px 0 rgba(255,255,255,0.08)`,
        }}
        animate={reduced ? undefined : pressed
          ? { scale: 0.91, y: 2, rotate: -1.2 }
          : { y: [0, -3, 0], scale: [1, 1, 1] }}
        transition={pressed
          ? { duration: 0.18, ease: "easeOut" }
          : { duration: highlighted ? 2.8 : 4.8, repeat: Infinity, ease: "easeInOut" }}
      >
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute h-20 w-20 rounded-full blur-2xl"
          style={{ background: `rgba(${rgb},0.42)` }}
          animate={reduced ? undefined : pressed
            ? { scale: [0.8, 1.35, 0.95], opacity: [0.35, 0.9, 0.45] }
            : { scale: [0.72, 1.12, 0.72], opacity: [0.3, 0.62, 0.3] }}
          transition={pressed
            ? { duration: 0.48, ease: "easeOut" }
            : { duration: highlighted ? 2.2 : 4.2, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute inset-2 rounded-[16px] border"
          style={{ borderColor: `${color}26` }}
          animate={reduced ? undefined : { opacity: [0.35, 0.8, 0.35], scale: [0.98, 1, 0.98] }}
          transition={{ duration: 3.4, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="relative z-10"
          {...animation}
          style={{ color, filter: `drop-shadow(0 0 12px ${color}88)` }}
        >
          <ArtworkSvg kind={kind} color={color} reduced={reduced} pressed={pressed} />
        </motion.div>
        {done && (
          <motion.span
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="absolute -right-2 -top-2 z-20 flex h-7 w-7 items-center justify-center rounded-full border"
            style={{ color, borderColor: `${color}99`, background: `${color}26` }}
            aria-label="Выполнено"
          >
            <Check size={14} strokeWidth={2.2} />
          </motion.span>
        )}
      </motion.div>
    </div>
  );
}