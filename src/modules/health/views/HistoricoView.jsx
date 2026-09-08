import { useState, useMemo } from 'react';
import { useHealthStore } from '../../../stores/useHealthStore';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  LineChart, Line, Cell,
} from 'recharts';
import { Droplets, Flame, Utensils, Dumbbell, Pill } from 'lucide-react';

const RANGES = [
  { id: 7, label: '7 dias' },
  { id: 14, label: '14 dias' },
  { id: 30, label: '30 dias' },
];

const CATEGORIES = [
  { id: 'water',    label: 'Água',    icon: Droplets, color: '#38BDF8' },
  { id: 'habits',   label: 'Hábitos', icon: Flame,    color: '#A855F7' },
  { id: 'meals',    label: 'Dieta',   icon: Utensils, color: '#10B981' },
  { id: 'workout',  label: 'Treino',  icon: Dumbbell, color: '#F59E0B' },
  { id: 'meds',     label: 'Meds',    icon: Pill,     color: '#60A5FA' },
];

function lastNDates(n) {
  const arr = [];
  for (let i = n - 1; i >= 0; i--) {
    arr.push(new Date(Date.now() - i * 86400000).toISOString().split('T')[0]);
  }
  return arr;
}

function shortLabel(dateStr) {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

export function HistoricoView() {
  const {
    plans = {},
    waterLog = {},
    workoutLog = {},
    mealLog = {},
    habitLog = {},
    medsLog = {},
    streaks = {},
  } = useHealthStore();

  const [range, setRange] = useState(30);
  const [category, setCategory] = useState('water');

  const dates = useMemo(() => lastNDates(range), [range]);

  const data = useMemo(() => {
    return dates.map((d) => {
      const base = { date: d, label: shortLabel(d) };
      const water = (waterLog[d] || []).reduce((a, e) => a + e.ml, 0);
      const workouts = Object.values(workoutLog[d] || {}).some(sets => Array.isArray(sets) ? sets.some(s => s.done) : Number(sets) > 0);
      const meals = (mealLog[d] || []).length;
      const mealKcal = (mealLog[d] || []).reduce((a, l) => a + (Number(l.kcal) || 0), 0);
      const habitsDone = Object.values(habitLog[d] || {}).filter(v => v === true).length;
      const habitsTotal = Object.values(habitLog[d] || {}).length;
      const medsTaken = Object.values(medsLog[d] || {}).filter(v => v === true).length;

      return {
        ...base,
        water,
        workouts: workouts ? 1 : 0,
        meals,
        mealKcal,
        habitsDone,
        habitsTotal,
        medsTaken,
      };
    });
  }, [dates, waterLog, workoutLog, mealLog, habitLog, medsLog]);

  // Totals over range
  const totals = useMemo(() => {
    return data.reduce((acc, d) => {
      acc.water += d.water;
      acc.workouts += d.workouts;
      acc.meals += d.meals;
      acc.mealKcal += d.mealKcal;
      acc.habitsDone += d.habitsDone;
      acc.medsTaken += d.medsTaken;
      return acc;
    }, { water: 0, workouts: 0, meals: 0, mealKcal: 0, habitsDone: 0, medsTaken: 0 });
  }, [data]);

  const waterGoal = plans.water?.dailyGoalMl || plans.goals?.waterDailyMl || 2500;

  return (
    <div className="space-y-6 pb-20">
      {/* Filtros */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 card-surface">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
          <span className="text-[10px] font-black text-text-dim uppercase tracking-widest flex-shrink-0">Categoria:</span>
          {CATEGORIES.map(c => {
            const Icon = c.icon;
            return (
              <button
                key={c.id}
                onClick={() => setCategory(c.id)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
                  category === c.id
                    ? 'bg-gradient-to-r from-primary to-indigo-600 text-white'
                    : 'bg-white/[0.03] text-text-dim hover:text-white hover:bg-white/5 border border-white/5'
                }`}
              >
                <Icon size={12} style={{ color: category === c.id ? 'inherit' : c.color }} />
                {c.label}
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-1.5">
          {RANGES.map(r => (
            <button
              key={r.id}
              onClick={() => setRange(r.id)}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                range === r.id ? 'bg-primary text-black' : 'bg-white/[0.03] text-text-dim hover:text-white'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <SummaryCard icon={<Droplets size={16} />} color="#38BDF8" label="Água" value={`${Math.round(totals.water / 100) / 10}L`} sub={`meta ${waterGoal}ml`} />
        <SummaryCard icon={<Dumbbell size={16} />} color="#F59E0B" label="Treinos" value={`${totals.workouts}`} sub={`em ${range}d`} />
        <SummaryCard icon={<Utensils size={16} />} color="#10B981" label="Refeições" value={`${totals.meals}`} sub={`${Math.round(totals.mealKcal / 100) / 10}k kcal`} />
        <SummaryCard icon={<Flame size={16} />} color="#A855F7" label="Hábitos" value={`${totals.habitsDone}`} sub="concluídos" />
        <SummaryCard icon={<Pill size={16} />} color="#60A5FA" label="Meds" value={`${totals.medsTaken}`} sub="tomados" />
        <SummaryCard icon={<span>🔥</span>} color="#EF4444" label="Streak" value={`${streaks.water || 0}d`} sub="água consec." />
      </div>

      {/* Gráfico principal */}
      <div className="card-glass p-5">
        <h3 className="text-xs font-black text-white uppercase tracking-widest mb-4">
          {category === 'water' && '💧 Água por Dia (ml)'}
          {category === 'habits' && '✨ Hábitos Concluídos por Dia'}
          {category === 'meals' && '🍽️ Refeições por Dia'}
          {category === 'workout' && '🏋️ Treinos por Dia'}
          {category === 'meds' && '💊 Meds por Dia'}
        </h3>

        {category === 'water' && (
          <div className="w-full h-64">
            <ResponsiveContainer>
              <BarChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                <XAxis dataKey="label" tick={{ fill: '#9CA3AF', fontSize: 9 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill: '#9CA3AF', fontSize: 9 }} tickLine={false} axisLine={false} />
                <Tooltip
                  cursor={{ fill: '#ffffff08' }}
                  contentStyle={{ background: '#090d16', border: '1px solid #ffffff15', borderRadius: '12px' }}
                  itemStyle={{ color: '#38BDF8', fontSize: '11px' }}
                  labelStyle={{ color: '#ffffff', fontSize: '11px' }}
                />
                <Bar dataKey="water" name="ml" radius={[6, 6, 0, 0]}>
                  {data.map((d, i) => (
                    <Cell key={i} fill={d.water >= waterGoal ? '#10B981' : '#38BDF8'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {category === 'habits' && (
          <div className="w-full h-64">
            <ResponsiveContainer>
              <LineChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                <XAxis dataKey="label" tick={{ fill: '#9CA3AF', fontSize: 9 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill: '#9CA3AF', fontSize: 9 }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ background: '#090d16', border: '1px solid #ffffff15', borderRadius: '12px' }} itemStyle={{ color: '#A855F7', fontSize: '11px' }} />
                <Line type="monotone" dataKey="habitsDone" name="Concluídos" stroke="#A855F7" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {category === 'meals' && (
          <div className="w-full h-64">
            <ResponsiveContainer>
              <BarChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                <XAxis dataKey="label" tick={{ fill: '#9CA3AF', fontSize: 9 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill: '#9CA3AF', fontSize: 9 }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip cursor={{ fill: '#ffffff08' }} contentStyle={{ background: '#090d16', border: '1px solid #ffffff15', borderRadius: '12px' }} itemStyle={{ color: '#10B981', fontSize: '11px' }} />
                <Bar dataKey="meals" name="Refeições" fill="#10B981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {category === 'workout' && (
          <div className="w-full h-64">
            <ResponsiveContainer>
              <LineChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                <XAxis dataKey="label" tick={{ fill: '#9CA3AF', fontSize: 9 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill: '#9CA3AF', fontSize: 9 }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ background: '#090d16', border: '1px solid #ffffff15', borderRadius: '12px' }} itemStyle={{ color: '#F59E0B', fontSize: '11px' }} />
                <Line type="stepAfter" dataKey="workouts" name="Treino" stroke="#F59E0B" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {category === 'meds' && (
          <div className="w-full h-64">
            <ResponsiveContainer>
              <BarChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                <XAxis dataKey="label" tick={{ fill: '#9CA3AF', fontSize: 9 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill: '#9CA3AF', fontSize: 9 }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip cursor={{ fill: '#ffffff08' }} contentStyle={{ background: '#090d16', border: '1px solid #ffffff15', borderRadius: '12px' }} itemStyle={{ color: '#60A5FA', fontSize: '11px' }} />
                <Bar dataKey="medsTaken" name="Tomados" fill="#60A5FA" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Tabela de histórico */}
      <div className="card-glass p-5">
        <h3 className="text-xs font-black text-white uppercase tracking-widest mb-4">📋 Registros por Dia</h3>
        <div className="max-h-[360px] overflow-y-auto pr-1">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-[#0C0C10]">
              <tr className="text-left text-[10px] text-gray-500 uppercase tracking-widest border-b border-white/5">
                <th className="py-2">Data</th>
                <th className="py-2">💧</th>
                <th className="py-2">🏋️</th>
                <th className="py-2">🍽️</th>
                <th className="py-2">✨</th>
                <th className="py-2">💊</th>
              </tr>
            </thead>
            <tbody>
              {[...data].reverse().map((d) => (
                <tr key={d.date} className="border-b border-white/[0.03] hover:bg-white/[0.02]">
                  <td className="py-2 font-bold text-white capitalize">
                    {new Date(d.date + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' })}
                  </td>
                  <td className="py-2 font-mono text-sky-400">{d.water > 0 ? `${Math.round(d.water / 100) / 10}L` : '—'}</td>
                  <td className="py-2 text-amber-400">{d.workouts ? '✓' : '—'}</td>
                  <td className="py-2 font-mono text-emerald-400">{d.meals > 0 ? d.meals : '—'}</td>
                  <td className="py-2 text-purple-400">{d.habitsDone > 0 ? d.habitsDone : '—'}</td>
                  <td className="py-2 text-blue-400">{d.medsTaken > 0 ? d.medsTaken : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ icon, color, label, value, sub }) {
  return (
    <div className="card-surface p-3.5 rounded-2xl">
      <div className="flex items-center gap-2 mb-2">
        <span className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${color}15`, border: `1px solid ${color}30`, color }}>
          {icon}
        </span>
        <span className="text-[10px] font-bold text-text-dim uppercase tracking-wider">{label}</span>
      </div>
      <div className="text-lg font-black text-white leading-none">{value}</div>
      <div className="text-[9px] text-text-dim mt-1">{sub}</div>
    </div>
  );
}

export default HistoricoView;