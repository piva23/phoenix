import React from 'react';
import { useDailyTasks } from '../../../shared/hooks/useDailyTasks';
import { motion } from 'framer-motion';

const MODULE_DEFAULTS = {
  spiritual: { name: 'Espiritualidade', color: '#C084FC', icon: '🌅' },
  study: { name: 'Estudos', color: '#FBBF24', icon: '📚' },
  health: { name: 'Saúde & Corpo', color: '#F87171', icon: '🏃' },
  projects: { name: 'Projetos', color: '#818CF8', icon: '◇' },
  calendar: { name: 'Calendário', color: '#38BDF8', icon: '📅' },
  finance: { name: 'Finanças', color: '#34D399', icon: '💰' },
};

export function TimelineFeed() {
  const liveTasks = useDailyTasks();

  // Combine real tasks with mock schedule times or fallbacks
  const timelineItems = React.useMemo(() => {
    // If we have live tasks, let's map them to a scheduled slot if possible,
    // otherwise fallback to beautiful mocks to showcase the vertical timeline properly
    const baseItems = [];

    // Let's seed default structural mocks if liveTasks are empty or to ensure the requested items are visible
    const hasRitualMorning = liveTasks.some(t => t.id === 'ritual_morning');
    const hasRevision = liveTasks.some(t => t.id.startsWith('rev_'));
    const hasHealth = liveTasks.some(t => t.moduleOrigin === 'health');

    // 08:00 - Ritual da Manhã (Módulo Espiritual)
    if (!hasRitualMorning) {
      baseItems.push({
        id: 'mock_ritual_morning',
        time: '08:00',
        moduleOrigin: 'spiritual',
        icon: '🌅',
        title: 'Ritual da Manhã',
        subtitle: 'Intenção, gratidão e afirmações ativas',
        xpReward: 30,
        type: 'navigate',
        status: 'pending',
      });
    }

    // 10:00 - Revisões Pendentes (Módulo Study)
    if (!hasRevision) {
      baseItems.push({
        id: 'mock_revisions',
        time: '10:00',
        moduleOrigin: 'study',
        icon: '🔁',
        title: 'Revisões Pendentes',
        subtitle: 'Revisão ativa no sistema espaçado',
        xpReward: 15,
        type: 'navigate',
        status: 'pending',
      });
    }

    // 18:30 - Treino de Força (Módulo Saúde)
    if (!hasHealth) {
      baseItems.push({
        id: 'mock_workout',
        time: '18:30',
        moduleOrigin: 'health',
        icon: '💪',
        title: 'Treino de Força',
        subtitle: 'Consistência física e autoestima elevada',
        xpReward: 20,
        type: 'inline',
        status: 'pending',
      });
    }

    // Integrate live tasks into the timeline
    liveTasks.forEach(task => {
      let time = '12:00'; // fallback
      if (task.id === 'ritual_morning') time = '08:00';
      else if (task.id === 'ritual_night') time = '21:30';
      else if (task.id.startsWith('rev_') || task.id === 'cycle_suggestion') time = '10:00';
      else if (task.moduleOrigin === 'health') time = '18:30';
      else if (task.moduleOrigin === 'calendar') time = '16:00';
      else if (task.moduleOrigin === 'finance') time = '11:00';

      baseItems.push({
        ...task,
        time,
      });
    });

    // Sort by time string ASC
    return baseItems.sort((a, b) => a.time.localeCompare(b.time));
  }, [liveTasks]);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -15 },
    show: { opacity: 1, x: 0, transition: { type: 'spring', stiffness: 100 } }
  };

  return (
    <div
      className="rounded-3xl p-6 border h-full flex flex-col relative overflow-hidden select-none"
      style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
    >
      {/* Background glow overlay mimicking Active Persona */}
      <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-[80px] opacity-10 pointer-events-none" style={{ background: 'var(--primary)' }} />

      <div className="flex items-center justify-between mb-6 relative z-10">
        <div>
          <h3 className="text-[11px] font-bold text-text-dim uppercase tracking-widest">
            Timeline Diária
          </h3>
          <p className="text-xs text-text-muted mt-0.5">Lente e rotina sincronizadas</p>
        </div>
        <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-white/5 border border-white/5 text-text-dim">
          {timelineItems.length} ações
        </span>
      </div>

      <div className="relative flex-1">
        {/* Vertical Timeline Line */}
        <div className="absolute left-4 top-2 bottom-2 w-[1.5px] bg-gradient-to-b from-white/10 via-white/5 to-transparent pointer-events-none" />

        {timelineItems.length === 0 ? (
          <div className="py-12 text-center flex-1 flex flex-col items-center justify-center">
            <div className="text-5xl mb-3 opacity-25">🕊️</div>
            <p className="text-sm font-semibold text-text-main">Vazio por agora</p>
            <p className="text-xs text-text-dim mt-1">Nenhuma atividade agendada ou pendente para hoje.</p>
          </div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="space-y-6 relative z-10"
          >
            {timelineItems.map((item, index) => {
              const mod = MODULE_DEFAULTS[item.moduleOrigin] || { name: 'Atividade', color: 'var(--primary)', icon: '⚡' };
              const isMock = item.id.startsWith('mock_');

              return (
                <motion.div
                  key={item.id}
                  variants={itemVariants}
                  className="flex items-start gap-4 relative group"
                >
                  {/* Left Node & Time */}
                  <div className="relative flex items-center justify-center flex-shrink-0 mt-1">
                    {/* Circle Node */}
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center border transition-all duration-300 shadow-sm"
                      style={{
                        background: 'var(--bg-surface-2)',
                        borderColor: mod.color + '44',
                        boxShadow: `0 0 8px ${mod.color}15`,
                      }}
                    >
                      <span className="text-xs">{item.icon || mod.icon}</span>
                    </div>
                  </div>

                  {/* Task Card */}
                  <div
                    className="flex-1 rounded-2xl p-4 border transition-all hover:bg-white/[0.02] flex items-center justify-between gap-4"
                    style={{
                      background: 'var(--bg-surface-2)',
                      borderColor: 'var(--border)',
                    }}
                  >
                    <div className="space-y-1.5 min-w-0">
                      {/* Badge and Time */}
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] font-mono text-text-dim font-bold tracking-wider">
                          {item.time}
                        </span>
                        <span
                          className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded"
                          style={{
                            background: mod.color + '15',
                            color: mod.color,
                          }}
                        >
                          {mod.name}
                        </span>
                        {isMock && (
                          <span className="text-[8px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded bg-white/5 text-text-dim border border-white/5">
                            Exemplo
                          </span>
                        )}
                      </div>

                      {/* Title */}
                      <h4 className="text-xs font-semibold text-text-main leading-tight truncate">
                        {item.title}
                      </h4>

                      {/* Subtitle */}
                      <p className="text-[11px] text-text-dim leading-normal truncate">
                        {item.subtitle}
                      </p>
                    </div>

                    {/* Action button */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {item.xpReward && (
                        <span className="hidden sm:inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400">
                          +{item.xpReward} XP
                        </span>
                      )}
                      
                      {isMock ? (
                        <button
                          className="text-[10px] font-bold px-3 py-1.5 rounded-xl border border-white/10 text-text-dim hover:text-text-main hover:bg-white/5 transition-all"
                          onClick={() => alert('Este é um item estrutural demonstrativo da Timeline.')}
                        >
                          Visualizar
                        </button>
                      ) : (
                        <button
                          onClick={item.type === 'inline' ? item.onComplete : item.onOpen}
                          className="text-[10px] font-bold px-3 py-1.5 rounded-xl text-white transition-all hover:opacity-90 active:scale-95"
                          style={{ background: item.type === 'inline' ? '#10B981' : 'var(--primary)' }}
                        >
                          {item.type === 'inline' ? 'Concluir' : 'Abrir'}
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>
    </div>
  );
}
