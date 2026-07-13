import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import healthDb from '../modules/health/healthDb.json';

export const FOOD_DB = healthDb.foodDb || {};

// O sistema nasce zerado. Se quiser o seu plano, chame loadDefaults() via UI.
const EMPTY_PLANS = {
  goals: { waterDailyMl: 2500, caloriesDaily: 2000, workoutsPerWeek: 3 },
  water: { dailyGoalMl: 2500, buttons: [{ ml: 250, label: '💧 250ml' }] },
  workout: {},
  mealPlan: [],
  circuits: [],
  habits: [],
  meds: [],
};

const today = () => new Date().toISOString().split('T')[0];

export const useHealthStore = create(
  persist(
    (set, get) => ({
      // ── PLANOS NASCEM ZERADOS ────────────────────────────────────────────────
      plans: EMPTY_PLANS,

      // ── LOGS DIÁRIOS ────────────────────────────────────────────────────────
      waterLog: {},
      workoutLog: {}, // { "YYYY-MM-DD": { "exerciseId": [ { id, peso, reps, isExtra, done } ] } }
      mealLog: {},
      circuitLog: {},
      habitLog: {},
      medsLog: {},
      xpClaimedToday: {},

      // Ofensivas calculadas dinamicamente
      streaks: {
        water: 0,
        workout: 0,
        meal: 0,
        waterBest: 0,
        workoutBest: 0,
        mealBest: 0,
        habits: {},
      },

      // ── IMPORTA O SEU PADRÃO (JSON) E CONVERTE EM HÁBITOS ATÓMICOS ───────────
      loadDefaults: () =>
        set({
          plans: {
            goals: healthDb.goals,
            water: {
              dailyGoalMl: healthDb.goals?.waterDailyMl,
              buttons: healthDb.waterButtons,
            },
            workout: healthDb.workoutPlan,
            mealPlan: healthDb.mealPlan,
            circuits: healthDb.circuits,
            habits: (healthDb.habits || []).map(h => {
              // Converte hábitos para a lógica de Hábitos Atómicos
              let trigger = "Ao acordar";
              let routine = h.name;
              let reward = "Ganhar +50 XP e evoluir";
              let time = "08:00";

              if (h.id === 'h1' || h.name.toLowerCase().includes('nob') || h.name.toLowerCase().includes('fumar')) {
                trigger = "Quando sentir estresse ou tédio";
                routine = "Substituir cigarro/vape por respiração profunda";
                reward = "Pulmões limpos e clareza mental (+50 XP)";
                time = "10:00";
              } else if (h.id === 'h_nolust' || h.name.toLowerCase().includes('lust')) {
                trigger = "Ao navegar tarde na internet";
                routine = "Fechar abas sugestivas e abrir um livro";
                reward = "Foco inabalável e pureza mental (+50 XP)";
                time = "22:00";
              } else if (h.id === 'h_nopm' || h.name.toLowerCase().includes('pm')) {
                trigger = "Ao deitar na cama com o celular";
                routine = "Desligar o celular e meditar por 5 minutos";
                reward = "Sono restaurador e autodomínio (+50 XP)";
                time = "23:00";
              } else if (h.id === 'h2' || h.name.toLowerCase().includes('correr') || h.name.toLowerCase().includes('cardio')) {
                trigger = "Ao vestir o calçado esportivo";
                routine = "Correr 2km na esteira ou ar livre";
                reward = "Pico de dopamina natural e saúde cardiovascular (+50 XP)";
                time = "18:00";
              }

              return {
                id: h.id,
                name: routine, // manter compatibilidade com plans
                type: h.type || 'build',
                icon: h.icon || '🔥',
                trigger,
                routine,
                reward,
                time,
                personaId: h.personaId || null,
                projectId: h.projectId || null,
                goalDays: h.goalDays || 30,
                startDate: h.startDate || today(),
                endDate: h.endDate || null,
              };
            }),
            meds: (healthDb.meds || []).map(m => {
              // Garante que medicamentos tenham horário formatado para o Glow
              let time = m.time;
              if (m.time === 'Manhã') time = '08:00';
              else if (m.time === 'Almoço') time = '13:00';
              else if (m.time === 'Noite') time = '21:00';
              return {
                ...m,
                time,
              };
            }),
          },
        }),

      // ── LOGS GENÉRICOS (Ação de Hoje e Desfazer) ────────────────────────────
      addLog: (category, entry) =>
        set(state => {
          const d = today();
          const currentLogs = state[`${category}Log`] || {};
          const todayLogs = currentLogs[d] || [];
          return {
            [`${category}Log`]: {
              ...currentLogs,
              [d]: [
                ...todayLogs,
                {
                  ...entry,
                  id: `${category}_${Date.now()}`,
                  timestamp: Date.now(),
                },
              ],
            },
          };
        }),
      undoLog: category =>
        set(state => {
          const d = today();
          const currentLogs = state[`${category}Log`] || {};
          const todayLogs = [...(currentLogs[d] || [])];
          if (todayLogs.length > 0) todayLogs.pop();
          return { [`${category}Log`]: { ...currentLogs, [d]: todayLogs } };
        }),

      // Remove um log de comida específico pelo ID
      removeMealLogById: (date, logId) =>
        set(state => {
          const currentLogs = state.mealLog || {};
          const dayLogs = currentLogs[date] || [];
          return {
            mealLog: {
              ...currentLogs,
              [date]: dayLogs.filter(l => l.id !== logId),
            },
          };
        }),

      // ── CONTROLE DE XP ÚNICO ────────────────────────────────────────────────
      canClaimXP: actionId =>
        !(get().xpClaimedToday[today()] || []).includes(actionId),
      markXPClaimed: actionId =>
        set(state => {
          const d = today();
          return {
            xpClaimedToday: {
              ...state.xpClaimedToday,
              [d]: [...(state.xpClaimedToday[d] || []), actionId],
            },
          };
        }),

      // ── ROTINAS E VÍCIOS (Atomic Habits) ────────────────────────────────────
      logHabit: (habitId, isSuccess) =>
        set(state => {
          const d = today();
          return {
            habitLog: {
              ...state.habitLog,
              [d]: { ...(state.habitLog[d] || {}), [habitId]: isSuccess },
            },
          };
        }),
      getHabitLogToday: habitId => (get().habitLog[today()] || {})[habitId],

      logMed: (medId, isTaken) =>
        set(state => {
          const d = today();
          return {
            medsLog: {
              ...state.medsLog,
              [d]: { ...(state.medsLog[d] || {}), [medId]: isTaken },
            },
          };
        }),
      isMedDoneToday: medId => !!(get().medsLog[today()] || {})[medId],

      // ── CIRCUITOS ───────────────────────────────────────────────────────────
      addCircuitRound: circuitId =>
        set(state => {
          const d = today();
          const dayLog = state.circuitLog[d] || {};
          return {
            circuitLog: {
              ...state.circuitLog,
              [d]: { ...dayLog, [circuitId]: (dayLog[circuitId] || 0) + 1 },
            },
          };
        }),
      removeCircuitRound: circuitId =>
        set(state => {
          const d = today();
          const dayLog = state.circuitLog[d] || {};
          if ((dayLog[circuitId] || 0) === 0) return state;
          return {
            circuitLog: {
              ...state.circuitLog,
              [d]: { ...dayLog, [circuitId]: dayLog[circuitId] - 1 },
            },
          };
        }),
      getCircuitRoundsToday: circuitId =>
        (get().circuitLog[today()] || {})[circuitId] || 0,

      // ── ÁGUA ────────────────────────────────────────────────────────────────
      addWater: ml =>
        set(state => {
          const d = today();
          return {
            waterLog: {
              ...state.waterLog,
              [d]: [
                ...(state.waterLog[d] || []),
                { ml, time: new Date().toTimeString().slice(0, 5) },
              ],
            },
          };
        }),
      removeLastWater: () =>
        set(state => {
          const d = today();
          const prev = [...(state.waterLog[d] || [])];
          if (prev.length > 0) prev.pop();
          return { waterLog: { ...state.waterLog, [d]: prev } };
        }),
      getTodayWaterMl: () =>
        (get().waterLog[today()] || []).reduce((a, e) => a + e.ml, 0),

      // ── MUSCULAÇÃO (SÉRIES E CARGAS DINÂMICAS - STRONG/HEVY STYLE) ───────────
      
      // Retorna a lista de séries registradas hoje (se vazio, pré-popula baseado no plano)
      getSetsListToday: (exerciseId, plannedSetsCount = 3, plannedReps = "10") => {
        const d = today();
        const dayLog = get().workoutLog[d] || {};
        const loggedSets = dayLog[exerciseId] || [];

        if (loggedSets.length === 0) {
          const sets = [];
          const repsVal = parseInt(plannedReps, 10) || 10;
          for (let i = 0; i < plannedSetsCount; i++) {
            sets.push({
              id: `plan_${i}_${Date.now()}`,
              peso: 0,
              reps: repsVal,
              isExtra: false,
              done: false,
            });
          }
          return sets;
        }
        return loggedSets;
      },

      // Retorna a quantidade de séries feitas (concluídas) hoje (Compatibilidade legada)
      getSetsToday: (exerciseId) => {
        const d = today();
        const dayLog = get().workoutLog[d] || {};
        const loggedSets = dayLog[exerciseId] || [];
        return loggedSets.filter(s => s.done).length;
      },

      // Atualiza os dados de uma série (peso, reps, done)
      updateWorkoutSet: (exerciseId, setIndex, fields) =>
        set(state => {
          const d = today();
          const currentLogs = state.workoutLog || {};
          const dayLog = currentLogs[d] || {};
          const exerciseSets = [...(dayLog[exerciseId] || [])];

          // Garante preenchimento de séries anteriores se necessário
          if (exerciseSets.length <= setIndex) {
            while (exerciseSets.length <= setIndex) {
              exerciseSets.push({
                id: `plan_${exerciseSets.length}_${Date.now()}`,
                peso: 0,
                reps: 10,
                isExtra: false,
                done: false,
              });
            }
          }

          exerciseSets[setIndex] = {
            ...exerciseSets[setIndex],
            ...fields,
            timestamp: Date.now(),
          };

          return {
            workoutLog: {
              ...currentLogs,
              [d]: {
                ...dayLog,
                [exerciseId]: exerciseSets,
              },
            },
          };
        }),

      // Adiciona uma série extra dinamicamente
      addExtraWorkoutSet: (exerciseId, peso = 0, reps = 10) =>
        set(state => {
          const d = today();
          const currentLogs = state.workoutLog || {};
          const dayLog = currentLogs[d] || {};
          const exerciseSets = [...(dayLog[exerciseId] || [])];

          exerciseSets.push({
            id: `extra_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
            peso,
            reps,
            isExtra: true,
            done: false,
          });

          return {
            workoutLog: {
              ...currentLogs,
              [d]: {
                ...dayLog,
                [exerciseId]: exerciseSets,
              },
            },
          };
        }),

      // Remove uma série (ex: extra ou engano)
      removeWorkoutSet: (exerciseId, setIndex) =>
        set(state => {
          const d = today();
          const currentLogs = state.workoutLog || {};
          const dayLog = currentLogs[d] || {};
          const exerciseSets = [...(dayLog[exerciseId] || [])];

          if (exerciseSets[setIndex]) {
            exerciseSets.splice(setIndex, 1);
          }

          return {
            workoutLog: {
              ...currentLogs,
              [d]: {
                ...dayLog,
                [exerciseId]: exerciseSets,
              },
            },
          };
        }),

      // Compatibilidade legada para botões simples "+ série" e "- série"
      addSet: (exerciseId) =>
        set(state => {
          const d = today();
          const currentLogs = state.workoutLog || {};
          const dayLog = currentLogs[d] || {};
          const exerciseSets = [...(dayLog[exerciseId] || [])];

          const firstIncomplete = exerciseSets.findIndex(s => !s.done);
          if (firstIncomplete !== -1) {
            exerciseSets[firstIncomplete].done = true;
          } else {
            exerciseSets.push({
              id: `plan_${exerciseSets.length}_${Date.now()}`,
              peso: 0,
              reps: 10,
              isExtra: false,
              done: true,
            });
          }

          return {
            workoutLog: {
              ...currentLogs,
              [d]: {
                ...dayLog,
                [exerciseId]: exerciseSets,
              },
            },
          };
        }),

      removeSet: (exerciseId) =>
        set(state => {
          const d = today();
          const currentLogs = state.workoutLog || {};
          const dayLog = currentLogs[d] || {};
          const exerciseSets = [...(dayLog[exerciseId] || [])];

          for (let i = exerciseSets.length - 1; i >= 0; i--) {
            if (exerciseSets[i].done) {
              exerciseSets[i].done = false;
              break;
            }
          }

          return {
            workoutLog: {
              ...currentLogs,
              [d]: {
                ...dayLog,
                [exerciseId]: exerciseSets,
              },
            },
          };
        }),

      getTodayMacros: () => {
        const logs = get().mealLog[today()] || [];
        let kcal = 0,
          prot = 0;
        logs.forEach(log => {
          kcal += log.kcal || 0;
          prot += log.prot || 0;
        });
        return { kcal: Math.round(kcal), prot: Math.round(prot) };
      },

      // ── EDIÇÃO E CRUD (Aba de Planos) ───────────────────────────────────────
      updateWaterPlan: data =>
        set(state => ({
          plans: { ...state.plans, water: { ...state.plans.water, ...data } },
        })),
      updateWorkoutDay: (day, data) =>
        set(state => ({
          plans: {
            ...state.plans,
            workout: { ...state.plans.workout, [day]: data },
          },
        })),
      updateMealPlan: meals =>
        set(state => ({ plans: { ...state.plans, mealPlan: meals } })),

      addHabit: data =>
        set(state => ({
          plans: {
            ...state.plans,
            habits: [
              ...(state.plans.habits || []),
              {
                id: `h_${Date.now()}`,
                type: data.type || 'build',
                icon: data.icon || '🔥',
                name: data.routine || data.name || 'Novo Hábito',
                trigger: data.trigger || 'Ao sentir gatilho',
                routine: data.routine || data.name || 'Praticar rotina positiva',
                reward: data.reward || 'Celebrar vitória (+50 XP)',
                time: data.time || '08:00',
                projectId: data.projectId || null,
                personaId: data.personaId || null,
                goalDays: data.goalDays || 30,
                startDate: today(),
                endDate: null,
              },
            ],
          },
        })),
      removeHabit: id =>
        set(state => ({
          plans: {
            ...state.plans,
            habits: state.plans.habits.filter(h => h.id !== id),
          },
        })),

      addMed: data =>
        set(state => ({
          plans: {
            ...state.plans,
            meds: [
              ...(state.plans.meds || []),
              { ...data, id: `md_${Date.now()}` },
            ],
          },
        })),
      removeMed: id =>
        set(state => ({
          plans: {
            ...state.plans,
            meds: state.plans.meds.filter(m => m.id !== id),
          },
        })),

      addCircuit: data =>
        set(state => ({
          plans: {
            ...state.plans,
            circuits: [
              ...(state.plans.circuits || []),
              { ...data, id: `c_${Date.now()}` },
            ],
          },
        })),
      removeCircuit: id =>
        set(state => ({
          plans: {
            ...state.plans,
            circuits: state.plans.circuits.filter(c => c.id !== id),
          },
        })),
      updateCircuitMovements: (id, movements) =>
        set(state => ({
          plans: {
            ...state.plans,
            circuits: state.plans.circuits.map(c =>
              c.id === id ? { ...c, movements } : c
            ),
          },
        })),

      // ── MOTOR DE OFENSIVAS (Streaks) ────────────────────────────────────────
      recalcStreaks: () =>
        set(state => {
          const waterMeta =
            state.plans.water?.dailyGoalMl ||
            state.plans.goals?.waterDailyMl ||
            3500;
          let wStreak = 0,
            workStreak = 0,
            mealStreak = 0;
          const habitStreaks = {};

          const d = new Date();
          // Varrer últimos 365 dias para calcular Streaks GERAIS
          for (let i = 0; i < 365; i++) {
            const dateStr = new Date(d - i * 86400000)
              .toISOString()
              .split('T')[0];

            if (
              (state.waterLog[dateStr] || []).reduce((a, e) => a + e.ml, 0) >=
              waterMeta * 0.8
            )
              wStreak++;
            else if (i > 0) break;
            
            // Um dia conta como treino se houver séries realizadas (ou legadas ou da nova estrutura com done: true)
            const dayWorkouts = state.workoutLog[dateStr] || {};
            const hasTrained = Object.values(dayWorkouts).some(sets => {
              if (Array.isArray(sets)) {
                return sets.some(s => s.done);
              }
              return Number(sets) > 0;
            });

            if (hasTrained)
              workStreak++;
            else if (i > 0) break;

            if ((state.mealLog[dateStr] || []).length > 0) mealStreak++;
            else if (i > 0) break;
          }

          // Varrer Streaks de Hábitos (Individuais)
          state.plans.habits?.forEach(h => {
            let hStreak = 0;
            for (let i = 0; i < 365; i++) {
              const dateStr = new Date(d - i * 86400000)
                .toISOString()
                .split('T')[0];
              const logDia = state.habitLog[dateStr];

              if (h.type === 'quit') {
                if (logDia && logDia[h.id] === false) {
                  if (i > 0) break;
                } else {
                  hStreak++;
                }
              } else {
                if (logDia && logDia[h.id] === true) hStreak++;
                else if (i > 0) break;
              }
            }
            habitStreaks[h.id] = hStreak;
          });

          return {
            streaks: {
              water: wStreak,
              waterBest: Math.max(state.streaks.waterBest || 0, wStreak),
              workout: workStreak,
              workoutBest: Math.max(state.streaks.workoutBest || 0, workStreak),
              meal: mealStreak,
              mealBest: Math.max(state.streaks.mealBest || 0, mealStreak),
              habits: habitStreaks,
            },
          };
        }),

      getLast30Days: () =>
        Array.from(
          { length: 30 },
          (_, i) =>
            new Date(Date.now() - (29 - i) * 86400000)
              .toISOString()
              .split('T')[0]
        ),
    }),
    { name: 'phoenix-health' }
  )
);
