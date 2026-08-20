import React from 'react';
import { AvatarEvolution } from '../components/AvatarEvolution';
import { MissionsBoard } from '../components/MissionsBoard';
import { BadgesGallery } from '../components/BadgesGallery';
import { useGameStore } from '../../../stores/useGameStore';
import { usePersonaStore } from '../../../stores/usePersonaStore';
import { motion } from 'framer-motion';
import { PageHeader } from '../../../components/layout/PageHeader';

export function RPGPage() {
  const { missions, badges } = useGameStore();
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
      className="page-container"
    >
      {/* RPG Gaming Header Banner */}
      <PageHeader
        icon="⚔️"
        title="Quadro de Aventura RPG"
        subtitle="Acompanhe o nível de sua persona ativa, cumpra missões transversais diárias para coletar pontos de experiência e desbloqueie medalhas lendárias no sistema."
        badge={
          <span className="text-[10px] bg-primary/20 text-primary border border-primary/30 px-3 py-1 rounded-full uppercase tracking-widest font-black font-mono">
            Módulo de Gamificação v3.0
          </span>
        }
      >
        {/* Header Stats */}
        <div className="flex gap-4">
          <div className="flex-1 md:flex-initial card-surface p-3 px-4 text-center min-w-[90px]">
            <span className="text-xl">⚔️</span>
            <span className="block text-xs text-text-dim font-bold uppercase mt-1">Missões</span>
            <span className="block text-lg font-black text-text-main mt-0.5">
              {claimedMissions}/{totalMissions}
            </span>
          </div>

          <div className="flex-1 md:flex-initial card-surface p-3 px-4 text-center min-w-[90px]">
            <span className="text-xl">🏆</span>
            <span className="block text-xs text-text-dim font-bold uppercase mt-1">Medalhas</span>
            <span className="block text-lg font-black text-yellow-400 mt-0.5 animate-pulse">
              {unlockedBadges}/{totalBadges}
            </span>
          </div>

          <div className="flex-1 md:flex-initial card-surface p-3 px-4 text-center min-w-[90px]">
            <span className="text-xl">🔮</span>
            <span className="block text-xs text-text-dim font-bold uppercase mt-1">Ativo</span>
            <span className="block text-sm font-black text-secondary mt-1 whitespace-nowrap overflow-hidden text-ellipsis max-w-[80px]">
              {persona?.name || 'Horus'}
            </span>
          </div>
        </div>
      </PageHeader>

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
