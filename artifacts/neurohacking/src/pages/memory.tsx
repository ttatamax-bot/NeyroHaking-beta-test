import { useMemo, useState } from 'react';
import { useLocation, useParams } from 'wouter';
import { useAppStore, type MemoryMode } from '@/lib/store';
import { MemoryGame } from '@/features/memory/MemoryGame';
import { MemoryHub } from '@/features/memory/MemoryHub';
import { MEMORY_MODES } from '@/features/memory/config';
import { DataLoadingScreen } from '@/components/DataLoadingScreen';
import { ApiError } from '@/lib/api';

function isMemoryMode(value: string | undefined): value is MemoryMode {
  return value === 'reverse' || value === 'matrix' || value === 'symbols';
}

function currentMemoryDay(): string {
  const date = new Date();
  if (date.getHours() < 5) date.setDate(date.getDate() - 1);
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
}

export function MemoryHubPage() {
  const previewMode = import.meta.env.DEV;
  const [, setLocation] = useLocation();
  const {
    isSignedIn,
    isAccountReady,
    memory,
    memoryHubOnboardingSeen,
    updateState,
  } = useAppStore();

  if (isSignedIn && !isAccountReady) {
    return <DataLoadingScreen label="Загружаем данные памяти…" />;
  }

  const openMemoryPreview = (mode: MemoryMode) => {
    if (!previewMode && !isSignedIn) {
      setLocation('/sign-in');
      return;
    }
    setLocation(`/technique/memory/${mode}`);
  };

  return (
    <div className="relative">
      <MemoryHub
        purchasedModes={memory.purchasedModes}
        rewardAwardedToday={memory.rewardDay === currentMemoryDay()}
        onBack={() => setLocation('/techniques')}
        onOpenMode={(mode) => setLocation(`/technique/memory/${mode}`)}
        onPurchase={openMemoryPreview}
        showOnboarding={!memoryHubOnboardingSeen}
        onOnboardingComplete={() => updateState({ memoryHubOnboardingSeen: true })}
      />
    </div>
  );
}

export function MemoryModePage() {
  const previewMode = import.meta.env.DEV;
  const [, setLocation] = useLocation();
  const { mode: rawMode } = useParams<{ mode: string }>();
  const mode = useMemo(() => (isMemoryMode(rawMode) ? rawMode : MEMORY_MODES[0].mode), [rawMode]);
  const {
    isSignedIn,
    isAccountReady,
    memory,
    updateState,
    completeTechnique,
    purchaseMemoryMode,
    keys,
  } = useAppStore();
  const [error, setError] = useState<string | null>(null);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const returnToMemoryHub = () => {
    if (window.sessionStorage.getItem('memory-reward-pending') === '1') {
      window.sessionStorage.removeItem('memory-reward-pending');
      window.sessionStorage.setItem('memory-reward-flight', '1');
    }
    setLocation('/technique/memory');
  };
  const previewKeys = previewMode && !isSignedIn ? (keys > 0 ? keys : 5000) : isSignedIn ? keys : undefined;

  if (isSignedIn && !isAccountReady) {
    return <DataLoadingScreen label="Загружаем данные памяти…" />;
  }

  const purchased = memory.purchasedModes.includes(mode);
  const bestLevel = memory.bestLevels[mode] ?? 1;

  const saveMemoryLevel = async (completedMode: MemoryMode, level: number) => {
    setError(null);
    try {
      await completeTechnique('T7', {
        mode: completedMode,
        level,
      });
    } catch {
      setError('Не удалось сохранить этот уровень. Проверь соединение и повтори попытку.');
    }
  };

  return (
    <div className="relative">
      <MemoryGame
        mode={mode}
        purchased={purchased}
        bestLevel={bestLevel}
        keysBalance={previewKeys}
        rewardAwardedToday={memory.rewardDay === currentMemoryDay()}
        showOnboarding={false}
        onPurchase={async (selectedMode) => {
          if (previewMode && !isSignedIn) {
            updateState(prev => ({
              keys: Math.max(0, (prev.keys > 0 ? prev.keys : 5000) - 400),
              memory: {
                ...prev.memory,
                purchasedModes: prev.memory.purchasedModes.includes(selectedMode)
                  ? prev.memory.purchasedModes
                  : [...prev.memory.purchasedModes, selectedMode],
              },
            }));
            return;
          }
          if (!isSignedIn) {
            setLocation('/sign-in');
            return;
          }
          try {
            setIsPurchasing(true);
            await purchaseMemoryMode(selectedMode);
          } catch (reason) {
            if (reason instanceof ApiError && reason.status === 409) {
              setError('Недостаточно ключей для открытия этой практики.');
            } else if (reason instanceof ApiError && reason.status === 400) {
              setError('Не удалось определить выбранный режим. Открой практику заново.');
            } else if (reason instanceof ApiError) {
              const data = reason.data;
              const serverMessage = typeof data === 'object' && data !== null && 'error' in data
                ? String((data as { error?: unknown }).error ?? '')
                : '';
              setError(`Ошибка открытия практики (${reason.status})${serverMessage ? `: ${serverMessage}` : '. Повтори попытку.'}`);
            } else {
              setError('Не удалось открыть практику. Проверь соединение и повтори попытку.');
            }
          } finally {
            setIsPurchasing(false);
          }
        }}
        isPurchasing={isPurchasing}
        onBack={returnToMemoryHub}
        onLevelFiveComplete={() => {
          window.sessionStorage.setItem('memory-reward-pending', '1');
        }}
        onBestLevelUpdate={(completedMode, level) => {
          void saveMemoryLevel(completedMode, level);
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