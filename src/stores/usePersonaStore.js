import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { PERSONA_LIST } from '../shared/constants/personas'

export const usePersonaStore = create(
  persist(
    (set, get) => ({
      activePersonaId: 'horus',
      personas: PERSONA_LIST.map(p => ({ ...p, xp: 0, level: 1, status: 'inactive' })),

      getActivePersona: () => {
        const { activePersonaId, personas } = get()
        return personas.find(p => p.id === activePersonaId) || personas.find(p => p.id === 'horus') || personas[0]
      },

      setActivePersona: (id) => set({ activePersonaId: id }),

      addPersona: (data) => set(state => ({
        personas: [...state.personas, {
          ...data,
          id: `persona_${Date.now()}`,
          xp: 0, level: 1, status: 'inactive',
          createdAt: Date.now(),
        }]
      })),

      updatePersona: (id, data) => set(state => ({
        personas: state.personas.map(p => p.id === id ? { ...p, ...data } : p)
      })),

      deletePersona: (id) => set(state => ({
        personas: state.personas.filter(p => p.id !== id)
      })),

      addPersonaXP: (personaId, amount) => set(state => ({
        personas: state.personas.map(p =>
          p.id === personaId ? { ...p, xp: (p.xp || 0) + amount } : p
        )
      })),

      importPersonasFromJson: (jsonData) => {
        if (!Array.isArray(jsonData)) {
          throw new Error('As personas devem ser disponibilizadas em formato de array.');
        }
        set({ personas: jsonData });
      }
    }),
    { name: 'phoenix-personas' }
  )
)
