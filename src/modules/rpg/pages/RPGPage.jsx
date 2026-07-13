import React from 'react';
import { AvatarEvolution } from '../components/AvatarEvolution';
import { MissionsBoard } from '../components/MissionsBoard';
import { BadgesGallery } from '../components/BadgesGallery';
import { useRPGStore } from '../../../stores/useRPGStore';
import { usePersonaStore } from '../../../stores/usePersonaStore';
import { motion } from 'framer-motion';

export function RPGPage() {
  const { missions, badges } = useRPGStore();
  const getActivePersona = usePersonaStore((s) => s.getActivePersona);
  const persona = getActivePersona();

  // Metrics calculation
  const totalMissions = missions.length;
  const claimedMissions = missions.filter((m) => m.status === 'claimed').length;
  const unlockedBadges = badges.filter((b) => b.unlocked).length;
  const totalBadges = badges.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6 pb-20"
    >
      {/* RPG Gaming Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-950 via-slate-900 to-purple-950 border border-border-strong p-6 md:p-8 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        {/* Background Glowing Rings */}
        <div className="absolute top-1/2 -left-12 -translate-y-1/2 w-64 h-64 bg-primary/10 rounded-full filter blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 -right-12 -translate-y-1/2 w-64 h-64 bg-secondary/10 rounded-full filter blur-3xl pointer-events-none" />

        <div className="space-y-2 relative">
          <span className="text-[10px] bg-primary/20 text-primary border border-primary/30 px-3 py-1 rounded-full uppercase tracking-widest font-black font-mono">
            Módulo de Gamificação v3.0
          </span>
          <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight uppercase">
            Quadro de Aventura RPG
          </h1>
          <p className="text-xs text-text-dim max-w-xl">
            Acompanhe o nível de sua persona ativa, cumpra missões transversais diárias para coletar pontos de experiência e desbloqueie medalhas lendárias no sistema.
          </p>
        </div>

        {/* Header Stats */}
        <div className="flex gap-4 w-full md:w-auto relative">
          <div className="flex-1 md:flex-initial bg-white/[0.03] border border-white/5 rounded-2xl p-3 px-4 text-center min-w-[90px] backdrop-blur-sm">
            <span className="text-xl">⚔️</span>
            <span className="block text-xs text-text-dim font-bold uppercase mt-1">Missões</span>
            <span className="block text-lg font-black text-white mt-0.5">
              {claimedMissions}/{totalMissions}
            </span>
          </div>

          <div className="flex-1 md:flex-initial bg-white/[0.03] border border-white/5 rounded-2xl p-3 px-4 text-center min-w-[90px] backdrop-blur-sm">
            <span className="text-xl">🏆</span>
            <span className="block text-xs text-text-dim font-bold uppercase mt-1">Medalhas</span>
            <span className="block text-lg font-black text-yellow-400 mt-0.5 animate-pulse">
              {unlockedBadges}/{totalBadges}
            </span>
          </div>

          <div className="flex-1 md:flex-initial bg-white/[0.03] border border-white/5 rounded-2xl p-3 px-4 text-center min-w-[90px] backdrop-blur-sm">
            <span className="text-xl">🔮</span>
            <span className="block text-xs text-text-dim font-bold uppercase mt-1">Ativo</span>
            <span className="block text-sm font-black text-secondary mt-1 whitespace-nowrap overflow-hidden text-ellipsis max-w-[80px]">
              {persona?.name || 'Horus'}
            </span>
          </div>
        </div>
      </div>

      {/* Main RPG Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column: Avatar and attributes (Spans 2 columns on large screens) */}
        <div className="lg:col-span-3 space-y-6">
          <AvatarEvolution />
        </div>

        {/* Row 2: Missions Board (Spans 2 columns on lg) */}
        <div className="lg:col-span-2">
          <MissionsBoard />
        </div>

        {/* Row 2: Badges Gallery (Spans 1 column on lg) */}
        <div className="lg:col-span-1">
          <BadgesGallery />
        </div>
      </div>
    </motion.div>
  );
}
