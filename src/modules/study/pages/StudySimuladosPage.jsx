import { useState, useMemo } from 'react';
import { StudyLayout } from '../components/StudyLayout';
import { BentoCard, SectionHeader, Badge } from '../components/BentoCard';
import { useSimuladoStore } from '../../../stores/useSimuladoStore';
import { useConcursoStore } from '../../../stores/useConcursoStore';
import { useStudyStore } from '../../../stores/useStudyStore';
import { useQuestionsStore } from '../../../stores/useQuestionsStore';
import { useGameStore } from '../../../stores/useGameStore';
import { formatDateBR } from '../../../shared/utils/time';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
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

// ── helpers ───────────────────────────────────────────────────────────────────

function today() {
  return new Date().toISOString().slice(0, 10);
}
function fmtShort(d) {
  if (!d) return '';
  const [, m, day] = d.split('-');
  return `${day}/${m}`;
}
function accColor(v) {
  if (v >= 70) return '#10B981';
  if (v >= 50) return '#F59E0B';
  return '#EF4444';
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="px-3 py-2 rounded-xl text-xs backdrop-blur-xl bg-black/70 border border-white/10 shadow-xl">
      <div className="font-bold mb-1 text-white/50">{label}</div>
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

  const [mode, setMode] = useState('manual');
  const [nome, setNome] = useState('');
  const [banca, setBanca] = useState('');
  const [data, setData] = useState(today());
  const [concursoId, setConcursoId] = useState('');
  const [disciplinas, setDisciplinas] = useState([
    { id: 'd1', subjectId: '', name: '', totalQuestoes: '', acertos: '', erros: '', notaCorte: '', peso: 1 },
  ]);
  const [selectedQuestionIds, setSelectedQuestionIds] = useState([]);

  function addDiscRow() {
    setDisciplinas(prev => [...prev, { id: `d${Date.now()}`, subjectId: '', name: '', totalQuestoes: '', acertos: '', erros: '', notaCorte: '', peso: 1 }]);
  }
  function updateDisc(id, field, value) {
    setDisciplinas(prev => prev.map(d => (d.id !== id ? d : { ...d, [field]: value })));
  }
  function removeDisc(id) {
    setDisciplinas(prev => prev.filter(d => d.id !== id));
  }
  function importFromConcurso(cId) {
    setConcursoId(cId);
    const c = concursos.find(x => x.id === cId);
    if (c?.disciplinas?.length) {
      setDisciplinas(c.disciplinas.map(d => ({
        id: `d_${d.id}`,
        subjectId: subjects.find(s => s.name.toLowerCase().includes(d.name.toLowerCase()))?.id || '',
        name: d.name, totalQuestoes: d.questions || '', acertos: '', erros: '', notaCorte: d.min || '', peso: d.weight || 1,
      })));
      toast.success('Disciplinas importadas do edital!');
    }
  }
  function handleSave() {
    if (!nome.trim()) { toast.error('Dê um nome ao simulado.'); return; }
    let finalDisciplinas = disciplinas.filter(d => d.name.trim());
    if (mode === 'banco' && selectedQuestionIds.length > 0) {
      const selected = questions.filter(q => selectedQuestionIds.includes(q.id));
      const bySubject = {};
      selected.forEach(q => {
        const key = q.subjectId || q.materia || 'sem-materia';
        if (!bySubject[key]) bySubject[key] = { subjectId: q.subjectId, name: q.materia || 'Sem matéria', totalQuestoes: 0 };
        bySubject[key].totalQuestoes++;
      });
      finalDisciplinas = Object.values(bySubject).map((d, i) => ({
        id: `d_${i}`, subjectId: d.subjectId, name: d.name, totalQuestoes: d.totalQuestoes, acertos: 0, erros: 0, notaCorte: 0, peso: 1,
      }));
    }
    if (finalDisciplinas.length === 0) { toast.error('Adicione ao menos uma disciplina.'); return; }
    const sim = addSimulado({ nome, banca, data, concursoId: concursoId || null, fonte: mode === 'banco' ? 'banco_questoes' : 'manual', disciplinas: finalDisciplinas, questionIds: mode === 'banco' ? selectedQuestionIds : [] });
    toast.success('Simulado criado!');
    onCreated(sim, mode === 'banco' ? selectedQuestionIds.map(id => questions.find(q => q.id === id)).filter(Boolean) : null);
  }

  const inp = 'w-full px-3 py-2.5 rounded-xl text-sm border outline-none bg-white/[0.05] border-white/[0.08] text-white/90 placeholder:text-white/30 focus:border-emerald-500/50 transition-colors';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 backdrop-blur-sm bg-black/60"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        className="w-full max-w-2xl rounded-2xl overflow-hidden backdrop-blur-xl bg-white/[0.06] border border-white/[0.1] shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
          <span className="font-bold text-sm text-white/90">Novo simulado</span>
          <button onClick={onClose} className="w-7 h-7 rounded-full flex items-center justify-center text-lg hover:bg-white/10 text-white/40">×</button>
        </div>
        <div className="p-5 space-y-4 max-h-[78vh] overflow-y-auto custom-scrollbar">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest mb-2 text-white/40">Como foi feito?</div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { key: 'manual', label: '📝 Manual (PDF, site da banca)' },
                { key: 'banco', label: '❓ Banco de Questões' },
              ].map(m => (
                <button key={m.key} onClick={() => setMode(m.key)} className="py-2.5 rounded-xl text-xs font-bold border transition-all" style={{
                  borderColor: mode === m.key ? '#10B981' : 'rgba(255,255,255,0.08)',
                  background: mode === m.key ? 'rgba(16,185,129,0.1)' : 'transparent',
                  color: mode === m.key ? '#10B981' : 'rgba(255,255,255,0.4)',
                }}>{m.label}</button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div><div className="text-[10px] font-bold uppercase tracking-widest mb-1.5 text-white/40">Nome *</div><input value={nome} onChange={e => setNome(e.target.value)} placeholder="Ex: Simulado FGV nº 3" className={inp} /></div>
            <div><div className="text-[10px] font-bold uppercase tracking-widest mb-1.5 text-white/40">Banca</div><input value={banca} onChange={e => setBanca(e.target.value)} placeholder="Ex: FGV, CESPE..." className={inp} /></div>
            <div><div className="text-[10px] font-bold uppercase tracking-widest mb-1.5 text-white/40">Data</div><input type="date" value={data} onChange={e => setData(e.target.value)} className={inp} /></div>
            <div><div className="text-[10px] font-bold uppercase tracking-widest mb-1.5 text-white/40">Vincular a concurso</div>
              <select value={concursoId} onChange={e => importFromConcurso(e.target.value)} className={inp}>
                <option value="">Avulso — sem vínculo</option>
                {concursos.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            </div>
          </div>

          {mode === 'manual' && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="text-[10px] font-bold uppercase tracking-widest text-white/40">Disciplinas e resultado</div>
                <button onClick={addDiscRow} className="text-xs font-bold px-2 py-1 rounded-lg border border-white/[0.08] text-white/50 hover:text-white/80">+ Linha</button>
              </div>
              <div className="space-y-2">
                {disciplinas.map(d => (
                  <div key={d.id} className="grid grid-cols-12 gap-1.5 items-center">
                    <input value={d.name} onChange={e => updateDisc(d.id, 'name', e.target.value)} placeholder="Disciplina" className={`col-span-3 ${inp}`} />
                    <select value={d.subjectId} onChange={e => updateDisc(d.id, 'subjectId', e.target.value)} className={`col-span-2 ${inp} text-[10px]`}>
                      <option value="">Vincular</option>
                      {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                    <input type="number" value={d.totalQuestoes} onChange={e => updateDisc(d.id, 'totalQuestoes', e.target.value)} placeholder="Qtd" className={`col-span-1 ${inp} text-center`} />
                    <input type="number" value={d.acertos} onChange={e => updateDisc(d.id, 'acertos', e.target.value)} placeholder="✓" className={`col-span-1 ${inp} text-center`} style={{ borderColor: '#10B98133' }} />
                    <input type="number" value={d.erros} onChange={e => updateDisc(d.id, 'erros', e.target.value)} placeholder="✗" className={`col-span-1 ${inp} text-center`} style={{ borderColor: '#EF444433' }} />
                    <input type="number" value={d.notaCorte} onChange={e => updateDisc(d.id, 'notaCorte', e.target.value)} placeholder="Corte" className={`col-span-2 ${inp} text-center`} />
                    <input type="number" step="0.5" value={d.peso} onChange={e => updateDisc(d.id, 'peso', e.target.value)} placeholder="Peso" className={`col-span-1 ${inp} text-center`} />
                    <button onClick={() => removeDisc(d.id)} className="col-span-1 text-xs text-white/30 hover:text-white/60">×</button>
                  </div>
                ))}
              </div>
              <div className="flex gap-3 mt-1 text-[9px] text-white/30">
                <span>Qtd = total</span><span>✓ = acertos</span><span>✗ = erros</span><span>Corte = mín.</span><span>Peso = N×P</span>
              </div>
            </div>
          )}

          {mode === 'banco' && (
            <div>
              <div className="text-[10px] font-bold uppercase tracking-widest mb-2 text-white/40">Selecione as questões ({selectedQuestionIds.length} selecionadas)</div>
              {questions.length === 0 ? (
                <div className="text-xs p-3 rounded-xl border border-white/[0.08] italic text-white/40">Nenhuma questão no banco ainda.</div>
              ) : (
                <div className="max-h-60 overflow-y-auto space-y-1.5 p-2 rounded-xl border border-white/[0.08]">
                  {questions.map(q => {
                    const subj = subjects.find(s => s.id === q.subjectId);
                    const isSel = selectedQuestionIds.includes(q.id);
                    return (
                      <button key={q.id} onClick={() => setSelectedQuestionIds(p => isSel ? p.filter(x => x !== q.id) : [...p, q.id])} className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left text-xs transition-all" style={{ background: isSel ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.03)' }}>
                        <div className="w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0" style={{ borderColor: isSel ? '#10B981' : 'rgba(255,255,255,0.1)', background: isSel ? '#10B981' : 'transparent' }}>
                          {isSel && <span className="text-white text-[8px]">✓</span>}
                        </div>
                        {subj && <span className="text-[9px] font-bold shrink-0" style={{ color: subj.color }}>{subj.name}</span>}
                        <span className="truncate text-white/70">{q.enunciado}</span>
                      </button>
                    );
                  })}
                </div>
              )}
              <button onClick={() => setSelectedQuestionIds(questions.map(q => q.id))} className="text-[10px] mt-1.5 font-bold text-emerald-400">Selecionar todas</button>
            </div>
          )}

          <button onClick={handleSave} className="w-full py-3 rounded-xl font-bold text-sm text-white bg-emerald-500 hover:bg-emerald-400 transition-colors">
            {mode === 'banco' && selectedQuestionIds.length > 0 ? 'Criar e iniciar resolução →' : 'Salvar simulado'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── SimuladoDetail ────────────────────────────────────────────────────────────

function SimuladoDetail({ simuladoId, onBack }) {
  const getStats = useSimuladoStore(s => s.getSimuladoStats);
  const sim = getStats(simuladoId);
  if (!sim) return null;

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="w-9 h-9 rounded-xl border border-white/[0.08] flex items-center justify-center text-white/50 hover:text-white/80 hover:bg-white/5 transition-all">←</button>
        <div>
          <h2 className="text-lg font-black text-white/95">{sim.nome}</h2>
          <div className="text-xs text-white/40">{sim.banca && `${sim.banca} · `}{formatDateBR(sim.data)}</div>
        </div>
      </div>

      {sim.eliminado && (
        <div className="p-3 rounded-xl text-xs font-bold flex items-center gap-2 bg-red-500/10 text-red-400 border border-red-500/20">
          🚫 Eliminado em {sim.disciplinasEliminadas.length} disciplina{sim.disciplinasEliminadas.length > 1 ? 's' : ''}: {sim.disciplinasEliminadas.map(d => d.name).join(', ')}
        </div>
      )}

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Acertos', value: `${sim.totalAcertos}/${sim.totalRespondidas}`, color: 'text-white/95' },
          { label: 'Acerto geral', value: `${sim.globalAccuracy}%`, color: accColor(sim.globalAccuracy) },
          { label: 'Nota ponderada', value: sim.notaPonderada, color: '#10B981' },
        ].map((kpi, i) => (
          <BentoCard key={i} span="4/12">
            <div className="text-center">
              <div className={`text-2xl font-black ${kpi.color}`}>{kpi.value}</div>
              <div className="text-[9px] uppercase tracking-widest mt-1 text-white/40">{kpi.label}</div>
            </div>
          </BentoCard>
        ))}
      </div>

      <BentoCard span="full">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="text-[10px] uppercase tracking-wider font-bold text-white/40">
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
              <tr key={d.id} className="border-t border-white/[0.06]">
                <td className="p-3 font-bold text-white/90">{d.name}</td>
                <td className="p-3 text-center text-emerald-400">{d.acertos}</td>
                <td className="p-3 text-center text-red-400">{d.erros}</td>
                <td className="p-3 text-center font-bold" style={{ color: accColor(d.accuracy ?? 0) }}>{d.accuracy !== null ? `${d.accuracy}%` : '—'}</td>
                <td className="p-3 text-center text-white/40">{d.notaCorte || '—'}</td>
                <td className="p-3 text-center">
                  {d.notaCorte > 0 ? (
                    d.eliminado ? <Badge color="#EF4444" variant="solid">Eliminado</Badge> : <Badge color="#10B981" variant="solid">OK</Badge>
                  ) : <span className="text-white/30">—</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </BentoCard>

      {sim.observacoes && (
        <BentoCard span="full"><div className="text-xs italic text-white/40">"{sim.observacoes}"</div></BentoCard>
      )}
    </motion.div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function StudySimuladosPage() {
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
  const filtered = filterConcurso ? allStats.filter(s => s.concursoId === filterConcurso) : allStats;
  const sorted = [...filtered].sort((a, b) => b.data.localeCompare(a.data));
  const evolution = useMemo(() => getEvolution(filterConcurso || null), [simulados, filterConcurso]);
  const weakest = useMemo(() => getWeakest(), [simulados]);

  function handleCreated(sim, questionsToResolve) {
    setShowNew(false);
    if (questionsToResolve?.length) toast('Resolva as questões na aba Questões e preencha os resultados aqui.', { icon: '💡', duration: 5000 });
    setDetailId(sim.id);
  }

  if (detailId) {
    return (
      <StudyLayout>
        <SimuladoDetail simuladoId={detailId} onBack={() => setDetailId(null)} />
      </StudyLayout>
    );
  }

  if (simulados.length === 0) {
    return (
      <StudyLayout>
        <div className="flex items-center justify-center min-h-64">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center max-w-sm">
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl mx-auto mb-5 bg-emerald-500/10 border border-emerald-500/20">🎯</div>
            <h2 className="text-xl font-bold mb-2 text-white/95">Simulados</h2>
            <p className="text-sm mb-5 text-white/40" style={{ lineHeight: 1.7 }}>Registre simulados feitos manualmente ou monte a partir do Banco de Questões. Acompanhe nota de corte por disciplina e evolução ao longo do tempo.</p>
            <button onClick={() => setShowNew(true)} className="px-6 py-3 rounded-xl font-bold text-sm text-white bg-emerald-500 hover:bg-emerald-400 transition-colors">+ Registrar primeiro simulado</button>
          </motion.div>
        </div>
        <AnimatePresence>{showNew && <NewSimuladoModal onClose={() => setShowNew(false)} onCreated={handleCreated} />}</AnimatePresence>
      </StudyLayout>
    );
  }

  return (
    <StudyLayout>
      <div className="flex flex-col max-h-[calc(100vh-80px)] overflow-y-auto custom-scrollbar pr-1 pb-10 space-y-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white/95">Simulados</h1>
            <p className="text-sm mt-1 text-white/40">{simulados.length} simulados registrados</p>
          </div>
          <div className="flex gap-2">
            {concursos.length > 0 && (
              <select value={filterConcurso} onChange={e => setFilterConcurso(e.target.value)} className="px-3 py-2 rounded-xl text-xs border border-white/[0.08] outline-none bg-white/[0.04] text-white/80">
                <option value="">Todos os concursos</option>
                {concursos.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            )}
            <button onClick={() => setShowNew(true)} className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-500 hover:bg-emerald-400 transition-colors">+ Novo simulado</button>
          </div>
        </div>

        {evolution.length >= 2 && (
          <BentoCard span="full">
            <SectionHeader title="Evolução dos simulados" icon="📈" />
            <div className="text-xs mb-4 text-white/40">Nota ponderada (N×P) ao longo do tempo.</div>
            <div style={{ height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={evolution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="date" tickFormatter={fmtShort} axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} />
                  <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} />
                  <ReferenceLine y={70} stroke="#F59E0B" strokeDasharray="4 4" />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="accuracy" name="Acerto geral" stroke="#10B981" strokeWidth={2.5} dot={{ r: 4, fill: '#10B981' }} activeDot={{ r: 6, stroke: '#10B981', strokeWidth: 2, fill: '#0a0a0a' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </BentoCard>
        )}

        {weakest.length > 0 && (
          <BentoCard span="full">
            <SectionHeader title="Pontos fracos — média entre simulados" icon="⚠️" />
            <div className="space-y-2.5">
              {weakest.slice(0, 5).map(d => (
                <div key={d.subjectId || d.name} className="flex items-center gap-3">
                  <span className="text-xs flex-1 truncate text-white/80">{d.name}</span>
                  <div className="w-24 h-1.5 rounded-full overflow-hidden bg-white/[0.06]">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${d.accuracy}%` }} transition={{ duration: 0.8, ease: 'easeOut' }} className="h-full rounded-full" style={{ background: accColor(d.accuracy) }} />
                  </div>
                  <span className="text-xs font-bold w-10 text-right" style={{ color: accColor(d.accuracy) }}>{d.accuracy}%</span>
                </div>
              ))}
            </div>
          </BentoCard>
        )}

        <SectionHeader title="Simulados" count={sorted.length} icon="📝" />
        <div className="space-y-2">
          <AnimatePresence>
            {sorted.map(sim => {
              const color = accColor(sim.globalAccuracy ?? 0);
              const concurso = concursos.find(c => c.id === sim.concursoId);
              return (
                <motion.div key={sim.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} onClick={() => setDetailId(sim.id)} className="flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all hover:bg-white/[0.04] hover:border-white/[0.15]" style={{ borderColor: sim.eliminado ? 'rgba(239,68,68,0.25)' : 'rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
                  <div className="w-11 h-11 rounded-full flex items-center justify-center text-lg shrink-0" style={{ background: sim.eliminado ? 'rgba(239,68,68,0.12)' : `${color}18` }}>
                    {sim.eliminado ? '🚫' : sim.globalAccuracy >= 70 ? '🏆' : '📝'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-white/90">{sim.nome}</span>
                      {sim.fonte === 'banco_questoes' && <Badge>❓ Banco</Badge>}
                      {sim.eliminado && <Badge color="#EF4444" variant="solid">Eliminado</Badge>}
                    </div>
                    <div className="text-xs mt-0.5 text-white/40">{sim.banca && `${sim.banca} · `}{formatDateBR(sim.data)}{concurso && ` · ${concurso.nome}`}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-lg font-black" style={{ color }}>{sim.globalAccuracy !== null ? `${sim.globalAccuracy}%` : '—'}</div>
                    <div className="text-[10px] text-white/40">{sim.totalAcertos}/{sim.totalRespondidas}</div>
                  </div>
                  <button onClick={e => { e.stopPropagation(); deleteSimulado(sim.id); }} className="w-7 h-7 rounded-full flex items-center justify-center text-xs hover:bg-red-500/20 text-white/30 hover:text-red-400 shrink-0 transition-colors">×</button>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
      <AnimatePresence>{showNew && <NewSimuladoModal onClose={() => setShowNew(false)} onCreated={handleCreated} />}</AnimatePresence>
    </StudyLayout>
  );
}
