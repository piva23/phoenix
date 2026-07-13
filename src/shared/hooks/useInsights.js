import { useMemo } from 'react';
import { useSessionStore } from '../../stores/useSessionStore';
import { useRelationshipStore } from '../../stores/useRelationshipStore';
import { useFinanceStore, todayKey, fmtBRL } from '../../stores/useFinanceStore';
import { useSpiritualStore } from '../../stores/useSpiritualStore';
import { useHealthStore } from '../../stores/useHealthStore';

// Heurísticas simples e reais — não é IA generativa, são regras sobre dados
// que já existem nas stores (streaks, saldo do mês, contatos parados, etc).
export function useInsights() {
  const getStreak = useSessionStore(s => s.getStreak);
  const people = useRelationshipStore(s => s.people);
  const getMonthSummary = useFinanceStore(s => s.getMonthSummary);
  const spiritualStreaks = useSpiritualStore(s => s.getStreaks());
  const healthStreaks = useHealthStore(s => s.streaks);

  return useMemo(() => {
    const insights = [];
    const streak = getStreak();

    if (streak >= 3) {
      insights.push({
        icon: '🔥',
        text: `Você está com ${streak} dias seguidos de estudo. Ofensiva sólida — não quebre hoje.`,
      });
    } else if (streak === 0) {
      insights.push({
        icon: '⚠️',
        text: 'Você ainda não estudou hoje. Um bloco curto já mantém o ritmo.',
      });
    }

    // Relacionamentos: pessoa sem interação há mais tempo
    const withDates = people.filter(p => p.lastInteraction);
    if (withDates.length > 0) {
      const oldest = withDates.reduce((a, b) =>
        new Date(a.lastInteraction) < new Date(b.lastInteraction) ? a : b
      );
      const days = Math.floor(
        (Date.now() - new Date(oldest.lastInteraction)) / 86400000
      );
      if (days >= 5) {
        insights.push({
          icon: '💬',
          text: `Você não fala com ${oldest.name} há ${days} dias.`,
        });
      }
    }

    // Finanças: saldo do mês
    const { balance, expense } = getMonthSummary(todayKey());
    if (expense > 0) {
      insights.push({
        icon: balance >= 0 ? '📈' : '📉',
        text:
          balance >= 0
            ? `Seu saldo do mês está positivo em ${fmtBRL(balance)}.`
            : `Seu saldo do mês está negativo em ${fmtBRL(Math.abs(balance))}.`,
      });
    }

    // Espiritual: consistência do ritual da manhã
    if (spiritualStreaks.morning >= 3) {
      insights.push({
        icon: '🌅',
        text: `${spiritualStreaks.morning} dias seguidos de ritual matinal. Consistência é o jogo.`,
      });
    }

    // Saúde: treino
    if (healthStreaks.workout >= 3) {
      insights.push({
        icon: '🏋️',
        text: `${healthStreaks.workout} dias seguidos de treino. Continue assim.`,
      });
    } else if (healthStreaks.workout === 0) {
      insights.push({
        icon: '💤',
        text: 'Nenhum treino registrado recentemente — talvez seja hora de retomar.',
      });
    }

    return insights.slice(0, 5);
  }, [getStreak, people, getMonthSummary, spiritualStreaks, healthStreaks]);
}
