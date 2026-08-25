import { createPortal } from "react-dom";
import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Sparkles, X } from "lucide-react";
import { submitSurvey, type SurveyAnswers } from "@/lib/api";
import { SurveyRewardCinematic } from "@/components/SurveyRewardCinematic";

type Field = { key: keyof SurveyAnswers; title: string; min?: number; hint?: string; choices?: string[]; multiple?: boolean; optional?: boolean };
const ages = ["До 14 лет", "14–16 лет", "17–18 лет", "19–21 год", "22–24 года", "25–29 лет", "30 лет и старше"];
const jobs = ["Учусь в школе", "Учусь в колледже / техникуме", "Учусь в университете", "Работаю по найму", "Работаю на себя / фриланс", "Развиваю собственный бизнес / проект", "Сейчас не учусь и не работаю", "Другое"];
const goals = ["Да, у меня есть конкретная цель", "Есть несколько целей, но я не понимаю, какую выбрать", "Хочу что-то изменить, но пока не знаю, чего именно хочу", "Сейчас конкретной цели нет"];
const fields: Field[] = [
  { key: "q7FailureSituation", title: "Вспомни последний случай, когда ты собирался работать над важной для тебя целью, но в итоге этого не сделал. Что произошло?", min: 50, hint: "Пример: «Собирался вечером поработать над проектом, но после учёбы устал и пошёл смотреть видео». «Открыл учебник, увидел большой объём материала и решил начать завтра».\n\nВажно получить конкретную ситуацию, поэтому при коротком ответе показать подсказку: «Опиши конкретный последний случай: что ты собирался сделать, что произошло и чем всё закончилось?»" },
  { key: "q8AfterWeeks", title: "Что обычно происходит после нескольких дней или недель, когда ты начинаешь регулярно работать над целью?", min: 40, hint: "Пример: «Первые несколько дней работаю каждый день, потом начинаю пропускать». «Постепенно теряю интерес». «Увеличиваю нагрузку, а потом сильно устаю и перестаю работать». «Если один раз пропустил, потом становится сложно вернуться»." },
  { key: "q9Distraction", title: "Что ты обычно делаешь вместо работы над целью?", min: 20, hint: "Пример: «Сижу в телефоне, смотрю видео». «Играю». «Начинаю заниматься мелкими делами». «Просто откладываю начало»." },
  { key: "q10AfterPostponing", title: "Что ты обычно думаешь или чувствуешь после того, как снова отложил важную для себя задачу?", min: 30, hint: "Пример: «Злюсь на себя и думаю, что опять всё испортил». «Чувствую вину». «Ничего особенного, просто откладываю дальше»." },
  { key: "q11StablePeriod", title: "Бывали ли у тебя периоды, когда ты действительно много и стабильно работал над важной для тебя целью? Расскажи, что это был за период.", min: 50, hint: "Пример: «Перед экзаменами два месяца учился каждый день». «Когда запускал проект, несколько недель работал почти каждый день».\n\nЕсли такого периода не было, разрешить ответ: «Такого периода у меня не было»." },
  { key: "q12WhatChanged", title: "Что было по-другому в тот период?", min: 30, hint: "Пример: «У меня был конкретный дедлайн». «Мне очень хотелось получить результат». «Я видел, что у меня получается». «Мне нравился сам процесс»." },
  { key: "q13OneChange", title: "Если бы ты мог изменить одну вещь в своей способности работать над важными для тебя задачами, что бы ты изменил?", min: 30, hint: "Пример: «Хочу перестать постоянно отвлекаться». «Хочу научиться работать по несколько часов каждый день». «Хочу перестать бросать начатое». «Хочу научиться работать спокойно и не выгорать»." },
  { key: "q14FutureAbility", title: "Представь, что через год ты полностью доволен тем, как ты работаешь и достигаешь своих целей. Что ты сейчас умеешь делать, чего пока не умеешь?", min: 50, hint: "Пример: «Могу каждый день работать над одной целью и доводить проекты до результата». «Могу много работать и при этом сохранять энергию». «Умею быстро возвращаться к работе после неудач»." },
  { key: "q15Tried", title: "Что ты уже пробовал, чтобы стать продуктивнее, дисциплинированнее или начать регулярно заниматься важными для тебя делами?", min: 30, hint: "Пример: «Планировщик, расписание, метод Помодоро, блокировщик социальных сетей, обещания себе». «Смотрел видео про дисциплину и пытался вставать в 6 утра»." },
  { key: "q16WhatHelped", title: "Что из этого помогло, а что в итоге перестало работать? Почему?", min: 30, hint: "Пример: «Первые несколько дней помогало расписание, потом перестал ему следовать». «Блокировщик работает, но я его отключаю». «Мотивационные видео помогают начать, но результата на дистанции нет»." },
  { key: "q17SpentMoney", title: "На что ты уже тратил собственные деньги за последний год, чтобы улучшить себя, получить новые знания или решить какую-либо проблему? Напиши конкретные продукты и примерно сколько они стоили.", min: 20, hint: "Пример: «Купил курс английского за 7000 ₽, абонемент в зал 3000 ₽ в месяц, книгу по программированию за 1500 ₽»." },
  { key: "q18HelpfulPurchase", title: "Вспомни покупку, которая действительно помогла тебе решить проблему или получить результат. Что ты купил и почему решил заплатить за это?", min: 40 },
];

const initial: SurveyAnswers = {
  q1Age: "", q2Occupations: [], q2Other: "", q3GoalStatus: "", q4Goal: "", q5CurrentTime: "", q6DesiredTime: "",
  q7FailureSituation: "", q8AfterWeeks: "", q9Distraction: "", q10AfterPostponing: "", q11StablePeriod: "",
  q12WhatChanged: "", q13OneChange: "", q14FutureAbility: "", q15Tried: "", q16WhatHelped: "", q17SpentMoney: "",
  q18HelpfulPurchase: "", q20Telegram: "",
};

export function SurveyModal({ onClose, onComplete }: { onClose: () => void; onComplete: (keys: number) => void }) {
  const [answers, setAnswers] = useState<SurveyAnswers>(initial);
  const [step, setStep] = useState(0);
  const [started, setStarted] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [reward, setReward] = useState<number | null>(null);
  const [showRewardCinematic, setShowRewardCinematic] = useState(false);
  const hasGoal = answers.q3GoalStatus.includes("конкретной") || answers.q3GoalStatus.includes("несколько");
  const questionSteps = useMemo(() => [
    { title: "Сколько тебе лет?", key: "q1Age" as const, choices: ages },
    { title: "Чем ты сейчас занимаешься?", key: "q2Occupations" as const, choices: jobs, multiple: true },
    { title: "Есть ли сейчас что-то, чего ты хочешь добиться в ближайшие несколько месяцев?", key: "q3GoalStatus" as const, choices: goals },
    ...(hasGoal ? [
      { title: "Какая сейчас твоя главная цель? Опиши её своими словами.", key: "q4Goal" as const, min: 30, hint: "Пример: «Хочу запустить свой проект и начать на нём зарабатывать». «Хочу хорошо сдать экзамены и поступить в университет». «Хочу привести себя в форму»." },
      { title: "Сколько времени в неделю ты сейчас реально уделяешь этой цели?", key: "q5CurrentTime" as const, min: 10, hint: "Пример: «Около 5 часов». «Каждый будний день примерно по 2 часа». «Планирую заниматься каждый день, но фактически получается 2–3 часа в неделю»." },
      { title: "Сколько времени в неделю ты хотел бы уделять этой цели?", key: "q6DesiredTime" as const, min: 10, hint: "Пример: «Хотел бы работать над ней 4–5 часов каждый день». «Мне было бы достаточно 10 часов в неделю». «Пока не знаю»." },
    ] : []),
    ...fields,
    { title: "Помимо награды за анкету ты можешь получить дополнительную награду в виде ключей, если выйдешь на созвон по теме продуктивности и расскажешь подробнее о своей ситуации.", key: "q20Telegram" as const, optional: true, hint: "Оставь свой телеграмм и я свяжусь с тобой." },
  ], [hasGoal]);
  const current = questionSteps[step];
  const requestClose = () => {
    if (window.confirm("Выйти из анкеты? Все введённые ответы будут потеряны.")) {
      onClose();
    }
  };
  const setValue = (key: keyof SurveyAnswers, value: string | string[]) => setAnswers((prev) => ({ ...prev, [key]: value }));
  const validate = () => {
    if (current.multiple) return answers.q2Occupations.length ? "" : "Выбери хотя бы один вариант";
    if (current.key === "q20Telegram") return "";
    const value = String(answers[current.key] || "").trim();
    if (!value) return "Ответ обязателен";
    if ("min" in current && current.min && value.length < current.min) return `Ответ должен быть не короче ${current.min} символов`;
    return "";
  };
  const next = async () => {
    const issue = validate();
    if (issue) { setError(issue); return; }
    setError("");
    if (step < questionSteps.length - 1) { setStep(step + 1); return; }
    setSaving(true);
    try {
      const result = await submitSurvey(answers);
      setReward(result.reward);
      setShowRewardCinematic(true);
    } catch (e: any) {
      setError(e?.data?.error || "Не удалось сохранить анкету. Попробуй ещё раз.");
    } finally { setSaving(false); }
  };
  if (showRewardCinematic && reward !== null) return (
    <SurveyRewardCinematic
      amount={reward}
      onComplete={() => setShowRewardCinematic(false)}
    />
  );
  if (reward !== null) return (
    <SurveyOverlay className="flex items-center justify-center p-5">
      <div className="w-full max-w-[560px] rounded-[28px] border border-orange-300/20 bg-[#102747] p-8 text-center shadow-2xl">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-orange-300/15 text-orange-200"><Check size={32} /></div>
        <h1 className="display-l mb-4">Спасибо за участие</h1>
        <p className="body text-secondary">Твои ответы помогут сделать систему полезнее для людей с похожими целями.</p>
        {reward > 0 ? (
          <p className="mt-5 text-2xl font-semibold text-orange-200">+{reward} ключей</p>
        ) : (
          <p className="mt-5 text-secondary">Новая награда за эту анкету уже была начислена ранее.</p>
        )}
        <button onClick={() => onComplete(reward)} className="btn-grad mt-7 flex h-14 w-full items-center justify-center gap-2 rounded-2xl title-s">
          {reward > 0 ? "Получить награду" : "Закрыть"} {reward > 0 && <Sparkles size={18} />}
        </button>
      </div>
    </SurveyOverlay>
  );
  if (!started) return (
    <SurveyOverlay className="flex items-center justify-center p-5">
      <div className="w-full max-w-[560px] rounded-[28px] border border-blue-300/20 bg-[#102747] p-7 text-center shadow-2xl">
        <button onClick={requestClose} className="absolute right-5 top-5 text-white/60" aria-label="Выйти из анкеты"><X /></button>
        <Sparkles className="mx-auto mb-5 text-orange-300" size={34} />
        <h1 className="display-l mb-4">Исследование продуктивности и достижения целей</h1>
        <p className="body text-secondary leading-relaxed">Отвечай на вопросы честно и подробно - только тогда ты получишь в награду 1200 ключей.</p>
        <button onClick={() => { setStarted(true); setStep(0); }} className="btn-grad mt-7 flex h-14 w-full items-center justify-center gap-2 rounded-2xl title-s">Начать <ArrowRight size={19} /></button>
      </div>
    </SurveyOverlay>
  );
  const progress = ((step + 1) / questionSteps.length) * 100;
  const choices = "choices" in current ? current.choices : undefined;
  const selected = current.multiple ? answers.q2Occupations : answers[current.key];
  return (
    <SurveyOverlay className="overflow-y-auto p-4 sm:p-8">
      <div className="mx-auto flex min-h-[calc(100dvh-2rem)] w-full max-w-[700px] flex-col">
        <div className="mb-8 flex items-center justify-between"><span className="label text-blue-200/70">АНКЕТА · {step + 1} / {questionSteps.length}</span><button onClick={requestClose} className="text-white/60" aria-label="Выйти из анкеты"><X /></button></div>
        <div className="mb-10 h-1.5 rounded-full bg-white/10"><div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-orange-400 transition-all" style={{ width: `${progress}%` }} /></div>
        <div className="flex-1">
          <h2 className="display-l mb-7">{current.title}</h2>
          {choices ? <div className="grid gap-3">{choices.map((choice) => {
            const isSelected = current.multiple ? (selected as string[]).includes(choice) : selected === choice;
            return <button key={choice} onClick={() => setValue(current.key, current.multiple ? (isSelected ? (selected as string[]).filter((x) => x !== choice) : [...(selected as string[]), choice]) : choice)} className={`flex min-h-14 items-center rounded-2xl border px-4 text-left body transition ${isSelected ? "border-orange-300 bg-orange-400/15 text-white" : "border-white/10 bg-white/[.03] text-secondary"}`}><span className={`mr-3 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${isSelected ? "border-orange-300 bg-orange-300 text-[#13233b]" : "border-white/30"}`}>{isSelected && <Check size={13} />}</span>{choice}</button>;
          })}</div> : <textarea autoFocus value={String(answers[current.key] || "")} onChange={(e) => setValue(current.key, e.target.value)} className="min-h-[190px] w-full resize-y rounded-2xl border border-white/10 bg-white/[.05] p-4 text-white outline-none placeholder:text-white/30 focus:border-blue-300/60" placeholder="Напиши свой ответ..." />}
          {current.key === "q2Occupations" && answers.q2Occupations.includes("Другое") && <input value={answers.q2Other} onChange={(e) => setValue("q2Other", e.target.value)} className="mt-3 h-14 w-full rounded-2xl border border-white/10 bg-white/[.05] px-4 text-white outline-none" placeholder="Расскажи подробнее" />}
          {"hint" in current && current.hint && <p className="body-s mt-4 text-blue-200/60">{current.hint}</p>}
          {error && <p className="body-s mt-4 text-red-300">{error}</p>}
        </div>
        <div className="mt-8 flex gap-3"><button disabled={step === 0} onClick={() => { setError(""); setStep(step - 1); }} className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 text-white disabled:opacity-30"><ArrowLeft /></button><button disabled={saving} onClick={next} className="btn-grad flex h-14 flex-1 items-center justify-center gap-2 rounded-2xl title-s">{saving ? "Сохраняем..." : step === questionSteps.length - 1 ? "Получить награду" : "Далее"} {!saving && <ArrowRight size={19} />}</button></div>
      </div>
    </SurveyOverlay>
  );
}

function SurveyOverlay({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return createPortal(
    <div
      className={`fixed inset-0 z-[1000] bg-[#071426] ${className}`}
      style={{ userSelect: "none", WebkitUserSelect: "none" }}
      onCopy={(event) => event.preventDefault()}
      onCut={(event) => event.preventDefault()}
      onContextMenu={(event) => event.preventDefault()}
    >
      {children}
    </div>,
    document.body,
  );
}