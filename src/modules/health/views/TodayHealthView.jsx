import { useState, useEffect } from 'react';
import { useHealthStore, FOOD_DB } from '../../../stores/useHealthStore';
import { useProjectStore } from '../../../stores/useProjectStore';
import { useXPStore } from '../../../stores/useXPStore';
import { useUserStore } from '../../../stores/useUserStore';
import { usePersonaStore } from '../../../stores/usePersonaStore';
import { WorkoutTracker } from '../components/WorkoutTracker';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const XP = { WATER: 20, HABIT: 50, MED: 10, WORKOUT: 50, MEAL: 5, CIRCUIT: 15 };

function mlToL(ml) {
  return ml >= 1000 ? `${(ml / 1000).toFixed(1)}L` : `${ml}ml`;
}

// ── COMPONENTE: SWIPE TO UNDO ───────────────────────────────────────────────
function SwipeToUndo({ children, onUndo }) {
  const handleDragEnd = (event, info) => {
    // Se arrastar mais de 120px para qualquer lado, desfaz o registro
    if (Math.abs(info.offset.x) > 120) {
      onUndo();
    }
  };

  return (
    <div className="relative overflow-hidden rounded-2xl w-full select-none">
      {/* Background slide indicator */}
      <div className="absolute inset-0 bg-red-600/20 flex items-center justify-between px-5 rounded-2xl pointer-events-none">
        <span className="text-[10px] font-black text-red-400 uppercase tracking-widest">↺ DESFAZER</span>
        <span className="text-[10px] font-black text-red-400 uppercase tracking-widest">↺ DESFAZER</span>
      </div>

      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.4}
        onDragEnd={handleDragEnd}
        className="relative z-10 w-full"
      >
        {children}
      </motion.div>
    </div>
  );
}

// ── COMPONENTE CARD DE BASE COM GLOW ─────────────────────────────────────────
function SectionCard({
  title,
  icon,
  children,
  accent,
  bg = 'var(--bg-surface)',
  isGlowing = false,
  glowColor = 'rgba(168,85,247,0.3)',
}) {
  return (
    <motion.div
      animate={
        isGlowing
          ? {
              boxShadow: [
                `0 0 8px ${glowColor}50`,
                `0 0 22px ${glowColor}99`,
                `0 0 8px ${glowColor}50`,
              ],
              borderColor: [
                `${accent}55`,
                `${accent}ff`,
                `${accent}55`,
              ],
            }
          : {
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              borderColor: 'var(--border)',
            }
      }
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
      className="rounded-3xl overflow-hidden mb-5 border-2 transition-all duration-500"
      style={{
        background: bg,
      }}
    >
      <div
        className="flex items-center justify-between px-5 py-4 border-b"
        style={{
          borderColor: 'var(--border)',
          borderLeft: `4px solid ${accent}`,
        }}
      >
        <div className="flex items-center gap-2">
          <span className="text-xl">{icon}</span>
          <span className="font-black text-sm uppercase tracking-widest text-text-main">
            {title}
          </span>
        </div>
        {isGlowing && (
          <span className="text-[8px] font-black uppercase tracking-widest bg-red-500 text-white px-2 py-0.5 rounded animate-pulse">
            Hora Programada 🔔
          </span>
        )}
      </div>
      <div className="p-5">{children}</div>
    </motion.div>
  );
}

// ── 1. SOBRIEDADE (VÍCIOS / LIMITADORES) ──────────────────────────────────────
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
                : 'linear-gradient(145deg, #1f0505, #000000)',
              borderColor: isFail ? '#ef4444' : '#ef444440',
            }}
          >
            <div className="absolute -right-4 -bottom-4 text-9xl opacity-5 pointer-events-none">
              {q.icon}
            </div>
            <span className="text-5xl mb-3 drop-shadow-lg">{q.icon}</span>
            <span className="text-xl font-black text-red-100 uppercase tracking-widest mb-1">
              {q.name}
            </span>
            <span className="text-[10px] font-black text-red-500 uppercase tracking-widest block mb-4">
              Gatilho: {q.trigger || 'Variação Emocional'}
            </span>

            {!isFail ? (
              <div className="w-full p-4 bg-black/60 rounded-2xl border border-red-900/40 backdrop-blur-sm">
                <p className="text-[10px] text-red-200 font-bold uppercase tracking-wider mb-4 leading-relaxed">
                  Dia limpo constrói autodomínio. Recompensa: {q.reward}
                </p>
                <button
                  onClick={() => {
                    if (
                      window.confirm(
                        `Zerar sua ofensiva de ${q.name}? Seja forte.`
                      )
                    ) {
                      logHabit(q.id, false);
                      recalcStreaks();
                      toast.error('Ofensiva quebrada. Recomece sem hesitar.', { icon: '🐍' });
                    }
                  }}
                  className="w-full py-4 rounded-xl border border-red-500/50 text-red-400 font-black text-xs uppercase tracking-widest bg-red-500/10 hover:bg-red-500/20 active:scale-95 transition-all"
                >
                  Registrar Recaída
                </button>
              </div>
            ) : (
              <div className="mt-2 p-4 bg-red-950/40 rounded-2xl border border-red-500/30 w-full">
                <div className="text-sm text-red-400 font-black mb-1 uppercase tracking-widest">
                  Ofensiva Interrompida ❌
                </div>
                <p className="text-xs text-red-200 font-bold uppercase tracking-wider">
                  O jogo recomeça amanhã. Erga a cabeça.
                </p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── 2. VIRTUDES E MEDS (VIRTUAL CHECKLIST COM SWIPE UNDO) ──────────────────────
function VirtuesAndMedsCard({ currentHour, personaColor }) {
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

  const builds = plans.habits?.filter(h => h.type === 'build') || [];
  const meds = plans.meds || [];

  if (builds.length === 0 && meds.length === 0) return null;

  // Verifica se há algo brilhando agora
  const anyGlowing =
    builds.some(h => !getHabitLogToday(h.id) && h.time && parseInt(h.time.split(':')[0], 10) === currentHour) ||
    meds.some(m => !isMedDoneToday(m.id) && m.time && parseInt(m.time.split(':')[0], 10) === currentHour);

  return (
    <SectionCard
      title="Checklist Diário"
      icon="✅"
      accent="#10B981"
      isGlowing={anyGlowing}
      glowColor={personaColor}
    >
      <div className="space-y-3">
        {builds.map(h => {
          const done = getHabitLogToday(h.id);
          const schedHour = h.time ? parseInt(h.time.split(':')[0], 10) : null;
          const isGlowNow = !done && schedHour === currentHour;

          const cardContent = (
            <button
              onClick={() => {
                if (done) return; // Se feito, use Swipe para desfazer!
                logHabit(h.id, true);
                recalcStreaks();
                const xpKey = `habit_${h.id}_${new Date().toISOString().split('T')[0]}`;
                if (canClaimXP(xpKey)) {
                  markXPClaimed(xpKey);
                  logXP({
                    action: `Hábito Atómico: ${h.name}`,
                    xp: XP.HABIT,
                    moduleOrigin: 'health',
                    radarAxis: 'disciplina',
                  });
                  addXP(XP.HABIT);
                  toast.success(`+${XP.HABIT} XP! ${h.reward || ''}`, { icon: '✨' });
                }
              }}
              className="w-full flex flex-col p-4 rounded-2xl border text-left transition-all relative overflow-hidden"
              style={{
                background: done ? '#10B98110' : 'var(--bg-surface-2)',
                borderColor: done ? '#10B981' : isGlowNow ? personaColor : 'var(--border)',
                boxShadow: isGlowNow ? `0 0 12px ${personaColor}55` : 'none',
              }}
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg bg-black/20 border border-white/5">
                    {h.icon}
                  </div>
                  <div>
                    <span
                      className="text-sm font-black uppercase tracking-wide block"
                      style={{ color: done ? '#10B981' : 'var(--text-main)' }}
                    >
                      {h.name}
                    </span>
                    <span className="text-[8px] text-gray-500 font-bold uppercase tracking-widest mt-0.5 block">
                      Gatilho: {h.trigger} • {h.time || 'Sem hora'}
                    </span>
                  </div>
                </div>
                <div
                  className="w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0"
                  style={{
                    borderColor: done ? '#10B981' : 'var(--border)',
                    background: done ? '#10B981' : 'transparent',
                  }}
                >
                  {done && <span className="text-white text-[10px] font-black">✓</span>}
                </div>
              </div>

              {/* Se desfeito, mostra detalhes da recompensa */}
              {!done && (
                <div className="mt-3 text-[10px] text-purple-400 font-bold uppercase tracking-wider bg-black/20 p-2 rounded-xl">
                  🎁 Recompensa: {h.reward}
                </div>
              )}
            </button>
          );

          return done ? (
            <SwipeToUndo
              key={h.id}
              onUndo={() => {
                logHabit(h.id, false);
                recalcStreaks();
                toast.success('Hábito desfeito.', { icon: '↩️' });
              }}
            >
              {cardContent}
            </SwipeToUndo>
          ) : (
            <div key={h.id}>{cardContent}</div>
          );
        })}

        {meds.map(m => {
          const done = isMedDoneToday(m.id);
          const schedHour = m.time ? parseInt(m.time.split(':')[0], 10) : null;
          const isGlowNow = !done && schedHour === currentHour;

          const cardContent = (
            <button
              onClick={() => {
                if (done) return; // Se feito, use Swipe para desfazer!
                logMed(m.id, true);
                const xpKey = `med_${m.id}_${new Date().toISOString().split('T')[0]}`;
                if (canClaimXP(xpKey)) {
                  markXPClaimed(xpKey);
                  addXP(XP.MED);
                  toast.success(`+${XP.MED} XP! Remédio registrado.`, { icon: '💊' });
                }
              }}
              className="w-full flex items-center justify-between p-4 rounded-2xl border transition-all text-left"
              style={{
                background: done ? '#8B5CF610' : 'var(--bg-surface-2)',
                borderColor: done ? '#8B5CF6' : isGlowNow ? personaColor : 'var(--border)',
                boxShadow: isGlowNow ? `0 0 12px ${personaColor}55` : 'none',
              }}
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg bg-black/20 border border-white/5">
                  {m.icon || '💊'}
                </div>
                <div>
                  <div
                    className="text-sm font-black uppercase tracking-wide leading-tight"
                    style={{ color: done ? '#8B5CF6' : 'var(--text-main)' }}
                  >
                    {m.name}
                  </div>
                  <div className="text-[8px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">
                    Tomar às {m.time}
                  </div>
                </div>
              </div>
              <div
                className="w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0"
                style={{
                  borderColor: done ? '#8B5CF6' : 'var(--border)',
                  background: done ? '#8B5CF6' : 'transparent',
                }}
              >
                {done && <span className="text-white text-[10px] font-black">✓</span>}
              </div>
            </button>
          );

          return done ? (
            <SwipeToUndo
              key={m.id}
              onUndo={() => {
                logMed(m.id, false);
                toast.success('Registro de remédio desfeito.', { icon: '↩️' });
              }}
            >
              {cardContent}
            </SwipeToUndo>
          ) : (
            <div key={m.id}>{cardContent}</div>
          );
        })}
      </div>
    </SectionCard>
  );
}

// ── 3. HIDRATAÇÃO (COM HISTÓRICO COM SWIPE UNDO) ──────────────────────────────
function WaterCard({ currentHour, personaColor }) {
  const {
    plans = {},
    addWater,
    removeLastWater,
    getTodayWaterMl,
    waterLog = {},
    recalcStreaks,
  } = useHealthStore();

  const goal = plans.goals?.waterDailyMl || 3000;
  const total = getTodayWaterMl();
  const pct = Math.min(100, (total / goal) * 100);
  const goalHit = total >= goal;

  const todayStr = new Date().toISOString().split('T')[0];
  const logs = waterLog[todayStr] || [];

  // Hidratação deve brilhar nas horas chave: 08, 11, 14, 17, 20, 23 se não atingiu 100% da meta
  const isHydrationHour = [8, 11, 14, 17, 20, 23].includes(currentHour);
  const isGlowNow = isHydrationHour && !goalHit;

  return (
    <SectionCard
      title="Hidratação"
      icon="💧"
      accent="#38BDF8"
      isGlowing={isGlowNow}
      glowColor={personaColor}
      bg={goalHit ? 'rgba(3,105,161,0.08)' : 'var(--bg-surface)'}
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-3xl font-black text-sky-400">
            {mlToL(total)} <span className="text-xs text-gray-500 font-bold uppercase tracking-widest">/ {mlToL(goal)}</span>
          </div>
          <div className="text-[10px] text-text-dim font-black uppercase tracking-widest mt-1">
            {goalHit ? '🔥 META BATIDA!' : `Faltam ${mlToL(goal - total)}`}
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-3 bg-black/40 rounded-full mb-5 overflow-hidden border border-gray-800 relative">
        <div
          className="h-full bg-sky-400 transition-all duration-700 rounded-full shadow-[0_0_12px_rgba(56,189,248,0.7)]"
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Botões Rápidos */}
      <div className="flex gap-2 overflow-x-auto pb-3 snap-x scrollbar-none">
        {(plans.water?.buttons || [{ ml: 250, label: '💧 250ml' }]).map((b, i) => (
          <button
            key={i}
            onClick={() => {
              addWater(b.ml);
              recalcStreaks();
              toast.success(`+${b.ml}ml registrados! 💧`, {
                style: { background: '#1e293b', color: '#fff' },
              });
            }}
            className="snap-center flex-1 min-w-[85px] py-3.5 bg-gray-800 border-2 border-gray-700 hover:border-sky-500 rounded-2xl text-xs font-black active:scale-95 transition-all text-white shadow-md flex flex-col items-center gap-1"
          >
            {b.label}
          </button>
        ))}
      </div>

      {/* Histórico Recente de Copos (com Swipe to Undo!) */}
      {logs.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-800/60">
          <h4 className="text-[9px] font-black text-sky-500 uppercase tracking-widest mb-2">
            Copos Tomados Hoje (Arraste para Desfazer)
          </h4>
          <div className="space-y-1.5 max-h-[150px] overflow-y-auto pr-1">
            {[...logs].reverse().map((log, index) => {
              const realIndex = logs.length - 1 - index;
              return (
                <SwipeToUndo
                  key={log.id || realIndex}
                  onUndo={() => {
                    // Desfaz esse gole em específico
                    useHealthStore.setState(state => {
                      const prev = [...(state.waterLog[todayStr] || [])];
                      prev.splice(realIndex, 1);
                      return { waterLog: { ...state.waterLog, [todayStr]: prev } };
                    });
                    recalcStreaks();
                    toast.success('Gole removido.', { icon: '↩️' });
                  }}
                >
                  <div className="flex justify-between items-center px-4 py-2 bg-black/20 rounded-xl border border-gray-800/50 text-xs">
                    <span className="font-bold text-gray-300">💧 {log.ml}ml</span>
                    <span className="text-[10px] text-gray-500 font-bold uppercase">{log.time}</span>
                  </div>
                </SwipeToUndo>
              );
            })}
          </div>
        </div>
      )}
    </SectionCard>
  );
}

// ── 4. TREINO (REPRODUZIDO VIA WORKOUT TRACKER) ───────────────────────────────
function WorkoutCardWrapper({ currentHour, personaColor }) {
  const { plans = {} } = useHealthStore();
  const todayDow = new Date().getDay();
  const dayPlan = plans.workout ? plans.workout[todayDow] : null;

  // Treino brilha por volta do final de tarde (ex: 18:00) ou hora agendada se houver treino hoje
  const schedHour = 18; // Padrão 18:00
  const isGlowNow = dayPlan && currentHour === schedHour;

  return (
    <SectionCard
      title="Musculação OS"
      icon="🏋️"
      accent="#A855F7"
      isGlowing={isGlowNow}
      glowColor={personaColor}
    >
      <WorkoutTracker />
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
  const todayStr = new Date().toISOString().split('T')[0];
  const logs = circuitLog[todayStr] || [];

  if (!plans.circuits || plans.circuits.length === 0) return null;

  return (
    <SectionCard title="Circuitos Rápidos" icon="⏱️" accent="#EF4444">
      <div className="space-y-4 mb-4">
        {plans.circuits.map(circuit => (
          <div
            key={circuit.id}
            className="p-4 border-2 border-gray-800 rounded-3xl bg-gray-900/40 flex flex-col gap-4"
          >
            <div className="flex justify-between items-center border-b border-gray-800/50 pb-3">
              <div>
                <div className="text-base font-black text-red-400 uppercase tracking-widest flex items-center gap-2">
                  {circuit.icon} {circuit.name}
                </div>
                <div className="text-[10px] font-bold text-gray-500 mt-1 uppercase tracking-wider">
                  Meta: {circuit.rounds} rounds recomendados
                </div>
              </div>
            </div>

            {/* Exercícios do Circuito */}
            <div className="grid grid-cols-2 gap-2">
              {circuit.movements?.map((m, i) => (
                <div
                  key={i}
                  className="bg-black/30 border border-gray-800/60 rounded-xl p-2.5 flex flex-col items-center justify-center text-center"
                >
                  <span className="text-xs font-bold text-gray-300 leading-tight">{m.name}</span>
                  <span className="text-[10px] text-red-400 font-black mt-1 uppercase tracking-wider">
                    {m.reps ? `${m.reps} Reps` : `${m.timeSec} Segundos`}
                  </span>
                </div>
              ))}
            </div>

            <button
              onClick={() => {
                addLog('circuit', { name: circuit.name });
                const xpKey = `circuit_${circuit.id}_${logs.length}_${todayStr}`;
                if (canClaimXP(xpKey)) {
                  markXPClaimed(xpKey);
                  addXP(XP.CIRCUIT);
                }
                toast.success('Mais 1 Round Concluído! 🔥', { icon: '💪' });
              }}
              className="w-full py-3.5 bg-red-600 text-white rounded-xl text-xs uppercase tracking-widest font-black active:scale-95 transition-all shadow-[0_4px_15px_rgba(239,68,68,0.3)]"
            >
              + Registrar Round Completo
            </button>
          </div>
        ))}
      </div>

      {logs.length > 0 && (
        <SwipeToUndo
          onUndo={() => {
            undoLog('circuit');
            toast.success('Último round desfeito.', { icon: '↩️' });
          }}
        >
          <div className="p-4 rounded-2xl border border-gray-800 bg-red-950/10 flex justify-between items-center text-xs">
            <span className="font-black text-red-400 uppercase tracking-widest">
              🔥 Rounds Concluídos Hoje: {logs.length}
            </span>
            <span className="text-[9px] font-black text-red-500 uppercase tracking-wider bg-red-500/10 px-2 py-0.5 rounded animate-pulse">
              ARRASte para Desfazer ↺
            </span>
          </div>
        </SwipeToUndo>
      )}
    </SectionCard>
  );
}

// ── 6. DIETA (FOOD LOGBOOK E SWIPE UNDO) ──────────────────────────────────────
function DietCard({ currentHour, personaColor }) {
  const {
    plans = {},
    addLog,
    getTodayMacros,
    canClaimXP,
    markXPClaimed,
    mealLog = {},
    removeMealLogById,
    recalcStreaks,
  } = useHealthStore();
  const { addXP } = useUserStore();

  const todayStr = new Date().toISOString().split('T')[0];
  const macros = getTodayMacros();
  const meals = plans.mealPlan || plans.meals || [];

  const dayGoalKcal = plans.goals?.caloriesDaily || 2500;

  // Verifica se a hora atual coincide com alguma refeição para fazer o Glow
  const anyMealGlow = meals.some(meal => {
    const mealHour = parseInt(meal.time.split(':')[0], 10);
    return currentHour === mealHour;
  });

  return (
    <SectionCard
      title="Dieta & Macros"
      icon="🍽️"
      accent="#22C55E"
      isGlowing={anyMealGlow}
      glowColor={personaColor}
    >
      {/* Macros Consumidos */}
      <div className="mb-5 p-4 rounded-2xl bg-green-500/10 border border-green-500/20 flex flex-col gap-2">
        <div className="flex justify-between items-center">
          <span className="text-xs font-black text-green-500 uppercase tracking-widest">Ingerido Hoje</span>
          <span className="text-sm font-black text-green-400">
            {macros.kcal} / {dayGoalKcal} KCAL
          </span>
        </div>
        <div className="w-full h-2.5 bg-black/40 rounded-full overflow-hidden border border-gray-800">
          <div
            className="h-full bg-green-400 rounded-full transition-all duration-700"
            style={{ width: `${Math.min(100, (macros.kcal / dayGoalKcal) * 100)}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] font-bold text-gray-400 mt-1 uppercase">
          <span>Proteína: <span className="text-green-400">{macros.prot}g</span></span>
          <span>Calorias: <span className="text-green-400">{Math.round((macros.kcal / dayGoalKcal) * 100)}%</span></span>
        </div>
      </div>

      {/* Grid de Refeições Planejadas */}
      <div className="flex overflow-x-auto gap-4 pb-4 -mx-5 px-5 snap-x scrollbar-none">
        {meals.map(meal => {
          const mealHour = parseInt(meal.time.split(':')[0], 10);
          const isMealActive = currentHour === mealHour;

          return (
            <div
              key={meal.id}
              className="snap-center min-w-[250px] flex-shrink-0 p-4 rounded-3xl border-2 bg-gray-950/20"
              style={{
                borderColor: isMealActive ? '#22C55E' : 'var(--border)',
              }}
            >
              <div className="text-xs font-black mb-4 flex items-center gap-1.5 text-text-dim uppercase tracking-widest border-b border-gray-800 pb-3">
                {isMealActive && (
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_#22C55E]" />
                )}
                <span>{meal.icon}</span>
                <span className="truncate flex-1">{meal.label}</span>
                <span className="text-green-500 bg-green-500/10 px-2 py-0.5 rounded text-[9px] font-black">
                  {meal.time}
                </span>
              </div>

              <div className="flex flex-col gap-2">
                {meal.items?.map(item => {
                  const foodData = FOOD_DB[item.foodKey] || { kcal: 50, prot: 2, icon: '🥚' };
                  const foodIcon = foodData.icon || '🍽️';

                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        addLog('meal', {
                          name: item.name,
                          icon: foodIcon,
                          kcal: Math.round(foodData.kcal * item.qty),
                          prot: Math.round(foodData.prot * item.qty),
                        });
                        recalcStreaks();
                        const xpKey = `food_${item.id}_${todayStr}`;
                        if (canClaimXP(xpKey)) {
                          markXPClaimed(xpKey);
                          addXP(XP.MEAL);
                        }
                        toast.success(`${item.name} adicionado ao estômago! 🍳`);
                      }}
                      className="flex items-center gap-2 p-2 bg-gray-900 border border-gray-800/80 hover:border-green-500/50 rounded-xl text-xs transition-all active:scale-95 text-left"
                    >
                      <span className="text-xl">{foodIcon}</span>
                      <span className="flex-1 font-bold text-gray-300 truncate">{item.name}</span>
                      <span className="text-[9px] font-black text-green-400 bg-green-500/10 px-2 py-1 rounded">
                        +ADD
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Diário de Alimentos Consumidos Hoje com SWIPE UNDO */}
      {mealLog[todayStr]?.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-800/60">
          <h4 className="text-[9px] font-black text-green-500 uppercase tracking-widest mb-2">
            Consumidos Hoje (Arraste para Desfazer)
          </h4>
          <div className="space-y-1.5 max-h-[180px] overflow-y-auto pr-1">
            {[...mealLog[todayStr]].reverse().map((log, index) => {
              const realIndex = mealLog[todayStr].length - 1 - index;
              return (
                <SwipeToUndo
                  key={log.id || realIndex}
                  onUndo={() => {
                    removeMealLogById(todayStr, log.id);
                    recalcStreaks();
                    toast.success(`${log.name} desfeito.`, { icon: '↩️' });
                  }}
                >
                  <div className="flex justify-between items-center px-4 py-2 bg-black/20 rounded-xl border border-gray-800/50 text-xs">
                    <span className="font-bold text-gray-300 flex items-center gap-1.5">
                      <span>{log.icon || '🍽️'}</span> {log.name}
                    </span>
                    <span className="text-[9px] text-green-400 font-black bg-green-500/10 px-2 py-0.5 rounded">
                      {log.kcal} kcal
                    </span>
                  </div>
                </SwipeToUndo>
              );
            })}
          </div>
        </div>
      )}
    </SectionCard>
  );
}

// ── COMPONENTE RENDERIZADOR PRINCIPAL ─────────────────────────────────────────
export function TodayHealthView() {
  const [subTab, setSubTab] = useState('routine');
  const [currentHour, setCurrentHour] = useState(() => new Date().getHours());

  const activePersona = usePersonaStore(s => s.getActivePersona());
  const personaColor = activePersona?.colorPrimary || '#7C3AED';

  useEffect(() => {
    // Monitora a hora do sistema para atualizar os efeitos "Glow" em tempo real
    const interval = setInterval(() => {
      setCurrentHour(new Date().getHours());
    }, 15000); // 15s
    return () => clearInterval(interval);
  }, []);

  const SUBTABS = [
    { id: 'routine', icon: '⚡', label: 'Rotina' },
    { id: 'workout', icon: '🏋️', label: 'Treino' },
    { id: 'diet', icon: '🍽️', label: 'Dieta' },
  ];

  return (
    <div className="pb-24">
      {/* Mini Abas Tácteis */}
      <div className="flex gap-1.5 p-1.5 bg-gray-900/60 backdrop-blur-md rounded-2xl border border-gray-800 mb-6">
        {SUBTABS.map(t => {
          const isActive = subTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setSubTab(t.id)}
              className="flex-1 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex flex-col items-center justify-center gap-1.5 relative overflow-hidden"
              style={{
                color: isActive ? '#fff' : 'var(--text-dim)',
              }}
            >
              {isActive && (
                <motion.div
                  layoutId="activeSubTabBg"
                  className="absolute inset-0 border"
                  style={{
                    background: 'var(--bg-surface-2)',
                    borderColor: 'var(--border)',
                    borderRadius: '12px',
                  }}
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
              <span
                className="text-xl z-10"
                style={{ color: isActive ? personaColor : 'inherit' }}
              >
                {t.icon}
              </span>
              <span className="z-10">{t.label}</span>
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={subTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.15 }}
        >
          {subTab === 'routine' && (
            <>
              <SobrietyCard />
              <VirtuesAndMedsCard currentHour={currentHour} personaColor={personaColor} />
              <WaterCard currentHour={currentHour} personaColor={personaColor} />
            </>
          )}

          {subTab === 'workout' && (
            <>
              <WorkoutCardWrapper currentHour={currentHour} personaColor={personaColor} />
              <CircuitsCard />
            </>
          )}

          {subTab === 'diet' && <DietCard currentHour={currentHour} personaColor={personaColor} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
export default TodayHealthView;
