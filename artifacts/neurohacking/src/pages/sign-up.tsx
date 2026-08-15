import { useAuth, useClerk } from "@clerk/react";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import { EmailCodeAuthCard, type EmailCodeAuthStep } from "@/components/EmailCodeAuthCard";

type SignUpRequirement = "first_name" | "last_name" | "username" | "password" | "legal_accepted";

function getClerkErrorMessage(error: unknown): string {
  const e = error as { errors?: Array<{ longMessage?: string; message?: string }>; message?: string; longMessage?: string };
  const message =
    e.errors?.[0]?.longMessage ??
    e.errors?.[0]?.message ??
    e.longMessage ??
    e.message ??
    "Не удалось отправить код. Попробуй ещё раз.";
  return message;
}

function withAuthTimeout<T>(promise: Promise<T>, timeoutMs = 15000): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => {
      reject(new Error("Clerk не ответил за 15 секунд. Проверь соединение и попробуй ещё раз."));
    }, timeoutMs);
    promise.then(
      (value) => { window.clearTimeout(timer); resolve(value); },
      (reason) => { window.clearTimeout(timer); reject(reason); },
    );
  });
}

function getRequirements(result: { missingFields?: unknown[] }): SignUpRequirement[] {
  return (result.missingFields ?? []).filter(
    (field): field is SignUpRequirement =>
      field === "first_name" ||
      field === "last_name" ||
      field === "username" ||
      field === "password" ||
      field === "legal_accepted",
  );
}

export default function SignUpPage() {
  const { client, setActive } = useClerk();
  const { isLoaded: authLoaded } = useAuth();
  const [, setLocation] = useLocation();
  const [step, setStep] = useState<EmailCodeAuthStep>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [requirements, setRequirements] = useState<SignUpRequirement[] | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [legalAccepted, setLegalAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [authLoadFailed, setAuthLoadFailed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoaded) {
      setAuthLoadFailed(false);
      return;
    }
    const timer = window.setTimeout(() => {
      setAuthLoadFailed(true);
      setError("Сервис входа не загрузился. Если у тебя Brave, отключи Shields для этого сайта или открой его в Safari/Chrome, затем повтори загрузку.");
    }, 10000);
    return () => window.clearTimeout(timer);
  }, [authLoaded]);

  const retryAuthLoad = () => {
    window.location.reload();
  };

  const sendEmailCode = async () => {
    if (!authLoaded || !client) return;
    if (!email.trim()) {
      setError("Введи email, чтобы получить код.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const signUp = client.signUp;
      await withAuthTimeout(signUp.create({ emailAddress: email.trim(), locale: "ru-RU" }));
      await withAuthTimeout(signUp.prepareEmailAddressVerification({ strategy: "email_code" }));
      setCode("");
      setStep("code");
    } catch (err) {
      setError(getClerkErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async () => {
    if (!authLoaded || !client) return;
    if (code.trim().length < 4) {
      setError("Введи код из письма.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await withAuthTimeout(
        client.signUp.attemptEmailAddressVerification({ code: code.trim() }),
      );
      if (result.status === "complete" && result.createdSessionId) {
        await withAuthTimeout(setActive({ session: result.createdSessionId }));
        setLocation("/profile-setup");
        return;
      }

      const missing = getRequirements(result);
      if (result.status === "missing_requirements" && missing.length > 0) {
        setRequirements(missing);
        setError(null);
        return;
      }

      if (result.status !== "complete") {
        throw new Error("Код принят не полностью. Попробуй запросить новый код.");
      }
      throw new Error("Clerk не создал сессию аккаунта. Попробуй запросить новый код.");
    } catch (err) {
      setError(getClerkErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const completeSignUp = async () => {
    if (!authLoaded || !client || !requirements || loading) return;

    if (requirements.includes("first_name") && !firstName.trim()) {
      setError("Введи имя.");
      return;
    }
    if (requirements.includes("last_name") && !lastName.trim()) {
      setError("Введи фамилию.");
      return;
    }
    if (requirements.includes("username") && username.trim().length < 3) {
      setError("Введи имя пользователя длиной не менее 3 символов.");
      return;
    }
    if (requirements.includes("password") && password.length < 8) {
      setError("Пароль должен содержать не менее 8 символов.");
      return;
    }
    if (requirements.includes("legal_accepted") && !legalAccepted) {
      setError("Подтверди согласие с условиями.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const result = await withAuthTimeout(client.signUp.update({
        ...(requirements.includes("first_name") ? { firstName: firstName.trim() } : {}),
        ...(requirements.includes("last_name") ? { lastName: lastName.trim() } : {}),
        ...(requirements.includes("username") ? { username: username.trim() } : {}),
        ...(requirements.includes("password") ? { password } : {}),
        ...(requirements.includes("legal_accepted") ? { legalAccepted: true } : {}),
      }));

      if (result.status === "complete" && result.createdSessionId) {
        await withAuthTimeout(setActive({ session: result.createdSessionId }));
        setLocation("/profile-setup");
        return;
      }

      const remaining = getRequirements(result);
      setRequirements(remaining.length > 0 ? remaining : requirements);
      throw new Error("Заполни обязательные данные, чтобы создать аккаунт.");
    } catch (err) {
      setError(getClerkErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const submit = step === "email" ? sendEmailCode : verifyCode;

  if (requirements) {
    const needsFirstName = requirements.includes("first_name");
    const needsLastName = requirements.includes("last_name");
    const needsUsername = requirements.includes("username");
    const needsPassword = requirements.includes("password");
    const needsLegal = requirements.includes("legal_accepted");

    return (
      <div className="min-h-[100dvh] w-full flex items-center justify-center px-4" style={{ background: "#0F2035" }}>
        <div className="w-full max-w-[390px] rounded-[24px] border p-6" style={{
          background: "rgba(15,32,53,0.92)",
          borderColor: "rgba(100,160,230,0.22)",
          boxShadow: "0 24px 80px rgba(0,0,0,0.35)",
        }}>
          <div className="mb-7 text-center">
            <div className="mb-4 text-4xl text-blue-light">✦</div>
            <h1 className="title-l text-primary">Почти готово</h1>
            <p className="body-s mt-2 text-secondary">
              Email подтверждён. Заполни данные, чтобы создать аккаунт.
            </p>
          </div>

          <div className="space-y-4">
            {needsFirstName && (
              <label className="block">
                <span className="caption mb-2 block text-secondary">Имя</span>
                <input
                  value={firstName}
                  onChange={(event) => { setFirstName(event.target.value); setError(null); }}
                  autoComplete="given-name"
                  className="h-[52px] w-full rounded-[14px] border px-4 text-primary outline-none"
                  style={{ background: "#122448", borderColor: "rgba(100,160,230,0.25)" }}
                />
              </label>
            )}
            {needsLastName && (
              <label className="block">
                <span className="caption mb-2 block text-secondary">Фамилия</span>
                <input
                  value={lastName}
                  onChange={(event) => { setLastName(event.target.value); setError(null); }}
                  autoComplete="family-name"
                  className="h-[52px] w-full rounded-[14px] border px-4 text-primary outline-none"
                  style={{ background: "#122448", borderColor: "rgba(100,160,230,0.25)" }}
                />
              </label>
            )}
            {needsUsername && (
              <label className="block">
                <span className="caption mb-2 block text-secondary">Имя пользователя</span>
                <input
                  value={username}
                  onChange={(event) => { setUsername(event.target.value); setError(null); }}
                  autoComplete="username"
                  placeholder="например, neuro_user"
                  className="h-[52px] w-full rounded-[14px] border px-4 text-primary outline-none"
                  style={{ background: "#122448", borderColor: "rgba(100,160,230,0.25)" }}
                />
              </label>
            )}
            {needsPassword && (
              <label className="block">
                <span className="caption mb-2 block text-secondary">Пароль</span>
                <input
                  type="password"
                  value={password}
                  onChange={(event) => { setPassword(event.target.value); setError(null); }}
                  autoComplete="new-password"
                  className="h-[52px] w-full rounded-[14px] border px-4 text-primary outline-none"
                  style={{ background: "#122448", borderColor: "rgba(100,160,230,0.25)" }}
                />
              </label>
            )}
            {needsLegal && (
              <label className="flex items-start gap-3 body-s text-secondary">
                <input
                  type="checkbox"
                  checked={legalAccepted}
                  onChange={(event) => { setLegalAccepted(event.target.checked); setError(null); }}
                  className="mt-1 h-4 w-4 accent-blue-600"
                />
                <span>Я согласен с условиями использования приложения.</span>
              </label>
            )}
            {error && (
              <div className="rounded-[12px] border px-3 py-2.5 body-s text-red-200"
                style={{ background: "rgba(239,68,68,0.1)", borderColor: "rgba(239,68,68,0.3)" }}
                role="alert"
              >
                {error}
              </div>
            )}
            <button
              type="button"
              onClick={completeSignUp}
              disabled={loading}
              className="btn-grad btn-shimmer h-[52px] w-full rounded-[14px] title-s text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Создаём аккаунт…" : "Создать аккаунт"}
            </button>
            <button
              type="button"
              onClick={() => { setRequirements(null); setError(null); }}
              disabled={loading}
              className="w-full body-s text-secondary"
            >
              Вернуться к коду
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] w-full flex items-center justify-center px-4" style={{ background: '#0F2035' }}>
      <EmailCodeAuthCard
        mode="sign-up"
        step={step}
        email={email}
        code={code}
        loading={loading}
        authReady={authLoaded}
        authLoadFailed={authLoadFailed}
        error={error}
        onEmailChange={setEmail}
        onCodeChange={setCode}
        onSubmit={submit}
        onRetryAuth={retryAuthLoad}
        onResend={sendEmailCode}
        onBack={() => { setStep("email"); setCode(""); setError(null); }}
        onSwitchMode={() => setLocation("/sign-in")}
      />
    </div>
  );
}
