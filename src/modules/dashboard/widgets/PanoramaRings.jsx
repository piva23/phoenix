import { useMemo } from 'react';
import { useHealthStore } from '../../../stores/useHealthStore';
import { useXPStore } from '../../../stores/useXPStore';
import { useFinanceStore, fmtBRL } from '../../../stores/useFinanceStore';
import { useRelationshipStore } from '../../../stores/useRelationshipStore';
import { useSessionStore } from '../../../stores/useSessionStore';
import { today } from '../../../shared/utils/time';

function Ring({ pct, color, size = 44 }) {
  const r = (size - 6) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (Math.min(Math.max(pct, 0), 100) / 100) * c;
  return (
    <svg width={size} height={size} className="flex-shrink-0 -rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="var(--bg-surface-2)"
        strokeWidth="4"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth="4"
        strokeDasharray={c}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset .6s ease' }}
      />
    </svg>
  );
}

export function PanoramaRings() {
  const t = today();

  const habitsPlan = useHealthStore(s => s.plans.habits || []);
  const habitLogToday = useHealthStore(s => s.habitLog[t] || {});
  const waterLog = useHealthStore(s => s.waterLog[t] || []);
  const waterGoal = useHealthStore(
    s => s.plans.water?.dailyGoalMl || s.plans.goals?.waterDailyMl || 2500
  );
  const workoutLogToday = useHealthStore(s => s.workoutLog[t] || {});

  const logs = useXPStore(s => s.logs);
  const transactions = useFinanceStore(s => s.transactions);
  const people = useRelationshipStore(s => s.people);
  const todayMinutes = useSessionStore(s => s.getTodayMinutes(t));

  const stats = useMemo(() => {
    const habitsDone = habitsPlan.filter(h => habitLogToday[h.id] === true).length;
    const habitsTotal = habitsPlan.length || 1;
    const habitsPct = Math.round((habitsDone / habitsTotal) * 100);

    const todayXP = logs
      .filter(l => new Date(l.timestamp).toISOString().slice(0, 10) === t)
      .reduce((a, l) => a + l.xp, 0);

    const drankMl = waterLog.reduce((a, e) => a + e.ml, 0);
    const waterPct = Math.min(100, Math.round((drankMl / waterGoal) * 100));
    const workedOut = Object.keys(workoutLogToday).length > 0;
    const healthPct = Math.round((waterPct + (workedOut ? 100 : 0)) / 2);

    const todayExpense = transactions
      .filter(tx => tx.date === t && tx.type === 'expense')
      .reduce((a, tx) => a + tx.amount, 0);

    const avgScore = people.length
      ? Math.round(
          people.reduce((a, p) => a + (p.relationshipScore || 0), 0) / people.length
        )
      : 0;

    const focusPct = Math.min(100, Math.round((todayMinutes / 240) * 100));

    return {
      habitsPct, habitsDone, habitsTotal, todayXP, healthPct,
      todayExpense, avgScore, focusPct, todayMinutes,
    };
  }, [
    habitsPlan, habitLogToday, waterLog, waterGoal, workoutLogToday,
    logs, transactions, people, todayMinutes, t,
  ]);

  const cards = [
    { label: 'Foco', value: `${stats.todayMinutes}min`, pct: stats.focusPct, color: '#38BDF8', icon: '🎯' },
    { label: 'Hábitos', value: `${stats.habitsDone}/${stats.habitsTotal}`, pct: stats.habitsPct, color: '#10B981', icon: '✅' },
    { label: 'XP de hoje', value: `+${stats.todayXP}`, pct: null, color: '#F59E0B', icon: '⚡' },
    { label: 'Saúde', value: `${stats.healthPct}%`, pct: stats.healthPct, color: '#EF4444', icon: '❤️' },
    { label: 'Finanças', value: fmtBRL(stats.todayExpense), pct: null, color: '#EC4899', icon: '💰' },
    { label: 'Relações', value: `${stats.avgScore}%`, pct: stats.avgScore, color: '#A855F7', icon: '👥' },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {cards.map(c => (
        <div
          key={c.label}
          className="rounded-2xl p-4 border flex flex-col items-center gap-2 text-center"
          style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
        >
          <div className="relative flex items-center justify-center w-11 h-11">
            {c.pct !== null ? (
              <>
                <Ring pct={c.pct} color={c.color} />
                <span className="absolute text-base">{c.icon}</span>
              </>
            ) : (
              <div
                className="w-11 h-11 rounded-full flex items-center justify-center text-lg"
                style={{ background: `${c.color}18` }}
              >
                {c.icon}
              </div>
            )}
          </div>
          <div className="text-xs font-bold text-text-main">{c.value}</div>
          <div className="text-[10px] text-text-dim uppercase tracking-wide">
            {c.label}
          </div>
        </div>
      ))}
    </div>
  );
}
