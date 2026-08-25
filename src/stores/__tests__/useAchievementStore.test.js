import { useGameStore, calcLevel } from '../useGameStore';
import { useSessionStore } from '../useSessionStore';
import {
  useAchievementStore,
  ACHIEVEMENT_DEFINITIONS,
  ACHIEVEMENT_PROGRESS,
  getLiveProgressState,
} from '../useAchievementStore';

const today = new Date().toISOString().slice(0, 10);
const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

beforeEach(() => {
  // Reset dos stores envolvidos
  const game = useGameStore.getState();
  if (game.resetAllRPG) game.resetAllRPG();
  useGameStore.setState({
    totalXP: 0,
    level: 1,
    xpLogs: [],
    currentStreak: 0,
    longestStreak: 0,
    lastActiveDate: null,
    showLevelUpModal: false,
  });
  useSessionStore.setState({ sessions: [] });
  useAchievementStore.setState({ unlocked: {}, recentUnlocks: [] });
});

// ── grantAchievementXP ────────────────────────────────────────────────────────

describe('grantAchievementXP', () => {
  test('adiciona XP e registra no log', () => {
    useGameStore.getState().grantAchievementXP(150);

    expect(useGameStore.getState().totalXP).toBe(150);
    const logs = useGameStore.getState().xpLogs;
    expect(logs).toHaveLength(1);
    expect(logs[0].moduleOrigin).toBe('achievements');
    expect(logs[0].xp).toBe(150);
  });

  test('não dispara phoenix:xp_dispatched (evita loop)', () => {
    const spy = jest.spyOn(window, 'dispatchEvent');
    useGameStore.getState().grantAchievementXP(100);

    const dispatchedTypes = spy.mock.calls.map(([e]) => e.type);
    expect(dispatchedTypes).not.toContain('phoenix:xp_dispatched');
    spy.mockRestore();
  });

  test('ignora valores inválidos', () => {
    useGameStore.getState().grantAchievementXP(0);
    useGameStore.getState().grantAchievementXP(-50);
    useGameStore.getState().grantAchievementXP(null);
    expect(useGameStore.getState().totalXP).toBe(0);
  });

  test('sobem de nível quando XP acumula', () => {
    useGameStore.getState().grantAchievementXP(500);
    // O nível resultante deve ser consistente com a fórmula do store
    expect(useGameStore.getState().level).toBe(calcLevel(500));
    expect(useGameStore.getState().level).toBeGreaterThan(1);
  });
});

// ── Reset diário de missões ───────────────────────────────────────────────────

describe('refreshDynamicMissions — reset diário', () => {
  test('remove missão diária expirada mas mantém missão estática', () => {
    useGameStore.setState({
      missions: [
        { id: 'dm_old', title: 'Antiga', type: 'diária', xpReward: 10, status: 'claimed', generatedAt: yesterday },
        { id: 'm-static', title: 'Estática', type: 'diária', xpReward: 10, status: 'claimable' },
      ],
    });

    useGameStore.getState().refreshDynamicMissions();

    const missions = useGameStore.getState().missions;
    expect(missions.some((m) => m.id === 'dm_old')).toBe(false);
    expect(missions.some((m) => m.id === 'm-static')).toBe(true);
  });

  test('remove missão semanal de semana anterior', () => {
    useGameStore.setState({
      missions: [
        { id: 'wm_old', title: 'Semana passada', type: 'semanal', xpReward: 10, status: 'claimable', generatedAt: '2020-01-01' },
      ],
    });

    useGameStore.getState().refreshDynamicMissions();

    expect(useGameStore.getState().missions.some((m) => m.id === 'wm_old')).toBe(false);
  });

  test('mantém missões diárias geradas hoje', () => {
    useGameStore.setState({
      missions: [
        { id: 'dm_today', title: 'Hoje', type: 'diária', xpReward: 10, status: 'claimable', generatedAt: today },
      ],
    });

    useGameStore.getState().refreshDynamicMissions();

    expect(useGameStore.getState().missions.some((m) => m.id === 'dm_today')).toBe(true);
  });
});

// ── Geração de missões dinâmicas ──────────────────────────────────────────────

describe('refreshDynamicMissions — geração', () => {
  test('gera missão de estudo quando há sessão de 60min hoje', () => {
    useSessionStore.setState({
      sessions: [{ id: 's1', date: today, totalMinutes: 60, questionsAnswered: 0 }],
    });

    useGameStore.getState().refreshDynamicMissions();

    const ids = useGameStore.getState().missions.map((m) => m.id);
    expect(ids).toContain('dm_study_1h');
    expect(ids).toContain('dm_session');
  });

  test('não gera missão sem atividade hoje', () => {
    useGameStore.getState().refreshDynamicMissions();
    const ids = useGameStore.getState().missions.map((m) => m.id);
    expect(ids).not.toContain('dm_study_1h');
    expect(ids).not.toContain('dm_session');
  });

  test('não duplica missão que já existe', () => {
    useSessionStore.setState({
      sessions: [{ id: 's1', date: today, totalMinutes: 60, questionsAnswered: 0 }],
    });

    useGameStore.getState().refreshDynamicMissions();
    useGameStore.getState().refreshDynamicMissions();

    const studyMissions = useGameStore.getState().missions.filter((m) => m.id === 'dm_study_1h');
    expect(studyMissions).toHaveLength(1);
  });
});

// ── checkAchievements (integração) ────────────────────────────────────────────

describe('checkAchievements — integração', () => {
  test('desbloqueia primeira sessão e concede XP real', () => {
    useSessionStore.setState({
      sessions: [{ id: 's1', date: today, totalMinutes: 30, questionsAnswered: 5 }],
    });

    useAchievementStore.getState().checkAchievements(getLiveProgressState());

    const achState = useAchievementStore.getState();
    expect(achState.unlocked['a_first_session']).toBeDefined();
    expect(achState.unlocked['a_questions_10']).toBeUndefined(); // 5 questões < 10

    // XP da conquista concedido no game store
    expect(useGameStore.getState().totalXP).toBeGreaterThanOrEqual(50);
    // Log de conquista presente
    const logs = useGameStore.getState().xpLogs;
    expect(logs.some((l) => l.moduleOrigin === 'achievements')).toBe(true);
  });

  test('não reconcede XP em checks repetidos', () => {
    useSessionStore.setState({
      sessions: [{ id: 's1', date: today, totalMinutes: 30, questionsAnswered: 0 }],
    });

    const store = useAchievementStore.getState();
    store.checkAchievements(getLiveProgressState());
    const xpAfterFirst = useGameStore.getState().totalXP;

    useAchievementStore.getState().checkAchievements(getLiveProgressState());
    expect(useGameStore.getState().totalXP).toBe(xpAfterFirst);
  });

  test('buildConsolidatedState lê sessões do useSessionStore', () => {
    useSessionStore.setState({
      sessions: [
        { id: 's1', date: today, totalMinutes: 25, questionsAnswered: 12 },
        { id: 's2', date: today, totalMinutes: 35, questionsAnswered: 8 },
      ],
    });

    const state = getLiveProgressState();
    expect(state.totalSessions).toBe(2);
    expect(state.totalStudyMinutes).toBe(60);
    expect(state.totalQuestions).toBe(20);
  });

  test('workoutLog por data é contado corretamente', () => {
    // Simula workoutLog como objeto { data: { exerciseId: [...] } }
    const healthStore = require('../useHealthStore').useHealthStore;
    healthStore.setState({
      workoutLog: {
        [today]: { ex1: [{ id: 'l1' }] },
        [yesterday]: { ex1: [{ id: 'l2' }] },
        '2020-01-01': {}, // dia vazio não conta
      },
    });

    const state = getLiveProgressState();
    expect(state.totalWorkouts).toBe(2);

    healthStore.setState({ workoutLog: {} });
  });
});

// ── Mapa de progresso ─────────────────────────────────────────────────────────

describe('ACHIEVEMENT_PROGRESS', () => {
  test('quase todas as conquistas têm métrica de progresso', () => {
    const withMetric = ACHIEVEMENT_DEFINITIONS.filter((a) => ACHIEVEMENT_PROGRESS[a.id]);
    expect(withMetric.length).toBeGreaterThanOrEqual(
      ACHIEVEMENT_DEFINITIONS.length - 3 // só binárias ficam de fora
    );
  });

  test('métricas apontam para chaves válidas do estado consolidado', () => {
    const liveState = getLiveProgressState();
    Object.values(ACHIEVEMENT_PROGRESS).forEach(([metric]) => {
      expect(liveState).toHaveProperty(metric);
    });
  });
});
