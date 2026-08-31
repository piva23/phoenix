import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStudyStore } from '../../../stores/useStudyStore';
import { useSessionStore } from '../../../stores/useSessionStore';
import { useQuestionsStore } from '../../../stores/useQuestionsStore';
import { StudyLayout } from '../components/StudyLayout';
import { BentoCard, SectionHeader, ProgressRing, Badge } from '../components/BentoCard';
import { formatMinutes } from '../../../shared/utils/time';

function fmtDate(dateStr) {
  if (!dateStr) return null;
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}`;
}

function SubjectModal({ subject, onClose, onSave }) {
  const [name, setName] = useState(subject?.name || '');
  const [color, setColor] = useState(subject?.color || '#8B5CF6');

  const COLORS = ['#8B5CF6', '#EC4899', '#10B981', '#F59E0B', '#EF4444', '#06B6D4', '#3B82F6', '#A855F7'];

  const handleSubmit = e => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({ name: name.trim(), color });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-2xl border border-white/10 p-6 backdrop-blur-xl bg-[#1a1a24]"
        onClick={e => e.stopPropagation()}
      >
        <h3 className="text-sm font-bold uppercase tracking-wider mb-4" style={{ color: 'var(--text-dim)' }}>
          {subject ? 'Editar Matéria' : 'Nova Matéria'}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            autoFocus
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Nome da matéria..."
            className="w-full px-4 py-3 rounded-xl text-sm outline-none border border-white/10 bg-white/[0.04] focus:border-white/20"
            style={{ color: 'var(--text-main)' }}
          />
          <div className="flex gap-2">
            {COLORS.map(c => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className="w-8 h-8 rounded-lg transition-all"
                style={{
                  background: c,
                  transform: color === c ? 'scale(1.2)' : 'scale(1)',
                  boxShadow: color === c ? `0 0 12px ${c}50` : 'none',
                }}
              />
            ))}
          </div>
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl text-xs font-bold border border-white/10 hover:bg-white/5" style={{ color: 'var(--text-dim)' }}>
              Cancelar
            </button>
            <button type="submit" className="px-4 py-2 rounded-xl text-xs font-bold text-white" style={{ background: 'var(--primary)' }}>
              {subject ? 'Salvar' : 'Criar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function StudySubjectsPage() {
  const [search, setSearch] = useState('');
  const [view, setView] = useState(() => localStorage.getItem('studyView') || 'grid');
  const [showModal, setShowModal] = useState(false);
  const [editSubject, setEditSubject] = useState(null);

  const navigate = useNavigate();
  const subjects = useStudyStore(s => s.subjects);
  const addSubject = useStudyStore(s => s.addSubject);
  const updateSubject = useStudyStore(s => s.updateSubject);
  const deleteSubject = useStudyStore(s => s.deleteSubject);
  const sessions = useSessionStore(s => s.sessions);
  const questionsStore = useQuestionsStore();

  const enriched = useMemo(() => {
    return subjects.map(s => {
      const totalSub = (s.topics || []).reduce((a, t) => a + (t.subtopics || []).length, 0);
      const done = (s.topics || []).reduce((a, t) => a + (t.subtopics || []).filter(st => st.status === 'dominado').length, 0);
      const mins = sessions.filter(ss => ss.subjectId === s.id).reduce((a, ss) => a + (ss.totalMinutes || 0), 0);

      // Question stats
      const subjectQuestions = questionsStore.questions.filter(q => q.subjectId === s.id);
      const totalQuestions = subjectQuestions.length;
      const subjectAnswers = questionsStore.answers.filter(a => subjectQuestions.some(q => q.id === a.questionId));
      const correctAnswers = subjectAnswers.filter(a => a.correct).length;
      const accuracy = subjectAnswers.length > 0 ? Math.round((correctAnswers / subjectAnswers.length) * 100) : null;

      // Session stats
      const subjectSessions = sessions.filter(ss => ss.subjectId === s.id);
      const sessionCount = subjectSessions.length;
      const sortedSessions = [...subjectSessions].sort((a, b) => (b.finishedAt || 0) - (a.finishedAt || 0));
      const lastStudied = sortedSessions[0]?.date ? fmtDate(sortedSessions[0].date) : null;

      return {
        ...s,
        totalSub,
        done,
        pct: totalSub > 0 ? Math.round((done / totalSub) * 100) : 0,
        totalMinutes: mins,
        totalQuestions,
        accuracy,
        sessionCount,
        lastStudied,
      };
    });
  }, [subjects, sessions, questionsStore.questions, questionsStore.answers]);

  const filtered = useMemo(() => {
    if (!search) return enriched;
    const q = search.toLowerCase();
    return enriched.filter(s => s.name.toLowerCase().includes(q));
  }, [enriched, search]);

  const handleSave = data => {
    if (editSubject) {
      updateSubject(editSubject.id, data);
    } else {
      addSubject(data);
    }
    setEditSubject(null);
  };

  return (
    <StudyLayout>
      <div className="flex flex-col pb-10 space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight" style={{ color: 'var(--text-main)' }}>
              Matérias
            </h1>
            <p className="text-sm mt-1" style={{ color: 'var(--text-dim)' }}>
              {subjects.length} matérias cadastradas
            </p>
          </div>
          <div className="flex gap-2">
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar..."
              className="px-3 py-2 rounded-xl text-xs outline-none border border-white/10 bg-white/[0.04] focus:border-white/20 w-48"
              style={{ color: 'var(--text-main)' }}
            />
            <button
              onClick={() => { setEditSubject(null); setShowModal(true); }}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white"
              style={{ background: 'var(--primary)' }}
            >
              + Nova
            </button>
          </div>
        </div>

        <div className={view === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'flex flex-col gap-3'}>
          {filtered.map(subject => (
            <BentoCard
              key={subject.id}
              className="cursor-pointer group"
              onClick={() => navigate(`/study/subjects/${subject.id}`)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ background: subject.color }} />
                  <h3 className="text-sm font-bold" style={{ color: 'var(--text-main)' }}>{subject.name}</h3>
                </div>
                <ProgressRing value={subject.pct} size={36} stroke={3} color={subject.color} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px]" style={{ color: 'var(--text-dim)' }}>
                  {subject.done}/{subject.totalSub} subtópicos
                </span>
                <span className="text-[10px] font-bold" style={{ color: subject.color }}>
                  {subject.pct}%
                </span>
              </div>
              <div className="mt-3 h-1.5 rounded-full bg-white/5 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${subject.pct}%`, background: subject.color }}
                />
              </div>
              <div className="mt-2 flex flex-wrap gap-x-2 gap-y-0.5 text-[9px]" style={{ color: 'var(--text-dim)' }}>
                {subject.totalMinutes > 0 && <span>⏱ {formatMinutes(subject.totalMinutes)}</span>}
                {subject.totalQuestions > 0 && <span>· 🎯 {subject.totalQuestions} questões</span>}
                {subject.accuracy !== null && <span>· ✓ {subject.accuracy}%</span>}
                {subject.sessionCount > 0 && <span>· 📅 {subject.sessionCount} sessões</span>}
              </div>
              {subject.lastStudied && (
                <div className="mt-1 text-[9px]" style={{ color: 'var(--text-dim)' }}>
                  Último estudo: {subject.lastStudied}
                </div>
              )}
            </BentoCard>
          ))}
        </div>

        {showModal && (
          <SubjectModal
            subject={editSubject}
            onClose={() => { setShowModal(false); setEditSubject(null); }}
            onSave={handleSave}
          />
        )}
      </div>
    </StudyLayout>
  );
}
