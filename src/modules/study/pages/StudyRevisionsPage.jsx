import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRevisionStore } from '../../../stores/useRevisionStore';
import { useStudyStore } from '../../../stores/useStudyStore';
import { useSessionModalStore } from '../../../stores/useSessionModalStore';
import { StudyLayout } from '../components/StudyLayout';
import { BentoCard, SectionHeader, Badge } from '../components/BentoCard';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import { RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

const today = () => new Date().toISOString().slice(0, 10);
const fmtDate = (d) => { if (!d) return ''; const [, m, day] = d.split('-'); return `${day}/${m}`; };
const daysAgo = (d) => { const n = Math.floor((new Date(today()) - new Date(d)) / 864e5); return n === 0 ? 'Hoje' : n === 1 ? 'Ontem' : `${n} dias atrás`; };
const daysUntil = (d) => { const n = Math.floor((new Date(d) - new Date(today())) / 864e5); return n === 0 ? 'Hoje' : n === 1 ? 'Amanhã' : `Em ${n} dias`; };
const STAGE_LABELS = ['R1', 'R2', 'R3', 'R4', 'R5', 'R6', 'R7+'];
const stageLabel = (n) => STAGE_LABELS[Math.min(n - 1, 6)] || `R${n}`;

function TabBar({ tabs, active, onChange }) {
  return (
    <div className="relative flex gap-1 p-1 rounded-2xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(20px)' }}>
      {tabs.map((t) => (
        <button key={t.id} onClick={() => onChange(t.id)} className={clsx('relative flex-1 py-2.5 rounded-xl text-xs font-bold transition-colors z-10', active === t.id ? 'text-white' : 'text-zinc-500 hover:text-zinc-300')}>
          {active === t.id && <motion.div layoutId="rv-tab" className="absolute inset-0 rounded-xl" style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.3), rgba(59,130,246,0.2))', border: '1px solid rgba(139,92,246,0.3)', backdropFilter: 'blur(20px)' }} transition={{ type: 'spring', stiffness: 400, damping: 30 }} />}
          <span className="relative z-10">{t.label}</span>
        </button>
      ))}
    </div>
  );
}

function EmptyState({ icon, title, description }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center justify-center gap-3 py-16 rounded-2xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.08)' }}>
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl" style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.1), rgba(59,130,246,0.1))', border: '1px solid rgba(139,92,246,0.15)' }}>{icon}</div>
      <div className="text-sm font-medium text-zinc-400">{title}</div>
      <div className="text-xs text-zinc-600 max-w-xs text-center">{description}</div>
    </motion.div>
  );
}

// ── RevisionCard (ported from V1) ──────────────────────────────────────────

function RevisionCard({ revision, subject, subtopicName, onStudy, onComplete, onReschedule }) {
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
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      whileHover={{ scale: 1.005 }}
      className="rounded-2xl border p-4 transition-all"
      style={{
        background: 'rgba(255,255,255,0.03)',
        borderColor: isOverdue
          ? 'rgba(239,68,68,0.4)'
          : isToday
            ? 'rgba(245,158,11,0.4)'
            : 'rgba(255,255,255,0.06)',
        borderLeftWidth: 3,
        borderLeftColor: isOverdue
          ? '#EF4444'
          : isToday
            ? '#F59E0B'
            : 'var(--border)',
        backdropFilter: 'blur(20px)',
      }}
    >
      <div className="flex items-start gap-3">
        <div className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ background: accent }} />
        <div className="flex-1 min-w-0">
          {/* linha 1 — matéria + badges R1-R7 + urgência */}
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: accent }}>{subject?.name || '—'}</span>
            <div className="flex gap-1 items-center flex-wrap">
              {[
                { num: 1, label: 'R1' },
                { num: 2, label: 'R3' },
                { num: 3, label: 'R7' },
                { num: 4, label: 'R15' },
                { num: 5, label: 'R30' },
                { num: 6, label: 'R60' },
                { num: 7, label: 'R🔄' }
              ].map((st) => {
                const isActive = st.num === 7 ? revision.stage >= 7 : revision.stage === st.num;
                const isCompleted = revision.stage > st.num;
                return (
                  <span
                    key={st.num}
                    className={clsx(
                      "text-[10px] lg:text-[9px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-0.5 transition-all select-none",
                      isActive
                        ? "ring-2 text-purple-300 font-black shadow-[0_0_8px_rgba(168,85,247,0.3)]"
                        : isCompleted
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : "bg-white/5 text-zinc-500"
                    )}
                    style={{
                      outlineColor: isActive ? accent : 'transparent',
                      color: isActive ? accent : undefined,
                      background: isActive ? `${accent}20` : undefined
                    }}
                  >
                    {st.num === 7 ? (
                      <span className="flex items-center gap-0.5">
                        R<RefreshCw size={8} className={clsx(isActive && "animate-spin-slow")} />
                      </span>
                    ) : (
                      st.label
                    )}
                  </span>
                );
              })}
            </div>
            {isOverdue && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: '#EF444420', color: '#EF4444' }}>⚠ {daysAgo(revision.revisionDate)}</span>}
            {isToday && !isOverdue && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: '#F59E0B20', color: '#F59E0B' }}>Hoje</span>}
            {!isOverdue && !isToday && <span className="text-[10px]" style={{ color: 'var(--text-dim)' }}>{daysUntil(revision.revisionDate)}</span>}
          </div>
          {/* linha 2 — nome do subtópico */}
          <div className="text-sm font-medium truncate" style={{ color: 'var(--text-main)' }}>{subtopicName}</div>
          {/* linha 3 — data + reagendar */}
          <div className="flex items-center gap-2 mt-1.5">
            {editingDate ? (
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={newDate}
                  onChange={e => setNewDate(e.target.value)}
                  className="px-2 py-1 rounded-lg border text-xs outline-none"
                  style={{ background: 'var(--bg-surface-2)', borderColor: 'var(--border)', color: 'var(--text-main)' }}
                />
                <button onClick={handleReschedule} className="text-xs font-bold px-2 py-2 rounded-lg text-white min-h-[44px]" style={{ background: accent }}>Salvar</button>
                <button onClick={() => setEditingDate(false)} className="text-xs" style={{ color: 'var(--text-dim)' }}>×</button>
              </div>
            ) : (
              <button onClick={() => setEditingDate(true)} className="flex items-center gap-1 text-[11px] transition-opacity hover:opacity-70" style={{ color: 'var(--text-dim)' }}>📅 {fmtDate(revision.revisionDate)}</button>
            )}
          </div>
        </div>
        {/* ações */}
        <div className="flex flex-col gap-1.5 shrink-0">
          <button
            onClick={() => onStudy(revision)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white transition-all hover:opacity-90"
            style={{ background: accent }}
          >
            ▶ Estudar
          </button>
          <button
            onClick={() => {
              onComplete(revision.id, 5);
              toast.success(`R${revision.stage} Concluída! R${revision.stage + 1} agendada. +10 XP 🎓`, { style: { background: '#0a0d16', color: '#10B981', border: '1px solid #10B98133' } });
            }}
            className="px-3 py-2 rounded-xl text-xs font-black text-white transition-all active:scale-95 flex items-center justify-center gap-1"
            style={{ background: 'linear-gradient(135deg, #059669, #10B981)', boxShadow: '0 4px 20px rgba(16,185,129,0.2)' }}
          >
            ✓ Concluir R{revision.stage} → R{revision.stage + 1}
          </button>
          {!showScore ? (
            <button
              onClick={() => setShowScore(true)}
              className="px-3 py-1.5 rounded-xl text-xs font-bold border transition-all hover:bg-white/5"
              style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
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
                  onClick={() => { onComplete(revision.id, opt.score); setShowScore(false); }}
                  className="w-9 h-9 lg:w-7 lg:h-7 rounded-lg text-[10px] font-black text-white transition-all hover:opacity-90"
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
    </motion.div>
  );
}

// ── ManagerModal (kept from V2) ────────────────────────────────────────────

function ManagerModal({ onClose, subjects, revisions, getSubtopicName, onReschedule, onDelete }) {
  const [sid, setSid] = useState(''), [stid, setStid] = useState('');
  const subs = subjects.filter((s) => revisions.some((r) => r.subjectId === s.id));
  const subOpts = useMemo(() => { const m = new Map(); revisions.filter((r) => r.subjectId === sid).forEach((r) => m.set(r.subtopicId, getSubtopicName(r))); return [...m.entries()]; }, [revisions, sid, getSubtopicName]);
  const filtered = useMemo(() => revisions.filter((r) => !sid || r.subjectId === sid).filter((r) => !stid || r.subtopicId === stid).sort((a, b) => (b.completed ? b.completedAt : b.revisionDate || '').localeCompare(a.completed ? a.completedAt : a.revisionDate || '')), [revisions, sid, stid]);
  const inp = { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#e2e8f0' };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(12px)' }} onClick={onClose}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-2xl rounded-2xl overflow-hidden flex flex-col" style={{ background: 'rgba(15,18,30,0.95)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(40px)', maxHeight: '85vh' }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-white/5 flex-shrink-0">
          <div>
            <h3 className="font-bold text-sm text-zinc-100">🗂 Gerenciar revisões</h3>
            <p className="text-[11px] mt-0.5 text-zinc-500">Edite ou apague revisões por matéria/subtópico.</p>
          </div>
          <button onClick={onClose} className="w-10 h-10 lg:w-8 lg:h-8 flex items-center justify-center rounded-lg hover:bg-white/5 text-zinc-400">✕</button>
        </div>
        <div className="grid grid-cols-2 gap-2 p-4 border-b border-white/5 flex-shrink-0">
          <select value={sid} onChange={(e) => { setSid(e.target.value); setStid(''); }} className="px-3 py-2 rounded-xl text-sm outline-none" style={inp}>
            <option value="">Todas as matérias</option>
            {subs.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <select value={stid} onChange={(e) => setStid(e.target.value)} disabled={!sid} className="px-3 py-2 rounded-xl text-sm outline-none disabled:opacity-40" style={inp}>
            <option value="">Todos os subtópicos</option>
            {subOpts.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
          </select>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {!filtered.length && <p className="text-center text-xs py-8 text-zinc-600">Nenhuma revisão encontrada.</p>}
          {filtered.map((r) => {
            const subj = subjects.find((s) => s.id === r.subjectId) || { name: 'Excluída', color: '#555' };
            const sc = r.score === 5 ? '#10B981' : r.score === 3 ? '#F59E0B' : '#EF4444';
            return (
              <div key={r.id} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="w-2 h-2 rounded-full shrink-0" style={{ background: subj.color }} />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold uppercase tracking-wide truncate" style={{ color: subj.color }}>{subj.name} · {stageLabel(r.stage)}</div>
                  <div className="text-sm truncate text-zinc-200">{getSubtopicName(r)}</div>
                </div>
                {r.completed ? <span className="text-[10px] font-bold px-2 py-1 rounded-full shrink-0" style={{ background: `${sc}20`, color: sc }}>✓ {fmtDate(r.completedAt)}</span>
                  : <input type="date" value={r.revisionDate} onChange={(e) => onReschedule(r.id, e.target.value)} className="px-2 py-1.5 rounded-lg border text-xs outline-none shrink-0" style={inp} />}
                {!r.completed && <button onClick={() => onDelete(r.id)} className="w-9 h-9 lg:w-7 lg:h-7 rounded-lg flex items-center justify-center hover:bg-red-500/20 text-zinc-500 hover:text-red-400 shrink-0">🗑</button>}
              </div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}

// ── AdherenceStats (kept from V2) ──────────────────────────────────────────

function AdherenceStats({ history }) {
  if (!history.length) return null;
  const onTime = history.filter((r) => r.completedAt && r.completedAt <= r.revisionDate).length;
  const onTimePct = Math.round((onTime / history.length) * 100);
  const sc = { 5: 0, 3: 0, 1: 0 };
  history.forEach((r) => { if (sc[r.score] !== undefined) sc[r.score]++; });
  const total = sc[5] + sc[3] + sc[1];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      <BentoCard>
        <SectionHeader title="Aderência ao prazo" icon="📊" />
        <div className="flex items-center gap-3">
          <div className="text-2xl font-black shrink-0" style={{ color: onTimePct >= 70 ? '#10B981' : onTimePct >= 40 ? '#F59E0B' : '#EF4444' }}>{onTimePct}%</div>
          <div className="flex-1 h-2.5 rounded-full overflow-hidden" style={{ background: 'rgba(239,68,68,0.15)' }}>
            <div className="h-full rounded-full transition-all" style={{ width: `${onTimePct}%`, background: '#10B981' }} />
          </div>
        </div>
        <div className="flex justify-between text-[10px] mt-2 text-zinc-500">
          <span>✅ {onTime} no prazo</span>
          <span>⚠ {history.length - onTime} atrasadas</span>
        </div>
      </BentoCard>
      <BentoCard>
        <SectionHeader title="Avaliações" icon="📝" />
        <div className="space-y-1.5">
          {[{ s: 5, l: 'Fácil', c: '#10B981' }, { s: 3, l: 'Médio', c: '#F59E0B' }, { s: 1, l: 'Difícil', c: '#EF4444' }].map((o) => {
            const pct = total > 0 ? Math.round((sc[o.s] / total) * 100) : 0;
            return (
              <div key={o.s} className="flex items-center gap-2">
                <span className="text-[10px] w-12 shrink-0 font-bold" style={{ color: o.c }}>{o.l}</span>
                <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
                  <div className="h-full rounded-full" style={{ width: `${pct}%`, background: o.c }} />
                </div>
                <span className="text-[10px] w-8 text-right shrink-0 text-zinc-500">{sc[o.s]}</span>
              </div>
            );
          })}
        </div>
      </BentoCard>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────

export default function StudyRevisionsPage() {
  const navigate = useNavigate();
  const revisions = useRevisionStore((s) => s.revisions);
  const completeRevision = useRevisionStore((s) => s.completeRevision);
  const editRevisionDate = useRevisionStore((s) => s.editRevisionDate);
  const deleteRevision = useRevisionStore((s) => s.deleteRevision);
  const getHealthSummary = useRevisionStore((s) => s.getHealthSummary);
  const getUpcomingByDay = useRevisionStore((s) => s.getUpcomingByDay);
  const subjects = useStudyStore((s) => s.subjects);
  const [filterSubject, setFilterSubject] = useState('');
  const [tab, setTab] = useState('pending');
  const [managerOpen, setManagerOpen] = useState(false);
  const openSessionModal = useSessionModalStore((s) => s.openModal);
  const ts = today();
  const health = getHealthSummary();
  const upcoming = getUpcomingByDay(14);

  const getSubtopicName = (r) => {
    const subj = subjects.find((s) => s.id === r.subjectId);
    let name = r.subtopicId;
    subj?.topics?.forEach((t) => t.subtopics?.forEach((st) => { if (st.id === r.subtopicId) name = st.name; }));
    return name || '—';
  };

  const pending = useMemo(() => revisions.filter((r) => !r.completed && r.revisionDate <= ts).filter((r) => !filterSubject || r.subjectId === filterSubject).sort((a, b) => a.revisionDate.localeCompare(b.revisionDate)), [revisions, ts, filterSubject]);
  const upcomingRevisions = useMemo(() => revisions.filter((r) => !r.completed && r.revisionDate > ts).filter((r) => !filterSubject || r.subjectId === filterSubject).sort((a, b) => a.revisionDate.localeCompare(b.revisionDate)), [revisions, ts, filterSubject]);
  const history = useMemo(() => revisions.filter((r) => r.completed).filter((r) => !filterSubject || r.subjectId === filterSubject).sort((a, b) => (b.completedAt || '').localeCompare(a.completedAt || '')), [revisions, filterSubject]);

  const handleStudy = (r) => openSessionModal({ preSubjectId: r.subjectId, preTopicId: r.topicId, preSubtopicId: r.subtopicId, preMode: 'revisao', revisionId: r.id });
  const handleComplete = (id, score) => completeRevision(id, score);
  const handleReschedule = (id, date) => editRevisionDate(id, date);
  const handleDelete = (id) => { if (window.confirm('Excluir esta revisão?')) deleteRevision(id); };

  const subjectOptions = subjects.filter((s) => revisions.some((r) => r.subjectId === s.id));
  const tabs = [
    { id: 'pending', label: `Pendentes (${pending.length})` },
    { id: 'upcoming', label: `Próximas (${upcomingRevisions.length})` },
    { id: 'history', label: 'Histórico' },
  ];
  const kpis = [
    { label: 'Atrasadas', value: health.overdue, color: health.overdue > 0 ? '#EF4444' : '#10B981' },
    { label: 'Hoje', value: health.today, color: '#F59E0B' },
    { label: 'Futuras', value: health.upcoming, color: '#8B5CF6' },
  ];

  return (
    <StudyLayout>
      <div className="flex flex-col max-h-[calc(100vh-80px)] overflow-y-auto custom-scrollbar pr-1 pb-10 space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-zinc-100">Revisões</h1>
            <p className="text-sm mt-1 text-zinc-500">Espaçamento inteligente R1→R6 — cada revisão fortalece a memória de longo prazo.</p>
          </div>
          <button onClick={() => setManagerOpen(true)} className="px-3 py-2 rounded-xl text-xs font-bold border transition-all whitespace-nowrap hover:bg-white/5" style={{ borderColor: 'rgba(255,255,255,0.1)', color: '#e2e8f0' }}>🗂 Gerenciar</button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {kpis.map((k) => (
            <BentoCard key={k.label} className="text-center">
              <motion.div key={k.value} initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="text-2xl font-black" style={{ color: k.color }}>{k.value}</motion.div>
              <div className="text-[10px] font-bold uppercase tracking-widest mt-1 text-zinc-500">{k.label}</div>
            </BentoCard>
          ))}
        </div>

        {subjectOptions.length > 1 && (
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => setFilterSubject('')} className="px-3 py-1.5 rounded-full text-xs font-bold border transition-all" style={{ borderColor: !filterSubject ? '#8B5CF6' : 'rgba(255,255,255,0.08)', background: !filterSubject ? 'rgba(139,92,246,0.2)' : 'transparent', color: !filterSubject ? '#c4b5fd' : '#71717a' }}>Todas</button>
            {subjectOptions.map((s) => (
              <button key={s.id} onClick={() => setFilterSubject(s.id === filterSubject ? '' : s.id)} className="px-3 py-1.5 rounded-full text-xs font-bold border transition-all" style={{ borderColor: filterSubject === s.id ? s.color : 'rgba(255,255,255,0.08)', background: filterSubject === s.id ? `${s.color}18` : 'transparent', color: filterSubject === s.id ? s.color : '#71717a' }}>{s.name}</button>
            ))}
          </div>
        )}

        <TabBar tabs={tabs} active={tab} onChange={setTab} />

        <AnimatePresence mode="wait">
          {tab === 'pending' && (
            <motion.div key="p" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-3">
              {!pending.length ? <EmptyState icon="✅" title="Nenhuma revisão pendente" description="Excelente! Você está em dia com todas as revisões." />
                : pending.map((r) => <RevisionCard key={r.id} revision={r} subject={subjects.find((s) => s.id === r.subjectId) || { name: 'Excluída', color: '#555' }} subtopicName={getSubtopicName(r)} onStudy={handleStudy} onComplete={handleComplete} onReschedule={handleReschedule} />)}
            </motion.div>
          )}
          {tab === 'upcoming' && (
            <motion.div key="u" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-3">
              {upcoming.some((d) => d.count > 0) && (
                <BentoCard>
                  <SectionHeader title="Carga dos próximos 14 dias" icon="📅" />
                  <div className="flex items-end gap-1 h-12">
                    {upcoming.map((d, i) => {
                      const max = Math.max(...upcoming.map((x) => x.count), 1);
                      const pct = (d.count / max) * 100;
                      const [, m, day] = d.date.split('-');
                      return (
                        <div key={i} className="flex-1 flex flex-col items-center gap-1">
                          <div className="w-full rounded-sm transition-all" style={{ height: `${Math.max(pct, 4)}%`, background: d.count > 0 ? '#8B5CF6' : 'rgba(255,255,255,0.05)', minHeight: d.count > 0 ? 4 : 2, opacity: d.count > 0 ? 1 : 0.3 }} title={`${day}/${m} — ${d.count}`} />
                          {i % 3 === 0 && <div className="text-[10px] lg:text-[8px] text-zinc-600">{day}/{m}</div>}
                        </div>
                      );
                    })}
                  </div>
                </BentoCard>
              )}
              {!upcomingRevisions.length ? <EmptyState icon="📅" title="Sem revisões agendadas" description="Nenhuma revisão futura nos próximos dias." />
                : upcomingRevisions.map((r) => <RevisionCard key={r.id} revision={r} subject={subjects.find((s) => s.id === r.subjectId) || { name: 'Excluída', color: '#555' }} subtopicName={getSubtopicName(r)} onStudy={handleStudy} onComplete={handleComplete} onReschedule={handleReschedule} />)}
            </motion.div>
          )}
          {tab === 'history' && (
            <motion.div key="h" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
              <AdherenceStats history={history} />
              <div className="space-y-2">
                {!history.length ? <EmptyState icon="📚" title="Nenhuma revisão concluída" description="Complete suas primeiras revisões para ver o histórico aqui." />
                  : history.slice(0, 50).map((r) => {
                    const subj = subjects.find((s) => s.id === r.subjectId) || { name: 'Excluída', color: '#555' };
                    const sc = r.score === 5 ? '#10B981' : r.score === 3 ? '#F59E0B' : '#EF4444';
                    const sl = r.score === 5 ? 'Fácil' : r.score === 3 ? 'Médio' : 'Difícil';
                    return (
                      <motion.div key={r.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-3 px-4 py-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <div className="w-2 h-2 rounded-full shrink-0" style={{ background: subj.color }} />
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-bold uppercase tracking-wide" style={{ color: subj.color }}>{subj.name}</div>
                          <div className="text-sm font-medium truncate text-zinc-200">{getSubtopicName(r)}</div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Badge>{stageLabel(r.stage)}</Badge>
                          {r.score && <Badge style={{ color: sc, background: `${sc}20` }}>{sl}</Badge>}
                          <span className="text-[10px] text-zinc-500">{r.completedAt ? fmtDate(r.completedAt) : ''}</span>
                        </div>
                      </motion.div>
                    );
                  })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <AnimatePresence>
        {managerOpen && <ManagerModal onClose={() => setManagerOpen(false)} subjects={subjects} revisions={revisions} getSubtopicName={getSubtopicName} onReschedule={handleReschedule} onDelete={handleDelete} />}
      </AnimatePresence>
    </StudyLayout>
  );
}
