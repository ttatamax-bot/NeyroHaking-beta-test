import { LockKeyhole } from "lucide-react";
import { motion } from "framer-motion";
import {
  CONCENTRATION_ACCENT,
  CONCENTRATION_ACCENT_BORDER,
  CONCENTRATION_KEYS_COST,
  CONCENTRATION_MODES,
  type ConcentrationMode,
} from "./config";
import { ConcentrationModeLogo } from "./ConcentrationModeLogo";
import { ConcentrationOnboarding } from "./ConcentrationOnboarding";
import { TechniqueGameHeader } from "@/components/TechniqueGameHeader";
import { PracticeCardRings, PracticeCardStack } from "@/components/PracticeCardStack";

const CARD_STYLE = {
  background: "linear-gradient(135deg, #3a2f23 0%, #1d2b3b 56%, #162638 100%)",
  border: "1px solid rgba(245,158,11,0.30)",
  boxShadow: "0 8px 32px rgba(0,0,0,0.68), 0 0 0 1px rgba(255,255,255,0.1), 0 1px 0 rgba(255,255,255,0.08) inset",
};

export interface ConcentrationHubProps {
  purchasedModes?: ConcentrationMode[];
  bestLevels?: Partial<Record<ConcentrationMode, number>>;
  rewardAwardedToday?: boolean;
  onBack?: () => void;
  onOpenMode?: (mode: ConcentrationMode) => void;
  onPurchase?: (mode: ConcentrationMode) => void;
  showOnboarding?: boolean;
  onOnboardingComplete?: () => void;
}

export function ConcentrationHub({
  purchasedModes = [],
  bestLevels = {},
  rewardAwardedToday = false,
  onBack,
  onOpenMode,
  onPurchase,
  showOnboarding = false,
  onOnboardingComplete,
}: ConcentrationHubProps) {
  const progressLevel = Math.min(5, Math.max(
    bestLevels.tracking ?? 0,
    bestLevels.search ?? 0,
    bestLevels.signals ?? 0,
  ));

  return (
    <div className="flex min-h-full flex-col overflow-visible px-4 pb-10 pt-7" data-testid="concentration-hub">
      <TechniqueGameHeader
        title="Концентрация"
        kind="concentration"
        color={CONCENTRATION_ACCENT}
        onBack={onBack}
        backTestId="button-concentration-hub-back"
      />

      <section
        className="relative mb-6 rounded-[21px] border p-4"
        style={{ ...CARD_STYLE, borderColor: CONCENTRATION_ACCENT_BORDER }}
        data-testid="concentration-potential-card"
      >
        <div>
          <p className="title-s text-primary">+10% потенциала дня.</p>
          <p className="body-s mt-1 text-secondary">{rewardAwardedToday ? "Награда уже получена сегодня." : "Пройди 5 уровней в одной практике."}</p>
        </div>
        <div className="mt-4 flex gap-1.5">
          {Array.from({ length: 5 }, (_, index) => index + 1).map((step) => (
            <motion.span
              key={step}
              className="h-1.5 flex-1 origin-left rounded-full"
              style={{
               background: rewardAwardedToday || step <= progressLevel ? CONCENTRATION_ACCENT : "rgba(147,197,253,.15)",
               boxShadow: rewardAwardedToday || step <= progressLevel ? "0 0 10px rgba(249,115,22,.75)" : "none",
              }}
            />
          ))}
        </div>
      </section>

      <div className="mb-4"><h2 className="title-m text-primary">Выбери практику</h2></div>
       <PracticeCardStack
         items={CONCENTRATION_MODES}
         renderCard={(meta, index) => {
          const purchased = purchasedModes.includes(meta.mode);
          return (
            <motion.article
              key={meta.mode}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * .07 }}
              className="rounded-[20px] p-4"
              style={CARD_STYLE}
              data-testid={`card-concentration-mode-${meta.mode}`}
            >
              <PracticeCardRings color={CONCENTRATION_ACCENT} index={index} />
              <button type="button" onClick={() => onOpenMode?.(meta.mode)} className="w-full text-left" data-testid={`button-open-concentration-${meta.mode}`}>
                <div className="flex items-center gap-3">
                  <div className="flex h-[62px] w-[68px] shrink-0 items-center justify-center rounded-[16px]">
                    <ConcentrationModeLogo mode={meta.mode} />
                  </div>
                  <h2 className="title-s min-w-0 text-primary">{meta.title}</h2>
                </div>
              </button>
              <div className="mt-4 flex items-center justify-center border-t border-orange-400/15 pt-3">
                {purchased ? (
                  <button type="button" onClick={() => onOpenMode?.(meta.mode)} className="min-h-10 rounded-[12px] bg-orange-500 px-5 text-sm font-semibold text-[#201308]" data-testid={`button-start-concentration-${meta.mode}`}>
                    Начать
                  </button>
                ) : (
                  <button type="button" onClick={() => onPurchase?.(meta.mode)} disabled={!onPurchase} className="flex min-h-10 items-center gap-2 rounded-[12px] border border-orange-400/45 px-5 text-sm font-semibold text-orange-300 disabled:cursor-not-allowed disabled:opacity-45" data-testid={`button-buy-concentration-${meta.mode}`}>
                    <LockKeyhole size={16} />
                    {CONCENTRATION_KEYS_COST} ключей
                  </button>
                )}
              </div>
            </motion.article>
          );
         }}
       />

      {showOnboarding && <ConcentrationOnboarding hub onComplete={onOnboardingComplete} />}
    </div>
  );
}