import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useVisionStore = create(
  persist(
    (set, get) => ({
      items: [],
      addItem: (data) => set(state => ({ items: [...state.items, { ...data, id: `vis_${Date.now()}`, personaId: data.personaId || null, active: true, createdAt: Date.now() }] })),
      updateItem: (id, data) => set(state => ({ items: state.items.map(i => i.id !== id ? i : { ...i, ...data }) })),
      deleteItem: (id) => set(state => ({ items: state.items.filter(i => i.id !== id) })),
      toggleItem: (id) => set(state => ({ items: state.items.map(i => i.id !== id ? i : { ...i, active: !i.active }) })),
      reorderItems: (newOrder) => set({ items: newOrder }),
      getItemsForPersona: (personaId) => get().items.filter(i => i.active && (i.personaId === null || i.personaId === personaId)),
    }),
    { name: 'phoenix-vision' }
  )
)
