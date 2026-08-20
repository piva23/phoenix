import { useState, useMemo } from 'react';
import { useStudyStore } from '../../../stores/useStudyStore';
import { useSessionStore } from '../../../stores/useSessionStore';
import { useRevisionStore } from '../../../stores/useRevisionStore';
import { StudyLayout } from '../components/StudyLayout';
import { useNavigate } from 'react-router-dom';
import { formatMinutes } from '../../../shared/utils/time';

// ============================================================================
// MODAL DE MATÉRIA
// ============================================================================
function SubjectModal({ onClose, onSave, editData }) {
  const [form, setForm] = useState({
    name: editData?.name || '',
    color: editData?.color || '#3B82F6',
    priority: editData?.priority || 'media',
  });

  const sf = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const inpStyle = {
    background: 'var(--bg-surface-2)',
    border: '1px solid var(--border)',
    color: 'var(--text-main)',
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
      style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl overflow-hidden shadow-2xl animate-slide-up"
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div
          className="flex items-center justify-between p-6 border-b"
          style={{
            borderColor: 'var(--border)',
            background: 'var(--bg-surface-2)',
          }}
        >
          <h2 className="font-extrabold text-text-main text-lg">
            {editData ? 'Engenharia da Matéria' : 'Nova Matéria do Edital'}
          </h2>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-red-500 hover:bg-red-500/10 w-8 h-8 flex items-center justify-center rounded-lg transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <label className="text-xs font-bold text-text-muted uppercase tracking-wider block mb-2">
              Nome da Disciplina *
            </label>
            <input
              className="w-full px-4 py-3 rounded-xl text-sm font-bold outline-none transition-colors focus:border-[var(--primary)]"
              style={inpStyle}
              placeholder="Ex: Direito Constitucional"
              value={form.name}
              onChange={e => sf('name', e.target.value)}
              autoFocus
            />
          </div>

          <div>
            <label className="text-xs font-bold text-text-muted uppercase tracking-wider block mb-2">
              Cor de Identificação
            </label>
            {/* Paleta fixa — evita bug do color picker nativo que fecha o modal */}
            <div className="flex flex-wrap gap-2 mb-3">
              {[
                '#3B82F6',
                '#8B5CF6',
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
                '#D97706',
                '#7C3AED',
                '#059669',
                '#DC2626',
                '#2563EB',
              ].map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={e => {
                    e.stopPropagation();
                    sf('color', c);
                  }}
                  className="w-8 h-8 rounded-lg transition-transform hover:scale-110 focus:outline-none"
                  style={{
                    background: c,
                    border:
                      form.color === c
                        ? '3px solid white'
                        : '2px solid transparent',
                    boxShadow: form.color === c ? `0 0 0 2px ${c}` : 'none',
                  }}
                />
              ))}
            </div>
            {/* Preview + hex manual + cor customizada (nativa) */}
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex-shrink-0 border-2 relative overflow-hidden"
                style={{ background: form.color, borderColor: 'var(--border)' }}
                title="Escolher cor customizada"
              >
                <input
                  type="color"
                  value={form.color}
                  onChange={e => sf('color', e.target.value)}
                  onClick={e => e.stopPropagation()}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              </div>
              <input
                type="text"
                value={form.color}
                maxLength={7}
                onChange={e => {
                  const v = e.target.value;
                  if (/^#[0-9A-Fa-f]{0,6}$/.test(v)) sf('color', v);
                }}
                onClick={e => e.stopPropagation()}
                className="flex-1 px-3 py-2 rounded-xl text-sm font-mono border outline-none"
                style={{
                  background: 'var(--bg-surface-2)',
                  borderColor: 'var(--border)',
                  color: 'var(--text-main)',
                }}
                placeholder="#3B82F6"
              />
            </div>
            <p
              className="text-[10px] mt-1.5"
              style={{ color: 'var(--text-dim)' }}
            >
              Clique no quadrado pra abrir o seletor de cor completo, ou digite
              o hex.
            </p>
          </div>

          <div
            className="p-3 rounded-xl text-xs flex items-start gap-2"
            style={{
              background: 'var(--bg-surface-2)',
              border: '1px solid var(--border)',
              color: 'var(--text-dim)',
            }}
          >
            <span>🔄</span>
            <span>
              O{' '}
              <strong style={{ color: 'var(--text-muted)' }}>
                peso estratégico (%)
              </strong>{' '}
              desta matéria é definido no{' '}
              <strong style={{ color: 'var(--text-muted)' }}>
                Ciclo de Estudos
              </strong>
              , junto com a distribuição de horas — não faz sentido fixo aqui.
            </span>
          </div>

          <div>
            <label className="text-xs font-bold text-text-muted uppercase tracking-wider block mb-2">
              Nível de Prioridade
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                ['baixa', 'Baixa', '#10B981'],
                ['media', 'Média', '#F59E0B'],
                ['alta', 'Alta', '#EF4444'],
              ].map(([id, label, color]) => (
                <button
                  key={id}
                  onClick={() => sf('priority', id)}
                  className="py-2.5 rounded-xl text-xs font-bold transition-all border uppercase tracking-wider shadow-sm"
                  style={{
                    borderColor: form.priority === id ? color : 'var(--border)',
                    background:
                      form.priority === id ? `${color}15` : 'transparent',
                    color: form.priority === id ? color : 'var(--text-muted)',
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div
          className="flex gap-3 p-6 border-t"
          style={{
            borderColor: 'var(--border)',
            background: 'var(--bg-surface-2)',
          }}
        >
          <button
            onClick={onClose}
            className="px-6 py-3 rounded-xl text-sm font-bold text-text-muted border bg-[var(--bg-surface)] hover:bg-[var(--border)] transition-colors"
            style={{ borderColor: 'var(--border)' }}
          >
            Cancelar
          </button>
          <button
            onClick={() => {
              if (form.name.trim()) {
                onSave(form);
                onClose();
              }
            }}
            className="flex-1 py-3 rounded-xl text-sm font-bold text-white transition-transform hover:-translate-y-0.5 shadow-lg"
            style={{
              background: form.color,
              boxShadow: `0 4px 14px ${form.color}40`,
            }}
          >
            {editData ? 'Salvar Matéria' : 'Criar Matéria'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// ATOM: Anel de progresso (donut simples via conic-gradient, sem libs)
// ============================================================================
function ProgressRing({ pct, color, size = 56, thickness = 6, children }) {
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
        {children ?? `${pct}%`}
      </div>
    </div>
  );
}

const PRIO_CONFIG = {
  alta: { color: '#EF4444', label: 'Alta', icon: '🔴' },
  media: { color: '#F59E0B', label: 'Média', icon: '🟡' },
  baixa: { color: '#10B981', label: 'Baixa', icon: '🟢' },
};

// ============================================================================
// ATOM: Badges de status (revisões pendentes / gaps abertos)
// ============================================================================
function StatusBadges({ s }) {
  if (s.pendingRevCount === 0 && s.openGaps === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {s.pendingRevCount > 0 && (
        <span
          className="text-[9px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wider flex items-center gap-1"
          style={{
            color: '#06B6D4',
            background: '#06B6D415',
            border: '1px solid #06B6D433',
          }}
          title="Revisões pendentes"
        >
          🔄 {s.pendingRevCount}
        </span>
      )}
      {s.openGaps > 0 && (
        <span
          className="text-[9px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wider flex items-center gap-1"
          style={{
            color: '#EF4444',
            background: '#EF444415',
            border: '1px solid #EF444433',
          }}
          title="Gaps e inseguranças não resolvidas"
        >
          ⚠️ {s.openGaps}
        </span>
      )}
    </div>
  );
}

// ============================================================================
// CARD (modo Grid)
// ============================================================================
function SubjectCard({
  s,
  isSelected,
  onToggleSelect,
  onEdit,
  onDelete,
  onClick,
  selectMode,
}) {
  const accColor =
    s.acc >= 70 ? '#10B981' : s.acc >= 50 ? '#F59E0B' : '#EF4444';
  const prio = PRIO_CONFIG[s.priority] || PRIO_CONFIG.media;

  return (
    <div
      onClick={onClick}
      className="group relative rounded-2xl border overflow-hidden cursor-pointer transition-all hover:-translate-y-1 shadow-sm hover:shadow-lg"
      style={{
        background: 'var(--bg-surface)',
        borderColor: isSelected ? '#EF4444' : 'var(--border)',
      }}
    >
      {/* barra de cor no topo */}
      <div className="h-1.5" style={{ background: s.color }} />

      {/* checkbox seleção */}
      {selectMode && (
        <div
          onClick={e => {
            e.stopPropagation();
            onToggleSelect();
          }}
          className="absolute top-4 left-4 w-5 h-5 rounded border flex items-center justify-center cursor-pointer z-10 transition-opacity opacity-0 group-hover:opacity-100"
          style={{
            opacity: isSelected ? 1 : undefined,
            background: isSelected ? '#EF4444' : 'var(--bg-surface)',
            borderColor: isSelected ? '#EF4444' : 'var(--border)',
          }}
        >
          {isSelected && <span className="text-white text-[10px]">✓</span>}
        </div>
      )}

      {/* ações hover / mobile */}
      <div
        onClick={e => e.stopPropagation()}
        className="absolute top-3 right-3 flex gap-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity z-10"
      >
        <button
          onClick={onEdit}
          className="w-7 h-7 flex items-center justify-center rounded-lg text-text-dim hover:text-[var(--primary)] hover:bg-[var(--primary)15] border bg-[var(--bg-surface)] text-xs"
          style={{ borderColor: 'var(--border)' }}
        >
          ✎
        </button>
        <button
          onClick={onDelete}
          className="w-7 h-7 flex items-center justify-center rounded-lg text-text-dim hover:text-red-500 hover:bg-red-500/10 border bg-[var(--bg-surface)] text-xs"
          style={{ borderColor: 'var(--border)' }}
        >
          ✕
        </button>
      </div>

      <div className="p-5 pt-6 flex flex-col gap-4">
        {/* nome + prioridade + progresso */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3
              className="font-extrabold text-base truncate group-hover:text-[var(--primary)] transition-colors"
              style={{ color: 'var(--text-main)' }}
            >
              {s.name}
            </h3>
            <div className="flex items-center gap-1.5 mt-1.5">
              <span
                className="text-[9px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wider flex items-center gap-1"
                style={{
                  color: prio.color,
                  background: prio.color + '15',
                  border: `1px solid ${prio.color}33`,
                }}
              >
                {prio.icon} {prio.label}
              </span>
              <span
                className="text-[9px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wider"
                style={{
                  background: 'var(--bg-surface-2)',
                  color: 'var(--text-dim)',
                  border: '1px solid var(--border)',
                }}
              >
                {s.subtopicsCount} aulas
              </span>
            </div>
          </div>
          <ProgressRing pct={s.editalProgress} color={s.color} />
        </div>

        <StatusBadges s={s} />

        {/* stats */}
        <div
          className="grid grid-cols-4 gap-2 pt-3 border-t"
          style={{ borderColor: 'var(--border)' }}
        >
          {[
            { label: 'Questões', value: s.q },
            {
              label: 'Acerto',
              value: s.acc !== null ? `${s.acc}%` : '-',
              color: s.acc !== null ? accColor : undefined,
            },
            { label: 'Tempo', value: formatMinutes(s.mins) },
            {
              label: 'Cards',
              value: s.flashcardsCount,
              color: s.flashcardsCount > 0 ? s.color : undefined,
            },
          ].map(stat => (
            <div key={stat.label} className="text-center">
              <div
                className="text-sm font-black"
                style={{ color: stat.color || 'var(--text-main)' }}
              >
                {stat.value}
              </div>
              <div
                className="text-[8px] font-bold uppercase tracking-wider mt-0.5"
                style={{ color: 'var(--text-dim)' }}
              >
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// LINHA (modo Lista)
// ============================================================================
function SubjectRow({
  s,
  isSelected,
  onToggleSelect,
  onEdit,
  onDelete,
  onClick,
  selectMode,
}) {
  const accColor =
    s.acc >= 70 ? '#10B981' : s.acc >= 50 ? '#F59E0B' : '#EF4444';
  const prio = PRIO_CONFIG[s.priority] || PRIO_CONFIG.media;

  return (
    <div
      onClick={onClick}
      className="group flex flex-col md:flex-row md:items-center p-4 pl-3 rounded-xl border-y border-r shadow-sm transition-all cursor-pointer hover:-translate-y-0.5"
      style={{
        background: isSelected ? 'rgba(239,68,68,0.05)' : 'var(--bg-surface)',
        borderColor: isSelected ? '#EF4444' : 'var(--border)',
        borderLeft: `4px solid ${s.color || 'var(--border)'}`,
      }}
    >
      {/* Coluna 1: Nome e Badges */}
      <div className="flex items-center gap-4 flex-1 min-w-0">
        {selectMode && (
          <div
            className="w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 cursor-pointer transition-colors shadow-sm"
            style={{
              background: isSelected ? '#EF4444' : 'var(--bg-surface-2)',
              borderColor: isSelected ? '#EF4444' : 'var(--border)',
            }}
            onClick={e => {
              e.stopPropagation();
              onToggleSelect();
            }}
          >
            {isSelected && <span className="text-white text-[10px]">✓</span>}
          </div>
        )}
        <ProgressRing
          pct={s.editalProgress}
          color={s.color}
          size={44}
          thickness={4}
        />

        <div className="min-w-0 flex-1 py-1">
          <h3 className="font-extrabold text-base text-text-main truncate group-hover:text-[var(--primary)] transition-colors mb-1.5">
            {s.name}
          </h3>
          <div className="flex flex-wrap gap-2">
            <span
              className="text-[9px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wider shadow-sm flex items-center gap-1"
              style={{
                color: prio.color,
                background: prio.color + '15',
                border: `1px solid ${prio.color}33`,
              }}
            >
              {prio.icon} {prio.label}
            </span>
            <span
              className="text-[9px] text-text-dim px-2 py-0.5 rounded-md uppercase tracking-wider font-bold border"
              style={{
                background: 'transparent',
                borderColor: 'var(--border)',
              }}
            >
              {s.subtopicsCount} Aulas
            </span>
            <StatusBadges s={s} />
          </div>
        </div>
      </div>

      {/* Coluna 3: Estatísticas */}
      <div className="w-full md:w-[300px] flex items-center justify-between px-2 mt-4 md:mt-0 flex-shrink-0">
        {[
          { label: 'Questões', value: s.q },
          {
            label: 'Acerto',
            value: s.acc !== null ? `${s.acc}%` : '-',
            color: s.acc !== null ? accColor : undefined,
          },
          { label: 'Tempo', value: formatMinutes(s.mins) },
          {
            label: 'Cards',
            value: s.flashcardsCount,
            color: s.flashcardsCount > 0 ? s.color : undefined,
          },
        ].map(stat => (
          <div
            key={stat.label}
            className="w-16 flex flex-col md:block items-center"
          >
            <span className="md:hidden text-[9px] text-text-dim uppercase font-bold tracking-wider mb-1">
              {stat.label}
            </span>
            <span
              className="text-sm font-black"
              style={{ color: stat.color || 'var(--text-main)' }}
            >
              {stat.value}
            </span>
          </div>
        ))}
      </div>

      {/* Coluna 4: Ações Mobile */}
      <div
        className="flex md:hidden justify-end gap-2 mt-4 pt-3 border-t w-full"
        style={{ borderColor: 'var(--border)' }}
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onEdit}
          className="flex-1 py-2 rounded-xl text-xs font-bold border transition-colors bg-[var(--bg-surface-2)] flex items-center justify-center gap-1.5"
          style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
        >
          <span>✎</span> Editar
        </button>
        <button
          onClick={onDelete}
          className="flex-1 py-2 rounded-xl text-xs font-bold border transition-colors bg-[var(--bg-surface-2)] flex items-center justify-center gap-1.5 hover:bg-red-500/10 hover:text-red-500"
          style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
        >
          <span>✕</span> Excluir
        </button>
      </div>

      {/* Coluna 4: Ações Desktop */}
      <div
        className="w-20 hidden md:flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onEdit}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-text-dim hover:text-[var(--primary)] hover:bg-[var(--primary)15] transition-colors border bg-[var(--bg-surface-2)]"
          style={{ borderColor: 'var(--border)' }}
          title="Editar Matéria"
        >
          ✎
        </button>
        <button
          onClick={onDelete}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-text-dim hover:text-red-500 hover:bg-red-500/10 transition-colors border bg-[var(--bg-surface-2)]"
          style={{ borderColor: 'var(--border)' }}
          title="Excluir Matéria"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// PÁGINA PRINCIPAL
// ============================================================================
export function StudySubjectsPage() {
  const { subjects, addSubject, updateSubject, deleteSubject, deleteSubjects } =
    useStudyStore();
  const sessions = useSessionStore(s => s.sessions);
  const getPendingToday = useRevisionStore(s => s.getPendingToday);
  const navigate = useNavigate();

  const [modal, setModal] = useState(null);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('name'); // name, priority, weight, lowest_acc
  const [selectedIds, setSelectedIds] = useState([]);
  const [selectionMode, setSelectionMode] = useState(false);
  const [viewMode, setViewMode] = useState(
    () => localStorage.getItem('phoenix-subjects-view') || 'list'
  );

  function setView(v) {
    setViewMode(v);
    localStorage.setItem('phoenix-subjects-view', v);
  }

  // Processamento Otimizado
  const enrichedSubjects = useMemo(() => {
    const pendingRevisions = getPendingToday();

    return subjects.map(s => {
      const sSessions = sessions.filter(ss => ss.subjectId === s.id);
      const mins = sSessions.reduce((a, ss) => a + (ss.totalMinutes || 0), 0);
      const q = sSessions.reduce((a, ss) => a + (ss.questionsAnswered || 0), 0);
      const c = sSessions.reduce((a, ss) => a + (ss.questionsCorrect || 0), 0);
      const acc = q > 0 ? Math.round((c / q) * 100) : null;

      const topicsCount = (s.topics || []).length;
      const subtopicsCount = (s.topics || []).reduce(
        (a, t) => a + (t.subtopics || []).length,
        0
      );
      const flashcardsCount = (s.topics || []).reduce(
        (a, t) =>
          a +
          (t.subtopics || []).reduce(
            (b, st) => b + (st.flashcards?.length || 0),
            0
          ),
        0
      );

      const concluidos = (s.topics || []).reduce(
        (a, t) =>
          a + (t.subtopics || []).filter(st => st.status === 'dominado').length,
        0
      );
      const editalProgress =
        subtopicsCount > 0
          ? Math.round((concluidos / subtopicsCount) * 100)
          : 0;

      // gaps e inseguranças abertas — caderno de falhas
      const openGaps = (s.topics || []).reduce(
        (a, t) =>
          a +
          (t.subtopics || []).reduce(
            (b, st) =>
              b +
              (st.gaps || []).filter(g => !g.resolved).length +
              (st.insecurities || []).filter(i => !i.resolved).length,
            0
          ),
        0
      );

      // revisões pendentes (atrasadas + hoje) desta matéria
      const pendingRevCount = pendingRevisions.filter(
        r => r.subjectId === s.id
      ).length;

      return {
        ...s,
        mins,
        q,
        c,
        acc,
        topicsCount,
        subtopicsCount,
        flashcardsCount,
        editalProgress,
        openGaps,
        pendingRevCount,
      };
    });
  }, [subjects, sessions, getPendingToday]);

  // Ordenação e Filtro
  const sortedAndFiltered = useMemo(() => {
    return enrichedSubjects
      .filter(
        s => !search || s.name.toLowerCase().includes(search.toLowerCase())
      )
      .sort((a, b) => {
        if (sortBy === 'name') return a.name.localeCompare(b.name);
        if (sortBy === 'lowest_acc') {
          if (a.acc === null) return 1;
          if (b.acc === null) return -1;
          return a.acc - b.acc; // Menor acerto primeiro
        }
        if (sortBy === 'priority') {
          const pMap = { alta: 3, media: 2, baixa: 1 };
          return (pMap[b.priority] || 0) - (pMap[a.priority] || 0);
        }
        return 0;
      });
  }, [enrichedSubjects, search, sortBy]);

  const toggleSelect = id =>
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  function toggleSelectionMode() {
    setSelectionMode(m => {
      if (m) setSelectedIds([]); // desligando: limpa seleção
      return !m;
    });
  }

  const selectAll = () => {
    if (selectedIds.length === sortedAndFiltered.length) setSelectedIds([]);
    else setSelectedIds(sortedAndFiltered.map(s => s.id));
  };

  const handleMassDelete = () => {
    if (
      window.confirm(
        `ATENÇÃO: Deseja excluir as ${selectedIds.length} matérias selecionadas e TODO O SEU HISTÓRICO?`
      )
    ) {
      deleteSubjects(selectedIds);
      setSelectedIds([]);
    }
  };

  return (
    <StudyLayout>
      <div className="flex flex-col animate-fade-in pb-10">
        {/* Header: título + resumo rápido */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-5">
          <div>
            <h1 className="text-3xl font-extrabold text-text-main tracking-tight">
              O Edital
            </h1>
            <p className="text-sm text-text-dim mt-1">
              Estratégia e métricas das suas disciplinas.
            </p>
          </div>
          <div className="flex gap-5 text-right">
            <div>
              <div
                className="text-2xl font-black"
                style={{ color: 'var(--text-main)' }}
              >
                {subjects.length}
              </div>
              <div className="text-[9px] font-bold uppercase tracking-wider text-text-dim">
                Matérias
              </div>
            </div>
            <div>
              <div
                className="text-2xl font-black"
                style={{ color: 'var(--primary)' }}
              >
                {enrichedSubjects.length
                  ? Math.round(
                      enrichedSubjects.reduce(
                        (a, s) => a + s.editalProgress,
                        0
                      ) / enrichedSubjects.length
                    )
                  : 0}
                %
              </div>
              <div className="text-[9px] font-bold uppercase tracking-wider text-text-dim">
                Progresso médio
              </div>
            </div>
            <div>
              <div className="text-2xl font-black" style={{ color: '#EF4444' }}>
                {enrichedSubjects.reduce((a, s) => a + s.openGaps, 0)}
              </div>
              <div className="text-[9px] font-bold uppercase tracking-wider text-text-dim">
                Gaps abertos
              </div>
            </div>
          </div>
        </div>

        {/* Toolbar: busca, ordenação e controles, agrupados numa barra só */}
        <div
          className="flex flex-col md:flex-row md:items-center gap-3 p-2.5 rounded-2xl mb-6"
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
          }}
        >
          <div className="relative flex-1 min-w-[200px]">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-dim text-sm">
              🔍
            </span>
            <input
              className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm font-medium outline-none transition-colors border focus:border-[var(--primary)]"
              style={{
                background: 'var(--bg-surface-2)',
                borderColor: 'var(--border)',
                color: 'var(--text-main)',
              }}
              placeholder="Buscar matéria..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <div
            className="hidden md:block w-px h-8 shrink-0"
            style={{ background: 'var(--border)' }}
          />

          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            className="px-3.5 py-2.5 rounded-xl text-xs font-bold outline-none cursor-pointer border uppercase tracking-wider shrink-0"
            style={{
              background: 'var(--bg-surface-2)',
              borderColor: 'var(--border)',
              color: 'var(--text-main)',
            }}
          >
            <option value="name">Ordenar: A-Z</option>
            <option value="priority">Ordenar: Urgência</option>
            <option value="lowest_acc">Ordenar: Pior Desempenho</option>
          </select>

          <div
            className="hidden md:block w-px h-8 shrink-0"
            style={{ background: 'var(--border)' }}
          />

          <div className="flex items-center gap-2 shrink-0">
            {/* ativar modo seleção — escondido por padrão */}
            <button
              onClick={toggleSelectionMode}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-sm shrink-0 border transition-all relative"
              style={{
                background: selectionMode ? '#EF444418' : 'var(--bg-surface-2)',
                borderColor: selectionMode ? '#EF4444' : 'var(--border)',
                color: selectionMode ? '#EF4444' : 'var(--text-dim)',
              }}
              title={
                selectionMode
                  ? 'Sair do modo seleção'
                  : 'Selecionar várias matérias'
              }
            >
              ☑
              {!selectionMode && selectedIds.length > 0 && (
                <span
                  className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center text-white"
                  style={{ background: '#EF4444' }}
                >
                  {selectedIds.length}
                </span>
              )}
            </button>

            {/* toggle lista/grid */}
            <div
              className="flex p-1 rounded-xl"
              style={{
                background: 'var(--bg-surface-2)',
                border: '1px solid var(--border)',
              }}
            >
              {[
                { id: 'list', icon: '☰' },
                { id: 'grid', icon: '▦' },
              ].map(v => (
                <button
                  key={v.id}
                  onClick={() => setView(v.id)}
                  className="w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold transition-all"
                  style={{
                    background:
                      viewMode === v.id ? 'var(--primary)' : 'transparent',
                    color: viewMode === v.id ? 'white' : 'var(--text-muted)',
                  }}
                  title={v.id === 'list' ? 'Lista' : 'Grid'}
                >
                  {v.icon}
                </button>
              ))}
            </div>

            <button
              onClick={() => setModal('new')}
              className="px-4 py-2.5 rounded-xl text-sm font-bold text-white transition-transform hover:-translate-y-0.5 shadow-md shrink-0 whitespace-nowrap"
              style={{ background: 'var(--primary)' }}
            >
              + Nova
            </button>
          </div>
        </div>

        {/* Barra de Ação em Massa */}
        {selectedIds.length > 0 && (
          <div
            className="flex items-center justify-between p-4 mb-6 rounded-xl shadow-md animate-slide-up"
            style={{
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.3)',
            }}
          >
            <span className="text-sm font-black text-red-500 uppercase tracking-wider">
              {selectedIds.length} matérias selecionadas
            </span>
            <div className="flex gap-3">
              <button
                onClick={() => setSelectedIds([])}
                className="px-4 py-2 rounded-lg text-xs font-bold text-text-main bg-[var(--bg-surface)] hover:bg-[var(--border)] transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleMassDelete}
                className="px-4 py-2 rounded-lg text-xs font-bold text-white bg-red-500 hover:bg-red-600 shadow-sm transition-colors uppercase tracking-wider"
              >
                🗑️ Excluir Definitivamente
              </button>
            </div>
          </div>
        )}

        {/* Cabeçalho de colunas (modo lista) */}
        {viewMode === 'list' && sortedAndFiltered.length > 0 && (
          <div
            className="hidden md:flex items-center px-4 py-2.5 mb-2 rounded-lg text-[9px] font-bold text-text-dim uppercase tracking-wider"
            style={{
              background: 'var(--bg-surface-2)',
              border: '1px solid var(--border)',
            }}
          >
            <div className="flex items-center gap-4 flex-1 min-w-0">
              {selectionMode && (
                <button
                  onClick={selectAll}
                  className="w-5 h-5 flex items-center justify-center rounded border bg-[var(--bg-surface)] hover:border-text-main transition-colors shrink-0"
                  style={{ borderColor: 'var(--border)' }}
                  title="Selecionar todos"
                >
                  {selectedIds.length === sortedAndFiltered.length && (
                    <span className="text-text-main text-[9px]">✓</span>
                  )}
                </button>
              )}
              <span className="w-11 text-center shrink-0">Progresso</span>
              <span>Disciplina / Matéria</span>
            </div>
            <div className="w-[300px] flex justify-between px-2 shrink-0">
              <span className="w-16 text-center">Questões</span>
              <span className="w-16 text-center">Acerto</span>
              <span className="w-16 text-center">Tempo</span>
              <span className="w-16 text-center">Cards</span>
            </div>
            <div className="w-20 text-center shrink-0">Ações</div>
          </div>
        )}

        {/* Lista / Grid de Matérias */}
        {sortedAndFiltered.length === 0 ? (
          <div
            className="rounded-2xl p-16 text-center border border-dashed mt-4"
            style={{
              borderColor: 'var(--border)',
              background: 'var(--bg-surface)',
            }}
          >
            <div className="text-6xl mb-4 opacity-30">📚</div>
            <p className="font-extrabold text-text-main mb-2 text-xl">
              {subjects.length === 0
                ? 'Edital Vazio'
                : 'Nenhuma matéria encontrada'}
            </p>
            <p className="text-sm text-text-dim max-w-md mx-auto">
              Cadastre as disciplinas do seu concurso ou importe através do
              Ciclo de Estudos.
            </p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {sortedAndFiltered.map(s => (
              <SubjectCard
                key={s.id}
                s={s}
                isSelected={selectedIds.includes(s.id)}
                onToggleSelect={() => toggleSelect(s.id)}
                selectMode={selectionMode}
                onEdit={() => setModal(s)}
                onDelete={() => {
                  if (window.confirm(`Excluir permanentemente "${s.name}"?`))
                    deleteSubject(s.id);
                }}
                onClick={() => navigate(`/study/subjects/${s.id}`)}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {sortedAndFiltered.map(s => (
              <SubjectRow
                key={s.id}
                s={s}
                isSelected={selectedIds.includes(s.id)}
                onToggleSelect={() => toggleSelect(s.id)}
                selectMode={selectionMode}
                onEdit={() => setModal(s)}
                onDelete={() => {
                  if (window.confirm(`Excluir permanentemente "${s.name}"?`))
                    deleteSubject(s.id);
                }}
                onClick={() => navigate(`/study/subjects/${s.id}`)}
              />
            ))}
          </div>
        )}
      </div>

      {modal === 'new' && (
        <SubjectModal
          onClose={() => setModal(null)}
          onSave={data => addSubject({ ...data, topics: [] })}
        />
      )}
      {modal && modal !== 'new' && (
        <SubjectModal
          editData={modal}
          onClose={() => setModal(null)}
          onSave={data => updateSubject(modal.id, data)}
        />
      )}
    </StudyLayout>
  );
}
