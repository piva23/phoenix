import { useState, useEffect, useRef } from 'react';
import { useStudyStore } from '../../../stores/useStudyStore';
import { useSessionStore } from '../../../stores/useSessionStore';
import { useXPStore } from '../../../stores/useXPStore';
import { useUserStore } from '../../../stores/useUserStore';
import { usePersonaStore } from '../../../stores/usePersonaStore';
import { useCycleStore } from '../../../stores/useCycleStore';
import { useRevisionStore } from '../../../stores/useRevisionStore';
import { useSessionModalStore } from '../../../stores/useSessionModalStore';
import { useSoundStore } from '../../../stores/useSoundStore';
import { XP_RULES } from '../../../shared/constants/xpRules';
import { today, formatMinutes } from '../../../shared/utils/time';
import toast from 'react-hot-toast';

// Beep simples via Web Audio API — sem precisar de arquivo de áudio externo
function playBeep(freq = 880) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.connect(g);
    g.connect(ctx.destination);
    o.frequency.value = freq;
    g.gain.value = 0.16;
    o.start();
    setTimeout(() => {
      o.stop();
      ctx.close();
    }, 280);
  } catch (e) {
    // ambiente sem suporte a áudio — ignora silenciosamente
  }
}

// ── constantes ────────────────────────────────────────────────────────────────

const MODES = [
  { id: 'leitura', label: 'Leitura', icon: '📖', color: '#3B82F6' },
  { id: 'video', label: 'Videoaula', icon: '▶️', color: '#8B5CF6' },
  { id: 'questoes', label: 'Questões', icon: '🎯', color: '#10B981' },
  { id: 'flashcards', label: 'Flashcards', icon: '🃏', color: '#F59E0B' },
  { id: 'revisao', label: 'Revisão', icon: '🔄', color: '#06B6D4' },
  { id: 'feynman', label: 'Feynman', icon: '🧠', color: '#EC4899' },
  { id: 'recall', label: 'Recall Ativo', icon: '⚡', color: '#F97316' },
  { id: 'mpa', label: 'MPA / Âncora', icon: '🔗', color: '#A855F7' },
  { id: 'mapa', label: 'Mapa Mental', icon: '🗺️', color: '#14B8A6' },
];

const DURATIONS = [
  { label: '25 min', value: 25 * 60 },
  { label: '45 min', value: 45 * 60 },
  { label: '1h', value: 60 * 60 },
  { label: 'Livre', value: null },
];

// Presets clássicos de foco/pausa (estilo Flowtunes) — trabalho/pausa em minutos
const POMO_PRESETS = [
  { label: 'Clássico', work: 25, brk: 5, long: 15, cycles: 4 },
  { label: 'Estendido', work: 50, brk: 10, long: 20, cycles: 3 },
  { label: 'Sprint', work: 15, brk: 3, long: 10, cycles: 4 },
];

function fmtTimer(sec) {
  return `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`;
}

// ── FloatingTimer ─────────────────────────────────────────────────────────────

function FloatingTimer({ elapsed, remaining, accent, subjectName, onReopen }) {
  const display = remaining ?? elapsed;
  const overtime = remaining !== null && remaining === 0;
  const bg = overtime
    ? '#EF4444'
    : accent?.startsWith('#')
      ? accent
      : '#8B5CF6';
  return (
    <button
      onClick={onReopen}
      className="fixed bottom-6 right-6 z-[300] flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-sm text-white shadow-2xl transition-transform hover:scale-105 active:scale-95"
      style={{ background: bg, boxShadow: `0 4px 28px ${bg}55` }}
    >
      <span className="relative flex items-center justify-center w-4 h-4 shrink-0">
        <span
          className="absolute w-3 h-3 rounded-full opacity-40"
          style={{
            background: 'white',
            animation: 'ping 1.2s cubic-bezier(0,0,.2,1) infinite',
          }}
        />
        <span className="w-2.5 h-2.5 rounded-full bg-white" />
      </span>
      <span className="font-mono text-base tabular-nums">
        {fmtTimer(display)}
      </span>
      <span className="flex flex-col items-start leading-tight">
        <span className="text-[10px] font-bold uppercase tracking-wider opacity-80 max-w-[100px] truncate">
          {subjectName || 'Sessão'}
        </span>
        <span className="text-[9px] opacity-60">
          {remaining !== null
            ? overtime
              ? 'tempo esgotado'
              : 'restante'
            : 'decorrido'}
        </span>
      </span>
      <span className="text-xs opacity-70">↑</span>
    </button>
  );
}

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

function TA({ placeholder, value, onChange, rows = 2 }) {
  return (
    <textarea
      rows={rows}
      placeholder={placeholder}
      value={value}
      onChange={e => onChange(e.target.value)}
      className="w-full px-3 py-2.5 rounded-xl text-sm border outline-none resize-none"
      style={{
        background: 'var(--bg-surface-2)',
        borderColor: 'var(--border)',
        color: 'var(--text-main)',
        lineHeight: 1.6,
      }}
    />
  );
}

function NI({ placeholder, value, onChange }) {
  return (
    <input
      type="number"
      min="0"
      placeholder={placeholder}
      value={value}
      onChange={e => onChange(e.target.value)}
      className="w-full px-3 py-2.5 rounded-xl text-sm border outline-none"
      style={{
        background: 'var(--bg-surface-2)',
        borderColor: 'var(--border)',
        color: 'var(--text-main)',
      }}
    />
  );
}

function Toggle({ on, onChange, label, sub, accent }) {
  return (
    <label
      className="flex items-center gap-3 cursor-pointer p-3 rounded-xl border"
      style={{ borderColor: 'var(--border)' }}
    >
      <div
        className="w-10 h-6 rounded-full relative shrink-0 transition-colors"
        style={{
          background: on ? accent || 'var(--primary)' : 'var(--bg-surface-2)',
          border: '1px solid var(--border)',
        }}
        onClick={() => onChange(!on)}
      >
        <div
          className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform"
          style={{ transform: on ? 'translateX(18px)' : 'translateX(2px)' }}
        />
      </div>
      <div>
        <div
          className="text-xs font-bold"
          style={{ color: 'var(--text-main)' }}
        >
          {label}
        </div>
        {sub && (
          <div className="text-[10px]" style={{ color: 'var(--text-dim)' }}>
            {sub}
          </div>
        )}
      </div>
    </label>
  );
}

function WarnBox({ children }) {
  return (
    <div
      className="flex gap-2 p-3 rounded-xl text-xs font-medium"
      style={{
        background: '#F59E0B15',
        border: '1px solid #F59E0B33',
        color: '#F59E0B',
      }}
    >
      <span className="shrink-0">⚠️</span>
      <span style={{ color: 'var(--text-secondary)' }}>{children}</span>
    </div>
  );
}

// ── componente principal ──────────────────────────────────────────────────────

export function SessionQuickModal() {
  // Estado de abertura agora vem de uma store global (não mais props) —
  // é isso que garante que o modal sobrevive à navegação entre páginas.
  const open = useSessionModalStore(s => s.open);
  const onClose = useSessionModalStore(s => s.closeModal);
  const preSubjectId = useSessionModalStore(s => s.preSubjectId);
  const preTopicId = useSessionModalStore(s => s.preTopicId);
  const preSubtopicId = useSessionModalStore(s => s.preSubtopicId);
  const preMode = useSessionModalStore(s => s.preMode);
  const revisionId = useSessionModalStore(s => s.revisionId);

  const [phase, setPhase] = useState('setup');
  const [minimized, setMinimized] = useState(false);

  // setup
  const [subjectId, setSubjectId] = useState(preSubjectId || '');
  const [topicId, setTopicId] = useState(preTopicId || '');
  const [subtopicId, setSubtopicId] = useState(preSubtopicId || '');
  // seletor de matéria: fechado por padrão quando já vem preenchido (prefill),
  // aberto quando o usuário precisa escolher do zero
  const [subjectPickerOpen, setSubjectPickerOpen] = useState(!preSubjectId);
  const [subjectSearch, setSubjectSearch] = useState('');
  const [duration, setDuration] = useState(25 * 60);

  // pomodoro
  const [timerMode, setTimerMode] = useState('fixo'); // 'fixo' | 'pomodoro'
  const [pomoPreset, setPomoPreset] = useState(POMO_PRESETS[0]);
  const [pomoPhase, setPomoPhase] = useState('foco'); // 'foco' | 'pausa'
  const [pomoCount, setPomoCount] = useState(0);
  const [soundOn, setSoundOn] = useState(true);

  // som ambiente/foco (mp3 cadastrados pelo usuário)
  const savedSounds = useSoundStore(s => s.sounds);
  const addSavedSound = useSoundStore(s => s.addSound);
  const removeSavedSound = useSoundStore(s => s.removeSound);
  const lastSoundId = useSoundStore(s => s.lastSoundId);
  const setLastSoundId = useSoundStore(s => s.setLastSound);
  const ambientVolume = useSoundStore(s => s.volume);
  const setAmbientVolume = useSoundStore(s => s.setVolume);
  const [ambientSoundId, setAmbientSoundId] = useState(lastSoundId || '');
  const [showAddSound, setShowAddSound] = useState(false);
  const [newSoundName, setNewSoundName] = useState('');
  const [newSoundUrl, setNewSoundUrl] = useState('');
  const audioRef = useRef(null);
  const ambientSound = savedSounds.find(s => s.id === ambientSoundId);

  // running
  const [elapsed, setElapsed] = useState(0);
  const [paused, setPaused] = useState(false);
  const [remaining, setRemaining] = useState(null);
  const intervalRef = useRef(null);
  const startedAt = useRef(null);

  // finish — só preenchido no encerramento
  const [selectedModes, setSelectedModes] = useState([]);
  // questões
  const [qAnswered, setQAnswered] = useState('');
  const [qCorrect, setQCorrect] = useState('');
  const [gaps, setGaps] = useState('');
  // vídeo
  const [videoMin, setVideoMin] = useState('');
  // feynman
  const [feynmanNote, setFeynmanNote] = useState('');
  // recall
  const [recallText, setRecallText] = useState('');
  const [recallMissed, setRecallMissed] = useState('');
  // mpa
  const [anchor, setAnchor] = useState('');
  // sempre presentes
  const [connection, setConnection] = useState('');
  const [insecurity, setInsecurity] = useState('');
  const [concluded, setConcluded] = useState(null);
  const [generateRev, setGenerateRev] = useState(true);
  // score da revisão (1=difícil, 3=médio, 5=fácil) — só relevante quando revisionId existe
  const [revisionScore, setRevisionScore] = useState(3);

  // result
  const [result, setResult] = useState(null);

  // stores
  const subjects = useStudyStore(s => s.subjects);
  const updateSubtopic = useStudyStore(s => s.updateSubtopic);
  const addSession = useSessionStore(s => s.addSession);
  const { logXP } = useXPStore();
  const { addXP } = useUserStore();
  const activePersonaId = usePersonaStore(s => s.activePersonaId);
  const addPersonaXP = usePersonaStore(s => s.addPersonaXP);
  const { getActiveCycle, addMinutesToItem } = useCycleStore();
  const generateRevisions = useRevisionStore(s => s.generateRevisions);
  const completeRevision = useRevisionStore(s => s.completeRevision);

  const subject = subjects.find(s => s.id === subjectId);
  const filteredSubjects = subjects.filter(s =>
    s.name.toLowerCase().includes(subjectSearch.trim().toLowerCase())
  );
  const topics = subject?.topics || [];
  const topic = topics.find(t => t.id === topicId);
  const subtopics = topic?.subtopics || [];
  const subtopic = subtopics.find(ss => ss.id === subtopicId);
  const accent = subject?.color || '#8B5CF6';
  const accentSafe = accent.startsWith('#') ? accent : '#8B5CF6';

  const has = id => selectedModes.includes(id);
  const sessionActive = phase === 'running' || phase === 'finish';

  // reset ao abrir
  useEffect(() => {
    if (open && !sessionActive) {
      setPhase('setup');
      setMinimized(false);
      setSubjectId(preSubjectId || '');
      setTopicId(preTopicId || '');
      setSubtopicId(preSubtopicId || '');
      setSubjectPickerOpen(!preSubjectId);
      setSubjectSearch('');
      setAmbientSoundId(lastSoundId || '');
      setDuration(25 * 60);
      setTimerMode('fixo');
      setPomoPreset(POMO_PRESETS[0]);
      setPomoPhase('foco');
      setPomoCount(0);
      setElapsed(0);
      setPaused(false);
      setRemaining(null);
      resetFinish();
      setResult(null);
    }
    if (open) setMinimized(false);
  }, [open]);

  // toca/pausa o som ambiente em sincronia com a sessão
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (!ambientSound) {
      audio.pause();
      return;
    }
    if (audio.src !== ambientSound.url) audio.src = ambientSound.url;
    audio.loop = true;
    audio.volume = ambientVolume;
    if (phase === 'running' && !paused) {
      audio.play().catch(() => {
        // autoplay bloqueado pelo navegador — usuário pode clicar em play manualmente
      });
    } else {
      audio.pause();
    }
  }, [phase, paused, ambientSound, ambientVolume]);

  // pausa e limpa o áudio quando o modal fecha de vez
  useEffect(() => {
    if (!open && audioRef.current) {
      audioRef.current.pause();
    }
  }, [open]);

  function handleAddSound() {
    if (!newSoundName.trim() || !newSoundUrl.trim()) {
      toast.error('Preencha nome e link do mp3.');
      return;
    }
    const sound = addSavedSound({ name: newSoundName, url: newSoundUrl });
    setAmbientSoundId(sound.id);
    setLastSoundId(sound.id);
    setNewSoundName('');
    setNewSoundUrl('');
    setShowAddSound(false);
  }

  function resetFinish() {
    setSelectedModes(preMode ? [preMode] : []);
    setQAnswered('');
    setQCorrect('');
    setGaps('');
    setVideoMin('');
    setFeynmanNote('');
    setRecallText('');
    setRecallMissed('');
    setAnchor('');
    setConnection('');
    setInsecurity('');
    setConcluded(null);
    setGenerateRev(true);
    setRevisionScore(3);
  }

  // cronômetro
  useEffect(() => {
    if (phase === 'running' && !paused) {
      intervalRef.current = setInterval(() => {
        // no modo pomodoro, só conta como "estudado" o tempo de foco
        if (timerMode !== 'pomodoro' || pomoPhase === 'foco') {
          setElapsed(e => e + 1);
        }
        setRemaining(r => {
          if (r === null) return null;
          if (r <= 1) {
            if (timerMode === 'pomodoro') {
              if (pomoPhase === 'foco') {
                const newCount = pomoCount + 1;
                setPomoCount(newCount);
                const isLong = newCount % pomoPreset.cycles === 0;
                const brkMin = isLong ? pomoPreset.long : pomoPreset.brk;
                setPomoPhase('pausa');
                if (soundOn) playBeep(660);
                toast(
                  isLong
                    ? `☕ Pausa longa de ${brkMin}min — respira.`
                    : `☕ Pausa de ${brkMin}min.`,
                  { icon: '☕' }
                );
                return brkMin * 60;
              } else {
                setPomoPhase('foco');
                if (soundOn) playBeep(880);
                toast('🔥 Pausa acabou — bora focar de novo.', { icon: '🔥' });
                return pomoPreset.work * 60;
              }
            }
            // modo fixo: encerra e vai pra tela de registro
            clearInterval(intervalRef.current);
            setPaused(true);
            setPhase('finish');
            setMinimized(false);
            if (soundOn) playBeep(880);
            toast('⏰ Tempo concluído — registre sua sessão.', {
              icon: '🎯',
            });
            return 0;
          }
          return r - 1;
        });
      }, 1000);
    } else clearInterval(intervalRef.current);
    return () => clearInterval(intervalRef.current);
  }, [phase, paused, timerMode, pomoPhase, pomoCount, pomoPreset, soundOn]);

  function toggleMode(id) {
    setSelectedModes(p =>
      p.includes(id) ? p.filter(m => m !== id) : [...p, id]
    );
  }

  function handleStart() {
    if (!subjectId) return;
    startedAt.current = new Date().toISOString();
    setElapsed(0);
    if (timerMode === 'pomodoro') {
      setPomoPhase('foco');
      setPomoCount(0);
      setRemaining(pomoPreset.work * 60);
    } else {
      setRemaining(duration);
    }
    setPaused(false);
    setPhase('running');
  }

  function handleSkipPhase() {
    // pula manualmente pro próximo bloco do pomodoro (foco <-> pausa)
    if (pomoPhase === 'foco') {
      const newCount = pomoCount + 1;
      setPomoCount(newCount);
      const isLong = newCount % pomoPreset.cycles === 0;
      setPomoPhase('pausa');
      setRemaining((isLong ? pomoPreset.long : pomoPreset.brk) * 60);
    } else {
      setPomoPhase('foco');
      setRemaining(pomoPreset.work * 60);
    }
  }

  function handleOverlayClick() {
    sessionActive ? setMinimized(true) : onClose();
  }
  function handleHeaderClose() {
    sessionActive ? setMinimized(true) : onClose();
  }

  function handleSave() {
    const mins = Math.max(1, Math.floor(elapsed / 60));
    const qA = Number(qAnswered) || 0;
    const qC = Number(qCorrect) || 0;

    // bônus XP por metodologia ativa
    const bonusConnection = connection.trim() ? 5 : 0;
    const bonusFeynman = feynmanNote.trim() ? 8 : 0;
    const bonusRecall = recallText.trim() ? 6 : 0;
    const bonusMpa = anchor.trim() ? 4 : 0;

    const xpEarned =
      mins * (XP_RULES.STUDY_MINUTE?.xp || 1) +
      qC * (XP_RULES.QUESTION_CORRECT?.xp || 2) +
      (XP_RULES.SESSION_COMPLETED?.xp || 15) +
      bonusConnection +
      bonusFeynman +
      bonusRecall +
      bonusMpa;

    const session = {
      subjectId,
      topicId: topicId || null,
      subtopicId: subtopicId || null,
      modes: selectedModes.length > 0 ? selectedModes : ['leitura'],
      studyType: selectedModes[0] || 'leitura',
      startTime: startedAt.current,
      totalMinutes: mins,
      date: today(),
      finishedAt: Date.now(),
      questionsAnswered: has('questoes') ? qA : 0,
      questionsCorrect: has('questoes') ? qC : 0,
      videoMinutes: has('video') ? Number(videoMin) || 0 : 0,
      gaps: gaps.trim() || null,
      connection: connection.trim() || null,
      insecurity: insecurity.trim() || null,
      feynmanNote: feynmanNote.trim() || null,
      recallText: recallText.trim() || null,
      recallMissed: recallMissed.trim() || null,
      anchor: anchor.trim() || null,
      xpEarned,
    };

    addSession(session);
    logXP({
      action: 'SESSION_COMPLETED',
      xp: xpEarned,
      moduleOrigin: 'study',
      personaId: activePersonaId,
      radarAxis: 'conhecimento',
    });
    addXP(xpEarned);
    if (activePersonaId) addPersonaXP(activePersonaId, xpEarned);

    // atualiza subtópico com dados metodológicos
    if (subtopicId) {
      const updates = {};
      if (concluded !== null) {
        updates.status = concluded ? 'dominado' : 'estudando';
        updates.stats = {
          totalMinutes: (subtopic?.stats?.totalMinutes || 0) + mins,
          questionsAnswered: (subtopic?.stats?.questionsAnswered || 0) + qA,
          questionsCorrect: (subtopic?.stats?.questionsCorrect || 0) + qC,
          lastStudied: today(),
        };
      }
      if (gaps.trim())
        updates.gaps = [
          ...(subtopic?.gaps || []),
          { text: gaps.trim(), date: today() },
        ];
      if (insecurity.trim())
        updates.insecurities = [
          ...(subtopic?.insecurities || []),
          { text: insecurity.trim(), date: today() },
        ];
      if (feynmanNote.trim())
        updates.feynmanNotes = [
          ...(subtopic?.feynmanNotes || []),
          { text: feynmanNote.trim(), date: today() },
        ];
      if (anchor.trim())
        updates.anchors = [
          ...(subtopic?.anchors || []),
          { text: anchor.trim(), date: today(), type: 'mpa' },
        ];
      if (connection.trim())
        updates.connections = [
          ...(subtopic?.connections || []),
          { text: connection.trim(), date: today() },
        ];
      if (Object.keys(updates).length)
        updateSubtopic(subjectId, topicId, subtopicId, updates);

      if (revisionId) {
        // Esta sessão nasceu de uma revisão pendente — conclui ela com o
        // score escolhido (fácil/médio/difícil), o que já agenda a próxima
        // automaticamente. Não gera uma segunda cadeia de revisões.
        completeRevision(revisionId, revisionScore);
      } else if (generateRev) {
        generateRevisions(subjectId, topicId, subtopicId);
      }
    }

    // avança ciclo
    const cycle = getActiveCycle();
    if (cycle) {
      const item = cycle.items?.find(i => i.subjectId === subjectId);
      if (item) addMinutesToItem(cycle.id, item.id, mins);
    }

    const acc = qA > 0 ? Math.round((qC / qA) * 100) : null;
    const badges = [
      connection.trim() && {
        label: '🧠 Ordem superior',
        xp: bonusConnection,
        color: '#8B5CF6',
      },
      feynmanNote.trim() && {
        label: '🎤 Feynman',
        xp: bonusFeynman,
        color: '#EC4899',
      },
      recallText.trim() && {
        label: '⚡ Recall ativo',
        xp: bonusRecall,
        color: '#F97316',
      },
      anchor.trim() && { label: '🔗 MPA', xp: bonusMpa, color: '#A855F7' },
    ].filter(Boolean);

    setResult({
      mins,
      xpEarned,
      qA,
      qC,
      acc,
      subjectName: subject?.name,
      subjectColor: accent,
      badges,
      revisionCompleted: !!revisionId,
    });
    toast.success(
      revisionId
        ? `+${xpEarned} XP — revisão concluída! 🔁`
        : `+${xpEarned} XP — sessão salva! 🎯`
    );
    setPhase('result');
  }

  const pomoPhaseTotal =
    pomoPhase === 'foco' ? pomoPreset.work * 60 : pomoPreset.brk * 60;
  const progressPct =
    timerMode === 'pomodoro'
      ? Math.round(((pomoPhaseTotal - remaining) / pomoPhaseTotal) * 100)
      : remaining !== null && duration
        ? Math.round(((duration - remaining) / duration) * 100)
        : null;

  // minimizado
  if (minimized && sessionActive) {
    return (
      <>
        <audio ref={audioRef} />
        <FloatingTimer
          elapsed={elapsed}
          remaining={remaining}
          accent={accentSafe}
          subjectName={subject?.name}
          onReopen={() => setMinimized(false)}
        />
      </>
    );
  }
  if (!open && !sessionActive) return null;

  const inpStyle = {
    background: 'var(--bg-surface-2)',
    borderColor: 'var(--border)',
    color: 'var(--text-main)',
  };

  return (
    <>
      <audio ref={audioRef} />
      <style>{`@keyframes ping{75%,100%{transform:scale(2);opacity:0}}`}</style>
      <div
        className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-4"
        style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }}
        onClick={handleOverlayClick}
      >
        <div
          className="w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl"
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-strong)',
          }}
          onClick={e => e.stopPropagation()}
        >
          {/* header */}
          <div
            className="flex items-center justify-between px-5 py-4 border-b"
            style={{
              borderColor: 'var(--border)',
              background: 'var(--bg-surface-2)',
            }}
          >
            <div className="flex items-center gap-3">
              {phase === 'running' && !paused && (
                <span className="relative flex items-center justify-center w-4 h-4">
                  <span
                    className="absolute w-3 h-3 rounded-full opacity-40"
                    style={{
                      background: accentSafe,
                      animation: 'ping 1.2s cubic-bezier(0,0,.2,1) infinite',
                    }}
                  />
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ background: accentSafe }}
                  />
                </span>
              )}
              <span
                className="font-bold text-sm"
                style={{ color: 'var(--text-main)' }}
              >
                {phase === 'setup' && 'Nova sessão'}
                {phase === 'running' && (subject?.name || 'Em andamento')}
                {phase === 'finish' && 'O que você fez?'}
                {phase === 'result' && 'Sessão salva!'}
              </span>
            </div>
            <div className="flex items-center gap-1">
              {sessionActive && (
                <button
                  onClick={() => setMinimized(true)}
                  className="w-7 h-7 rounded-full flex items-center justify-center text-xs hover:bg-white/10 transition-colors"
                  style={{ color: 'var(--text-muted)' }}
                  title="Minimizar"
                >
                  ↓
                </button>
              )}
              <button
                onClick={handleHeaderClose}
                className="w-7 h-7 rounded-full flex items-center justify-center text-lg hover:bg-white/10 transition-colors"
                style={{ color: 'var(--text-muted)' }}
              >
                {sessionActive ? '—' : '×'}
              </button>
            </div>
          </div>

          {sessionActive && (
            <div
              className="px-5 py-1.5 text-center text-[11px] font-medium"
              style={{ background: `${accentSafe}15`, color: accentSafe }}
            >
              ⚡ Sessão ativa — clique fora para minimizar o timer
            </div>
          )}

          {/* ══ SETUP ══════════════════════════════════════════ */}
          {phase === 'setup' && (
            <div className="p-5 space-y-5 max-h-[80vh] overflow-y-auto">
              {revisionId && (
                <div
                  className="flex items-center gap-2 p-3 rounded-xl text-xs font-bold"
                  style={{
                    background: '#06B6D418',
                    border: '1px solid #06B6D444',
                    color: '#06B6D4',
                  }}
                >
                  <span className="text-base">🔄</span>
                  <span>
                    Isso é uma revisão de {subject?.name || 'matéria'}
                    {subtopic ? ` — ${subtopic.name}` : ''}. Ao encerrar, ela
                    será marcada como concluída automaticamente.
                  </span>
                </div>
              )}
              {/* matéria */}
              <div>
                <Label>Matéria *</Label>

                {/* chip da matéria selecionada — some a lista gigante quando já tem escolha */}
                {subject && !subjectPickerOpen ? (
                  <button
                    onClick={() => {
                      setSubjectPickerOpen(true);
                      setSubjectSearch('');
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium text-left transition-all"
                    style={{
                      borderColor: subject.color,
                      background: `${subject.color}18`,
                      color: subject.color,
                    }}
                  >
                    <div
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ background: subject.color }}
                    />
                    <span className="truncate flex-1">{subject.name}</span>
                    <span
                      className="text-[10px] font-bold uppercase tracking-wider shrink-0"
                      style={{ color: 'var(--text-dim)' }}
                    >
                      Trocar
                    </span>
                  </button>
                ) : (
                  <div
                    className="rounded-xl border overflow-hidden"
                    style={{ borderColor: 'var(--border)' }}
                  >
                    {subjects.length > 5 && (
                      <input
                        autoFocus={!!subject}
                        value={subjectSearch}
                        onChange={e => setSubjectSearch(e.target.value)}
                        placeholder="🔍 Buscar matéria..."
                        className="w-full px-3 py-2 text-sm outline-none border-b"
                        style={{
                          background: 'var(--bg-surface-2)',
                          borderColor: 'var(--border)',
                          color: 'var(--text-main)',
                        }}
                      />
                    )}
                    <div className="max-h-52 overflow-y-auto p-1.5 space-y-1">
                      {filteredSubjects.map(s => (
                        <button
                          key={s.id}
                          onClick={() => {
                            setSubjectId(s.id);
                            setTopicId('');
                            setSubtopicId('');
                            setSubjectPickerOpen(false);
                            setSubjectSearch('');
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-left transition-all"
                          style={{
                            background:
                              subjectId === s.id
                                ? `${s.color}18`
                                : 'transparent',
                            color:
                              subjectId === s.id ? s.color : 'var(--text-main)',
                          }}
                        >
                          <div
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ background: s.color }}
                          />
                          <span className="truncate">{s.name}</span>
                        </button>
                      ))}
                      {filteredSubjects.length === 0 && subjects.length > 0 && (
                        <div
                          className="text-xs italic p-3 text-center"
                          style={{ color: 'var(--text-dim)' }}
                        >
                          Nenhuma matéria encontrada.
                        </div>
                      )}
                      {subjects.length === 0 && (
                        <div
                          className="text-xs italic p-3 text-center"
                          style={{ color: 'var(--text-dim)' }}
                        >
                          Cadastre uma matéria primeiro.
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* tópico + subtópico */}
              {subjectId && topics.length > 0 && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Assunto</Label>
                    <select
                      value={topicId}
                      onChange={e => {
                        setTopicId(e.target.value);
                        setSubtopicId('');
                      }}
                      className="w-full px-3 py-2.5 rounded-xl text-sm font-medium border outline-none"
                      style={inpStyle}
                    >
                      <option value="">Geral</option>
                      {topics.map(t => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label>Aula</Label>
                    <select
                      value={subtopicId}
                      onChange={e => setSubtopicId(e.target.value)}
                      disabled={!topicId}
                      className="w-full px-3 py-2.5 rounded-xl text-sm font-medium border outline-none disabled:opacity-40"
                      style={inpStyle}
                    >
                      <option value="">Geral</option>
                      {subtopics.map(ss => (
                        <option key={ss.id} value={ss.id}>
                          {ss.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* modo de cronômetro */}
              <div>
                <Label>Modo de Cronômetro</Label>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  {[
                    ['fixo', '⏱ Tempo Fixo'],
                    ['pomodoro', '🍅 Pomodoro'],
                  ].map(([id, label]) => (
                    <button
                      key={id}
                      onClick={() => setTimerMode(id)}
                      className="py-2.5 rounded-xl border text-xs font-bold transition-all"
                      style={{
                        borderColor:
                          timerMode === id ? accentSafe : 'var(--border)',
                        background:
                          timerMode === id
                            ? `${accentSafe}18`
                            : 'var(--bg-surface-2)',
                        color:
                          timerMode === id ? accentSafe : 'var(--text-muted)',
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                {timerMode === 'fixo' ? (
                  <div className="grid grid-cols-4 gap-2">
                    {DURATIONS.map(d => (
                      <button
                        key={d.label}
                        onClick={() => setDuration(d.value)}
                        className="py-2.5 rounded-xl border text-xs font-bold transition-all"
                        style={{
                          borderColor:
                            duration === d.value ? accentSafe : 'var(--border)',
                          background:
                            duration === d.value
                              ? `${accentSafe}18`
                              : 'var(--bg-surface-2)',
                          color:
                            duration === d.value
                              ? accentSafe
                              : 'var(--text-muted)',
                        }}
                      >
                        {d.label}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {POMO_PRESETS.map(p => (
                      <button
                        key={p.label}
                        onClick={() => setPomoPreset(p)}
                        className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl border text-xs font-bold transition-all"
                        style={{
                          borderColor:
                            pomoPreset.label === p.label
                              ? accentSafe
                              : 'var(--border)',
                          background:
                            pomoPreset.label === p.label
                              ? `${accentSafe}18`
                              : 'var(--bg-surface-2)',
                          color:
                            pomoPreset.label === p.label
                              ? accentSafe
                              : 'var(--text-muted)',
                        }}
                      >
                        <span>{p.label}</span>
                        <span className="opacity-70 font-mono">
                          {p.work}min foco / {p.brk}min pausa
                        </span>
                      </button>
                    ))}
                    <Toggle
                      on={soundOn}
                      onChange={setSoundOn}
                      accent={accentSafe}
                      label="Som ao trocar de bloco"
                      sub="Toca um beep quando foco/pausa terminam"
                    />
                  </div>
                )}
              </div>

              {/* som ambiente/foco — configurável antes de iniciar */}
              <div>
                <Label>🎧 Som ambiente (opcional)</Label>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setAmbientSoundId('')}
                    className="px-3 py-2 rounded-xl border text-xs font-bold transition-all"
                    style={{
                      borderColor: !ambientSoundId
                        ? accentSafe
                        : 'var(--border)',
                      background: !ambientSoundId
                        ? `${accentSafe}18`
                        : 'var(--bg-surface-2)',
                      color: !ambientSoundId ? accentSafe : 'var(--text-muted)',
                    }}
                  >
                    🔇 Nenhum
                  </button>
                  {savedSounds.map(s => (
                    <div key={s.id} className="relative group">
                      <button
                        onClick={() => {
                          setAmbientSoundId(s.id);
                          setLastSoundId(s.id);
                        }}
                        className="pl-3 pr-7 py-2 rounded-xl border text-xs font-bold transition-all"
                        style={{
                          borderColor:
                            ambientSoundId === s.id
                              ? accentSafe
                              : 'var(--border)',
                          background:
                            ambientSoundId === s.id
                              ? `${accentSafe}18`
                              : 'var(--bg-surface-2)',
                          color:
                            ambientSoundId === s.id
                              ? accentSafe
                              : 'var(--text-muted)',
                        }}
                      >
                        🎵 {s.name}
                      </button>
                      <button
                        onClick={() => {
                          removeSavedSound(s.id);
                          if (ambientSoundId === s.id) setAmbientSoundId('');
                        }}
                        title="Remover este som"
                        className="absolute right-1.5 top-1/2 -translate-y-1/2 w-4 h-4 flex items-center justify-center text-[10px] rounded-full opacity-0 group-hover:opacity-100 hover:bg-red-500/20 hover:text-red-400 transition-opacity"
                        style={{ color: 'var(--text-dim)' }}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => setShowAddSound(o => !o)}
                    className="px-3 py-2 rounded-xl border border-dashed text-xs font-bold transition-all"
                    style={{
                      borderColor: 'var(--border)',
                      color: 'var(--text-dim)',
                    }}
                  >
                    + Adicionar
                  </button>
                </div>

                {showAddSound && (
                  <div
                    className="mt-2 p-3 rounded-xl border space-y-2"
                    style={{
                      borderColor: 'var(--border)',
                      background: 'var(--bg-surface-2)',
                    }}
                  >
                    <input
                      value={newSoundName}
                      onChange={e => setNewSoundName(e.target.value)}
                      placeholder="Nome (ex: Chuva, Lo-fi, Ruído branco)"
                      className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                      style={inpStyle}
                    />
                    <input
                      value={newSoundUrl}
                      onChange={e => setNewSoundUrl(e.target.value)}
                      placeholder="Link direto do mp3 (https://...)"
                      className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                      style={inpStyle}
                    />
                    <p
                      className="text-[10px]"
                      style={{ color: 'var(--text-dim)' }}
                    >
                      Precisa ser um link direto pro arquivo .mp3 (não uma
                      página do YouTube/Spotify).
                    </p>
                    <button
                      onClick={handleAddSound}
                      className="w-full py-2 rounded-lg text-xs font-bold text-white"
                      style={{ background: accentSafe }}
                    >
                      Salvar som
                    </button>
                  </div>
                )}

                {ambientSound && (
                  <div className="flex items-center gap-2 mt-2">
                    <span
                      className="text-[10px]"
                      style={{ color: 'var(--text-dim)' }}
                    >
                      🔊
                    </span>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.05}
                      value={ambientVolume}
                      onChange={e => setAmbientVolume(Number(e.target.value))}
                      className="flex-1"
                    />
                  </div>
                )}
              </div>

              <button
                onClick={handleStart}
                disabled={!subjectId}
                className="w-full py-3.5 rounded-xl font-bold text-sm text-white uppercase tracking-wider transition-all hover:opacity-90 disabled:opacity-40"
                style={{ background: accentSafe }}
              >
                ▶ Iniciar —{' '}
                {timerMode === 'pomodoro'
                  ? `${pomoPreset.label} (${pomoPreset.work}/${pomoPreset.brk})`
                  : duration
                    ? DURATIONS.find(d => d.value === duration)?.label
                    : 'Livre'}
              </button>
            </div>
          )}

          {/* ══ RUNNING ════════════════════════════════════════ */}
          {phase === 'running' && (
            <div className="p-6 flex flex-col items-center gap-5">
              <div className="relative w-44 h-44">
                <svg
                  className="absolute inset-0 -rotate-90"
                  width="176"
                  height="176"
                  viewBox="0 0 176 176"
                >
                  <circle
                    cx="88"
                    cy="88"
                    r="74"
                    fill="none"
                    stroke="var(--bg-surface-2)"
                    strokeWidth="8"
                  />
                  {progressPct !== null && (
                    <circle
                      cx="88"
                      cy="88"
                      r="74"
                      fill="none"
                      stroke={
                        timerMode === 'pomodoro' && pomoPhase === 'pausa'
                          ? '#10B981'
                          : accentSafe
                      }
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 74}`}
                      strokeDashoffset={`${2 * Math.PI * 74 * (1 - progressPct / 100)}`}
                      style={{ transition: 'stroke-dashoffset 0.8s ease' }}
                    />
                  )}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div
                    className="text-4xl font-black font-mono tabular-nums"
                    style={{
                      color: paused ? 'var(--text-dim)' : 'var(--text-main)',
                    }}
                  >
                    {remaining !== null
                      ? fmtTimer(remaining)
                      : fmtTimer(elapsed)}
                  </div>
                  <div
                    className="text-[10px] font-bold uppercase tracking-widest mt-1"
                    style={{ color: 'var(--text-dim)' }}
                  >
                    {remaining !== null ? 'restante' : 'decorrido'}
                  </div>
                  {remaining !== null && (
                    <div
                      className="text-[10px] mt-0.5"
                      style={{ color: 'var(--text-dim)' }}
                    >
                      {fmtTimer(elapsed)} estudados
                    </div>
                  )}
                </div>
              </div>
              <div className="text-center">
                {timerMode === 'pomodoro' && (
                  <div
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-2"
                    style={{
                      background:
                        pomoPhase === 'foco' ? `${accentSafe}18` : '#10B98118',
                      color: pomoPhase === 'foco' ? accentSafe : '#10B981',
                    }}
                  >
                    {pomoPhase === 'foco' ? '🔥 Foco' : '☕ Pausa'} · ciclo{' '}
                    {pomoCount + 1}
                  </div>
                )}
                <div
                  className="text-xs font-bold uppercase tracking-widest mb-0.5"
                  style={{ color: accentSafe }}
                >
                  {subject?.name}
                </div>
                {subtopic && (
                  <div className="text-xs" style={{ color: 'var(--text-dim)' }}>
                    {subtopic.name}
                  </div>
                )}
                {ambientSound && (
                  <button
                    onClick={() => setAmbientSoundId('')}
                    className="mt-2 inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-1 rounded-full"
                    style={{ background: `${accentSafe}18`, color: accentSafe }}
                    title="Clique para silenciar"
                  >
                    🎵 {ambientSound.name} — toque para silenciar
                  </button>
                )}
              </div>
              <div className="flex gap-3 w-full">
                <button
                  onClick={() => setPaused(p => !p)}
                  className="flex-1 py-3 rounded-xl border font-bold text-sm"
                  style={{
                    borderColor: 'var(--border)',
                    color: 'var(--text-main)',
                    background: 'var(--bg-surface-2)',
                  }}
                >
                  {paused ? '▶ Retomar' : '⏸ Pausar'}
                </button>
                {timerMode === 'pomodoro' && (
                  <button
                    onClick={handleSkipPhase}
                    className="px-4 py-3 rounded-xl border font-bold text-sm"
                    style={{
                      borderColor: 'var(--border)',
                      color: 'var(--text-dim)',
                      background: 'var(--bg-surface-2)',
                    }}
                    title="Pular pro próximo bloco"
                  >
                    ⏭
                  </button>
                )}
                <button
                  onClick={() => {
                    setPaused(true);
                    setPhase('finish');
                  }}
                  className="flex-1 py-3 rounded-xl font-bold text-sm text-white"
                  style={{ background: '#10B981' }}
                >
                  ✓ Encerrar
                </button>
              </div>
              <button
                onClick={() => setMinimized(true)}
                className="text-[11px]"
                style={{ color: 'var(--text-dim)' }}
              >
                ↓ Minimizar e continuar estudando
              </button>
            </div>
          )}

          {/* ══ FINISH ═════════════════════════════════════════ */}
          {phase === 'finish' && (
            <div className="p-5 space-y-5 max-h-[84vh] overflow-y-auto">
              {/* resumo */}
              <div
                className="flex items-center justify-between p-4 rounded-xl border"
                style={{
                  background: 'var(--bg-surface-2)',
                  borderColor: 'var(--border)',
                }}
              >
                <div>
                  <div
                    className="text-[10px] font-bold uppercase tracking-widest"
                    style={{ color: 'var(--text-dim)' }}
                  >
                    Tempo registrado
                  </div>
                  <div
                    className="text-2xl font-black"
                    style={{ color: 'var(--text-main)' }}
                  >
                    {formatMinutes(Math.floor(elapsed / 60))}
                  </div>
                </div>
                <div className="text-right">
                  <div
                    className="text-[10px] font-bold uppercase tracking-widest"
                    style={{ color: 'var(--text-dim)' }}
                  >
                    Matéria
                  </div>
                  <div
                    className="text-sm font-bold"
                    style={{ color: accentSafe }}
                  >
                    {subject?.name}
                  </div>
                  {subtopic && (
                    <div
                      className="text-xs"
                      style={{ color: 'var(--text-dim)' }}
                    >
                      {subtopic.name}
                    </div>
                  )}
                </div>
              </div>

              {revisionId && (
                <div>
                  <Label>Como foi essa revisão?</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { val: 1, label: '😓 Difícil', color: '#EF4444' },
                      { val: 3, label: '😐 Médio', color: '#F59E0B' },
                      { val: 5, label: '😄 Fácil', color: '#10B981' },
                    ].map(opt => (
                      <button
                        key={opt.val}
                        onClick={() => setRevisionScore(opt.val)}
                        className="py-2.5 rounded-xl border text-xs font-bold transition-all"
                        style={{
                          borderColor:
                            revisionScore === opt.val
                              ? opt.color
                              : 'var(--border)',
                          background:
                            revisionScore === opt.val
                              ? `${opt.color}18`
                              : 'transparent',
                          color:
                            revisionScore === opt.val
                              ? opt.color
                              : 'var(--text-muted)',
                        }}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  <p
                    className="text-[10px] mt-1.5"
                    style={{ color: 'var(--text-dim)' }}
                  >
                    Difícil repete em breve · Médio antecipa um pouco · Fácil
                    segue o intervalo normal.
                  </p>
                </div>
              )}

              {/* modos — checkboxes múltiplos */}
              <div>
                <Label>
                  O que você fez nesta sessão? (marque todos que se aplicam)
                </Label>
                <div className="grid grid-cols-3 gap-2">
                  {MODES.map(m => {
                    const active = has(m.id);
                    return (
                      <button
                        key={m.id}
                        onClick={() => toggleMode(m.id)}
                        className="flex items-center gap-2 px-2.5 py-2 rounded-xl border text-xs font-medium transition-all text-left"
                        style={{
                          borderColor: active ? m.color : 'var(--border)',
                          background: active
                            ? `${m.color}18`
                            : 'var(--bg-surface-2)',
                          color: active ? m.color : 'var(--text-muted)',
                        }}
                      >
                        <div
                          className="w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-all"
                          style={{
                            borderColor: active ? m.color : 'var(--border)',
                            background: active ? m.color : 'transparent',
                          }}
                        >
                          {active && (
                            <span className="text-white text-[9px] font-black">
                              ✓
                            </span>
                          )}
                        </div>
                        <span>
                          {m.icon} {m.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ── campos condicionais ── */}

              {/* questões */}
              {has('questoes') && (
                <div
                  className="p-4 rounded-xl border space-y-3"
                  style={{ borderColor: '#10B98133', background: '#10B98108' }}
                >
                  <div
                    className="text-xs font-bold"
                    style={{ color: '#10B981' }}
                  >
                    🎯 Desempenho nas questões
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div
                        className="text-[10px] mb-1"
                        style={{ color: 'var(--text-dim)' }}
                      >
                        Total respondidas
                      </div>
                      <NI
                        placeholder="Ex: 20"
                        value={qAnswered}
                        onChange={setQAnswered}
                      />
                    </div>
                    <div>
                      <div
                        className="text-[10px] mb-1"
                        style={{ color: 'var(--text-dim)' }}
                      >
                        Acertos
                      </div>
                      <NI
                        placeholder="Ex: 16"
                        value={qCorrect}
                        onChange={setQCorrect}
                      />
                    </div>
                  </div>
                  {qAnswered && qCorrect && Number(qAnswered) > 0 && (
                    <div
                      className="text-center text-sm font-black py-1.5 rounded-lg"
                      style={{
                        color:
                          Number(qCorrect) / Number(qAnswered) >= 0.7
                            ? '#10B981'
                            : '#F59E0B',
                        background:
                          Number(qCorrect) / Number(qAnswered) >= 0.7
                            ? '#10B98115'
                            : '#F59E0B15',
                      }}
                    >
                      {Math.round((Number(qCorrect) / Number(qAnswered)) * 100)}
                      % de acerto
                    </div>
                  )}
                  <div>
                    <div
                      className="text-[10px] mb-1"
                      style={{ color: 'var(--text-dim)' }}
                    >
                      O que você errou ou confundiu? (diagnóstico de gaps)
                    </div>
                    <TA
                      placeholder="Ex: confundi prazo de 5 dias com 15 em licitação dispensada..."
                      value={gaps}
                      onChange={setGaps}
                    />
                  </div>
                </div>
              )}

              {/* vídeo */}
              {has('video') && (
                <div
                  className="p-4 rounded-xl border space-y-2"
                  style={{ borderColor: '#8B5CF633', background: '#8B5CF608' }}
                >
                  <div
                    className="text-xs font-bold"
                    style={{ color: '#8B5CF6' }}
                  >
                    ▶️ Aulas assistidas
                  </div>
                  <NI
                    placeholder="Quantos minutos de videoaula?"
                    value={videoMin}
                    onChange={setVideoMin}
                  />
                </div>
              )}

              {/* feynman */}
              {has('feynman') && (
                <div
                  className="p-4 rounded-xl border space-y-2"
                  style={{ borderColor: '#EC489933', background: '#EC489908' }}
                >
                  <div
                    className="text-xs font-bold"
                    style={{ color: '#EC4899' }}
                  >
                    🧠 Técnica Feynman
                  </div>
                  <div
                    className="text-[10px]"
                    style={{ color: 'var(--text-dim)' }}
                  >
                    Explique o conteúdo com suas próprias palavras, como se
                    estivesse ensinando alguém do zero.
                  </div>
                  <TA
                    placeholder="Ex: licitação dispensada é quando o valor é tão pequeno que o custo de licitar superaria o benefício..."
                    value={feynmanNote}
                    onChange={setFeynmanNote}
                    rows={3}
                  />
                </div>
              )}

              {/* recall ativo */}
              {has('recall') && (
                <div
                  className="p-4 rounded-xl border space-y-3"
                  style={{ borderColor: '#F9741633', background: '#F9741608' }}
                >
                  <div
                    className="text-xs font-bold"
                    style={{ color: '#F97316' }}
                  >
                    ⚡ Recall Ativo
                  </div>
                  <WarnBox>
                    O esforço de lembrar sem consultar o material é o que fixa a
                    memória — não a releitura.
                  </WarnBox>
                  <div>
                    <div
                      className="text-[10px] mb-1"
                      style={{ color: 'var(--text-dim)' }}
                    >
                      O que você conseguiu evocar (sem olhar)?
                    </div>
                    <TA
                      placeholder="Liste os pontos que você lembrou..."
                      value={recallText}
                      onChange={setRecallText}
                    />
                  </div>
                  <div>
                    <div
                      className="text-[10px] mb-1"
                      style={{ color: 'var(--text-dim)' }}
                    >
                      O que você não lembrou / esqueceu?
                    </div>
                    <TA
                      placeholder="Esses são seus gaps — foco nas próximas sessões..."
                      value={recallMissed}
                      onChange={setRecallMissed}
                    />
                  </div>
                </div>
              )}

              {/* mpa */}
              {has('mpa') && (
                <div
                  className="p-4 rounded-xl border space-y-2"
                  style={{ borderColor: '#A855F733', background: '#A855F708' }}
                >
                  <div
                    className="text-xs font-bold"
                    style={{ color: '#A855F7' }}
                  >
                    🔗 Âncora MPA criada
                  </div>
                  <div
                    className="text-[10px]"
                    style={{ color: 'var(--text-dim)' }}
                  >
                    Descreva a associação que você criou (sigla, história,
                    imagem mental, analogia).
                  </div>
                  <TA
                    placeholder="Ex: LIMPE = Legalidade, Impessoalidade, Moralidade, Publicidade, Eficiência. Lembro da 'limpa da administração'..."
                    value={anchor}
                    onChange={setAnchor}
                  />
                </div>
              )}

              {/* ── sempre presentes ── */}

              {/* conexão — ordem superior */}
              <div>
                <Label>
                  Como isso se conecta com o que você já sabe?{' '}
                  <span
                    style={{
                      textTransform: 'none',
                      fontSize: '9px',
                      letterSpacing: 0,
                      color: 'var(--text-dim)',
                    }}
                  >
                    (opcional — +5 XP)
                  </span>
                </Label>
                <TA
                  placeholder="Ex: parecido com dispensa em licitação internacional que vimos na semana passada..."
                  value={connection}
                  onChange={setConnection}
                />
                {connection.trim() && (
                  <div
                    className="text-[10px] mt-1 font-medium"
                    style={{ color: '#8B5CF6' }}
                  >
                    +5 XP — pensamento de ordem superior ativo
                  </div>
                )}
              </div>

              {/* insegurança — reconhecer ≠ lembrar */}
              <div>
                <Label>
                  Ficou com dúvida em algo, mesmo acertando?{' '}
                  <span
                    style={{
                      textTransform: 'none',
                      fontSize: '9px',
                      letterSpacing: 0,
                      color: 'var(--text-dim)',
                    }}
                  >
                    (opcional)
                  </span>
                </Label>
                <WarnBox>
                  Insegurança = lacuna real. Registrar aqui é o que separa os
                  70% dos 90%.
                </WarnBox>
                <div className="mt-2">
                  <TA
                    placeholder="Ex: não tenho certeza se prazo para impugnar edital é 5 ou 3 dias úteis..."
                    value={insecurity}
                    onChange={setInsecurity}
                  />
                </div>
              </div>

              {/* status do subtópico */}
              {subtopicId && (
                <div className="space-y-3">
                  <div>
                    <Label>Concluiu esta aula?</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { val: true, label: '✓ Dominei', color: '#10B981' },
                        {
                          val: false,
                          label: 'Ainda estudando',
                          color: '#F59E0B',
                        },
                      ].map(opt => (
                        <button
                          key={String(opt.val)}
                          onClick={() => setConcluded(opt.val)}
                          className="py-2.5 rounded-xl border text-xs font-bold transition-all"
                          style={{
                            borderColor:
                              concluded === opt.val
                                ? opt.color
                                : 'var(--border)',
                            background:
                              concluded === opt.val
                                ? `${opt.color}18`
                                : 'transparent',
                            color:
                              concluded === opt.val
                                ? opt.color
                                : 'var(--text-muted)',
                          }}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  {!revisionId && (
                    <Toggle
                      on={generateRev}
                      onChange={setGenerateRev}
                      accent={accentSafe}
                      label="Gerar revisão automática (R1)"
                      sub="Agenda revisão para amanhã"
                    />
                  )}
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <button
                  onClick={() => {
                    setPhase('running');
                    setPaused(true);
                  }}
                  className="px-4 py-3 rounded-xl border text-sm font-bold hover:bg-white/5 transition-all"
                  style={{
                    borderColor: 'var(--border)',
                    color: 'var(--text-muted)',
                  }}
                >
                  ← Voltar
                </button>
                <button
                  onClick={handleSave}
                  className="flex-1 py-3 rounded-xl font-bold text-sm text-white hover:opacity-90 transition-opacity"
                  style={{ background: '#10B981' }}
                >
                  💾 Salvar sessão
                </button>
              </div>
            </div>
          )}

          {/* ══ RESULT ═════════════════════════════════════════ */}
          {phase === 'result' && result && (
            <div className="p-6 text-center space-y-4">
              <div className="text-4xl">🏆</div>
              <div>
                <div
                  className="text-xl font-black"
                  style={{ color: 'var(--text-main)' }}
                >
                  Sessão salva!
                </div>
                <div
                  className="text-xs font-bold uppercase tracking-widest mt-1"
                  style={{ color: result.subjectColor || 'var(--primary)' }}
                >
                  {result.subjectName}
                </div>
                {result.revisionCompleted && (
                  <div
                    className="inline-flex items-center gap-1 mt-2 px-2.5 py-1 rounded-full text-[10px] font-bold"
                    style={{ background: '#06B6D418', color: '#06B6D4' }}
                  >
                    🔁 Revisão concluída — próxima já agendada
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div
                  className="p-4 rounded-xl border"
                  style={{
                    background: 'var(--bg-surface-2)',
                    borderColor: 'var(--border)',
                  }}
                >
                  <div
                    className="text-2xl font-black"
                    style={{ color: 'var(--text-main)' }}
                  >
                    {formatMinutes(result.mins)}
                  </div>
                  <div
                    className="text-[10px] font-bold uppercase tracking-widest mt-1"
                    style={{ color: 'var(--text-dim)' }}
                  >
                    Tempo
                  </div>
                </div>
                <div
                  className="p-4 rounded-xl border"
                  style={{
                    background: 'var(--bg-surface-2)',
                    borderColor: 'var(--border)',
                  }}
                >
                  <div
                    className="text-2xl font-black"
                    style={{ color: 'var(--accent)' }}
                  >
                    +{result.xpEarned}
                  </div>
                  <div
                    className="text-[10px] font-bold uppercase tracking-widest mt-1"
                    style={{ color: 'var(--text-dim)' }}
                  >
                    XP
                  </div>
                </div>
              </div>
              {result.acc !== null && (
                <div
                  className="p-3 rounded-xl border"
                  style={{
                    background: result.acc >= 70 ? '#10B98115' : '#F59E0B15',
                    borderColor: result.acc >= 70 ? '#10B98144' : '#F59E0B44',
                  }}
                >
                  <div
                    className="font-black text-lg"
                    style={{ color: result.acc >= 70 ? '#10B981' : '#F59E0B' }}
                  >
                    {result.qC}/{result.qA} ({result.acc}%)
                  </div>
                  <div
                    className="text-[10px] uppercase tracking-widest"
                    style={{ color: 'var(--text-dim)' }}
                  >
                    acerto nas questões
                  </div>
                </div>
              )}
              {result.badges?.length > 0 && (
                <div className="flex flex-wrap justify-center gap-2">
                  {result.badges.map(b => (
                    <div
                      key={b.label}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold"
                      style={{
                        background: `${b.color}18`,
                        color: b.color,
                        border: `1px solid ${b.color}33`,
                      }}
                    >
                      {b.label} +{b.xp} XP
                    </div>
                  ))}
                </div>
              )}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    onClose();
                    setPhase('setup');
                  }}
                  className="flex-1 py-3 rounded-xl border text-sm font-bold"
                  style={{
                    borderColor: 'var(--border)',
                    color: 'var(--text-muted)',
                  }}
                >
                  Fechar
                </button>
                <button
                  onClick={() => {
                    setPhase('setup');
                    setSubjectId('');
                    setTopicId('');
                    setSubtopicId('');
                    setElapsed(0);
                    resetFinish();
                    setResult(null);
                  }}
                  className="flex-1 py-3 rounded-xl text-sm font-bold text-white"
                  style={{ background: 'var(--primary)' }}
                >
                  Nova sessão
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
