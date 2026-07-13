import { useState, useMemo } from 'react';
import { useSessionStore } from '../../../stores/useSessionStore';
import { useStudyStore } from '../../../stores/useStudyStore';
import { StudyLayout } from '../components/StudyLayout';
import { formatMinutes } from '../../../shared/utils/time';
import clsx from 'clsx';

// ── helpers ───────────────────────────────────────────────────────────────────

function today() {
  return new Date().toISOString().slice(0, 10);
}

function getLastNDays(n) {
  const dates = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dates.push(d.toISOString().slice(0, 10));
  }
  return dates;
}

function fmtDate(d) {
  if (!d) return '';
  const [, m, day] = d.split('-');
  return `${day}/${m}`;
}

function fmtDateTime(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

const MODE_LABELS = {
  leitura: { label: 'Leitura', icon: '📖', color: '#3B82F6' },
  video: { label: 'Videoaula', icon: '▶️', color: '#8B5CF6' },
  questoes: { label: 'Questões', icon: '🎯', color: '#10B981' },
  flashcards: { label: 'Flashcards', icon: '🃏', color: '#F59E0B' },
  revisao: { label: 'Revisão', icon: '🔄', color: '#06B6D4' },
  feynman: { label: 'Feynman', icon: '🧠', color: '#EC4899' },
  recall: { label: 'Recall', icon: '⚡', color: '#F97316' },
  mpa: { label: 'MPA', icon: '🔗', color: '#A855F7' },
  mapa: { label: 'Mapa Mental', icon: '🗺️', color: '#14B8A6' },
};

function getModeLabel(session) {
  const modes =
    session.modes || (session.studyType ? [session.studyType] : ['leitura']);
  return modes.map(m => MODE_LABELS[m]?.icon || '📖').join('');
}

function getModeColor(session) {
  const first = session.modes?.[0] || session.studyType || 'leitura';
  return MODE_LABELS[first]?.color || '#3B82F6';
}

const PERIOD_OPTIONS = [
  { label: '7 dias', value: 7 },
  { label: '14 dias', value: 14 },
  { label: '30 dias', value: 30 },
  { label: 'Total', value: 0 },
];

// ── sub-componentes ───────────────────────────────────────────────────────────

function StatCard({ label, value, sub, accent, icon }) {
  return (
    <div
      className="p-4 rounded-2xl border flex flex-col gap-1"
      style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
    >
      <div className="flex items-center justify-between">
        <span
          className="text-[10px] font-bold uppercase tracking-widest"
          style={{ color: 'var(--text-dim)' }}
        >
          {label}
        </span>
        <span className="text-base">{icon}</span>
      </div>
      <div
        className="text-2xl font-black"
        style={{ color: accent || 'var(--text-main)' }}
      >
        {value}
      </div>
      {sub && (
        <div
          className="text-[10px] font-medium"
          style={{ color: 'var(--text-dim)' }}
        >
          {sub}
        </div>
      )}
    </div>
  );
}

function SessionDetailModal({ session, subject, onClose }) {
  if (!session) return null;
  const acc =
    session.questionsAnswered > 0
      ? Math.round((session.questionsCorrect / session.questionsAnswered) * 100)
      : null;
  const modes = session.modes || (session.studyType ? [session.studyType] : []);
  const accent = subject?.color || 'var(--primary)';

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl overflow-hidden shadow-2xl"
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-strong)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* header */}
        <div
          className="flex items-center justify-between px-5 py-4 border-b"
          style={{
            borderColor: 'var(--border)',
            background: 'var(--bg-surface-2)',
          }}
        >
          <div className="flex items-center gap-2">
            <div
              className="w-2 h-2 rounded-full"
              style={{ background: accent }}
            />
            <span
              className="font-bold text-sm"
              style={{ color: 'var(--text-main)' }}
            >
              {subject?.name || 'Sessão'}
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full flex items-center justify-center text-lg hover:bg-white/10"
            style={{ color: 'var(--text-muted)' }}
          >
            ×
          </button>
        </div>

        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* stats */}
          <div className="grid grid-cols-3 gap-3">
            <div
              className="p-3 rounded-xl border text-center"
              style={{
                background: 'var(--bg-surface-2)',
                borderColor: 'var(--border)',
              }}
            >
              <div
                className="text-lg font-black"
                style={{ color: 'var(--text-main)' }}
              >
                {formatMinutes(session.totalMinutes)}
              </div>
              <div
                className="text-[9px] uppercase tracking-widest"
                style={{ color: 'var(--text-dim)' }}
              >
                Tempo
              </div>
            </div>
            <div
              className="p-3 rounded-xl border text-center"
              style={{
                background: 'var(--bg-surface-2)',
                borderColor: 'var(--border)',
              }}
            >
              <div
                className="text-lg font-black"
                style={{ color: 'var(--accent)' }}
              >
                +{session.xpEarned || 0}
              </div>
              <div
                className="text-[9px] uppercase tracking-widest"
                style={{ color: 'var(--text-dim)' }}
              >
                XP
              </div>
            </div>
            <div
              className="p-3 rounded-xl border text-center"
              style={{
                background: 'var(--bg-surface-2)',
                borderColor: 'var(--border)',
              }}
            >
              <div
                className="text-lg font-black"
                style={{
                  color:
                    acc !== null
                      ? acc >= 70
                        ? '#10B981'
                        : '#F59E0B'
                      : 'var(--text-dim)',
                }}
              >
                {acc !== null ? `${acc}%` : '—'}
              </div>
              <div
                className="text-[9px] uppercase tracking-widest"
                style={{ color: 'var(--text-dim)' }}
              >
                Acerto
              </div>
            </div>
          </div>

          {/* modos */}
          {modes.length > 0 && (
            <div>
              <div
                className="text-[10px] font-bold uppercase tracking-widest mb-2"
                style={{ color: 'var(--text-dim)' }}
              >
                Métodos usados
              </div>
              <div className="flex flex-wrap gap-2">
                {modes.map(m => {
                  const info = MODE_LABELS[m];
                  return info ? (
                    <span
                      key={m}
                      className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold"
                      style={{
                        background: `${info.color}18`,
                        color: info.color,
                        border: `1px solid ${info.color}33`,
                      }}
                    >
                      {info.icon} {info.label}
                    </span>
                  ) : null;
                })}
              </div>
            </div>
          )}

          {/* questões */}
          {session.questionsAnswered > 0 && (
            <div
              className="p-3 rounded-xl border"
              style={{ background: '#10B98108', borderColor: '#10B98133' }}
            >
              <div
                className="text-[10px] font-bold uppercase tracking-widest mb-1"
                style={{ color: '#10B981' }}
              >
                Questões
              </div>
              <div className="text-sm" style={{ color: 'var(--text-main)' }}>
                {session.questionsCorrect}/{session.questionsAnswered} acertos (
                {acc}%)
              </div>
            </div>
          )}

          {/* campos metodológicos */}
          {[
            {
              key: 'connection',
              label: '🧠 Conexão (Ordem Superior)',
              color: '#8B5CF6',
            },
            { key: 'gaps', label: '⚠️ Gaps registrados', color: '#EF4444' },
            {
              key: 'insecurity',
              label: '🤔 Insegurança mapeada',
              color: '#F59E0B',
            },
            { key: 'feynmanNote', label: '🎤 Nota Feynman', color: '#EC4899' },
            {
              key: 'recallText',
              label: '⚡ Recall — o que lembrou',
              color: '#F97316',
            },
            {
              key: 'recallMissed',
              label: '⚡ Recall — o que esqueceu',
              color: '#EF4444',
            },
            { key: 'anchor', label: '🔗 Âncora MPA', color: '#A855F7' },
          ]
            .filter(f => session[f.key])
            .map(f => (
              <div
                key={f.key}
                className="p-3 rounded-xl border"
                style={{
                  background: `${f.color}08`,
                  borderColor: `${f.color}33`,
                }}
              >
                <div
                  className="text-[10px] font-bold uppercase tracking-widest mb-1"
                  style={{ color: f.color }}
                >
                  {f.label}
                </div>
                <div
                  className="text-sm"
                  style={{ color: 'var(--text-main)', lineHeight: 1.6 }}
                >
                  {session[f.key]}
                </div>
              </div>
            ))}

          {/* meta */}
          <div
            className="text-[10px] text-center"
            style={{ color: 'var(--text-dim)' }}
          >
            {fmtDate(session.date)} às {fmtDateTime(session.finishedAt)}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── componente principal ──────────────────────────────────────────────────────

export function StudySessionPage() {
  const sessions = useSessionStore(s => s.sessions);
  const getStreak = useSessionStore(s => s.getStreak);
  const getSubjectKPIs = useSessionStore(s => s.getSubjectKPIs);
  const subjects = useStudyStore(s => s.subjects);

  const [period, setPeriod] = useState(7);
  const [filterSubject, setFilterSubject] = useState('');
  const [filterMode, setFilterMode] = useState('');
  const [selectedSession, setSelected] = useState(null);

  const todayStr = today();

  // filtro de período
  const filtered = useMemo(() => {
    let list = [...sessions].sort(
      (a, b) => (b.finishedAt || 0) - (a.finishedAt || 0)
    );
    if (period > 0) {
      const from = new Date();
      from.setDate(from.getDate() - period);
      const fromStr = from.toISOString().slice(0, 10);
      list = list.filter(s => s.date >= fromStr);
    }
    if (filterSubject) list = list.filter(s => s.subjectId === filterSubject);
    if (filterMode)
      list = list.filter(s => (s.modes || [s.studyType]).includes(filterMode));
    return list;
  }, [sessions, period, filterSubject, filterMode]);

  // stats do período
  const stats = useMemo(() => {
    const totalMins = filtered.reduce((a, s) => a + (s.totalMinutes || 0), 0);
    const totalQ = filtered.reduce((a, s) => a + (s.questionsAnswered || 0), 0);
    const totalC = filtered.reduce((a, s) => a + (s.questionsCorrect || 0), 0);
    const daysWithStu = new Set(filtered.map(s => s.date)).size;
    const avgDaily = daysWithStu > 0 ? Math.round(totalMins / daysWithStu) : 0;
    const accuracy = totalQ > 0 ? Math.round((totalC / totalQ) * 100) : null;

    // minutos por dia (para o mini gráfico de barras)
    const days = period > 0 ? getLastNDays(period) : getLastNDays(30);
    const byDay = {};
    filtered.forEach(s => {
      byDay[s.date] = (byDay[s.date] || 0) + (s.totalMinutes || 0);
    });
    const barData = days.map(d => ({ date: d, mins: byDay[d] || 0 }));

    return {
      totalMins,
      totalQ,
      totalC,
      accuracy,
      daysWithStu,
      avgDaily,
      barData,
    };
  }, [filtered, period]);

  const streak = getStreak();

  // sessões agrupadas por data
  const byDate = useMemo(() => {
    const map = {};
    filtered.forEach(s => {
      if (!map[s.date]) map[s.date] = [];
      map[s.date].push(s);
    });
    return Object.entries(map).sort(([a], [b]) => b.localeCompare(a));
  }, [filtered]);

  const subjectOptions = subjects.filter(s =>
    sessions.some(ss => ss.subjectId === s.id)
  );
  const modeOptions = Object.entries(MODE_LABELS);

  const selectedSubject = selectedSession
    ? subjects.find(s => s.id === selectedSession.subjectId)
    : null;

  return (
    <StudyLayout>
      <div className="flex flex-col max-h-[calc(100vh-80px)] overflow-y-auto custom-scrollbar pr-1 pb-10 space-y-5 animate-fade-in">
        {/* cabeçalho */}
        <div>
          <h1
            className="text-2xl font-extrabold tracking-tight"
            style={{ color: 'var(--text-main)' }}
          >
            Histórico de Sessões
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-dim)' }}>
            Cada sessão registrada é residuo cognitivo acumulado.
          </p>
        </div>

        {/* stats do período */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard
            label="Tempo total"
            value={formatMinutes(stats.totalMins)}
            sub={`${stats.daysWithStu} dias ativos`}
            icon="⏱"
          />
          <StatCard
            label="Streak"
            value={`${streak}d`}
            sub="dias consecutivos"
            icon="🔥"
            accent={
              streak >= 7 ? '#F59E0B' : streak > 0 ? '#10B981' : undefined
            }
          />
          <StatCard
            label="Média diária"
            value={formatMinutes(stats.avgDaily)}
            sub="no período"
            icon="📊"
          />
          <StatCard
            label="Acerto geral"
            value={stats.accuracy !== null ? `${stats.accuracy}%` : '—'}
            sub={`${stats.totalQ} questões`}
            icon="🎯"
            accent={
              stats.accuracy !== null
                ? stats.accuracy >= 70
                  ? '#10B981'
                  : '#F59E0B'
                : undefined
            }
          />
        </div>

        {/* mini bar chart de atividade */}
        {stats.barData.length > 0 && (
          <div
            className="p-4 rounded-2xl border"
            style={{
              background: 'var(--bg-surface)',
              borderColor: 'var(--border)',
            }}
          >
            <div
              className="text-[10px] font-bold uppercase tracking-widest mb-3"
              style={{ color: 'var(--text-dim)' }}
            >
              Atividade —{' '}
              {period > 0 ? `últimos ${period} dias` : 'total (30d)'}
            </div>
            <div className="flex items-end gap-0.5 h-10">
              {stats.barData.map((d, i) => {
                const max = Math.max(...stats.barData.map(x => x.mins), 1);
                const pct = (d.mins / max) * 100;
                const isToday = d.date === todayStr;
                return (
                  <div
                    key={i}
                    className="flex-1 flex flex-col justify-end"
                    style={{ height: '100%' }}
                  >
                    <div
                      className="w-full rounded-sm"
                      style={{
                        height: `${Math.max(pct, d.mins > 0 ? 6 : 2)}%`,
                        background: isToday
                          ? 'var(--accent)'
                          : d.mins > 0
                            ? 'var(--primary)'
                            : 'var(--bg-surface-2)',
                        opacity: d.mins > 0 ? 1 : 0.3,
                        minHeight: d.mins > 0 ? 3 : 1,
                        transition: 'height .3s ease',
                      }}
                      title={`${fmtDate(d.date)} — ${formatMinutes(d.mins)}`}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* filtros */}
        <div className="flex flex-wrap gap-2 items-center">
          {/* período */}
          <div
            className="flex gap-1 p-1 rounded-xl"
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border)',
            }}
          >
            {PERIOD_OPTIONS.map(p => (
              <button
                key={p.value}
                onClick={() => setPeriod(p.value)}
                className={clsx(
                  'px-3 py-1.5 rounded-lg text-xs font-bold transition-all',
                  period === p.value
                    ? 'text-white'
                    : 'text-text-muted hover:text-text-main'
                )}
                style={
                  period === p.value ? { background: 'var(--primary)' } : {}
                }
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* matéria */}
          {subjectOptions.length > 0 && (
            <select
              value={filterSubject}
              onChange={e => setFilterSubject(e.target.value)}
              className="px-3 py-1.5 rounded-xl text-xs font-medium border outline-none"
              style={{
                background: 'var(--bg-surface)',
                borderColor: 'var(--border)',
                color: 'var(--text-main)',
              }}
            >
              <option value="">Todas as matérias</option>
              {subjectOptions.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          )}

          {/* modo */}
          <select
            value={filterMode}
            onChange={e => setFilterMode(e.target.value)}
            className="px-3 py-1.5 rounded-xl text-xs font-medium border outline-none"
            style={{
              background: 'var(--bg-surface)',
              borderColor: 'var(--border)',
              color: 'var(--text-main)',
            }}
          >
            <option value="">Todos os modos</option>
            {modeOptions.map(([id, info]) => (
              <option key={id} value={id}>
                {info.icon} {info.label}
              </option>
            ))}
          </select>

          {(filterSubject || filterMode) && (
            <button
              onClick={() => {
                setFilterSubject('');
                setFilterMode('');
              }}
              className="px-3 py-1.5 rounded-xl text-xs font-bold border"
              style={{ borderColor: 'var(--border)', color: 'var(--text-dim)' }}
            >
              × Limpar
            </button>
          )}
        </div>

        {/* contagem */}
        <div
          className="text-xs font-medium"
          style={{ color: 'var(--text-dim)' }}
        >
          {filtered.length} sessão{filtered.length !== 1 ? 'ões' : ''}{' '}
          encontrada{filtered.length !== 1 ? 's' : ''}
        </div>

        {/* lista agrupada por data */}
        {byDate.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center gap-3 py-16 rounded-2xl border"
            style={{
              borderColor: 'var(--border)',
              background: 'var(--bg-surface)',
            }}
          >
            <span className="text-4xl">📚</span>
            <div
              className="text-sm font-medium"
              style={{ color: 'var(--text-dim)' }}
            >
              Nenhuma sessão neste período.
            </div>
            <div className="text-xs" style={{ color: 'var(--text-dim)' }}>
              Use o botão "▶ Nova sessão" para começar.
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            {byDate.map(([date, daySessions]) => {
              const dayTotal = daySessions.reduce(
                (a, s) => a + (s.totalMinutes || 0),
                0
              );
              const isToday = date === todayStr;
              const [y, m, d] = date.split('-');
              const dateLabel = isToday
                ? 'Hoje'
                : new Date(date + 'T12:00:00').toLocaleDateString('pt-BR', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                  });

              return (
                <div key={date}>
                  {/* separador de data */}
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className="text-xs font-bold"
                      style={{
                        color: isToday ? 'var(--primary)' : 'var(--text-dim)',
                      }}
                    >
                      {dateLabel}
                    </div>
                    <div
                      className="flex-1 h-px"
                      style={{ background: 'var(--border)' }}
                    />
                    <div
                      className="text-xs font-medium"
                      style={{ color: 'var(--text-dim)' }}
                    >
                      {formatMinutes(dayTotal)}
                    </div>
                  </div>

                  {/* sessões do dia */}
                  <div className="space-y-2">
                    {daySessions.map(s => {
                      const subj = subjects.find(x => x.id === s.subjectId);
                      const accent = subj?.color || 'var(--primary)';
                      const modes = getModeLabel(s);
                      const mColor = getModeColor(s);
                      const acc =
                        s.questionsAnswered > 0
                          ? Math.round(
                              (s.questionsCorrect / s.questionsAnswered) * 100
                            )
                          : null;
                      // badges metodológicos
                      const methodBadges = [
                        s.connection && { icon: '🧠', color: '#8B5CF6' },
                        s.gaps && { icon: '⚠️', color: '#EF4444' },
                        s.feynmanNote && { icon: '🎤', color: '#EC4899' },
                        s.recallText && { icon: '⚡', color: '#F97316' },
                        s.anchor && { icon: '🔗', color: '#A855F7' },
                        s.insecurity && { icon: '🤔', color: '#F59E0B' },
                      ].filter(Boolean);

                      return (
                        <button
                          key={s.id}
                          onClick={() => setSelected(s)}
                          className="w-full flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all hover:border-[var(--border-strong)] hover:bg-white/2"
                          style={{
                            background: 'var(--bg-surface)',
                            borderColor: 'var(--border)',
                          }}
                        >
                          {/* cor matéria */}
                          <div
                            className="w-2 h-10 rounded-full shrink-0"
                            style={{ background: accent }}
                          />

                          {/* info principal */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span
                                className="text-[10px] font-bold uppercase tracking-wider"
                                style={{ color: accent }}
                              >
                                {subj?.name || '—'}
                              </span>
                              <span
                                className="text-[10px]"
                                style={{ color: 'var(--text-dim)' }}
                              >
                                {modes}
                              </span>
                              {/* badges metodológicos */}
                              {methodBadges.map((b, i) => (
                                <span
                                  key={i}
                                  className="text-[11px]"
                                  title={b.icon}
                                  style={{ opacity: 0.8 }}
                                >
                                  {b.icon}
                                </span>
                              ))}
                            </div>
                            <div
                              className="text-sm font-medium truncate mt-0.5"
                              style={{ color: 'var(--text-main)' }}
                            >
                              {s.totalMinutes} min
                              {s.questionsAnswered > 0 &&
                                ` · ${s.questionsAnswered} questões`}
                            </div>
                          </div>

                          {/* acerto + XP */}
                          <div className="flex flex-col items-end shrink-0 gap-1">
                            {acc !== null && (
                              <div
                                className="text-sm font-black"
                                style={{
                                  color: acc >= 70 ? '#10B981' : '#F59E0B',
                                }}
                              >
                                {acc}%
                              </div>
                            )}
                            {s.xpEarned && (
                              <div
                                className="text-[10px] font-bold"
                                style={{ color: 'var(--text-dim)' }}
                              >
                                +{s.xpEarned} XP
                              </div>
                            )}
                            <div
                              className="text-[10px]"
                              style={{ color: 'var(--text-dim)' }}
                            >
                              {fmtDateTime(s.finishedAt)}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* modal de detalhe */}
      {selectedSession && (
        <SessionDetailModal
          session={selectedSession}
          subject={selectedSubject}
          onClose={() => setSelected(null)}
        />
      )}
    </StudyLayout>
  );
}
