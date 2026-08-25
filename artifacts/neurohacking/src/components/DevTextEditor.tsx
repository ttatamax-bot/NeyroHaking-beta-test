import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { Check, Pencil, RotateCcw, Save, X } from "lucide-react";

export type DevTextField = {
  id: string;
  area: "news" | "memory" | "concentration";
  label: string;
  source: string;
  value: string;
};

type SavedDevText = DevTextField & { updatedAt: string };

type DevTextContextValue = {
  enabled: boolean;
  setEnabled: (enabled: boolean) => void;
  drafts: Record<string, SavedDevText>;
  registerFields: (fields: DevTextField[]) => void;
  updateDraft: (field: DevTextField, value: string) => void;
  text: (field: Pick<DevTextField, "id" | "area" | "label" | "source"> & { value: string }) => string;
  resetDrafts: () => void;
  saveDrafts: () => Promise<void>;
  isSaving: boolean;
  saveMessage: string;
};

const DevTextContext = createContext<DevTextContextValue | null>(null);

async function readDrafts(): Promise<Record<string, SavedDevText>> {
  if (!import.meta.env.DEV) return {};
  try {
    const response = await fetch("/__dev-text-drafts");
    if (!response.ok) return {};
    const data = await response.json() as { fields?: SavedDevText[] };
    return Object.fromEntries((data.fields ?? []).map((field) => [field.id, field]));
  } catch {
    return {};
  }
}

export function DevTextProvider({ children }: { children: ReactNode }) {
  const [enabled, setEnabled] = useState(false);
  const [drafts, setDrafts] = useState<Record<string, SavedDevText>>({});
  const [fields, setFields] = useState<Record<string, DevTextField>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  useEffect(() => {
    if (import.meta.env.DEV) void readDrafts().then(setDrafts);
  }, []);

  const registerFields = (nextFields: DevTextField[]) => {
    setFields((current) => {
      const next = { ...current };
      for (const field of nextFields) next[field.id] = field;
      return next;
    });
  };

  const updateDraft = (field: DevTextField, value: string) => {
    setDrafts((current) => ({
      ...current,
      [field.id]: { ...field, value, updatedAt: new Date().toISOString() },
    }));
  };

  const text = (field: Pick<DevTextField, "id" | "area" | "label" | "source"> & { value: string }) =>
    drafts[field.id]?.value ?? field.value;

  const resetDrafts = async () => {
    setDrafts({});
    setSaveMessage("Черновики сброшены");
    if (import.meta.env.DEV) {
      await fetch("/__dev-text-drafts", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ fields: [] }),
      }).catch(() => undefined);
    }
  };

  const saveDrafts = async () => {
    if (!import.meta.env.DEV) return;
    setIsSaving(true);
    setSaveMessage("");
    try {
      const currentFields = Object.values(fields)
        .map((field) => {
          const value = drafts[field.id]?.value ?? field.value;
          return { ...field, value };
        })
        .filter((field) => field.value !== field.source)
        .map((field) => ({ ...field, updatedAt: new Date().toISOString() }));
      const currentIds = new Set(Object.keys(fields));
      const nextFields = [
        ...Object.values(drafts).filter((field) => !currentIds.has(field.id)),
        ...currentFields,
      ];
      const response = await fetch("/__dev-text-drafts", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ fields: nextFields }),
      });
      if (!response.ok) throw new Error("save failed");
      setDrafts(Object.fromEntries(nextFields.map((field) => [field.id, field])));
      setSaveMessage(nextFields.length ? `Сохранено изменений: ${nextFields.length}` : "Изменений нет");
    } catch {
      setSaveMessage("Не удалось сохранить черновики");
    } finally {
      setIsSaving(false);
    }
  };

  const value = useMemo(() => ({
    enabled,
    setEnabled,
    drafts,
    registerFields,
    updateDraft,
    text,
    resetDrafts,
    saveDrafts,
    isSaving,
    saveMessage,
  }), [enabled, drafts, fields, isSaving, saveMessage]);

  return (
    <DevTextContext.Provider value={value}>
      {children}
      {import.meta.env.DEV && <DevTextPanel fields={fields} />}
    </DevTextContext.Provider>
  );
}

function DevTextPanel({ fields }: { fields: Record<string, DevTextField> }) {
  const editor = useContext(DevTextContext);
  const [selectedId, setSelectedId] = useState("");
  const [draftValue, setDraftValue] = useState("");
  if (!editor) return null;
  const visibleFields = Object.values(fields).sort((a, b) => a.id.localeCompare(b.id));
  const selected = visibleFields.find((field) => field.id === selectedId) ?? visibleFields[0];
  const currentValue = selected ? editor.drafts[selected.id]?.value ?? selected.value : "";
  const changedCount = Object.values(editor.drafts).filter((field) => field.value !== field.source).length;

  useEffect(() => {
    if (selected && selected.id !== selectedId) setSelectedId(selected.id);
  }, [selected?.id, selectedId]);
  useEffect(() => setDraftValue(currentValue), [selected?.id, currentValue]);

  return (
    <div className={`dev-text-editor ${editor.enabled ? "dev-text-editor-open" : ""}`}>
      <button type="button" className="dev-text-editor-toggle" onClick={() => editor.setEnabled(!editor.enabled)}>
        <Pencil size={15} /> {editor.enabled ? "Закрыть редактор" : "Редактировать тексты"}
        {changedCount > 0 && <strong>{changedCount}</strong>}
      </button>
      {editor.enabled && (
        <div className="dev-text-editor-panel">
          <div className="dev-text-editor-heading">
            <div><b>Dev-редактор</b><span>Изменения сохраняются только в workspace</span></div>
            <button type="button" onClick={() => editor.setEnabled(false)} aria-label="Закрыть"><X size={17} /></button>
          </div>
          <select value={selected?.id ?? ""} onChange={(event) => setSelectedId(event.target.value)}>
            {visibleFields.map((field) => <option key={field.id} value={field.id}>{field.area} · {field.label}</option>)}
          </select>
          {selected && (
            <>
              <label className="dev-text-editor-label" htmlFor="dev-text-value">{selected.id}</label>
              <textarea id="dev-text-value" value={draftValue} onChange={(event) => setDraftValue(event.target.value)} />
              <div className="dev-text-editor-actions">
                <button type="button" onClick={() => editor.updateDraft(selected, draftValue)}><Check size={14} /> Применить</button>
                <button type="button" onClick={() => editor.resetDrafts()}><RotateCcw size={14} /> Сбросить</button>
                <button type="button" className="primary" disabled={editor.isSaving} onClick={() => editor.saveDrafts()}><Save size={14} /> Сохранить</button>
              </div>
              {editor.saveMessage && <p className="dev-text-editor-message">{editor.saveMessage}</p>}
            </>
          )}
        </div>
      )}
    </div>
  );
}

export function useDevTextEditor() {
  const context = useContext(DevTextContext);
  if (!context) throw new Error("useDevTextEditor must be used inside DevTextProvider");
  return context;
}