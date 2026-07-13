import { useState, useRef, useMemo } from 'react';
import { StudyLayout } from '../components/StudyLayout';
import { useQuestionsStore } from '../../../stores/useQuestionsStore';
import { useStudyStore } from '../../../stores/useStudyStore';
import { useXPStore } from '../../../stores/useXPStore';
import { useUserStore } from '../../../stores/useUserStore';
import { usePersonaStore } from '../../../stores/usePersonaStore';
import { XP_RULES } from '../../../shared/constants/xpRules';
import toast from 'react-hot-toast';

// ── helpers ───────────────────────────────────────────────────────────────────

function today() {
  return new Date().toISOString().slice(0, 10);
}

function fmtTimer(sec) {
  const m = String(Math.floor(sec / 60)).padStart(2, '0');
  const s = String(sec % 60).padStart(2, '0');
  return `${m}:${s}`;
}

const DIFF_CONFIG = {
  facil: { label: 'Fácil', color: '#10B981' },
  medio: { label: 'Médio', color: '#F59E0B' },
  dificil: { label: 'Difícil', color: '#EF4444' },
};

// ── ui atoms ──────────────────────────────────────────────────────────────────

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

// ── ImportModal ───────────────────────────────────────────────────────────────

function ImportModal({ onClose }) {
  const importQuestions = useQuestionsStore(s => s.importQuestions);
  const subjects = useStudyStore(s => s.subjects);
  const [raw, setRaw] = useState('');
  const [defaultSubject, setDefaultSubject] = useState('');
  const fileRef = useRef(null);

  function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setRaw(ev.target.result);
    reader.readAsText(file);
  }

  function handleImport() {
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      toast.error('JSON inválido. Verifique a sintaxe.');
      return;
    }
    const subj = subjects.find(s => s.id === defaultSubject);
    const result = importQuestions(parsed, {
      subjectId: defaultSubject || null,
      materia: subj?.name || '',
    });
    if (result.success) {
      toast.success(`${result.count} questões importadas!`);
      if (result.errors.length > 0)
        toast(`${result.errors.length} itens ignorados por erro de formato.`, {
          icon: '⚠️',
        });
      onClose();
    } else {
      toast.error('Nenhuma questão pôde ser importada. Verifique o formato.');
    }
  }

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,.65)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl"
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
            Importar questões (JSON)
          </span>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full flex items-center justify-center text-lg hover:bg-white/10"
            style={{ color: 'var(--text-muted)' }}
          >
            ×
          </button>
        </div>

        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          <div
            className="rounded-xl p-3 text-left"
            style={{
              background: 'var(--bg-surface-2)',
              border: '1px solid var(--border)',
            }}
          >
            <p
              className="text-[10px] font-bold uppercase tracking-wider mb-2"
              style={{ color: 'var(--text-dim)' }}
            >
              Formato esperado
            </p>
            <pre
              className="text-[10px] overflow-x-auto"
              style={{ color: 'var(--text-dim)', lineHeight: 1.6 }}
            >
              {`[{
  "enunciado": "...",
  "alternativas": ["A) ...", "B) ..."],
  "gabarito": "B",
  "materia": "Direito Adm.",
  "topico": "Licitações",
  "dificuldade": "medio"
}]`}
            </pre>
          </div>

          {subjects.length > 0 && (
            <div>
              <Label>Vincular a uma matéria (opcional, aplica a todas)</Label>
              <select
                value={defaultSubject}
                onChange={e => setDefaultSubject(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl text-sm border outline-none"
                style={{
                  background: 'var(--bg-surface-2)',
                  borderColor: 'var(--border)',
                  color: 'var(--text-main)',
                }}
              >
                <option value="">Nenhuma — usar campo "materia" do JSON</option>
                {subjects.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <Label>Cole o JSON ou envie um arquivo</Label>
            <textarea
              rows={8}
              value={raw}
              onChange={e => setRaw(e.target.value)}
              placeholder='[{"enunciado": "...", "alternativas": [...], "gabarito": "B"}]'
              className="w-full px-3 py-2.5 rounded-xl text-xs border outline-none resize-none"
              style={{
                background: 'var(--bg-surface-2)',
                borderColor: 'var(--border)',
                color: 'var(--text-main)',
                fontFamily: 'var(--font-mono)',
                lineHeight: 1.6,
              }}
            />
            <button
              onClick={() => fileRef.current?.click()}
              className="mt-2 text-xs font-bold px-3 py-1.5 rounded-lg border"
              style={{ borderColor: 'var(--border)', color: 'var(--text-dim)' }}
            >
              📁 Enviar arquivo .json
            </button>
            <input
              ref={fileRef}
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleFile}
            />
          </div>

          <button
            onClick={handleImport}
            disabled={!raw.trim()}
            className="w-full py-3 rounded-xl font-bold text-sm text-white disabled:opacity-40"
            style={{ background: 'var(--primary)' }}
          >
            Importar questões
          </button>
        </div>
      </div>
    </div>
  );
}

// ── DeckModal — criar caderno a partir da seleção ─────────────────────────────

function DeckModal({ questionIds, onClose }) {
  const createDeck = useQuestionsStore(s => s.createDeck);
  const [name, setName] = useState('');

  function save() {
    if (!name.trim()) return;
    createDeck(name.trim(), questionIds);
    toast.success(
      `Caderno "${name}" criado com ${questionIds.length} questões!`
    );
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,.65)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl p-5 space-y-3"
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-strong)',
        }}
        onClick={e => e.stopPropagation()}
      >
        <Label>Nome do caderno</Label>
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Ex: Licitações — Consolidação"
          autoFocus
          className="w-full px-3 py-2.5 rounded-xl text-sm border outline-none"
          style={{
            background: 'var(--bg-surface-2)',
            borderColor: 'var(--border)',
            color: 'var(--text-main)',
          }}
        />
        <div className="text-xs" style={{ color: 'var(--text-dim)' }}>
          {questionIds.length} questões selecionadas
        </div>
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold border"
            style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
          >
            Cancelar
          </button>
          <button
            onClick={save}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white"
            style={{ background: 'var(--primary)' }}
          >
            Criar
          </button>
        </div>
      </div>
    </div>
  );
}

// ── PracticeMode — resolução híbrida leve ─────────────────────────────────────

function PracticeMode({ questions, onExit }) {
  const answerQuestion = useQuestionsStore(s => s.answerQuestion);
  const updateSubtopic = useStudyStore(s => s.updateSubtopic);
  const subjects = useStudyStore(s => s.subjects);
  const { logXP } = useXPStore();
  const { addXP } = useUserStore();
  const activePersonaId = usePersonaStore(s => s.activePersonaId);
  const addPersonaXP = usePersonaStore(s => s.addPersonaXP);

  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const [results, setResults] = useState([]); // { questionId, correct }
  const [timerOn, setTimerOn] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [registerGap, setRegisterGap] = useState(true);

  const q = questions[idx];
  const subject = subjects.find(s => s.id === q?.subjectId);

  // cronômetro opcional
  useState(() => {
    if (!timerOn) return;
    const id = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(id);
  }, [timerOn]);

  function pick(alt) {
    if (revealed) return;
    setSelected(alt);
  }

  function confirm() {
    if (!selected) return;
    const { correct } = answerQuestion(q.id, selected) || {};
    setResults(r => [...r, { questionId: q.id, correct, question: q }]);
    setRevealed(true);

    // registra gap automaticamente no subtópico vinculado, se errou
    if (!correct && registerGap && q.subjectId && q.subtopicId) {
      const subj = subjects.find(s => s.id === q.subjectId);
      let subtopic = null,
        topicId = null;
      subj?.topics?.forEach(t =>
        t.subtopics?.forEach(st => {
          if (st.id === q.subtopicId) {
            subtopic = st;
            topicId = t.id;
          }
        })
      );
      if (subtopic) {
        const gapText = `Errei: "${q.enunciado.slice(0, 80)}${q.enunciado.length > 80 ? '...' : ''}" — marquei ${selected}, certo era ${q.gabarito}.`;
        updateSubtopic(q.subjectId, topicId, q.subtopicId, {
          gaps: [
            ...(subtopic.gaps || []),
            {
              id: `gap_${Date.now()}`,
              text: gapText,
              date: today(),
              resolved: false,
            },
          ],
        });
      }
    }
  }

  function next() {
    if (idx < questions.length - 1) {
      setIdx(i => i + 1);
      setSelected(null);
      setRevealed(false);
    } else {
      finish();
    }
  }

  function finish() {
    const correct = results.filter(r => r.correct).length;
    const xpEarned = correct * (XP_RULES.QUESTION_CORRECT?.xp || 2);
    if (xpEarned > 0) {
      logXP({
        action: 'QUESTIONS_PRACTICE',
        xp: xpEarned,
        moduleOrigin: 'study',
        personaId: activePersonaId,
        radarAxis: 'conhecimento',
      });
      addXP(xpEarned);
      if (activePersonaId) addPersonaXP(activePersonaId, xpEarned);
    }
    onExit({ total: results.length, correct, xpEarned });
  }

  if (!q) return null;

  const accent = subject?.color || 'var(--primary)';
  const progressPct = Math.round((idx / questions.length) * 100);

  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      {/* header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => onExit(null)}
          className="text-xs font-bold px-3 py-1.5 rounded-lg border"
          style={{ borderColor: 'var(--border)', color: 'var(--text-dim)' }}
        >
          ← Sair
        </button>
        <div className="flex items-center gap-3">
          {timerOn && (
            <span
              className="text-xs font-mono font-bold"
              style={{ color: 'var(--text-dim)' }}
            >
              ⏱ {fmtTimer(elapsed)}
            </span>
          )}
          <button
            onClick={() => setTimerOn(t => !t)}
            className="text-[10px] font-bold px-2 py-1 rounded-lg border"
            style={{
              borderColor: 'var(--border)',
              color: timerOn ? accent : 'var(--text-dim)',
            }}
          >
            {timerOn ? '⏸ Parar timer' : '⏱ Ativar timer'}
          </button>
          <span className="text-xs" style={{ color: 'var(--text-dim)' }}>
            {idx + 1} / {questions.length}
          </span>
        </div>
      </div>

      {/* progresso */}
      <div
        className="h-1.5 rounded-full overflow-hidden"
        style={{ background: 'var(--bg-surface-2)' }}
      >
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${progressPct}%`, background: accent }}
        />
      </div>

      {/* card da questão */}
      <div
        className="p-5 rounded-2xl border"
        style={{
          background: 'var(--bg-surface)',
          borderColor: 'var(--border)',
        }}
      >
        {/* meta */}
        <div className="flex items-center gap-2 flex-wrap mb-3">
          {subject && (
            <span
              className="text-[10px] font-bold px-2 py-0.5 rounded-full"
              style={{ background: `${accent}18`, color: accent }}
            >
              {subject.name}
            </span>
          )}
          {q.topico && (
            <span
              className="text-[10px] px-2 py-0.5 rounded-full"
              style={{
                background: 'var(--bg-surface-2)',
                color: 'var(--text-dim)',
              }}
            >
              {q.topico}
            </span>
          )}
          {q.banca && (
            <span
              className="text-[10px] px-2 py-0.5 rounded-full"
              style={{
                background: 'var(--bg-surface-2)',
                color: 'var(--text-dim)',
              }}
            >
              {q.banca}
              {q.ano ? `/${q.ano}` : ''}
            </span>
          )}
          {DIFF_CONFIG[q.dificuldade] && (
            <span
              className="text-[10px] font-bold px-2 py-0.5 rounded-full"
              style={{
                background: `${DIFF_CONFIG[q.dificuldade].color}18`,
                color: DIFF_CONFIG[q.dificuldade].color,
              }}
            >
              {DIFF_CONFIG[q.dificuldade].label}
            </span>
          )}
        </div>

        {/* enunciado */}
        <div
          className="text-sm mb-4"
          style={{ color: 'var(--text-main)', lineHeight: 1.7 }}
        >
          {q.enunciado}
        </div>

        {/* alternativas */}
        <div className="space-y-2">
          {q.alternativas.map((alt, i) => {
            const letter = alt.trim()[0];
            const isSelected = selected === letter;
            const isCorrect = letter === q.gabarito;
            let style = {
              borderColor: 'var(--border)',
              background: 'var(--bg-surface-2)',
              color: 'var(--text-main)',
            };
            if (revealed) {
              if (isCorrect)
                style = {
                  borderColor: '#10B981',
                  background: '#10B98115',
                  color: '#10B981',
                };
              else if (isSelected)
                style = {
                  borderColor: '#EF4444',
                  background: '#EF444415',
                  color: '#EF4444',
                };
            } else if (isSelected) {
              style = {
                borderColor: accent,
                background: `${accent}15`,
                color: accent,
              };
            }
            return (
              <button
                key={i}
                onClick={() => pick(letter)}
                disabled={revealed}
                className="w-full text-left px-4 py-3 rounded-xl border text-sm transition-all disabled:cursor-default"
                style={style}
              >
                {alt} {revealed && isCorrect && ' ✓'}
              </button>
            );
          })}
        </div>

        {/* comentário pós-revelação */}
        {revealed && q.comentario && (
          <div
            className="mt-4 p-3 rounded-xl text-xs"
            style={{
              background: 'var(--bg-surface-2)',
              color: 'var(--text-dim)',
              lineHeight: 1.6,
            }}
          >
            💬 {q.comentario}
          </div>
        )}

        {/* toggle registrar gap — só aparece se errou e tem vínculo */}
        {revealed && !results[results.length - 1]?.correct && q.subtopicId && (
          <label className="flex items-center gap-2 mt-3 cursor-pointer">
            <input
              type="checkbox"
              checked={registerGap}
              onChange={e => setRegisterGap(e.target.checked)}
              className="rounded"
            />
            <span className="text-[11px]" style={{ color: 'var(--text-dim)' }}>
              Registrar como gap no caderno de erros do subtópico
            </span>
          </label>
        )}
      </div>

      {/* ações */}
      <div className="flex gap-3">
        {!revealed ? (
          <button
            onClick={confirm}
            disabled={!selected}
            className="w-full py-3 rounded-xl font-bold text-sm text-white disabled:opacity-40"
            style={{ background: accent }}
          >
            Confirmar resposta
          </button>
        ) : (
          <button
            onClick={next}
            className="w-full py-3 rounded-xl font-bold text-sm text-white"
            style={{ background: '#10B981' }}
          >
            {idx < questions.length - 1 ? 'Próxima questão →' : 'Finalizar →'}
          </button>
        )}
      </div>
    </div>
  );
}

// ── ResultScreen ──────────────────────────────────────────────────────────────

function ResultScreen({ result, onClose }) {
  const acc =
    result.total > 0 ? Math.round((result.correct / result.total) * 100) : 0;
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-5 max-w-md mx-auto text-center">
      <div className="text-5xl">{acc >= 70 ? '🏆' : '📚'}</div>
      <div className="text-xl font-black" style={{ color: 'var(--text-main)' }}>
        {result.correct}/{result.total} acertos
      </div>
      <div
        className="text-3xl font-black"
        style={{
          color: acc >= 70 ? '#10B981' : acc >= 50 ? '#F59E0B' : '#EF4444',
        }}
      >
        {acc}%
      </div>
      {result.xpEarned > 0 && (
        <div className="text-sm font-bold" style={{ color: 'var(--accent)' }}>
          +{result.xpEarned} XP
        </div>
      )}
      <button
        onClick={onClose}
        className="px-6 py-3 rounded-xl font-bold text-sm text-white"
        style={{ background: 'var(--primary)' }}
      >
        Voltar ao banco
      </button>
    </div>
  );
}

// ── componente principal ──────────────────────────────────────────────────────

export function StudyQuestoesPage() {
  const questions = useQuestionsStore(s => s.questions);
  const decks = useQuestionsStore(s => s.decks);
  const getStatsBySubject = useQuestionsStore(s => s.getStatsBySubject);
  const getRandomMixed = useQuestionsStore(s => s.getRandomMixed);
  const deleteQuestion = useQuestionsStore(s => s.deleteQuestion);
  const deleteDeck = useQuestionsStore(s => s.deleteDeck);
  const subjects = useStudyStore(s => s.subjects);

  const [showImport, setShowImport] = useState(false);
  const [filterSubject, setFilterSubject] = useState('');
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [showDeckModal, setShowDeckModal] = useState(false);
  const [practiceQueue, setPracticeQueue] = useState(null);
  const [practiceResult, setPracticeResult] = useState(null);
  const [view, setView] = useState('bank'); // bank | decks

  const filtered = useMemo(() => {
    return questions
      .filter(q => !filterSubject || q.subjectId === filterSubject)
      .filter(
        q =>
          !search ||
          q.enunciado.toLowerCase().includes(search.toLowerCase()) ||
          q.topico.toLowerCase().includes(search.toLowerCase())
      );
  }, [questions, filterSubject, search]);

  const subjectsWithCount = subjects
    .map(s => ({
      ...s,
      count: questions.filter(q => q.subjectId === s.id).length,
    }))
    .filter(s => s.count > 0);

  function toggleSelect(id) {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  }

  function startPractice(list) {
    if (list.length === 0) {
      toast.error('Nenhuma questão para praticar.');
      return;
    }
    setPracticeQueue(list);
    setPracticeResult(null);
  }

  function handleExitPractice(result) {
    setPracticeQueue(null);
    if (result) setPracticeResult(result);
  }

  // ── modo prática ativo ───────────────────────────────────────────────────
  if (practiceQueue) {
    return (
      <StudyLayout>
        <PracticeMode questions={practiceQueue} onExit={handleExitPractice} />
      </StudyLayout>
    );
  }
  if (practiceResult) {
    return (
      <StudyLayout>
        <ResultScreen
          result={practiceResult}
          onClose={() => setPracticeResult(null)}
        />
      </StudyLayout>
    );
  }

  // ── banco vazio ──────────────────────────────────────────────────────────
  if (questions.length === 0) {
    return (
      <StudyLayout>
        <div className="flex items-center justify-center min-h-64">
          <div className="text-center max-w-md">
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl mx-auto mb-5"
              style={{
                background: 'var(--primary)18',
                border: '1px solid var(--primary)33',
              }}
            >
              ❓
            </div>
            <h2
              className="text-xl font-bold mb-2"
              style={{ color: 'var(--text-main)' }}
            >
              Banco de Questões
            </h2>
            <p
              className="text-sm mb-5"
              style={{ color: 'var(--text-muted)', lineHeight: 1.7 }}
            >
              Importe questões em formato JSON e monte cadernos vinculados às
              suas matérias. Erros viram gaps automaticamente no caderno de
              falhas do subtópico.
            </p>
            <button
              onClick={() => setShowImport(true)}
              className="px-6 py-3 rounded-xl font-bold text-sm text-white"
              style={{ background: 'var(--primary)' }}
            >
              📋 Importar questões
            </button>
          </div>
        </div>
        {showImport && <ImportModal onClose={() => setShowImport(false)} />}
      </StudyLayout>
    );
  }

  return (
    <StudyLayout>
      <div className="flex flex-col max-h-[calc(100vh-80px)] overflow-y-auto custom-scrollbar pr-1 pb-10 space-y-5 animate-fade-in">
        {/* cabeçalho */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1
              className="text-2xl font-extrabold tracking-tight"
              style={{ color: 'var(--text-main)' }}
            >
              Banco de Questões
            </h1>
            <p className="text-sm mt-1" style={{ color: 'var(--text-dim)' }}>
              {questions.length} questões · {decks.length} cadernos
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => startPractice(getRandomMixed(20))}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white"
              style={{ background: '#A855F7' }}
              title="Mescla matérias — prática mesclada"
            >
              🔀 Mesclado (20)
            </button>
            <button
              onClick={() => setShowImport(true)}
              className="px-4 py-2 rounded-xl text-xs font-bold border"
              style={{
                borderColor: 'var(--border)',
                color: 'var(--text-main)',
              }}
            >
              + Importar
            </button>
          </div>
        </div>

        {/* tabs banco / cadernos */}
        <div
          className="flex gap-1 p-1 rounded-xl w-fit"
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
          }}
        >
          {[
            { id: 'bank', label: `Banco (${questions.length})` },
            { id: 'decks', label: `Cadernos (${decks.length})` },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setView(t.id)}
              className="px-4 py-1.5 rounded-lg text-xs font-bold transition-all"
              style={{
                background: view === t.id ? 'var(--primary)' : 'transparent',
                color: view === t.id ? 'white' : 'var(--text-muted)',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ── VIEW: BANCO ── */}
        {view === 'bank' && (
          <>
            {/* filtros */}
            <div className="flex gap-2 flex-wrap items-center">
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar por enunciado ou tópico..."
                className="px-3 py-2 rounded-xl text-xs border outline-none flex-1 min-w-[200px]"
                style={{
                  background: 'var(--bg-surface)',
                  borderColor: 'var(--border)',
                  color: 'var(--text-main)',
                }}
              />
              {subjectsWithCount.length > 0 && (
                <select
                  value={filterSubject}
                  onChange={e => setFilterSubject(e.target.value)}
                  className="px-3 py-2 rounded-xl text-xs border outline-none"
                  style={{
                    background: 'var(--bg-surface)',
                    borderColor: 'var(--border)',
                    color: 'var(--text-main)',
                  }}
                >
                  <option value="">Todas as matérias</option>
                  {subjectsWithCount.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.count})
                    </option>
                  ))}
                </select>
              )}
              {selectedIds.length > 0 && (
                <>
                  <button
                    onClick={() =>
                      startPractice(
                        filtered.filter(q => selectedIds.includes(q.id))
                      )
                    }
                    className="px-3 py-2 rounded-xl text-xs font-bold text-white"
                    style={{ background: 'var(--primary)' }}
                  >
                    ▶ Praticar ({selectedIds.length})
                  </button>
                  <button
                    onClick={() => setShowDeckModal(true)}
                    className="px-3 py-2 rounded-xl text-xs font-bold border"
                    style={{
                      borderColor: 'var(--border)',
                      color: 'var(--text-main)',
                    }}
                  >
                    + Caderno
                  </button>
                  <button
                    onClick={() => setSelectedIds([])}
                    className="px-3 py-2 rounded-xl text-xs font-bold border"
                    style={{
                      borderColor: 'var(--border)',
                      color: 'var(--text-dim)',
                    }}
                  >
                    × Limpar
                  </button>
                </>
              )}
              {selectedIds.length === 0 && filtered.length > 0 && (
                <button
                  onClick={() => startPractice(filtered)}
                  className="px-3 py-2 rounded-xl text-xs font-bold text-white"
                  style={{ background: 'var(--primary)' }}
                >
                  ▶ Praticar tudo ({filtered.length})
                </button>
              )}
            </div>

            {/* lista */}
            <div className="space-y-2">
              {filtered.length === 0 ? (
                <EmptyState icon="🔍" text="Nenhuma questão encontrada" />
              ) : (
                filtered.map(q => {
                  const subj = subjects.find(s => s.id === q.subjectId);
                  const isSel = selectedIds.includes(q.id);
                  return (
                    <div
                      key={q.id}
                      onClick={() => toggleSelect(q.id)}
                      className="flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all"
                      style={{
                        background: isSel
                          ? `${subj?.color || 'var(--primary)'}10`
                          : 'var(--bg-surface)',
                        borderColor: isSel
                          ? subj?.color || 'var(--primary)'
                          : 'var(--border)',
                      }}
                    >
                      <div
                        className="w-4 h-4 rounded border flex items-center justify-center shrink-0 mt-0.5"
                        style={{
                          borderColor: isSel
                            ? subj?.color || 'var(--primary)'
                            : 'var(--border)',
                          background: isSel
                            ? subj?.color || 'var(--primary)'
                            : 'transparent',
                        }}
                      >
                        {isSel && (
                          <span className="text-white text-[9px] font-black">
                            ✓
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          {subj && (
                            <span
                              className="text-[9px] font-bold px-1.5 py-0.5 rounded"
                              style={{
                                background: `${subj.color}18`,
                                color: subj.color,
                              }}
                            >
                              {subj.name}
                            </span>
                          )}
                          {q.topico && (
                            <span
                              className="text-[9px]"
                              style={{ color: 'var(--text-dim)' }}
                            >
                              {q.topico}
                            </span>
                          )}
                          {DIFF_CONFIG[q.dificuldade] && (
                            <span
                              className="text-[9px] font-bold"
                              style={{
                                color: DIFF_CONFIG[q.dificuldade].color,
                              }}
                            >
                              {DIFF_CONFIG[q.dificuldade].label}
                            </span>
                          )}
                        </div>
                        <div
                          className="text-xs truncate"
                          style={{ color: 'var(--text-main)' }}
                        >
                          {q.enunciado}
                        </div>
                      </div>
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          deleteQuestion(q.id);
                        }}
                        className="w-6 h-6 rounded-full flex items-center justify-center text-xs hover:bg-red-500/20 shrink-0"
                        style={{ color: 'var(--text-dim)' }}
                      >
                        ×
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}

        {/* ── VIEW: CADERNOS ── */}
        {view === 'decks' && (
          <div className="space-y-2">
            {decks.length === 0 ? (
              <EmptyState
                icon="📓"
                text="Nenhum caderno ainda"
                sub="Selecione questões no Banco e crie um caderno"
              />
            ) : (
              decks.map(d => {
                const deckQuestions = d.questionIds
                  .map(id => questions.find(q => q.id === id))
                  .filter(Boolean);
                return (
                  <div
                    key={d.id}
                    className="flex items-center gap-3 p-4 rounded-xl border"
                    style={{
                      background: 'var(--bg-surface)',
                      borderColor: 'var(--border)',
                    }}
                  >
                    <div className="flex-1">
                      <div
                        className="text-sm font-bold"
                        style={{ color: 'var(--text-main)' }}
                      >
                        {d.name}
                      </div>
                      <div
                        className="text-xs"
                        style={{ color: 'var(--text-dim)' }}
                      >
                        {deckQuestions.length} questões
                      </div>
                    </div>
                    <button
                      onClick={() => startPractice(deckQuestions)}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold text-white"
                      style={{ background: 'var(--primary)' }}
                    >
                      ▶ Praticar
                    </button>
                    <button
                      onClick={() => deleteDeck(d.id)}
                      className="w-7 h-7 rounded-full flex items-center justify-center text-xs hover:bg-red-500/20"
                      style={{ color: 'var(--text-dim)' }}
                    >
                      ×
                    </button>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {showImport && <ImportModal onClose={() => setShowImport(false)} />}
      {showDeckModal && (
        <DeckModal
          questionIds={selectedIds}
          onClose={() => {
            setShowDeckModal(false);
            setSelectedIds([]);
          }}
        />
      )}
    </StudyLayout>
  );
}
