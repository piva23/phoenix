import { useState, useMemo } from 'react';
import { useSessionStore } from '../../../stores/useSessionStore';
import { useStudyStore } from '../../../stores/useStudyStore';
import { StudyLayout } from '../components/StudyLayout';
import { BentoCard, SectionHeader, ProgressRing, Badge } from '../components/BentoCard';
import { motion, AnimatePresence } from 'framer-motion';
import { formatMinutes } from '../../../shared/utils/time';
import clsx from 'clsx';

const today = () => new Date().toISOString().slice(0, 10);
const getLastNDays = (n) => {
  const dates = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    dates.push(d.toISOString().slice(0, 10));
  }
  return dates;
};
const fmtDate = (d) => { if (!d) return ''; const [, m, day] = d.split('-'); return `${day}/${m}`; };
const fmtDateTime = (ts) => { if (!ts) return ''; return new Date(ts).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }); };

const MODE_LABELS = {
  leitura: { label: 'Leitura', icon: '📖', color: '#3B82F6' },
  video: { label: 'Videoaula', icon: '▶️', color: '#8B5CF6' },
  questoes: { label: 'Questões', icon: '🎯', color: '#10B981' },
  revisao: { label: 'Revisão', icon: '🔄', color: '#06B6D4' },
  mapa: { label: 'Mapa Mental', icon: '🗺️', color: '#14B8A6' },
};
const getModeLabel = (s) => (s.modes || (s.studyType ? [s.studyType] : ['leitura'])).map(m => MODE_LABELS[m]?.icon || '📖').join('');
const getModeColor = (s) => MODE_LABELS[s.modes?.[0] || s.studyType || 'leitura']?.color || '#3B82F6';

const PERIOD_OPTIONS = [
  { label: '7 dias', value: 7 },
  { label: '14 dias', value: 14 },
  { label: '30 dias', value: 30 },
  { label: 'Total', value: 0 },
];

const METH_FIELDS = [
  { key: 'connection', label: '🧠 Conexão (Ordem Superior)', color: '#8B5CF6' },
];

function EmptyState({ icon, title, description }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center gap-3 py-16 rounded-2xl"
      style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.08)' }}
    >
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
        style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.1), rgba(16,185,129,0.1))', border: '1px solid rgba(59,130,246,0.15)' }}>
        {icon}
      </div>
      <div className="text-sm font-medium text-zinc-400">{title}</div>
      <div className="text-xs text-zinc-600 max-w-xs text-center">{description}</div>
    </motion.div>
  );
}

function SessionDetailModal({ session, subject, onClose }) {
  if (!session) return null;
  const acc = session.questionsAnswered > 0 ? Math.round((session.questionsCorrect / session.questionsAnswered) * 100) : null;
  const modes = session.modes || (session.studyType ? [session.studyType] : []);
  const accent = subject?.color || '#3B82F6';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(12px)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md rounded-2xl overflow-hidden"
        style={{ background: 'rgba(15,18,30,0.95)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(40px)' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ background: accent }} />
            <span className="font-bold text-sm text-zinc-100">{subject?.name || 'Sessão'}</span>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-full flex items-center justify-center text-lg hover:bg-white/10 text-zinc-400">×</button>
        </div>

        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar">
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Tempo', value: formatMinutes(session.totalMinutes), color: '#e2e8f0' },
              { label: 'XP', value: `+${session.xpEarned || 0}`, color: '#10B981' },
              { label: 'Acerto', value: acc !== null ? `${acc}%` : '—', color: acc !== null ? (acc >= 70 ? '#10B981' : '#F59E0B') : '#52525b' },
            ].map(s => (
              <div key={s.label} className="p-3 rounded-xl text-center" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="text-lg font-black" style={{ color: s.color }}>{s.value}</div>
                <div className="text-[10px] lg:text-[9px] uppercase tracking-widest text-zinc-500">{s.label}</div>
              </div>
            ))}
          </div>

          {modes.length > 0 && (
            <div>
              <div className="text-[10px] font-bold uppercase tracking-widest mb-2 text-zinc-500">Métodos usados</div>
              <div className="flex flex-wrap gap-2">
                {modes.map(m => {
                  const info = MODE_LABELS[m];
                  return info ? (
                    <span key={m} className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold" style={{ background: `${info.color}18`, color: info.color, border: `1px solid ${info.color}33` }}>
                      {info.icon} {info.label}
                    </span>
                  ) : null;
                })}
              </div>
            </div>
          )}

          {session.questionsAnswered > 0 && (
            <div className="p-3 rounded-xl" style={{ background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.15)' }}>
              <div className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: '#10B981' }}>Questões</div>
              <div className="text-sm text-zinc-200">{session.questionsCorrect}/{session.questionsAnswered} acertos ({acc}%)</div>
            </div>
          )}

          {(session.difficulty || session.focus || session.energy) && (
            <div className="grid grid-cols-3 gap-2">
              {[
                session.difficulty && { label: 'Dificuldade', value: session.difficulty, color: session.difficulty >= 4 ? '#EF4444' : session.difficulty >= 3 ? '#F59E0B' : '#10B981' },
                session.focus && { label: 'Foco', value: session.focus, color: session.focus >= 4 ? '#10B981' : session.focus >= 3 ? '#F59E0B' : '#EF4444' },
                session.energy && { label: 'Energia', value: session.energy, color: session.energy >= 4 ? '#10B981' : session.energy >= 3 ? '#F59E0B' : '#EF4444' },
              ].filter(Boolean).map(r => (
                <div key={r.label} className="p-2.5 rounded-xl text-center" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="text-[10px] lg:text-[9px] uppercase tracking-widest text-zinc-500">{r.label}</div>
                  <div className="text-sm font-black mt-0.5" style={{ color: r.color }}>
                    {'★'.repeat(r.value)}{'☆'.repeat(5 - r.value)}
                  </div>
                </div>
              ))}
            </div>
          )}

          {session.notes && (
            <div className="p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="text-[10px] font-bold uppercase tracking-widest mb-1 text-zinc-500">📝 Notas</div>
              <div className="text-sm whitespace-pre-wrap text-zinc-200" style={{ lineHeight: 1.6 }}>{session.notes}</div>
            </div>
          )}

          {METH_FIELDS.filter(f => session[f.key]).map(f => (
            <div key={f.key} className="p-3 rounded-xl" style={{ background: `${f.color}08`, border: `1px solid ${f.color}33` }}>
              <div className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: f.color }}>{f.label}</div>
              <div className="text-sm text-zinc-200" style={{ lineHeight: 1.6 }}>{session[f.key]}</div>
            </div>
          ))}

          <div className="text-[10px] text-center text-zinc-600">
            {fmtDate(session.date)} às {fmtDateTime(session.finishedAt)}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function StudySessionPage() {
  const sessions = useSessionStore(s => s.sessions);
  const getStreak = useSessionStore(s => s.getStreak);
  const subjects = useStudyStore(s => s.subjects);

  const [period, setPeriod] = useState(7);
  const [filterSubject, setFilterSubject] = useState('');
  const [filterMode, setFilterMode] = useState('');
  const [selectedSession, setSelected] = useState(null);

  const todayStr = today();

  const filtered = useMemo(() => {
    let list = [...sessions].sort((a, b) => (b.finishedAt || 0) - (a.finishedAt || 0));
    if (period > 0) {
      const from = new Date(); from.setDate(from.getDate() - period);
      const fromStr = from.toISOString().slice(0, 10);
      list = list.filter(s => s.date >= fromStr);
    }
    if (filterSubject) list = list.filter(s => s.subjectId === filterSubject);
    if (filterMode) list = list.filter(s => (s.modes || [s.studyType]).includes(filterMode));
    return list;
  }, [sessions, period, filterSubject, filterMode]);

  const stats = useMemo(() => {
    const totalMins = filtered.reduce((a, s) => a + (s.totalMinutes || 0), 0);
    const totalQ = filtered.reduce((a, s) => a + (s.questionsAnswered || 0), 0);
    const totalC = filtered.reduce((a, s) => a + (s.questionsCorrect || 0), 0);
    const daysWithStu = new Set(filtered.map(s => s.date)).size;
    const avgDaily = daysWithStu > 0 ? Math.round(totalMins / daysWithStu) : 0;
    const accuracy = totalQ > 0 ? Math.round((totalC / totalQ) * 100) : null;
    const days = period > 0 ? getLastNDays(period) : getLastNDays(30);
    const byDay = {};
    filtered.forEach(s => { byDay[s.date] = (byDay[s.date] || 0) + (s.totalMinutes || 0); });
    const barData = days.map(d => ({ date: d, mins: byDay[d] || 0 }));
    return { totalMins, totalQ, totalC, accuracy, daysWithStu, avgDaily, barData };
  }, [filtered, period]);

  const streak = getStreak();

  const byDate = useMemo(() => {
    const map = {};
    filtered.forEach(s => { if (!map[s.date]) map[s.date] = []; map[s.date].push(s); });
    return Object.entries(map).sort(([a], [b]) => b.localeCompare(a));
  }, [filtered]);

  const subjectOptions = subjects.filter(s => sessions.some(ss => ss.subjectId === s.id));
  const modeOptions = Object.entries(MODE_LABELS);
  const selectedSubject = selectedSession ? subjects.find(s => s.id === selectedSession.subjectId) : null;

  return (
    <StudyLayout>
      <div className="flex flex-col max-h-[calc(100vh-80px)] overflow-y-auto custom-scrollbar pr-1 pb-10 space-y-5">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-zinc-100">Histórico de Sessões</h1>
          <p className="text-sm mt-1 text-zinc-500">Cada sessão registrada é residuo cognitivo acumulado.</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <BentoCard className="text-center">
            <ProgressRing value={Math.min((stats.totalMins / (stats.daysWithStu * 60 || 1)) * 100, 100)} size={48} stroke={5} color="#3B82F6" />
            <div className="text-xl font-black mt-2 text-zinc-100">{formatMinutes(stats.totalMins)}</div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Tempo total</div>
            <div className="text-[10px] text-zinc-600">{stats.daysWithStu} dias ativos</div>
          </BentoCard>
          <BentoCard className="text-center">
            <div className="text-3xl font-black" style={{ color: streak >= 7 ? '#10B981' : streak > 0 ? '#06B6D4' : '#52525b' }}>{streak}d</div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mt-1">🔥 Streak</div>
            <div className="text-[10px] text-zinc-600">dias consecutivos</div>
          </BentoCard>
          <BentoCard className="text-center">
            <div className="text-xl font-black text-zinc-100">{formatMinutes(stats.avgDaily)}</div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mt-1">📊 Média diária</div>
            <div className="text-[10px] text-zinc-600">no período</div>
          </BentoCard>
          <BentoCard className="text-center">
            <ProgressRing value={stats.accuracy || 0} size={48} stroke={5} color={stats.accuracy !== null ? (stats.accuracy >= 70 ? '#10B981' : '#F59E0B') : '#52525b'} />
            <div className="text-xl font-black mt-2" style={{ color: stats.accuracy !== null ? (stats.accuracy >= 70 ? '#10B981' : '#F59E0B') : '#52525b' }}>{stats.accuracy !== null ? `${stats.accuracy}%` : '—'}</div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">🎯 Acerto geral</div>
            <div className="text-[10px] text-zinc-600">{stats.totalQ} questões</div>
          </BentoCard>
        </div>

        {stats.barData.length > 0 && (
          <BentoCard>
            <SectionHeader title={`Atividade — ${period > 0 ? `últimos ${period} dias` : 'total (30d)'}`} icon="📊" />
            <div className="flex items-end gap-0.5 h-10">
              {stats.barData.map((d, i) => {
                const max = Math.max(...stats.barData.map(x => x.mins), 1);
                const pct = (d.mins / max) * 100;
                const isToday = d.date === todayStr;
                return (
                  <div key={i} className="flex-1 flex flex-col justify-end" style={{ height: '100%' }}>
                    <div className="w-full rounded-sm transition-all duration-300"
                      style={{
                        height: `${Math.max(pct, d.mins > 0 ? 6 : 2)}%`,
                        background: isToday ? '#10B981' : d.mins > 0 ? '#3B82F6' : 'rgba(255,255,255,0.05)',
                        opacity: d.mins > 0 ? 1 : 0.3,
                        minHeight: d.mins > 0 ? 3 : 1,
                      }}
                      title={`${fmtDate(d.date)} — ${formatMinutes(d.mins)}`}
                    />
                  </div>
                );
              })}
            </div>
          </BentoCard>
        )}

        <div className="flex flex-wrap gap-2 items-center">
          <div className="flex gap-1 p-1 rounded-2xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(20px)' }}>
            {PERIOD_OPTIONS.map(p => (
              <button key={p.value} onClick={() => setPeriod(p.value)}
                className={clsx('px-3 py-1.5 rounded-xl text-xs font-bold transition-all', period === p.value ? 'text-white' : 'text-zinc-500 hover:text-zinc-300')}>
                {period === p.value && <motion.div layoutId="period-pill" className="absolute inset-0 rounded-xl" style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.3), rgba(16,185,129,0.2))', border: '1px solid rgba(59,130,246,0.3)' }} transition={{ type: 'spring', stiffness: 400, damping: 30 }} />}
                <span className="relative z-10">{p.label}</span>
              </button>
            ))}
          </div>

          {subjectOptions.length > 0 && (
            <select value={filterSubject} onChange={e => setFilterSubject(e.target.value)} className="px-3 py-1.5 rounded-xl text-xs font-medium border outline-none" style={{ background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)', color: '#e2e8f0' }}>
              <option value="">Todas as matérias</option>
              {subjectOptions.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          )}

          <select value={filterMode} onChange={e => setFilterMode(e.target.value)} className="px-3 py-1.5 rounded-xl text-xs font-medium border outline-none" style={{ background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)', color: '#e2e8f0' }}>
            <option value="">Todos os modos</option>
            {modeOptions.map(([id, info]) => <option key={id} value={id}>{info.icon} {info.label}</option>)}
          </select>

          {(filterSubject || filterMode) && (
            <button onClick={() => { setFilterSubject(''); setFilterMode(''); }}
              className="px-3 py-1.5 rounded-xl text-xs font-bold border transition-all hover:bg-white/5"
              style={{ borderColor: 'rgba(255,255,255,0.1)', color: '#94a3b8' }}>
              × Limpar
            </button>
          )}
        </div>

        <SectionHeader title={`${filtered.length} sessão${filtered.length !== 1 ? 'ões' : ''} encontrada${filtered.length !== 1 ? 's' : ''}`} />

        <AnimatePresence mode="wait">
          {byDate.length === 0 ? (
            <EmptyState icon="📚" title="Nenhuma sessão neste período" description='Use o botão "▶ Nova sessão" para começar.' />
          ) : (
            <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-5">
              {byDate.map(([date, daySessions]) => {
                const dayTotal = daySessions.reduce((a, s) => a + (s.totalMinutes || 0), 0);
                const isToday = date === todayStr;
                const dateLabel = isToday ? 'Hoje' : new Date(date + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' });

                return (
                  <div key={date}>
                    <div className="flex items-center gap-3 mb-3">
                      <div className={clsx('text-xs font-bold', isToday ? 'text-emerald-400' : 'text-zinc-500')}>{dateLabel}</div>
                      <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
                      <div className="text-xs font-medium text-zinc-500">{formatMinutes(dayTotal)}</div>
                    </div>

                    <div className="space-y-2">
                      {daySessions.map(s => {
                        const subj = subjects.find(x => x.id === s.subjectId);
                        const accent = subj?.color || '#3B82F6';
                        const modes = getModeLabel(s);
                        const acc = s.questionsAnswered > 0 ? Math.round((s.questionsCorrect / s.questionsAnswered) * 100) : null;
                        const methodBadges = [
                          s.connection && { icon: '🧠', color: '#8B5CF6' },
                        ].filter(Boolean);

                        return (
                          <motion.button
                            key={s.id}
                            layout
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            whileHover={{ scale: 1.005 }}
                            onClick={() => setSelected(s)}
                            className="w-full flex items-center gap-3 p-3.5 rounded-xl text-left transition-all hover:border-white/[0.15]"
                            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(20px)' }}
                          >
                            <div className="w-2 h-10 rounded-full shrink-0" style={{ background: accent }} />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: accent }}>{subj?.name || '—'}</span>
                                <span className="text-[10px] text-zinc-500">{modes}</span>
                                {methodBadges.map((b, i) => <span key={i} className="text-[11px]" title={b.icon} style={{ opacity: 0.8 }}>{b.icon}</span>)}
                              </div>
                              <div className="text-sm font-medium truncate mt-0.5 text-zinc-200">
                                {s.totalMinutes} min{s.questionsAnswered > 0 && ` · ${s.questionsAnswered} questões`}
                              </div>
                            </div>
                            <div className="flex flex-col items-end shrink-0 gap-1">
                              {acc !== null && <div className="text-sm font-black" style={{ color: acc >= 70 ? '#10B981' : '#F59E0B' }}>{acc}%</div>}
                              {s.xpEarned && <div className="text-[10px] font-bold text-zinc-500">+{s.xpEarned} XP</div>}
                              <div className="text-[10px] text-zinc-600">{fmtDateTime(s.finishedAt)}</div>
                            </div>
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {selectedSession && <SessionDetailModal session={selectedSession} subject={selectedSubject} onClose={() => setSelected(null)} />}
      </AnimatePresence>
    </StudyLayout>
  );
}
