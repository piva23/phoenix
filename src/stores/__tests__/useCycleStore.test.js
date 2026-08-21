import { useCycleStore } from '../useCycleStore';

// Helper: reset store before each test
beforeEach(() => {
  useCycleStore.setState({
    cycles: [],
    activeCycleId: null,
  });
});

// ── addCycle ──────────────────────────────────────────────────────────────────

describe('addCycle', () => {
  test('creates a cycle with generated id and default fields', () => {
    const { addCycle } = useCycleStore.getState();
    addCycle({
      name: 'Ciclo TRT',
      items: [
        { subjectId: 's1', subjectName: 'Direito', horasPorRodada: 2 },
        { subjectId: 's2', subjectName: 'Português', horasPorRodada: 1 },
      ],
    });

    const { cycles, activeCycleId } = useCycleStore.getState();
    expect(cycles).toHaveLength(1);
    expect(activeCycleId).toBe(cycles[0].id);
    expect(cycles[0].name).toBe('Ciclo TRT');
    expect(cycles[0].rodadaAtual).toBe(1);
    expect(cycles[0].status).toBe('ativo');
  });

  test('items get minutosFeitos=0 and completedThisRound=false', () => {
    const { addCycle } = useCycleStore.getState();
    addCycle({
      name: 'Test',
      items: [{ subjectId: 's1' }],
    });

    const item = useCycleStore.getState().cycles[0].items[0];
    expect(item.minutosFeitos).toBe(0);
    expect(item.completedThisRound).toBe(false);
  });
});

// ── addMinutesToItem ──────────────────────────────────────────────────────────

describe('addMinutesToItem', () => {
  test('accumulates minutes correctly', () => {
    const { addCycle, addMinutesToItem } = useCycleStore.getState();
    addCycle({
      name: 'Test',
      items: [{ subjectId: 's1', horasPorRodada: 2 }],
    });

    const cycleId = useCycleStore.getState().cycles[0].id;
    const itemId = useCycleStore.getState().cycles[0].items[0].id;

    addMinutesToItem(cycleId, itemId, 30);
    let item = useCycleStore.getState().cycles[0].items[0];
    expect(item.minutosFeitos).toBe(30);
    expect(item.completedThisRound).toBe(false);

    addMinutesToItem(cycleId, itemId, 30);
    item = useCycleStore.getState().cycles[0].items[0];
    expect(item.minutosFeitos).toBe(60);
    expect(item.completedThisRound).toBe(false);
  });

  test('marks as completed when reaching meta (120 min for 2h)', () => {
    const { addCycle, addMinutesToItem } = useCycleStore.getState();
    addCycle({
      name: 'Test',
      items: [{ subjectId: 's1', horasPorRodada: 2 }],
    });

    const cycleId = useCycleStore.getState().cycles[0].id;
    const itemId = useCycleStore.getState().cycles[0].items[0].id;

    addMinutesToItem(cycleId, itemId, 120);
    const item = useCycleStore.getState().cycles[0].items[0];
    expect(item.completedThisRound).toBe(true);
  });
});

// ── advanceRound ──────────────────────────────────────────────────────────────

describe('advanceRound', () => {
  test('increments rodadaAtual and resets progress', () => {
    const { addCycle, addMinutesToItem, advanceRound } = useCycleStore.getState();
    addCycle({
      name: 'Test',
      items: [{ subjectId: 's1', horasPorRodada: 1 }],
    });

    const cycleId = useCycleStore.getState().cycles[0].id;
    const itemId = useCycleStore.getState().cycles[0].items[0].id;

    addMinutesToItem(cycleId, itemId, 60);
    advanceRound(cycleId);

    const cycle = useCycleStore.getState().cycles[0];
    expect(cycle.rodadaAtual).toBe(2);
    expect(cycle.items[0].minutosFeitos).toBe(0);
    expect(cycle.items[0].completedThisRound).toBe(false);
    expect(cycle.roundsHistory).toHaveLength(1);
  });
});

// ── generateWeeklyPlan ────────────────────────────────────────────────────────

describe('generateWeeklyPlan', () => {
  test('distributes items across available days', () => {
    const { addCycle, generateWeeklyPlan } = useCycleStore.getState();
    addCycle({
      name: 'Test',
      availableDays: [1, 2, 3],
      items: [
        { subjectId: 's1', subjectName: 'Direito', horasPorRodada: 3 },
        { subjectId: 's2', subjectName: 'Português', horasPorRodada: 2 },
        { subjectId: 's3', subjectName: 'Raciocínio', horasPorRodada: 1 },
      ],
    });

    const cycleId = useCycleStore.getState().cycles[0].id;
    generateWeeklyPlan(cycleId);

    const cycle = useCycleStore.getState().cycles[0];
    expect(cycle.weeklyPlan).toBeDefined();
    // All 3 days should have entries
    expect(Object.keys(cycle.weeklyPlan)).toHaveLength(3);
    // Total blocks = 3 items
    const totalBlocks = Object.values(cycle.weeklyPlan).flat().length;
    expect(totalBlocks).toBe(3);
  });
});

// ── getTodaySuggestion ────────────────────────────────────────────────────────

describe('getTodaySuggestion', () => {
  test('returns null when no active cycle', () => {
    const { getTodaySuggestion } = useCycleStore.getState();
    expect(getTodaySuggestion()).toBeNull();
  });

  test('suggests advance_round when all items completed', () => {
    const { addCycle, updateItem, getTodaySuggestion } = useCycleStore.getState();
    addCycle({
      name: 'Test',
      items: [{ subjectId: 's1', horasPorRodada: 1 }],
    });

    const cycleId = useCycleStore.getState().cycles[0].id;
    const itemId = useCycleStore.getState().cycles[0].items[0].id;
    updateItem(cycleId, itemId, { completedThisRound: true });

    const suggestion = getTodaySuggestion();
    expect(suggestion.type).toBe('advance_round');
  });

  test('suggests study item with lowest progress', () => {
    const { addCycle, updateItem, getTodaySuggestion } = useCycleStore.getState();
    addCycle({
      name: 'Test',
      items: [
        { subjectId: 's1', horasPorRodada: 1 },
        { subjectId: 's2', horasPorRodada: 1 },
      ],
    });

    const cycleId = useCycleStore.getState().cycles[0].id;
    const items = useCycleStore.getState().cycles[0].items;
    // s1 has 50% progress, s2 has 0%
    updateItem(cycleId, items[0].id, { minutosFeitos: 30 });

    const suggestion = getTodaySuggestion();
    expect(suggestion.type).toBe('study');
    expect(suggestion.item.subjectId).toBe('s2');
  });
});
