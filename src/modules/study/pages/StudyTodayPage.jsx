import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { RefreshCw } from 'lucide-react';
import clsx from 'clsx';
import { useSessionStore } from '../../../stores/useSessionStore';
import { useRevisionStore } from '../../../stores/useRevisionStore';
import { useCycleStore } from '../../../stores/useCycleStore';
import { useStudyStore } from '../../../stores/useStudyStore';
import { useConcursoStore } from '../../../stores/useConcursoStore';
import { useSessionModalStore } from '../../../stores/useSessionModalStore';
import { formatMinutes, daysUntil, today } from '../../../shared/utils/time';
import { StudyLayout } from '../components/StudyLayout';
import { BentoCard, KPITile, SectionHeader, ProgressRing, Badge } from '../components/BentoCard';

function minutesToHuman(min) {
  if (!min && min !== 0) return '—';
  if (min < 60) return `${min}min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

function fmtDate(d) {
  if (!d) return '';
  const [, m, day] = d.split('-');
  return `${day}/${m}`;
}

const STATUS_CONFIG = {
  nao_estudado: { label: 'Não Estudado', color: '#94A3B8', icon: '○' },
  estudando: { label: 'Estudando', color: '#F59E0B', icon: '◐' },
  revisao: { label: 'Revisão', color: '#06B6D4', icon: '⚡' },
  dominado: { label: 'Concluído', color: '#10B981', icon: '✓' },
};

const R1_R7_COLORS = {
  1: '#EF4444', 2: '#F97316', 3: '#F59E0B', 4: '#EAB308',
  5: '#84CC16', 6: '#22C55E', 7: '#10B981',
};

const REVISION_STAGES = [
  { num: 1, label: 'R1' },
  { num: 2, label: 'R3' },
  { num: 3, label: 'R7' },
  { num: 4, label: 'R15' },
  { num: 5, label: 'R30' },
  { num: 6, label: 'R60' },
  { num: 7, label: 'R🔄' },
];

function StreakTile({ streak, xp }) {
  return (
    <BentoCard span="4/12" className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-dim)' }}>
          Streak
        </span>
        <motion.span
          className="text-xl"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          🔥
        </motion.span>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-black" style={{ color: '#F59E0B' }}>
          {streak || 0}
        </span>
        <span className="text-xs font-medium" style={{ color: 'var(--text-dim)' }}>
          dias
        </span>
      </div>
      {xp > 0 && (
        <span className="text-[10px] font-bold" style={{ color: 'var(--accent)' }}>
          +{xp} XP hoje
        </span>
      )}
    </BentoCard>
  );
}

function TodayTile({ minutes }) {
  const pct = Math.min((minutes / 240) * 100, 100);
  return (
    <BentoCard span="4/12" className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-dim)' }}>
          Hoje
        </span>
        <span className="text-xl">⏱️</span>
      </div>
      <div className="flex items-center gap-3">
        <ProgressRing value={pct} size={44} stroke={4} color="#10B981" />
        <div>
          <span className="text-lg font-black" style={{ color: 'var(--text-main)' }}>
            {minutesToHuman(minutes)}
          </span>
          <p className="text-[10px]" style={{ color: 'var(--text-dim)' }}>
            meta: 4h
          </p>
        </div>
      </div>
    </BentoCard>
  );
}

function ProvaTile({ prova, days }) {
  if (!prova) {
    return (
      <BentoCard span="4/12" className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-dim)' }}>
            Próxima Prova
          </span>
          <span className="text-xl">🎯</span>
        </div>
        <span className="text-xs" style={{ color: 'var(--text-dim)' }}>
          Nenhuma prova agendada
        </span>
      </BentoCard>
    );
  }

  const color = days <= 7 ? '#EF4444' : days <= 30 ? '#F59E0B' : '#10B981';

  return (
    <BentoCard span="4/12" className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-dim)' }}>
          Próxima Prova
        </span>
        <span className="text-xl">🎯</span>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-black" style={{ color }}>
          {days}
        </span>
        <span className="text-xs font-medium" style={{ color: 'var(--text-dim)' }}>
          dias
        </span>
      </div>
      <span className="text-[10px] font-bold truncate" style={{ color }}>
        {prova.nome}
      </span>
    </BentoCard>
  );
}

function SubjectAccordion({ subject, isOpen, onToggle, onNavigate }) {
  const totalSubtopics = (subject.topics || []).reduce(
    (acc, t) => acc + (t.subtopics || []).length, 0
  );
  const completedSubtopics = (subject.topics || []).reduce(
    (acc, t) => acc + (t.subtopics || []).filter(st => st.status === 'dominado').length, 0
  );
  const progressPct = totalSubtopics > 0 ? Math.round((completedSubtopics / totalSubtopics) * 100) : 0;

  return (
    <motion.div
      layout
      className="rounded-2xl border overflow-hidden transition-colors"
      style={{
        borderColor: isOpen ? (subject.color || 'rgba(255,255,255,0.1)') : 'rgba(255,255,255,0.06)',
        background: isOpen ? 'rgba(255,255,255,0.03)' : 'transparent',
      }}
    >
      <button
        onClick={onToggle}
        className="w-full text-left p-4 flex items-center justify-between hover:bg-white/[0.02] transition-all gap-3"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-3 h-3 rounded-full shrink-0"
            style={{ background: subject.color || 'var(--primary)' }}
          />
          <div className="min-w-0">
            <h3 className="text-sm font-bold tracking-wide truncate" style={{ color: 'var(--text-main)' }}>
              {subject.name}
            </h3>
            <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-dim)' }}>
              {totalSubtopics} subtópicos · {completedSubtopics} concluídos
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <ProgressRing value={progressPct} size={32} stroke={3} color={subject.color} />
          <span className="text-xs font-mono font-bold" style={{ color: 'var(--text-main)' }}>
            {progressPct}%
          </span>
        </div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-2">
              {(subject.topics || []).map(topic => (
                <div key={topic.id} className="space-y-1">
                  <div className="text-[10px] font-bold uppercase tracking-wider px-2 py-1" style={{ color: 'var(--text-dim)' }}>
                    {topic.name}
                  </div>
                  {(topic.subtopics || []).map(sub => {
                    const st = STATUS_CONFIG[sub.status] || STATUS_CONFIG.nao_estudado;
                    return (
                      <div
                        key={sub.id}
                        className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-white/[0.03] transition-all cursor-pointer"
                        onClick={() => onNavigate(`/study/subjects/${subject.id}`)}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-[10px]" style={{ color: st.color }}>{st.icon}</span>
                          <span className="text-xs truncate" style={{ color: 'var(--text-main)' }}>
                            {sub.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {sub.revisionStage > 0 && (
                            <Badge color={R1_R7_COLORS[sub.revisionStage]} variant="solid">
                              R{sub.revisionStage}
                            </Badge>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
              <button
                onClick={() => onNavigate(`/study/subjects/${subject.id}`)}
                className="w-full mt-2 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider border border-white/10 hover:bg-white/[0.05] transition-all"
                style={{ color: subject.color || 'var(--primary)' }}
              >
                Abrir matéria →
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function RevisionCard({ revision, subjectName, accent = '#A855F7', onComplete }) {
  const [showScore, setShowScore] = useState(false);
  const isOverdue = revision.revisionDate < today();

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex flex-col gap-2 p-3 rounded-xl border border-white/[0.06] hover:bg-white/[0.03] transition-all"
    >
      {/* Top row: subject name + date */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-bold truncate" style={{ color: 'var(--text-main)' }}>
          {subjectName}
        </span>
        <span className="text-[10px] shrink-0" style={{ color: isOverdue ? '#EF4444' : 'var(--text-dim)' }}>
          {isOverdue ? 'Atrasada' : fmtDate(revision.revisionDate)}
        </span>
      </div>

      {/* R1-R7 stage badges */}
      <div className="flex gap-1 items-center flex-wrap">
        {REVISION_STAGES.map((st) => {
          const isActive = st.num === 7 ? revision.stage >= 7 : revision.stage === st.num;
          const isCompleted = revision.stage > st.num;
          return (
            <span
              key={st.num}
              className={clsx(
                "text-[9px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-0.5 transition-all select-none",
                isActive
                  ? "ring-2 font-black shadow-[0_0_8px_rgba(168,85,247,0.3)]"
                  : isCompleted
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                    : "bg-white/5 text-zinc-500"
              )}
              style={{
                color: isActive ? accent : undefined,
                background: isActive ? `${accent}20` : undefined,
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

      {/* Score buttons */}
      <div className="flex items-center justify-between">
        <div />
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
            {[{ score: 5, label: 'F', color: '#10B981' }, { score: 3, label: 'M', color: '#F59E0B' }, { score: 1, label: 'D', color: '#EF4444' }].map(opt => (
              <button
                key={opt.score}
                onClick={() => { onComplete(revision.id, opt.score); setShowScore(false); }}
                className="w-7 h-7 rounded-lg text-[10px] font-black text-white transition-all hover:opacity-90"
                style={{ background: opt.color }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

function SessionCard({ session, subjectName }) {
  const modeLabels = {
    leitura: { label: 'Leitura', icon: '📖' },
    revisao: { label: 'Revisão', icon: '🔁' },
    exercicios: { label: 'Exercícios', icon: '✏️' },
    simulado: { label: 'Simulado', icon: '📝' },
    fpf: { label: 'FPF', icon: '🎯' },
    audio: { label: 'Áudio', icon: '🎧' },
    video: { label: 'Vídeo', icon: '🎬' },
    mapa: { label: 'Mapa', icon: '🗺️' },
    flashcards: { label: 'Flashcards', icon: '🃏' },
  };
  const mode = modeLabels[session.mode] || { label: session.mode, icon: '📄' };

  return (
    <div className="p-3 rounded-xl border border-white/[0.06] hover:bg-white/[0.03] transition-all">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] font-bold" style={{ color: 'var(--text-main)' }}>
          {subjectName || 'Geral'}
        </span>
        <span className="text-[10px]" style={{ color: 'var(--text-dim)' }}>
          {mode.icon} {mode.label}
        </span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-lg font-black" style={{ color: 'var(--text-main)' }}>
          {minutesToHuman(session.duration)}
        </span>
        <span className="text-[9px]" style={{ color: 'var(--text-dim)' }}>
          {session.date ? new Date(session.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : ''}
        </span>
      </div>
    </div>
  );
}

function EmptyState({ onStart }) {
  return (
    <BentoCard span="full" className="text-center py-10">
      <motion.div
        className="text-4xl mb-3"
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      >
        📚
      </motion.div>
      <h3 className="text-sm font-bold mb-1" style={{ color: 'var(--text-main)' }}>
        Nenhuma sessão hoje ainda
      </h3>
      <p className="text-xs mb-5 max-w-xs mx-auto" style={{ color: 'var(--text-dim)' }}>
        O profissional bate o ponto. 20 minutos já bastam para manter a engrenagem girando.
      </p>
      <button
        onClick={onStart}
        className="px-8 py-3 rounded-2xl text-sm font-bold text-white transition-all hover:scale-105 active:scale-95"
        style={{ background: 'linear-gradient(135deg, var(--primary), var(--accent))' }}
      >
        Iniciar primeira sessão
      </button>
    </BentoCard>
  );
}

export default function StudyTodayPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [openSubjects, setOpenSubjects] = useState({});
  const [revisionFilter, setRevisionFilter] = useState('all');

  const navigate = useNavigate();
  const subjects = useStudyStore(s => s.subjects);
  const sessions = useSessionStore(s => s.sessions);
  const revisions = useRevisionStore(s => s.revisions);
  const completeRevision = useRevisionStore(s => s.completeRevision);
  const cycles = useCycleStore(s => s.cycles);
  const activeCycleId = useCycleStore(s => s.activeCycleId);
  const concursos = useConcursoStore(s => s.concursos);
  const openModal = useSessionModalStore(s => s.openModal);

  const todayStr = today();

  // Today stats
  const todaySessions = useMemo(
    () => sessions.filter(s => s.date && s.date.startsWith(todayStr)),
    [sessions, todayStr]
  );
  const todayMinutes = useMemo(
    () => todaySessions.reduce((sum, s) => sum + (s.duration || 0), 0),
    [todaySessions]
  );
  const todayXP = useMemo(
    () => todaySessions.reduce((sum, s) => sum + (s.xp || 0), 0),
    [todaySessions]
  );

  // Streak
  const streak = useMemo(() => {
    const store = useSessionStore.getState();
    return store.getStreak ? store.getStreak() : 0;
  }, [sessions]);

  // Next prova
  const nextProva = useMemo(() => {
    const todayDate = new Date();
    let closest = null;
    let closestDays = Infinity;
    for (const c of concursos) {
      for (const p of c.provas || []) {
        if (p.dataProva) {
          const d = daysUntil(p.dataProva);
          if (d > 0 && d < closestDays) {
            closestDays = d;
            closest = { ...p, concursoName: c.name };
          }
        }
      }
    }
    return closest;
  }, [concursos]);

  // Active cycle
  const activeCycle = useMemo(
    () => cycles.find(c => c.id === activeCycleId) || null,
    [cycles, activeCycleId]
  );

  // Revisions — all uncompleted (not just <= today, so "Próximas" filter works)
  const pendingRevisions = useMemo(() => {
    return revisions
      .filter(r => !r.completed)
      .sort((a, b) => a.revisionDate.localeCompare(b.revisionDate));
  }, [revisions]);
  const enrichedPendingRevisions = useMemo(() => {
    const filtered = revisionFilter === 'all'
      ? pendingRevisions
      : pendingRevisions.filter(r => {
          if (revisionFilter === 'overdue') return r.revisionDate < todayStr;
          if (revisionFilter === 'today') return r.revisionDate === todayStr;
          if (revisionFilter === 'upcoming') return r.revisionDate > todayStr;
          return true;
        });
    return filtered.map(r => {
      const subject = subjects.find(s => s.id === r.subjectId);
      return { ...r, subjectName: subject?.name || 'Desconhecida' };
    });
  }, [pendingRevisions, revisionFilter, subjects, todayStr]);

  const revisionStats = useMemo(() => {
    const total = pendingRevisions.length;
    const overdue = pendingRevisions.filter(r => r.revisionDate < todayStr).length;
    const todayCount = pendingRevisions.filter(r => r.revisionDate === todayStr).length;
    const upcoming = pendingRevisions.filter(r => r.revisionDate > todayStr).length;
    return { total, overdue, today: todayCount, upcoming };
  }, [pendingRevisions, todayStr]);

  // Subject filter
  const filteredSubjects = useMemo(() => {
    if (!searchQuery) return subjects;
    const q = searchQuery.toLowerCase();
    return subjects.filter(s => s.name.toLowerCase().includes(q));
  }, [subjects, searchQuery]);

  const toggleSubject = id => setOpenSubjects(prev => ({ ...prev, [id]: !prev[id] }));

  const handleStartSession = () => openModal();
  const handleCompleteRevision = (id, score) => {
    completeRevision(id, score);
    toast.success('Revisão concluída! ✓');
  };

  return (
    <StudyLayout>
      <div className="flex flex-col pb-10 space-y-5">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight" style={{ color: 'var(--text-main)' }}>
              Hoje
            </h1>
            <p className="text-sm mt-1" style={{ color: 'var(--text-dim)' }}>
              {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>
        </div>

        {/* KPI Row */}
        <div className="grid grid-cols-12 gap-4">
          <StreakTile streak={streak} xp={todayXP} />
          <TodayTile minutes={todayMinutes} />
          <ProvaTile prova={nextProva} days={nextProva ? daysUntil(nextProva.dataProva) : null} />
        </div>

        {/* Ciclo inline badge */}
        {activeCycle && (
          <div className="flex items-center gap-2 text-xs">
            <span className="font-bold" style={{ color: 'var(--text-dim)' }}>Ciclo:</span>
            <a
              href="/study/cycle"
              className="font-bold px-2 py-0.5 rounded-lg transition-all hover:bg-white/[0.06]"
              style={{ color: 'var(--accent)', background: 'rgba(168,85,247,0.1)' }}
            >
              {activeCycle.name || 'Ciclo Atual'}
            </a>
          </div>
        )}

        {/* Main Grid: Edital + Revisões */}
        <div className="grid grid-cols-12 gap-5">
          {/* Left: Progresso do Edital */}
          <div className="col-span-12 lg:col-span-7 space-y-3">
            <SectionHeader title="Progresso do Edital" count={`${subjects.length} Matérias`} icon="📚" />

            {/* Search inside edital section */}
            <div className="relative w-full">
              <span className="absolute left-3 top-2.5 text-xs" style={{ color: 'var(--text-dim)' }}>🔍</span>
              <input
                type="text"
                placeholder="Pesquisar no edital..."
                className="w-full pl-8 pr-3 py-2.5 rounded-xl text-xs outline-none transition-all backdrop-blur-xl bg-white/[0.04] border border-white/[0.08] focus:border-white/[0.2]"
                style={{ color: 'var(--text-main)' }}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-3">
              {filteredSubjects.length === 0 ? (
                <BentoCard span="full" className="text-center py-8">
                  <div className="text-2xl mb-2">📚</div>
                  <div className="text-xs font-bold" style={{ color: 'var(--text-main)' }}>
                    Nenhuma matéria encontrada
                  </div>
                  <div className="text-[10px] mt-1" style={{ color: 'var(--text-dim)' }}>
                    Cadastre novas matérias na aba Matérias
                  </div>
                </BentoCard>
              ) : (
                filteredSubjects.map(subject => (
                  <SubjectAccordion
                    key={subject.id}
                    subject={subject}
                    isOpen={!!openSubjects[subject.id]}
                    onToggle={() => toggleSubject(subject.id)}
                    onNavigate={navigate}
                  />
                ))
              )}
            </div>
          </div>

          {/* Right: Revisões */}
          <div className="col-span-12 lg:col-span-5 space-y-5">
            {/* Revisões Pendentes */}
            <div className="space-y-3">
              <SectionHeader title="Revisões Pendentes" count={revisionStats.total} icon="🔄" />

              {/* Filters */}
              <div className="flex gap-1.5 flex-wrap">
                {[
                  { key: 'all', label: 'Todas', count: revisionStats.total, color: '#06B6D4' },
                  { key: 'overdue', label: 'Atrasadas', count: revisionStats.overdue, color: '#EF4444' },
                  { key: 'today', label: 'Hoje', count: revisionStats.today, color: '#10B981' },
                  { key: 'upcoming', label: 'Próximas', count: revisionStats.upcoming, color: '#F59E0B' },
                ].map(f => (
                  <button
                    key={f.key}
                    onClick={() => setRevisionFilter(f.key)}
                    className="px-2 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all border"
                    style={
                      revisionFilter === f.key
                        ? { color: f.color, background: `${f.color}15`, borderColor: `${f.color}40` }
                        : { borderColor: 'rgba(255,255,255,0.06)', color: 'var(--text-dim)' }
                    }
                  >
                    {f.label} ({f.count})
                  </button>
                ))}
              </div>

              {enrichedPendingRevisions.length === 0 ? (
                <BentoCard span="full" className="text-center py-6">
                  <motion.div
                    className="text-2xl mb-2"
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    ✓
                  </motion.div>
                  <div className="text-xs font-bold" style={{ color: 'var(--text-main)' }}>
                    Tudo em dia!
                  </div>
                  <div className="text-[10px]" style={{ color: 'var(--text-dim)' }}>
                    Nenhuma revisão acumulada
                  </div>
                </BentoCard>
              ) : (
                <div className="flex flex-col gap-2 max-h-[350px] overflow-y-auto custom-scrollbar pr-1">
                  {enrichedPendingRevisions.map(rev => (
                    <RevisionCard
                      key={rev.id}
                      revision={rev}
                      subjectName={rev.subjectName}
                      onComplete={handleCompleteRevision}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Últimas Sessões */}
        {todaySessions.length > 0 && (
          <div className="space-y-3">
            <SectionHeader title="Sessões de Hoje" count={todaySessions.length} icon="📋" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {todaySessions.slice(0, 6).map(session => {
                const subject = subjects.find(s => s.id === session.subjectId);
                return (
                  <SessionCard
                    key={session.id}
                    session={session}
                    subjectName={subject?.name}
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* Empty State */}
        {todaySessions.length === 0 && (
          <EmptyState onStart={handleStartSession} />
        )}
      </div>
    </StudyLayout>
  );
}
