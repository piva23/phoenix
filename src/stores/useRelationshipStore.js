import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { applyDecay, getAutoBadges } from '../modules/relationships/algorithms/relationshipAlgorithms'

export const useRelationshipStore = create(
  persist(
    (set, get) => ({
      people: [],
      userCoords: { lat: -23.5505, lng: -46.6333 }, // Default to São Paulo, Brazil
      userRadius: 10, // 10 km default

      setUserCoords: (coords) => set({ userCoords: coords }),
      setUserRadius: (radius) => set({ userRadius: Number(radius) || 10 }),

      // ── CRUD ────────────────────────────────────────────────────────────────
      addPerson: (data) => set(s => ({
        people: [...s.people, {
          ...data,
          id: `per_${Date.now()}`,
          relationshipScore: data.relationshipScore ?? 20,
          interactions: [],
          psychNotes: data.psychNotes || [],
          spiritualAttacks: data.spiritualAttacks || [],
          lat: data.lat ?? null,
          lng: data.lng ?? null,
          lastKnownLocation: data.lastKnownLocation || '',
          badges: data.badges || [],
          interests: data.interests || [],
          notes: data.notes || '',
          lastInteraction: null,
          createdAt: new Date().toISOString().split('T')[0],
        }]
      })),

      updatePerson: (id, data) => set(s => ({
        people: s.people.map(p => p.id !== id ? p : { ...p, ...data })
      })),

      deletePerson: (id) => set(s => ({
        people: s.people.filter(p => p.id !== id)
      })),

      // ── INTERAÇÕES ──────────────────────────────────────────────────────────
      addInteraction: (personId, interaction) => set(s => ({
        people: s.people.map(p => {
          if (p.id !== personId) return p
          const newScore = Math.min(100, Math.max(0, p.relationshipScore + interaction.points))
          const newInteraction = {
            ...interaction,
            id: `int_${Date.now()}`,
            date: new Date().toISOString().split('T')[0],
            time: new Date().toTimeString().slice(0, 5),
          }
          const updatedPerson = {
            ...p,
            relationshipScore: newScore,
            lastInteraction: newInteraction.date,
            interactions: [newInteraction, ...(p.interactions || [])],
          }
          updatedPerson.badges = getAutoBadges(updatedPerson)
          return updatedPerson
        })
      })),

      deleteInteraction: (personId, interactionId) => set(s => ({
        people: s.people.map(p => {
          if (p.id !== personId) return p
          return { ...p, interactions: p.interactions.filter(i => i.id !== interactionId) }
        })
      })),

      // ── PSYCH NOTES & SPIRITUAL ATTACKS ─────────────────────────────────────
      addPsychNote: (personId, note) => set(s => ({
        people: s.people.map(p => {
          if (p.id !== personId) return p
          const newNote = {
            id: `pn_${Date.now()}`,
            date: new Date().toISOString().split('T')[0],
            text: note.text || '',
            responseType: note.responseType || '', // 'desvio_olhar_esquerda', 'hesitacao', 'defensivo', etc.
            trigger: note.trigger || '',
            detectedLie: !!note.detectedLie,
          }
          return {
            ...p,
            psychNotes: [newNote, ...(p.psychNotes || [])]
          }
        })
      })),

      deletePsychNote: (personId, noteId) => set(s => ({
        people: s.people.map(p => {
          if (p.id !== personId) return p
          return {
            ...p,
            psychNotes: (p.psychNotes || []).filter(n => n.id !== noteId)
          }
        })
      })),

      addSpiritualAttack: (personId, attack) => set(s => ({
        people: s.people.map(p => {
          if (p.id !== personId) return p
          const newAttack = {
            id: `sa_${Date.now()}`,
            date: new Date().toISOString().split('T')[0],
            intensity: Number(attack.intensity) || 3, // 1 a 5
            note: attack.note || '',
            type: attack.type || 'drain', // 'drain' | 'vampirism' | 'conflict' | 'bad_vibe'
          }
          return {
            ...p,
            spiritualAttacks: [newAttack, ...(p.spiritualAttacks || [])]
          }
        })
      })),

      deleteSpiritualAttack: (personId, attackId) => set(s => ({
        people: s.people.map(p => {
          if (p.id !== personId) return p
          return {
            ...p,
            spiritualAttacks: (p.spiritualAttacks || []).filter(a => a.id !== attackId)
          }
        })
      })),

      // ── DECAIMENTO ──────────────────────────────────────────────────────────
      applyAllDecays: () => set(s => ({
        people: s.people.map(p => ({
          ...p,
          relationshipScore: applyDecay(p),
          badges: getAutoBadges({ ...p, relationshipScore: applyDecay(p) }),
        }))
      })),

      // ── BADGES MANUAIS ───────────────────────────────────────────────────────
      toggleBadge: (personId, badgeId) => set(s => ({
        people: s.people.map(p => {
          if (p.id !== personId) return p
          const has = (p.badges || []).includes(badgeId)
          return { ...p, badges: has ? p.badges.filter(b => b !== badgeId) : [...(p.badges || []), badgeId] }
        })
      })),
    }),
    { name: 'phoenix-relationships' }
  )
)
