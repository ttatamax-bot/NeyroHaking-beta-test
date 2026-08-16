import { useAuth, useClerk } from "@clerk/react";
import { useLocation } from "wouter";
import { useEffect, useRef, useState } from "react";
import { EmailCodeAuthCard, type EmailCodeAuthStep } from "@/components/EmailCodeAuthCard";
import { markAuthTransition } from "@/lib/auth-transition";
import { getRememberedEmail } from "@/lib/remembered-email";

type SignUpRequirement = "first_name" | "last_name" | "username" | "password" | "legal_accepted";
const pendingNicknameStorageKey = "neuro_pending_nickname";

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

function generateTechnicalPassword(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*";
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return `N${Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join("")}x`;
}

export default function SignUpPage() {
  const { client, setActive } = useClerk();
  const { isLoaded: authLoaded } = useAuth();
  const [, setLocation] = useLocation();
  const [step, setStep] = useState<EmailCodeAuthStep>("email");
  const [email, setEmail] = useState(() => getRememberedEmail());
  const [code, setCode] = useState("");
  const [requirements, setRequirements] = useState<SignUpRequirement[] | null>(null);
  const [clerkRequirements, setClerkRequirements] = useState<SignUpRequirement[] | null>(null);
  const [pendingSessionId, setPendingSessionId] = useState<string | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [legalAccepted, setLegalAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [authLoadFailed, setAuthLoadFailed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const technicalPasswordRef = useRef<string | null>(null);

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
      technicalPasswordRef.current ??= generateTechnicalPassword();
      await withAuthTimeout(signUp.create({
        emailAddress: email.trim(),
        locale: "ru-RU",
        password: technicalPasswordRef.current,
      }));
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
        setPendingSessionId(result.createdSessionId);
        setClerkRequirements([]);
        setRequirements(["username"]);
        setError(null);
        return;
      }

      const missing = getRequirements(result);
      if (result.status === "missing_requirements" && missing.length > 0) {
        setClerkRequirements(missing);
        setRequirements(missing.filter((field) => field !== "password").length > 0
          ? missing.filter((field) => field !== "password")
          : ["username"]);
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

    if (username.trim().length < 3) {
      setError("Введи имя пользователя длиной не менее 3 символов.");
      return;
    }

    if (pendingSessionId) {
      try {
        sessionStorage.setItem(pendingNicknameStorageKey, username.trim());
      } catch {
        // The profile setup screen still allows entering the nickname manually.
      }
      setLoading(true);
      setError(null);
      try {
        markAuthTransition();
        await withAuthTimeout(setActive({ session: pendingSessionId }));
        const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");
        window.location.assign(`${basePath}/profile-setup`);
      } catch (err) {
        setError(getClerkErrorMessage(err));
      } finally {
        setLoading(false);
      }
      return;
    }

    const actualRequirements = clerkRequirements ?? requirements;
    if (actualRequirements.includes("first_name") && !firstName.trim()) {
      setError("Введи имя.");
      return;
    }
    if (actualRequirements.includes("last_name") && !lastName.trim()) {
      setError("Введи фамилию.");
      return;
    }
    if (actualRequirements.includes("legal_accepted") && !legalAccepted) {
      setError("Подтверди согласие с условиями.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      technicalPasswordRef.current ??= generateTechnicalPassword();
      const result = await withAuthTimeout(client.signUp.update({
        ...(actualRequirements.includes("first_name") ? { firstName: firstName.trim() } : {}),
        ...(actualRequirements.includes("last_name") ? { lastName: lastName.trim() } : {}),
        ...(actualRequirements.includes("username") ? { username: username.trim() } : {}),
        ...(actualRequirements.includes("password") ? { password: technicalPasswordRef.current } : {}),
        ...(actualRequirements.includes("legal_accepted") ? { legalAccepted: true } : {}),
      }));

      if (result.status === "complete" && result.createdSessionId) {
        try {
          sessionStorage.setItem(pendingNicknameStorageKey, username.trim());
        } catch {
          // The profile setup screen still allows entering the nickname manually.
        }
        await withAuthTimeout(setActive({ session: result.createdSessionId }));
        const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");
        window.location.assign(`${basePath}/profile-setup`);
        return;
      }

      const remaining = getRequirements(result);
      setClerkRequirements(remaining);
      setRequirements(remaining.filter((field) => field !== "password").length > 0
        ? remaining.filter((field) => field !== "password")
        : ["username"]);
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
            <label className="block">
              <span className="caption mb-2 block text-secondary">Имя пользователя</span>
              <input
                value={username}
                onChange={(event) => { setUsername(event.target.value); setError(null); }}
                autoComplete="username"
                placeholder="например, neuro_user"
                maxLength={24}
                className="h-[52px] w-full rounded-[14px] border px-4 text-primary outline-none"
                style={{ background: "#122448", borderColor: "rgba(100,160,230,0.25)" }}
              />
            </label>
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
              onClick={() => {
                setRequirements(null);
                setClerkRequirements(null);
                setPendingSessionId(null);
                setError(null);
              }}
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
        onBack={() => {
          setStep("email");
          setCode("");
          setRequirements(null);
          setClerkRequirements(null);
          setPendingSessionId(null);
          technicalPasswordRef.current = null;
          setError(null);
        }}
        onSwitchMode={() => setLocation("/sign-in")}
      />
    </div>
  );
}
