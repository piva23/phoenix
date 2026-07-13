import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "dummy-api-key-phoenix",
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "phoenix-project-app.firebaseapp.com",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "phoenix-project-app",
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "phoenix-project-app.firebasestorage.app",
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "502923931226",
  appId: process.env.REACT_APP_FIREBASE_APP_ID || "1:502923931226:web:8a5a3c4bc6331736faf263",
};

// Diagnostic log for local debugging
if (typeof window !== 'undefined') {
  const isDummy = firebaseConfig.apiKey === "dummy-api-key-phoenix";
  console.log("🔍 [Phoenix OS] Configuração do Firebase carregada:", {
    origemKey: isDummy ? "Fictícia / Dummy" : "Ficheiro .env detetado com sucesso",
    apiKeyParcial: firebaseConfig.apiKey ? `${firebaseConfig.apiKey.substring(0, 6)}...` : "Nenhuma",
    projectId: firebaseConfig.projectId
  });
  if (isDummy) {
    console.warn("⚠️ [Phoenix OS] Atenção: O Firebase está a usar uma chave fictícia porque a variável 'REACT_APP_FIREBASE_API_KEY' não foi encontrada no .env ou o servidor local não foi reiniciado após criar o .env. Se editou o .env, pare o servidor (Ctrl+C) e execute 'npm run dev' novamente.");
  }
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
export default app;
