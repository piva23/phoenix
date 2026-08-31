import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { questionAdapter } from '../services/questionAdapter.service';

// Formato de uma questão na store:
// { id, enunciado, alternativas: ["A) ...", "B) ..."], gabarito: "B",
//   materia, topico, subtopico, assunto, subjectId, topicId, subtopicId,
//   banca, orgao, cargo, carreira, escolaridade, areaFormacao,
//   prova, edital, ano, regiao, codigo,
//   dificuldade, tags: [], explicacao: '', createdAt }

// Formato de uma resposta:
// { id, questionId, selected, correct, date, sessionId }

// Formato de um caderno:
// { id, name, folderId, filters: {...}, createdAt }

// Formato de uma pasta:
// { id, name, color, createdAt }

export const useQuestionsStore = create(
  persist(
    (set, get) => ({
      questions: [],
      answers: [],
      lastSync: null,
      cadernos: [],
      folders: [],

      // ─── SYNC FROM MAGO ──────────────────────────────────────────────
      async syncFromMago() {
        try {
          questionAdapter.clearCache();
          const questoes = await questionAdapter.fetchAll(500);
          if (questoes.length === 0) {
            return { success: false, count: 0, errors: ['Nenhuma questão encontrada no MAGO'] };
          }

          const imported = questoes.map(q => ({
            id: q.id,
            enunciado: q.enunciado,
            alternativas: q.alternativas,
            gabarito: q.gabarito,
            materia: q.materia || 'Geral',
            topico: q.topico || '',
            subtopico: q.subtopico || null,
            assunto: q.assunto || '',
            subjectId: null,
            topicId: null,
            subtopicId: null,
            banca: q.banca || '',
            orgao: q.orgao || '',
            cargo: q.cargo || '',
            carreira: q.carreira || '',
            escolaridade: q.escolaridade || '',
            areaFormacao: q.areaFormacao || '',
            prova: q.prova || '',
            edital: q.edital || '',
            ano: q.ano || null,
            regiao: q.regiao || '',
            codigo: q.codigo || '',
            dificuldade: q.dificuldade || null,
            tags: q.tags || [],
            explicacao: q.explicacao || '',
            createdAt: Date.now(),
          }));

          // Merge: preserve existing subjectId/topicId/subtopicId links
          const existingMap = {};
          for (const q of get().questions) {
            existingMap[q.id] = { subjectId: q.subjectId, topicId: q.topicId, subtopicId: q.subtopicId };
          }

          const merged = imported.map(q => ({
            ...q,
            ...(existingMap[q.id] || {}),
          }));

          set({ questions: merged, lastSync: Date.now() });
          return { success: true, count: merged.length, newCount: imported.filter(q => !existingMap[q.id]).length, errors: [] };
        } catch (error) {
          console.error('[MAGO] Erro ao sincronizar:', error);
          return { success: false, count: 0, errors: [error.message] };
        }
      },

      // ─── LINK QUESTIONS → SUBJECTS ────────────────────────────────────
      linkQuestionsToSubjects(subjects) {
        const { questions } = get();
        const newMaterias = [];
        const updates = {};

        for (const q of questions) {
          if (q.subjectId) continue;
          const match = subjects.find(s => s.name.toLowerCase() === q.materia.toLowerCase());
          if (match) {
            updates[q.id] = { subjectId: match.id };
          } else if (!newMaterias.includes(q.materia)) {
            newMaterias.push(q.materia);
          }
        }

        if (Object.keys(updates).length > 0) {
          set(state => ({
            questions: state.questions.map(q => updates[q.id] ? { ...q, ...updates[q.id] } : q),
          }));
        }
        return newMaterias;
      },

      applySubjectLinks(materiaToSubjectId) {
        set(state => ({
          questions: state.questions.map(q => {
            if (q.subjectId) return q;
            const newId = materiaToSubjectId[q.materia];
            return newId ? { ...q, subjectId: newId } : q;
          }),
        }));
      },

      // ─── ANSWERS ──────────────────────────────────────────────────────
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

      // ─── FILTERED QUESTIONS ───────────────────────────────────────────
      getFilteredQuestions(filters = {}) {
        const { questions, answers } = get();
        const answerMap = {};
        for (const a of answers) {
          answerMap[a.questionId] = a.correct;
        }

        let result = questions;

        // Status filter
        if (filters.status === 'resolved') {
          result = result.filter(q => answerMap[q.questionId] !== undefined);
        } else if (filters.status === 'unresolved') {
          result = result.filter(q => answerMap[q.questionId] === undefined);
        } else if (filters.status === 'correct') {
          result = result.filter(q => answerMap[q.questionId] === true);
        } else if (filters.status === 'wrong') {
          result = result.filter(q => answerMap[q.questionId] === false);
        }

        // Multi-select filters
        if (filters.materias?.length > 0) {
          const set = new Set(filters.materias.map(m => m.toLowerCase()));
          result = result.filter(q => set.has(q.materia?.toLowerCase()));
        }
        if (filters.assuntos?.length > 0) {
          const set = new Set(filters.assuntos.map(a => a.toLowerCase()));
          result = result.filter(q =>
            set.has(q.assunto?.toLowerCase()) || set.has(q.topico?.toLowerCase())
          );
        }
        if (filters.bancas?.length > 0) {
          const set = new Set(filters.bancas.map(b => b.toLowerCase()));
          result = result.filter(q => set.has(q.banca?.toLowerCase()));
        }
        if (filters.anos?.length > 0) {
          const set = new Set(filters.anos.map(Number));
          result = result.filter(q => q.ano && set.has(q.ano));
        }
        if (filters.dificuldades?.length > 0) {
          const set = new Set(filters.dificuldades);
          result = result.filter(q => q.dificuldade && set.has(q.dificuldade));
        }
        if (filters.orgaos?.length > 0) {
          const set = new Set(filters.orgaos.map(o => o.toLowerCase()));
          result = result.filter(q => set.has(q.orgao?.toLowerCase()));
        }
        if (filters.cargos?.length > 0) {
          const set = new Set(filters.cargos.map(c => c.toLowerCase()));
          result = result.filter(q => set.has(q.cargo?.toLowerCase()));
        }

        // Keyword
        if (filters.keyword?.trim()) {
          const kw = filters.keyword.toLowerCase().trim();
          result = result.filter(q =>
            q.enunciado?.toLowerCase().includes(kw) ||
            q.topico?.toLowerCase().includes(kw) ||
            q.assunto?.toLowerCase().includes(kw) ||
            q.materia?.toLowerCase().includes(kw) ||
            q.banca?.toLowerCase().includes(kw) ||
            (q.tags && q.tags.some(t => t.toLowerCase().includes(kw)))
          );
        }

        return result;
      },

      // ─── ANSWER STATUS MAP ────────────────────────────────────────────
      getAnswerStatus() {
        const { questions, answers } = get();
        const map = {};
        for (const q of questions) {
          map[q.id] = 'unanswered';
        }
        for (const a of answers) {
          map[a.questionId] = a.correct ? 'correct' : 'wrong';
        }
        return map;
      },

      // ─── CADERNOS CRUD ────────────────────────────────────────────────
      createCaderno(name, filters = {}, folderId = null) {
        const caderno = {
          id: `cad_${Date.now()}`,
          name,
          folderId,
          filters,
          createdAt: Date.now(),
        };
        set(state => ({ cadernos: [...state.cadernos, caderno] }));
        return caderno;
      },

      updateCaderno(id, data) {
        set(state => ({
          cadernos: state.cadernos.map(c => c.id === id ? { ...c, ...data } : c),
        }));
      },

      deleteCaderno(id) {
        set(state => ({ cadernos: state.cadernos.filter(c => c.id !== id) }));
      },

      // ─── FOLDERS CRUD ─────────────────────────────────────────────────
      createFolder(name, color = '#8B5CF6') {
        const folder = {
          id: `folder_${Date.now()}`,
          name,
          color,
          createdAt: Date.now(),
        };
        set(state => ({ folders: [...state.folders, folder] }));
        return folder;
      },

      updateFolder(id, data) {
        set(state => ({
          folders: state.folders.map(f => f.id === id ? { ...f, ...data } : f),
        }));
      },

      deleteFolder(id) {
        set(state => ({
          folders: state.folders.filter(f => f.id !== id),
          cadernos: state.cadernos.map(c =>
            c.folderId === id ? { ...c, folderId: null } : c
          ),
        }));
      },

      // ─── SELECTORS ────────────────────────────────────────────────────
      deleteQuestion: id =>
        set(state => ({
          questions: state.questions.filter(q => q.id !== id),
        })),

      updateQuestion: (id, data) =>
        set(state => ({
          questions: state.questions.map(q => q.id !== id ? q : { ...q, ...data }),
        })),

      getQuestionsBySubject: subjectId =>
        get().questions.filter(q => q.subjectId === subjectId),

      getQuestionsByMateria: materia =>
        get().questions.filter(q => q.materia === materia),

      getUnansweredQuestions: (questionIds = null) => {
        const answeredIds = new Set(get().answers.map(a => a.questionId));
        const pool = questionIds
          ? get().questions.filter(q => questionIds.includes(q.id))
          : get().questions;
        return pool.filter(q => !answeredIds.has(q.id));
      },

      getWeakQuestions: (subjectId = null) => {
        const { answers, questions } = get();
        const byQuestion = {};
        answers.forEach(a => {
          if (!byQuestion[a.questionId]) byQuestion[a.questionId] = [];
          byQuestion[a.questionId].push(a);
        });
        const weakIds = Object.entries(byQuestion)
          .filter(([, list]) => !list[list.length - 1].correct)
          .map(([id]) => id);
        return questions.filter(q =>
          weakIds.includes(q.id) && (!subjectId || q.subjectId === subjectId)
        );
      },

      getStatsBySubject: subjectId => {
        const { answers, questions } = get();
        const ids = new Set(questions.filter(q => q.subjectId === subjectId).map(q => q.id));
        const relevant = answers.filter(a => ids.has(a.questionId));
        const correct = relevant.filter(a => a.correct).length;
        return {
          total: relevant.length,
          correct,
          accuracy: relevant.length > 0 ? Math.round((correct / relevant.length) * 100) : null,
        };
      },

      getStatsByMateria: materia => {
        const { answers, questions } = get();
        const ids = new Set(questions.filter(q => q.materia === materia).map(q => q.id));
        const relevant = answers.filter(a => ids.has(a.questionId));
        const correct = relevant.filter(a => a.correct).length;
        return {
          total: relevant.length,
          correct,
          accuracy: relevant.length > 0 ? Math.round((correct / relevant.length) * 100) : null,
          questionCount: questions.filter(q => q.materia === materia).length,
        };
      },

      getRandomMixed: (count = 20, subjectIds = null) => {
        const pool = subjectIds
          ? get().questions.filter(q => subjectIds.includes(q.subjectId))
          : get().questions;
        const shuffled = [...pool].sort(() => Math.random() - 0.5);
        return shuffled.slice(0, count);
      },

      getMateriaStats: () => {
        const { questions, answers } = get();
        const map = {};
        for (const q of questions) {
          const m = q.materia || 'Geral';
          if (!map[m]) map[m] = { materia: m, total: 0, answered: 0, correct: 0 };
          map[m].total++;
        }
        for (const a of answers) {
          const q = questions.find(q => q.id === a.questionId);
          if (!q) continue;
          const m = q.materia || 'Geral';
          if (!map[m]) map[m] = { materia: m, total: 0, answered: 0, correct: 0 };
          map[m].answered++;
          if (a.correct) map[m].correct++;
        }
        return Object.values(map).sort((a, b) => b.total - a.total);
      },

      // Unique filter values from loaded questions
      getFilterValues: () => {
        const { questions } = get();
        const maps = {
          materias: {}, assuntos: {}, bancas: {}, anos: {},
          orgaos: {}, cargos: {}, escolaridades: {}, areasFormacao: {},
        };
        for (const q of questions) {
          if (q.materia) maps.materias[q.materia] = (maps.materias[q.materia] || 0) + 1;
          if (q.assunto || q.topico) {
            const a = q.assunto || q.topico;
            maps.assuntos[a] = (maps.assuntos[a] || 0) + 1;
          }
          if (q.banca) maps.bancas[q.banca] = (maps.bancas[q.banca] || 0) + 1;
          if (q.ano) maps.anos[String(q.ano)] = (maps.anos[String(q.ano)] || 0) + 1;
          if (q.orgao) maps.orgaos[q.orgao] = (maps.orgaos[q.orgao] || 0) + 1;
          if (q.cargo) maps.cargos[q.cargo] = (maps.cargos[q.cargo] || 0) + 1;
          if (q.escolaridade) maps.escolaridades[q.escolaridade] = (maps.escolaridades[q.escolaridade] || 0) + 1;
          if (q.areaFormacao) maps.areasFormacao[q.areaFormacao] = (maps.areasFormacao[q.areaFormacao] || 0) + 1;
        }
        const toSorted = obj =>
          Object.entries(obj).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
        return {
          materias: toSorted(maps.materias),
          assuntos: toSorted(maps.assuntos),
          bancas: toSorted(maps.bancas),
          anos: toSorted(maps.anos).sort((a, b) => Number(b.name) - Number(a.name)),
          orgaos: toSorted(maps.orgaos),
          cargos: toSorted(maps.cargos),
          escolaridades: toSorted(maps.escolaridades),
          areasFormacao: toSorted(maps.areasFormacao),
        };
      },
    }),
    { name: 'phoenix-questions' }
  )
);
