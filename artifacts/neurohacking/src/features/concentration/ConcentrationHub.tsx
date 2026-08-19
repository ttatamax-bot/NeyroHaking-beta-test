import { Brain, ChevronLeft, LockKeyhole } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import {
  CONCENTRATION_ACCENT,
  CONCENTRATION_ACCENT_BORDER,
  CONCENTRATION_KEYS_COST,
  CONCENTRATION_MODES,
  type ConcentrationMode,
} from "./config";
import { ConcentrationModeLogo } from "./ConcentrationModeLogo";
import { ConcentrationOnboarding } from "./ConcentrationOnboarding";

const CARD_STYLE = {
  background: "linear-gradient(135deg, rgba(245,158,11,0.14) 0%, rgba(245,158,11,0.05) 100%)",
  border: "1px solid rgba(245,158,11,0.30)",
  boxShadow: "0 4px 24px rgba(0,0,0,0.4), 0 1px 0 rgba(255,255,255,0.06) inset",
};

export interface ConcentrationHubProps {
  purchasedModes?: ConcentrationMode[];
  rewardAwardedToday?: boolean;
  onBack?: () => void;
  onOpenMode?: (mode: ConcentrationMode) => void;
  onPurchase?: (mode: ConcentrationMode) => void;
  showOnboarding?: boolean;
  onOnboardingComplete?: () => void;
}

export function ConcentrationHub({
  purchasedModes = [],
  rewardAwardedToday = false,
  onBack,
  onOpenMode,
  onPurchase,
  showOnboarding = false,
  onOnboardingComplete,
}: ConcentrationHubProps) {
  const [celebrateReward, setCelebrateReward] = useState(false);

  useEffect(() => {
    if (window.sessionStorage.getItem("concentration-reward-flight") !== "1") return;
    window.sessionStorage.removeItem("concentration-reward-flight");
    setCelebrateReward(true);
    const timeout = window.setTimeout(() => setCelebrateReward(false), 2600);
    return () => window.clearTimeout(timeout);
  }, []);

  return (
    <div className="min-h-[100dvh] overflow-y-auto px-4 pb-10 pt-7" data-testid="concentration-hub">
      <motion.header initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <div className="flex items-center">
          {onBack && (
            <button type="button" onClick={onBack} className="mr-2 p-1 text-tertiary" aria-label="Назад" data-testid="button-concentration-hub-back">
              <ChevronLeft size={28} />
            </button>
          )}
          <h1 className="title-l text-primary">Концентрация</h1>
        </div>
      </motion.header>

      <motion.section
        className="relative mb-6 rounded-[21px] border p-4"
        style={{ ...CARD_STYLE, borderColor: CONCENTRATION_ACCENT_BORDER }}
        animate={celebrateReward ? {
          scale: [1, 1.035, 1],
          borderColor: [CONCENTRATION_ACCENT_BORDER, "rgba(251,146,60,.95)", CONCENTRATION_ACCENT_BORDER],
          boxShadow: [
            "0 4px 24px rgba(0,0,0,0.4), 0 1px 0 rgba(255,255,255,0.06) inset",
            "0 0 38px rgba(249,115,22,.72), 0 1px 0 rgba(255,255,255,.08) inset",
            "0 4px 24px rgba(0,0,0,0.4), 0 1px 0 rgba(255,255,255,.06) inset",
          ],
        } : { scale: 1, borderColor: CONCENTRATION_ACCENT_BORDER }}
        transition={{ duration: 1.15, ease: "easeInOut" }}
        data-testid="concentration-potential-card"
      >
        <div>
          <p className="title-s text-primary">+10% потенциала дня.</p>
          <p className="body-s mt-1 text-secondary">{rewardAwardedToday ? "Награда уже получена сегодня." : "Пройди уровни 1–10 в любой практике."}</p>
        </div>
        {celebrateReward && (
          <motion.span
            initial={{ opacity: 0, y: -5, scale: .9 }}
            animate={{ opacity: [0, 1, 1, 0], y: [-5, 0, 0, -3], scale: [.9, 1, 1, .96] }}
            transition={{ duration: 2.2, ease: "easeOut" }}
            className="absolute right-4 top-3 text-xs font-bold text-orange-300"
          >
            награда получена
          </motion.span>
        )}
        <div className="mt-4 flex gap-1.5">
          {Array.from({ length: 10 }, (_, index) => index + 1).map((step) => (
            <motion.span
              key={step}
              initial={celebrateReward ? { scaleX: 0, opacity: .35 } : false}
              animate={{ scaleX: 1, opacity: 1 }}
              transition={{ duration: .38, delay: celebrateReward ? step * .16 : 0 }}
              className="h-1.5 flex-1 origin-left rounded-full"
              style={{
                background: rewardAwardedToday || celebrateReward || step === 1 ? CONCENTRATION_ACCENT : "rgba(147,197,253,.15)",
                boxShadow: rewardAwardedToday || celebrateReward || step === 1 ? "0 0 10px rgba(249,115,22,.75)" : "none",
              }}
            />
          ))}
        </div>
      </motion.section>

      <div className="mb-4"><h2 className="title-m text-primary">Выбери практику</h2></div>
      <div className="space-y-3">
        {CONCENTRATION_MODES.map((meta, index) => {
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
        })}
      </div>

      {celebrateReward && (
        <motion.div
          initial={{ opacity: 0, scale: .72, x: 150, y: 180 }}
          animate={{ opacity: [0, 1, 1, 0], scale: [.72, 1, 1, .72], x: [150, 90, 26, 0], y: [180, 58, 10, 0] }}
          transition={{ duration: 2.3, ease: "easeInOut" }}
          className="pointer-events-none fixed left-4 top-4 z-50 flex items-center gap-1.5 font-semibold text-orange-300"
          data-testid="concentration-reward-flight"
        >
          <Brain size={18} />
          <span>+10%</span>
        </motion.div>
      )}
      {showOnboarding && <ConcentrationOnboarding hub onComplete={onOnboardingComplete} />}
    </div>
  );
}