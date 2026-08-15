import { useAuth, useClerk } from "@clerk/react";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import { EmailCodeAuthCard, type EmailCodeAuthStep } from "@/components/EmailCodeAuthCard";
import { markAuthTransition } from "@/lib/auth-transition";
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

type CodeSecondFactor =
  | { strategy: "email_code"; emailAddressId: string }
  | { strategy: "phone_code"; phoneNumberId: string };

function isCodeSecondFactor(
  f: { strategy: string; emailAddressId?: string; phoneNumberId?: string },
): f is CodeSecondFactor {
  return (
    (f.strategy === "email_code" && Boolean(f.emailAddressId)) ||
    (f.strategy === "phone_code" && Boolean(f.phoneNumberId))
  );
}

function incompleteSignInMessage(status: string | null): string {
  switch (status) {
    case "needs_second_factor":
      return "Первый код принят. Для входа нужен второй код.";
    case "needs_client_trust":
      return "Нужно подтвердить вход на новом устройстве. Запрашиваю дополнительный код.";
    case "needs_protect_check":
      return "Clerk запросил дополнительную проверку безопасности. Обнови страницу и попробуй снова.";
    default:
      return "Код принят не полностью. Попробуй запросить новый код.";
  }
}

export default function SignInPage() {
  const { client, setActive } = useClerk();
  const { isLoaded: authLoaded } = useAuth();
  const [, setLocation] = useLocation();
  const [step, setStep] = useState<EmailCodeAuthStep>("email");
  const [isSecondFactor, setIsSecondFactor] = useState(false);
  const [secondFactor, setSecondFactor] = useState<CodeSecondFactor | null>(null);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
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
      setIsSecondFactor(false);
      setSecondFactor(null);
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
        isSecondFactor && secondFactor
          ? client.signIn.attemptSecondFactor({ strategy: secondFactor.strategy, code: code.trim() })
          : client.signIn.attemptFirstFactor({ strategy: "email_code", code: code.trim() }),
      );
      if (result.status === "complete" && result.createdSessionId) {
        markAuthTransition();
        await withAuthTimeout(setActive({ session: result.createdSessionId }));
        const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");
        window.location.assign(basePath || "/");
        return;
      }

      if (!isSecondFactor && (result.status === "needs_second_factor" || result.status === "needs_client_trust")) {
        const availableFactor = result.supportedSecondFactors?.find((factor) =>
          isCodeSecondFactor(factor as { strategy: string; emailAddressId?: string; phoneNumberId?: string }),
        ) as CodeSecondFactor | undefined;
        if (availableFactor) {
          if (availableFactor.strategy === "email_code") {
            await withAuthTimeout(client.signIn.prepareSecondFactor({
              strategy: "email_code",
              emailAddressId: availableFactor.emailAddressId,
            }));
          } else {
            await withAuthTimeout(client.signIn.prepareSecondFactor({
              strategy: "phone_code",
              phoneNumberId: availableFactor.phoneNumberId,
            }));
          }
          setSecondFactor(availableFactor);
          setIsSecondFactor(true);
          setCode("");
          setError(null);
          return;
        }
      }

      throw new Error(incompleteSignInMessage(result.status));
    } catch (err) {
      setError(getClerkErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const resendCode = async () => {
    if (isSecondFactor && secondFactor) {
      if (!client || !authLoaded) return;
      setLoading(true);
      setError(null);
      try {
        await withAuthTimeout(client.signIn.prepareSecondFactor({
          strategy: secondFactor.strategy,
          ...(secondFactor.strategy === "email_code"
            ? { emailAddressId: secondFactor.emailAddressId }
            : { phoneNumberId: secondFactor.phoneNumberId }),
        }));
        setCode("");
      } catch (err) {
        setError(getClerkErrorMessage(err));
      } finally {
        setLoading(false);
      }
      return;
    }
    await sendEmailCode();
  };

  const submit = step === "email" ? sendEmailCode : verifyCode;

  return (
    <div className="min-h-[100dvh] w-full flex items-center justify-center px-4" style={{ background: '#0F2035' }}>
      <EmailCodeAuthCard
        mode="sign-in"
        step={step}
        isSecondFactor={isSecondFactor}
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
        onResend={resendCode}
        onBack={() => {
          setStep("email");
          setIsSecondFactor(false);
          setSecondFactor(null);
          setCode("");
          setError(null);
        }}
        onSwitchMode={() => setLocation("/sign-up")}
      />
    </div>
  );
}
