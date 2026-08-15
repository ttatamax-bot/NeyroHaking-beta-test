import { useClerk } from "@clerk/react";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import { EmailCodeAuthCard, type EmailCodeAuthStep } from "@/components/EmailCodeAuthCard";
function getClerkErrorMessage(error: unknown): string {
  const e = error as { errors?: Array<{ longMessage?: string; message?: string }>; message?: string; longMessage?: string };
  return (
    e.errors?.[0]?.longMessage ??
    e.errors?.[0]?.message ??
    e.longMessage ??
    e.message ??
    "Не удалось отправить код. Проверь email и попробуй ещё раз."
  );
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
  const { client, setActive, loaded } = useClerk();
  const [, setLocation] = useLocation();
  const [step, setStep] = useState<EmailCodeAuthStep>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (loaded) return;
    const timer = window.setTimeout(() => {
      setError("Сервис входа не загрузился. Обнови страницу и попробуй снова.");
    }, 10000);
    return () => window.clearTimeout(timer);
  }, [loaded]);

  const sendCode = async () => {
    if (!loaded || !client || !email.trim()) return;
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
      setStep("code");
    } catch (err) {
      setError(getClerkErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async () => {
    if (!loaded || !client || !code.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const signIn = client.signIn;
      const result = await withAuthTimeout(signIn.attemptFirstFactor({
        strategy: "email_code",
        code: code.trim(),
      }));
      if (result.status === "complete" && result.createdSessionId) {
        await setActive({ session: result.createdSessionId });
        setLocation("/");
      } else {
        throw new Error("Вход не завершён. Попробуй ещё раз.");
      }
    } catch (err) {
      setError(getClerkErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] w-full flex items-center justify-center px-4" style={{ background: '#0F2035' }}>
      <EmailCodeAuthCard
        mode="sign-in"
        step={step}
        email={email}
        code={code}
        loading={loading}
        authReady={loaded}
        error={error}
        onEmailChange={setEmail}
        onCodeChange={setCode}
        onSubmit={step === "email" ? sendCode : verifyCode}
        onBack={() => { setStep("email"); setCode(""); setError(null); }}
        onResend={sendCode}
        onSwitchMode={() => setLocation("/sign-up")}
      />
    </div>
  );
}
