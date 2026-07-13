import { useWeather } from '../../../shared/hooks/useWeather';
import { useUserStore } from '../../../stores/useUserStore';

const WEEKDAYS = [
  'Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira',
  'Quinta-feira', 'Sexta-feira', 'Sábado',
];

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return { text: 'Bom dia', icon: '☀️' };
  if (h < 18) return { text: 'Boa tarde', icon: '🌤️' };
  return { text: 'Boa noite', icon: '🌙' };
}

export function DashboardHeader() {
  const name = useUserStore(s => s.name);
  const { data, status } = useWeather();
  const now = new Date();
  const greeting = getGreeting();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-text-main">
          {greeting.text}, {name}! {greeting.icon}
        </h1>
        <p className="text-sm text-text-dim mt-1">
          {WEEKDAYS[now.getDay()]},{' '}
          {now.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })}
        </p>
      </div>

      {status === 'loading' && (
        <div
          className="h-16 rounded-2xl animate-pulse"
          style={{ background: 'var(--bg-surface)' }}
        />
      )}

      {status === 'error' && (
        <div
          className="rounded-2xl border p-3 text-xs text-text-dim"
          style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
        >
          Não foi possível carregar o clima agora.
        </div>
      )}

      {status === 'ready' && data && (
        <div
          className="flex flex-wrap items-center gap-3 rounded-2xl border p-3"
          style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
        >
          {data.days.slice(0, 3).map((d, i) => (
            <div
              key={d.date}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl"
              style={{ background: 'var(--bg-surface-2)' }}
            >
              <span className="text-lg">{d.weather.icon}</span>
              <div className="text-xs leading-tight">
                <div className="font-semibold text-text-main">
                  {i === 0
                    ? 'Hoje'
                    : i === 1
                      ? 'Amanhã'
                      : new Date(d.date + 'T12:00:00').toLocaleDateString('pt-BR', {
                          weekday: 'short',
                        })}
                </div>
                <div className="text-text-dim">
                  {d.min}° / {d.max}°
                </div>
              </div>
            </div>
          ))}

          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl"
            style={{ background: 'var(--bg-surface-2)' }}
          >
            <span className="text-lg">{data.days[0].moon.icon}</span>
            <div className="text-xs leading-tight">
              <div className="font-semibold text-text-main">
                {data.days[0].moon.label}
              </div>
              <div className="text-text-dim">{data.days[0].moon.illumination}% iluminada</div>
            </div>
          </div>

          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl"
            style={{ background: 'var(--bg-surface-2)' }}
          >
            <span className="text-lg">🌅</span>
            <div className="text-xs leading-tight">
              <div className="text-text-dim">Nasce {data.days[0].sunrise}</div>
              <div className="text-text-dim">Põe {data.days[0].sunset}</div>
            </div>
          </div>

          <div className="text-xs text-text-dim ml-auto whitespace-nowrap">
            {data.locationName}
          </div>
        </div>
      )}
    </div>
  );
}
