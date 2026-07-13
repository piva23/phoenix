// CycleDetailView.jsx — Visão detalhada de um ciclo com gráficos e editor inline
import { useState, useMemo } from 'react';
import { useSessionStore } from '../../../stores/useSessionStore';
import { useStudyStore } from '../../../stores/useStudyStore';
import { useCycleStore } from '../../../stores/useCycleStore';
import { formatMinutes } from '../../../shared/utils/time';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  AreaChart,
  Area,
} from 'recharts';
import toast from 'react-hot-toast';

// ── helpers ───────────────────────────────────────────────────────────────────

function minutesToHuman(min) {
  if (!min) return '0 min';
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="px-3 py-2 rounded-lg text-xs shadow-xl"
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        color: 'var(--text-main)',
      }}
    >
      <div className="font-bold">{payload[0].name}</div>
      <div style={{ color: payload[0].fill }}>{payload[0].value}</div>
    </div>
  );
};

// ── componente ────────────────────────────────────────────────────────────────

export function CycleDetailView({ cycle, onBack, onEdit }) {
  const sessions = useSessionStore(s => s.sessions);
  const subjects = useStudyStore(s => s.subjects);
  const { updateItem, removeItem, advanceRound, addItem } = useCycleStore();

  const [tab, setTab] = useState('overview'); // overview | materias

  const todayStr = new Date().toISOString().slice(0, 10);

  // progresso real: sessões desde o início da rodada, filtradas pelas matérias do ciclo
  const realMinutesBySubject = useMemo(() => {
    const roundStart = cycle.rodadaStartDate || '2000-01-01';
    const subjectIds = new Set(
      cycle.items.map(i => i.subjectId).filter(Boolean)
    );
    const map = {};
    sessions
      .filter(s => s.date >= roundStart && subjectIds.has(s.subjectId))
      .forEach(s => {
        map[s.subjectId] = (map[s.subjectId] || 0) + (s.totalMinutes || 0);
      });
    return map;
  }, [sessions, cycle]);

  // acerto % por matéria (sessões de questões)
  const accuracyBySubject = useMemo(() => {
    const map = {};
    sessions
      .filter(s => s.studyType === 'questoes' || s.modes?.includes('questoes'))
      .forEach(s => {
        if (!map[s.subjectId]) map[s.subjectId] = { q: 0, c: 0 };
        map[s.subjectId].q += s.questionsAnswered || 0;
        map[s.subjectId].c += s.questionsCorrect || 0;
      });
    return Object.fromEntries(
      Object.entries(map).map(([id, d]) => [
        id,
        d.q > 0 ? Math.round((d.c / d.q) * 100) : null,
      ])
    );
  }, [sessions]);

  // dados enriquecidos dos items — cor SEMPRE vem do store (subj.color), nunca do snapshot do ciclo
  const enrichedItems = useMemo(() => {
    return cycle.items
      .slice()
      .sort((a, b) => (a.ordem || 0) - (b.ordem || 0))
      .map(item => {
        const subj = subjects.find(s => s.id === item.subjectId);
        const realMin = realMinutesBySubject[item.subjectId] || 0;
        const metaMin = (item.horasPorRodada || 1) * 60;
        const pct = Math.min(100, Math.round((realMin / metaMin) * 100));
        const acc = accuracyBySubject[item.subjectId] ?? null;
        // subj.color é sempre a fonte de verdade — evita dessincronizar quando usuário muda cor
        const color = subj?.color || item.subjectColor || '#8B5CF6';
        return { ...item, subj, realMin, metaMin, pct, acc, color };
      });
  }, [cycle.items, subjects, realMinutesBySubject, accuracyBySubject]);

  // KPIs gerais
  const totalMeta = enrichedItems.reduce((a, i) => a + i.metaMin, 0);
  const totalReal = enrichedItems.reduce((a, i) => a + i.realMin, 0);
  const roundPct =
    totalMeta > 0
      ? Math.min(100, Math.round((totalReal / totalMeta) * 100))
      : 0;
  const allDone = enrichedItems.every(i => i.pct >= 100);
  const nextItem = enrichedItems.find(i => i.pct < 100);

  // dados para pizza (planejado)
  const pieData = enrichedItems.map(i => ({
    name: i.subjectName || i.subj?.name || '—',
    value: i.horasPorRodada,
    color: i.color,
  }));

  // dados para barras (real vs meta)
  const barData = enrichedItems.map(i => ({
    name: (i.subj?.name || i.subjectName || '—').slice(0, 18),
    meta: Math.round((i.metaMin / 60) * 10) / 10,
    real: Math.round((i.realMin / 60) * 10) / 10,
    color: i.color,
  }));

  // ritmo diário desde o início da rodada — pra ver se o passo tá bom
  const { paceData, avgDailyMin, forecastDays } = useMemo(() => {
    const start = cycle.rodadaStartDate || todayStr;
    const subjectIds = new Set(
      cycle.items.map(i => i.subjectId).filter(Boolean)
    );
    const startDate = new Date(start);
    const daysSoFar =
      Math.floor((new Date(todayStr) - startDate) / 86400000) + 1;
    const dailyTarget = daysSoFar > 0 ? totalMeta / Math.max(daysSoFar, 7) : 0; // referência leve

    const data = [];
    let cumulative = 0;
    for (let i = 0; i < Math.max(daysSoFar, 1); i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().slice(0, 10);
      const dayMin = sessions
        .filter(s => s.date === dateStr && subjectIds.has(s.subjectId))
        .reduce((a, s) => a + (s.totalMinutes || 0), 0);
      cumulative += dayMin;
      data.push({
        date: `${dateStr.slice(8, 10)}/${dateStr.slice(5, 7)}`,
        min: dayMin,
        acumulado: Math.round((cumulative / 60) * 10) / 10,
      });
    }

    const avgMin = daysSoFar > 0 ? totalReal / daysSoFar : 0;
    const remaining = Math.max(0, totalMeta - totalReal);
    const forecast = avgMin > 0 ? Math.ceil(remaining / avgMin) : null;

    return {
      paceData: data,
      avgDailyMin: Math.round(avgMin),
      forecastDays: forecast,
    };
  }, [cycle, sessions, totalMeta, totalReal, todayStr]);

  function handleUpdateHoras(itemId, val) {
    const h = Math.max(0.5, Math.round(Number(val) * 2) / 2);
    updateItem(cycle.id, itemId, { horasPorRodada: h });
  }

  function handleRemoveItem(itemId) {
    if (cycle.items.length <= 1) {
      toast.error('O ciclo precisa de ao menos 1 matéria.');
      return;
    }
    removeItem(cycle.id, itemId);
  }

  return (
    <div className="space-y-5 animate-fade-in">
      {/* header */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="w-9 h-9 rounded-xl border flex items-center justify-center"
          style={{ borderColor: 'var(--border)', color: 'var(--text-dim)' }}
        >
          ←
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2
              className="text-xl font-black truncate"
              style={{ color: 'var(--text-main)' }}
            >
              {cycle.nome}
            </h2>
            <span
              className="text-xs px-2 py-0.5 rounded-full font-bold"
              style={{
                background: 'var(--primary)22',
                color: 'var(--primary)',
              }}
            >
              Rodada {cycle.rodadaAtual}
            </span>
          </div>
          {cycle.rodadaStartDate && (
            <div
              className="text-xs mt-0.5"
              style={{ color: 'var(--text-dim)' }}
            >
              Rodada iniciada em {cycle.rodadaStartDate}
            </div>
          )}
        </div>
        <button
          onClick={onEdit}
          className="px-3 py-2 rounded-xl text-xs font-bold border"
          style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
        >
          ✎ Editar
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div
          className="p-4 rounded-2xl border text-center"
          style={{
            background: 'var(--bg-surface)',
            borderColor: 'var(--border)',
          }}
        >
          <div
            className="text-2xl font-black"
            style={{ color: 'var(--primary)' }}
          >
            {roundPct}%
          </div>
          <div
            className="text-[9px] uppercase tracking-widest mt-1"
            style={{ color: 'var(--text-dim)' }}
          >
            Rodada
          </div>
        </div>
        <div
          className="p-4 rounded-2xl border text-center"
          style={{
            background: 'var(--bg-surface)',
            borderColor: 'var(--border)',
          }}
        >
          <div
            className="text-2xl font-black"
            style={{ color: 'var(--text-main)' }}
          >
            {minutesToHuman(totalReal)}
          </div>
          <div
            className="text-[9px] uppercase tracking-widest mt-1"
            style={{ color: 'var(--text-dim)' }}
          >
            Estudado
          </div>
        </div>
        <div
          className="p-4 rounded-2xl border text-center"
          style={{
            background: 'var(--bg-surface)',
            borderColor: 'var(--border)',
          }}
        >
          <div
            className="text-2xl font-black"
            style={{ color: 'var(--text-dim)' }}
          >
            {minutesToHuman(Math.max(0, totalMeta - totalReal))}
          </div>
          <div
            className="text-[9px] uppercase tracking-widest mt-1"
            style={{ color: 'var(--text-dim)' }}
          >
            Restante
          </div>
        </div>
        <div
          className="p-4 rounded-2xl border text-center"
          style={{
            background: 'var(--bg-surface)',
            borderColor: 'var(--border)',
          }}
        >
          <div
            className="text-2xl font-black"
            style={{
              color: allDone
                ? '#10B981'
                : forecastDays === null
                  ? 'var(--text-dim)'
                  : forecastDays <= 7
                    ? '#10B981'
                    : '#F59E0B',
            }}
          >
            {allDone ? '✓' : forecastDays === null ? '—' : `${forecastDays}d`}
          </div>
          <div
            className="text-[9px] uppercase tracking-widest mt-1"
            style={{ color: 'var(--text-dim)' }}
          >
            {allDone ? 'Concluído' : 'Previsão'}
          </div>
        </div>
      </div>

      {/* barra de rodada */}
      <div className="px-1">
        <div
          className="h-2 rounded-full overflow-hidden"
          style={{ background: 'var(--bg-surface-2)' }}
        >
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${roundPct}%`,
              background: allDone ? '#10B981' : 'var(--primary)',
            }}
          />
        </div>
      </div>

      {/* avançar rodada */}
      {allDone && (
        <div
          className="flex items-center justify-between p-4 rounded-2xl border"
          style={{ background: '#10B98115', borderColor: '#10B98133' }}
        >
          <div>
            <div className="text-sm font-bold" style={{ color: '#10B981' }}>
              ✅ Rodada {cycle.rodadaAtual} concluída!
            </div>
            <div
              className="text-xs mt-0.5"
              style={{ color: 'var(--text-dim)' }}
            >
              Todas as matérias atingiram a meta desta rodada.
            </div>
          </div>
          <button
            onClick={() => {
              advanceRound(cycle.id);
              toast.success(`Rodada ${cycle.rodadaAtual + 1} iniciada!`);
            }}
            className="px-4 py-2 rounded-xl text-sm font-bold text-white shrink-0"
            style={{ background: '#10B981' }}
          >
            Avançar →
          </button>
        </div>
      )}

      {/* próxima matéria */}
      {!allDone && nextItem && (
        <div
          className="flex items-center gap-3 p-4 rounded-2xl border"
          style={{
            background: `${nextItem.color}10`,
            borderColor: `${nextItem.color}40`,
          }}
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
            style={{ background: `${nextItem.color}22` }}
          >
            📖
          </div>
          <div className="flex-1 min-w-0">
            <div
              className="text-[10px] uppercase tracking-widest"
              style={{ color: 'var(--text-dim)' }}
            >
              Próxima do ciclo
            </div>
            <div
              className="font-bold text-sm truncate"
              style={{ color: 'var(--text-main)' }}
            >
              {nextItem.subj?.name || nextItem.subjectName}
            </div>
            <div
              className="text-xs mt-0.5"
              style={{ color: 'var(--text-dim)' }}
            >
              Faltam{' '}
              {minutesToHuman(Math.max(0, nextItem.metaMin - nextItem.realMin))}
            </div>
          </div>
          {nextItem.acc !== null && (
            <div className="text-right shrink-0">
              <div
                className="text-lg font-black"
                style={{ color: nextItem.acc >= 70 ? '#10B981' : '#F59E0B' }}
              >
                {nextItem.acc}%
              </div>
              <div className="text-[9px]" style={{ color: 'var(--text-dim)' }}>
                acerto
              </div>
            </div>
          )}
        </div>
      )}

      {/* tabs */}
      <div
        className="flex gap-1 p-1 rounded-xl"
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
        }}
      >
        {[
          { id: 'overview', label: 'Visão geral' },
          { id: 'materias', label: 'Matérias' },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className="flex-1 py-2 rounded-lg text-xs font-bold transition-all"
            style={{
              background: tab === t.id ? 'var(--primary)' : 'transparent',
              color: tab === t.id ? 'white' : 'var(--text-muted)',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW TAB ───────────────────────────────────────────────── */}
      {tab === 'overview' && (
        <div className="space-y-5">
          {/* pizza + legenda */}
          <div
            className="p-5 rounded-2xl border"
            style={{
              background: 'var(--bg-surface)',
              borderColor: 'var(--border)',
            }}
          >
            <div
              className="text-sm font-bold mb-4"
              style={{ color: 'var(--text-main)' }}
            >
              Distribuição planejada
            </div>
            <div className="flex gap-4 items-center">
              <div style={{ width: 160, height: 160, flexShrink: 0 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={72}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {pieData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 space-y-2 min-w-0">
                {pieData.map((d, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ background: d.color }}
                    />
                    <span
                      className="text-xs truncate flex-1"
                      style={{ color: 'var(--text-main)' }}
                    >
                      {d.name}
                    </span>
                    <span
                      className="text-xs font-bold shrink-0"
                      style={{ color: 'var(--text-dim)' }}
                    >
                      {d.value}h
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ritmo diário acumulado */}
          {paceData.length > 1 && (
            <div
              className="p-5 rounded-2xl border"
              style={{
                background: 'var(--bg-surface)',
                borderColor: 'var(--border)',
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <div
                  className="text-sm font-bold"
                  style={{ color: 'var(--text-main)' }}
                >
                  Ritmo da rodada
                </div>
                <div
                  className="text-[10px]"
                  style={{ color: 'var(--text-dim)' }}
                >
                  média {minutesToHuman(avgDailyMin)}/dia
                </div>
              </div>
              <div style={{ height: 160 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={paceData} margin={{ left: -20, right: 10 }}>
                    <defs>
                      <linearGradient
                        id="cycleAcum"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="var(--primary)"
                          stopOpacity={0.35}
                        />
                        <stop
                          offset="95%"
                          stopColor="var(--primary)"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="var(--border)"
                      opacity={0.4}
                    />
                    <XAxis
                      dataKey="date"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: 'var(--text-dim)', fontSize: 9 }}
                      interval={Math.max(0, Math.floor(paceData.length / 6))}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: 'var(--text-dim)', fontSize: 10 }}
                    />
                    <Tooltip
                      contentStyle={{
                        background: 'var(--bg-surface)',
                        border: '1px solid var(--border)',
                        borderRadius: 8,
                        fontSize: 12,
                      }}
                      formatter={(v, n) => [
                        n === 'acumulado' ? `${v}h` : `${v} min`,
                        n === 'acumulado' ? 'Acumulado' : 'No dia',
                      ]}
                    />
                    <Area
                      type="monotone"
                      dataKey="acumulado"
                      stroke="var(--primary)"
                      strokeWidth={2.5}
                      fill="url(#cycleAcum)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* barras real vs meta */}
          {barData.some(d => d.real > 0) && (
            <div
              className="p-5 rounded-2xl border"
              style={{
                background: 'var(--bg-surface)',
                borderColor: 'var(--border)',
              }}
            >
              <div
                className="text-sm font-bold mb-4"
                style={{ color: 'var(--text-main)' }}
              >
                Real vs Meta (horas)
              </div>
              <div style={{ height: Math.max(140, barData.length * 32) }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={barData}
                    layout="vertical"
                    margin={{ right: 10, left: 0 }}
                  >
                    <XAxis
                      type="number"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: 'var(--text-dim)', fontSize: 10 }}
                    />
                    <YAxis
                      dataKey="name"
                      type="category"
                      axisLine={false}
                      tickLine={false}
                      tick={{
                        fill: 'var(--text-dim)',
                        fontSize: 10,
                        fontWeight: 600,
                      }}
                      width={100}
                    />
                    <CartesianGrid
                      strokeDasharray="3 3"
                      horizontal={false}
                      stroke="var(--border)"
                      opacity={0.4}
                    />
                    <Tooltip
                      contentStyle={{
                        background: 'var(--bg-surface)',
                        border: '1px solid var(--border)',
                        borderRadius: 8,
                        fontSize: 12,
                      }}
                      formatter={(v, n) => [
                        `${v}h`,
                        n === 'meta' ? 'Meta' : 'Estudado',
                      ]}
                    />
                    <Bar
                      dataKey="meta"
                      name="meta"
                      fill="var(--bg-surface-2)"
                      radius={[0, 4, 4, 0]}
                      barSize={10}
                    />
                    <Bar
                      dataKey="real"
                      name="real"
                      radius={[0, 4, 4, 0]}
                      barSize={10}
                    >
                      {barData.map((d, i) => (
                        <Cell key={i} fill={d.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* acerto por matéria */}
          {enrichedItems.some(i => i.acc !== null) && (
            <div
              className="p-5 rounded-2xl border"
              style={{
                background: 'var(--bg-surface)',
                borderColor: 'var(--border)',
              }}
            >
              <div
                className="text-sm font-bold mb-4"
                style={{ color: 'var(--text-main)' }}
              >
                Acerto % por matéria
              </div>
              <div className="space-y-3">
                {enrichedItems
                  .filter(i => i.acc !== null)
                  .map(i => (
                    <div key={i.id}>
                      <div className="flex items-center justify-between mb-1">
                        <span
                          className="text-xs truncate"
                          style={{ color: 'var(--text-main)' }}
                        >
                          {i.subj?.name || i.subjectName}
                        </span>
                        <span
                          className="text-xs font-bold ml-2 shrink-0"
                          style={{
                            color:
                              i.acc >= 70
                                ? '#10B981'
                                : i.acc >= 50
                                  ? '#F59E0B'
                                  : '#EF4444',
                          }}
                        >
                          {i.acc}%
                        </span>
                      </div>
                      <div
                        className="h-1.5 rounded-full overflow-hidden"
                        style={{ background: 'var(--bg-surface-2)' }}
                      >
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${i.acc}%`,
                            background:
                              i.acc >= 70
                                ? '#10B981'
                                : i.acc >= 50
                                  ? '#F59E0B'
                                  : '#EF4444',
                          }}
                        />
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── MATÉRIAS TAB ───────────────────────────────────────────────── */}
      {tab === 'materias' && (
        <div className="space-y-3">
          {/* adicionar matéria disponível */}
          {(() => {
            const usedIds = new Set(enrichedItems.map(i => i.subjectId));
            const available = subjects.filter(s => !usedIds.has(s.id));
            if (!available.length) return null;
            return (
              <select
                defaultValue=""
                onChange={e => {
                  if (!e.target.value) return;
                  const s = subjects.find(x => x.id === e.target.value);
                  if (!s) return;
                  addItem(cycle.id, {
                    subjectId: s.id,
                    subjectName: s.name,
                    subjectColor: s.color,
                    horasPorRodada: 2,
                    minutosFeitos: 0,
                    completedThisRound: false,
                    ordem: cycle.items.length,
                  });
                  e.target.value = '';
                  toast.success(`${s.name} adicionada ao ciclo!`);
                }}
                className="w-full px-3 py-2.5 rounded-xl text-sm border outline-none"
                style={{
                  background: 'var(--bg-surface-2)',
                  borderColor: 'var(--border)',
                  color: 'var(--text-main)',
                }}
              >
                <option value="">+ Adicionar matéria ao ciclo</option>
                {available.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            );
          })()}
          {enrichedItems.map(item => (
            <div
              key={item.id}
              className="p-4 rounded-2xl border"
              style={{
                background: 'var(--bg-surface)',
                borderColor:
                  item.pct >= 100 ? `${item.color}55` : 'var(--border)',
              }}
            >
              <div className="flex items-center gap-3 mb-2">
                <div
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{
                    background: item.color,
                    opacity: item.pct >= 100 ? 1 : 0.6,
                  }}
                />
                <span
                  className="flex-1 text-sm font-bold truncate"
                  style={{ color: 'var(--text-main)' }}
                >
                  {item.subj?.name || item.subjectName}
                </span>
                {item.pct >= 100 && (
                  <span
                    className="text-xs font-bold"
                    style={{ color: '#10B981' }}
                  >
                    ✓ Concluída
                  </span>
                )}
                {item.acc !== null && (
                  <span
                    className="text-xs font-bold"
                    style={{
                      color:
                        item.acc >= 70
                          ? '#10B981'
                          : item.acc >= 50
                            ? '#F59E0B'
                            : '#EF4444',
                    }}
                  >
                    {item.acc}% acerto
                  </span>
                )}
              </div>

              {/* barra de progresso */}
              <div className="mb-3">
                <div
                  className="flex justify-between text-[10px] mb-1"
                  style={{ color: 'var(--text-dim)' }}
                >
                  <span>{minutesToHuman(item.realMin)} estudados</span>
                  <span>meta: {minutesToHuman(item.metaMin)}</span>
                </div>
                <div
                  className="h-1.5 rounded-full overflow-hidden"
                  style={{ background: 'var(--bg-surface-2)' }}
                >
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${item.pct}%`, background: item.color }}
                  />
                </div>
              </div>

              {/* controle de horas */}
              <div className="flex items-center gap-2">
                <span
                  className="text-[10px]"
                  style={{ color: 'var(--text-dim)' }}
                >
                  Meta da rodada:
                </span>
                <button
                  onClick={() =>
                    handleUpdateHoras(item.id, item.horasPorRodada - 0.5)
                  }
                  className="w-6 h-6 rounded border flex items-center justify-center text-xs"
                  style={{
                    borderColor: 'var(--border)',
                    color: 'var(--text-dim)',
                  }}
                >
                  −
                </button>
                <input
                  type="number"
                  min={0.5}
                  step={0.5}
                  value={item.horasPorRodada}
                  onChange={e => handleUpdateHoras(item.id, e.target.value)}
                  className="w-14 px-1 py-1 rounded-lg text-xs text-center border outline-none"
                  style={{
                    background: 'var(--bg-surface-2)',
                    borderColor: 'var(--border)',
                    color: 'var(--text-main)',
                  }}
                />
                <button
                  onClick={() =>
                    handleUpdateHoras(item.id, item.horasPorRodada + 0.5)
                  }
                  className="w-6 h-6 rounded border flex items-center justify-center text-xs"
                  style={{
                    borderColor: 'var(--border)',
                    color: 'var(--text-dim)',
                  }}
                >
                  +
                </button>
                <span
                  className="text-[10px]"
                  style={{ color: 'var(--text-dim)' }}
                >
                  h
                </span>
                <button
                  onClick={() => handleRemoveItem(item.id)}
                  className="ml-auto w-7 h-7 flex items-center justify-center rounded-lg text-xs hover:bg-red-500/20"
                  style={{ color: 'var(--text-dim)' }}
                >
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
