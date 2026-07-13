import { useMemo } from 'react';
import { useHealthStore } from '../../../stores/useHealthStore';
import { motion } from 'framer-motion';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
} from 'recharts';

const COLORS = {
  water: '#38BDF8',
  workout: '#A855F7',
  meal: '#22C55E',
  habit: '#F59E0B',
};

function SectionCard({ title, icon, children, accent }) {
  return (
    <div
      className="rounded-3xl overflow-hidden mb-5 transition-all shadow-lg"
      style={{
        background: 'var(--bg-surface)',
        border: `1px solid var(--border)`,
      }}
    >
      <div
        className="flex items-center gap-2 px-5 py-4 border-b"
        style={{
          borderColor: 'var(--border)',
          borderLeft: `4px solid ${accent}`,
        }}
      >
        <span className="text-xl">{icon}</span>
        <span className="font-black text-sm uppercase tracking-widest text-text-main">
          {title}
        </span>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function StreakCards() {
  const { streaks = {}, plans = {} } = useHealthStore();
  const vicios = plans.habits?.filter(h => h.type === 'quit') || [];

  return (
    <div className="space-y-4">
      {/* Streaks Positivos GERAIS */}
      <div className="grid grid-cols-3 gap-3">
        {[
          {
            label: 'Água',
            icon: '💧',
            color: COLORS.water,
            val: streaks.water || 0,
          },
          {
            label: 'Treino',
            icon: '💪',
            color: COLORS.workout,
            val: streaks.workout || 0,
          },
          {
            label: 'Dieta',
            icon: '🍽️',
            color: COLORS.meal,
            val: streaks.meal || 0,
          },
        ].map(s => (
          <div
            key={s.label}
            className="rounded-2xl p-4 flex flex-col items-center justify-center relative overflow-hidden border-2"
            style={{
              background: 'var(--bg-surface-2)',
              borderColor: `${s.color}22`,
            }}
          >
            <div
              className="absolute inset-0 opacity-10 pointer-events-none"
              style={{
                background: `radial-gradient(circle at center, ${s.color} 0%, transparent 70%)`,
              }}
            />
            <div className="text-2xl mb-1 drop-shadow-md">{s.icon}</div>
            <div
              className="text-3xl font-black mb-0.5 tracking-tighter drop-shadow-sm"
              style={{ color: s.color }}
            >
              {s.val}
            </div>
            <div className="text-[8px] text-text-dim uppercase tracking-widest font-bold text-center leading-tight">
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {/* Streaks de SOBRIEDADE (Os Vícios) */}
      {vicios.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-800">
          <h4 className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-3">
            🛡️ Ofensivas de Sobriedade
          </h4>
          <div className="grid grid-cols-2 gap-3">
            {vicios.map(v => (
              <div
                key={v.id}
                className="p-3 rounded-xl border border-red-900/30 bg-red-950/20 flex items-center gap-3"
              >
                <span className="text-2xl">{v.icon}</span>
                <div>
                  <div className="text-xl font-black text-red-400">
                    {streaks.habits?.[v.id] || 0}{' '}
                    <span className="text-[10px] text-red-500">DIAS</span>
                  </div>
                  <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                    {v.name}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function HealthHeatmap() {
  const {
    waterLog = {},
    workoutLog = {},
    mealLog = {},
    habitLog = {},
    circuitLog = {},
    plans = {},
  } = useHealthStore();

  const days = useMemo(() => {
    const arr = [];
    for (let i = 89; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000).toISOString().split('T')[0];
      const waterMl = (waterLog[d] || []).reduce((a, e) => a + e.ml, 0);
      const waterOk =
        waterMl >=
        (plans.water?.dailyGoalMl || plans.goals?.waterDailyMl || 3500) * 0.8;
      const workedOk = Object.keys(workoutLog[d] || {}).length > 0;
      const mealOk = (mealLog[d] || []).length > 0;
      const habitsOk =
        Object.values(habitLog[d] || {}).every(v => v !== false) &&
        Object.keys(habitLog[d] || {}).length > 0;

      const score = [waterOk, workedOk, mealOk, habitsOk].filter(
        Boolean
      ).length;
      arr.push({ date: d, score });
    }
    return arr;
  }, [waterLog, workoutLog, mealLog, habitLog, circuitLog, plans]);

  const colors = [
    '#1f2937',
    '#0f766e40',
    '#0f766e80',
    '#047857cc',
    '#10b981',
    '#34d399',
  ];

  return (
    <div>
      <div className="flex flex-wrap gap-1 bg-black/20 p-4 rounded-2xl border border-gray-800 justify-center">
        {days.map(d => (
          <div
            key={d.date}
            title={`${d.date} — ${d.score}/4 áreas`}
            className="w-3.5 h-3.5 rounded-[3px] transition-all hover:scale-125 cursor-crosshair"
            style={{
              background: colors[d.score] || colors[0],
              boxShadow: d.score >= 4 ? '0 0 5px #34d39980' : 'none',
            }}
          />
        ))}
      </div>
      <div className="flex justify-center items-center gap-1.5 mt-3 opacity-70">
        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
          Inativo
        </span>
        {colors.map((c, i) => (
          <div
            key={i}
            className="w-2.5 h-2.5 rounded-[2px]"
            style={{ background: c }}
          />
        ))}
        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
          Perfeito
        </span>
      </div>
    </div>
  );
}

// ── DAILY LOGBOOK (HISTÓRICO DA DIETA MOVIDO PARA CÁ) ─────────────────────────
function DailyLogbook() {
  const { mealLog = {}, removeMealLogById } = useHealthStore();
  const today = new Date().toISOString().split('T')[0];
  const logs = mealLog[today] || [];

  if (logs.length === 0) {
    return (
      <div className="text-center py-6 text-gray-500 text-xs font-bold uppercase tracking-widest bg-black/20 rounded-2xl border border-dashed border-gray-800">
        Nenhum registro de comida hoje.
      </div>
    );
  }

  return (
    <div className="bg-black/20 rounded-2xl border border-gray-800 p-4">
      <h4 className="text-[10px] font-black text-green-500 uppercase tracking-widest mb-3">
        Diário Alimentar de Hoje
      </h4>
      <div className="space-y-2">
        {/* Usando reverse direto no array espelhado para não mutar o original */}
        {[...logs].reverse().map(log => {
          const time = new Date(log.timestamp).toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit',
          });
          return (
            <div
              key={log.id}
              className="flex justify-between items-center p-3 bg-gray-900 rounded-xl border border-gray-800"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{log.icon || '🍽️'}</span>
                <div>
                  <div className="text-sm font-bold text-gray-200 leading-tight">
                    {log.name}
                  </div>
                  <div className="text-[9px] text-gray-500 font-bold mt-0.5">
                    {time}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-black text-green-400 bg-green-500/10 px-2 py-1 rounded">
                  {log.kcal} kcal
                </span>
                <button
                  onClick={() => removeMealLogById(today, log.id)}
                  className="w-6 h-6 flex justify-center items-center rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all text-xs font-bold"
                >
                  ✕
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── RENDER PRINCIPAL ──────────────────────────────────────────────────────────
export function AnalyticsTab() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="pb-24"
    >
      <SectionCard title="Suas Ofensivas" icon="🔥" accent="#F59E0B">
        <StreakCards />
      </SectionCard>

      <SectionCard title="Diário Alimentar (Hoje)" icon="📖" accent="#22C55E">
        <DailyLogbook />
      </SectionCard>

      <SectionCard title="Gráfico de Consistência" icon="📅" accent="#10B981">
        <HealthHeatmap />
      </SectionCard>
    </motion.div>
  );
}
