import { useAppStore, ActivityEntry } from "@/lib/store";
import { ScreenTransition } from "@/components/ScreenTransition";
import { BackButton } from "@/components/BackButton";
import { motion } from "framer-motion";
import { Key, Zap, BookOpen, Brain, Footprints, Moon, Palette, ListTodo } from "lucide-react";

const TYPE_LABELS: Record<ActivityEntry['type'], string> = {
  planner: 'Планер',
  visualization: 'Нейровизуализация',
  meditation: 'Нейромедитация',
  walk: 'Прогулка',
  hobby: 'Хобби',
  sleep: 'Сон',
  article: 'Статья',
};

const TYPE_ICONS: Record<ActivityEntry['type'], React.ReactNode> = {
  planner: <ListTodo size={16} />,
  visualization: <Brain size={16} />,
  meditation: <Brain size={16} />,
  walk: <Footprints size={16} />,
  hobby: <Palette size={16} />,
  sleep: <Moon size={16} />,
  article: <BookOpen size={16} />,
};

const TYPE_COLORS: Record<ActivityEntry['type'], string> = {
  planner: 'rgba(37,99,235,0.2)',
  visualization: 'rgba(192,132,252,0.2)',
  meditation: 'rgba(6,182,212,0.2)',
  walk: 'rgba(34,197,94,0.2)',
  hobby: 'rgba(245,158,11,0.2)',
  sleep: 'rgba(99,102,241,0.2)',
  article: 'rgba(236,72,153,0.2)',
};

function getEntryDetail(entry: ActivityEntry): string {
  const d = entry.details;
  switch (entry.type) {
    case 'planner':
      return `${d.taskText ?? ''}${d.durationLabel ? ` · ${d.durationLabel}` : ''}`;
    case 'visualization':
      return d.goalName ? `Цель: ${d.goalName}` : '';
    case 'meditation':
      return d.durationLabel ?? '';
    case 'walk':
      return `${d.durationLabel ?? ''}${d.steps ? ` · ${d.steps} шагов` : ''}`;
    case 'hobby':
      return `${d.hobbyName ?? ''}${d.durationLabel ? ` · ${d.durationLabel}` : ''}`;
    case 'sleep':
      return d.sleepTime ? `Отбой в ${d.sleepTime}` : '';
    case 'article':
      return d.articleTitle ?? '';
    default:
      return '';
  }
}

function groupByDay(entries: ActivityEntry[]): { date: string; items: ActivityEntry[] }[] {
  const groups: Record<string, ActivityEntry[]> = {};
  for (const entry of entries) {
    const day = new Date(entry.date).toDateString();
    if (!groups[day]) groups[day] = [];
    groups[day].push(entry);
  }
  return Object.entries(groups).map(([, items]) => ({
    date: new Date(items[0].date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }),
    items,
  }));
}

export default function History() {
  const { activityLog } = useAppStore();
  const grouped = groupByDay(activityLog);

  return (
    <ScreenTransition className="pt-[64px] px-4 pb-24">
      <BackButton />

      <h1 className="title-l text-primary mb-6">История активности</h1>

      {grouped.length === 0 ? (
        <div className="bg-surface-1 border border-border rounded-[16px] p-6 text-center">
          <p className="body-s text-secondary">История пуста. Начни первый день.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map((group, gIdx) => (
            <motion.div
              key={group.date}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: gIdx * 0.05 }}
            >
              <h2 className="caption text-tertiary uppercase tracking-wider mb-3">{group.date}</h2>
              <div className="space-y-2">
                {group.items.map((entry) => {
                  const detail = getEntryDetail(entry);
                  const time = new Date(entry.date).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
                  return (
                    <div
                      key={entry.id}
                      className="bg-surface-1 border border-border rounded-[14px] p-4"
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className="w-8 h-8 rounded-[10px] flex items-center justify-center shrink-0 mt-0.5"
                          style={{ background: TYPE_COLORS[entry.type] }}
                        >
                          <span style={{ color: 'var(--text-primary)' }}>
                            {TYPE_ICONS[entry.type]}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className="title-s text-primary">{TYPE_LABELS[entry.type]}</span>
                            <span className="caption text-tertiary">{time}</span>
                          </div>
                          {detail && (
                            <p className="body-s text-secondary truncate mb-2">{detail}</p>
                          )}
                          <div className="flex gap-3">
                            {entry.keysGained > 0 && (
                              <span className="flex items-center gap-1 caption" style={{ color: '#F59E0B' }}>
                                <Key size={10} /> +{entry.keysGained}
                              </span>
                            )}
                            {entry.potentialGained > 0 && (
                              <span className="flex items-center gap-1 caption text-blue-light">
                                <Zap size={10} /> +{entry.potentialGained}%
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {entry.type === 'visualization' && entry.details.answers && entry.details.answers.length > 0 && (
                        <div className="mt-3 space-y-2 pl-11">
                          {entry.details.answers.map((ans: string, i: number) => (
                            <p key={i} className="body-s text-tertiary leading-relaxed">
                              <span className="text-secondary opacity-60">{i + 1}. </span>{ans}
                            </p>
                          ))}
                        </div>
                      )}

                      {entry.type === 'hobby' && entry.details.hobbyChallenge && (
                        <div className="mt-3 pl-11">
                          <p className="body-s text-tertiary leading-relaxed">
                            🎯 Вызов: «{entry.details.hobbyChallenge}»
                          </p>
                          <p className="body-s text-tertiary mt-1">
                            Результат: {entry.details.challengeResult === 'done' ? 'Выполнен' : entry.details.challengeResult === 'partial' ? 'В процессе' : 'Не выполнено'}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </ScreenTransition>
  );
}
