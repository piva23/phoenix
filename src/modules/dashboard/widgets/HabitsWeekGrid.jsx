import { useMemo } from 'react';
import { useHealthStore } from '../../../stores/useHealthStore';

const DAY_LETTERS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

export function HabitsWeekGrid() {
  const habits = useHealthStore(s => s.plans.habits || []);
  const habitLog = useHealthStore(s => s.habitLog);

  const last7 = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) =>
        new Date(Date.now() - (6 - i) * 86400000).toISOString().slice(0, 10)
      ),
    []
  );

  if (habits.length === 0) {
    return (
      <div
        className="rounded-2xl p-5 border h-full flex items-center justify-center text-center"
        style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
      >
        <p className="text-xs text-text-dim">Nenhum hábito configurado ainda.</p>
      </div>
    );
  }

  return (
    <div
      className="rounded-2xl p-5 border h-full"
      style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-bold text-text-dim uppercase tracking-widest">
          Hábitos em foco
        </h3>
        <div className="flex gap-2.5">
          {last7.map(d => (
            <span key={d} className="text-[10px] text-text-dim w-4 text-center">
              {DAY_LETTERS[new Date(d + 'T12:00:00').getDay()]}
            </span>
          ))}
        </div>
      </div>
      <div className="space-y-3">
        {habits.map(h => (
          <div key={h.id} className="flex items-center justify-between gap-3">
            <span className="text-xs font-medium text-text-muted truncate flex-1">
              {h.name || h.label}
            </span>
            <div className="flex gap-2.5">
              {last7.map(d => {
                const val = habitLog[d]?.[h.id];
                const logged = val !== undefined;
                const success = h.type === 'quit' ? val !== false : val === true;
                return (
                  <span
                    key={d}
                    className="w-4 h-4 rounded-full flex-shrink-0"
                    style={{
                      background: !logged
                        ? 'var(--bg-surface-2)'
                        : success
                          ? '#10B981'
                          : '#EF4444',
                      opacity: logged ? 1 : 0.5,
                    }}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
