import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { useAppStore } from "@/lib/store";
import { ScreenTransition } from "@/components/ScreenTransition";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { motion } from "framer-motion";

const ALLOWED_DOMAINS = [
  'gmail.com','mail.ru','inbox.ru','list.ru','bk.ru','yandex.ru','ya.ru',
  'yandex.com','rambler.ru','outlook.com','hotmail.com','live.com','icloud.com',
];

const GAS_URL = 'https://script.google.com/macros/s/AKfycbzqT10m8n2CVGdvB7G9V_-xoO8ejjw9D-V-1Gt-_QaFXc1EYsmtaW4Yxc5UEu6yBHQY/exec';

function validateEmail(email: string): string | null {
  if (/[а-яёА-ЯЁ]/u.test(email)) return 'Укажите действующий адрес электронной почты.';
  if (!/^[a-zA-Z0-9._+\-]+@[a-zA-Z0-9._+\-]+\.[a-zA-Z]{2,}$/.test(email)) {
    return 'Укажите действующий адрес электронной почты.';
  }
  const atParts = email.split('@');
  if (atParts.length !== 2) return 'Укажите действующий адрес электронной почты.';
  const domain = atParts[1].toLowerCase();
  if (!ALLOWED_DOMAINS.includes(domain)) return 'Укажите действующий адрес электронной почты.';
  return null;
}

export default function EmailScreen() {
  const [emailVal, setEmailVal] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { updateState, email: savedEmail, userState } = useAppStore();
  const [, setLocation] = useLocation();

  // Фиксируем сценарий при первом рендере: если сейчас нет email, значит это первый запуск
  const isChangingEmailRef = useRef(!!savedEmail);
  const isChangingEmail = isChangingEmailRef.current;

  const validationError = emailVal.length > 0 ? validateEmail(emailVal) : null;
  const canSubmit = !validationError && emailVal.length > 0 && agreed && !loading;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    const err = validateEmail(emailVal);
    if (err) { setError(err); return; }

    setLoading(true);
    setError(null);

    // Сначала сохраняем email в приложении — обязательно
    if (isChangingEmail) {
      updateState({ email: emailVal });
    } else {
      updateState({ email: emailVal, userState: 'active', onboardingComplete: true });
    }
    setSuccess(true);

    // Затем отправляем в Google Таблицу (не обязательно, не блокирует пользователя)
    try {
      const url = `${GAS_URL}?email=${encodeURIComponent(emailVal)}`;
      await fetch(url, { method: 'GET', mode: 'no-cors' });
      console.log('[Email submit] Sent to Google Sheet');
    } catch (e) {
      console.warn('[Email submit] Google Sheet error (email saved locally):', e);
    }
  };

  // ======== Сценарий 2: Изменение почты через настройки ========
  if (success && isChangingEmail) {
    return (
      <div className="flex flex-col h-[100dvh] items-center justify-center px-6">
        <div className="relative z-10 flex flex-col items-center w-full max-w-[340px] gap-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.88, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(37,99,235,0.2)', border: '1px solid rgba(37,99,235,0.4)' }}
          >
            <span className="text-3xl">✓</span>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.35 }}
            className="text-center"
          >
            <h2 className="title-l text-primary mb-2">Почта обновлена</h2>
            <p className="body-s text-secondary">{emailVal}</p>
          </motion.div>
          <motion.button
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.35 }}
            onClick={() => setLocation('/settings')}
            className="btn-grad btn-shimmer w-full h-[56px] rounded-[14px] title-s text-white"
          >
            Назад в настройки
          </motion.button>
        </div>
      </div>
    );
  }

  // ======== Сценарий 1: Первый запуск, обучение ========
  if (success && !isChangingEmail) {
    return (
      <div className="flex flex-col h-[100dvh] items-center justify-center px-6">
        <div className="relative z-10 flex flex-col items-center w-full max-w-[340px] gap-6">
          <div className="flex justify-end w-full">
            <motion.div
              initial={{ opacity: 0, scale: 0.88, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-row-reverse items-end gap-3"
            >
              <img
                src="/maxim-avatar.png"
                alt="Максим"
                className="w-11 h-11 rounded-full object-cover shrink-0"
                style={{ boxShadow: '0 0 0 2px #2563EB' }}
              />
              <div className="flex flex-col items-end gap-1">
                <span style={{ fontSize: 11, fontWeight: 700, color: '#93c5fd', letterSpacing: '0.03em', paddingRight: 4 }}>
                  Татаринов Максим
                </span>
                <div
                  className="rounded-[16px] rounded-br-[4px] px-4 py-3 text-left"
                  style={{
                    background: 'rgba(10,13,26,0.98)',
                    border: '1.5px solid rgba(37,99,235,0.5)',
                    boxShadow: '0 4px 24px rgba(0,0,0,0.6)',
                    maxWidth: 260,
                  }}
                >
                  <p className="body text-primary leading-snug">
                    Тебе доступна первая статья, которая положит начало накоплению твоего потенциала.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>

          <motion.button
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            onClick={() => setLocation('/academy')}
            className="btn-grad btn-shimmer w-full h-[56px] rounded-[14px] title-s text-white"
          >
            Перейти в Академию →
          </motion.button>
        </div>
      </div>
    );
  }

  return (
    <ScreenTransition className="flex flex-col p-5 relative min-h-[100dvh]">
      
      <div className="flex-1 mt-[20dvh] relative z-10">
        <h1 className="display-l mb-4">
          {isChangingEmail
            ? <><span className="text-blue">Изменить</span> почту</>
            : <>Подключи <span className="text-blue">уведомления</span></>
          }
        </h1>
        <p className="body-s text-secondary mb-8">
          {isChangingEmail
            ? `Текущая почта: ${savedEmail}. Введи новую.`
            : 'Введи свой email, чтобы получать уведомления о новых статьях Академии и новостях проекта.'
          }
        </p>

        <Input
          type="email"
          placeholder="your@email.com"
          value={emailVal}
          onChange={(e) => { setEmailVal(e.target.value); setError(null); }}
          className="h-[56px] bg-surface-1 border-[rgba(255,255,255,0.1)] rounded-[12px] text-primary body mb-2 placeholder:text-tertiary px-4 focus-visible:ring-1 focus-visible:ring-blue-core focus-visible:border-transparent"
          disabled={loading}
        />

        {(validationError || error) && (
          <p className="body-s mb-4" style={{ color: 'var(--error)' }}>
            {validationError || error}
          </p>
        )}
        {!validationError && !error && <div className="mb-4" />}

        <div className="flex items-start gap-3 mb-8">
          <Checkbox 
            id="agreement" 
            checked={agreed} 
            onCheckedChange={(c) => setAgreed(!!c)} 
            className="mt-1 data-[state=checked]:bg-blue-core data-[state=checked]:border-blue-core"
            disabled={loading}
          />
          <label htmlFor="agreement" className="body-s text-secondary cursor-pointer">
            Я согласен с обработкой персональных данных (
            <button
              type="button"
              className="text-blue-light underline active:opacity-70"
              onClick={() => setLocation('/privacy-policy')}
            >
              политика
            </button>
            )
          </label>
        </div>
      </div>

      <div className="pb-10 relative z-10">
        <button
          disabled={!canSubmit}
          onClick={handleSubmit}
          className="btn-grad btn-shimmer w-full h-[56px] rounded-[14px] title-s text-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          style={!canSubmit ? { background: 'var(--bg-surface-2)', color: 'var(--text-tertiary)', boxShadow: 'none' } : {}}
        >
          {loading ? 'Отправка...' : 'Продолжить'}
        </button>
      </div>
    </ScreenTransition>
  );
}
