import React from 'react';
import { useWeather } from '../../../shared/hooks/useWeather';

export function WeatherWidget() {
  const { data, status } = useWeather();

  if (status === 'loading') {
    return (
      <div
        className="rounded-3xl p-5 border animate-pulse h-[200px]"
        style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
      >
        <div className="h-4 w-1/3 bg-white/5 rounded mb-4" />
        <div className="h-12 w-2/3 bg-white/5 rounded mb-4" />
        <div className="h-8 w-full bg-white/5 rounded" />
      </div>
    );
  }

  if (status === 'error' || !data) {
    return (
      <div
        className="rounded-3xl p-5 border text-center text-xs text-text-dim flex flex-col items-center justify-center h-[200px]"
        style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
      >
        <span>☁️</span>
        <p className="mt-2">Não foi possível sincronizar o clima real agora.</p>
      </div>
    );
  }

  const current = data.current;
  const todayForecast = data.days[0];

  return (
    <div
      className="rounded-3xl p-6 border flex flex-col justify-between relative overflow-hidden select-none"
      style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
    >
      {/* Background Subtle Gradient */}
      <div className="absolute top-0 right-0 w-36 h-36 rounded-full blur-[70px] opacity-10 pointer-events-none" style={{ background: 'var(--accent)' }} />

      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <h4 className="text-[10px] font-bold text-text-dim uppercase tracking-wider">
              Sincronia Ambiental
            </h4>
            <p className="text-xs text-text-main font-semibold truncate max-w-[140px]">{data.locationName || 'Porto Alegre, RS'}</p>
          </div>
          <span className="text-2xl">{current.weather.icon}</span>
        </div>

        {/* Temperature Block */}
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-extrabold tracking-tight text-text-main">
            {current.temp}°C
          </span>
          <span className="text-xs text-text-muted font-medium">
            {current.weather.label}
          </span>
        </div>

        {/* Moon Phase & Solar Info */}
        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/5">
          <div className="space-y-1">
            <div className="text-[9px] text-text-dim uppercase font-bold tracking-wider">Ciclo Lunar</div>
            <div className="flex items-center gap-1.5 text-xs text-text-main font-medium">
              <span>{todayForecast.moon.icon}</span>
              <span className="truncate">{todayForecast.moon.label}</span>
            </div>
            <div className="text-[10px] text-text-dim">{todayForecast.moon.illumination}% iluminada</div>
          </div>

          <div className="space-y-1">
            <div className="text-[9px] text-text-dim uppercase font-bold tracking-wider">Solar</div>
            <div className="text-xs text-text-main font-medium flex items-center gap-1">
              <span>🌅</span> {todayForecast.sunrise}
            </div>
            <div className="text-[10px] text-text-dim flex items-center gap-1">
              <span>🌇</span> {todayForecast.sunset}
            </div>
          </div>
        </div>
      </div>

      {/* 3-day forecast strip */}
      <div className="mt-5 pt-3 border-t border-white/5">
        <div className="text-[9px] text-text-dim uppercase font-bold tracking-wider mb-2">Previsão Semanal</div>
        <div className="grid grid-cols-3 gap-2">
          {data.days.slice(0, 3).map((d, idx) => (
            <div
              key={d.date}
              className="rounded-xl p-2 bg-white/[0.02] border border-white/5 flex flex-col items-center justify-center text-center space-y-1"
            >
              <span className="text-[10px] font-bold text-text-dim">
                {idx === 0
                  ? 'Hoje'
                  : idx === 1
                    ? 'Amanhã'
                    : new Date(d.date + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '')}
              </span>
              <span className="text-base">{d.weather.icon}</span>
              <span className="text-[11px] font-semibold text-text-main">
                {d.min}°/{d.max}°
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
