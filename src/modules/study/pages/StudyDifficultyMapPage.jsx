import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useStudyStore } from '../../../stores/useStudyStore';
import { useSessionModalStore } from '../../../stores/useSessionModalStore';
import { StudyLayout } from '../components/StudyLayout';

export function StudyDifficultyMapPage() {
  const subjects = useStudyStore(s => s.subjects);
  const openSessionModal = useSessionModalStore(s => s.openModal);

  const [filterSubjectId, setFilterSubjectId] = useState('');
  const [filterStatus, setFilterStatus] = useState('critical'); // all | critical | warning | good | unpracticed
  const [sortBy, setSortBy] = useState('error_desc'); // error_desc | error_asc | questions_desc | name_asc

  // Achata e coleta todos os subtopicos enriquecidos com informações da matéria e do tópico pai
  const allSubtopics = useMemo(() => {
    const list = [];
    subjects.forEach(s => {
      s.topics?.forEach(t => {
        t.subtopics?.forEach(st => {
          const stats = st.stats || {
            questionsAnswered: 0,
            questionsCorrect: 0,
            totalMinutes: 0,
          };
          const q = stats.questionsAnswered || 0;
          const ok = stats.questionsCorrect || 0;
          const acc = q > 0 ? Math.round((ok / q) * 100) : null;

          list.push({
            id: st.id,
            name: st.name,
            subjectId: s.id,
            subjectName: s.name,
            subjectColor: s.color || 'var(--primary)',
            topicId: t.id,
            topicName: t.name,
            questionsAnswered: q,
            questionsCorrect: ok,
            accuracy: acc,
            status: st.status || 'nao_estudado',
          });
        });
      });
    });
    return list;
  }, [subjects]);

  // Filtros aplicados
  const filtered = useMemo(() => {
    return allSubtopics
      .filter(item => {
        // Filtro de matéria
        if (filterSubjectId && item.subjectId !== filterSubjectId) return false;

        // Filtro de status/aproveitamento
        if (filterStatus === 'critical') {
          return item.accuracy !== null && item.accuracy < 70;
        }
        if (filterStatus === 'warning') {
          return item.accuracy !== null && item.accuracy >= 50 && item.accuracy < 70;
        }
        if (filterStatus === 'good') {
          return item.accuracy !== null && item.accuracy >= 70;
        }
        if (filterStatus === 'unpracticed') {
          return item.accuracy === null;
        }
        return true; // 'all'
      })
      .sort((a, b) => {
        // Ordenações
        if (sortBy === 'error_desc') {
          // Mais críticos primeiro (menor acerto, priorizando quem tem dados)
          if (a.accuracy === null) return 1;
          if (b.accuracy === null) return -1;
          return a.accuracy - b.accuracy;
        }
        if (sortBy === 'error_asc') {
          // Melhores primeiro
          if (a.accuracy === null) return 1;
          if (b.accuracy === null) return -1;
          return b.accuracy - a.accuracy;
        }
        if (sortBy === 'questions_desc') {
          // Volume de questões resolvidas
          return b.questionsAnswered - a.questionsAnswered;
        }
        if (sortBy === 'name_asc') {
          return a.name.localeCompare(b.name);
        }
        return 0;
      });
  }, [allSubtopics, filterSubjectId, filterStatus, sortBy]);

  // Resumo de métricas gerais
  const statsSummary = useMemo(() => {
    let criticalCount = 0;
    let warningCount = 0;
    let goodCount = 0;
    let unpracticedCount = 0;
    let totalQuestions = 0;
    let totalCorrect = 0;

    allSubtopics.forEach(item => {
      totalQuestions += item.questionsAnswered;
      totalCorrect += item.questionsCorrect;

      if (item.accuracy === null) {
        unpracticedCount++;
      } else if (item.accuracy < 50) {
        criticalCount++;
      } else if (item.accuracy < 70) {
        warningCount++;
      } else {
        goodCount++;
      }
    });

    const globalAcc = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;

    return {
      critical: criticalCount,
      warning: warningCount,
      good: goodCount,
      unpracticed: unpracticedCount,
      totalQuestions,
      globalAcc,
    };
  }, [allSubtopics]);

  // Iniciar sessão de estudos focada neste subtópico
  function handlePraticar(item) {
    openSessionModal({
      preSubjectId: item.subjectId,
      preTopicId: item.topicId,
      preSubtopicId: item.id,
      preMode: 'questoes',
    });
  }

  return (
    <StudyLayout>
      <div className="flex flex-col max-h-[calc(100vh-80px)] overflow-y-auto custom-scrollbar pr-1 pb-10 space-y-6 animate-fade-in">
        {/* Cabeçalho */}
        <div>
          <h1
            className="text-2xl font-extrabold tracking-tight"
            style={{ color: 'var(--text-main)' }}
          >
            Mapa de Calor de Dificuldades
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-dim)' }}>
            Identifique gargalos de retenção e ataque os pontos fracos. Tópicos com acertos abaixo de 70% requerem revisão ativa urgente.
          </p>
        </div>

        {/* Estatísticas de Falhas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div
            className="p-4 rounded-2xl border text-center"
            style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
          >
            <div className="text-2xl font-black text-red-500">
              {statsSummary.critical + statsSummary.warning}
            </div>
            <div className="text-[10px] font-bold uppercase tracking-wider mt-1 text-text-dim">
              Tópicos Críticos (&lt;70%)
            </div>
          </div>

          <div
            className="p-4 rounded-2xl border text-center"
            style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
          >
            <div className="text-2xl font-black text-emerald-500">
              {statsSummary.good}
            </div>
            <div className="text-[10px] font-bold uppercase tracking-wider mt-1 text-text-dim">
              Tópicos Consolidados (&ge;70%)
            </div>
          </div>

          <div
            className="p-4 rounded-2xl border text-center"
            style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
          >
            <div
              className="text-2xl font-black"
              style={{
                color:
                  statsSummary.globalAcc >= 70
                    ? '#10B981'
                    : statsSummary.globalAcc >= 50
                      ? '#F59E0B'
                      : '#EF4444',
              }}
            >
              {statsSummary.globalAcc}%
            </div>
            <div className="text-[10px] font-bold uppercase tracking-wider mt-1 text-text-dim">
              Média de Acertos Global
            </div>
          </div>

          <div
            className="p-4 rounded-2xl border text-center"
            style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
          >
            <div className="text-2xl font-black text-blue-400">
              {statsSummary.totalQuestions}
            </div>
            <div className="text-[10px] font-bold uppercase tracking-wider mt-1 text-text-dim">
              Questões Resolvidas
            </div>
          </div>
        </div>

        {/* Visualização de Mini Grade (Heatmap) */}
        <div
          className="p-5 rounded-2xl border"
          style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
        >
          <h3 className="font-bold text-xs uppercase tracking-wider mb-3 text-text-dim">
            🗺️ Mapa de Densidade de Falhas (Aproveitamento)
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {allSubtopics.map(item => {
              let cellBg = 'bg-zinc-800/40 border-zinc-800/80';
              let title = `${item.name} (Sem questões resolvidas)`;

              if (item.accuracy !== null) {
                if (item.accuracy < 50) {
                  cellBg = 'bg-red-500/20 border-red-500/40 text-red-500';
                } else if (item.accuracy < 70) {
                  cellBg = 'bg-amber-500/20 border-amber-500/40 text-amber-500';
                } else {
                  cellBg = 'bg-emerald-500/20 border-emerald-500/40 text-emerald-500';
                }
                title = `${item.subjectName} > ${item.name}: ${item.accuracy}% (${item.questionsCorrect}/${item.questionsAnswered} questões)`;
              }

              return (
                <div
                  key={item.id}
                  className={`w-6 h-6 rounded-md border flex items-center justify-center text-[8px] font-bold cursor-help transition-all hover:scale-115 ${cellBg}`}
                  title={title}
                >
                  {item.accuracy !== null ? `${item.accuracy}` : '—'}
                </div>
              );
            })}
          </div>
          <div className="flex items-center gap-4 mt-4 text-[10px] text-text-dim flex-wrap">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-red-500/20 border border-red-500/40" />
              Crítico (&lt;50%)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-amber-500/20 border border-amber-500/40" />
              Alerta (50% - 69%)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-emerald-500/20 border border-emerald-500/40" />
              Excelente (&ge;70%)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-zinc-800/40 border border-zinc-800/80" />
              Sem Prática
            </span>
          </div>
        </div>

        {/* Barra de Filtros e Ordenação */}
        <div
          className="p-4 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-3"
          style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
        >
          <div className="flex items-center gap-2 flex-wrap">
            {/* Matéria */}
            <select
              value={filterSubjectId}
              onChange={e => setFilterSubjectId(e.target.value)}
              className="px-3 py-1.5 rounded-xl text-xs outline-none border"
              style={{
                background: 'var(--bg-surface-2)',
                borderColor: 'var(--border)',
                color: 'var(--text-main)',
              }}
            >
              <option value="">Todas as Matérias</option>
              {subjects.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>

            {/* Aproveitamento */}
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="px-3 py-1.5 rounded-xl text-xs outline-none border"
              style={{
                background: 'var(--bg-surface-2)',
                borderColor: 'var(--border)',
                color: 'var(--text-main)',
              }}
            >
              <option value="all">Todos os Tópicos</option>
              <option value="critical">Críticos / Alertas (&lt;70%)</option>
              <option value="warning">Somente Alerta (50% - 69%)</option>
              <option value="good">Excelente (&ge;70%)</option>
              <option value="unpracticed">Sem Prática / Sem Dados</option>
            </select>
          </div>

          {/* Ordenação */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-text-dim">Ordenar por:</span>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="px-3 py-1.5 rounded-xl text-xs outline-none border"
              style={{
                background: 'var(--bg-surface-2)',
                borderColor: 'var(--border)',
                color: 'var(--text-main)',
              }}
            >
              <option value="error_desc">Maior Erro (Prioritário)</option>
              <option value="error_asc">Menor Erro</option>
              <option value="questions_desc">Volume de Questões</option>
              <option value="name_asc">Nome Alfabético</option>
            </select>
          </div>
        </div>

        {/* Lista de Foco de Ataque */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <h3 className="font-bold text-sm" style={{ color: 'var(--text-main)' }}>
              Lista de Ataque Direto ({filtered.length})
            </h3>
            <span className="text-xs text-text-dim">Mostrando itens filtrados</span>
          </div>

          <div className="space-y-2">
            {filtered.length === 0 ? (
              <div
                className="flex flex-col items-center justify-center gap-2 py-12 rounded-2xl border"
                style={{
                  borderColor: 'var(--border)',
                  background: 'var(--bg-surface)',
                }}
              >
                <span className="text-3xl">🎉</span>
                <span className="text-sm font-medium" style={{ color: 'var(--text-dim)' }}>
                  Nenhum gargalo crítico encontrado com os filtros atuais!
                </span>
              </div>
            ) : (
              filtered.map(item => {
                const acc = item.accuracy;
                const isCritical = acc !== null && acc < 70;
                const progressColor = acc === null ? '#71717a' : acc >= 70 ? '#10B981' : acc >= 50 ? '#F59E0B' : '#EF4444';

                return (
                  <div
                    key={item.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border transition-all hover:bg-white/2"
                    style={{
                      background: 'var(--bg-surface)',
                      borderColor: isCritical ? `${progressColor}33` : 'var(--border)',
                      borderLeft: `4px solid ${progressColor}`,
                    }}
                  >
                    {/* Informações */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span
                          className="text-[10px] font-bold uppercase tracking-wider"
                          style={{ color: item.subjectColor }}
                        >
                          {item.subjectName}
                        </span>
                        <span className="text-text-dim text-[10px] font-medium">•</span>
                        <span className="text-text-dim text-[10px] font-medium truncate max-w-[150px]">
                          {item.topicName}
                        </span>
                      </div>
                      <h4
                        className="text-sm font-bold truncate"
                        style={{ color: 'var(--text-main)' }}
                      >
                        {item.name}
                      </h4>
                    </div>

                    {/* Estatísticas de Acerto */}
                    <div className="flex items-center gap-4 sm:gap-6">
                      <div className="flex flex-col items-end shrink-0">
                        {acc !== null ? (
                          <>
                            <span
                              className="text-sm font-black"
                              style={{ color: progressColor }}
                            >
                              {acc}% acertos
                            </span>
                            <span className="text-[10px] text-text-dim">
                              {item.questionsCorrect} de {item.questionsAnswered} q
                            </span>
                          </>
                        ) : (
                          <>
                            <span className="text-xs font-bold" style={{ color: progressColor }}>
                              Sem dados
                            </span>
                            <span className="text-[10px] text-text-dim">Nenhuma questão</span>
                          </>
                        )}
                      </div>

                      {/* Botão de Praticar */}
                      <button
                        onClick={() => handlePraticar(item)}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold text-white transition-opacity hover:opacity-95 shrink-0 flex items-center gap-1"
                        style={{ background: item.subjectColor }}
                      >
                        <span>🎯</span> Treinar
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </StudyLayout>
  );
}
