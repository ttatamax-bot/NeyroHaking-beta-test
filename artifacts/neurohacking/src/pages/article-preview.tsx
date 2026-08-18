import { useState } from "react";
import { useLocation, useParams } from "wouter";
import { useAppStore } from "@/lib/store";
import { purchaseArticle, ApiError } from "@/lib/api";
import { ScreenTransition } from "@/components/ScreenTransition";
import { BackButton } from "@/components/BackButton";
import { CalendarDays, Brain, Key, Lightbulb, Lock, MoonStar, Repeat2, Target, type LucideIcon } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
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
}> = {
  A1: { Icon: Brain, color: "#F59E0B", glow: "rgba(245,158,11,0.2)", surface: "#3D2B18" },
  A2: { Icon: Target, color: "#A78BFA", glow: "rgba(167,139,250,0.18)", surface: "#302541" },
  A3: { Icon: Lightbulb, color: "#22D3EE", glow: "rgba(34,211,238,0.18)", surface: "#173340" },
  A4: { Icon: CalendarDays, color: "#60A5FA", glow: "rgba(96,165,250,0.18)", surface: "#1C304D" },
  A5: { Icon: MoonStar, color: "#C4B5FD", glow: "rgba(196,181,253,0.18)", surface: "#29244A" },
  A6: { Icon: Repeat2, color: "#FB7185", glow: "rgba(251,113,133,0.18)", surface: "#3D2931" },
};

function ArticleInstrumentPreview({ articleId }: { articleId: string }) {
  const reduced = useReducedMotion();
  const visual = ARTICLE_VISUALS[articleId] ?? ARTICLE_VISUALS.A1;
  const { Icon } = visual;

  return (
    <div
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
      style={{
        background: [
          `radial-gradient(ellipse 90% 38% at 50% 18%, ${visual.glow}, transparent 76%)`,
          `linear-gradient(180deg, ${visual.surface} 0%, rgba(9,24,43,0.94) 38%, #0F2035 78%)`,
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

      {[0, 1, 2].map((ringIndex) => {
        const size = 168 + ringIndex * 58;
        return (
          <motion.div
            key={`${articleId}-preview-ring-${ringIndex}`}
            aria-hidden="true"
            className="pointer-events-none absolute left-[68%] top-[25%] rounded-full border"
            style={{
              width: size,
              height: size,
              borderWidth: ringIndex === 0 ? 1.5 : 1,
              borderColor: `${visual.color}${ringIndex === 0 ? "96" : ringIndex === 1 ? "6e" : "48"}`,
              borderStyle: ringIndex === 1 ? "dashed" : "solid",
              transform: "translate(-50%, -50%)",
              boxShadow: ringIndex === 0 ? `0 0 28px ${visual.color}44` : undefined,
            }}
            animate={reduced
              ? { rotate: 0, opacity: ringIndex === 0 ? 0.75 : 0.48 }
              : { rotate: ringIndex % 2 === 0 ? 360 : -360, opacity: ringIndex === 0 ? [0.58, 0.86, 0.58] : [0.34, 0.62, 0.34] }}
            transition={reduced
              ? { duration: 0.3 }
              : { rotate: { duration: 18 + ringIndex * 8, repeat: Infinity, ease: "linear" }, opacity: { duration: 3.2 + ringIndex * 0.5, repeat: Infinity, ease: "easeInOut" } }}
          />
        );
      })}

      <motion.div
        className="absolute left-1/2 top-[88px] z-10 -translate-x-1/2"
        animate={reduced ? { y: 0 } : { y: [0, -2, 0], rotate: [0, 1, 0] }}
        transition={reduced ? { duration: 0.3 } : { duration: 4.6, repeat: Infinity, ease: "easeInOut" }}
        style={{ filter: `drop-shadow(0 0 16px ${visual.glow})` }}
      >
        <Icon size={56} strokeWidth={1.45} color={visual.color} aria-hidden="true" />
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
  const statusLabel = isUnlocked
    ? (isRead ? 'Прочитано' : 'Открыто')
    : `${formatKeys(article.cost)} ключей`;
  const statusClass = isUnlocked
    ? 'bg-[rgba(34,197,94,0.1)] border-[rgba(34,197,94,0.2)] text-success'
    : 'bg-surface-1 border-border text-secondary';

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
      setToastMsg(`Нужно ${formatKeys(article.cost)} ключей. Выполняй техники — зарабатывай ключи.`);
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

      <div className="relative z-10 flex-1 mt-4 pt-[230px]">
        <div className="flex items-center gap-2 mb-3">
          <span className={`label px-2 py-1 rounded-[6px] border ${statusClass}`}>
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
            <div className="absolute inset-0 bg-gradient-to-t from-base via-base/70 to-transparent pointer-events-none" />
          </div>
        )}

        {!isUnlocked && !canAfford && (
          <div className="mt-4 flex items-start gap-3 bg-surface-1 border border-border rounded-[12px] p-4">
            <Lock size={18} className="text-tertiary shrink-0 mt-0.5" />
            <p className="body-s text-secondary">
              У тебя {keys} ключей. Нужно ещё {article.cost - keys} — выполняй техники каждый день.
            </p>
          </div>
        )}
        {!isUnlocked && canAfford && (
          <div className="mt-4 flex items-start gap-3 bg-blue-ultra-soft border border-[rgba(37,99,235,0.2)] rounded-[12px] p-4">
            <Key size={18} className="text-blue-light shrink-0 mt-0.5" />
            <p className="body-s text-secondary">
              У тебя достаточно ключей ({keys}). После открытия они спишутся.
            </p>
          </div>
        )}
      </div>

      <div className="pb-safe mt-8">
        <button
          onClick={handleAction}
          className={`btn-shimmer w-full h-[56px] rounded-[14px] title-s active:opacity-90 ${
            isUnlocked
              ? 'btn-grad text-white'
              : canAfford
                ? 'btn-grad text-white'
                : 'bg-surface-1 border border-border text-tertiary'
          }`}
        >
          {isUnlocked
            ? 'Читать'
            : canAfford
              ? `Открыть за ${formatKeys(article.cost)} ключей`
              : 'Недостаточно ключей'
          }
        </button>
      </div>
    </ScreenTransition>
  );
}
