import { useState, useMemo, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuestionsStore } from '../../../stores/useQuestionsStore';
import { useStudyStore } from '../../../stores/useStudyStore';
import { useGameStore, XP_RULES } from '../../../stores/useGameStore';
import { usePersonaStore } from '../../../stores/usePersonaStore';
import toast from 'react-hot-toast';
import { StudyLayout } from '../components/StudyLayout';
import { BentoCard, SectionHeader, Badge } from '../components/BentoCard';

const today = () => new Date().toISOString().slice(0, 10);
const fmtTimer = sec => `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`;

const DIFF = { facil: { label: 'Fácil', color: '#10B981' }, medio: { label: 'Médio', color: '#F59E0B' }, dificil: { label: 'Difícil', color: '#EF4444' } };
const STATUS_OPTS = [{ key: 'all', label: 'Todas' }, { key: 'unresolved', label: 'Não Resolvidas' }, { key: 'correct', label: 'Acertei' }, { key: 'wrong', label: 'Errei' }];
const COLORS = ['#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#06B6D4', '#EC4899', '#F97316', '#14B8A6', '#A855F7'];
const inp = { background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)', color: 'var(--text-main)' };
const chipS = (active, c) => ({ borderColor: active ? (c || 'var(--primary)') : 'rgba(255,255,255,0.08)', background: active ? `${c || 'var(--primary)'}18` : 'transparent', color: active ? (c || 'var(--primary)') : 'var(--text-dim)' });

// ── MultiSelect ─────────────────────────────────────────────────────────

function MultiSelect({ label, options, selected, onChange, icon }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef(null);
  useEffect(() => { if (!open) return; const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }; document.addEventListener('mousedown', h); return () => document.removeEventListener('mousedown', h); }, [open]);
  const safe = a => Array.isArray(a) ? a : [];
  const filtered = safe(options).filter(o => o.name.toLowerCase().includes(search.toLowerCase()));
  const count = safe(selected).length;
  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(!open)} className="flex items-center gap-2 px-3 py-2 rounded-xl text-[11px] font-bold border backdrop-blur-sm transition-all"
        style={{ ...inp, borderColor: count > 0 ? 'var(--primary)' : 'rgba(255,255,255,0.08)', color: count > 0 ? 'var(--primary)' : 'var(--text-dim)' }}>
        {icon && <span className="text-xs">{icon}</span>}<span>{label}</span>
        {count > 0 && <span className="px-1.5 py-0.5 rounded-full text-[9px] text-white font-black" style={{ background: 'var(--primary)' }}>{count}</span>}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="absolute z-50 mt-1 w-full max-w-64 rounded-2xl border overflow-hidden backdrop-blur-2xl"
            style={{ background: 'rgba(15,15,20,0.95)', borderColor: 'rgba(255,255,255,0.1)', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
            <div className="p-2 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar..." className="w-full px-2 py-1.5 rounded-lg text-xs border outline-none" style={inp} autoFocus />
            </div>
            <div className="max-h-48 overflow-y-auto custom-scrollbar">
              {filtered.length === 0 && <p className="text-xs text-center py-3" style={{ color: 'var(--text-dim)' }}>Nenhum resultado</p>}
              {filtered.map(o => {
                const sel = safe(selected).includes(o.name);
                return (
                  <button key={o.name} onClick={() => onChange(sel ? safe(selected).filter(s => s !== o.name) : [...safe(selected), o.name])}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-white/5 transition-colors text-left" style={{ color: 'var(--text-main)' }}>
                    <span className="w-4 h-4 rounded-md border flex items-center justify-center shrink-0"
                      style={{ borderColor: sel ? 'var(--primary)' : 'rgba(255,255,255,0.12)', background: sel ? 'var(--primary)' : 'transparent' }}>
                      {sel && <span className="text-white text-[9px] font-bold">✓</span>}
                    </span>
                    <span className="flex-1 truncate">{o.name}</span>
                    <span className="text-[9px] font-bold" style={{ color: 'var(--text-dim)' }}>{o.count}</span>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── PracticeMode ────────────────────────────────────────────────────────

function PracticeMode({ questions, onExit }) {
  const answerQuestion = useQuestionsStore(s => s.answerQuestion);
  const updateSubtopicStats = useStudyStore(s => s.updateSubtopicStats);
  const subjects = useStudyStore(s => s.subjects);
  const { dispatchXP } = useGameStore();
  const activePersonaId = usePersonaStore(s => s.activePersonaId);
  const addPersonaXP = usePersonaStore(s => s.addPersonaXP);

  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const [results, setResults] = useState([]);
  const [timerOn, setTimerOn] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [discarded, setDiscarded] = useState(new Set());
  const [highlights, setHighlights] = useState([]);
  const [showToolbar, setShowToolbar] = useState(false);
  const [toolbarPos, setToolbarPos] = useState({ x: 0, y: 0 });
  const enunciadoRef = useRef(null);
  const pendingSel = useRef(null);
  const q = questions[idx];
  const subject = subjects.find(s => s.id === q?.subjectId);

  useEffect(() => { if (!timerOn) return; const id = setInterval(() => setElapsed(e => e + 1), 1000); return () => clearInterval(id); }, [timerOn]);
  useEffect(() => { if (!showToolbar) return; const h = e => { if (!e.target.closest('[data-hl]')) { setShowToolbar(false); pendingSel.current = null; } }; document.addEventListener('mousedown', h); return () => document.removeEventListener('mousedown', h); }, [showToolbar]);

  const toggleDiscard = letter => { if (revealed) return; setDiscarded(prev => { const n = new Set(prev); n.has(letter) ? n.delete(letter) : n.add(letter); return n; }); if (selected === letter) setSelected(null); };
  const pick = letter => { if (!revealed && !discarded.has(letter)) setSelected(letter); };

  function handleMouseUp() {
    const sel = window.getSelection(); if (!sel || sel.isCollapsed || !enunciadoRef.current) return;
    const range = sel.getRangeAt(0); if (!enunciadoRef.current.contains(range.commonAncestorContainer)) return;
    const pre = document.createRange(); pre.selectNodeContents(enunciadoRef.current); pre.setEnd(range.startContainer, range.startOffset);
    const start = pre.toString().length, end = start + sel.toString().length; if (start === end) return;
    pendingSel.current = { start, end };
    const r = range.getBoundingClientRect(), cr = enunciadoRef.current.getBoundingClientRect();
    setToolbarPos({ x: r.left + r.width / 2, y: cr.top - 8 }); setShowToolbar(true);
  }

  function addHL() {
    if (!pendingSel.current) return; const { start, end } = pendingSel.current;
    if (!highlights.some(h => start >= h.start && end <= h.end)) setHighlights(p => [...p, { start, end }]);
    pendingSel.current = null; setShowToolbar(false); window.getSelection()?.removeAllRanges();
  }

  function renderHL(text, hls) {
    if (!hls.length) return text;
    const sorted = [...hls].sort((a, b) => a.start - b.start); const parts = []; let last = 0;
    for (const h of sorted) { if (h.start > last) parts.push({ t: text.slice(last, h.start), hl: false }); parts.push({ t: text.slice(h.start, h.end), hl: true }); last = h.end; }
    if (last < text.length) parts.push({ t: text.slice(last), hl: false });
    return parts.map((p, i) => p.hl ? <span key={i} style={{ background: 'rgba(250,204,21,0.3)', borderRadius: 3, padding: '0 2px' }}>{p.t}</span> : <span key={i}>{p.t}</span>);
  }

  function confirm() {
    if (!selected) return; const { correct } = answerQuestion(q.id, selected) || {};
    setResults(r => [...r, { questionId: q.id, correct, question: q }]); setRevealed(true);
    // Gaps/insecurities tracking removed
  }

  function next() {
    if (idx < questions.length - 1) { setIdx(i => i + 1); setSelected(null); setRevealed(false); setDiscarded(new Set()); setHighlights([]); setShowToolbar(false); }
    else { const totalCorrect = results.filter(r => r.correct).length; const xp = totalCorrect * (XP_RULES.QUESTION_CORRECT?.xp || 2);
      if (xp > 0) { dispatchXP('study', xp, 'sabedoria', false, 'conhecimento'); if (activePersonaId) addPersonaXP(activePersonaId, xp); }
      const g = {}; results.forEach(r => { if (r.question?.subjectId && r.question?.topicId && r.question?.subtopicId) {
        const k = `${r.question.subjectId}|${r.question.topicId}|${r.question.subtopicId}`;
        if (!g[k]) g[k] = { qA: 0, qC: 0 }; g[k].qA++; if (r.correct) g[k].qC++; } });
      Object.entries(g).forEach(([k, s]) => { const [sid, tid, stid] = k.split('|'); updateSubtopicStats(sid, tid, stid, { qC: s.qC, qA: s.qA }); });
      onExit({ total: results.length, correct: totalCorrect, xpEarned: xp });
    }
  }

  if (!q) return null;
  const accent = subject?.color || 'var(--primary)'; const pct = Math.round((idx / questions.length) * 100);

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border backdrop-blur-xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)' }}>
        <div className="flex items-center justify-between px-5 pt-4 pb-3">
          <button onClick={() => onExit(null)} className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-red-500/10 transition-colors" style={{ color: 'var(--text-dim)' }}>← Sair</button>
          <div className="flex items-center gap-4">
            <div className="flex items-baseline gap-1"><span className="text-2xl font-black" style={{ color: accent }}>{idx + 1}</span><span className="text-sm font-bold" style={{ color: 'var(--text-dim)' }}>/ {questions.length}</span></div>
            <div className="w-px h-6" style={{ background: 'rgba(255,255,255,0.08)' }} />
            <button onClick={() => setTimerOn(t => !t)} className="flex items-center gap-1.5 text-xs font-bold px-2.5 py-1.5 rounded-lg transition-all" style={{ color: timerOn ? accent : 'var(--text-dim)', background: timerOn ? `${accent}15` : 'transparent' }}>
              {timerOn ? '⏸' : '⏱'} {timerOn && <span className="font-mono">{fmtTimer(elapsed)}</span>}
            </button>
            {subject && <Badge color={accent} variant="solid">{subject.name}</Badge>}
          </div>
        </div>
        <div className="px-5 pb-4"><div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
          <motion.div className="h-full rounded-full" initial={{ width: 0 }} animate={{ width: `${pct}%` }} style={{ background: `linear-gradient(90deg, ${accent}, var(--primary))` }} /></div></div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-2xl border backdrop-blur-xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)' }}>
        <div className="p-5 pb-3">
          <div className="flex items-center gap-2 flex-wrap mb-3">
            <Badge color={accent} variant="solid">{q.materia}</Badge>
            {q.topico && <Badge>{q.topico}</Badge>}
            {q.banca && <Badge>{q.banca}{q.ano ? `/${q.ano}` : ''}</Badge>}
            {DIFF[q.dificuldade] && <Badge color={DIFF[q.dificuldade].color} variant="solid">{DIFF[q.dificuldade].label}</Badge>}
          </div>
          <div ref={enunciadoRef} onMouseUp={handleMouseUp} className="text-sm" style={{ color: 'var(--text-main)', lineHeight: 1.8, userSelect: 'text', cursor: 'text' }}>{renderHL(q.enunciado, highlights)}</div>
        </div>
        <div className="px-5 pb-5 space-y-2">
          {q.alternativas.map((alt, i) => {
            const letter = alt.trim()[0], isSel = selected === letter, isCorr = letter === q.gabarito, isDisc = discarded.has(letter);
            let s = { borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)', color: 'var(--text-main)' };
            if (isDisc && !revealed) s = { ...s, borderColor: 'rgba(255,255,255,0.03)', background: 'rgba(255,255,255,0.01)', color: 'var(--text-dim)', opacity: 0.4, borderLeftColor: '#EF4444' };
            else if (revealed && isCorr) s = { ...s, borderColor: 'rgba(16,185,129,0.3)', background: 'rgba(16,185,129,0.08)', color: '#10B981', borderLeftColor: '#10B981' };
            else if (revealed && isSel) s = { ...s, borderColor: 'rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.08)', color: '#EF4444', borderLeftColor: '#EF4444' };
            else if (isSel) s = { borderColor: accent, background: `${accent}15`, color: accent };
            return (
              <div key={i} className="relative group">
                <button onClick={() => isDisc ? toggleDiscard(letter) : pick(letter)} disabled={revealed} className="w-full text-left px-4 py-3.5 rounded-xl border text-sm transition-all duration-200 disabled:cursor-default backdrop-blur-sm" style={s}>
                  <div className="flex items-start gap-3">
                    <span className="shrink-0 w-8 h-8 lg:w-6 lg:h-6 rounded-lg flex items-center justify-center text-[10px] font-black mt-0.5"
                      style={{ background: isDisc && !revealed ? 'transparent' : isSel ? `${accent}30` : 'rgba(255,255,255,0.04)', color: isDisc && !revealed ? 'var(--text-dim)' : isSel ? accent : 'var(--text-dim)', border: isDisc && !revealed ? '1.5px dashed #EF4444' : '1px solid rgba(255,255,255,0.06)' }}>
                      {isDisc && !revealed ? '✕' : letter}
                    </span>
                    <span className="flex-1" style={{ textDecoration: isDisc && !revealed ? 'line-through' : 'none', fontWeight: isSel && !revealed ? 600 : 400 }}>{alt}</span>
                    {revealed && isCorr && <span className="text-sm font-bold">✓</span>}
                  </div>
                </button>
                {!revealed && <button onClick={e => { e.stopPropagation(); toggleDiscard(letter); }} className="absolute top-2 right-2 w-9 h-9 lg:w-6 lg:h-6 rounded-lg flex items-center justify-center text-[10px] font-bold transition-all md:opacity-0 md:group-hover:opacity-100" style={{ color: isDisc ? '#EF4444' : 'var(--text-dim)', background: isDisc ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.04)' }}>{isDisc ? '↩' : '✕'}</button>}
              </div>
            );
          })}
        </div>
        <AnimatePresence>{revealed && q.explicacao && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="mx-5 mb-5 p-4 rounded-xl text-xs backdrop-blur-sm" style={{ background: 'rgba(139,92,246,0.08)', borderLeft: '3px solid #8B5CF6', color: 'var(--text-muted)', lineHeight: 1.7 }}>
            <span className="font-bold" style={{ color: '#8B5CF6' }}>💡 Explicação:</span> {q.explicacao}
          </motion.div>
        )}</AnimatePresence>
      </motion.div>

      <div className="flex gap-3">
        {!revealed ? (
          <button onClick={confirm} disabled={!selected} className="w-full py-3.5 rounded-xl font-bold text-sm text-white disabled:opacity-30 transition-all"
            style={{ background: selected ? `linear-gradient(135deg, ${accent}, var(--primary))` : 'rgba(255,255,255,0.04)', boxShadow: selected ? `0 4px 20px ${accent}30` : 'none' }}>Confirmar</button>
        ) : (
          <button onClick={next} className="w-full py-3.5 rounded-xl font-bold text-sm text-white"
            style={{ background: 'linear-gradient(135deg, #10B981, #059669)', boxShadow: '0 4px 20px rgba(16,185,129,0.3)' }}>
            {idx < questions.length - 1 ? 'Próxima →' : 'Finalizar →'}
          </button>
        )}
      </div>

      {showToolbar && (
        <div data-hl className="fixed z-[200] flex items-center gap-1 px-2 py-1.5 rounded-xl border shadow-lg backdrop-blur-xl"
          style={{ left: toolbarPos.x, top: toolbarPos.y, transform: 'translate(-50%, -100%)', background: 'rgba(15,15,20,0.9)', borderColor: 'rgba(255,255,255,0.1)' }}>
          <button onClick={addHL} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold hover:bg-yellow-500/20 transition-colors" style={{ color: 'var(--text-main)' }}>🖊 Marcar</button>
          <button onClick={() => { setShowToolbar(false); pendingSel.current = null; window.getSelection()?.removeAllRanges(); }} className="px-1.5 py-1.5 rounded-lg text-[11px] font-bold hover:text-red-400 transition-colors" style={{ color: 'var(--text-dim)' }}>✕</button>
        </div>
      )}
    </div>
  );
}

// ── ResultScreen ────────────────────────────────────────────────────────

function ResultScreen({ result, onClose }) {
  const acc = result.total > 0 ? Math.round((result.correct / result.total) * 100) : 0;
  return (
    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center py-12 gap-5 max-w-md mx-auto text-center">
      <div className="text-6xl">{acc >= 70 ? '🏆' : '📚'}</div>
      <div className="text-2xl font-black" style={{ color: 'var(--text-main)' }}>{result.correct}/{result.total} acertos</div>
      <div className="text-4xl font-black" style={{ color: acc >= 70 ? '#10B981' : 'var(--primary)' }}>{acc}%</div>
      {result.xpEarned > 0 && <div className="text-sm font-bold" style={{ color: 'var(--primary)' }}>+{result.xpEarned} XP</div>}
      <button onClick={onClose} className="mt-4 px-8 py-3 rounded-xl font-bold text-sm text-white" style={{ background: 'var(--primary)' }}>Voltar</button>
    </motion.div>
  );
}

// ── Modals ──────────────────────────────────────────────────────────────

function Modal({ children, onClose }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-sm rounded-2xl border backdrop-blur-xl overflow-hidden max-h-[80vh] flex flex-col" style={{ background: 'rgba(15,15,20,0.95)', borderColor: 'rgba(255,255,255,0.08)' }}>
        {children}
      </motion.div>
    </div>
  );
}

function SaveCadernoModal({ filters, folders, onSave, onClose }) {
  const [name, setName] = useState(''); const [folderId, setFolderId] = useState(null);
  return (
    <Modal onClose={onClose}>
      <div className="p-5 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}><h3 className="text-sm font-bold" style={{ color: 'var(--text-main)' }}>Salvar Caderno</h3></div>
      <div className="p-5 space-y-4">
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Nome do caderno" className="w-full px-3 py-2.5 rounded-xl text-sm border outline-none" style={inp} autoFocus />
        <select value={folderId || ''} onChange={e => setFolderId(e.target.value || null)} className="w-full px-3 py-2.5 rounded-xl text-sm border outline-none" style={inp}>
          <option value="">Sem pasta</option>{folders.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
        </select>
        <div className="text-[10px] px-3 py-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)', color: 'var(--text-dim)' }}>
          {Object.entries(filters).filter(([, v]) => Array.isArray(v) ? v.length > 0 : !!v).map(([k, v]) => <span key={k} className="inline-block mr-2 mb-1">{k}: {Array.isArray(v) ? v.join(', ') : v}</span>)}
        </div>
      </div>
      <div className="flex gap-3 p-5 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-xs font-bold border" style={{ borderColor: 'rgba(255,255,255,0.08)', color: 'var(--text-dim)' }}>Cancelar</button>
        <button onClick={() => { if (!name.trim()) { toast.error('Digite um nome'); return; } onSave(name.trim(), filters, folderId); onClose(); }} className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white" style={{ background: 'var(--primary)' }}>Salvar</button>
      </div>
    </Modal>
  );
}

function CadernoManagerModal({ cadernos, folders, onLoad, onDelete, onCreateFolder, onDeleteFolder, onClose }) {
  const [newFolderName, setNewFolderName] = useState('');
  const create = () => { if (!newFolderName.trim()) return; onCreateFolder(newFolderName.trim()); setNewFolderName(''); };
  return (
    <Modal onClose={onClose}>
      <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <h3 className="text-sm font-bold" style={{ color: 'var(--text-main)' }}>Cadernos e Pastas</h3>
        <button onClick={onClose} className="text-lg hover:text-white transition-colors" style={{ color: 'var(--text-dim)' }}>×</button>
      </div>
      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        <div className="flex gap-2">
          <input value={newFolderName} onChange={e => setNewFolderName(e.target.value)} placeholder="Nova pasta..." className="flex-1 px-3 py-2 rounded-xl text-xs border outline-none" style={inp} onKeyDown={e => e.key === 'Enter' && create()} />
          <button onClick={create} className="px-3 py-2 rounded-xl text-xs font-bold text-white" style={{ background: 'var(--primary)' }}>+ Pasta</button>
        </div>
        {folders.map(f => (
          <div key={f.id}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-md" style={{ background: f.color }} /><span className="text-xs font-bold" style={{ color: 'var(--text-main)' }}>{f.name}</span></div>
              <button onClick={() => onDeleteFolder(f.id)} className="text-[10px] hover:text-red-400 transition-colors" style={{ color: 'var(--text-dim)' }}>×</button>
            </div>
            {cadernos.filter(c => c.folderId === f.id).map(c => (
              <div key={c.id} className="flex items-center gap-2 ml-5 mb-1 p-2 rounded-lg hover:bg-white/5 cursor-pointer" onClick={() => { onLoad(c.filters); onClose(); }}>
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{c.name}</span>
                <button onClick={e => { e.stopPropagation(); onDelete(c.id); }} className="text-[10px] ml-auto hover:text-red-400 transition-colors" style={{ color: 'var(--text-dim)' }}>×</button>
              </div>
            ))}
          </div>
        ))}
        {cadernos.filter(c => !c.folderId).length > 0 && <div><span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-dim)' }}>Sem pasta</span>{cadernos.filter(c => !c.folderId).map(c => <div key={c.id} className="flex items-center gap-2 mt-2 p-2 rounded-lg hover:bg-white/5 cursor-pointer" onClick={() => { onLoad(c.filters); onClose(); }}><span className="text-xs" style={{ color: 'var(--text-muted)' }}>{c.name}</span><button onClick={e => { e.stopPropagation(); onDelete(c.id); }} className="text-[10px] ml-auto hover:text-red-400 transition-colors" style={{ color: 'var(--text-dim)' }}>×</button></div>)}</div>}
        {cadernos.length === 0 && <p className="text-xs text-center py-4" style={{ color: 'var(--text-dim)' }}>Nenhum caderno salvo</p>}
      </div>
    </Modal>
  );
}

// ── PendingQuestionsTab ────────────────────────────────────────────────────

function PendingTab({ questions, subjects, addSubject, linkQuestionsToSubjects, applySubjectLinks }) {
  const [selIds, setSelIds] = useState(new Set());
  const [linkTarget, setLinkTarget] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState('');
  const pending = useMemo(() => questions.filter(q => !q.subjectId), [questions]);
  const grouped = useMemo(() => { const m = {}; pending.forEach(q => { const k = q.materia || 'Sem matéria'; if (!m[k]) m[k] = []; m[k].push(q); }); return Object.entries(m).sort((a, b) => b[1].length - a[1].length); }, [pending]);

  const toggle = id => setSelIds(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const selectAll = mat => { const ids = pending.filter(q => (q.materia || 'Sem matéria') === mat).map(q => q.id); setSelIds(p => { const n = new Set(p); const all = ids.every(id => n.has(id)); ids.forEach(id => all ? n.delete(id) : n.add(id)); return n; }); };

  const handleLink = () => { if (!linkTarget || !selIds.size) return; const u = {}; selIds.forEach(id => { u[id] = linkTarget; }); useQuestionsStore.setState(s => ({ questions: s.questions.map(q => u[q.id] ? { ...q, subjectId: u[q.id] } : q) })); setSelIds(new Set()); toast.success(`${selIds.size} vinculadas`); };
  const handleCreateLink = () => { if (!newName.trim()) return; const nid = addSubject({ name: newName.trim(), color: COLORS[subjects.length % COLORS.length] }); if (nid && selIds.size) { const u = {}; selIds.forEach(id => { u[id] = nid; }); useQuestionsStore.setState(s => ({ questions: s.questions.map(q => u[q.id] ? { ...q, subjectId: u[q.id] } : q) })); toast.success(`${selIds.size} vinculadas a "${newName.trim()}"`); setSelIds(new Set()); setNewName(''); setShowNew(false); } };

  return (
    <div className="space-y-4">
      <BentoCard className="border-red-500/20">
        <div className="flex items-center justify-between">
          <div><h3 className="text-sm font-bold" style={{ color: 'var(--text-main)' }}>⚠️ Questões sem vínculo</h3><p className="text-[11px] mt-1" style={{ color: 'var(--text-dim)' }}>{pending.length} pendentes</p></div>
          {selIds.size > 0 && <Badge color="var(--primary)" variant="solid">{selIds.size} selecionadas</Badge>}
        </div>
      </BentoCard>
      {grouped.length === 0 ? (
        <div className="text-center py-10"><div className="text-4xl mb-3">✅</div><p className="text-sm font-bold" style={{ color: 'var(--text-main)' }}>Tudo vinculado!</p></div>
      ) : (<>
        {selIds.size > 0 && (
          <div className="p-3 rounded-xl border flex flex-wrap items-center gap-2 backdrop-blur-sm" style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(139,92,246,0.2)' }}>
            <span className="text-[10px] font-bold" style={{ color: 'var(--text-dim)' }}>Vincular a:</span>
            <select value={linkTarget} onChange={e => setLinkTarget(e.target.value)} className="px-2 py-1.5 rounded-lg text-[10px] border outline-none" style={{ ...inp, background: 'rgba(255,255,255,0.04)' }}>
              <option value="">Selecione...</option>{subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <button onClick={handleLink} disabled={!linkTarget} className="px-3 py-1.5 rounded-lg text-[10px] font-bold text-white disabled:opacity-30" style={{ background: 'var(--primary)' }}>Vincular</button>
            <button onClick={() => setShowNew(!showNew)} className="px-3 py-1.5 rounded-lg text-[10px] font-bold" style={{ background: 'rgba(16,185,129,0.1)', color: '#10B981' }}>+ Nova</button>
          </div>
        )}
        {showNew && selIds.size > 0 && (
          <div className="p-3 rounded-xl border flex items-center gap-2" style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(16,185,129,0.2)' }}>
            <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Nome da matéria..." className="flex-1 px-2 py-1.5 rounded-lg text-[10px] border outline-none" style={inp} autoFocus onKeyDown={e => e.key === 'Enter' && handleCreateLink()} />
            <button onClick={handleCreateLink} disabled={!newName.trim()} className="px-3 py-1.5 rounded-lg text-[10px] font-bold text-white disabled:opacity-30" style={{ background: '#10B981' }}>Criar e vincular</button>
          </div>
        )}
        {grouped.map(([mat, qs]) => (
          <BentoCard key={mat} padding={false}>
            <button onClick={() => selectAll(mat)} className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/[0.02] transition-all">
              <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full" style={{ background: '#EF4444' }} /><span className="text-xs font-bold" style={{ color: 'var(--text-main)' }}>{mat}</span><Badge color="#EF4444" variant="solid">{qs.length}</Badge></div>
              <span className="text-[10px]" style={{ color: 'var(--text-dim)' }}>{qs.every(q => selIds.has(q.id)) ? '☑' : '☐'} todas</span>
            </button>
            <div className="border-t divide-y" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
              {qs.slice(0, 10).map(q => (
                <button key={q.id} onClick={() => toggle(q.id)} className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-white/[0.02] transition-all">
                  <span className="w-4 h-4 rounded-md border flex items-center justify-center shrink-0 text-[10px]" style={{ borderColor: selIds.has(q.id) ? 'var(--primary)' : 'rgba(255,255,255,0.08)', background: selIds.has(q.id) ? 'var(--primary)' : 'transparent', color: selIds.has(q.id) ? '#fff' : 'transparent' }}>{selIds.has(q.id) && '✓'}</span>
                  <p className="text-[11px] flex-1 truncate" style={{ color: 'var(--text-main)' }}>{q.enunciado.slice(0, 120)}{q.enunciado.length > 120 ? '...' : ''}</p>
                  {q.banca && <Badge>{q.banca}</Badge>}{q.ano && <Badge>{q.ano}</Badge>}
                </button>
              ))}
              {qs.length > 10 && <div className="px-4 py-2 text-center"><span className="text-[10px]" style={{ color: 'var(--text-dim)' }}>+{qs.length - 10} mais</span></div>}
            </div>
          </BentoCard>
        ))}
      </>)}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// ── MAIN ───────────────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════

export default function StudyQuestoesPage() {
  const { materia: urlMateria } = useParams();
  const questions = useQuestionsStore(s => s.questions);
  const answers = useQuestionsStore(s => s.answers);
  const cadernos = useQuestionsStore(s => s.cadernos);
  const folders = useQuestionsStore(s => s.folders);
  const syncFromMago = useQuestionsStore(s => s.syncFromMago);
  const linkQuestionsToSubjects = useQuestionsStore(s => s.linkQuestionsToSubjects);
  const applySubjectLinks = useQuestionsStore(s => s.applySubjectLinks);
  const getFilteredQuestions = useQuestionsStore(s => s.getFilteredQuestions);
  const getAnswerStatus = useQuestionsStore(s => s.getAnswerStatus);
  const getFilterValues = useQuestionsStore(s => s.getFilterValues);
  const createCaderno = useQuestionsStore(s => s.createCaderno);
  const deleteCaderno = useQuestionsStore(s => s.deleteCaderno);
  const createFolder = useQuestionsStore(s => s.createFolder);
  const deleteFolder = useQuestionsStore(s => s.deleteFolder);
  const subjects = useStudyStore(s => s.subjects);
  const addSubject = useStudyStore(s => s.addSubject);
  const findSubjectByName = useStudyStore(s => s.findSubjectByName);
  const backupSubjects = useStudyStore(s => s.backupSubjects);

  const [filters, setFilters] = useState({ materias: [], assuntos: [], bancas: [], anos: [], dificuldades: [], orgaos: [], cargos: [], status: 'all', keyword: '' });
  const [showFilters, setShowFilters] = useState(true);
  const [tab, setTab] = useState('questoes');
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState('');
  const [practiceSubject, setPracticeSubject] = useState(null);
  const [practiceQuestions, setPracticeQuestions] = useState([]);
  const [practiceResult, setPracticeResult] = useState(null);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showCadernoMgr, setShowCadernoMgr] = useState(false);
  const [unmatchedMaterias, setUnmatchedMaterias] = useState([]);
  const [showMergeDropdown, setShowMergeDropdown] = useState(false);
  const mergeRef = useRef(null);
  const hasSynced = useRef(false);

  useEffect(() => { if (!hasSynced.current && questions.length === 0 && !syncing) { hasSynced.current = true; doSync(); } }, [questions.length, syncing]);
  useEffect(() => { if (urlMateria) { setFilters(p => ({ ...p, materias: [decodeURIComponent(urlMateria)] })); setTab('questoes'); } }, [urlMateria]);
  useEffect(() => {
    if (!questions.length) return; const unlinked = questions.filter(q => !q.subjectId); if (!unlinked.length) return;
    const newM = linkQuestionsToSubjects(subjects);
    if (newM.length) {
      setUnmatchedMaterias(newM);
      const m = {}; newM.forEach((n, i) => { m[n] = findSubjectByName(n)?.id || addSubject({ name: n, color: COLORS[i % COLORS.length] }); }); applySubjectLinks(m);
    }
  }, [questions.length]);

  // Close merge dropdown on outside click
  useEffect(() => {
    if (!showMergeDropdown) return;
    const h = e => { if (mergeRef.current && !mergeRef.current.contains(e.target)) setShowMergeDropdown(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [showMergeDropdown]);

  async function doSync() { if (syncing) return; setSyncing(true); setSyncError(''); try { backupSubjects(); const r = await syncFromMago(); if (r.success) toast.success(r.newCount > 0 ? `${r.count} (${r.newCount} novas)` : `${r.count} no banco`); else setSyncError(r.errors?.[0] || 'Erro'); } catch (e) { setSyncError(e.message); } finally { setSyncing(false); } }

  const filterValues = useMemo(() => getFilterValues(), [questions, getFilterValues]);
  const answerStatus = useMemo(() => getAnswerStatus(), [questions, answers, getAnswerStatus]);
  const filtered = useMemo(() => getFilteredQuestions(filters), [questions, answers, filters, getFilteredQuestions]);
  const materiaStats = useMemo(() => useQuestionsStore.getState().getMateriaStats(), [questions, answers]);
  const activeCount = useMemo(() => { let c = 0; ['materias', 'assuntos', 'bancas', 'anos', 'dificuldades', 'orgaos', 'cargos'].forEach(k => { c += filters[k].length; }); if (filters.status !== 'all') c++; if (filters.keyword) c++; return c; }, [filters]);
  const updFilter = (k, v) => setFilters(p => ({ ...p, [k]: v }));
  const clearFilters = () => setFilters({ materias: [], assuntos: [], bancas: [], anos: [], dificuldades: [], orgaos: [], cargos: [], status: 'all', keyword: '' });
  const pendingCount = questions.filter(q => !q.subjectId).length;

  // Subject counts for the "Questões" tab overview
  const subjectCounts = useMemo(() => {
    const map = {};
    filtered.forEach(q => {
      const m = q.materia || 'Sem matéria';
      map[m] = (map[m] || 0) + 1;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [filtered]);

  // Handle "Praticar" click for a specific materia (or all if null)
  const handlePractice = (materia) => {
    const qs = materia
      ? getFilteredQuestions({ ...filters, materias: [materia] }).slice(0, 20)
      : filtered.slice(0, 20);
    if (!qs.length) { toast.error('Nenhuma questão encontrada.'); return; }
    setPracticeQuestions(qs);
    setPracticeSubject(materia || 'Todas');
    setPracticeResult(null);
  };

  // Handle caderno load: practice all filtered questions
  const handleCadernoPractice = (cadernoFilters) => {
    setFilters(cadernoFilters);
    setTab('questoes');
  };

  if (practiceSubject) return (
    <StudyLayout>
      <div className="flex flex-col max-h-[calc(100vh-80px)] overflow-y-auto custom-scrollbar pr-1 pb-10">
        <div className="mb-4">
          <button onClick={() => { setPracticeSubject(null); setPracticeQuestions([]); }} className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-white/5 transition-colors" style={{ color: 'var(--text-dim)' }}>← Voltar para visão geral</button>
        </div>
        <PracticeMode questions={practiceQuestions} onExit={r => { setPracticeSubject(null); setPracticeQuestions([]); if (r) setPracticeResult(r); }} />
      </div>
    </StudyLayout>
  );
  if (practiceResult) return <StudyLayout><ResultScreen result={practiceResult} onClose={() => setPracticeResult(null)} /></StudyLayout>;

  if (questions.length === 0 && !syncing) return (
    <StudyLayout>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-center min-h-[60vh]">
        <BentoCard className="text-center max-w-md mx-auto">
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl mx-auto mb-5" style={{ background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.2)' }}>📚</div>
          <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--text-main)' }}>Banco de Questões</h2>
          <p className="text-sm mb-6" style={{ color: 'var(--text-muted)', lineHeight: 1.7 }}>Conecte-se ao banco MAGO para carregar questões.</p>
          <button onClick={doSync} className="px-6 py-3 rounded-xl font-bold text-sm text-white hover:scale-105 transition-transform" style={{ background: 'linear-gradient(135deg, #8B5CF6, var(--primary))', boxShadow: '0 4px 20px rgba(139,92,246,0.3)' }}>🔄 Sincronizar com MAGO</button>
          {syncError && <p className="mt-3 text-sm" style={{ color: '#EF4444' }}>{syncError}</p>}
        </BentoCard>
      </motion.div>
    </StudyLayout>
  );

  const filterTags = [];
  filters.materias.forEach(m => filterTags.push(<span key={`m-${m}`} className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: 'rgba(139,92,246,0.12)', color: '#8B5CF6' }}>{m} ×</span>));
  filters.bancas.forEach(b => filterTags.push(<span key={`b-${b}`} className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: 'rgba(6,182,212,0.12)', color: '#06B6D4' }}>{b} ×</span>));
  filters.anos.forEach(a => filterTags.push(<span key={`a-${a}`} className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: 'rgba(245,158,11,0.12)', color: '#F59E0B' }}>{a} ×</span>));
  if (filters.status !== 'all') filterTags.push(<span key="s" className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: 'rgba(239,68,68,0.12)', color: '#EF4444' }}>{STATUS_OPTS.find(o => o.key === filters.status)?.label} ×</span>);

  return (
    <StudyLayout>
      <div className="flex flex-col max-h-[calc(100vh-80px)] overflow-y-auto custom-scrollbar pr-1 pb-10">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between gap-4 flex-wrap mb-4">
          <div><h1 className="text-2xl font-extrabold tracking-tight" style={{ color: 'var(--text-main)' }}>Banco de Questões</h1>
            <p className="text-sm mt-1" style={{ color: 'var(--text-dim)' }}>{filtered.length} questões {activeCount > 0 ? '(filtrado)' : ''} · {materiaStats.length} disciplinas</p></div>
          <div className="flex gap-2 items-center">
            {/* Merge conflict bell icon */}
            {unmatchedMaterias.length > 0 && (
              <div ref={mergeRef} className="relative">
                <button onClick={() => setShowMergeDropdown(v => !v)} className="relative w-9 h-9 rounded-xl flex items-center justify-center text-lg hover:bg-white/5 transition-all" title="Disciplinas não vinculadas">
                  🔔
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full text-[10px] lg:text-[8px] font-bold flex items-center justify-center text-white" style={{ background: '#F59E0B' }}>{unmatchedMaterias.length}</span>
                </button>
                <AnimatePresence>
                  {showMergeDropdown && (
                    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                      className="absolute right-0 z-50 mt-1 w-56 rounded-2xl border overflow-hidden backdrop-blur-2xl"
                      style={{ background: 'rgba(15,15,20,0.95)', borderColor: 'rgba(255,255,255,0.1)', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
                      <div className="p-3 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                        <p className="text-[11px] font-bold" style={{ color: 'var(--text-main)' }}>Disciplinas não vinculadas</p>
                        <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-dim)' }}>{unmatchedMaterias.length} precisam de vínculo</p>
                      </div>
                      <div className="max-h-48 overflow-y-auto custom-scrollbar">
                        {unmatchedMaterias.map((m, i) => (
                          <div key={i} className="px-3 py-2 text-xs border-b last:border-b-0" style={{ borderColor: 'rgba(255,255,255,0.04)', color: 'var(--text-main)' }}>
                            {m}
                          </div>
                        ))}
                      </div>
                      <div className="p-2 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                        <button onClick={() => { setShowMergeDropdown(false); setTab('pendentes'); }} className="w-full py-2 rounded-lg text-[11px] font-bold hover:bg-white/5 transition-colors" style={{ color: 'var(--primary)' }}>
                          Ir para Pendentes →
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
            <button onClick={() => setShowCadernoMgr(true)} className="px-3 py-2 rounded-xl text-xs font-bold border backdrop-blur-sm hover:border-purple-500/40 hover:text-purple-400 transition-all" style={{ borderColor: 'rgba(255,255,255,0.08)', color: 'var(--text-dim)' }}>📁 Cadernos {cadernos.length > 0 && <span className="ml-1">({cadernos.length})</span>}</button>
            <button onClick={doSync} disabled={syncing} className="px-4 py-2 rounded-xl text-xs font-bold border backdrop-blur-sm" style={{ borderColor: syncing ? 'var(--primary)' : 'rgba(255,255,255,0.08)', color: syncing ? 'var(--primary)' : 'var(--text-dim)' }}>{syncing ? '⏳' : '🔄'}</button>
          </div>
        </motion.div>

        {syncError && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-4 px-4 py-2 rounded-xl text-sm" style={{ background: 'rgba(239,68,68,0.08)', color: '#EF4444' }}>{syncError}</motion.div>}

        <div className="flex gap-1 p-1 rounded-xl mb-4 backdrop-blur-sm" style={{ background: 'rgba(255,255,255,0.03)' }}>
          {[{ k: 'questoes', l: '📋 Questões' }, { k: 'pendentes', l: '⚠️ Pendentes' }].map(t => (
            <button key={t.k} onClick={() => setTab(t.k)} className="flex-1 py-2 px-4 rounded-lg text-xs font-bold transition-all relative" style={{ background: tab === t.k ? 'var(--primary)' : 'transparent', color: tab === t.k ? '#fff' : 'var(--text-dim)' }}>
              {t.l}{t.k === 'pendentes' && pendingCount > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-[10px] lg:text-[8px] font-bold flex items-center justify-center text-white" style={{ background: '#EF4444' }}>{pendingCount}</span>}
            </button>
          ))}
        </div>

        <div className="mb-4">
          <button onClick={() => setShowFilters(!showFilters)} className="flex items-center gap-2 text-xs font-bold mb-2 hover:text-white transition-colors" style={{ color: 'var(--text-dim)' }}>
            <span className="transition-transform" style={{ transform: showFilters ? 'rotate(0)' : 'rotate(-90deg)' }}>▼</span>Filtros{activeCount > 0 && <Badge color="var(--primary)" variant="solid">{activeCount}</Badge>}
          </button>
          <AnimatePresence>{showFilters && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
              <div className="p-4 rounded-2xl border backdrop-blur-xl space-y-3 relative z-20" style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.06)' }}>
                <input value={filters.keyword} onChange={e => updFilter('keyword', e.target.value)} placeholder="🔍 Palavra-chave..." className="w-full px-3 py-2.5 rounded-xl text-sm border outline-none backdrop-blur-sm" style={inp} />
                <div className="flex flex-wrap gap-2">
                  <MultiSelect label="Disciplina" icon="📖" options={filterValues.materias} selected={filters.materias} onChange={v => updFilter('materias', v)} />
                  <MultiSelect label="Assunto" icon="📝" options={filterValues.assuntos} selected={filters.assuntos} onChange={v => updFilter('assuntos', v)} />
                  <MultiSelect label="Banca" icon="🏛️" options={filterValues.bancas} selected={filters.bancas} onChange={v => updFilter('bancas', v)} />
                  <MultiSelect label="Ano" icon="📅" options={filterValues.anos} selected={filters.anos} onChange={v => updFilter('anos', v)} />
                  <MultiSelect label="Dificuldade" icon="📊" options={filterValues.dificuldades} selected={filters.dificuldades} onChange={v => updFilter('dificuldades', v)} />
                  <MultiSelect label="Órgão" icon="🏢" options={filterValues.orgaos} selected={filters.orgaos} onChange={v => updFilter('orgaos', v)} />
                  <MultiSelect label="Cargo" icon="👤" options={filterValues.cargos} selected={filters.cargos} onChange={v => updFilter('cargos', v)} />
                </div>
                <div className="flex flex-wrap gap-2">{STATUS_OPTS.map(o => <button key={o.key} onClick={() => updFilter('status', o.key)} className="px-3 py-2 lg:py-1.5 rounded-lg text-[10px] font-bold border backdrop-blur-sm transition-all" style={chipS(filters.status === o.key)}>{o.label}</button>)}</div>
                {activeCount > 0 && <div className="flex items-center gap-2 flex-wrap">{filterTags}<button onClick={clearFilters} className="text-[10px] font-bold underline hover:text-white transition-colors" style={{ color: 'var(--text-dim)' }}>Limpar tudo</button></div>}
              </div>
            </motion.div>
          )}</AnimatePresence>
        </div>

        <AnimatePresence mode="wait">{tab === 'pendentes' && (
          <motion.div key="pend" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
            <PendingTab questions={questions} subjects={subjects} addSubject={addSubject} linkQuestionsToSubjects={linkQuestionsToSubjects} applySubjectLinks={applySubjectLinks} />
          </motion.div>
        )}</AnimatePresence>

        {/* Save caderno button — visible on questoes and materias tabs when filters are active */}
        {tab !== 'pendentes' && activeCount > 0 && (
          <div className="mb-4">
            <button onClick={() => setShowSaveModal(true)} className="px-4 py-2 rounded-xl text-xs font-bold border backdrop-blur-sm hover:border-green-500/40 hover:text-green-400 transition-all" style={{ borderColor: 'rgba(16,185,129,0.3)', color: '#10B981' }}>💾 Salvar como Caderno</button>
          </div>
        )}

        {/* ═══ QUESTÕES TAB — Summary + Iniciar ═══ */}
        <AnimatePresence mode="wait">{tab === 'questoes' && (
          <motion.div key="q" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {filtered.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-4xl mb-3">🔍</div>
                <p className="text-sm font-bold" style={{ color: 'var(--text-main)' }}>Nenhuma questão encontrada</p>
                <p className="text-xs mt-1" style={{ color: 'var(--text-dim)' }}>Ajuste os filtros ou sincronize</p>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Summary cards */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 rounded-2xl border backdrop-blur-xl text-center" style={{ background: 'rgba(139,92,246,0.08)', borderColor: 'rgba(139,92,246,0.15)' }}>
                    <div className="text-2xl font-black" style={{ color: '#8B5CF6' }}>{questions.length}</div>
                    <div className="text-[10px] font-bold uppercase tracking-wider mt-1" style={{ color: 'var(--text-dim)' }}>Total no banco</div>
                  </div>
                  <div className="p-4 rounded-2xl border backdrop-blur-xl text-center" style={{ background: 'rgba(16,185,129,0.08)', borderColor: 'rgba(16,185,129,0.15)' }}>
                    <div className="text-2xl font-black" style={{ color: '#10B981' }}>{filtered.length}</div>
                    <div className="text-[10px] font-bold uppercase tracking-wider mt-1" style={{ color: 'var(--text-dim)' }}>{activeCount > 0 ? 'Filtradas' : 'Disponíveis'}</div>
                  </div>
                </div>

                {/* Iniciar button */}
                <button
                  onClick={() => handlePractice(filters.materias[0] || null)}
                  className="w-full py-3.5 rounded-2xl font-bold text-sm text-white hover:scale-[1.02] active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
                  style={{ background: 'linear-gradient(135deg, #8B5CF6, var(--primary))', boxShadow: '0 4px 20px rgba(139,92,246,0.3)' }}
                >
                  🚀 Iniciar Prática ({filtered.length} questões)
                </button>

                {/* Quick subject pills */}
                {subjectCounts.length > 1 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {subjectCounts.slice(0, 6).map(([materia, count]) => (
                      <button key={materia} onClick={() => handlePractice(materia)}
                        className="px-3 py-1.5 rounded-xl text-[10px] font-bold border backdrop-blur-sm hover:border-white/[0.15] transition-all"
                        style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.06)', color: 'var(--text-main)' }}>
                        {materia} ({count})
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}</AnimatePresence>

      </div>

      <AnimatePresence>
        {showSaveModal && <SaveCadernoModal filters={filters} folders={folders} onSave={createCaderno} onClose={() => setShowSaveModal(false)} />}
        {showCadernoMgr && <CadernoManagerModal cadernos={cadernos} folders={folders} onLoad={handleCadernoPractice} onDelete={deleteCaderno} onCreateFolder={n => createFolder(n, COLORS[folders.length % COLORS.length])} onDeleteFolder={deleteFolder} onClose={() => setShowCadernoMgr(false)} />}
      </AnimatePresence>
    </StudyLayout>
  );
}
