import { useAuth, useClerk } from "@clerk/react";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import { EmailCodeAuthCard, type EmailCodeAuthStep } from "@/components/EmailCodeAuthCard";
function getClerkErrorMessage(error: unknown): string {
  const e = error as { errors?: Array<{ longMessage?: string; message?: string }>; message?: string; longMessage?: string };
  const message =
    e.errors?.[0]?.longMessage ??
    e.errors?.[0]?.message ??
    e.longMessage ??
    e.message ??
    "Не удалось отправить код. Проверь email и попробуй ещё раз.";
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

function isEmailCodeFactor(f: { strategy: string }): f is { strategy: "email_code"; emailAddressId: string } {
  return f.strategy === "email_code";
}

export default function SignInPage() {
  const { client, setActive } = useClerk();
  const { isLoaded: authLoaded } = useAuth();
  const [, setLocation] = useLocation();
  const [step, setStep] = useState<EmailCodeAuthStep>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoaded) return;
    const timer = window.setTimeout(() => {
      setError("Сервис входа не загрузился. Обнови страницу и попробуй снова.");
    }, 10000);
    return () => window.clearTimeout(timer);
  }, [authLoaded]);

  const sendEmailCode = async () => {
    if (!authLoaded || !client) return;
    if (!email.trim()) {
      setError("Введи email, чтобы получить код.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const signIn = client.signIn;
      const result = await withAuthTimeout(signIn.create({ identifier: email.trim() }));
      type EmailCodeFactor = { strategy: "email_code"; emailAddressId: string };
      const emailFactor = result.supportedFirstFactors?.find(isEmailCodeFactor) as EmailCodeFactor | undefined;
      if (!emailFactor) {
        throw new Error("Аккаунт не найден. Зарегистрируйся, чтобы продолжить.");
      }
      await withAuthTimeout(signIn.prepareFirstFactor({
        strategy: "email_code",
        emailAddressId: emailFactor.emailAddressId,
      }));
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
        client.signIn.attemptFirstFactor({ strategy: "email_code", code: code.trim() }),
      );
      if (result.status !== "complete" || !result.createdSessionId) {
        throw new Error("Код принят не полностью. Попробуй запросить новый код.");
      }
      await withAuthTimeout(setActive({ session: result.createdSessionId }));
      setLocation("/");
    } catch (err) {
      setError(getClerkErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const submit = step === "email" ? sendEmailCode : verifyCode;

  return (
    <div className="min-h-[100dvh] w-full flex items-center justify-center px-4" style={{ background: '#0F2035' }}>
      <EmailCodeAuthCard
        mode="sign-in"
        step={step}
        email={email}
        code={code}
        loading={loading}
        authReady={authLoaded}
        error={error}
        onEmailChange={setEmail}
        onCodeChange={setCode}
        onSubmit={submit}
        onResend={sendEmailCode}
        onBack={() => { setStep("email"); setCode(""); setError(null); }}
        onSwitchMode={() => setLocation("/sign-up")}
      />
    </div>
  );
}
