import { create } from 'zustand';
import { auth, googleProvider } from '../shared/config/firebase';
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';

// Safely load initially saved demo user if it exists to prevent login flicker
const getInitialUser = () => {
  try {
    const saved = localStorage.getItem('phoenix_demo_user');
    return saved ? JSON.parse(saved) : null;
  } catch (e) {
    return null;
  }
};

const initialUser = getInitialUser();

export const useAuthStore = create((set, get) => {
  // Listen to Firebase auth state changes
  onAuthStateChanged(auth, (firebaseUser) => {
    const currentUser = get().user;
    // Do not overwrite user if they are currently logged in as a demo/local user
    if (currentUser?.isDemo) {
      set({ loading: false });
      return;
    }
    set({ user: firebaseUser, loading: false });
  });

  return {
    user: initialUser,
    loading: !initialUser, // Set to false if we have a cached local session, otherwise wait for firebase
    loginWithGoogle: async () => {
      try {
        const result = await signInWithPopup(auth, googleProvider);
        // Clear local demo state if signing in via Google
        localStorage.removeItem('phoenix_demo_user');
        set({ user: result.user });
        return result.user;
      } catch (err) {
        console.error('Google login failed:', err);
        throw err;
      }
    },
    loginAsDemo: async (name = 'Operador Phoenix', email = 'operador@phoenix.os') => {
      const demoUser = {
        uid: 'demo-user',
        displayName: name,
        email: email,
        photoURL: null,
        isDemo: true,
      };
      localStorage.setItem('phoenix_demo_user', JSON.stringify(demoUser));
      set({ user: demoUser, loading: false });
      return demoUser;
    },
    logout: async () => {
      try {
        localStorage.removeItem('phoenix_demo_user');
        await signOut(auth);
        set({ user: null });
      } catch (err) {
        console.error('Logout failed:', err);
        throw err;
      }
    },
  };
});
