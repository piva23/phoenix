import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useCalendarStore = create(
  persist(
    (set, get) => ({
      // Manual events created by the user in the calendar page
      manualEvents: [],
      // Keep events array as an alias/synchronization for backward compatibility
      events: [],
      dailyNotes: {},

      addEvent: (data) => set((state) => {
        const newEvent = {
          ...data,
          id: `evt_${Date.now()}`,
          completed: false,
          createdAt: Date.now(),
        };
        const updatedManual = [...state.manualEvents, newEvent];
        return {
          manualEvents: updatedManual,
          events: updatedManual,
        };
      }),

      updateEvent: (id, data) => set((state) => {
        const updatedManual = state.manualEvents.map((e) =>
          e.id !== id ? e : { ...e, ...data }
        );
        return {
          manualEvents: updatedManual,
          events: updatedManual,
        };
      }),

      deleteEvent: (id) => set((state) => {
        const updatedManual = state.manualEvents.filter((e) => e.id !== id);
        return {
          manualEvents: updatedManual,
          events: updatedManual,
        };
      }),

      toggleEventDone: (id) => set((state) => {
        const updatedManual = state.manualEvents.map((e) =>
          e.id !== id ? e : { ...e, completed: !e.completed }
        );
        return {
          manualEvents: updatedManual,
          events: updatedManual,
        };
      }),

      saveDailyNote: (date, content) => set((state) => ({
        dailyNotes: {
          ...state.dailyNotes,
          [date]: { content, updatedAt: Date.now() },
        },
      })),

      getDailyNote: (date) => get().dailyNotes[date] || null,

      // Selector fallback for backward compatibility
      // NOTE: For full cross-module aggregation, use the custom React hook `useAggregatedEvents`
      getUniversalEvents: () => {
        const { manualEvents } = get();

        return manualEvents.map((e) => ({
          id: e.id,
          title: e.title,
          date: e.date, // YYYY-MM-DD
          completed: e.completed,
          origin: 'manual',
          type: e.type || 'compromisso',
          color: '#EC4899', // Pink for commitments/manual
          description: e.time ? `Hora: ${e.time}` : 'Compromisso manual',
          time: e.time,
        })).sort((a, b) => a.date.localeCompare(b.date));
      },
    }),
    {
      name: 'phoenix-calendar',
      // Merge events into manualEvents upon loading from legacy store
      migrate: (persistedState, version) => {
        if (persistedState && Array.isArray(persistedState.events) && (!persistedState.manualEvents || persistedState.manualEvents.length === 0)) {
          persistedState.manualEvents = persistedState.events;
        }
        return persistedState;
      }
    }
  )
);
