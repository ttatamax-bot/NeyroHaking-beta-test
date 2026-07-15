import { useLocation } from "wouter";
import { Brain, Key, Flame, Settings } from "lucide-react";
import { useAppStore } from "@/lib/store";

export function TopBar() {
  const [location, setLocation] = useLocation();
  const { potential, keys, streak, userState } = useAppStore();

  const isReadMode = /\/article\/[^/]+\/read/.test(location);
  const isAcademyRoute =
    location === '/academy' ||
    location.startsWith('/academy') ||
    location.startsWith('/article/') ||
    location.startsWith('/article-preview/') ||
    location === '/keys-stats' ||
    location === '/potential-stats';

  if (!isAcademyRoute || isReadMode || userState === 'new' || userState === 'dayDone') return null;

  return (
    <div
      className="fixed z-50 flex items-center gap-2.5"
      style={{
        top: 'max(12px, env(safe-area-inset-top, 12px))',
        right: 16,
        padding: '7px 12px',
        borderRadius: 14,
        background: 'rgba(10,24,48,0.92)',
        border: '1px solid rgba(100,160,230,0.2)',
        backdropFilter: 'blur(24px) saturate(200%)',
        boxShadow: '0 1px 0 rgba(255,255,255,0.1) inset, 0 4px 20px rgba(0,0,0,0.5)',
      }}
    >
      <button
        onClick={() => setLocation('/potential-stats')}
        className="flex items-center gap-1 active:opacity-70 transition-opacity"
      >
        <Brain size={14} color="#F59E0B" />
        <span className="num text-primary" style={{ fontSize: 13 }}>{potential.toFixed(1)}%</span>
      </button>

      <div style={{ width: 1, height: 13, background: 'rgba(100,160,230,0.15)' }} />

      <button
        onClick={() => setLocation('/keys-stats')}
        className="flex items-center gap-1 active:opacity-70 transition-opacity"
      >
        <Key size={14} color="#F59E0B" />
        <span className="num text-primary" style={{ fontSize: 13 }}>{keys}</span>
      </button>

      <div style={{ width: 1, height: 13, background: 'rgba(100,160,230,0.15)' }} />

      <button
        onClick={() => setLocation('/streak')}
        className="flex items-center gap-1 active:opacity-70 transition-opacity"
      >
        <Flame size={14} color="#F59E0B" />
        <span className="num text-primary" style={{ fontSize: 13 }}>{streak}</span>
      </button>

      <div style={{ width: 1, height: 13, background: 'rgba(100,160,230,0.15)' }} />

      <button
        onClick={() => setLocation('/settings')}
        className="active:opacity-70 transition-opacity"
      >
        <Settings size={14} color="#F59E0B" />
      </button>
    </div>
  );
}
