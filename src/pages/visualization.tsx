import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { useAppStore, getTodayKeysFromSource, computeStreakUpdate } from "@/lib/store";
import { TechniqueIntroPanel } from "@/components/TechniqueIntroPanel";
import { MaximInfoModal } from "@/components/MaximInfoModal";
import { motion, AnimatePresence } from "framer-motion";
import { Textarea } from "@/components/ui/textarea";
import { ChevronLeft, Pause, Play, Target } from "lucide-react";

const QUESTION_BLOCKS = [
  [
    "Ты достиг цели. Какой первый образ приходит? Не думай — просто увидь.",
    "Где ты находишься в момент, когда понимаешь: «Я сделал это»?",
    "Кто рядом с тобой в сцене твоей победы?",
    "Что конкретно произошло? Какое событие означает, что цель достигнута?",
    "Как ты осознаёшь, что победил? Что является главным сигналом?",
    "Ты достиг цели. Что ты делаешь в первый час после?",
    "Кому ты сообщаешь о победе первым?",
    "Как выглядит пространство вокруг?",
    "Что изменилось в тебе самом?",
    "Что эта победа говорит о тебе?",
    "Чего больше нет в твоей жизни после достижения цели?",
    "Что появилось в твоей жизни, чего не было раньше?",
    "Кто больше всего гордится тобой в этот момент?",
    "Что ты видишь перед собой? Опиши пространство вокруг.",
    "Как этот момент меняет твою историю?",
    "Если бы этот момент снимали в кино, где стояла бы камера?",
    "Что самое неожиданное в этой сцене?",
    "Какое внутреннее напряжение наконец исчезло?",
    "Что бы ты хотел запомнить из этого момента навсегда?",
    "Кого тебе больше всего хочется обнять в этот момент?",
  ],
  [
    "Какие звуки наполняют сцену?",
    "Что ты чувствуешь кожей?",
    "Какого цвета пространство вокруг тебя?",
    "Чем пахнет в этом моменте?",
    "Что ты видишь ярче всего?",
    "Что ты слышишь, если закрываешь глаза?",
    "Какая температура вокруг?",
    "Что ты чувствуешь под ногами?",
    "Какая музыка подошла бы этому моменту?",
    "Как освещено пространство?",
    "Что надето на тебе?",
    "Есть ли люди вокруг? Что ты слышишь от них?",
    "Что ты держишь в руках?",
    "Какое время суток в этой сцене?",
    "Что движется вокруг тебя?",
    "Какой предмет рядом самый важный?",
    "Какой момент этой сцены выглядит настолько красиво, что тебе хочется остановить время?",
    "Что находится прямо перед твоими глазами?",
    "Какой цвет доминирует в этой сцене?",
    "Если усилить один звук в этой сцене, что это будет?",
  ],
  [
    "Какая эмоция накрывает тебя в этот момент?",
    "Если бы твоя эмоция была звуком, какой бы она была?",
    "Как меняется твоё дыхание?",
    "Кто первым увидит тебя таким?",
    "Что ты скажешь себе в этот момент?",
    "Как бьётся твоё сердце?",
    "Что ты чувствуешь в своём теле?",
    "За что ты благодарен себе в этот момент?",
    "Что ты чувствуешь в груди, животе и горле?",
    "Ты улыбаешься, смеёшься или просто выдыхаешь?",
    "Как меняется твоя поза?",
    "Какую фразу тебе хотелось услышать всю жизнь, и кто произносит её сейчас?",
    "Есть ли в этом чувстве облегчение?",
    "Что хочется сделать сразу после?",
    "Кому ты хочешь рассказать об этом первым?",
    "Что ты чувствуешь по отношению к себе?",
    "Есть ли в этом моменте слёзы?",
    "Как меняется твой взгляд?",
    "Что происходит с напряжением в плечах, руках и спине?",
    "Ты переживаешь эту эмоцию один или разделяешь её с кем-то?",
  ],
  [
    "На какое главное желание отвечает эта цель?",
    "Что изменится в твоём обычном дне после достижения?",
    "Ради кого или ради чего ты идёшь к этой цели?",
    "Как победа изменит твоё представление о себе?",
    "Что ты сможешь делать такого, чего не можешь сейчас?",
    "Какое сообщение ты отправишь близкому человеку в день победы?",
    "Как изменится твоя жизнь после достижения?",
    "От какого страха ты освободишься?",
    "Что эта победа докажет тебе самому?",
    "Какой выбор появится у тебя после достижения?",
    "Кому ты станешь примером?",
    "Ради какой ценности ты на самом деле это делаешь?",
    "Что ты скажешь тем, кто был рядом в трудные моменты?",
    "Как эта победа связана с твоим прошлым?",
    "Представь, что прошло 10 лет. За что будущий ты благодарит тебя сегодняшнего?",
    "Почему эта победа стоит всех усилий, которые ты вложил?",
    "Что станет возможным в твоей жизни только благодаря этой победе?",
    "Как изменится твоя роль среди близких людей?",
    "Что ты теперь сможешь дать другим?",
    "Почему эта цель важна не только для тебя?",
  ],
  [
    "Вспомни момент, когда цель казалась невозможной.",
    "От чего ты отказываешься сегодня ради этого будущего?",
    "Вспомни самый тяжёлый день на пути к этой цели. Что бы ты сказал себе из будущего?",
    "Какое препятствие было самым трудным?",
    "Оглянись на себя сегодняшнего из момента победы. Что бы ты сказал себе?",
    "С чего всё началось?",
    "Сколько раз ты был на грани отказа?",
    "Что ты сделал сегодня для этой цели?",
    "Какую версию себя ты оставляешь позади?",
    "Что бы ты потерял, если бы сдался?",
    "Какой самый маленький, но важный шаг приблизил тебя к цели?",
    "Кто помог тебе, когда было тяжело?",
    "Что ты знаешь сейчас, чего не знал в начале пути?",
    "Как изменилось твоё окружение?",
    "Какой момент стал переломным?",
    "Что ты скажешь себе завтрашнему?",
    "Что ты теперь ценишь такого, чего не ценил раньше?",
    "Какой момент был настолько тяжёлым, что большинство людей бы сдались?",
    "Что ты хочешь сказать человеку, который был рядом в самый тёмный момент?",
    "Что изменилось в тебе за время этого пути?",
  ],
];

function pickRandomQuestions(): string[] {
  return QUESTION_BLOCKS.map(block => block[Math.floor(Math.random() * block.length)]);
}

const VIZ_TIMER_SECONDS = 180;
const KEYS_REWARD = 20;
const MAX_KEYS_PER_DAY = 40;
const POTENTIAL_REWARD = 0.2;
const SOURCE = 'Техника: Нейровизуализация';
const MIN_CHARS = 20;

type Phase = 'goal-select' | 'questions' | 'timer';

export default function Visualization() {
  const { goals, todayTechniques, keysHistory, updateState, timerWarningShown } = useAppStore();
  const [, setLocation] = useLocation();

  const todayEarned = getTodayKeysFromSource(keysHistory, SOURCE);
  const isMaxedOut = todayEarned >= MAX_KEYS_PER_DAY;

  const [phase, setPhase] = useState<Phase>('goal-select');
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<string[]>([]);
  const [qIdx, setQIdx] = useState(0);
  const [answer, setAnswer] = useState("");
  const [allAnswers, setAllAnswers] = useState<string[]>([]);
  const [showShortWarning, setShowShortWarning] = useState(false);
  const [showTimerWarning, setShowTimerWarning] = useState(false);
  const pendingTransitionRef = useRef(false);

  const [timeLeft, setTimeLeft] = useState(VIZ_TIMER_SECONDS);
  const [paused, setPaused] = useState(false);
  const [completed, setCompleted] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const completedRef = useRef(false);
  const pausedRef = useRef(paused);
  pausedRef.current = paused;

  const isDone = todayEarned >= MAX_KEYS_PER_DAY;
  const activeGoals = goals.filter(g => g.status === 'active');
  const selectedGoal = activeGoals.find(g => g.id === selectedGoalId) ?? null;

  const clearTimer = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }, []);

  const doComplete = useCallback((answers: string[]) => {
    if (completedRef.current) return;
    completedRef.current = true;
    clearTimer();
    const now = new Date().toISOString();
    const keysToAward = isMaxedOut ? 0 : KEYS_REWARD;
    updateState(prev => {
      const streakUpdate = computeStreakUpdate(prev);
      return {
        todayTechniques: { ...prev.todayTechniques, T2: true },
        keys: prev.keys + keysToAward,
        potential: Math.min(100, prev.potential + POTENTIAL_REWARD),
        keysHistory: keysToAward > 0
          ? [{ date: now, source: SOURCE, amount: keysToAward, type: 'earn' as const }, ...prev.keysHistory]
          : prev.keysHistory,
        potentialHistory: [{ date: now, source: SOURCE, amount: POTENTIAL_REWARD }, ...prev.potentialHistory],
        activityLog: [
          { id: `act_${Date.now()}`, date: now, type: 'visualization' as const, keysGained: keysToAward, potentialGained: POTENTIAL_REWARD, details: { goalName: selectedGoal?.name ?? '', goalId: selectedGoal?.id ?? '', answers } },
          ...prev.activityLog,
        ],
        ...streakUpdate,
      };
    });
    setCompleted(true);
  }, [clearTimer, updateState, isMaxedOut, selectedGoal]);

  useEffect(() => {
    if (phase !== 'timer' || completed) return;
    timerRef.current = setInterval(() => {
      if (pausedRef.current) return;
      setTimeLeft(t => {
        if (t <= 1) { doComplete(allAnswers); return 0; }
        return t - 1;
      });
    }, 1000);
    return clearTimer;
  }, [phase, completed, doComplete, clearTimer]);

  const startTimer = (answers: string[]) => {
    setAllAnswers(answers);
    setPhase('timer');
    setTimeLeft(VIZ_TIMER_SECONDS);
  };

  const handleNext = () => {
    if (answer.trim().length < MIN_CHARS) {
      setShowShortWarning(true);
      setTimeout(() => setShowShortWarning(false), 3000);
      return;
    }
    const updatedAnswers = [...allAnswers, answer];
    const isLastQ = qIdx === questions.length - 1;
    if (!isLastQ) {
      setAllAnswers(updatedAnswers);
      setQIdx(qIdx + 1);
      setAnswer("");
      return;
    }
    // Last question — start timer, possibly show warning first
    if (!timerWarningShown) {
      pendingTransitionRef.current = true;
      setAllAnswers(updatedAnswers);
      setShowTimerWarning(true);
    } else {
      startTimer(updatedAnswers);
    }
  };

  const handleTimerWarningClose = () => {
    setShowTimerWarning(false);
    updateState({ timerWarningShown: true });
    if (pendingTransitionRef.current) {
      pendingTransitionRef.current = false;
      startTimer(allAnswers);
    }
  };

  const handleGoalSelect = (goalId: string) => {
    setSelectedGoalId(goalId);
    setQuestions(pickRandomQuestions());
    setQIdx(0);
    setAnswer("");
    setAllAnswers([]);
    setPhase('questions');
  };

  const handleExit = () => {
    clearTimer();
    setPhase('goal-select');
    setSelectedGoalId(null);
    setQuestions([]);
    setQIdx(0);
    setAnswer("");
    setAllAnswers([]);
    setLocation('/techniques');
  };

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  if (completed || isDone) {
    return (
      <div className="flex flex-col h-[100dvh] items-center justify-center relative overflow-hidden">
        <div className="relative z-10 text-center px-8">
          <div className="text-6xl mb-4">✦</div>
          <h1 className="display-l text-primary mb-3">Визуализация завершена</h1>
          <p className="body text-secondary mb-8">
            {isMaxedOut && !completed ? 'Уже выполнено сегодня' : `+${KEYS_REWARD} ключей начислено`}
          </p>
          <button onClick={() => setLocation('/techniques')}
            className="w-full h-[52px] rounded-[14px] bg-surface-1 border border-border text-primary body active:opacity-70">
            Назад к техникам
          </button>
        </div>
      </div>
    );
  }

  if (activeGoals.length === 0) {
    return (
      <div className="flex flex-col h-[100dvh] items-center justify-center relative overflow-hidden p-8">
        <div className="relative z-10 text-center">
          <button onClick={() => setLocation('/techniques')} className="text-tertiary mb-4 inline-flex">
            <ChevronLeft size={24} />
          </button>
          <p className="body text-secondary mb-6">Сначала создай цель в разделе Путь — тогда техника нейровизуализации станет доступна.</p>
          <button onClick={() => setLocation('/goals')}
            className="h-[52px] px-8 rounded-[14px] btn-grad btn-shimmer text-white title-s">
            Создать цель
          </button>
        </div>
      </div>
    );
  }

  if (phase === 'goal-select') {
    return (
      <div className="flex flex-col h-[100dvh] relative overflow-hidden">
        <div className="relative z-10 flex flex-col h-full p-6">
          <div className="flex items-center pt-2 pb-6">
            <button onClick={() => setLocation('/techniques')} className="p-1 text-tertiary mr-3">
              <ChevronLeft size={28} />
            </button>
            <h1 className="title-l text-primary">Нейровизуализация</h1>
          </div>
          <p className="body text-secondary mb-8">Выбери цель для визуализации:</p>
          <div className="space-y-3">
            {activeGoals.map(goal => (
              <motion.button key={goal.id} whileTap={{ scale: 0.97 }} onClick={() => handleGoalSelect(goal.id)}
                className="w-full text-left rounded-[16px] p-4 active:brightness-110 transition-all"
                style={{ background: 'rgba(12,28,60,0.96)', border: '1px solid rgba(37,99,235,0.4)', boxShadow: '0 0 24px rgba(37,99,235,0.15), 0 4px 16px rgba(0,0,0,0.4)' }}>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0"
                    style={{ background: 'rgba(37,99,235,0.2)', border: '1px solid rgba(37,99,235,0.4)' }}>
                    <Target size={16} color="#60A5FA" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="title-s text-primary mb-0.5">{goal.name}</p>
                    {goal.description && <p className="body-s text-secondary line-clamp-1">{goal.description}</p>}
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        </div>
        <TechniqueIntroPanel techniqueId="T2" />
      </div>
    );
  }

  if (phase === 'timer') {
    const progress = 1 - timeLeft / VIZ_TIMER_SECONDS;
    return (
      <div className="flex flex-col h-[100dvh] items-center justify-center relative overflow-hidden">
        <motion.div animate={{ opacity: paused ? 0.3 : [0.5, 1, 0.5] }}
          transition={{ duration: 8, repeat: paused ? 0 : Infinity, ease: 'easeInOut' }}
          className="absolute inset-0"
          style={{ background: 'radial-gradient(circle, rgba(37,99,235,0.12) 0%, transparent 65%)' }} />
        <div className="relative z-10 flex flex-col items-center w-full px-8">
          <p className="title-s text-secondary mb-1 text-center">Визуализируй свою цель</p>
          <p className="caption text-tertiary mb-8 text-center">{selectedGoal?.name}</p>
          {paused && (
            <div className="mb-4 px-4 py-2 rounded-[10px] bg-surface-2 border border-[rgba(245,158,11,0.3)]">
              <span className="caption text-warning">Пауза</span>
            </div>
          )}
          <div className="w-52 h-52 relative mb-8">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 208 208">
              <circle cx="104" cy="104" r="96" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="4" />
              <circle cx="104" cy="104" r="96" fill="none" stroke="#2563EB" strokeWidth="4" strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 96}`}
                strokeDashoffset={`${2 * Math.PI * 96 * (1 - progress)}`}
                style={{ transition: 'stroke-dashoffset 1s linear' }} />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="display-l text-primary num">{formatTime(timeLeft)}</span>
              <span className="caption text-tertiary mt-1">осталось</span>
            </div>
          </div>
          <button onClick={() => setPaused(p => !p)}
            className="w-14 h-14 rounded-full bg-surface-1 border border-border flex items-center justify-center mb-6 active:opacity-70">
            {paused ? <Play size={22} className="text-primary ml-1" /> : <Pause size={22} className="text-primary" />}
          </button>
          <button onClick={handleExit} className="body-s text-tertiary active:opacity-60">
            Прервать (без награды)
          </button>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[qIdx] ?? '';
  const isLastQ = qIdx === questions.length - 1;
  const charCount = answer.trim().length;
  const tooShort = charCount < MIN_CHARS;

  return (
    <div className="flex flex-col h-[100dvh] relative overflow-hidden">
      <motion.div animate={{ opacity: [0.4, 0.9, 0.4] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute inset-0"
        style={{ background: 'radial-gradient(circle, rgba(37,99,235,0.12) 0%, transparent 65%)' }} />
      <div className="relative z-10 flex flex-col h-full p-4 pb-8">
        <div className="flex items-center pt-2 pb-4">
          <button onClick={handleExit} className="p-1 text-tertiary mr-3">
            <ChevronLeft size={28} />
          </button>
          <span className="caption text-blue-light">
            {selectedGoal?.name} · Вопрос {qIdx + 1}/{questions.length}
          </span>
        </div>
        <AnimatePresence mode="wait">
          <motion.div key={qIdx} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }} className="flex-1 flex flex-col">
            <h2 className="title-s text-primary mb-5">{currentQuestion}</h2>
            <Textarea value={answer} onChange={e => setAnswer(e.target.value)} placeholder="Твой ответ..."
              className="flex-1 min-h-[180px] bg-surface-1 border-[rgba(255,255,255,0.08)] rounded-[16px] text-primary body p-4 focus-visible:ring-1 focus-visible:ring-blue-core focus-visible:border-transparent resize-none" />
            <div className="flex justify-between mt-1.5">
              <span className={`caption ${tooShort ? 'text-tertiary' : 'text-success'}`}>
                {charCount} / {MIN_CHARS} символов минимум
              </span>
            </div>
          </motion.div>
        </AnimatePresence>
        <div className="pt-4">
          <div className="flex gap-1 mb-4 justify-center">
            {questions.map((_, i) => (
              <div key={i} className={`h-1 rounded-full transition-all duration-300 ${
                i < qIdx ? 'bg-blue-core w-5' : i === qIdx ? 'bg-blue-core w-7' : 'bg-surface-3 w-3'
              }`} />
            ))}
          </div>
          <button onClick={handleNext}
            className="w-full h-[52px] rounded-[14px] btn-grad btn-shimmer text-white title-s">
            {isLastQ ? 'Начать визуализацию' : 'Дальше'}
          </button>
        </div>
      </div>
      <AnimatePresence>
        {showShortWarning && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.25 }}
            className="fixed left-0 right-0 z-[60] flex justify-end px-4"
            style={{ bottom: '140px' }}>
            <div className="flex flex-row-reverse items-end gap-2" style={{ maxWidth: 'min(300px, calc(100% - 8px))' }}>
              <img src="/maxim-avatar.png" alt="Максим"
                className="w-[44px] h-[44px] rounded-full object-cover shrink-0"
                style={{ boxShadow: '0 0 0 2px #2563EB' }} />
              <div className="flex flex-col items-end gap-[3px]">
                <span style={{ fontSize: 11, fontWeight: 700, color: '#93c5fd', letterSpacing: '0.03em', paddingRight: 4 }}>
                  Татаринов Максим
                </span>
                <div className="rounded-[16px] rounded-br-[4px] px-4 py-3"
                  style={{ background: 'rgba(10,13,26,0.98)', border: '1.5px solid rgba(37,99,235,0.5)', boxShadow: '0 4px 24px rgba(0,0,0,0.6)' }}>
                  <p className="body text-primary">Опиши детальнее и подробнее</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <MaximInfoModal
        show={showTimerWarning}
        message={"Из-за технических ограничений таймер в приложении не работает фоном, пожалуйста, не закрывай приложение."}
        onClose={handleTimerWarningClose}
      />
    </div>
  );
}
