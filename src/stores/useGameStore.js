import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * Phoenix 5.0 — useGameStore (UNIFICADO)
 * Motor central de gamificação. Substitui useXPStore + useUserStore + useRPGStore
 * ═══════════════════════════════════════════════════════════════════════════════
 */

// ── XP Tiers ─────────────────────────────────────────────────────────────────
export const XP_TIERS = {
  D: 5,   // Micro ações
  C: 30,  // Sessões
  B: 120, // Conclusões táticas
  A: 500, // Conquistas estratégicas
};

// ── Atributos do herói ───────────────────────────────────────────────────────
export const ATTRIBUTES = {
  forca:      { label: 'Força',      color: '#EF4444', icon: '💪' },
  foco:       { label: 'Foco',       color: '#3B82F6', icon: '🎯' },
  sabedoria:  { label: 'Sabedoria',  color: '#8B5CF6', icon: '📚' },
  disciplina: { label: 'Disciplina', color: '#10B981', icon: '🛡️' },
  consistencia:{ label: 'Consistência', color: '#F59E0B', icon: '⚡' },
};

// ── Radar axes ───────────────────────────────────────────────────────────────
export const RADAR_AXES = [
  'conhecimento', 'disciplina', 'foco', 'consistencia', 'velocidade', 'retencao',
];

// Mapeamento padrão atributo → eixo do radar (usado quando dispatchXP não
// recebe um radarAxis explícito)
export const ATTRIBUTE_TO_RADAR = {
  forca: 'velocidade',
  foco: 'foco',
  sabedoria: 'conhecimento',
  disciplina: 'disciplina',
  consistencia: 'consistencia',
};

// ── XP Rules (referência central) ────────────────────────────────────────────
export const XP_RULES = {
  STUDY_MINUTE:       { xp: 1,   attribute: 'foco',        radarAxis: 'conhecimento',  label: '+1 XP por minuto de estudo' },
  QUESTION_CORRECT:   { xp: 2,   attribute: 'sabedoria',   radarAxis: 'conhecimento',  label: 'Questão correta' },
  SESSION_COMPLETED:  { xp: 15,  attribute: 'foco',        radarAxis: 'conhecimento',  label: 'Sessão concluída' },
  REVISION_EASY:      { xp: 5,   attribute: 'consistencia', radarAxis: 'retencao',      label: 'Revisão fácil' },
  REVISION_MEDIUM:    { xp: 8,   attribute: 'consistencia', radarAxis: 'retencao',      label: 'Revisão média' },
  REVISION_HARD:      { xp: 12,  attribute: 'consistencia', radarAxis: 'retencao',      label: 'Revisão difícil' },
  DAILY_STREAK:       { xp: 20,  attribute: 'consistencia', radarAxis: 'consistencia',  label: 'Streak diário' },
  WORKOUT_DONE:       { xp: 20,  attribute: 'forca',       radarAxis: 'disciplina',     label: 'Treino concluído' },
  RUNNING_KM:         { xp: 15,  attribute: 'forca',       radarAxis: 'velocidade',     label: 'Por km rodado' },
  HABIT_COMPLETED:    { xp: 10,  attribute: 'disciplina',  radarAxis: 'disciplina',     label: 'Hábito concluído' },
  WATER_500ML:        { xp: 5,   attribute: 'forca',       radarAxis: 'disciplina',     label: '500ml de água' },
  CONCURSO_APROVADO:  { xp: 500, attribute: 'disciplina',  radarAxis: 'disciplina',     label: '🏆 Aprovado no concurso!' },
};

// ── Fórmula de level ─────────────────────────────────────────────────────────
// Progressão: 100, 250, 450, 700, 1000, 1400, 1900, 2500...
export function calcXpForNextLevel(level) {
  const lv = Math.max(1, Number(level) || 1);
  return Math.floor(100 + (lv * 50) + (lv * lv * 25));
}

export function calcLevel(totalXP) {
  let level = 1;
  let needed = calcXpForNextLevel(level);
  while (totalXP >= needed) {
    level++;
    needed = calcXpForNextLevel(level);
  }
  return level;
}

export function calcLevelProgress(totalXP) {
  const level = calcLevel(totalXP);
  const prevThreshold = level > 1 ? (() => { let t = 0; for (let i = 1; i < level; i++) t += calcXpForNextLevel(i); return t; })() : 0;
  const nextThreshold = calcXpForNextLevel(level);
  const inLevel = totalXP - prevThreshold;
  const needed = nextThreshold;
  return { level, currentXP: inLevel, neededXP: needed, progress: Math.min(100, Math.round((inLevel / needed) * 100)) };
}

// ── calcXPProgress (compatibilidade com shared/utils/xp.js) ──────────────────
export function calcXPProgress(totalXP) {
  return calcLevelProgress(totalXP);
}

// ── Badge definitions ────────────────────────────────────────────────────────
export const BADGE_DEFINITIONS = [
  { id: 'b_foco',      name: 'Mestre do Foco',     icon: '⚡', requirement: (s) => s.attributes.foco >= 500 },
  { id: 'b_forca',     name: 'Guerreiro de Elite',  icon: '💪', requirement: (s) => s.attributes.forca >= 500 },
  { id: 'b_sabedoria', name: 'Sábio da Mente',      icon: '📚', requirement: (s) => s.attributes.sabedoria >= 500 },
  { id: 'b_disciplina',name: 'Inquebrável',          icon: '🛡️', requirement: (s) => s.attributes.disciplina >= 500 },
  { id: 'b_consistencia',name: 'Consistente',        icon: '⚡', requirement: (s) => s.attributes.consistencia >= 500 },
  { id: 'b_level5',    name: 'Ascendente',           icon: '🔥', requirement: (s) => s.level >= 5 },
  { id: 'b_level10',   name: 'Lenda do Phoenix',     icon: '🦅', requirement: (s) => s.level >= 10 },
  { id: 'b_streak7',   name: '7 Dias Seguidos',      icon: '📅', requirement: (s) => s.longestStreak >= 7 },
  { id: 'b_streak30',  name: 'Mês Completo',         icon: '🗓️', requirement: (s) => s.longestStreak >= 30 },
];

// ── RPG Default Missions ─────────────────────────────────────────────────────
const DEFAULT_MISSIONS = [
  { id: 'm-1', title: 'Trindade do Dia', type: 'diária', req: 'Estudar 2 horas + Treinar + Beber 2L de Água', xpReward: 120, status: 'claimable' },
  { id: 'm-2', title: 'Foco Absoluto', type: 'diária', req: 'Realizar uma sessão de estudo ou reflexão sem interrupções (mínimo 15 min)', xpReward: 50, status: 'locked' },
  { id: 'm-3', title: 'Guerreiro de Ferro', type: 'semanal', req: 'Registrar 4 treinos de Musculação no Módulo de Saúde', xpReward: 250, status: 'claimable' },
  { id: 'm-4', title: 'Conquistador do Olimpo', type: 'épica', req: 'Alcançar a marca de 30 dias livres de um mau hábito', xpReward: 1000, status: 'locked' },
];

// ── Missões Dinâmicas — templates geradas automaticamente ────────────────────
const DAILY_MISSION_TEMPLATES = [
  { id: 'dm_study_1h', title: 'Foco de Uma Hora', req: 'Estude por pelo menos 60 minutos hoje', xpReward: 40, type: 'diária',
    check: (s) => s.todayStudyMinutes >= 60 },
  { id: 'dm_study_2h', title: 'Maratonista do Conhecimento', req: 'Estude por pelo menos 120 minutos hoje', xpReward: 80, type: 'diária',
    check: (s) => s.todayStudyMinutes >= 120 },
  { id: 'dm_water', title: 'Hidratação Total', req: 'Beba pelo menos 2L de água hoje', xpReward: 25, type: 'diária',
    check: (s) => s.todayWaterMl >= 2000 },
  { id: 'dm_habit', title: 'Hábito do Dia', req: 'Complete pelo menos 1 hábito registrado hoje', xpReward: 30, type: 'diária',
    check: (s) => s.todayHabitsCompleted >= 1 },
  { id: 'dm_session', title: 'Sessão Completa', req: 'Inicie e finalize 1 sessão de estudo', xpReward: 35, type: 'diária',
    check: (s) => s.todaySessions >= 1 },
  { id: 'dm_expense', title: 'Registro Financeiro', req: 'Registre pelo menos 1 despesa ou receita', xpReward: 15, type: 'diária',
    check: (s) => s.todayTransactions >= 1 },
  { id: 'dm_50min', title: 'Sprint de Foco', req: 'Complete 50 minutos de estudo', xpReward: 30, type: 'diária',
    check: (s) => s.todayStudyMinutes >= 50 },
  { id: 'dm_no_skip', title: 'Sem Pular', req: 'Mantenha o streak — não pule nenhum dia', xpReward: 50, type: 'diária',
    check: (s) => s.currentStreak >= 2 },
];

const WEEKLY_MISSION_TEMPLATES = [
  { id: 'wm_5_sessions', title: 'Cinco Sessões', req: 'Complete 5 sessões de estudo esta semana', xpReward: 100, type: 'semanal',
    check: (s) => s.weekSessions >= 5 },
  { id: 'wm_3_workouts', title: 'Três Treinos', req: 'Registre 3 treinos esta semana', xpReward: 120, type: 'semanal',
    check: (s) => s.weekWorkouts >= 3 },
  { id: 'wm_10_hours', title: 'Dez Horas de Estudo', req: 'Acumule 10 horas de estudo esta semana', xpReward: 200, type: 'semanal',
    check: (s) => s.weekStudyMinutes >= 600 },
  { id: 'wm_streak', title: 'Streak de 7', req: 'Mantenha streak de 7 dias', xpReward: 150, type: 'semanal',
    check: (s) => s.longestStreak >= 7 },
  { id: 'wm_30_questions', title: 'Atirador', req: 'Responda 30 questões esta semana', xpReward: 80, type: 'semanal',
    check: (s) => s.weekQuestions >= 30 },
];

// Gera missões dinâmicas baseadas no estado atual
function generateDynamicMissions(state, existingMissions) {
  const today = new Date().toISOString().slice(0, 10);
  const weekStart = getWeekStart();
  const existingIds = new Set(existingMissions.map(m => m.id));

  const newMissions = [];

  // Missões diárias
  DAILY_MISSION_TEMPLATES.forEach(template => {
    if (existingIds.has(template.id)) return;
    if (template.check(state)) {
      newMissions.push({
        id: template.id,
        title: template.title,
        req: template.req,
        xpReward: template.xpReward,
        type: template.type,
        status: 'claimable',
        generatedAt: today,
      });
    }
  });

  // Missões semanais
  WEEKLY_MISSION_TEMPLATES.forEach(template => {
    if (existingIds.has(template.id)) return;
    if (template.check(state)) {
      newMissions.push({
        id: template.id,
        title: template.title,
        req: template.req,
        xpReward: template.xpReward,
        type: template.type,
        status: 'claimable',
        generatedAt: weekStart,
      });
    }
  });

  return newMissions;
}

function getWeekStart() {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff)).toISOString().slice(0, 10);
}

const DEFAULT_RPG_BADGES = [
  { id: 'b-estudioso', title: 'Estudioso de Ferro', description: 'Complete 10 sessões de estudo focadas', icon: '🛡️', unlocked: true, unlockedAt: Date.now() - 86400000 },
  { id: 'b-leotauro', title: 'Corpo de Leotauro', description: 'Mantenha o registro de musculação por 2 semanas seguidas', icon: '🦁', unlocked: false, unlockedAt: null },
  { id: 'b-alma-gemea', title: 'Alma Gêmea', description: 'Atingir harmonia máxima no Módulo de Relacionamentos', icon: '💖', unlocked: false, unlockedAt: null },
  { id: 'b-fogo', title: 'Alma de Fogo', description: 'Despertar a primeira Persona no Nível 5', icon: '🔥', unlocked: false, unlockedAt: null },
];

// ── Initial state ────────────────────────────────────────────────────────────
const INITIAL_STATE = {
  // Perfil (antes era useUserStore)
  name: 'Felipe',
  favoriteModules: ['study'],

  // XP & Level
  totalXP: 0,
  level: 1,

  // Atributos
  attributes: {
    forca: 0,
    foco: 0,
    sabedoria: 0,
    disciplina: 0,
    consistencia: 0,
  },

  // Radar chart
  radar: Object.fromEntries(RADAR_AXES.map(a => [a, 0])),

  // Badges (unificado: auto-badges + RPG badges)
  badges: [...DEFAULT_RPG_BADGES],

  // Missions (antes era useRPGStore)
  missions: [...DEFAULT_MISSIONS],

  // Logs (antes era useXPStore)
  xpLogs: [],

  // Streaks
  currentStreak: 0,
  longestStreak: 0,
  lastActiveDate: null,

  // UI
  showLevelUpModal: false,
  lastLeveledUpTo: null,
};

// ── Safe persist ─────────────────────────────────────────────────────────────
const safePersist = (config, options) => persist(config, {
  ...options,
  migrate: options.migrate || ((state) => state),
});

// ═════════════════════════════════════════════════════════════════════════════
// Store
// ═════════════════════════════════════════════════════════════════════════════
export const useGameStore = create(
  safePersist(
    (set, get) => ({
      ...INITIAL_STATE,

      // ═══ XP DISPATCH (função mestre) ═══════════════════════════════════════
      // radarAxis (opcional): eixo explícito do radar. Se ausente, deriva do
      // attributeId via ATTRIBUTE_TO_RADAR.
      dispatchXP: (moduleName, actionTier, attributeId, isGoBeyond = false, radarAxis = null) => {
        let baseXP = 0;

        if (typeof actionTier === 'number') {
          baseXP = actionTier;
        } else if (typeof actionTier === 'string') {
          const key = actionTier.trim().toUpperCase();
          if (XP_TIERS[key] !== undefined) {
            baseXP = XP_TIERS[key];
          } else if (key.startsWith('TIER ')) {
            const letter = key.replace('TIER ', '').trim();
            baseXP = XP_TIERS[letter] || 0;
          } else if (XP_TIERS[key.slice(-1)] !== undefined) {
            baseXP = XP_TIERS[key.slice(-1)];
          } else {
            baseXP = Number(actionTier) || 0;
          }
        }

        if (isGoBeyond) baseXP = Math.floor(baseXP * 1.5);
        if (baseXP <= 0) return;

        // Resolve eixo do radar
        const resolvedRadarAxis =
          (radarAxis && RADAR_AXES.includes(radarAxis))
            ? radarAxis
            : ATTRIBUTE_TO_RADAR[attributeId] || null;

        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('phoenix:xp_dispatched', {
            detail: { xpAmount: baseXP, attributeId, isGoBeyond, moduleName },
          }));
        }

        set((state) => {
          const newTotalXP = (state.totalXP || 0) + baseXP;
          const updatedAttributes = { ...state.attributes };
          if (attributeId && updatedAttributes[attributeId] !== undefined) {
            updatedAttributes[attributeId] += baseXP;
          }

          // Atualiza radar junto com o dispatch (fonte única de progresso)
          const updatedRadar = { ...state.radar };
          if (resolvedRadarAxis) {
            updatedRadar[resolvedRadarAxis] = (updatedRadar[resolvedRadarAxis] || 0) + baseXP;
          }

          let currentLevel = state.level || 1;
          let leveledUp = false;
          let lastLeveledUpTo = state.lastLeveledUpTo;
          while (newTotalXP >= calcXpForNextLevel(currentLevel)) {
            currentLevel += 1;
            leveledUp = true;
            lastLeveledUpTo = currentLevel;
          }

          const today = new Date().toISOString().slice(0, 10);
          const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
          let newStreak = state.currentStreak;
          if (state.lastActiveDate === today) {
            // mantém
          } else if (state.lastActiveDate === yesterday) {
            newStreak += 1;
          } else {
            newStreak = 1;
          }

          const newBadges = [...(state.badges || [])];
          BADGE_DEFINITIONS.forEach(badge => {
            const already = newBadges.some(b => b.id === badge.id);
            if (!already && badge.requirement({ ...state, level: currentLevel, attributes: updatedAttributes, currentStreak: newStreak, longestStreak: Math.max(state.longestStreak, newStreak) })) {
              newBadges.push({ ...badge, unlockedAt: Date.now() });
              if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('phoenix:badge_unlocked', { detail: badge }));
              }
            }
          });

          return {
            totalXP: newTotalXP,
            level: currentLevel,
            attributes: updatedAttributes,
            radar: updatedRadar,
            xpLogs: [...state.xpLogs, { id: `xp_${Date.now()}`, action: moduleName, xp: baseXP, attributeId, moduleOrigin: moduleName, timestamp: Date.now() }],
            showLevelUpModal: leveledUp ? true : state.showLevelUpModal,
            lastLeveledUpTo,
            currentStreak: newStreak,
            longestStreak: Math.max(state.longestStreak, newStreak),
            lastActiveDate: today,
            badges: newBadges,
          };
        });

        // Após cada XP, verifica missões dinâmicas
        try { get().refreshDynamicMissions(); } catch (_) {}
      },

      // ═══ XP DE CONQUISTAS ══════════════════════════════════════════════════
      // Concede XP de conquistas desbloqueadas SEM disparar phoenix:xp_dispatched
      // (evita loop infinito com o checkAchievements) e SEM afetar streak/radar.
      grantAchievementXP: (amount) => {
        const xp = Number(amount) || 0;
        if (xp <= 0) return;
        set((state) => {
          const newTotalXP = (state.totalXP || 0) + xp;
          let currentLevel = state.level || 1;
          let leveledUp = false;
          let lastLeveledUpTo = state.lastLeveledUpTo;
          while (newTotalXP >= calcXpForNextLevel(currentLevel)) {
            currentLevel += 1;
            leveledUp = true;
            lastLeveledUpTo = currentLevel;
          }
          return {
            totalXP: newTotalXP,
            level: currentLevel,
            showLevelUpModal: leveledUp ? true : state.showLevelUpModal,
            lastLeveledUpTo,
            xpLogs: [...state.xpLogs, {
              id: `xp_${Date.now()}_ach`,
              action: 'achievement_unlocked',
              xp,
              moduleOrigin: 'achievements',
              timestamp: Date.now(),
            }],
          };
        });
      },

      // ═══ ADDXP (atalho legado — compat useUserStore) ═══════════════════════
      addXP: (amount, attribute) => {
        get().dispatchXP('general', amount, attribute, false);
      },

      // ═══ LOGXP (compat useXPStore — aceita moduleOrigin, personaId) ═══════
      // NOTA: apenas registra no histórico. O radar/level/atributos são
      // atualizados exclusivamente por dispatchXP (fonte única de verdade).
      logXP: ({ action, xp, module: mod, moduleOrigin, personaId, radarAxis }) => {
        const modKey = mod || moduleOrigin || 'general';
        set((state) => ({
          xpLogs: [...state.xpLogs, {
            id: `xp_${Date.now()}`,
            action,
            xp,
            module: modKey,
            moduleOrigin: modKey,
            personaId,
            radarAxis: radarAxis || 'disciplina',
            timestamp: Date.now(),
          }],
        }));
      },

      // ═══ GETTERS ═══════════════════════════════════════════════════════════
      getTotalXP: () => get().totalXP,

      getRadarNormalized: () => {
        const radar = get().radar;
        const max = Math.max(...Object.values(radar), 1);
        return Object.fromEntries(Object.entries(radar).map(([k, v]) => [k, Math.round((v / max) * 100)]));
      },

      getXPByModule: () => {
        return get().xpLogs.reduce((acc, l) => {
          const key = l.moduleOrigin || l.module;
          acc[key] = (acc[key] || 0) + l.xp;
          return acc;
        }, {});
      },

      getLevelProgress: () => calcLevelProgress(get().totalXP),

      // ═══ NAME / FAVORITES (compat useUserStore) ═══════════════════════════
      setName: (name) => set({ name }),

      toggleFavoriteModule: (moduleId) => set(state => {
        const favs = state.favoriteModules;
        if (favs.includes(moduleId)) return { favoriteModules: favs.filter(m => m !== moduleId) };
        const next = favs.length >= 2 ? [favs[1], moduleId] : [...favs, moduleId];
        return { favoriteModules: next };
      }),

      // ═══ BADGES (unificado) ═══════════════════════════════════════════════
      unlockBadge: (badge) => set((state) => {
        const existing = state.badges || [];
        const badgeObj = typeof badge === 'string'
          ? { id: badge, name: badge, unlockedAt: Date.now() }
          : { id: badge.id || `badge_${Date.now()}`, name: badge.name || 'Insígnia', unlockedAt: Date.now(), ...badge };
        if (existing.some(b => b.id === badgeObj.id)) return {};
        return { badges: [...existing, badgeObj] };
      }),

      toggleBadge: (badgeId) => set((state) => ({
        badges: (state.badges || []).map((b) =>
          b.id === badgeId
            ? { ...b, unlocked: !b.unlocked, unlockedAt: !b.unlocked ? Date.now() : null }
            : b
        ),
      })),

      // ═══ MISSIONS (compat useRPGStore) ═════════════════════════════════════
      claimMissionReward: (missionId) => {
        const { missions } = get();
        const mission = missions.find((m) => m.id === missionId);
        if (!mission || mission.status !== 'claimable') return false;

        set({
          missions: missions.map((m) =>
            m.id === missionId ? { ...m, status: 'claimed' } : m
          ),
        });

        // Log XP via dispatchXP
        get().dispatchXP('rpg', mission.xpReward, 'disciplina');

        return true;
      },

      toggleMissionStatus: (missionId) => set((state) => ({
        missions: (state.missions || []).map((m) => {
          if (m.id !== missionId) return m;
          let nextStatus = 'locked';
          if (m.status === 'locked') nextStatus = 'claimable';
          else if (m.status === 'claimable') nextStatus = 'claimed';
          else nextStatus = 'locked';
          return { ...m, status: nextStatus };
        }),
      })),

      // ═══ MISSIONS DINÂMICAS ═══════════════════════════════════════════════
      // Gera novas missões baseadas no comportamento real do utilizador.
      // Chamado após cada dispatchXP e no carregamento do app.
      // Também remove missões diárias/semanais expiradas (reset diário).
      refreshDynamicMissions: () => {
        const state = get();
        const { useSessionStore } = require('./useSessionStore');
        const { useHealthStore } = require('./useHealthStore');
        const { useFinanceStore } = require('./useFinanceStore');

        const today = new Date().toISOString().slice(0, 10);
        const weekStart = getWeekStart();

        // ── Reset: remove missões dinâmicas expiradas ────────────────────────
        // Diárias geradas antes de hoje e semanais de semanas anteriores.
        const expiredIds = (state.missions || [])
          .filter((m) => {
            if (!m.generatedAt) return false; // missões estáticas nunca expiram
            if (m.type === 'diária') return m.generatedAt < today;
            if (m.type === 'semanal') return m.generatedAt < weekStart;
            return false;
          })
          .map((m) => m.id);
        if (expiredIds.length > 0) {
          set((s) => ({
            missions: s.missions.filter((m) => !expiredIds.includes(m.id)),
          }));
        }

        // ── Estado consolidado do dia/semana (shapes reais dos stores) ──────
        const sessions = useSessionStore.getState().sessions || [];
        const todaySessions = sessions.filter((s) => s.date === today);
        const todayStudyMinutes = todaySessions.reduce((a, s) => a + (s.totalMinutes || 0), 0);

        const hState = useHealthStore.getState();
        const todayWaterMl = hState.getTodayWaterMl ? hState.getTodayWaterMl() : 0;
        // habitLog é { "YYYY-MM-DD": { habitId: entrada } }
        const todayHabits = Object.keys(
          (hState.habitLog || {})[today] || {}
        ).length;
        // workoutLog é { "YYYY-MM-DD": { exerciseId: [entradas] } } — conta dias com treino
        const workoutLog = hState.workoutLog || {};
        const activeWorkoutDays = Object.keys(workoutLog).filter(
          (d) => workoutLog[d] && Object.keys(workoutLog[d]).length > 0
        );
        const todayWorkouts = activeWorkoutDays.filter((d) => d === today).length;

        const fState = useFinanceStore.getState();
        const todayTransactions = (fState.transactions || []).filter((t) => t.date === today).length;

        // Weekly
        const weekSessions = sessions.filter((s) => s.date >= weekStart);
        const weekStudyMinutes = weekSessions.reduce((a, s) => a + (s.totalMinutes || 0), 0);
        const weekQuestions = weekSessions.reduce((a, s) => a + (s.questionsAnswered || 0), 0);
        const weekWorkouts = activeWorkoutDays.filter((d) => d >= weekStart).length;

        const consolidated = {
          todayStudyMinutes,
          todayWaterMl,
          todayHabitsCompleted: todayHabits,
          todaySessions: todaySessions.length,
          todayTransactions,
          currentStreak: state.currentStreak || 0,
          longestStreak: state.longestStreak || 0,
          weekSessions: weekSessions.length,
          weekWorkouts,
          weekStudyMinutes,
          weekQuestions,
        };

        // Gera novas missões (após o reset, ids expirados podem regenerar)
        const currentMissions = get().missions || [];
        const newMissions = generateDynamicMissions(consolidated, currentMissions);
        if (newMissions.length > 0) {
          set((s) => ({ missions: [...s.missions, ...newMissions] }));
        }
      },

      resetAllRPG: () => set({
        missions: [...DEFAULT_MISSIONS],
        badges: [...DEFAULT_RPG_BADGES],
      }),

      // ═══ UI ═══════════════════════════════════════════════════════════════
      closeLevelUpModal: () => set({ showLevelUpModal: false }),

      resetGame: () => set({ ...INITIAL_STATE }),
    }),
    { name: 'phoenix-game' }
  )
);
