import { motion } from "framer-motion";
import "./_group.css";

const goals = [
  { code: "01", name: "Утренняя настройка", detail: "Визуализация · 12 минут", progress: 68 },
  { code: "02", name: "Глубокая работа", detail: "Один фокус-сет до 11:00", progress: 41 },
];

const news = [
  ["01", "Новая техника нейровизуализации", "Обновлён алгоритм прохождения техники T2 — визуализация теперь более структурированная и точная.", "28.05.2026"],
  ["02", "Важно о серии", "Серия сохраняется после выполнения любой техники за день. Следи за этим.", "20.05.2026"],
  ["03", "Академия пополнилась", "Добавлены новые статьи по нейробиологии дофамина и силе воли.", "10.05.2026"],
];

function LiveRing() {
  const potential = 74;
  const segments = 30;
  const activeAmount = (potential / 100) * segments;
  const activeSegments = Math.floor(activeAmount);
  const partialSegment = activeAmount - activeSegments;
  const cx = 170;
  const cy = 130;
  const rx = 145;
  const ry = 104;
  const startAngle = 150;
  const sweep = 240;
  const gap = 2.6;

  const point = (angle: number) => {
    const radians = (angle * Math.PI) / 180;
    return { x: cx + rx * Math.cos(radians), y: cy + ry * Math.sin(radians) };
  };

  const segmentPath = (index: number, progress = 1) => {
    const segmentSweep = sweep / segments;
    const from = startAngle + index * segmentSweep + gap / 2;
    const to = from + (segmentSweep - gap) * progress;
    const begin = point(from);
    const end = point(to);
    const largeArc = to - from > 180 ? 1 : 0;
    return `M ${begin.x.toFixed(2)} ${begin.y.toFixed(2)} A ${rx} ${ry} 0 ${largeArc} 1 ${end.x.toFixed(2)} ${end.y.toFixed(2)}`;
  };

  return (
    <div className="nh-ring" aria-label="Потенциал дня 74 процента">
      <svg viewBox="0 0 340 260" role="img">
        <defs>
          <linearGradient id="ember" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#ffd395"/><stop offset=".28" stopColor="#ff8a38"/><stop offset="1" stopColor="#d94d1e"/></linearGradient>
          <filter id="scale-glow"><feGaussianBlur stdDeviation="4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
        </defs>
        {Array.from({ length: segments }, (_, index) => {
          const fill = index < activeSegments ? 1 : index === activeSegments ? partialSegment : 0;
          return (
            <motion.path
              key={index}
              d={segmentPath(index)}
              fill="none"
              stroke={fill > 0 ? "url(#ember)" : "#eef1f2"}
              strokeWidth="15"
              strokeLinecap="round"
              opacity={fill > 0 ? 1 : .92}
              filter={fill > 0 ? "url(#scale-glow)" : undefined}
              pathLength={fill > 0 && fill < 1 ? 1 : undefined}
              strokeDasharray={fill > 0 && fill < 1 ? `${fill} 1` : undefined}
              initial={{ opacity: fill > 0 ? 1 : .82 }}
              animate={{ opacity: fill > 0 ? [1, .78, 1] : .82 }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: fill > 0 ? index * 0.025 : 0 }}
            />
          );
        })}
      </svg>
      <div className="nh-center">
        <motion.span className="nh-score" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .35, duration: .8 }}>{potential}</motion.span>
        <motion.span className="nh-percent" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: .25 }}>%</motion.span>
      </div>
      <div className="nh-ring-label">ПОТЕНЦИАЛ ДНЯ</div>
    </div>
  );
}

export function Variant() {
  return (
    <main className="nh-home">
      <div className="nh-shell">
        <header className="nh-top">
          <div className="nh-date">17 августа</div>
        </header>
        <section className="nh-hero">
          <LiveRing />
        </section>
        <section className="nh-section">
          {goals.map((goal, i) => <motion.article key={goal.code} className="nh-goal" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .18 + i * .08 }}>
            <div className="nh-goal-row"><div className="nh-goal-mark">{goal.code}</div><div><div className="nh-goal-name">{goal.name}</div><div className="nh-goal-sub">{goal.detail}</div></div></div>
            <div className="nh-progress"><span style={{ width: `${goal.progress}%` }} /></div>
          </motion.article>)}
        </section>
        <section className="nh-news">
          <div className="nh-section-head"><h2 className="nh-section-title">Новости системы</h2></div>
          {news.map(([index, title, desc, date]) => <article className="nh-news-card" key={index}><div className="nh-news-index">{index}</div><div><div className="nh-news-title">{title}</div><div className="nh-news-desc">{desc}</div><div className="nh-news-date">{date}</div></div></article>)}
        </section>
      </div>
      <nav className="nh-nav" aria-label="Основная навигация">
        <div className="nh-nav-item active"><div className="nh-nav-dot" />СЕГОДНЯ</div>
        <div className="nh-nav-item"><div className="nh-nav-dot" />ТЕХНИКИ</div>
        <div className="nh-nav-item"><div className="nh-nav-dot" />ПУТЬ</div>
        <div className="nh-nav-item"><div className="nh-nav-dot" />ПРОФИЛЬ</div>
      </nav>
    </main>
  );
}

export default Variant;