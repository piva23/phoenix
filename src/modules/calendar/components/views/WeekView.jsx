import React from 'react';
import { getWeekDates, WEEKDAY_SHORT, toDateStr } from './helpers';

const ORIGIN_MAP = {
  manual:    { icon: '📌' },
  project:   { icon: '🗂️' },
  finance:   { icon: '💰' },
  study:     { icon: '🧠' },
};

/**
 * WeekView — 7 columns (Dom–Sáb) on desktop, stacked day cards on mobile.
 * Days without events show a subtle empty state.
 */
export function WeekView({ currentDate, eventsByDate, selectedDateStr, onSelectDay }) {
  const weekDates = getWeekDates(currentDate);
  const todayStr = toDateStr(new Date());

  return (
    <div className="space-y-4">
      {/* Desktop: 7-column grid */}
      <div className="hidden md:grid grid-cols-7 gap-2 bg-surface border border-border rounded-3xl p-4 shadow-xl">
        {weekDates.map((date) => {
          const ds = toDateStr(date);
          const dayEvents = eventsByDate[ds] || [];
          const isToday = ds === todayStr;
          const isSelected = ds === selectedDateStr;
          const dayNum = date.getDate();

          return (
            <div
              key={ds}
              onClick={() => onSelectDay(ds)}
              className={`min-h-[220px] rounded-2xl border p-2.5 cursor-pointer transition-all flex flex-col ${
                isSelected ? 'border-primary/40 bg-primary/[0.03] ring-1 ring-primary/25'
                  : isToday ? 'border-amber-500/30 bg-amber-500/[0.02]'
                  : 'border-white/5 bg-white/[0.01] hover:border-white/15'
              }`}
            >
              <div className="text-center mb-2 pb-2 border-b border-white/5">
                <div className={`text-[10px] font-bold uppercase tracking-wider ${
                  isToday ? 'text-amber-400' : 'text-text-dim'
                }`}>
                  {WEEKDAY_SHORT[date.getDay()]}
                </div>
                <div className={`text-lg font-black mt-0.5 ${isToday ? 'text-amber-400' : 'text-white'}`}>
                  {dayNum}
                </div>
              </div>

              <div className="flex-1 space-y-1.5 overflow-hidden">
                {dayEvents.length === 0 ? (
                  <div className="text-center py-6">
                    <span className="text-[9px] text-text-dim/40">—</span>
                  </div>
                ) : (
                  dayEvents.slice(0, 4).map((evt) => (
                    <div
                      key={evt.id}
                      className="flex items-start gap-1.5 rounded-lg px-2 py-1.5 border"
                      style={{ backgroundColor: `${evt.color}12`, borderColor: `${evt.color}28` }}
                      title={evt.title}
                    >
                      <span className="text-[9px] flex-shrink-0">{ORIGIN_MAP[evt.origin]?.icon || '📌'}</span>
                      <div className="min-w-0">
                        {evt.time && <span className="block text-[8px] font-mono text-text-dim">{evt.time}</span>}
                        <p className={`text-[10px] font-medium text-white truncate ${
                          evt.completed ? 'line-through opacity-50' : ''
                        }`}>
                          {evt.title}
                        </p>
                      </div>
                    </div>
                  ))
                )}
                {dayEvents.length > 4 && (
                  <div className="text-[9px] text-text-dim font-bold text-center pt-1">
                    +{dayEvents.length - 4} mais
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Mobile: stacked day cards */}
      <div className="md:hidden space-y-2.5">
        {weekDates.map((date) => {
          const ds = toDateStr(date);
          const dayEvents = eventsByDate[ds] || [];
          const isToday = ds === todayStr;
          const dayNum = date.getDate();

          return (
            <button
              key={ds}
              onClick={() => onSelectDay(ds)}
              className={`w-full text-left p-3.5 rounded-2xl border transition-all ${
                isToday
                  ? 'border-amber-500/30 bg-amber-500/[0.03]'
                  : 'border-white/5 bg-white/[0.01] hover:border-white/15'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="text-center flex-shrink-0 bg-white/[0.03] border border-white/5 p-1.5 rounded-xl min-w-[52px]">
                  <span className="block text-base font-black text-white leading-none">{dayNum}</span>
                  <span className={`text-[9px] uppercase tracking-wider ${
                    isToday ? 'text-amber-400' : 'text-text-dim'
                  }`}>
                    {WEEKDAY_SHORT[date.getDay()]}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  {dayEvents.length === 0 ? (
                    <p className="text-xs text-text-dim/60">Sem eventos</p>
                  ) : (
                    <div className="space-y-1">
                      {dayEvents.slice(0, 3).map((evt) => (
                        <div key={evt.id} className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: evt.color }} />
                          <p className={`text-xs text-white truncate ${evt.completed ? 'line-through opacity-50' : ''}`}>
                            {evt.title}
                          </p>
                          {evt.time && <span className="text-[9px] text-text-dim font-mono ml-auto">{evt.time}</span>}
                        </div>
                      ))}
                      {dayEvents.length > 3 && (
                        <p className="text-[9px] text-text-dim font-bold">+{dayEvents.length - 3} mais</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default WeekView;