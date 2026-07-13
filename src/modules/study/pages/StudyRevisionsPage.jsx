import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRevisionStore } from '../../../stores/useRevisionStore';
import { useStudyStore } from '../../../stores/useStudyStore';
import { StudyLayout } from '../components/StudyLayout';
import { useSessionModalStore } from '../../../stores/useSessionModalStore';
import clsx from 'clsx';

// ── helpers ───────────────────────────────────────────────────────────────────

function today() {
  return new Date().toISOString().slice(0, 10);
}
function fmtDate(d) {
  if (!d) return '';
  const [, m, day] = d.split('-');
  return `${day}/${m}`;
}
function daysAgo(dateStr) {
  const diff = Math.floor((new Date(today()) - new Date(dateStr)) / 86400000);
  if (diff === 0) return 'Hoje';
  if (diff === 1) return 'Ontem';
  return `${diff} dias atrás`;
}
function daysUntil(dateStr) {
  const diff = Math.floor((new Date(dateStr) - new Date(today())) / 86400000);
  if (diff === 0) return 'Hoje';
  if (diff === 1) return 'Amanhã';
  return `Em ${diff} dias`;
}

const STAGE_LABELS = ['R1', 'R2', 'R3', 'R4', 'R5', 'R6', 'R7+'];
function stageLabel(n) {
  return STAGE_LABELS[Math.min(n - 1, 6)] || `R${n}`;
}

// ── RevisionCard ──────────────────────────────────────────────────────────────

function RevisionCard({
  revision,
  subject,
  subtopicName,
  topicId,
  onStudy,
  onComplete,
  onReschedule,
}) {
  const [editingDate, setEditingDate] = useState(false);
  const [newDate, setNewDate] = useState(revision.revisionDate);
  const [showScore, setShowScore] = useState(false);
  const todayStr = today();
  const isOverdue = revision.revisionDate < todayStr;
  const isToday = revision.revisionDate === todayStr;
  const accent = subject?.color || 'var(--primary)';

  function handleReschedule() {
    if (newDate && newDate !== revision.revisionDate)
      onReschedule(revision.id, newDate);
    setEditingDate(false);
  }

  return (
    <div
      className="rounded-2xl border p-4 transition-all"
      style={{
        background: 'var(--bg-surface)',
        borderColor: isOverdue
          ? 'rgba(239,68,68,0.4)'
          : isToday
            ? 'rgba(245,158,11,0.4)'
            : 'var(--border)',
        borderLeftWidth: 3,
        borderLeftColor: isOverdue
          ? '#EF4444'
          : isToday
            ? '#F59E0B'
            : 'var(--border)',
      }}
    >
      <div className="flex items-start gap-3">
        {/* cor da matéria */}
        <div
          className="w-2 h-2 rounded-full mt-1.5 shrink-0"
          style={{ background: accent }}
        />

        {/* conteúdo */}
        <div className="flex-1 min-w-0">
          {/* linha 1 — matéria + urgência */}
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span
              className="text-[10px] font-bold uppercase tracking-wider"
              style={{ color: accent }}
            >
              {subject?.name || '—'}
            </span>
            <span
              className="text-[10px] font-bold px-2 py-0.5 rounded-full"
              style={{
                background: 'var(--bg-surface-2)',
                color: 'var(--text-dim)',
              }}
            >
              {stageLabel(revision.stage)}
            </span>
            {isOverdue && (
              <span
                className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                style={{ background: '#EF444420', color: '#EF4444' }}
              >
                ⚠ {daysAgo(revision.revisionDate)}
              </span>
            )}
            {isToday && !isOverdue && (
              <span
                className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                style={{ background: '#F59E0B20', color: '#F59E0B' }}
              >
                Hoje
              </span>
            )}
            {!isOverdue && !isToday && (
              <span
                className="text-[10px]"
                style={{ color: 'var(--text-dim)' }}
              >
                {daysUntil(revision.revisionDate)}
              </span>
            )}
          </div>

          {/* linha 2 — subtópico */}
          <div
            className="text-sm font-medium truncate"
            style={{ color: 'var(--text-main)' }}
          >
            {subtopicName}
          </div>

          {/* linha 3 — data + reagendar */}
          <div className="flex items-center gap-2 mt-1.5">
            {editingDate ? (
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={newDate}
                  onChange={e => setNewDate(e.target.value)}
                  className="px-2 py-1 rounded-lg border text-xs outline-none"
                  style={{
                    background: 'var(--bg-surface-2)',
                    borderColor: 'var(--border)',
                    color: 'var(--text-main)',
                  }}
                />
                <button
                  onClick={handleReschedule}
                  className="text-xs font-bold px-2 py-1 rounded-lg text-white"
                  style={{ background: accent }}
                >
                  Salvar
                </button>
                <button
                  onClick={() => setEditingDate(false)}
                  className="text-xs"
                  style={{ color: 'var(--text-dim)' }}
                >
                  ×
                </button>
              </div>
            ) : (
              <button
                onClick={() => setEditingDate(true)}
                className="flex items-center gap-1 text-[11px] transition-opacity hover:opacity-70"
                style={{ color: 'var(--text-dim)' }}
              >
                📅 {fmtDate(revision.revisionDate)}
              </button>
            )}
          </div>
        </div>

        {/* ações */}
        <div className="flex flex-col gap-1.5 shrink-0">
          {/* estudar agora */}
          <button
            onClick={() => onStudy(revision)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white transition-all hover:opacity-90"
            style={{ background: accent }}
          >
            ▶ Estudar
          </button>

          {/* marcar feita */}
          {!showScore ? (
            <button
              onClick={() => setShowScore(true)}
              className="px-3 py-1.5 rounded-xl text-xs font-bold border transition-all hover:bg-white/5"
              style={{
                borderColor: 'var(--border)',
                color: 'var(--text-muted)',
              }}
            >
              ✓ Feita
            </button>
          ) : (
            <div className="flex gap-1">
              {[
                { score: 5, label: 'F', color: '#10B981', title: 'Fácil' },
                { score: 3, label: 'M', color: '#F59E0B', title: 'Médio' },
                { score: 1, label: 'D', color: '#EF4444', title: 'Difícil' },
              ].map(opt => (
                <button
                  key={opt.score}
                  onClick={() => {
                    onComplete(revision.id, opt.score);
                    setShowScore(false);
                  }}
                  className="w-7 h-7 rounded-lg text-[10px] font-black text-white transition-all hover:opacity-90"
                  style={{ background: opt.color }}
                  title={opt.title}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Calendário de revisões (arrastar-e-soltar entre dias) ────────────────────

const MONTH_NAMES = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];
const WEEKDAY_LABELS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

function pad2(n) {
  return String(n).padStart(2, '0');
}

function RevisionCalendarTab({
  revisions,
  subjects,
  filterSubject,
  getSubtopicName,
  onStudy,
  onReschedule,
}) {
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d;
  });
  const [dragOverDate, setDragOverDate] = useState(null);

  const activeRevisions = useMemo(
    () =>
      revisions.filter(
        r => !r.completed && (!filterSubject || r.subjectId === filterSubject)
      ),
    [revisions, filterSubject]
  );

  const byDate = useMemo(() => {
    const map = {};
    activeRevisions.forEach(r => {
      if (!map[r.revisionDate]) map[r.revisionDate] = [];
      map[r.revisionDate].push(r);
    });
    return map;
  }, [activeRevisions]);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const startWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayStr = today();

  const cells = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(`${year}-${pad2(month + 1)}-${pad2(d)}`);
  }

  function handleDrop(e, dateStr) {
    e.preventDefault();
    setDragOverDate(null);
    const revId = e.dataTransfer.getData('text/plain');
    if (revId) onReschedule(revId, dateStr);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <button
          onClick={() =>
            setCursor(d => new Date(d.getFullYear(), d.getMonth() - 1, 1))
          }
          className="w-8 h-8 rounded-lg border flex items-center justify-center hover:bg-white/5 transition-colors"
          style={{ borderColor: 'var(--border)', color: 'var(--text-main)' }}
        >
          ‹
        </button>
        <div
          className="font-bold text-sm"
          style={{ color: 'var(--text-main)' }}
        >
          {MONTH_NAMES[month]} {year}
        </div>
        <button
          onClick={() =>
            setCursor(d => new Date(d.getFullYear(), d.getMonth() + 1, 1))
          }
          className="w-8 h-8 rounded-lg border flex items-center justify-center hover:bg-white/5 transition-colors"
          style={{ borderColor: 'var(--border)', color: 'var(--text-main)' }}
        >
          ›
        </button>
      </div>

      <div className="overflow-x-auto custom-scrollbar -mx-4 px-4 md:mx-0 md:px-0">
        <div className="min-w-[650px] md:min-w-0">
          <div
            className="grid grid-cols-7 gap-1 text-[10px] font-bold text-center mb-1"
            style={{ color: 'var(--text-dim)' }}
          >
            {WEEKDAY_LABELS.map((d, i) => (
              <div key={i}>{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {cells.map((dateStr, i) => {
              if (!dateStr) return <div key={`empty_${i}`} />;
              const dayRevs = byDate[dateStr] || [];
              const isToday = dateStr === todayStr;
              const isPast = dateStr < todayStr;
              return (
                <div
                  key={dateStr}
                  onDragOver={e => {
                    e.preventDefault();
                    setDragOverDate(dateStr);
                  }}
                  onDragLeave={() =>
                    setDragOverDate(d => (d === dateStr ? null : d))
                  }
                  onDrop={e => handleDrop(e, dateStr)}
                  className="min-h-[74px] rounded-lg border p-1 flex flex-col gap-0.5 overflow-y-auto transition-colors"
                  style={{
                    borderColor:
                      dragOverDate === dateStr ? 'var(--primary)' : 'var(--border)',
                    background: isToday
                      ? 'color-mix(in srgb, var(--primary) 10%, var(--bg-surface))'
                      : 'var(--bg-surface)',
                    opacity: isPast && dayRevs.length === 0 ? 0.5 : 1,
                  }}
                >
                  <div
                    className="text-[9px] font-bold"
                    style={{
                      color: isToday ? 'var(--primary)' : 'var(--text-dim)',
                    }}
                  >
                    {parseInt(dateStr.slice(-2), 10)}
                  </div>
                  {dayRevs.map(r => {
                    const subj = subjects.find(s => s.id === r.subjectId);
                    const overdue = isPast;
                    return (
                      <div
                        key={r.id}
                        draggable
                        onDragStart={e =>
                          e.dataTransfer.setData('text/plain', r.id)
                        }
                        onClick={() => onStudy(r)}
                        title={`${subj?.name || ''} — ${getSubtopicName(r)} (arraste para reagendar, clique para estudar)`}
                        className="text-[9px] font-bold px-1 py-0.5 rounded truncate cursor-grab active:cursor-grabbing"
                        style={{
                          background: overdue
                            ? '#EF444430'
                            : `${subj?.color || '#888'}30`,
                          color: overdue
                            ? '#EF4444'
                            : subj?.color || 'var(--text-main)',
                        }}
                      >
                        {stageLabel(r.stage)} · {getSubtopicName(r)}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <p className="text-[10px]" style={{ color: 'var(--text-dim)' }}>
        🖱 Arraste um card para outro dia pra reagendar · clique num card pra
        estudar essa revisão agora.
      </p>
    </div>
  );
}

// ── Gerenciador de revisões por matéria/subtópico ─────────────────────────────

function RevisionManagerModal({
  onClose,
  subjects,
  revisions,
  getSubtopicName,
  onReschedule,
  onDelete,
}) {
  const [subjectId, setSubjectId] = useState('');
  const [subtopicId, setSubtopicId] = useState('');

  const subjectsWithRevisions = subjects.filter(s =>
    revisions.some(r => r.subjectId === s.id)
  );

  const subtopicOptions = useMemo(() => {
    const map = new Map();
    revisions
      .filter(r => r.subjectId === subjectId)
      .forEach(r => map.set(r.subtopicId, getSubtopicName(r)));
    return [...map.entries()];
  }, [revisions, subjectId, getSubtopicName]);

  const filtered = useMemo(() => {
    return revisions
      .filter(r => !subjectId || r.subjectId === subjectId)
      .filter(r => !subtopicId || r.subtopicId === subtopicId)
      .sort((a, b) =>
        (b.completed ? b.completedAt : b.revisionDate || '').localeCompare(
          a.completed ? a.completedAt : a.revisionDate || ''
        )
      );
  }, [revisions, subjectId, subtopicId]);

  const inp = {
    background: 'var(--bg-surface-2)',
    border: '1px solid var(--border)',
    color: 'var(--text-main)',
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(12px)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-2xl overflow-hidden flex flex-col"
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-strong)',
          maxHeight: '85vh',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div
          className="flex items-center justify-between p-5 border-b flex-shrink-0"
          style={{ borderColor: 'var(--border)' }}
        >
          <div>
            <h3
              className="font-bold text-sm"
              style={{ color: 'var(--text-main)' }}
            >
              🗂 Gerenciar revisões
            </h3>
            <p
              className="text-[11px] mt-0.5"
              style={{ color: 'var(--text-dim)' }}
            >
              Veja, edite ou apague todas as revisões de uma matéria/subtópico.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-text-dim w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5"
          >
            ✕
          </button>
        </div>

        {/* filtros */}
        <div
          className="grid grid-cols-2 gap-2 p-4 border-b flex-shrink-0"
          style={{ borderColor: 'var(--border)' }}
        >
          <select
            value={subjectId}
            onChange={e => {
              setSubjectId(e.target.value);
              setSubtopicId('');
            }}
            className="px-3 py-2 rounded-xl text-sm outline-none"
            style={inp}
          >
            <option value="">Todas as matérias</option>
            {subjectsWithRevisions.map(s => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <select
            value={subtopicId}
            onChange={e => setSubtopicId(e.target.value)}
            disabled={!subjectId}
            className="px-3 py-2 rounded-xl text-sm outline-none disabled:opacity-40"
            style={inp}
          >
            <option value="">Todos os subtópicos</option>
            {subtopicOptions.map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </select>
        </div>

        {/* lista */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {filtered.length === 0 && (
            <p
              className="text-center text-xs py-8"
              style={{ color: 'var(--text-dim)' }}
            >
              Nenhuma revisão encontrada com esse filtro.
            </p>
          )}
          {filtered.map(r => {
            const subj = subjects.find(s => s.id === r.subjectId);
            const scoreColor =
              r.score === 5 ? '#10B981' : r.score === 3 ? '#F59E0B' : '#EF4444';
            return (
              <div
                key={r.id}
                className="flex items-center gap-3 p-3 rounded-xl border"
                style={{
                  borderColor: 'var(--border)',
                  background: 'var(--bg-surface-2)',
                }}
              >
                <div
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ background: subj?.color || 'var(--primary)' }}
                />
                <div className="flex-1 min-w-0">
                  <div
                    className="text-xs font-bold uppercase tracking-wide truncate"
                    style={{ color: subj?.color || 'var(--primary)' }}
                  >
                    {subj?.name} · {stageLabel(r.stage)}
                  </div>
                  <div
                    className="text-sm truncate"
                    style={{ color: 'var(--text-main)' }}
                  >
                    {getSubtopicName(r)}
                  </div>
                </div>

                {r.completed ? (
                  <span
                    className="text-[10px] font-bold px-2 py-1 rounded-full shrink-0"
                    style={{ background: `${scoreColor}20`, color: scoreColor }}
                  >
                    ✓ {fmtDate(r.completedAt)}
                  </span>
                ) : (
                  <input
                    type="date"
                    value={r.revisionDate}
                    onChange={e => onReschedule(r.id, e.target.value)}
                    className="px-2 py-1.5 rounded-lg border text-xs outline-none shrink-0"
                    style={inp}
                  />
                )}

                {!r.completed && (
                  <button
                    onClick={() => onDelete(r.id)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-red-500/20 text-text-dim hover:text-red-400 shrink-0"
                    title="Excluir esta revisão"
                  >
                    🗑
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Estatísticas de aderência e distribuição de scores ────────────────────────
function RevisionAdherenceStats({ history }) {
  if (history.length === 0) return null;

  const onTime = history.filter(
    r => r.completedAt && r.completedAt <= r.revisionDate
  ).length;
  const late = history.length - onTime;
  const onTimePct = Math.round((onTime / history.length) * 100);

  const scoreCounts = { 5: 0, 3: 0, 1: 0 };
  history.forEach(r => {
    if (scoreCounts[r.score] !== undefined) scoreCounts[r.score]++;
  });
  const totalScored = scoreCounts[5] + scoreCounts[3] + scoreCounts[1];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {/* aderência */}
      <div
        className="p-4 rounded-2xl border"
        style={{
          borderColor: 'var(--border)',
          background: 'var(--bg-surface)',
        }}
      >
        <div
          className="text-[10px] font-bold uppercase tracking-widest mb-3"
          style={{ color: 'var(--text-dim)' }}
        >
          Aderência ao prazo
        </div>
        <div className="flex items-center gap-3">
          <div
            className="text-2xl font-black shrink-0"
            style={{
              color:
                onTimePct >= 70
                  ? '#10B981'
                  : onTimePct >= 40
                    ? '#F59E0B'
                    : '#EF4444',
            }}
          >
            {onTimePct}%
          </div>
          <div
            className="flex-1 h-2.5 rounded-full overflow-hidden"
            style={{ background: '#EF444430' }}
          >
            <div
              className="h-full rounded-full"
              style={{ width: `${onTimePct}%`, background: '#10B981' }}
            />
          </div>
        </div>
        <div
          className="flex justify-between text-[10px] mt-2"
          style={{ color: 'var(--text-dim)' }}
        >
          <span>✅ {onTime} no prazo</span>
          <span>⚠ {late} atrasadas</span>
        </div>
      </div>

      {/* distribuição de score */}
      <div
        className="p-4 rounded-2xl border"
        style={{
          borderColor: 'var(--border)',
          background: 'var(--bg-surface)',
        }}
      >
        <div
          className="text-[10px] font-bold uppercase tracking-widest mb-3"
          style={{ color: 'var(--text-dim)' }}
        >
          Como você tem avaliado as revisões
        </div>
        <div className="space-y-1.5">
          {[
            { score: 5, label: 'Fácil', color: '#10B981' },
            { score: 3, label: 'Médio', color: '#F59E0B' },
            { score: 1, label: 'Difícil', color: '#EF4444' },
          ].map(opt => {
            const count = scoreCounts[opt.score];
            const pct =
              totalScored > 0 ? Math.round((count / totalScored) * 100) : 0;
            return (
              <div key={opt.score} className="flex items-center gap-2">
                <span
                  className="text-[10px] w-12 shrink-0 font-bold"
                  style={{ color: opt.color }}
                >
                  {opt.label}
                </span>
                <div
                  className="flex-1 h-2 rounded-full overflow-hidden"
                  style={{ background: 'var(--bg-surface-2)' }}
                >
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${pct}%`, background: opt.color }}
                  />
                </div>
                <span
                  className="text-[10px] w-8 text-right shrink-0"
                  style={{ color: 'var(--text-dim)' }}
                >
                  {count}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── componente principal ──────────────────────────────────────────────────────

export function StudyRevisionsPage() {
  const navigate = useNavigate();

  const revisions = useRevisionStore(s => s.revisions);
  const completeRevision = useRevisionStore(s => s.completeRevision);
  const editRevisionDate = useRevisionStore(s => s.editRevisionDate);
  const deleteRevision = useRevisionStore(s => s.deleteRevision);
  const getHealthSummary = useRevisionStore(s => s.getHealthSummary);
  const getUpcomingByDay = useRevisionStore(s => s.getUpcomingByDay);
  const subjects = useStudyStore(s => s.subjects);

  const [filterSubject, setFilterSubject] = useState('');
  const [tab, setTab] = useState('pending'); // pending | upcoming | calendar | history
  const [managerOpen, setManagerOpen] = useState(false);
  const openSessionModal = useSessionModalStore(s => s.openModal);

  const todayStr = today();
  const health = getHealthSummary();
  const upcoming = getUpcomingByDay(14);

  // helper: nome do subtópico
  function getSubtopicName(r) {
    const subj = subjects.find(s => s.id === r.subjectId);
    let name = r.subtopicId;
    subj?.topics?.forEach(t => {
      t.subtopics?.forEach(st => {
        if (st.id === r.subtopicId) name = st.name;
      });
    });
    return name || '—';
  }

  // listas filtradas
  const pending = useMemo(() => {
    return revisions
      .filter(r => !r.completed && r.revisionDate <= todayStr)
      .filter(r => !filterSubject || r.subjectId === filterSubject)
      .sort((a, b) => a.revisionDate.localeCompare(b.revisionDate));
  }, [revisions, todayStr, filterSubject]);

  const upcomingRevisions = useMemo(() => {
    return revisions
      .filter(r => !r.completed && r.revisionDate > todayStr)
      .filter(r => !filterSubject || r.subjectId === filterSubject)
      .sort((a, b) => a.revisionDate.localeCompare(b.revisionDate));
  }, [revisions, todayStr, filterSubject]);

  const history = useMemo(() => {
    return revisions
      .filter(r => r.completed)
      .filter(r => !filterSubject || r.subjectId === filterSubject)
      .sort((a, b) => (b.completedAt || '').localeCompare(a.completedAt || ''));
  }, [revisions, filterSubject]);

  function handleStudy(revision) {
    openSessionModal({
      preSubjectId: revision.subjectId,
      preTopicId: revision.topicId,
      preSubtopicId: revision.subtopicId,
      preMode: 'revisao',
      revisionId: revision.id,
    });
    // o modal já vem com o modo "Revisão" marcado, o banner de contexto,
    // e ao salvar chama completeRevision(revisionId, score) sozinho —
    // não é mais preciso marcar fácil/médio/difícil aqui manualmente depois.
  }

  function handleComplete(id, score) {
    completeRevision(id, score);
  }

  function handleReschedule(id, date) {
    editRevisionDate(id, date);
  }

  function handleDelete(id) {
    if (
      window.confirm('Excluir esta revisão? Essa ação não pode ser desfeita.')
    )
      deleteRevision(id);
  }

  const subjectOptions = subjects.filter(s =>
    revisions.some(r => r.subjectId === s.id)
  );

  return (
    <StudyLayout>
      <div className="flex flex-col max-h-[calc(100vh-80px)] overflow-y-auto custom-scrollbar pr-1 pb-10 space-y-5 animate-fade-in">
        {/* cabeçalho */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1
              className="text-2xl font-extrabold tracking-tight"
              style={{ color: 'var(--text-main)' }}
            >
              Revisões
            </h1>
            <p className="text-sm mt-1" style={{ color: 'var(--text-dim)' }}>
              Espaçamento inteligente R1→R6 — cada revisão fortalece a memória
              de longo prazo.
            </p>
          </div>
          <button
            onClick={() => setManagerOpen(true)}
            className="px-3 py-2 rounded-xl text-xs font-bold border hover:bg-white/5 transition-all whitespace-nowrap"
            style={{ borderColor: 'var(--border)', color: 'var(--text-main)' }}
          >
            🗂 Gerenciar revisões
          </button>
        </div>

        {/* KPIs de saúde */}
        <div className="grid grid-cols-3 gap-3">
          {[
            {
              label: 'Atrasadas',
              value: health.overdue,
              color: health.overdue > 0 ? '#EF4444' : '#10B981',
              bg: health.overdue > 0 ? '#EF444415' : '#10B98115',
            },
            {
              label: 'Hoje',
              value: health.today,
              color: '#F59E0B',
              bg: '#F59E0B15',
            },
            {
              label: 'Futuras',
              value: health.upcoming,
              color: 'var(--text-dim)',
              bg: 'var(--bg-surface-2)',
            },
          ].map(k => (
            <div
              key={k.label}
              className="p-4 rounded-2xl border text-center"
              style={{ background: k.bg, borderColor: 'var(--border)' }}
            >
              <div className="text-2xl font-black" style={{ color: k.color }}>
                {k.value}
              </div>
              <div
                className="text-[10px] font-bold uppercase tracking-widest mt-1"
                style={{ color: 'var(--text-dim)' }}
              >
                {k.label}
              </div>
            </div>
          ))}
        </div>

        {/* filtro por matéria */}
        {subjectOptions.length > 1 && (
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setFilterSubject('')}
              className="px-3 py-1.5 rounded-full text-xs font-bold border transition-all"
              style={{
                borderColor: !filterSubject
                  ? 'var(--primary)'
                  : 'var(--border)',
                background: !filterSubject ? 'var(--primary)' : 'transparent',
                color: !filterSubject ? 'white' : 'var(--text-muted)',
              }}
            >
              Todas
            </button>
            {subjectOptions.map(s => (
              <button
                key={s.id}
                onClick={() =>
                  setFilterSubject(s.id === filterSubject ? '' : s.id)
                }
                className="px-3 py-1.5 rounded-full text-xs font-bold border transition-all"
                style={{
                  borderColor:
                    filterSubject === s.id ? s.color : 'var(--border)',
                  background:
                    filterSubject === s.id ? `${s.color}18` : 'transparent',
                  color: filterSubject === s.id ? s.color : 'var(--text-muted)',
                }}
              >
                {s.name}
              </button>
            ))}
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
            { id: 'pending', label: `Pendentes (${pending.length})` },
            { id: 'upcoming', label: `Próximas (${upcomingRevisions.length})` },
            { id: 'calendar', label: '📅 Cronograma' },
            { id: 'history', label: 'Histórico' },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={clsx(
                'flex-1 py-2 rounded-lg text-xs font-bold transition-all',
                tab === t.id
                  ? 'text-white'
                  : 'text-text-muted hover:text-text-main hover:bg-white/5'
              )}
              style={tab === t.id ? { background: 'var(--primary)' } : {}}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ── tab: pendentes ── */}
        {tab === 'pending' && (
          <div className="space-y-3">
            {pending.length === 0 ? (
              <div
                className="flex flex-col items-center justify-center gap-2 py-12 rounded-2xl border"
                style={{
                  borderColor: 'var(--border)',
                  background: 'var(--bg-surface)',
                }}
              >
                <span className="text-3xl">✅</span>
                <span
                  className="text-sm font-medium"
                  style={{ color: 'var(--text-dim)' }}
                >
                  Nenhuma revisão pendente. Excelente!
                </span>
              </div>
            ) : (
              pending.map(r => (
                <RevisionCard
                  key={r.id}
                  revision={r}
                  subject={subjects.find(s => s.id === r.subjectId)}
                  subtopicName={getSubtopicName(r)}
                  onStudy={handleStudy}
                  onComplete={handleComplete}
                  onReschedule={handleReschedule}
                />
              ))
            )}
          </div>
        )}

        {/* ── tab: próximas ── */}
        {tab === 'upcoming' && (
          <div className="space-y-3">
            {/* mini BarChart de carga dos próximos 14 dias */}
            {upcoming.some(d => d.count > 0) && (
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
                  Carga dos próximos 14 dias
                </div>
                <div className="flex items-end gap-1 h-12">
                  {upcoming.map((d, i) => {
                    const max = Math.max(...upcoming.map(x => x.count), 1);
                    const pct = (d.count / max) * 100;
                    const [, m, day] = d.date.split('-');
                    return (
                      <div
                        key={i}
                        className="flex-1 flex flex-col items-center gap-1"
                      >
                        <div
                          className="w-full rounded-sm transition-all"
                          style={{
                            height: `${Math.max(pct, 4)}%`,
                            background:
                              d.count > 0
                                ? 'var(--primary)'
                                : 'var(--bg-surface-2)',
                            minHeight: d.count > 0 ? 4 : 2,
                            opacity: d.count > 0 ? 1 : 0.3,
                          }}
                          title={`${day}/${m} — ${d.count} revisão(ões)`}
                        />
                        {i % 3 === 0 && (
                          <div
                            className="text-[8px]"
                            style={{ color: 'var(--text-dim)' }}
                          >
                            {day}/{m}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {upcomingRevisions.length === 0 ? (
              <div
                className="flex flex-col items-center justify-center gap-2 py-12 rounded-2xl border"
                style={{
                  borderColor: 'var(--border)',
                  background: 'var(--bg-surface)',
                }}
              >
                <span className="text-3xl">📅</span>
                <span
                  className="text-sm font-medium"
                  style={{ color: 'var(--text-dim)' }}
                >
                  Sem revisões agendadas para os próximos dias.
                </span>
              </div>
            ) : (
              upcomingRevisions.map(r => (
                <RevisionCard
                  key={r.id}
                  revision={r}
                  subject={subjects.find(s => s.id === r.subjectId)}
                  subtopicName={getSubtopicName(r)}
                  onStudy={handleStudy}
                  onComplete={handleComplete}
                  onReschedule={handleReschedule}
                />
              ))
            )}
          </div>
        )}

        {/* ── tab: cronograma (calendário arrastável) ── */}
        {tab === 'calendar' && (
          <RevisionCalendarTab
            revisions={revisions}
            subjects={subjects}
            filterSubject={filterSubject}
            getSubtopicName={getSubtopicName}
            onStudy={handleStudy}
            onReschedule={handleReschedule}
          />
        )}

        {/* ── tab: histórico ── */}
        {tab === 'history' && (
          <div className="space-y-4">
            <RevisionAdherenceStats history={history} />
            <div className="space-y-2">
              {history.length === 0 ? (
                <div
                  className="flex flex-col items-center justify-center gap-2 py-12 rounded-2xl border"
                  style={{
                    borderColor: 'var(--border)',
                    background: 'var(--bg-surface)',
                  }}
                >
                  <span className="text-3xl">📚</span>
                  <span
                    className="text-sm font-medium"
                    style={{ color: 'var(--text-dim)' }}
                  >
                    Nenhuma revisão concluída ainda.
                  </span>
                </div>
              ) : (
                history.slice(0, 50).map(r => {
                  const subj = subjects.find(s => s.id === r.subjectId);
                  const scoreColor =
                    r.score === 5
                      ? '#10B981'
                      : r.score === 3
                        ? '#F59E0B'
                        : '#EF4444';
                  const scoreLabel =
                    r.score === 5
                      ? 'Fácil'
                      : r.score === 3
                        ? 'Médio'
                        : 'Difícil';
                  return (
                    <div
                      key={r.id}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl border"
                      style={{
                        background: 'var(--bg-surface)',
                        borderColor: 'var(--border)',
                      }}
                    >
                      <div
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ background: subj?.color || 'var(--primary)' }}
                      />
                      <div className="flex-1 min-w-0">
                        <div
                          className="text-xs font-bold uppercase tracking-wide"
                          style={{ color: subj?.color || 'var(--primary)' }}
                        >
                          {subj?.name}
                        </div>
                        <div
                          className="text-sm font-medium truncate"
                          style={{ color: 'var(--text-main)' }}
                        >
                          {getSubtopicName(r)}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                          style={{
                            background: 'var(--bg-surface-2)',
                            color: 'var(--text-dim)',
                          }}
                        >
                          {stageLabel(r.stage)}
                        </span>
                        {r.score && (
                          <span
                            className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                            style={{
                              background: `${scoreColor}20`,
                              color: scoreColor,
                            }}
                          >
                            {scoreLabel}
                          </span>
                        )}
                        <span
                          className="text-[10px]"
                          style={{ color: 'var(--text-dim)' }}
                        >
                          {r.completedAt ? fmtDate(r.completedAt) : ''}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {managerOpen && (
        <RevisionManagerModal
          onClose={() => setManagerOpen(false)}
          subjects={subjects}
          revisions={revisions}
          getSubtopicName={getSubtopicName}
          onReschedule={handleReschedule}
          onDelete={handleDelete}
        />
      )}
    </StudyLayout>
  );
}
