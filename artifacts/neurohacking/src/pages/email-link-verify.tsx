import { useClerk } from "@clerk/react";
import { useLocation } from "wouter";
import { useEffect, useRef, useState } from "react";

function getClerkErrorMessage(error: unknown): string {
  const e = error as {
    errors?: Array<{ longMessage?: string; message?: string }>;
    message?: string;
    longMessage?: string;
  };
  return (
    e.errors?.[0]?.longMessage ??
    e.errors?.[0]?.message ??
    e.longMessage ??
    e.message ??
    "Ссылка недействительна или уже использована. Запроси новую ссылку."
  );
}

function withAuthTimeout<T>(promise: Promise<T>, timeoutMs = 20000): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => {
      reject(new Error("Clerk не завершил вход за 20 секунд. Запроси новую ссылку."));
    }, timeoutMs);
    promise.then(
      (value) => {
        window.clearTimeout(timer);
        resolve(value);
      },
      (reason) => {
        window.clearTimeout(timer);
        reject(reason);
      },
    );
  });
}

export default function EmailLinkVerifyPage() {
  const { handleEmailLinkVerification, loaded } = useClerk();
  const [, setLocation] = useLocation();
  const [error, setError] = useState<string | null>(null);
  const [otherDevice, setOtherDevice] = useState(false);
  const startedRef = useRef(false);
  const isSignUp = window.location.pathname.includes("/sign-up/verify");
  const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");
  const verifyPath = isSignUp ? "/sign-up/verify" : "/sign-in/verify";
  const completePath = isSignUp ? "/profile-setup" : "/";

  useEffect(() => {
    if (!loaded || !handleEmailLinkVerification || startedRef.current) return;
    startedRef.current = true;

    const verifyUrl = `${window.location.origin}${basePath}${verifyPath}`;
    const completeUrl = `${window.location.origin}${basePath}${completePath}`;

    withAuthTimeout(
      handleEmailLinkVerification(
        {
          redirectUrlComplete: completeUrl,
          redirectUrl: verifyUrl,
          onVerifiedOnOtherDevice: () => setOtherDevice(true),
        },
        async (to: string) => {
          window.location.assign(to);
        },
      ),
    ).catch((err) => {
      startedRef.current = false;
      setError(getClerkErrorMessage(err));
    });
  }, [basePath, completePath, handleEmailLinkVerification, loaded, setLocation, verifyPath]);

  const restart = () => {
    setError(null);
    setOtherDevice(false);
    startedRef.current = false;
    setLocation(isSignUp ? "/sign-up" : "/sign-in");
  };

  return (
    <div className="min-h-[100dvh] w-full flex items-center justify-center px-4" style={{ background: "#0F2035" }}>
      <div className="w-full max-w-[390px] rounded-[24px] border p-6 text-center" style={{ background: "rgba(15,32,53,0.92)", borderColor: "rgba(100,160,230,0.22)" }}>
        {error ? (
          <>
            <h1 className="title-l text-primary">Не удалось подтвердить</h1>
            <p className="body-s mt-3 text-secondary">{error}</p>
            <button type="button" onClick={restart} className="btn-grad mt-6 h-[52px] w-full rounded-[14px] title-s text-white">
              Запросить новую ссылку
            </button>
          </>
        ) : otherDevice ? (
          <>
            <h1 className="title-l text-primary">Ссылка подтверждена</h1>
            <p className="body-s mt-3 text-secondary">
              Открой приложение на том устройстве, где запрашивалась ссылка, чтобы завершить вход.
            </p>
            <button type="button" onClick={restart} className="btn-grad mt-6 h-[52px] w-full rounded-[14px] title-s text-white">
              Вернуться
            </button>
          </>
        ) : (
          <>
            <div className="mx-auto mb-4 h-10 w-10 animate-pulse rounded-full bg-blue-core/30" />
            <h1 className="title-l text-primary">Подтверждаем вход</h1>
            <p className="body-s mt-3 text-secondary">Пожалуйста, подожди немного.</p>
          </>
        )}
      </div>
    </div>
  );
}