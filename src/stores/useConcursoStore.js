import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useConcursoStore = create(
  persist(
    (set, get) => ({
      concursos: [],

      addConcurso: (data) => set(state => ({
        concursos: [...state.concursos, {
          ...data,
          id: `conc_${Date.now()}`,
          provas: [],
          resultado: { notaFinal: null, classificacao: null, notaCorte: null, aprovado: false },
          createdAt: Date.now(),
        }]
      })),
      updateConcurso: (id, data) => set(state => ({
        concursos: state.concursos.map(c => c.id !== id ? c : { ...c, ...data, updatedAt: Date.now() })
      })),
      deleteConcurso: (id) => set(state => ({
        concursos: state.concursos.filter(c => c.id !== id)
      })),

      addProva: (concursoId, data) => set(state => ({
        concursos: state.concursos.map(c => c.id !== concursoId ? c : {
          ...c, provas: [...(c.provas || []), { ...data, id: `prova_${Date.now()}`, createdAt: Date.now() }]
        })
      })),
      updateProva: (concursoId, provaId, data) => set(state => ({
        concursos: state.concursos.map(c => c.id !== concursoId ? c : {
          ...c, provas: c.provas.map(p => p.id !== provaId ? p : { ...p, ...data })
        })
      })),
      deleteProva: (concursoId, provaId) => set(state => ({
        concursos: state.concursos.map(c => c.id !== concursoId ? c : {
          ...c, provas: c.provas.filter(p => p.id !== provaId)
        })
      })),

      setResultado: (concursoId, resultado) => set(state => ({
        concursos: state.concursos.map(c => c.id !== concursoId ? c : {
          ...c, resultado, status: resultado.aprovado ? 'aprovado' : c.status, updatedAt: Date.now(),
        })
      })),

      getConcursoById: (id) => get().concursos.find(c => c.id === id),
      getAtivos: () => get().concursos.filter(c => ['estudando','inscrito','fez_prova'].includes(c.status)),
      getAprovados: () => get().concursos.filter(c => c.status === 'aprovado'),
    }),
    { name: 'phoenix-concursos' }
  )
)
