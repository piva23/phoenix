import React, { useMemo } from 'react';
import { toDateStr } from './helpers';
import { WEEKDAY_SHORT } from './helpers';

/**
 * MonthView — desktop 7x6 grid + mobile agenda list.
 * Events are keyed by YYYY-MM-DD in `eventsByDate`.
 */
export function MonthView({ currentDate, eventsByDate, selectedDateStr, onSelectDay }) {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const todayStr = toDateStr(new Date());

  const calendarCells = useMemo(() => {
    const firstDayIndex = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();
    const cells = [];

    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const prevDay = daysInPrevMonth - i;
      const prevMonthIdx = month === 0 ? 11 : month - 1;
      const prevYear = month === 0 ? year - 1 : year;
      cells.push({
        day: prevDay,
        dateStr: `${prevYear}-${String(prevMonthIdx + 1).padStart(2, '0')}-${String(prevDay).padStart(2, '0')}`,
        isCurrentMonth: false,
      });
    }

    for (let d = 1; d <= daysInMonth; d++) {
      cells.push({
        day: d,
        dateStr: `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
        isCurrentMonth: true,
      });
    }

    const remaining = 42 - cells.length;
    for (let d = 1; d <= remaining; d++) {
      const nextMonthIdx = month === 11 ? 0 : month + 1;
      const nextYear = month === 11 ? year + 1 : year;
      cells.push({
        day: d,
        dateStr: `${nextYear}-${String(nextMonthIdx + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
        isCurrentMonth: false,
      });
    }
    return cells;
  }, [year, month]);

  const agendaDays = useMemo(() => {
    const days = [];
    const totalDays = new Date(year, month + 1, 0).getDate();
    for (let d = 1; d <= totalDays; d++) {
      const dStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      if (eventsByDate[dStr] && eventsByDate[dStr].length > 0) {
        days.push({ dateStr: dStr, dayNum: d, events: eventsByDate[dStr] });
      }
    }
    return days;
  }, [year, month, eventsByDate]);

  return (
    <div className="space-y-6">
      {/* Desktop grid */}
      <div className="hidden md:block bg-surface border border-border rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="grid grid-cols-7 gap-2 mb-4 text-center">
          {WEEKDAY_SHORT.map((d, i) => (
            <span key={i} className="text-xs font-bold text-text-dim uppercase tracking-wider py-1 border-b border-border-strong/40">
              {d}
            </span>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-2">
          {calendarCells.map((cell, idx) => {
            const dayEventsList = eventsByDate[cell.dateStr] || [];
            const isSelected = cell.dateStr === selectedDateStr;
            const isToday = cell.dateStr === todayStr;
            return (
              <div
                key={idx}
                onClick={() => onSelectDay(cell.dateStr)}
                className={`min-h-[110px] p-2 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between group ${
                  cell.isCurrentMonth
                    ? 'bg-white/[0.01] border-white/5 hover:border-primary/20 hover:bg-white/[0.02]'
                    : 'bg-black/10 border-transparent opacity-30'
                } ${isSelected ? 'border-primary/40 bg-primary/[0.03] ring-1 ring-primary/25' : ''} ${
                  isToday ? 'border-amber-500/30 shadow-md shadow-amber-500/5' : ''
                }`}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className={`text-xs font-extrabold px-2 py-0.5 rounded-md ${
                    isToday ? 'bg-amber-500 text-black'
                      : isSelected ? 'bg-primary/20 text-primary'
                      : 'text-text-muted group-hover:text-white'
                  }`}>
                    {cell.day}
                  </span>
                  {dayEventsList.length > 0 && (
                    <span className="text-[10px] text-text-dim bg-white/[0.04] px-1.5 py-0.5 rounded font-mono">
                      {dayEventsList.length}
                    </span>
                  )}
                </div>
                <div className="flex-1 space-y-1 overflow-hidden mt-1.5 max-h-[70px]">
                  {dayEventsList.slice(0, 3).map((evt) => (
                    <div
                      key={evt.id}
                      className="text-[9px] px-1.5 py-0.5 rounded truncate border leading-none flex items-center gap-1 transition-all"
                      style={{ backgroundColor: `${evt.color}15`, color: evt.color, borderColor: `${evt.color}30` }}
                      title={evt.title}
                    >
                      <span className="w-1 h-1 rounded-full flex-shrink-0" style={{ backgroundColor: evt.color }} />
                      <span className={`truncate ${evt.completed ? 'line-through opacity-55' : ''}`}>{evt.title}</span>
                    </div>
                  ))}
                  {dayEventsList.length > 3 && (
                    <div className="text-[8px] text-text-dim font-bold text-center pt-0.5">
                      +{dayEventsList.length - 3} mais
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Mobile agenda */}
      <div className="block md:hidden bg-surface border border-border rounded-3xl p-5 shadow-lg">
        <h3 className="text-sm font-bold text-text-muted uppercase tracking-wider mb-4">📅 Agenda deste Mês</h3>
        {agendaDays.length === 0 ? (
          <div className="text-center py-10">
            <span className="text-3xl">🏜️</span>
            <p className="text-xs text-text-dim mt-2">Nenhum evento registrado para este mês.</p>
            <button
              onClick={() => onSelectDay(todayStr)}
              className="mt-4 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs font-bold text-white"
            >
              Ver dia de hoje
            </button>
          </div>
        ) : (
          <div className="space-y-4 max-h-[450px] overflow-y-auto pr-1">
            {agendaDays.map((agendaDay) => {
              const dateObj = new Date(agendaDay.dateStr + 'T12:00:00');
              const isToday = agendaDay.dateStr === todayStr;
              return (
                <div
                  key={agendaDay.dateStr}
                  onClick={() => onSelectDay(agendaDay.dateStr)}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 bg-white/[0.01] hover:bg-white/[0.02] ${
                    isToday ? 'border-amber-500/30 bg-amber-500/[0.02]' : 'border-white/5'
                  }`}
                >
                  <div className="text-center flex-shrink-0 bg-white/[0.03] border border-white/5 p-2 rounded-xl min-w-[50px]">
                    <span className="block text-lg font-black text-white leading-none">{agendaDay.dayNum}</span>
                    <span className="text-[9px] text-text-dim uppercase tracking-wider">
                      {dateObj.toLocaleDateString('pt-PT', { weekday: 'short' })}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0 space-y-1.5">
                    {agendaDay.events.map((evt) => (
                      <div key={evt.id} className="flex items-center gap-2 text-xs text-white">
                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: evt.color }} />
                        <p className={`truncate flex-1 font-medium ${evt.completed ? 'line-through opacity-50' : ''}`}>
                          {evt.title}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default MonthView;