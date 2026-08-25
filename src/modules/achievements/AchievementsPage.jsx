import React, { useMemo, useState, useEffect } from 'react';
import {
  useAchievementStore,
  ACHIEVEMENT_DEFINITIONS,
  ACHIEVEMENT_PROGRESS,
  getLiveProgressState,
} from '../../stores/useAchievementStore';
import { PageHeader } from '../../components/layout/PageHeader';
import { motion } from 'framer-motion';

const CATEGORIES = [
  { id: 'all', label: 'Todas', icon: '🏆' },
  { id: 'estudo', label: 'Estudo', icon: '📚' },
  { id: 'saude', label: 'Saúde', icon: '💪' },
  { id: 'financas', label: 'Finanças', icon: '💰' },
  { id: 'rpg', label: 'RPG', icon: '⚔️' },
  { id: 'streak', label: 'Streaks', icon: '🔥' },
  { id: 'epica', label: 'Épicas', icon: '🏛️' },
  { id: 'misc', label: 'Misc', icon: '🌟' },
];

// Formata valores de progresso (minutos viram horas quando grande)
function fmtProgressValue(metric, value) {
  if (metric === 'totalStudyMinutes') {
    const h = Math.floor(value / 60);
    return h > 0 ? `${h}h` : `${value}min`;
  }
  return String(value);
}

function AchievementCard({ achievement, isUnlocked, unlockedAt, liveState }) {
  const fmtDate = (ts) => {
    if (!ts) return '';
    return new Date(ts).toLocaleDateString('pt-PT', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  // Progresso parcial para conquistas bloqueadas com métrica conhecida
  const progress = useMemo(() => {
    if (isUnlocked) return null;
    const [metric, target] = ACHIEVEMENT_PROGRESS[achievement.id] || [];
    if (!metric || !target || !liveState) return null;
    const value = Number(liveState[metric]) || 0;
    const pct = Math.min(100, Math.round((value / target) * 100));
    return { value, target, pct };
  }, [achievement.id, isUnlocked, liveState]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative flex flex-col p-5 rounded-2xl border transition-all duration-300 overflow-hidden ${
        isUnlocked
          ? 'bg-gradient-to-b from-amber-500/[0.04] to-transparent border-amber-500/30 shadow-lg shadow-amber-500/5'
          : 'bg-white/[0.01] border-white/5'
      }`}
    >
      {/* Glow effect for unlocked */}
      {isUnlocked && (
        <div className="absolute inset-0 border border-amber-500/10 rounded-2xl pointer-events-none animate-pulse" />
      )}

      {/* Ícone */}
      <div className="flex items-start justify-between mb-3">
        <div
          className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl transition-all duration-300 ${
            isUnlocked
              ? 'bg-amber-500/10 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
              : 'bg-white/5 filter grayscale opacity-40'
          }`}
        >
          {achievement.icon}
        </div>
        {isUnlocked && (
          <div className="w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center">
            <span className="text-[10px] font-black text-black">✓</span>
          </div>
        )}
      </div>

      {/* Nome e descrição */}
      <h3 className={`text-sm font-extrabold tracking-tight mb-1 ${
        isUnlocked ? 'text-amber-400' : 'text-text-muted'
      }`}>
        {achievement.name}
      </h3>
      <p className="text-[11px] text-text-dim leading-relaxed flex-1">
        {achievement.description}
      </p>

      {/* Barra de progresso para conquistas bloqueadas */}
      {progress && (
        <div className="mt-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[9px] text-text-dim uppercase tracking-wider font-bold">
              Progresso
            </span>
            <span className="text-[9px] text-text-muted font-mono font-bold">
              {fmtProgressValue(ACHIEVEMENT_PROGRESS[achievement.id][0], progress.value)}
              {' / '}
              {fmtProgressValue(ACHIEVEMENT_PROGRESS[achievement.id][0], progress.target)}
            </span>
          </div>
          <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-primary to-secondary"
              initial={{ width: 0 }}
              animate={{ width: `${progress.pct}%` }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            />
          </div>
        </div>
      )}

      {/* XP + data */}
      <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between">
        <span className={`text-xs font-black font-mono ${
          isUnlocked ? 'text-amber-400' : 'text-text-dim/40'
        }`}>
          +{achievement.xpReward} XP
        </span>
        {isUnlocked ? (
          <span className="text-[9px] text-amber-500/70 font-mono">
            {fmtDate(unlockedAt)}
          </span>
        ) : (
          <span className="text-[9px] text-text-dim/40 font-mono uppercase tracking-wider">
            Bloqueado
          </span>
        )}
      </div>
    </motion.div>
  );
}

export function AchievementsPage() {
  const { unlocked, getStats } = useAchievementStore();
  const [activeCategory, setActiveCategory] = React.useState('all');

  // Estado consolidado ao vivo para as barras de progresso.
  // Recalculado no mount e a cada 30s (não é reativo por natureza).
  const [liveState, setLiveState] = useState(() => getLiveProgressState());
  useEffect(() => {
    const refresh = () => setLiveState(getLiveProgressState());
    const interval = setInterval(refresh, 30000);
    return () => clearInterval(interval);
  }, []);

  const stats = useMemo(() => getStats(), [unlocked]);

  const filteredAchievements = useMemo(() => {
    if (activeCategory === 'all') return ACHIEVEMENT_DEFINITIONS;
    return ACHIEVEMENT_DEFINITIONS.filter((a) => a.category === activeCategory);
  }, [activeCategory]);

  const categoryCounts = useMemo(() => {
    const counts = { all: 0 };
    ACHIEVEMENT_DEFINITIONS.forEach((a) => {
      if (unlocked[a.id]) {
        counts.all = (counts.all || 0) + 1;
        counts[a.category] = (counts[a.category] || 0) + 1;
      }
    });
    return counts;
  }, [unlocked]);

  return (
    <div className="page-container">
      <PageHeader
        icon="🏆"
        title="Conquistas"
        subtitle={`${stats.count}/${stats.total} desbloqueadas • ${stats.totalXP} XP ganho`}
        badge={
          <span className="text-[10px] bg-amber-500/20 text-amber-400 border border-amber-500/30 px-3 py-1 rounded-full uppercase tracking-widest font-black font-mono">
            {stats.pct}% Completo
          </span>
        }
      />

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="card-surface p-4 text-center">
          <div className="text-2xl mb-1">🏆</div>
          <div className="text-lg font-black text-text-main">{stats.count}</div>
          <div className="text-[10px] text-text-dim uppercase tracking-wider font-bold">Conquistas</div>
        </div>
        <div className="card-surface p-4 text-center">
          <div className="text-2xl mb-1">⚡</div>
          <div className="text-lg font-black text-amber-400">{stats.totalXP}</div>
          <div className="text-[10px] text-text-dim uppercase tracking-wider font-bold">XP Ganho</div>
        </div>
        <div className="card-surface p-4 text-center">
          <div className="text-2xl mb-1">📊</div>
          <div className="text-lg font-black text-primary">{stats.pct}%</div>
          <div className="text-[10px] text-text-dim uppercase tracking-wider font-bold">Progresso</div>
        </div>
        <div className="card-surface p-4 text-center">
          <div className="text-2xl mb-1">🎯</div>
          <div className="text-lg font-black text-text-main">{stats.total - stats.count}</div>
          <div className="text-[10px] text-text-dim uppercase tracking-wider font-bold">Restantes</div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-6">
        <div className="h-3 bg-surface rounded-full overflow-hidden border border-white/5 p-[2px]">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-amber-500 to-yellow-400"
            initial={{ width: 0 }}
            animate={{ width: `${stats.pct}%` }}
            transition={{ type: 'spring', stiffness: 80, damping: 15 }}
          />
        </div>
      </div>

      {/* Category filters */}
      <div className="flex gap-1.5 overflow-x-auto scrollbar-hide p-1.5 card-surface mb-6">
        {CATEGORIES.map((cat) => {
          const count = categoryCounts[cat.id] || 0;
          const total = cat.id === 'all'
            ? ACHIEVEMENT_DEFINITIONS.length
            : ACHIEVEMENT_DEFINITIONS.filter((a) => a.category === cat.id).length;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex-shrink-0 px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 whitespace-nowrap uppercase tracking-wider cursor-pointer ${
                activeCategory === cat.id
                  ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-black shadow-lg shadow-amber-500/25 border border-white/10'
                  : 'text-text-dim hover:text-text-main hover:bg-white/5 border border-transparent'
              }`}
            >
              {cat.icon} {cat.label}
              {count > 0 && (
                <span className="ml-1.5 text-[9px] opacity-70">
                  {count}/{total}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Achievements grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredAchievements.map((achievement) => (
          <AchievementCard
            key={achievement.id}
            achievement={achievement}
            isUnlocked={!!unlocked[achievement.id]}
            unlockedAt={unlocked[achievement.id]?.unlockedAt}
            liveState={liveState}
          />
        ))}
      </div>

      {filteredAchievements.length === 0 && (
        <div className="text-center py-12">
          <span className="text-4xl mb-4 block">🔍</span>
          <p className="text-sm text-text-dim">Nenhuma conquista nesta categoria.</p>
        </div>
      )}
    </div>
  );
}

export default AchievementsPage;
