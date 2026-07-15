import { useState } from "react";
import { useLocation } from "wouter";
import { useAppStore } from "@/lib/store";
import { ScreenTransition } from "@/components/ScreenTransition";
import { BackButton } from "@/components/BackButton";
import { ChevronRight, Pencil, Bell } from "lucide-react";

function subscribeOneSignal() {
  const win = window as any;
  try {
    if (win.OneSignalDeferred) {
      win.OneSignalDeferred.push(async (os: any) => {
        if (os.Notifications && !os.Notifications.permission) {
          await os.Notifications.requestPermission();
        } else if (os.registerForPushNotifications) {
          await os.registerForPushNotifications();
        }
      });
    } else if (win.OneSignal) {
      const os = win.OneSignal;
      if (os.Notifications && !os.Notifications.permission) {
        os.Notifications.requestPermission();
      } else if (os.registerForPushNotifications) {
        os.registerForPushNotifications();
      }
    }
  } catch (e) {
    console.warn('OneSignal subscribe error', e);
  }
}

function NotificationConfirmDialog({ open, onClose, onConfirm }: { open: boolean; onClose: () => void; onConfirm: () => void }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[50] flex items-center justify-center px-6">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative z-[51] rounded-[20px] p-6 text-center max-w-[320px] w-full"
        style={{ background: 'rgba(10,13,26,0.98)', border: '1px solid rgba(37,99,235,0.4)', boxShadow: '0 8px 40px rgba(0,0,0,0.6)' }}>
        <Bell size={32} color="#F59E0B" className="mx-auto mb-3" />
        <h3 className="title-s text-primary mb-2">Разрешить уведомления?</h3>
        <p className="body-s text-secondary mb-5">
          Получай уведомления о напоминаниях, новых статьях и новостях нейрохакинга.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 h-[44px] rounded-[12px] body-s text-secondary"
            style={{ background: 'rgba(37,99,235,0.15)', border: '1px solid rgba(37,99,235,0.3)' }}
          >
            Отмена
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 h-[44px] rounded-[12px] btn-grad btn-shimmer title-s"
          >
            Разрешить
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Settings() {
  const { email } = useAppStore();
  const [, setLocation] = useLocation();
  const [showConfirm, setShowConfirm] = useState(false);

  return (
    <ScreenTransition className="pt-[56px] px-4 pb-24">
      <BackButton />
      <h1 className="title-l text-primary mt-4 mb-6">Настройки</h1>

      <div className="bg-surface-1 border border-border rounded-[16px] overflow-hidden mb-4">
        <button
          onClick={() => setLocation('/onboarding/email')}
          className="w-full p-4 border-b border-border flex justify-between items-center active:bg-surface-2 transition-colors text-left"
        >
          <div>
            <div className="body text-primary">Email</div>
            <div className="body-s text-secondary mt-0.5">{email || 'Не указан'}</div>
          </div>
          <div className="flex items-center gap-2">
            <span className="body-s text-blue-light">Изменить</span>
            <Pencil size={15} className="text-blue-light" />
          </div>
        </button>

        <button
          onClick={() => setLocation('/notifications')}
          className="w-full p-4 flex justify-between items-center active:bg-surface-2 transition-colors text-left border-b border-border"
        >
          <span className="body text-primary">Уведомления</span>
          <ChevronRight size={20} className="text-tertiary" />
        </button>

        <button
          onClick={() => setLocation('/privacy-policy')}
          className="w-full p-4 flex justify-between items-center active:bg-surface-2 transition-colors text-left"
        >
          <span className="body text-primary">Политика конфиденциальности</span>
          <ChevronRight size={20} className="text-tertiary" />
        </button>
      </div>

      <button
        onClick={() => setShowConfirm(true)}
        className="w-full p-4 rounded-[16px] flex items-center gap-3 active:brightness-110 transition-all"
        style={{
          background: 'linear-gradient(135deg, rgba(245,158,11,0.18) 0%, rgba(245,158,11,0.06) 100%)',
          border: '1px solid rgba(245,158,11,0.45)',
          boxShadow: '0 0 0 1px rgba(255,255,255,0.06), 0 4px 20px rgba(0,0,0,0.4)',
        }}
      >
        <div
          className="w-10 h-10 rounded-[12px] flex items-center justify-center shrink-0"
          style={{ background: 'rgba(245,158,11,0.18)', border: '1px solid rgba(245,158,11,0.35)' }}
        >
          <Bell size={18} color="#F59E0B" />
        </div>
        <div className="flex-1 text-left">
          <div className="body text-primary">Подключить пуш-уведомления</div>
          <div className="body-s text-secondary mt-0.5">Получать уведомления от приложения</div>
        </div>
        <ChevronRight size={18} color="rgba(245,158,11,0.7)" />
      </button>

      <NotificationConfirmDialog
        open={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={() => { setShowConfirm(false); subscribeOneSignal(); }}
      />
    </ScreenTransition>
  );
}
  