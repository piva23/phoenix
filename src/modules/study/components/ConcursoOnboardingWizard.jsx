import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { useConcursoStore } from '../../../stores/useConcursoStore';
import { useCycleStore } from '../../../stores/useCycleStore';
import { useStudyStore } from '../../../stores/useStudyStore';
import { CycleBuilder } from './CycleBuilder';
import { parseHierarchy } from './ImportEditalModal';

const STEPS = [
  { id: 'dados',    label: 'Dados',      icon: '📋' },
  { id: 'edital',   label: 'Estratégia',  icon: '📊' },
  { id: 'vincular', label: 'Vincular',    icon: '🔗' },
  { id: 'ciclo',    label: 'Ciclo',       icon: '🔄' },
  { id: 'pronto',   label: 'Pronto!',     icon: '🚀' },
];

const COLORS = ['#8B5CF6','#3B82F6','#10B981','#F59E0B','#EF4444','#06B6D4','#EC4899','#F97316','#14B8A6','#A855F7'];
const INP = 'w-full px-3 py-2.5 rounded-xl text-sm outline-none backdrop-blur-sm';
const INP_S = { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'var(--text-main)' };
const BD = { borderColor: 'rgba(255,255,255,0.08)' };
const BG2 = { background: 'rgba(255,255,255,0.02)' };
const STATUS_CFG = {
  estudando: { label: 'Estudando', color: '#3B82F6', bg: 'rgba(59,130,246,0.12)' },
  inscrito:  { label: 'Inscrito',  color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
  fez_prova: { label: 'Fez a Prova', color: '#8B5CF6', bg: 'rgba(139,92,246,0.12)' },
  aprovado:  { label: 'APROVADO \u{1F3C6}', color: '#10B981', bg: 'rgba(16,185,129,0.12)' },
  reprovado: { label: 'Reprovado', color: '#EF4444', bg: 'rgba(239,68,68,0.12)' },
  desistiu:  { label: 'Desistiu',  color: '#6B6A7A', bg: 'rgba(107,106,122,0.12)' },
};

function Field({ label, children }) {
  return (
    <div>
      <label className="text-xs font-bold uppercase tracking-wider block mb-1.5" style={{ color: 'var(--text-dim)' }}>
        {label}
      </label>
      {children}
    </div>
  );
}


/* ═══════════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════════════════════ */

export function ConcursoOnboardingWizard({ onClose, editData = null }) {
  const { addConcurso, updateConcurso, concursos } = useConcursoStore();
  const { addCycle, cycles, deleteCycle, setActiveCycle } = useCycleStore();
  const subjects = useStudyStore(s => s.subjects);
  const addSubjectToStore = useStudyStore(s => s.addSubject);
  const updateSubjectInStore = useStudyStore(s => s.updateSubject);

  const [step, setStep] = useState(0);
  const [concursoData, setConcursoData] = useState({
    nome: editData?.nome || '', cargo: editData?.cargo || '', orgao: editData?.orgao || '',
    banca: editData?.banca || '', status: editData?.status || 'estudando', vagas: editData?.vagas || '',
    salario: editData?.salario || '', dataInscricaoFim: editData?.dataInscricaoFim || '',
    dataProva: editData?.dataProva || '', metaCiclos: editData?.metaCiclos || 24,
    edital_url: editData?.edital_url || '', observacoes: editData?.observacoes || '',
    tipoProva: editData?.tipoProva || 'objetiva', redacaoWeight: editData?.redacaoWeight || 0,
  });
  const [disciplinas, setDisciplinas] = useState(editData?.disciplinas || []);
  const [createdConcursoId, setCreatedConcursoId] = useState(editData?.id || null);
  const [createdCycle, setCreatedCycle] = useState(null);
  const [showCycleBuilder, setShowCycleBuilder] = useState(false);
  const [direction, setDirection] = useState(1);

  const sc = (k, v) => setConcursoData(p => ({ ...p, [k]: v }));

  /* ── STATS (largest remainder para somar exatamente 100%) ── */
  const stats = useMemo(() => {
    let tq = 0, tp = 0;
    const proc = disciplinas.map(sub => {
      const points = Math.round((sub.questions || 0) * (sub.weight || 1));
      tq += sub.questions || 0; tp += points;
      return { ...sub, points };
    });
    // Largest remainder method — garante soma exata de 100%
    if (tp === 0) {
      return { subjects: proc.map(s => ({ ...s, percent: '0.0', cycleBlocks: '0.0' })), totalQuestions: 0, totalPoints: 0 };
    }
    const raw = proc.map(sub => ({ ...sub, rawPct: (sub.points / tp) * 100 }));
    const floored = raw.map(s => ({ ...s, pctFloor: Math.floor(s.rawPct * 10) / 10 }));
    const sumFloored = floored.reduce((a, s) => a + s.pctFloor, 0);
    let remainder = Math.round((100 - sumFloored) * 10);
    const sorted = [...floored].map((s, i) => ({ ...s, idx: i })).sort((a, b) => (b.rawPct * 10 % 1) - (a.rawPct * 10 % 1));
    while (remainder > 0 && sorted.length > 0) {
      const top = sorted.shift();
      floored[top.idx].pctFloor = Math.round((floored[top.idx].pctFloor + 0.1) * 10) / 10;
      remainder--;
    }
    const enriched = floored.map(sub => ({
      ...sub,
      percent: sub.pctFloor.toFixed(1),
      cycleBlocks: ((sub.pctFloor / 100) * concursoData.metaCiclos).toFixed(1),
    }));
    return { subjects: enriched, totalQuestions: tq, totalPoints: tp };
  }, [disciplinas, concursoData.metaCiclos]);

  /* ── STEP NAVIGATION ────────────────────────────────────────────────── */
  function goNext() {
    if (step === 0) {
      if (!concursoData.nome.trim()) return toast.error('O nome do concurso é obrigatório!');
      if (createdConcursoId) {
        updateConcurso(createdConcursoId, concursoData);
      } else {
        addConcurso({ ...concursoData, disciplinas: [] });
        const newest = useConcursoStore.getState().concursos.at(-1);
        setCreatedConcursoId(newest?.id || null);
      }
    }
    if (step === 1 && createdConcursoId) {
      updateConcurso(createdConcursoId, { disciplinas });
    }
    setDirection(1);
    setStep(s => Math.min(s + 1, STEPS.length - 1));
  }

  function goBack() {
    if (step === 1 && createdConcursoId) {
      updateConcurso(createdConcursoId, { disciplinas });
    }
    setDirection(-1);
    setStep(s => Math.max(s - 1, 0));
  }

  function handleFinish() {
    if (createdCycle) setActiveCycle(createdCycle.id);
    toast.success('Pronto! Bom estudo!');
    onClose();
  }

  /* ── DISCIPLINE HANDLERS (Step 1) ──────────────────────────────────── */
  function addDisciplina() {
    setDisciplinas(p => [...p, {
      id: Date.now().toString(), name: 'Nova Disciplina',
      questions: 10, weight: 1, subjectId: null,
    }]);
  }

  function removeDisciplina(id) {
    setDisciplinas(p => p.filter(d => d.id !== id));
  }

  function updateDisciplina(id, field, value) {
    setDisciplinas(p => p.map(d =>
      d.id === id ? { ...d, [field]: Number(value) || value } : d
    ));
  }

  /* ── AUTO-LINK (Step 2) ────────────────────────────────────────────── */
  function handleAutoLink() {
    let linked = 0;
    setDisciplinas(prev => prev.map(d => {
      if (d.subjectId) return d;
      const match = subjects.find(s =>
        s.name.toLowerCase().trim() === d.name.toLowerCase().trim()
      ) || subjects.find(s =>
        s.name.toLowerCase().includes(d.name.toLowerCase()) ||
        d.name.toLowerCase().includes(s.name.toLowerCase())
      );
      if (match) { linked++; return { ...d, subjectId: match.id }; }
      return d;
    }));
    if (linked > 0) toast.success(linked + ' disciplina(s) vinculada(s)!');
    else toast('Nenhum match encontrado.', { icon: '\uD83D\uDD0D' });
  }

  function handleCreateSubjects() {
    let created = 0;
    const updated = disciplinas.map((d, idx) => {
      if (d.subjectId) return d;
      const existing = subjects.find(s =>
        s.name.toLowerCase().trim() === d.name.toLowerCase().trim()
      ) || subjects.find(s =>
        s.name.toLowerCase().includes(d.name.toLowerCase()) ||
        d.name.toLowerCase().includes(s.name.toLowerCase())
      );
      if (existing) return { ...d, subjectId: existing.id };
      const newId = 'subj_wiz_' + Date.now() + '_' + idx + '_' + Math.random().toString(36).slice(2, 8);
      addSubjectToStore({
        id: newId, name: d.name, color: COLORS[idx % COLORS.length],
        weeklyGoalMinutes: 180,
        editalWeight: Math.round(Number(
          stats.subjects.find(s => s.id === d.id)?.percent || 0
        )),
        priority: 'media', icon: '\uD83D\uDCD6',
      });
      const found = useStudyStore.getState().subjects.find(
        s => s.name.toLowerCase() === d.name.toLowerCase()
      );
      created++;
      return { ...d, subjectId: found?.id || newId };
    });
    setDisciplinas(updated);
    toast.success(created + ' materia(s) criada(s)!');
  }

  function linkDisciplina(discId, subjectId) {
    setDisciplinas(p => p.map(d =>
      d.id === discId ? { ...d, subjectId } : d
    ));
  }

  /* ── AUTO-GENERATE CYCLE (Step 3) ──────────────────────────────────── */
  function handleAutoGenerateCycle() {
    if (!disciplinas.length) return toast.error('Adicione disciplinas primeiro.');
    const totalHours = concursoData.metaCiclos;
    const hasRedacao = concursoData.redacaoWeight > 0;

    const items = stats.subjects.map((sub, idx) => {
      let m = sub.subjectId ? subjects.find(s => s.id === sub.subjectId) : null;
      if (!m) m = subjects.find(s => s.name.toLowerCase().includes(sub.name.toLowerCase()));
      if (!m) {
        const newId = 'subj_wiz_' + Date.now() + '_' + idx;
        addSubjectToStore({
          id: newId, name: sub.name,
          color: COLORS[idx % COLORS.length],
          weeklyGoalMinutes: 180,
          editalWeight: Math.round(Number(sub.percent)),
          priority: 'media', icon: '\uD83D\uDCD6',
        });
        m = useStudyStore.getState().subjects.find(
          s => s.name.toLowerCase() === sub.name.toLowerCase()
        );
      }
      if (m) updateSubjectInStore(m.id, {
        editalWeight: Math.round(Number(sub.percent))
      });
      const wp = Number(sub.percent);
      // Se tem redação, reduz proporcionalmente o peso das matérias
      const effectiveTotal = hasRedacao ? (100 - concursoData.redacaoWeight) : 100;
      const horas = Math.max(0.5, Math.round((wp / effectiveTotal) * totalHours * 10) / 10);
      return {
        id: 'ci_' + Date.now() + '_' + idx,
        subjectId: m?.id || null,
        subjectName: sub.name,
        subjectColor: m?.color || COLORS[idx % COLORS.length],
        weightPct: Math.round(wp),
        horasPorRodada: horas,
        minutosFeitos: 0,
        completedThisRound: false,
        ordem: idx,
      };
    });

    // Se tem redação, adiciona item de redação no ciclo
    if (hasRedacao) {
      const redHoras = Math.max(1, Math.round((concursoData.redacaoWeight / 100) * totalHours * 10) / 10);
      items.push({
        id: 'ci_redacao_' + Date.now(),
        subjectId: null,
        subjectName: 'Redação',
        subjectColor: '#EC4899',
        weightPct: concursoData.redacaoWeight,
        horasPorRodada: redHoras,
        minutosFeitos: 0,
        completedThisRound: false,
        ordem: items.length,
        isRedacao: true,
      });
    }

    const existingCycle = cycles.find(c => c.concursoId === createdConcursoId);
    if (existingCycle) deleteCycle(existingCycle.id);

    addCycle({
      nome: 'Ciclo — ' + concursoData.nome,
      concursoId: createdConcursoId,
      totalHoras: Math.round(items.reduce((a, i) => a + i.horasPorRodada, 0)) || totalHours,
      items,
    });
    const c = useCycleStore.getState().cycles.at(-1);
    setCreatedCycle(c);
    toast.success('Ciclo criado com ' + items.length + ' disciplinas!');
  }

  /* ── ANIMATION ──────────────────────────────────────────────────────── */
  const variants = {
    enter: (dir) => ({ x: dir > 0 ? 80 : -80, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir) => ({ x: dir > 0 ? -80 : 80, opacity: 0 }),
  };

  /* ── RENDER ─────────────────────────────────────────────────────────── */
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.80)', backdropFilter: 'blur(16px)' }}
      onClick={onClose}>
      <motion.div className="w-full max-w-3xl rounded-2xl overflow-hidden flex flex-col"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', maxHeight: '90vh' }}
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        onClick={e => e.stopPropagation()}>

        {/* PROGRESS BAR */}
        <div className="flex items-center justify-center gap-2 py-4 px-6 border-b" style={BD}>
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center">
              <div className="flex items-center gap-1.5">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300"
                  style={{
                    background: i <= step ? 'var(--primary)' : 'rgba(255,255,255,0.06)',
                    color: i <= step ? 'white' : 'var(--text-dim)',
                    boxShadow: i === step ? '0 0 12px var(--primary)' : 'none',
                  }}>
                  {i < step ? '\u2713' : s.icon}
                </div>
                <span className="text-[10px] font-bold hidden sm:block"
                  style={{ color: i <= step ? 'var(--text-main)' : 'var(--text-dim)' }}>
                  {s.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className="w-6 sm:w-10 h-0.5 mx-1 rounded-full"
                  style={{ background: i < step ? 'var(--primary)' : 'rgba(255,255,255,0.08)' }} />
              )}
            </div>
          ))}
        </div>

        {/* STEP CONTENT */}
        <div className="flex-1 overflow-y-auto relative" style={{ minHeight: 400 }}>
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div key={step} custom={direction} variants={variants}
              initial="enter" animate="center" exit="exit"
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="p-6 space-y-5">
              {step === 0 && (
                <StepDados concursoData={concursoData} sc={sc} disciplinas={disciplinas} setDisciplinas={setDisciplinas} concursos={concursos} subjects={subjects} addSubjectToStore={addSubjectToStore} />
              )}
              {step === 1 && (
                <StepEstrategia
                  disciplinas={disciplinas}
                  addDisciplina={addDisciplina}
                  removeDisciplina={removeDisciplina}
                  updateDisciplina={updateDisciplina}
                  stats={stats}
                  metaCiclos={concursoData.metaCiclos}
                />
              )}
              {step === 2 && (
                <StepVincular
                  disciplinas={disciplinas}
                  subjects={subjects}
                  stats={stats}
                  onLink={linkDisciplina}
                  onAutoLink={handleAutoLink}
                  onCreateSubjects={handleCreateSubjects}
                  addSubjectToStore={addSubjectToStore}
                />
              )}
              {step === 3 && (
                <StepCiclo
                  concursoData={concursoData}
                  stats={stats}
                  createdCycle={createdCycle}
                  setCreatedCycle={setCreatedCycle}
                  showCycleBuilder={showCycleBuilder}
                  setShowCycleBuilder={setShowCycleBuilder}
                  handleAutoGenerate={handleAutoGenerateCycle}
                  createdConcursoId={createdConcursoId}
                  cycles={cycles}
                />
              )}
              {step === 4 && (
                <StepPronto
                  concursoData={concursoData}
                  stats={stats}
                  createdCycle={createdCycle}
                  handleFinish={handleFinish}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* BOTTOM NAV */}
        <div className="flex gap-3 p-5 border-t flex-shrink-0" style={BD}>
          {step === 0 ? (
            <button onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold text-text-muted border hover:bg-white/5"
              style={BD}>
              Cancelar
            </button>
          ) : (
            <button onClick={goBack}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold text-text-muted border hover:bg-white/5"
              style={BD}>
              ← Voltar
            </button>
          )}
          {step < STEPS.length - 1 ? (
            <button onClick={goNext}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white hover:opacity-90"
              style={{ background: 'var(--primary)' }}>
              Próximo →
            </button>
          ) : (
            <button onClick={handleFinish}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white hover:opacity-90"
              style={{ background: 'var(--primary)' }}>
              🚀 Começar a Estudar
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   STEP 0 — DADOS DO CONCURSO
   ═══════════════════════════════════════════════════════════════════════════════ */

function StepDados({ concursoData, sc, disciplinas, setDisciplinas, concursos, subjects, addSubjectToStore }) {
  const [importText, setImportText] = useState('');
  const [importPreview, setImportPreview] = useState(null);

  // Parse hierárquico — exatamente igual ao ImportEditalModal
  const handlePreview = () => {
    const parsed = parseHierarchy(importText);
    if (!parsed.length) return toast.error('Nenhuma matéria detectada. Use indentação para hierarquia.');
    setImportPreview(parsed);
  };

  // Importa matérias com níveis (tópicos + subtópicos) — igual ao CycleBuilder
  const handleConfirmImport = () => {
    if (!importPreview?.length) return;
    const existingNames = new Set(disciplinas.map(d => d.name.toLowerCase()));
    let created = 0;
    const newDiscs = [];

    importPreview.forEach((subj, si) => {
      if (existingNames.has(subj.name.toLowerCase())) return;
      // Check if subject already exists in store
      const existingSubj = subjects.find(s => s.name.toLowerCase() === subj.name.toLowerCase());
      let subjectId = existingSubj?.id || null;

      if (!existingSubj) {
        // Create subject WITH topics and subtopics (hierárquico)
        const newId = 'subj_wiz_' + Date.now() + '_' + si + '_' + Math.random().toString(36).slice(2, 6);
        addSubjectToStore({
          id: newId,
          name: subj.name,
          color: COLORS[si % COLORS.length],
          weeklyGoalMinutes: 180,
          editalWeight: 0,
          priority: 'media',
          icon: '📖',
          topics: (subj.topics || []).map((t, ti) => ({
            id: `topic_wiz_${Date.now()}_${si}_${ti}`,
            name: t.name,
            notes: '',
            subtopics: (t.subtopics || []).map((st, sti) => ({
              id: `subtopic_wiz_${Date.now()}_${si}_${ti}_${sti}`,
              name: st.name,
              notes: '',
              questionsTotal: 0,
              questionsDone: 0,
              minutesTotal: 0,
              minutesDone: 0,
              mastered: false,
              createdAt: Date.now(),
            })),
            createdAt: Date.now(),
          })),
        });
        const found = useStudyStore.getState().subjects.find(s => s.name.toLowerCase() === subj.name.toLowerCase());
        subjectId = found?.id || newId;
        created++;
      }
      newDiscs.push({
        id: `disc_${Date.now()}_${si}`,
        name: subj.name,
        questions: 0,
        weight: 1,
        subjectId,
      });
    });

    if (!newDiscs.length && !created) return toast('Todas as disciplinas já foram adicionadas.');
    setDisciplinas(p => [...p, ...newDiscs]);
    setImportText('');
    setImportPreview(null);
    toast.success(`${created} matéria(s) criada(s) com tópicos e aulas!`);
  };

  const handleImportFromConcurso = (c) => {
    if (!c.disciplinas?.length) return toast.error('Esse concurso não tem disciplinas.');
    const existingNames = new Set(disciplinas.map(d => d.name.toLowerCase()));
    let created = 0;
    const newDiscs = [];
    c.disciplinas.forEach((d, i) => {
      if (existingNames.has(d.name.toLowerCase())) return;
      const alreadyInStore = subjects.find(s => s.name.toLowerCase() === d.name.toLowerCase());
      let subjectId = alreadyInStore?.id || null;
      if (!alreadyInStore) {
        const newId = 'subj_wiz_' + Date.now() + '_' + i + '_' + Math.random().toString(36).slice(2, 6);
        addSubjectToStore({
          id: newId, name: d.name,
          color: COLORS[i % COLORS.length],
          weeklyGoalMinutes: 180, editalWeight: 0, priority: 'media', icon: '📖',
          topics: [],
        });
        const found = useStudyStore.getState().subjects.find(s => s.name.toLowerCase() === d.name.toLowerCase());
        subjectId = found?.id || newId;
        created++;
      }
      newDiscs.push({ id: `disc_${Date.now()}_${i}`, name: d.name, questions: d.questions || 0, weight: d.weight || 1, subjectId });
    });
    if (!newDiscs.length) return toast('Todas as disciplinas já foram adicionadas.');
    setDisciplinas(p => [...p, ...newDiscs]);
    if (created) toast.success(`${created} matéria(s) criada(s) + ${newDiscs.length - created} vinculada(s) de "${c.nome}"!`);
    else toast(`${newDiscs.length} disciplina(s) importada(s) de "${c.nome}"!`);
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-black text-text-main">
           📋 Dados do Concurso
        </h2>
        <p className="text-xs text-text-dim mt-1">
           Preencha as informações básicas do edital.
        </p>
      </div>

      <Field label="Nome do Concurso *">
        <input className={INP} style={INP_S}
           placeholder="Ex: TJRS — Analista Judiciário"
          value={concursoData.nome}
          onChange={e => sc('nome', e.target.value)}
          autoFocus />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Cargo">
          <input className={INP} style={INP_S}
            value={concursoData.cargo}
            onChange={e => sc('cargo', e.target.value)} />
        </Field>
         <Field label="Órgão">
          <input className={INP} style={INP_S}
            value={concursoData.orgao}
            onChange={e => sc('orgao', e.target.value)} />
        </Field>
        <Field label="Banca">
          <input className={INP} style={INP_S}
            value={concursoData.banca}
            onChange={e => sc('banca', e.target.value)} />
        </Field>
        <Field label="Status">
          <select className={INP} style={INP_S}
            value={concursoData.status}
            onChange={e => sc('status', e.target.value)}>
            {Object.entries(STATUS_CFG).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
        </Field>
        <Field label="Vagas">
          <input type="number" className={INP} style={INP_S}
            value={concursoData.vagas}
            onChange={e => sc('vagas', e.target.value)} />
        </Field>
         <Field label="Salário (R$)">
          <input type="number" className={INP} style={INP_S}
            value={concursoData.salario}
            onChange={e => sc('salario', e.target.value)} />
        </Field>
         <Field label="Inscrições até">
          <input type="date" className={INP} style={INP_S}
            value={concursoData.dataInscricaoFim}
            onChange={e => sc('dataInscricaoFim', e.target.value)} />
        </Field>
        <Field label="Data da Prova">
          <input type="date" className={INP} style={INP_S}
            value={concursoData.dataProva}
            onChange={e => sc('dataProva', e.target.value)} />
        </Field>
        <div className="col-span-2">
          <Field label="Meta de Blocos no Ciclo">
            <input type="number" className={INP} style={INP_S}
              value={concursoData.metaCiclos}
              onChange={e => sc('metaCiclos', Number(e.target.value))} />
          </Field>
        </div>
      </div>

      {/* Tipo de Prova + Redação */}
      <div className="grid grid-cols-2 gap-3">
        <Field label="Tipo de Prova">
          <select className={INP} style={INP_S}
            value={concursoData.tipoProva}
            onChange={e => sc('tipoProva', e.target.value)}>
            <option value="objetiva">📝 Apenas Objetiva</option>
            <option value="objetiva_redacao">📝+✍️ Objetiva + Redação</option>
            <option value="redacao">✍️ Apenas Redação</option>
          </select>
        </Field>
        {(concursoData.tipoProva === 'objetiva_redacao' || concursoData.tipoProva === 'redacao') && (
          <Field label="Peso da Redação (% do edital)">
            <input type="number" min={0} max={100} step={5} className={INP} style={INP_S}
              value={concursoData.redacaoWeight}
              onChange={e => sc('redacaoWeight', Math.min(100, Math.max(0, Number(e.target.value))))} />
          </Field>
        )}
      </div>

      <Field label="Link do Edital">
        <input className={INP} style={INP_S}
          placeholder="https://..."
          value={concursoData.edital_url}
          onChange={e => sc('edital_url', e.target.value)} />
      </Field>

       <Field label="Observações">
        <textarea rows={3}
          className={INP + ' resize-none'}
          style={INP_S}
          value={concursoData.observacoes}
          onChange={e => sc('observacoes', e.target.value)} />
      </Field>

      {/* ── IMPORTAR DISCIPLINAS (HIERÁRQUICO) ── */}
      <div className="rounded-xl p-4" style={{ background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.15)' }}>
        <p className="text-xs font-bold text-text-main mb-3 flex items-center gap-2">
          📥 Importar Conteúdo Programático <span className="text-text-dim font-normal">(com hierarquia)</span>
        </p>

        {!importPreview ? (
          <>
            <div className="rounded-xl p-3 text-xs mb-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <p className="font-bold mb-2 text-text-muted">Formato — use indentação para hierarquia:</p>
              <pre className="text-text-dim" style={{ lineHeight: 1.8 }}>
{`Direito Administrativo
  Licitações
    Dispensa e Inexigibilidade
    Fases do Processo
  Atos Administrativos

Direito Constitucional
  Direitos Fundamentais
    Remédios Constitucionais`}
              </pre>
              <p className="mt-2 text-text-dim">
                Sem recuo = <strong className="text-text-muted">matéria</strong>
                {' | '}1 nível = <strong className="text-text-muted">tópico</strong>
                {' | '}2 níveis = <strong className="text-text-muted">aula</strong>
              </p>
            </div>

            <textarea rows={6}
              className={INP + ' resize-none font-mono'}
              style={{ ...INP_S, lineHeight: 1.7 }}
              placeholder="Direito Administrativo&#10;  Licitações&#10;    Dispensa e Inexigibilidade&#10;  Atos Administrativos&#10;&#10;Direito Constitucional&#10;  Direitos Fundamentais"
              value={importText}
              onChange={e => setImportText(e.target.value)} />
            <button onClick={handlePreview}
              disabled={!importText.trim()}
              className="mt-2 px-4 py-2 rounded-lg text-xs font-bold text-white hover:opacity-90 disabled:opacity-30"
              style={{ background: '#8B5CF6' }}>
              Pré-visualizar →
            </button>
          </>
        ) : (
          <>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-bold text-text-muted">
                {importPreview.length} matéria(s) detectada(s)
              </p>
              <button onClick={() => setImportPreview(null)} className="text-xs font-bold" style={{ color: '#8B5CF6' }}>
                ← Editar
              </button>
            </div>

            <div className="max-h-48 overflow-y-auto space-y-2 mb-3">
              {importPreview.map((subj, si) => (
                <div key={si} className="rounded-xl border overflow-hidden" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                  <div className="flex items-center gap-2 px-3 py-2" style={{ background: 'rgba(139,92,246,0.08)' }}>
                    <span className="text-xs font-black" style={{ color: '#8B5CF6' }}>📚</span>
                    <span className="text-sm font-bold text-text-main">{subj.name}</span>
                    <span className="text-[10px] ml-auto text-text-dim">
                      {subj.topics.length} tópico{subj.topics.length !== 1 ? 's' : ''} · {subj.topics.reduce((a, t) => a + t.subtopics.length, 0)} aula(s)
                    </span>
                  </div>
                  {subj.topics.map((t, ti) => (
                    <div key={ti}>
                      <div className="flex items-center gap-2 px-4 py-1.5 border-t" style={{ borderColor: 'rgba(255,255,255,0.04)', background: 'rgba(255,255,255,0.02)' }}>
                        <span className="text-[10px] text-text-dim">├</span>
                        <span className="text-xs font-medium text-text-main">{t.name}</span>
                        {t.subtopics.length > 0 && (
                          <span className="text-[9px] ml-auto text-text-dim">{t.subtopics.length} aula(s)</span>
                        )}
                      </div>
                      {t.subtopics.map((st, sti) => (
                        <div key={sti} className="flex items-center gap-2 px-6 py-1 border-t" style={{ borderColor: 'rgba(255,255,255,0.03)' }}>
                          <span className="text-[10px] text-text-dim">└</span>
                          <span className="text-[11px] text-text-dim">{st.name}</span>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              ))}
            </div>

            <button onClick={handleConfirmImport}
              className="w-full py-2.5 rounded-lg text-sm font-bold text-white hover:opacity-90"
              style={{ background: '#10B981' }}>
              ✓ Criar matérias com tópicos e aulas
            </button>
          </>
        )}

        {concursos?.length > 0 && (
          <div className="mt-3">
            <p className="text-[10px] font-bold text-text-dim uppercase tracking-wider mb-2">Ou importar de outro concurso:</p>
            <div className="flex flex-wrap gap-2">
              {concursos.filter(c => c.disciplinas?.length > 0).slice(0, 4).map(c => (
                <button key={c.id} onClick={() => handleImportFromConcurso(c)}
                  className="px-3 py-1.5 rounded-lg text-[11px] font-bold border hover:bg-white/5"
                  style={{ borderColor: 'rgba(139,92,246,0.2)', color: 'var(--text-main)' }}>
                  📋 {c.nome} <span className="text-text-dim">({c.disciplinas.length})</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {disciplinas.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {disciplinas.map(d => (
              <span key={d.id} className="px-2 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1"
                style={{ background: 'rgba(139,92,246,0.12)', color: '#A78BFA' }}>
                {d.name}
                <button onClick={() => setDisciplinas(p => p.filter(x => x.id !== d.id))}
                  className="text-white/40 hover:text-red-400 ml-0.5">×</button>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   STEP 1 — ESTRATÉGIA (EDITAL)
   ═══════════════════════════════════════════════════════════════════════════════ */

function StepEstrategia({
  disciplinas, addDisciplina, removeDisciplina,
  updateDisciplina, stats, metaCiclos,
}) {
  const th = 'p-4 border-b font-bold text-xs uppercase tracking-wider';
  const td = 'p-3 text-center';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-black text-text-main">
             📊 Estratégia do Edital
          </h2>
          <p className="text-xs text-text-dim mt-1">
             Mapeie as disciplinas, questões e pesos do edital.
          </p>
        </div>
        <button onClick={addDisciplina}
          className="text-xs px-3 py-1.5 rounded-lg font-bold text-white hover:opacity-90"
          style={{ background: 'var(--primary)' }}>
          + Disciplina
        </button>
      </div>

      <div className="rounded-xl border overflow-hidden" style={BD}>
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead style={BG2}>
            <tr className="text-text-muted font-bold text-xs uppercase tracking-wider">
              <th className={th} style={BD}>Disciplina</th>
               <th className={th} style={BD}>Questões</th>
              <th className={th} style={BD}>Peso</th>
               <th className={th} style={BD}>N × P</th>
              <th className={th} style={BD}>% Edital</th>
              <th className={th} style={BD}>Ciclos ({metaCiclos})</th>
              <th className={th} style={BD}></th>
            </tr>
          </thead>
          <tbody className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
            {!stats.subjects.length && (
              <tr>
                <td colSpan="7" className="p-8 text-center text-text-dim text-xs">
                   Adicione disciplinas ao edital para calcular sua estratégia.
                </td>
              </tr>
            )}
            {stats.subjects.map(sub => (
              <tr key={sub.id} className="hover:bg-white/[0.03] transition-colors">
                <td className="p-3">
                  <input type="text" value={sub.name}
                    onChange={e => updateDisciplina(sub.id, 'name', e.target.value)}
                    className="w-full bg-transparent outline-none border-b border-dashed text-sm font-medium"
                    style={{ borderColor: 'rgba(255,255,255,0.15)', color: 'var(--text-main)' }} />
                </td>
                <td className={td}>
                  <input type="number" value={sub.questions}
                    onChange={e => updateDisciplina(sub.id, 'questions', e.target.value)}
                    className="w-14 bg-transparent text-center outline-none border-b border-dashed"
                    style={{ borderColor: 'rgba(255,255,255,0.15)' }} />
                </td>
                <td className={td}>
                  <input type="number" step="0.5" value={sub.weight}
                    onChange={e => updateDisciplina(sub.id, 'weight', e.target.value)}
                    className="w-14 bg-transparent text-center outline-none border-b border-dashed font-bold"
                    style={{ borderColor: 'rgba(255,255,255,0.15)', color: '#F59E0B' }} />
                </td>
                <td className={td + ' font-black text-text-main'}>
                  {sub.points}
                </td>
                <td className={td}>
                  <div className="flex items-center gap-2 justify-center">
                    <span className="w-12 text-right text-xs font-bold">
                      {sub.percent}%
                    </span>
                    <div className="w-14 h-1.5 rounded-full overflow-hidden"
                      style={{ background: 'rgba(255,255,255,0.06)' }}>
                      <div className="h-full rounded-full"
                        style={{ width: sub.percent + '%', background: 'var(--primary)' }} />
                    </div>
                  </div>
                </td>
                <td className={td + ' font-black'} style={{ color: 'var(--primary)' }}>
                  {sub.cycleBlocks}
                </td>
                <td className={td}>
                  <button onClick={() => removeDisciplina(sub.id)}
                    className="text-red-500 hover:text-red-400 font-bold px-2">
                     ✕
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {stats.subjects.length > 0 && (
        <div className="flex gap-4 text-xs text-text-dim">
           <span>Total: <strong className="text-text-main">{stats.totalQuestions}</strong> questões</span>
           <span>Pontos: <strong className="text-text-main">{stats.totalPoints}</strong> (N×P)</span>
          <span>Disciplinas: <strong className="text-text-main">{stats.subjects.length}</strong></span>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   STEP 2 — VINCULAR MATÉRIAS
   ═══════════════════════════════════════════════════════════════════════════════ */

function StepVincular({
  disciplinas, subjects, stats, onLink,
  onAutoLink, onCreateSubjects, addSubjectToStore,
}) {
  const linkedCount = stats.subjects.filter(
    s => s.subjectId && subjects.some(sub => sub.id === s.subjectId)
  ).length;
  const possibleMatches = stats.subjects.filter(
    s => !s.subjectId && subjects.some(sub =>
      sub.name.toLowerCase().includes(s.name.toLowerCase()) ||
      s.name.toLowerCase().includes(sub.name.toLowerCase())
    )
  ).length;
  const unlinked = stats.subjects.filter(s => !s.subjectId);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-black text-text-main">
             🔗 Vincular Matérias
          </h2>
          <p className="text-xs text-text-dim mt-1">
             Conecte as disciplinas do edital às suas matérias cadastradas.
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={onAutoLink}
            className="text-xs px-3 py-1.5 rounded-lg font-bold border hover:bg-white/5"
            style={{ borderColor: 'rgba(255,255,255,0.1)', color: '#10B981' }}>
             🔗 Vincular Todas
          </button>
          {unlinked.length > 0 && (
            <button onClick={onCreateSubjects}
              className="text-xs px-3 py-1.5 rounded-lg font-bold border hover:bg-white/5"
              style={{ borderColor: 'rgba(255,255,255,0.1)', color: '#F59E0B' }}>
               📥 Criar Matérias
            </button>
          )}
        </div>
      </div>

      <div className="flex gap-4 text-xs">
        <span>
           🟢 Vinculadas: <strong style={{ color: '#10B981' }}>{linkedCount}</strong>
        </span>
        {possibleMatches > 0 && (
          <span>
             🟡 Possível match: <strong style={{ color: '#F59E0B' }}>{possibleMatches}</strong>
          </span>
        )}
        <span>
           ⚪ Não vinculadas: <strong style={{ color: 'var(--text-dim)' }}>{unlinked.length}</strong>
        </span>
      </div>

      <div className="space-y-2">
        {stats.subjects.map(sub => {
          const linked = sub.subjectId && subjects.some(s => s.id === sub.subjectId);
          const matchFound = !linked && subjects.some(s =>
            s.name.toLowerCase().includes(sub.name.toLowerCase()) ||
            sub.name.toLowerCase().includes(s.name.toLowerCase())
          );

          return (
            <div key={sub.id}
              className="flex items-center gap-3 p-3 rounded-xl border"
              style={{
                background: 'rgba(255,255,255,0.03)',
                borderColor: 'rgba(255,255,255,0.06)',
              }}>
              <span className="text-sm shrink-0"
                 title={linked ? 'Vinculada' : matchFound ? 'Possível match' : 'Sem match'}>
                 {linked ? '🟢' : matchFound ? '🟡' : '⚪'}
              </span>

              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-text-main truncate">
                  {sub.name}
                </div>
                <div className="text-[10px] text-text-dim">
                  {sub.percent}% do edital
                </div>
              </div>

              <div className="relative">
                <select
                  value={sub.subjectId || ''}
                  onChange={e => {
                    if (e.target.value === '__create__') {
                      const newId = 'subj_wiz_' + Date.now() + '_' + sub.id;
                      addSubjectToStore({
                        id: newId, name: sub.name,
                        color: COLORS[stats.subjects.indexOf(sub) % COLORS.length],
                        weeklyGoalMinutes: 180,
                        editalWeight: Math.round(Number(sub.percent)),
                        priority: 'media', icon: '\uD83D\uDCD6',
                      });
                      onLink(sub.id, newId);
                    } else {
                      onLink(sub.id, e.target.value || null);
                    }
                  }}
                  className="px-2 py-1.5 rounded-lg text-xs border outline-none min-w-[180px]"
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    borderColor: 'rgba(255,255,255,0.1)',
                    color: 'var(--text-main)',
                  }}>
                   <option value="">— Vincular matéria —</option>
                  {subjects.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                  <option value="__create__">
                     + Criar matéria &quot;{sub.name}&quot;
                  </option>
                </select>
              </div>
            </div>
          );
        })}
      </div>

      {!stats.subjects.length && (
        <p className="text-center text-xs text-text-dim py-8">
          Adicione disciplinas na etapa anterior primeiro.
        </p>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   STEP 3 — CICLO
   ═══════════════════════════════════════════════════════════════════════════════ */

function StepCiclo({
  concursoData, stats, createdCycle, setCreatedCycle,
  showCycleBuilder, setShowCycleBuilder,
  handleAutoGenerate, createdConcursoId, cycles,
}) {
  const subjects = useStudyStore(s => s.subjects);
  const addCycle = useCycleStore(s => s.addCycle);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-black text-text-main">
           🔄 Criar Ciclo de Estudos
        </h2>
        <p className="text-xs text-text-dim mt-1">
          Gere um ciclo automaticamente ou crie manualmente.
        </p>
      </div>

      {!createdCycle && !showCycleBuilder && (
        <div className="grid grid-cols-2 gap-3">
          <button onClick={handleAutoGenerate}
            className="p-5 rounded-xl border text-center hover:bg-white/[0.03] transition-colors group"
            style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
             <div className="text-3xl mb-2">⚡</div>
            <div className="text-sm font-bold text-text-main group-hover:text-white transition-colors">
              Auto-gerar
            </div>
            <div className="text-[10px] text-text-dim mt-1">
              Distribui horas proporcionalmente pelos pesos do edital
            </div>
          </button>
          <button onClick={() => setShowCycleBuilder(true)}
            className="p-5 rounded-xl border text-center hover:bg-white/[0.03] transition-colors group"
            style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
             <div className="text-3xl mb-2">🛠</div>
            <div className="text-sm font-bold text-text-main group-hover:text-white transition-colors">
              Criar manualmente
            </div>
            <div className="text-[10px] text-text-dim mt-1">
               Configure cada matéria e suas horas individualmente
            </div>
          </button>
        </div>
      )}

      {showCycleBuilder && (
        <div className="rounded-xl border overflow-hidden" style={BD}>
          <CycleBuilder
            editCycle={null}
            onSave={cycleData => {
              addCycle({ ...cycleData, concursoId: createdConcursoId });
              const c = useCycleStore.getState().cycles.at(-1);
              setCreatedCycle(c);
              setShowCycleBuilder(false);
              toast.success('Ciclo criado!');
            }}
            onClose={() => setShowCycleBuilder(false)}
          />
        </div>
      )}

      {createdCycle && (
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-xl border"
            style={{
              background: 'rgba(16,185,129,0.08)',
              borderColor: 'rgba(16,185,129,0.2)',
            }}>
            <div className="flex items-center gap-2">
              <span className="text-lg">      ✅</span>
              <div>
                <div className="text-sm font-bold text-text-main">
                  {createdCycle.nome}
                </div>
                <div className="text-[10px] text-text-dim">
                  {createdCycle.items?.length || 0} disciplinas · {createdCycle.totalHoras || 0}h totais
                </div>
              </div>
            </div>
            <button onClick={() => setCreatedCycle(null)}
              className="text-xs px-3 py-1.5 rounded-lg font-bold border hover:bg-white/5"
              style={{ borderColor: 'rgba(255,255,255,0.1)', color: '#EF4444' }}>
              ✕ Remover
            </button>
          </div>

          <div className="space-y-1.5">
            {createdCycle.items?.map(item => {
              const pct = createdCycle.totalHoras > 0
                ? Math.round((item.horasPorRodada / createdCycle.totalHoras) * 100)
                : 0;
              return (
                <div key={item.id}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg"
                  style={{ background: 'rgba(255,255,255,0.03)' }}>
                  <div className="w-2 h-2 rounded-full shrink-0"
                    style={{ background: item.subjectColor }} />
                  <span className="flex-1 text-xs font-medium text-text-main truncate">
                    {item.subjectName}
                  </span>
                  <span className="text-[10px] font-bold" style={{ color: 'var(--primary)' }}>
                    {item.horasPorRodada}h
                  </span>
                  <span className="text-[10px] text-text-dim w-10 text-right">
                    {pct}%
                  </span>
                </div>
              );
            })}
          </div>

          <button onClick={() => { setCreatedCycle(null); }}
            className="w-full py-2 rounded-xl text-xs font-bold border hover:bg-white/5"
            style={{ borderColor: 'rgba(255,255,255,0.1)', color: 'var(--text-dim)' }}>
            Gerar novamente
          </button>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   STEP 4 — PRONTO!
   ═══════════════════════════════════════════════════════════════════════════════ */

function StepPronto({ concursoData, stats, createdCycle, handleFinish }) {
  return (
    <div className="space-y-6 text-center">
       <div className="text-5xl">🚀</div>
      <h2 className="text-2xl font-black text-text-main">
        Tudo pronto!
      </h2>
      <p className="text-sm text-text-dim">
        Seu concurso foi configurado com sucesso.
      </p>

      <div className="max-w-md mx-auto text-left space-y-3">
        <div className="p-4 rounded-xl border space-y-2"
          style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.08)' }}>
          <div className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-dim)' }}>
            Concurso
          </div>
          <div className="text-sm font-bold text-text-main">
            {concursoData.nome}
          </div>
          <div className="text-xs text-text-dim flex flex-wrap gap-2">
             {concursoData.cargo && <span>📋 {concursoData.cargo}</span>}
             {concursoData.banca && <span>🏛 {concursoData.banca}</span>}
             <span>{concursoData.tipoProva === 'redacao' ? '✍️ Redação' : concursoData.tipoProva === 'objetiva_redacao' ? '📝+✍️ Objetiva + Redação' : '📝 Objetiva'}</span>
             {concursoData.redacaoWeight > 0 && <span>🎨 Redação: {concursoData.redacaoWeight}%</span>}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="p-3 rounded-xl border text-center"
            style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.08)' }}>
            <div className="text-lg font-black text-text-main">
              {stats.subjects.length}
            </div>
            <div className="text-[10px] text-text-dim">Disciplinas</div>
          </div>
          <div className="p-3 rounded-xl border text-center"
            style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.08)' }}>
            <div className="text-lg font-black text-text-main">
              {stats.totalQuestions}
            </div>
            <div className="text-[10px] text-text-dim">Questões</div>
          </div>
          <div className="p-3 rounded-xl border text-center"
            style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.08)' }}>
            <div className="text-lg font-black text-text-main">
              {stats.totalPoints}
            </div>
            <div className="text-[10px] text-text-dim">Pontos</div>
          </div>
        </div>

        {createdCycle && (
          <div className="p-4 rounded-xl border"
            style={{
              background: 'rgba(59,130,246,0.08)',
              borderColor: 'rgba(59,130,246,0.2)',
            }}>
            <div className="text-xs font-bold uppercase tracking-wider mb-1"
              style={{ color: '#3B82F6' }}>
              Ciclo vinculado
            </div>
            <div className="text-sm font-bold text-text-main">
              {createdCycle.nome}
            </div>
            <div className="text-xs text-text-dim">
              {createdCycle.items?.length || 0} disciplinas · {createdCycle.totalHoras || 0}h
            </div>
          </div>
        )}

        {!createdCycle && (
          <div className="p-4 rounded-xl border border-dashed text-center"
            style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
            <div className="text-xs text-text-dim">
              Nenhum ciclo vinculado. Você pode criar um depois.
            </div>
          </div>
        )}
      </div>

      <button onClick={handleFinish}
        className="px-8 py-3 rounded-xl text-base font-bold text-white hover:opacity-90 shadow-lg"
        style={{ background: 'var(--primary)' }}>
        🚀 Começar a Estudar
      </button>
    </div>
  );
}
