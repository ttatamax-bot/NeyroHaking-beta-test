import { useParams } from "wouter";
import { ScreenTransition } from "@/components/ScreenTransition";
import { BackButton } from "@/components/BackButton";
import { useAppStore } from "@/lib/store";
import { useEffect } from "react";
import { motion } from "framer-motion";

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
  const { readNews, updateState } = useAppStore();
  const article = NEWS_DATA[id || ''];

  useEffect(() => {
    if (id && !readNews.includes(id)) {
      updateState(prev => ({ readNews: [...prev.readNews, id] }));
    }
  }, [id]);

  if (!article) return <div className="p-4 pt-16 text-primary">Новость не найдена</div>;

  return (
    <ScreenTransition variant="reveal" className="pt-[64px] px-4 pb-12">
      <BackButton />

      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.14, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <h1 className="title-l text-primary mb-2 mt-4">{article.title}</h1>
        <motion.span
          className="caption text-tertiary mb-8 block"
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.24, duration: 0.45 }}
        >
          {article.date}
        </motion.span>
      </motion.div>

      <div className="body text-secondary whitespace-pre-wrap leading-relaxed space-y-4">
        {article.content.split('\n\n').map((paragraph, i) => (
          <motion.p
            key={i}
            initial={{ opacity: 0, y: 16, filter: "blur(6px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ delay: 0.32 + i * 0.1, duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          >
            {paragraph}
          </motion.p>
        ))}
      </div>
    </ScreenTransition>
  );
}
