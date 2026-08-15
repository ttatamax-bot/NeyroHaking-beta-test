import { UserRound } from "lucide-react";
import { useLocation } from "wouter";

export function GuestRegistrationPrompt() {
  const [, setLocation] = useLocation();

  return (
    <div
      className="rounded-[16px] p-4 mb-4"
      style={{
        background: "linear-gradient(135deg, rgba(37,99,235,0.2) 0%, rgba(37,99,235,0.06) 100%)",
        border: "1px solid rgba(96,165,250,0.35)",
      }}
    >
      <div className="flex items-start gap-3 mb-4">
        <div
          className="w-10 h-10 rounded-[12px] flex items-center justify-center shrink-0"
          style={{ background: "rgba(37,99,235,0.2)", border: "1px solid rgba(96,165,250,0.35)" }}
        >
          <UserRound size={18} className="text-blue-light" />
        </div>
        <div>
          <p className="title-s text-primary mb-1">Сохрани свой первый результат</p>
          <p className="body-s text-secondary">
            Создай аккаунт, чтобы сохранить прогресс, серию и награды на всех устройствах.
          </p>
        </div>
      </div>
      <button
        onClick={() => setLocation("/sign-up")}
        className="btn-grad btn-shimmer w-full h-[50px] rounded-[14px] title-s text-white"
      >
        Создать аккаунт
      </button>
    </div>
  );
}