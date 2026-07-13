import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useInboxStore = create(
  persist(
    (set) => ({
      items: [],

      addItem: (content, source = 'manual') => set((state) => ({
        items: [
          {
            id: Date.now().toString(36) + Math.random().toString(36).substring(2, 7),
            content,
            createdAt: new Date().toISOString(),
            status: 'pending',
            source
          },
          ...state.items
        ]
      })),

      processItem: (id) => set((state) => ({
        items: state.items.map((item) =>
          item.id === id ? { ...item, status: 'processed' } : item
        )
      })),

      deleteItem: (id) => set((state) => ({
        items: state.items.filter((item) => item.id !== id)
      })),

      clearProcessed: () => set((state) => ({
        items: state.items.filter((item) => item.status !== 'processed')
      }))
    }),
    {
      name: 'phoenix-inbox'
    }
  )
)
