import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

console.warn("LEMBRETE: Autorize o domínio atual (ex: localhost) no Firebase Console -> Authentication -> Settings -> Authorized domains");

// Using import.meta.env for configuration as requested, with a process.env fallback to support CRA packaging
const getEnvVal = (key) => {
  try {
    // @ts-ignore
    const metaEnv = import.meta.env;
    if (metaEnv && metaEnv[key]) {
      return metaEnv[key];
    }
  } catch (e) {}
  try {
    // @ts-ignore
    const procEnv = process.env;
    if (procEnv && procEnv[key]) {
      return procEnv[key];
    }
  } catch (e) {}
  return '';
};

const firebaseConfig = {
  apiKey: getEnvVal('VITE_FIREBASE_API_KEY') || getEnvVal('REACT_APP_FIREBASE_API_KEY'),
  authDomain: getEnvVal('VITE_FIREBASE_AUTH_DOMAIN') || getEnvVal('REACT_APP_FIREBASE_AUTH_DOMAIN'),
  projectId: getEnvVal('VITE_FIREBASE_PROJECT_ID') || getEnvVal('REACT_APP_FIREBASE_PROJECT_ID'),
  storageBucket: getEnvVal('VITE_FIREBASE_STORAGE_BUCKET') || getEnvVal('REACT_APP_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: getEnvVal('VITE_FIREBASE_MESSAGING_SENDER_ID') || getEnvVal('REACT_APP_FIREBASE_MESSAGING_SENDER_ID'),
  appId: getEnvVal('VITE_FIREBASE_APP_ID') || getEnvVal('REACT_APP_FIREBASE_APP_ID')
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

export { auth, db, googleProvider };
