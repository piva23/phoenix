import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

import { useProjectStore } from '../../stores/useProjectStore';
import { useHealthStore } from '../../stores/useHealthStore';
import { useCalendarStore } from '../../stores/useCalendarStore';
import { useSpiritualStore } from '../../stores/useSpiritualStore';
import { useRevisionStore } from '../../stores/useRevisionStore';
import { useCycleStore } from '../../stores/useCycleStore';
import { useFinanceStore, fmtBRL } from '../../stores/useFinanceStore';
import { today } from '../utils/time';

// Formato normalizado de cada item:
// { id, moduleOrigin, icon, title, subtitle, xpReward, type: 'inline'|'navigate', overdue, onComplete?, onOpen? }
//
// 'inline'   -> tem ação de 1 clique que já existe na store correspondente (task, hábito, água, evento).
// 'navigate' -> exige preencher campos (ritual, revisão com nota, lançamento financeiro) -> abre o módulo certo.
export function useDailyTasks() {
  const navigate = useNavigate();
  const t = today();

  const projects = useProjectStore(s => s.projects);
  const completeTask = useProjectStore(s => s.completeTask);

  const habitsPlan = useHealthStore(s => s.plans.habits || []);
  const habitLogToday = useHealthStore(s => s.habitLog[t] || {});
  const logHabit = useHealthStore(s => s.logHabit);
  const waterLog = useHealthStore(s => s.waterLog[t] || []);
  const waterGoal = useHealthStore(
    s => s.plans.water?.dailyGoalMl || s.plans.goals?.waterDailyMl || 2500
  );
  const addWater = useHealthStore(s => s.addWater);

  const events = useCalendarStore(s => s.events);
  const toggleEventDone = useCalendarStore(s => s.toggleEventDone);

  const getRitual = useSpiritualStore(s => s.getRitual);

  const pendingRevisions = useRevisionStore(s => s.getPendingToday());
  const getTodaySuggestion = useCycleStore(s => s.getTodaySuggestion);

  const getUpcomingFinance = useFinanceStore(s => s.getUpcoming);

  return useMemo(() => {
    const items = [];

    // ── Projetos: tasks com prazo hoje ──────────────────────────────────────
    projects.forEach(p => {
      (p.objetivos || []).forEach(o => {
        (o.tasks || []).forEach(task => {
          if (task.status !== 'done' && task.deadline === t) {
            items.push({
              id: `task_${task.id}`,
              moduleOrigin: 'projects',
              icon: '◇',
              title: task.title || task.nome || 'Tarefa do projeto',
              subtitle: p.nome || p.name || 'Projeto',
              xpReward: task.xpReward || 10,
              type: 'inline',
              overdue: false,
              onComplete: () => {
                const xp = completeTask(p.id, o.id, task.id);
                if (xp) toast.success(`+${xp} XP`);
              },
            });
          }
        });
      });
    });

    // ── Saúde: hábitos de construção não marcados hoje ──────────────────────
    habitsPlan.forEach(h => {
      if (h.type !== 'quit' && habitLogToday[h.id] !== true) {
        items.push({
          id: `habit_${h.id}`,
          moduleOrigin: 'health',
          icon: '🏃',
          title: h.name || h.label || 'Hábito',
          subtitle: 'Hábito de hoje',
          xpReward: h.xp || 10,
          type: 'inline',
          overdue: false,
          onComplete: () => {
            logHabit(h.id, true);
            toast.success('Hábito registrado!');
          },
        });
      }
    });

    // ── Saúde: meta de água ──────────────────────────────────────────────────
    const drankMl = waterLog.reduce((a, e) => a + e.ml, 0);
    if (drankMl < waterGoal) {
      items.push({
        id: 'water_today',
        moduleOrigin: 'health',
        icon: '💧',
        title: `Beber água (${drankMl}/${waterGoal}ml)`,
        subtitle: 'Meta diária',
        xpReward: 5,
        type: 'inline',
        overdue: false,
        onComplete: () => {
          addWater(250);
          toast.success('+250ml registrado');
        },
      });
    }

    // ── Calendário: eventos de hoje não concluídos ──────────────────────────
    events
      .filter(e => e.date === t && !e.completed)
      .forEach(e => {
        items.push({
          id: `event_${e.id}`,
          moduleOrigin: 'calendar',
          icon: '📅',
          title: e.title || e.nome || 'Evento',
          subtitle: e.time || 'Hoje',
          xpReward: 5,
          type: 'inline',
          overdue: false,
          onComplete: () => {
            toggleEventDone(e.id);
            toast.success('Evento concluído');
          },
        });
      });

    // ── Espiritual: rituais (exigem input -> navigate) ──────────────────────
    const morning = getRitual(t, 'morning');
    if (!morning?.completedAt) {
      items.push({
        id: 'ritual_morning',
        moduleOrigin: 'spiritual',
        icon: '🌅',
        title: 'Ritual da Manhã',
        subtitle: 'Intenção, gratidão e afirmação',
        xpReward: 30,
        type: 'navigate',
        overdue: false,
        onOpen: () => navigate('/spiritual'),
      });
    }
    const night = getRitual(t, 'night');
    if (!night?.completedAt) {
      items.push({
        id: 'ritual_night',
        moduleOrigin: 'spiritual',
        icon: '🌙',
        title: 'Ritual da Noite',
        subtitle: 'Reflexão e aprendizado do dia',
        xpReward: 25,
        type: 'navigate',
        overdue: false,
        onOpen: () => navigate('/spiritual'),
      });
    }

    // ── Estudo: sugestão do ciclo ativo ──────────────────────────────────────
    const suggestion = getTodaySuggestion();
    if (suggestion?.type === 'study') {
      items.push({
        id: 'cycle_suggestion',
        moduleOrigin: 'study',
        icon: '📚',
        title: suggestion.item.subjectName || 'Matéria do ciclo',
        subtitle: `${suggestion.progressPct}% da rodada · faltam ${Math.round(suggestion.remaining)}min`,
        xpReward: null,
        type: 'navigate',
        overdue: false,
        onOpen: () => navigate('/study/session'),
      });
    } else if (suggestion?.type === 'advance_round') {
      items.push({
        id: 'cycle_advance',
        moduleOrigin: 'study',
        icon: '📚',
        title: 'Rodada do ciclo concluída',
        subtitle: 'Avançar para a próxima rodada',
        xpReward: null,
        type: 'navigate',
        overdue: false,
        onOpen: () => navigate('/study/cycle'),
      });
    }

    // ── Estudo: revisões pendentes (nota exige input -> navigate) ───────────
    pendingRevisions.slice(0, 5).forEach(r => {
      items.push({
        id: `rev_${r.id}`,
        moduleOrigin: 'study',
        icon: '🔁',
        title: 'Revisão pendente',
        subtitle: `Estágio R${r.stage}`,
        xpReward: null,
        type: 'navigate',
        overdue: r.revisionDate < t,
        onOpen: () => navigate('/study/revisions'),
      });
    });

    // ── Finanças: recorrências/faturas que vencem hoje ──────────────────────
    getUpcomingFinance(0).forEach(f => {
      items.push({
        id: `fin_${f.name}_${f.date}`,
        moduleOrigin: 'finance',
        icon: f.type === 'income' ? '💰' : f.type === 'invoice' ? '💳' : '📉',
        title: f.name,
        subtitle:
          f.type === 'income'
            ? `A receber hoje · ${fmtBRL(f.amount)}`
            : `Vence hoje · ${fmtBRL(f.amount)}`,
        xpReward: null,
        type: 'navigate',
        overdue: false,
        onOpen: () => navigate('/finance'),
      });
    });

    // Atrasados primeiro, depois o resto na ordem de geração
    return items.sort((a, b) => (b.overdue ? 1 : 0) - (a.overdue ? 1 : 0));
  }, [
    projects,
    habitsPlan,
    habitLogToday,
    waterLog,
    waterGoal,
    events,
    pendingRevisions,
    t,
  ]);
}
