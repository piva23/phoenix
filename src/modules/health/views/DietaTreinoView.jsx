import { useState, useMemo } from 'react';
import { useHealthStore, FOOD_DB } from '../../../stores/useHealthStore';
import { useGameStore } from '../../../stores/useGameStore';
import { WorkoutTracker } from '../components/WorkoutTracker';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import toast from 'react-hot-toast';
import { Utensils, Dumbbell, Play, Sparkles, X } from 'lucide-react';

const XP = { MEAL: 5, WORKOUT: 50 };

export function DietaTreinoView() {
  const {
    plans = {},
    mealLog = {},
    addLog,
    recalcStreaks,
    canClaimXP,
    markXPClaimed,
  } = useHealthStore();

  const dispatchXP = useGameStore(s => s.dispatchXP);
  const todayStr = new Date().toISOString().split('T')[0];
  const todayDow = new Date().getDay();

  const [isWorkoutStarted, setIsWorkoutStarted] = useState(false);

  // ── DIETA / MACROS ────────────────────────────────────────────────
  const todayMealLogs = mealLog[todayStr] || [];
  const dayGoalKcal = plans.goals?.caloriesDaily || 2000;

  const activeFoodDb = useMemo(() => ({ ...(FOOD_DB || {}), ...(plans.foodDb || {}) }), [plans.foodDb]);

  const getRelationalMacros = (item) => {
    if (!item) return { name: 'Alimento', qty: 1, kcal: 0, prot: 0, carb: 0, fat: 0 };
    const foodInfo = item.foodKey ? activeFoodDb[item.foodKey] : null;
    const qty = item.qty !== undefined ? Number(item.qty) || 1 : 1;
    return {
      name: item.name || foodInfo?.name || item.foodKey || 'Alimento',
      qty,
      kcal: Math.round(item.kcal !== undefined ? item.kcal : ((foodInfo?.kcal || 0) * qty)),
      prot: Math.round(item.prot !== undefined ? item.prot : ((foodInfo?.prot || 0) * qty)),
      carb: Math.round(item.carb !== undefined ? item.carb : ((foodInfo?.carb || 0) * qty)),
      fat: Math.round(item.fat !== undefined ? item.fat : ((foodInfo?.fat || 0) * qty)),
    };
  };

  const todayMacros = useMemo(() => {
    let kcal = 0, prot = 0, carb = 0, fat = 0;
    todayMealLogs.forEach(log => {
      kcal += Number(log.kcal) || 0;
      prot += Number(log.prot) || 0;
      carb += Number(log.carb) || 0;
      fat += Number(log.fat) || 0;
    });
    return { kcal: Math.round(kcal), prot: Math.round(prot), carb: Math.round(carb), fat: Math.round(fat) };
  }, [todayMealLogs]);

  const pieData = useMemo(() => {
    const hasData = todayMacros.prot > 0 || todayMacros.carb > 0 || todayMacros.fat > 0;
    if (!hasData) {
      return [
        { name: 'Proteínas', value: 30, color: '#10B98133', grams: 0 },
        { name: 'Carboidratos', value: 45, color: '#38BDF833', grams: 0 },
        { name: 'Gorduras', value: 25, color: '#F59E0B33', grams: 0 },
      ];
    }
    return [
      { name: 'Proteínas', value: todayMacros.prot * 4, color: '#10B981', grams: todayMacros.prot },
      { name: 'Carboidratos', value: todayMacros.carb * 4, color: '#38BDF8', grams: todayMacros.carb },
      { name: 'Gorduras', value: todayMacros.fat * 9, color: '#F59E0B', grams: todayMacros.fat },
    ];
  }, [todayMacros]);

  const handleQuickLogMealItem = (meal, item) => {
    const macros = getRelationalMacros(item);
    addLog('meal', {
      name: macros.name,
      icon: meal.icon || '🍽️',
      kcal: macros.kcal,
      prot: macros.prot,
      carb: macros.carb,
      fat: macros.fat,
    });
    recalcStreaks();
    const xpKey = `food_${item.id || item.foodKey || Date.now()}_${todayStr}_${Date.now()}`;
    if (canClaimXP(xpKey)) {
      markXPClaimed(xpKey);
      dispatchXP('health', XP.MEAL, 'disciplina');
    }
    toast.success(`${macros.name} consumido! +5 XP 🍳`, {
      style: { background: '#061c15', color: '#10B981', border: '1px solid #10B98133' },
    });
  };

  // ── TREINO ─────────────────────────────────────────────────────────
  const todayWorkoutPlan = plans.workout
    ? (plans.workout[todayDow] || plans.workout[String(todayDow)] || plans.workoutPlan?.[todayDow] || plans.workoutPlan?.[String(todayDow)])
    : null;

  return (
    <div className="space-y-6 pb-20">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* ── DIETA ── */}
        <div className="card-glass p-6 relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
              <span className="p-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl">
                <Utensils size={16} />
              </span>
              Dieta & Macros de Hoje
            </h3>
            <span className="text-[10px] font-black text-emerald-400 font-mono bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-xl">
              {todayMacros.kcal} / {dayGoalKcal} kcal
            </span>
          </div>

          {/* Donut */}
          <div className="flex flex-col sm:flex-row items-center justify-around gap-4 my-4 p-3 bg-black/30 border border-white/5 rounded-2xl">
            <div className="w-36 h-36 relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={42} outerRadius={58} paddingAngle={4} dataKey="value">
                    {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: '#090d16', border: '1px solid #ffffff15', borderRadius: '12px' }}
                    itemStyle={{ color: '#ffffff', fontSize: '11px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-[8px] text-gray-500 font-bold uppercase tracking-widest">INGESTÃO</span>
                <span className="text-base font-black text-white tracking-tight">{todayMacros.kcal}</span>
                <span className="text-[8px] text-gray-400 font-medium">kcal</span>
              </div>
            </div>

            <div className="space-y-2 flex-1 w-full max-w-xs">
              <div className="flex items-center justify-between p-2 rounded-xl bg-black/40 border border-white/5">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-md bg-emerald-500" />
                  <span className="text-xs font-black text-gray-300 uppercase">Proteínas</span>
                </div>
                <span className="text-xs font-mono font-black text-white">{todayMacros.prot}g</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-xl bg-black/40 border border-white/5">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-md bg-sky-400" />
                  <span className="text-xs font-black text-gray-300 uppercase">Carboidratos</span>
                </div>
                <span className="text-xs font-mono font-black text-white">{todayMacros.carb}g</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-xl bg-black/40 border border-white/5">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-md bg-amber-500" />
                  <span className="text-xs font-black text-gray-300 uppercase">Gorduras</span>
                </div>
                <span className="text-xs font-mono font-black text-white">{todayMacros.fat}g</span>
              </div>
            </div>
          </div>

          {/* Refeições */}
          <div className="space-y-3 mt-4">
            <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest block">
              Refeições Planejadas de Hoje (Clique para consumir):
            </span>
            {(plans.mealPlan || []).length === 0 ? (
              <div className="p-6 rounded-2xl bg-black/30 border-2 border-dashed border-emerald-500/30 text-center space-y-3 my-2">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center">
                  <Utensils size={20} />
                </div>
                <div>
                  <h4 className="text-xs font-black text-white uppercase tracking-wider">A sua dieta não está configurada</h4>
                  <p className="text-[11px] text-gray-400 mt-0.5">Configure as refeições na aba Config.</p>
                </div>
              </div>
            ) : (
              (plans.mealPlan || []).map((meal, mIdx) => (
                <div key={meal.id || mIdx} className="p-3.5 rounded-2xl bg-black/30 border border-white/5 space-y-2">
                  <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <span className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                      <span>{meal.icon || '🍽️'}</span> {meal.label}
                    </span>
                    <span className="text-[10px] font-mono font-bold text-emerald-400">⏰ {meal.time || '12:00'}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {(meal.items || []).map((item, iIdx) => {
                      const macros = getRelationalMacros(item);
                      return (
                        <button
                          key={item.id || item.foodKey || iIdx}
                          onClick={() => handleQuickLogMealItem(meal, item)}
                          className="p-2.5 rounded-xl bg-black/40 hover:bg-emerald-500/15 border border-white/5 hover:border-emerald-500/30 text-left transition-all active:scale-95 flex items-center justify-between cursor-pointer group"
                        >
                          <div>
                            <span className="text-xs font-bold text-gray-200 group-hover:text-emerald-300 block">{macros.name}</span>
                            <span className="text-[9px] font-mono text-gray-500 block">
                              ~{macros.kcal} kcal • {macros.prot}g P / {macros.carb}g C / {macros.fat}g G
                            </span>
                          </div>
                          <span className="text-[9px] font-black uppercase text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">+ CONSUMIR</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ── TREINO ── */}
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
                    dispatchXP('health', XP.WORKOUT, 'forca');
                    toast.success(`Treino concluído com sucesso! +${XP.WORKOUT} XP 🔥💪`, {
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
    </div>
  );
}

export default DietaTreinoView;