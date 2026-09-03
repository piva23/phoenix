import { questionsDb, isQuestionsConfigured } from '../shared/config/firebaseQuestions';
import { collection, getDocs, query, where, orderBy, limit as firestoreLimit } from 'firebase/firestore';
import { ACTIVE_STATUSES, LETTER_TO_INDEX } from '../shared/constants/dificuldade';

// ═══════════════════════════════════════════════════════════════
// MAGO Question Adapter Service
// Used by useQuestionsStore for syncFromMago()
// ═══════════════════════════════════════════════════════════════

let cachedQuestions = null;

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export const questionAdapter = {
  clearCache() {
    cachedQuestions = null;
  },

  /**
   * Fetch all active questions from MAGO Firestore
   * @param {number} count - Max questions to fetch
   * @returns {Promise<Array>} Raw Firestore questions
   */
  async fetchAll(count = 500) {
    if (!isQuestionsConfigured() || !questionsDb) {
      console.warn('[MAGO] Questions DB not configured');
      return [];
    }

    if (cachedQuestions) return cachedQuestions;

    try {
      const q = query(
        collection(questionsDb, 'questoes'),
        where('status', 'in', ACTIVE_STATUSES),
        firestoreLimit(count)
      );
      const snap = await getDocs(q);
      const questions = [];

      snap.forEach((docSnap) => {
        const data = docSnap.data();
        // Only multiple choice for quiz
        if (data.tipo === 'multipla_escolha') {
          questions.push({
            id: docSnap.id,
            enunciado: data.enunciado || '',
            alternativas: data.alternativas || [],
            gabarito: data.gabarito || 'A',
            tipo: data.tipo,
            materia: data.materia || 'Geral',
            assunto: data.assunto || '',
            topico: data.topico || '',
            subtopico: data.subtopico || null,
            tags: data.tags || [],
            dificuldade: data.dificuldade || 'medio',
            status: data.status,
            explicacao: data.explicacao || '',
            banca: data.banca || '',
            orgao: data.orgao || '',
            cargo: data.cargo || '',
            carreira: data.carreira || '',
            escolaridade: data.escolaridade || '',
            areaFormacao: data.areaFormacao || '',
            prova: data.prova || '',
            edital: data.edital || '',
            ano: data.ano || null,
            regiao: data.regiao || '',
            codigo: data.codigo || '',
            esfera: data.esfera || null,
            xp: data.xp || 10,
          });
        }
      });

      cachedQuestions = questions;
      return questions;
    } catch (error) {
      console.error('[MAGO] Error fetching questions:', error);
      throw error;
    }
  },

  /**
   * Get quiz questions adapted for Phoenix format
   * @param {string} subject - Filter by subject/topic
   * @param {number} count - Number of questions
   * @returns {Promise<Array>} Adapted quiz questions
   */
  async getQuizBySubject(subject, count = 3) {
    const all = await this.fetchAll(200);
    const filtered = all.filter(
      (q) =>
        q.materia?.toLowerCase().includes(subject.toLowerCase()) ||
        q.topico?.toLowerCase().includes(subject.toLowerCase()) ||
        q.subtopico?.toLowerCase().includes(subject.toLowerCase()) ||
        q.tags?.some((t) => t.toLowerCase().includes(subject.toLowerCase()))
    );
    return shuffle(filtered).slice(0, count).map(this.adaptToQuiz);
  },

  /**
   * Get random quiz questions
   * @param {number} count
   * @returns {Promise<Array>}
   */
  async getRandomQuiz(count = 3) {
    const all = await this.fetchAll(200);
    return shuffle(all).slice(0, count).map(this.adaptToQuiz);
  },

  /**
   * Adapt a Firestore question to Phoenix quiz format
   * @param {Object} q - Firestore question
   * @returns {Object} Quiz question
   */
  adaptToQuiz(q) {
    const sorted = [...q.alternativas].sort(
      (a, b) => (LETTER_TO_INDEX[a.id] ?? 99) - (LETTER_TO_INDEX[b.id] ?? 99)
    );
    const gabarito = q.gabarito?.toUpperCase().trim() ?? 'A';
    return {
      id: q.id,
      questionPt: q.enunciado,
      optionsPt: sorted.map((a) => a.texto),
      answerIndex: LETTER_TO_INDEX[gabarito] ?? 0,
      explicacao: q.explicacao,
      materia: q.materia,
      dificuldade: q.dificuldade,
    };
  },

  /**
   * Get stats about the question bank
   * @returns {Promise<Object>}
   */
  async getStats() {
    const all = await this.fetchAll(1000);
    const porMateria = {};
    for (const q of all) {
      const key = q.materia || 'Outros';
      porMateria[key] = (porMateria[key] || 0) + 1;
    }
    return { total: all.length, porMateria };
  },

  /**
   * Check if question bank is available
   * @returns {Promise<boolean>}
   */
  async isAvailable() {
    const all = await this.fetchAll(1);
    return all.length > 0;
  },
};
