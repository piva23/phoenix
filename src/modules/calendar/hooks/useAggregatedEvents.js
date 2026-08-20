import { useMemo } from 'react';
import { useCalendarStore } from '../../../stores/useCalendarStore';
import { useProjectStore } from '../../../stores/useProjectStore';
import { useFinanceStore } from '../../../stores/useFinanceStore';
import { useRevisionStore } from '../../../stores/useRevisionStore';
import { useStudyStore } from '../../../stores/useStudyStore';

// Normalizer function to map any date format into a strict YYYY-MM-DD string
export function normalizeDate(dateVal) {
  if (!dateVal) return null;
  try {
    let d;
    if (dateVal instanceof Date) {
      d = dateVal;
    } else if (typeof dateVal === 'number') {
      d = new Date(dateVal);
    } else if (typeof dateVal === 'string') {
      // Check if it's already a clean YYYY-MM-DD string
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateVal)) {
        return dateVal;
      }
      // If it is a string representing digits only (millisecond timestamp)
      if (/^\d+$/.test(dateVal)) {
        d = new Date(Number(dateVal));
      } else {
        d = new Date(dateVal);
      }
    } else {
      return null;
    }

    if (isNaN(d.getTime())) return null;

    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  } catch (err) {
    console.error('Error normalizing date:', dateVal, err);
    return null;
  }
}

export function useAggregatedEvents() {
  const manualEvents = useCalendarStore((s) => s.manualEvents || []);
  const projects = useProjectStore((s) => s.projects || []);
  const transactions = useFinanceStore((s) => s.transactions || []);
  const envelopes = useFinanceStore((s) => s.envelopes || []);
  const cards = useFinanceStore((s) => s.cards || []);
  const recurringIncomes = useFinanceStore((s) => s.recurringIncomes || []);
  const recurringExpenses = useFinanceStore((s) => s.recurringExpenses || []);
  const revisions = useRevisionStore((s) => s.revisions || []);
  const subjects = useStudyStore((s) => s.subjects || []);

  const aggregated = useMemo(() => {
    const list = [];

    // 1. Manual Events
    manualEvents.forEach((e) => {
      const normDate = normalizeDate(e.date);
      if (normDate) {
        list.push({
          id: e.id,
          title: e.title || 'Sem Título',
          date: normDate,
          completed: !!e.completed,
          type: 'compromisso',
          color: '#EC4899', // Pink for commitments/manual
          origin: 'manual',
          sourceData: e,
          description: e.time ? `Hora: ${e.time}` : 'Compromisso manual',
          time: e.time,
        });
      }
    });

    // 2. Project Tasks
    projects.forEach((p) => {
      const pColor = p.color || p.cor || '#3b82f6';
      (p.objetivos || []).forEach((o) => {
        (o.tasks || []).forEach((t) => {
          // Check for all possible deadline properties
          const rawDeadline = t.dataFim || t.deadline || t.dueDate || t.date || t.prazo;
          const normDate = normalizeDate(rawDeadline);
          if (normDate) {
            list.push({
              id: t.id,
              title: t.content || t.title || t.titulo || 'Tarefa sem nome',
              date: normDate,
              completed: t.status === 'done',
              type: 'project',
              color: pColor,
              origin: 'project',
              sourceData: { ...t, projectName: p.name || p.nome, objetivoName: o.title || o.titulo },
              description: t.descricao || `Projeto: ${p.name || p.nome} | Objetivo: ${o.title || o.titulo} | Prioridade: ${t.prioridade || 'Média'}`,
              xpReward: t.xpReward || 10,
            });
          }
        });
      });
    });

    // 3. Finance Transactions
    transactions.forEach((t) => {
      const normDate = normalizeDate(t.date);
      if (normDate) {
        list.push({
          id: t.id,
          title: `${t.type === 'income' ? '💰 Recebimento' : '💸 Gasto'}: ${t.description || 'Transação'}`,
          date: normDate,
          completed: true,
          type: 'financas',
          color: t.type === 'income' ? '#10B981' : '#EF4444', // Green / Red
          origin: 'finance',
          sourceData: t,
          description: `Valor: R$ ${Number(t.amount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} | Categoria: ${t.categoryId || 'Geral'}`,
          amount: t.amount,
          txType: t.type,
        });
      }
    });

    // 4. Finance Envelopes
    envelopes.forEach((e) => {
      if (e.deadline) {
        const normDate = normalizeDate(e.deadline);
        if (normDate) {
          list.push({
            id: e.id,
            title: `${e.icon || '🎯'} Envelope: ${e.name}`,
            date: normDate,
            completed: !!e.goalReached,
            type: 'financas',
            color: '#38BDF8', // Light Blue
            origin: 'finance',
            sourceData: e,
            description: `Meta: R$ ${Number(e.target || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} | Acumulado: R$ ${Number(e.current || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
          });
        }
      }
    });

    // 5. Finance Upcoming Recurrings (next 30 days projection)
    try {
      const now = new Date();
      
      // Recurrent Incomes
      recurringIncomes.filter(r => r.active).forEach((r) => {
        (r.daysOfMonth || []).forEach((day) => {
          // Current month
          const d1 = new Date(now.getFullYear(), now.getMonth(), day);
          const normD1 = normalizeDate(d1);
          if (normD1) {
            list.push({
              id: `rec-inc-${r.id}-${normD1}`,
              title: `💰 Recorrência: ${r.name}`,
              date: normD1,
              completed: false,
              type: 'financas',
              color: '#34D399', // Light Green
              origin: 'finance',
              sourceData: r,
              description: `Valor Estimado: R$ ${Number(r.amount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
              amount: r.amount,
              txType: 'income',
            });
          }
          // Next month
          const d2 = new Date(now.getFullYear(), now.getMonth() + 1, day);
          const normD2 = normalizeDate(d2);
          if (normD2) {
            list.push({
              id: `rec-inc-next-${r.id}-${normD2}`,
              title: `💰 Recorrência: ${r.name}`,
              date: normD2,
              completed: false,
              type: 'financas',
              color: '#34D399',
              origin: 'finance',
              sourceData: r,
              description: `Valor Estimado: R$ ${Number(r.amount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
              amount: r.amount,
              txType: 'income',
            });
          }
        });
      });

      // Recurrent Expenses
      recurringExpenses.filter(r => r.active).forEach((r) => {
        // Current month
        const d1 = new Date(now.getFullYear(), now.getMonth(), r.dayOfMonth);
        const normD1 = normalizeDate(d1);
        if (normD1) {
          list.push({
            id: `rec-exp-${r.id}-${normD1}`,
            title: `💳 Recorrência: ${r.name}`,
            date: normD1,
            completed: false,
            type: 'financas',
            color: '#F59E0B', // Amber
            origin: 'finance',
            sourceData: r,
            description: `Valor Estimado: R$ ${Number(r.amount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
            amount: r.amount,
            txType: 'expense',
          });
        }
        // Next month
        const d2 = new Date(now.getFullYear(), now.getMonth() + 1, r.dayOfMonth);
        const normD2 = normalizeDate(d2);
        if (normD2) {
          list.push({
            id: `rec-exp-next-${r.id}-${normD2}`,
            title: `💳 Recorrência: ${r.name}`,
            date: normD2,
            completed: false,
            type: 'financas',
            color: '#F59E0B',
            origin: 'finance',
            sourceData: r,
            description: `Valor Estimado: R$ ${Number(r.amount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
            amount: r.amount,
            txType: 'expense',
          });
        }
      });

      // Cards
      cards.filter(c => c.active).forEach((c) => {
        const d1 = new Date(now.getFullYear(), now.getMonth(), c.dueDay);
        const normD1 = normalizeDate(d1);
        if (normD1) {
          list.push({
            id: `card-due-${c.id}-${normD1}`,
            title: `💳 Cartão ${c.name} - Vencimento`,
            date: normD1,
            completed: false,
            type: 'financas',
            color: c.color || '#8A05BE',
            origin: 'finance',
            sourceData: c,
            description: `Vencimento do cartão de crédito ${c.name}`,
          });
        }
        const d2 = new Date(now.getFullYear(), now.getMonth() + 1, c.dueDay);
        const normD2 = normalizeDate(d2);
        if (normD2) {
          list.push({
            id: `card-due-next-${c.id}-${normD2}`,
            title: `💳 Cartão ${c.name} - Vencimento`,
            date: normD2,
            completed: false,
            type: 'financas',
            color: c.color || '#8A05BE',
            origin: 'finance',
            sourceData: c,
            description: `Vencimento do cartão de crédito ${c.name}`,
          });
        }
      });
    } catch (err) {
      console.warn('Erro ao agregar recorrências financeiras:', err);
    }

    // 6. Study Revisions
    revisions.forEach((r) => {
      const normDate = normalizeDate(r.revisionDate);
      if (normDate) {
        const subj = subjects.find((s) => s.id === r.subjectId);
        const topic = subj?.topics?.find((t) => t.id === r.topicId);

        list.push({
          id: r.id,
          title: `🧠 Revisão R${r.stage}: ${subj?.name || 'Assunto'}`,
          date: normDate,
          completed: !!r.completed,
          type: 'revisao',
          color: '#8B5CF6', // Purple for Study/Revisão
          origin: 'study',
          sourceData: r,
          description: `Tópico: ${topic?.name || 'Geral'} | Estágio: R${r.stage}`,
        });
      }
    });

    return list;
  }, [manualEvents, projects, transactions, envelopes, cards, recurringIncomes, recurringExpenses, revisions, subjects]);

  return aggregated;
}
