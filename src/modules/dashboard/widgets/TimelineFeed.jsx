import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAggregatedEvents } from '../../calendar/hooks/useAggregatedEvents';

// Maps origin/type → icon + label
const ORIGIN_MAP = {
  manual:    { icon: '📌', label: 'Compromisso' },
  project:   { icon: '🗂️', label: 'Projeto' },
  finance:   { icon: '💰', label: 'Finanças' },
  study:     { icon: '🧠', label: 'Estudo' },
};

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function TimelineFeed() {
  const navigate = useNavigate();
  const allEvents = useAggregatedEvents();

  const todayItems = useMemo(() => {
    const today = todayKey();
    return allEvents
      .filter((e) => e.date === today)
      .sort((a, b) => {
        // Sort by time if both have it, otherwise completed goes to bottom
        if (a.time && b.time) return a.time.localeCompare(b.time);
        if (a.time) return -1;
        if (b.time) return 1;
        if (a.completed !== b.completed) return a.completed ? 1 : -1;
        return 0;
      });
  }, [allEvents]);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.06 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -12 },
    show: { opacity: 1, x: 0, transition: { type: 'spring', stiffness: 120, damping: 20 } },
  };

  return (
    <div
      className="card-glass p-6 h-full flex flex-col relative overflow-hidden select-none"
    >
      <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-[80px] opacity-10 pointer-events-none" style={{ background: 'var(--primary)' }} />

      {/* Header */}
      <div className="flex items-center justify-between mb-5 relative z-10">
        <div>
          <h3 className="text-[11px] font-bold text-text-dim uppercase tracking-widest">Timeline Diária</h3>
          <p className="text-xs text-text-muted mt-0.5">
            {todayItems.length > 0
              ? `${todayItems.length} evento${todayItems.length !== 1 ? 's' : ''} hoje`
              : 'Nenhum evento registrado para hoje'}
          </p>
        </div>
        <button
          onClick={() => navigate('/calendar')}
          className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-white/5 border border-white/5 text-text-dim hover:text-primary hover:bg-primary/10 hover:border-primary/20 transition-all cursor-pointer"
        >
          Ver Calendário →
        </button>
      </div>

      {/* Timeline */}
      <div className="relative flex-1 overflow-y-auto scrollbar-hide">
        {todayItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-10 text-center">
            <span className="text-3xl mb-3">📭</span>
            <p className="text-xs text-text-dim font-medium">Sem eventos para hoje.</p>
            <button
              onClick={() => navigate('/calendar')}
              className="mt-3 text-[10px] font-bold text-primary hover:underline cursor-pointer"
            >
              + Adicionar no Calendário
            </button>
          </div>
        ) : (
          <>
            {/* Vertical line */}
            <div className="absolute left-4 top-2 bottom-2 w-[1.5px] bg-gradient-to-b from-white/10 via-white/5 to-transparent pointer-events-none" />

            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="space-y-4 relative z-10"
            >
              {todayItems.map((item) => {
                const origin = ORIGIN_MAP[item.origin] || ORIGIN_MAP.manual;
                return (
                  <motion.div
                    key={item.id}
                    variants={itemVariants}
                    onClick={() => navigate('/calendar')}
                    className="flex items-start gap-3 relative group cursor-pointer"
                  >
                    {/* Dot */}
                    <div className="relative flex items-center justify-center flex-shrink-0 mt-1">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center border transition-all duration-300 shadow-sm group-hover:scale-110"
                        style={{
                          background: 'var(--bg-surface-2)',
                          borderColor: item.color + '44',
                          boxShadow: `0 0 8px ${item.color}15`,
                        }}
                      >
                        <span className="text-xs">{origin.icon}</span>
                      </div>
                    </div>

                    {/* Card */}
                    <div
                      className="flex-1 rounded-xl p-3 border transition-all group-hover:bg-white/[0.03] group-hover:border-white/10 flex items-center gap-3"
                      style={{ background: 'var(--bg-surface-2)', borderColor: 'var(--border)' }}
                    >
                      {/* Time badge */}
                      {item.time && (
                        <span className="text-[10px] font-mono text-text-dim font-bold tracking-wider flex-shrink-0">
                          {item.time}
                        </span>
                      )}

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-semibold text-text-main leading-tight truncate">
                          {item.title}
                        </h4>
                        {item.description && (
                          <p className="text-[10px] text-text-dim leading-normal truncate mt-0.5">
                            {item.description}
                          </p>
                        )}
                      </div>

                      {/* Status badge */}
                      <div className="flex-shrink-0">
                        {item.completed ? (
                          <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                            ✓ Feito
                          </span>
                        ) : (
                          <span
                            className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded"
                            style={{
                              background: item.color + '15',
                              color: item.color,
                              border: `1px solid ${item.color}25`,
                            }}
                          >
                            {origin.label}
                          </span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </>
        )}
      </div>
    </div>
  );
}
