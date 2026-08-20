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
      dispatchXP: (moduleName, actionTier, attributeId, isGoBeyond = false) => {
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
            xpLogs: [...state.xpLogs, { id: `xp_${Date.now()}`, action: moduleName, xp: baseXP, attributeId, moduleOrigin: moduleName, timestamp: Date.now() }],
            showLevelUpModal: leveledUp ? true : state.showLevelUpModal,
            lastLeveledUpTo,
            currentStreak: newStreak,
            longestStreak: Math.max(state.longestStreak, newStreak),
            lastActiveDate: today,
            badges: newBadges,
          };
        });
      },

      // ═══ ADDXP (atalho legado — compat useUserStore) ═══════════════════════
      addXP: (amount, attribute) => {
        get().dispatchXP('general', amount, attribute, false);
      },

      // ═══ LOGXP (compat useXPStore — aceita moduleOrigin, personaId) ═══════
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
          radar: {
            ...state.radar,
            [radarAxis || 'disciplina']: (state.radar[radarAxis || 'disciplina'] || 0) + xp,
          },
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
