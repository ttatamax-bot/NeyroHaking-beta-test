import { useLocation } from "wouter";
import { ChevronLeft } from "lucide-react";

export function BackButton({ fallback = '/academy' }: { fallback?: string }) {
  const [, setLocation] = useLocation();
  const handleClick = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      setLocation(fallback);
    }
  };
  return (
    <button
      onClick={handleClick}
      className="absolute left-3 top-[calc(env(safe-area-inset-top)+48px)] z-50 flex h-12 w-12 items-center justify-center rounded-full p-0 text-primary transition-all hover:text-blue-light active:scale-95"
      aria-label="Назад"
    >
      <ChevronLeft size={28} />
    </button>
  );
}
