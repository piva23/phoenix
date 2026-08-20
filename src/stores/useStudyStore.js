import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Gera um id sempre único, mesmo quando chamado várias vezes no mesmo
// milissegundo (ex: import de edital criando várias matérias num loop).
// Date.now() sozinho colide nesses casos — por isso o sufixo aleatório.
const uid = prefix =>
  `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

export const useStudyStore = create(
  persist(
    (set, get) => ({
      subjects: [],

      addSubject: data =>
        set(state => ({
          subjects: [
            ...state.subjects,
            {
              ...data,
              id: data.id || uid('subj'),
              // preserva topics quando passados (ex: importação do edital)
              // só força [] se não vier nada
              topics: Array.isArray(data.topics) ? data.topics : [],
              createdAt: data.createdAt || Date.now(),
            },
          ],
        })),

      updateSubject: (id, data) =>
        set(state => ({
          subjects: state.subjects.map(s =>
            s.id === id ? { ...s, ...data } : s
          ),
        })),

      deleteSubject: id =>
        set(state => ({
          subjects: state.subjects.filter(s => s.id !== id),
        })),

      // NOVA FUNÇÃO: Exclusão em massa de matérias
      deleteSubjects: ids =>
        set(state => ({
          subjects: state.subjects.filter(s => !ids.includes(s.id)),
        })),

      addTopic: (subjectId, data) =>
        set(state => ({
          subjects: state.subjects.map(s =>
            s.id !== subjectId
              ? s
              : {
                  ...s,
                  topics: [
                    ...(s.topics || []),
                    {
                      ...data,
                      id: data.id || uid('topic'),
                      // preserva subtopics quando passados (ex: importação)
                      subtopics: Array.isArray(data.subtopics)
                        ? data.subtopics
                        : [],
                      createdAt: data.createdAt || Date.now(),
                    },
                  ],
                }
          ),
        })),

      updateTopic: (subjectId, topicId, data) =>
        set(state => ({
          subjects: state.subjects.map(s =>
            s.id !== subjectId
              ? s
              : {
                  ...s,
                  topics: s.topics.map(t =>
                    t.id !== topicId ? t : { ...t, ...data }
                  ),
                }
          ),
        })),

      deleteTopic: (subjectId, topicId) =>
        set(state => ({
          subjects: state.subjects.map(s =>
            s.id !== subjectId
              ? s
              : {
                  ...s,
                  topics: s.topics.filter(t => t.id !== topicId),
                }
          ),
        })),

      // Reordena os tópicos de uma matéria (drag and drop)
      reorderTopics: (subjectId, orderedIds) =>
        set(state => ({
          subjects: state.subjects.map(s =>
            s.id !== subjectId
              ? s
              : {
                  ...s,
                  topics: orderedIds
                    .map(id => s.topics.find(t => t.id === id))
                    .filter(Boolean),
                }
          ),
        })),

      addSubtopic: (subjectId, topicId, data) =>
        set(state => ({
          subjects: state.subjects.map(s =>
            s.id !== subjectId
              ? s
              : {
                  ...s,
                  topics: s.topics.map(t =>
                    t.id !== topicId
                      ? t
                      : {
                          ...t,
                          subtopics: [
                            ...(t.subtopics || []),
                            {
                              // defaults que podem ser sobrescritos por data
                              status: 'nao_estudado',
                              masteryLevel: 0,
                              theory: '',
                              summary: '',
                              mindMapImage: null,
                              links: [],
                              flashcards: [],
                              gaps: [],
                              insecurities: [],
                              feynmanNotes: [],
                              anchors: [],
                              loci: [],
                              connections: [],
                              stats: {
                                totalMinutes: 0,
                                questionsAnswered: 0,
                                questionsCorrect: 0,
                                lastStudied: null,
                              },
                              // dados passados sobrescrevem os defaults
                              ...data,
                              // id sempre gerado se não vier
                              id:
                                data.id ||
                                `st_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
                            },
                          ],
                        }
                  ),
                }
          ),
        })),

      updateSubtopic: (subjectId, topicId, subtopicId, data) =>
        set(state => ({
          subjects: state.subjects.map(s =>
            s.id !== subjectId
              ? s
              : {
                  ...s,
                  topics: s.topics.map(t =>
                    t.id !== topicId
                      ? t
                      : {
                          ...t,
                          subtopics: t.subtopics.map(ss =>
                            ss.id !== subtopicId ? ss : { ...ss, ...data }
                          ),
                        }
                  ),
                }
          ),
        })),

      deleteSubtopic: (subjectId, topicId, subtopicId) =>
        set(state => ({
          subjects: state.subjects.map(s =>
            s.id !== subjectId
              ? s
              : {
                  ...s,
                  topics: s.topics.map(t =>
                    t.id !== topicId
                      ? t
                      : {
                          ...t,
                          subtopics: t.subtopics.filter(
                            ss => ss.id !== subtopicId
                          ),
                        }
                  ),
                }
          ),
        })),

      // Links em subtópicos
      addLink: (subjectId, topicId, subtopicId, link) => {
        const st = get()
          .subjects.find(s => s.id === subjectId)
          ?.topics.find(t => t.id === topicId)
          ?.subtopics.find(ss => ss.id === subtopicId);
        if (!st) return;
        get().updateSubtopic(subjectId, topicId, subtopicId, {
          links: [...(st.links || []), { ...link, id: `lnk_${Date.now()}` }],
        });
      },

      removeLink: (subjectId, topicId, subtopicId, linkId) => {
        const st = get()
          .subjects.find(s => s.id === subjectId)
          ?.topics.find(t => t.id === topicId)
          ?.subtopics.find(ss => ss.id === subtopicId);
        if (!st) return;
        get().updateSubtopic(subjectId, topicId, subtopicId, {
          links: (st.links || []).filter(l => l.id !== linkId),
        });
      },

      // Flashcards
      addFlashcard: (subjectId, topicId, subtopicId, card) => {
        const st = get()
          .subjects.find(s => s.id === subjectId)
          ?.topics.find(t => t.id === topicId)
          ?.subtopics.find(ss => ss.id === subtopicId);
        if (!st) return;
        get().updateSubtopic(subjectId, topicId, subtopicId, {
          flashcards: [
            ...(st.flashcards || []),
            { ...card, id: `fc_${Date.now()}`, lastReviewed: null },
          ],
        });
      },

      updateFlashcard: (subjectId, topicId, subtopicId, cardId, data) => {
        const st = get()
          .subjects.find(s => s.id === subjectId)
          ?.topics.find(t => t.id === topicId)
          ?.subtopics.find(ss => ss.id === subtopicId);
        if (!st) return;
        get().updateSubtopic(subjectId, topicId, subtopicId, {
          flashcards: st.flashcards.map(f =>
            f.id !== cardId ? f : { ...f, ...data }
          ),
        });
      },

      deleteFlashcard: (subjectId, topicId, subtopicId, cardId) => {
        const st = get()
          .subjects.find(s => s.id === subjectId)
          ?.topics.find(t => t.id === topicId)
          ?.subtopics.find(ss => ss.id === subtopicId);
        if (!st) return;
        get().updateSubtopic(subjectId, topicId, subtopicId, {
          flashcards: st.flashcards.filter(f => f.id !== cardId),
        });
      },

      getSubtopic: (subjectId, topicId, subtopicId) => {
        return get()
          .subjects.find(s => s.id === subjectId)
          ?.topics.find(t => t.id === topicId)
          ?.subtopics.find(ss => ss.id === subtopicId);
      },
    }),
    { name: 'phoenix-study' }
  )
);
