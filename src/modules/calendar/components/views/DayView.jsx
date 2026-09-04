import React from 'react';
import { getHourSlots, timeToMinutes, formatLongDate, toDateStr, parseDateStr } from './helpers';
import { motion } from 'framer-motion';

const ORIGIN_MAP = {
  manual:    { icon: '📌' },
  project:   { icon: '🗂️' },
  finance:   { icon: '💰' },
  study:     { icon: '🧠' },
};

const DAY_END = 23;

/**
 * DayView — vertical hourly timeline (6h–23h) for a single day.
 * Events with a time are placed at their hour; events without are shown
 * in a "Sem horário" card at the top.
 */
export function DayView({ dateStr, eventsByDate }) {
  const events = eventsByDate[dateStr] || [];
  const slots = getHourSlots();
  const todayStr = toDateStr(new Date());
  const isToday = dateStr === todayStr;

  const timed = events.filter(e => e.time);
  const untimed = events.filter(e => !e.time);

  // Group timed events by hour
  const byHour = {};
  timed.forEach((evt) => {
    const min = timeToMinutes(evt.time);
    const hour = min !== null ? Math.floor(min / 60) : DAY_END;
    if (!byHour[hour]) byHour[hour] = [];
    byHour[hour].push(evt);
  });

  return (
    <div className="space-y-4">
      {/* Date banner */}
      <div className={`flex items-center justify-between px-4 py-3 rounded-2xl border ${
        isToday ? 'bg-amber-500/[0.04] border-amber-500/20' : 'bg-white/[0.01] border-white/5'
      }`}>
        <div className="flex items-center gap-2">
          <span className="text-lg">{isToday ? '📍' : '🗓️'}</span>
          <div>
            <span className="text-xs font-bold text-text-main capitalize">{formatLongDate(dateStr)}</span>
            {isToday && <span className="ml-2 text-[9px] font-bold text-amber-400 uppercase">Hoje</span>}
          </div>
        </div>
        <span className="text-[10px] text-text-dim font-mono">
          {events.length} evento{events.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Untimed events */}
      {untimed.length > 0 && (
        <div className="bg-surface border border-border rounded-2xl p-4 space-y-2">
          <h4 className="text-[10px] font-bold text-text-dim uppercase tracking-widest mb-2">Sem horário definido</h4>
          {untimed.map((evt) => (
            <div
              key={evt.id}
              className="flex items-center gap-2.5 p-2.5 rounded-xl border bg-white/[0.01] border-white/5"
            >
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: evt.color }} />
              <span className="text-[10px] flex-shrink-0">{ORIGIN_MAP[evt.origin]?.icon || '📌'}</span>
              <p className={`text-xs font-medium text-white flex-1 truncate ${evt.completed ? 'line-through opacity-50' : ''}`}>
                {evt.title}
              </p>
              {evt.time && <span className="text-[10px] text-text-dim font-mono">{evt.time}</span>}
            </div>
          ))}
        </div>
      )}

      {/* Hourly timeline */}
      <div className="bg-surface border border-border rounded-2xl overflow-hidden shadow-xl">
        {slots.map((slot) => {
          const hourEvents = byHour[slot.hour] || [];
          return (
            <div
              key={slot.hour}
              className={`flex items-start min-h-[52px] border-b border-white/5 last:border-0 ${
                hourEvents.length > 0 ? 'bg-white/[0.02]' : ''
              }`}
            >
              <div className="w-14 flex-shrink-0 py-2 text-center border-r border-white/5">
                <span className="text-[10px] font-mono text-text-dim">{slot.label}</span>
              </div>
              <div className="flex-1 py-1.5 px-2 space-y-1.5">
                {hourEvents.map((evt) => (
                  <motion.div
                    key={evt.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-2 px-2.5 py-2 rounded-lg border text-left"
                    style={{ backgroundColor: `${evt.color}12`, borderColor: `${evt.color}28` }}
                  >
                    <span className="text-[10px] flex-shrink-0">{ORIGIN_MAP[evt.origin]?.icon || '📌'}</span>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-semibold text-white truncate ${evt.completed ? 'line-through opacity-50' : ''}`}>
                        {evt.title}
                      </p>
                      {evt.description && (
                        <p className="text-[10px] text-text-dim truncate">{evt.description}</p>
                      )}
                    </div>
                    {evt.time && <span className="text-[10px] text-text-dim font-mono flex-shrink-0">{evt.time}</span>}
                  </motion.div>
                ))}
                {hourEvents.length === 0 && (
                  <span className="block text-[10px] text-text-dim/40 py-2">—</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default DayView;