import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart, Bar, Cell, ResponsiveContainer } from 'recharts';
import toast from 'react-hot-toast';
import { useCycleStore } from '../../../stores/useCycleStore';
import { useConcursoStore } from '../../../stores/useConcursoStore';
import { useStudyStore } from '../../../stores/useStudyStore';
import { useSessionStore } from '../../../stores/useSessionStore';
import { useQuestionsStore } from '../../../stores/useQuestionsStore';
import { StudyLayoutV2 } from '../components/StudyLayoutV2';
import { BentoCard, SectionHeader, ProgressRing, Badge } from '../components/BentoCard';
import { CycleBuilder } from '../../study/components/CycleBuilder';
import { CycleDetailView } from '../../study/components/CycleDetailView';
import { WeeklyPlanner } from '../../study/components/WeeklyPlanner';

function minutesToHuman(min) {
  if (!min) return '0h';
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m > 0 ? `${h}h${m}m` : `${h}h`;
}

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
  transition: { duration: 0.35, ease: [0.4, 0, 0.2, 1] },
};

const stagger = { animate: { transition: { staggerChildren: 0.06 } } };

function ActiveCycleHero({ cycle, onOpen, onAdvance }) {
  const subjects = useStudyStore(s => s.subjects);
  const sessions = useSessionStore(s => s.sessions);
  const concursos = useConcursoStore(s => s.concursos);
  const questionsStore = useQuestionsStore();
  const concurso = concursos.find(c => c.id === cycle.concursoId);
  const todayStr = new Date().toISOString().slice(0, 10);

  const { pct, totalMeta, totalReal, items, forecastDays, avgDailyMin } = useMemo(() => {
    const roundStart = cycle.rodadaStartDate || todayStr;
    const enriched = cycle.items
      .slice()
      .sort((a, b) => (a.ordem || 0) - (b.ordem || 0))
      .map(i => {
        const subj = subjects.find(s => s.id === i.subjectId);
        const metaMin = (i.horasPorRodada || 1) * 60;
        const realMin = sessions
          .filter(s => s.date >= roundStart && s.subjectId === i.subjectId)
          .reduce((a, s) => a + (s.totalMinutes || 0), 0);
        return {
          ...i,
          subj,
          metaMin,
          realMin,
          pct: metaMin > 0 ? Math.min(100, Math.round((realMin / metaMin) * 100)) : 0,
          color: subj?.color || i.subjectColor || '#8B5CF6',
          questionCount: questionsStore.questions.filter(q => q.subjectId === i.subjectId).length,
        };
      });
    const tMeta = enriched.reduce((a, i) => a + i.metaMin, 0);
    const tReal = enriched.reduce((a, i) => a + i.realMin, 0);
    const daysSoFar = Math.max(1, Math.floor((new Date(todayStr) - new Date(roundStart)) / 86400000) + 1);
    const avgMin = tReal / daysSoFar;
    const forecast = avgMin > 0 ? Math.ceil(Math.max(0, tMeta - tReal) / avgMin) : null;
    return {
      pct: tMeta > 0 ? Math.min(100, Math.round((tReal / tMeta) * 100)) : 0,
      totalMeta: tMeta,
      totalReal: tReal,
      items: enriched,
      forecastDays: forecast,
      avgDailyMin: Math.round(avgMin),
    };
  }, [cycle, subjects, sessions, questionsStore, todayStr]);

  const allDone = items.length > 0 && items.every(i => i.pct >= 100);
  const nextItem = items.filter(i => i.pct < 100).sort((a, b) => a.pct - b.pct)[0];
  const chartData = items.map(i => ({
    name: (i.subj?.name || i.subjectName || '—').slice(0, 14),
    metaH: Math.round((i.metaMin / 60) * 10) / 10,
    realH: Math.round((Math.min(i.realMin, i.metaMin) / 60) * 10) / 10,
    color: i.color,
    done: i.pct >= 100,
  }));

  return (
    <BentoCard
      onClick={onOpen}
      glow="rgba(16,185,129,0.08)"
      gradient="linear-gradient(135deg, rgba(16,185,129,0.06) 0%, rgba(99,102,241,0.04) 100%)"
    >
      <div className="flex flex-col md:flex-row gap-5">
        <div className="flex items-center gap-4 md:w-64 shrink-0">
          <div className="relative">
            <ProgressRing value={pct} size={84} stroke={7} color="#10B981" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-lg font-black" style={{ color: '#10B981' }}>{pct}%</span>
            </div>
          </div>
          <div className="min-w-0">
            <Badge color="#10B981" variant="solid">ATIVO</Badge>
            <div className="font-black text-lg truncate mt-1" style={{ color: 'var(--text-main)' }}>
              {cycle.nome}
            </div>
            <div className="text-xs" style={{ color: 'var(--text-dim)' }}>
              Rodada {cycle.rodadaAtual} · {items.length} matérias
              {concurso && ` · ${concurso.nome}`}
            </div>
          </div>
        </div>

        <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { label: 'Progresso', value: `${minutesToHuman(totalReal)}`, sub: `de ${minutesToHuman(totalMeta)}` },
            { label: 'Ritmo', value: minutesToHuman(avgDailyMin), sub: 'ritmo/dia' },
            {
              label: 'Previsão',
              value: allDone ? '✓' : forecastDays === null ? '—' : `${forecastDays}d`,
              sub: allDone ? 'concluída' : 'previsão',
              color: allDone ? '#10B981' : forecastDays === null ? 'var(--text-dim)' : forecastDays <= 7 ? '#10B981' : '#F59E0B',
            },
          ].map((kpi, i) => (
            <motion.div
              key={i}
              className="text-center p-3 rounded-xl backdrop-blur-md bg-white/[0.03] border border-white/[0.06]"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.08 }}
            >
              <div className="text-lg font-black" style={{ color: kpi.color || 'var(--text-main)' }}>{kpi.value}</div>
              <div className="text-[9px] uppercase tracking-widest" style={{ color: 'var(--text-dim)' }}>{kpi.sub}</div>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="px-5 mt-4" style={{ height: 90 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }} barGap={3}>
            <Bar dataKey="metaH" fill="rgba(255,255,255,0.06)" radius={[4, 4, 0, 0]} barSize={14} />
            <Bar dataKey="realH" radius={[4, 4, 0, 0]} barSize={14}>
              {chartData.map((d, i) => (
                <Cell key={i} fill={d.done ? d.color : `${d.color}88`} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center gap-3 pt-4 mt-4 border-t border-white/[0.06]">
        <div className="flex flex-wrap gap-2 flex-1">
          {items.map((item, idx) => (
            <span key={idx} className="flex items-center gap-1 min-h-[28px] text-[10px] px-2 py-0.5 rounded-full" style={{ background: `${item.color}15`, color: item.color }}>
              <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: item.color }} />
              {item.subj?.name?.slice(0, 12) || item.subjectName?.slice(0, 12) || '—'}
              {item.questionCount > 0 && <span className="opacity-70"> · {item.questionCount}q</span>}
            </span>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3 pt-4 mt-2 border-t border-white/[0.06]">
        {allDone ? (
          <div className="flex-1 text-sm font-bold" style={{ color: '#10B981' }}>
            Rodada concluída — hora de avançar!
          </div>
        ) : nextItem ? (
          <div className="flex-1 flex items-center gap-2 min-w-0">
            <div className="w-2 h-2 rounded-full shrink-0" style={{ background: nextItem.color }} />
            <span className="text-xs truncate" style={{ color: 'var(--text-dim)' }}>
              Próxima: <strong style={{ color: 'var(--text-main)' }}>{nextItem.subj?.name || nextItem.subjectName}</strong>
              {' · '}faltam {minutesToHuman(Math.max(0, nextItem.metaMin - nextItem.realMin))}
            </span>
          </div>
        ) : <div className="flex-1" />}
        {allDone && (
          <button
            onClick={e => { e.stopPropagation(); onAdvance(); }}
            className="min-h-[44px] px-3 py-1.5 rounded-lg text-xs font-bold text-white shrink-0"
            style={{ background: '#10B981' }}
          >
            Avançar rodada →
          </button>
        )}
        <button
          onClick={e => { e.stopPropagation(); onOpen(); }}
          className="min-h-[44px] px-3 py-1.5 rounded-lg text-xs font-bold border border-white/10 shrink-0 hover:bg-white/5"
          style={{ color: 'var(--text-muted)' }}
        >
          Ver detalhes →
        </button>
      </div>
    </BentoCard>
  );
}

function CycleListRow({ cycle, onActivate, onClick }) {
  const subjects = useStudyStore(s => s.subjects);
  const sessions = useSessionStore(s => s.sessions);
  const roundStart = cycle.rodadaStartDate || '2000-01-01';
  const totalMeta = cycle.items.reduce((a, i) => a + (i.horasPorRodada || 1) * 60, 0);
  const subjectIds = new Set(cycle.items.map(i => i.subjectId).filter(Boolean));
  const totalReal = sessions
    .filter(s => s.date >= roundStart && subjectIds.has(s.subjectId))
    .reduce((a, s) => a + (s.totalMinutes || 0), 0);
  const pct = totalMeta > 0 ? Math.min(100, Math.round((totalReal / totalMeta) * 100)) : 0;

  return (
    <BentoCard span="full" onClick={onClick} padding className="flex items-center gap-3">
      <div className="relative shrink-0">
        <ProgressRing value={pct} size={40} stroke={4} color="#8B5CF6" />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[9px] font-black" style={{ color: '#8B5CF6' }}>{pct}%</span>
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-bold truncate" style={{ color: 'var(--text-main)' }}>{cycle.nome}</div>
        <div className="text-[10px]" style={{ color: 'var(--text-dim)' }}>Rodada {cycle.rodadaAtual} · {cycle.items.length} matérias</div>
      </div>
      <button
        onClick={e => { e.stopPropagation(); onActivate(); }}
        className="min-h-[44px] px-4 py-2 rounded-lg text-[10px] font-bold border border-white/10 shrink-0 hover:bg-white/5"
        style={{ color: 'var(--text-muted)' }}
      >
        Ativar
      </button>
    </BentoCard>
  );
}

function RoundsHistoryChart({ cycle }) {
  const history = cycle.roundsHistory || [];
  if (history.length === 0) return null;

  const maxMeta = Math.max(...history.map(h => h.totalMeta || 1), 1);
  const avgFeito = Math.round(history.reduce((a, h) => a + (h.totalFeito || 0), 0) / history.length);
  const avgDays = Math.round(
    history.reduce((a, h) => {
      if (!h.startedAt || !h.endedAt) return a;
      const d = Math.max(1, Math.round((new Date(h.endedAt) - new Date(h.startedAt)) / 86400000));
      return a + d;
    }, 0) / history.length
  );

  return (
    <BentoCard span="full">
      <SectionHeader title="Histórico de Rodadas" icon="📊" count={`${history.length} rodada${history.length > 1 ? 's' : ''}`} />
      <div className="flex gap-6 mb-4">
        <div>
          <div className="text-sm font-black" style={{ color: '#10B981' }}>{minutesToHuman(avgFeito)}</div>
          <div className="text-[9px] uppercase tracking-wider" style={{ color: 'var(--text-dim)' }}>média/rodada</div>
        </div>
        <div>
          <div className="text-sm font-black" style={{ color: 'var(--text-main)' }}>{avgDays || '—'}d</div>
          <div className="text-[9px] uppercase tracking-wider" style={{ color: 'var(--text-dim)' }}>duração média</div>
        </div>
      </div>
      <div className="flex items-end gap-2 h-24">
        {history.slice(-12).map((h, i) => {
          const pct = h.totalMeta > 0 ? Math.min(100, Math.round((h.totalFeito / h.totalMeta) * 100)) : 0;
          const barH = Math.max((h.totalFeito / maxMeta) * 100, 4);
          return (
            <motion.div
              key={i}
              className="flex-1 flex flex-col items-center gap-1"
              initial={{ scaleY: 0 }}
              animate={{ scaleY: 1 }}
              transition={{ delay: i * 0.04, duration: 0.4, ease: 'easeOut' }}
              style={{ transformOrigin: 'bottom' }}
            >
              <div
                className="w-full rounded-t"
                style={{ height: `${barH}%`, background: pct >= 100 ? '#10B981' : pct >= 60 ? '#8B5CF6' : '#F59E0B' }}
                title={`Rodada ${h.rodada}: ${minutesToHuman(h.totalFeito)} de ${minutesToHuman(h.totalMeta)} (${pct}%)`}
              />
              <span className="text-[9px] font-bold" style={{ color: 'var(--text-dim)' }}>R{h.rodada}</span>
            </motion.div>
          );
        })}
      </div>
    </BentoCard>
  );
}

export default function StudyCyclePageV2() {
  const { cycles, activeCycleId, addCycle, updateCycle, deleteCycle, setActiveCycle, advanceRound, generateWeeklyPlan } = useCycleStore();
  const allSessions = useSessionStore(s => s.sessions);
  const [view, setView] = useState('list');
  const [detailId, setDetailId] = useState(null);
  const [editCycleData, setEditCycleData] = useState(null);

  const activeCycle = cycles.find(c => c.id === activeCycleId);
  const detailCycle = cycles.find(c => c.id === detailId);

  const aggregateStats = useMemo(() => {
    const roundsCompleted = cycles.reduce((a, c) => a + Math.max(0, (c.rodadaAtual || 1) - 1), 0);
    const allCycleSubjectIds = new Set(cycles.flatMap(c => c.items.map(i => i.subjectId).filter(Boolean)));
    const weekAgo = new Date(Date.now() - 6 * 86400000).toISOString().slice(0, 10);
    const weekMinutes = allSessions
      .filter(s => s.date >= weekAgo && allCycleSubjectIds.has(s.subjectId))
      .reduce((a, s) => a + (s.totalMinutes || 0), 0);
    const allHistory = cycles.flatMap(c => c.roundsHistory || []);
    const avgRoundMinutes = allHistory.length > 0
      ? Math.round(allHistory.reduce((a, h) => a + (h.totalFeito || 0), 0) / allHistory.length)
      : 0;
    return { roundsCompleted, weekMinutes, avgRoundMinutes };
  }, [cycles, allSessions]);

  function handleSaveCycle(data) {
    if (editCycleData) {
      updateCycle(editCycleData.id, { nome: data.nome, concursoId: data.concursoId, totalHoras: data.totalHoras, items: data.items });
      toast.success('Ciclo atualizado!');
      setEditCycleData(null);
      setView('detail');
    } else {
      addCycle({ nome: data.nome, concursoId: data.concursoId || null, totalHoras: data.totalHoras || 24, items: data.items });
      const createdId = useCycleStore.getState().cycles.at(-1)?.id;
      if (createdId) {
        setDetailId(createdId);
        if (cycles.length === 0) setActiveCycle(createdId);
      }
      toast.success('Ciclo criado!');
      setEditCycleData(null);
      setView('detail');
    }
  }

  function handleEdit(cycle) {
    setEditCycleData(cycle);
    setView('builder');
  }

  function handleDelete(id) {
    if (!window.confirm('Excluir este ciclo?')) return;
    deleteCycle(id);
    if (detailId === id) setView('list');
    toast.success('Ciclo excluído.');
  }

  return (
    <StudyLayoutV2>
      <AnimatePresence mode="wait">
        <motion.div key={view + (detailId || '')} className="flex flex-col pb-10 space-y-5" {...fadeUp}>
          {view === 'detail' && detailCycle && (
            <>
              <CycleDetailView cycle={detailCycle} onBack={() => setView('list')} onEdit={() => handleEdit(detailCycle)} />
              <BentoCard span="full" padding className="flex justify-center">
                <button
                  onClick={() => handleDelete(detailCycle.id)}
                  className="px-4 py-2 rounded-xl text-xs font-bold border border-white/10 hover:bg-red-500/10 transition-colors"
                  style={{ color: 'var(--text-dim)' }}
                >
                  Excluir este ciclo
                </button>
              </BentoCard>
            </>
          )}

          {view === 'list' && (
            <motion.div className="space-y-5" {...stagger} animate="animate" initial="initial">
              <motion.div {...fadeUp}>
                <SectionHeader
                  title="Ciclos de Estudo"
                  icon="🔄"
                  count={cycles.length > 0 ? `${cycles.length} ciclo${cycles.length > 1 ? 's' : ''}` : undefined}
                />
              </motion.div>

              {cycles.length > 0 && (
                <motion.div className="grid grid-cols-12 gap-3" {...fadeUp}>
                  <BentoCard span="4/12" padding className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-dim)' }}>Esta semana</span>
                    <span className="text-2xl font-black" style={{ color: 'var(--text-main)' }}>{minutesToHuman(aggregateStats.weekMinutes)}</span>
                  </BentoCard>
                  <BentoCard span="4/12" padding className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-dim)' }}>Rodadas concluídas</span>
                    <span className="text-2xl font-black" style={{ color: '#10B981' }}>{aggregateStats.roundsCompleted}</span>
                  </BentoCard>
                  {aggregateStats.avgRoundMinutes > 0 && (
                    <BentoCard span="4/12" padding className="flex flex-col gap-1">
                      <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-dim)' }}>Média/rodada</span>
                      <span className="text-2xl font-black" style={{ color: 'var(--text-main)' }}>{minutesToHuman(aggregateStats.avgRoundMinutes)}</span>
                    </BentoCard>
                  )}
                </motion.div>
              )}

              <motion.div className="flex justify-end" {...fadeUp}>
                <button
                  onClick={() => { setEditCycleData(null); setView('builder'); }}
                  className="px-4 py-2.5 rounded-xl text-sm font-bold text-white shrink-0"
                  style={{ background: 'linear-gradient(135deg, #10B981, #6366F1)' }}
                >
                  + Novo ciclo
                </button>
              </motion.div>

              {activeCycle && (
                <motion.div {...fadeUp}>
                  <SectionHeader title="Ciclo ativo" icon="⚡" />
                  <ActiveCycleHero
                    cycle={activeCycle}
                    onOpen={() => { setDetailId(activeCycle.id); setView('detail'); }}
                    onAdvance={() => { advanceRound(activeCycle.id); toast.success(`Rodada ${activeCycle.rodadaAtual + 1} iniciada!`); }}
                  />
                </motion.div>
              )}

              {activeCycle && activeCycle.items?.length > 0 && (
                <motion.div {...fadeUp}>
                  <BentoCard span="full">
                    {!activeCycle.weeklyPlan || Object.keys(activeCycle.weeklyPlan).length === 0 ? (
                      <div className="flex flex-col items-center gap-3 py-6">
                        <span className="text-3xl">📅</span>
                        <div className="text-center">
                          <div className="text-sm font-bold" style={{ color: 'var(--text-main)' }}>Plano semanal não gerado</div>
                          <div className="text-[11px] mt-1" style={{ color: 'var(--text-dim)' }}>Distribua automaticamente os blocos de estudo nos dias da semana</div>
                        </div>
                        <button
                          onClick={() => { generateWeeklyPlan(activeCycle.id); toast.success('Plano semanal gerado!'); }}
                          className="px-4 py-2 rounded-xl text-sm font-bold text-white"
                          style={{ background: 'linear-gradient(135deg, #10B981, #6366F1)' }}
                        >
                          Gerar Plano Semanal
                        </button>
                      </div>
                    ) : (
                      <WeeklyPlanner cycle={activeCycle} />
                    )}
                  </BentoCard>
                </motion.div>
              )}

              {activeCycle && (activeCycle.roundsHistory || []).length > 0 && (
                <motion.div {...fadeUp}><RoundsHistoryChart cycle={activeCycle} /></motion.div>
              )}

              {cycles.filter(c => c.id !== activeCycleId).length > 0 && (
                <motion.div {...fadeUp}>
                  <SectionHeader title="Outros ciclos" icon="📋" count={cycles.filter(c => c.id !== activeCycleId).length} />
                  <div className="space-y-2">
                    {cycles.filter(c => c.id !== activeCycleId).map(cycle => (
                      <CycleListRow
                        key={cycle.id}
                        cycle={cycle}
                        onActivate={() => { setActiveCycle(cycle.id); toast.success(`"${cycle.nome}" ativado!`); }}
                        onClick={() => { setDetailId(cycle.id); setView('detail'); }}
                      />
                    ))}
                  </div>
                </motion.div>
              )}

              {cycles.length === 0 && (
                <motion.div {...fadeUp}>
                  <BentoCard span="full" padding className="flex flex-col items-center justify-center gap-4 py-16 border-dashed">
                    <span className="text-4xl">🔄</span>
                    <div className="text-center">
                      <div className="font-bold mb-1" style={{ color: 'var(--text-main)' }}>Crie seu primeiro ciclo</div>
                      <div className="text-sm" style={{ color: 'var(--text-dim)' }}>Importe o edital e distribua as horas proporcionalmente ao peso de cada matéria.</div>
                    </div>
                    <button
                      onClick={() => setView('builder')}
                      className="px-6 py-2.5 rounded-xl font-bold text-sm text-white"
                      style={{ background: 'linear-gradient(135deg, #10B981, #6366F1)' }}
                    >
                      Criar ciclo
                    </button>
                  </BentoCard>
                </motion.div>
              )}
            </motion.div>
          )}

          {view === 'builder' && (
            <CycleBuilder
              editCycle={editCycleData}
              onSave={handleSaveCycle}
              onClose={() => { setEditCycleData(null); setView(detailId ? 'detail' : 'list'); }}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </StudyLayoutV2>
  );
}
