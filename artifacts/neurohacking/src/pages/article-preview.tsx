import { useState } from "react";
import { useLocation, useParams } from "wouter";
import { useAppStore } from "@/lib/store";
import { ScreenTransition } from "@/components/ScreenTransition";
import { BackButton } from "@/components/BackButton";
import { Lock, Key } from "lucide-react";

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
};

function formatKeys(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(0)}к`;
  return `${n}`;
}

export default function ArticlePreview() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { keys, unlockedArticles, readArticles, updateState } = useAppStore();
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const article = ARTICLES_DATA[id || ''];
  if (!article) return <div className="p-4 pt-16 text-primary">Статья не найдена</div>;

  const isFree = article.cost === 0;
  const isUnlocked = isFree || unlockedArticles.includes(id!);
  const isRead     = readArticles.includes(id || '');
  const canAfford  = keys >= article.cost;

  const handleAction = () => {
    if (isUnlocked) {
      setLocation(`/article/${id}/read`);
      return;
    }
    if (canAfford) {
      updateState(prev => ({
        keys: prev.keys - article.cost,
        unlockedArticles: [...prev.unlockedArticles, id!],
        keysHistory: [
          { date: new Date().toISOString(), source: `Статья: ${article.title}`, amount: article.cost, type: 'spend' as const },
          ...prev.keysHistory,
        ],
      }));
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

      <div className="flex-1 mt-4">
        <div className="flex items-center gap-2 mb-3">
          <span className={`label px-2 py-1 rounded-[6px] border ${
            isFree
              ? 'bg-[rgba(34,197,94,0.1)] border-[rgba(34,197,94,0.2)] text-success'
              : isUnlocked
                ? 'bg-[rgba(34,197,94,0.1)] border-[rgba(34,197,94,0.2)] text-success'
                : 'bg-surface-1 border-border text-secondary'
          }`}>
            {isFree ? 'Бесплатно' : isUnlocked ? (isRead ? 'Прочитано' : 'Открыто') : `${formatKeys(article.cost)} ключей`}
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
