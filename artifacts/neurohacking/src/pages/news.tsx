import { useLocation, useParams } from "wouter";
import { useAppStore } from "@/lib/store";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { ChevronLeft } from "lucide-react";

const NEWS_DATA: Record<string, { title: string; desc: string; date: string; content: string }> = {
  "1": {
    title: "Новая техника нейровизуализации",
    desc: "Обновлён алгоритм прохождения техники T2 — визуализация теперь более структурированная.",
    date: "2026-05-28",
    content: "Мы обновили подход к технике T2. Ранее визуализация могла быть хаотичной, теперь она разделена на 5 строгих вопросов. Это помогает сфокусировать работу префронтальной коры и усилить эмоциональный отклик.\n\nПробуйте новый формат в разделе Техники."
  },
  "2": {
    title: "Важно о серии",
    desc: "Серия сохраняется только если ты завершил день через технику Сон. Следи за этим.",
    date: "2026-05-20",
    content: "Многие пользователи забывают закрывать день техникой Сон. Важно понимать: система фиксирует день только после осознанного завершения. Если ты выполнил 5 техник, но не нажал «Завершить день» в Сне — прогресс серии сбрасывается.\n\nЭто не баг, это дисциплина."
  },
  "3": {
    title: "Академия пополнилась",
    desc: "Добавлены новые статьи по нейробиологии дофамина и силе воли.",
    date: "2026-05-10",
    content: "Открыт доступ к новым материалам в Академии. Узнайте, как система вознаграждения управляет вашими решениями и почему мотивация проигрывает дисциплине на длинной дистанции.\n\nСтатьи уже доступны для разблокировки за ключи."
  },
};

export default function NewsArticle() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { readNews, updateState } = useAppStore();
  const article = NEWS_DATA[id || ''];

  useEffect(() => {
    if (id && !readNews.includes(id)) {
      updateState(prev => ({ readNews: [...prev.readNews, id] }));
    }
  }, [id]);

  if (!article) {
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center">
        <p className="body text-secondary">Новость не найдена</p>
        <button onClick={() => setLocation("/")} className="mt-4 text-blue-light body-s">
          На главную
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-h-[100dvh] flex-col">
      <div
        className="fixed left-0 right-0 top-0 z-50 flex justify-center"
        style={{ background: "rgba(15,32,53,0.96)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}
      >
        <div
          className="flex w-full max-w-none items-center px-3"
          style={{ minHeight: "calc(48px + env(safe-area-inset-top))", paddingTop: "env(safe-area-inset-top)" }}
        >
          <button
            onClick={() => setLocation("/")}
            className="flex h-12 w-12 items-center justify-center text-primary active:opacity-60"
            aria-label="Назад к новостям"
          >
            <ChevronLeft size={26} />
          </button>
          <span className="body-s min-w-0 flex-1 truncate text-primary">{article.title}</span>
        </div>
      </div>

      <motion.div
        className="flex-1 overflow-y-auto px-5 pb-[112px] pt-[60px]"
        initial={{ opacity: 0, y: 24, scale: 0.985, filter: "blur(8px)" }}
        animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
        transition={{ duration: 0.62, ease: [0.16, 1, 0.3, 1] }}
      >
        <motion.h1
          className="mb-2 mt-4 text-primary leading-tight"
          style={{ fontSize: 30, lineHeight: 1.14, fontWeight: 700, letterSpacing: "-0.025em" }}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          {article.title}
        </motion.h1>
        <motion.span
          className="caption mb-8 block text-primary"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.24, duration: 0.4 }}
        >
          {new Date(article.date).toLocaleDateString("ru-RU")}
        </motion.span>

        <div className="space-y-4">
          {article.content.split("\n\n").map((paragraph, i) => (
            <motion.p
              key={i}
              className="body text-primary leading-relaxed"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.04, 0.6) }}
            >
              {paragraph}
            </motion.p>
          ))}
        </div>
      </motion.div>

      <div
        className="fixed bottom-0 left-0 right-0 z-50 flex justify-center"
        style={{ background: "rgba(15,32,53,0.97)", backdropFilter: "blur(20px)", borderTop: "1px solid rgba(255,255,255,0.05)" }}
      >
        <div className="w-full max-w-none px-4 pb-[calc(16px+env(safe-area-inset-bottom))] pt-4">
          <motion.button
            onClick={() => setLocation("/")}
            className="btn-grad btn-shimmer h-[52px] w-full rounded-[14px] text-white title-s active:opacity-90"
            whileTap={{ scale: 0.975, filter: "brightness(1.16)" }}
            transition={{ type: "spring", stiffness: 420, damping: 24 }}
          >
            Готово
          </motion.button>
        </div>
      </div>
    </div>
  );
}
