import { useState, useMemo } from 'react';
import { useHealthStore } from '../../../stores/useHealthStore';
import { usePersonaStore } from '../../../stores/usePersonaStore';
import { motion } from 'framer-motion';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from 'recharts';
import toast from 'react-hot-toast';

function SectionCard({ title, icon, children, accent }) {
  return (
    <div
      className="rounded-3xl overflow-hidden mb-5 transition-all shadow-lg border"
      style={{
        background: 'var(--bg-surface)',
        borderColor: 'var(--border)',
      }}
    >
      <div
        className="flex items-center gap-2 px-5 py-4 border-b"
        style={{
          borderColor: 'var(--border)',
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

export function HealthAnalyticsView() {
  const {
    waterLog = {},
    workoutLog = {},
    mealLog = {},
    habitLog = {},
    plans = {},
    recalcStreaks,
    streaks = {},
  } = useHealthStore();

  const activePersona = usePersonaStore(s => s.getActivePersona());
  const personaColor = activePersona?.colorPrimary || '#7C3AED';

  // ── 1. MAPEA EXERCÍCIOS DISPONÍVEIS NO PLANO ───────────────────────────────
  const allExercises = useMemo(() => {
    const list = [];
    const seen = new Set();
    Object.values(plans.workout || {}).forEach(day => {
      if (day && day.exercises) {
        day.exercises.forEach(ex => {
          if (!seen.has(ex.id)) {
            seen.add(ex.id);
            list.push({ id: ex.id, name: ex.name });
          }
        });
      }
    });
    return list;
  }, [plans]);

  const [selectedExId, setSelectedExId] = useState(() => {
    return allExercises[0]?.id || '';
  });

  // Garante que seleciona algo se o plano for carregado
  useState(() => {
    if (allExercises.length > 0 && !selectedExId) {
      setSelectedExId(allExercises[0].id);
    }
  });

  // ── 2. SEED DE HISTÓRICO PARA DEMONSTRAÇÃO SE ESTIVER VAZIO ──────────────────
  const handleSeedMockData = () => {
    const today = new Date();
    const generatedWorkoutLog = { ...workoutLog };
    const generatedWaterLog = { ...waterLog };
    const generatedMealLog = { ...mealLog };
    const generatedHabitLog = { ...habitLog };

    // Seeding 15 days back
    for (let i = 15; i >= 0; i--) {
      const day = new Date(today.getTime() - i * 86400000);
      const dateStr = day.toISOString().split('T')[0];

      // Seed Water (variando de 1500 a 4000ml)
      generatedWaterLog[dateStr] = [
        { ml: 1000, time: '09:00' },
        { ml: 1000, time: '13:00' },
        { ml: 800, time: '17:00' },
        { ml: i % 2 === 0 ? 1200 : 200, time: '21:00' },
      ];

      // Seed Meals
      generatedMealLog[dateStr] = [
        { id: `mock_m1_${dateStr}`, name: 'Café da Manhã', kcal: 600, prot: 25 },
        { id: `mock_m2_${dateStr}`, name: 'Almoço', kcal: 900, prot: 45 },
        { id: `mock_m3_${dateStr}`, name: 'Janta', kcal: 800, prot: 35 },
      ];

      // Seed Habits
      generatedHabitLog[dateStr] = {
        h1: i % 7 !== 0, // Sobriedade (sucesso 6/7)
        h_nolust: i % 10 !== 0,
        h2: i % 3 !== 0, // Corrida (sucesso 2/3)
      };

      // Seed Workout (Treinos às terças, quintas, sábados)
      const dayOfWeek = day.getDay();
      if ([2, 4, 6].includes(dayOfWeek)) {
        generatedWorkoutLog[dateStr] = {
          // Supino (e1) - progredindo carga
          e1: [
            { id: `mock_e1_1_${dateStr}`, peso: 20 + (15 - i) * 1.5, reps: 10, done: true },
            { id: `mock_e1_2_${dateStr}`, peso: 20 + (15 - i) * 1.5, reps: 10, done: true },
            { id: `mock_e1_3_${dateStr}`, peso: 22 + (15 - i) * 1.5, reps: 8, done: true },
          ],
          // Rosca direta (e8)
          e8: [
            { id: `mock_e8_1_${dateStr}`, peso: 10 + (15 - i) * 0.5, reps: 12, done: true },
            { id: `mock_e8_2_${dateStr}`, peso: 10 + (15 - i) * 0.5, reps: 12, done: true },
            { id: `mock_e8_3_${dateStr}`, peso: 12 + (15 - i) * 0.5, reps: 10, done: true },
          ]
        };
      }
    }

    useHealthStore.setState({
      workoutLog: generatedWorkoutLog,
      waterLog: generatedWaterLog,
      mealLog: generatedMealLog,
      habitLog: generatedHabitLog,
    });

    recalcStreaks();
    toast.success('Histórico de demonstração gerado com sucesso! 📈');
  };

  // ── 3. PARSE DOS DADOS DO GRÁFICO DE PROGRESSÃO DE CARGA ──────────────────
  const progressionData = useMemo(() => {
    if (!selectedExId) return [];

    const sortedDates = Object.keys(workoutLog).sort();
    const dataPoints = [];

    sortedDates.forEach(dateStr => {
      const dayLog = workoutLog[dateStr] || {};
      const sets = dayLog[selectedExId] || [];

      // Verifica se sets é um array (nova estrutura)
      if (Array.isArray(sets)) {
        const doneSets = sets.filter(s => s.done);
        if (doneSets.length > 0) {
          const maxWeight = Math.max(...doneSets.map(s => s.peso || 0));
          const totalVolume = doneSets.reduce((sum, s) => sum + (s.peso || 0) * (s.reps || 0), 0);

          const [y, m, d] = dateStr.split('-');
          dataPoints.push({
            date: `${d}/${m}`,
            pesoMaximo: maxWeight,
            volumeTotal: totalVolume,
            rawDate: dateStr,
          });
        }
      } else if (typeof sets === 'number' && sets > 0) {
        // Fallback para logs legados (sem peso gravado)
        const [y, m, d] = dateStr.split('-');
        dataPoints.push({
          date: `${d}/${m}`,
          pesoMaximo: 0,
          volumeTotal: sets * 10, // aproximado para não ficar zerado
          rawDate: dateStr,
        });
      }
    });

    return dataPoints;
  }, [workoutLog, selectedExId]);

  // ── 4. CÁLCULO DA MATRIZ DO HEATMAP DE CONSISTÊNCIA ───────────────────────
  const last30DaysHeatmap = useMemo(() => {
    const arr = [];
    const waterDailyGoal = plans.water?.dailyGoalMl || plans.goals?.waterDailyMl || 3000;

    for (let i = 29; i >= 0; i--) {
      const day = new Date(Date.now() - i * 86400000);
      const dateStr = day.toISOString().split('T')[0];

      // 1. Água (0 ou 1 ponto se bebeu >= 80% do planejado)
      const waterMl = (waterLog[dateStr] || []).reduce((a, e) => a + e.ml, 0);
      const waterOk = waterMl >= waterDailyGoal * 0.8;
      const waterPt = waterOk ? 1 : 0;

      // 2. Treino (0 ou 1 ponto se concluiu qualquer série de musculação hoje)
      const dayWorkouts = workoutLog[dateStr] || {};
      const workoutOk = Object.values(dayWorkouts).some(sets => {
        if (Array.isArray(sets)) {
          return sets.some(s => s.done);
        }
        return Number(sets) > 0;
      });
      const workoutPt = workoutOk ? 1 : 0;

      // 3. Dieta (0 ou 1 ponto se registrou qualquer refeição hoje)
      const dietOk = (mealLog[dateStr] || []).length > 0;
      const dietPt = dietOk ? 1 : 0;

      // 4. Hábitos de Construção (0 ou 1 ponto se cumpriu hábitos positivos hoje)
      const habitsToday = habitLog[dateStr] || {};
      const buildHabits = plans.habits?.filter(h => h.type === 'build') || [];
      const hasCompletedBuild = buildHabits.some(h => habitsToday[h.id] === true);
      const habitsPt = hasCompletedBuild ? 1 : 0;

      // 5. Sobriedade (0 ou 1 ponto se não houve recaída hoje)
      const quitHabits = plans.habits?.filter(h => h.type === 'quit') || [];
      const hasRelapsed = quitHabits.some(h => habitsToday[h.id] === false);
      const sobrietyPt = !hasRelapsed ? 1 : 0;

      const totalScore = waterPt + workoutPt + dietPt + habitsPt + sobrietyPt;

      const [y, m, d] = dateStr.split('-');

      arr.push({
        date: dateStr,
        label: `${d}/${m}`,
        score: totalScore,
        details: {
          waterMl,
          workoutOk,
          dietOk,
          habitsDone: Object.keys(habitsToday).filter(k => habitsToday[k] === true).length,
          relapsed: hasRelapsed,
        },
      });
    }
    return arr;
  }, [waterLog, workoutLog, mealLog, habitLog, plans]);

  // Cores do Heatmap baseadas no score (0 a 5) e na cor da persona
  const getHeatmapColor = (score) => {
    if (score === 0) return '#1e293b'; // slate dark
    const opacities = ['0.12', '0.25', '0.45', '0.70', '1.0'];
    return `${personaColor}${opacities[score - 1]}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="pb-24 space-y-6"
    >
      {/* ── SEÇÃO 1: RESUMO DE OFENSIVAS ──────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-3">
        {[
          {
            label: 'Água',
            icon: '💧',
            color: '#38BDF8',
            val: streaks.water || 0,
            best: streaks.waterBest || 0,
          },
          {
            label: 'Treino',
            icon: '💪',
            color: '#A855F7',
            val: streaks.workout || 0,
            best: streaks.workoutBest || 0,
          },
          {
            label: 'Dieta',
            icon: '🍽️',
            color: '#22C55E',
            val: streaks.meal || 0,
            best: streaks.mealBest || 0,
          },
        ].map(s => (
          <div
            key={s.label}
            className="rounded-2xl p-4 flex flex-col items-center justify-center relative overflow-hidden border"
            style={{
              background: 'var(--bg-surface-2)',
              borderColor: `${s.color}22`,
            }}
          >
            <div
              className="absolute inset-0 opacity-10 pointer-events-none"
              style={{
                background: `radial-gradient(circle at center, ${s.color} 0%, transparent 70%)`,
              }}
            />
            <div className="text-2xl mb-1">{s.icon}</div>
            <div
              className="text-2xl font-black mb-0.5 tracking-tighter"
              style={{ color: s.color }}
            >
              {s.val}
              <span className="text-[10px] text-gray-500 font-bold ml-1">dias</span>
            </div>
            <div className="text-[8px] text-text-dim uppercase tracking-widest font-black text-center leading-tight">
              Atual ({s.label})
            </div>
            <div className="text-[7px] text-gray-500 font-black uppercase tracking-widest mt-1">
              Melhor: {s.best}d
            </div>
          </div>
        ))}
      </div>

      {/* ── SEÇÃO 2: HEATMAP DE CONSISTÊNCIA ─────────────────────────────────── */}
      <SectionCard title="Consistency Score (Últimos 30 dias)" icon="📅" accent={personaColor}>
        <div className="flex flex-wrap gap-1.5 bg-black/20 p-4 rounded-2xl border border-gray-800/80 justify-center">
          {last30DaysHeatmap.map(d => (
            <div
              key={d.date}
              title={`${d.date} • Score: ${d.score}/5\n💧 ${d.details.waterMl}ml\n🏋️ Treinou: ${d.details.workoutOk ? 'Sim' : 'Não'}\n🍽️ Dieta: ${d.details.dietOk ? 'OK' : 'Não'}`}
              className="w-4.5 h-4.5 rounded-[4px] transition-all hover:scale-125 cursor-crosshair flex items-center justify-center relative"
              style={{
                background: getHeatmapColor(d.score),
                boxShadow: d.score >= 5 ? `0 0 8px ${personaColor}cc` : 'none',
              }}
            >
              {d.score >= 5 && (
                <span className="text-[6px] text-white select-none">👑</span>
              )}
            </div>
          ))}
        </div>

        {/* Legenda do Heatmap */}
        <div className="flex justify-center items-center gap-1.5 mt-4 text-[8px] text-gray-400 font-black uppercase tracking-widest">
          <span>Inativo</span>
          {[0, 1, 2, 3, 4, 5].map(score => (
            <div
              key={score}
              className="w-3.5 h-3.5 rounded-[3px] border border-black/20"
              style={{ background: getHeatmapColor(score) }}
            />
          ))}
          <span>Perfeito</span>
        </div>
      </SectionCard>

      {/* ── SEÇÃO 3: GRÁFICO DE PROGRESSÃO DE CARGA ─────────────────────────── */}
      <SectionCard title="Progressão de Carga" icon="📈" accent="#A855F7">
        <div className="space-y-4">
          {allExercises.length === 0 ? (
            <div className="text-center py-8 bg-black/20 rounded-2xl border border-dashed border-gray-700">
              <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">
                Nenhum exercício cadastrado no seu plano de treino.
              </p>
              <button
                onClick={handleSeedMockData}
                className="mt-3 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-black uppercase tracking-widest active:scale-95 transition-all shadow-md"
              >
                Gerar Histórico de Demonstração
              </button>
            </div>
          ) : (
            <>
              {/* Seletor de Exercício */}
              <div>
                <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest block mb-1.5 px-1">
                  Selecione o Exercício para Análise
                </label>
                <select
                  value={selectedExId}
                  onChange={e => setSelectedExId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl text-xs font-black outline-none bg-gray-800 text-white border border-gray-700"
                >
                  {allExercises.map(ex => (
                    <option key={ex.id} value={ex.id}>
                      {ex.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Gráfico Recharts */}
              {progressionData.length === 0 ? (
                <div className="text-center py-12 bg-black/20 rounded-2xl border border-dashed border-gray-800">
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-2">
                    Nenhum registro de carga para este exercício.
                  </p>
                  <p className="text-[10px] text-gray-500 leading-relaxed max-w-xs mx-auto mb-4">
                    Registre os pesos e séries hoje na aba "Hoje" para ver a linha de evolução de força subir!
                  </p>
                  <button
                    onClick={handleSeedMockData}
                    className="px-4 py-2 bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500/30 text-purple-300 rounded-xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all"
                  >
                    ⚡ Simular Histórico de Cargas
                  </button>
                </div>
              ) : (
                <div className="h-64 w-full bg-black/20 p-2 rounded-2xl border border-gray-800/80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={progressionData}
                      margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="colorMaxWeight" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={personaColor} stopOpacity={0.8} />
                          <stop offset="95%" stopColor={personaColor} stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#22C55E" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="#22C55E" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                      <XAxis
                        dataKey="date"
                        stroke="#666"
                        fontSize={8}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        stroke="#666"
                        fontSize={8}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip
                        contentStyle={{
                          background: '#111827',
                          border: '1px solid #374151',
                          borderRadius: '12px',
                          fontSize: '11px',
                          color: '#fff',
                        }}
                      />
                      <Legend
                        verticalAlign="top"
                        height={36}
                        iconType="circle"
                        wrapperStyle={{ fontSize: '9px', fontWeight: 'black', textTransform: 'uppercase', letterSpacing: '0.1em' }}
                      />
                      <Area
                        name="Peso Máximo (kg)"
                        type="monotone"
                        dataKey="pesoMaximo"
                        stroke={personaColor}
                        fillOpacity={1}
                        fill="url(#colorMaxWeight)"
                        strokeWidth={2}
                      />
                      <Area
                        name="Volume Total (kg × rep)"
                        type="monotone"
                        dataKey="volumeTotal"
                        stroke="#22C55E"
                        fillOpacity={1}
                        fill="url(#colorVolume)"
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </>
          )}
        </div>
      </SectionCard>
    </motion.div>
  );
}
export default HealthAnalyticsView;
