import React from 'react';
import { UniversalCalendarView } from '../components/UniversalCalendarView';
import { motion } from 'framer-motion';
import { PageHeader } from '../../../components/layout/PageHeader';

export function CalendarPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="page-container"
    >
      {/* Universal Calendar Header Banner */}
      <PageHeader
        icon="📅"
        title="Calendário Universal"
        subtitle="Uma visão integrada da sua rotina diária unificando tarefas com prazo, compromissos manuais, vencimentos e faturas financeiras, além de revisões ativas de estudo."
        badge={
          <div className="card-surface p-4 space-y-2 text-xs md:min-w-[200px]">
            <span className="block text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1.5">
              Legenda de Atividades
            </span>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                <span className="text-[10px] text-text-dim">Projetos</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-purple-500" />
                <span className="text-[10px] text-text-dim">Revisões</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-[10px] text-text-dim">Receitas</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                <span className="text-[10px] text-text-dim">Saídas</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span className="text-[10px] text-text-dim">Pendências</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-pink-500" />
                <span className="text-[10px] text-text-dim">Manuais</span>
              </div>
            </div>
          </div>
        }
      />

      {/* Main Calendar View Component */}
      <UniversalCalendarView />
    </motion.div>
  );
}
export default CalendarPage;
