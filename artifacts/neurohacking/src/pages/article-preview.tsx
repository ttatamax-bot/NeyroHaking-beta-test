import { useState } from "react";
import { useLocation, useParams } from "wouter";
import { useAppStore } from "@/lib/store";
import { purchaseArticle, ApiError } from "@/lib/api";
import { ScreenTransition } from "@/components/ScreenTransition";
import { BackButton } from "@/components/BackButton";
import { CalendarDays, Brain, Key, Lightbulb, Lock, MoonStar, Repeat2, Target, type LucideIcon } from "lucide-react";
import { motion } from "framer-motion";
import { HABIT_GUIDE_TITLE } from "@/content/habit-guide";

const ARTICLES_DATA: Record<string, {
  title: string; desc: string; content: string; cost: number;
}> = {
  A1: {
    title: "Лучшая стратегия нейрохакинга, которая изменит жизнь за короткий срок",
    desc: "Из этой статьи вы узнаете, что такое эволюционное несоответствие, насколько сильно оно влияет на вашу жизнь и как пользоваться приложением, чтобы компенсировать это влияние.",
    cost: 0,
    content: "В определенный момент жизни я начал обращать внимание на то, что мои реакции и поведение очень часто являются иррациональными и неэффективными.",
  },
  A2: {
    title: "Как ставить цели, чтобы мозг хотел их достичь?",
    desc: "Из этой статьи вы узнаете три параметра, от которых зависит, будет ли ваш мозг хотеть достичь цель. Вы научитесь формулировать цель, чтобы она вызывала дофаминовый отклик и желание работать над ней.",
    cost: 5,
    content: "Что отвечает за значимость твоей цели для мозга. Степень значимости цели зависит от того, насколько много дофамина вырабатывается мозгом при мыслях о ней.",
  },
  A3: {
    title: "Научись управлять своим дофамином с помощью нейровизуализации",
    desc: "В этой статье я расскажу про еще один проблемный эволюционный механизм мозга - чрезмерная опора на прошлый опыт в предсказании будущего, и то как нейровизуализация компенсирует его влияние.",
    cost: 10,
    content: "С каким сломанным механизмом мозга работает визуализация? Многие замечали у себя подобные эмоции: «Я не могу поверить, что у меня получится, потому что раньше не получалось».",
  },
  A4: {
    title: "Гайд на планирование дел на день. Научись точно предсказывать время на задачу.",
    desc: "Из этой статьи вы узнаете, почему нельзя ставить больше трех задач в день, как механика таймера «Планер» превращает работу в игру на точность и почему «сделать быстро» больше невыгодно.",
    cost: 20,
    content: "Почему задач только три и зачем нужна механика предсказания в технике «Планер». Рабочая память человека держит от 3 до 7 задач в голове.",
  },
  A5: {
    title: "Гайд на сон. Как засыпать за 3–5 минут и просыпаться восстановленным.",
    desc: "Из этой статьи вы узнаете, почему какие эволюционные несоответствия существуют в вопросе сна, как засыпать за 3–5 минут, как максимизировать качество сна без отказа от работы и как устроена механика завершения дня в приложении.",
    cost: 400,
    content: "Почему глубокий сон важнее длины сна. Распространено представление, что качество сна определяется его продолжительностью. Если человек спит 8–9 часов, значит он должен проснуться отдохнувшим.",
  },
  A6: {
    title: HABIT_GUIDE_TITLE,
    desc: "Из этой статьи вы узнаете, почему не нужно заставлять себя выполнять действие 21 день, как сделать полезную привычку привлекательной и выгодной, а также как применить конкретный план первых трёх дней.",
    cost: 400,
    content: "Первые три дня нужны не для автоматического формирования привычки, а для создания правильного цикла: триггер, выбор, действие и последствия. Вы научитесь управлять тем, какой опыт закрепляет каждое повторение.",
  },
};

function formatKeys(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(0)}к`;
  return `${n}`;
}

const ARTICLE_VISUALS: Record<string, {
  Icon: LucideIcon;
  color: string;
  glow: string;
  surface: string;
  rings: {
    left: string;
    top: string;
    size: number;
    dash: string;
    duration: number;
    opacity: number;
    direction: 1 | -1;
  }[];
}> = {
  A1: {
    Icon: Brain, color: "#F59E0B", glow: "rgba(245,158,11,0.2)", surface: "#3D2B18",
    rings: [
      { left: "15%", top: "19%", size: 176, dash: "112 18 6 14", duration: 24, opacity: 0.46, direction: 1 },
      { left: "88%", top: "43%", size: 250, dash: "38 10 96 22", duration: 31, opacity: 0.34, direction: -1 },
      { left: "23%", top: "78%", size: 132, dash: "22 16", duration: 19, opacity: 0.28, direction: 1 },
    ],
  },
  A2: {
    Icon: Target, color: "#A78BFA", glow: "rgba(167,139,250,0.18)", surface: "#302541",
    rings: [
      { left: "84%", top: "18%", size: 154, dash: "26 12 74 18", duration: 21, opacity: 0.44, direction: -1 },
      { left: "16%", top: "45%", size: 278, dash: "126 16 5 18", duration: 34, opacity: 0.34, direction: 1 },
      { left: "78%", top: "78%", size: 188, dash: "14 20 52 12", duration: 27, opacity: 0.3, direction: -1 },
    ],
  },
  A3: {
    Icon: Lightbulb, color: "#22D3EE", glow: "rgba(34,211,238,0.18)", surface: "#173340",
    rings: [
      { left: "18%", top: "22%", size: 214, dash: "64 14 18 10", duration: 28, opacity: 0.4, direction: 1 },
      { left: "91%", top: "54%", size: 166, dash: "18 8 96 24", duration: 22, opacity: 0.34, direction: -1 },
      { left: "35%", top: "82%", size: 274, dash: "146 24", duration: 38, opacity: 0.25, direction: 1 },
    ],
  },
  A4: {
    Icon: CalendarDays, color: "#60A5FA", glow: "rgba(96,165,250,0.18)", surface: "#1C304D",
    rings: [
      { left: "86%", top: "20%", size: 226, dash: "34 16 78 12", duration: 30, opacity: 0.38, direction: -1 },
      { left: "12%", top: "51%", size: 148, dash: "18 12", duration: 20, opacity: 0.34, direction: 1 },
      { left: "70%", top: "84%", size: 294, dash: "132 14 8 18", duration: 40, opacity: 0.27, direction: -1 },
    ],
  },
  A5: {
    Icon: MoonStar, color: "#C4B5FD", glow: "rgba(196,181,253,0.18)", surface: "#29244A",
    rings: [
      { left: "14%", top: "17%", size: 188, dash: "88 12 5 18", duration: 26, opacity: 0.4, direction: 1 },
      { left: "88%", top: "47%", size: 286, dash: "22 20 122 16", duration: 37, opacity: 0.3, direction: -1 },
      { left: "28%", top: "82%", size: 154, dash: "32 10 42 18", duration: 23, opacity: 0.28, direction: 1 },
    ],
  },
  A6: {
    Icon: Repeat2, color: "#FB7185", glow: "rgba(251,113,133,0.18)", surface: "#3D2931",
    rings: [
      { left: "82%", top: "16%", size: 196, dash: "48 14 82 20", duration: 28, opacity: 0.42, direction: -1 },
      { left: "14%", top: "48%", size: 252, dash: "116 18 4 14", duration: 33, opacity: 0.32, direction: 1 },
      { left: "74%", top: "81%", size: 142, dash: "18 18", duration: 18, opacity: 0.3, direction: -1 },
    ],
  },
};

function ArticleInstrumentPreview({ articleId }: { articleId: string }) {
  const visual = ARTICLE_VISUALS[articleId] ?? ARTICLE_VISUALS.A1;
  const { Icon } = visual;

  return (
    <div
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
      style={{
        background: [
          `radial-gradient(ellipse 90% 42% at 50% 18%, ${visual.glow}, transparent 78%)`,
          `linear-gradient(180deg, ${visual.surface} 0%, ${visual.surface} 100%)`,
        ].join(", "),
      }}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage: [
            `linear-gradient(90deg, ${visual.color}14 1px, transparent 1px)`,
            `linear-gradient(${visual.color}10 1px, transparent 1px)`,
          ].join(", "),
          backgroundSize: "28px 28px",
          maskImage: "linear-gradient(to bottom, rgba(0,0,0,.8) 0%, transparent 52%)",
          WebkitMaskImage: "linear-gradient(to bottom, rgba(0,0,0,.8) 0%, transparent 52%)",
        }}
      />

      {visual.rings.map((ring, ringIndex) => {
        const ringOpacity = ring.opacity * 0.45;
        return (
        <div
          key={`${articleId}-preview-ring-${ringIndex}`}
          aria-hidden="true"
          className="pointer-events-none absolute"
          style={{
            left: ring.left,
            top: ring.top,
            width: ring.size,
            height: ring.size,
            transform: "translate(-50%, -50%)",
            filter: `drop-shadow(0 0 14px ${visual.color}3d)`,
          }}
        >
          <motion.svg
            className="h-full w-full"
            viewBox="0 0 100 100"
            animate={{
              rotate: ring.direction * 360,
              opacity: [ringOpacity * 0.72, ringOpacity, ringOpacity * 0.72],
            }}
            transition={{
              rotate: { duration: ring.duration, repeat: Infinity, ease: "linear" },
              opacity: { duration: 3.8 + ringIndex * 0.6, repeat: Infinity, ease: "easeInOut" },
            }}
          >
            <circle
              cx="50"
              cy="50"
              r="47"
              fill="none"
              stroke={visual.color}
              strokeWidth={ringIndex < 3 ? 0.85 : 0.52}
              strokeOpacity="0.72"
              strokeDasharray={ring.dash}
              strokeLinecap="round"
            />
          </motion.svg>
        </div>
        );
      })}

      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-[92px] z-10 -translate-x-1/2"
        animate={{
          y: [0, -8, 0],
          scale: [1, 1.12, 1],
          rotate: [0, -5, 5, 0],
          opacity: [0.82, 1, 0.82],
        }}
        transition={{ duration: 3.4, repeat: Infinity, ease: "easeInOut" }}
        style={{ filter: `drop-shadow(0 0 18px ${visual.color})` }}
      >
        <Icon size={72} strokeWidth={1.4} color={visual.color} aria-hidden="true" />
      </motion.div>
    </div>
  );
}

export default function ArticlePreview() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { keys, unlockedArticles, readArticles, updateState, isSignedIn, applyTrustedServerResult } = useAppStore();
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [purchasing, setPurchasing] = useState(false);

  const article = ARTICLES_DATA[id || ''];
  if (!article) return <div className="p-4 pt-16 text-primary">Статья не найдена</div>;

  const isFree = article.cost === 0;
  const isUnlocked = isFree || unlockedArticles.includes(id!);
  const isRead     = readArticles.includes(id || '');
  const canAfford  = keys >= article.cost;
  const visual = ARTICLE_VISUALS[id || 'A1'] ?? ARTICLE_VISUALS.A1;
  const statusLabel = isUnlocked
    ? (isRead ? 'Прочитано' : 'Открыто')
    : article.cost === 400 ? '400 ключей' : 'Закрыто';
  const statusStyle = {
    backgroundColor: `${visual.color}18`,
    borderColor: `${visual.color}70`,
    color: visual.color,
    boxShadow: `0 0 16px ${visual.color}20`,
  };

  const handleAction = async () => {
    if (isUnlocked) {
      setLocation(`/article/${id}/read`);
      return;
    }
    if (canAfford) {
      if (purchasing) return;
      setPurchasing(true);
      try {
        if (isSignedIn) {
          const result = await purchaseArticle(id!);
          applyTrustedServerResult(result.state, result.profile);
        } else {
          updateState(prev => ({
            keys: prev.keys - article.cost,
            unlockedArticles: [...prev.unlockedArticles, id!],
            keysHistory: [
              { date: new Date().toISOString(), source: `Статья: ${article.title}`, amount: article.cost, type: 'spend' as const },
              ...prev.keysHistory,
            ],
          }));
        }
      } catch (error) {
        setToastMsg(error instanceof ApiError && error.status === 409
          ? "Недостаточно ключей. Выполняй техники — зарабатывай ключи."
          : "Не удалось открыть статью. Проверь соединение и попробуй ещё раз.");
        setTimeout(() => setToastMsg(null), 3000);
        return;
      } finally {
        setPurchasing(false);
      }
      setLocation(`/article/${id}/read`);
    } else {
      setToastMsg(article.cost === 400
        ? "Нужно 400 ключей. Выполняй техники — зарабатывай ключи."
        : "Недостаточно ключей. Выполняй техники — зарабатывай ключи.");
      setTimeout(() => setToastMsg(null), 3000);
    }
  };

  return (
    <ScreenTransition className="pt-[64px] px-4 pb-24 relative flex flex-col min-h-[100dvh]">
      <BackButton />

      {toastMsg && (
        <div className="fixed top-16 left-4 right-4 z-[80] bg-surface-2 border border-border rounded-[12px] px-4 py-3 text-primary body-s shadow-lg">
          {toastMsg}
        </div>
      )}

      <ArticleInstrumentPreview articleId={id || 'A1'} />

      <div className="relative z-10 flex-1 mt-4 pt-[170px]">
        <div className="flex items-center gap-2 mb-3">
           <span className="label rounded-[6px] border px-2 py-1" style={statusStyle}>
            {statusLabel}
          </span>
        </div>

        <h1 className="title-l text-primary mb-4">{article.title}</h1>
        <p className="body text-secondary mb-6">{article.desc}</p>

        {!isUnlocked && (
          <div className="relative">
            <p className="body text-secondary line-clamp-3">
              {article.content}
            </p>
             <div
               className="pointer-events-none absolute inset-0"
               style={{ background: `linear-gradient(to top, ${visual.surface} 0%, ${visual.surface}cc 30%, transparent 100%)` }}
             />
          </div>
        )}

        {!isUnlocked && !canAfford && (
           <div
             className="mt-4 flex items-start gap-3 rounded-[12px] border p-4"
             style={{ backgroundColor: `${visual.color}10`, borderColor: `${visual.color}42` }}
           >
             <Lock size={18} className="shrink-0 mt-0.5" style={{ color: visual.color }} />
             <p className="body-s text-secondary">
               {article.cost === 400
                 ? `У тебя ${keys} ключей. Нужно ещё ${article.cost - keys} — выполняй техники каждый день.`
                 : "Для открытия этой статьи нужны ключи. Выполняй техники — зарабатывай ключи."}
             </p>
          </div>
        )}
        {!isUnlocked && canAfford && (
           <div
             className="mt-4 flex items-start gap-3 rounded-[12px] border p-4"
             style={{ backgroundColor: `${visual.color}12`, borderColor: `${visual.color}42` }}
           >
             <Key size={18} className="shrink-0 mt-0.5" style={{ color: visual.color }} />
            <p className="body-s text-secondary">
              У тебя достаточно ключей ({keys}). После открытия они спишутся.
            </p>
          </div>
        )}
      </div>

      <div className="pb-safe mt-8">
        <button
          onClick={handleAction}
          className="btn-shimmer w-full h-[56px] rounded-[14px] title-s active:opacity-90"
          style={{
            background: `linear-gradient(135deg, ${visual.color}${isUnlocked || canAfford ? "" : "88"}, ${visual.color}${isUnlocked || canAfford ? "bf" : "55"})`,
            border: `1px solid ${visual.color}${isUnlocked || canAfford ? "d9" : "a0"}`,
            color: "#ffffff",
            opacity: isUnlocked || canAfford ? 1 : 0.78,
            boxShadow: `0 0 24px ${visual.color}${isUnlocked || canAfford ? "52" : "34"}`,
          }}
        >
           {isUnlocked
             ? 'Читать'
             : canAfford
               ? article.cost === 400 ? 'Открыть за 400 ключей' : 'Открыть'
               : 'Недостаточно ключей'
           }
        </button>
      </div>
    </ScreenTransition>
  );
}
