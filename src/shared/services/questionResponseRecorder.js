import { questionsDb, isQuestionsConfigured } from '../config/firebaseQuestions';
import { doc, setDoc } from 'firebase/firestore';

// ═══════════════════════════════════════════════════════════════
// MAGO — Record user answers to respostasHistorico
// ═══════════════════════════════════════════════════════════════

/**
 * Record a user's answer to a question
 * @param {Object} input
 * @param {string} input.userId - Firebase Auth UID
 * @param {string} input.questaoId - Question document ID
 * @param {string} input.selecionada - Selected letter (A-E)
 * @param {boolean} input.correta - Whether answer was correct
 * @param {number} [input.tempoResposta] - Response time in ms
 */
export async function registrarResposta({ userId, questaoId, selecionada, correta, tempoResposta }) {
  if (!isQuestionsConfigured() || !questionsDb) {
    console.warn('MAGO Questions not configured — answer not recorded');
    return;
  }

  const docId = `resp_${userId}_${questaoId}_${Date.now()}`;

  try {
    await setDoc(doc(questionsDb, 'respostasHistorico', docId), {
      userId,
      questaoId,
      selecionada,
      correta,
      tempoResposta: tempoResposta || null,
      data: new Date().toISOString(),
      fonte: 'phoenix',
    });
  } catch (e) {
    console.error('Failed to record answer:', e);
  }
}
