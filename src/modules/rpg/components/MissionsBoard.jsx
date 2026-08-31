import React from 'react';
import { useGameStore } from '../../../stores/useGameStore';
import { motion } from 'framer-motion';

export function MissionsBoard() {
  const { missions, claimMissionReward } = useGameStore();

  const totalMissions = missions.length;
  const claimedMissions = missions.filter((m) => m.status === 'claimed').length;

  const fmtDate = (timestamp) => {
    if (!timestamp) return '';
    return new Date(timestamp).toLocaleDateString('pt-PT', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-4"
    >
      <div className="flex items-center justify-between">
        <span className="text-sm text-text-dim uppercase tracking-widest">Missões</span>
        <span className="text-xs font-bold text-primary">
          {claimedMissions}/{totalMissions}
        </span>
      </div>

      {missions.map((mission) => {
        const isClaimed = mission.status === 'claimed';
        return (
          <motion.div
            key={mission.id}
            whileHover={{ scale: 1.02 }}
            className={`flex items-center justify-between p-3 rounded-2xl border transition-all duration-200 ${
              isClaimed
                ? 'bg-white/[0.01] border-white/5 opacity-50'
                : 'bg-surface border border-border-strong'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-primary/60" />
              <span className="font-medium text-text-main">{mission.title}</span>
            </div>

            <div className="text-right">
              <span className="text-xs text-text-dim">{mission.xpReward} XP</span>
              {isClaimed && (
                <span className="text-[9px] text-primary/70 font-mono uppercase tracking-wider">
                  Conquistado {fmtDate(mission.claimedAt)}
                </span>
              )}
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
}

export default MissionsBoard;