import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * Phoenix 5.0 — useAchievementStore
 * Sistema de conquistas reais. Cada conquista é desbloqueada automaticamente
 * quando o utilizador completa ações reais no sistema.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

// ── Definição das 50 conquistas ──────────────────────────────────────────────
// Cada conquista tem um `check(state)` que retorna true quando desbloqueada.
// `state` é o estado consolidado de todos os stores relevantes.
export const ACHIEVEMENT_DEFINITIONS = [
  // ══════════════════════════════════════════════════════════════════════════
  // 📚 ESTUDO (12 conquistas)
  // ══════════════════════════════════════════════════════════════════════════
  { id: 'a_first_session', name: 'Primeiro Passo', description: 'Complete sua primeira sessão de estudo', icon: '🎯', category: 'estudo', xpReward: 50,
    check: (s) => s.totalSessions >= 1 },
  { id: 'a_5_sessions', name: 'Iniciante Dedicado', description: 'Complete 5 sessões de estudo', icon: '📖', category: 'estudo', xpReward: 100,
    check: (s) => s.totalSessions >= 5 },
  { id: 'a_10_sessions', name: 'Estudioso', description: 'Complete 10 sessões de estudo', icon: '📚', category: 'estudo', xpReward: 200,
    check: (s) => s.totalSessions >= 10 },
  { id: 'a_25_sessions', name: 'Mente Ativa', description: 'Complete 25 sessões de estudo', icon: '🧠', category: 'estudo', xpReward: 350,
    check: (s) => s.totalSessions >= 25 },
  { id: 'a_50_sessions', name: 'Mente Brilhante', description: 'Complete 50 sessões de estudo', icon: '✨', category: 'estudo', xpReward: 500,
    check: (s) => s.totalSessions >= 50 },
  { id: 'a_100_sessions', name: 'Gênio Incansável', description: 'Complete 100 sessões de estudo', icon: '💎', category: 'estudo', xpReward: 1000,
    check: (s) => s.totalSessions >= 100 },
  { id: 'a_10_hours', name: 'Dez Horas', description: 'Acumule 10 horas de estudo', icon: '⏰', category: 'estudo', xpReward: 150,
    check: (s) => s.totalStudyMinutes >= 600 },
  { id: 'a_50_hours', name: 'Meio Centenário', description: 'Acumule 50 horas de estudo', icon: '🕐', category: 'estudo', xpReward: 600,
    check: (s) => s.totalStudyMinutes >= 3000 },
  { id: 'a_100_hours', name: 'Centenário', description: 'Acumule 100 horas de estudo', icon: '🏆', category: 'estudo', xpReward: 1000,
    check: (s) => s.totalStudyMinutes >= 6000 },
  { id: 'a_200_hours', name: 'Maratonista Mental', description: 'Acumule 200 horas de estudo', icon: '🏅', category: 'estudo', xpReward: 2000,
    check: (s) => s.totalStudyMinutes >= 12000 },
  { id: 'a_questions_10', name: 'Primeiro Tiro', description: 'Responda 10 questões', icon: '🎯', category: 'estudo', xpReward: 80,
    check: (s) => s.totalQuestions >= 10 },
  { id: 'a_questions_100', name: 'Atirador de Elite', description: 'Responda 100 questões', icon: '🏹', category: 'estudo', xpReward: 400,
    check: (s) => s.totalQuestions >= 100 },

  // ══════════════════════════════════════════════════════════════════════════
  // 💪 SAÚDE (10 conquistas)
  // ══════════════════════════════════════════════════════════════════════════
  { id: 'a_first_workout', name: 'Forjado', description: 'Registre seu primeiro treino', icon: '🏋️', category: 'saude', xpReward: 100,
    check: (s) => s.totalWorkouts >= 1 },
  { id: 'a_5_workouts', name: 'Guerreiro', description: 'Complete 5 treinos', icon: '💪', category: 'saude', xpReward: 200,
    check: (s) => s.totalWorkouts >= 5 },
  { id: 'a_10_workouts', name: 'Ferro & Determinação', description: 'Complete 10 treinos', icon: '⚔️', category: 'saude', xpReward: 350,
    check: (s) => s.totalWorkouts >= 10 },
  { id: 'a_30_workouts', name: 'Lenda do Ferro', description: 'Complete 30 treinos', icon: '🦾', category: 'saude', xpReward: 800,
    check: (s) => s.totalWorkouts >= 30 },
  { id: 'a_water_3d', name: 'Hidratado', description: '3 dias seguidos com água registrada', icon: '💧', category: 'saude', xpReward: 100,
    check: (s) => s.waterStreak >= 3 },
  { id: 'a_water_7d', name: 'Aquático', description: '7 dias seguidos com água registrada', icon: '🏊', category: 'saude', xpReward: 200,
    check: (s) => s.waterStreak >= 7 },
  { id: 'a_water_30d', name: 'Oceano', description: '30 dias seguidos com água registrada', icon: '🌊', category: 'saude', xpReward: 500,
    check: (s) => s.waterStreak >= 30 },
  { id: 'a_habit_7d', name: 'Disciplinado', description: '7 dias seguidos de hábito registrado', icon: '🛡️', category: 'saude', xpReward: 200,
    check: (s) => s.habitStreak >= 7 },
  { id: 'a_habit_30d', name: 'Inquebrável', description: '30 dias seguidos de hábito registrado', icon: '🔥', category: 'saude', xpReward: 600,
    check: (s) => s.habitStreak >= 30 },
  { id: 'a_meals_50', name: 'Nutritionista', description: 'Registre 50 refeições', icon: '🥗', category: 'saude', xpReward: 300,
    check: (s) => s.totalMeals >= 50 },

  // ══════════════════════════════════════════════════════════════════════════
  // 💰 FINANÇAS (5 conquistas)
  // ══════════════════════════════════════════════════════════════════════════
  { id: 'a_first_expense', name: 'Primeiro Registro', description: 'Registre sua primeira despesa', icon: '💸', category: 'financas', xpReward: 30,
    check: (s) => s.totalExpenses >= 1 },
  { id: 'a_50_expenses', name: 'Controlador', description: 'Registre 50 despesas', icon: '📊', category: 'financas', xpReward: 200,
    check: (s) => s.totalExpenses >= 50 },
  { id: 'a_100_expenses', name: 'Auditor', description: 'Registre 100 despesas', icon: '📋', category: 'financas', xpReward: 400,
    check: (s) => s.totalExpenses >= 100 },
  { id: 'a_first_budget', name: 'Planejador', description: 'Configure seu primeiro orçamento ZBB', icon: '📐', category: 'financas', xpReward: 100,
    check: (s) => s.hasBudget },
  { id: 'a_savings_goal', name: 'Poupador', description: 'Atinga uma meta de economia', icon: '🐷', category: 'financas', xpReward: 300,
    check: (s) => s.savingsGoalReached },

  // ══════════════════════════════════════════════════════════════════════════
  // 🎯 RPG / GERAL (10 conquistas)
  // ══════════════════════════════════════════════════════════════════════════
  { id: 'a_level_3', name: 'Evoluindo', description: 'Alcançar nível 3', icon: '⚡', category: 'rpg', xpReward: 100,
    check: (s) => s.level >= 3 },
  { id: 'a_level_5', name: 'Ascendente', description: 'Alcançar nível 5', icon: '🔥', category: 'rpg', xpReward: 500,
    check: (s) => s.level >= 5 },
  { id: 'a_level_10', name: 'Lenda do Phoenix', description: 'Alcançar nível 10', icon: '🦅', category: 'rpg', xpReward: 2000,
    check: (s) => s.level >= 10 },
  { id: 'a_level_15', name: 'Transcendente', description: 'Alcançar nível 15', icon: '🌟', category: 'rpg', xpReward: 3000,
    check: (s) => s.level >= 15 },
  { id: 'a_level_20', name: 'Deus Grego', description: 'Alcançar nível 20', icon: '🏛️', category: 'rpg', xpReward: 5000,
    check: (s) => s.level >= 20 },
  { id: 'a_xp_1000', name: 'Colecionador', description: 'Acumule 1.000 XP total', icon: '🪙', category: 'rpg', xpReward: 100,
    check: (s) => s.totalXP >= 1000 },
  { id: 'a_xp_5000', name: 'Tesouro', description: 'Acumule 5.000 XP total', icon: '💰', category: 'rpg', xpReward: 500,
    check: (s) => s.totalXP >= 5000 },
  { id: 'a_xp_10000', name: 'Lenda Viva', description: 'Acumule 10.000 XP total', icon: '👑', category: 'rpg', xpReward: 2000,
    check: (s) => s.totalXP >= 10000 },
  { id: 'a_first_mission', name: 'Primeira Missão', description: 'Reivindique sua primeira missão', icon: '⚔️', category: 'rpg', xpReward: 50,
    check: (s) => s.claimedMissions >= 1 },
  { id: 'a_10_missions', name: 'Veterano', description: 'Reivindique 10 missões', icon: '🎖️', category: 'rpg', xpReward: 300,
    check: (s) => s.claimedMissions >= 10 },

  // ══════════════════════════════════════════════════════════════════════════
  // 🔥 STREAKS (5 conquistas)
  // ══════════════════════════════════════════════════════════════════════════
  { id: 'a_streak_3', name: 'Três Dias', description: 'Streak de 3 dias seguidos', icon: '🥉', category: 'streak', xpReward: 100,
    check: (s) => s.longestStreak >= 3 },
  { id: 'a_streak_7', name: '7 Dias Seguidos', description: 'Streak de 7 dias seguidos', icon: '📅', category: 'streak', xpReward: 300,
    check: (s) => s.longestStreak >= 7 },
  { id: 'a_streak_14', name: 'Quinzena Dourada', description: 'Streak de 14 dias seguidos', icon: '🌟', category: 'streak', xpReward: 500,
    check: (s) => s.longestStreak >= 14 },
  { id: 'a_streak_30', name: 'Mês Completo', description: 'Streak de 30 dias seguidos', icon: '🗓️', category: 'streak', xpReward: 1000,
    check: (s) => s.longestStreak >= 30 },
  { id: 'a_streak_60', name: 'Imbatível', description: 'Streak de 60 dias seguidos', icon: '💎', category: 'streak', xpReward: 2000,
    check: (s) => s.longestStreak >= 60 },

  // ══════════════════════════════════════════════════════════════════════════
  // 🏛️ ÉPICAS (5 conquistas)
  // ══════════════════════════════════════════════════════════════════════════
  { id: 'a_first_cycle', name: 'Ciclista', description: 'Complete 1 ciclo de estudo', icon: '🔄', category: 'epica', xpReward: 300,
    check: (s) => s.completedCycles >= 1 },
  { id: 'a_5_cycles', name: 'Veterano dos Ciclos', description: 'Complete 5 ciclos de estudo', icon: '🔁', category: 'epica', xpReward: 1000,
    check: (s) => s.completedCycles >= 5 },
  { id: 'a_first_essay', name: 'Escritor', description: 'Finalize sua primeira redação', icon: '✍️', category: 'epica', xpReward: 200,
    check: (s) => s.totalEssays >= 1 },
  { id: 'a_10_essays', name: 'Pluma de Prata', description: 'Finalize 10 redações', icon: '🪶', category: 'epica', xpReward: 800,
    check: (s) => s.totalEssays >= 10 },
  { id: 'a_concurso_passed', name: 'Aprovado!', description: 'Registre aprovação em concurso', icon: '🎊', category: 'epica', xpReward: 5000,
    check: (s) => s.concursosPassed >= 1 },

  // ══════════════════════════════════════════════════════════════════════════
  // 🌟 MISC (2 conquistas)
  // ══════════════════════════════════════════════════════════════════════════
  { id: 'a_first_subject', name: 'Curioso', description: 'Cadastre sua primeira matéria', icon: '📋', category: 'misc', xpReward: 50,
    check: (s) => s.totalSubjects >= 1 },
  { id: 'a_first_calendar', name: 'Organizado', description: 'Crie seu primeiro evento no calendário', icon: '📅', category: 'misc', xpReward: 50,
    check: (s) => s.totalCalendarEvents >= 1 },
];

// ── Store ────────────────────────────────────────────────────────────────────

// Função que consolida estado de todos os stores relevantes para checks.
// NOTA: usa require() (não import) para evitar dependência circular e não
// puxar todos os stores para o chunk principal (code splitting).
function buildConsolidatedState() {
  try {
    const gameStore = require('./useGameStore').useGameStore.getState();
    const studyStore = require('./useStudyStore').useStudyStore.getState();
    const sessionStore = require('./useSessionStore').useSessionStore.getState();
    const redacaoStore = require('./useRedacaoStore').useRedacaoStore.getState();
    const concursoStore = require('./useConcursoStore').useConcursoStore.getState();
    const healthStore = require('./useHealthStore').useHealthStore.getState();
    const financeStore = require('./useFinanceStore').useFinanceStore.getState();
    const calendarStore = require('./useCalendarStore').useCalendarStore.getState();
    const cycleStore = require('./useCycleStore').useCycleStore.getState();

    // Sessões vivem no useSessionStore (não no useStudyStore)
    const sessions = sessionStore.sessions || [];
    const totalSessions = sessions.length;
    const totalStudyMinutes = sessions.reduce((a, s) => a + (s.totalMinutes || 0), 0);
    const totalQuestions = sessions.reduce((a, s) => a + (s.questionsAnswered || 0), 0);

    // Logs diários do health são objetos { "YYYY-MM-DD": ... }, não arrays
    const workoutLog = healthStore.workoutLog || {};
    const totalWorkouts = Object.values(workoutLog).filter(
      (day) => day && typeof day === 'object' && Object.keys(day).length > 0
    ).length;
    const mealLog = healthStore.mealLog || {};
    const totalMeals = Object.values(mealLog).reduce(
      (a, day) => a + (Array.isArray(day) ? day.length : 0), 0
    );

    // streaks.habits é { habitId: diasConsecutivos } — usa o máximo
    const habitsMap = healthStore.streaks?.habits || {};
    const habitValues = Object.values(habitsMap).map((v) => Number(v) || 0);
    const habitStreak = habitValues.length ? Math.max(...habitValues) : 0;

    // Finance: orçamento real = budgets (ZBB por mês) ou envelopes configurados
    const hasBudget =
      Object.keys(financeStore.budgets || {}).length > 0 ||
      (financeStore.envelopes || []).length > 0;
    const totalExpenses = (financeStore.transactions || []).filter(
      (t) => t.type === 'expense'
    ).length;

    return {
      // Game store
      totalXP: gameStore.totalXP || 0,
      level: gameStore.level || 1,
      longestStreak: gameStore.longestStreak || 0,
      claimedMissions: (gameStore.missions || []).filter(m => m.status === 'claimed').length,
      // Study (sessões do useSessionStore)
      totalSessions,
      totalStudyMinutes,
      totalQuestions,
      totalSubjects: (studyStore.subjects || []).length,
      totalEssays: (redacaoStore.redacoes || []).length,
      concursosPassed: (concursoStore.concursos || []).filter(c => c.status === 'aprovado').length,
      completedCycles: (cycleStore.cycles || []).filter(c => c.status === 'concluido' || c.status === 'concluído').length,
      // Health
      totalWorkouts,
      totalMeals,
      waterStreak: Number(healthStore.streaks?.water) || 0,
      habitStreak,
      // Finance
      totalExpenses,
      hasBudget,
      savingsGoalReached: false, // TODO: implementar quando houver meta de economia
      // Calendar
      totalCalendarEvents: (calendarStore.manualEvents || []).length,
    };
  } catch (e) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[achievements] buildConsolidatedState falhou:', e);
    }
    return {};
  }
}

// ── Mapa de progresso: id da conquista → [métrica, alvo] ──────────────────────
// Usado para barras de progresso nas conquistas bloqueadas.
export const ACHIEVEMENT_PROGRESS = {
  a_first_session: ['totalSessions', 1],
  a_5_sessions: ['totalSessions', 5],
  a_10_sessions: ['totalSessions', 10],
  a_25_sessions: ['totalSessions', 25],
  a_50_sessions: ['totalSessions', 50],
  a_100_sessions: ['totalSessions', 100],
  a_10_hours: ['totalStudyMinutes', 600],
  a_50_hours: ['totalStudyMinutes', 3000],
  a_100_hours: ['totalStudyMinutes', 6000],
  a_200_hours: ['totalStudyMinutes', 12000],
  a_questions_10: ['totalQuestions', 10],
  a_questions_100: ['totalQuestions', 100],
  a_first_workout: ['totalWorkouts', 1],
  a_5_workouts: ['totalWorkouts', 5],
  a_10_workouts: ['totalWorkouts', 10],
  a_30_workouts: ['totalWorkouts', 30],
  a_water_3d: ['waterStreak', 3],
  a_water_7d: ['waterStreak', 7],
  a_water_30d: ['waterStreak', 30],
  a_habit_7d: ['habitStreak', 7],
  a_habit_30d: ['habitStreak', 30],
  a_meals_50: ['totalMeals', 50],
  a_first_expense: ['totalExpenses', 1],
  a_50_expenses: ['totalExpenses', 50],
  a_100_expenses: ['totalExpenses', 100],
  a_level_3: ['level', 3],
  a_level_5: ['level', 5],
  a_level_10: ['level', 10],
  a_level_15: ['level', 15],
  a_level_20: ['level', 20],
  a_xp_1000: ['totalXP', 1000],
  a_xp_5000: ['totalXP', 5000],
  a_xp_10000: ['totalXP', 10000],
  a_first_mission: ['claimedMissions', 1],
  a_10_missions: ['claimedMissions', 10],
  a_streak_3: ['longestStreak', 3],
  a_streak_7: ['longestStreak', 7],
  a_streak_14: ['longestStreak', 14],
  a_streak_30: ['longestStreak', 30],
  a_streak_60: ['longestStreak', 60],
  a_first_cycle: ['completedCycles', 1],
  a_5_cycles: ['completedCycles', 5],
  a_first_essay: ['totalEssays', 1],
  a_10_essays: ['totalEssays', 10],
  a_concurso_passed: ['concursosPassed', 1],
  a_first_subject: ['totalSubjects', 1],
  a_first_calendar: ['totalCalendarEvents', 1],
};

export const useAchievementStore = create(
  persist(
    (set, get) => ({
      // Conquistas desbloqueadas: { id: { unlockedAt: timestamp } }
      unlocked: {},

      // IDs de conquistas recém-desbloqueadas (para toast)
      recentUnlocks: [],

      // ─── VERIFICAR CONQUISTAS ─────────────────────────────────────────────
      // Chamado após cada dispatchXP. Recebe o estado consolidado.
      checkAchievements: (consolidatedState) => {
        const { unlocked } = get();
        const newUnlocks = [];

        ACHIEVEMENT_DEFINITIONS.forEach((achievement) => {
          if (unlocked[achievement.id]) return; // já desbloqueada
          try {
            if (achievement.check(consolidatedState)) {
              newUnlocks.push(achievement.id);
            }
          } catch (_) {
            // ignora erros no check
          }
        });

        if (newUnlocks.length > 0) {
          set((state) => {
            const updated = { ...state.unlocked };
            newUnlocks.forEach((id) => {
              updated[id] = { unlockedAt: Date.now() };
            });
            return {
              unlocked: updated,
              recentUnlocks: [...state.recentUnlocks, ...newUnlocks],
            };
          });

          // Concede o XP das conquistas de verdade.
          // grantAchievementXP NÃO dispara phoenix:xp_dispatched → sem loop.
          try {
            const totalRewardXP = newUnlocks.reduce((sum, id) => {
              const def = ACHIEVEMENT_DEFINITIONS.find((a) => a.id === id);
              return sum + (def?.xpReward || 0);
            }, 0);
            if (totalRewardXP > 0) {
              const game = require('./useGameStore').useGameStore.getState();
              if (game.grantAchievementXP) game.grantAchievementXP(totalRewardXP);
            }
          } catch (_) {}

          // Dispara eventos customizados para cada conquista
          newUnlocks.forEach((id) => {
            const def = ACHIEVEMENT_DEFINITIONS.find((a) => a.id === id);
            if (def && typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('phoenix:achievement_unlocked', {
                detail: { id, name: def.name, icon: def.icon, xpReward: def.xpReward },
              }));
            }
          });
        }
      },

      // ─── LIMPAR TOASTS RECENTES ───────────────────────────────────────────
      clearRecentUnlocks: () => set({ recentUnlocks: [] }),

      // ─── GETTERS ──────────────────────────────────────────────────────────
      isUnlocked: (id) => !!get().unlocked[id],

      getProgress: (id) => {
        const def = ACHIEVEMENT_DEFINITIONS.find((a) => a.id === id);
        if (!def) return { progress: 0, target: 1, pct: 0 };
        // Conquistas binárias: ou desbloqueou ou não
        return {
          unlocked: !!get().unlocked[id],
          unlockedAt: get().unlocked[id]?.unlockedAt || null,
        };
      },

      getByCategory: (category) => {
        return ACHIEVEMENT_DEFINITIONS.filter((a) => a.category === category);
      },

      getStats: () => {
        const { unlocked } = get();
        const total = ACHIEVEMENT_DEFINITIONS.length;
        const count = Object.keys(unlocked).length;
        const totalXP = ACHIEVEMENT_DEFINITIONS
          .filter((a) => unlocked[a.id])
          .reduce((sum, a) => sum + (a.xpReward || 0), 0);
        return { total, count, totalXP, pct: Math.round((count / total) * 100) };
      },

      // ─── RESET ────────────────────────────────────────────────────────────
      resetAchievements: () => set({ unlocked: {}, recentUnlocks: [] }),
    }),
    { name: 'phoenix-achievements' }
  )
);

// Estado consolidado ao vivo — para barras de progresso na UI.
// Calculado imperativamente (não reativo); chamar em mount/refresh.
export const getLiveProgressState = () => buildConsolidatedState();

// ── Auto-check: escuta phoenix:xp_dispatched e verifica conquistas ───────────
if (typeof window !== 'undefined') {
  window.addEventListener('phoenix:xp_dispatched', () => {
    try {
      const state = buildConsolidatedState();
      useAchievementStore.getState().checkAchievements(state);
    } catch (_) {}
  });
}
