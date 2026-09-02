import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useUIStore = create(
  persist(
    (set) => ({
      sidebarOpen: true,
      activeMobileTab: 'dashboard',

      toggleSidebar: () => set(state => ({ sidebarOpen: !state.sidebarOpen })),
      setMobileTab: (tab) => set({ activeMobileTab: tab }),
    }),
    {
      name: 'phoenix-ui',
      partialize: (s) => ({ sidebarOpen: s.sidebarOpen }),
    }
  )
)
