import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAggregatedEvents } from '../../calendar/hooks/useAggregatedEvents';

// Maps origin → icon
const ORIGIN_MAP = {
  manual:    { icon: '📌' },
  project:   { icon: '🗂️' },
  finance:   { icon: '💰' },
  study:     { icon: '🧠' },
};

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * Compact clickable card — shows a summary of today's agenda and opens
 * the calendar's day panel when clicked.
 */
export function TimelineFeed() {
  const navigate = useNavigate();
  const allEvents = useAggregatedEvents();

  const todayItems = useMemo(() => {
    const today = todayKey();
    return allEvents
      .filter((e) => e.date === today)
      .sort((a, b) => {
        if (a.time && b.time) return a.time.localeCompare(b.time);
        if (a.time) return -1;
        if (b.time) return 1;
        if (a.completed !== b.completed) return a.completed ? 1 : -1;
        return 0;
      });
  }, [allEvents]);

  const pending = todayItems.filter(e => !e.completed);
  const done = todayItems.length - pending.length;

  const goToCalendar = () => {
    // Opens calendar focused on today (calendar page shows today's drawer on load)
    navigate('/calendar?day=' + todayKey());
  };

  return (
    <motion.button
      onClick={goToCalendar}
      whileTap={{ scale: 0.98 }}
      className="w-full text-left card-glass p-4 rounded-2xl hover:border-white/15 transition-all cursor-pointer relative overflow-hidden"
    >
      <div
        className="absolute top-0 right-0 w-24 h-24 rounded-full blur-[60px] opacity-10 pointer-events-none"
        style={{ background: 'var(--primary)' }}
      />

      <div className="flex items-center justify-between relative z-10">
        <div className="flex items-center gap-2.5">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0"
            style={{
              background: 'var(--bg-surface-2)',
              border: '1px solid var(--border)',
            }}
          >
            📅
          </div>
          <div>
            <h3 className="text-xs font-bold text-text-main leading-none">Timeline Diária</h3>
            <p className="text-[10px] text-text-dim mt-1">
              {todayItems.length === 0
                ? 'Nenhum evento hoje'
                : `${pending.length} pendente${pending.length !== 1 ? 's' : ''} · ${done} feito${done !== 1 ? 's' : ''}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Next event preview */}
          {pending.length > 0 && (
            <div className="hidden sm:flex items-center gap-1.5 max-w-[160px] bg-white/[0.03] border border-white/5 rounded-lg px-2 py-1.5">
              <span className="text-[10px]">{ORIGIN_MAP[pending[0].origin]?.icon || '📌'}</span>
              <span className="text-[10px] font-medium text-text-main truncate">{pending[0].title}</span>
            </div>
          )}
          <span className="text-[10px] font-bold text-primary hover:underline flex items-center gap-0.5">
            Ver <span aria-hidden>→</span>
          </span>
        </div>
      </div>

      {/* Mini event dots row on mobile */}
      {pending.length > 0 && (
        <div className="flex items-center gap-1.5 mt-3 flex-wrap relative z-10">
          {todayItems.slice(0, 5).map((item) => (
            <span
              key={item.id}
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{
                backgroundColor: item.color,
                opacity: item.completed ? 0.35 : 1,
              }}
              title={item.title}
            />
          ))}
          {todayItems.length > 5 && (
            <span className="text-[9px] text-text-dim font-bold">
              +{todayItems.length - 5}
            </span>
          )}
        </div>
      )}
    </motion.button>
  );
}

export default TimelineFeed;