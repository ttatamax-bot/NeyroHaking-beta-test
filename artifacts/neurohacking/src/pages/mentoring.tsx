import { useState } from "react";
import { useAppStore } from "@/lib/store";
import { ScreenTransition } from "@/components/ScreenTransition";
import { BackButton } from "@/components/BackButton";
import { Users, Key } from "lucide-react";
import { motion } from "framer-motion";

const COST_KEYS = 100000;
const COST_RUB = 9999;
const TG_KEYS = "https://t.me/Mtatarinov?text=%D0%9F%D1%80%D0%B8%D0%B2%D0%B5%D1%82.%20%D0%AF%20%D0%BD%D0%B0%D0%BA%D0%BE%D0%BF%D0%B8%D0%BB%20%D0%BA%D0%BB%D1%8E%D1%87%D0%B8%20%D0%B2%20%D1%81%D0%B8%D1%81%D1%82%D0%B5%D0%BC%D0%B5%20%D0%B8%20%D1%85%D0%BE%D1%87%D1%83%20%D0%BE%D0%B1%D0%BC%D0%B5%D0%BD%D1%8F%D1%82%D1%8C%20%D0%B8%D1%85%20%D0%BD%D0%B0%20%D0%BB%D0%B8%D1%87%D0%BD%D0%BE%D0%B5%20%D0%B2%D0%B5%D0%B4%D0%B5%D0%BD%D0%B8%D0%B5.";
const TG_RUB = "https://t.me/Mtatarinov?text=%D0%9F%D1%80%D0%B8%D0%B2%D0%B5%D1%82.%20%D0%A5%D0%BE%D1%87%D1%83%20%D1%83%D0%B7%D0%BD%D0%B0%D1%82%D1%8C%20%D0%BF%D0%BE%D0%B4%D1%80%D0%BE%D0%B1%D0%BD%D0%B5%D0%B5%20%D0%BE%20%D0%BB%D0%B8%D1%87%D0%BD%D0%BE%D0%BC%20%D0%B2%D0%B5%D0%B4%D0%B5%D0%BD%D0%B8%D0%B8.";

export default function Mentoring() {
  const { keys, updateState } = useAppStore();
  const [processing, setProcessing] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handlePayKeys = () => {
    if (processing) return;
    if (keys < COST_KEYS) {
      showToast("Недостаточно ключей для покупки");
      return;
    }
    setProcessing(true);
    const id = `purchase_${Date.now()}_${Math.random().toString(36).slice(2,7)}`;
    updateState(prev => ({
      keys: prev.keys - COST_KEYS,
      keysHistory: [
        { date: new Date().toISOString(), source: 'Личное ведение', amount: COST_KEYS, type: 'spend' as const },
        ...prev.keysHistory,
      ],
      purchaseHistory: [
        { id, type: 'mentoring', method: 'keys', amount: COST_KEYS, date: new Date().toISOString() },
        ...prev.purchaseHistory,
      ],
    }));
    window.open(TG_KEYS, '_blank');
  };

  const handlePayRub = () => {
    window.open(TG_RUB, '_blank');
  };

  return (
    <ScreenTransition className="pt-[56px] px-4 pb-24 flex flex-col min-h-screen relative">
      <BackButton />

      {toast && (
        <div className="fixed top-16 left-4 right-4 z-[80] bg-surface-2 border border-border rounded-[12px] px-4 py-3 text-primary body-s shadow-lg">
          {toast}
        </div>
      )}

      <div className="flex-1 mt-4">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-[14px] flex items-center justify-center"
            style={{ background: 'rgba(37,99,235,0.15)', border: '1px solid rgba(37,99,235,0.25)' }}>
            <Users size={24} color="#60A5FA" />
          </div>
          <h1 className="title-l text-primary">Личное ведение</h1>
        </div>

        <div className="space-y-4 body text-secondary leading-relaxed mb-8">
          <p>Месячная системная работа под моим личным контролем.</p>
          <p>Я лично проверяю твое выполнение техник, корректирую цели и не даю мозгу соскочить с новой траектории.</p>
          <p>Формат подходит тем, кому нужна максимальная ответственность и быстрый результат.</p>
        </div>

        <div className="space-y-3">
          <p className="caption text-tertiary uppercase tracking-wider mb-3">Выбери способ оплаты</p>

          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handlePayKeys}
            className="w-full rounded-[16px] p-4 flex items-center gap-4 text-left active:brightness-110 transition-all"
            style={{ background: 'rgba(37,99,235,0.12)', border: '1px solid rgba(37,99,235,0.3)' }}
          >
            <div className="w-10 h-10 rounded-[12px] flex items-center justify-center shrink-0"
              style={{ background: 'rgba(37,99,235,0.2)', border: '1px solid rgba(37,99,235,0.3)' }}>
              <Key size={18} color="#60A5FA" />
            </div>
            <div className="flex-1">
              <p className="title-s text-primary">Оплатить ключами</p>
              <p className="caption text-secondary">{COST_KEYS.toLocaleString('ru-RU')} ключей</p>
            </div>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handlePayRub}
            className="w-full rounded-[16px] p-4 flex items-center gap-4 text-left active:brightness-110 transition-all"
            style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)' }}
          >
            <div className="w-10 h-10 rounded-[12px] flex items-center justify-center shrink-0"
              style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)' }}>
              <span style={{ fontSize: 16, fontWeight: 700, color: '#F59E0B' }}>RUB</span>
            </div>
            <div className="flex-1">
              <p className="title-s text-primary">Оплатить</p>
              <p className="caption text-secondary">{COST_RUB.toLocaleString('ru-RU')} руб.</p>
            </div>
          </motion.button>
        </div>
      </div>
    </ScreenTransition>
  );
}
