import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useParams } from "wouter";
import { motion } from "framer-motion";
import { Check, ChevronLeft, Gift, Loader2, LogIn } from "lucide-react";
import { useAuthInfo } from "@/lib/clerk";
import { ApiError, claimReferral, getReferral, type ReferralPreview } from "@/lib/api";
import { useAppStore } from "@/lib/store";
import { ScreenTransition } from "@/components/ScreenTransition";

export default function ReferralPage() {
  const { code = "" } = useParams<{ code: string }>();
  const [, setLocation] = useLocation();
  const { isLoaded: isAuthLoaded, isSignedIn } = useAuthInfo();
  const { applyTrustedServerResult } = useAppStore();
  const [referral, setReferral] = useState<ReferralPreview | null>(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [claimedAmount, setClaimedAmount] = useState<number | null>(null);
  const [counter, setCounter] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const claimInFlightRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getReferral(code)
      .then((result) => {
        if (!cancelled) setReferral(result);
      })
      .catch((reason) => {
        if (cancelled) return;
        setError(reason instanceof ApiError && reason.status === 404
          ? "Эта ссылка не существует или была удалена."
          : "Не удалось проверить ссылку. Попробуй ещё раз.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [code]);

  useEffect(() => {
    if (claimedAmount === null) return;
    let current = 0;
    const step = Math.max(1, Math.ceil(claimedAmount / 30));
    const timer = window.setInterval(() => {
      current = Math.min(claimedAmount, current + step);
      setCounter(current);
      if (current >= claimedAmount) window.clearInterval(timer);
    }, 24);
    return () => window.clearInterval(timer);
  }, [claimedAmount]);

  const title = useMemo(() => {
    if (error) return "Ссылка недоступна";
    if (claimedAmount !== null) return "Ключи уже у тебя";
    if (referral?.available) return "Тебе подарок";
    return "Ссылка использована";
  }, [claimedAmount, error, referral?.available]);

  const claim = async () => {
    if (claimInFlightRef.current) return;
    if (!isSignedIn) {
      sessionStorage.setItem("neuro-referral-return", window.location.pathname);
      setLocation("/sign-in");
      return;
    }
    claimInFlightRef.current = true;
    setClaiming(true);
    setError(null);
    try {
      const result = await claimReferral(code);
      applyTrustedServerResult(undefined, result.profile);
      setReferral((previous) => previous ? { ...previous, available: false } : previous);
      setClaimedAmount(result.amount);
    } catch (reason) {
      setError(reason instanceof ApiError && reason.status === 409
        ? "Эта ссылка уже была использована."
        : "Не удалось получить подарок. Попробуй ещё раз.");
      if (reason instanceof ApiError && reason.status === 409) {
        setReferral((previous) => previous ? { ...previous, available: false } : previous);
      }
    } finally {
      claimInFlightRef.current = false;
      setClaiming(false);
    }
  };

  if (loading || !isAuthLoaded) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center">
        <Loader2 className="animate-spin text-orange-300" size={24} />
      </div>
    );
  }

  return (
    <ScreenTransition className="relative min-h-[100dvh] px-5 flex items-center justify-center">
      <button
        type="button"
        onClick={() => setLocation("/")}
        className="absolute left-4 top-[max(12px,env(safe-area-inset-top,12px))] z-20 p-2 text-primary active:scale-95"
        aria-label="Выйти"
        data-testid="button-referral-back"
      >
        <ChevronLeft size={28} />
      </button>
      <div className="w-full max-w-[350px] text-center">
        <motion.div
          initial={{ scale: 0.82, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="mx-auto mb-6 w-[92px] h-[92px] rounded-[28px] flex items-center justify-center"
          style={{
            background: "linear-gradient(145deg, rgba(251,146,60,0.32), rgba(234,88,12,0.12))",
            border: "1px solid rgba(251,146,60,0.5)",
            boxShadow: "0 0 50px rgba(249,115,22,0.22)",
          }}
        >
          <Gift size={42} color="#FDBA74" />
        </motion.div>
        <p className="label uppercase tracking-[0.22em] mb-3" style={{ color: "#FDBA74" }}>НейроХакинг</p>
        <h1 className="title-xl text-primary mb-3">{title}</h1>

        {error ? (
          <p className="body text-red-300 mb-6">{error}</p>
        ) : claimedAmount !== null ? (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <div className="display-l mb-2" style={{ color: "#FDBA74" }}>+{counter}</div>
            <p className="body text-secondary mb-5">ключей начислено на твой аккаунт</p>
            <div className="flex items-center justify-center gap-2 body-s text-green-300">
              <Check size={16} /> Получение подтверждено
            </div>
          </motion.div>
        ) : referral?.available ? (
          <>
            <p className="body text-secondary mb-7">
              Тебе начислят <strong className="text-primary">+{referral.amount} ключей</strong>. Ссылка одноразовая.
            </p>
            <button
              onClick={claim}
              disabled={claiming}
              className="btn-grad btn-shimmer w-full h-[54px] rounded-[16px] title-s flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {claiming ? <Loader2 size={18} className="animate-spin" /> : (!isSignedIn ? <LogIn size={18} /> : null)}
              {claiming ? "Начисляем…" : isSignedIn ? "Забрать ключи" : "Войти и забрать"}
            </button>
          </>
        ) : (
          <p className="body text-secondary">Подарок по этой ссылке уже забрали.</p>
        )}
      </div>
    </ScreenTransition>
  );
}