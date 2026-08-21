import { ChevronLeft } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { TechniqueArtwork, type TechniqueArtworkKind } from "./TechniqueArtwork";

interface TechniqueHeaderProps {
  title: string;
  kind: TechniqueArtworkKind;
  color: string;
  onBack?: () => void;
  backTestId: string;
}

export function TechniqueGameHeader({
  title,
  kind,
  color,
  onBack,
  backTestId,
}: TechniqueHeaderProps) {
  const reduceMotion = useReducedMotion();

  return (
    <header className="relative mb-8 flex min-h-[166px] items-start justify-center pt-1">
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="absolute left-0 top-1 z-10 p-1 text-tertiary"
          aria-label="Назад"
          data-testid={backTestId}
        >
          <ChevronLeft size={28} />
        </button>
      )}
      <div className="flex flex-col items-center">
        <div className="relative flex h-[132px] w-[132px] items-center justify-center">
          <motion.svg
            viewBox="0 0 132 132"
            className="pointer-events-none absolute inset-0 h-full w-full"
            animate={reduceMotion ? { rotate: 0 } : { rotate: 360 }}
            transition={reduceMotion ? { duration: 0 } : { duration: 20, repeat: Infinity, ease: "linear" }}
            aria-hidden="true"
          >
            <circle cx="66" cy="66" r="60" fill="none" stroke={`${color}50`} strokeWidth="1" strokeDasharray="3 9" />
            <circle cx="66" cy="66" r="51" fill="none" stroke="rgba(183,206,228,.22)" strokeWidth="1" strokeDasharray="28 17 5 12" />
          </motion.svg>
          <TechniqueArtwork kind={kind} color={color} bare />
        </div>
        <p className="mt-0 max-w-[290px] text-center text-[13px] font-semibold uppercase leading-tight tracking-[0.13em]" style={{ color }}>
          {title}
        </p>
      </div>
    </header>
  );
}