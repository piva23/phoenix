import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStudyStore } from '../../../stores/useStudyStore';
import { useSessionStore } from '../../../stores/useSessionStore';
import { useRevisionStore } from '../../../stores/useRevisionStore';
import { useCycleStore } from '../../../stores/useCycleStore';
import { useSessionModalStore } from '../../../stores/useSessionModalStore';
import { formatMinutes } from '../../../shared/utils/time';
import { StudyLayout } from '../components/StudyLayout';
import { BentoCard, SectionHeader, ProgressRing, Badge } from '../components/BentoCard';
import { motion, AnimatePresence } from 'framer-motion';
import { MoreVertical, RefreshCw, Play } from 'lucide-react';
import toast from 'react-hot-toast';

const REV_LABELS = [
  { num: 1, label: 'R1' }, { num: 2, label: 'R3' }, { num: 3, label: 'R7' },
  { num: 4, label: 'R15' }, { num: 5, label: 'R30' }, { num: 6, label: 'R60' },
  { num: 7, label: 'R🔄' },
];

const MODE_LABELS = {
  leitura: { label: 'Leitura', icon: '📖' },
  video: { label: 'Videoaula', icon: '▶️' },
  questoes: { label: 'Questões', icon: '🎯' },
  revisao: { label: 'Revisão', icon: '🔄' },
  mapa: { label: 'Mapa Mental', icon: '🗺️' },
};

function fmtDate(d) { if (!d) return ''; const [, m, day] = d.split('-'); return `${day}/${m}`; }

const cardVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.2 } },
};

const collapseVariants = {
  open: { height: 'auto', opacity: 1, transition: { duration: 0.3, ease: 'easeOut' } },
  closed: { height: 0, opacity: 0, transition: { duration: 0.25, ease: 'easeIn' } },
};

function RevBadges({ currentStage, accent }) {
  return (
    <div className="flex gap-1 items-center flex-wrap mt-1">
      {REV_LABELS.map(st => {
        const isActive = st.num === 7 ? currentStage >= 7 : currentStage === st.num;
        const isCompleted = currentStage > st.num;
        return (
          <span
            key={st.num}
            className="text-[10px] lg:text-[8px] font-bold px-1.5 py-0.5 rounded-md transition-all select-none"
            style={{
              color: isActive ? accent : isCompleted ? '#10B981' : '#71717a',
              background: isActive ? `${accent}20` : isCompleted ? '#10B98115' : '#ffffff08',
              border: isActive ? `1px solid ${accent}40` : isCompleted ? '1px solid #10B98125' : 'none',
              boxShadow: isActive ? `0 0 8px ${accent}30` : undefined,
            }}
          >
            {st.num === 7 ? (
              <span className="flex items-center gap-0.5">R<RefreshCw size={7} className={isActive ? 'animate-spin-slow' : ''} /></span>
            ) : st.label}
          </span>
        );
      })}
    </div>
  );
}

function ContextMenu({ subtopicId, topicId, subjectId, revisions, editRevisionDate, editRevision, onClose }) {
  const [open, setOpen] = useState(false);
  const forceRevisionTomorrow = (e) => {
    e.stopPropagation();
    setOpen(false);
    onClose();
    const active = revisions.find(r => r.subtopicId === subtopicId && !r.completed);
    const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
    if (active) {
      editRevisionDate(active.id, tomorrow);
    } else {
      useRevisionStore.setState(s => ({
        revisions: [...s.revisions, {
          id: `rev_${Date.now()}`, subjectId, topicId, subtopicId,
          stage: 1, revisionDate: tomorrow, completed: false, score: null, completedAt: null,
        }],
      }));
    }
    toast.success("Revisão agendada para amanhã!");
  };

  const regressToR1 = (e) => {
    e.stopPropagation();
    setOpen(false);
    onClose();
    const active = revisions.find(r => r.subtopicId === subtopicId && !r.completed);
    const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
    if (active) {
      editRevision(active.id, { stage: 1 });
      editRevisionDate(active.id, tomorrow);
    } else {
      useRevisionStore.setState(s => ({
        revisions: [...s.revisions, {
          id: `rev_${Date.now()}`, subjectId, topicId, subtopicId,
          stage: 1, revisionDate: tomorrow, completed: false, score: null, completedAt: null,
        }],
      }));
    }
    toast.success("Regredido para R1! Revisão para amanhã.");
  };

  return (
    <div className="relative" onClick={e => e.stopPropagation()}>
      <button onClick={() => setOpen(!open)} className="p-2 lg:p-1 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white transition-colors">
        <MoreVertical size={14} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            className="absolute right-0 mt-1 w-44 bg-[#0A0B10]/95 backdrop-blur-2xl border border-white/10 rounded-xl shadow-2xl z-50 p-1"
          >
            <button onClick={forceRevisionTomorrow} className="w-full text-left px-3 py-2 text-[11px] font-bold text-zinc-300 hover:text-white hover:bg-purple-500/20 rounded-lg transition-colors">
              🗓️ Forçar revisão amanhã
            </button>
            <button onClick={regressToR1} className="w-full text-left px-3 py-2 text-[11px] font-bold text-zinc-300 hover:text-white hover:bg-rose-500/20 rounded-lg transition-colors">
              🔄 Regredir para R1
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function StudySubjectDetailPage() {
  const { subjectId } = useParams();
  const navigate = useNavigate();
  const openSessionModal = useSessionModalStore(s => s.openModal);
  const { subjects, addTopic, updateTopic, deleteTopic, reorderTopics, addSubtopic, updateSubtopic, deleteSubtopic } = useStudyStore();
  const sessions = useSessionStore(s => s.sessions);
  const getPendingToday = useRevisionStore(s => s.getPendingToday);
  const cycles = useCycleStore(s => s.cycles);
  const activeCycleId = useCycleStore(s => s.activeCycleId);
  const revisions = useRevisionStore(s => s.revisions);
  const editRevisionDate = useRevisionStore(s => s.editRevisionDate);
  const editRevision = useRevisionStore(s => s.editRevision);

  const [menuOpenSubtopicId, setMenuOpenSubtopicId] = useState(null);
  const [newTopicName, setNewTopicName] = useState('');
  const [newSubtopicData, setNewSubtopicData] = useState({ topicId: null, name: '' });
  const [editingTopic, setEditingTopic] = useState({ id: null, name: '' });
  const [editingSubtopic, setEditingSubtopic] = useState({ id: null, topicId: null, name: '' });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [collapsedTopics, setCollapsedTopics] = useState({});
  const [dragId, setDragId] = useState(null);
  const [overId, setOverId] = useState(null);

  const subject = subjects.find(s => s.id === subjectId);

  const cycleProgress = useMemo(() => {
    const cycle = cycles.find(c => c.id === activeCycleId);
    if (!cycle) return null;
    const item = cycle.items?.find(i => i.subjectId === subjectId);
    if (!item) return null;
    const metaMin = (item.horasPorRodada || 1) * 60;
    const roundStart = cycle.rodadaStartDate || '2000-01-01';
    const realMin = sessions.filter(s => s.date >= roundStart && s.subjectId === subjectId).reduce((a, s) => a + (s.totalMinutes || 0), 0);
    return { pct: metaMin > 0 ? Math.min(100, Math.round((realMin / metaMin) * 100)) : 0, realMin, metaMin, rodada: cycle.rodadaAtual };
  }, [cycles, activeCycleId, subjectId, sessions]);

  const statsMap = useMemo(() => {
    const map = { totalMins: 0, totalQ: 0, totalC: 0, totalFlashcards: 0, subtopics: {}, topics: {} };
    if (!subject) return map;
    sessions.forEach(s => {
      if (s.subjectId !== subjectId) return;
      map.totalMins += s.totalMinutes || 0;
      map.totalQ += s.questionsAnswered || 0;
      map.totalC += s.questionsCorrect || 0;
      if (s.subtopicId) {
        if (!map.subtopics[s.subtopicId]) map.subtopics[s.subtopicId] = { mins: 0, q: 0, c: 0, fc: 0 };
        map.subtopics[s.subtopicId].mins += s.totalMinutes || 0;
        map.subtopics[s.subtopicId].q += s.questionsAnswered || 0;
        map.subtopics[s.subtopicId].c += s.questionsCorrect || 0;
      }
      if (s.topicId) {
        if (!map.topics[s.topicId]) map.topics[s.topicId] = { mins: 0, q: 0, c: 0, fc: 0 };
        map.topics[s.topicId].mins += s.totalMinutes || 0;
        map.topics[s.topicId].q += s.questionsAnswered || 0;
        map.topics[s.topicId].c += s.questionsCorrect || 0;
      }
    });
    subject.topics?.forEach(t => {
      if (!map.topics[t.id]) map.topics[t.id] = { mins: 0, q: 0, c: 0, fc: 0 };
      t.subtopics?.forEach(st => {
        if (!map.subtopics[st.id]) map.subtopics[st.id] = { mins: 0, q: 0, c: 0, fc: 0 };
        const fc = st.flashcards?.length || 0;
        map.subtopics[st.id].fc = fc;
        map.topics[t.id].fc += fc;
        map.totalFlashcards += fc;
      });
    });
    getPendingToday().forEach(r => {
      if (map.subtopics[r.subtopicId]) map.subtopics[r.subtopicId].pendingRev = (map.subtopics[r.subtopicId].pendingRev || 0) + 1;
    });
    return map;
  }, [sessions, subjectId, subject, getPendingToday]);

  const subjectSessions = useMemo(() =>
    sessions.filter(s => s.subjectId === subjectId).sort((a, b) => (b.finishedAt || 0) - (a.finishedAt || 0)),
    [sessions, subjectId]
  );

  if (!subject) {
    return (
      <StudyLayout>
        <div className="flex flex-col items-center justify-center h-64 text-text-muted">
          <p>Matéria não encontrada.</p>
          <button onClick={() => navigate('/study/subjects')} className="mt-6 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-[var(--primary)]">Voltar</button>
        </div>
      </StudyLayout>
    );
  }

  const totalSubtopics = subject.topics?.reduce((a, t) => a + (t.subtopics?.length || 0), 0) || 0;
  const concluidos = subject.topics?.reduce((acc, t) => {
    return acc + (t.subtopics || []).reduce((sum, st) => {
      const completedRevs = (revisions || []).filter(r => r.subtopicId === st.id && r.completed);
      const lastStage = completedRevs.length > 0 ? Math.max(...completedRevs.map(r => r.stage)) : 0;
      if (st.status === 'dominado') return sum + 1.0;
      if (lastStage >= 7) return sum + 1.0;
      if (lastStage > 0) return sum + ({ 1: 0.2, 2: 0.4, 3: 0.6, 4: 0.75, 5: 0.85, 6: 0.95 }[lastStage] || 0.2);
      if (st.status === 'estudando') return sum + 0.1;
      return sum;
    }, 0);
  }, 0) || 0;
  const editalProgress = totalSubtopics > 0 ? Math.min(100, Math.round((concluidos / totalSubtopics) * 100)) : 0;
  const globalAccuracy = statsMap.totalQ > 0 ? Math.round((statsMap.totalC / statsMap.totalQ) * 100) : null;

  const toggleCollapse = id => setCollapsedTopics(p => ({ ...p, [id]: !p[id] }));
  const collapseAll = () => { const all = {}; subject.topics?.forEach(t => (all[t.id] = true)); setCollapsedTopics(all); };
  const expandAll = () => setCollapsedTopics({});

  const handleAddTopic = e => { if (e.key === 'Enter' && newTopicName.trim()) { addTopic(subjectId, { name: newTopicName.trim() }); setNewTopicName(''); } };
  const handleAddSubtopic = (topicId, e) => {
    if (e.key === 'Enter' && newSubtopicData.name.trim()) {
      addSubtopic(subjectId, topicId, { name: newSubtopicData.name.trim() });
      setNewSubtopicData({ topicId: null, name: '' });
      setCollapsedTopics(p => ({ ...p, [topicId]: false }));
    }
  };
  const saveTopicEdit = () => { if (editingTopic.name.trim()) updateTopic(subjectId, editingTopic.id, { name: editingTopic.name.trim() }); setEditingTopic({ id: null, name: '' }); };
  const saveSubtopicEdit = () => { if (editingSubtopic.name.trim()) updateSubtopic(subjectId, editingSubtopic.topicId, editingSubtopic.id, { name: editingSubtopic.name.trim() }); setEditingSubtopic({ id: null, topicId: null, name: '' }); };
  const handleDeleteTopic = topic => {
    const hasChildren = (topic.subtopics || []).length > 0;
    if (window.confirm(hasChildren ? `Atenção: "${topic.name}" contém ${topic.subtopics.length} aulas. Excluir?` : `Excluir "${topic.name}"?`))
      deleteTopic(subjectId, topic.id);
  };
  const handleDeleteSubtopic = (topicId, subtopic) => {
    if (window.confirm(`Excluir "${subtopic.name}"? Histórico será perdido.`)) deleteSubtopic(subjectId, topicId, subtopic.id);
  };

  const dragEnabled = search === '';
  const handleDragStart = id => { if (dragEnabled) setDragId(id); };
  const handleDragOver = (e, id) => { if (dragEnabled && dragId) { e.preventDefault(); if (id !== overId) setOverId(id); } };
  const handleDrop = targetId => {
    if (!dragEnabled || !dragId || dragId === targetId) { setDragId(null); setOverId(null); return; }
    const ids = (subject.topics || []).map(t => t.id);
    const from = ids.indexOf(dragId), to = ids.indexOf(targetId);
    if (from === -1 || to === -1) return;
    const reordered = [...ids]; reordered.splice(from, 1); reordered.splice(to, 0, dragId);
    reorderTopics(subjectId, reordered);
    setDragId(null); setOverId(null);
  };

  const filteredTopics = (subject.topics || []).map(topic => ({
    ...topic,
    subtopics: (topic.subtopics || []).filter(sub => sub.name.toLowerCase().includes(search.toLowerCase()) && (statusFilter === 'all' || sub.status === statusFilter)),
  })).filter(topic => topic.subtopics.length > 0 || search === '');

  return (
    <StudyLayout>
      <div className="flex flex-col pb-10">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-xs text-text-dim mb-4 p-3 rounded-xl bg-white/5 backdrop-blur-sm border border-white/5">
          <button onClick={() => navigate('/study/subjects')} className="hover:text-[var(--primary)] font-medium transition-colors">Matérias</button>
          <span>/</span>
          <span className="font-bold text-text-main truncate">{subject.name}</span>
        </div>

        {/* Header with gradient */}
        <div className="relative rounded-2xl p-6 mb-6 overflow-hidden flex flex-col xl:flex-row items-start justify-between gap-6" style={{ background: `linear-gradient(135deg, ${subject.color}20 0%, transparent 60%)` }}>
          <div className="absolute inset-0 bg-white/[0.02] backdrop-blur-xl" />
          <div className="relative flex-1 z-10">
            <h1 className="text-2xl font-bold text-text-main mb-3">{subject.name}</h1>
            <div className="flex flex-wrap items-center gap-3 text-[10px] font-bold text-text-dim uppercase tracking-wider mb-4">
              <Badge>{subject.topics?.length || 0} Assuntos</Badge>
              <Badge>{totalSubtopics} Aulas</Badge>
              {cycleProgress && (
                <Badge variant="accent" color={subject.color} title={`${formatMinutes(cycleProgress.realMin)} de ${formatMinutes(cycleProgress.metaMin)}`}>
                  R{cycleProgress.rodada} · {cycleProgress.pct}% ciclo
                </Badge>
              )}
            </div>
          </div>
          <div className="relative z-10 flex items-center gap-6 flex-wrap">
            <div className="flex gap-4 pr-6 border-r border-white/10">
              <div className="flex flex-col items-center">
                <span className="text-2xl font-black text-text-main">{statsMap.totalQ}</span>
                <span className="text-[10px] lg:text-[9px] text-text-dim font-bold uppercase">Questões</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-2xl font-black" style={{ color: globalAccuracy !== null ? (globalAccuracy >= 70 ? '#10B981' : globalAccuracy >= 50 ? '#F59E0B' : '#EF4444') : 'var(--text-dim)' }}>
                  {globalAccuracy !== null ? `${globalAccuracy}%` : '-'}
                </span>
                <span className="text-[10px] lg:text-[9px] text-text-dim font-bold uppercase">Acerto</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-2xl font-black text-text-main">{formatMinutes(statsMap.totalMins)}</span>
                <span className="text-[10px] lg:text-[9px] text-text-dim font-bold uppercase">Tempo</span>
              </div>
            </div>
            <div className="w-48">
              <div className="flex items-center gap-3">
                <ProgressRing value={editalProgress} color={subject.color} size={56} stroke={5} />
                <div>
                  <div className="text-xs font-bold text-text-muted">Avanço no Edital</div>
                  <div className="text-lg font-black" style={{ color: subject.color }}>{editalProgress}%</div>
                  <div className="text-[10px] text-text-dim font-semibold">{concluidos} de {totalSubtopics}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-6">
          <div className="relative flex-1 max-w-xs w-full">
            <input
              className="w-full pl-4 pr-3 py-2.5 rounded-xl text-sm outline-none border transition-all focus:border-[var(--primary)] bg-white/5 border-white/10 text-text-main placeholder-text-dim focus:ring-1 focus:ring-[var(--primary)]/30"
              placeholder="Pesquisar..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <button onClick={expandAll} className="flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-bold text-text-muted hover:bg-white/5 border border-white/10 transition-colors">Expandir</button>
            <button onClick={collapseAll} className="flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-bold text-text-muted hover:bg-white/5 border border-white/10 transition-colors">Recolher</button>
            <button onClick={() => navigate(`/study/questoes?materia=${encodeURIComponent(subject.name)}`)} className="flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-bold text-white transition-colors hover:opacity-90" style={{ background: subject.color }}>Questões</button>
          </div>
        </div>

        {/* Topics */}
        <div className="space-y-3">
          {!dragEnabled && <p className="text-[10px] text-text-dim italic">Limpe a busca para reordenar arrastando.</p>}
          {filteredTopics.length === 0 ? (
            <div className="text-center p-12 border border-dashed border-white/10 rounded-xl">
              <p className="mt-3 text-text-main font-bold">Nenhum resultado encontrado.</p>
            </div>
          ) : (
            filteredTopics.map(topic => {
              const isCollapsed = collapsedTopics[topic.id];
              const tStats = statsMap.topics[topic.id] || { mins: 0, q: 0, c: 0, fc: 0 };
              const tAcc = tStats.q > 0 ? Math.round((tStats.c / tStats.q) * 100) : null;

              return (
                <motion.div
                  key={topic.id}
                  layout
                  variants={cardVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  draggable={dragEnabled}
                  onDragStart={() => handleDragStart(topic.id)}
                  onDragOver={e => handleDragOver(e, topic.id)}
                  onDrop={() => handleDrop(topic.id)}
                  onDragEnd={() => { setDragId(null); setOverId(null); }}
                  className="rounded-xl overflow-hidden border transition-all group/topic"
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    backdropFilter: 'blur(12px)',
                    borderColor: overId === topic.id ? subject.color : 'rgba(255,255,255,0.06)',
                    opacity: dragId === topic.id ? 0.4 : 1,
                    boxShadow: overId === topic.id ? `0 0 0 2px ${subject.color}40` : undefined,
                  }}
                >
                  {/* Topic Header */}
                  <div className="p-4 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between cursor-pointer hover:bg-white/[0.03] transition-colors gap-3" onClick={() => toggleCollapse(topic.id)}>
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {dragEnabled && (
                        <span className="text-text-dim text-xs cursor-grab active:cursor-grabbing opacity-40 group-hover/topic:opacity-100 transition-opacity select-none" onClick={e => e.stopPropagation()}>⠿</span>
                      )}
                      <motion.span animate={{ rotate: isCollapsed ? 0 : 90 }} className="text-text-muted text-xs">►</motion.span>
                      {editingTopic.id === topic.id ? (
                        <input autoFocus className="flex-1 bg-white/5 text-sm font-bold outline-none border border-[var(--primary)] rounded px-2 py-1 text-text-main" value={editingTopic.name} onClick={e => e.stopPropagation()} onChange={e => setEditingTopic({ ...editingTopic, name: e.target.value })} onKeyDown={e => { if (e.key === 'Enter') saveTopicEdit(); if (e.key === 'Escape') setEditingTopic({ id: null, name: '' }); }} onBlur={saveTopicEdit} />
                      ) : (
                        <h2 className="text-sm font-bold text-text-main uppercase tracking-wider truncate group-hover/topic:text-[var(--primary)] transition-colors">{topic.name}</h2>
                      )}
                      {!editingTopic.id && (
                        <div className="md:opacity-0 md:group-hover/topic:opacity-100 flex gap-1 ml-2 transition-opacity" onClick={e => e.stopPropagation()}>
                          <button onClick={() => setEditingTopic({ id: topic.id, name: topic.name })} className="w-8 h-8 lg:w-6 lg:h-6 rounded flex items-center justify-center hover:bg-white/10 text-text-muted hover:text-[var(--primary)]">✏️</button>
                          <button onClick={() => handleDeleteTopic(topic)} className="w-8 h-8 lg:w-6 lg:h-6 rounded flex items-center justify-center hover:bg-red-500/10 text-text-muted hover:text-red-500">🗑️</button>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center justify-between md:justify-end w-full md:w-auto gap-4 flex-shrink-0 pl-8 md:pl-0">
                      <div className="flex gap-4 px-2 md:px-4 text-xs font-bold md:border-l border-white/10">
                        <div className="w-10 text-center text-text-main">{tStats.q} <span className="text-[10px] lg:text-[8px] text-text-dim uppercase block">Qst</span></div>
                        <div className="w-10 text-center" style={{ color: tAcc !== null ? (tAcc >= 70 ? '#10B981' : tAcc >= 50 ? '#F59E0B' : '#EF4444') : 'var(--text-dim)' }}>
                          {tAcc !== null ? `${tAcc}%` : '-'} <span className="text-[10px] lg:text-[8px] text-text-dim uppercase block">Acerto</span>
                        </div>
                        <div className="w-12 text-center text-text-main hidden sm:block">{formatMinutes(tStats.mins)} <span className="text-[10px] lg:text-[8px] text-text-dim uppercase block">Tempo</span></div>
                      </div>
                      <div onClick={e => e.stopPropagation()}>
                        <button onClick={() => openSessionModal({ preSubjectId: subjectId, preTopicId: topic.id })} className="px-3 py-1.5 rounded-lg text-[10px] font-bold text-white uppercase tracking-wider hover:scale-105 active:scale-95 transition-transform shadow-lg" style={{ background: subject.color, boxShadow: `0 4px 14px ${subject.color}40` }}>
                          <span className="flex items-center gap-1"><Play size={10} fill="white" /> Estudar</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Subtopics */}
                  <AnimatePresence initial={false}>
                    {!isCollapsed && (
                      <motion.div variants={collapseVariants} initial="closed" animate="open" exit="closed" className="overflow-hidden">
                        <div className="divide-y divide-white/5">
                          {(topic.subtopics || []).map(subtopic => {
                            const stStats = statsMap.subtopics[subtopic.id] || { mins: 0, q: 0, c: 0, fc: 0 };
                            const acc = stStats.q > 0 ? Math.round((stStats.c / stStats.q) * 100) : null;
                            const subtopicRevs = revisions.filter(r => r.subtopicId === subtopic.id);
                            const activeRev = subtopicRevs.find(r => !r.completed);
                            const lastCompRev = subtopicRevs.filter(r => r.completed).sort((a, b) => b.stage - a.stage)[0];
                            const currentStage = activeRev ? activeRev.stage : (lastCompRev ? lastCompRev.stage + 1 : 0);
                            const accent = subject?.color || 'var(--primary)';

                            return (
                              <div key={subtopic.id}>
                                {/* Desktop */}
                                <div className="hidden md:flex md:flex-row md:items-center p-3 hover:bg-white/[0.03] transition-colors group/sub cursor-pointer" onClick={() => navigate(`/study/subjects/${subjectId}/${topic.id}/${subtopic.id}`)}>
                                  <div className="flex-1 min-w-0 pl-2 sm:pl-8 pr-4 flex items-center gap-2">
                                    {editingSubtopic.id === subtopic.id ? (
                                      <input autoFocus className="flex-1 bg-white/5 text-sm font-semibold outline-none border border-[var(--primary)] rounded px-2 py-1 max-w-sm text-text-main" value={editingSubtopic.name} onClick={e => e.stopPropagation()} onChange={e => setEditingSubtopic({ ...editingSubtopic, name: e.target.value })} onKeyDown={e => { if (e.key === 'Enter') saveSubtopicEdit(); if (e.key === 'Escape') setEditingSubtopic({ id: null, topicId: null, name: '' }); }} onBlur={saveSubtopicEdit} />
                                    ) : (
                                      <div className="flex flex-col gap-1 min-w-0">
                                        <p className="text-sm font-semibold text-text-main truncate group-hover/sub:text-[var(--primary)] transition-colors">{subtopic.name}</p>
                                        <RevBadges currentStage={currentStage} accent={accent} />
                                      </div>
                                    )}
                                    {stStats.pendingRev > 0 && <Badge variant="info" className="shrink-0">🔄 {stStats.pendingRev}</Badge>}
                                    {!editingSubtopic.id && (
                                      <div className="md:opacity-0 md:group-hover/sub:opacity-100 flex gap-1 transition-opacity" onClick={e => e.stopPropagation()}>
                                        <button onClick={() => openSessionModal({ preSubjectId: subjectId, preTopicId: topic.id, preSubtopicId: subtopic.id })} title="Estudar" className="w-8 h-8 lg:w-6 lg:h-6 rounded flex items-center justify-center hover:bg-white/10 text-text-muted hover:text-[var(--primary)]"><Play size={12} fill="currentColor" /></button>
                                        <button onClick={() => setEditingSubtopic({ id: subtopic.id, topicId: topic.id, name: subtopic.name })} className="w-8 h-8 lg:w-6 lg:h-6 rounded flex items-center justify-center hover:bg-white/10 text-text-muted hover:text-[var(--primary)]">✏️</button>
                                        <button onClick={() => handleDeleteSubtopic(topic.id, subtopic)} className="w-8 h-8 lg:w-6 lg:h-6 rounded flex items-center justify-center hover:bg-red-500/10 text-text-muted hover:text-red-500">🗑️</button>
                                        <ContextMenu subtopicId={subtopic.id} topicId={topic.id} subjectId={subjectId} revisions={revisions} editRevisionDate={editRevisionDate} editRevision={editRevision} onClose={() => setMenuOpenSubtopicId(null)} />
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex items-center justify-end gap-4 flex-shrink-0 pl-8 md:pl-0">
                                    <div className="w-[150px] flex justify-between px-2 text-xs font-bold font-mono">
                                      <div className="w-12 text-center text-text-main">{stStats.q}</div>
                                      <div className="w-12 text-center" style={{ color: acc !== null ? (acc >= 70 ? '#10B981' : acc >= 50 ? '#F59E0B' : '#EF4444') : 'var(--text-dim)' }}>{acc !== null ? `${acc}%` : '-'}</div>
                                      <div className="w-14 text-center text-text-main">{formatMinutes(stStats.mins)}</div>
                                    </div>
                                  </div>
                                </div>

                                {/* Mobile */}
                                <div className="flex md:hidden flex-col gap-3 p-4 bg-white/[0.03] backdrop-blur-xl border border-white/5 rounded-2xl mb-2 mx-2 hover:border-white/10 transition-all cursor-pointer" onClick={() => navigate(`/study/subjects/${subjectId}/${topic.id}/${subtopic.id}`)}>
                                  <div className="flex justify-between items-start gap-2">
                                    <div className="min-w-0">
                                      <p className="text-sm font-bold text-white truncate">{subtopic.name}</p>
                                    </div>
                                    <ContextMenu subtopicId={subtopic.id} topicId={topic.id} subjectId={subjectId} revisions={revisions} editRevisionDate={editRevisionDate} editRevision={editRevision} onClose={() => setMenuOpenSubtopicId(null)} />
                                  </div>
                                  <RevBadges currentStage={currentStage} accent={accent} />
                                  <div className="flex items-center justify-between pt-2 border-t border-white/5 mt-1">
                                    <div className="flex gap-3 text-[10px] text-zinc-400 font-bold font-mono">
                                      <span>{stStats.q} Qst</span>
                                      <span style={{ color: acc !== null ? (acc >= 70 ? '#10B981' : acc >= 50 ? '#F59E0B' : '#EF4444') : undefined }}>{acc !== null ? `${acc}%` : '-'} Acc</span>
                                      <span>{formatMinutes(stStats.mins)} Min</span>
                                    </div>
                                    <button onClick={e => { e.stopPropagation(); openSessionModal({ preSubjectId: subjectId, preTopicId: topic.id, preSubtopicId: subtopic.id }); }} className="px-3 py-1.5 rounded-lg text-[10px] font-black text-white uppercase tracking-wider flex items-center gap-1 active:scale-95 shadow-lg" style={{ background: accent, boxShadow: `0 4px 14px ${accent}40` }}>
                                      <Play size={10} fill="white" /> Play
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                          {/* Add subtopic */}
                          <div className="p-3 pl-10 flex items-center gap-3 bg-white/[0.02]">
                            <span className="text-text-muted text-sm">+</span>
                            <input type="text" placeholder="Nova aula... (Enter)" className="flex-1 bg-transparent text-xs font-semibold outline-none text-text-main placeholder-text-dim" value={newSubtopicData.topicId === topic.id ? newSubtopicData.name : ''} onChange={e => setNewSubtopicData({ topicId: topic.id, name: e.target.value })} onKeyDown={e => handleAddSubtopic(topic.id, e)} />
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })
          )}

          {/* Add topic */}
          <div className="rounded-xl border border-dashed p-4 flex items-center gap-3 mt-4 focus-within:border-[var(--primary)] transition-colors bg-white/[0.02] border-white/10">
            <span style={{ color: subject.color }} className="text-xl font-bold">+</span>
            <input type="text" placeholder="Novo Assunto Grande... (Enter)" className="flex-1 bg-transparent text-sm outline-none text-text-main placeholder-text-dim font-bold tracking-wide" value={newTopicName} onChange={e => setNewTopicName(e.target.value)} onKeyDown={handleAddTopic} />
          </div>
        </div>

        {/* Session History */}
        <div className="mt-8 space-y-3">
          <SectionHeader title="Histórico de Sessões" icon="📋" count={subjectSessions.length} />
          {subjectSessions.length === 0 ? (
            <div className="text-center py-6 text-xs" style={{ color: 'var(--text-dim)' }}>
              Nenhuma sessão registrada para esta matéria.
            </div>
          ) : (
            <div className="space-y-2">
              {subjectSessions.slice(0, 5).map(session => (
                <div key={session.id} className="flex items-center gap-3 p-3 rounded-xl border border-white/[0.06] hover:bg-white/[0.03] transition-all">
                  <div className="w-2 h-8 rounded-full shrink-0" style={{ background: subject.color }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold" style={{ color: 'var(--text-main)' }}>
                        {session.totalMinutes} min
                      </span>
                      {session.questionsAnswered > 0 && (
                        <span className="text-[10px]" style={{ color: 'var(--text-dim)' }}>
                          · {session.questionsCorrect}/{session.questionsAnswered} acertos
                        </span>
                      )}
                    </div>
                    <div className="text-[10px]" style={{ color: 'var(--text-dim)' }}>
                      {(session.modes || [session.studyType]).map(m => MODE_LABELS[m]?.icon || '📖').join(' ')}
                    </div>
                  </div>
                  <div className="text-[10px] shrink-0" style={{ color: 'var(--text-dim)' }}>
                    {session.date ? fmtDate(session.date) : ''}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </StudyLayout>
  );
}
