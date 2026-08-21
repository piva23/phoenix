import { useCalendarStore } from '../useCalendarStore';

// Helper: reset store before each test
beforeEach(() => {
  useCalendarStore.setState({
    manualEvents: [],
    events: [],
    dailyNotes: {},
  });
});

// ── addEvent ──────────────────────────────────────────────────────────────────

describe('addEvent', () => {
  test('creates event with id and createdAt', () => {
    const { addEvent } = useCalendarStore.getState();
    addEvent({ title: 'Reunião', date: '2026-08-21', time: '14:00' });

    const { manualEvents, events } = useCalendarStore.getState();
    expect(manualEvents).toHaveLength(1);
    expect(events).toHaveLength(1);
    expect(manualEvents[0].id).toMatch(/^evt_/);
    expect(manualEvents[0].createdAt).toBeDefined();
    expect(manualEvents[0].completed).toBe(false);
  });

  test('events and manualEvents stay in sync', () => {
    const { addEvent } = useCalendarStore.getState();
    addEvent({ title: 'A', date: '2026-08-21' });
    addEvent({ title: 'B', date: '2026-08-22' });

    const { manualEvents, events } = useCalendarStore.getState();
    expect(manualEvents).toHaveLength(2);
    expect(events).toHaveLength(2);
    expect(manualEvents).toEqual(events);
  });
});

// ── toggleEventDone ───────────────────────────────────────────────────────────

describe('toggleEventDone', () => {
  test('toggles completed state', () => {
    const { addEvent, toggleEventDone } = useCalendarStore.getState();
    addEvent({ title: 'Test', date: '2026-08-21' });
    const eventId = useCalendarStore.getState().manualEvents[0].id;

    expect(useCalendarStore.getState().manualEvents[0].completed).toBe(false);

    toggleEventDone(eventId);
    expect(useCalendarStore.getState().manualEvents[0].completed).toBe(true);

    toggleEventDone(eventId);
    expect(useCalendarStore.getState().manualEvents[0].completed).toBe(false);
  });
});

// ── getUniversalEvents ────────────────────────────────────────────────────────

describe('getUniversalEvents', () => {
  test('returns sorted events by date', () => {
    const { addEvent, getUniversalEvents } = useCalendarStore.getState();
    addEvent({ title: 'B', date: '2026-08-22' });
    addEvent({ title: 'A', date: '2026-08-20' });
    addEvent({ title: 'C', date: '2026-08-21' });

    const result = getUniversalEvents();
    expect(result).toHaveLength(3);
    expect(result[0].date).toBe('2026-08-20');
    expect(result[1].date).toBe('2026-08-21');
    expect(result[2].date).toBe('2026-08-22');
  });

  test('maps events with correct shape', () => {
    const { addEvent, getUniversalEvents } = useCalendarStore.getState();
    addEvent({ title: 'Reunião', date: '2026-08-21', time: '14:00', type: 'compromisso' });

    const result = getUniversalEvents();
    expect(result[0]).toMatchObject({
      title: 'Reunião',
      date: '2026-08-21',
      completed: false,
      origin: 'manual',
      type: 'compromisso',
    });
  });
});
