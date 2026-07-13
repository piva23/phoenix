import React from 'react';
import { useRPGStore } from '../../../stores/useRPGStore';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';

export function MissionsBoard() {
  const { missions, claimMissionReward, toggleMissionStatus, resetAllRPG } = useRPGStore();

  const handleClaim = (mission) => {
    const success = claimMissionReward(mission.id);
    if (success) {
      toast.success(
        <div className="flex flex-col gap-1">
          <span className="font-bold text-sm text-yellow-400">✨ RECOMPENSA REIVINDICADA! ✨</span>
          <span className="text-xs">Sua Persona recebeu <strong className="text-green-400 font-bold">+{mission.xpReward} XP</strong>!</span>
        </div>,
        {
          duration: 4000,
          icon: '👑',
        }
      );
    } else {
      toast.error('Não foi possível reivindicar essa recompensa no momento.');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'claimable':
        return <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full uppercase tracking-wider font-bold animate-pulse">Pronta</span>;
      case 'claimed':
        return <span className="text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-full uppercase tracking-wider font-bold">Resgatada</span>;
      default:
        return <span className="text-[10px] bg-white/5 text-text-dim border border-white/10 px-2 py-0.5 rounded-full uppercase tracking-wider font-bold">Bloqueada</span>;
    }
  };

  const getTypeStyle = (type) => {
    switch (type) {
      case 'diária':
        return { bg: 'bg-indigo-500/5', border: 'border-indigo-500/20', text: 'text-indigo-400', label: 'Diária' };
      case 'semanal':
        return { bg: 'bg-purple-500/5', border: 'border-purple-500/20', text: 'text-purple-400', label: 'Semanal' };
      default: // épica
        return { bg: 'bg-amber-500/5', border: 'border-amber-500/20', text: 'text-amber-400', label: 'Épica' };
    }
  };

  return (
    <div id="missions-board-panel" className="bg-surface border border-border rounded-3xl p-6 shadow-xl relative overflow-hidden backdrop-blur-md flex flex-col h-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-sm font-bold text-text-dim uppercase tracking-widest flex items-center gap-2">
            <span className="text-secondary text-lg">⚔️</span> Missões Transversais do Sistema
          </h2>
          <p className="text-xs text-text-muted mt-1">
            Complete tarefas reais no Phoenix OS para ganhar recompensas de experiência.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={resetAllRPG}
            className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 rounded-xl text-[10px] uppercase font-bold tracking-wider text-text-dim transition-all"
            title="Resetar progresso de missões para demonstração"
          >
            Resetar Missões ↺
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1">
        <AnimatePresence mode="popLayout">
          {missions.map((mission) => {
            const styles = getTypeStyle(mission.type);
            const isClaimable = mission.status === 'claimable';
            const isClaimed = mission.status === 'claimed';

            return (
              <motion.div
                key={mission.id}
                layout
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 100, damping: 15 }}
                className={`flex flex-col justify-between p-4 rounded-2xl border transition-all duration-300 relative ${styles.bg} ${
                  isClaimable
                    ? 'border-emerald-500/30 shadow-lg shadow-emerald-500/5 bg-emerald-500/[0.02]'
                    : isClaimed
                    ? 'border-white/5 opacity-60'
                    : 'border-white/10'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`text-[9px] font-black uppercase tracking-widest ${styles.text}`}>
                      ✦ {styles.label}
                    </span>
                    {getStatusBadge(mission.status)}
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-text-main tracking-tight">
                      {mission.title}
                    </h3>
                    <p className="text-xs text-text-muted mt-1 leading-relaxed">
                      {mission.req}
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs">🏆</span>
                    <span className="text-xs font-black text-text-main font-mono">
                      +{mission.xpReward} <span className="text-[10px] text-text-dim">XP</span>
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Simulator helper button */}
                    {!isClaimed && (
                      <button
                        onClick={() => toggleMissionStatus(mission.id)}
                        className="p-1 px-2 rounded-lg bg-white/5 hover:bg-white/10 text-[9px] font-bold text-text-muted transition-colors border border-white/5"
                        title="Alternar status (Simular conclusão)"
                      >
                        {isClaimable ? '🔒 Trancar' : '🔓 Concluir'}
                      </button>
                    )}

                    {isClaimable ? (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleClaim(mission)}
                        className="px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider bg-emerald-500 text-black shadow-[0_0_15px_rgba(16,185,129,0.4)] hover:shadow-[0_0_20px_rgba(16,185,129,0.6)] transition-all duration-200"
                      >
                        Reivindicar!
                      </motion.button>
                    ) : isClaimed ? (
                      <span className="text-xs text-text-dim italic flex items-center gap-1">
                        Concluído ✓
                      </span>
                    ) : (
                      <button
                        disabled
                        className="px-3 py-1.5 rounded-xl text-xs font-bold text-text-dim bg-white/5 border border-white/5 cursor-not-allowed"
                      >
                        Em progresso
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
