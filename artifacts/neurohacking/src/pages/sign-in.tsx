import { useSignIn } from "@clerk/react";
import { useLocation } from "wouter";
import { useState } from "react";
import { EmailCodeAuthCard, type EmailCodeAuthStep } from "@/components/EmailCodeAuthCard";

function getClerkErrorMessage(error: unknown): string {
  const clerkError = error as { errors?: Array<{ longMessage?: string; message?: string }>; message?: string };
  return clerkError.errors?.[0]?.longMessage
    ?? clerkError.errors?.[0]?.message
    ?? clerkError.message
    ?? "Не удалось отправить код. Проверь email и попробуй ещё раз.";
}

export default function SignInPage() {
  const { signIn, fetchStatus } = useSignIn();
  const [, setLocation] = useLocation();
  const [step, setStep] = useState<EmailCodeAuthStep>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendCode = async () => {
    if (!email.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const result = await signIn.emailCode.sendCode(
        step === "email" ? { emailAddress: email.trim() } : undefined,
      );
      if (result.error) throw result.error;
      setStep("code");
    } catch (err) {
      setError(getClerkErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async () => {
    if (!code.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const result = await signIn.emailCode.verifyCode({ code: code.trim() });
      if (result.error) throw result.error;
      if (signIn.status !== "complete") {
        throw new Error("Email подтверждён не полностью. Попробуй ещё раз.");
      }
      const finalized = await signIn.finalize();
      if (finalized.error) throw finalized.error;
      setLocation("/");
    } catch (err) {
      setError(getClerkErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const submit = step === "email" ? sendCode : verifyCode;

  return (
    <div className="min-h-[100dvh] w-full flex items-center justify-center px-4" style={{ background: '#0F2035' }}>
      <EmailCodeAuthCard
        mode="sign-in"
        step={step}
        email={email}
        code={code}
        loading={loading || fetchStatus === "fetching"}
        error={error}
        onEmailChange={setEmail}
        onCodeChange={setCode}
        onSubmit={submit}
        onBack={() => { setStep("email"); setCode(""); setError(null); }}
        onResend={sendCode}
        onSwitchMode={() => setLocation("/sign-up")}
      />
    </div>
  );
}
