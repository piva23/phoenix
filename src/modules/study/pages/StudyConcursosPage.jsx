import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { StudyLayout } from '../components/StudyLayout';
import { useConcursoStore } from '../../../stores/useConcursoStore';
import { useXPStore } from '../../../stores/useXPStore';
import { useUserStore } from '../../../stores/useUserStore';
import { usePersonaStore } from '../../../stores/usePersonaStore';
import { useCycleStore } from '../../../stores/useCycleStore';
import { useStudyStore } from '../../../stores/useStudyStore';
import { useSimuladoStore } from '../../../stores/useSimuladoStore';
import { XP_RULES } from '../../../shared/constants/xpRules';
import { formatDateBR, daysUntil } from '../../../shared/utils/time';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import toast from 'react-hot-toast';

const STATUS_CONFIG = {
  estudando: {
    label: 'Estudando',
    color: '#3B82F6',
    bg: 'rgba(59,130,246,0.12)',
  },
  inscrito: {
    label: 'Inscrito',
    color: '#F59E0B',
    bg: 'rgba(245,158,11,0.12)',
  },
  fez_prova: {
    label: 'Fez a Prova',
    color: '#8B5CF6',
    bg: 'rgba(139,92,246,0.12)',
  },
  aprovado: {
    label: 'APROVADO 🏆',
    color: '#10B981',
    bg: 'rgba(16,185,129,0.12)',
  },
  reprovado: {
    label: 'Reprovado',
    color: '#EF4444',
    bg: 'rgba(239,68,68,0.12)',
  },
  desistiu: {
    label: 'Desistiu',
    color: '#6B6A7A',
    bg: 'rgba(107,106,122,0.12)',
  },
};

// ==========================================
// SubjectLinkPicker — vincula uma linha do edital a uma matéria real,
// com busca e opção de criar na hora (mesmo espírito do seletor de matéria
// usado no modal de sessão e no CycleBuilder).
// ==========================================
function SubjectLinkPicker({ subjectId, subjects, onLink, onCreateAndLink }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const linked = subjects.find(s => s.id === subjectId);

  const filtered = subjects.filter(s =>
    s.name.toLowerCase().includes(search.trim().toLowerCase())
  );
  const exactMatch = subjects.some(
    s => s.name.toLowerCase() === search.trim().toLowerCase()
  );

  if (!open) {
    return linked ? (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-sm font-bold text-left w-full"
        style={{ background: `${linked.color}18`, color: linked.color }}
      >
        <div
          className="w-2 h-2 rounded-full shrink-0"
          style={{ background: linked.color }}
        />
        <span className="truncate flex-1">{linked.name}</span>
        <span className="text-[10px] opacity-60 shrink-0">✎</span>
      </button>
    ) : (
      <button
        onClick={() => setOpen(true)}
        className="px-2 py-1 rounded-lg text-[10px] font-bold border border-dashed w-full text-left"
        style={{ borderColor: 'var(--border)', color: 'var(--text-dim)' }}
      >
        🔗 Vincular matéria
      </button>
    );
  }

  return (
    <div className="relative">
      <div
        className="fixed inset-0 z-40"
        onClick={() => {
          setOpen(false);
          setSearch('');
        }}
      />
      <div
        className="absolute left-0 top-0 z-50 w-56 rounded-xl border overflow-hidden shadow-xl"
        style={{
          background: 'var(--bg-surface)',
          borderColor: 'var(--border-strong)',
        }}
      >
        <input
          autoFocus
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar ou criar matéria..."
          className="w-full px-3 py-2 text-xs outline-none border-b"
          style={{
            background: 'var(--bg-surface-2)',
            borderColor: 'var(--border)',
            color: 'var(--text-main)',
          }}
        />
        <div className="max-h-48 overflow-y-auto p-1">
          {filtered.map(s => (
            <button
              key={s.id}
              onClick={() => {
                onLink(s.id, s.name);
                setOpen(false);
                setSearch('');
              }}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-left hover:bg-white/5"
              style={{
                color: s.id === subjectId ? s.color : 'var(--text-main)',
              }}
            >
              <div
                className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{ background: s.color }}
              />
              <span className="truncate">{s.name}</span>
            </button>
          ))}
          {search.trim() && !exactMatch && (
            <button
              onClick={() => {
                onCreateAndLink(search.trim());
                setOpen(false);
                setSearch('');
              }}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-bold text-left hover:bg-white/5"
              style={{ color: 'var(--primary)' }}
            >
              + Criar matéria "{search.trim()}"
            </button>
          )}
          {filtered.length === 0 && !search.trim() && (
            <div
              className="text-[11px] italic p-2 text-center"
              style={{ color: 'var(--text-dim)' }}
            >
              Nenhuma matéria cadastrada ainda.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ==========================================
// MODAL: NOVO/EDITAR CONCURSO
// ==========================================
function ConcursoForm({ onClose, editData = null }) {
  const { addConcurso, updateConcurso } = useConcursoStore();
  const [form, setForm] = useState({
    nome: editData?.nome || '',
    cargo: editData?.cargo || '',
    orgao: editData?.orgao || '',
    banca: editData?.banca || '',
    edital_url: editData?.edital_url || '',
    vagas: editData?.vagas || '',
    salario: editData?.salario || '',
    dataInscricaoFim: editData?.dataInscricaoFim || '',
    dataProva: editData?.dataProva || '',
    status: editData?.status || 'estudando',
    observacoes: editData?.observacoes || '',
    metaCiclos: editData?.metaCiclos || 24, // Nova propriedade: Meta de blocos do ciclo
  });

  const sf = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const inpStyle = {
    background: 'var(--bg-surface-2)',
    border: '1px solid var(--border)',
    color: 'var(--text-main)',
  };
  const inp =
    'w-full px-3 py-2.5 rounded-xl text-sm outline-none transition-colors';

  const handleSave = () => {
    if (!form.nome.trim())
      return toast.error('O nome do concurso é obrigatório!');
    if (editData) updateConcurso(editData.id, form);
    else addConcurso({ ...form, disciplinas: [] }); // Inicializa com array vazio
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(12px)' }}
      onClick={onClose}
    >
      <motion.div
        className="w-full max-w-lg rounded-2xl overflow-hidden flex flex-col"
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-strong)',
          maxHeight: '90vh',
        }}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        onClick={e => e.stopPropagation()}
      >
        <div
          className="flex items-center justify-between p-5 border-b flex-shrink-0"
          style={{ borderColor: 'var(--border)' }}
        >
          <h2 className="font-bold text-text-main text-lg">
            {editData ? 'Editar Concurso' : 'Novo Concurso'}
          </h2>
          <button
            onClick={onClose}
            className="text-text-dim hover:text-text-main w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div>
            <label className="text-xs font-bold text-text-muted uppercase tracking-wider block mb-1.5">
              Nome do Concurso *
            </label>
            <input
              className={inp}
              style={inpStyle}
              placeholder="Ex: TJRS — Analista Judiciário"
              value={form.nome}
              onChange={e => sf('nome', e.target.value)}
              autoFocus
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-text-muted uppercase tracking-wider block mb-1.5">
                Cargo
              </label>
              <input
                className={inp}
                style={inpStyle}
                value={form.cargo}
                onChange={e => sf('cargo', e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-bold text-text-muted uppercase tracking-wider block mb-1.5">
                Órgão
              </label>
              <input
                className={inp}
                style={inpStyle}
                value={form.orgao}
                onChange={e => sf('orgao', e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-bold text-text-muted uppercase tracking-wider block mb-1.5">
                Banca
              </label>
              <input
                className={inp}
                style={inpStyle}
                value={form.banca}
                onChange={e => sf('banca', e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-bold text-text-muted uppercase tracking-wider block mb-1.5">
                Status
              </label>
              <select
                className={inp}
                style={inpStyle}
                value={form.status}
                onChange={e => sf('status', e.target.value)}
              >
                {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-text-muted uppercase tracking-wider block mb-1.5">
                Vagas
              </label>
              <input
                type="number"
                className={inp}
                style={inpStyle}
                value={form.vagas}
                onChange={e => sf('vagas', e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-bold text-text-muted uppercase tracking-wider block mb-1.5">
                Salário (R$)
              </label>
              <input
                type="number"
                className={inp}
                style={inpStyle}
                value={form.salario}
                onChange={e => sf('salario', e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-bold text-text-muted uppercase tracking-wider block mb-1.5">
                Inscrições até
              </label>
              <input
                type="date"
                className={inp}
                style={inpStyle}
                value={form.dataInscricaoFim}
                onChange={e => sf('dataInscricaoFim', e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-bold text-text-muted uppercase tracking-wider block mb-1.5">
                Data da Prova
              </label>
              <input
                type="date"
                className={inp}
                style={inpStyle}
                value={form.dataProva}
                onChange={e => sf('dataProva', e.target.value)}
              />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-bold text-text-muted uppercase tracking-wider block mb-1.5">
                Meta de Blocos no Ciclo (Ex: 24)
              </label>
              <input
                type="number"
                className={inp}
                style={inpStyle}
                value={form.metaCiclos}
                onChange={e => sf('metaCiclos', Number(e.target.value))}
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-text-muted uppercase tracking-wider block mb-1.5">
              Link do Edital
            </label>
            <input
              className={inp}
              style={inpStyle}
              placeholder="https://..."
              value={form.edital_url}
              onChange={e => sf('edital_url', e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs font-bold text-text-muted uppercase tracking-wider block mb-1.5">
              Observações
            </label>
            <textarea
              rows={3}
              className={`${inp} resize-none`}
              style={inpStyle}
              value={form.observacoes}
              onChange={e => sf('observacoes', e.target.value)}
            />
          </div>
        </div>

        <div
          className="flex gap-3 p-5 border-t flex-shrink-0"
          style={{ borderColor: 'var(--border)' }}
        >
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold text-text-muted border hover:bg-white/5"
            style={{ borderColor: 'var(--border)' }}
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white hover:opacity-90"
            style={{ background: 'var(--primary)' }}
          >
            {editData ? 'Salvar Alterações' : 'Cadastrar'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ==========================================
// MODAL: REGISTRAR PROVA/FASE
// ==========================================
function ProvaForm({ concursoId, onClose, editProva = null }) {
  const { addProva, updateProva } = useConcursoStore();
  const [form, setForm] = useState({
    fase: editProva?.fase || '',
    data: editProva?.data || '',
    totalQuestoes: editProva?.totalQuestoes || '',
    acertos: editProva?.acertos || '',
    nota: editProva?.nota || '',
    notaCorte: editProva?.notaCorte || '',
    passou: editProva?.passou ?? false,
    observacoes: editProva?.observacoes || '',
  });
  const sf = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const inpStyle = {
    background: 'var(--bg-surface-2)',
    border: '1px solid var(--border)',
    color: 'var(--text-main)',
  };
  const inp = 'w-full px-3 py-2.5 rounded-xl text-sm outline-none';

  const handleSave = () => {
    if (!form.fase.trim()) return;
    if (editProva) updateProva(concursoId, editProva.id, form);
    else addProva(concursoId, form);
    onClose();
  };
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(12px)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl overflow-hidden"
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-strong)',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div
          className="flex items-center justify-between p-5 border-b"
          style={{ borderColor: 'var(--border)' }}
        >
          <h3 className="font-bold text-text-main">
            {editProva ? 'Editar Prova' : 'Registrar Prova/Fase'}
          </h3>
          <button
            onClick={onClose}
            className="text-text-dim w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5"
          >
            ✕
          </button>
        </div>
        <div className="p-5 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-xs font-bold text-text-muted uppercase tracking-wider block mb-1.5">
                Fase *
              </label>
              <input
                className={inp}
                style={inpStyle}
                placeholder="Objetiva, Discursiva..."
                value={form.fase}
                onChange={e => sf('fase', e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-bold text-text-muted uppercase tracking-wider block mb-1.5">
                Data
              </label>
              <input
                type="date"
                className={inp}
                style={inpStyle}
                value={form.data}
                onChange={e => sf('data', e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-bold text-text-muted uppercase tracking-wider block mb-1.5">
                Questões Totais
              </label>
              <input
                type="number"
                className={inp}
                style={inpStyle}
                value={form.totalQuestoes}
                onChange={e => sf('totalQuestoes', e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-bold text-text-muted uppercase tracking-wider block mb-1.5">
                Seus Acertos
              </label>
              <input
                type="number"
                className={inp}
                style={inpStyle}
                value={form.acertos}
                onChange={e => sf('acertos', e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-bold text-text-muted uppercase tracking-wider block mb-1.5">
                Nota Final
              </label>
              <input
                type="number"
                step="0.1"
                className={inp}
                style={inpStyle}
                value={form.nota}
                onChange={e => sf('nota', e.target.value)}
              />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-bold text-text-muted uppercase tracking-wider block mb-1.5">
                Nota de Corte
              </label>
              <input
                type="number"
                step="0.1"
                className={inp}
                style={inpStyle}
                value={form.notaCorte}
                onChange={e => sf('notaCorte', e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2 col-span-2 pt-2 pb-1">
              <input
                type="checkbox"
                id="passou"
                checked={form.passou}
                onChange={e => sf('passou', e.target.checked)}
                className="w-5 h-5 rounded cursor-pointer accent-green-500"
              />
              <label
                htmlFor="passou"
                className="text-sm font-bold text-text-main cursor-pointer"
              >
                Fui Aprovado nesta fase
              </label>
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-text-muted uppercase tracking-wider block mb-1.5">
              Observações
            </label>
            <textarea
              rows={2}
              className={`${inp} resize-none`}
              style={inpStyle}
              value={form.observacoes}
              onChange={e => sf('observacoes', e.target.value)}
            />
          </div>
        </div>
        <div
          className="flex gap-3 p-5 border-t"
          style={{ borderColor: 'var(--border)' }}
        >
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold text-text-muted border hover:bg-white/5"
            style={{ borderColor: 'var(--border)' }}
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white hover:opacity-90"
            style={{ background: 'var(--primary)' }}
          >
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// VISTA: DETALHE DO CONCURSO (ESTRATÉGIA)
// ==========================================
function ConcursoDetailView({ concurso, onBack, onAprovado, onChangeStatus }) {
  const navigate = useNavigate();
  const { updateConcurso } = useConcursoStore();
  const { cycles, addCycle } = useCycleStore();
  const subjects = useStudyStore(s => s.subjects);
  const addSubjectToStore = useStudyStore(s => s.addSubject);
  const [activeTab, setActiveTab] = useState('edital');
  const [provaModal, setProvaModal] = useState(null);
  const [statusPickerOpen, setStatusPickerOpen] = useState(false);
  const statusCfg = STATUS_CONFIG[concurso.status] || STATUS_CONFIG.estudando;

  // simulados reais (módulo Simulados) já vinculados a este concurso —
  // useSimuladoStore.getByConcurso já existe, só faltava consumir aqui
  const getByConcurso = useSimuladoStore(s => s.getByConcurso);
  const getEvolutionTimeline = useSimuladoStore(s => s.getEvolutionTimeline);
  const realSimulados = useMemo(
    () => getByConcurso(concurso.id),
    [getByConcurso, concurso.id, concurso]
  );
  const evolution = useMemo(
    () => getEvolutionTimeline(concurso.id),
    [getEvolutionTimeline, concurso.id, concurso]
  );

  // Garante que existe o array de disciplinas
  const disciplinas = concurso.disciplinas || [];
  const metaCiclos = concurso.metaCiclos || 24;

  // Lógica de Atualização Rápida no Array
  const updateSubject = (id, field, value) => {
    const updated = disciplinas.map(d =>
      d.id === id ? { ...d, [field]: Number(value) || value } : d
    );
    updateConcurso(concurso.id, { disciplinas: updated });
  };

  const addSubject = () => {
    const newSub = {
      id: Date.now().toString(),
      name: 'Nova Disciplina',
      questions: 10,
      min: 5,
      weight: 1,
      difficulty: 'Médio',
      correct: 0,
      wrong: 0,
    };
    updateConcurso(concurso.id, { disciplinas: [...disciplinas, newSub] });
  };

  const removeSubject = id => {
    if (window.confirm('Remover disciplina?')) {
      updateConcurso(concurso.id, {
        disciplinas: disciplinas.filter(d => d.id !== id),
      });
    }
  };

  // Cálculos Automáticos N x P e Ciclos
  const stats = useMemo(() => {
    let totalQuestions = 0;
    let totalPoints = 0;
    let totalCorrect = 0;
    let totalAnswered = 0;

    const proc = disciplinas.map(sub => {
      const points = sub.questions * sub.weight;
      totalQuestions += sub.questions;
      totalPoints += points;

      const answered = (sub.correct || 0) + (sub.wrong || 0);
      totalCorrect += sub.correct || 0;
      totalAnswered += answered;

      return {
        ...sub,
        points,
        answered,
        accuracy:
          answered > 0 ? (((sub.correct || 0) / answered) * 100).toFixed(1) : 0,
      };
    });

    const finalSubjects = proc.map(sub => {
      const percent = totalPoints > 0 ? (sub.points / totalPoints) * 100 : 0;
      const cycleBlocks = totalPoints > 0 ? (percent / 100) * metaCiclos : 0;
      return {
        ...sub,
        percent: percent.toFixed(1),
        cycleBlocks: cycleBlocks.toFixed(1),
      };
    });

    const globalAcc =
      totalAnswered > 0 ? ((totalCorrect / totalAnswered) * 100).toFixed(1) : 0;
    return {
      subjects: finalSubjects,
      totalQuestions,
      totalPoints,
      totalCorrect,
      totalAnswered,
      globalAccuracy: globalAcc,
    };
  }, [disciplinas, metaCiclos]);

  // Importa as disciplinas do edital estratégico para um ciclo de estudos real
  // (useCycleStore) — converte % do edital em horas por rodada, tentando casar
  // pelo nome com matérias já cadastradas no useStudyStore. Se não achar,
  // cria a matéria na hora (igual o fluxo do CycleBuilder/ImportEditalModal),
  // pra nunca sobrar item com subjectId: null.
  function handleImportToCycle() {
    if (stats.subjects.length === 0) {
      toast.error('Adicione disciplinas ao edital antes de importar.');
      return;
    }
    const dailyGoal = 240; // 4h/dia como base — usuário pode ajustar depois na aba Ciclo
    const totalWeight =
      stats.subjects.reduce((a, s) => a + Number(s.percent), 0) || 100;

    const colors = [
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
    ];

    const items = stats.subjects.map((sub, idx) => {
      let matched = sub.subjectId
        ? subjects.find(s => s.id === sub.subjectId)
        : null;

      if (!matched) {
        matched = subjects.find(
          s =>
            s.name.toLowerCase().includes(sub.name.toLowerCase()) ||
            sub.name.toLowerCase().includes(s.name.toLowerCase())
        );
      }

      // Não achou a matéria → cria agora no useStudyStore pra não deixar
      // o item do ciclo órfão (sem subjectId, sem tracking de sessão).
      if (!matched) {
        addSubjectToStore({
          id: `subj_conc_${Date.now()}_${idx}_${Math.random().toString(36).slice(2, 8)}`,
          name: sub.name,
          color: colors[idx % colors.length],
          weeklyGoalMinutes: 180,
          editalWeight: Math.round(Number(sub.percent)),
          priority: 'media',
          icon: '📖',
        });
        matched = useStudyStore
          .getState()
          .subjects.find(s => s.name.toLowerCase() === sub.name.toLowerCase());
      }

      const weightPct = Number(sub.percent);
      const horasDia = (dailyGoal / 60) * (weightPct / totalWeight);
      const horasPorRodada = Math.max(Math.round(horasDia * 7 * 10) / 10, 0.5);
      return {
        id: `ci_${Date.now()}_${idx}`,
        subjectId: matched?.id || null,
        subjectName: sub.name,
        subjectColor: matched?.color || colors[idx % colors.length],
        weightPct: Math.round(weightPct),
        horasPorRodada,
        minutosFeitos: 0,
        completedThisRound: false,
        ordem: idx,
      };
    });

    addCycle({
      nome: `Ciclo — ${concurso.nome}`,
      concursoId: concurso.id,
      totalHoras:
        Math.round(items.reduce((a, i) => a + i.horasPorRodada, 0)) || 24,
      items,
    });

    // pega o ciclo recém-criado e já ativa ele
    const created = useCycleStore.getState().cycles.at(-1);
    if (created) useCycleStore.getState().setActiveCycle(created.id);

    toast.success(
      `Ciclo criado com ${items.length} disciplinas e ativado! Veja em Ciclo.`
    );
  }

  // Direção inversa: puxa as matérias de um ciclo (o vinculado a este
  // concurso, ou o ativo) pro edital estratégico — útil quando o ciclo já
  // existia antes do edital ser preenchido, ou pra manter os dois em sincronia.
  function handleImportFromCycle() {
    const cycle =
      cycles.find(c => c.concursoId === concurso.id) ||
      cycles.find(c => c.id === useCycleStore.getState().activeCycleId);

    if (!cycle) {
      toast.error('Nenhum ciclo encontrado pra importar.');
      return;
    }

    const existingSubjectIds = new Set(
      disciplinas.map(d => d.subjectId).filter(Boolean)
    );
    const newRows = cycle.items
      .filter(i => i.subjectId && !existingSubjectIds.has(i.subjectId))
      .map((i, idx) => ({
        id: `${Date.now()}_${idx}`,
        name:
          i.subjectName ||
          subjects.find(s => s.id === i.subjectId)?.name ||
          'Matéria',
        subjectId: i.subjectId,
        questions: 10,
        min: 5,
        weight: 1,
        difficulty: 'Médio',
        correct: 0,
        wrong: 0,
      }));

    if (newRows.length === 0) {
      toast.error('Todas as matérias do ciclo já estão no edital.');
      return;
    }

    updateConcurso(concurso.id, { disciplinas: [...disciplinas, ...newRows] });
    toast.success(`${newRows.length} matéria(s) importada(s) do ciclo!`);
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      {/* HEADER DETALHE */}
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="w-10 h-10 flex items-center justify-center rounded-xl border hover:bg-white/5 transition-colors"
          style={{ borderColor: 'var(--border)' }}
        >
          ←
        </button>
        <div className="flex-1">
          <h2 className="text-xl font-black text-text-main flex items-center gap-2">
            {concurso.nome}
          </h2>
          <div className="text-xs text-text-dim flex gap-3 mt-1 items-center">
            {concurso.orgao && <span>🏛 {concurso.orgao}</span>}
            {concurso.cargo && <span>📋 {concurso.cargo}</span>}
          </div>
        </div>

        {/* status editável — resolve o "preso no aprovado" */}
        <div className="relative">
          <button
            onClick={() => setStatusPickerOpen(o => !o)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors"
            style={{
              color: statusCfg.color,
              background: statusCfg.bg,
              borderColor: `${statusCfg.color}55`,
            }}
          >
            {statusCfg.label}
            <span className="text-[9px] opacity-70">▾</span>
          </button>
          {statusPickerOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setStatusPickerOpen(false)}
              />
              <div
                className="absolute right-0 top-full mt-1.5 z-50 rounded-xl border overflow-hidden shadow-xl min-w-[160px]"
                style={{
                  background: 'var(--bg-surface)',
                  borderColor: 'var(--border)',
                }}
              >
                {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                  <button
                    key={k}
                    onClick={() => {
                      onChangeStatus(concurso, k);
                      setStatusPickerOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-left hover:bg-white/5 transition-colors"
                    style={{
                      color:
                        k === concurso.status ? v.color : 'var(--text-main)',
                    }}
                  >
                    <div
                      className="w-1.5 h-1.5 rounded-full shrink-0"
                      style={{ background: v.color }}
                    />
                    {v.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* DASHBOARD SUMÁRIO */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div
          className="p-4 rounded-2xl border"
          style={{
            background: 'var(--bg-surface)',
            borderColor: 'var(--border)',
          }}
        >
          <div className="text-xs font-bold text-text-muted uppercase tracking-wider mb-1">
            Questões Edital
          </div>
          <div className="text-2xl font-black text-text-main">
            {stats.totalQuestions}
          </div>
        </div>
        <div
          className="p-4 rounded-2xl border"
          style={{
            background: 'var(--bg-surface)',
            borderColor: 'var(--border)',
          }}
        >
          <div className="text-xs font-bold text-text-muted uppercase tracking-wider mb-1">
            Pontos Totais (NxP)
          </div>
          <div className="text-2xl font-black text-text-main">
            {stats.totalPoints}
          </div>
        </div>
        <div
          className="p-4 rounded-2xl border"
          style={{
            background: 'var(--bg-surface)',
            borderColor: 'var(--border)',
          }}
        >
          <div className="text-xs font-bold text-text-muted uppercase tracking-wider mb-1">
            Acerto Global
          </div>
          <div
            className="text-2xl font-black"
            style={{
              color:
                stats.globalAccuracy >= 70
                  ? '#10B981'
                  : stats.globalAccuracy >= 50
                    ? '#F59E0B'
                    : '#EF4444',
            }}
          >
            {stats.globalAccuracy}%
          </div>
        </div>
        {concurso.status === 'aprovado' ? (
          <div
            className="p-4 rounded-2xl flex items-center justify-center gap-2"
            style={{ background: '#10B98122', border: '1px solid #10B98155' }}
          >
            <span className="text-2xl">✅</span>
            <span className="font-bold" style={{ color: '#10B981' }}>
              Aprovado
            </span>
          </div>
        ) : (
          <div
            className="p-4 rounded-2xl flex items-center justify-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
            style={{ background: 'var(--primary)', color: 'white' }}
            onClick={() => onAprovado(concurso)}
          >
            <span className="text-2xl">🏆</span>
            <span className="font-bold">Fui Aprovado!</span>
          </div>
        )}
      </div>

      {/* TABS */}
      <div
        className="flex gap-2 p-1.5 rounded-xl w-fit border"
        style={{
          background: 'var(--bg-surface)',
          borderColor: 'var(--border)',
        }}
      >
        <button
          onClick={() => setActiveTab('edital')}
          className="px-5 py-2 rounded-lg text-sm font-bold transition-all"
          style={{
            background:
              activeTab === 'edital' ? 'var(--primary)' : 'transparent',
            color: activeTab === 'edital' ? 'white' : 'var(--text-muted)',
          }}
        >
          📊 Edital Estratégico
        </button>
        <button
          onClick={() => setActiveTab('simulados')}
          className="px-5 py-2 rounded-lg text-sm font-bold transition-all"
          style={{
            background:
              activeTab === 'simulados' ? 'var(--primary)' : 'transparent',
            color: activeTab === 'simulados' ? 'white' : 'var(--text-muted)',
          }}
        >
          🎯 Simulados & Metas
        </button>
        <button
          onClick={() => setActiveTab('fases')}
          className="px-5 py-2 rounded-lg text-sm font-bold transition-all"
          style={{
            background:
              activeTab === 'fases' ? 'var(--primary)' : 'transparent',
            color: activeTab === 'fases' ? 'white' : 'var(--text-muted)',
          }}
        >
          📝 Fases & Provas
        </button>
      </div>

      {/* CONTEÚDO TABS */}
      <div
        className="rounded-2xl border overflow-hidden"
        style={{
          background: 'var(--bg-surface)',
          borderColor: 'var(--border)',
        }}
      >
        {/* TAB 1: EDITAL ESTRATÉGICO */}
        {activeTab === 'edital' && (
          <div className="overflow-x-auto">
            <div
              className="p-4 flex items-center justify-between border-b"
              style={{
                borderColor: 'var(--border)',
                background: 'var(--bg-surface-2)',
              }}
            >
              <span className="font-bold text-sm text-text-main">
                Mapeamento e Pesos
              </span>
              <div className="flex gap-2">
                <button
                  onClick={handleImportFromCycle}
                  className="text-xs px-3 py-1.5 rounded-lg font-bold transition-all border hover:bg-white/5"
                  style={{
                    borderColor: 'var(--border)',
                    color: 'var(--text-main)',
                  }}
                  title="Puxa as matérias já cadastradas no Ciclo de Estudos pra dentro do edital"
                >
                  ⬇️ Importar do Ciclo
                </button>
                <button
                  onClick={handleImportToCycle}
                  className="text-xs px-3 py-1.5 rounded-lg font-bold transition-all border hover:bg-white/5"
                  style={{
                    borderColor: 'var(--border)',
                    color: 'var(--text-main)',
                  }}
                  title="Cria um ciclo de estudos real com base nestes pesos"
                >
                  🔄 Importar para o Ciclo
                </button>
                <button
                  onClick={addSubject}
                  className="text-xs px-3 py-1.5 rounded-lg font-bold transition-all text-white hover:opacity-90"
                  style={{ background: 'var(--primary)' }}
                >
                  + Nova Disciplina
                </button>
              </div>
            </div>
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-black/20 text-text-muted font-bold text-xs uppercase tracking-wider">
                <tr>
                  <th className="p-4 border-b border-[var(--border)]">
                    Disciplina
                  </th>
                  <th className="p-4 border-b border-[var(--border)] text-center">
                    Questões
                  </th>
                  <th className="p-4 border-b border-[var(--border)] text-center">
                    Peso
                  </th>
                  <th className="p-4 border-b border-[var(--border)] text-center">
                    N x P
                  </th>
                  <th className="p-4 border-b border-[var(--border)] text-center">
                    % Edital
                  </th>
                  <th className="p-4 border-b border-[var(--border)] text-center text-[var(--primary)]">
                    Ciclos ({metaCiclos})
                  </th>
                  <th className="p-4 border-b border-[var(--border)]"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {stats.subjects.length === 0 && (
                  <tr>
                    <td
                      colSpan="7"
                      className="p-8 text-center text-text-dim text-xs"
                    >
                      Adicione as disciplinas do edital para calcular sua
                      estratégia.
                    </td>
                  </tr>
                )}
                {stats.subjects.map(sub => (
                  <tr
                    key={sub.id}
                    className="hover:bg-white/5 transition-colors"
                  >
                    <td className="p-3">
                      <SubjectLinkPicker
                        subjectId={sub.subjectId}
                        subjects={subjects}
                        onLink={(id, name) => {
                          updateConcurso(concurso.id, {
                            disciplinas: disciplinas.map(d =>
                              d.id === sub.id
                                ? { ...d, subjectId: id, name }
                                : d
                            ),
                          });
                        }}
                        onCreateAndLink={name => {
                          const palette = [
                            '#8B5CF6',
                            '#3B82F6',
                            '#10B981',
                            '#F59E0B',
                            '#EF4444',
                            '#06B6D4',
                            '#EC4899',
                            '#F97316',
                          ];
                          const newId = `subj_conc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
                          addSubjectToStore({
                            id: newId,
                            name,
                            color: palette[disciplinas.length % palette.length],
                            weeklyGoalMinutes: 180,
                            priority: 'media',
                            icon: '📖',
                          });
                          updateConcurso(concurso.id, {
                            disciplinas: disciplinas.map(d =>
                              d.id === sub.id
                                ? { ...d, subjectId: newId, name }
                                : d
                            ),
                          });
                        }}
                      />
                    </td>
                    <td className="p-3 text-center">
                      <input
                        type="number"
                        value={sub.questions}
                        onChange={e =>
                          updateSubject(sub.id, 'questions', e.target.value)
                        }
                        className="w-12 bg-transparent text-center outline-none border-b border-dashed border-gray-600"
                      />
                    </td>
                    <td className="p-3 text-center">
                      <input
                        type="number"
                        step="0.5"
                        value={sub.weight}
                        onChange={e =>
                          updateSubject(sub.id, 'weight', e.target.value)
                        }
                        className="w-12 bg-transparent text-center outline-none border-b border-dashed border-gray-600 text-[#F59E0B] font-bold"
                      />
                    </td>
                    <td className="p-3 text-center font-black text-text-main">
                      {sub.points}
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex items-center gap-2 justify-center">
                        <div className="w-10 text-right text-xs font-bold">
                          {sub.percent}%
                        </div>
                        <div className="w-12 h-1.5 rounded-full bg-black/20 overflow-hidden">
                          <div
                            className="h-full bg-[var(--primary)] rounded-full"
                            style={{ width: `${sub.percent}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="p-3 text-center font-black text-[var(--primary)] bg-[var(--primary)]/5">
                      {sub.cycleBlocks}
                    </td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => removeSubject(sub.id)}
                        className="text-red-500 hover:text-red-400 font-bold px-2"
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 2: SIMULADOS */}
        {activeTab === 'simulados' && (
          <div className="space-y-4">
            {/* simulados reais do módulo Simulados, vinculados a este concurso */}
            <div
              className="rounded-2xl border overflow-hidden"
              style={{ borderColor: 'var(--border)' }}
            >
              <div
                className="p-4 flex items-center justify-between border-b"
                style={{
                  borderColor: 'var(--border)',
                  background: 'var(--bg-surface-2)',
                }}
              >
                <span className="font-bold text-sm text-text-main">
                  📝 Simulados feitos ({realSimulados.length})
                </span>
                <button
                  onClick={() => navigate('/study/simulados')}
                  className="text-xs px-3 py-1.5 rounded-lg font-bold border hover:bg-white/5 transition-all"
                  style={{
                    borderColor: 'var(--border)',
                    color: 'var(--text-main)',
                  }}
                >
                  + Novo simulado
                </button>
              </div>

              {realSimulados.length === 0 ? (
                <div className="p-6 text-center text-xs text-text-dim italic">
                  Nenhum simulado vinculado a este concurso ainda. Ao criar um
                  simulado em "Estudo → Simulados", selecione este concurso para
                  ele aparecer aqui.
                </div>
              ) : (
                <>
                  {evolution.length > 1 && (
                    <div className="px-4 pt-4" style={{ height: 160 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={evolution}
                          margin={{ top: 5, right: 10, left: -20, bottom: 0 }}
                        >
                          <CartesianGrid
                            strokeDasharray="3 3"
                            vertical={false}
                            stroke="var(--border)"
                            opacity={0.4}
                          />
                          <XAxis
                            dataKey="date"
                            tickFormatter={d =>
                              formatDateBR ? formatDateBR(d) : d
                            }
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: 'var(--text-dim)', fontSize: 10 }}
                          />
                          <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: 'var(--text-dim)', fontSize: 10 }}
                            domain={[0, 100]}
                          />
                          <Tooltip
                            contentStyle={{
                              background: 'var(--bg-surface)',
                              border: '1px solid var(--border)',
                              borderRadius: 8,
                              fontSize: 12,
                            }}
                            formatter={(v, n) => [
                              n === 'notaPonderada' ? `${v} pts` : `${v}%`,
                              n === 'notaPonderada' ? 'NxP' : 'Acerto',
                            ]}
                          />
                          <Line
                            type="monotone"
                            dataKey="notaPonderada"
                            stroke="var(--primary)"
                            strokeWidth={2.5}
                            dot={{ r: 3 }}
                          />
                          <Line
                            type="monotone"
                            dataKey="accuracy"
                            stroke="#10B981"
                            strokeWidth={2}
                            strokeDasharray="4 3"
                            dot={{ r: 2 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                  <div className="p-4 flex flex-wrap gap-2">
                    {evolution.map((e, i) => (
                      <div
                        key={i}
                        className="px-3 py-2 rounded-xl border text-xs"
                        style={{
                          borderColor: e.eliminado
                            ? '#EF444455'
                            : 'var(--border)',
                          background: e.eliminado
                            ? '#EF444412'
                            : 'var(--bg-surface-2)',
                        }}
                      >
                        <div className="font-bold text-text-main">{e.nome}</div>
                        <div className="text-text-dim">
                          {formatDateBR ? formatDateBR(e.date) : e.date}
                        </div>
                        <div
                          className="font-black mt-0.5"
                          style={{
                            color: e.eliminado
                              ? '#EF4444'
                              : e.accuracy >= 70
                                ? '#10B981'
                                : '#F59E0B',
                          }}
                        >
                          NxP {e.notaPonderada} · {e.accuracy ?? 0}%
                          {e.eliminado && ' · ELIMINADO'}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            <div
              className="overflow-x-auto rounded-2xl border"
              style={{ borderColor: 'var(--border)' }}
            >
              <div
                className="p-4 flex items-center justify-between border-b"
                style={{
                  borderColor: 'var(--border)',
                  background: 'var(--bg-surface-2)',
                }}
              >
                <span className="font-bold text-sm text-text-main">
                  Metas de Eliminação (edital)
                </span>
              </div>
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-black/20 text-text-muted font-bold text-xs uppercase tracking-wider">
                  <tr>
                    <th className="p-4 border-b border-[var(--border)]">
                      Disciplina
                    </th>
                    <th className="p-4 border-b border-[var(--border)] text-center">
                      Mín. Exigido
                    </th>
                    <th className="p-4 border-b border-[var(--border)] text-center text-green-500">
                      Corretas
                    </th>
                    <th className="p-4 border-b border-[var(--border)] text-center text-red-500">
                      Erradas
                    </th>
                    <th className="p-4 border-b border-[var(--border)] text-center">
                      Situação
                    </th>
                    <th className="p-4 border-b border-[var(--border)] text-center">
                      % Acerto
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {stats.subjects.length === 0 && (
                    <tr>
                      <td
                        colSpan="6"
                        className="p-8 text-center text-text-dim text-xs"
                      >
                        Configure o Edital primeiro.
                      </td>
                    </tr>
                  )}
                  {stats.subjects.map(sub => {
                    const passMin = sub.correct >= (sub.min || 0);
                    return (
                      <tr
                        key={sub.id}
                        className="hover:bg-white/5 transition-colors"
                      >
                        <td className="p-3 font-bold text-text-main">
                          {sub.name}
                        </td>
                        <td className="p-3 text-center">
                          <input
                            type="number"
                            value={sub.min}
                            onChange={e =>
                              updateSubject(sub.id, 'min', e.target.value)
                            }
                            className="w-12 bg-transparent text-text-muted text-center outline-none border-b border-dashed border-gray-600 font-bold"
                            title="Mínimo exigido no edital para não zerar"
                          />
                        </td>
                        <td className="p-3 text-center">
                          <input
                            type="number"
                            value={sub.correct}
                            onChange={e =>
                              updateSubject(sub.id, 'correct', e.target.value)
                            }
                            className="w-16 bg-green-500/10 text-green-500 text-center font-bold border border-green-500/30 rounded px-2 py-1 outline-none focus:border-green-500"
                          />
                        </td>
                        <td className="p-3 text-center">
                          <input
                            type="number"
                            value={sub.wrong}
                            onChange={e =>
                              updateSubject(sub.id, 'wrong', e.target.value)
                            }
                            className="w-16 bg-red-500/10 text-red-500 text-center font-bold border border-red-500/30 rounded px-2 py-1 outline-none focus:border-red-500"
                          />
                        </td>
                        <td className="p-3 text-center">
                          {sub.min > 0 ? (
                            passMin ? (
                              <span className="bg-green-500/20 text-green-500 px-2 py-1 rounded text-xs font-bold">
                                OK
                              </span>
                            ) : (
                              <span className="bg-red-500/20 text-red-500 px-2 py-1 rounded text-xs font-bold">
                                ELIMINADO
                              </span>
                            )
                          ) : (
                            <span className="text-text-dim text-xs">-</span>
                          )}
                        </td>
                        <td className="p-3 text-center">
                          <span
                            className="font-black text-lg"
                            style={{
                              color:
                                sub.accuracy >= 70
                                  ? '#10B981'
                                  : sub.accuracy >= 50
                                    ? '#F59E0B'
                                    : '#EF4444',
                            }}
                          >
                            {sub.accuracy}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: FASES (Original Aprimorado) */}
        {activeTab === 'fases' && (
          <div className="p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs text-text-dim">
                Histórico de provas prestadas neste concurso.
              </p>
              <button
                onClick={() => setProvaModal({ concursoId: concurso.id })}
                className="text-xs px-4 py-2 rounded-lg font-bold transition-all"
                style={{ background: 'var(--primary)', color: 'white' }}
              >
                + Registrar Prova
              </button>
            </div>
            {!concurso.provas || concurso.provas.length === 0 ? (
              <div
                className="text-center p-8 border border-dashed rounded-xl"
                style={{ borderColor: 'var(--border)' }}
              >
                <p className="text-xs text-text-dim">
                  Nenhuma prova registrada ainda.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {concurso.provas.map(p => {
                  const pct =
                    p.totalQuestoes > 0
                      ? Math.round((p.acertos / p.totalQuestoes) * 100)
                      : null;
                  return (
                    <div
                      key={p.id}
                      className="flex items-center gap-4 p-4 rounded-xl border"
                      style={{
                        background: 'var(--bg-surface-2)',
                        borderColor: 'var(--border)',
                      }}
                    >
                      <div
                        className="w-12 h-12 flex items-center justify-center rounded-full text-xl"
                        style={{
                          background: p.passou
                            ? 'rgba(16,185,129,0.2)'
                            : 'rgba(239,68,68,0.2)',
                        }}
                      >
                        {p.passou ? '🏆' : '❌'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-bold text-text-main">
                            {p.fase}
                          </span>
                          {p.data && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-black/20 text-text-dim">
                              {formatDateBR(p.data)}
                            </span>
                          )}
                        </div>
                        {pct !== null && (
                          <div className="text-xs text-text-dim font-medium">
                            {p.acertos}/{p.totalQuestoes} acertos{' '}
                            <strong style={{ color: 'var(--primary)' }}>
                              ({pct}%)
                            </strong>{' '}
                            {p.nota ? ` · Nota: ${p.nota}` : ''}
                            {p.notaCorte ? ` · Corte: ${p.notaCorte}` : ''}
                          </div>
                        )}
                        {p.observacoes && (
                          <p className="text-xs text-text-muted mt-1 italic">
                            "{p.observacoes}"
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
      {provaModal && (
        <ProvaForm
          concursoId={provaModal.concursoId}
          onClose={() => setProvaModal(null)}
        />
      )}
    </motion.div>
  );
}

// ==========================================
// PÁGINA PRINCIPAL
// ==========================================
export function StudyConcursosPage() {
  const { concursos, deleteConcurso, updateConcurso } = useConcursoStore();
  const { logXP } = useXPStore();
  const { addXP } = useUserStore();
  const activePersonaId = usePersonaStore(s => s.activePersonaId);

  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [selectedConcursoId, setSelectedConcursoId] = useState(null);

  const handleAprovado = c => {
    if (c.status === 'aprovado') return; // já aprovado — não credita XP de novo
    updateConcurso(c.id, {
      status: 'aprovado',
      resultado: { ...c.resultado, aprovado: true },
    });
    const xp = XP_RULES.CONCURSO_APROVADO.xp;
    logXP({
      action: 'CONCURSO_APROVADO',
      xp,
      moduleOrigin: 'study',
      personaId: activePersonaId,
      radarAxis: 'disciplina',
    });
    addXP(xp);
    toast.success(`🏆 APROVADO! +${xp} XP — Parabéns!`, {
      duration: 6000,
      icon: '🔥',
    });
  };

  // Editor de status simples, usado dentro do detalhe do concurso — não
  // credita XP (isso só acontece pelo botão "Fui Aprovado!" acima), é só
  // pra você poder corrigir/mudar o status a qualquer momento.
  const handleChangeStatus = (c, newStatus) => {
    if (newStatus === c.status) return;
    updateConcurso(c.id, {
      status: newStatus,
      resultado: {
        ...c.resultado,
        aprovado: newStatus === 'aprovado' ? true : c.resultado?.aprovado,
      },
    });
    toast.success(
      `Status atualizado para "${STATUS_CONFIG[newStatus]?.label}"`
    );
  };

  const selectedConcurso = useMemo(
    () => concursos.find(c => c.id === selectedConcursoId),
    [concursos, selectedConcursoId]
  );

  return (
    <StudyLayout>
      <AnimatePresence mode="wait">
        {/* MODO DETALHE / ESTRATÉGIA */}
        {selectedConcurso ? (
          <ConcursoDetailView
            key="detail"
            concurso={selectedConcurso}
            onBack={() => setSelectedConcursoId(null)}
            onAprovado={handleAprovado}
            onChangeStatus={handleChangeStatus}
          />
        ) : (
          /* MODO LISTA (Padrão) */
          <motion.div
            key="list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-bold text-text-main text-xl">
                  Gestão de Concursos
                </h2>
                <p className="text-xs text-text-dim mt-1">
                  Acompanhe editais, provas e seu desempenho estratégico.
                </p>
              </div>
              <button
                onClick={() => {
                  setEditTarget(null);
                  setFormOpen(true);
                }}
                className="px-5 py-2.5 rounded-xl text-sm font-bold text-white hover:opacity-90 transition-opacity shadow-lg"
                style={{
                  background: 'var(--primary)',
                  shadowColor: 'var(--primary)',
                }}
              >
                + Novo Concurso
              </button>
            </div>

            {concursos.length === 0 ? (
              <div
                className="rounded-2xl p-12 text-center border border-dashed"
                style={{
                  background: 'var(--bg-surface)',
                  borderColor: 'var(--border-strong)',
                }}
              >
                <div className="text-5xl mb-4 opacity-40">🏛️</div>
                <p className="font-bold text-text-main mb-2">
                  Nenhum concurso no radar
                </p>
                <p className="text-sm text-text-dim mb-6">
                  Mapeie editais abertos ou previstos para organizar sua
                  estratégia.
                </p>
                <button
                  onClick={() => setFormOpen(true)}
                  className="px-6 py-3 rounded-xl text-sm font-bold text-white transition-opacity"
                  style={{ background: 'var(--primary)' }}
                >
                  Cadastrar Primeiro Concurso
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {concursos.map(c => {
                  const st = STATUS_CONFIG[c.status] || STATUS_CONFIG.estudando;
                  const days = daysUntil(c.dataProva);
                  return (
                    <div
                      key={c.id}
                      className="rounded-2xl overflow-hidden flex flex-col transition-transform hover:-translate-y-1"
                      style={{
                        background: 'var(--bg-surface)',
                        border: `1px solid ${c.status === 'aprovado' ? 'rgba(16,185,129,0.4)' : 'var(--border)'}`,
                        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                      }}
                    >
                      <div className="p-5 flex-1">
                        <div className="flex justify-between items-start mb-3">
                          <span
                            className="text-xs px-2.5 py-1 rounded-md font-bold uppercase tracking-wider"
                            style={{ background: st.bg, color: st.color }}
                          >
                            {st.label}
                          </span>
                          <div className="flex gap-1">
                            {c.edital_url && (
                              <a
                                href={c.edital_url}
                                target="_blank"
                                rel="noreferrer"
                                className="w-7 h-7 flex items-center justify-center rounded-lg bg-black/10 text-text-dim hover:text-text-main transition-colors"
                                title="Ver edital"
                              >
                                📎
                              </a>
                            )}
                            <button
                              onClick={() => {
                                setEditTarget(c);
                                setFormOpen(true);
                              }}
                              className="w-7 h-7 flex items-center justify-center rounded-lg bg-black/10 text-text-dim hover:text-text-main transition-colors text-xs"
                            >
                              ✎
                            </button>
                            <button
                              onClick={() => {
                                if (
                                  window.confirm(`Excluir concurso ${c.nome}?`)
                                )
                                  deleteConcurso(c.id);
                              }}
                              className="w-7 h-7 flex items-center justify-center rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors text-xs"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                        <h3 className="font-black text-lg text-text-main mb-1 leading-tight">
                          {c.nome}
                        </h3>
                        <div className="text-xs font-medium text-text-muted flex flex-wrap gap-x-3 gap-y-1 mb-4">
                          {c.cargo && <span>{c.cargo}</span>}
                          {c.banca && <span>• {c.banca}</span>}
                          {c.vagas && <span>• {c.vagas} vagas</span>}
                        </div>

                        {c.dataProva && (
                          <div
                            className="flex items-center gap-2 text-xs font-bold px-3 py-2 rounded-lg border"
                            style={{
                              background:
                                days !== null && days <= 7
                                  ? 'rgba(239,68,68,0.1)'
                                  : 'var(--bg-surface-2)',
                              borderColor:
                                days !== null && days <= 7
                                  ? 'rgba(239,68,68,0.3)'
                                  : 'var(--border)',
                              color:
                                days !== null && days <= 7
                                  ? '#EF4444'
                                  : days !== null && days < 30
                                    ? '#F59E0B'
                                    : 'var(--text-main)',
                            }}
                          >
                            📅 Prova: {formatDateBR(c.dataProva)}{' '}
                            {days !== null && days > 0
                              ? `(${days} dias)`
                              : days === 0
                                ? '(HOJE!)'
                                : ''}
                          </div>
                        )}
                      </div>
                      <div
                        className="p-3 border-t flex gap-2"
                        style={{
                          borderColor: 'var(--border)',
                          background: 'var(--bg-surface-2)',
                        }}
                      >
                        <button
                          onClick={() => setSelectedConcursoId(c.id)}
                          className="flex-1 py-2 rounded-xl text-sm font-bold transition-colors hover:opacity-90"
                          style={{
                            background: 'var(--primary)22',
                            color: 'var(--primary)',
                          }}
                        >
                          🎯 Estratégia & Desempenho
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {formOpen && (
        <ConcursoForm
          editData={editTarget}
          onClose={() => {
            setFormOpen(false);
            setEditTarget(null);
          }}
        />
      )}
    </StudyLayout>
  );
}
