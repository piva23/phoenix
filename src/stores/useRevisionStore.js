import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  generateRevisions,
  generateNextRevision,
} from '../shared/utils/revisions';
import { today } from '../shared/utils/time';

// Intervalos de revisão por estágio (R1 a R6, depois infinito a +60d)
const REVISION_INTERVALS = [1, 3, 7, 15, 30, 60];

// Gera a data da próxima revisão a partir da data de conclusão e do stage atual
function getNextRevisionDate(completedDate, currentStage, score) {
  const baseInterval =
    REVISION_INTERVALS[
      Math.min(currentStage - 1, REVISION_INTERVALS.length - 1)
    ] || 60;
  // score 1 (difícil) = repete no mesmo estágio, score 3 (médio) = -20%, score 5 (fácil) = normal
  const multiplier = score === 1 ? 0 : score === 3 ? 0.8 : 1;
  const days =
    score === 1
      ? REVISION_INTERVALS[
          Math.max(0, Math.min(currentStage - 2, REVISION_INTERVALS.length - 1))
        ]
      : Math.round(baseInterval * multiplier) || baseInterval;

  const d = new Date(completedDate);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export const useRevisionStore = create(
  persist(
    (set, get) => ({
      revisions: [],

      // ─── GERAÇÃO ──────────────────────────────────────────────────────────

      generateRevisions: (subjectId, topicId, subtopicId) => {
        // Não cria duplicatas se já houver revisões pendentes para este subtópico
        const existing = get().revisions.filter(
          r => r.subtopicId === subtopicId && !r.completed
        );
        if (existing.length > 0) return;

        const newRevs = generateRevisions(subjectId, topicId, subtopicId);
        set(state => ({ revisions: [...state.revisions, ...newRevs] }));
      },

      // ─── CONCLUSÃO ────────────────────────────────────────────────────────

      completeRevision: (id, score) => {
        // score: 1 = difícil | 3 = médio | 5 = fácil
        const rev = get().revisions.find(r => r.id === id);
        if (!rev) return;

        const completedAt = today();
        const updated = get().revisions.map(r =>
          r.id !== id ? r : { ...r, completed: true, score, completedAt }
        );

        // Sempre gera próxima revisão (lógica infinita após R6)
        const nextStage = rev.stage + (score === 1 ? 0 : 1); // difícil = repete stage
        const nextDate = getNextRevisionDate(completedAt, nextStage, score);

        const nextRevision = {
          id: `rev_${Date.now()}`,
          subjectId: rev.subjectId,
          topicId: rev.topicId,
          subtopicId: rev.subtopicId,
          stage: nextStage,
          revisionDate: nextDate,
          completed: false,
          score: null,
          completedAt: null,
        };

        set({ revisions: [...updated, nextRevision] });
        return nextRevision;
      },

      // ─── EDIÇÃO ───────────────────────────────────────────────────────────

      // Único método para alterar data — evita dessincronia entre páginas
      editRevisionDate: (id, newDate) =>
        set(state => ({
          revisions: state.revisions.map(r =>
            r.id !== id ? r : { ...r, revisionDate: newDate }
          ),
        })),

      // Edição genérica para outros campos (stage, notes, etc) — não expor para date na UI
      editRevision: (id, data) => {
        // Bloqueia alteração de data por aqui — use editRevisionDate
        const { revisionDate, ...safeData } = data;
        set(state => ({
          revisions: state.revisions.map(r =>
            r.id !== id ? r : { ...r, ...safeData }
          ),
        }));
      },

      deleteRevision: id =>
        set(state => ({
          revisions: state.revisions.filter(r => r.id !== id),
        })),

      // ─── SELETORES ────────────────────────────────────────────────────────

      // Revisões pendentes até hoje (inclui atrasadas)
      getPendingToday: () => {
        const t = today();
        return get()
          .revisions.filter(r => !r.completed && r.revisionDate <= t)
          .sort((a, b) => a.revisionDate.localeCompare(b.revisionDate));
      },

      // Revisões atrasadas (data anterior a hoje)
      getOverdue: () => {
        const t = today();
        return get().revisions.filter(r => !r.completed && r.revisionDate < t);
      },

      // Revisões de uma data específica
      getByDate: date =>
        get().revisions.filter(r => r.revisionDate === date && !r.completed),

      // Revisões dos próximos N dias — para o gráfico de carga futura
      getUpcoming: (days = 14) => {
        const t = today();
        const future = new Date(t);
        future.setDate(future.getDate() + days);
        const futureStr = future.toISOString().slice(0, 10);
        return get().revisions.filter(
          r => !r.completed && r.revisionDate > t && r.revisionDate <= futureStr
        );
      },

      // Distribuição de revisões por dia nos próximos N dias — para o BarChart
      getUpcomingByDay: (days = 14) => {
        const upcoming = get().getUpcoming(days);
        const map = {};
        upcoming.forEach(r => {
          map[r.revisionDate] = (map[r.revisionDate] || 0) + 1;
        });
        // Garante todos os dias no intervalo, mesmo os vazios
        const result = [];
        for (let i = 1; i <= days; i++) {
          const d = new Date();
          d.setDate(d.getDate() + i);
          const dateStr = d.toISOString().slice(0, 10);
          result.push({ date: dateStr, count: map[dateStr] || 0 });
        }
        return result;
      },

      // Revisões pendentes de um subtópico específico
      getBySubtopic: subtopicId =>
        get().revisions.filter(
          r => r.subtopicId === subtopicId && !r.completed
        ),

      // Resumo de saúde das revisões — para o painel Analytics
      getHealthSummary: () => {
        const t = today();
        const pending = get().revisions.filter(r => !r.completed);
        return {
          overdue: pending.filter(r => r.revisionDate < t).length,
          today: pending.filter(r => r.revisionDate === t).length,
          upcoming: pending.filter(r => r.revisionDate > t).length,
        };
      },

      // Contagem de pendentes por matéria — para o ranking de revisões
      getPendingBySubject: () => {
        const t = today();
        const map = {};
        get()
          .revisions.filter(r => !r.completed && r.revisionDate <= t)
          .forEach(r => {
            map[r.subjectId] = (map[r.subjectId] || 0) + 1;
          });
        return map;
      },
    }),
    { name: 'phoenix-revisions' }
  )
);
