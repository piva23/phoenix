import { useDailyTasks } from '../../../shared/hooks/useDailyTasks';

export function MissionsList() {
  const items = useDailyTasks().filter(i => i.type === 'inline');

  return (
    <div
      className="rounded-2xl p-5 border h-full"
      style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
    >
      <h3 className="text-xs font-bold text-text-dim uppercase tracking-widest mb-4">
        Missões do dia
      </h3>
      {items.length === 0 ? (
        <p className="text-xs text-text-dim">Nenhuma missão rápida pendente.</p>
      ) : (
        <div className="space-y-2.5">
          {items.map(item => (
            <label
              key={item.id}
              className="flex items-center gap-3 cursor-pointer group"
            >
              <input
                type="checkbox"
                onChange={item.onComplete}
                className="w-4 h-4 rounded flex-shrink-0"
                style={{ accentColor: 'var(--primary)' }}
              />
              <span className="text-sm text-text-muted flex-1 truncate group-hover:text-text-main transition-colors">
                {item.title}
              </span>
              {item.xpReward != null && (
                <span className="text-[11px] font-bold text-emerald-400 flex-shrink-0">
                  +{item.xpReward} XP
                </span>
              )}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
