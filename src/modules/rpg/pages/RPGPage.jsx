import React from 'react';
import { AvatarEvolution } from '../components/AvatarEvolution';
import { MissionsBoard } from '../components/MissionsBoard';
import { BadgesGallery } from '../components/BadgesGallery';
import { useGameStore } from '../../../stores/useGameStore';
import { motion } from 'framer-motion';
import { PageHeader } from '../../../components/layout/PageHeader';

export function RPGPage() {
  const { missions, badges } = useGameStore();

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
      {/* RPG Header */}
      <PageHeader
        icon="⚔️"
        title="Aventura RPG"
        subtitle="Acompanhe seu nível, cumpra missões e desbloqueie medalhas lendárias."
        badge={
          <span className="text-[9px] sm:text-[10px] bg-primary/20 text-primary border border-primary/30 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full uppercase tracking-widest font-black font-mono">
            Gamificação v3.0
          </span>
        }
      >
        {/* Header Stats */}
        <div className="flex gap-2 sm:gap-4">
          <div className="flex-1 card-surface p-2.5 sm:p-3 px-3 sm:px-4 text-center min-w-[70px] sm:min-w-[90px]">
            <span className="text-base sm:text-xl">⚔️</span>
            <span className="block text-[9px] sm:text-xs text-text-dim font-bold uppercase mt-1">Missões</span>
            <span className="block text-sm sm:text-lg font-black text-text-main mt-0.5">
              {claimedMissions}/{totalMissions}
            </span>
          </div>

          <div className="flex-1 card-surface p-2.5 sm:p-3 px-3 sm:px-4 text-center min-w-[70px] sm:min-w-[90px]">
            <span className="text-base sm:text-xl">🏆</span>
            <span className="block text-[9px] sm:text-xs text-text-dim font-bold uppercase mt-1">Medalhas</span>
            <span className="block text-sm sm:text-lg font-black text-yellow-400 mt-0.5 animate-pulse">
              {unlockedBadges}/{totalBadges}
            </span>
          </div>

          <div className="flex-1 card-surface p-2.5 sm:p-3 px-3 sm:px-4 text-center min-w-[70px] sm:min-w-[90px]">
            <span className="text-base sm:text-xl">🔮</span>
            <span className="block text-[9px] sm:text-xs text-text-dim font-bold uppercase mt-1">XP</span>
            <span className="block text-sm sm:text-lg font-black text-secondary mt-0.5">
              {useGameStore.getState().totalXP}
            </span>
          </div>
        </div>
      </PageHeader>

      {/* Main RPG Grid */}
      <div className="space-y-4 sm:space-y-6">
        {/* Avatar Evolution - Full Width */}
        <AvatarEvolution />

        {/* Missions + Badges */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 items-start">
          <div className="lg:col-span-2">
            <MissionsBoard />
          </div>
          <div className="lg:col-span-1">
            <BadgesGallery />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default RPGPage;
