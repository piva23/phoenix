import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Menu } from 'lucide-react';
import { useGameStore, calcXPProgress } from '../stores/useGameStore';
import { useHealthStore } from '../stores/useHealthStore';
import { useUIStore } from '../stores/useUIStore';
import { today } from '../shared/utils/time';

export function Topbar() {
  const xp = useGameStore(s => s.totalXP);
  const name = useGameStore(s => s.name);
  const { toggleSidebar } = useUIStore();
  const navigate = useNavigate();
  const t = today();

  // Streaks da saúde
  const waterLog = useHealthStore(s => s.waterLog[t] || []);
  const workoutLog = useHealthStore(s => s.workoutLog[t] || {});
  const habitLog = useHealthStore(s => s.habitLog[t] || {});
  const streaks = useHealthStore(s => s.streaks);

  const waterDone = waterLog.reduce((a, e) => a + e.ml, 0) > 0;
  const workoutDone = Object.keys(workoutLog).length > 0;
  const mealDone = Object.keys(habitLog).length > 0;

  const xpData = calcXPProgress(xp);
  const firstName = (name || 'Felipe').split(' ')[0];
  const initials = firstName.charAt(0).toUpperCase();

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="sticky top-0 z-[50] flex-shrink-0 w-full backdrop-blur-xl border-b px-4 py-3 sm:px-6 select-none"
      style={{
        background: 'rgba(23, 23, 30, 0.7)',
        borderColor: 'var(--nav-border)',
      }}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
        {/* ESQUERDA: Menu + Avatar */}
        <div className="flex items-center gap-3 md:gap-4">
          <button
            onClick={toggleSidebar}
            className="lg:hidden flex items-center justify-center w-10 h-10 rounded-2xl transition-all"
            style={{
              background: 'var(--nav-surface)',
              border: '1px solid var(--nav-border)',
              color: 'var(--text-dim)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--nav-hover)';
              e.currentTarget.style.color = 'var(--text-main)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--nav-surface)';
              e.currentTarget.style.color = 'var(--text-dim)';
            }}
          >
            <Menu size={18} />
          </button>

          {/* Avatar */}
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black text-white flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #10B981, #06B6D4)' }}
            >
              {initials}
            </div>
            <div className="hidden sm:block">
              <div className="text-sm font-bold" style={{ color: 'var(--text-main)' }}>
                {firstName}
              </div>
            </div>
          </div>
        </div>

        {/* DIREITA: Streaks + XP + Profile Avatar */}
        <div className="flex items-center gap-4 sm:gap-6">
          {/* Streaks de Saúde */}
          <div className="hidden sm:flex items-center gap-3">
            <div
              className="flex items-center gap-1 text-xs transition-colors"
              style={{ color: waterDone ? '#22D3EE' : 'var(--text-dim)' }}
              title={`Água — ${streaks?.water || 0} dias`}
            >
              💧{streaks?.water > 0 && <span className="font-mono font-bold">{streaks.water}</span>}
            </div>
            <div
              className="flex items-center gap-1 text-xs transition-colors"
              style={{ color: workoutDone ? '#34D399' : 'var(--text-dim)' }}
              title={`Treino — ${streaks?.workout || 0} dias`}
            >
              💪{streaks?.workout > 0 && <span className="font-mono font-bold">{streaks.workout}</span>}
            </div>
            <div
              className="flex items-center gap-1 text-xs transition-colors"
              style={{ color: mealDone ? '#FBBF24' : 'var(--text-dim)' }}
              title={`Refeição — ${streaks?.meal || 0} dias`}
            >
              🍽️{streaks?.meal > 0 && <span className="font-mono font-bold">{streaks.meal}</span>}
            </div>
          </div>

          {/* Streaks de Hábitos (Sobriedade) */}
          <div className="hidden sm:flex items-center gap-3">
            <div
              className="flex items-center gap-1 text-xs transition-colors"
              style={{ color: (streaks?.habits?.h_nob || 0) > 0 ? '#FB7185' : 'var(--text-dim)' }}
              title={`NOB — ${streaks?.habits?.h_nob || 0} dias sem fumar`}
            >
              🚭{(streaks?.habits?.h_nob || 0) > 0 && <span className="font-mono font-bold">{streaks.habits.h_nob}</span>}
            </div>
            <div
              className="flex items-center gap-1 text-xs transition-colors"
              style={{ color: (streaks?.habits?.h_nolust || 0) > 0 ? '#C084FC' : 'var(--text-dim)' }}
              title={`NoLust — ${streaks?.habits?.h_nolust || 0} dias`}
            >
              🛡️{(streaks?.habits?.h_nolust || 0) > 0 && <span className="font-mono font-bold">{streaks.habits.h_nolust}</span>}
            </div>
            <div
              className="flex items-center gap-1 text-xs transition-colors"
              style={{ color: (streaks?.habits?.h_nopm || 0) > 0 ? '#60A5FA' : 'var(--text-dim)' }}
              title={`NoPM — ${streaks?.habits?.h_nopm || 0} dias`}
            >
              🚫{(streaks?.habits?.h_nopm || 0) > 0 && <span className="font-mono font-bold">{streaks.habits.h_nopm}</span>}
            </div>
          </div>

          {/* XP Bar */}
          <div
            className="hidden md:flex items-center gap-4 rounded-2xl px-4 py-2"
            style={{
              background: 'var(--nav-surface)',
              border: '1px solid var(--nav-border)',
            }}
          >
            <div className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: 'var(--text-dim)' }}>
              LVL <span style={{ color: 'var(--text-main)' }}>{xpData.level}</span>
            </div>
            <div
              className="relative w-24 lg:w-32 h-2 rounded-full overflow-hidden"
              style={{ background: 'rgba(255,255,255,0.06)' }}
            >
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${xpData.progress}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
                className="absolute top-0 left-0 h-full rounded-full"
                style={{ background: 'linear-gradient(90deg, #10B981, #06B6D4)' }}
              />
            </div>
            <div className="text-[10px] font-mono font-bold" style={{ color: 'var(--text-dim)' }}>
              <span style={{ color: '#10B981' }}>{xp}</span> XP
            </div>
          </div>

          {/* Profile Avatar — rightmost */}
          <button
            onClick={() => navigate('/settings')}
            className="flex items-center justify-center w-10 h-10 rounded-xl flex-shrink-0 transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer"
            style={{
              background: 'linear-gradient(135deg, #10B981, #06B6D4)',
              boxShadow: 'none',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 0 16px rgba(16,185,129,0.35)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <span className="text-sm font-black text-white">{initials}</span>
          </button>
        </div>
      </div>
    </motion.header>
  );
}
