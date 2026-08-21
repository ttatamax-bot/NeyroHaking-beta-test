import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState, type ReactNode } from "react";

const STACK_OFFSET = 76;
const STACK_RELEASE = 300;
const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

export function PracticeCardRings({ color, index }: { color: string; index: number }) {
  const reducedMotion = useReducedMotion();
  const direction = index % 2 === 0 ? 1 : -1;
  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden rounded-[20px]" aria-hidden="true">
      <motion.div
        className="absolute rounded-full border"
        style={{
          width: 250 - (index % 3) * 18,
          height: 250 - (index % 3) * 18,
          right: -66 + index * 8,
          top: -92 + index * 10,
          borderColor: `${color}68`,
          boxShadow: `0 0 32px ${color}28`,
        }}
        animate={reducedMotion ? { rotate: 0, opacity: 0.5 } : { rotate: direction * 360, opacity: [0.38, 0.68, 0.38] }}
        transition={reducedMotion ? { duration: 0.3 } : { rotate: { duration: 19 + index * 2, repeat: Infinity, ease: "linear" }, opacity: { duration: 4.2, repeat: Infinity, ease: "easeInOut" } }}
      />
      <motion.svg
        className="absolute"
        width={218 - index * 8}
        height={218 - index * 8}
        viewBox={`0 0 ${218 - index * 8} ${218 - index * 8}`}
        style={{ right: -42 + index * 5, top: -68 + index * 6, filter: `drop-shadow(0 0 12px ${color}55)` }}
        animate={reducedMotion ? { rotate: 0, opacity: 0.3 } : { rotate: direction * -360, opacity: [0.22, 0.48, 0.22] }}
        transition={reducedMotion ? { duration: 0.3 } : { rotate: { duration: 24 + index * 2, repeat: Infinity, ease: "linear" }, opacity: { duration: 3.5, repeat: Infinity, ease: "easeInOut" } }}
      >
        <circle
          cx={(218 - index * 8) / 2}
          cy={(218 - index * 8) / 2}
          r={(218 - index * 8) / 2 - 4}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeDasharray={index % 2 ? "13 9" : "8 14"}
          opacity=".7"
        />
      </motion.svg>
      <motion.svg
        className="absolute"
        width={148 - index * 5}
        height={148 - index * 5}
        viewBox={`0 0 ${148 - index * 5} ${148 - index * 5}`}
        style={{ right: 2 + index * 5, top: -10 + index * 4 }}
        animate={reducedMotion ? { rotate: 0, opacity: 0.25 } : { rotate: direction * 360, opacity: [0.2, 0.4, 0.2] }}
        transition={reducedMotion ? { duration: 0.3 } : { rotate: { duration: 13 + index, repeat: Infinity, ease: "linear" }, opacity: { duration: 2.8, repeat: Infinity, ease: "easeInOut" } }}
      >
        <circle
          cx={(148 - index * 5) / 2}
          cy={(148 - index * 5) / 2}
          r={(148 - index * 5) / 2 - 3}
          fill="none"
          stroke={color}
          strokeWidth="1.2"
          strokeDasharray="2 9"
          opacity=".7"
        />
      </motion.svg>
    </div>
  );
}

function PracticeCardMotion({
  children,
  index,
  stackOffset,
  perspectiveTilt,
  stackTilt,
}: {
  children: ReactNode;
  index: number;
  stackOffset: number;
  perspectiveTilt: number;
  stackTilt: number;
}) {
  const hasMounted = useRef(false);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    hasMounted.current = true;
  }, []);

  return (
    <motion.div
      className="relative w-full"
      style={{
        transformOrigin: "top center",
        transformStyle: "preserve-3d",
        willChange: "transform, opacity, filter",
        zIndex: index + 1,
      }}
      initial={reducedMotion ? false : {
        opacity: 0,
        y: 58 - stackOffset,
        rotateX: perspectiveTilt + 18,
        rotateZ: stackTilt + (index % 2 === 0 ? -2.5 : 2.5),
        scale: 0.94,
        filter: "blur(7px)",
        transformPerspective: 560,
      }}
      animate={{
        opacity: 1,
        y: -stackOffset,
        rotateX: perspectiveTilt,
        rotateZ: stackTilt,
        scale: 1,
        filter: "blur(0px)",
        transformPerspective: 560,
      }}
      transition={reducedMotion ? { duration: 0 } : hasMounted.current
        ? { duration: 0.18, ease: "easeOut" }
        : { duration: 1.05 + index * 0.07, delay: 0.12 + index * 0.11, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

export function PracticeCardStack<T>({
  items,
  renderCard,
}: {
  items: T[];
  renderCard: (item: T, index: number) => ReactNode;
}) {
  const [stackProgress, setStackProgress] = useState(0);
  const scrollFrame = useRef<number | null>(null);
  const stackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stack = stackRef.current;
    if (!stack) return;

    let scrollParent = document.querySelector<HTMLElement>('[data-testid="app-scroll-shell"]');
    if (!scrollParent) {
      scrollParent = stack.parentElement;
      while (scrollParent && scrollParent !== document.body) {
        const overflowY = window.getComputedStyle(scrollParent).overflowY;
        if ((overflowY === "auto" || overflowY === "scroll") && scrollParent.scrollHeight > scrollParent.clientHeight) break;
        scrollParent = scrollParent.parentElement;
      }
    }
    if (!scrollParent) return;

    const handleParentScroll = () => {
      const availableScroll = Math.max(1, scrollParent!.scrollHeight - scrollParent!.clientHeight);
      const releaseDistance = Math.min(STACK_RELEASE, availableScroll);
      const nextProgress = Math.min(1, Math.max(0, scrollParent!.scrollTop / releaseDistance));
      if (scrollFrame.current !== null) cancelAnimationFrame(scrollFrame.current);
      scrollFrame.current = requestAnimationFrame(() => {
        scrollFrame.current = null;
        setStackProgress(nextProgress);
      });
    };

    scrollParent.addEventListener("scroll", handleParentScroll, { passive: true });
    handleParentScroll();
    return () => {
      scrollParent?.removeEventListener("scroll", handleParentScroll);
      if (scrollFrame.current !== null) cancelAnimationFrame(scrollFrame.current);
    };
  }, []);

  return (
    <div
      ref={stackRef}
      className="relative w-full space-y-3 overflow-x-hidden pb-[calc(120px+env(safe-area-inset-bottom,0px))]"
      style={{ perspective: "560px", touchAction: "pan-y" }}
      data-testid="practice-card-stack"
    >
      {items.map((item, index) => {
        const stackRelease = 1 - stackProgress;
        const stackOffset = index * STACK_OFFSET * stackRelease;
        // Practice cards should keep a level horizon while preserving the
        // Academy-style depth reveal and vertical stacking.
        const stackTilt = 0;
        const perspectiveTilt = -(16 + index * 0.5) * stackRelease;

        return (
          <PracticeCardMotion
            key={index}
            index={index}
            stackOffset={stackOffset}
            perspectiveTilt={perspectiveTilt}
            stackTilt={stackTilt}
          >
            {renderCard(item, index)}
          </PracticeCardMotion>
        );
      })}
    </div>
  );
}