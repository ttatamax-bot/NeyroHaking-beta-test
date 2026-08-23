import { useLocation } from "wouter";
import { Brain, Key, Flame, Settings } from "lucide-react";
import { motion } from "framer-motion";
import { useAppStore } from "@/lib/store";

export function TopBar() {
  const [location, setLocation] = useLocation();
  const { potential, keys, streak, userState } = useAppStore();

  const isReadMode = /\/article\/[^/]+\/read/.test(location);
  const isArticleRoute = location.startsWith('/article/');
  const isAcademyRoute =
    location === '/academy' ||
    location.startsWith('/academy') ||
    location.startsWith('/article/') ||
    location.startsWith('/article-preview/') ||
    location === '/keys-stats' ||
    location === '/potential-stats';

  if (!isAcademyRoute || isArticleRoute || isReadMode) return null;

  const displayPotential = Math.round(Math.min(100, Math.max(0, Number(potential) || 0)));
  const displayStreak = Math.max(0, Math.round(Number(streak) || 0));

  return (
    <motion.div
      className="fixed z-50 flex items-center gap-2.5"
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.28, ease: "easeOut" }}
      style={{
        top: 'max(12px, env(safe-area-inset-top, 12px))',
        right: 16,
        padding: '7px 12px',
        borderRadius: 14,
        background: 'linear-gradient(135deg, rgba(245,158,11,0.22) 0%, rgba(245,158,11,0.08) 100%)',
        border: '1px solid rgba(245,158,11,1)',
        backdropFilter: 'blur(24px) saturate(200%)',
        boxShadow: '0 1px 0 rgba(255,255,255,0.1) inset, 0 4px 20px rgba(0,0,0,0.5)',
      }}
    >
      <button
        onClick={() => setLocation('/potential-stats')}
        className="flex items-center gap-1 active:opacity-70 transition-opacity"
      >
        <Brain size={14} color="#F59E0B" />
        <span className="num text-primary" style={{ fontSize: 13 }}>{displayPotential}%</span>
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
        <span className="num text-primary" style={{ fontSize: 13 }}>{displayStreak}</span>
      </button>

      <div style={{ width: 1, height: 13, background: 'rgba(100,160,230,0.15)' }} />

      <button
        onClick={() => setLocation('/settings')}
        className="active:opacity-70 transition-opacity"
      >
        <Settings size={14} color="#F59E0B" />
      </button>
    </motion.div>
  );
}
