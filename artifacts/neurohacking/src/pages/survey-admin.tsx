import { useEffect, useState } from "react";
import { Download, Eye, Search, X } from "lucide-react";
import { API_BASE, apiGet } from "@/lib/api";

type Row = Record<string, unknown> & { id: number; email?: string; username?: string; q1Age?: string; q3GoalStatus?: string; completedAt?: string };
const labels: Record<string, string> = {
  q1Age: "Возраст", q2Occupations: "Занятость", q3GoalStatus: "Цели", q4Goal: "Главная цель",
  q5CurrentTime: "Времени сейчас", q6DesiredTime: "Желаемое время", q7FailureSituation: "Последний срыв",
  q8AfterWeeks: "Через несколько недель", q9Distraction: "Вместо цели", q10AfterPostponing: "После откладывания",
  q11StablePeriod: "Стабильный период", q12WhatChanged: "Что изменилось", q13OneChange: "Одно изменение",
  q14FutureAbility: "Навык через год", q15Tried: "Что пробовал", q16WhatHelped: "Что помогло",
  q17SpentMoney: "Траты", q18HelpfulPurchase: "Полезная покупка",
  q20Telegram: "Telegram",
};
export default function SurveyAdmin() {
  const [rows, setRows] = useState<Row[]>([]);
  const [search, setSearch] = useState("");
  const [age, setAge] = useState("");
  const [occupation, setOccupation] = useState("");
  const [selected, setSelected] = useState<Row | null>(null);
  const [error, setError] = useState("");
  const load = () => apiGet<{ rows: Row[] }>("/admin/survey?search=" + encodeURIComponent(search) + "&age=" + encodeURIComponent(age) + "&occupation=" + encodeURIComponent(occupation)).then((data) => setRows(data.rows)).catch((e) => setError(e?.data?.error || "Нет доступа"));
  useEffect(() => { load(); }, []);
  return <div className="min-h-[100dvh] bg-[#0b1b31] px-4 pb-20 pt-24 text-white sm:px-8">
    <div className="mx-auto max-w-7xl">
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4"><div><p className="label text-orange-300">ИССЛЕДОВАНИЕ</p><h1 className="display-l mt-2">Ответы аудитории</h1><p className="body-s mt-2 text-secondary">{rows.length} заполненных анкет</p></div><div className="flex gap-2"><a className="flex h-11 items-center gap-2 rounded-xl border border-white/10 px-4 body-s" href={`${API_BASE}/admin/survey/export.csv`}>CSV <Download size={16} /></a><a className="flex h-11 items-center gap-2 rounded-xl border border-white/10 px-4 body-s" href={`${API_BASE}/admin/survey/export.xlsx`}>XLSX <Download size={16} /></a></div></div>
      <div className="mb-5 flex flex-wrap gap-3"><div className="relative flex-1"><Search className="absolute left-3 top-3.5 text-white/40" size={17} /><input value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === "Enter" && load()} placeholder="Email, username или Telegram" className="h-11 w-full rounded-xl border border-white/10 bg-white/[.05] pl-10 pr-3 text-white outline-none" /></div><select value={age} onChange={(e) => { setAge(e.target.value); }} className="h-11 rounded-xl border border-white/10 bg-[#142b4b] px-3 text-white"><option value="">Все возраста</option>{["До 14 лет", "14–16 лет", "17–18 лет", "19–21 год", "22–24 года", "25–29 лет", "30 лет и старше"].map((x) => <option key={x}>{x}</option>)}</select><select value={occupation} onChange={(e) => setOccupation(e.target.value)} className="h-11 rounded-xl border border-white/10 bg-[#142b4b] px-3 text-white"><option value="">Вся занятость</option>{["Учусь в школе", "Учусь в колледже / техникуме", "Учусь в университете", "Работаю по найму", "Работаю на себя / фриланс", "Развиваю собственный бизнес / проект", "Сейчас не учусь и не работаю", "Другое"].map((x) => <option key={x}>{x}</option>)}</select><button onClick={load} className="btn-grad h-11 rounded-xl px-5 title-s">Найти</button></div>
      {error ? <div className="rounded-xl border border-red-400/30 bg-red-400/10 p-4 text-red-200">{error}</div> : <div className="overflow-x-auto rounded-2xl border border-white/10"><table className="w-full min-w-[720px] text-left"><thead className="bg-white/[.05]"><tr>{["Дата", "Email", "Username", "Возраст", "Цель", ""].map((x) => <th key={x} className="px-4 py-3 label text-secondary">{x}</th>)}</tr></thead><tbody>{rows.map((row) => <tr key={row.id} className="border-t border-white/10"><td className="px-4 py-4 body-s text-secondary">{row.completedAt ? new Date(row.completedAt).toLocaleString("ru-RU") : "—"}</td><td className="px-4 py-4 body-s">{String(row.email || "—")}</td><td className="px-4 py-4 body-s">{String(row.username || "—")}</td><td className="px-4 py-4 body-s">{row.q1Age}</td><td className="max-w-[260px] truncate px-4 py-4 body-s">{row.q3GoalStatus}</td><td className="px-4 py-4"><button onClick={() => apiGet<Row>(`/admin/survey/${row.id}`).then(setSelected)} className="text-blue-300"><Eye size={18} /></button></td></tr>)}</tbody></table></div>}
    </div>
    {selected && <div className="fixed inset-0 z-50 overflow-y-auto bg-[#071426]/95 p-4 sm:p-10"><div className="mx-auto max-w-3xl rounded-2xl border border-white/10 bg-[#102747] p-5 sm:p-8"><div className="mb-6 flex justify-between"><h2 className="title-l">Анкета #{selected.id}</h2><button onClick={() => setSelected(null)}><X /></button></div><div className="grid gap-5">{Object.entries(labels).map(([key, label]) => <div key={key}><p className="label text-orange-200/70">{label}</p><p className="body mt-1 whitespace-pre-wrap text-secondary">{Array.isArray(selected[key]) ? (selected[key] as string[]).join(", ") : String(selected[key] || "—")}</p></div>)}</div></div></div>}
  </div>;
}