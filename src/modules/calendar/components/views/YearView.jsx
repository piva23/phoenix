import React, { useMemo } from 'react';
import { WEEKDAY_SHORT, toDateStr } from './helpers';

const MONTHS = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez',
];

/**
 * YearView — 12 mini-calendar months + activity heatmap.
 * Click a day to open it (day view); click the month name to go to month view.
 */
export function YearView({ currentDate, eventsByDate, onSelectDay, onGoToMonth }) {
  const year = currentDate.getFullYear();
  const todayStr = toDateStr(new Date());

  // Build mini-calendar cells for each month
  const months = useMemo(() => {
    return Array.from({ length: 12 }, (_, m) => {
      const firstDayIndex = new Date(year, m, 1).getDay();
      const daysInMonth = new Date(year, m + 1, 0).getDate();
      const cells = [];
      for (let i = 0; i < firstDayIndex; i++) cells.push(null);
      for (let d = 1; d <= daysInMonth; d++) {
        cells.push({
          day: d,
          dateStr: `${year}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
        });
      }
      return { month: m, cells };
    });
  }, [year]);

  // Activity counts for heatmap (per month total)
  const monthlyCounts = useMemo(() => {
    return Array.from({ length: 12 }, (_, m) => {
      let count = 0;
      const prefix = `${year}-${String(m + 1).padStart(2, '0')}-`;
      for (const key of Object.keys(eventsByDate)) {
        if (key.startsWith(prefix)) count += eventsByDate[key].length;
      }
      return count;
    });
  }, [year, eventsByDate]);

  const maxMonthly = Math.max(1, ...monthlyCounts);

  return (
    <div className="space-y-5">
      {/* Monthly activity summary */}
      <div className="bg-surface border border-border rounded-3xl p-5 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-bold text-text-dim uppercase tracking-widest">📊 Atividade em {year}</h3>
          <span className="text-[10px] text-text-dim font-mono">
            {monthlyCounts.reduce((a, b) => a + b, 0)} eventos no ano
          </span>
        </div>
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-12 gap-2">
          {MONTHS.map((name, m) => (
            <button
              key={m}
              onClick={() => onGoToMonth(m)}
              className="flex flex-col items-center gap-1.5 p-2 rounded-xl bg-white/[0.02] border border-white/5 hover:border-primary/30 hover:bg-primary/[0.04] transition-all cursor-pointer"
            >
              <span className="text-[10px] font-bold text-text-muted">{name}</span>
              <div className="w-full h-2 rounded-full bg-black/40 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${(monthlyCounts[m] / maxMonthly) * 100}%`,
                    background: monthlyCounts[m] > 0 ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                  }}
                />
              </div>
              <span className="text-[9px] text-text-dim font-mono">{monthlyCounts[m]}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 12 mini-calendars */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {months.map(({ month, cells }) => (
          <div key={month} className="bg-surface border border-border rounded-2xl p-4 shadow-lg">
            <button
              onClick={() => onGoToMonth(month)}
              className="w-full text-left text-xs font-black text-white capitalize mb-2.5 hover:text-primary transition-all cursor-pointer"
            >
              {new Date(year, month, 1).toLocaleDateString('pt-PT', { month: 'long' })}
            </button>

            <div className="grid grid-cols-7 gap-1 mb-1.5">
              {WEEKDAY_SHORT.map((d, i) => (
                <span key={i} className="text-[8px] font-bold text-text-dim/50 text-center uppercase">
                  {d[0]}
                </span>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {cells.map((cell, idx) => {
                if (!cell) return <span key={idx} className="aspect-square" />;
                const isToday = cell.dateStr === todayStr;
                const hasEvents = (eventsByDate[cell.dateStr] || []).length > 0;
                return (
                  <button
                    key={idx}
                    onClick={() => onSelectDay(cell.dateStr)}
                    className={`aspect-square text-[9px] rounded-md flex items-center justify-center transition-all cursor-pointer relative ${
                      isToday
                        ? 'bg-amber-500 text-black font-black'
                        : hasEvents
                          ? 'bg-primary/20 text-primary font-bold'
                          : 'text-text-muted hover:bg-white/5'
                    }`}
                  >
                    {cell.day}
                    {hasEvents && !isToday && (
                      <span className="absolute bottom-0.5 w-1 h-1 rounded-full bg-primary" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default YearView;