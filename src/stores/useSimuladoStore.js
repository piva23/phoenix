import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Formato de um simulado:
// {
//   id, nome, banca, data, fonte: 'manual' | 'banco_questoes',
//   concursoId: null,                 // vínculo opcional com useConcursoStore
//   tempoMinutos: null,                // tempo total gasto (opcional)
//   disciplinas: [
//     { id, subjectId, name, totalQuestoes, acertos, erros, notaCorte, peso }
//   ],
//   questionIds: [],                   // se fonte = 'banco_questoes', as questões usadas
//   observacoes: '',
//   createdAt
// }

function calcDisciplinaStats(d) {
  const answered = (d.acertos || 0) + (d.erros || 0);
  const accuracy =
    answered > 0 ? Math.round((d.acertos / answered) * 100) : null;
  const eliminado = d.notaCorte > 0 ? (d.acertos || 0) < d.notaCorte : false;
  return { ...d, answered, accuracy, eliminado };
}

export const useSimuladoStore = create(
  persist(
    (set, get) => ({
      simulados: [],

      // ─── CRUD ─────────────────────────────────────────────────────────────

      addSimulado: data => {
        const simulado = {
          id: `sim_${Date.now()}`,
          nome: data.nome || 'Simulado',
          banca: data.banca || '',
          data: data.data || new Date().toISOString().slice(0, 10),
          fonte: data.fonte || 'manual',
          concursoId: data.concursoId || null,
          tempoMinutos: data.tempoMinutos || null,
          disciplinas: (data.disciplinas || []).map(d => ({
            id:
              d.id ||
              `disc_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            subjectId: d.subjectId || null,
            name: d.name || '',
            totalQuestoes: Number(d.totalQuestoes) || 0,
            acertos: Number(d.acertos) || 0,
            erros: Number(d.erros) || 0,
            notaCorte: Number(d.notaCorte) || 0,
            peso: Number(d.peso) || 1,
          })),
          questionIds: data.questionIds || [],
          observacoes: data.observacoes || '',
          createdAt: Date.now(),
        };
        set(state => ({ simulados: [...state.simulados, simulado] }));
        return simulado;
      },

      updateSimulado: (id, data) =>
        set(state => ({
          simulados: state.simulados.map(s =>
            s.id !== id ? s : { ...s, ...data }
          ),
        })),

      deleteSimulado: id =>
        set(state => ({
          simulados: state.simulados.filter(s => s.id !== id),
        })),

      updateDisciplina: (simuladoId, disciplinaId, data) =>
        set(state => ({
          simulados: state.simulados.map(s =>
            s.id !== simuladoId
              ? s
              : {
                  ...s,
                  disciplinas: s.disciplinas.map(d =>
                    d.id !== disciplinaId ? d : { ...d, ...data }
                  ),
                }
          ),
        })),

      addDisciplina: (simuladoId, data) =>
        set(state => ({
          simulados: state.simulados.map(s =>
            s.id !== simuladoId
              ? s
              : {
                  ...s,
                  disciplinas: [
                    ...s.disciplinas,
                    {
                      id: `disc_${Date.now()}`,
                      subjectId: data.subjectId || null,
                      name: data.name || '',
                      totalQuestoes: 0,
                      acertos: 0,
                      erros: 0,
                      notaCorte: 0,
                      peso: 1,
                    },
                  ],
                }
          ),
        })),

      removeDisciplina: (simuladoId, disciplinaId) =>
        set(state => ({
          simulados: state.simulados.map(s =>
            s.id !== simuladoId
              ? s
              : {
                  ...s,
                  disciplinas: s.disciplinas.filter(d => d.id !== disciplinaId),
                }
          ),
        })),

      // ─── SELETORES ────────────────────────────────────────────────────────

      // simulado com stats calculados (acerto %, eliminação por nota de corte)
      getSimuladoStats: id => {
        const sim = get().simulados.find(s => s.id === id);
        if (!sim) return null;

        const discStats = sim.disciplinas.map(calcDisciplinaStats);
        const totalQ = discStats.reduce((a, d) => a + d.totalQuestoes, 0);
        const totalAcertos = discStats.reduce((a, d) => a + d.acertos, 0);
        const totalErros = discStats.reduce((a, d) => a + d.erros, 0);
        const totalRespondidas = totalAcertos + totalErros;
        const globalAccuracy =
          totalRespondidas > 0
            ? Math.round((totalAcertos / totalRespondidas) * 100)
            : null;

        // nota ponderada por peso (NxP)
        const totalPeso = discStats.reduce((a, d) => a + (d.peso || 1), 0);
        const notaPonderada =
          totalPeso > 0
            ? discStats.reduce(
                (a, d) => a + (d.accuracy || 0) * (d.peso || 1),
                0
              ) / totalPeso
            : 0;

        const eliminado = discStats.some(d => d.eliminado);
        const disciplinasEliminadas = discStats.filter(d => d.eliminado);

        return {
          ...sim,
          disciplinas: discStats,
          totalQuestoes: totalQ,
          totalAcertos,
          totalErros,
          totalRespondidas,
          globalAccuracy,
          notaPonderada: Math.round(notaPonderada * 10) / 10,
          eliminado,
          disciplinasEliminadas,
        };
      },

      getAllSimuladosStats: () =>
        get().simulados.map(s => get().getSimuladoStats(s.id)),

      getByConcurso: concursoId =>
        get().simulados.filter(s => s.concursoId === concursoId),

      // evolução da nota ponderada ao longo do tempo — para gráfico
      getEvolutionTimeline: (concursoId = null) => {
        const list = (
          concursoId ? get().getByConcurso(concursoId) : get().simulados
        )
          .map(s => get().getSimuladoStats(s.id))
          .filter(Boolean)
          .sort((a, b) => a.data.localeCompare(b.data));
        return list.map(s => ({
          date: s.data,
          nome: s.nome,
          accuracy: s.globalAccuracy,
          notaPonderada: s.notaPonderada,
          eliminado: s.eliminado,
        }));
      },

      // evolução por disciplina específica (comparar a mesma matéria entre simulados)
      getDisciplinaEvolution: (subjectId, concursoId = null) => {
        const list = (
          concursoId ? get().getByConcurso(concursoId) : get().simulados
        ).sort((a, b) => a.data.localeCompare(b.data));
        return list
          .map(s => {
            const d = s.disciplinas.find(x => x.subjectId === subjectId);
            if (!d) return null;
            const stats = calcDisciplinaStats(d);
            return {
              date: s.data,
              nome: s.nome,
              accuracy: stats.accuracy,
              eliminado: stats.eliminado,
            };
          })
          .filter(Boolean);
      },

      // ranking de disciplinas mais fracas (média de acerto entre todos os simulados)
      getWeakestDisciplinas: () => {
        const all = get().simulados;
        const bySubject = {};
        all.forEach(s => {
          s.disciplinas.forEach(d => {
            const key = d.subjectId || d.name;
            if (!bySubject[key])
              bySubject[key] = {
                name: d.name,
                subjectId: d.subjectId,
                acertos: 0,
                total: 0,
              };
            bySubject[key].acertos += d.acertos || 0;
            bySubject[key].total += (d.acertos || 0) + (d.erros || 0);
          });
        });
        return Object.values(bySubject)
          .map(d => ({
            ...d,
            accuracy:
              d.total > 0 ? Math.round((d.acertos / d.total) * 100) : null,
          }))
          .filter(d => d.accuracy !== null)
          .sort((a, b) => a.accuracy - b.accuracy);
      },
    }),
    { name: 'phoenix-simulados' }
  )
);
