import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// ═══════════════════════════════════════════════════════════════
// MAGO Question Admin — second Firebase project for question bank
// ═══════════════════════════════════════════════════════════════

const questionsConfig = {
  apiKey: process.env.REACT_APP_QUESTIONS_API_KEY || '',
  authDomain: process.env.REACT_APP_QUESTIONS_AUTH_DOMAIN || '',
  projectId: process.env.REACT_APP_QUESTIONS_PROJECT_ID || '',
  storageBucket: process.env.REACT_APP_QUESTIONS_STORAGE_BUCKET || '',
  messagingSenderId: process.env.REACT_APP_QUESTIONS_MESSAGING_SENDER_ID || '',
  appId: process.env.REACT_APP_QUESTIONS_APP_ID || '',
};

let questionsApp = null;
let questionsDbInstance = null;

if (questionsConfig.apiKey && questionsConfig.projectId) {
  try {
    questionsApp = initializeApp(questionsConfig, 'questions');
    questionsDbInstance = getFirestore(questionsApp);
  } catch (e) {
    console.warn('MAGO Questions Firebase init failed:', e.message);
  }
} else {
  console.warn('MAGO Questions credentials not configured — question bank disabled');
}

export const questionsDb = questionsDbInstance;

export function isQuestionsConfigured() {
  return questionsDb !== null;
}
