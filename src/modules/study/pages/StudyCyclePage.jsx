// StudyCyclePage.jsx — Orquestrador principal do módulo de ciclos
import { useState, useMemo } from 'react';
import { StudyLayout } from '../components/StudyLayout';
import { useCycleStore } from '../../../stores/useCycleStore';
import { useConcursoStore } from '../../../stores/useConcursoStore';
import { useStudyStore } from '../../../stores/useStudyStore';
import { useSessionStore } from '../../../stores/useSessionStore';
import { CycleBuilder } from '../components/CycleBuilder';
import { CycleDetailView } from '../components/CycleDetailView';
import { BarChart, Bar, Cell, ResponsiveContainer } from 'recharts';
import toast from 'react-hot-toast';

// ── helpers ───────────────────────────────────────────────────────────────────

function minutesToHuman(min) {
  if (!min) return '0h';
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m > 0 ? `${h}h${m}m` : `${h}h`;
}

// ── anel de progresso (mesmo padrão visual usado em Matérias) ─────────────────
function ProgressRing({ pct, color, size = 56, thickness = 6 }) {
  return (
    <div
      className="rounded-full flex items-center justify-center shrink-0"
      style={{
        width: size,
        height: size,
        background: `conic-gradient(${color} ${pct * 3.6}deg, var(--bg-surface-2) 0deg)`,
      }}
    >
      <div
        className="rounded-full flex items-center justify-center font-black"
        style={{
          width: size - thickness * 2,
          height: size - thickness * 2,
          background: 'var(--bg-surface)',
          color: 'var(--text-main)',
          fontSize: size < 50 ? 10 : 12,
        }}
      >
        {pct}%
      </div>
    </div>
  );
}

// ── ActiveCycleHero — versão rica do ciclo ativo, com forecast e próxima matéria
function ActiveCycleHero({ cycle, onOpen, onAdvance }) {
  const subjects = useStudyStore(s => s.subjects);
  const sessions = useSessionStore(s => s.sessions);
  const concursos = useConcursoStore(s => s.concursos);
  const concurso = concursos.find(c => c.id === cycle.concursoId);
  const todayStr = new Date().toISOString().slice(0, 10);

  const { pct, totalMeta, totalReal, items, forecastDays, avgDailyMin } =
    useMemo(() => {
      const roundStart = cycle.rodadaStartDate || todayStr;
      const subjectIds = new Set(
        cycle.items.map(i => i.subjectId).filter(Boolean)
      );
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
            pct:
              metaMin > 0
                ? Math.min(100, Math.round((realMin / metaMin) * 100))
                : 0,
            color: subj?.color || i.subjectColor || '#8B5CF6',
          };
        });
      const tMeta = enriched.reduce((a, i) => a + i.metaMin, 0);
      const tReal = enriched.reduce((a, i) => a + i.realMin, 0);
      const daysSoFar = Math.max(
        1,
        Math.floor((new Date(todayStr) - new Date(roundStart)) / 86400000) + 1
      );
      const avgMin = tReal / daysSoFar;
      const forecast =
        avgMin > 0 ? Math.ceil(Math.max(0, tMeta - tReal) / avgMin) : null;
      return {
        pct: tMeta > 0 ? Math.min(100, Math.round((tReal / tMeta) * 100)) : 0,
        totalMeta: tMeta,
        totalReal: tReal,
        items: enriched,
        forecastDays: forecast,
        avgDailyMin: Math.round(avgMin),
      };
    }, [cycle, subjects, sessions, todayStr]);

  const allDone = items.length > 0 && items.every(i => i.pct >= 100);
  const nextItem = items
    .filter(i => i.pct < 100)
    .sort((a, b) => a.pct - b.pct)[0];
  const chartData = items.map(i => ({
    name: (i.subj?.name || i.subjectName || '—').slice(0, 14),
    metaH: Math.round((i.metaMin / 60) * 10) / 10,
    realH: Math.round((Math.min(i.realMin, i.metaMin) / 60) * 10) / 10,
    color: i.color,
    done: i.pct >= 100,
  }));

  return (
    <div
      onClick={onOpen}
      className="rounded-2xl border overflow-hidden cursor-pointer hover:border-[var(--primary)] transition-colors"
      style={{
        borderColor: 'var(--primary)44',
        background: 'var(--bg-surface)',
      }}
    >
      <div className="p-5 flex flex-col md:flex-row gap-5">
        {/* esquerda: anel + info */}
        <div className="flex items-center gap-4 md:w-64 shrink-0">
          <ProgressRing
            pct={pct}
            color="var(--primary)"
            size={84}
            thickness={8}
          />
          <div className="min-w-0">
            <div
              className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full inline-block mb-1"
              style={{ background: 'var(--primary)', color: 'white' }}
            >
              ATIVO
            </div>
            <div
              className="font-black text-lg truncate"
              style={{ color: 'var(--text-main)' }}
            >
              {cycle.nome}
            </div>
            <div className="text-xs" style={{ color: 'var(--text-dim)' }}>
              Rodada {cycle.rodadaAtual} · {items.length} matérias
              {concurso && ` · ${concurso.nome}`}
            </div>
          </div>
        </div>

        {/* meio: mini KPIs */}
        <div className="flex-1 grid grid-cols-3 gap-3">
          <div
            className="text-center p-2 rounded-xl"
            style={{ background: 'var(--bg-surface-2)' }}
          >
            <div
              className="text-lg font-black"
              style={{ color: 'var(--text-main)' }}
            >
              {minutesToHuman(totalReal)}
            </div>
            <div
              className="text-[9px] uppercase tracking-widest"
              style={{ color: 'var(--text-dim)' }}
            >
              de {minutesToHuman(totalMeta)}
            </div>
          </div>
          <div
            className="text-center p-2 rounded-xl"
            style={{ background: 'var(--bg-surface-2)' }}
          >
            <div
              className="text-lg font-black"
              style={{ color: 'var(--text-main)' }}
            >
              {minutesToHuman(avgDailyMin)}
            </div>
            <div
              className="text-[9px] uppercase tracking-widest"
              style={{ color: 'var(--text-dim)' }}
            >
              ritmo/dia
            </div>
          </div>
          <div
            className="text-center p-2 rounded-xl"
            style={{ background: 'var(--bg-surface-2)' }}
          >
            <div
              className="text-lg font-black"
              style={{
                color: allDone
                  ? '#10B981'
                  : forecastDays === null
                    ? 'var(--text-dim)'
                    : forecastDays <= 7
                      ? '#10B981'
                      : '#F59E0B',
              }}
            >
              {allDone ? '✓' : forecastDays === null ? '—' : `${forecastDays}d`}
            </div>
            <div
              className="text-[9px] uppercase tracking-widest"
              style={{ color: 'var(--text-dim)' }}
            >
              {allDone ? 'concluída' : 'previsão'}
            </div>
          </div>
        </div>
      </div>

      {/* mini gráfico por matéria */}
      <div className="px-5" style={{ height: 90 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
            barGap={3}
          >
            <Bar
              dataKey="metaH"
              fill="var(--bg-surface-2)"
              radius={[3, 3, 0, 0]}
              barSize={14}
            />
            <Bar dataKey="realH" radius={[3, 3, 0, 0]} barSize={14}>
              {chartData.map((d, i) => (
                <Cell key={i} fill={d.done ? d.color : `${d.color}88`} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* footer: próxima matéria + ações */}
      <div
        className="flex items-center gap-3 p-4 border-t"
        style={{
          borderColor: 'var(--border)',
          background: 'var(--bg-surface-2)',
        }}
      >
        {allDone ? (
          <div
            className="flex-1 text-sm font-bold"
            style={{ color: '#10B981' }}
          >
            ✅ Rodada concluída — hora de avançar!
          </div>
        ) : nextItem ? (
          <div className="flex-1 flex items-center gap-2 min-w-0">
            <div
              className="w-2 h-2 rounded-full shrink-0"
              style={{ background: nextItem.color }}
            />
            <span
              className="text-xs truncate"
              style={{ color: 'var(--text-dim)' }}
            >
              Próxima:{' '}
              <strong style={{ color: 'var(--text-main)' }}>
                {nextItem.subj?.name || nextItem.subjectName}
              </strong>
              {' · '}faltam{' '}
              {minutesToHuman(Math.max(0, nextItem.metaMin - nextItem.realMin))}
            </span>
          </div>
        ) : (
          <div className="flex-1" />
        )}
        {allDone && (
          <button
            onClick={e => {
              e.stopPropagation();
              onAdvance();
            }}
            className="px-3 py-1.5 rounded-lg text-xs font-bold text-white shrink-0"
            style={{ background: '#10B981' }}
          >
            Avançar rodada →
          </button>
        )}
        <button
          onClick={e => {
            e.stopPropagation();
            onOpen();
          }}
          className="px-3 py-1.5 rounded-lg text-xs font-bold border shrink-0"
          style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
        >
          Ver detalhes →
        </button>
      </div>
    </div>
  );
}

// ── CycleListRow — versão compacta pra ciclos não-ativos ───────────────────────
function CycleListRow({ cycle, onActivate, onClick }) {
  const subjects = useStudyStore(s => s.subjects);
  const sessions = useSessionStore(s => s.sessions);
  const roundStart = cycle.rodadaStartDate || '2000-01-01';
  const totalMeta = cycle.items.reduce(
    (a, i) => a + (i.horasPorRodada || 1) * 60,
    0
  );
  const subjectIds = new Set(cycle.items.map(i => i.subjectId).filter(Boolean));
  const totalReal = sessions
    .filter(s => s.date >= roundStart && subjectIds.has(s.subjectId))
    .reduce((a, s) => a + (s.totalMinutes || 0), 0);
  const pct =
    totalMeta > 0
      ? Math.min(100, Math.round((totalReal / totalMeta) * 100))
      : 0;

  return (
    <div
      onClick={onClick}
      className="flex items-center gap-3 p-3 rounded-xl border cursor-pointer hover:border-[var(--border-strong)] transition-all"
      style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
    >
      <ProgressRing pct={pct} color="#8B5CF6" size={36} thickness={4} />
      <div className="flex-1 min-w-0">
        <div
          className="text-sm font-bold truncate"
          style={{ color: 'var(--text-main)' }}
        >
          {cycle.nome}
        </div>
        <div className="text-[10px]" style={{ color: 'var(--text-dim)' }}>
          Rodada {cycle.rodadaAtual} · {cycle.items.length} matérias
        </div>
      </div>
      <button
        onClick={e => {
          e.stopPropagation();
          onActivate();
        }}
        className="px-3 py-1.5 rounded-lg text-[10px] font-bold border shrink-0 hover:bg-white/5"
        style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
      >
        Ativar
      </button>
    </div>
  );
}

// ── Histórico de Rodadas — barras de aderência (feito vs meta) por rodada ────
function RoundsHistoryChart({ cycle }) {
  const history = cycle.roundsHistory || [];
  if (history.length === 0) {
    return (
      <div
        className="p-4 rounded-2xl border text-xs italic text-center"
        style={{ borderColor: 'var(--border)', color: 'var(--text-dim)' }}
      >
        Nenhuma rodada concluída ainda — avance a rodada atual pra começar a
        construir o histórico.
      </div>
    );
  }

  const maxMeta = Math.max(...history.map(h => h.totalMeta || 1), 1);
  const avgFeito = Math.round(
    history.reduce((a, h) => a + (h.totalFeito || 0), 0) / history.length
  );
  const avgDays = Math.round(
    history.reduce((a, h) => {
      if (!h.startedAt || !h.endedAt) return a;
      const d = Math.max(
        1,
        Math.round((new Date(h.endedAt) - new Date(h.startedAt)) / 86400000)
      );
      return a + d;
    }, 0) / history.length
  );

  return (
    <div
      className="p-5 rounded-2xl border"
      style={{ borderColor: 'var(--border)', background: 'var(--bg-surface)' }}
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3
            className="text-sm font-bold"
            style={{ color: 'var(--text-main)' }}
          >
            Histórico de Rodadas
          </h3>
          <p className="text-[11px]" style={{ color: 'var(--text-dim)' }}>
            {history.length} rodada{history.length > 1 ? 's' : ''} concluída
            {history.length > 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex gap-4 text-right">
          <div>
            <div
              className="text-sm font-black"
              style={{ color: 'var(--primary)' }}
            >
              {minutesToHuman(avgFeito)}
            </div>
            <div
              className="text-[9px] uppercase tracking-wider"
              style={{ color: 'var(--text-dim)' }}
            >
              média/rodada
            </div>
          </div>
          <div>
            <div
              className="text-sm font-black"
              style={{ color: 'var(--text-main)' }}
            >
              {avgDays || '—'}d
            </div>
            <div
              className="text-[9px] uppercase tracking-wider"
              style={{ color: 'var(--text-dim)' }}
            >
              duração média
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-end gap-2 h-24">
        {history.slice(-12).map((h, i) => {
          const pct =
            h.totalMeta > 0
              ? Math.min(100, Math.round((h.totalFeito / h.totalMeta) * 100))
              : 0;
          const barH = Math.max((h.totalFeito / maxMeta) * 100, 4);
          return (
            <div
              key={i}
              className="flex-1 flex flex-col items-center gap-1 group relative"
            >
              <div
                className="w-full rounded-t transition-all"
                style={{
                  height: `${barH}%`,
                  background:
                    pct >= 100
                      ? '#10B981'
                      : pct >= 60
                        ? 'var(--primary)'
                        : '#F59E0B',
                }}
                title={`Rodada ${h.rodada}: ${minutesToHuman(h.totalFeito)} de ${minutesToHuman(h.totalMeta)} (${pct}%)`}
              />
              <span
                className="text-[9px] font-bold"
                style={{ color: 'var(--text-dim)' }}
              >
                R{h.rodada}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function StudyCyclePage() {
  const {
    cycles,
    activeCycleId,
    addCycle,
    updateCycle,
    deleteCycle,
    setActiveCycle,
    advanceRound,
  } = useCycleStore();
  const allSessions = useSessionStore(s => s.sessions);

  const [view, setView] = useState('list'); // list | detail | builder
  const [detailId, setDetailId] = useState(null);
  const [editCycleData, setEditCycleData] = useState(null);

  const activeCycle = cycles.find(c => c.id === activeCycleId);
  const detailCycle = cycles.find(c => c.id === detailId);

  // estatísticas agregadas de todos os ciclos — pro cabeçalho
  const aggregateStats = useMemo(() => {
    const roundsCompleted = cycles.reduce(
      (a, c) => a + Math.max(0, (c.rodadaAtual || 1) - 1),
      0
    );
    const allCycleSubjectIds = new Set(
      cycles.flatMap(c => c.items.map(i => i.subjectId).filter(Boolean))
    );
    const weekAgo = new Date(Date.now() - 6 * 86400000)
      .toISOString()
      .slice(0, 10);
    const weekMinutes = allSessions
      .filter(s => s.date >= weekAgo && allCycleSubjectIds.has(s.subjectId))
      .reduce((a, s) => a + (s.totalMinutes || 0), 0);
    // tempo médio por rodada — média de totalFeito em todas as rodadas já
    // encerradas (roundsHistory), de todos os ciclos
    const allHistory = cycles.flatMap(c => c.roundsHistory || []);
    const avgRoundMinutes =
      allHistory.length > 0
        ? Math.round(
            allHistory.reduce((a, h) => a + (h.totalFeito || 0), 0) /
              allHistory.length
          )
        : 0;
    return { roundsCompleted, weekMinutes, avgRoundMinutes };
  }, [cycles, allSessions]);

  // ── criar / salvar ciclo ──────────────────────────────────────────────────

  function handleSaveCycle(data) {
    if (editCycleData) {
      // ── EDITAR ciclo existente ────────────────────────────────────────────
      updateCycle(editCycleData.id, {
        nome: data.nome,
        concursoId: data.concursoId,
        totalHoras: data.totalHoras,
        items: data.items,
      });
      toast.success('Ciclo atualizado!');
      // Bug 3: limpar editCycleData ANTES de trocar view para evitar flash
      setEditCycleData(null);
      setView('detail');
    } else {
      // ── CRIAR novo ciclo ──────────────────────────────────────────────────
      // Bug 1: NÃO montar o objeto com id aqui — deixar o store fazer isso
      // e capturar o id que o store gerou via getState() após o set
      addCycle({
        nome: data.nome,
        concursoId: data.concursoId || null,
        totalHoras: data.totalHoras || 24,
        items: data.items,
      });

      // Pega o id do ciclo recém-inserido (último do array, pois o store faz push)
      const createdId = useCycleStore.getState().cycles.at(-1)?.id;
      if (createdId) {
        setDetailId(createdId);
        // Ativa automaticamente se é o primeiro ciclo
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

  // ── render ────────────────────────────────────────────────────────────────

  return (
    <StudyLayout>
      <div className="flex flex-col pb-10 space-y-5 animate-fade-in">
        {/* ── DETAIL VIEW ── */}
        {view === 'detail' && detailCycle && (
          <>
            <CycleDetailView
              cycle={detailCycle}
              onBack={() => setView('list')}
              onEdit={() => handleEdit(detailCycle)}
            />
            <button
              onClick={() => handleDelete(detailCycle.id)}
              className="w-full py-2 rounded-xl text-xs font-bold border hover:bg-red-500/10 transition-colors"
              style={{ borderColor: 'var(--border)', color: 'var(--text-dim)' }}
            >
              🗑 Excluir este ciclo
            </button>
          </>
        )}

        {/* ── LIST VIEW ── */}
        {view === 'list' && (
          <>
            {/* cabeçalho */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <h1
                  className="text-2xl font-extrabold tracking-tight"
                  style={{ color: 'var(--text-main)' }}
                >
                  Ciclos de Estudo
                </h1>
                <p
                  className="text-sm mt-1"
                  style={{ color: 'var(--text-dim)' }}
                >
                  {cycles.length === 0
                    ? 'Nenhum ciclo ainda.'
                    : `${cycles.length} ciclo${cycles.length > 1 ? 's' : ''} cadastrado${cycles.length > 1 ? 's' : ''}`}
                </p>
              </div>

              {cycles.length > 0 && (
                <div className="flex gap-5 text-right">
                  <div>
                    <div
                      className="text-xl font-black"
                      style={{ color: 'var(--text-main)' }}
                    >
                      {minutesToHuman(aggregateStats.weekMinutes)}
                    </div>
                    <div className="text-[9px] font-bold uppercase tracking-wider text-text-dim">
                      Esta semana
                    </div>
                  </div>
                  <div>
                    <div
                      className="text-xl font-black"
                      style={{ color: 'var(--primary)' }}
                    >
                      {aggregateStats.roundsCompleted}
                    </div>
                    <div className="text-[9px] font-bold uppercase tracking-wider text-text-dim">
                      Rodadas concluídas
                    </div>
                  </div>
                  {aggregateStats.avgRoundMinutes > 0 && (
                    <div>
                      <div
                        className="text-xl font-black"
                        style={{ color: 'var(--text-main)' }}
                      >
                        {minutesToHuman(aggregateStats.avgRoundMinutes)}
                      </div>
                      <div className="text-[9px] font-bold uppercase tracking-wider text-text-dim">
                        Média/rodada
                      </div>
                    </div>
                  )}
                </div>
              )}

              <button
                onClick={() => {
                  setEditCycleData(null);
                  setView('builder');
                }}
                className="px-4 py-2.5 rounded-xl text-sm font-bold text-white shrink-0"
                style={{ background: 'var(--primary)' }}
              >
                + Novo ciclo
              </button>
            </div>

            {/* ciclo ativo em destaque */}
            {activeCycle && (
              <div>
                <div
                  className="text-[10px] font-bold uppercase tracking-widest mb-2"
                  style={{ color: 'var(--text-dim)' }}
                >
                  Ciclo ativo
                </div>
                <ActiveCycleHero
                  cycle={activeCycle}
                  onOpen={() => {
                    setDetailId(activeCycle.id);
                    setView('detail');
                  }}
                  onAdvance={() => {
                    advanceRound(activeCycle.id);
                    toast.success(
                      `Rodada ${activeCycle.rodadaAtual + 1} iniciada!`
                    );
                  }}
                />
              </div>
            )}

            {/* histórico de rodadas do ciclo ativo */}
            {activeCycle && (activeCycle.roundsHistory || []).length > 0 && (
              <RoundsHistoryChart cycle={activeCycle} />
            )}

            {/* outros ciclos */}
            {cycles.filter(c => c.id !== activeCycleId).length > 0 && (
              <div>
                <div
                  className="text-[10px] font-bold uppercase tracking-widest mb-2"
                  style={{ color: 'var(--text-dim)' }}
                >
                  Outros ciclos
                </div>
                <div className="space-y-2">
                  {cycles
                    .filter(c => c.id !== activeCycleId)
                    .map(cycle => (
                      <CycleListRow
                        key={cycle.id}
                        cycle={cycle}
                        onActivate={() => {
                          setActiveCycle(cycle.id);
                          toast.success(`"${cycle.nome}" ativado!`);
                        }}
                        onClick={() => {
                          setDetailId(cycle.id);
                          setView('detail');
                        }}
                      />
                    ))}
                </div>
              </div>
            )}

            {/* empty state */}
            {cycles.length === 0 && (
              <div
                className="flex flex-col items-center justify-center gap-4 py-16 rounded-2xl border border-dashed"
                style={{ borderColor: 'var(--border)' }}
              >
                <span className="text-4xl">🔄</span>
                <div className="text-center">
                  <div
                    className="font-bold mb-1"
                    style={{ color: 'var(--text-main)' }}
                  >
                    Crie seu primeiro ciclo
                  </div>
                  <div className="text-sm" style={{ color: 'var(--text-dim)' }}>
                    Importe o edital e distribua as horas proporcionalmente ao
                    peso de cada matéria.
                  </div>
                </div>
                <button
                  onClick={() => setView('builder')}
                  className="px-6 py-2.5 rounded-xl font-bold text-sm text-white"
                  style={{ background: 'var(--primary)' }}
                >
                  Criar ciclo
                </button>
              </div>
            )}
          </>
        )}

        {/* ── BUILDER VIEW ── */}
        {view === 'builder' && (
          <CycleBuilder
            editCycle={editCycleData}
            onSave={handleSaveCycle}
            onClose={() => {
              setEditCycleData(null);
              setView(detailId ? 'detail' : 'list');
            }}
          />
        )}
      </div>
    </StudyLayout>
  );
}
