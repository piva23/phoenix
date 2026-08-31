import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

if (process.env.NODE_ENV === 'development') {
  console.warn("LEMBRETE: Autorize o domínio atual (ex: localhost) no Firebase Console -> Authentication -> Settings -> Authorized domains");
}

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || '',
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || '',
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || '',
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.REACT_APP_FIREBASE_APP_ID || '',
};

// Só inicializa Firebase se as credenciais estiverem configuradas
let app = null;
let auth = null;
let db = null;
let googleProvider = null;

if (firebaseConfig.apiKey && firebaseConfig.projectId) {
  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    googleProvider = new GoogleAuthProvider();
  } catch (e) {
    console.warn('Firebase init failed:', e.message);
  }
} else {
  console.warn('Firebase credentials not configured — running in offline mode');
}

export { auth, db, googleProvider };
