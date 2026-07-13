import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Estrutura de um item do ciclo:
// {
//   id, subjectId, subjectName,
//   horasPorRodada,     // meta de horas por rodada
//   weightPct,          // peso no edital (%)
//   minutosFeitos,      // minutos acumulados na rodada atual
//   completedThisRound, // true quando atingiu a meta
//   ordem,             // posição na fila
// }

export const useCycleStore = create(
  persist(
    (set, get) => ({
      cycles: [],
      activeCycleId: null,

      // ─── CRUD DE CICLOS ───────────────────────────────────────────────────

      addCycle: data =>
        set(state => {
          const newCycle = {
            ...data,
            id: `cycle_${Date.now()}`,
            rodadaAtual: 1,
            rodadaStartDate: new Date().toISOString().slice(0, 10),
            status: 'ativo',
            createdAt: Date.now(),
            items: (data.items || []).map((item, i) => ({
              ...item,
              id: item.id || `ci_${Date.now()}_${i}`,
              minutosFeitos: 0,
              completedThisRound: false,
              ordem: i,
            })),
          };
          return {
            cycles: [...state.cycles, newCycle],
            activeCycleId: newCycle.id,
          };
        }),

      updateCycle: (id, data) =>
        set(state => ({
          cycles: state.cycles.map(c => (c.id !== id ? c : { ...c, ...data })),
        })),

      deleteCycle: id =>
        set(state => ({
          cycles: state.cycles.filter(c => c.id !== id),
          activeCycleId:
            state.activeCycleId === id ? null : state.activeCycleId,
        })),

      setActiveCycle: id => set({ activeCycleId: id }),

      // ─── EDIÇÃO DE ITENS SEM RECRIAR O CICLO ─────────────────────────────

      updateItem: (cycleId, itemId, data) =>
        set(state => ({
          cycles: state.cycles.map(c =>
            c.id !== cycleId
              ? c
              : {
                  ...c,
                  items: c.items.map(item =>
                    item.id !== itemId ? item : { ...item, ...data }
                  ),
                }
          ),
        })),

      addItem: (cycleId, data) =>
        set(state => ({
          cycles: state.cycles.map(c =>
            c.id !== cycleId
              ? c
              : {
                  ...c,
                  items: [
                    ...c.items,
                    {
                      ...data,
                      id: `ci_${Date.now()}`,
                      minutosFeitos: 0,
                      completedThisRound: false,
                      ordem: c.items.length,
                    },
                  ],
                }
          ),
        })),

      removeItem: (cycleId, itemId) =>
        set(state => ({
          cycles: state.cycles.map(c =>
            c.id !== cycleId
              ? c
              : {
                  ...c,
                  items: c.items
                    .filter(i => i.id !== itemId)
                    .map((i, idx) => ({ ...i, ordem: idx })),
                }
          ),
        })),

      reorderItems: (cycleId, orderedIds) =>
        set(state => ({
          cycles: state.cycles.map(c =>
            c.id !== cycleId
              ? c
              : {
                  ...c,
                  items: orderedIds
                    .map((id, idx) => {
                      const item = c.items.find(i => i.id === id);
                      return item ? { ...item, ordem: idx } : null;
                    })
                    .filter(Boolean),
                }
          ),
        })),

      // ─── PROGRESSO ────────────────────────────────────────────────────────

      // Chamado pelo useSessionStore.addSession() automaticamente
      addMinutesToItem: (cycleId, itemId, minutes) =>
        set(state => ({
          cycles: state.cycles.map(c =>
            c.id !== cycleId
              ? c
              : {
                  ...c,
                  items: c.items.map(item => {
                    if (item.id !== itemId) return item;
                    const newMinutes = (item.minutosFeitos || 0) + minutes;
                    const metaMinutos = (item.horasPorRodada || 1) * 60;
                    return {
                      ...item,
                      minutosFeitos: newMinutes,
                      completedThisRound: newMinutes >= metaMinutos,
                    };
                  }),
                }
          ),
        })),

      // Avança rodada: guarda um snapshot da rodada que está terminando em
      // roundsHistory (pra podermos mostrar histórico de rodadas depois),
      // e então zera progresso de todos os itens.
      advanceRound: cycleId =>
        set(state => ({
          cycles: state.cycles.map(c => {
            if (c.id !== cycleId) return c;
            const totalMeta = c.items.reduce(
              (a, i) => a + (i.horasPorRodada || 1) * 60,
              0
            );
            const totalFeito = c.items.reduce(
              (a, i) => a + (i.minutosFeitos || 0),
              0
            );
            const snapshot = {
              rodada: c.rodadaAtual,
              startedAt: c.rodadaStartDate,
              endedAt: new Date().toISOString().slice(0, 10),
              totalMeta,
              totalFeito,
              items: c.items.map(i => ({
                subjectId: i.subjectId,
                subjectName: i.subjectName,
                color: i.subjectColor,
                metaMin: (i.horasPorRodada || 1) * 60,
                feitoMin: i.minutosFeitos || 0,
                completed: !!i.completedThisRound,
              })),
            };
            return {
              ...c,
              rodadaAtual: c.rodadaAtual + 1,
              rodadaStartDate: new Date().toISOString().slice(0, 10),
              roundsHistory: [...(c.roundsHistory || []), snapshot],
              items: c.items.map(item => ({
                ...item,
                minutosFeitos: 0,
                completedThisRound: false,
              })),
            };
          }),
        })),

      // ─── SELETORES ────────────────────────────────────────────────────────

      getActiveCycle: () => {
        const { cycles, activeCycleId } = get();
        return cycles.find(c => c.id === activeCycleId) || null;
      },

      // Retorna o próximo item a estudar:
      // 1. Primeiro incompleto com menor progresso relativo (% feito vs meta)
      // 2. Se todos completos → sugere avançar rodada
      getTodaySuggestion: () => {
        const cycle = get().getActiveCycle();
        if (!cycle || !cycle.items?.length) return null;

        const sorted = [...cycle.items].sort((a, b) => a.ordem - b.ordem);

        const incomplete = sorted.filter(i => !i.completedThisRound);

        if (incomplete.length === 0) {
          return { type: 'advance_round', cycle };
        }

        // Menor progresso relativo primeiro
        const next = incomplete.reduce((best, item) => {
          const metaMin = (item.horasPorRodada || 1) * 60;
          const pct = (item.minutosFeitos || 0) / metaMin;
          const bestPct =
            (best.minutosFeitos || 0) / ((best.horasPorRodada || 1) * 60);
          return pct < bestPct ? item : best;
        }, incomplete[0]);

        const metaMin = (next.horasPorRodada || 1) * 60;
        const feito = next.minutosFeitos || 0;
        const pct = Math.min(Math.round((feito / metaMin) * 100), 100);

        return {
          type: 'study',
          item: next,
          cycle,
          metaMinutos: metaMin,
          feitoMinutos: feito,
          progressPct: pct,
          remaining: Math.max(metaMin - feito, 0),
        };
      },

      // Progresso geral da rodada atual (% de itens completos)
      getRoundProgress: () => {
        const cycle = get().getActiveCycle();
        if (!cycle || !cycle.items?.length) return 0;
        const done = cycle.items.filter(i => i.completedThisRound).length;
        return Math.round((done / cycle.items.length) * 100);
      },

      // Meta diária em minutos baseada no peso do edital
      // Exemplo: se a matéria tem 30% e a meta diária total é 240min → 72min
      getDailyTargetBySubject: (subjectId, totalDailyMinutes = 240) => {
        const cycle = get().getActiveCycle();
        if (!cycle) return null;
        const item = cycle.items?.find(i => i.subjectId === subjectId);
        if (!item) return null;
        const weight = item.weightPct || 100 / cycle.items.length;
        return Math.round((weight / 100) * totalDailyMinutes);
      },
    }),
    { name: 'phoenix-cycles' }
  )
);
