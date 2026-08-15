import { ArrowLeft, Mail, RefreshCw, Sparkles } from "lucide-react";

export type EmailLinkAuthStep = "email" | "sent";
export type EmailCodeAuthMode = "sign-in" | "sign-up";

interface EmailCodeAuthCardProps {
  mode: EmailCodeAuthMode;
  step: EmailLinkAuthStep;
  email: string;
  loading: boolean;
  authReady: boolean;
  error: string | null;
  onEmailChange: (value: string) => void;
  onSubmit: () => void;
  onBack: () => void;
  onSwitchMode: () => void;
}

export function EmailCodeAuthCard({
  mode,
  step,
  email,
  loading,
  authReady,
  error,
  onEmailChange,
  onSubmit,
  onBack,
  onSwitchMode,
}: EmailCodeAuthCardProps) {
  const isSignUp = mode === "sign-up";
  const isSent = step === "sent";

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
            {isSent ? <Mail size={22} className="text-blue-light" /> : <Sparkles size={22} className="text-blue-light" />}
          </div>
          <h1 className="title-l text-primary">
            {isSent ? "Проверь почту" : isSignUp ? "Регистрация" : "Вход"}
          </h1>
          <p className="body-s mt-2 max-w-[290px] text-secondary">
            {isSent
              ? <>Мы отправили письмо с кнопкой подтверждения на <strong className="text-primary">{email}</strong>.</>
              : isSignUp
                ? "Введи email — мы отправим ссылку для подтверждения. Пароль и код не нужны."
                : "Введи email — мы отправим ссылку для входа. Пароль и код не нужны."}
          </p>
        </div>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            onSubmit();
          }}
          className="space-y-4"
        >
          {!isSent && (
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

          {isSent && (
            <div
              className="rounded-[14px] border px-4 py-3 text-center body-s text-secondary"
              style={{ background: "rgba(37,99,235,0.08)", borderColor: "rgba(96,165,250,0.22)" }}
            >
              Открой письмо и нажми кнопку подтверждения. Страница обновится автоматически.
            </div>
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

          {isSignUp && !isSent && (
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
            disabled={!authReady || loading || !email.trim()}
            className="btn-grad btn-shimmer h-[52px] w-full rounded-[14px] title-s text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading
              ? "Отправляем…"
              : !authReady
                ? "Загружаем вход…"
                : isSent
                  ? "Отправить письмо снова"
                  : "Получить ссылку"}
          </button>
        </form>

        {isSent && (
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
            <span className="inline-flex items-center gap-1.5 body-s text-blue-light">
              <RefreshCw size={14} />
              Ссылка действует ограниченное время
            </span>
          </div>
        )}

        {!isSent && (
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