import { Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { ApiError, getLeaderboard, type LeaderboardResult } from "@/lib/api";
import type { ConcentrationMode, MemoryMode } from "@/lib/store";
import { KnowledgeBaseMark } from "@/pages/academy";

type LeaderboardMode = MemoryMode | ConcentrationMode;

function LeaderboardIcon({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <g>
        <path d="M3.5 18C3.5 16.5858 3.5 15.8787 3.93934 15.4393C4.37868 15 5.08579 15 6.5 15H7C7.94281 15 8.41421 15 8.70711 15.2929C9 15.5858 9 16.0572 9 17V22H3.5V18Z" />
      </g>
      <g>
        <path d="M15 19C15 18.0572 15 17.5858 15.2929 17.2929C15.5858 17 16.0572 17 17 17H17.5C18.9142 17 19.6213 17 20.0607 17.4393C20.5 17.8787 20.5 18.5858 20.5 20V22H15V19Z" />
      </g>
      <path d="M2 22H22" />
      <g>
        <path d="M9 16C9 14.5858 9 13.8787 9.43934 13.4393C9.87868 13 10.5858 13 12 13C13.4142 13 14.1213 13 14.5607 13.4393C15 13.8787 15 14.5858 15 16V22H9V16Z" />
      </g>
      <motion.g
        animate={{ x: [0, 1.2, 0, -1.2, 0], y: [0, -0.45, 0, 0.45, 0], rotate: [-6, 4, 6, -4, -6] }}
        transition={{ duration: 3.6, repeat: Infinity, ease: "easeInOut" }}
        style={{ transformOrigin: "12px 6px", transformBox: "view-box" }}
      >
        <motion.path d="M12.6911 2.57767L13.395 3.99715C13.491 4.19475 13.7469 4.38428 13.9629 4.42057L15.2388 4.6343C16.0547 4.77141 16.2469 5.36824 15.6587 5.957L14.6668 6.95709C14.4989 7.12646 14.4069 7.4531 14.4589 7.68699L14.7428 8.925C14.9668 9.90492 14.4509 10.284 13.591 9.77185L12.3951 9.05808C12.1791 8.92903 11.8232 8.92903 11.6032 9.05808L10.4073 9.77185C9.5514 10.284 9.03146 9.90089 9.25543 8.925L9.5394 7.68699C9.5914 7.4531 9.49941 7.12646 8.33954 5.957C7.7556 5.36824 7.94358 4.77141 8.75949 4.6343L10.0353 4.42057C10.2473 4.38428 10.5033 4.19475 10.5993 3.99715L11.3032 2.57767C11.6872 1.80744 12.3111 1.80744 12.6911 2.57767Z" animate={{ opacity: [0.7, 1, 0.7] }} transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }} />
      </motion.g>
    </svg>
  );
}

function ChampionIcon({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6.43614 8C6.15488 8.84221 6 9.76282 6 10.7273C6 14.7439 8.68629 18 12 18C15.3137 18 18 14.7439 18 10.7273C18 9.76282 17.8451 8.84221 17.5639 8" />
      <path d="M14.5 21C14.5 21 13.818 18 12 18C10.182 18 9.5 21 9.5 21" />
      <path d="M18.5202 5.22967C18.8121 6.89634 17.5004 8 17.5004 8C17.5004 8 15.8969 7.437 15.605 5.77033C15.3131 4.10366 16.6248 3 16.6248 3C16.6248 3 18.2284 3.56301 18.5202 5.22967Z" />
      <path d="M11 9L12 8.5V13.5M13 13.5H11" />
      <path d="M21.0942 12.1393C19.8128 13.4061 18.0778 12.9003 18.0778 12.9003C18.0778 12.9003 17.6241 11.1276 18.9055 9.86074C20.1868 8.59388 21.9219 9.09972 21.9219 9.09972C21.9219 9.09972 22.3756 10.8724 21.0942 12.1393Z" />
      <path d="M18.2335 18.1896C16.7335 17.614 16.5 16 16.5 16C16.5 16 17.7665 14.9616 19.2665 15.5372C20.7665 16.1128 21 17.7268 21 17.7268C21 17.7268 19.7335 18.7652 18.2335 18.1896Z" />
      <path d="M5.76651 18.1895C7.26651 17.6139 7.5 15.9999 7.5 15.9999C7.5 15.9999 6.23349 14.9615 4.73349 15.5371C3.23349 16.1127 3 17.7267 3 17.7267C3 17.7267 4.26651 18.7651 5.76651 18.1895Z" />
      <path d="M2.90552 12.1393C4.18688 13.4061 5.92191 12.9003 5.92191 12.9003C5.92191 12.9003 6.37559 11.1276 5.09423 9.86074C3.81288 8.59388 2.07785 9.09972 2.07785 9.09972C2.07785 9.09972 1.62417 10.8724 2.90552 12.1393Z" />
      <path d="M5.47987 5.22967C5.18799 6.89634 6.49968 8 6.49968 8C6.49968 8 8.10325 7.437 8.39513 5.77033C8.68701 4.10366 7.37532 3 7.37532 3C7.37532 3 5.77175 3.56301 5.47987 5.22967Z" />
    </svg>
  );
}

function PositionIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2.5 3.00098H21.5" />
      <path d="M4.5 3.00098V14C4.5 16.3288 4.93059 17.0893 6.92752 18.2875L9.94202 20.0962C10.9447 20.6978 11.446 20.9986 12 20.9986C12.554 20.9986 13.0553 20.6978 14.058 20.0962L17.0725 18.2875C19.0694 17.0893 19.5 16.3288 19.5 14V3.00098" />
      <path d="M14.5 13.001H9.5M14.5 8.00098H9.5" />
    </svg>
  );
}

interface LeaderboardProps {
  mode: LeaderboardMode;
  practiceTitle: string;
  enabled: boolean;
  accent: string;
  border: string;
  soft: string;
  refreshKey?: number;
}

export function Leaderboard({ mode, practiceTitle, enabled, accent, border, soft, refreshKey = 0 }: LeaderboardProps) {
  const [result, setResult] = useState<LeaderboardResult | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    if (!enabled) {
      setLoading(false);
      setResult(null);
      return;
    }
    setLoading(true);
    setError(false);
    void getLeaderboard(mode).then((next) => {
      if (active) setResult(next);
    }).catch((reason) => {
      if (active) setError(reason instanceof ApiError || reason instanceof Error);
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [enabled, mode, refreshKey]);

  const champion = result?.champion;
  return (
    <section
      className="mt-[48px]"
      aria-label={`Лидеры практики "${practiceTitle}"`}
      data-testid={`leaderboard-${mode}`}
    >
      <div className="relative flex flex-col items-center px-2 pb-5 pt-2 text-center">
        <KnowledgeBaseMark showStar={false} emphasizeRings icon={<LeaderboardIcon className="h-full w-full text-[#F97316]" />} />
        <h2 className="relative z-10 mt-2 text-[26px] font-semibold uppercase leading-tight" style={{ color: accent }}>
          ЛИДЕРЫ ПРАКТИКИ «{practiceTitle}»
        </h2>
      </div>

      {loading && (
        <div className="rounded-[20px] border px-5 py-8 text-center text-sm text-secondary" style={{ borderColor: border, background: "rgba(7,20,37,.9)" }}>
          <div className="flex items-center justify-center gap-2">
          <Loader2 size={17} className="animate-spin" style={{ color: accent }} /> Загружаем рейтинг…
          </div>
        </div>
      )}
      {!loading && !enabled && (
        <div className="rounded-[20px] border px-5 py-8 text-center text-sm text-secondary" style={{ borderColor: border, background: "rgba(7,20,37,.9)" }}>
          Войди в аккаунт, чтобы увидеть серверный рейтинг.
        </div>
      )}
      {!loading && error && (
        <p className="rounded-[20px] border px-5 py-8 text-center text-sm text-secondary" style={{ borderColor: border, background: "rgba(7,20,37,.9)" }}>Рейтинг пока недоступен. Попробуй обновить экран.</p>
      )}
      {!loading && !error && result && result.entries.length === 0 && (
        <p className="rounded-[20px] border px-5 py-8 text-center text-sm text-secondary" style={{ borderColor: border, background: "rgba(7,20,37,.9)" }}>Стань первым чемпионом этой практики.</p>
      )}
      {!loading && !error && result && result.entries.length > 0 && (
        <>
          {champion && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mx-4 mb-3 flex items-center gap-3 rounded-[18px] border px-4 py-3 text-left"
              style={{ borderColor: "rgba(251,191,36,.5)", background: "linear-gradient(135deg,rgba(245,158,11,.18),rgba(37,99,235,.08))" }}
              data-testid="leaderboard-champion"
            >
              <ChampionIcon className="h-8 w-8 shrink-0 text-amber-200" />
              <div className="min-w-0 flex-1">
                 <p className="text-[10px] font-semibold uppercase tracking-[.12em]" style={{ color: accent }}>ЧЕМПИОН</p>
                <p className="truncate text-sm font-semibold text-primary">{champion.nickname}</p>
              </div>
              <span className="num text-lg text-amber-200">{champion.maxLevel}</span>
            </motion.div>
          )}
          <div className="relative overflow-y-auto px-3 pb-3" style={{ maxHeight: "min(52dvh, 430px)", WebkitOverflowScrolling: "touch" }}>
            <div className="space-y-1">
              {result.entries.map((entry) => (
                <div
                  key={entry.userId}
                  className="flex min-h-11 items-center gap-3 rounded-[12px] px-3 text-sm"
                  style={{ background: entry.userId === result.me?.userId ? soft : "rgba(147,197,253,.035)" }}
                  data-testid={`leaderboard-row-${entry.position}`}
                >
                  <span className="num w-7 shrink-0 text-center text-secondary">{entry.position}</span>
                  <span className="min-w-0 flex-1 truncate text-primary">{entry.nickname}</span>
                  <span className="num text-base" style={{ color: accent }}>{entry.maxLevel}</span>
                </div>
              ))}
            </div>
            {result.me && (
              <div className="sticky bottom-0 z-10 mt-2 flex min-h-12 items-center gap-3 rounded-[14px] border px-3 shadow-[0_-8px_20px_rgba(3,10,22,.85)]" style={{ borderColor: border, background: "#0b1b31" }} data-testid="leaderboard-my-position">
                <PositionIcon className="h-5 w-5 shrink-0" />
                <span className="num w-7 shrink-0 text-center font-semibold" style={{ color: accent }}>{result.me.position}</span>
                 <span className="min-w-0 flex-1 truncate text-sm font-semibold uppercase" style={{ color: accent }}>ТВОЯ ПОЗИЦИЯ · <span className="text-primary">{result.me.nickname}</span></span>
                <span className="num text-base" style={{ color: accent }}>{result.me.maxLevel}</span>
              </div>
            )}
          </div>
        </>
      )}
    </section>
  );
}