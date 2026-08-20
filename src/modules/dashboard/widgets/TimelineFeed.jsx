import React from 'react';
import { motion } from 'framer-motion';

const TIMELINE_ITEMS = [
  { id: 'mock_1', time: '08:00', icon: '📚', title: 'Ciclo de Estudo', subtitle: 'Matéria prioritária do dia', moduleOrigin: 'study', color: '#FBBF24' },
  { id: 'mock_2', time: '10:00', icon: '🔁', title: 'Revisões Pendentes', subtitle: 'Sistema de revisão espaçada', moduleOrigin: 'study', color: '#FBBF24' },
  { id: 'mock_3', time: '14:00', icon: '◇', title: 'Projeto', subtitle: 'Tarefa com prazo para hoje', moduleOrigin: 'projects', color: '#818CF8' },
  { id: 'mock_4', time: '18:30', icon: '💪', title: 'Treino de Força', subtitle: 'Consistência física', moduleOrigin: 'health', color: '#F87171' },
  { id: 'mock_5', time: '21:00', icon: '💧', title: 'Beber água', subtitle: 'Meta diária de hidratação', moduleOrigin: 'health', color: '#F87171' },
];

export function TimelineFeed() {
  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.08 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -15 },
    show: { opacity: 1, x: 0, transition: { type: 'spring', stiffness: 100 } },
  };

  return (
    <div
      className="rounded-3xl p-6 border h-full flex flex-col relative overflow-hidden select-none"
      style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
    >
      <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-[80px] opacity-10 pointer-events-none" style={{ background: 'var(--primary)' }} />

      <div className="flex items-center justify-between mb-6 relative z-10">
        <div>
          <h3 className="text-[11px] font-bold text-text-dim uppercase tracking-widest">Timeline Diária</h3>
          <p className="text-xs text-text-muted mt-0.5">Sugestões de atividades do dia</p>
        </div>
        <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-white/5 border border-white/5 text-text-dim">
          {TIMELINE_ITEMS.length} ações
        </span>
      </div>

      <div className="relative flex-1">
        <div className="absolute left-4 top-2 bottom-2 w-[1.5px] bg-gradient-to-b from-white/10 via-white/5 to-transparent pointer-events-none" />

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="space-y-6 relative z-10"
        >
          {TIMELINE_ITEMS.map((item) => {
            return (
              <motion.div
                key={item.id}
                variants={itemVariants}
                className="flex items-start gap-4 relative group"
              >
                <div className="relative flex items-center justify-center flex-shrink-0 mt-1">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center border transition-all duration-300 shadow-sm"
                    style={{
                      background: 'var(--bg-surface-2)',
                      borderColor: item.color + '44',
                      boxShadow: `0 0 8px ${item.color}15`,
                    }}
                  >
                    <span className="text-xs">{item.icon}</span>
                  </div>
                </div>

                <div
                  className="flex-1 rounded-2xl p-4 border transition-all hover:bg-white/[0.02] flex items-center justify-between gap-4"
                  style={{ background: 'var(--bg-surface-2)', borderColor: 'var(--border)' }}
                >
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-mono text-text-dim font-bold tracking-wider">{item.time}</span>
                      <span
                        className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded"
                        style={{ background: item.color + '15', color: item.color }}
                      >
                        {item.moduleOrigin}
                      </span>
                      <span className="text-[8px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded bg-white/5 text-text-dim border border-white/5">
                        Sugestão
                      </span>
                    </div>
                    <h4 className="text-xs font-semibold text-text-main leading-tight truncate">{item.title}</h4>
                    <p className="text-[11px] text-text-dim leading-normal truncate">{item.subtitle}</p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </div>
  );
}
