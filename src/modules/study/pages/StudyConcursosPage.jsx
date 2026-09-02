import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useConcursoStore } from '../../../stores/useConcursoStore';
import { useGameStore, XP_RULES } from '../../../stores/useGameStore';
import { useCycleStore } from '../../../stores/useCycleStore';
import { useStudyStore } from '../../../stores/useStudyStore';
import { useSimuladoStore } from '../../../stores/useSimuladoStore';
import { formatDateBR, daysUntil } from '../../../shared/utils/time';
import { StudyLayout } from '../components/StudyLayout';
import { BentoCard, SectionHeader, Badge } from '../components/BentoCard';

const STATUS_CFG = {
  estudando: { label: 'Estudando', color: '#3B82F6', bg: 'rgba(59,130,246,0.12)' },
  inscrito: { label: 'Inscrito', color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
  fez_prova: { label: 'Fez a Prova', color: '#8B5CF6', bg: 'rgba(139,92,246,0.12)' },
  aprovado: { label: 'APROVADO 🏆', color: '#10B981', bg: 'rgba(16,185,129,0.12)' },
  reprovado: { label: 'Reprovado', color: '#EF4444', bg: 'rgba(239,68,68,0.12)' },
  desistiu: { label: 'Desistiu', color: '#6B6A7A', bg: 'rgba(107,106,122,0.12)' },
};
const INP = 'w-full px-3 py-2.5 rounded-xl text-sm outline-none backdrop-blur-sm';
const INP_S = { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'var(--text-main)' };
const GLASS_BG = { background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(16px)' };
const GLASS_PANEL = { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', maxHeight: '90vh' };
const BD = { borderColor: 'rgba(255,255,255,0.08)' };
const BG2 = { background: 'rgba(255,255,255,0.02)' };

function SubjectLinkPicker({ subjectId, subjects, onLink, onCreateAndLink }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const linked = subjects.find(s => s.id === subjectId);
  const filtered = subjects.filter(s => s.name.toLowerCase().includes(search.trim().toLowerCase()));
  const exactMatch = subjects.some(s => s.name.toLowerCase() === search.trim().toLowerCase());

  if (!open) return linked
    ? <button onClick={() => setOpen(true)} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-sm font-bold text-left w-full" style={{ background: `${linked.color}18`, color: linked.color }}>
        <div className="w-2 h-2 rounded-full shrink-0" style={{ background: linked.color }} />
        <span className="truncate flex-1">{linked.name}</span><span className="text-[10px] opacity-60">✎</span>
      </button>
    : <button onClick={() => setOpen(true)} className="px-2 py-1 rounded-lg text-[10px] font-bold border border-dashed w-full text-left" style={{ borderColor: 'rgba(255,255,255,0.1)', color: 'var(--text-dim)' }}>🔗 Vincular matéria</button>;

  return (
    <div className="relative">
      <div className="fixed inset-0 z-40" onClick={() => { setOpen(false); setSearch(''); }} />
      <div className="absolute left-0 top-0 z-50 w-56 rounded-xl border overflow-hidden shadow-xl backdrop-blur-xl" style={{ background: 'rgba(255,255,255,0.06)', borderColor: 'rgba(255,255,255,0.12)' }}>
        <input autoFocus value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar ou criar matéria..."
          className="w-full px-3 py-2 text-xs outline-none border-b" style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)', color: 'var(--text-main)' }} />
        <div className="max-h-48 overflow-y-auto p-1">
          {filtered.map(s => (
            <button key={s.id} onClick={() => { onLink(s.id, s.name); setOpen(false); setSearch(''); }}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-left hover:bg-white/5"
              style={{ color: s.id === subjectId ? s.color : 'var(--text-main)' }}>
              <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: s.color }} />
              <span className="truncate">{s.name}</span>
            </button>
          ))}
          {search.trim() && !exactMatch && (
            <button onClick={() => { onCreateAndLink(search.trim()); setOpen(false); setSearch(''); }}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-bold text-left hover:bg-white/5" style={{ color: 'var(--primary)' }}>
              + Criar matéria "{search.trim()}"
            </button>
          )}
          {filtered.length === 0 && !search.trim() && <div className="text-[11px] italic p-2 text-center" style={{ color: 'var(--text-dim)' }}>Nenhuma matéria cadastrada ainda.</div>}
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return <div><label className="text-xs font-bold text-text-muted uppercase tracking-wider block mb-1.5">{label}</label>{children}</div>;
}

function ConcursoForm({ onClose, editData = null }) {
  const { addConcurso, updateConcurso } = useConcursoStore();
  const [f, setF] = useState({
    nome: editData?.nome || '', cargo: editData?.cargo || '', orgao: editData?.orgao || '', banca: editData?.banca || '',
    edital_url: editData?.edital_url || '', vagas: editData?.vagas || '', salario: editData?.salario || '',
    dataInscricaoFim: editData?.dataInscricaoFim || '', dataProva: editData?.dataProva || '',
    status: editData?.status || 'estudando', observacoes: editData?.observacoes || '', metaCiclos: editData?.metaCiclos || 24,
  });
  const s = (k, v) => setF(p => ({ ...p, [k]: v }));
  const save = () => { if (!f.nome.trim()) return toast.error('O nome do concurso é obrigatório!'); editData ? updateConcurso(editData.id, f) : addConcurso({ ...f, disciplinas: [] }); onClose(); };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={GLASS_BG} onClick={onClose}>
      <motion.div className="w-full max-w-lg rounded-2xl overflow-hidden flex flex-col backdrop-blur-xl" style={GLASS_PANEL}
        initial={{ opacity: 0, scale: 0.95, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ duration: 0.25 }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b flex-shrink-0" style={BD}>
          <h2 className="font-bold text-text-main text-lg">{editData ? 'Editar Concurso' : 'Novo Concurso'}</h2>
          <button onClick={onClose} className="text-text-dim hover:text-text-main w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5">✕</button>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <Field label="Nome do Concurso *"><input className={INP} style={INP_S} placeholder="Ex: TJRS — Analista Judiciário" value={f.nome} onChange={e => s('nome', e.target.value)} autoFocus /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Cargo"><input className={INP} style={INP_S} value={f.cargo} onChange={e => s('cargo', e.target.value)} /></Field>
            <Field label="Órgão"><input className={INP} style={INP_S} value={f.orgao} onChange={e => s('orgao', e.target.value)} /></Field>
            <Field label="Banca"><input className={INP} style={INP_S} value={f.banca} onChange={e => s('banca', e.target.value)} /></Field>
            <Field label="Status"><select className={INP} style={INP_S} value={f.status} onChange={e => s('status', e.target.value)}>
              {Object.entries(STATUS_CFG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select></Field>
            <Field label="Vagas"><input type="number" className={INP} style={INP_S} value={f.vagas} onChange={e => s('vagas', e.target.value)} /></Field>
            <Field label="Salário (R$)"><input type="number" className={INP} style={INP_S} value={f.salario} onChange={e => s('salario', e.target.value)} /></Field>
            <Field label="Inscrições até"><input type="date" className={INP} style={INP_S} value={f.dataInscricaoFim} onChange={e => s('dataInscricaoFim', e.target.value)} /></Field>
            <Field label="Data da Prova"><input type="date" className={INP} style={INP_S} value={f.dataProva} onChange={e => s('dataProva', e.target.value)} /></Field>
            <div className="col-span-2"><Field label="Meta de Blocos no Ciclo"><input type="number" className={INP} style={INP_S} value={f.metaCiclos} onChange={e => s('metaCiclos', Number(e.target.value))} /></Field></div>
          </div>
          <Field label="Link do Edital"><input className={INP} style={INP_S} placeholder="https://..." value={f.edital_url} onChange={e => s('edital_url', e.target.value)} /></Field>
          <Field label="Observações"><textarea rows={3} className={`${INP} resize-none`} style={INP_S} value={f.observacoes} onChange={e => s('observacoes', e.target.value)} /></Field>
        </div>
        <div className="flex gap-3 p-5 border-t flex-shrink-0" style={BD}>
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-text-muted border hover:bg-white/5" style={BD}>Cancelar</button>
          <button onClick={save} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white hover:opacity-90" style={{ background: 'var(--primary)' }}>{editData ? 'Salvar' : 'Cadastrar'}</button>
        </div>
      </motion.div>
    </div>
  );
}

function ProvaForm({ concursoId, onClose, editProva = null }) {
  const { addProva, updateProva } = useConcursoStore();
  const [f, setF] = useState({
    fase: editProva?.fase || '', data: editProva?.data || '', totalQuestoes: editProva?.totalQuestoes || '',
    acertos: editProva?.acertos || '', nota: editProva?.nota || '', notaCorte: editProva?.notaCorte || '',
    passou: editProva?.passou ?? false, observacoes: editProva?.observacoes || '',
  });
  const s = (k, v) => setF(p => ({ ...p, [k]: v }));
  const save = () => { if (!f.fase.trim()) return; editProva ? updateProva(concursoId, editProva.id, f) : addProva(concursoId, f); onClose(); };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={GLASS_BG} onClick={onClose}>
      <motion.div className="w-full max-w-md rounded-2xl overflow-hidden backdrop-blur-xl" style={GLASS_PANEL}
        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.25 }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b" style={BD}>
          <h3 className="font-bold text-text-main">{editProva ? 'Editar Prova' : 'Registrar Prova/Fase'}</h3>
          <button onClick={onClose} className="text-text-dim w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5">✕</button>
        </div>
        <div className="p-5 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2"><Field label="Fase *"><input className={INP} style={INP_S} placeholder="Objetiva, Discursiva..." value={f.fase} onChange={e => s('fase', e.target.value)} /></Field></div>
            <Field label="Data"><input type="date" className={INP} style={INP_S} value={f.data} onChange={e => s('data', e.target.value)} /></Field>
            <Field label="Questões Totais"><input type="number" className={INP} style={INP_S} value={f.totalQuestoes} onChange={e => s('totalQuestoes', e.target.value)} /></Field>
            <Field label="Seus Acertos"><input type="number" className={INP} style={INP_S} value={f.acertos} onChange={e => s('acertos', e.target.value)} /></Field>
            <Field label="Nota Final"><input type="number" step="0.1" className={INP} style={INP_S} value={f.nota} onChange={e => s('nota', e.target.value)} /></Field>
            <div className="col-span-2"><Field label="Nota de Corte"><input type="number" step="0.1" className={INP} style={INP_S} value={f.notaCorte} onChange={e => s('notaCorte', e.target.value)} /></Field></div>
            <div className="flex items-center gap-2 col-span-2 pt-2 pb-1">
              <input type="checkbox" id="passou" checked={f.passou} onChange={e => s('passou', e.target.checked)} className="w-5 h-5 rounded cursor-pointer accent-green-500" />
              <label htmlFor="passou" className="text-sm font-bold text-text-main cursor-pointer">Fui Aprovado nesta fase</label>
            </div>
          </div>
          <Field label="Observações"><textarea rows={2} className={`${INP} resize-none`} style={INP_S} value={f.observacoes} onChange={e => s('observacoes', e.target.value)} /></Field>
        </div>
        <div className="flex gap-3 p-5 border-t" style={BD}>
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-text-muted border hover:bg-white/5" style={BD}>Cancelar</button>
          <button onClick={save} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white hover:opacity-90" style={{ background: 'var(--primary)' }}>Salvar</button>
        </div>
      </motion.div>
    </div>
  );
}

function ConcursoDetailView({ concurso, onBack, onAprovado, onChangeStatus }) {
  const navigate = useNavigate();
  const { updateConcurso } = useConcursoStore();
  const { cycles, addCycle } = useCycleStore();
  const subjects = useStudyStore(s => s.subjects);
  const addSubjectToStore = useStudyStore(s => s.addSubject);
  const getByConcurso = useSimuladoStore(s => s.getByConcurso);
  const getEvolutionTimeline = useSimuladoStore(s => s.getEvolutionTimeline);
  const [activeTab, setActiveTab] = useState('edital');
  const [provaModal, setProvaModal] = useState(null);
  const [statusPickerOpen, setStatusPickerOpen] = useState(false);
  const statusCfg = STATUS_CFG[concurso.status] || STATUS_CFG.estudando;
  const disciplinas = concurso.disciplinas || [];
  const metaCiclos = concurso.metaCiclos || 24;
  const realSimulados = useMemo(() => getByConcurso(concurso.id), [getByConcurso, concurso.id]);
  const evolution = useMemo(() => getEvolutionTimeline(concurso.id), [getEvolutionTimeline, concurso.id]);

  const updateSubject = (id, field, value) => updateConcurso(concurso.id, { disciplinas: disciplinas.map(d => d.id === id ? { ...d, [field]: Number(value) || value } : d) });
  const addSubject = () => updateConcurso(concurso.id, { disciplinas: [...disciplinas, { id: Date.now().toString(), name: 'Nova Disciplina', questions: 10, min: 5, weight: 1, difficulty: 'Médio', correct: 0, wrong: 0 }] });
  const removeSubject = id => { if (window.confirm('Remover disciplina?')) updateConcurso(concurso.id, { disciplinas: disciplinas.filter(d => d.id !== id) }); };

  const stats = useMemo(() => {
    let tq = 0, tp = 0, tc = 0, ta = 0;
    const proc = disciplinas.map(sub => {
      const points = sub.questions * sub.weight; tq += sub.questions; tp += points;
      const answered = (sub.correct || 0) + (sub.wrong || 0); tc += sub.correct || 0; ta += answered;
      return { ...sub, points, answered, accuracy: answered > 0 ? (((sub.correct || 0) / answered) * 100).toFixed(1) : 0 };
    });
    const subjects = proc.map(sub => {
      const pct = tp > 0 ? (sub.points / tp) * 100 : 0;
      return { ...sub, percent: pct.toFixed(1), cycleBlocks: (tp > 0 ? (pct / 100) * metaCiclos : 0).toFixed(1) };
    });
    return { subjects, totalQuestions: tq, totalPoints: tp, totalCorrect: tc, totalAnswered: ta, globalAccuracy: ta > 0 ? ((tc / ta) * 100).toFixed(1) : 0 };
  }, [disciplinas, metaCiclos]);

  function handleImportToCycle() {
    if (!stats.subjects.length) return toast.error('Adicione disciplinas ao edital antes de importar.');
    const dw = 240, tw = stats.subjects.reduce((a, s) => a + Number(s.percent), 0) || 100;
    const colors = ['#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#06B6D4', '#EC4899', '#F97316', '#14B8A6', '#A855F7'];
    const items = stats.subjects.map((sub, idx) => {
      let m = sub.subjectId ? subjects.find(s => s.id === sub.subjectId) : null;
      if (!m) m = subjects.find(s => s.name.toLowerCase().includes(sub.name.toLowerCase()) || sub.name.toLowerCase().includes(s.name.toLowerCase()));
      if (!m) { addSubjectToStore({ id: `subj_conc_${Date.now()}_${idx}_${Math.random().toString(36).slice(2, 8)}`, name: sub.name, color: colors[idx % colors.length], weeklyGoalMinutes: 180, editalWeight: Math.round(Number(sub.percent)), priority: 'media', icon: '📖' }); m = useStudyStore.getState().subjects.find(s => s.name.toLowerCase() === sub.name.toLowerCase()); }
      const wp = Number(sub.percent), hd = (dw / 60) * (wp / tw);
      return { id: `ci_${Date.now()}_${idx}`, subjectId: m?.id || null, subjectName: sub.name, subjectColor: m?.color || colors[idx % colors.length], weightPct: Math.round(wp), horasPorRodada: Math.max(Math.round(hd * 7 * 10) / 10, 0.5), minutosFeitos: 0, completedThisRound: false, ordem: idx };
    });
    addCycle({ nome: `Ciclo — ${concurso.nome}`, concursoId: concurso.id, totalHoras: Math.round(items.reduce((a, i) => a + i.horasPorRodada, 0)) || 24, items });
    const c = useCycleStore.getState().cycles.at(-1); if (c) useCycleStore.getState().setActiveCycle(c.id);
    toast.success(`Ciclo criado com ${items.length} disciplinas e ativado!`);
  }

  function handleImportFromCycle() {
    const cycle = cycles.find(c => c.concursoId === concurso.id) || cycles.find(c => c.id === useCycleStore.getState().activeCycleId);
    if (!cycle) return toast.error('Nenhum ciclo encontrado pra importar.');
    const existing = new Set(disciplinas.map(d => d.subjectId).filter(Boolean));
    const newRows = cycle.items.filter(i => i.subjectId && !existing.has(i.subjectId)).map((i, idx) => ({ id: `${Date.now()}_${idx}`, name: i.subjectName || subjects.find(s => s.id === i.subjectId)?.name || 'Matéria', subjectId: i.subjectId, questions: 10, min: 5, weight: 1, difficulty: 'Médio', correct: 0, wrong: 0 }));
    if (!newRows.length) return toast.error('Todas as matérias do ciclo já estão no edital.');
    updateConcurso(concurso.id, { disciplinas: [...disciplinas, ...newRows] });
    toast.success(`${newRows.length} matéria(s) importada(s) do ciclo!`);
  }

  const tabs = [{ key: 'edital', label: '📊 Edital Estratégico' }, { key: 'simulados', label: '🎯 Simulados & Metas' }, { key: 'fases', label: '📝 Fases & Provas' }];
  const th = 'p-4 border-b font-bold text-xs uppercase tracking-wider';
  const td = 'p-3 text-center';

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="w-10 h-10 flex items-center justify-center rounded-xl border hover:bg-white/5 transition-colors" style={BD}>←</button>
        <div className="flex-1">
          <h2 className="text-xl font-black text-text-main">{concurso.nome}</h2>
          <div className="text-xs text-text-dim flex gap-3 mt-1">{concurso.orgao && <span>🏛 {concurso.orgao}</span>}{concurso.cargo && <span>📋 {concurso.cargo}</span>}</div>
        </div>
        <div className="relative">
          <button onClick={() => setStatusPickerOpen(o => !o)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors"
            style={{ color: statusCfg.color, background: statusCfg.bg, borderColor: `${statusCfg.color}55` }}>{statusCfg.label} <span className="text-[9px] opacity-70">▾</span></button>
          {statusPickerOpen && (<>
            <div className="fixed inset-0 z-40" onClick={() => setStatusPickerOpen(false)} />
            <div className="absolute right-0 top-full mt-1.5 z-50 rounded-xl border overflow-hidden shadow-xl min-w-[160px] backdrop-blur-xl" style={{ background: 'rgba(255,255,255,0.06)', borderColor: 'rgba(255,255,255,0.1)' }}>
              {Object.entries(STATUS_CFG).map(([k, v]) => (<button key={k} onClick={() => { onChangeStatus(concurso, k); setStatusPickerOpen(false); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-left hover:bg-white/5 transition-colors"
                style={{ color: k === concurso.status ? v.color : 'var(--text-main)' }}>
                <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: v.color }} />{v.label}
              </button>))}
            </div>
          </>)}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[{ l: 'Questões Edital', v: stats.totalQuestions, i: '📝' }, { l: 'Pontos (NxP)', v: stats.totalPoints, i: '🎯' },
          { l: 'Acerto Global', v: `${stats.globalAccuracy}%`, i: '📈', c: stats.globalAccuracy >= 70 ? '#10B981' : stats.globalAccuracy >= 50 ? '#F59E0B' : '#EF4444' }
        ].map((k, i) => (
          <BentoCard key={i} span="3/12" className="flex flex-col gap-1">
            <div className="flex items-center justify-between"><span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-dim)' }}>{k.l}</span><span className="text-sm">{k.i}</span></div>
            <div className="text-2xl font-black tracking-tight" style={{ color: k.c || 'var(--text-main)' }}>{k.v}</div>
          </BentoCard>
        ))}
        <BentoCard span="3/12" className="flex items-center justify-center">
          {concurso.status === 'aprovado'
            ? <div className="flex items-center gap-2"><span className="text-2xl">✅</span><span className="font-bold" style={{ color: '#10B981' }}>Aprovado</span></div>
            : <button onClick={() => onAprovado(concurso)} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white hover:opacity-90" style={{ background: 'var(--primary)' }}>🏆 Fui Aprovado!</button>}
        </BentoCard>
      </div>

      <div className="flex gap-2 p-1.5 rounded-xl w-fit border backdrop-blur-xl" style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.06)' }}>
        {tabs.map(t => <button key={t.key} onClick={() => setActiveTab(t.key)} className="px-5 py-2 rounded-lg text-sm font-bold transition-all"
          style={{ background: activeTab === t.key ? 'var(--primary)' : 'transparent', color: activeTab === t.key ? 'white' : 'var(--text-muted)' }}>{t.label}</button>)}
      </div>

      <BentoCard span="full" padding={false}>
        {activeTab === 'edital' && (
          <div className="overflow-x-auto">
            <div className="p-4 flex items-center justify-between border-b" style={{ ...BD, ...BG2 }}>
              <span className="font-bold text-sm text-text-main">Mapeamento e Pesos</span>
              <div className="flex gap-2">
                <button onClick={handleImportFromCycle} className="text-xs px-3 py-1.5 rounded-lg font-bold border hover:bg-white/5" style={{ borderColor: 'rgba(255,255,255,0.1)', color: 'var(--text-main)' }}>⬇️ Importar do Ciclo</button>
                <button onClick={handleImportToCycle} className="text-xs px-3 py-1.5 rounded-lg font-bold border hover:bg-white/5" style={{ borderColor: 'rgba(255,255,255,0.1)', color: 'var(--text-main)' }}>🔄 Importar para o Ciclo</button>
                <button onClick={addSubject} className="text-xs px-3 py-1.5 rounded-lg font-bold text-white hover:opacity-90" style={{ background: 'var(--primary)' }}>+ Nova Disciplina</button>
              </div>
            </div>
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead style={BG2}><tr className="text-text-muted font-bold text-xs uppercase tracking-wider">
                {['Disciplina', 'Questões', 'Peso', 'N x P', '% Edital', `Ciclos (${metaCiclos})`, ''].map(h => <th key={h} className={th} style={BD}>{h}</th>)}
              </tr></thead>
              <tbody className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                {!stats.subjects.length && <tr><td colSpan="7" className="p-8 text-center text-text-dim text-xs">Adicione disciplinas ao edital para calcular sua estratégia.</td></tr>}
                {stats.subjects.map(sub => (
                  <tr key={sub.id} className="hover:bg-white/[0.03] transition-colors">
                    <td className="p-3"><SubjectLinkPicker subjectId={sub.subjectId} subjects={subjects}
                      onLink={(id, name) => updateConcurso(concurso.id, { disciplinas: disciplinas.map(d => d.id === sub.id ? { ...d, subjectId: id, name } : d) })}
                      onCreateAndLink={name => { const nid = `subj_conc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`; addSubjectToStore({ id: nid, name, color: ['#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#06B6D4', '#EC4899', '#F97316'][disciplinas.length % 8], weeklyGoalMinutes: 180, priority: 'media', icon: '📖' }); updateConcurso(concurso.id, { disciplinas: disciplinas.map(d => d.id === sub.id ? { ...d, subjectId: nid, name } : d) }); }} /></td>
                    <td className={td}><input type="number" value={sub.questions} onChange={e => updateSubject(sub.id, 'questions', e.target.value)} className="w-12 bg-transparent text-center outline-none border-b border-dashed" style={{ borderColor: 'rgba(255,255,255,0.15)' }} /></td>
                    <td className={td}><input type="number" step="0.5" value={sub.weight} onChange={e => updateSubject(sub.id, 'weight', e.target.value)} className="w-12 bg-transparent text-center outline-none border-b border-dashed font-bold" style={{ borderColor: 'rgba(255,255,255,0.15)', color: '#F59E0B' }} /></td>
                    <td className={`${td} font-black text-text-main`}>{sub.points}</td>
                    <td className={td}><div className="flex items-center gap-2 justify-center"><span className="w-10 text-right text-xs font-bold">{sub.percent}%</span>
                      <div className="w-12 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}><div className="h-full rounded-full" style={{ width: `${sub.percent}%`, background: 'var(--primary)' }} /></div></div></td>
                    <td className={`${td} font-black`} style={{ color: 'var(--primary)' }}>{sub.cycleBlocks}</td>
                    <td className={td}><button onClick={() => removeSubject(sub.id)} className="text-red-500 hover:text-red-400 font-bold px-2">✕</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'simulados' && (
          <div className="space-y-4 p-4">
            <div className="rounded-2xl border overflow-hidden" style={BD}>
              <div className="p-4 flex items-center justify-between border-b" style={{ ...BD, ...BG2 }}>
                <span className="font-bold text-sm text-text-main">📝 Simulados ({realSimulados.length})</span>
                <button onClick={() => navigate('/study/simulados')} className="text-xs px-3 py-1.5 rounded-lg font-bold border hover:bg-white/5" style={{ borderColor: 'rgba(255,255,255,0.1)', color: 'var(--text-main)' }}>+ Novo</button>
              </div>
              {!realSimulados.length ? <div className="p-6 text-center text-xs text-text-dim italic">Nenhum simulado vinculado a este concurso.</div> : (<>
                {evolution.length > 1 && <div className="px-4 pt-4" style={{ height: 160 }}><ResponsiveContainer width="100%" height="100%"><LineChart data={evolution} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="date" tickFormatter={d => formatDateBR ? formatDateBR(d) : d} axisLine={false} tickLine={false} tick={{ fill: 'var(--text-dim)', fontSize: 10 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-dim)', fontSize: 10 }} domain={[0, 100]} />
                  <Tooltip contentStyle={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12, backdropFilter: 'blur(12px)' }}
                    formatter={(v, n) => [n === 'notaPonderada' ? `${v} pts` : `${v}%`, n === 'notaPonderada' ? 'NxP' : 'Acerto']} />
                  <Line type="monotone" dataKey="notaPonderada" stroke="var(--primary)" strokeWidth={2.5} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="accuracy" stroke="#10B981" strokeWidth={2} strokeDasharray="4 3" dot={{ r: 2 }} />
                </LineChart></ResponsiveContainer></div>}
                <div className="p-4 flex flex-wrap gap-2">{evolution.map((e, i) => (
                  <div key={i} className="px-3 py-2 rounded-xl border text-xs backdrop-blur-sm" style={{ borderColor: e.eliminado ? '#EF444455' : 'rgba(255,255,255,0.06)', background: e.eliminado ? '#EF444412' : 'rgba(255,255,255,0.03)' }}>
                    <div className="font-bold text-text-main">{e.nome}</div><div className="text-text-dim">{formatDateBR ? formatDateBR(e.date) : e.date}</div>
                    <div className="font-black mt-0.5" style={{ color: e.eliminado ? '#EF4444' : e.accuracy >= 70 ? '#10B981' : '#F59E0B' }}>NxP {e.notaPonderada} · {e.accuracy ?? 0}%{e.eliminado && ' · ELIMINADO'}</div>
                  </div>
                ))}</div>
              </>)}
            </div>
            <div className="overflow-x-auto rounded-2xl border" style={BD}>
              <div className="p-4 border-b font-bold text-sm text-text-main" style={{ ...BD, ...BG2 }}>Metas de Eliminação</div>
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead style={BG2}><tr className="text-text-muted font-bold text-xs uppercase tracking-wider">
                  {['Disciplina', 'Mín.', 'Corretas', 'Erradas', 'Situação', '% Acerto'].map(h => <th key={h} className={th} style={BD}>{h}</th>)}
                </tr></thead>
                <tbody className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                  {!stats.subjects.length && <tr><td colSpan="6" className="p-8 text-center text-text-dim text-xs">Configure o Edital primeiro.</td></tr>}
                  {stats.subjects.map(sub => {
                    const passMin = sub.correct >= (sub.min || 0);
                    return <tr key={sub.id} className="hover:bg-white/[0.03] transition-colors">
                      <td className="p-3 font-bold text-text-main">{sub.name}</td>
                      <td className={td}><input type="number" value={sub.min} onChange={e => updateSubject(sub.id, 'min', e.target.value)} className="w-12 bg-transparent text-text-muted text-center outline-none border-b border-dashed font-bold" style={{ borderColor: 'rgba(255,255,255,0.15)' }} /></td>
                      <td className={td}><input type="number" value={sub.correct} onChange={e => updateSubject(sub.id, 'correct', e.target.value)} className="w-16 bg-green-500/10 text-green-500 text-center font-bold border border-green-500/30 rounded px-2 py-1 outline-none" /></td>
                      <td className={td}><input type="number" value={sub.wrong} onChange={e => updateSubject(sub.id, 'wrong', e.target.value)} className="w-16 bg-red-500/10 text-red-500 text-center font-bold border border-red-500/30 rounded px-2 py-1 outline-none" /></td>
                      <td className={td}>{sub.min > 0 ? (passMin ? <Badge color="#10B981" variant="solid">OK</Badge> : <Badge color="#EF4444" variant="solid">ELIMINADO</Badge>) : <span className="text-text-dim text-xs">-</span>}</td>
                      <td className={td}><span className="font-black text-lg" style={{ color: sub.accuracy >= 70 ? '#10B981' : sub.accuracy >= 50 ? '#F59E0B' : '#EF4444' }}>{sub.accuracy}%</span></td>
                    </tr>;
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'fases' && (
          <div className="p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs text-text-dim">Histórico de provas prestadas.</p>
              <button onClick={() => setProvaModal({ concursoId: concurso.id })} className="text-xs px-4 py-2 rounded-lg font-bold" style={{ background: 'var(--primary)', color: 'white' }}>+ Registrar Prova</button>
            </div>
            {!concurso.provas?.length ? (
              <div className="text-center p-8 border border-dashed rounded-xl" style={{ borderColor: 'rgba(255,255,255,0.1)' }}><p className="text-xs text-text-dim">Nenhuma prova registrada ainda.</p></div>
            ) : <div className="space-y-3">{concurso.provas.map(p => {
              const pct = p.totalQuestoes > 0 ? Math.round((p.acertos / p.totalQuestoes) * 100) : null;
              return <motion.div key={p.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-4 p-4 rounded-xl border backdrop-blur-sm" style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.06)' }}>
                <div className="w-12 h-12 flex items-center justify-center rounded-full text-xl" style={{ background: p.passou ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)' }}>{p.passou ? '🏆' : '❌'}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1"><span className="text-sm font-bold text-text-main">{p.fase}</span>{p.data && <Badge>{formatDateBR(p.data)}</Badge>}</div>
                  {pct !== null && <div className="text-xs text-text-dim font-medium">{p.acertos}/{p.totalQuestoes} acertos <strong style={{ color: 'var(--primary)' }}>({pct}%)</strong>{p.nota ? ` · Nota: ${p.nota}` : ''}{p.notaCorte ? ` · Corte: ${p.notaCorte}` : ''}</div>}
                  {p.observacoes && <p className="text-xs text-text-muted mt-1 italic">"{p.observacoes}"</p>}
                </div>
              </motion.div>;
            })}</div>}
          </div>
        )}
      </BentoCard>
      {provaModal && <ProvaForm concursoId={provaModal.concursoId} onClose={() => setProvaModal(null)} />}
    </motion.div>
  );
}

export default function StudyConcursosPage() {
  const { concursos, deleteConcurso, updateConcurso } = useConcursoStore();
  const { dispatchXP } = useGameStore();
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [selectedConcursoId, setSelectedConcursoId] = useState(null);

  const handleAprovado = c => {
    if (c.status === 'aprovado') return;
    updateConcurso(c.id, { status: 'aprovado', resultado: { ...c.resultado, aprovado: true } });
    dispatchXP('study', XP_RULES.CONCURSO_APROVADO.xp, 'disciplina', false, 'disciplina');
    toast.success(`🏆 APROVADO! +${XP_RULES.CONCURSO_APROVADO.xp} XP — Parabéns!`, { duration: 6000, icon: '🔥' });
  };
  const handleChangeStatus = (c, ns) => { if (ns === c.status) return; updateConcurso(c.id, { status: ns, resultado: { ...c.resultado, aprovado: ns === 'aprovado' ? true : c.resultado?.aprovado } }); toast.success(`Status: "${STATUS_CFG[ns]?.label}"`); };
  const selected = useMemo(() => concursos.find(c => c.id === selectedConcursoId), [concursos, selectedConcursoId]);

  return (
    <StudyLayout>
      <AnimatePresence mode="wait">
        {selected ? <ConcursoDetailView key="detail" concurso={selected} onBack={() => setSelectedConcursoId(null)} onAprovado={handleAprovado} onChangeStatus={handleChangeStatus} /> : (
          <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
            <div className="flex items-center justify-between">
              <div><h2 className="font-bold text-text-main text-xl">Gestão de Concursos</h2><p className="text-xs text-text-dim mt-1">Acompanhe editais, provas e seu desempenho estratégico.</p></div>
              <button onClick={() => { setEditTarget(null); setFormOpen(true); }} className="px-5 py-2.5 rounded-xl text-sm font-bold text-white hover:opacity-90 shadow-lg" style={{ background: 'var(--primary)' }}>+ Novo Concurso</button>
            </div>
            {!concursos.length ? (
              <BentoCard span="full" className="text-center py-12">
                <div className="text-5xl mb-4 opacity-40">🏛️</div>
                <p className="font-bold text-text-main mb-2">Nenhum concurso no radar</p>
                <p className="text-sm text-text-dim mb-6">Mapeie editais abertos para organizar sua estratégia.</p>
                <button onClick={() => setFormOpen(true)} className="px-6 py-3 rounded-xl text-sm font-bold text-white" style={{ background: 'var(--primary)' }}>Cadastrar Primeiro Concurso</button>
              </BentoCard>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{concursos.map(c => {
                const st = STATUS_CFG[c.status] || STATUS_CFG.estudando, days = daysUntil(c.dataProva);
                return (
                  <motion.div key={c.id} layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                    className="rounded-2xl overflow-hidden flex flex-col transition-transform hover:-translate-y-1 backdrop-blur-xl"
                    style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${c.status === 'aprovado' ? 'rgba(16,185,129,0.4)' : 'rgba(255,255,255,0.08)'}`, boxShadow: '0 4px 24px rgba(0,0,0,0.15)' }}>
                    <div className="p-5 flex-1">
                      <div className="flex justify-between items-start mb-3">
                        <Badge color={st.color} variant="solid">{st.label}</Badge>
                        <div className="flex gap-1">
                          {c.edital_url && <a href={c.edital_url} target="_blank" rel="noreferrer" className="w-7 h-7 flex items-center justify-center rounded-lg text-text-dim hover:text-text-main" style={{ background: 'rgba(255,255,255,0.05)' }} title="Ver edital">📎</a>}
                          <button onClick={() => { setEditTarget(c); setFormOpen(true); }} className="w-7 h-7 flex items-center justify-center rounded-lg text-text-dim hover:text-text-main text-xs" style={{ background: 'rgba(255,255,255,0.05)' }}>✎</button>
                          <button onClick={() => { if (window.confirm(`Excluir ${c.nome}?`)) deleteConcurso(c.id); }} className="w-7 h-7 flex items-center justify-center rounded-lg text-red-400 hover:bg-red-500/20 text-xs" style={{ background: 'rgba(255,255,255,0.05)' }}>✕</button>
                        </div>
                      </div>
                      <h3 className="font-black text-lg text-text-main mb-1 leading-tight">{c.nome}</h3>
                      <div className="text-xs font-medium text-text-muted flex flex-wrap gap-x-3 gap-y-1 mb-4">
                        {c.cargo && <span>{c.cargo}</span>}{c.banca && <span>• {c.banca}</span>}{c.vagas && <span>• {c.vagas} vagas</span>}
                      </div>
                      {c.dataProva && <div className="flex items-center gap-2 text-xs font-bold px-3 py-2 rounded-lg border"
                        style={{ background: days !== null && days <= 7 ? 'rgba(239,68,68,0.1)' : 'rgba(255,255,255,0.03)', borderColor: days !== null && days <= 7 ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.06)',
                          color: days !== null && days <= 7 ? '#EF4444' : days !== null && days < 30 ? '#F59E0B' : 'var(--text-main)' }}>
                        📅 Prova: {formatDateBR(c.dataProva)} {days !== null && days > 0 ? `(${days} dias)` : days === 0 ? '(HOJE!)' : ''}
                      </div>}
                    </div>
                    <div className="p-3 border-t flex gap-2" style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
                      <button onClick={() => setSelectedConcursoId(c.id)} className="flex-1 py-2 rounded-xl text-sm font-bold hover:opacity-90" style={{ background: 'rgba(59,130,246,0.12)', color: 'var(--primary)' }}>🎯 Estratégia & Desempenho</button>
                    </div>
                  </motion.div>
                );
              })}</div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      {formOpen && <ConcursoForm editData={editTarget} onClose={() => { setFormOpen(false); setEditTarget(null); }} />}
    </StudyLayout>
  );
}
