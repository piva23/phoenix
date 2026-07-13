import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStudyStore } from '../../../stores/useStudyStore';
import { useSessionStore } from '../../../stores/useSessionStore';
import { useRevisionStore } from '../../../stores/useRevisionStore';
import { useCycleStore } from '../../../stores/useCycleStore';
import { useSessionModalStore } from '../../../stores/useSessionModalStore';
import { StudyLayout } from '../components/StudyLayout';
import { formatMinutes } from '../../../shared/utils/time';

const STATUS_CONFIG = {
  nao_estudado: {
    label: 'Não Estudado',
    color: '#8A8A98',
    bg: 'transparent',
    border: '#8A8A9833',
  },
  estudando: {
    label: 'Estudando',
    color: '#F59E0B',
    bg: '#F59E0B15',
    border: '#F59E0B44',
  },
  revisao: {
    label: 'Em Revisão',
    color: '#06B6D4',
    bg: '#06B6D415',
    border: '#06B6D444',
  },
  dominado: {
    label: 'Concluído',
    color: '#10B981',
    bg: '#10B98115',
    border: '#10B98144',
  },
};

export function StudySubjectDetailPage() {
  const { subjectId } = useParams();
  const navigate = useNavigate();
  const openSessionModal = useSessionModalStore(s => s.openModal);
  const {
    subjects,
    addTopic,
    updateTopic,
    deleteTopic,
    reorderTopics,
    addSubtopic,
    updateSubtopic,
    deleteSubtopic,
  } = useStudyStore();
  const sessions = useSessionStore(s => s.sessions);
  const getPendingToday = useRevisionStore(s => s.getPendingToday);
  const cycles = useCycleStore(s => s.cycles);
  const activeCycleId = useCycleStore(s => s.activeCycleId);

  // progresso desta matéria no ciclo ativo (se ela estiver nele)
  const cycleProgress = useMemo(() => {
    const cycle = cycles.find(c => c.id === activeCycleId);
    if (!cycle) return null;
    const item = cycle.items?.find(i => i.subjectId === subjectId);
    if (!item) return null;
    const metaMin = (item.horasPorRodada || 1) * 60;
    const roundStart = cycle.rodadaStartDate || '2000-01-01';
    const realMin = sessions
      .filter(s => s.date >= roundStart && s.subjectId === subjectId)
      .reduce((a, s) => a + (s.totalMinutes || 0), 0);
    return {
      pct:
        metaMin > 0 ? Math.min(100, Math.round((realMin / metaMin) * 100)) : 0,
      realMin,
      metaMin,
      rodada: cycle.rodadaAtual,
    };
  }, [cycles, activeCycleId, subjectId, sessions]);

  // Estados de Criação
  const [newTopicName, setNewTopicName] = useState('');
  const [newSubtopicData, setNewSubtopicData] = useState({
    topicId: null,
    name: '',
  });

  // Estados de Edição Inline
  const [editingTopic, setEditingTopic] = useState({ id: null, name: '' });
  const [editingSubtopic, setEditingSubtopic] = useState({
    id: null,
    topicId: null,
    name: '',
  });

  // Ferramentas de Visualização
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [collapsedTopics, setCollapsedTopics] = useState({});

  // Drag and drop de tópicos (nativo, sem lib)
  const [dragId, setDragId] = useState(null);
  const [overId, setOverId] = useState(null);

  const subject = subjects.find(s => s.id === subjectId);

  // Processamento de Estatísticas
  const statsMap = useMemo(() => {
    const map = {
      totalMins: 0,
      totalQ: 0,
      totalC: 0,
      totalFlashcards: 0,
      subtopics: {},
      topics: {},
    };
    if (!subject) return map;

    sessions.forEach(s => {
      if (s.subjectId === subjectId) {
        map.totalMins += s.totalMinutes || 0;
        map.totalQ += s.questionsAnswered || 0;
        map.totalC += s.questionsCorrect || 0;

        if (s.subtopicId) {
          if (!map.subtopics[s.subtopicId])
            map.subtopics[s.subtopicId] = { mins: 0, q: 0, c: 0, fc: 0 };
          map.subtopics[s.subtopicId].mins += s.totalMinutes || 0;
          map.subtopics[s.subtopicId].q += s.questionsAnswered || 0;
          map.subtopics[s.subtopicId].c += s.questionsCorrect || 0;
        }

        if (s.topicId) {
          if (!map.topics[s.topicId])
            map.topics[s.topicId] = { mins: 0, q: 0, c: 0, fc: 0 };
          map.topics[s.topicId].mins += s.totalMinutes || 0;
          map.topics[s.topicId].q += s.questionsAnswered || 0;
          map.topics[s.topicId].c += s.questionsCorrect || 0;
        }
      }
    });

    subject.topics?.forEach(t => {
      if (!map.topics[t.id]) map.topics[t.id] = { mins: 0, q: 0, c: 0, fc: 0 };
      t.subtopics?.forEach(st => {
        if (!map.subtopics[st.id])
          map.subtopics[st.id] = { mins: 0, q: 0, c: 0, fc: 0 };
        const fcCount = st.flashcards?.length || 0;
        map.subtopics[st.id].fc = fcCount;
        map.topics[t.id].fc += fcCount;
        map.totalFlashcards += fcCount;

        // gaps + inseguranças abertas — caderno de falhas
        const openGaps =
          (st.gaps || []).filter(g => !g.resolved).length +
          (st.insecurities || []).filter(i => !i.resolved).length;
        map.subtopics[st.id].openGaps = openGaps;
      });
    });

    // revisões pendentes por subtópico (atrasadas + hoje)
    const pending = getPendingToday();
    pending.forEach(r => {
      if (map.subtopics[r.subtopicId]) {
        map.subtopics[r.subtopicId].pendingRev =
          (map.subtopics[r.subtopicId].pendingRev || 0) + 1;
      }
    });

    return map;
  }, [sessions, subjectId, subject, getPendingToday]);

  if (!subject) {
    return (
      <StudyLayout>
        <div className="flex flex-col items-center justify-center h-64 text-text-muted">
          <span className="text-4xl mb-4">⚠️</span>
          <p>Matéria não encontrada.</p>
          <button
            onClick={() => navigate('/study/subjects')}
            className="mt-6 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-[var(--primary)] shadow-sm"
          >
            Voltar para Matérias
          </button>
        </div>
      </StudyLayout>
    );
  }

  const totalSubtopics =
    subject.topics?.reduce((acc, t) => acc + (t.subtopics?.length || 0), 0) ||
    0;
  const concluidos =
    subject.topics?.reduce(
      (acc, t) =>
        acc + (t.subtopics?.filter(st => st.status === 'dominado').length || 0),
      0
    ) || 0;
  const editalProgress =
    totalSubtopics > 0 ? Math.round((concluidos / totalSubtopics) * 100) : 0;

  const globalAccuracy =
    statsMap.totalQ > 0
      ? Math.round((statsMap.totalC / statsMap.totalQ) * 100)
      : null;
  const globalAccColor =
    globalAccuracy >= 70
      ? '#10B981'
      : globalAccuracy >= 50
        ? '#F59E0B'
        : '#EF4444';

  const toggleCollapse = topicId =>
    setCollapsedTopics(prev => ({ ...prev, [topicId]: !prev[topicId] }));
  const collapseAll = () => {
    const all = {};
    subject.topics?.forEach(t => (all[t.id] = true));
    setCollapsedTopics(all);
  };
  const expandAll = () => setCollapsedTopics({});

  // Handlers de Criação
  const handleAddTopic = e => {
    if (e.key === 'Enter' && newTopicName.trim()) {
      addTopic(subjectId, { name: newTopicName.trim() });
      setNewTopicName('');
    }
  };
  const handleAddSubtopic = (topicId, e) => {
    if (e.key === 'Enter' && newSubtopicData.name.trim()) {
      addSubtopic(subjectId, topicId, { name: newSubtopicData.name.trim() });
      setNewSubtopicData({ topicId: null, name: '' });
      setCollapsedTopics(prev => ({ ...prev, [topicId]: false }));
    }
  };

  // Handlers de Edição Inline e Exclusão
  const saveTopicEdit = () => {
    if (editingTopic.name.trim())
      updateTopic(subjectId, editingTopic.id, {
        name: editingTopic.name.trim(),
      });
    setEditingTopic({ id: null, name: '' });
  };
  const saveSubtopicEdit = () => {
    if (editingSubtopic.name.trim())
      updateSubtopic(subjectId, editingSubtopic.topicId, editingSubtopic.id, {
        name: editingSubtopic.name.trim(),
      });
    setEditingSubtopic({ id: null, topicId: null, name: '' });
  };

  const handleDeleteTopic = topic => {
    const hasChildren = (topic.subtopics || []).length > 0;
    const msg = hasChildren
      ? `Atenção: O tópico "${topic.name}" contém ${topic.subtopics.length} aulas. Se o excluir, todo o histórico e flashcards destas aulas serão perdidos. Tem a certeza absoluta?`
      : `Excluir o tópico "${topic.name}"?`;
    if (window.confirm(msg)) deleteTopic(subjectId, topic.id);
  };

  const handleDeleteSubtopic = (topicId, subtopic) => {
    if (
      window.confirm(
        `Excluir a aula "${subtopic.name}"? Todo o histórico associado será perdido.`
      )
    ) {
      deleteSubtopic(subjectId, topicId, subtopic.id);
    }
  };

  // Drag and drop de tópicos — só habilitado sem busca ativa (senão o índice
  // de "onde soltar" não bate com a ordem real do array)
  const dragEnabled = search === '';
  function handleDragStart(id) {
    if (!dragEnabled) return;
    setDragId(id);
  }
  function handleDragOver(e, id) {
    if (!dragEnabled || !dragId) return;
    e.preventDefault();
    if (id !== overId) setOverId(id);
  }
  function handleDrop(targetId) {
    if (!dragEnabled || !dragId || dragId === targetId) {
      setDragId(null);
      setOverId(null);
      return;
    }
    const ids = (subject.topics || []).map(t => t.id);
    const from = ids.indexOf(dragId);
    const to = ids.indexOf(targetId);
    if (from === -1 || to === -1) return;
    const reordered = [...ids];
    reordered.splice(from, 1);
    reordered.splice(to, 0, dragId);
    reorderTopics(subjectId, reordered);
    setDragId(null);
    setOverId(null);
  }
  function handleDragEnd() {
    setDragId(null);
    setOverId(null);
  }

  // Filtragem
  const filteredTopics = (subject.topics || [])
    .map(topic => {
      const filteredSubtopics = (topic.subtopics || []).filter(sub => {
        const matchSearch = sub.name
          .toLowerCase()
          .includes(search.toLowerCase());
        const matchStatus =
          statusFilter === 'all' || sub.status === statusFilter;
        return matchSearch && matchStatus;
      });
      return { ...topic, subtopics: filteredSubtopics };
    })
    .filter(topic => topic.subtopics.length > 0 || search === '');

  return (
    <StudyLayout>
      <div className="flex flex-col pb-10">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-xs text-text-dim mb-4 bg-[var(--bg-surface)] p-3 rounded-xl border border-[var(--border)]">
          <button
            onClick={() => navigate('/study/subjects')}
            className="hover:text-[var(--primary)] font-medium transition-colors"
          >
            📚 Matérias
          </button>
          <span>/</span>
          <span className="font-bold text-text-main truncate">
            {subject.name}
          </span>
        </div>

        {/* Dashboard de Matéria */}
        <div
          className="rounded-2xl p-6 mb-4 flex flex-col xl:flex-row lg:items-start justify-between gap-6 shadow-sm flex-shrink-0"
          style={{
            background: 'var(--bg-surface)',
            border: `1px solid var(--border)`,
            borderTop: `4px solid ${subject.color}`,
          }}
        >
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-text-main mb-3">
              {subject.name}
            </h1>
            <div className="flex flex-wrap items-center gap-3 text-[10px] font-bold text-text-dim uppercase tracking-wider mb-4">
              <span className="bg-[var(--bg-surface-2)] px-3 py-1.5 rounded-lg border border-[var(--border)]">
                {subject.topics?.length || 0} Assuntos Grandes
              </span>
              <span className="bg-[var(--bg-surface-2)] px-3 py-1.5 rounded-lg border border-[var(--border)]">
                {totalSubtopics} Aulas/Subtópicos
              </span>
              {cycleProgress && (
                <span
                  className="px-3 py-1.5 rounded-lg border"
                  style={{
                    background: `${subject.color}15`,
                    borderColor: `${subject.color}44`,
                    color: subject.color,
                  }}
                  title={`${formatMinutes(cycleProgress.realMin)} de ${formatMinutes(cycleProgress.metaMin)} nesta rodada`}
                >
                  🔄 R{cycleProgress.rodada} · {cycleProgress.pct}% no ciclo
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-6 flex-wrap">
            <div className="flex gap-4 pr-6 border-r border-[var(--border)]">
              <div className="flex flex-col items-center">
                <span className="text-2xl font-black text-text-main">
                  {statsMap.totalQ}
                </span>
                <span className="text-[9px] text-text-dim font-bold uppercase tracking-wider">
                  Questões
                </span>
              </div>
              <div className="flex flex-col items-center">
                <span
                  className="text-2xl font-black"
                  style={{
                    color:
                      globalAccuracy !== null
                        ? globalAccColor
                        : 'var(--text-dim)',
                  }}
                >
                  {globalAccuracy !== null ? `${globalAccuracy}%` : '-'}
                </span>
                <span className="text-[9px] text-text-dim font-bold uppercase tracking-wider">
                  Acerto
                </span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-2xl font-black text-text-main">
                  {formatMinutes(statsMap.totalMins)}
                </span>
                <span className="text-[9px] text-text-dim font-bold uppercase tracking-wider">
                  Tempo
                </span>
              </div>
            </div>
            <div className="w-48">
              <div className="flex justify-between text-xs font-bold mb-2">
                <span className="text-text-muted">Avanço no Edital</span>
                <span style={{ color: subject.color }}>{editalProgress}%</span>
              </div>
              <div
                className="h-2 rounded-full overflow-hidden"
                style={{ background: 'var(--bg-surface-2)' }}
              >
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${editalProgress}%`,
                    background: subject.color,
                  }}
                />
              </div>
              <p className="text-[10px] text-text-dim mt-2 text-right font-semibold">
                {concluidos} de {totalSubtopics} concluídos
              </p>
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-4 flex-shrink-0">
          <div className="flex flex-1 w-full gap-2">
            <div className="relative flex-1 max-w-xs">
              <span className="absolute left-3 top-2.5 text-text-dim">🔍</span>
              <input
                className="w-full pl-9 pr-3 py-2.5 rounded-xl text-sm outline-none border transition-colors focus:border-[var(--primary)]"
                style={{
                  background: 'var(--bg-surface)',
                  borderColor: 'var(--border)',
                  color: 'var(--text-main)',
                }}
                placeholder="Pesquisar..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <button
              onClick={expandAll}
              className="flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-bold text-text-muted hover:bg-white/5 border transition-colors"
              style={{ borderColor: 'var(--border)' }}
            >
              ↧ Expandir
            </button>
            <button
              onClick={collapseAll}
              className="flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-bold text-text-muted hover:bg-white/5 border transition-colors"
              style={{ borderColor: 'var(--border)' }}
            >
              ↥ Recolher
            </button>
          </div>
        </div>

        {/* Lista (O Edital) */}
        <div className="pr-1 space-y-3">
          {!dragEnabled && (
            <p className="text-[10px] text-text-dim italic">
              Limpe a busca pra poder reordenar os tópicos arrastando.
            </p>
          )}
          {filteredTopics.length === 0 ? (
            <div
              className="text-center p-12 border border-dashed rounded-xl"
              style={{ borderColor: 'var(--border)' }}
            >
              <span className="text-4xl opacity-30">🔍</span>
              <p className="mt-3 text-text-main font-bold">
                Nenhum resultado encontrado.
              </p>
            </div>
          ) : (
            filteredTopics.map(topic => {
              const isCollapsed = collapsedTopics[topic.id];
              const tStats = statsMap.topics[topic.id] || {
                mins: 0,
                q: 0,
                c: 0,
                fc: 0,
              };
              const tAcc =
                tStats.q > 0 ? Math.round((tStats.c / tStats.q) * 100) : null;
              const tAccColor =
                tAcc >= 70 ? '#10B981' : tAcc >= 50 ? '#F59E0B' : '#EF4444';

              return (
                <div
                  key={topic.id}
                  draggable={dragEnabled}
                  onDragStart={() => handleDragStart(topic.id)}
                  onDragOver={e => handleDragOver(e, topic.id)}
                  onDrop={() => handleDrop(topic.id)}
                  onDragEnd={handleDragEnd}
                  className="rounded-xl overflow-hidden border shadow-sm transition-all group/topic"
                  style={{
                    background: 'var(--bg-surface)',
                    borderColor:
                      overId === topic.id ? 'var(--primary)' : 'var(--border)',
                    opacity: dragId === topic.id ? 0.4 : 1,
                    boxShadow:
                      overId === topic.id
                        ? '0 0 0 2px var(--primary)'
                        : undefined,
                  }}
                >
                  {/* Cabeçalho do Tópico Pai */}
                  <div
                    className="p-3 border-b flex flex-col md:flex-row md:items-center justify-between cursor-pointer hover:bg-[var(--bg-surface-2)] transition-colors gap-3"
                    style={{ borderColor: 'var(--border)' }}
                    onClick={() => toggleCollapse(topic.id)}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {dragEnabled && (
                        <span
                          className="text-text-dim text-xs cursor-grab active:cursor-grabbing opacity-40 group-hover/topic:opacity-100 transition-opacity select-none"
                          title="Arrastar para reordenar"
                          onClick={e => e.stopPropagation()}
                        >
                          ⠿
                        </span>
                      )}
                      <span className="text-text-muted font-mono w-5 text-center text-xs">
                        {isCollapsed ? '►' : '▼'}
                      </span>

                      {/* Edição Inline do Tópico */}
                      {editingTopic.id === topic.id ? (
                        <input
                          autoFocus
                          className="flex-1 bg-[var(--bg-surface)] text-sm font-bold outline-none border rounded px-2 py-1"
                          style={{
                            borderColor: 'var(--primary)',
                            color: 'var(--text-main)',
                          }}
                          value={editingTopic.name}
                          onClick={e => e.stopPropagation()}
                          onChange={e =>
                            setEditingTopic({
                              ...editingTopic,
                              name: e.target.value,
                            })
                          }
                          onKeyDown={e => {
                            if (e.key === 'Enter') saveTopicEdit();
                            if (e.key === 'Escape')
                              setEditingTopic({ id: null, name: '' });
                          }}
                          onBlur={saveTopicEdit}
                        />
                      ) : (
                        <h2 className="text-sm font-bold text-text-main uppercase tracking-wider truncate group-hover/topic:text-[var(--primary)] transition-colors">
                          {topic.name}
                        </h2>
                      )}

                      {/* Botões de Ação do Tópico (Hover) */}
                      {!editingTopic.id && (
                        <div
                          className="opacity-0 group-hover/topic:opacity-100 flex gap-1 ml-2 transition-opacity"
                          onClick={e => e.stopPropagation()}
                        >
                          <button
                            onClick={() =>
                              setEditingTopic({
                                id: topic.id,
                                name: topic.name,
                              })
                            }
                            className="w-6 h-6 rounded flex items-center justify-center hover:bg-[var(--bg-surface-2)] text-text-muted hover:text-[var(--primary)]"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => handleDeleteTopic(topic)}
                            className="w-6 h-6 rounded flex items-center justify-center hover:bg-red-500/10 text-text-muted hover:text-red-500"
                          >
                            🗑️
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between md:justify-end w-full md:w-auto gap-4 flex-shrink-0 pl-8 md:pl-0">
                      <div
                        className="flex gap-4 px-2 md:px-4 text-xs font-bold md:border-l"
                        style={{ borderColor: 'var(--border)' }}
                      >
                        <div className="w-10 text-center text-text-main">
                          {tStats.q}{' '}
                          <span className="text-[8px] text-text-dim uppercase block">
                            Qst
                          </span>
                        </div>
                        <div
                          className="w-10 text-center"
                          style={{
                            color:
                              tAcc !== null ? tAccColor : 'var(--text-dim)',
                          }}
                        >
                          {tAcc !== null ? `${tAcc}%` : '-'}{' '}
                          <span className="text-[8px] text-text-dim uppercase block">
                            Acerto
                          </span>
                        </div>
                        <div className="w-12 text-center text-text-main hidden sm:block">
                          {formatMinutes(tStats.mins)}{' '}
                          <span className="text-[8px] text-text-dim uppercase block">
                            Tempo
                          </span>
                        </div>
                      </div>
                      <div onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() =>
                            openSessionModal({
                              preSubjectId: subjectId,
                              preTopicId: topic.id,
                            })
                          }
                          className="px-3 py-1.5 rounded-lg text-[10px] font-bold text-white uppercase tracking-wider hover:scale-105 transition-transform"
                          style={{ background: subject.color }}
                        >
                          ▶ Estudar
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Subtópicos (Aulas) */}
                  {!isCollapsed && (
                    <div
                      className="divide-y"
                      style={{ borderColor: 'var(--border)' }}
                    >
                      {(topic.subtopics || []).map(subtopic => {
                        const status =
                          STATUS_CONFIG[subtopic.status] ||
                          STATUS_CONFIG.nao_estudado;
                        const stStats = statsMap.subtopics[subtopic.id] || {
                          mins: 0,
                          q: 0,
                          c: 0,
                          fc: 0,
                        };
                        const acc =
                          stStats.q > 0
                            ? Math.round((stStats.c / stStats.q) * 100)
                            : null;
                        const accColor =
                          acc >= 70
                            ? '#10B981'
                            : acc >= 50
                              ? '#F59E0B'
                              : '#EF4444';

                        return (
                          <div
                            key={subtopic.id}
                            className="flex flex-col md:flex-row md:items-center p-2.5 hover:bg-white/5 transition-colors group/sub cursor-pointer"
                            onClick={() =>
                              navigate(
                                `/study/subjects/${subjectId}/${topic.id}/${subtopic.id}`
                              )
                            }
                          >
                            <div className="flex-1 min-w-0 pl-2 sm:pl-8 pr-4 mb-2 md:mb-0 flex items-center gap-2">
                              <span className="text-text-dim text-xs opacity-50">
                                📄
                              </span>

                              {/* Edição Inline do Subtópico */}
                              {editingSubtopic.id === subtopic.id ? (
                                <input
                                  autoFocus
                                  className="flex-1 bg-[var(--bg-surface)] text-sm font-semibold outline-none border rounded px-2 py-1 max-w-sm"
                                  style={{
                                    borderColor: 'var(--primary)',
                                    color: 'var(--text-main)',
                                  }}
                                  value={editingSubtopic.name}
                                  onClick={e => e.stopPropagation()}
                                  onChange={e =>
                                    setEditingSubtopic({
                                      ...editingSubtopic,
                                      name: e.target.value,
                                    })
                                  }
                                  onKeyDown={e => {
                                    if (e.key === 'Enter') saveSubtopicEdit();
                                    if (e.key === 'Escape')
                                      setEditingSubtopic({
                                        id: null,
                                        topicId: null,
                                        name: '',
                                      });
                                  }}
                                  onBlur={saveSubtopicEdit}
                                />
                              ) : (
                                <p className="text-sm font-semibold text-text-main truncate group-hover/sub:text-[var(--primary)] transition-colors">
                                  {subtopic.name}
                                </p>
                              )}

                              {/* Badges de revisão pendente e gaps abertos */}
                              {stStats.pendingRev > 0 && (
                                <span
                                  className="text-[9px] px-1.5 py-0.5 rounded-md font-bold shrink-0 flex items-center gap-0.5"
                                  style={{
                                    color: '#06B6D4',
                                    background: '#06B6D420',
                                  }}
                                  title="Revisão pendente"
                                >
                                  🔄 {stStats.pendingRev}
                                </span>
                              )}
                              {stStats.openGaps > 0 && (
                                <span
                                  className="text-[9px] px-1.5 py-0.5 rounded-md font-bold shrink-0 flex items-center gap-0.5"
                                  style={{
                                    color: '#EF4444',
                                    background: '#EF444420',
                                  }}
                                  title="Gaps e inseguranças não resolvidas"
                                >
                                  ⚠️ {stStats.openGaps}
                                </span>
                              )}

                              {/* Botões de Ação do Subtópico (Hover) */}
                              {!editingSubtopic.id && (
                                <div
                                  className="opacity-0 group-hover/sub:opacity-100 flex gap-1 transition-opacity"
                                  onClick={e => e.stopPropagation()}
                                >
                                  <button
                                    onClick={() =>
                                      openSessionModal({
                                        preSubjectId: subjectId,
                                        preTopicId: topic.id,
                                        preSubtopicId: subtopic.id,
                                      })
                                    }
                                    title="Estudar este subtópico"
                                    className="w-6 h-6 rounded flex items-center justify-center hover:bg-[var(--bg-surface-2)] text-text-muted hover:text-[var(--primary)]"
                                  >
                                    ▶
                                  </button>
                                  <button
                                    onClick={() =>
                                      setEditingSubtopic({
                                        id: subtopic.id,
                                        topicId: topic.id,
                                        name: subtopic.name,
                                      })
                                    }
                                    className="w-6 h-6 rounded flex items-center justify-center hover:bg-[var(--bg-surface-2)] text-text-muted hover:text-[var(--primary)]"
                                  >
                                    ✏️
                                  </button>
                                  <button
                                    onClick={() =>
                                      handleDeleteSubtopic(topic.id, subtopic)
                                    }
                                    className="w-6 h-6 rounded flex items-center justify-center hover:bg-red-500/10 text-text-muted hover:text-red-500"
                                  >
                                    🗑️
                                  </button>
                                </div>
                              )}
                            </div>

                            <div className="flex items-center justify-between md:justify-end gap-4 flex-shrink-0 pl-8 md:pl-0">
                              <div
                                className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider w-24 text-center border"
                                style={{
                                  background: status.bg,
                                  color: status.color,
                                  borderColor: status.border,
                                }}
                              >
                                {status.label}
                              </div>

                              <div className="w-[150px] flex justify-between px-2 text-xs font-bold font-mono">
                                <div className="w-12 flex flex-col md:block items-center">
                                  <span className="text-text-main">
                                    {stStats.q}
                                  </span>
                                </div>
                                <div className="w-12 flex flex-col md:block items-center">
                                  <span
                                    style={{
                                      color:
                                        acc !== null
                                          ? accColor
                                          : 'var(--text-dim)',
                                    }}
                                  >
                                    {acc !== null ? `${acc}%` : '-'}
                                  </span>
                                </div>
                                <div className="w-14 flex flex-col md:block items-center text-text-main">
                                  <span>{formatMinutes(stStats.mins)}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}

                      {/* Input de Adição de Nova Aula */}
                      <div className="p-2.5 pl-10 flex items-center gap-3 bg-black/5">
                        <span className="text-text-muted text-sm">+</span>
                        <input
                          type="text"
                          placeholder="Adicionar nova aula/subtópico... (Enter)"
                          className="flex-1 bg-transparent text-xs font-semibold outline-none text-text-main placeholder-text-dim"
                          value={
                            newSubtopicData.topicId === topic.id
                              ? newSubtopicData.name
                              : ''
                          }
                          onChange={e =>
                            setNewSubtopicData({
                              topicId: topic.id,
                              name: e.target.value,
                            })
                          }
                          onKeyDown={e => handleAddSubtopic(topic.id, e)}
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}

          {/* Adicionar Novo Tópico Pai */}
          <div
            className="rounded-xl border p-4 flex items-center gap-3 border-dashed mt-4 focus-within:border-[var(--primary)] transition-colors"
            style={{
              borderColor: 'var(--border)',
              background: 'var(--bg-surface)',
            }}
          >
            <span
              style={{ color: subject.color }}
              className="text-xl font-bold"
            >
              +
            </span>
            <input
              type="text"
              placeholder="Criar novo Assunto Grande... (Pressione Enter)"
              className="flex-1 bg-transparent text-sm outline-none text-text-main placeholder-text-dim font-bold tracking-wide"
              value={newTopicName}
              onChange={e => setNewTopicName(e.target.value)}
              onKeyDown={handleAddTopic}
            />
          </div>
        </div>
      </div>
    </StudyLayout>
  );
}
