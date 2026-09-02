import React from 'react';
import { useGameStore } from '../../../stores/useGameStore';
import { motion } from 'framer-motion';

export function BadgesGallery() {
  const badges = useGameStore((s) => s.badges);

  const fmtDate = (timestamp) => {
    if (!timestamp) return '';
    return new Date(timestamp).toLocaleDateString('pt-PT', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div id="badges-gallery-panel" className="bg-surface border border-border rounded-3xl p-4 sm:p-6 shadow-xl relative overflow-hidden backdrop-blur-md">
      {/* Visual background decoration */}
      <div className="absolute top-0 left-0 w-32 h-32 bg-yellow-500/5 rounded-full filter blur-3xl pointer-events-none" />

      <div className="mb-4 sm:mb-6">
        <h2 className="text-sm font-bold text-text-dim uppercase tracking-widest flex items-center gap-2">
          <span className="text-amber-500 text-lg">🛡️</span> Sala de Troféus
        </h2>
        <p className="text-[10px] sm:text-xs text-text-muted mt-1">
          Suas conquistas lendárias alcançadas ao longo da sua jornada.
        </p>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 sm:gap-4">
        {badges.map((badge) => {
          const isUnlocked = badge.unlocked;

          return (
            <motion.div
              key={badge.id}
              whileHover={{ scale: 1.03 }}
              className={`flex flex-col items-center text-center p-2.5 sm:p-4 rounded-2xl border transition-all duration-300 relative overflow-hidden ${
                isUnlocked
                  ? 'bg-gradient-to-b from-amber-500/[0.04] to-transparent border-amber-500/30 shadow-lg shadow-amber-500/5'
                  : 'bg-white/[0.01] border-white/5 opacity-50'
              }`}
            >
              {/* Golden circular overlay for unlocked badges */}
              {isUnlocked && (
                <div className="absolute inset-0 border border-amber-500/10 rounded-2xl pointer-events-none animate-pulse" />
              )}

              {/* Icon Container */}
              <div
                className={`w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center text-2xl sm:text-3xl mb-2 sm:mb-3 transition-all duration-300 relative ${
                  isUnlocked
                    ? 'bg-amber-500/10 scale-105 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                    : 'bg-white/5 filter grayscale opacity-40'
                }`}
              >
                {badge.icon}
                {isUnlocked && (
                  <span className="absolute -top-1 -right-1 text-[8px] sm:text-[10px] bg-amber-500 text-black px-1 sm:px-1.5 py-0.5 rounded-full font-black scale-90">
                    ✓
                  </span>
                )}
              </div>

              <h3
                className={`text-[10px] sm:text-xs font-extrabold tracking-tight transition-colors leading-tight ${
                  isUnlocked ? 'text-amber-400' : 'text-text-muted'
                }`}
              >
                {badge.title}
              </h3>

              <p className="text-[8px] sm:text-[10px] text-text-dim mt-1 sm:mt-1.5 leading-snug min-h-[24px] sm:min-h-[32px] px-1">
                {badge.description}
              </p>

              <div className="mt-2 sm:mt-3 pt-1.5 sm:pt-2 border-t border-white/5 w-full flex items-center justify-center min-h-[16px] sm:min-h-[20px]">
                {isUnlocked ? (
                  <span className="text-[7px] sm:text-[9px] text-amber-500/70 font-mono truncate">
                    {fmtDate(badge.unlockedAt)}
                  </span>
                ) : (
                  <span className="text-[7px] sm:text-[9px] text-text-dim/40 font-mono uppercase tracking-wider">
                    Bloqueado
                  </span>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
