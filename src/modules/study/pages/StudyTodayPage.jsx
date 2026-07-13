import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSessionStore } from '../../../stores/useSessionStore';
import { useRevisionStore } from '../../../stores/useRevisionStore';
import { useCycleStore } from '../../../stores/useCycleStore';
import { useStudyStore } from '../../../stores/useStudyStore';
import { useConcursoStore } from '../../../stores/useConcursoStore';
import { StudyLayout } from '../components/StudyLayout';
import { StudyVisionWidget } from '../components/StudyVisionWidget';
import { useSessionModalStore } from '../../../stores/useSessionModalStore';
import { formatMinutes, daysUntil } from '../../../shared/utils/time';

// ── helpers ───────────────────────────────────────────────────────────────────

function today() {
  return new Date().toISOString().slice(0, 10);
}

function minutesToHuman(min) {
  if (!min && min !== 0) return '—';
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

function fmtDate(d) {
  if (!d) return '';
  const [, m, day] = d.split('-');
  return `${day}/${m}`;
}

// ── sub-componentes ───────────────────────────────────────────────────────────

function KPICard({ label, value, sub, accent, icon, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`p-4 rounded-2xl border flex flex-col gap-1 ${onClick ? 'cursor-pointer hover:border-[var(--border-strong)] transition-all' : ''}`}
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

function AlertCard({ type, children, onAction, actionLabel }) {
  const s = {
    danger: { bg: '#EF444415', border: '#EF444433', color: '#EF4444' },
    warning: { bg: '#F59E0B15', border: '#F59E0B33', color: '#F59E0B' },
    method: { bg: '#8B5CF615', border: '#8B5CF633', color: '#8B5CF6' },
  }[type] || { bg: '#3B82F615', border: '#3B82F633', color: '#3B82F6' };
  return (
    <div
      className="flex items-start gap-3 p-4 rounded-xl"
      style={{ background: s.bg, border: `1px solid ${s.border}` }}
    >
      <div
        className="flex-1 text-xs"
        style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}
      >
        {children}
      </div>
      {onAction && (
        <button
          onClick={onAction}
          className="px-3 py-1.5 rounded-lg text-xs font-bold shrink-0"
          style={{
            background: s.bg,
            color: s.color,
            border: `1px solid ${s.border}`,
          }}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

function SectionTitle({ children }) {
  return (
    <h2
      className="text-[10px] font-bold uppercase tracking-widest mb-3"
      style={{ color: 'var(--text-dim)' }}
    >
      {children}
    </h2>
  );
}

function EmptyCard({ icon, text, sub }) {
  return (
    <div
      className="flex flex-col items-center justify-center gap-2 py-8 rounded-2xl border"
      style={{ borderColor: 'var(--border)', background: 'var(--bg-surface)' }}
    >
      <span className="text-2xl opacity-40">{icon}</span>
      <span
        className="text-sm font-medium"
        style={{ color: 'var(--text-dim)' }}
      >
        {text}
      </span>
      {sub && (
        <span className="text-xs" style={{ color: 'var(--text-dim)' }}>
          {sub}
        </span>
      )}
    </div>
  );
}

// ── componente principal ──────────────────────────────────────────────────────

export function StudyTodayPage() {
  const navigate = useNavigate();
  const todayStr = today();
  const openSessionModal = useSessionModalStore(s => s.openModal);

  // stores
  const sessions = useSessionStore(s => s.sessions);
  const getStreak = useSessionStore(s => s.getStreak);
  const getTodayMins = useSessionStore(s => s.getTodayMinutes);
  const revisions = useRevisionStore(s => s.revisions);
  const getPending = useRevisionStore(s => s.getPendingToday);
  const getOverdue = useRevisionStore(s => s.getOverdue);
  const getHealth = useRevisionStore(s => s.getHealthSummary);
  const completeRev = useRevisionStore(s => s.completeRevision);
  const getTodaySug = useCycleStore(s => s.getTodaySuggestion);
  const getRoundPct = useCycleStore(s => s.getRoundProgress);
  const advanceRound = useCycleStore(s => s.advanceRound);
  const subjects = useStudyStore(s => s.subjects);
  const concursos = useConcursoStore(s => s.concursos);

  // dados
  const todayMinutes = getTodayMins(todayStr);
  const streak = getStreak();
  const revHealth = getHealth();
  const suggestion = getTodaySug();
  const roundPct = getRoundPct();
  const overdueCount = getOverdue().length;
  const pending = getPending();

  // próxima prova — usa c.dataProva (data prevista), não c.provas[] (histórico de fases já feitas)
  const nextProva = useMemo(() => {
    return (
      concursos
        .filter(
          c =>
            c.dataProva &&
            c.dataProva >= todayStr &&
            c.status !== 'aprovado' &&
            c.status !== 'desistiu'
        )
        .sort((a, b) => a.dataProva.localeCompare(b.dataProva))[0] || null
    );
  }, [concursos, todayStr]);

  const daysToProva = nextProva ? daysUntil(nextProva.dataProva) : null;

  // revisões pendentes enriquecidas
  const pendingRevisions = useMemo(() => {
    return pending.map(r => {
      const subj = subjects.find(s => s.id === r.subjectId);
      let subtopicName = r.subtopicId;
      subj?.topics?.forEach(t => {
        t.subtopics?.forEach(st => {
          if (st.id === r.subtopicId) subtopicName = st.name;
        });
      });
      return {
        ...r,
        subjectName: subj?.name || '—',
        subjectColor: subj?.color || 'var(--primary)',
        subtopicName,
      };
    });
  }, [revisions, subjects]);

  // sessões de hoje
  const todaySessions = useMemo(
    () =>
      sessions
        .filter(s => s.date === todayStr)
        .sort((a, b) => (b.finishedAt || 0) - (a.finishedAt || 0)),
    [sessions, todayStr]
  );

  // matéria da sugestão
  const suggSubject = useMemo(() => {
    if (!suggestion || suggestion.type !== 'study') return null;
    return subjects.find(s => s.id === suggestion.item?.subjectId) || null;
  }, [suggestion, subjects]);

  // alertas cognitivos — máximo 2
  const alerts = useMemo(() => {
    const list = [];

    // prática em bloco
    const recent5 = [...sessions]
      .sort((a, b) => (b.finishedAt || 0) - (a.finishedAt || 0))
      .slice(0, 5);
    const uniqueSubjs = new Set(recent5.map(s => s.subjectId).filter(Boolean));
    if (uniqueSubjs.size === 1 && recent5.length >= 5) {
      const s = subjects.find(x => x.id === [...uniqueSubjs][0]);
      if (s)
        list.push({
          type: 'warning',
          text: `Prática em bloco: suas últimas 5 sessões foram todas de ${s.name}. Alterne com outra matéria hoje para 2× mais retenção.`,
        });
    }

    // gaps abertos
    let totalGaps = 0;
    subjects.forEach(s =>
      s.topics?.forEach(t =>
        t.subtopics?.forEach(st => {
          totalGaps += (st.gaps || []).filter(g => !g.resolved).length;
          totalGaps += (st.insecurities || []).filter(i => !i.resolved).length;
        })
      )
    );
    if (totalGaps > 0)
      list.push({
        type: 'danger',
        text: `${totalGaps} gap${totalGaps > 1 ? 's e inseguranças abertas' : ' aberto'}. Esses pontos são o caminho do 70% para o 90%. Revise a aba Gaps nas aulas afetadas.`,
        action: () => navigate('/study/analytics'),
      });

    return list.slice(0, 2);
  }, [sessions, subjects]);

  return (
    <StudyLayout>
      <div className="flex flex-col pb-10 space-y-6 animate-fade-in">
        {/* cabeçalho + mini vision board */}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1
              className="text-2xl font-extrabold tracking-tight"
              style={{ color: 'var(--text-main)' }}
            >
              Hoje
            </h1>
            <p className="text-sm mt-1" style={{ color: 'var(--text-dim)' }}>
              {new Date().toLocaleDateString('pt-BR', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              })}
            </p>
          </div>
          <StudyVisionWidget />
        </div>

        {/* contagem regressiva para prova */}
        {nextProva && daysToProva !== null && daysToProva <= 60 && (
          <div
            className="flex items-center justify-between p-4 rounded-2xl border"
            style={{
              background: daysToProva <= 7 ? '#EF444415' : '#F59E0B15',
              borderColor: daysToProva <= 7 ? '#EF444433' : '#F59E0B33',
            }}
          >
            <div>
              <div
                className="text-[10px] font-bold uppercase tracking-widest"
                style={{ color: daysToProva <= 7 ? '#EF4444' : '#F59E0B' }}
              >
                Próxima prova
              </div>
              <div
                className="text-sm font-bold mt-0.5"
                style={{ color: 'var(--text-main)' }}
              >
                {nextProva.nome}
              </div>
              <div className="text-xs" style={{ color: 'var(--text-dim)' }}>
                {fmtDate(nextProva.dataProva)}
              </div>
            </div>
            <div className="text-right">
              <div
                className="text-3xl font-black"
                style={{ color: daysToProva <= 7 ? '#EF4444' : '#F59E0B' }}
              >
                {daysToProva}
              </div>
              <div
                className="text-[10px] font-bold uppercase tracking-widest"
                style={{ color: 'var(--text-dim)' }}
              >
                dias
              </div>
            </div>
          </div>
        )}

        {/* alertas cognitivos */}
        {alerts.length > 0 && (
          <div className="space-y-2">
            <SectionTitle>Diagnóstico do dia</SectionTitle>
            {alerts.map((a, i) => (
              <AlertCard
                key={i}
                type={a.type}
                onAction={a.action}
                actionLabel="Ver analytics"
              >
                {a.text}
              </AlertCard>
            ))}
          </div>
        )}

        {/* KPIs do dia */}
        <div className="grid grid-cols-3 gap-3">
          <KPICard
            label="Hoje"
            value={minutesToHuman(todayMinutes)}
            sub="tempo focado"
            icon="⏱"
          />
          <KPICard
            label="Revisões"
            value={`${overdueCount + revHealth.today}`}
            sub={
              overdueCount > 0
                ? `${overdueCount} atrasada${overdueCount > 1 ? 's' : ''}`
                : 'em dia'
            }
            accent={overdueCount > 0 ? '#EF4444' : '#10B981'}
            icon="🔄"
            onClick={() => navigate('/study/revisions')}
          />
          <KPICard
            label="Streak"
            value={`${streak}d`}
            sub={streak > 0 ? 'consecutivos' : 'comece hoje'}
            accent={
              streak >= 7 ? '#F59E0B' : streak > 0 ? '#10B981' : undefined
            }
            icon="🔥"
          />
        </div>

        {/* sugestão do ciclo */}
        <div>
          <SectionTitle>O que estudar agora</SectionTitle>

          {!suggestion && (
            <EmptyCard
              icon="🔁"
              text="Nenhum ciclo ativo"
              sub="Configure um ciclo para receber sugestões diárias"
            />
          )}

          {suggestion?.type === 'advance_round' && (
            <div
              className="p-5 rounded-2xl border flex items-center justify-between gap-4"
              style={{
                background: 'var(--bg-surface)',
                borderColor: 'var(--border)',
              }}
            >
              <div>
                <div
                  className="font-bold text-sm"
                  style={{ color: 'var(--text-main)' }}
                >
                  ✅ Rodada concluída!
                </div>
                <div
                  className="text-xs mt-1"
                  style={{ color: 'var(--text-dim)' }}
                >
                  Todas as matérias da rodada foram concluídas.
                </div>
              </div>
              <button
                onClick={() => advanceRound(suggestion.cycle.id)}
                className="px-4 py-2 rounded-xl text-sm font-bold text-white shrink-0"
                style={{ background: 'var(--primary)' }}
              >
                Avançar rodada
              </button>
            </div>
          )}

          {suggestion?.type === 'study' && (
            <div
              className="p-5 rounded-2xl border"
              style={{
                borderColor: suggSubject?.color || 'var(--border)',
                background: 'var(--bg-surface)',
              }}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{
                        background: suggSubject?.color || 'var(--primary)',
                      }}
                    />
                    <span
                      className="text-xs font-bold uppercase tracking-wider"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      {suggSubject?.name || 'Matéria do ciclo'}
                    </span>
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                      style={{
                        background: 'var(--bg-surface-2)',
                        color: 'var(--text-dim)',
                      }}
                    >
                      Rodada {suggestion.cycle?.rodadaAtual}
                    </span>
                  </div>
                  <div className="mb-3">
                    <div
                      className="flex justify-between text-[10px] mb-1"
                      style={{ color: 'var(--text-dim)' }}
                    >
                      <span>
                        {minutesToHuman(suggestion.feitoMinutos)} feitos
                      </span>
                      <span>
                        meta: {minutesToHuman(suggestion.metaMinutos)}
                      </span>
                    </div>
                    <div
                      className="h-1.5 rounded-full overflow-hidden"
                      style={{ background: 'var(--bg-surface-2)' }}
                    >
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${suggestion.progressPct}%`,
                          background: suggSubject?.color || 'var(--primary)',
                        }}
                      />
                    </div>
                  </div>
                  <div className="text-xs" style={{ color: 'var(--text-dim)' }}>
                    Faltam{' '}
                    <strong style={{ color: 'var(--text-main)' }}>
                      {minutesToHuman(suggestion.remaining)}
                    </strong>{' '}
                    para concluir na rodada
                  </div>
                </div>
                <div className="flex flex-col gap-2 shrink-0">
                  <button
                    onClick={() =>
                      openSessionModal({ subjectId: suggestion.item.subjectId })
                    }
                    className="px-4 py-2 rounded-xl text-sm font-bold text-white"
                    style={{
                      background: suggSubject?.color || 'var(--primary)',
                    }}
                  >
                    ▶ Iniciar
                  </button>
                  <button
                    onClick={() => navigate('/study/cycle')}
                    className="px-4 py-2 rounded-xl text-xs font-medium border"
                    style={{
                      borderColor: 'var(--border)',
                      color: 'var(--text-muted)',
                    }}
                  >
                    Ver ciclo
                  </button>
                </div>
              </div>
              {/* progresso geral da rodada */}
              <div
                className="mt-4 pt-4 border-t flex items-center gap-3"
                style={{ borderColor: 'var(--border)' }}
              >
                <span
                  className="text-[10px]"
                  style={{ color: 'var(--text-dim)' }}
                >
                  Rodada
                </span>
                <div
                  className="flex-1 h-1 rounded-full overflow-hidden"
                  style={{ background: 'var(--bg-surface-2)' }}
                >
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${roundPct}%`,
                      background: 'var(--secondary)',
                    }}
                  />
                </div>
                <span
                  className="text-[10px] font-bold"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {roundPct}%
                </span>
              </div>
            </div>
          )}
        </div>

        {/* revisões pendentes */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <SectionTitle>Revisões pendentes</SectionTitle>
            {pendingRevisions.length > 0 && (
              <button
                onClick={() => navigate('/study/revisions')}
                className="text-[10px] font-bold hover:underline"
                style={{ color: 'var(--text-dim)' }}
              >
                Ver todas →
              </button>
            )}
          </div>

          {pendingRevisions.length === 0 ? (
            <EmptyCard
              icon="✅"
              text="Nenhuma revisão pendente"
              sub="Ótimo trabalho!"
            />
          ) : (
            <div className="flex flex-col gap-2">
              {pendingRevisions.slice(0, 6).map(r => {
                const isOverdue = r.revisionDate < todayStr;
                return (
                  <div
                    key={r.id}
                    className="flex items-center gap-3 p-3 rounded-xl border"
                    style={{
                      borderColor: isOverdue
                        ? 'rgba(239,68,68,.3)'
                        : 'var(--border)',
                      background: isOverdue
                        ? 'rgba(239,68,68,.05)'
                        : 'var(--bg-surface)',
                    }}
                  >
                    <div
                      className="w-2 h-8 rounded-full shrink-0"
                      style={{ background: r.subjectColor }}
                    />
                    <div className="flex-1 min-w-0">
                      <div
                        className="text-[10px] font-bold uppercase tracking-wide"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        {r.subjectName}
                        {isOverdue && (
                          <span className="ml-2 text-[9px] text-red-400 normal-case font-bold">
                            atrasada ({fmtDate(r.revisionDate)})
                          </span>
                        )}
                      </div>
                      <div
                        className="text-sm font-medium truncate"
                        style={{ color: 'var(--text-main)' }}
                      >
                        {r.subtopicName}
                      </div>
                      <div
                        className="text-[10px]"
                        style={{ color: 'var(--text-dim)' }}
                      >
                        R{r.stage}
                      </div>
                    </div>
                    {/* ações inline */}
                    <div className="flex gap-1 shrink-0">
                      {[
                        { score: 5, label: 'F', color: '#10B981' },
                        { score: 3, label: 'M', color: '#F59E0B' },
                        { score: 1, label: 'D', color: '#EF4444' },
                      ].map(opt => (
                        <button
                          key={opt.score}
                          onClick={() => completeRev(r.id, opt.score)}
                          className="w-7 h-7 rounded-lg text-[10px] font-black text-white"
                          style={{ background: opt.color }}
                          title={
                            opt.score === 5
                              ? 'Fácil'
                              : opt.score === 3
                                ? 'Médio'
                                : 'Difícil'
                          }
                        >
                          {opt.label}
                        </button>
                      ))}
                      <button
                        onClick={() => navigate('/study/revisions')}
                        className="w-7 h-7 rounded-lg text-[10px] font-bold border"
                        style={{
                          borderColor: 'var(--border)',
                          color: 'var(--text-dim)',
                        }}
                      >
                        ▶
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* sessões de hoje */}
        {todaySessions.length > 0 && (
          <div>
            <SectionTitle>Feito hoje</SectionTitle>
            <div className="flex flex-col gap-2">
              {todaySessions.map(s => {
                const subj = subjects.find(x => x.id === s.subjectId);
                const modes = s.modes || (s.studyType ? [s.studyType] : []);
                const modeIcons = modes
                  .map(
                    m =>
                      ({
                        leitura: '📖',
                        video: '▶️',
                        questoes: '🎯',
                        flashcards: '🃏',
                        revisao: '🔄',
                        feynman: '🧠',
                        recall: '⚡',
                        mpa: '🔗',
                        mapa: '🗺️',
                      })[m] || '📖'
                  )
                  .join('');
                const acc =
                  s.questionsAnswered > 0
                    ? Math.round(
                        (s.questionsCorrect / s.questionsAnswered) * 100
                      )
                    : null;
                const methodBadges = [
                  s.connection && '🧠',
                  s.gaps && '⚠️',
                  s.feynmanNote && '🎤',
                  s.recallText && '⚡',
                  s.anchor && '🔗',
                ].filter(Boolean);
                return (
                  <div
                    key={s.id}
                    className="flex items-center gap-3 p-3 rounded-xl border"
                    style={{
                      background: 'var(--bg-surface)',
                      borderColor: 'var(--border)',
                    }}
                  >
                    <div
                      className="w-2 h-8 rounded-full shrink-0"
                      style={{ background: subj?.color || 'var(--primary)' }}
                    />
                    <div className="flex-1 min-w-0">
                      <div
                        className="text-[10px] font-bold uppercase tracking-wide"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        {subj?.name || 'Matéria'} · {modeIcons}
                        {methodBadges.map((b, i) => (
                          <span key={i} className="ml-1">
                            {b}
                          </span>
                        ))}
                      </div>
                      <div
                        className="text-sm font-medium"
                        style={{ color: 'var(--text-main)' }}
                      >
                        {formatMinutes(s.totalMinutes)}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      {acc !== null && (
                        <div
                          className="text-sm font-bold"
                          style={{ color: acc >= 70 ? '#10B981' : '#F59E0B' }}
                        >
                          {acc}%
                        </div>
                      )}
                      {s.xpEarned && (
                        <div
                          className="text-[10px]"
                          style={{ color: 'var(--text-dim)' }}
                        >
                          +{s.xpEarned} XP
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* CTA se não estudou nada */}
        {todaySessions.length === 0 && (
          <div
            className="p-6 rounded-2xl border text-center"
            style={{
              borderColor: 'var(--border)',
              background: 'var(--bg-surface)',
            }}
          >
            <div className="text-2xl mb-2">📚</div>
            <div
              className="font-bold mb-1"
              style={{ color: 'var(--text-main)' }}
            >
              Nenhuma sessão hoje ainda
            </div>
            <div className="text-sm mb-4" style={{ color: 'var(--text-dim)' }}>
              O profissional bate o ponto. 20 minutos já bastam para manter a
              engrenagem girando.
            </div>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => openSessionModal()}
                className="px-6 py-2.5 rounded-xl font-bold text-sm text-white"
                style={{ background: 'var(--primary)' }}
              >
                Iniciar sessão
              </button>
              {pendingRevisions.length > 0 && (
                <button
                  onClick={() => navigate('/study/revisions')}
                  className="px-6 py-2.5 rounded-xl font-bold text-sm border"
                  style={{
                    borderColor: 'var(--border)',
                    color: 'var(--text-main)',
                  }}
                >
                  Ver revisões ({pendingRevisions.length})
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </StudyLayout>
  );
}
