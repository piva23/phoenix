import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { calcLevel } from '../shared/utils/xp'

export const useUserStore = create(
  persist(
    (set) => ({
      name: 'Felipe',
      xp: 0,
      level: 1,
      favoriteModules: ['study'],

      addXP: (amount) => set(state => {
        const newXP = state.xp + amount
        return { xp: newXP, level: calcLevel(newXP) }
      }),

      toggleFavoriteModule: (moduleId) => set(state => {
        const favs = state.favoriteModules
        if (favs.includes(moduleId)) return { favoriteModules: favs.filter(m => m !== moduleId) }
        const next = favs.length >= 2 ? [favs[1], moduleId] : [...favs, moduleId]
        return { favoriteModules: next }
      }),
    }),
    { name: 'phoenix-user' }
  )
)
