import { useInsights } from '../../../shared/hooks/useInsights';

export function InsightsPanel() {
  const insights = useInsights();

  return (
    <div
      className="rounded-2xl p-5 border h-full"
      style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
    >
      <h3 className="text-xs font-bold text-text-dim uppercase tracking-widest mb-4 flex items-center gap-1.5">
        <span>✨</span> Phoenix Intelligence
      </h3>
      {insights.length === 0 ? (
        <p className="text-xs text-text-dim">Sem insights novos por enquanto.</p>
      ) : (
        <div className="space-y-3.5">
          {insights.map((ins, i) => (
            <div key={i} className="flex items-start gap-2.5">
              <span className="text-base flex-shrink-0 leading-none mt-0.5">
                {ins.icon}
              </span>
              <p className="text-xs text-text-muted leading-relaxed">{ins.text}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
