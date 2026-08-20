import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const DEFAULT_THEMES = [
  { id: 'th1', titulo: 'A licitação como instrumento de moralidade administrativa', categoria: 'Direito Administrativo', fonte: 'Concursos Tribunais', padrao: true },
  { id: 'th2', titulo: 'Os limites do poder discricionário da Administração Pública', categoria: 'Direito Administrativo', fonte: 'Concursos Tribunais', padrao: true },
  { id: 'th3', titulo: 'Princípio da eficiência e o servidor público', categoria: 'Direito Administrativo', fonte: 'TJRS', padrao: true },
  { id: 'th4', titulo: 'A importância do controle social na gestão pública', categoria: 'Direito Administrativo', fonte: 'Concursos Federais', padrao: true },
  { id: 'th5', titulo: 'Os direitos fundamentais e seus limites constitucionais', categoria: 'Direito Constitucional', fonte: 'Concursos Tribunais', padrao: true },
  { id: 'th6', titulo: 'O papel do Poder Judiciário na efetivação dos direitos sociais', categoria: 'Direito Constitucional', fonte: 'TJRS', padrao: true },
  { id: 'th7', titulo: 'Separação dos poderes e o sistema de freios e contrapesos', categoria: 'Direito Constitucional', fonte: 'Concursos Federais', padrao: true },
  { id: 'th8', titulo: 'Impactos da inteligência artificial no mercado de trabalho brasileiro', categoria: 'Atualidades', fonte: 'ENEM / Concursos', padrao: true },
  { id: 'th9', titulo: 'Desafios da educação inclusiva no Brasil contemporâneo', categoria: 'Atualidades', fonte: 'ENEM', padrao: true },
  { id: 'th10', titulo: 'A crise hídrica e os desafios para a sustentabilidade ambiental', categoria: 'Atualidades', fonte: 'ENEM', padrao: true },
  { id: 'th11', titulo: 'Saúde mental no ambiente de trabalho: desafios e perspectivas', categoria: 'Atualidades', fonte: 'Concursos Federais', padrao: true },
  { id: 'th12', titulo: 'O papel da mulher no mercado de trabalho e os desafios da igualdade', categoria: 'Atualidades', fonte: 'ENEM', padrao: true },
  { id: 'th13', titulo: 'Segurança pública e os limites da atuação policial em uma democracia', categoria: 'Direito Constitucional', fonte: 'Concursos Policiais', padrao: true },
  { id: 'th14', titulo: 'A responsabilidade civil do Estado por danos causados por seus agentes', categoria: 'Direito Administrativo', fonte: 'TJRS', padrao: true },
  { id: 'th15', titulo: 'Processo administrativo e o princípio do contraditório', categoria: 'Direito Administrativo', fonte: 'Concursos Tribunais', padrao: true },
]

const DEFAULT_PARTES = [
  { key: 'introducao',      label: 'Introdução',        desc: 'Apresente o tema e sua tese principal', target: 7 },
  { key: 'desenvolvimento1', label: 'Desenvolvimento 1', desc: 'Primeiro argumento com exemplos e dados', target: 9 },
  { key: 'desenvolvimento2', label: 'Desenvolvimento 2', desc: 'Segundo argumento complementar', target: 9 },
  { key: 'conclusao',       label: 'Conclusão',          desc: 'Retome a tese e proponha solução', target: 7 },
]

export const useRedacaoStore = create(
  persist(
    (set, get) => ({
      themes: DEFAULT_THEMES,
      redacoes: [],
      partesTemplate: DEFAULT_PARTES, // customizável globalmente

      addTheme: (data) => set(state => ({ themes: [...state.themes, { ...data, id: `th_${Date.now()}`, padrao: false }] })),
      deleteTheme: (id) => set(state => ({ themes: state.themes.filter(t => t.id !== id || t.padrao) })),

      // Partes customizáveis
      updatePartesTemplate: (partes) => set({ partesTemplate: partes }),
      resetPartesTemplate: () => set({ partesTemplate: DEFAULT_PARTES }),

      addRedacao: (data) => set(state => {
        const partesIniciais = {}
        state.partesTemplate.forEach(p => { partesIniciais[p.key] = '' })
        return {
          redacoes: [...state.redacoes, {
            ...data,
            id: `red_${Date.now()}`,
            partes: partesIniciais,
            anotacoes: {}, // { parteKey: 'feedback do corretor' }
            notaBanca: null,
            status: 'rascunho',
            wordCount: 0,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          }]
        }
      }),

      updateRedacao: (id, data) => set(state => ({
        redacoes: state.redacoes.map(r => r.id !== id ? r : { ...r, ...data, updatedAt: Date.now() })
      })),

      deleteRedacao: (id) => set(state => ({ redacoes: state.redacoes.filter(r => r.id !== id) })),

      updateAnotacao: (id, parteKey, texto) => set(state => ({
        redacoes: state.redacoes.map(r => r.id !== id ? r : {
          ...r, anotacoes: { ...r.anotacoes, [parteKey]: texto }, updatedAt: Date.now()
        })
      })),

      sortearTema: (categoria = null) => {
        const { themes } = get()
        const pool = categoria ? themes.filter(t => t.categoria === categoria) : themes
        return pool[Math.floor(Math.random() * pool.length)] || null
      },
    }),
    { name: 'phoenix-redacao' }
  )
)
