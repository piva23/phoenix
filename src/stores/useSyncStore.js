import { create } from 'zustand';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../shared/config/firebase';

const SYNC_INTERVALS = {
  '5min': 5 * 60 * 1000,
  '15min': 15 * 60 * 1000,
  '30min': 30 * 60 * 1000,
  '1h': 60 * 60 * 1000,
  '2h': 2 * 60 * 60 * 1000,
  '6h': 6 * 60 * 60 * 1000,
  '12h': 12 * 60 * 60 * 1000,
  '24h': 24 * 60 * 60 * 1000,
  'manual': null,
};

export const SYNC_INTERVAL_OPTIONS = [
  { value: '5min', label: 'A cada 5 minutos' },
  { value: '15min', label: 'A cada 15 minutos' },
  { value: '30min', label: 'A cada 30 minutos' },
  { value: '1h', label: 'A cada 1 hora' },
  { value: '2h', label: 'A cada 2 horas' },
  { value: '6h', label: 'A cada 6 horas' },
  { value: '12h', label: 'A cada 12 horas' },
  { value: '24h', label: 'A cada 24 horas' },
  { value: 'manual', label: 'Somente manual' },
];

export const useSyncStore = create((set, get) => ({
  // State
  interval: '15min',  // Default sync interval
  isSyncing: false,
  lastSynced: null,
  error: null,
  syncTimerId: null,

  // Set sync interval
  setInterval: (newInterval) => {
    set({ interval: newInterval });
    // Restart timer with new interval
    get().stopAutoSync();
    get().startAutoSync();
  },

  // Start auto sync
  startAutoSync: () => {
    const { interval, syncTimerId } = get();
    if (syncTimerId) clearInterval(syncTimerId);
    
    const ms = SYNC_INTERVALS[interval];
    if (!ms) return; // 'manual' mode — no timer
    
    const timerId = setInterval(() => {
      get().syncToCloud();
    }, ms);
    
    set({ syncTimerId: timerId });
  },

  // Stop auto sync
  stopAutoSync: () => {
    const { syncTimerId } = get();
    if (syncTimerId) clearInterval(syncTimerId);
    set({ syncTimerId: null });
  },

  // Sync to cloud
  syncToCloud: async () => {
    const { isSyncing } = get();
    if (isSyncing) return;
    
    set({ isSyncing: true, error: null });
    
    try {
      // Get the current user's UID from Firebase Auth
      const { getAuth } = await import('firebase/auth');
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) {
        set({ isSyncing: false, error: 'User not authenticated' });
        return;
      }
      
      // Collect data from all stores
      const { useHealthStore } = await import('./useHealthStore');
      const { useStudyStore } = await import('./useStudyStore');
      const { useFinanceStore } = await import('./useFinanceStore');
      const { useAchievementStore } = await import('./useAchievementStore');
      const { useGameStore } = await import('./useGameStore');
      
      const syncData = {
        health: useHealthStore.getState().plans,
        study: useStudyStore.getState(),
        finance: useFinanceStore.getState(),
        achievements: useAchievementStore.getState(),
        game: useGameStore.getState(),
        lastSynced: new Date().toISOString(),
      };
      
      // Save to Firestore
      const userDocRef = doc(db, 'users', user.uid, 'syncData', 'main');
      await setDoc(userDocRef, syncData);
      
      set({ isSyncing: false, lastSynced: syncData.lastSynced });
      console.log('[sync] Cloud sync completed at', syncData.lastSynced);
    } catch (e) {
      console.error('[sync] Cloud sync failed:', e);
      set({ isSyncing: false, error: e.message });
    }
  },

  // Load from cloud
  loadFromCloud: async () => {
    try {
      const { getAuth } = await import('firebase/auth');
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) return false;
      
      const userDocRef = doc(db, 'users', user.uid, 'syncData', 'main');
      const docSnap = await getDoc(userDocRef);
      
      if (!docSnap.exists()) return false;
      
      const data = docSnap.data();
      
      // Restore each store
      if (data.health) {
        const { useHealthStore } = await import('./useHealthStore');
        useHealthStore.setState({ plans: data.health });
      }
      if (data.study) {
        const { useStudyStore } = await import('./useStudyStore');
        useStudyStore.setState(data.study);
      }
      if (data.finance) {
        const { useFinanceStore } = await import('./useFinanceStore');
        useFinanceStore.setState(data.finance);
      }
      if (data.achievements) {
        const { useAchievementStore } = await import('./useAchievementStore');
        useAchievementStore.setState(data.achievements);
      }
      if (data.game) {
        const { useGameStore } = await import('./useGameStore');
        useGameStore.setState(data.game);
      }
      
      set({ lastSynced: data.lastSynced });
      console.log('[sync] Cloud data loaded, last synced:', data.lastSynced);
      return true;
    } catch (e) {
      console.error('[sync] Load from cloud failed:', e);
      return false;
    }
  },
}));
