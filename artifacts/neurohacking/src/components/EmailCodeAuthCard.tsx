import { ArrowLeft, Mail, RefreshCw, Sparkles } from "lucide-react";

export type EmailCodeAuthStep = "email" | "code";
export type EmailCodeAuthMode = "sign-in" | "sign-up";

interface EmailCodeAuthCardProps {
  mode: EmailCodeAuthMode;
  step: EmailCodeAuthStep;
  email: string;
  code: string;
  loading: boolean;
  authReady: boolean;
  error: string | null;
  onEmailChange: (value: string) => void;
  onCodeChange: (value: string) => void;
  onSubmit: () => void;
  onBack: () => void;
  onResend: () => void;
  onSwitchMode: () => void;
}

export function EmailCodeAuthCard({
  mode,
  step,
  email,
  code,
  loading,
  authReady,
  error,
  onEmailChange,
  onCodeChange,
  onSubmit,
  onBack,
  onResend,
  onSwitchMode,
}: EmailCodeAuthCardProps) {
  const isSignUp = mode === "sign-up";

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
          <div
            className="mb-4 flex h-12 w-12 items-center justify-center rounded-[16px]"
            style={{
              background: "linear-gradient(135deg, rgba(37,99,235,0.32), rgba(96,165,250,0.12))",
              border: "1px solid rgba(96,165,250,0.3)",
            }}
          >
            {step === "email" ? <Sparkles size={22} className="text-blue-light" /> : <Mail size={22} className="text-blue-light" />}
          </div>
          <h1 className="title-l text-primary">
            {isSignUp ? "Регистрация" : "Вход"}
          </h1>
          <p className="body-s mt-2 max-w-[290px] text-secondary">
            {step === "email"
              ? isSignUp
                ? "Введи email — мы отправим код подтверждения. Пароль не нужен."
                : "Введи email — мы отправим код для входа. Пароль не нужен."
              : <>Код отправлен на <strong className="text-primary">{email}</strong></>}
          </p>
        </div>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            onSubmit();
          }}
          className="space-y-4"
        >
          {step === "email" ? (
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
          ) : (
            <label className="block">
              <span className="caption mb-2 block text-secondary">Код из письма</span>
              <input
                type="text"
                value={code}
                onChange={(event) => onCodeChange(event.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="Введите 6 цифр"
                inputMode="numeric"
                autoComplete="one-time-code"
                autoFocus
                required
                maxLength={6}
                className="h-[58px] w-full rounded-[14px] border px-4 text-center text-2xl tracking-[0.35em] text-primary outline-none transition focus:border-blue-core"
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

          <button
            type="submit"
            disabled={!authReady || loading || (step === "code" && code.length < 4)}
            className="btn-grad btn-shimmer h-[52px] w-full rounded-[14px] title-s text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading
              ? "Проверяем…"
              : !authReady
                ? "Загружаем вход…"
                : step === "email"
                  ? "Получить код"
                  : "Подтвердить email"}
          </button>
        </form>

        {step === "code" && (
          <div className="mt-5 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onBack}
              disabled={!authReady || loading}
              className="inline-flex items-center gap-1.5 body-s text-secondary transition hover:text-primary disabled:opacity-50"
            >
              <ArrowLeft size={15} />
              Изменить email
            </button>
            <button
              type="button"
              onClick={onResend}
              disabled={!authReady || loading}
              className="inline-flex items-center gap-1.5 body-s text-blue-light transition hover:text-primary disabled:opacity-50"
            >
              <RefreshCw size={14} />
              Отправить снова
            </button>
          </div>
        )}

        {step === "email" && (
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