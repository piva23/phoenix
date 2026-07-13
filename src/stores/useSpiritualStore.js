import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const today = () => new Date().toISOString().split('T')[0]

const DEFAULT_QUOTES = [
  { id: 'q1', text: 'A disciplina é a ponte entre metas e realizações.', author: 'Jim Rohn', category: 'foco', favorite: false },
  { id: 'q2', text: 'Cada manhã traz novas possibilidades. Cada dia é uma dádiva.', author: '', category: 'fe', favorite: false },
  { id: 'q3', text: 'Não é a montanha que conquistamos, mas a nós mesmos.', author: 'Edmund Hillary', category: 'motivacao', favorite: false },
  { id: 'q4', text: 'O sucesso é a soma de pequenos esforços repetidos dia após dia.', author: 'Robert Collier', category: 'foco', favorite: false },
  { id: 'q5', text: 'Tudo posso naquele que me fortalece.', author: 'Filipenses 4:13', category: 'fe', favorite: true },
  { id: 'q6', text: 'A gratidão transforma o que temos em suficiente.', author: '', category: 'sabedoria', favorite: false },
  { id: 'q7', text: 'Seja a mudança que você quer ver no mundo.', author: 'Gandhi', category: 'sabedoria', favorite: false },
  { id: 'q8', text: 'O presente é o único tempo sobre o qual temos poder.', author: 'Lev Tolstói', category: 'foco', favorite: false },
  { id: 'q9', text: 'Grandes realizações geralmente requerem tempo, paciência e persistência.', author: '', category: 'motivacao', favorite: false },
  { id: 'q10', text: 'Confie no Senhor de todo o seu coração.', author: 'Provérbios 3:5', category: 'fe', favorite: true },
]

export const QUOTE_CATEGORIES = [
  { id: 'fe',        label: 'Fé',        emoji: '🙏', color: '#A855F7' },
  { id: 'motivacao', label: 'Motivação', emoji: '🔥', color: '#F97316' },
  { id: 'sabedoria', label: 'Sabedoria', emoji: '🌿', color: '#10B981' },
  { id: 'amor',      label: 'Amor',      emoji: '❤️', color: '#EF4444' },
  { id: 'foco',      label: 'Foco',      emoji: '🎯', color: '#38BDF8' },
]

export const ENERGY_LEVELS = [
  { value: 1, emoji: '😴', label: 'Exausto'    },
  { value: 2, emoji: '😐', label: 'Cansado'    },
  { value: 3, emoji: '🙂', label: 'Normal'     },
  { value: 4, emoji: '😄', label: 'Energizado' },
  { value: 5, emoji: '🚀', label: 'Explosivo'  },
]

export const DAY_FEELINGS = [
  { id: 'focado',      label: 'Focado',      emoji: '🎯' },
  { id: 'tranquilo',   label: 'Tranquilo',   emoji: '🌊' },
  { id: 'energizado',  label: 'Energizado',  emoji: '⚡' },
  { id: 'corajoso',    label: 'Corajoso',    emoji: '🦁' },
  { id: 'presente',    label: 'Presente',    emoji: '🧘' },
  { id: 'grato',       label: 'Grato',       emoji: '🙏' },
  { id: 'determinado', label: 'Determinado', emoji: '💪' },
  { id: 'criativo',    label: 'Criativo',    emoji: '✨' },
]

export const useSpiritualStore = create(
  persist(
    (set, get) => ({
      quotes: DEFAULT_QUOTES,
      todayQuoteId: null,

      addQuote: (data) => set(s => ({
        quotes: [...s.quotes, { ...data, id: `q_${Date.now()}`, favorite: false }]
      })),
      updateQuote: (id, data) => set(s => ({
        quotes: s.quotes.map(q => q.id !== id ? q : { ...q, ...data })
      })),
      deleteQuote: (id) => set(s => ({ quotes: s.quotes.filter(q => q.id !== id) })),
      toggleFavoriteQuote: (id) => set(s => ({
        quotes: s.quotes.map(q => q.id !== id ? q : { ...q, favorite: !q.favorite })
      })),
      drawDailyQuote: () => {
        const { quotes } = get()
        if (!quotes.length) return null
        const favs = quotes.filter(q => q.favorite)
        const pool = favs.length > 0 ? favs : quotes
        const q = pool[Math.floor(Math.random() * pool.length)]
        set({ todayQuoteId: q.id })
        return q
      },

      // rituals: { 'YYYY-MM-DD': { morning: {...}, night: {...} } }
      rituals: {},

      getRitual: (date, type) => (get().rituals[date] || {})[type] || null,

      saveMorning: (date, data) => set(s => ({
        rituals: {
          ...s.rituals,
          [date]: {
            ...(s.rituals[date] || {}),
            morning: {
              ...(s.rituals[date]?.morning || {
                intention: '', gratitude: ['', '', ''],
                tasks: [], feeling: '', affirmation: '', completedAt: null,
              }),
              ...data,
            }
          }
        }
      })),

      saveNight: (date, data) => set(s => ({
        rituals: {
          ...s.rituals,
          [date]: {
            ...(s.rituals[date] || {}),
            night: {
              ...(s.rituals[date]?.night || {
                wentWell: '', learned: '', tomorrow: '',
                energyLevel: 3, meditated: false, meditationMinutes: 0, completedAt: null,
              }),
              ...data,
            }
          }
        }
      })),

      toggleTask: (date, taskIndex) => set(s => {
        const morning = s.rituals[date]?.morning
        if (!morning) return s
        const tasks = [...(morning.tasks || [])]
        tasks[taskIndex] = { ...tasks[taskIndex], done: !tasks[taskIndex].done }
        return {
          rituals: {
            ...s.rituals,
            [date]: { ...s.rituals[date], morning: { ...morning, tasks } }
          }
        }
      }),

      getStreaks: () => {
        const { rituals } = get()
        let morning = 0, night = 0, meditation = 0
        const d = new Date()
        for (let i = 0; i < 365; i++) {
          const date = new Date(d - i * 86400000).toISOString().split('T')[0]
          const day = rituals[date]
          if (day?.morning?.completedAt) morning++
          else if (i > 0) break
        }
        let nightStreak = 0, medStreak = 0
        for (let i = 0; i < 365; i++) {
          const date = new Date(d - i * 86400000).toISOString().split('T')[0]
          const day = rituals[date]
          if (day?.night?.completedAt) nightStreak++
          else if (i > 0) break
        }
        for (let i = 0; i < 365; i++) {
          const date = new Date(d - i * 86400000).toISOString().split('T')[0]
          const day = rituals[date]
          if (day?.night?.meditated) medStreak++
          else if (i > 0) break
        }
        return { morning, night: nightStreak, meditation: medStreak }
      },

      getLast30: () => {
        const { rituals } = get()
        const days = []
        for (let i = 29; i >= 0; i--) {
          const date = new Date(Date.now() - i * 86400000).toISOString().split('T')[0]
          const day = rituals[date]
          days.push({
            date,
            morningDone: !!day?.morning?.completedAt,
            nightDone:   !!day?.night?.completedAt,
            meditated:   !!day?.night?.meditated,
            energy:      day?.night?.energyLevel || 0,
            tasksDone:   (day?.morning?.tasks || []).filter(t => t.done).length,
            tasksTotal:  (day?.morning?.tasks || []).filter(t => t.text?.trim()).length,
          })
        }
        return days
      },
    }),
    { name: 'phoenix-spiritual' }
  )
)
