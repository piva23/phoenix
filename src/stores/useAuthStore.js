import { create } from 'zustand';
import { auth, googleProvider } from '../shared/config/firebase';
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';

export const useAuthStore = create((set) => ({
  user: null,
  loading: true,

  loginWithGoogle: async () => {
    if (!auth || !googleProvider) {
      console.warn('Firebase auth not configured');
      set({ loading: false });
      return null;
    }
    try {
      set({ loading: true });
      const result = await signInWithPopup(auth, googleProvider);
      set({ user: result.user, loading: false });
      return result.user;
    } catch (error) {
      console.error("Erro ao fazer login com Google:", error);
      set({ loading: false });
      throw error;
    }
  },

  logout: async () => {
    if (!auth) {
      set({ user: null, loading: false });
      return;
    }
    try {
      set({ loading: true });
      await signOut(auth);
      set({ user: null, loading: false });
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
      set({ loading: false });
      throw error;
    }
  },

  initializeAuth: () => {
    if (!auth) {
      set({ user: null, loading: false });
      return () => {};
    }
    // Return unsubscribe function in case caller wants to cleanup
    return onAuthStateChanged(auth, (user) => {
      set({ user: user, loading: false });
    });
  },
}));
