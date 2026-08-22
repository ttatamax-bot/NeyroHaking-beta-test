import { ArrowLeft, RefreshCw } from "lucide-react";
import { MemoryTechniqueLogo } from "./MemoryTechniqueLogo";

export type EmailCodeAuthStep = "email" | "code";
export type EmailLinkAuthStep = EmailCodeAuthStep;
export type EmailCodeAuthMode = "sign-in" | "sign-up";

interface EmailCodeAuthCardProps {
  mode: EmailCodeAuthMode;
  step: EmailCodeAuthStep;
  isSecondFactor?: boolean;
  email: string;
  code: string;
  loading: boolean;
  authReady: boolean;
  authLoadFailed?: boolean;
  error: string | null;
  onEmailChange: (value: string) => void;
  onCodeChange: (value: string) => void;
  onSubmit: () => void;
  onRetryAuth?: () => void;
  onResend: () => void;
  onBack: () => void;
  onSwitchMode: () => void;
}

export function EmailCodeAuthCard({
  mode,
  step,
  isSecondFactor = false,
  email,
  code,
  loading,
  authReady,
  authLoadFailed = false,
  error,
  onEmailChange,
  onCodeChange,
  onSubmit,
  onRetryAuth,
  onResend,
  onBack,
  onSwitchMode,
}: EmailCodeAuthCardProps) {
  const isSignUp = mode === "sign-up";
  const isCodeStep = step === "code";

  return (
    <div className="w-full max-w-[390px] px-4">
      <div
        className="rounded-[24px] border p-6"
        style={{
          background: "rgba(15,32,53,0.92)",
          borderColor: "rgba(100,160,230,0.22)",
          boxShadow: "0 24px 80px rgba(0,0,0,0.35)",
        }}
      >
        <div className="mb-7 flex flex-col items-center text-center">
          <div className="mb-4 flex h-[72px] w-[72px] items-center justify-center">
            <MemoryTechniqueLogo size={72} loading />
          </div>
          <h1 className="title-l text-primary">
            {isCodeStep ? "Введи код" : isSignUp ? "Регистрация" : "Вход"}
          </h1>
          <p className="body-s mt-2 max-w-[290px] text-secondary">
            {isCodeStep
              ? isSecondFactor
                ? <>Первый код принят. Мы отправили ещё один код на <strong className="text-primary">{email}</strong>.</>
                : <>Мы отправили код на <strong className="text-primary">{email}</strong>.</>
              : isSignUp
                ? "Введи email — мы отправим код для подтверждения аккаунта."
                : "Введи email — мы отправим код для входа."
            }
          </p>
        </div>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (authLoadFailed) {
              onRetryAuth?.();
            } else {
              onSubmit();
            }
          }}
          className="space-y-4"
        >
          {!isCodeStep && (
            <label className="block">
              <span className="caption mb-2 block text-secondary">Email</span>
              <input
                type="email"
                value={email}
                onChange={(event) => onEmailChange(event.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                autoFocus
                required
                className="h-[52px] w-full rounded-[14px] border px-4 text-primary outline-none transition focus:border-blue-core"
                style={{ background: "#122448", borderColor: "rgba(100,160,230,0.25)" }}
              />
            </label>
          )}

          {isCodeStep && (
            <div
              className="rounded-[14px] border px-4 py-3 text-center body-s text-secondary"
              style={{ background: "rgba(37,99,235,0.08)", borderColor: "rgba(96,165,250,0.22)" }}
            >
              Проверь папку «Спам», если письма нет во входящих.
            </div>
          )}

          {isCodeStep && (
            <label className="block">
              <span className="caption mb-2 block text-secondary">Код из письма</span>
              <input
                type="text"
                value={code}
                onChange={(event) => onCodeChange(event.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="000000"
                inputMode="numeric"
                autoComplete="one-time-code"
                autoFocus
                required
                maxLength={6}
                className="h-[52px] w-full rounded-[14px] border px-4 text-center text-xl tracking-[0.35em] text-primary outline-none transition focus:border-blue-core"
                style={{ background: "#122448", borderColor: "rgba(100,160,230,0.25)" }}
              />
            </label>
          )}

          {error && (
            <div
              className="rounded-[12px] border px-3 py-2.5 body-s text-red-200"
              style={{ background: "rgba(239,68,68,0.1)", borderColor: "rgba(239,68,68,0.3)" }}
              role="alert"
            >
              {error}
            </div>
          )}

          {isSignUp && !isCodeStep && (
            <div
              id="clerk-captcha"
              data-cl-theme="dark"
              data-cl-size="flexible"
              data-cl-language="auto"
              className="flex min-h-0 justify-center"
            />
          )}

          <button
            type="submit"
            disabled={loading || (!authReady && !authLoadFailed)}
            className="btn-grad btn-shimmer h-[52px] w-full rounded-[14px] title-s text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading
              ? "Отправляем…"
              : authLoadFailed
                ? "Повторить загрузку"
              : !authReady
                ? "Загружаем вход…"
                : isCodeStep
                  ? "Подтвердить код"
                  : "Получить код"}
          </button>
        </form>

        {isCodeStep && (
          <div className="mt-5 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onBack}
              disabled={loading}
              className="inline-flex items-center gap-1.5 body-s text-secondary transition hover:text-primary disabled:opacity-50"
            >
              <ArrowLeft size={15} />
              Изменить email
            </button>
            <button
              type="button"
              onClick={onResend}
              disabled={loading}
              className="inline-flex items-center gap-1.5 body-s text-blue-light transition hover:text-primary disabled:opacity-50"
            >
              <RefreshCw size={14} />
              Отправить ещё раз
            </button>
          </div>
        )}

        {!isCodeStep && (
          <p className="mt-6 text-center body-s text-secondary">
            {isSignUp ? "Уже есть аккаунт?" : "Нет аккаунта?"}{" "}
            <button type="button" onClick={onSwitchMode} className="text-blue-light hover:text-primary">
              {isSignUp ? "Войти" : "Зарегистрироваться"}
            </button>
          </p>
        )}
      </div>
    </div>
  );
}