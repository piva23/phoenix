// CycleBuilder.jsx — Modal de criação e edição de ciclos
import { useState, useMemo } from 'react';
import { useStudyStore } from '../../../stores/useStudyStore';
import { useConcursoStore } from '../../../stores/useConcursoStore';
import { ImportEditalModal } from './ImportEditalModal';
import toast from 'react-hot-toast';

// ── helpers ───────────────────────────────────────────────────────────────────

const COLORS = [
  '#8B5CF6',
  '#3B82F6',
  '#10B981',
  '#F59E0B',
  '#EF4444',
  '#06B6D4',
  '#EC4899',
  '#F97316',
  '#14B8A6',
  '#A855F7',
  '#6366F1',
  '#84CC16',
  '#F43F5E',
  '#0EA5E9',
  '#22C55E',
];

function pickColor(idx) {
  return COLORS[idx % COLORS.length];
}

// ── componente ────────────────────────────────────────────────────────────────

export function CycleBuilder({ onSave, onClose, editCycle = null }) {
  const subjects = useStudyStore(s => s.subjects);
  const addSubject = useStudyStore(s => s.addSubject);
  const addTopic = useStudyStore(s => s.addTopic);
  const addSubtopic = useStudyStore(s => s.addSubtopic);
  const concursos = useConcursoStore(s => s.concursos);

  const [nome, setNome] = useState(editCycle?.nome || '');
  const [concursoId, setConcursoId] = useState(editCycle?.concursoId || '');
  const [totalHoras, setTotalHoras] = useState(editCycle?.totalHoras || 24);
  const [importOpen, setImportOpen] = useState(false);

  // items: array de { id, subjectId, subjectName, subjectColor, horasPorRodada }
  const [items, setItems] = useState(() => {
    if (editCycle?.items?.length) {
      return editCycle.items.map(i => ({
        id: i.id,
        subjectId: i.subjectId,
        subjectName: i.subjectName,
        subjectColor: i.subjectColor || pickColor(0),
        horasPorRodada: i.horasPorRodada || 2,
      }));
    }
    return [];
  });

  // matérias disponíveis para adicionar (não estão no ciclo ainda)
  const availableSubjects = subjects.filter(
    s => !items.some(i => i.subjectId === s.id)
  );

  // total de horas distribuídas
  const totalDistribuido = items.reduce(
    (a, i) => a + (i.horasPorRodada || 0),
    0
  );
  const overBudget = totalDistribuido > totalHoras;

  function addItem(subjectId) {
    const subj = subjects.find(s => s.id === subjectId);
    if (!subj) return;
    const remaining = Math.max(0, totalHoras - totalDistribuido);
    setItems(prev => [
      ...prev,
      {
        id: `ci_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        subjectId: subj.id,
        subjectName: subj.name,
        subjectColor: subj.color || pickColor(prev.length),
        horasPorRodada: Math.max(0.5, Math.round(remaining * 10) / 10) || 1,
      },
    ]);
  }

  function removeItem(id) {
    setItems(prev => prev.filter(i => i.id !== id));
  }

  function updateHoras(id, val) {
    const v = Math.max(0.5, Math.round(Number(val) * 2) / 2); // step de 0.5h
    setItems(prev =>
      prev.map(i => (i.id !== id ? i : { ...i, horasPorRodada: v }))
    );
  }

  // distribui proporcionalmente baseado no editalWeight das matérias
  function autoDistribute() {
    if (items.length === 0) return;
    const totalW =
      items.reduce((a, i) => {
        const subj = subjects.find(s => s.id === i.subjectId);
        return a + (subj?.editalWeight || 1);
      }, 0) || items.length;

    setItems(prev =>
      prev.map(i => {
        const subj = subjects.find(s => s.id === i.subjectId);
        const w = subj?.editalWeight || 1;
        const h = Math.max(0.5, Math.round((w / totalW) * totalHoras * 2) / 2);
        return { ...i, horasPorRodada: h };
      })
    );
  }

  function handleImportEdital(parsed) {
    let created = 0;
    const createSubtopic = (name, ti, sti) => ({
      id: `st_import_${Date.now()}_${ti}_${sti}_${Math.random().toString(36).slice(2, 6)}`,
      name,
      status: 'nao_estudado',
      masteryLevel: 0,
      theory: '',
      summary: '',
      mindMapImage: null,
      links: [],
      flashcards: [],
      gaps: [],
      insecurities: [],
      feynmanNotes: [],
      anchors: [],
      loci: [],
      connections: [],
      stats: {
        totalMinutes: 0,
        questionsAnswered: 0,
        questionsCorrect: 0,
        lastStudied: null,
      },
    });

    // Separa em dois grupos ANTES de chamar qualquer store action
    const toCreate = []; // matérias que não existem ainda
    const toAddNow = []; // matérias que já existem no store — entram imediatamente

    parsed.forEach((subj, si) => {
      const existing = subjects.find(
        s => s.name.toLowerCase() === subj.name.toLowerCase()
      );
      if (!existing) {
        toCreate.push({ subj, si });
      } else {
        // matéria já existe — adiciona tópicos/subtópicos faltantes
        (subj.topics || []).forEach((t, ti) => {
          const et = existing.topics?.find(
            x => x.name.toLowerCase() === t.name.toLowerCase()
          );
          if (!et) {
            addTopic(existing.id, {
              name: t.name,
              notes: '',
              subtopics: (t.subtopics || []).map((st, sti) =>
                createSubtopic(st.name, ti, sti)
              ),
            });
          } else {
            (t.subtopics || []).forEach((st, sti) => {
              if (
                !et.subtopics?.find(
                  es => es.name.toLowerCase() === st.name.toLowerCase()
                )
              ) {
                addSubtopic(
                  existing.id,
                  et.id,
                  createSubtopic(st.name, ti, sti)
                );
              }
            });
          }
        });
        // entra imediatamente na lista local — sem setTimeout
        toAddNow.push({
          id: `ci_${Date.now()}_exist_${si}`,
          subjectId: existing.id,
          subjectName: existing.name,
          subjectColor: existing.color || pickColor(si),
          horasPorRodada: 2,
        });
      }
    });

    // Cria as matérias novas no store
    toCreate.forEach(({ subj, si }) => {
      addSubject({
        id: `subj_import_${Date.now()}_${si}_${Math.random().toString(36).slice(2, 8)}`,
        name: subj.name,
        color: pickColor(si),
        weeklyGoalMinutes: 180,
        editalWeight: 0,
        priority: 'media',
        icon: '📖',
        topics: (subj.topics || []).map((t, ti) => ({
          id: `topic_import_${Date.now()}_${ti}_${Math.random().toString(36).slice(2, 6)}`,
          name: t.name,
          notes: '',
          subtopics: (t.subtopics || []).map((st, sti) =>
            createSubtopic(st.name, ti, sti)
          ),
          createdAt: Date.now(),
        })),
      });
      created++;
    });

    // Adiciona as matérias existentes imediatamente ao estado local
    if (toAddNow.length > 0) {
      setItems(prev => {
        const updated = [...prev];
        toAddNow.forEach(item => {
          if (!updated.some(i => i.subjectId === item.subjectId)) {
            updated.push(item);
          }
        });
        return updated;
      });
    }

    // Para as recém-criadas, aguarda o store atualizar (1 tentativa com retry)
    if (toCreate.length > 0) {
      const tryAdd = (attempt = 0) => {
        const currentSubjects = useStudyStore.getState().subjects;
        const found = toCreate
          .map(({ subj, si }) => {
            const s = currentSubjects.find(
              x => x.name.toLowerCase() === subj.name.toLowerCase()
            );
            return s ? { s, si } : null;
          })
          .filter(Boolean);

        if (found.length === toCreate.length || attempt >= 5) {
          setItems(prev => {
            const updated = [...prev];
            found.forEach(({ s, si }) => {
              if (!updated.some(i => i.subjectId === s.id)) {
                updated.push({
                  id: `ci_${Date.now()}_new_${si}`,
                  subjectId: s.id,
                  subjectName: s.name,
                  subjectColor: s.color || pickColor(si),
                  horasPorRodada: 2,
                });
              }
            });
            return updated;
          });
        } else {
          setTimeout(() => tryAdd(attempt + 1), 100);
        }
      };
      setTimeout(() => tryAdd(), 50);
    }

    toast.success(
      created > 0
        ? `${created} matéria${created > 1 ? 's' : ''} criada${created > 1 ? 's' : ''}! Ajuste as horas abaixo.`
        : 'Matérias adicionadas ao ciclo!'
    );
  }

  function handleSave() {
    if (!nome.trim()) {
      toast.error('Dê um nome ao ciclo.');
      return;
    }
    if (items.length === 0) {
      toast.error('Adicione pelo menos uma matéria.');
      return;
    }
    onSave({
      nome,
      concursoId: concursoId || null,
      totalHoras,
      items: items.map((item, idx) => ({
        ...item,
        minutosFeitos:
          editCycle?.items?.find(i => i.id === item.id)?.minutosFeitos || 0,
        completedThisRound:
          editCycle?.items?.find(i => i.id === item.id)?.completedThisRound ||
          false,
        ordem: idx,
      })),
    });
  }

  const inp = {
    background: 'var(--bg-surface-2)',
    border: '1px solid var(--border)',
    color: 'var(--text-main)',
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(12px)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl rounded-2xl overflow-hidden flex flex-col"
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-strong)',
          maxHeight: '90vh',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* header */}
        <div
          className="flex items-center justify-between p-5 border-b flex-shrink-0"
          style={{ borderColor: 'var(--border)' }}
        >
          <div>
            <h2 className="font-bold text-text-main">
              {editCycle ? 'Editar Ciclo' : 'Novo Ciclo'}
            </h2>
            <p className="text-xs text-text-dim mt-0.5">
              Configure as matérias e o tempo total do ciclo
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-text-dim w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* dados gerais */}
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label
                className="text-[10px] font-bold uppercase tracking-widest block mb-1.5"
                style={{ color: 'var(--text-dim)' }}
              >
                Nome do ciclo *
              </label>
              <input
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                style={inp}
                placeholder="Ex: Ciclo TJRS Fase 1"
                value={nome}
                onChange={e => setNome(e.target.value)}
                autoFocus
              />
            </div>
            <div>
              <label
                className="text-[10px] font-bold uppercase tracking-widest block mb-1.5"
                style={{ color: 'var(--text-dim)' }}
              >
                Duração total do ciclo (horas)
              </label>
              <div className="flex gap-2">
                {[12, 20, 24, 30, 40].map(h => (
                  <button
                    key={h}
                    onClick={() => setTotalHoras(h)}
                    className="flex-1 py-2 rounded-xl border text-xs font-bold transition-all"
                    style={{
                      borderColor:
                        totalHoras === h ? 'var(--primary)' : 'var(--border)',
                      background:
                        totalHoras === h ? 'var(--primary)18' : 'transparent',
                      color:
                        totalHoras === h
                          ? 'var(--primary)'
                          : 'var(--text-muted)',
                    }}
                  >
                    {h}h
                  </button>
                ))}
                <input
                  type="number"
                  min={1}
                  step={1}
                  value={totalHoras}
                  onChange={e =>
                    setTotalHoras(Math.max(1, Number(e.target.value)))
                  }
                  className="w-16 px-2 py-2 rounded-xl text-xs text-center border outline-none"
                  style={inp}
                  title="Personalizar"
                />
              </div>
            </div>
            <div>
              <label
                className="text-[10px] font-bold uppercase tracking-widest block mb-1.5"
                style={{ color: 'var(--text-dim)' }}
              >
                Vincular a concurso
              </label>
              <select
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                style={inp}
                value={concursoId}
                onChange={e => setConcursoId(e.target.value)}
              >
                <option value="">Avulso</option>
                {concursos.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.nome}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* barra de progresso da distribuição */}
          <div
            className="p-3 rounded-xl border"
            style={{
              background: 'var(--bg-surface-2)',
              borderColor: 'var(--border)',
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <span
                className="text-[10px] font-bold uppercase tracking-widest"
                style={{ color: 'var(--text-dim)' }}
              >
                Horas distribuídas
              </span>
              <span
                className="text-xs font-bold"
                style={{
                  color: overBudget
                    ? '#EF4444'
                    : totalDistribuido === totalHoras
                      ? '#10B981'
                      : 'var(--text-muted)',
                }}
              >
                {totalDistribuido.toFixed(1)}h / {totalHoras}h{' '}
                {overBudget && '⚠ excedeu'}
              </span>
            </div>
            <div
              className="h-2 rounded-full overflow-hidden"
              style={{ background: 'var(--bg-surface)' }}
            >
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${Math.min(100, (totalDistribuido / totalHoras) * 100)}%`,
                  background: overBudget
                    ? '#EF4444'
                    : totalDistribuido === totalHoras
                      ? '#10B981'
                      : 'var(--primary)',
                }}
              />
            </div>
          </div>

          {/* ações de importação */}
          <div className="flex gap-2">
            <button
              onClick={() => setImportOpen(true)}
              className="flex-1 py-2.5 rounded-xl text-xs font-bold border flex items-center justify-center gap-2"
              style={{
                borderColor: 'var(--primary)44',
                color: 'var(--primary)',
                background: 'var(--primary)0f',
              }}
            >
              📋 Importar edital
            </button>
            {items.length > 0 && (
              <button
                onClick={autoDistribute}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold border flex items-center justify-center gap-2"
                style={{
                  borderColor: 'var(--border)',
                  color: 'var(--text-muted)',
                }}
              >
                ⚖ Distribuir pelo peso
              </button>
            )}
          </div>

          {/* lista de matérias do ciclo */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label
                className="text-[10px] font-bold uppercase tracking-widest"
                style={{ color: 'var(--text-dim)' }}
              >
                Matérias do ciclo ({items.length})
              </label>
              <select
                defaultValue=""
                disabled={availableSubjects.length === 0}
                onChange={e => {
                  if (e.target.value) {
                    addItem(e.target.value);
                    e.target.value = '';
                  }
                }}
                className="px-2 py-1 rounded-lg text-xs border outline-none disabled:opacity-40"
                style={{
                  background: 'var(--bg-surface-2)',
                  borderColor: 'var(--border)',
                  color: 'var(--text-main)',
                }}
              >
                <option value="">
                  {availableSubjects.length > 0
                    ? '+ Adicionar matéria'
                    : 'Todas as matérias já estão aqui'}
                </option>
                {availableSubjects.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            {availableSubjects.length === 0 && subjects.length > 0 && (
              <p
                className="text-[10px] mb-2"
                style={{ color: 'var(--text-dim)' }}
              >
                💡 Todas as {subjects.length} matérias cadastradas já fazem
                parte deste ciclo. Cadastre uma nova em Matérias pra poder
                adicionar aqui.
              </p>
            )}

            {items.length === 0 ? (
              <div
                className="text-center py-8 rounded-xl border border-dashed text-xs"
                style={{
                  borderColor: 'var(--border)',
                  color: 'var(--text-dim)',
                }}
              >
                Importe um edital ou adicione matérias acima
              </div>
            ) : (
              <div className="space-y-2">
                {items.map(item => {
                  const pct =
                    totalHoras > 0
                      ? Math.round((item.horasPorRodada / totalHoras) * 100)
                      : 0;
                  return (
                    <div
                      key={item.id}
                      className="flex items-center gap-2 p-3 rounded-xl border"
                      style={{
                        background: 'var(--bg-surface-2)',
                        borderColor: 'var(--border)',
                      }}
                    >
                      <div
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ background: item.subjectColor }}
                      />
                      <span
                        className="flex-1 text-sm font-medium truncate"
                        style={{ color: 'var(--text-main)' }}
                      >
                        {item.subjectName}
                      </span>
                      <span
                        className="text-[10px] w-8 text-right"
                        style={{ color: 'var(--text-dim)' }}
                      >
                        {pct}%
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() =>
                            updateHoras(item.id, item.horasPorRodada - 0.5)
                          }
                          className="w-6 h-6 rounded border flex items-center justify-center text-xs"
                          style={{
                            borderColor: 'var(--border)',
                            color: 'var(--text-dim)',
                          }}
                        >
                          −
                        </button>
                        <input
                          type="number"
                          min={0.5}
                          max={99}
                          step={0.5}
                          value={item.horasPorRodada}
                          onChange={e => updateHoras(item.id, e.target.value)}
                          className="w-14 px-1 py-1 rounded-lg text-xs text-center border outline-none"
                          style={{
                            background: 'var(--bg-surface)',
                            borderColor: 'var(--border)',
                            color: 'var(--text-main)',
                          }}
                        />
                        <button
                          onClick={() =>
                            updateHoras(item.id, item.horasPorRodada + 0.5)
                          }
                          className="w-6 h-6 rounded border flex items-center justify-center text-xs"
                          style={{
                            borderColor: 'var(--border)',
                            color: 'var(--text-dim)',
                          }}
                        >
                          +
                        </button>
                        <span
                          className="text-[10px] w-4"
                          style={{ color: 'var(--text-dim)' }}
                        >
                          h
                        </span>
                      </div>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="w-6 h-6 flex items-center justify-center rounded hover:bg-red-500/20 text-xs shrink-0"
                        style={{ color: 'var(--text-dim)' }}
                      >
                        ×
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* footer */}
        <div
          className="flex gap-3 p-5 border-t flex-shrink-0"
          style={{ borderColor: 'var(--border)' }}
        >
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium text-text-muted border hover:bg-white/5"
            style={{ borderColor: 'var(--border)' }}
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={!nome.trim() || items.length === 0}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white hover:opacity-90 disabled:opacity-40"
            style={{ background: 'var(--primary)' }}
          >
            {editCycle ? 'Salvar alterações' : 'Criar ciclo'}
          </button>
        </div>
      </div>

      {importOpen && (
        <ImportEditalModal
          onClose={() => setImportOpen(false)}
          onImport={handleImportEdital}
        />
      )}
    </div>
  );
}
