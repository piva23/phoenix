import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const DEFAULT_COLLECTIONS = [
  { id: 'col_tech',     name: 'Tecnologia',  emoji: '💻', color: '#38BDF8' },
  { id: 'col_vida',     name: 'Vida',        emoji: '🌱', color: '#10B981' },
  { id: 'col_fin',      name: 'Finanças',    emoji: '💰', color: '#F59E0B' },
  { id: 'col_saude',    name: 'Saúde',       emoji: '🏃', color: '#EF4444' },
  { id: 'col_estudo',   name: 'Estudos',     emoji: '📚', color: '#A855F7' },
  { id: 'col_projetos', name: 'Projetos',    emoji: '🚀', color: '#6366F1' },
  { id: 'col_ideias',   name: 'Ideias',      emoji: '💡', color: '#F97316' },
  { id: 'col_misc',     name: 'Geral',       emoji: '📌', color: '#94A3B8' },
]

const today = () => new Date().toISOString().split('T')[0]

export const useKnowledgeStore = create(
  persist(
    (set, get) => ({
      collections: DEFAULT_COLLECTIONS,
      notes: [],
      links: [],

      // ── COLLECTIONS ──────────────────────────────────────────────────────
      addCollection: (data) => set(s => ({
        collections: [...s.collections, { ...data, id: `col_${Date.now()}` }]
      })),
      updateCollection: (id, data) => set(s => ({
        collections: s.collections.map(c => c.id !== id ? c : { ...c, ...data })
      })),
      deleteCollection: (id) => set(s => ({
        collections: s.collections.filter(c => c.id !== id)
      })),

      // ── NOTES ────────────────────────────────────────────────────────────
      addNote: (data) => set(s => ({
        notes: [
          {
            ...data,
            id: `note_${Date.now()}`,
            tags: data.tags || [],
            favorite: false,
            createdAt: today(),
            updatedAt: today(),
          },
          ...s.notes,
        ]
      })),
      updateNote: (id, data) => set(s => ({
        notes: s.notes.map(n => n.id !== id ? n : { ...n, ...data, updatedAt: today() })
      })),
      deleteNote: (id) => set(s => ({
        notes: s.notes.filter(n => n.id !== id)
      })),
      toggleFavoriteNote: (id) => set(s => ({
        notes: s.notes.map(n => n.id !== id ? n : { ...n, favorite: !n.favorite })
      })),

      // ── LINKS ─────────────────────────────────────────────────────────────
      addLink: (data) => set(s => ({
        links: [
          {
            ...data,
            id: `link_${Date.now()}`,
            tags: data.tags || [],
            favorite: false,
            createdAt: today(),
          },
          ...s.links,
        ]
      })),
      updateLink: (id, data) => set(s => ({
        links: s.links.map(l => l.id !== id ? l : { ...l, ...data })
      })),
      deleteLink: (id) => set(s => ({
        links: s.links.filter(l => l.id !== id)
      })),
      toggleFavoriteLink: (id) => set(s => ({
        links: s.links.map(l => l.id !== id ? l : { ...l, favorite: !l.favorite })
      })),

      // ── SEARCH ────────────────────────────────────────────────────────────
      search: (query) => {
        if (!query.trim()) return { notes: [], links: [] }
        const q = query.toLowerCase()
        const { notes, links } = get()
        return {
          notes: notes.filter(n =>
            n.title?.toLowerCase().includes(q) ||
            n.content?.toLowerCase().includes(q) ||
            n.tags?.some(t => t.toLowerCase().includes(q))
          ),
          links: links.filter(l =>
            l.title?.toLowerCase().includes(q) ||
            l.url?.toLowerCase().includes(q) ||
            l.summary?.toLowerCase().includes(q) ||
            l.tags?.some(t => t.toLowerCase().includes(q))
          ),
        }
      },

      // ── ALL TAGS ──────────────────────────────────────────────────────────
      getAllTags: () => {
        const { notes, links } = get()
        const tagSet = new Set()
        notes.forEach(n => (n.tags || []).forEach(t => tagSet.add(t)))
        links.forEach(l => (l.tags || []).forEach(t => tagSet.add(t)))
        return [...tagSet].sort()
      },
    }),
    { name: 'phoenix-knowledge' }
  )
)
