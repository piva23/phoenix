import { create } from 'zustand';

/**
 * Estado de UI da sessão de estudo ativa (timer, progresso, assunto).
 * Não confundir com useSessionStore (dados persistentes de sessões).
 */
export const useActiveSessionUIStore = create((set) => ({
  isSessionActive: false,
  timeLeft: 0,
  totalTime: 0,
  subjectName: '',
  topicName: '',

  setSessionState: (partial) => set(partial),

  startSession: ({ subjectName, topicName, totalTime }) =>
    set({
      isSessionActive: true,
      timeLeft: totalTime || 0,
      totalTime: totalTime || 0,
      subjectName: subjectName || '',
      topicName: topicName || '',
    }),

  tick: () =>
    set((state) => ({
      timeLeft: Math.max(0, state.timeLeft - 1),
    })),

  endSession: () =>
    set({
      isSessionActive: false,
      timeLeft: 0,
      totalTime: 0,
      subjectName: '',
      topicName: '',
    }),
}));
