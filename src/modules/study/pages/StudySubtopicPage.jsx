import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStudyStore } from '../../../stores/useStudyStore';
import { useSessionStore } from '../../../stores/useSessionStore';
import { useRevisionStore } from '../../../stores/useRevisionStore';
import { useSessionModalStore } from '../../../stores/useSessionModalStore';
import { StudyLayout } from '../components/StudyLayout';
import { BentoCard, SectionHeader, ProgressRing, Badge } from '../components/BentoCard';
import { motion } from 'framer-motion';
import { formatMinutes, today, daysUntil } from '../../../shared/utils/time';
import { RefreshCw } from 'lucide-react';
import clsx from 'clsx';
import toast from 'react-hot-toast';

// ── constantes ────────────────────────────────────────────────────────────────

const STATUS_OPTS = [
  { id: 'nao_estudado', label: 'Não Estudado', color: '#8A8A98', bg: 'transparent' },
  { id: 'estudando', label: 'Estudando', color: '#F59E0B', bg: '#F59E0B15' },
  { id: 'revisao', label: 'Em Revisão', color: '#06B6D4', bg: '#06B6D415' },
  { id: 'dominado', label: 'Concluído', color: '#10B981', bg: '#10B98115' },
];

const MODE_ICONS = {
  leitura: '📖', video: '▶️', questoes: '🎯', revisao: '🔄', mapa: '🗺️',
};

const MODE_LABELS = {
  leitura: 'Leitura', video: 'Videoaula', questoes: 'Questões', revisao: 'Revisão', mapa: 'Mapa Mental',
};

// R1 a R7+ stages
const REV_STAGES = [
  { num: 1, label: 'R1', interval: '1d' },
  { num: 2, label: 'R3', interval: '3d' },
  { num: 3, label: 'R7', interval: '7d' },
  { num: 4, label: 'R15', interval: '15d' },
  { num: 5, label: 'R30', interval: '30d' },
  { num: 6, label: 'R60', interval: '60d' },
  { num: 7, label: 'R🔄', interval: '∞' },
];

// ── helpers ───────────────────────────────────────────────────────────────────

function fmtDate(d) {
  if (!d) return '';
  try {
    return new Date(d + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' });
  } catch { return d; }
}

function daysAgo(d) {
  const n = Math.floor((new Date(today()) - new Date(d)) / 864e5);
  return n === 0 ? 'Hoje' : n === 1 ? 'Ontem' : `${n} dias atrás`;
}

// ── Revisão badges R1-R7 ──────────────────────────────────────────────────────

function RevBadges({ currentStage, accent }) {
  return (
    <div className="flex gap-1 items-center flex-wrap">
      {REV_STAGES.map(st => {
        const isActive = st.num === 7 ? currentStage >= 7 : currentStage === st.num;
        const isCompleted = currentStage > st.num;
        return (
          <span
            key={st.num}
            className={clsx(
              'text-[10px] lg:text-[9px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-0.5 transition-all select-none',
              isActive && 'ring-2 shadow-[0_0_8px_rgba(168,85,247,0.3)]',
              isCompleted ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-white/5'
            )}
            style={{
              color: isActive ? accent : isCompleted ? '#10B981' : '#71717a',
              background: isActive ? `${accent}20` : undefined,
              outlineColor: isActive ? accent : 'transparent',
            }}
          >
            {st.num === 7 ? (
              <span className="flex items-center gap-0.5">R<RefreshCw size={8} className={isActive ? 'animate-spin-slow' : ''} /></span>
            ) : st.label}
          </span>
        );
      })}
    </div>
  );
}

// ── componente principal ──────────────────────────────────────────────────────

export function StudySubtopicPage() {
  const { subjectId, topicId, subtopicId } = useParams();
  const navigate = useNavigate();
  const { subjects, updateSubtopic } = useStudyStore();
  const generateRevisions = useRevisionStore(s => s.generateRevisions);
  const completeRevision = useRevisionStore(s => s.completeRevision);
  const editRevisionDate = useRevisionStore(s => s.editRevisionDate);
  const openSessionModal = useSessionModalStore(s => s.openModal);
  const sessions = useSessionStore(s => s.sessions);
  const revisions = useRevisionStore(s => s.revisions);

  const subject = subjects.find(s => s.id === subjectId);
  const topic = subject?.topics?.find(t => t.id === topicId);
  const subtopic = topic?.subtopics?.find(ss => ss.id === subtopicId);
  const accent = subject?.color || 'var(--primary)';

  // Sessões deste subtópico
  const subSessions = useMemo(() =>
    sessions
      .filter(s => s.subtopicId === subtopicId)
      .sort((a, b) => (b.finishedAt || 0) - (a.finishedAt || 0)),
    [sessions, subtopicId]
  );

  // Revisões deste subtópico
  const subRevisions = useMemo(() =>
    revisions
      .filter(r => r.subtopicId === subtopicId)
      .sort((a, b) => (b.completedAt || b.revisionDate || '').localeCompare(a.completedAt || a.revisionDate || '')),
    [revisions, subtopicId]
  );
  const activeRev = subRevisions.find(r => !r.completed);
  const completedRevs = subRevisions.filter(r => r.completed).sort((a, b) => (b.completedAt || '').localeCompare(a.completedAt || ''));
  const lastCompleted = completedRevs[0];
  const currentStage = activeRev ? activeRev.stage : (lastCompleted ? lastCompleted.stage + 1 : 0);

  // Stats de sessão
  const stats = useMemo(() => {
    const totalMins = subSessions.reduce((a, s) => a + (s.totalMinutes || 0), 0);
    const totalQ = subSessions.reduce((a, s) => a + (s.questionsAnswered || 0), 0);
    const totalC = subSessions.reduce((a, s) => a + (s.questionsCorrect || 0), 0);
    return {
      totalMins,
      sessionCount: subSessions.length,
      accuracy: totalQ > 0 ? Math.round((totalC / totalQ) * 100) : null,
      totalQ,
      totalC,
      lastStudied: subSessions[0]?.date || null,
    };
  }, [subSessions]);

  const todayStr = today();
  const isOverdueRev = activeRev && activeRev.revisionDate < todayStr;
  const isTodayRev = activeRev && activeRev.revisionDate === todayStr;

  if (!subtopic) {
    return (
      <StudyLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <span className="text-4xl">⚠️</span>
          <p className="text-sm" style={{ color: 'var(--text-dim)' }}>Aula não encontrada.</p>
          <button onClick={() => navigate('/study/subjects')} className="px-5 py-2 rounded-xl text-sm font-bold text-white" style={{ background: 'var(--primary)' }}>
            Voltar para Matérias
          </button>
        </div>
      </StudyLayout>
    );
  }

  const status = STATUS_OPTS.find(s => s.id === subtopic.status) || STATUS_OPTS[0];

  return (
    <StudyLayout>
      <div className="flex flex-col pb-10 space-y-5 animate-fade-in">

        {/* ── Breadcrumb ── */}
        <div className="flex items-center gap-2 text-xs p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] backdrop-blur-sm">
          <button onClick={() => navigate('/study/subjects')} className="hover:text-[var(--primary)] font-medium transition-colors" style={{ color: 'var(--text-dim)' }}>Matérias</button>
          <span style={{ color: 'var(--text-dim)' }}>/</span>
          <button onClick={() => navigate(`/study/subjects/${subjectId}`)} className="hover:text-white transition-colors" style={{ color: accent }}>{subject?.name}</button>
          <span style={{ color: 'var(--text-dim)' }}>/</span>
          <span className="font-bold truncate" style={{ color: 'var(--text-main)' }}>{subtopic.name}</span>
        </div>

        {/* ── Header com gradiente ── */}
        <div className="relative rounded-2xl p-6 overflow-hidden flex flex-col xl:flex-row items-start justify-between gap-6" style={{ background: `linear-gradient(135deg, ${accent}20 0%, transparent 60%)` }}>
          <div className="absolute inset-0 bg-white/[0.02] backdrop-blur-xl" />
          <div className="relative flex-1 z-10">
            <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text-main)' }}>{subtopic.name}</h1>
            {topic && <div className="text-xs mt-1" style={{ color: 'var(--text-dim)' }}>{topic.name}</div>}
            <div className="flex items-center gap-3 mt-4 flex-wrap">
              <Badge>{subject?.topics?.length || 0} Assuntos</Badge>
              <Badge variant="solid" color={status.color}>{status.label}</Badge>
            </div>
          </div>
          <div className="relative z-10 flex items-center gap-3 flex-wrap">
            <button
              onClick={() => openSessionModal({ preSubjectId: subjectId, preTopicId: topicId, preSubtopicId: subtopicId })}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white uppercase tracking-wider hover:scale-105 transition-transform shadow-lg"
              style={{ background: accent, boxShadow: `0 4px 14px ${accent}40` }}
            >
              ▶ Estudar
            </button>
            <select
              value={subtopic.status || 'nao_estudado'}
              onChange={e => updateSubtopic(subjectId, topicId, subtopicId, { status: e.target.value })}
              className="px-3 py-2 rounded-xl text-xs font-bold border outline-none appearance-none pr-7 cursor-pointer"
              style={{ background: status.bg, borderColor: status.color, color: status.color }}
            >
              {STATUS_OPTS.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
          </div>
        </div>

        {/* ── Revisões ── */}
        <BentoCard padding>
          <SectionHeader title="Revisões" icon="🔁" sub="Progresso de consolidação da memória" count={currentStage > 0 ? `Estágio R${Math.min(currentStage, 7)}` : undefined} />
          <div className="flex flex-col lg:flex-row lg:items-center gap-5">
            <div className="flex items-center gap-3 shrink-0">
              <ProgressRing value={Math.min(100, Math.round(((Math.min(currentStage, 7)) / 7) * 100))} color={accent} size={64} stroke={6} />
              <div>
                <div className="text-lg font-black" style={{ color: 'var(--text-main)' }}>{currentStage > 0 ? `R${Math.min(currentStage, 7)}` : 'R0'}</div>
                <div className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-dim)' }}>Estágio atual</div>
              </div>
            </div>
            <RevBadges currentStage={currentStage} accent={accent} />
            {activeRev && (
              <div className="ml-auto shrink-0 flex items-center gap-2">
                <span
                  className="text-[11px] font-bold px-3 py-1.5 rounded-lg"
                  style={{
                    background: isOverdueRev ? '#EF444420' : isTodayRev ? '#F59E0B20' : '#06B6D420',
                    color: isOverdueRev ? '#EF4444' : isTodayRev ? '#F59E0B' : '#06B6D4',
                  }}
                >
                  {isOverdueRev ? `⚠ ${daysAgo(activeRev.revisionDate)}` : isTodayRev ? '📅 Hoje' : `📅 ${daysUntil(activeRev.revisionDate) >= 0 ? `Em ${daysUntil(activeRev.revisionDate)} dia${daysUntil(activeRev.revisionDate) !== 1 ? 's' : ''}` : fmtDate(activeRev.revisionDate)}`}
                </span>
                <button
                  onClick={() => {
                    completeRevision(activeRev.id, 5);
                    toast.success(`R${activeRev.stage} Concluída! R${activeRev.stage + 1} agendada.`);
                  }}
                  className="px-3 py-1.5 rounded-lg text-xs font-black text-white transition-all active:scale-95"
                  style={{ background: 'linear-gradient(135deg, #059669, #10B981)', boxShadow: '0 4px 20px rgba(16,185,129,0.2)' }}
                >
                  ✓ Concluir R{activeRev.stage}
                </button>
              </div>
            )}
          </div>

          {/* Histórico de revisões concluídas */}
          {completedRevs.length > 0 && (
            <div className="mt-4 pt-4 border-t border-white/[0.06] space-y-2">
              <div className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-dim)' }}>Histórico de revisões</div>
              {completedRevs.map(r => {
                const sc = r.score === 5 ? '#10B981' : r.score === 3 ? '#F59E0B' : '#EF4444';
                const scLabel = r.score === 5 ? 'Fácil' : r.score === 3 ? 'Médio' : 'Difícil';
                return (
                  <div key={r.id} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <span className="text-xs font-black px-2 py-1 rounded-md" style={{ background: `${accent}20`, color: accent }}>R{r.stage}</span>
                    <span className="text-[10px]" style={{ color: 'var(--text-dim)' }}>{fmtDate(r.completedAt)}</span>
                    {r.score && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: `${sc}20`, color: sc }}>{scLabel}</span>
                    )}
                    <span className="ml-auto text-[10px]" style={{ color: 'var(--text-dim)' }}>✓</span>
                  </div>
                );
              })}
            </div>
          )}

          {!activeRev && currentStage === 0 && (
            <button
              onClick={() => { generateRevisions(subjectId, topicId, subtopicId); toast.success('Revisão R1 gerada!'); }}
              className="mt-4 w-full py-2.5 rounded-xl text-xs font-bold border transition-all hover:bg-white/5"
              style={{ borderColor: `${accent}40`, color: accent }}
            >
              🔄 Iniciar ciclo de revisão (R1)
            </button>
          )}
        </BentoCard>

        {/* ── Stats ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: 'Tempo total', value: formatMinutes(stats.totalMins), icon: '⏱️', color: 'var(--text-main)', sub: undefined },
            { label: 'Sessões', value: stats.sessionCount, icon: '📚', color: 'var(--text-main)', sub: undefined },
            { label: 'Acerto', value: stats.accuracy !== null ? `${stats.accuracy}%` : '—', icon: '🎯', color: stats.accuracy !== null ? (stats.accuracy >= 70 ? '#10B981' : '#F59E0B') : 'var(--text-dim)', sub: undefined },
            { label: 'Questões', value: stats.totalQ, icon: '❓', color: 'var(--text-main)', sub: stats.totalQ > 0 ? `${stats.totalC} corretas` : undefined },
          ].map(k => (
            <div key={k.label} className="rounded-2xl border overflow-hidden backdrop-blur-xl bg-white/[0.04] border-white/[0.08] p-5 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-dim)' }}>{k.label}</span>
                <span className="text-lg">{k.icon}</span>
              </div>
              <div className="text-2xl font-black tracking-tight" style={{ color: k.color }}>{k.value}</div>
              {k.sub && <span className="text-[10px] font-medium" style={{ color: 'var(--text-dim)' }}>{k.sub}</span>}
            </div>
          ))}
        </div>

        {/* ── Sessões ── */}
        <div>
          <SectionHeader title="Sessões" icon="📋" count={subSessions.length} sub={stats.lastStudied ? `Última: ${fmtDate(stats.lastStudied)}` : undefined} />

          {subSessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-14 rounded-2xl border border-dashed" style={{ borderColor: 'rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)' }}>
              <span className="text-4xl opacity-40">📚</span>
              <span className="text-sm font-medium" style={{ color: 'var(--text-dim)' }}>Nenhuma sessão neste subtópico ainda</span>
            </div>
          ) : (
            <div className="space-y-2">
              {subSessions.map(s => {
                const modes = s.modes || (s.studyType ? [s.studyType] : []);
                const sAcc = s.questionsAnswered > 0 ? Math.round((s.questionsCorrect / s.questionsAnswered) * 100) : null;
                const methodBadges = [
                  s.connection && { icon: '🧠', color: '#8B5CF6' },
                  s.feynmanNote && { icon: '🎤', color: '#EC4899' },
                  s.recallText && { icon: '⚡', color: '#F97316' },
                  s.anchor && { icon: '🔗', color: '#A855F7' },
                ].filter(Boolean);
                return (
                  <motion.div
                    key={s.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-3 p-3.5 rounded-xl border transition-colors hover:bg-white/[0.03]"
                    style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.06)' }}
                  >
                    <div className="w-2 h-10 rounded-full shrink-0" style={{ background: accent }} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {modes.map(m => (
                          <span key={m} className="text-[11px]" title={MODE_LABELS[m]}>{MODE_ICONS[m] || '📖'}</span>
                        ))}
                        {methodBadges.map((b, i) => <span key={i} className="text-[11px]">{b.icon}</span>)}
                        <span className="text-[10px]" style={{ color: 'var(--text-dim)' }}>{fmtDate(s.date)}</span>
                        {s.xpEarned && <span className="text-[10px]" style={{ color: 'var(--text-dim)' }}>+{s.xpEarned} XP</span>}
                      </div>
                      <div className="text-sm font-medium" style={{ color: 'var(--text-main)' }}>
                        {formatMinutes(s.totalMinutes)}
                        {s.questionsAnswered > 0 && ` · ${s.questionsCorrect}/${s.questionsAnswered} questões`}
                      </div>
                      {s.connection && (
                        <div className="text-xs mt-1 italic truncate" style={{ color: '#8B5CF6' }}>"{s.connection}"</div>
                      )}
                    </div>
                    {sAcc !== null && (
                      <div className="text-sm font-black shrink-0" style={{ color: sAcc >= 70 ? '#10B981' : '#F59E0B' }}>{sAcc}%</div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Footer actions ── */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={() => navigate(`/study/subjects/${subjectId}`)}
            className="flex-1 py-2.5 rounded-xl text-xs font-bold border transition-all hover:bg-white/5"
            style={{ borderColor: 'rgba(255,255,255,0.08)', color: 'var(--text-dim)' }}
          >
            ← Voltar à matéria
          </button>
        </div>
      </div>
    </StudyLayout>
  );
}

export default StudySubtopicPage;