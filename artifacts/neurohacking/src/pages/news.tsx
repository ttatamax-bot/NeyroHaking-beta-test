import { useLocation, useParams } from "wouter";
import { useAppStore } from "@/lib/store";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { ChevronLeft } from "lucide-react";
import { useDevTextEditor } from "@/components/DevTextEditor";

const NEWS_DATA: Record<string, { title: string; desc: string; date: string; content: string }> = {
  "keys-potential-economy": {
    title: "Новая экономика ключей и потенциала",
    desc: "Теперь потенциал начисляется за закрытие дня на 100%.",
    date: "2026-08-25",
    content: "Мы полностью обновили экономику приложения. Потенциал теперь начисляется за закрытие дня на 100%, а ключи выдаются за каждый такой завершённый день.\n\nЧтобы закрыть день, выполни все шесть ежедневных техник: планирование, нейровизуализацию, медитацию, прогулку, хобби и сон. Каждая техника добавляет свой процент потенциала. Когда шкала достигает 100%, день считается закрытым, а награда начисляется автоматически.\n\nТак система поощряет не отдельный случайный шаг, а полноценный день заботы о себе."
  },
  "account-sync": {
    title: "Аккаунт сохраняет твой прогресс",
    desc: "Ключи, серии и выполненные техники доступны на любом устройстве.",
    date: "2026-08-24",
    content: "Теперь ты можешь создать аккаунт и сохранить свой прогресс: ключи, потенциал, серии, цели и выполненные техники привязываются к профилю.\n\nПосле входа данные восстанавливаются автоматически, поэтому можно продолжить путь с другого устройства и не начинать заново. Если соединение временно прервётся, приложение покажет состояние синхронизации и попробует повторить загрузку."
  },
  "memory-concentration": {
    title: "Добавлены техники памяти и концентрации",
    desc: "Несколько практик внутри каждой техники и таблица лидеров.",
    date: "2026-08-23",
    content: "В приложении появились новые направления для тренировки памяти и концентрации. Внутри каждой техники собрано несколько практик: выбирай подходящую под задачу, выполняй её и постепенно собирай свой результат.\n\nУ каждой практики своя механика и свой способ проверить прогресс. А таблица лидеров добавляет здоровый азарт: сравнивай результаты с другими участниками, следи за своим местом и возвращайся к тренировкам, чтобы подняться выше."
  },
  "visual-refresh": {
    title: "Полное обновление визуала",
    desc: "Новая визуальная система для Пути, техник, Академии и главной.",
    date: "2026-08-22",
    content: "Мы полностью обновили визуальный язык НейроХакинга. На главной появились более выразительные карточки новостей, мягкое свечение, глубина и понятнее расставленные акценты.\n\nВ Пути ракета, кольца и glow показывают движение и прогресс, а карточки целей помогают быстро увидеть следующий шаг. В техниках карточки стали компактнее и аккуратнее: на широких экранах они стоят в две колонки, а на мобильном складываются в удобный стек.\n\nВ Академии сохранили эффект наслаивания карточек, добавили больше структуры и воздуха. Все разделы теперь выглядят как части одной системы — спокойной, энергичной и понятной с первого взгляда."
  },
  "survey": {
    title: "Исследование продуктивности",
    desc: "20 вопросов о целях и привычках в обмен на 1200 ключей.",
    date: "2026-08-25",
    content: "Эта карточка открывает одноразовую исследовательскую анкету. Отвечай подробно и честно: правильных ответов нет.\n\nПосле полного заполнения ты получишь 1200 ключей. Если выйти из анкеты, промежуточные ответы не сохраняются."
  },
};

export default function NewsArticle() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { readNews, updateState } = useAppStore();
  const devText = useDevTextEditor();
  const article = NEWS_DATA[id || ''];
  const title = article
    ? devText.text({ id: `news.${id}.title`, area: "news", label: `${id} · заголовок`, source: article.title, value: article.title })
    : "";
  const contentParagraphs = article?.content.split("\n\n") ?? [];

  useEffect(() => {
    if (article && import.meta.env.DEV) {
      devText.registerFields([
        { id: `news.${id}.title`, area: "news", label: `${id} · заголовок`, source: article.title, value: article.title },
        ...contentParagraphs.map((paragraph, index) => ({
          id: `news.${id}.content.${index}`,
          area: "news" as const,
          label: `${id} · абзац ${index + 1}`,
          source: paragraph,
          value: paragraph,
        })),
      ]);
    }
    if (id && !readNews.includes(id)) {
      updateState(prev => ({ readNews: [...prev.readNews, id] }));
    }
  }, [id, article]);

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
          <span
            className="body-s min-w-0 flex-1 truncate text-primary"
            contentEditable={import.meta.env.DEV && devText.enabled}
            suppressContentEditableWarning
            onBlur={(event) => devText.updateDraft(
              { id: `news.${id}.title`, area: "news", label: `${id} · заголовок`, source: article.title, value: article.title },
              event.currentTarget.textContent ?? title,
            )}
          >
            {title}
          </span>
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
          <span
            contentEditable={import.meta.env.DEV && devText.enabled}
            suppressContentEditableWarning
            onBlur={(event) => devText.updateDraft(
              { id: `news.${id}.title`, area: "news", label: `${id} · заголовок`, source: article.title, value: article.title },
              event.currentTarget.textContent ?? title,
            )}
          >
            {title}
          </span>
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
          {contentParagraphs.map((paragraph, i) => {
            const paragraphField = {
              id: `news.${id}.content.${i}`,
              area: "news" as const,
              label: `${id} · абзац ${i + 1}`,
              source: paragraph,
              value: paragraph,
            };
            const paragraphValue = devText.text(paragraphField);
            return (
            <motion.p
              key={i}
              className="body text-primary leading-relaxed"
              contentEditable={import.meta.env.DEV && devText.enabled}
              suppressContentEditableWarning
              onBlur={(event) => devText.updateDraft(paragraphField, event.currentTarget.textContent ?? paragraphValue)}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.04, 0.6) }}
            >
              {paragraphValue}
            </motion.p>
            );
          })}
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
