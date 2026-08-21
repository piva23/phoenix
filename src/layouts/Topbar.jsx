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
      className="sticky top-0 z-[50] flex-shrink-0 w-full backdrop-blur-2xl border-b border-white/5 px-4 py-3 sm:px-6 shadow-[0_10px_40px_rgba(0,0,0,0.5)] select-none"
      style={{ background: 'rgba(var(--bg-surface-rgb, 23,23,30), 0.85)' }}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
        {/* ESQUERDA: Menu + Avatar */}
        <div className="flex items-center gap-3 md:gap-4">
          <button
            onClick={toggleSidebar}
            className="lg:hidden flex items-center justify-center w-10 h-10 rounded-2xl card-surface hover:bg-white/[0.05] text-text-dim hover:text-text-main transition-all"
          >
            <Menu size={18} />
          </button>

          {/* Avatar */}
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black text-white flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, var(--primary), var(--secondary))' }}
            >
              {initials}
            </div>
            <div className="hidden sm:block">
              <div className="text-sm font-bold text-text-main">{firstName}</div>
            </div>
          </div>
        </div>

        {/* DIREITA: Streaks + XP + Profile Avatar */}
        <div className="flex items-center gap-4 sm:gap-6">
          {/* Streaks de Saúde */}
          <div className="hidden sm:flex items-center gap-3">
            <div className={`flex items-center gap-1 text-xs ${waterDone ? 'text-cyan-400' : 'text-text-dim'}`} title={`Água — ${streaks?.water || 0} dias`}>
              💧{streaks?.water > 0 && <span className="font-mono font-bold">{streaks.water}</span>}
            </div>
            <div className={`flex items-center gap-1 text-xs ${workoutDone ? 'text-emerald-400' : 'text-text-dim'}`} title={`Treino — ${streaks?.workout || 0} dias`}>
              💪{streaks?.workout > 0 && <span className="font-mono font-bold">{streaks.workout}</span>}
            </div>
            <div className={`flex items-center gap-1 text-xs ${mealDone ? 'text-amber-400' : 'text-text-dim'}`} title={`Refeição — ${streaks?.meal || 0} dias`}>
              🍽️{streaks?.meal > 0 && <span className="font-mono font-bold">{streaks.meal}</span>}
            </div>
          </div>

          {/* Streaks de Hábitos (Sobriedade) */}
          <div className="hidden sm:flex items-center gap-3">
            <div className={`flex items-center gap-1 text-xs ${(streaks?.habits?.h_nob || 0) > 0 ? 'text-rose-400' : 'text-text-dim'}`} title={`NOB — ${streaks?.habits?.h_nob || 0} dias sem fumar`}>
              🚭{(streaks?.habits?.h_nob || 0) > 0 && <span className="font-mono font-bold">{streaks.habits.h_nob}</span>}
            </div>
            <div className={`flex items-center gap-1 text-xs ${(streaks?.habits?.h_nolust || 0) > 0 ? 'text-purple-400' : 'text-text-dim'}`} title={`NoLust — ${streaks?.habits?.h_nolust || 0} dias`}>
              🛡️{(streaks?.habits?.h_nolust || 0) > 0 && <span className="font-mono font-bold">{streaks.habits.h_nolust}</span>}
            </div>
            <div className={`flex items-center gap-1 text-xs ${(streaks?.habits?.h_nopm || 0) > 0 ? 'text-blue-400' : 'text-text-dim'}`} title={`NoPM — ${streaks?.habits?.h_nopm || 0} dias`}>
              🚫{(streaks?.habits?.h_nopm || 0) > 0 && <span className="font-mono font-bold">{streaks.habits.h_nopm}</span>}
            </div>
          </div>

          {/* XP Bar */}
          <div className="hidden md:flex items-center gap-4 rounded-2xl border border-white/5 bg-[#0A0A0E] px-4 py-2 shadow-inner">
            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">
              LVL <span className="text-white">{xpData.level}</span>
            </div>
            <div className="relative w-24 lg:w-32 h-2 rounded-full bg-[#060608] border border-white/10 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${xpData.progress}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
                className="absolute top-0 left-0 h-full rounded-full"
                style={{ background: 'linear-gradient(90deg, var(--primary), var(--secondary))' }}
              />
            </div>
            <div className="text-[10px] font-mono font-bold text-zinc-400">
              <span className="text-primary">{xp}</span> XP
            </div>
          </div>

          {/* Profile Avatar — rightmost */}
          <button
            onClick={() => navigate('/settings')}
            className="flex items-center justify-center w-10 h-10 rounded-xl flex-shrink-0 transition-transform duration-200 hover:scale-105 active:scale-95 ring-2 ring-transparent hover:ring-primary/40 cursor-pointer"
            style={{ background: 'linear-gradient(135deg, var(--primary), var(--secondary))' }}
          >
            <span className="text-sm font-black text-white">{initials}</span>
          </button>
        </div>
      </div>
    </motion.header>
  );
}
