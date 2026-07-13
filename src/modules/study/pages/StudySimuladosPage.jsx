import { useState, useMemo } from 'react';
import { StudyLayout } from '../components/StudyLayout';
import { useSimuladoStore } from '../../../stores/useSimuladoStore';
import { useConcursoStore } from '../../../stores/useConcursoStore';
import { useStudyStore } from '../../../stores/useStudyStore';
import { useQuestionsStore } from '../../../stores/useQuestionsStore';
import { useXPStore } from '../../../stores/useXPStore';
import { useUserStore } from '../../../stores/useUserStore';
import { usePersonaStore } from '../../../stores/usePersonaStore';
import { formatDateBR } from '../../../shared/utils/time';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import toast from 'react-hot-toast';

// ── helpers ───────────────────────────────────────────────────────────────────

function today() {
  return new Date().toISOString().slice(0, 10);
}
function fmtShort(d) {
  if (!d) return '';
  const [, m, day] = d.split('-');
  return `${day}/${m}`;
}

function Label({ children }) {
  return (
    <div
      className="text-[10px] font-bold uppercase tracking-widest mb-2"
      style={{ color: 'var(--text-dim)' }}
    >
      {children}
    </div>
  );
}
function EmptyState({ icon, text, sub }) {
  return (
    <div
      className="flex flex-col items-center justify-center gap-2 py-12 rounded-2xl border"
      style={{ borderColor: 'var(--border)', background: 'var(--bg-surface)' }}
    >
      <span className="text-3xl opacity-40">{icon}</span>
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

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="px-3 py-2 rounded-lg shadow-xl text-xs"
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        color: 'var(--text-main)',
      }}
    >
      <div className="font-bold mb-1" style={{ color: 'var(--text-dim)' }}>
        {label}
      </div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color }}>
          {p.name}: <strong>{p.value}%</strong>
        </div>
      ))}
    </div>
  );
};

// ── NewSimuladoModal ──────────────────────────────────────────────────────────

function NewSimuladoModal({ onClose, onCreated }) {
  const addSimulado = useSimuladoStore(s => s.addSimulado);
  const concursos = useConcursoStore(s => s.concursos);
  const subjects = useStudyStore(s => s.subjects);
  const questions = useQuestionsStore(s => s.questions);

  const [mode, setMode] = useState('manual'); // manual | banco
  const [nome, setNome] = useState('');
  const [banca, setBanca] = useState('');
  const [data, setData] = useState(today());
  const [concursoId, setConcursoId] = useState('');
  const [disciplinas, setDisciplinas] = useState([
    {
      id: 'd1',
      subjectId: '',
      name: '',
      totalQuestoes: '',
      acertos: '',
      erros: '',
      notaCorte: '',
      peso: 1,
    },
  ]);
  const [selectedQuestionIds, setSelectedQuestionIds] = useState([]);

  function addDiscRow() {
    setDisciplinas(prev => [
      ...prev,
      {
        id: `d${Date.now()}`,
        subjectId: '',
        name: '',
        totalQuestoes: '',
        acertos: '',
        erros: '',
        notaCorte: '',
        peso: 1,
      },
    ]);
  }
  function updateDisc(id, field, value) {
    setDisciplinas(prev =>
      prev.map(d => (d.id !== id ? d : { ...d, [field]: value }))
    );
  }
  function removeDisc(id) {
    setDisciplinas(prev => prev.filter(d => d.id !== id));
  }

  // importar do edital do concurso vinculado — pré-preenche disciplinas
  function importFromConcurso(cId) {
    setConcursoId(cId);
    const c = concursos.find(x => x.id === cId);
    if (c?.disciplinas?.length) {
      setDisciplinas(
        c.disciplinas.map(d => ({
          id: `d_${d.id}`,
          subjectId:
            subjects.find(s =>
              s.name.toLowerCase().includes(d.name.toLowerCase())
            )?.id || '',
          name: d.name,
          totalQuestoes: d.questions || '',
          acertos: '',
          erros: '',
          notaCorte: d.min || '',
          peso: d.weight || 1,
        }))
      );
      toast.success('Disciplinas importadas do edital do concurso!');
    }
  }

  function handleSave() {
    if (!nome.trim()) {
      toast.error('Dê um nome ao simulado.');
      return;
    }

    let finalDisciplinas = disciplinas.filter(d => d.name.trim());

    // modo banco de questões: agrupa as questões selecionadas por matéria automaticamente
    if (mode === 'banco' && selectedQuestionIds.length > 0) {
      const selected = questions.filter(q =>
        selectedQuestionIds.includes(q.id)
      );
      const bySubject = {};
      selected.forEach(q => {
        const key = q.subjectId || q.materia || 'sem-materia';
        if (!bySubject[key])
          bySubject[key] = {
            subjectId: q.subjectId,
            name: q.materia || 'Sem matéria',
            totalQuestoes: 0,
          };
        bySubject[key].totalQuestoes++;
      });
      finalDisciplinas = Object.values(bySubject).map((d, i) => ({
        id: `d_${i}`,
        subjectId: d.subjectId,
        name: d.name,
        totalQuestoes: d.totalQuestoes,
        acertos: 0,
        erros: 0,
        notaCorte: 0,
        peso: 1,
      }));
    }

    if (finalDisciplinas.length === 0) {
      toast.error('Adicione ao menos uma disciplina.');
      return;
    }

    const sim = addSimulado({
      nome,
      banca,
      data,
      concursoId: concursoId || null,
      fonte: mode === 'banco' ? 'banco_questoes' : 'manual',
      disciplinas: finalDisciplinas,
      questionIds: mode === 'banco' ? selectedQuestionIds : [],
    });
    toast.success('Simulado criado!');
    onCreated(
      sim,
      mode === 'banco'
        ? selectedQuestionIds
            .map(id => questions.find(q => q.id === id))
            .filter(Boolean)
        : null
    );
  }

  const inpStyle = {
    background: 'var(--bg-surface-2)',
    borderColor: 'var(--border)',
    color: 'var(--text-main)',
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,.65)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl"
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-strong)',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div
          className="flex items-center justify-between px-5 py-4 border-b"
          style={{
            borderColor: 'var(--border)',
            background: 'var(--bg-surface-2)',
          }}
        >
          <span
            className="font-bold text-sm"
            style={{ color: 'var(--text-main)' }}
          >
            Novo simulado
          </span>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full flex items-center justify-center text-lg hover:bg-white/10"
            style={{ color: 'var(--text-muted)' }}
          >
            ×
          </button>
        </div>

        <div className="p-5 space-y-4 max-h-[78vh] overflow-y-auto">
          {/* fonte */}
          <div>
            <Label>Como foi feito?</Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setMode('manual')}
                className="py-2.5 rounded-xl text-xs font-bold border transition-all"
                style={{
                  borderColor:
                    mode === 'manual' ? 'var(--primary)' : 'var(--border)',
                  background:
                    mode === 'manual' ? 'var(--primary)18' : 'transparent',
                  color:
                    mode === 'manual' ? 'var(--primary)' : 'var(--text-muted)',
                }}
              >
                📝 Manual (PDF, site da banca)
              </button>
              <button
                onClick={() => setMode('banco')}
                className="py-2.5 rounded-xl text-xs font-bold border transition-all"
                style={{
                  borderColor:
                    mode === 'banco' ? 'var(--primary)' : 'var(--border)',
                  background:
                    mode === 'banco' ? 'var(--primary)18' : 'transparent',
                  color:
                    mode === 'banco' ? 'var(--primary)' : 'var(--text-muted)',
                }}
              >
                ❓ Usando o Banco de Questões
              </button>
            </div>
          </div>

          {/* dados gerais */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Nome *</Label>
              <input
                value={nome}
                onChange={e => setNome(e.target.value)}
                placeholder="Ex: Simulado FGV nº 3"
                className="w-full px-3 py-2.5 rounded-xl text-sm border outline-none"
                style={inpStyle}
              />
            </div>
            <div>
              <Label>Banca</Label>
              <input
                value={banca}
                onChange={e => setBanca(e.target.value)}
                placeholder="Ex: FGV, CESPE..."
                className="w-full px-3 py-2.5 rounded-xl text-sm border outline-none"
                style={inpStyle}
              />
            </div>
            <div>
              <Label>Data</Label>
              <input
                type="date"
                value={data}
                onChange={e => setData(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl text-sm border outline-none"
                style={inpStyle}
              />
            </div>
            <div>
              <Label>Vincular a concurso (opcional)</Label>
              <select
                value={concursoId}
                onChange={e => importFromConcurso(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl text-sm border outline-none"
                style={inpStyle}
              >
                <option value="">Avulso — sem vínculo</option>
                {concursos.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.nome}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* modo manual: tabela de disciplinas */}
          {mode === 'manual' && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Disciplinas e resultado</Label>
                <button
                  onClick={addDiscRow}
                  className="text-xs font-bold px-2 py-1 rounded-lg border"
                  style={{
                    borderColor: 'var(--border)',
                    color: 'var(--text-dim)',
                  }}
                >
                  + Linha
                </button>
              </div>
              <div className="space-y-2">
                {disciplinas.map(d => (
                  <div
                    key={d.id}
                    className="grid grid-cols-12 gap-1.5 items-center"
                  >
                    <input
                      value={d.name}
                      onChange={e => updateDisc(d.id, 'name', e.target.value)}
                      placeholder="Disciplina"
                      className="col-span-3 px-2 py-2 rounded-lg text-xs border outline-none"
                      style={inpStyle}
                    />
                    <select
                      value={d.subjectId}
                      onChange={e =>
                        updateDisc(d.id, 'subjectId', e.target.value)
                      }
                      className="col-span-2 px-1 py-2 rounded-lg text-[10px] border outline-none"
                      style={inpStyle}
                    >
                      <option value="">Vincular</option>
                      {subjects.map(s => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      value={d.totalQuestoes}
                      onChange={e =>
                        updateDisc(d.id, 'totalQuestoes', e.target.value)
                      }
                      placeholder="Qtd"
                      className="col-span-1 px-1 py-2 rounded-lg text-xs border outline-none text-center"
                      style={inpStyle}
                    />
                    <input
                      type="number"
                      value={d.acertos}
                      onChange={e =>
                        updateDisc(d.id, 'acertos', e.target.value)
                      }
                      placeholder="✓"
                      className="col-span-1 px-1 py-2 rounded-lg text-xs border outline-none text-center"
                      style={{ ...inpStyle, borderColor: '#10B98155' }}
                    />
                    <input
                      type="number"
                      value={d.erros}
                      onChange={e => updateDisc(d.id, 'erros', e.target.value)}
                      placeholder="✗"
                      className="col-span-1 px-1 py-2 rounded-lg text-xs border outline-none text-center"
                      style={{ ...inpStyle, borderColor: '#EF444455' }}
                    />
                    <input
                      type="number"
                      value={d.notaCorte}
                      onChange={e =>
                        updateDisc(d.id, 'notaCorte', e.target.value)
                      }
                      placeholder="Corte"
                      className="col-span-2 px-1 py-2 rounded-lg text-xs border outline-none text-center"
                      style={inpStyle}
                    />
                    <input
                      type="number"
                      step="0.5"
                      value={d.peso}
                      onChange={e => updateDisc(d.id, 'peso', e.target.value)}
                      placeholder="Peso"
                      className="col-span-1 px-1 py-2 rounded-lg text-xs border outline-none text-center"
                      style={inpStyle}
                    />
                    <button
                      onClick={() => removeDisc(d.id)}
                      className="col-span-1 text-xs"
                      style={{ color: 'var(--text-dim)' }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
              <div
                className="flex gap-3 mt-1 text-[9px]"
                style={{ color: 'var(--text-dim)' }}
              >
                <span>Qtd = total questões</span>
                <span>✓ = acertos</span>
                <span>✗ = erros</span>
                <span>Corte = mín. p/ não eliminar</span>
                <span>Peso = N×P</span>
              </div>
            </div>
          )}

          {/* modo banco: seletor de questões */}
          {mode === 'banco' && (
            <div>
              <Label>
                Selecione as questões do banco ({selectedQuestionIds.length}{' '}
                selecionadas)
              </Label>
              {questions.length === 0 ? (
                <div
                  className="text-xs p-3 rounded-xl border italic"
                  style={{
                    borderColor: 'var(--border)',
                    color: 'var(--text-dim)',
                  }}
                >
                  Nenhuma questão no banco ainda. Importe questões na aba
                  Questões primeiro.
                </div>
              ) : (
                <div
                  className="max-h-60 overflow-y-auto space-y-1.5 p-2 rounded-xl border"
                  style={{ borderColor: 'var(--border)' }}
                >
                  {questions.map(q => {
                    const subj = subjects.find(s => s.id === q.subjectId);
                    const isSel = selectedQuestionIds.includes(q.id);
                    return (
                      <button
                        key={q.id}
                        onClick={() =>
                          setSelectedQuestionIds(p =>
                            isSel ? p.filter(x => x !== q.id) : [...p, q.id]
                          )
                        }
                        className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left text-xs transition-all"
                        style={{
                          background: isSel
                            ? 'var(--primary)18'
                            : 'var(--bg-surface-2)',
                        }}
                      >
                        <div
                          className="w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0"
                          style={{
                            borderColor: isSel
                              ? 'var(--primary)'
                              : 'var(--border)',
                            background: isSel
                              ? 'var(--primary)'
                              : 'transparent',
                          }}
                        >
                          {isSel && (
                            <span className="text-white text-[8px]">✓</span>
                          )}
                        </div>
                        {subj && (
                          <span
                            className="text-[9px] font-bold shrink-0"
                            style={{ color: subj.color }}
                          >
                            {subj.name}
                          </span>
                        )}
                        <span
                          className="truncate"
                          style={{ color: 'var(--text-main)' }}
                        >
                          {q.enunciado}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
              <button
                onClick={() => setSelectedQuestionIds(questions.map(q => q.id))}
                className="text-[10px] mt-1.5 font-bold"
                style={{ color: 'var(--primary)' }}
              >
                Selecionar todas
              </button>
            </div>
          )}

          <button
            onClick={handleSave}
            className="w-full py-3 rounded-xl font-bold text-sm text-white"
            style={{ background: 'var(--primary)' }}
          >
            {mode === 'banco' && selectedQuestionIds.length > 0
              ? 'Criar e iniciar resolução →'
              : 'Salvar simulado'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── DetailView — resultado detalhado de um simulado ───────────────────────────

function SimuladoDetail({ simuladoId, onBack }) {
  const getStats = useSimuladoStore(s => s.getSimuladoStats);
  const updateDisciplina = useSimuladoStore(s => s.updateDisciplina);
  const sim = getStats(simuladoId);

  if (!sim) return null;

  const accColor =
    sim.globalAccuracy >= 70
      ? '#10B981'
      : sim.globalAccuracy >= 50
        ? '#F59E0B'
        : '#EF4444';

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="w-9 h-9 rounded-xl border flex items-center justify-center"
          style={{ borderColor: 'var(--border)', color: 'var(--text-dim)' }}
        >
          ←
        </button>
        <div>
          <h2
            className="text-lg font-black"
            style={{ color: 'var(--text-main)' }}
          >
            {sim.nome}
          </h2>
          <div className="text-xs" style={{ color: 'var(--text-dim)' }}>
            {sim.banca && `${sim.banca} · `}
            {formatDateBR(sim.data)}
          </div>
        </div>
      </div>

      {sim.eliminado && (
        <div
          className="p-3 rounded-xl text-xs font-bold flex items-center gap-2"
          style={{
            background: '#EF444415',
            color: '#EF4444',
            border: '1px solid #EF444433',
          }}
        >
          🚫 Eliminado em {sim.disciplinasEliminadas.length} disciplina
          {sim.disciplinasEliminadas.length > 1 ? 's' : ''}:{' '}
          {sim.disciplinasEliminadas.map(d => d.name).join(', ')}
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-3">
        <div
          className="p-4 rounded-2xl border text-center"
          style={{
            background: 'var(--bg-surface)',
            borderColor: 'var(--border)',
          }}
        >
          <div
            className="text-2xl font-black"
            style={{ color: 'var(--text-main)' }}
          >
            {sim.totalAcertos}/{sim.totalRespondidas}
          </div>
          <div
            className="text-[9px] uppercase tracking-widest mt-1"
            style={{ color: 'var(--text-dim)' }}
          >
            Acertos
          </div>
        </div>
        <div
          className="p-4 rounded-2xl border text-center"
          style={{
            background: 'var(--bg-surface)',
            borderColor: 'var(--border)',
          }}
        >
          <div className="text-2xl font-black" style={{ color: accColor }}>
            {sim.globalAccuracy}%
          </div>
          <div
            className="text-[9px] uppercase tracking-widest mt-1"
            style={{ color: 'var(--text-dim)' }}
          >
            Acerto geral
          </div>
        </div>
        <div
          className="p-4 rounded-2xl border text-center"
          style={{
            background: 'var(--bg-surface)',
            borderColor: 'var(--border)',
          }}
        >
          <div
            className="text-2xl font-black"
            style={{ color: 'var(--primary)' }}
          >
            {sim.notaPonderada}
          </div>
          <div
            className="text-[9px] uppercase tracking-widest mt-1"
            style={{ color: 'var(--text-dim)' }}
          >
            Nota ponderada
          </div>
        </div>
      </div>

      {/* tabela por disciplina */}
      <div
        className="rounded-2xl border overflow-hidden"
        style={{ borderColor: 'var(--border)' }}
      >
        <table className="w-full text-left text-xs">
          <thead style={{ background: 'var(--bg-surface-2)' }}>
            <tr
              className="text-[10px] uppercase tracking-wider font-bold"
              style={{ color: 'var(--text-dim)' }}
            >
              <th className="p-3">Disciplina</th>
              <th className="p-3 text-center">Acertos</th>
              <th className="p-3 text-center">Erros</th>
              <th className="p-3 text-center">%</th>
              <th className="p-3 text-center">Corte</th>
              <th className="p-3 text-center">Status</th>
            </tr>
          </thead>
          <tbody>
            {sim.disciplinas.map(d => (
              <tr
                key={d.id}
                className="border-t"
                style={{ borderColor: 'var(--border)' }}
              >
                <td
                  className="p-3 font-bold"
                  style={{ color: 'var(--text-main)' }}
                >
                  {d.name}
                </td>
                <td className="p-3 text-center" style={{ color: '#10B981' }}>
                  {d.acertos}
                </td>
                <td className="p-3 text-center" style={{ color: '#EF4444' }}>
                  {d.erros}
                </td>
                <td
                  className="p-3 text-center font-bold"
                  style={{
                    color:
                      d.accuracy >= 70
                        ? '#10B981'
                        : d.accuracy >= 50
                          ? '#F59E0B'
                          : '#EF4444',
                  }}
                >
                  {d.accuracy !== null ? `${d.accuracy}%` : '—'}
                </td>
                <td
                  className="p-3 text-center"
                  style={{ color: 'var(--text-dim)' }}
                >
                  {d.notaCorte || '—'}
                </td>
                <td className="p-3 text-center">
                  {d.notaCorte > 0 ? (
                    d.eliminado ? (
                      <span
                        className="px-2 py-0.5 rounded text-[10px] font-bold"
                        style={{ background: '#EF444420', color: '#EF4444' }}
                      >
                        ELIMINADO
                      </span>
                    ) : (
                      <span
                        className="px-2 py-0.5 rounded text-[10px] font-bold"
                        style={{ background: '#10B98120', color: '#10B981' }}
                      >
                        OK
                      </span>
                    )
                  ) : (
                    <span style={{ color: 'var(--text-dim)' }}>—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {sim.observacoes && (
        <div
          className="p-3 rounded-xl text-xs italic"
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            color: 'var(--text-dim)',
          }}
        >
          "{sim.observacoes}"
        </div>
      )}
    </div>
  );
}

// ── componente principal ──────────────────────────────────────────────────────

export function StudySimuladosPage() {
  const simulados = useSimuladoStore(s => s.simulados);
  const getAllStats = useSimuladoStore(s => s.getAllSimuladosStats);
  const getEvolution = useSimuladoStore(s => s.getEvolutionTimeline);
  const getWeakest = useSimuladoStore(s => s.getWeakestDisciplinas);
  const deleteSimulado = useSimuladoStore(s => s.deleteSimulado);
  const concursos = useConcursoStore(s => s.concursos);

  const [showNew, setShowNew] = useState(false);
  const [detailId, setDetailId] = useState(null);
  const [filterConcurso, setFilterConcurso] = useState('');

  const allStats = getAllStats();
  const filtered = filterConcurso
    ? allStats.filter(s => s.concursoId === filterConcurso)
    : allStats;
  const sorted = [...filtered].sort((a, b) => b.data.localeCompare(a.data));

  const evolution = useMemo(
    () => getEvolution(filterConcurso || null),
    [simulados, filterConcurso]
  );
  const weakest = useMemo(() => getWeakest(), [simulados]);

  function handleCreated(sim, questionsToResolve) {
    setShowNew(false);
    if (questionsToResolve?.length) {
      toast(
        'Resolva as questões na aba Questões e depois preencha os resultados aqui.',
        { icon: '💡', duration: 5000 }
      );
    }
    setDetailId(sim.id);
  }

  if (detailId) {
    return (
      <StudyLayout>
        <SimuladoDetail
          simuladoId={detailId}
          onBack={() => setDetailId(null)}
        />
      </StudyLayout>
    );
  }

  if (simulados.length === 0) {
    return (
      <StudyLayout>
        <div className="flex items-center justify-center min-h-64">
          <div className="text-center max-w-sm">
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl mx-auto mb-5"
              style={{
                background: 'var(--primary)18',
                border: '1px solid var(--primary)33',
              }}
            >
              🎯
            </div>
            <h2
              className="text-xl font-bold mb-2"
              style={{ color: 'var(--text-main)' }}
            >
              Simulados
            </h2>
            <p
              className="text-sm mb-5"
              style={{ color: 'var(--text-muted)', lineHeight: 1.7 }}
            >
              Registre simulados feitos manualmente ou monte a partir do Banco
              de Questões. Acompanhe nota de corte por disciplina e evolução ao
              longo do tempo.
            </p>
            <button
              onClick={() => setShowNew(true)}
              className="px-6 py-3 rounded-xl font-bold text-sm text-white"
              style={{ background: 'var(--primary)' }}
            >
              + Registrar primeiro simulado
            </button>
          </div>
        </div>
        {showNew && (
          <NewSimuladoModal
            onClose={() => setShowNew(false)}
            onCreated={handleCreated}
          />
        )}
      </StudyLayout>
    );
  }

  return (
    <StudyLayout>
      <div className="flex flex-col max-h-[calc(100vh-80px)] overflow-y-auto custom-scrollbar pr-1 pb-10 space-y-5 animate-fade-in">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1
              className="text-2xl font-extrabold tracking-tight"
              style={{ color: 'var(--text-main)' }}
            >
              Simulados
            </h1>
            <p className="text-sm mt-1" style={{ color: 'var(--text-dim)' }}>
              {simulados.length} simulados registrados
            </p>
          </div>
          <div className="flex gap-2">
            {concursos.length > 0 && (
              <select
                value={filterConcurso}
                onChange={e => setFilterConcurso(e.target.value)}
                className="px-3 py-2 rounded-xl text-xs border outline-none"
                style={{
                  background: 'var(--bg-surface)',
                  borderColor: 'var(--border)',
                  color: 'var(--text-main)',
                }}
              >
                <option value="">Todos os concursos</option>
                {concursos.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.nome}
                  </option>
                ))}
              </select>
            )}
            <button
              onClick={() => setShowNew(true)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white"
              style={{ background: 'var(--primary)' }}
            >
              + Novo simulado
            </button>
          </div>
        </div>

        {/* gráfico de evolução */}
        {evolution.length >= 2 && (
          <div
            className="p-5 rounded-2xl border"
            style={{
              background: 'var(--bg-surface)',
              borderColor: 'var(--border)',
            }}
          >
            <div
              className="text-base font-bold mb-1"
              style={{ color: 'var(--text-main)' }}
            >
              Evolução dos simulados
            </div>
            <div className="text-xs mb-4" style={{ color: 'var(--text-dim)' }}>
              Nota ponderada (N×P) ao longo do tempo.
            </div>
            <div style={{ height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={evolution}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="var(--border)"
                    opacity={0.4}
                  />
                  <XAxis
                    dataKey="date"
                    tickFormatter={fmtShort}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'var(--text-dim)', fontSize: 10 }}
                  />
                  <YAxis
                    domain={[0, 100]}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'var(--text-dim)', fontSize: 10 }}
                  />
                  <ReferenceLine
                    y={70}
                    stroke="#F59E0B"
                    strokeDasharray="4 4"
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="accuracy"
                    name="Acerto geral"
                    stroke="var(--primary)"
                    strokeWidth={2.5}
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* disciplinas mais fracas */}
        {weakest.length > 0 && (
          <div
            className="p-5 rounded-2xl border"
            style={{
              background: 'var(--bg-surface)',
              borderColor: 'var(--border)',
            }}
          >
            <div
              className="text-base font-bold mb-3"
              style={{ color: 'var(--text-main)' }}
            >
              Pontos fracos — média entre simulados
            </div>
            <div className="space-y-2">
              {weakest.slice(0, 5).map(d => (
                <div
                  key={d.subjectId || d.name}
                  className="flex items-center gap-3"
                >
                  <span
                    className="text-xs flex-1 truncate"
                    style={{ color: 'var(--text-main)' }}
                  >
                    {d.name}
                  </span>
                  <div
                    className="w-24 h-1.5 rounded-full overflow-hidden"
                    style={{ background: 'var(--bg-surface-2)' }}
                  >
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${d.accuracy}%`,
                        background:
                          d.accuracy >= 70
                            ? '#10B981'
                            : d.accuracy >= 50
                              ? '#F59E0B'
                              : '#EF4444',
                      }}
                    />
                  </div>
                  <span
                    className="text-xs font-bold w-10 text-right"
                    style={{
                      color:
                        d.accuracy >= 70
                          ? '#10B981'
                          : d.accuracy >= 50
                            ? '#F59E0B'
                            : '#EF4444',
                    }}
                  >
                    {d.accuracy}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* lista de simulados */}
        <div className="space-y-2">
          {sorted.map(sim => {
            const accColor =
              sim.globalAccuracy >= 70
                ? '#10B981'
                : sim.globalAccuracy >= 50
                  ? '#F59E0B'
                  : '#EF4444';
            const concurso = concursos.find(c => c.id === sim.concursoId);
            return (
              <div
                key={sim.id}
                onClick={() => setDetailId(sim.id)}
                className="flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all hover:border-[var(--border-strong)]"
                style={{
                  background: 'var(--bg-surface)',
                  borderColor: sim.eliminado ? '#EF444444' : 'var(--border)',
                }}
              >
                <div
                  className="w-11 h-11 rounded-full flex items-center justify-center text-lg shrink-0"
                  style={{
                    background: sim.eliminado ? '#EF444420' : `${accColor}20`,
                  }}
                >
                  {sim.eliminado
                    ? '🚫'
                    : sim.globalAccuracy >= 70
                      ? '🏆'
                      : '📝'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className="text-sm font-bold"
                      style={{ color: 'var(--text-main)' }}
                    >
                      {sim.nome}
                    </span>
                    {sim.fonte === 'banco_questoes' && (
                      <span
                        className="text-[9px] font-bold px-1.5 py-0.5 rounded"
                        style={{
                          background: 'var(--bg-surface-2)',
                          color: 'var(--text-dim)',
                        }}
                      >
                        ❓ Banco
                      </span>
                    )}
                  </div>
                  <div
                    className="text-xs mt-0.5"
                    style={{ color: 'var(--text-dim)' }}
                  >
                    {sim.banca && `${sim.banca} · `}
                    {formatDateBR(sim.data)}
                    {concurso && ` · ${concurso.nome}`}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div
                    className="text-lg font-black"
                    style={{ color: accColor }}
                  >
                    {sim.globalAccuracy !== null
                      ? `${sim.globalAccuracy}%`
                      : '—'}
                  </div>
                  <div
                    className="text-[10px]"
                    style={{ color: 'var(--text-dim)' }}
                  >
                    {sim.totalAcertos}/{sim.totalRespondidas}
                  </div>
                </div>
                <button
                  onClick={e => {
                    e.stopPropagation();
                    deleteSimulado(sim.id);
                  }}
                  className="w-7 h-7 rounded-full flex items-center justify-center text-xs hover:bg-red-500/20 shrink-0"
                  style={{ color: 'var(--text-dim)' }}
                >
                  ×
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {showNew && (
        <NewSimuladoModal
          onClose={() => setShowNew(false)}
          onCreated={handleCreated}
        />
      )}
    </StudyLayout>
  );
}
