import React from 'react';
import { CalendarDays, CalendarRange, Calendar as CalendarIcon, CalendarClock } from 'lucide-react';

const VIEWS = [
  { id: 'day',    label: 'Dia',   icon: CalendarClock },
  { id: 'week',   label: 'Semana', icon: CalendarRange },
  { id: 'month',  label: 'Mês',   icon: CalendarDays },
  { id: 'year',   label: 'Ano',   icon: CalendarIcon },
];

/**
 * Pills to switch between day/week/month/year views.
 */
export function CalendarViewSwitcher({ view, onChange }) {
  return (
    <div className="flex gap-1 p-1 rounded-xl bg-white/[0.02] border border-white/5">
      {VIEWS.map((v) => {
        const Icon = v.icon;
        const isActive = view === v.id;
        return (
          <button
            key={v.id}
            onClick={() => onChange(v.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
              isActive
                ? 'bg-gradient-to-r from-primary to-indigo-600 text-white shadow-md shadow-primary/25'
                : 'text-text-dim hover:text-white hover:bg-white/5'
            }`}
            title={`Visão ${v.label}`}
          >
            <Icon size={13} />
            <span className="hidden sm:inline">{v.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export default CalendarViewSwitcher;