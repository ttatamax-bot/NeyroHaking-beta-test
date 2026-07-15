import { useAppStore } from "@/lib/store";
import { ScreenTransition } from "@/components/ScreenTransition";
import { BackButton } from "@/components/BackButton";

export default function PotentialStats() {
  const { potential, potentialHistory } = useAppStore();

  return (
    <ScreenTransition className="pt-[64px] px-4 pb-24 space-y-6">
      <BackButton />

      <div className="bg-surface-1 border border-border rounded-[24px] p-6 text-center mt-4">
        <h1 className="title-m text-secondary mb-2">Потенциал</h1>
        <span className="display-l text-primary">{potential}%</span>
      </div>

      <div>
        <h2 className="title-s text-primary mb-4">Начисления</h2>
        {potentialHistory.length === 0 ? (
          <p className="body-s text-secondary text-center py-8">Начислений пока нет. Выполняй техники.</p>
        ) : (
          <div className="space-y-3">
            {potentialHistory.map((entry, idx) => (
              <div key={idx} className="bg-surface-1 border border-border rounded-[12px] p-4 flex justify-between items-center">
                <div>
                  <div className="body-s text-primary mb-1">{entry.source}</div>
                  <div className="caption text-secondary">{new Date(entry.date).toLocaleDateString('ru-RU')}</div>
                </div>
                <div className="title-s text-blue">
                  +{entry.amount}%
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </ScreenTransition>
  );
}
