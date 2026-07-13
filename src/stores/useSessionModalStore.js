import { create } from 'zustand';

// Store global e simples (sem persist — é só estado de UI) que controla
// o SessionQuickModal a partir de qualquer página do módulo Study.
//
// openModal aceita tanto { subjectId, topicId, subtopicId } quanto
// { preSubjectId, preTopicId, preSubtopicId } — mantém compatibilidade
// com todos os pontos de chamada existentes no app.
//
// preMode: usado para pré-selecionar um modo no modal (ex: 'revisao').
// revisionId: quando presente, o modal sabe que essa sessão está satisfazendo
// uma revisão pendente específica e, ao salvar, chama completeRevision().

const EMPTY = {
  open: false,
  preSubjectId: null,
  preTopicId: null,
  preSubtopicId: null,
  preMode: null,
  revisionId: null,
};

export const useSessionModalStore = create(set => ({
  ...EMPTY,

  openModal: (payload = {}) =>
    set({
      open: true,
      preSubjectId: payload.preSubjectId ?? payload.subjectId ?? null,
      preTopicId: payload.preTopicId ?? payload.topicId ?? null,
      preSubtopicId: payload.preSubtopicId ?? payload.subtopicId ?? null,
      preMode: payload.preMode ?? null,
      revisionId: payload.revisionId ?? null,
    }),

  closeModal: () => set({ ...EMPTY }),
}));
