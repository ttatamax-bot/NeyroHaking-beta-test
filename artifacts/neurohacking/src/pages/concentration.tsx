import { useMemo, useState } from "react";
import { useLocation, useParams } from "wouter";
import { ApiError } from "@/lib/api";
import { DataLoadingScreen } from "@/components/DataLoadingScreen";
import { useAppStore, type ConcentrationMode } from "@/lib/store";
import { ConcentrationGame } from "@/features/concentration/ConcentrationGame";
import { ConcentrationHub } from "@/features/concentration/ConcentrationHub";
import { CONCENTRATION_MODES } from "@/features/concentration/config";

function isConcentrationMode(value: string | undefined): value is ConcentrationMode {
  return value === "signals" || value === "tracking" || value === "search";
}

function currentConcentrationDay(): string {
  const date = new Date();
  if (date.getHours() < 5) date.setDate(date.getDate() - 1);
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

export function ConcentrationHubPage() {
  const previewMode = import.meta.env.DEV;
  const [, setLocation] = useLocation();
  const {
    isSignedIn,
    isAccountReady,
    concentration,
    concentrationHubOnboardingSeen,
    updateState,
    keys,
  } = useAppStore();

  if (!import.meta.env.DEV && isSignedIn && !isAccountReady) {
    return <DataLoadingScreen label="Загружаем данные концентрации…" />;
  }

  const openPreview = (mode: ConcentrationMode) => {
    if (!previewMode && !isSignedIn) {
      setLocation("/sign-in");
      return;
    }
    setLocation(`/technique/concentration/${mode}`);
  };

  return (
    <div className="relative">
      <ConcentrationHub
        purchasedModes={concentration.purchasedModes}
        rewardAwardedToday={concentration.rewardDay === currentConcentrationDay()}
        onBack={() => setLocation("/techniques")}
        onOpenMode={(mode) => setLocation(`/technique/concentration/${mode}`)}
        onPurchase={openPreview}
        showOnboarding={!concentrationHubOnboardingSeen}
        onOnboardingComplete={() => updateState({ concentrationHubOnboardingSeen: true })}
      />
      {previewMode && !isSignedIn && keys === 0 && <span className="sr-only">В режиме preview доступны демонстрационные ключи.</span>}
    </div>
  );
}

export function ConcentrationModePage() {
  const previewMode = import.meta.env.DEV;
  const [, setLocation] = useLocation();
  const { mode: rawMode } = useParams<{ mode: string }>();
  const mode = useMemo(() => (isConcentrationMode(rawMode) ? rawMode : CONCENTRATION_MODES[0].mode), [rawMode]);
  const {
    isSignedIn,
    isAccountReady,
    concentration,
    updateState,
    completeTechnique,
    purchaseConcentrationMode,
    keys,
  } = useAppStore();
  const [error, setError] = useState<string | null>(null);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const returnToHub = () => {
    if (window.sessionStorage.getItem("concentration-reward-pending") === "1") {
      window.sessionStorage.removeItem("concentration-reward-pending");
      window.sessionStorage.setItem("concentration-reward-flight", "1");
    }
    setLocation("/technique/concentration");
  };
  const previewKeys = previewMode && !isSignedIn ? (keys > 0 ? keys : 5000) : isSignedIn ? keys : undefined;

  if (!import.meta.env.DEV && isSignedIn && !isAccountReady) {
    return <DataLoadingScreen label="Загружаем данные концентрации…" />;
  }

  const purchased = concentration.purchasedModes.includes(mode);
  const bestLevel = concentration.bestLevels[mode] ?? 1;

  const saveLevel = async (completedMode: ConcentrationMode, level: number, stats?: {
    bestReactionMs?: number;
    averageReactionMs?: number;
    stabilityPercent?: number;
  }) => {
    setError(null);
    try {
      await completeTechnique("T8", {
        mode: completedMode,
        level,
        ...stats,
      });
    } catch {
      setError("Не удалось сохранить этот уровень. Проверь соединение и повтори попытку.");
    }
  };

  return (
    <div className="relative">
      <ConcentrationGame
        mode={mode}
        purchased={purchased}
        bestLevel={bestLevel}
        keysBalance={previewKeys}
        rewardAwardedToday={concentration.rewardDay === currentConcentrationDay()}
        isPurchasing={isPurchasing}
        onPurchase={async (selectedMode) => {
          if (previewMode && !isSignedIn) {
            updateState(prev => ({
              keys: Math.max(0, (prev.keys > 0 ? prev.keys : 5000) - 400),
              concentration: {
                ...prev.concentration,
                purchasedModes: prev.concentration.purchasedModes.includes(selectedMode)
                  ? prev.concentration.purchasedModes
                  : [...prev.concentration.purchasedModes, selectedMode],
              },
            }));
            return;
          }
          if (!isSignedIn) {
            setLocation("/sign-in");
            return;
          }
          try {
            setIsPurchasing(true);
            await purchaseConcentrationMode(selectedMode);
          } catch (reason) {
            if (reason instanceof ApiError && reason.status === 409) {
              setError("Недостаточно ключей для открытия этой практики.");
            } else if (reason instanceof ApiError) {
              setError(`Ошибка открытия практики (${reason.status}). Повтори попытку.`);
            } else {
              setError("Не удалось открыть практику. Проверь соединение и повтори попытку.");
            }
          } finally {
            setIsPurchasing(false);
          }
        }}
        onBack={returnToHub}
        onLevelFiveComplete={() => {
          window.sessionStorage.setItem("concentration-reward-pending", "1");
        }}
        onBestLevelUpdate={(completedMode, level, stats) => {
          void saveLevel(completedMode, level, stats);
        }}
      />
      {error && (
        <div className="fixed bottom-5 left-4 right-4 z-40 mx-auto max-w-[358px] rounded-[14px] border border-rose-300/25 bg-[#3b1820] px-4 py-3 text-sm text-rose-100" role="alert">
          {error}
        </div>
      )}
    </div>
  );
}