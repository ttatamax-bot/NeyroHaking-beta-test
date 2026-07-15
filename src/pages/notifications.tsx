import { useEffect, useRef, useState } from "react";
import { useAppStore } from "@/lib/store";
import { ScreenTransition } from "@/components/ScreenTransition";
import { BackButton } from "@/components/BackButton";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Bell } from "lucide-react";
import { initOneSignal, unsubscribeOneSignal, subscribeOneSignal, isOneSignalSubscribed, isOneSignalReady, addTag, removeTag } from "@/lib/onesignal";

// Global OneSignal type augmentation
declare global {
  interface Window {
    OneSignal?: any;
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

// Legacy local notification scheduler (works when app is open)
function scheduleNextDailyNotification(timeStr: string) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  const [hours, minutes] = timeStr.split(':').map(Number);
  if (isNaN(hours) || isNaN(minutes)) return;

  const now = new Date();
  const target = new Date();
  target.setHours(hours, minutes, 0, 0);
  if (target <= now) {
    target.setDate(target.getDate() + 1);
  }
  const delay = target.getTime() - now.getTime();

  const existingId = parseInt(localStorage.getItem('neyro_notif_timer') ?? '0');
  if (existingId) clearTimeout(existingId);

  const timerId = setTimeout(() => {
    try {
      new Notification('НейроХакинг', {
        body: 'Пора выполнить техники дня! Каждый день — шаг вперёд.',
        icon: '/icon-192x192.png',
      });
    } catch {}
    scheduleNextDailyNotification(timeStr);
  }, delay) as unknown as number;

  localStorage.setItem('neyro_notif_timer', String(timerId));
}

export function useNotificationScheduler() {
  const { notificationsEnabled, techniqueReminderTime } = useAppStore();
  const scheduledRef = useRef(false);

  useEffect(() => {
    if (!notificationsEnabled || Notification.permission !== 'granted') return;
    scheduleNextDailyNotification(techniqueReminderTime);
    scheduledRef.current = true;
  }, [notificationsEnabled, techniqueReminderTime]);
}

export default function Notifications() {
  const {
    notificationsEnabled,
    techniqueReminderTime,
    articleNotificationsEnabled,
    newsNotificationsEnabled,
    updateState,
  } = useAppStore();

  const [oneSignalReady, setOneSignalReady] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingToggle, setPendingToggle] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      if (isOneSignalReady()) {
        setOneSignalReady(true);
        isOneSignalSubscribed().then(setSubscribed);
        clearInterval(timer);
      }
    }, 500);
    return () => clearInterval(timer);
  }, []);

  const doToggleNotifications = async (checked: boolean) => {
    if (checked) {
      if (oneSignalReady) {
        await initOneSignal();
        const sub = await isOneSignalSubscribed();
        setSubscribed(sub);
        await addTag('notifications_enabled', 'true');
        await addTag('reminder_time', techniqueReminderTime);
      } else {
        if ('Notification' in window && Notification.permission !== 'granted') {
          await Notification.requestPermission();
        }
      }
      updateState({ notificationsEnabled: checked });
      if (Notification.permission === 'granted') {
        scheduleNextDailyNotification(techniqueReminderTime);
      }
    } else {
      updateState({ notificationsEnabled: checked });
      if (oneSignalReady) {
        await unsubscribeOneSignal();
        setSubscribed(false);
        await removeTag('notifications_enabled');
        await removeTag('reminder_time');
      }
      const existingId = parseInt(localStorage.getItem('neyro_notif_timer') ?? '0');
      if (existingId) clearTimeout(existingId);
      localStorage.removeItem('neyro_notif_timer');
    }
  };

  const handleToggleNotifications = async (checked: boolean) => {
    if (checked && Notification.permission !== 'granted') {
      setPendingToggle(true);
      setShowConfirm(true);
      return;
    }
    await doToggleNotifications(checked);
  };

  const handleConfirm = async () => {
    setShowConfirm(false);
    await doToggleNotifications(true);
    if (pendingToggle) {
      setPendingToggle(false);
    }
  };

  const handleTimeChange = async (newTime: string) => {
    updateState({ techniqueReminderTime: newTime });
    if (oneSignalReady && notificationsEnabled) {
      await addTag('reminder_time', newTime);
    }
    if (notificationsEnabled && Notification.permission === 'granted') {
      scheduleNextDailyNotification(newTime);
    }
  };

  const handleToggleArticles = async (checked: boolean) => {
    updateState({ articleNotificationsEnabled: checked });
    if (oneSignalReady) {
      if (checked) {
        await subscribeOneSignal();
      }
      await addTag('article_notifications', checked ? 'true' : 'false');
    }
  };

  const handleToggleNews = async (checked: boolean) => {
    updateState({ newsNotificationsEnabled: checked });
    if (oneSignalReady) {
      if (checked) {
        await subscribeOneSignal();
      }
      await addTag('news_notifications', checked ? 'true' : 'false');
    }
  };

  const permissionDenied = 'Notification' in window && Notification.permission === 'denied';
  const permissionGranted = 'Notification' in window && Notification.permission === 'granted';

  return (
    <ScreenTransition className="pt-[64px] px-4 pb-24 space-y-6">
      <BackButton />

      <h1 className="title-l text-primary mb-6">Уведомления</h1>

      <div className="bg-surface-1 border border-border rounded-[16px] overflow-hidden">
        <div className="p-4 border-b border-border flex justify-between items-center">
          <div>
            <div className="body text-primary mb-1">Напоминание о техниках</div>
            <div className="caption text-secondary">
              {notificationsEnabled && (permissionGranted || subscribed)
                ? `OneSignal push активно. Ежедневно в ${techniqueReminderTime}`
                : 'OneSignal push — ежедневно в указанное время'}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Input
              type="time"
              value={techniqueReminderTime}
              onChange={(e) => handleTimeChange(e.target.value)}
              className="bg-surface-2 border-border w-[100px] text-center"
            />
            <Switch
              checked={notificationsEnabled}
              onCheckedChange={handleToggleNotifications}
              className="data-[state=checked]:bg-[#F59E0B] transition-colors"
            />
          </div>
        </div>

        <div className="p-4 border-b border-border flex justify-between items-center">
          <div>
            <div className="body text-primary mb-1">Новые статьи Академии</div>
            <div className="caption text-secondary">Уведомление о новых статьях</div>
          </div>
          <Switch
            checked={articleNotificationsEnabled}
            onCheckedChange={handleToggleArticles}
            className="data-[state=checked]:bg-[#F59E0B] transition-colors"
          />
        </div>

        <div className="p-4 flex justify-between items-center">
          <div>
            <div className="body text-primary mb-1">Новости</div>
            <div className="caption text-secondary">Уведомление о новостях</div>
          </div>
          <Switch
            checked={newsNotificationsEnabled}
            onCheckedChange={handleToggleNews}
            className="data-[state=checked]:bg-[#F59E0B] transition-colors"
          />
        </div>
      </div>

      {permissionDenied && (
        <div className="px-4 py-3 rounded-[12px]"
          style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
          <p className="body-s" style={{ color: 'var(--error)' }}>
            Уведомления заблокированы в настройках браузера. Разреши их вручную — настройки → сайт → уведомления.
          </p>
        </div>
      )}

      {notificationsEnabled && (permissionGranted || subscribed) && (
        <div className="px-4 py-3 rounded-[12px]"
          style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)' }}>
          <p className="body-s" style={{ color: '#22C55E' }}>
            {subscribed
              ? '✅ Push-уведомления OneSignal активны. Приходят даже когда приложение закрыто.'
              : '✅ Локальные уведомления активны. Приложение должно быть открыто для получения напоминаний.'}
          </p>
        </div>
      )}

      {/* Кнопка явного подключения OneSignal — нужна для Safari (требует user gesture) */}
      {!subscribed && oneSignalReady && (
        <div className="px-4 py-4 rounded-[16px] relative overflow-hidden"
          style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)' }}>
          <p className="body-s text-secondary mb-3 leading-relaxed">
            Включи push-уведомления от OneSignal — они работают даже когда приложение закрыто. Нажми кнопку ниже и разреши уведомления в браузере.
          </p>
          <button
            onClick={async () => {
              try {
                const win = window as any;
                if (win.OneSignal?.Notifications) {
                  await win.OneSignal.Notifications.requestPermission();
                  const sub = await isOneSignalSubscribed();
                  setSubscribed(sub);
                  if (sub) {
                    updateState({ notificationsEnabled: true });
                  }
                }
              } catch {}
            }}
            className="w-full h-[44px] rounded-[12px] btn-grad btn-shimmer title-s"
          >
            Подключить push-уведомления
          </button>
        </div>
      )}

      {!('Notification' in window) && (
        <div className="px-4 py-3 rounded-[12px]"
          style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
          <p className="body-s" style={{ color: '#F59E0B' }}>
            Этот браузер не поддерживает уведомления. Установи приложение на рабочий стол для лучшего опыта.
          </p>
        </div>
      )}

      <NotificationConfirmDialog
        open={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleConfirm}
      />
    </ScreenTransition>
  );
}
