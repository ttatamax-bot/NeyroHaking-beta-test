import { useClerk } from "@clerk/react";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import { EmailCodeAuthCard, type EmailLinkAuthStep } from "@/components/EmailCodeAuthCard";

function getClerkErrorMessage(error: unknown): string {
  const e = error as { errors?: Array<{ longMessage?: string; message?: string }>; message?: string; longMessage?: string };
  return (
    e.errors?.[0]?.longMessage ??
    e.errors?.[0]?.message ??
    e.longMessage ??
    e.message ??
    "Не удалось отправить ссылку. Попробуй ещё раз."
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

export default function SignUpPage() {
  const { client, loaded } = useClerk();
  const [, setLocation] = useLocation();
  const [step, setStep] = useState<EmailLinkAuthStep>("email");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (loaded) return;
    const timer = window.setTimeout(() => {
      setError("Сервис входа не загрузился. Обнови страницу и попробуй снова.");
    }, 10000);
    return () => window.clearTimeout(timer);
  }, [loaded]);

  const sendEmailLink = async () => {
    if (!loaded || !client || !email.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const signUp = client.signUp;
      await withAuthTimeout(signUp.create({ emailAddress: email.trim(), locale: "ru-RU" }));
      const callbackUrl = `${window.location.origin}${import.meta.env.BASE_URL.replace(/\/$/, "")}/sign-up/verify`;
      const emailLinkFlow = signUp.createEmailLinkFlow();
      await withAuthTimeout(emailLinkFlow.startEmailLinkFlow({ redirectUrl: callbackUrl }));
      setStep("sent");
    } catch (err) {
      setError(getClerkErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] w-full flex items-center justify-center px-4" style={{ background: '#0F2035' }}>
      <EmailCodeAuthCard
        mode="sign-up"
        step={step}
        email={email}
        loading={loading}
        authReady={loaded}
        error={error}
        onEmailChange={setEmail}
        onSubmit={sendEmailLink}
        onBack={() => { setStep("email"); setError(null); }}
        onSwitchMode={() => setLocation("/sign-in")}
      />
    </div>
  );
}
