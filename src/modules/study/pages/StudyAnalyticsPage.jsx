import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSessionStore } from '../../../stores/useSessionStore';
import { useRevisionStore } from '../../../stores/useRevisionStore';
import { useStudyStore } from '../../../stores/useStudyStore';
import { StudyLayout } from '../components/StudyLayout';
import { AnimatePresence } from 'framer-motion';
import { formatMinutes } from '../../../shared/utils/time';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, Legend,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts';

function today() { return new Date().toISOString().slice(0, 10); }

function getLastNDays(n) {
  const dates = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    dates.push(d.toISOString().slice(0, 10));
  }
  return dates;
}

function fmtShortDate(d) {
  if (!d) return '';
  const [, m, day] = d.split('-');
  return `${day}/${m}`;
}

function detectPlato(timeline, windowDays = 14, threshold = 3) {
  if (timeline.length < 3) return null;
  const recent = timeline.slice(-windowDays);
  if (recent.length < 3) return null;
  const first = recent[0]?.accuracy ?? 0;
  const last = recent[recent.length - 1]?.accuracy ?? 0;
  if (Math.abs(last - first) < threshold)
    return { detected: true, value: Math.round((first + last) / 2), days: recent.length };
  return null;
}

function detectBlockPractice(sessions, windowSize = 5) {
  if (sessions.length < windowSize) return null;
  const recent = [...sessions].sort((a, b) => (b.finishedAt || 0) - (a.finishedAt || 0)).slice(0, windowSize);
  const subjects = recent.map(s => s.subjectId).filter(Boolean);
  if (new Set(subjects).size === 1 && subjects.length >= windowSize)
    return { detected: true, subjectId: subjects[0] };
  return null;
}

const CustomTooltip = ({ active, payload, label, suffix = '' }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="px-3 py-2 rounded-lg shadow-xl text-xs" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-main)' }}>
      <div className="font-bold mb-1" style={{ color: 'var(--text-dim)' }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color }}>{p.name}: <strong>{p.value}{suffix}</strong></div>
      ))}
    </div>
  );
};

function SectionTitle({ children, sub }) {
  return (
    <div className="mb-4">
      <h2 className="text-base font-bold" style={{ color: 'var(--text-main)' }}>{children}</h2>
      {sub && <p className="text-xs mt-0.5" style={{ color: 'var(--text-dim)' }}>{sub}</p>}
    </div>
  );
}

function AlertBanner({ type, children, onAction, actionLabel }) {
  const styles = {
    danger:  { bg: '#EF444412', border: '#EF444430', color: '#EF4444', icon: '🔴' },
    warning: { bg: '#F59E0B12', border: '#F59E0B30', color: '#F59E0B', icon: '🟡' },
    info:    { bg: '#3B82F612', border: '#3B82F630', color: '#3B82F6', icon: '🔵' },
    method:  { bg: '#8B5CF612', border: '#8B5CF630', color: '#8B5CF6', icon: '🟣' },
  };
  const s = styles[type] || styles.info;
  return (
    <div className="flex items-start gap-3 p-4 rounded-xl backdrop-blur-md"
      style={{ background: s.bg, border: `1px solid ${s.border}` }}>
      <span className="text-base shrink-0 mt-0.5">{s.icon}</span>
      <div className="flex-1 text-xs" style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>{children}</div>
      {onAction && (
        <button onClick={onAction}
          className="px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 backdrop-blur-sm"
          style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>
          {actionLabel}
        </button>
      )}
    </div>
  );
}

const HEAT_COLORS = ['var(--bg-surface-2)', 'rgba(139,92,246,.3)', 'rgba(139,92,246,.55)', 'rgba(139,92,246,.8)', 'rgba(139,92,246,1)'];
const SUBJECT_COLORS = ['#8B5CF6', '#10B981', '#F59E0B', '#3B82F6', '#EC4899', '#06B6D4'];
const PERIODS = [{ label: '7d', value: 7 }, { label: '14d', value: 14 }, { label: '30d', value: 30 }, { label: 'Total', value: 0 }];

export default function StudyAnalyticsPage() {
  const navigate = useNavigate();
  const sessions = useSessionStore(s => s.sessions);
  const getHeatmapData = useSessionStore(s => s.getHeatmapData);
  const revisions = useRevisionStore(s => s.revisions);
  const getHealthSummary = useRevisionStore(s => s.getHealthSummary);
  const getUpcomingByDay = useRevisionStore(s => s.getUpcomingByDay);
  const subjects = useStudyStore(s => s.subjects);

  const [period, setPeriod] = useState(30);
  const [selectedSubject, setSubj] = useState('');

  const filteredSessions = useMemo(() => {
    if (period === 0) return sessions;
    const from = new Date(); from.setDate(from.getDate() - period);
    return sessions.filter(s => s.date >= from.toISOString().slice(0, 10));
  }, [sessions, period]);

  const heatmapData = useMemo(() => {
    const raw = getHeatmapData();
    return getLastNDays(84).map(date => ({
      date, mins: raw[date] || 0,
      intensity: raw[date] > 120 ? 4 : raw[date] > 60 ? 3 : raw[date] > 20 ? 2 : raw[date] > 0 ? 1 : 0,
    }));
  }, [sessions]);

  const accuracyBySubject = useMemo(() => {
    const map = {};
    filteredSessions
      .filter(s => (s.studyType === 'questoes' || s.modes?.includes('questoes')) && (!selectedSubject || s.subjectId === selectedSubject))
      .forEach(s => {
        if (!s.subjectId || !s.date) return;
        if (!map[s.date]) map[s.date] = {};
        if (!map[s.date][s.subjectId]) map[s.date][s.subjectId] = { q: 0, c: 0 };
        map[s.date][s.subjectId].q += s.questionsAnswered || 0;
        map[s.date][s.subjectId].c += s.questionsCorrect || 0;
      });
    const ids = selectedSubject ? [selectedSubject] : [...new Set(filteredSessions.map(s => s.subjectId).filter(Boolean))].slice(0, 4);
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b)).map(([date, bySubj]) => {
      const row = { date: fmtShortDate(date) };
      ids.forEach(id => { const d = bySubj[id]; row[id] = d && d.q > 0 ? Math.round((d.c / d.q) * 100) : null; });
      return row;
    });
  }, [filteredSessions, selectedSubject]);

  const globalAccuracyTimeline = useMemo(() => {
    const map = {};
    filteredSessions
      .filter(s => (s.studyType === 'questoes' || s.modes?.includes('questoes')) && (!selectedSubject || s.subjectId === selectedSubject))
      .forEach(s => {
        if (!s.date) return;
        if (!map[s.date]) map[s.date] = { q: 0, c: 0 };
        map[s.date].q += s.questionsAnswered || 0;
        map[s.date].c += s.questionsCorrect || 0;
      });
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b))
      .map(([date, d]) => ({ date: fmtShortDate(date), accuracy: d.q > 0 ? Math.round((d.c / d.q) * 100) : null }))
      .filter(d => d.accuracy !== null);
  }, [filteredSessions, selectedSubject]);

  const platoAlert = detectPlato(globalAccuracyTimeline);
  const blockAlert = detectBlockPractice(filteredSessions);
  const blockSubject = blockAlert ? subjects.find(s => s.id === blockAlert.subjectId) : null;
  const revHealth = getHealthSummary();
  const upcomingByDay = getUpcomingByDay(14);

  const falseFluentCount = useMemo(() => {
    const bySubtopic = {};
    filteredSessions.forEach(s => {
      if (!s.subtopicId) return;
      if (!bySubtopic[s.subtopicId]) bySubtopic[s.subtopicId] = { revisions: 0, questions: 0 };
      if (s.studyType === 'revisao' || s.modes?.includes('revisao')) bySubtopic[s.subtopicId].revisions++;
      if (s.studyType === 'questoes' || s.modes?.includes('questoes')) bySubtopic[s.subtopicId].questions++;
    });
    return Object.values(bySubtopic).filter(v => v.revisions >= 3 && v.questions === 0).length;
  }, [filteredSessions]);

  const minsBySubject = useMemo(() => {
    const map = {};
    filteredSessions.forEach(s => { if (s.subjectId) map[s.subjectId] = (map[s.subjectId] || 0) + (s.totalMinutes || 0); });
    return Object.entries(map).map(([id, mins]) => ({
      id, name: subjects.find(s => s.id === id)?.name || '—', mins,
      color: subjects.find(s => s.id === id)?.color || '#8B5CF6',
    })).sort((a, b) => b.mins - a.mins).slice(0, 6);
  }, [filteredSessions, subjects]);

  const totalMins = filteredSessions.reduce((a, s) => a + (s.totalMinutes || 0), 0);
  const totalQ = filteredSessions.reduce((a, s) => a + (s.questionsAnswered || 0), 0);
  const totalC = filteredSessions.reduce((a, s) => a + (s.questionsCorrect || 0), 0);
  const globalAcc = totalQ > 0 ? Math.round((totalC / totalQ) * 100) : null;
  const streak = useSessionStore(s => s.getStreak)();

  const mixedPct = useMemo(() => {
    const days = {};
    filteredSessions.forEach(s => { if (!s.date || !s.subjectId) return; if (!days[s.date]) days[s.date] = new Set(); days[s.date].add(s.subjectId); });
    const dayArr = Object.values(days);
    if (!dayArr.length) return null;
    return Math.round((dayArr.filter(d => d.size > 1).length / dayArr.length) * 100);
  }, [filteredSessions]);

  const subjectsForFilter = subjects.filter(s => filteredSessions.some(ss => ss.subjectId === s.id));

  const hasAlerts = platoAlert?.detected || blockAlert?.detected || falseFluentCount > 0 || (mixedPct !== null && mixedPct < 30);

  return (
    <StudyLayout>
      <div className="flex flex-col max-h-[calc(100vh-80px)] overflow-y-auto custom-scrollbar pr-1 pb-10 space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight" style={{ color: 'var(--text-main)' }}>Analytics</h1>
            <p className="text-sm mt-1" style={{ color: 'var(--text-dim)' }}>Diagnóstico completo da sua preparação.</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <div className="flex gap-1 p-1 rounded-xl backdrop-blur-md bg-white/[0.04] border border-white/[0.08]">
              {PERIODS.map(p => (
                <button key={p.value} onClick={() => setPeriod(p.value)}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                  style={{ background: period === p.value ? 'var(--primary)' : 'transparent', color: period === p.value ? 'white' : 'var(--text-muted)' }}>
                  {p.label}
                </button>
              ))}
            </div>
            {subjectsForFilter.length > 1 && (
              <select value={selectedSubject} onChange={e => setSubj(e.target.value)}
                className="px-3 py-1.5 rounded-xl text-xs font-medium border outline-none backdrop-blur-md"
                style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)', color: 'var(--text-main)' }}>
                <option value="">Todas as matérias</option>
                {subjectsForFilter.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            )}
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Tempo', value: formatMinutes(totalMins), icon: '⏱', accent: null },
            { label: 'Streak', value: `${streak}d`, icon: '🔥', accent: streak >= 7 ? '#F59E0B' : streak > 0 ? '#10B981' : undefined },
            { label: 'Questões', value: totalQ, icon: '🎯', accent: 'var(--secondary)' },
            { label: 'Acerto', value: globalAcc !== null ? `${globalAcc}%` : '—', icon: '📊', accent: globalAcc !== null ? (globalAcc >= 70 ? '#10B981' : globalAcc >= 50 ? '#F59E0B' : '#EF4444') : undefined },
          ].map(kpi => (
            <div key={kpi.label} className="p-4 rounded-2xl border flex flex-col gap-1" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-dim)' }}>{kpi.label}</span>
                <span>{kpi.icon}</span>
              </div>
              <div className="text-2xl font-black" style={{ color: kpi.accent || 'var(--text-main)' }}>{kpi.value}</div>
            </div>
          ))}
        </div>

        {/* Alerts */}
        {hasAlerts && (
          <div className="space-y-3">
            <SectionTitle sub={`${[platoAlert, blockAlert, falseFluentCount > 0, mixedPct < 30].filter(Boolean).length} alerta(s) ativo(s)`}>Diagnóstico — alertas ativos</SectionTitle>
            {platoAlert?.detected && (
              <AlertBanner type="danger">
                <strong>Platô detectado em {platoAlert.value}% nos últimos {platoAlert.days} dias.</strong> Seu acerto está estagnado. Ataque os gaps, foque em questões difíceis e use MPA.
              </AlertBanner>
            )}
            {blockAlert?.detected && blockSubject && (
              <AlertBanner type="warning" onAction={() => navigate('/study/today')} actionLabel="Ver ciclo">
                <strong>Prática em bloco detectada.</strong> Últimas 5 sessões: <strong>{blockSubject.name}</strong>. Prática mesclada = 2× retenção (Rohrer).
              </AlertBanner>
            )}
            {falseFluentCount > 0 && (
              <AlertBanner type="warning">
                <strong>Reconhecer ≠ Lembrar:</strong> {falseFluentCount} aula(s) com 3+ revisões mas zero questões. Teste-se ativamente.
              </AlertBanner>
            )}
            {mixedPct !== null && mixedPct < 30 && !blockAlert?.detected && (
              <AlertBanner type="method">
                <strong>Prática mesclada em {mixedPct}%.</strong> Alterne disciplinas dentro do mesmo dia para maximizar a transferência.
              </AlertBanner>
            )}
          </div>
        )}

        {/* Heatmap */}
        <div className="p-5 rounded-2xl border" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
          <SectionTitle sub="A constância supera a intensidade">Consistência diária (84 dias)</SectionTitle>
          <div className="flex items-center gap-2 text-[10px] mb-4" style={{ color: 'var(--text-dim)' }}>
            <span>Menos</span>
            {[1, 2, 3, 4].map(i => <div key={i} className="w-3 h-3 rounded-sm" style={{ background: HEAT_COLORS[i] }} />)}
            <span>Mais</span>
          </div>
          <div className="grid gap-1" style={{ gridTemplateColumns: 'repeat(12,1fr)' }}>
            {Array.from({ length: 12 }).map((_, week) => (
              <div key={week} className="flex flex-col gap-1">
                {heatmapData.slice(week * 7, week * 7 + 7).map((day, i) => (
                  <div key={i} className="w-full aspect-square rounded-sm transition-transform hover:scale-125 cursor-default"
                    style={{ background: HEAT_COLORS[day.intensity], border: day.intensity === 0 ? '1px solid rgba(255,255,255,0.08)' : 'none' }}
                    title={`${day.date} — ${formatMinutes(day.mins)}`} />
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Accuracy Timeline */}
        <div className="p-5 rounded-2xl border" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
          <SectionTitle sub="Ref: 70% platô, 85% meta">Evolução de acertos %</SectionTitle>
          {globalAccuracyTimeline.length < 2 ? (
            <div className="flex items-center justify-center h-48 text-sm italic" style={{ color: 'var(--text-dim)' }}>
              Resolva questões em pelo menos 2 dias para gerar o gráfico.
            </div>
          ) : (
            <div style={{ height: 240 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={globalAccuracyTimeline} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradAccuracy" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-dim)', fontSize: 10, fontWeight: 600 }} dy={8} />
                  <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fill: 'var(--text-dim)', fontSize: 10 }} />
                  <ReferenceLine y={70} stroke="#F59E0B" strokeDasharray="4 4" strokeWidth={1.5} label={{ value: '70%', fill: '#F59E0B', fontSize: 10, position: 'right' }} />
                  <ReferenceLine y={85} stroke="#10B981" strokeDasharray="4 4" strokeWidth={1.5} label={{ value: '85%', fill: '#10B981', fontSize: 10, position: 'right' }} />
                  <Tooltip content={<CustomTooltip suffix="%" />} />
                  <Area type="monotone" dataKey="accuracy" name="Acerto" stroke="var(--primary)" strokeWidth={2.5} fillOpacity={1} fill="url(#gradAccuracy)" dot={{ fill: 'var(--primary)', r: 3 }} activeDot={{ r: 5 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Per-subject accuracy */}
        {!selectedSubject && accuracyBySubject.length > 1 && (
          <div className="p-5 rounded-2xl border" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
            <SectionTitle sub="Selecione uma matéria no filtro para isolar">Acerto por matéria</SectionTitle>
            <div style={{ height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={accuracyBySubject} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-dim)', fontSize: 10 }} />
                  <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fill: 'var(--text-dim)', fontSize: 10 }} />
                  <ReferenceLine y={70} stroke="#F59E0B" strokeDasharray="4 4" strokeWidth={1} />
                  <Tooltip content={<CustomTooltip suffix="%" />} />
                  <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} formatter={value => subjects.find(s => s.id === value)?.name || value} />
                  {subjects.filter(s => accuracyBySubject.some(r => r[s.id] !== undefined)).slice(0, 4).map((s, i) => (
                    <Line key={s.id} type="monotone" dataKey={s.id} name={s.name || s.id} stroke={s.color || SUBJECT_COLORS[i]} strokeWidth={2} dot={false} connectNulls />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Revision health */}
        <div className="p-5 rounded-2xl border" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
          <SectionTitle sub="Carga dos próximos 14 dias">Painel de revisões</SectionTitle>
          <div className="grid grid-cols-3 gap-3 mb-5">
            {[
              { label: 'Atrasadas', value: revHealth.overdue, color: revHealth.overdue > 0 ? '#EF4444' : '#10B981', bg: revHealth.overdue > 0 ? '#EF444412' : '#10B98112' },
              { label: 'Hoje', value: revHealth.today, color: '#F59E0B', bg: '#F59E0B12' },
              { label: 'Próximas', value: revHealth.upcoming, color: 'var(--text-dim)', bg: 'rgba(255,255,255,0.04)' },
            ].map(k => (
              <div key={k.label} className="p-3 rounded-xl text-center backdrop-blur-md border border-white/[0.08]" style={{ background: k.bg }}>
                <div className="text-2xl font-black" style={{ color: k.color }}>{k.value}</div>
                <div className="text-[9px] font-bold uppercase tracking-widest mt-1" style={{ color: 'var(--text-dim)' }}>{k.label}</div>
              </div>
            ))}
          </div>
          {upcomingByDay.some(d => d.count > 0) ? (
            <div style={{ height: 140 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={upcomingByDay} margin={{ top: 0, right: 0, left: -30, bottom: 0 }}>
                  <XAxis dataKey="date" tickFormatter={fmtShortDate} axisLine={false} tickLine={false} tick={{ fill: 'var(--text-dim)', fontSize: 9 }} />
                  <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: 'var(--text-dim)', fontSize: 9 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" name="Revisões" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex items-center justify-center h-20 text-sm italic" style={{ color: 'var(--text-dim)' }}>Nenhuma revisão agendada.</div>
          )}
        </div>

        {/* Focus per discipline */}
        {minsBySubject.length > 0 && (
          <div className="p-5 rounded-2xl border" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
            <SectionTitle sub="Distribuição do tempo no período">Foco por disciplina</SectionTitle>
            <div className="space-y-3">
              {minsBySubject.map(s => {
                const pct = Math.round((s.mins / minsBySubject[0].mins) * 100);
                return (
                  <div key={s.id}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium truncate" style={{ color: 'var(--text-main)' }}>{s.name}</span>
                      <span className="text-xs font-bold ml-2 shrink-0" style={{ color: 'var(--text-dim)' }}>{formatMinutes(s.mins)}</span>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: s.color }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Mixed practice */}
        {mixedPct !== null && (
          <div className="p-5 rounded-2xl border" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
            <SectionTitle sub="Meta: acima de 50%">Prática mesclada vs. em bloco</SectionTitle>
            <div className="flex items-center gap-4">
              <div className="flex-1 h-4 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                <div className="h-full rounded-full transition-all duration-500" style={{ width: `${mixedPct}%`, background: mixedPct >= 50 ? '#10B981' : '#F59E0B' }} />
              </div>
              <div className="text-2xl font-black shrink-0" style={{ color: mixedPct >= 50 ? '#10B981' : '#F59E0B' }}>{mixedPct}%</div>
            </div>
            <div className="text-xs mt-2" style={{ color: 'var(--text-dim)' }}>
              {mixedPct >= 50
                ? 'Prática mesclada acima de 50% — maximiza transferência do aprendizado.'
                : 'Abaixo de 50%. Alterne matérias dentro do mesmo dia — 2× mais retenção.'}
            </div>
          </div>
        )}
      </div>
    </StudyLayout>
  );
}
