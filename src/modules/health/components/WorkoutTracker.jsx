import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useHealthStore } from '../../../stores/useHealthStore';
import { useGameStore } from '../../../stores/useGameStore';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

function getExerciseIcon(name) {
  const n = name.toLowerCase();
  if (n.includes('supino') || n.includes('peito')) return '🏋️‍♂️';
  if (n.includes('agachamento') || n.includes('perna') || n.includes('leg')) return '🦵';
  if (n.includes('rosca') || n.includes('bíceps') || n.includes('biceps')) return '💪';
  if (n.includes('tríceps') || n.includes('triceps')) return '🦾';
  if (n.includes('remada') || n.includes('costas') || n.includes('puxada')) return '🦍';
  if (n.includes('ombro') || n.includes('desenvolvimento') || n.includes('elevação')) return '🏋️‍♀️';
  if (n.includes('abs') || n.includes('prancha') || n.includes('abdominal')) return '🍫';
  if (n.includes('corrida') || n.includes('esteira') || n.includes('cardio')) return '🏃‍♂️';
  return '⚡';
}

const DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const THEME_COLOR = '#8B5CF6';

// ── ExerciseItem (componente externo, memorizado) ────────────────────────────
const ExerciseItem = React.memo(function ExerciseItem({ ex, updateTicket }) {
  const getSetsListToday = useHealthStore(s => s.getSetsListToday);
  const updateWorkoutSet = useHealthStore(s => s.updateWorkoutSet);
  const addExtraWorkoutSet = useHealthStore(s => s.addExtraWorkoutSet);
  const removeWorkoutSet = useHealthStore(s => s.removeWorkoutSet);
  const canClaimXP = useHealthStore(s => s.canClaimXP);
  const markXPClaimed = useHealthStore(s => s.markXPClaimed);
  const recalcStreaks = useHealthStore(s => s.recalcStreaks);
  const dispatchXP = useGameStore(s => s.dispatchXP);

  const sets = getSetsListToday(ex.id, ex.sets, ex.reps);

  const [localInputs, setLocalInputs] = useState(() =>
    sets.map(s => ({ peso: s.peso || '', reps: s.reps || '' }))
  );

  useEffect(() => {
    setLocalInputs(sets.map(s => ({ peso: s.peso || '', reps: s.reps || '' })));
  }, [updateTicket, sets.length]);

  const handleLocalChange = useCallback((idx, field, value) => {
    setLocalInputs(prev => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [field]: value };
      return copy;
    });
    updateWorkoutSet(ex.id, idx, { [field]: Number(value) || 0 });
  }, [ex.id, updateWorkoutSet]);

  const handleToggleCheck = useCallback((idx) => {
    const setItem = sets[idx];
    const isChecking = !setItem.done;
    const weightVal = Number(localInputs[idx]?.peso) || 0;
    const repsVal = Number(localInputs[idx]?.reps) || 0;

    updateWorkoutSet(ex.id, idx, { done: isChecking, peso: weightVal, reps: repsVal });
    recalcStreaks();

    if (isChecking) {
      const xpKey = `set_${ex.id}_set_${idx}_${new Date().toISOString().split('T')[0]}`;
      if (canClaimXP(xpKey)) {
        markXPClaimed(xpKey);
        dispatchXP('health', 5, 'forca');
        toast.success(`Série ${idx + 1} Concluída! +5 XP 🚀`, {
          style: { background: '#1e293b', color: '#fff', border: `1px solid ${THEME_COLOR}44` },
        });
      }
    }
  }, [ex.id, sets, localInputs, updateWorkoutSet, recalcStreaks, canClaimXP, markXPClaimed, dispatchXP]);

  const handleAddExtra = useCallback(() => {
    const lastSet = sets[sets.length - 1] || { peso: 10, reps: 10 };
    addExtraWorkoutSet(ex.id, lastSet.peso || 0, lastSet.reps || 10);
    recalcStreaks();
    toast.success('Série Extra Adicionada! 💪');
  }, [ex.id, sets, addExtraWorkoutSet, recalcStreaks]);

  const handleRemoveSet = useCallback((idx) => {
    removeWorkoutSet(ex.id, idx);
    recalcStreaks();
    toast.error('Série Removida.');
  }, [ex.id, removeWorkoutSet, recalcStreaks]);

  const completedCount = sets.filter(s => s.done).length;
  const isCompletedAll = completedCount >= ex.sets;

  return (
    <div
      className="rounded-3xl border transition-all duration-300 overflow-hidden"
      style={{
        background: 'var(--bg-surface-2)',
        borderColor: isCompletedAll ? `${THEME_COLOR}44` : 'var(--border)',
        boxShadow: isCompletedAll ? `0 8px 24px ${THEME_COLOR}10` : 'none',
      }}
    >
      {/* Header */}
      <div className="p-4 bg-black/10 border-b border-gray-800 flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-black/30 border border-gray-800 flex items-center justify-center text-xl shadow-inner">
          {getExerciseIcon(ex.name)}
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-black text-white leading-tight uppercase tracking-wide">{ex.name}</h4>
          <p className="text-[10px] text-gray-500 font-bold mt-0.5 uppercase tracking-wider">
            Meta: <span className="text-gray-300">{ex.sets}x{ex.reps}</span> {ex.note ? `• ${ex.note}` : ''}
          </p>
        </div>
        {isCompletedAll && (
          <span className="text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full text-white shadow-sm flex items-center gap-1" style={{ background: THEME_COLOR }}>
            ✓ CONCLUÍDO
          </span>
        )}
      </div>

      {/* Séries */}
      <div className="p-3 space-y-2">
        <div className="grid grid-cols-12 gap-2 text-center text-[9px] font-black text-gray-500 uppercase tracking-wider px-2 py-1">
          <span className="col-span-2 text-left">SÉRIE</span>
          <span className="col-span-4">PESO (KG)</span>
          <span className="col-span-4">REPS</span>
          <span className="col-span-2">FEITO</span>
        </div>

        <AnimatePresence initial={false}>
          {sets.map((set, idx) => {
            const isExtra = set.isExtra;
            const isCompleted = set.done;
            return (
              <motion.div
                key={set.id || idx}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="grid grid-cols-12 gap-2 items-center p-2 rounded-xl border transition-all"
                style={{
                  background: isCompleted ? `${THEME_COLOR}0b` : 'var(--bg-surface)',
                  borderColor: isCompleted ? `${THEME_COLOR}33` : 'var(--border)',
                }}
              >
                <div className="col-span-2 flex items-center gap-1">
                  {isExtra ? (
                    <span className="text-[9px] font-black text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded uppercase tracking-wider">EX</span>
                  ) : (
                    <span className="text-xs font-black text-gray-400 pl-1">{idx + 1}</span>
                  )}
                </div>
                <div className="col-span-4">
                  <input
                    type="number" step="any" placeholder="0" disabled={isCompleted}
                    value={localInputs[idx]?.peso ?? ''}
                    onChange={e => handleLocalChange(idx, 'peso', e.target.value)}
                    className="w-full bg-black/40 border border-gray-800 focus:border-purple-500 outline-none text-center py-1 rounded-lg text-xs font-black text-white disabled:opacity-50 transition-colors"
                  />
                </div>
                <div className="col-span-4">
                  <input
                    type="number" placeholder="0" disabled={isCompleted}
                    value={localInputs[idx]?.reps ?? ''}
                    onChange={e => handleLocalChange(idx, 'reps', e.target.value)}
                    className="w-full bg-black/40 border border-gray-800 focus:border-purple-500 outline-none text-center py-1 rounded-lg text-xs font-black text-white disabled:opacity-50 transition-colors"
                  />
                </div>
                <div className="col-span-2 flex items-center justify-center gap-1.5">
                  <button
                    onClick={() => handleToggleCheck(idx)}
                    className="w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all cursor-pointer hover:scale-105 active:scale-95"
                    style={{ borderColor: isCompleted ? THEME_COLOR : 'var(--border)', background: isCompleted ? THEME_COLOR : 'transparent' }}
                  >
                    {isCompleted && <span className="text-white text-[10px] font-black">✓</span>}
                  </button>
                  {isExtra && !isCompleted && (
                    <button
                      onClick={() => handleRemoveSet(idx)}
                      className="w-5 h-5 flex items-center justify-center text-red-400 bg-red-500/10 hover:bg-red-500/20 rounded-full text-[9px] transition-all ml-1"
                    >✕</button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        <button
          onClick={handleAddExtra}
          className="w-full py-2.5 mt-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-dashed transition-all active:scale-98 flex items-center justify-center gap-1.5"
          style={{ borderColor: `${THEME_COLOR}44`, color: THEME_COLOR, background: `${THEME_COLOR}05` }}
        >
          <span className="text-sm leading-none">+</span> Série Extra
        </button>
      </div>
    </div>
  );
});

// ── WorkoutTracker (componente principal) ────────────────────────────────────
export function WorkoutTracker() {
  const plans = useHealthStore(s => s.plans || {});
  const todayDow = new Date().getDay();
  const [selectedDow, setSelectedDow] = useState(todayDow);
  const dayPlan = plans.workout ? plans.workout[selectedDow] : null;
  const [updateTicket, setUpdateTicket] = useState(0);

  return (
    <div className="space-y-5">
      {/* Day selector */}
      <div className="flex gap-1 bg-black/30 p-1.5 rounded-2xl overflow-x-auto border border-gray-800 scrollbar-none">
        {DAYS.map((d, i) => (
          <button
            key={i}
            onClick={() => setSelectedDow(i)}
            className="flex-1 min-w-[42px] py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all relative overflow-hidden"
            style={{
              background: selectedDow === i ? THEME_COLOR : 'transparent',
              color: selectedDow === i ? '#fff' : 'var(--text-dim)',
            }}
          >
            {selectedDow === i && (
              <motion.div layoutId="activeDowGlow" className="absolute inset-0 opacity-20 pointer-events-none"
                style={{ background: 'radial-gradient(circle, #fff 0%, transparent 80%)' }}
              />
            )}
            {d}
          </button>
        ))}
      </div>

      {/* Plan display */}
      {!dayPlan ? (
        <div className="text-center py-12 bg-black/20 rounded-3xl border border-dashed border-gray-800">
          <div className="text-5xl mb-3 drop-shadow-md">😴</div>
          <p className="text-base font-black text-gray-400 uppercase tracking-widest">Dia de Descanso</p>
          <p className="text-xs text-gray-500 mt-2 font-bold max-w-xs mx-auto leading-relaxed">
            O músculo reconstrói nas horas de repouso. Hidrate-se e se alimente bem hoje!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <h3 className="text-base font-black text-white uppercase tracking-widest">{dayPlan.label}</h3>
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
              {dayPlan.exercises?.length || 0} EXERCÍCIOS
            </span>
          </div>
          <div className="space-y-4">
            {dayPlan.exercises?.map(ex => (
              <ExerciseItem key={ex.id} ex={ex} updateTicket={updateTicket} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
