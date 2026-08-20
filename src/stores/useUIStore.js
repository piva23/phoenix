import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useUIStore = create(
  persist(
    (set) => ({
      sidebarOpen: true,
      activeMobileTab: 'dashboard',
      personaSwitcherOpen: false,

      toggleSidebar: () => set(state => ({ sidebarOpen: !state.sidebarOpen })),
      setMobileTab: (tab) => set({ activeMobileTab: tab }),
      openPersonaSwitcher: () => set({ personaSwitcherOpen: true }),
      closePersonaSwitcher: () => set({ personaSwitcherOpen: false }),
    }),
    {
      name: 'phoenix-ui',
      partialize: (s) => ({ sidebarOpen: s.sidebarOpen }),
    }
  )
)
