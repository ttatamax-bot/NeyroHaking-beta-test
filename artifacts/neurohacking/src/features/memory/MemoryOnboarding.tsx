import { ArrowRight, Brain, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { MEMORY_ACCENT, MEMORY_INTRO, memoryModeMeta, type MemoryMode } from "./config";

interface MemoryOnboardingProps {
  mode?: MemoryMode;
  hub?: boolean;
  onComplete?: () => void;
}

export function MemoryOnboarding({ mode, hub = false, onComplete }: MemoryOnboardingProps) {
  const meta = mode ? memoryModeMeta(mode) : memoryModeMeta("reverse");
  const [step, setStep] = useState(0);

  if (hub) {
    return (
      <>
        <div className="fixed inset-0 z-[50] cursor-pointer" onClick={onComplete} />
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed left-0 right-0 z-[55] flex justify-end px-4 pointer-events-none"
          style={{ top: "38%" }}
          data-testid="memory-hub-onboarding"
        >
          <div className="flex flex-row-reverse items-end gap-2" style={{ maxWidth: "min(300px, calc(100% - 8px))" }}>
            <img
              src="/maxim-avatar.png"
              alt="Максим"
              className="h-11 w-11 shrink-0 rounded-full object-cover"
              style={{ boxShadow: "0 0 0 2px #2563EB" }}
            />
            <div className="flex flex-col items-end gap-[3px]">
              <span className="pr-1 text-[11px] font-bold tracking-wide text-blue-300">Татаринов Максим</span>
              <div
                className="rounded-[16px] rounded-br-[4px] px-4 py-3 text-left"
                style={{ background: "rgba(10,13,26,0.98)", border: "1.5px solid rgba(37,99,235,0.5)", boxShadow: "0 4px 24px rgba(0,0,0,0.6)" }}
              >
                <p className="body leading-snug text-primary">{MEMORY_INTRO}</p>
              </div>
              <span className="mt-0.5 pr-1.5 text-[11px] text-blue-300/45">продолжить →</span>
            </div>
          </div>
        </motion.div>
      </>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] flex items-end justify-center bg-[#061321]/75 px-4 pb-5"
        data-testid="memory-onboarding"
      >
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="w-full max-w-[390px] rounded-[26px] border border-blue-300/15 bg-[#0b2038] p-5 shadow-2xl"
        >
          <div className="mb-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-500/15">
                <Brain size={18} style={{ color: MEMORY_ACCENT }} />
              </div>
              <span className="caption text-tertiary">ПАМЯТЬ · {step + 1}/2</span>
            </div>
            <button type="button" onClick={onComplete} className="rounded-full p-1 text-tertiary" data-testid="button-close-memory-onboarding">
              <X size={18} />
            </button>
          </div>
          <p className="title-m text-primary">{step === 0 ? "Тренировка внимания" : meta.title}</p>
          <p className="body-s mt-3 leading-relaxed text-secondary">{step === 0 ? MEMORY_INTRO : meta.onboarding}</p>
          <button
            type="button"
            onClick={() => (step === 0 ? setStep(1) : onComplete?.())}
            className="mt-6 flex min-h-12 w-full items-center justify-center gap-2 rounded-[15px] text-sm font-semibold text-[#201308]"
            style={{ background: MEMORY_ACCENT }}
            data-testid={step === 0 ? "button-memory-onboarding-next" : "button-memory-onboarding-start"}
          >
            {step === 0 ? "Понятно" : "Начать"}
            <ArrowRight size={17} />
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}