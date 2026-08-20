import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Formato de uma questão:
// {
//   id, enunciado, alternativas: ["A) ...", "B) ..."], gabarito: "B",
//   materia, topico, subjectId, topicId, subtopicId, // vínculo opcional com useStudyStore
//   banca, ano, dificuldade: 'facil'|'medio'|'dificil',
//   tags: [], comentario: '', createdAt
// }
//
// Formato de um caderno (deck de questões):
// { id, name, questionIds: [], createdAt }
//
// Formato de uma resposta registrada (histórico):
// { id, questionId, selected, correct, date, sessionId }

export const useQuestionsStore = create(
  persist(
    (set, get) => ({
      questions: [],
      decks: [],
      answers: [],

      // ─── IMPORTAÇÃO ───────────────────────────────────────────────────────

      importQuestions: (rawArray, defaults = {}) => {
        if (!Array.isArray(rawArray))
          return { success: false, count: 0, errors: ['JSON não é um array'] };

        const errors = [];
        const imported = [];

        rawArray.forEach((item, idx) => {
          if (!item.enunciado || !item.alternativas || !item.gabarito) {
            errors.push(
              `Item ${idx + 1}: faltam campos obrigatórios (enunciado, alternativas, gabarito)`
            );
            return;
          }
          imported.push({
            id: `q_${Date.now()}_${idx}_${Math.random().toString(36).slice(2, 7)}`,
            enunciado: item.enunciado,
            alternativas: item.alternativas,
            gabarito: item.gabarito,
            materia: item.materia || defaults.materia || '',
            topico: item.topico || defaults.topico || '',
            subjectId: item.subjectId || defaults.subjectId || null,
            topicId: item.topicId || defaults.topicId || null,
            subtopicId: item.subtopicId || defaults.subtopicId || null,
            banca: item.banca || '',
            ano: item.ano || null,
            dificuldade: item.dificuldade || 'medio',
            tags: item.tags || [],
            comentario: item.comentario || '',
            createdAt: Date.now(),
          });
        });

        if (imported.length > 0) {
          set(state => ({ questions: [...state.questions, ...imported] }));
        }

        return { success: imported.length > 0, count: imported.length, errors };
      },

      deleteQuestion: id =>
        set(state => ({
          questions: state.questions.filter(q => q.id !== id),
          decks: state.decks.map(d => ({
            ...d,
            questionIds: d.questionIds.filter(qid => qid !== id),
          })),
        })),

      updateQuestion: (id, data) =>
        set(state => ({
          questions: state.questions.map(q =>
            q.id !== id ? q : { ...q, ...data }
          ),
        })),

      // ─── CADERNOS ─────────────────────────────────────────────────────────

      createDeck: (name, questionIds = []) => {
        const deck = {
          id: `deck_${Date.now()}`,
          name,
          questionIds,
          createdAt: Date.now(),
        };
        set(state => ({ decks: [...state.decks, deck] }));
        return deck;
      },

      deleteDeck: id =>
        set(state => ({ decks: state.decks.filter(d => d.id !== id) })),

      addToDeck: (deckId, questionIds) =>
        set(state => ({
          decks: state.decks.map(d =>
            d.id !== deckId
              ? d
              : {
                  ...d,
                  questionIds: [...new Set([...d.questionIds, ...questionIds])],
                }
          ),
        })),

      removeFromDeck: (deckId, questionId) =>
        set(state => ({
          decks: state.decks.map(d =>
            d.id !== deckId
              ? d
              : {
                  ...d,
                  questionIds: d.questionIds.filter(id => id !== questionId),
                }
          ),
        })),

      // ─── RESPOSTAS ────────────────────────────────────────────────────────

      // Registra uma resposta e retorna se acertou
      answerQuestion: (questionId, selected, sessionId = null) => {
        const question = get().questions.find(q => q.id === questionId);
        if (!question) return null;

        const correct = selected === question.gabarito;
        const answer = {
          id: `ans_${Date.now()}`,
          questionId,
          selected,
          correct,
          date: new Date().toISOString().slice(0, 10),
          sessionId,
        };
        set(state => ({ answers: [...state.answers, answer] }));
        return { correct, question };
      },

      // ─── SELETORES ────────────────────────────────────────────────────────

      getQuestionsBySubject: subjectId =>
        get().questions.filter(q => q.subjectId === subjectId),

      getQuestionsByDeck: deckId => {
        const deck = get().decks.find(d => d.id === deckId);
        if (!deck) return [];
        return deck.questionIds
          .map(id => get().questions.find(q => q.id === id))
          .filter(Boolean);
      },

      // questões nunca respondidas (para fixação)
      getUnansweredQuestions: (questionIds = null) => {
        const answeredIds = new Set(get().answers.map(a => a.questionId));
        const pool = questionIds
          ? get().questions.filter(q => questionIds.includes(q.id))
          : get().questions;
        return pool.filter(q => !answeredIds.has(q.id));
      },

      // questões erradas pelo menos uma vez e nunca acertadas depois (para revisão cirúrgica)
      getWeakQuestions: (subjectId = null) => {
        const { answers, questions } = get();
        const byQuestion = {};
        answers.forEach(a => {
          if (!byQuestion[a.questionId]) byQuestion[a.questionId] = [];
          byQuestion[a.questionId].push(a);
        });
        const weakIds = Object.entries(byQuestion)
          .filter(([, list]) => {
            const last = list[list.length - 1];
            return !last.correct;
          })
          .map(([id]) => id);

        return questions.filter(
          q =>
            weakIds.includes(q.id) && (!subjectId || q.subjectId === subjectId)
        );
      },

      // estatísticas gerais de uma matéria
      getStatsBySubject: subjectId => {
        const { answers, questions } = get();
        const subjectQuestionIds = new Set(
          questions.filter(q => q.subjectId === subjectId).map(q => q.id)
        );
        const relevant = answers.filter(a =>
          subjectQuestionIds.has(a.questionId)
        );
        const correct = relevant.filter(a => a.correct).length;
        return {
          total: relevant.length,
          correct,
          accuracy:
            relevant.length > 0
              ? Math.round((correct / relevant.length) * 100)
              : null,
        };
      },

      // mistura aleatória — para prática mesclada (interleaving)
      getRandomMixed: (count = 20, subjectIds = null) => {
        const pool = subjectIds
          ? get().questions.filter(q => subjectIds.includes(q.subjectId))
          : get().questions;
        const shuffled = [...pool].sort(() => Math.random() - 0.5);
        return shuffled.slice(0, count);
      },
    }),
    { name: 'phoenix-questions' }
  )
);
