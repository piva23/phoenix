import React from 'react';
import { useRPGStore } from '../../../stores/useRPGStore';
import { motion } from 'framer-motion';

export function BadgesGallery() {
  const { badges, toggleBadge } = useRPGStore();

  const fmtDate = (timestamp) => {
    if (!timestamp) return '';
    return new Date(timestamp).toLocaleDateString('pt-PT', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div id="badges-gallery-panel" className="bg-surface border border-border rounded-3xl p-6 shadow-xl relative overflow-hidden backdrop-blur-md">
      {/* Visual background decoration */}
      <div className="absolute top-0 left-0 w-32 h-32 bg-yellow-500/5 rounded-full filter blur-3xl pointer-events-none" />

      <div className="mb-6">
        <h2 className="text-sm font-bold text-text-dim uppercase tracking-widest flex items-center gap-2">
          <span className="text-amber-500 text-lg">🛡️</span> Sala de Troféus & Medalhas
        </h2>
        <p className="text-xs text-text-muted mt-1">
          Suas conquistas lendárias alcançadas ao longo da sua jornada no sistema.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {badges.map((badge) => {
          const isUnlocked = badge.unlocked;

          return (
            <motion.div
              key={badge.id}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                toggleBadge(badge.id);
              }}
              className={`flex flex-col items-center text-center p-4 rounded-2xl border transition-all duration-300 cursor-pointer relative overflow-hidden ${
                isUnlocked
                  ? 'bg-gradient-to-b from-amber-500/[0.04] to-transparent border-amber-500/30 shadow-lg shadow-amber-500/5'
                  : 'bg-white/[0.01] border-white/5 opacity-50'
              }`}
            >
              {/* Golden circular overlay for unlocked badges */}
              {isUnlocked && (
                <div className="absolute inset-0 border border-amber-500/10 rounded-2xl pointer-events-none animate-pulse" />
              )}

              {/* Icon Container with grayscale filter for locked badges */}
              <div
                className={`w-16 h-16 rounded-full flex items-center justify-center text-3xl mb-3 transition-all duration-300 relative ${
                  isUnlocked
                    ? 'bg-amber-500/10 scale-105 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                    : 'bg-white/5 filter grayscale opacity-40'
                }`}
              >
                {badge.icon}
                {isUnlocked && (
                  <span className="absolute -top-1 -right-1 text-[10px] bg-amber-500 text-black px-1.5 py-0.5 rounded-full font-black scale-90">
                    ✓
                  </span>
                )}
              </div>

              <h3
                className={`text-xs font-extrabold tracking-tight transition-colors ${
                  isUnlocked ? 'text-amber-400' : 'text-text-muted'
                }`}
              >
                {badge.title}
              </h3>
              
              <p className="text-[10px] text-text-dim mt-1.5 leading-snug min-h-[32px] px-2">
                {badge.description}
              </p>

              <div className="mt-3 pt-2 border-t border-white/5 w-full flex items-center justify-center min-h-[20px]">
                {isUnlocked ? (
                  <span className="text-[9px] text-amber-500/70 font-mono">
                    Conquistado em {fmtDate(badge.unlockedAt)}
                  </span>
                ) : (
                  <span className="text-[9px] text-text-dim/40 font-mono uppercase tracking-wider">
                    Bloqueado
                  </span>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="mt-4 text-center">
        <span className="inline-block text-[10px] text-text-dim bg-white/[0.02] border border-white/5 px-3 py-1 rounded-full">
          💡 <span className="font-bold">Dica do Desenvolvedor:</span> Clique em qualquer medalha para simular seu desbloqueio / bloqueio instantâneo!
        </span>
      </div>
    </div>
  );
}
