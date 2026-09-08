import { useState } from 'react';
import { useHealthStore } from '../../../stores/useHealthStore';
import { useGameStore } from '../../../stores/useGameStore';
import { WorkoutTracker } from '../components/WorkoutTracker';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Dumbbell, Play, Sparkles, X } from 'lucide-react';

const XP_WORKOUT = 50;

export function TreinoView({ compact = false }) {
  const {
    plans = {},
    canClaimXP,
    markXPClaimed,
  } = useHealthStore();

  const dispatchXP = useGameStore(s => s.dispatchXP);
  const todayStr = new Date().toISOString().split('T')[0];
  const todayDow = new Date().getDay();

  const [isWorkoutStarted, setIsWorkoutStarted] = useState(false);

  const todayWorkoutPlan = plans.workout
    ? (plans.workout[todayDow] || plans.workout[String(todayDow)] || plans.workoutPlan?.[todayDow] || plans.workoutPlan?.[String(todayDow)])
    : null;

  return (
    <div className={compact ? 'space-y-4' : 'space-y-6 pb-20'}>
      <div className="card-glass p-6 relative overflow-hidden flex flex-col justify-between min-h-[400px]">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
            <span className="p-1.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl">
              <Dumbbell size={16} />
            </span>
            Treino do Dia (A Forja)
          </h3>
          <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-xl">
            Sessão de Força
          </span>
        </div>

        {!isWorkoutStarted ? (
          <div className="space-y-5">
            {(!todayWorkoutPlan || !todayWorkoutPlan.exercises || todayWorkoutPlan.exercises.length === 0) ? (
              <div className="p-8 rounded-2xl bg-black/30 border-2 border-dashed border-amber-500/30 text-center space-y-3 my-2">
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 mx-auto flex items-center justify-center">
                  <Dumbbell size={24} />
                </div>
                <div>
                  <h4 className="text-sm font-black text-white uppercase tracking-wider">Nenhum treino planeado para hoje</h4>
                  <p className="text-xs text-gray-400 mt-1 max-w-xs mx-auto">Configure o plano de treino na aba Config.</p>
                </div>
              </div>
            ) : (
              <>
                <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-950/20 via-black to-black border border-amber-500/30 flex items-center justify-between">
                  <div>
                    <h4 className="text-base font-black text-white uppercase tracking-wider">{todayWorkoutPlan?.label || 'Treino de Força Diário'}</h4>
                    <p className="text-xs text-gray-400 mt-1 font-mono">{todayWorkoutPlan?.exercises?.length || 0} exercícios programados</p>
                  </div>
                  <span className="text-3xl">🔥</span>
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {(todayWorkoutPlan?.exercises || []).map((ex, idx) => (
                    <div key={ex.id || idx} className="p-3 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between text-xs">
                      <span className="font-bold text-white uppercase tracking-wide">{ex.name}</span>
                      <span className="font-mono text-[10px] text-amber-400 font-black">{ex.sets}x{ex.reps} • {ex.carga || 'Base'}</span>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => setIsWorkoutStarted(true)}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-rose-500 to-amber-500 hover:from-amber-400 hover:to-rose-400 text-black text-xs font-black uppercase tracking-widest transition-all active:scale-95 shadow-xl flex items-center justify-center gap-2 cursor-pointer shadow-amber-900/30"
                >
                  <Play size={16} fill="currentColor" /> Iniciar Treino de Hoje
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <span className="text-xs font-black text-amber-400 uppercase tracking-wider flex items-center gap-2">
                <Sparkles size={14} className="animate-spin" /> Sessão de Treino em Execução
              </span>
              <button onClick={() => setIsWorkoutStarted(false)} className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white text-xs cursor-pointer">
                <X size={14} /> Fechar
              </button>
            </div>
            <WorkoutTracker />
            <button
              onClick={() => {
                setIsWorkoutStarted(false);
                const xpKey = `workout_completed_${todayStr}`;
                if (canClaimXP(xpKey)) {
                  markXPClaimed(xpKey);
                  dispatchXP('health', XP_WORKOUT, 'forca');
                  toast.success(`Treino concluído com sucesso! +${XP_WORKOUT} XP 🔥💪`, {
                    duration: 5000,
                    style: { background: '#1e1b4b', color: '#f43f5e', border: '1px solid #f43f5e33', fontSize: '14px', fontWeight: 'bold' },
                  });
                } else {
                  toast.success(`Sessão de treino encerrada!`, { icon: '💪' });
                }
              }}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white font-black text-xs uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-emerald-900/30 flex justify-center items-center gap-2 cursor-pointer mt-4"
            >
              🏆 Concluir Treino & Resgatar XP
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default TreinoView;
