import { useState, useEffect } from 'react';
import { useHealthStore, FOOD_DB } from '../../../stores/useHealthStore';
import { useProjectStore } from '../../../stores/useProjectStore';
import { useXPStore } from '../../../stores/useXPStore';
import { useUserStore } from '../../../stores/useUserStore';
import { usePersonaStore } from '../../../stores/usePersonaStore';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const XP = { WATER: 20, HABIT: 50, MED: 10, WORKOUT: 50, MEAL: 5, CIRCUIT: 15 };
const DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

// Dicionário visual de treinos baseado no nome
function getExerciseIcon(name) {
  const n = name.toLowerCase();
  if (n.includes('supino') || n.includes('peito')) return '🏋️‍♂️';
  if (n.includes('agachamento') || n.includes('perna') || n.includes('leg'))
    return '🦵';
  if (n.includes('rosca') || n.includes('bíceps') || n.includes('biceps'))
    return '💪';
  if (n.includes('tríceps') || n.includes('triceps')) return '🦾';
  if (n.includes('remada') || n.includes('costas') || n.includes('puxada'))
    return '🦍';
  if (
    n.includes('ombro') ||
    n.includes('desenvolvimento') ||
    n.includes('elevação')
  )
    return '🏋️‍♀️';
  if (n.includes('abs') || n.includes('prancha') || n.includes('abdominal'))
    return '🍫';
  if (n.includes('corrida') || n.includes('esteira') || n.includes('cardio'))
    return '🏃‍♂️';
  return '⚡';
}

function mlToL(ml) {
  return ml >= 1000 ? `${(ml / 1000).toFixed(1)}L` : `${ml}ml`;
}

// ── COMPONENTES DE BASE ───────────────────────────────────────────────────────
function SectionCard({
  title,
  icon,
  children,
  accent,
  bg = 'var(--bg-surface)',
  glow = false,
}) {
  return (
    <div
      className="rounded-3xl overflow-hidden mb-5 transition-all duration-500"
      style={{
        background: bg,
        border: `1px solid ${glow ? accent : 'var(--border)'}`,
        boxShadow: glow ? `0 0 20px ${accent}40` : 'none',
      }}
    >
      <div
        className="flex items-center gap-2 px-5 py-4 border-b"
        style={{
          borderColor: glow ? `${accent}40` : 'var(--border)',
          borderLeft: `4px solid ${accent}`,
        }}
      >
        <span className="text-xl">{icon}</span>
        <span className="font-black text-sm uppercase tracking-widest text-text-main">
          {title}
        </span>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

// ── 1. SOBRIEDADE (O MAU HÁBITO) ──────────────────────────────────────────────
function SobrietyCard() {
  const {
    plans = {},
    logHabit,
    getHabitLogToday,
    recalcStreaks,
  } = useHealthStore();
  const quits = plans.habits?.filter(h => h.type === 'quit') || [];
  if (quits.length === 0) return null;

  return (
    <div className="space-y-4 mb-5">
      {quits.map(q => {
        const isFail = getHabitLogToday(q.id) === false;
        return (
          <div
            key={q.id}
            className="flex flex-col items-center justify-center p-6 rounded-3xl border-2 transition-all text-center relative overflow-hidden"
            style={{
              background: isFail
                ? '#450a0a'
                : 'linear-gradient(145deg, #2a0808, #000000)',
              borderColor: isFail ? '#ef4444' : '#ef444440',
            }}
          >
            <div className="absolute -right-4 -bottom-4 text-9xl opacity-5 pointer-events-none">
              {q.icon}
            </div>
            <span className="text-5xl mb-3 drop-shadow-lg">{q.icon}</span>
            <span className="text-xl font-black text-red-100 uppercase tracking-widest mb-2">
              {q.name}
            </span>
            {!isFail ? (
              <div className="mt-5 w-full p-4 bg-black/50 rounded-2xl border border-red-900/50 backdrop-blur-sm">
                <p className="text-[10px] text-red-200 font-bold uppercase tracking-wider mb-4 leading-relaxed">
                  Dias limpos constroem sua nova identidade.
                </p>
                <button
                  onClick={() => {
                    if (
                      window.confirm(
                        'Tem certeza? Isso vai zerar a sua ofensiva de ' +
                          q.name +
                          '.'
                      )
                    ) {
                      logHabit(q.id, false);
                      recalcStreaks();
                      toast.error('Ofensiva destruída.', { icon: '🐍' });
                    }
                  }}
                  className="w-full py-4 rounded-xl border border-red-500/50 text-red-400 font-black text-xs uppercase tracking-widest bg-red-500/10 hover:bg-red-500/20 active:scale-95 transition-all"
                >
                  Registrar Recaída
                </button>
              </div>
            ) : (
              <div className="mt-6 p-4 bg-red-950/50 rounded-2xl border border-red-500/30 w-full">
                <div className="text-sm text-red-400 font-black mb-1 uppercase tracking-widest">
                  Ofensiva Quebrada ❌
                </div>
                <p className="text-xs text-red-200">
                  Você volta ao jogo amanhã. Não desista.
                </p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── 2. VIRTUDES E REMÉDIOS (CHECKLIST COMPACTO) ───────────────────────────────
function VirtuesAndMedsCard() {
  const {
    plans = {},
    logHabit,
    getHabitLogToday,
    logMed,
    isMedDoneToday,
    canClaimXP,
    markXPClaimed,
    recalcStreaks,
  } = useHealthStore();
  const { logXP } = useXPStore();
  const { addXP } = useUserStore();
  const activePersonaId = usePersonaStore(s => s.activePersonaId);

  const builds = plans.habits?.filter(h => h.type === 'build') || [];
  const meds = plans.meds || [];
  if (builds.length === 0 && meds.length === 0) return null;

  return (
    <SectionCard title="Checklist Diário" icon="✅" accent="#10B981">
      <div className="space-y-2">
        {builds.map(h => {
          const done = getHabitLogToday(h.id);
          return (
            <button
              key={h.id}
              onClick={() => {
                logHabit(h.id, !done);
                recalcStreaks();
                if (!done && canClaimXP(`habit_${h.id}`)) {
                  markXPClaimed(`habit_${h.id}`);
                  logXP({
                    action: 'HABIT',
                    xp: XP.HABIT,
                    moduleOrigin: 'health',
                    radarAxis: 'disciplina',
                  });
                  addXP(XP.HABIT);
                  toast.success(`+${XP.HABIT} XP`);
                }
              }}
              className="w-full flex items-center justify-between p-3 rounded-xl border transition-all active:scale-95 text-left"
              style={{
                background: done ? '#10B98115' : 'var(--bg-surface-2)',
                borderColor: done ? '#10B981' : 'var(--border)',
              }}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-lg bg-black/20 border border-white/5">
                  {h.icon}
                </div>
                <span
                  className="text-sm font-bold"
                  style={{ color: done ? '#10B981' : 'var(--text-main)' }}
                >
                  {h.name}
                </span>
              </div>
              <div
                className="w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all"
                style={{
                  borderColor: done ? '#10B981' : 'var(--border)',
                  background: done ? '#10B981' : 'transparent',
                }}
              >
                {done && (
                  <span className="text-white text-[10px] font-black">✓</span>
                )}
              </div>
            </button>
          );
        })}
        {meds.map(m => {
          const done = isMedDoneToday(m.id);
          return (
            <button
              key={m.id}
              onClick={() => {
                logMed(m.id, !done);
                if (!done && canClaimXP(`med_${m.id}`)) {
                  markXPClaimed(`med_${m.id}`);
                  addXP(XP.MED);
                  toast.success(`+${XP.MED} XP`, { icon: '💊' });
                }
              }}
              className="w-full flex items-center justify-between p-3 rounded-xl border transition-all active:scale-95 text-left"
              style={{
                background: done ? '#8B5CF615' : 'var(--bg-surface-2)',
                borderColor: done ? '#8B5CF6' : 'var(--border)',
              }}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-lg bg-black/20 border border-white/5">
                  {m.icon || '💊'}
                </div>
                <div>
                  <div
                    className="text-sm font-bold leading-tight"
                    style={{ color: done ? '#8B5CF6' : 'var(--text-main)' }}
                  >
                    {m.name}
                  </div>
                  <div className="text-[10px] text-gray-500 uppercase tracking-widest">
                    {m.time}
                  </div>
                </div>
              </div>
              <div
                className="w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all"
                style={{
                  borderColor: done ? '#8B5CF6' : 'var(--border)',
                  background: done ? '#8B5CF6' : 'transparent',
                }}
              >
                {done && (
                  <span className="text-white text-[10px] font-black">✓</span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </SectionCard>
  );
}

// ── 3. ÁGUA (COM HIGHLIGHT MÁXIMO E DOPAMINA) ─────────────────────────────────
function WaterCard() {
  const {
    plans = {},
    addWater,
    removeLastWater,
    getTodayWaterMl,
    recalcStreaks,
  } = useHealthStore();
  const goal = plans.goals?.waterDailyMl || 3500;
  const total = getTodayWaterMl();
  const pct = Math.min(100, (total / goal) * 100);
  const goalHit = total >= goal;

  if (goalHit) {
    return (
      <SectionCard
        title="Hidratação"
        icon="💧"
        accent="#38BDF8"
        glow={true}
        bg="#0369a122"
      >
        <div className="flex flex-col items-center justify-center py-6 text-center transition-all">
          <div className="text-7xl mb-4 drop-shadow-[0_0_15px_rgba(56,189,248,0.8)]">
            🏆
          </div>
          <h3 className="text-2xl font-black text-sky-400 uppercase tracking-widest mb-1">
            Meta Atingida!
          </h3>
          <p className="text-sm text-sky-200 font-bold mb-6">
            {mlToL(total)} bebidos. Corpo 100% Hidratado.
          </p>
          <button
            onClick={() => {
              removeLastWater();
              recalcStreaks();
            }}
            className="px-5 py-2.5 rounded-xl bg-sky-900/50 text-sky-300 text-xs font-bold border border-sky-700/50 active:scale-95 transition-all"
          >
            Desfazer Último Gole
          </button>
        </div>
      </SectionCard>
    );
  }

  return (
    <SectionCard title="Hidratação" icon="💧" accent="#38BDF8">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-3xl font-black">{mlToL(total)}</div>
          <div className="text-xs text-text-dim font-bold uppercase tracking-widest mt-1">
            Faltam {mlToL(goal - total)}
          </div>
        </div>
        {total > 0 && (
          <button
            onClick={() => {
              removeLastWater();
              recalcStreaks();
            }}
            className="text-xs font-bold text-red-400 px-3 py-1.5 bg-red-500/10 rounded-lg hover:bg-red-500/20 transition-all"
          >
            ↺ Desfazer
          </button>
        )}
      </div>
      <div className="w-full h-3 bg-gray-900 rounded-full mb-6 overflow-hidden border border-gray-800">
        <div
          className="h-full bg-sky-400 transition-all duration-700 rounded-full shadow-[0_0_10px_rgba(56,189,248,0.6)]"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex gap-2 overflow-x-auto pb-2 snap-x">
        {plans.water?.buttons?.map((b, i) => (
          <button
            key={i}
            onClick={() => {
              addWater(b.ml);
              recalcStreaks();
            }}
            className="snap-center flex-1 min-w-[80px] py-4 bg-gray-800 border-2 border-gray-700 hover:border-sky-500 hover:bg-gray-700 rounded-2xl text-sm font-black active:scale-95 transition-all text-white shadow-lg"
          >
            {b.label}
          </button>
        ))}
      </div>
    </SectionCard>
  );
}

// ── 4. TREINO (COM ÍCONES INTELIGENTES E BIG BUTTONS) ─────────────────────────
function WorkoutCard() {
  const {
    plans = {},
    addSet,
    removeSet,
    getSetsToday,
    canClaimXP,
    markXPClaimed,
    recalcStreaks,
  } = useHealthStore();
  const { addXP } = useUserStore();
  const todayDow = new Date().getDay();
  const [selectedDow, setSelectedDow] = useState(todayDow);
  const dayPlan = plans.workout ? plans.workout[selectedDow] : null;

  const handleSet = ex => {
    addSet(ex.id);
    recalcStreaks();
    const current = getSetsToday(ex.id) + 1;
    if (current <= ex.sets && canClaimXP(`set_${ex.id}_${current}`)) {
      markXPClaimed(`set_${ex.id}_${current}`);
      addXP(5);
    }
  };

  return (
    <SectionCard title="Musculação" icon="🏋️" accent="#A855F7">
      <div className="flex gap-1 mb-6 bg-black/30 p-1.5 rounded-2xl overflow-x-auto border border-gray-800">
        {DAYS.map((d, i) => (
          <button
            key={i}
            onClick={() => setSelectedDow(i)}
            className="flex-1 min-w-[40px] py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all"
            style={{
              background: selectedDow === i ? '#A855F7' : 'transparent',
              color: selectedDow === i ? '#fff' : 'var(--text-dim)',
              boxShadow:
                selectedDow === i ? '0 4px 10px rgba(168,85,247,0.4)' : 'none',
            }}
          >
            {d}
          </button>
        ))}
      </div>

      {!dayPlan ? (
        <div className="text-center py-10 bg-black/20 rounded-3xl border border-dashed border-gray-700">
          <div className="text-5xl mb-3">😴</div>
          <p className="text-lg font-black text-gray-400">Dia de Descanso</p>
          <p className="text-xs text-gray-500 mt-2 font-bold">
            O músculo cresce no descanso.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <h4 className="text-base font-black text-purple-400 mb-4 uppercase tracking-widest px-2">
            {dayPlan.label}
          </h4>
          {dayPlan.exercises.map(ex => {
            const done = getSetsToday(ex.id);
            const meta = ex.sets;
            const totalDots = Math.max(meta, done);
            const icon = getExerciseIcon(ex.name);

            const dots = Array.from({ length: totalDots }).map((_, i) => {
              const isCompleted = i < done;
              const isBeyondMeta = i >= meta;
              let bg = 'var(--bg-surface)';
              if (isCompleted && !isBeyondMeta) bg = '#A855F7';
              if (isCompleted && isBeyondMeta) bg = '#F59E0B';
              return (
                <div
                  key={i}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-sm border-2 transition-all shadow-inner"
                  style={{
                    background: bg,
                    borderColor: isCompleted ? 'transparent' : 'var(--border)',
                    color: '#fff',
                  }}
                >
                  {isBeyondMeta && isCompleted ? '🚀' : ''}
                </div>
              );
            });

            return (
              <div
                key={ex.id}
                className="p-4 rounded-3xl border-2 bg-gray-900/50 flex flex-col gap-4 transition-colors"
                style={{
                  borderColor: done >= meta ? '#A855F766' : 'var(--border)',
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-black/40 border border-gray-700 flex items-center justify-center text-2xl">
                    {icon}
                  </div>
                  <div className="flex-1">
                    <span className="text-base font-black text-white block leading-tight">
                      {ex.name}
                    </span>
                    <span className="inline-block mt-1 text-[10px] font-black text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded uppercase tracking-widest">
                      {ex.reps} reps
                    </span>
                  </div>
                  {done > 0 && (
                    <button
                      onClick={() => {
                        removeSet(ex.id);
                        recalcStreaks();
                      }}
                      className="w-10 h-10 rounded-xl bg-red-500/10 text-red-400 text-xl font-bold hover:bg-red-500/20 active:scale-95 transition-all border border-red-500/20"
                    >
                      -
                    </button>
                  )}
                </div>
                <div className="flex gap-2 overflow-x-auto py-1">{dots}</div>
                <button
                  onClick={() => handleSet(ex)}
                  className="w-full py-4 rounded-2xl bg-purple-600 text-white font-black text-sm uppercase tracking-widest hover:bg-purple-500 active:scale-95 transition-all shadow-[0_4px_15px_rgba(168,85,247,0.4)] flex justify-center items-center gap-2"
                >
                  <span className="text-xl leading-none mb-0.5">+</span> SÉRIE
                </button>
              </div>
            );
          })}
        </div>
      )}
    </SectionCard>
  );
}

// ── 5. CIRCUITOS RÁPIDOS ──────────────────────────────────────────────────────
function CircuitsCard() {
  const {
    plans = {},
    circuitLog = {},
    addLog,
    undoLog,
    canClaimXP,
    markXPClaimed,
  } = useHealthStore();
  const { addXP } = useUserStore();
  const today = new Date().toISOString().split('T')[0];
  const logs = circuitLog[today] || [];
  if (!plans.circuits || plans.circuits.length === 0) return null;

  return (
    <SectionCard title="Circuitos Rápidos" icon="⏱️" accent="#EF4444">
      <div className="space-y-4 mb-4">
        {plans.circuits.map(circuit => (
          <div
            key={circuit.id}
            className="p-4 border-2 border-gray-800 rounded-3xl bg-gray-900/50 flex flex-col gap-4"
          >
            <div className="flex justify-between items-center border-b border-gray-800 pb-3">
              <div>
                <div className="text-lg font-black text-red-400 uppercase tracking-widest flex items-center gap-2">
                  {circuit.icon} {circuit.name}
                </div>
                <div className="text-xs font-bold text-gray-500 mt-1">
                  {circuit.rounds} rounds
                </div>
              </div>
            </div>

            {/* Lista visual de exercícios do circuito (Horizontal Scroll) */}
            <div className="flex gap-2 overflow-x-auto pb-2 snap-x">
              {circuit.movements?.map((m, i) => (
                <div
                  key={i}
                  className="snap-center min-w-[100px] bg-black/40 border border-gray-800 rounded-xl p-3 flex flex-col items-center justify-center text-center"
                >
                  <div className="text-xs font-bold text-gray-300">
                    {m.name}
                  </div>
                  <div className="text-[10px] text-red-400 font-black mt-1 uppercase">
                    {m.reps ? `${m.reps}x` : `${m.timeSec}s`}
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => {
                addLog('circuit', { name: circuit.name });
                if (canClaimXP(`circuit_${circuit.id}_${logs.length}`)) {
                  markXPClaimed(`circuit_${circuit.id}_${logs.length}`);
                  addXP(XP.CIRCUIT);
                }
                toast.success(`Round concluído!`, { icon: '🔥' });
              }}
              className="w-full py-4 bg-red-600 text-white rounded-xl text-sm uppercase tracking-widest font-black active:scale-95 transition-all shadow-[0_4px_15px_rgba(239,68,68,0.4)]"
            >
              + REGISTRAR 1 ROUND
            </button>
          </div>
        ))}
      </div>
      {logs.length > 0 && (
        <div className="p-4 rounded-2xl border border-gray-800 bg-black/30 flex justify-between items-center">
          <span className="text-xs font-black text-gray-400 uppercase tracking-widest">
            Rounds Totais Hoje: {logs.length}
          </span>
          <button
            onClick={() => undoLog('circuit')}
            className="text-xs font-bold text-red-400 px-3 py-1.5 bg-red-500/10 rounded-lg"
          >
            ↺ Desfazer
          </button>
        </div>
      )}
    </SectionCard>
  );
}

// ── 6. DIETA (FOOD DECK ÁGIL - SEM HISTÓRICO POLUENTE) ────────────────────────
function DietCard() {
  const {
    plans = {},
    addLog,
    getTodayMacros,
    canClaimXP,
    markXPClaimed,
    recalcStreaks,
  } = useHealthStore();
  const { addXP } = useUserStore();
  const today = new Date().toISOString().split('T')[0];
  const macros = getTodayMacros();
  const meals = plans.meals || plans.mealPlan || [];
  const currentHour = new Date().getHours();

  return (
    <SectionCard title="Dieta" icon="🍽️" accent="#22C55E">
      <div className="mb-5 flex justify-between p-4 rounded-2xl bg-green-500/10 border border-green-500/20 items-center">
        <span className="text-xs font-black text-green-500 uppercase tracking-widest">
          Ingerido Hoje
        </span>
        <span className="text-base font-black text-green-400">
          {macros.kcal} <span className="text-[10px] text-green-600">KCAL</span>{' '}
          | {macros.prot}g{' '}
          <span className="text-[10px] text-green-600">PT</span>
        </span>
      </div>

      <div className="flex overflow-x-auto gap-4 pb-4 -mx-5 px-5 snap-x">
        {meals.map(meal => {
          const mealHour = parseInt(meal.time.split(':')[0], 10);
          const isActive =
            currentHour >= mealHour && currentHour <= mealHour + 2;

          return (
            <div
              key={meal.id}
              className="snap-center min-w-[260px] flex-shrink-0 p-4 rounded-3xl border-2"
              style={{
                background: 'var(--bg-surface-2)',
                borderColor: isActive ? '#22C55E' : 'var(--border)',
              }}
            >
              <div className="text-sm font-black mb-4 flex items-center gap-2 text-text-dim uppercase tracking-widest border-b border-gray-800 pb-3">
                {isActive && (
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_#22C55E]" />
                )}
                {meal.icon} {meal.label}{' '}
                <span className="ml-auto text-green-500 bg-green-500/10 px-2 py-0.5 rounded text-[10px]">
                  {meal.time}
                </span>
              </div>

              <div className="flex flex-col gap-2.5">
                {meal.items.map(item => {
                  const foodIcon = FOOD_DB[item.foodKey]?.icon || '🍽️';
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        addLog('meal', {
                          name: item.name,
                          icon: foodIcon,
                          kcal: FOOD_DB[item.foodKey]?.kcal * item.qty || 0,
                          prot: FOOD_DB[item.foodKey]?.prot * item.qty || 0,
                        });
                        recalcStreaks();
                        if (canClaimXP(`food_${item.id}_${today}`)) {
                          markXPClaimed(`food_${item.id}_${today}`);
                          addXP(XP.MEAL);
                        }
                        toast.success(`${item.name} registrado!`);
                      }}
                      className="flex items-center gap-3 p-3 bg-gray-900 border border-gray-800 hover:border-green-500 rounded-xl text-sm transition-all active:scale-95 text-left shadow-sm"
                    >
                      <span className="text-2xl drop-shadow-sm">
                        {foodIcon}
                      </span>
                      <span className="flex-1 font-bold text-gray-200">
                        {item.name}
                      </span>
                      <span className="text-[10px] text-green-400 font-black bg-green-500/10 px-2.5 py-1.5 rounded-lg border border-green-500/20 uppercase">
                        ADD
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      <p className="text-[10px] text-center text-gray-500 mt-2 font-bold uppercase tracking-widest">
        Acesse a aba Analytics para ver e editar o Histórico.
      </p>
    </SectionCard>
  );
}

// ── RENDER PRINCIPAL ──────────────────────────────────────────────────────────
export function TodayTab() {
  const [subTab, setSubTab] = useState('routine');

  const SUBTABS = [
    { id: 'routine', icon: '🔥', label: 'Rotina' },
    { id: 'workout', icon: '💪', label: 'Atividade' },
    { id: 'diet', icon: '🍽️', label: 'Dieta' },
  ];

  return (
    <div className="pb-24">
      {/* ── NAVEGAÇÃO DE MINI-ABAS ── */}
      <div className="flex gap-2 p-1.5 bg-gray-900/60 backdrop-blur-md rounded-2xl border border-gray-800 mb-6">
        {SUBTABS.map(t => (
          <button
            key={t.id}
            onClick={() => setSubTab(t.id)}
            className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex flex-col items-center justify-center gap-1.5 
            ${subTab === t.id ? 'bg-gray-800 text-white shadow-lg border border-gray-700' : 'text-gray-500 hover:text-gray-300'}`}
          >
            <span className="text-xl">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={subTab}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          transition={{ duration: 0.15 }}
        >
          {subTab === 'routine' && (
            <>
              <SobrietyCard />
              <VirtuesAndMedsCard />
              <WaterCard />
            </>
          )}

          {subTab === 'workout' && (
            <>
              <WorkoutCard />
              <CircuitsCard />
            </>
          )}

          {subTab === 'diet' && <DietCard />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
