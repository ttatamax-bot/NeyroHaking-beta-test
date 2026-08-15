import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { useUser } from "@clerk/react";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { useAppStore } from "@/lib/store";
import { updateServerProfile, ApiError } from "@/lib/api";

const nicknamePattern = /^[\p{L}\p{N}][\p{L}\p{N}_.-]{2,23}$/u;
const pendingNicknameStorageKey = "neuro_pending_nickname";

export default function ProfileSetup() {
  const [, setLocation] = useLocation();
  const { isLoaded, isSignedIn, user } = useUser();
  const { updateState } = useAppStore();
  const [nickname, setNickname] = useState(() => {
    try {
      return sessionStorage.getItem(pendingNicknameStorageKey) ?? "";
    } catch {
      return "";
    }
  });
  const [hasPendingNickname] = useState(() => {
    try {
      return Boolean(sessionStorage.getItem(pendingNicknameStorageKey));
    } catch {
      return false;
    }
  });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const autoSaveAttemptedRef = useRef(false);

  useEffect(() => {
    if (isLoaded && !isSignedIn) setLocation("/sign-up");
  }, [isLoaded, isSignedIn, setLocation]);

  const normalized = nickname.trim();
  const validationError =
    normalized.length > 0 && !nicknamePattern.test(normalized)
      ? "От 3 до 24 символов: буквы, цифры, точка, дефис или подчёркивание."
      : null;

  const submit = async () => {
    if (validationError || normalized.length < 3 || saving) return;
    setSaving(true);
    setError(null);
    try {
      const profile = await updateServerProfile({ nickname: normalized });
      updateState({ profile, userState: "active", onboardingComplete: true });
      try {
        sessionStorage.removeItem(pendingNicknameStorageKey);
      } catch {
        // Ignore storage restrictions; the saved server profile is authoritative.
      }
      setLocation("/path");
    } catch (err) {
      if (hasPendingNickname && user) {
        try {
          await user.update({
            unsafeMetadata: {
              ...user.unsafeMetadata,
              neuroNickname: normalized,
            },
          });
          updateState({ userState: "active", onboardingComplete: true });
          try {
            sessionStorage.removeItem(pendingNicknameStorageKey);
          } catch {
            // Ignore storage restrictions; Clerk metadata is now authoritative for onboarding.
          }
          setLocation("/path");
          return;
        } catch {
          // Show the regular error if the account metadata fallback also fails.
        }
      }
      setError(
        err instanceof ApiError && err.status === 409
          ? "Этот никнейм уже занят. Выбери другой."
          : "Не удалось сохранить никнейм. Проверь соединение и попробуй ещё раз.",
      );
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (
      !hasPendingNickname ||
      !isLoaded ||
      !isSignedIn ||
      !normalized ||
      validationError ||
      autoSaveAttemptedRef.current
    ) {
      return;
    }
    autoSaveAttemptedRef.current = true;
    void submit();
  }, [hasPendingNickname, isLoaded, isSignedIn, normalized, validationError]);

  if (!isLoaded) return null;
  if (!isSignedIn) return null;

  return (
    <div className="min-h-[100dvh] flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[360px]"
      >
        <div className="text-center mb-8">
          <div
            className="w-16 h-16 rounded-full mx-auto mb-5 flex items-center justify-center"
            style={{ background: "rgba(37,99,235,0.18)", border: "1px solid rgba(96,165,250,0.35)" }}
          >
            <span className="text-3xl">✦</span>
          </div>
          <h1 className="display-l text-primary mb-3">Выбери свой никнейм</h1>
          <p className="body text-secondary">
            Так тебя будут видеть в профиле и в будущих разделах сообщества.
          </p>
        </div>

        <Input
          value={nickname}
          onChange={(event) => {
            setNickname(event.target.value);
            setError(null);
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") submit();
          }}
          placeholder={user?.firstName || "Например, neuro_user"}
          maxLength={24}
          autoFocus
          className="h-[56px] bg-surface-1 border-border rounded-[12px] text-primary body mb-2"
          disabled={saving}
        />
        <p className="caption text-tertiary mb-4">
          Никнейм будет публичным. Его можно изменить позже в настройках.
        </p>
        {(validationError || error) && (
          <p className="body-s mb-4" style={{ color: "var(--error)" }}>
            {validationError || error}
          </p>
        )}
        <button
          onClick={submit}
          disabled={!!validationError || normalized.length < 3 || saving}
          className="btn-grad btn-shimmer w-full h-[54px] rounded-[14px] title-s text-white disabled:opacity-50"
        >
          {saving ? "Сохраняем…" : "Продолжить"}
        </button>
      </motion.div>
    </div>
  );
}