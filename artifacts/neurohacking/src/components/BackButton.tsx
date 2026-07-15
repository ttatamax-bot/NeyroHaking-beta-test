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
      className="absolute top-4 left-4 z-50 p-2 text-primary hover:text-blue-light active:scale-95 transition-all"
    >
      <ChevronLeft size={28} />
    </button>
  );
}
