import { useState } from "react";
import { useAppStore } from "@/lib/store";
import { ScreenTransition } from "@/components/ScreenTransition";
import { BackButton } from "@/components/BackButton";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, X, CheckCircle, XCircle, Pencil, Check } from "lucide-react";

const FIRST_THREE_GOALS_BONUS = 10;

export default function Goals() {
  const { goals, firstGoalBonusGiven, updateState, goalFormOpen: showForm } = useAppStore();
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [confirmType, setConfirmType] = useState<'completed' | 'cancelled' | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");

  const activeGoals = goals.filter(g => g.status === 'active');
  const completedGoals = goals.filter(g => g.status !== 'active');

  const handleCreate = () => {
    if (!name.trim()) return;
    if (activeGoals.length >= 3) return;
    const id = `goal_${Date.now()}_${Math.random().toString(36).slice(2,7)}`;
    const sceneId = `scene_${Date.now()}_${Math.random().toString(36).slice(2,7)}`;
    const newGoal = {
      id,
      name: name.trim(),
      description: desc.trim(),
      createdAt: new Date().toISOString(),
      status: 'active' as const,
    };
    const newScene = {
      id: sceneId,
      goalId: id,
      answers: [],
      createdAt: new Date().toISOString(),
      status: 'active' as const,
    };

    updateState(prev => {
      const newGoals = [...prev.goals, newGoal];
      const totalActiveAfter = newGoals.filter(g => g.status === 'active').length;
      const shouldGiveBonus = !prev.firstGoalBonusGiven && totalActiveAfter >= 3;
      const now = new Date().toISOString();

      return {
        goals: newGoals,
        scenes: [...prev.scenes, newScene],
        ...(shouldGiveBonus ? {
          keys: prev.keys + FIRST_THREE_GOALS_BONUS,
          firstGoalBonusGiven: true,
          keysHistory: [
            { date: now, source: 'Первые 3 цели', amount: FIRST_THREE_GOALS_BONUS, type: 'earn' as const },
            ...prev.keysHistory,
          ],
        } : {}),
      };
    });
    setName("");
    setDesc("");
    updateState({ goalFormOpen: false });
  };

  const handleConfirmStatus = () => {
    if (!confirmId || !confirmType) return;
    updateState(prev => ({
      goals: prev.goals.map(g =>
        g.id === confirmId ? { ...g, status: confirmType, completedAt: new Date().toISOString() } : g
      ),
    }));
    setConfirmId(null);
    setConfirmType(null);
  };

  const startEdit = (g: typeof goals[0]) => {
    setEditingId(g.id);
    setEditName(g.name);
    setEditDesc(g.description);
  };

  const saveEdit = () => {
    if (!editingId || !editName.trim()) return;
    updateState(prev => ({
      goals: prev.goals.map(g =>
        g.id === editingId ? { ...g, name: editName.trim(), description: editDesc.trim() } : g
      ),
    }));
    setEditingId(null);
  };

  if (confirmId && confirmType) {
    const goal = goals.find(g => g.id === confirmId);
    return (
      <ScreenTransition className="pt-[56px] px-4 pb-24 flex flex-col justify-center min-h-[100dvh]">
        <div className="bg-surface-1 border border-border rounded-[20px] p-6 text-center">
          <div className="mb-4">
            {confirmType === 'completed'
              ? <CheckCircle size={40} className="text-success mx-auto" />
              : <XCircle size={40} className="text-tertiary mx-auto" />
            }
          </div>
          <h2 className="title-l text-primary mb-2">
            {confirmType === 'completed' ? 'Цель достигнута?' : 'Отказаться от цели?'}
          </h2>
          <p className="body-s text-secondary mb-6 leading-relaxed">
            <span className="text-primary font-medium">"{goal?.name}"</span>
            {confirmType === 'completed'
              ? ' — ты действительно выполнил эту цель?'
              : ' — ты уверен, что хочешь отказаться?'
            }
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => { setConfirmId(null); setConfirmType(null); }}
              className="flex-1 h-[48px] rounded-[12px] bg-surface-2 border border-border text-secondary body-s active:opacity-70"
            >
              Отмена
            </button>
            <button
              onClick={handleConfirmStatus}
              className={`flex-1 h-[48px] rounded-[12px] title-s active:opacity-90 ${
                confirmType === 'completed'
                  ? 'bg-blue-core text-white'
                  : 'bg-surface-2 border border-border text-tertiary'
              }`}
            >
              {confirmType === 'completed' ? 'Да, выполнено' : 'Отказаться'}
            </button>
          </div>
        </div>
      </ScreenTransition>
    );
  }

  if (showForm) {
    return (
      <ScreenTransition className="pt-[56px] px-4 pb-24">
        <div className="flex items-center gap-3 mt-4 mb-8">
          <button onClick={() => updateState({ goalFormOpen: false })} className="p-1 text-tertiary active:opacity-60">
            <X size={24} />
          </button>
          <h1 className="title-l text-primary">Новая цель</h1>
        </div>

        <div className="space-y-4">
          <div>
            <label className="caption text-secondary mb-2 block">Название цели</label>
            <Input
              placeholder="Что ты хочешь достичь?"
              value={name}
              onChange={e => setName(e.target.value)}
              className="h-[52px] bg-surface-1 border-border text-primary body"
              autoFocus
            />
          </div>
          <div>
            <label className="caption text-secondary mb-2 block">Описание (необязательно)</label>
            <Textarea
              placeholder="Почему эта цель важна для тебя?"
              value={desc}
              onChange={e => setDesc(e.target.value)}
              className="bg-surface-1 border-border text-primary body min-h-[120px]"
            />
          </div>
          {activeGoals.length === 2 && !firstGoalBonusGiven && (
            <div className="bg-blue-ultra-soft border border-[rgba(37,99,235,0.2)] rounded-[12px] p-3">
              <p className="caption text-blue-light">+{FIRST_THREE_GOALS_BONUS} ключей за постановку 3 целей</p>
            </div>
          )}
          <button
            onClick={handleCreate}
            disabled={!name.trim()}
            className="btn-grad btn-shimmer w-full h-[52px] rounded-[14px] title-s text-white disabled:opacity-40"
            style={!name.trim() ? { background: 'var(--bg-surface-2)', boxShadow: 'none' } : {}}
          >
            Сохранить цель
          </button>
        </div>
      </ScreenTransition>
    );
  }

  return (
    <ScreenTransition className="pt-[56px] px-4 pb-24">
      <BackButton />
      <h1 className="title-l text-primary mt-4 mb-2">Цели</h1>
      <p className="body-s text-secondary mb-6">Активных: {activeGoals.length}/3</p>

      {activeGoals.length === 0 && (
        <div className="bg-surface-1 border border-border rounded-[16px] p-6 text-center mb-4">
          <p className="body-s text-secondary">Цели дают направление. Добавь первую.</p>
        </div>
      )}

      <div className="space-y-3 mb-4">
        {activeGoals.map(g => (
          <div key={g.id} className="bg-surface-1 border border-border rounded-[16px] overflow-hidden">
            {editingId === g.id ? (
              <div className="p-4 space-y-3">
                <Input
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  className="h-[44px] bg-surface-2 border-border text-primary body"
                  autoFocus
                />
                <Textarea
                  value={editDesc}
                  onChange={e => setEditDesc(e.target.value)}
                  placeholder="Описание..."
                  className="bg-surface-2 border-border text-primary body min-h-[80px]"
                />
                <div className="flex gap-2">
                  <button
                    onClick={saveEdit}
                    disabled={!editName.trim()}
                    className="flex-1 h-[40px] rounded-[10px] btn-grad btn-shimmer text-white body-s disabled:opacity-40 flex items-center justify-center gap-1.5"
                  >
                    <Check size={14} /> Сохранить
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="h-[40px] px-4 rounded-[10px] bg-surface-2 border border-border text-secondary body-s active:opacity-70"
                  >
                    Отмена
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex">
                <div className="w-[3px] bg-blue-core shrink-0" />
                <div className="p-4 flex-1">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className="title-s text-primary flex-1">{g.name}</h3>
                    <button
                      onClick={() => startEdit(g)}
                      className="p-1.5 rounded-[8px] active:opacity-60 shrink-0"
                      style={{ background: 'rgba(255,255,255,0.05)' }}
                    >
                      <Pencil size={14} color="var(--text-tertiary)" />
                    </button>
                  </div>
                  {g.description ? (
                    <p className="body-s text-secondary mb-3">{g.description}</p>
                  ) : null}
                  <span className="caption text-tertiary block mb-4">
                    {new Date(g.createdAt).toLocaleDateString('ru-RU')}
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => { setConfirmId(g.id); setConfirmType('completed'); }}
                      className="flex-1 h-[36px] rounded-[10px] bg-blue-ultra-soft border border-[rgba(37,99,235,0.2)] caption text-blue-light active:opacity-70"
                    >
                      Выполнено
                    </button>
                    <button
                      onClick={() => { setConfirmId(g.id); setConfirmType('cancelled'); }}
                      className="h-[36px] px-3 rounded-[10px] caption text-tertiary active:opacity-70"
                    >
                      Отказаться
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {activeGoals.length < 3 && (
        <button
          onClick={() => updateState({ goalFormOpen: true })}
          className="w-full h-[52px] rounded-[14px] border border-dashed border-[rgba(37,99,235,0.4)] text-blue-light body-s flex items-center justify-center gap-2 active:opacity-70"
        >
          <Plus size={18} /> Добавить цель
        </button>
      )}

      {completedGoals.length > 0 && (
        <div className="mt-8">
          <h2 className="title-s text-secondary mb-3">Архив</h2>
          <div className="space-y-2 opacity-60">
            {completedGoals.map(g => (
              <div key={g.id} className="bg-surface-1 border border-border rounded-[12px] p-3 flex justify-between items-center">
                <span className="body-s text-primary">{g.name}</span>
                <span className={`caption ${g.status === 'completed' ? 'text-success' : 'text-tertiary'}`}>
                  {g.status === 'completed' ? 'Выполнено' : 'Отменено'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </ScreenTransition>
  );
}
