import React from 'react';
import { UniversalCalendarView } from '../components/UniversalCalendarView';
import { motion } from 'framer-motion';

export function CalendarPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6 pb-20"
    >
      {/* Universal Calendar Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-slate-950 to-indigo-950 border border-border p-6 md:p-8 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        {/* Background Glowing Rings */}
        <div className="absolute top-1/2 -left-12 -translate-y-1/2 w-64 h-64 bg-primary/5 rounded-full filter blur-3xl pointer-events-none animate-pulse" />
        <div className="absolute top-1/2 -right-12 -translate-y-1/2 w-64 h-64 bg-indigo-500/5 rounded-full filter blur-3xl pointer-events-none" />

        <div className="space-y-2 relative">
          <span className="text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-3 py-1 rounded-full uppercase tracking-widest font-black font-mono">
            Módulo Integrador Geral
          </span>
          <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight uppercase">
            Calendário Universal
          </h1>
          <p className="text-xs text-text-dim max-w-xl">
            Uma visão integrada da sua rotina diária unificando tarefas com prazo, compromissos manuais, vencimentos e faturas financeiras, além de revisões ativas de estudo.
          </p>
        </div>

        {/* Legend Panel */}
        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 space-y-2 text-xs md:min-w-[200px] backdrop-blur-sm relative">
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
      </div>

      {/* Main Calendar View Component */}
      <UniversalCalendarView />
    </motion.div>
  );
}
export default CalendarPage;
