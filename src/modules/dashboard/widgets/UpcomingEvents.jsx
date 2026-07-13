import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCalendarStore } from '../../../stores/useCalendarStore';
import { today } from '../../../shared/utils/time';

export function UpcomingEvents() {
  const navigate = useNavigate();
  const events = useCalendarStore(s => s.events);
  const t = today();

  const upcoming = useMemo(
    () =>
      events
        .filter(e => e.date >= t)
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(0, 5),
    [events, t]
  );

  return (
    <div
      className="rounded-2xl p-5 border h-full"
      style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-bold text-text-dim uppercase tracking-widest">
          Próximos eventos
        </h3>
        <button
          onClick={() => navigate('/calendar')}
          className="text-xs font-medium hover:opacity-80"
          style={{ color: 'var(--primary)' }}
        >
          Ver agenda
        </button>
      </div>
      {upcoming.length === 0 ? (
        <p className="text-xs text-text-dim">Nenhum evento agendado.</p>
      ) : (
        <div className="space-y-3">
          {upcoming.map(e => (
            <div key={e.id} className="flex items-center gap-3">
              <div
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ background: 'var(--primary)' }}
              />
              <div className="min-w-0 flex-1">
                <div className="text-xs font-semibold text-text-main truncate">
                  {e.title || e.nome}
                </div>
                <div className="text-[10px] text-text-dim">
                  {e.date === t
                    ? 'Hoje'
                    : new Date(e.date + 'T12:00:00').toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: 'short',
                      })}
                  {e.time ? `, ${e.time}` : ''}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
