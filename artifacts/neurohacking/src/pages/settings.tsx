import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useUser, SignOutButton } from "@clerk/react";
import { useAppStore } from "@/lib/store";
import { ScreenTransition } from "@/components/ScreenTransition";
import { BackButton } from "@/components/BackButton";
import { ChevronRight, Bell, User, Copy, Check, Gift, Loader2 } from "lucide-react";
import { ApiError, createReferral, updateServerProfile } from "@/lib/api";
import {
  DEVELOPER_MODE_EVENT,
  getDeveloperMode,
  isDeveloperAccount,
  setDeveloperMode,
} from "@/lib/developer-mode";

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
  const [, setLocation] = useLocation();
  const [showConfirm, setShowConfirm] = useState(false);
  const [referralLink, setReferralLink] = useState<string | null>(null);
  const [referralBusy, setReferralBusy] = useState(false);
  const [referralCopied, setReferralCopied] = useState(false);
  const [referralError, setReferralError] = useState<string | null>(null);
  const { isSignedIn, user } = useUser();
  const { profile, updateState } = useAppStore();
  const [nickname, setNickname] = useState(profile?.nickname ?? "");
  const [nicknameBusy, setNicknameBusy] = useState(false);
  const [nicknameMessage, setNicknameMessage] = useState<string | null>(null);
  const email = user?.primaryEmailAddress?.emailAddress ?? null;
  const isReferralAdmin = email?.toLowerCase() === 'ttatamax@gmail.com';
  const isDevAccount = isDeveloperAccount(email);
  const [developerMode, setDeveloperModeState] = useState(() => getDeveloperMode(email));

  useEffect(() => {
    setDeveloperModeState(getDeveloperMode(email));
  }, [email]);

  useEffect(() => {
    if (profile?.nickname) setNickname(profile.nickname);
  }, [profile?.nickname]);

  const saveNickname = async () => {
    const normalized = nickname.trim();
    if (!/^[\p{L}\p{N}][\p{L}\p{N}_.-]{2,23}$/u.test(normalized) || nicknameBusy) return;
    setNicknameBusy(true);
    setNicknameMessage(null);
    try {
      const nextProfile = await updateServerProfile({ nickname: normalized });
      updateState({ profile: nextProfile });
      setNicknameMessage("Никнейм сохранён.");
    } catch (error) {
      setNicknameMessage(error instanceof ApiError && error.status === 409
        ? "Этот никнейм уже занят."
        : "Не удалось сохранить никнейм.");
    } finally {
      setNicknameBusy(false);
    }
  };

  useEffect(() => {
    const syncDeveloperMode = () => setDeveloperModeState(getDeveloperMode(email));
    window.addEventListener(DEVELOPER_MODE_EVENT, syncDeveloperMode);
    return () => window.removeEventListener(DEVELOPER_MODE_EVENT, syncDeveloperMode);
  }, [email]);

  const issueReferral = async () => {
    setReferralBusy(true);
    setReferralError(null);
    try {
      const result = await createReferral(1000);
      const base = import.meta.env.BASE_URL.endsWith('/') ? import.meta.env.BASE_URL : `${import.meta.env.BASE_URL}/`;
      setReferralLink(new URL(`${base}referral/${result.code}`, window.location.origin).toString());
    } catch (error) {
      setReferralError(error instanceof ApiError && error.status === 403
        ? 'Выпуск ссылок недоступен для этого аккаунта.'
        : 'Не удалось создать ссылку. Попробуй ещё раз.');
    } finally {
      setReferralBusy(false);
    }
  };

  const copyReferral = async () => {
    if (!referralLink) return;
    await navigator.clipboard?.writeText(referralLink);
    setReferralCopied(true);
    window.setTimeout(() => setReferralCopied(false), 1800);
  };

  return (
    <ScreenTransition className="pt-[56px] px-4 pb-24">
      <BackButton />
      <h1 className="title-l text-primary mt-4 mb-6">Настройки</h1>

      <div className="bg-surface-1 border border-border rounded-[16px] overflow-hidden mb-4">
        {isSignedIn ? (
          <div className="p-4 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-[12px] flex items-center justify-center shrink-0"
                style={{ background: 'rgba(37,99,235,0.18)', border: '1px solid rgba(37,99,235,0.35)' }}
              >
                <User size={18} className="text-blue-light" />
              </div>
              <div className="text-left">
                <div className="body text-primary">Аккаунт</div>
                <div className="body-s text-secondary mt-0.5">{user?.primaryEmailAddress?.emailAddress || 'Вход выполнен'}</div>
              </div>
            </div>
            <SignOutButton>
              <button className="body-s text-blue-light active:opacity-70 transition-opacity">Выйти</button>
            </SignOutButton>
          </div>
        ) : (
          <button
            onClick={() => setLocation('/sign-in')}
            className="w-full p-4 flex justify-between items-center active:bg-surface-2 transition-colors text-left"
          >
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-[12px] flex items-center justify-center shrink-0"
                style={{ background: 'rgba(37,99,235,0.18)', border: '1px solid rgba(37,99,235,0.35)' }}
              >
                <User size={18} className="text-blue-light" />
              </div>
              <div>
                <div className="body text-primary">Аккаунт</div>
                <div className="body-s text-secondary mt-0.5">Войдите, чтобы сохранить прогресс</div>
              </div>
            </div>
            <span className="body-s text-blue-light">Войти</span>
          </button>
        )}
      </div>

      {isSignedIn && isReferralAdmin && (
        <div
          className="rounded-[16px] p-4 mb-4"
          style={{
            background: 'linear-gradient(135deg, rgba(249,115,22,0.18), rgba(234,88,12,0.06))',
            border: '1px solid rgba(249,115,22,0.38)',
          }}
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-[12px] flex items-center justify-center" style={{ background: 'rgba(249,115,22,0.18)' }}>
              <Gift size={19} color="#FDBA74" />
            </div>
            <div>
              <div className="body text-primary">Реферальная ссылка</div>
              <div className="body-s text-secondary mt-0.5">Одноразовый подарок на 1000 ключей</div>
            </div>
          </div>
          {referralLink ? (
            <div className="flex gap-2">
              <div className="flex-1 min-w-0 rounded-[10px] px-3 flex items-center body-s truncate" style={{ background: 'rgba(0,0,0,0.2)', color: '#FED7AA' }}>
                {referralLink}
              </div>
              <button onClick={copyReferral} className="w-[44px] h-[44px] rounded-[10px] flex items-center justify-center shrink-0" style={{ background: 'rgba(249,115,22,0.22)' }}>
                {referralCopied ? <Check size={18} color="#86EFAC" /> : <Copy size={18} color="#FDBA74" />}
              </button>
            </div>
          ) : (
            <button
              onClick={issueReferral}
              disabled={referralBusy}
              className="w-full h-[44px] rounded-[12px] title-s flex items-center justify-center gap-2 disabled:opacity-60"
              style={{ background: 'rgba(249,115,22,0.22)', color: '#FED7AA', border: '1px solid rgba(249,115,22,0.35)' }}
            >
              {referralBusy && <Loader2 size={16} className="animate-spin" />}
              {referralBusy ? 'Создаём…' : 'Создать ссылку'}
            </button>
          )}
          {referralError && <p className="body-s text-red-300 mt-2">{referralError}</p>}
        </div>
      )}

      {isSignedIn && (
        <div className="mb-4 rounded-[16px] border border-border bg-surface-1 p-4">
          <div className="body text-primary">Публичный никнейм</div>
          <p className="body-s mt-1 text-secondary">Так тебя видят в таблицах лидеров.</p>
          <div className="mt-3 flex gap-2">
            <input
              value={nickname}
              onChange={(event) => { setNickname(event.target.value); setNicknameMessage(null); }}
              maxLength={24}
              className="min-w-0 flex-1 rounded-[11px] border border-border bg-surface-2 px-3 text-sm text-primary outline-none focus:border-blue-400"
              aria-label="Публичный никнейм"
            />
            <button
              type="button"
              onClick={saveNickname}
              disabled={nicknameBusy || !/^[\p{L}\p{N}][\p{L}\p{N}_.-]{2,23}$/u.test(nickname.trim())}
              className="rounded-[11px] px-3 text-sm font-semibold text-white disabled:opacity-45"
              style={{ background: "var(--accent-blue, #2563EB)" }}
            >
              {nicknameBusy ? "…" : "Сохранить"}
            </button>
          </div>
          {nicknameMessage && <p className="body-s mt-2 text-secondary">{nicknameMessage}</p>}
        </div>
      )}

      {isSignedIn && isDevAccount && (
        <div
          className="rounded-[16px] p-4 mb-4"
          style={{
            background: 'linear-gradient(135deg, rgba(37,99,235,0.18), rgba(37,99,235,0.06))',
            border: '1px solid rgba(96,165,250,0.35)',
          }}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="body text-primary">Режим разработчика</div>
              <div className="body-s text-secondary mt-0.5">
                Показывать dev-кнопки для тестирования
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={developerMode}
              aria-label="Режим разработчика"
              onClick={() => {
                const next = !developerMode;
                setDeveloperMode(email, next);
                setDeveloperModeState(next);
              }}
              className="relative h-8 w-14 shrink-0 rounded-full transition-colors"
              style={{
                background: developerMode ? '#2563EB' : 'rgba(100,160,230,0.18)',
                border: `1px solid ${developerMode ? 'rgba(147,197,253,0.8)' : 'rgba(100,160,230,0.32)'}`,
              }}
            >
              <span
                className="absolute top-[3px] h-6 w-6 rounded-full bg-white shadow-md transition-transform"
                style={{ transform: `translateX(${developerMode ? 24 : 3}px)` }}
              />
            </button>
          </div>
        </div>
      )}

      <div className="bg-surface-1 border border-border rounded-[16px] overflow-hidden mb-4">
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
  