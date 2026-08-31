import { create } from 'zustand';
import { auth, googleProvider } from '../shared/config/firebase';
import { signInWithPopup, signInWithRedirect, signOut, onAuthStateChanged } from 'firebase/auth';

export const useAuthStore = create((set, get) => ({
  user: null,
  loading: true,
  error: null,
  isFirebaseConfigured: !!auth,

  loginWithGoogle: async () => {
    if (!auth || !googleProvider) {
      console.warn('Firebase auth not configured — running in offline mode');
      set({ loading: false, error: 'Firebase não configurado. Modo offline.' });
      return null;
    }
    try {
      set({ loading: true, error: null });
      // Try popup first, fallback to redirect on popup-blocked
      try {
        const result = await signInWithPopup(auth, googleProvider);
        set({ user: result.user, loading: false, error: null });
        return result.user;
      } catch (popupError) {
        if (popupError.code === 'auth/popup-blocked' || popupError.code === 'auth/cancelled-popup-request') {
          console.warn('Popup blocked, falling back to redirect...');
          await signInWithRedirect(auth, googleProvider);
          return null; // Will be handled by onAuthStateChanged after redirect
        }
        throw popupError;
      }
    } catch (error) {
      console.error("Erro ao fazer login com Google:", error);
      set({ loading: false, error: error.message });
      throw error;
    }
  },

  loginOffline: () => {
    // Allow offline mode with a synthetic user
    set({
      user: {
        uid: 'offline-user',
        displayName: 'Estudante',
        email: 'offline@phoenix.local',
        photoURL: null,
      },
      loading: false,
      error: null,
    });
  },

  logout: async () => {
    if (!auth) {
      set({ user: null, loading: false });
      return;
    }
    try {
      set({ loading: true });
      await signOut(auth);
      set({ user: null, loading: false, error: null });
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
      set({ loading: false, error: error.message });
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
      set({ user: user, loading: false, error: null });
    });
  },

  // Helpers
  getDisplayName: () => {
    const { user } = get();
    return user?.displayName || 'Estudante';
  },
  getInitials: () => {
    const { user } = get();
    const name = user?.displayName || 'Estudante';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  },
  getPhotoURL: () => {
    const { user } = get();
    return user?.photoURL || null;
  },
}));
