import { questionsDb, isQuestionsConfigured } from '../config/firebaseQuestions';
import { collection, getDocs, query, where, limit as firestoreLimit } from 'firebase/firestore';
import { ACTIVE_STATUSES, LETTER_TO_INDEX } from '../constants/dificuldade';

// ═══════════════════════════════════════════════════════════════
// Types (JSDoc for CRA compatibility)
// ═══════════════════════════════════════════════════════════════

/**
 * @typedef {Object} QuizQuestion
 * @property {string} id
 * @property {string} questionPt
 * @property {string[]} optionsPt
 * @property {number} answerIndex
 * @property {string} [explicacao]
 * @property {string} [materia]
 * @property {string} [dificuldade]
 */

/**
 * @typedef {Object} FirestoreQuestao
 * @property {string} id
 * @property {string} enunciado
 * @property {{ id: string; texto: string }[]} alternativas
 * @property {string} gabarito
 * @property {string} tipo
 * @property {string} materia
 * @property {string} topico
 * @property {string} [subtopico]
 * @property {string[]} [tags]
 * @property {string} dificuldade
 * @property {string} status
 * @property {string} [explicacao]
 */

// ═══════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Adapt Firestore question to Phoenix quiz format
 * @param {FirestoreQuestao} q
 * @returns {QuizQuestion}
 */
function adaptToQuiz(q) {
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
}

/**
 * Fetch active questions from MAGO Firestore
 * @param {number} count
 * @returns {Promise<FirestoreQuestao[]>}
 */
async function fetchActive(count = 100) {
  if (!isQuestionsConfigured() || !questionsDb) return [];
  const q = query(
    collection(questionsDb, 'questoes'),
    where('status', 'in', ACTIVE_STATUSES),
    firestoreLimit(count)
  );
  const snap = await getDocs(q);
  const out = [];
  snap.forEach((docSnap) => {
    const data = docSnap.data();
    data.id = docSnap.id;
    // Only multiple choice for quiz
    if (data.tipo === 'multipla_escolha') out.push(data);
  });
  return out;
}

// ═══════════════════════════════════════════════════════════════
// Public API
// ═══════════════════════════════════════════════════════════════

export const questionAdapter = {
  /**
   * Quiz filtered by subject/topic
   * @param {string} subject
   * @param {number} count
   * @returns {Promise<QuizQuestion[]>}
   */
  async getQuizBySubject(subject, count = 3) {
    const all = await fetchActive(200);
    const filtered = all.filter(
      (q) =>
        q.materia?.toLowerCase().includes(subject.toLowerCase()) ||
        q.topico?.toLowerCase().includes(subject.toLowerCase()) ||
        q.subtopico?.toLowerCase().includes(subject.toLowerCase()) ||
        q.tags?.some((t) => t.toLowerCase().includes(subject.toLowerCase()))
    );
    return shuffle(filtered).slice(0, count).map(adaptToQuiz);
  },

  /**
   * Random quiz
   * @param {number} count
   * @returns {Promise<QuizQuestion[]>}
   */
  async getRandomQuiz(count = 3) {
    const all = await fetchActive(200);
    return shuffle(all).slice(0, count).map(adaptToQuiz);
  },

  /**
   * Simple stats
   * @returns {Promise<{ total: number; porMateria: Record<string, number> }>}
   */
  async getStats() {
    const all = await fetchActive(1000);
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
    const all = await fetchActive(1);
    return all.length > 0;
  },
};
