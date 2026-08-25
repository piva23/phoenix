// AchievementToast — Notificação animada de conquista desbloqueada
// Escuta o evento customizado phoenix:achievement_unlocked e exibe um toast.

import { useEffect } from 'react';
import toast from 'react-hot-toast';
import { useAchievementStore } from '../../stores/useAchievementStore';

function AchievementToastInner() {
  const recentUnlocks = useAchievementStore((s) => s.recentUnlocks);
  const clearRecentUnlocks = useAchievementStore((s) => s.clearRecentUnlocks);

  useEffect(() => {
    if (recentUnlocks.length === 0) return;

    // Processa cada conquista recente
    recentUnlocks.forEach((id, index) => {
      const def = ACHIEVEMENT_DEFINITIONS_MAP[id];
      if (!def) return;

      setTimeout(() => {
        toast.custom((t) => (
          <div
            className={`flex items-center gap-4 px-5 py-4 rounded-2xl border shadow-2xl transition-all duration-500 ${
              t.visible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 -translate-y-4 scale-95'
            }`}
            style={{
              background: 'linear-gradient(135deg, rgba(12,12,16,0.95), rgba(23,23,30,0.95))',
              borderColor: 'rgba(245,158,11,0.3)',
              backdropFilter: 'blur(20px)',
              boxShadow: '0 8px 40px rgba(245,158,11,0.15), 0 0 60px rgba(245,158,11,0.05)',
            }}
          >
            {/* Ícone animado */}
            <div className="relative shrink-0">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-2xl animate-bounce">
                {def.icon}
              </div>
              <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center">
                <span className="text-[10px] font-black text-black">✓</span>
              </div>
            </div>

            {/* Texto */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-amber-500">
                  ✦ Conquista Desbloqueada
                </span>
              </div>
              <div className="text-sm font-black text-text-main tracking-tight">
                {def.name}
              </div>
              <div className="text-[10px] text-text-muted mt-0.5 truncate">
                {def.description}
              </div>
            </div>

            {/* XP Reward */}
            <div className="shrink-0 text-right">
              <div className="text-lg font-black text-amber-400 font-mono">
                +{def.xpReward}
              </div>
              <div className="text-[9px] text-amber-500/70 font-bold uppercase tracking-wider">
                XP
              </div>
            </div>
          </div>
        ), {
          duration: 5000,
          position: 'bottom-right',
        });
      }, index * 800); // Delay escalonado se múltiplas conquistas
    });

    clearRecentUnlocks();
  }, [recentUnlocks, clearRecentUnlocks]);

  return null;
}

// Mapa rápido de IDs para definições (evita re-buscar)
import { ACHIEVEMENT_DEFINITIONS } from '../../stores/useAchievementStore';
const ACHIEVEMENT_DEFINITIONS_MAP = {};
ACHIEVEMENT_DEFINITIONS.forEach((a) => { ACHIEVEMENT_DEFINITIONS_MAP[a.id] = a; });

export function AchievementToast() {
  return <AchievementToastInner />;
}
