import { useState, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStudyStore } from '../../../stores/useStudyStore';
import { useSessionStore } from '../../../stores/useSessionStore';
import { useRevisionStore } from '../../../stores/useRevisionStore';
import { useSessionModalStore } from '../../../stores/useSessionModalStore';
import { StudyLayout } from '../components/StudyLayout';
import { formatMinutes } from '../../../shared/utils/time';
import toast from 'react-hot-toast';

// ── constantes ────────────────────────────────────────────────────────────────

const STATUS_OPTS = [
  {
    id: 'nao_estudado',
    label: 'Não Estudado',
    color: '#8A8A98',
    bg: 'transparent',
  },
  { id: 'estudando', label: 'Estudando', color: '#F59E0B', bg: '#F59E0B15' },
  { id: 'revisao', label: 'Em Revisão', color: '#06B6D4', bg: '#06B6D415' },
  { id: 'dominado', label: 'Concluído', color: '#10B981', bg: '#10B98115' },
];

const ANCHOR_TYPES = [
  { id: 'sigla', label: 'Sigla', icon: '🔤' },
  { id: 'historia', label: 'História', icon: '📖' },
  { id: 'imagem', label: 'Imagem', icon: '🖼️' },
  { id: 'analogia', label: 'Analogia', icon: '🔀' },
  { id: 'numero', label: 'Número', icon: '🔢' },
];

const MODE_LABELS = {
  leitura: { label: 'Leitura', icon: '📖', color: '#3B82F6' },
  video: { label: 'Videoaula', icon: '▶️', color: '#8B5CF6' },
  questoes: { label: 'Questões', icon: '🎯', color: '#10B981' },
  flashcards: { label: 'Flashcards', icon: '🃏', color: '#F59E0B' },
  revisao: { label: 'Revisão', icon: '🔄', color: '#06B6D4' },
  feynman: { label: 'Feynman', icon: '🧠', color: '#EC4899' },
  recall: { label: 'Recall', icon: '⚡', color: '#F97316' },
  mpa: { label: 'MPA', icon: '🔗', color: '#A855F7' },
  mapa: { label: 'Mapa Mental', icon: '🗺️', color: '#14B8A6' },
};

// ── helpers ───────────────────────────────────────────────────────────────────

function today() {
  return new Date().toISOString().slice(0, 10);
}

function fmtDate(d) {
  if (!d) return '';
  try {
    return new Date(d + 'T12:00:00').toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
    });
  } catch {
    return d;
  }
}

function renderMarkdown(text) {
  if (!text) return '';
  let html = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(
      /^###\s+(.+)$/gm,
      '<h3 style="font-size:1.05rem;font-weight:700;margin:1.4em 0 0.4em;color:var(--text-main)">$1</h3>'
    )
    .replace(
      /^##\s+(.+)$/gm,
      '<h2 style="font-size:1.2rem;font-weight:700;margin:1.6em 0 0.5em;color:var(--text-main);border-bottom:1px solid var(--border);padding-bottom:.3em">$1</h2>'
    )
    .replace(
      /^#\s+(.+)$/gm,
      '<h1 style="font-size:1.5rem;font-weight:800;margin:1.8em 0 0.6em;color:var(--text-main)">$1</h1>'
    )
    .replace(
      /\*\*(.+?)\*\*/g,
      '<strong style="font-weight:700;color:var(--text-main)">$1</strong>'
    )
    .replace(
      /\*(.+?)\*/g,
      '<em style="font-style:italic;color:var(--text-dim)">$1</em>'
    )
    .replace(
      /`(.+?)`/g,
      '<code style="background:var(--bg-surface-2);padding:.15em .4em;border-radius:4px;font-family:monospace;font-size:.85em;border:1px solid var(--border)">$1</code>'
    )
    .replace(
      /^>\s+(.+)$/gm,
      '<blockquote style="border-left:3px solid var(--primary);padding:.5em 1em;margin:1em 0;background:var(--bg-surface-2);color:var(--text-dim);border-radius:0 8px 8px 0;font-style:italic">$1</blockquote>'
    )
    .replace(
      /^---$/gm,
      '<hr style="border:none;border-top:1px solid var(--border);margin:1.5em 0"/>'
    )
    .replace(
      /^[-*]\s+(.+)$/gm,
      '<li style="margin:.3em 0;color:var(--text-muted)">$1</li>'
    )
    .replace(
      /(<li.*<\/li>\n?)+/g,
      m =>
        `<ul style="list-style:disc;padding-left:1.5em;margin:.8em 0">${m}</ul>`
    )
    .replace(
      /\n\n/g,
      '</p><p style="margin:.8em 0;line-height:1.7;color:var(--text-muted)">'
    )
    .replace(/([^\n>])\n([^\n<])/g, '$1<br/>$2');
  return `<p style="margin:.8em 0;line-height:1.7;color:var(--text-muted)">${html}</p>`;
}

function getMindMapType(url) {
  if (!url) return null;
  const u = url.toLowerCase();
  if (u.match(/\.(jpg|jpeg|png|webp|gif|svg)$/)) return 'image';
  if (u.match(/\.pdf$/) || u.includes('drive.google.com/file')) return 'pdf';
  if (u.startsWith('data:image') || u.startsWith('http')) return 'image';
  return 'local';
}

function parseUrlForIframe(url) {
  if (!url) return '';
  if (url.includes('drive.google.com/file/d/'))
    return url.replace(/\/view.*$/, '/preview');
  return url;
}

function getLinkIcon(url) {
  if (!url) return '🔗';
  if (url.includes('youtube.com') || url.includes('youtu.be')) return '📺';
  if (url.match(/\.pdf$/i)) return '📄';
  if (!url.startsWith('http')) return '📁';
  return '🔗';
}

// ── ui atoms ──────────────────────────────────────────────────────────────────

function SectionLabel({ children }) {
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
      className="flex flex-col items-center justify-center gap-2 py-10 rounded-2xl border"
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

function WarnBanner({ children }) {
  return (
    <div
      className="flex gap-2 p-3 rounded-xl text-xs font-medium mb-3"
      style={{
        background: '#EF444415',
        border: '1px solid #EF444433',
        color: '#EF4444',
      }}
    >
      <span className="shrink-0">⚠️</span>
      <span style={{ color: 'var(--text-secondary)' }}>{children}</span>
    </div>
  );
}

// ── abas ──────────────────────────────────────────────────────────────────────

// 1. TEORIA
function TabTheory({ subtopic, subjectId, topicId, subtopicId, accent }) {
  const { updateSubtopic } = useStudyStore();
  const [mode, setMode] = useState('preview');
  const [draft, setDraft] = useState(null);
  const text = draft !== null ? draft : subtopic.theory || '';

  function save() {
    updateSubtopic(subjectId, topicId, subtopicId, { theory: text });
    setDraft(null);
    toast.success('Teoria salva!');
  }

  return (
    <div className="space-y-3">
      {/* toolbar */}
      <div className="flex items-center gap-2">
        {['edit', 'split', 'preview'].map(m => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all border"
            style={{
              borderColor: mode === m ? accent : 'var(--border)',
              background: mode === m ? `${accent}18` : 'transparent',
              color: mode === m ? accent : 'var(--text-muted)',
            }}
          >
            {m === 'edit'
              ? '✏️ Editar'
              : m === 'split'
                ? '↔ Split'
                : '👁 Preview'}
          </button>
        ))}
        {draft !== null && (
          <button
            onClick={save}
            className="ml-auto px-3 py-1.5 rounded-lg text-xs font-bold text-white"
            style={{ background: accent }}
          >
            💾 Salvar
          </button>
        )}
      </div>

      {mode === 'preview' && (
        <div
          className="p-4 rounded-xl border min-h-[300px]"
          style={{
            background: 'var(--bg-surface)',
            borderColor: 'var(--border)',
          }}
        >
          {text ? (
            <div dangerouslySetInnerHTML={{ __html: renderMarkdown(text) }} />
          ) : (
            <EmptyState
              icon="📝"
              text="Nenhuma teoria ainda"
              sub="Clique em Editar para começar"
            />
          )}
        </div>
      )}

      {mode === 'edit' && (
        <textarea
          value={text}
          onChange={e => setDraft(e.target.value)}
          placeholder="# Título\n\nEscreva a teoria em markdown..."
          className="w-full px-4 py-3 rounded-xl border outline-none resize-none font-mono text-sm"
          style={{
            background: 'var(--bg-surface)',
            borderColor: 'var(--border)',
            color: 'var(--text-main)',
            minHeight: 380,
            lineHeight: 1.7,
          }}
        />
      )}

      {mode === 'split' && (
        <div className="grid grid-cols-2 gap-3">
          <textarea
            value={text}
            onChange={e => setDraft(e.target.value)}
            className="px-4 py-3 rounded-xl border outline-none resize-none font-mono text-sm"
            style={{
              background: 'var(--bg-surface)',
              borderColor: 'var(--border)',
              color: 'var(--text-main)',
              minHeight: 380,
              lineHeight: 1.7,
            }}
          />
          <div
            className="p-4 rounded-xl border overflow-auto"
            style={{
              background: 'var(--bg-surface)',
              borderColor: 'var(--border)',
              minHeight: 380,
            }}
          >
            <div dangerouslySetInnerHTML={{ __html: renderMarkdown(text) }} />
          </div>
        </div>
      )}
    </div>
  );
}

// 2. MAPA
function TabMapa({ subtopic, subjectId, topicId, subtopicId }) {
  const { updateSubtopic } = useStudyStore();
  const [url, setUrl] = useState('');
  const [fullscreen, setFs] = useState(false);
  const fileRef = useRef(null);
  const current = subtopic.mindMapImage;
  const type = getMindMapType(current);

  function saveUrl() {
    if (url.trim()) {
      updateSubtopic(subjectId, topicId, subtopicId, {
        mindMapImage: url.trim(),
      });
      setUrl('');
      toast.success('Mapa salvo!');
    }
  }
  function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      updateSubtopic(subjectId, topicId, subtopicId, {
        mindMapImage: ev.target.result,
      });
      toast.success('Mapa carregado!');
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className="space-y-4">
      {current ? (
        <div
          className="relative rounded-xl overflow-hidden border"
          style={{ borderColor: 'var(--border)' }}
        >
          {type === 'image' ? (
            <img
              src={current}
              alt="Mapa mental"
              className="w-full object-contain cursor-zoom-in"
              style={{ maxHeight: 420 }}
              onClick={() => setFs(true)}
            />
          ) : type === 'pdf' ? (
            <iframe
              src={parseUrlForIframe(current)}
              title="Mapa"
              className="w-full"
              style={{ height: 420, border: 'none' }}
            />
          ) : (
            <div className="flex items-center gap-3 p-4">
              <span>📁</span>
              <code
                className="text-xs flex-1 truncate"
                style={{ color: 'var(--text-dim)' }}
              >
                {current}
              </code>
              <button
                onClick={() => navigator.clipboard.writeText(current)}
                className="text-xs px-2 py-1 rounded border"
                style={{
                  borderColor: 'var(--border)',
                  color: 'var(--text-dim)',
                }}
              >
                Copiar
              </button>
            </div>
          )}
          <div className="absolute top-2 right-2 flex gap-1">
            {type === 'image' && (
              <button
                onClick={() => setFs(true)}
                className="px-2 py-1 rounded-lg text-[10px] font-bold text-white"
                style={{ background: 'rgba(0,0,0,.5)' }}
              >
                ⛶ Fullscreen
              </button>
            )}
            <button
              onClick={() =>
                updateSubtopic(subjectId, topicId, subtopicId, {
                  mindMapImage: null,
                })
              }
              className="px-2 py-1 rounded-lg text-[10px] font-bold text-white"
              style={{ background: 'rgba(239,68,68,.7)' }}
            >
              × Remover
            </button>
          </div>
        </div>
      ) : (
        <EmptyState
          icon="🗺️"
          text="Nenhum mapa ainda"
          sub="Faça upload ou cole a URL abaixo"
        />
      )}

      <div className="flex gap-2">
        <input
          value={url}
          onChange={e => setUrl(e.target.value)}
          placeholder="Cole URL do mapa, PDF ou Google Drive..."
          className="flex-1 px-3 py-2.5 rounded-xl text-sm border outline-none"
          style={{
            background: 'var(--bg-surface-2)',
            borderColor: 'var(--border)',
            color: 'var(--text-main)',
          }}
        />
        <button
          onClick={saveUrl}
          className="px-4 py-2.5 rounded-xl text-sm font-bold text-white"
          style={{ background: 'var(--primary)' }}
        >
          Salvar
        </button>
        <button
          onClick={() => fileRef.current?.click()}
          className="px-4 py-2.5 rounded-xl text-sm font-bold border"
          style={{ borderColor: 'var(--border)', color: 'var(--text-main)' }}
        >
          Upload
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*,.pdf"
          className="hidden"
          onChange={handleFile}
        />
      </div>

      {fullscreen && (
        <div
          className="fixed inset-0 z-[300] flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,.92)' }}
          onClick={() => setFs(false)}
        >
          <img
            src={current}
            alt="Mapa"
            className="max-w-full max-h-full object-contain"
          />
        </div>
      )}
    </div>
  );
}

// 3. FLASHCARDS
function TabFlashcards({ subtopic, subjectId, topicId, subtopicId, accent }) {
  const { addFlashcard, updateFlashcard, deleteFlashcard } = useStudyStore();
  const [form, setForm] = useState({
    front: '',
    back: '',
    difficulty: 'medium',
  });
  const [studyMode, setStudy] = useState(false);
  const [cardIdx, setCardIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const cards = subtopic.flashcards || [];

  function add() {
    if (!form.front.trim() || !form.back.trim()) return;
    addFlashcard(subjectId, topicId, subtopicId, form);
    setForm({ front: '', back: '', difficulty: 'medium' });
    toast.success('Flashcard adicionado!');
  }

  if (studyMode && cards.length > 0) {
    const card = cards[cardIdx];
    return (
      <div className="flex flex-col items-center gap-5">
        <div className="flex items-center justify-between w-full">
          <button
            onClick={() => {
              setStudy(false);
              setCardIdx(0);
              setFlipped(false);
            }}
            className="text-xs font-bold px-3 py-1.5 rounded-lg border"
            style={{ borderColor: 'var(--border)', color: 'var(--text-dim)' }}
          >
            ← Sair
          </button>
          <span className="text-xs" style={{ color: 'var(--text-dim)' }}>
            {cardIdx + 1} / {cards.length}
          </span>
        </div>
        <div
          className="w-full min-h-[220px] rounded-2xl border cursor-pointer flex items-center justify-center p-8 text-center transition-all"
          style={{ background: 'var(--bg-surface)', borderColor: accent }}
          onClick={() => setFlipped(f => !f)}
        >
          <div>
            <div
              className="text-[10px] font-bold uppercase tracking-widest mb-3"
              style={{ color: 'var(--text-dim)' }}
            >
              {flipped ? 'RESPOSTA' : 'PERGUNTA'}
            </div>
            <div
              className="text-base font-medium"
              style={{ color: 'var(--text-main)' }}
            >
              {flipped ? card.back : card.front}
            </div>
            {!flipped && (
              <div
                className="text-[10px] mt-4"
                style={{ color: 'var(--text-dim)' }}
              >
                Clique para revelar
              </div>
            )}
          </div>
        </div>
        {flipped && (
          <div className="flex gap-3 w-full">
            {[
              { label: '😓 Difícil', color: '#EF4444' },
              { label: '🤔 Médio', color: '#F59E0B' },
              { label: '😊 Fácil', color: '#10B981' },
            ].map(opt => (
              <button
                key={opt.label}
                onClick={() => {
                  setCardIdx(i => (i + 1) % cards.length);
                  setFlipped(false);
                }}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white"
                style={{ background: opt.color }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {cards.length > 0 && (
        <button
          onClick={() => {
            setStudy(true);
            setCardIdx(0);
            setFlipped(false);
          }}
          className="w-full py-3 rounded-xl font-bold text-sm text-white"
          style={{ background: accent }}
        >
          🃏 Estudar {cards.length} flashcard{cards.length !== 1 ? 's' : ''}
        </button>
      )}
      {/* novo card */}
      <div
        className="p-4 rounded-xl border space-y-3"
        style={{
          background: 'var(--bg-surface)',
          borderColor: 'var(--border)',
        }}
      >
        <SectionLabel>Novo flashcard</SectionLabel>
        <textarea
          rows={2}
          placeholder="Frente / Pergunta"
          value={form.front}
          onChange={e => setForm(f => ({ ...f, front: e.target.value }))}
          className="w-full px-3 py-2 rounded-xl text-sm border outline-none resize-none"
          style={{
            background: 'var(--bg-surface-2)',
            borderColor: 'var(--border)',
            color: 'var(--text-main)',
          }}
        />
        <textarea
          rows={2}
          placeholder="Verso / Resposta (pode incluir âncora MPA)"
          value={form.back}
          onChange={e => setForm(f => ({ ...f, back: e.target.value }))}
          className="w-full px-3 py-2 rounded-xl text-sm border outline-none resize-none"
          style={{
            background: 'var(--bg-surface-2)',
            borderColor: `${accent}55`,
            color: 'var(--text-main)',
          }}
        />
        <button
          onClick={add}
          className="w-full py-2.5 rounded-xl text-sm font-bold text-white"
          style={{ background: 'var(--primary)' }}
        >
          + Adicionar
        </button>
      </div>
      {/* lista */}
      <div className="space-y-2">
        {cards.map((c, i) => (
          <div
            key={c.id || i}
            className="flex items-start gap-3 p-3 rounded-xl border"
            style={{
              background: 'var(--bg-surface)',
              borderColor: 'var(--border)',
            }}
          >
            <div className="flex-1 min-w-0">
              <div
                className="text-xs font-bold mb-0.5"
                style={{ color: 'var(--text-dim)' }}
              >
                Q:{' '}
                <span style={{ color: 'var(--text-main)', fontWeight: 500 }}>
                  {c.front}
                </span>
              </div>
              <div className="text-xs" style={{ color: 'var(--text-dim)' }}>
                R: {c.back}
              </div>
            </div>
            <button
              onClick={() =>
                deleteFlashcard?.(subjectId, topicId, subtopicId, c.id)
              }
              className="w-6 h-6 rounded-full flex items-center justify-center text-xs hover:bg-red-500/20 shrink-0"
              style={{ color: 'var(--text-dim)' }}
            >
              ×
            </button>
          </div>
        ))}
        {cards.length === 0 && (
          <EmptyState icon="🃏" text="Nenhum flashcard ainda" />
        )}
      </div>
    </div>
  );
}

// 4. FEYNMAN — explique com suas próprias palavras
function TabFeynman({ subtopic, subjectId, topicId, subtopicId }) {
  const { updateSubtopic } = useStudyStore();
  const [draft, setDraft] = useState('');
  const notes = subtopic.feynmanNotes || [];

  function save() {
    if (!draft.trim()) return;
    const updated = [
      { id: `fey_${Date.now()}`, text: draft.trim(), date: today() },
      ...notes,
    ];
    updateSubtopic(subjectId, topicId, subtopicId, { feynmanNotes: updated });
    setDraft('');
    toast.success('Explicação salva!');
  }

  function sendToGaps() {
    if (!draft.trim()) return;
    const gaps = subtopic.gaps || [];
    updateSubtopic(subjectId, topicId, subtopicId, {
      gaps: [
        ...gaps,
        {
          id: `gap_${Date.now()}`,
          text: `(Feynman) travei explicando: ${draft.trim().slice(0, 120)}`,
          date: today(),
          resolved: false,
        },
      ],
    });
    toast.success('Registrado como gap — revise na aba Gaps.');
  }

  function remove(id) {
    updateSubtopic(subjectId, topicId, subtopicId, {
      feynmanNotes: notes.filter(n => n.id !== id),
    });
  }

  return (
    <div className="space-y-4">
      <div
        className="p-3 rounded-xl text-xs"
        style={{
          background: '#EC489915',
          border: '1px solid #EC489933',
          color: '#EC4899',
          lineHeight: 1.7,
        }}
      >
        <strong>Técnica de Feynman:</strong> explique o assunto como se
        estivesse ensinando pra alguém que não sabe nada sobre o tema, com
        palavras simples, sem jargão. Onde você travar ou enrolar, é ali que tem
        gap — não é falta de "decoreba", é falta de entendimento real.
      </div>

      <div
        className="p-4 rounded-xl border space-y-3"
        style={{
          background: 'var(--bg-surface)',
          borderColor: 'var(--border)',
        }}
      >
        <SectionLabel>Sua explicação</SectionLabel>
        <textarea
          rows={6}
          placeholder="Explique este subtópico com suas próprias palavras, como se fosse ensinar um amigo leigo..."
          value={draft}
          onChange={e => setDraft(e.target.value)}
          className="w-full px-3 py-2.5 rounded-xl text-sm border outline-none resize-none"
          style={{
            background: 'var(--bg-surface-2)',
            borderColor: '#EC489955',
            color: 'var(--text-main)',
            lineHeight: 1.6,
          }}
        />
        <div className="flex gap-2">
          <button
            onClick={save}
            disabled={!draft.trim()}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-40"
            style={{ background: '#EC4899' }}
          >
            🧠 Salvar explicação
          </button>
          <button
            onClick={sendToGaps}
            disabled={!draft.trim()}
            className="px-4 py-2.5 rounded-xl text-sm font-bold border disabled:opacity-40"
            style={{ borderColor: '#EF444455', color: '#EF4444' }}
            title="Travei explicando isso — vira um gap pra revisar depois"
          >
            ⚠️ Travei aqui
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {notes.length === 0 && (
          <EmptyState
            icon="🧠"
            text="Nenhuma explicação registrada ainda"
            sub="Escreva pelo menos uma vez por subtópico — é o teste real do que você sabe"
          />
        )}
        {notes.map(n => (
          <div
            key={n.id}
            className="p-3 rounded-xl border"
            style={{ background: '#EC489908', borderColor: '#EC489933' }}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px]" style={{ color: '#EC4899' }}>
                {fmtDate(n.date)}
              </span>
              <button
                onClick={() => remove(n.id)}
                className="w-5 h-5 rounded-full flex items-center justify-center text-xs hover:bg-red-500/20"
                style={{ color: 'var(--text-dim)' }}
              >
                ×
              </button>
            </div>
            <div
              className="text-sm"
              style={{ color: 'var(--text-main)', lineHeight: 1.6 }}
            >
              {n.text}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// 5. MEMORIZAÇÃO — Âncoras MPA + Palácio da Memória unidos (opcional)
function TabMemorization({ subtopic, subjectId, topicId, subtopicId, accent }) {
  const [mode, setMode] = useState('ancoras'); // 'ancoras' | 'palacio'
  const anchorsCount = (subtopic.anchors || []).length;
  const lociCount = (subtopic.loci || []).length;

  return (
    <div className="space-y-4">
      <div
        className="p-3 rounded-xl text-xs"
        style={{
          background: 'var(--bg-surface-2)',
          border: '1px solid var(--border)',
          color: 'var(--text-dim)',
          lineHeight: 1.7,
        }}
      >
        💡 <strong style={{ color: 'var(--text-muted)' }}>Opcional</strong> —
        use só quando o conteúdo for difícil de decorar por lógica (prazos,
        siglas, listas, artigos numerados). Pra teoria conceitual, foque em
        Teoria + Feynman.
      </div>

      {/* seletor de técnica */}
      <div
        className="flex gap-1 p-1 rounded-xl"
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
        }}
      >
        {[
          {
            id: 'ancoras',
            label: '🔗 Âncoras MPA',
            count: anchorsCount,
            color: '#A855F7',
          },
          {
            id: 'palacio',
            label: '🏛️ Palácio dos Loci',
            count: lociCount,
            color: '#14B8A6',
          },
        ].map(opt => (
          <button
            key={opt.id}
            onClick={() => setMode(opt.id)}
            className="flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5"
            style={{
              background: mode === opt.id ? `${opt.color}18` : 'transparent',
              color: mode === opt.id ? opt.color : 'var(--text-muted)',
            }}
          >
            {opt.label}
            {opt.count > 0 && (
              <span
                className="text-[9px] font-black px-1.5 py-0.5 rounded-full"
                style={{ background: `${opt.color}30`, color: opt.color }}
              >
                {opt.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {mode === 'ancoras' ? (
        <TabAnchors
          subtopic={subtopic}
          subjectId={subjectId}
          topicId={topicId}
          subtopicId={subtopicId}
          accent={accent}
        />
      ) : (
        <TabPalace
          subtopic={subtopic}
          subjectId={subjectId}
          topicId={topicId}
          subtopicId={subtopicId}
          accent={accent}
        />
      )}
    </div>
  );
}

// 4b. ÂNCORAS MPA (usada dentro de Memorização)
function TabAnchors({ subtopic, subjectId, topicId, subtopicId, accent }) {
  const { updateSubtopic } = useStudyStore();
  const [form, setForm] = useState({ type: 'sigla', datum: '', anchor: '' });
  const anchors = subtopic.anchors || [];

  function add() {
    if (!form.datum.trim() || !form.anchor.trim()) return;
    const updated = [
      ...anchors,
      { ...form, id: `anc_${Date.now()}`, date: today() },
    ];
    updateSubtopic(subjectId, topicId, subtopicId, { anchors: updated });
    setForm({ type: 'sigla', datum: '', anchor: '' });
    toast.success('Âncora MPA salva!');
  }

  function remove(id) {
    updateSubtopic(subjectId, topicId, subtopicId, {
      anchors: anchors.filter(a => a.id !== id),
    });
  }

  return (
    <div className="space-y-4">
      <div
        className="p-3 rounded-xl text-xs"
        style={{
          background: '#A855F715',
          border: '1px solid #A855F733',
          color: '#A855F7',
          lineHeight: 1.7,
        }}
      >
        <strong>MPA — Memorização por Associação:</strong> crie âncoras mentais
        (siglas, histórias, imagens, analogias) para dados arbitrários como
        prazos, quóruns e exceções. O cérebro não retém dados soltos — precisa
        de contexto narrativo.
      </div>

      {/* form */}
      <div
        className="p-4 rounded-xl border space-y-3"
        style={{
          background: 'var(--bg-surface)',
          borderColor: 'var(--border)',
        }}
      >
        <SectionLabel>Nova âncora</SectionLabel>
        <div className="flex gap-2 flex-wrap">
          {ANCHOR_TYPES.map(t => (
            <button
              key={t.id}
              onClick={() => setForm(f => ({ ...f, type: t.id }))}
              className="px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-all"
              style={{
                borderColor: form.type === t.id ? '#A855F7' : 'var(--border)',
                background:
                  form.type === t.id ? '#A855F718' : 'var(--bg-surface-2)',
                color: form.type === t.id ? '#A855F7' : 'var(--text-muted)',
              }}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>
        <input
          placeholder="Dado a memorizar (ex: prazo de 5 dias úteis para recurso)"
          value={form.datum}
          onChange={e => setForm(f => ({ ...f, datum: e.target.value }))}
          className="w-full px-3 py-2.5 rounded-xl text-sm border outline-none"
          style={{
            background: 'var(--bg-surface-2)',
            borderColor: 'var(--border)',
            color: 'var(--text-main)',
          }}
        />
        <textarea
          rows={2}
          placeholder="A âncora (ex: '5 dedos da mão levantada', 'LIMPE = a Limpa da administração')"
          value={form.anchor}
          onChange={e => setForm(f => ({ ...f, anchor: e.target.value }))}
          className="w-full px-3 py-2.5 rounded-xl text-sm border outline-none resize-none"
          style={{
            background: 'var(--bg-surface-2)',
            borderColor: '#A855F755',
            color: 'var(--text-main)',
          }}
        />
        <button
          onClick={add}
          className="w-full py-2.5 rounded-xl text-sm font-bold text-white"
          style={{ background: '#A855F7' }}
        >
          🔗 Salvar âncora
        </button>
      </div>

      {/* lista */}
      <div className="space-y-2">
        {anchors.length === 0 && (
          <EmptyState
            icon="🔗"
            text="Nenhuma âncora ainda"
            sub="Crie associações para dados difíceis de memorizar"
          />
        )}
        {anchors.map(a => {
          const typeInfo = ANCHOR_TYPES.find(t => t.id === a.type);
          return (
            <div
              key={a.id}
              className="p-4 rounded-xl border"
              style={{
                background: 'var(--bg-surface)',
                borderColor: '#A855F733',
              }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                      style={{ background: '#A855F720', color: '#A855F7' }}
                    >
                      {typeInfo?.icon} {typeInfo?.label}
                    </span>
                    <span
                      className="text-[10px]"
                      style={{ color: 'var(--text-dim)' }}
                    >
                      {fmtDate(a.date)}
                    </span>
                  </div>
                  <div
                    className="text-xs font-medium mb-1"
                    style={{ color: 'var(--text-dim)' }}
                  >
                    Dado:{' '}
                    <span style={{ color: 'var(--text-main)' }}>{a.datum}</span>
                  </div>
                  <div
                    className="text-sm font-medium p-2 rounded-lg"
                    style={{ background: '#A855F710', color: '#A855F7' }}
                  >
                    🔗 {a.anchor}
                  </div>
                </div>
                <button
                  onClick={() => remove(a.id)}
                  className="w-6 h-6 rounded-full flex items-center justify-center text-xs hover:bg-red-500/20 shrink-0"
                  style={{ color: 'var(--text-dim)' }}
                >
                  ×
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// 5b. PALÁCIO DA MEMÓRIA (usada dentro de Memorização)
function TabPalace({ subtopic, subjectId, topicId, subtopicId, accent }) {
  const { updateSubtopic } = useStudyStore();
  const [newLocation, setNewLocation] = useState('');
  const [newItem, setNewItem] = useState('');
  const [reviewMode, setReviewMode] = useState(false);
  const [revIdx, setRevIdx] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const loci = subtopic.loci || [];

  function addLocus() {
    if (!newLocation.trim() || !newItem.trim()) return;
    const updated = [
      ...loci,
      {
        id: `locus_${Date.now()}`,
        location: newLocation.trim(),
        item: newItem.trim(),
        order: loci.length,
      },
    ];
    updateSubtopic(subjectId, topicId, subtopicId, { loci: updated });
    setNewLocation('');
    setNewItem('');
    toast.success('Locus adicionado!');
  }

  function removeLocus(id) {
    updateSubtopic(subjectId, topicId, subtopicId, {
      loci: loci.filter(l => l.id !== id),
    });
  }

  if (reviewMode && loci.length > 0) {
    const locus = loci[revIdx];
    return (
      <div className="flex flex-col items-center gap-5">
        <div className="flex items-center justify-between w-full">
          <button
            onClick={() => {
              setReviewMode(false);
              setRevIdx(0);
              setRevealed(false);
            }}
            className="text-xs font-bold px-3 py-1.5 rounded-lg border"
            style={{ borderColor: 'var(--border)', color: 'var(--text-dim)' }}
          >
            ← Sair
          </button>
          <span className="text-xs" style={{ color: 'var(--text-dim)' }}>
            {revIdx + 1} / {loci.length}
          </span>
        </div>
        <div
          className="w-full min-h-[200px] rounded-2xl border p-8 text-center"
          style={{ background: 'var(--bg-surface)', borderColor: '#14B8A655' }}
        >
          <div
            className="text-[10px] font-bold uppercase tracking-widest mb-4"
            style={{ color: '#14B8A6' }}
          >
            🏛️ Você está em...
          </div>
          <div
            className="text-2xl font-black mb-6"
            style={{ color: 'var(--text-main)' }}
          >
            {locus.location}
          </div>
          {revealed ? (
            <>
              <div
                className="text-[10px] font-bold uppercase tracking-widest mb-2"
                style={{ color: 'var(--text-dim)' }}
              >
                O que está aqui:
              </div>
              <div
                className="text-base font-medium p-3 rounded-xl"
                style={{ background: '#14B8A615', color: '#14B8A6' }}
              >
                {locus.item}
              </div>
            </>
          ) : (
            <button
              onClick={() => setRevealed(true)}
              className="px-6 py-2.5 rounded-xl text-sm font-bold text-white"
              style={{ background: '#14B8A6' }}
            >
              Revelar o que está aqui
            </button>
          )}
        </div>
        {revealed && (
          <div className="flex gap-3 w-full">
            <button
              onClick={() => {
                setRevIdx(i => (i + 1) % loci.length);
                setRevealed(false);
              }}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white"
              style={{ background: '#14B8A6' }}
            >
              Próximo locus →
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div
        className="p-3 rounded-xl text-xs"
        style={{
          background: '#14B8A615',
          border: '1px solid #14B8A633',
          color: '#14B8A6',
          lineHeight: 1.7,
        }}
      >
        <strong>Palácio da Memória (Método dos Loci):</strong> posicione cada
        item da lista em um local que você conhece bem (sua casa, caminho do
        trabalho). Para recordar, "caminhe" mentalmente por esses locais. Ideal
        para sequências, artigos numerados e listas longas.
      </div>

      {loci.length > 0 && (
        <button
          onClick={() => {
            setReviewMode(true);
            setRevIdx(0);
            setRevealed(false);
          }}
          className="w-full py-3 rounded-xl font-bold text-sm text-white"
          style={{ background: '#14B8A6' }}
        >
          🏛️ Revisar palácio ({loci.length} loci)
        </button>
      )}

      {/* adicionar locus */}
      <div
        className="p-4 rounded-xl border space-y-3"
        style={{
          background: 'var(--bg-surface)',
          borderColor: 'var(--border)',
        }}
      >
        <SectionLabel>Novo locus</SectionLabel>
        <input
          placeholder="Local (ex: Porta da entrada, Sala de estar, Cozinha)"
          value={newLocation}
          onChange={e => setNewLocation(e.target.value)}
          className="w-full px-3 py-2.5 rounded-xl text-sm border outline-none"
          style={{
            background: 'var(--bg-surface-2)',
            borderColor: 'var(--border)',
            color: 'var(--text-main)',
          }}
        />
        <textarea
          rows={2}
          placeholder="O que está neste local (ex: Art. 37 CF — princípios LIMPE da Adm. Pública)"
          value={newItem}
          onChange={e => setNewItem(e.target.value)}
          className="w-full px-3 py-2.5 rounded-xl text-sm border outline-none resize-none"
          style={{
            background: 'var(--bg-surface-2)',
            borderColor: '#14B8A655',
            color: 'var(--text-main)',
          }}
        />
        <button
          onClick={addLocus}
          className="w-full py-2.5 rounded-xl text-sm font-bold text-white"
          style={{ background: '#14B8A6' }}
        >
          🏛️ Adicionar locus
        </button>
      </div>

      {/* lista de loci */}
      <div className="space-y-2">
        {loci.length === 0 && (
          <EmptyState
            icon="🏛️"
            text="Palácio vazio"
            sub="Adicione locais e os itens que você quer memorizar em cada um"
          />
        )}
        {loci.map((l, i) => (
          <div
            key={l.id}
            className="flex items-start gap-3 p-4 rounded-xl border"
            style={{
              background: 'var(--bg-surface)',
              borderColor: '#14B8A633',
            }}
          >
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shrink-0"
              style={{ background: '#14B8A620', color: '#14B8A6' }}
            >
              {i + 1}
            </div>
            <div className="flex-1 min-w-0">
              <div
                className="text-xs font-bold mb-1"
                style={{ color: '#14B8A6' }}
              >
                📍 {l.location}
              </div>
              <div className="text-sm" style={{ color: 'var(--text-main)' }}>
                {l.item}
              </div>
            </div>
            <button
              onClick={() => removeLocus(l.id)}
              className="w-6 h-6 rounded-full flex items-center justify-center text-xs hover:bg-red-500/20 shrink-0"
              style={{ color: 'var(--text-dim)' }}
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// 6. GAPS & INSEGURANÇAS
function TabGaps({ subtopic, subjectId, topicId, subtopicId }) {
  const { updateSubtopic } = useStudyStore();
  const [newGap, setNewGap] = useState('');
  const [newInsecurity, setNewInsecurity] = useState('');
  const gaps = subtopic.gaps || [];
  const insecurities = subtopic.insecurities || [];

  function addGap() {
    if (!newGap.trim()) return;
    updateSubtopic(subjectId, topicId, subtopicId, {
      gaps: [
        ...gaps,
        {
          id: `gap_${Date.now()}`,
          text: newGap.trim(),
          date: today(),
          resolved: false,
        },
      ],
    });
    setNewGap('');
    toast.success('Gap registrado!');
  }
  function addInsecurity() {
    if (!newInsecurity.trim()) return;
    updateSubtopic(subjectId, topicId, subtopicId, {
      insecurities: [
        ...insecurities,
        {
          id: `ins_${Date.now()}`,
          text: newInsecurity.trim(),
          date: today(),
          resolved: false,
        },
      ],
    });
    setNewInsecurity('');
    toast.success('Insegurança registrada!');
  }
  function resolveGap(id) {
    updateSubtopic(subjectId, topicId, subtopicId, {
      gaps: gaps.map(g => (g.id === id ? { ...g, resolved: true } : g)),
    });
  }
  function resolveInsecurity(id) {
    updateSubtopic(subjectId, topicId, subtopicId, {
      insecurities: insecurities.map(i =>
        i.id === id ? { ...i, resolved: true } : i
      ),
    });
  }

  const openGaps = gaps.filter(g => !g.resolved);
  const openIns = insecurities.filter(i => !i.resolved);

  return (
    <div className="space-y-5">
      {(openGaps.length > 0 || openIns.length > 0) && (
        <WarnBanner>
          Você tem {openGaps.length} gap{openGaps.length !== 1 ? 's' : ''} e{' '}
          {openIns.length} insegurança{openIns.length !== 1 ? 's' : ''} aberta
          {openIns.length !== 1 ? 's' : ''}. Esses pontos são o caminho do 70%
          para o 90%.
        </WarnBanner>
      )}

      {/* GAPS */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-base">⚠️</span>
          <SectionLabel>Erros e confusões registradas</SectionLabel>
          <span
            className="text-[10px] font-bold px-2 py-0.5 rounded-full ml-auto"
            style={{
              background: openGaps.length > 0 ? '#EF444420' : '#10B98120',
              color: openGaps.length > 0 ? '#EF4444' : '#10B981',
            }}
          >
            {openGaps.length} aberto{openGaps.length !== 1 ? 's' : ''}
          </span>
        </div>
        <div className="flex gap-2 mb-3">
          <input
            value={newGap}
            onChange={e => setNewGap(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addGap()}
            placeholder="Ex: confundi prazo de 5 com 15 dias em licitação dispensada..."
            className="flex-1 px-3 py-2.5 rounded-xl text-sm border outline-none"
            style={{
              background: 'var(--bg-surface-2)',
              borderColor: 'var(--border)',
              color: 'var(--text-main)',
            }}
          />
          <button
            onClick={addGap}
            className="px-4 py-2.5 rounded-xl text-sm font-bold text-white"
            style={{ background: '#EF4444' }}
          >
            +
          </button>
        </div>
        <div className="space-y-2">
          {gaps.length === 0 && (
            <EmptyState
              icon="✅"
              text="Nenhum gap registrado"
              sub="Erros registrados nas sessões aparecem aqui"
            />
          )}
          {gaps.map(g => (
            <div
              key={g.id}
              className="flex items-start gap-3 p-3 rounded-xl border"
              style={{
                background: g.resolved ? 'var(--bg-surface)' : '#EF444408',
                borderColor: g.resolved ? 'var(--border)' : '#EF444433',
              }}
            >
              <div className="flex-1 min-w-0">
                <div
                  className="text-sm"
                  style={{
                    color: g.resolved ? 'var(--text-dim)' : 'var(--text-main)',
                    textDecoration: g.resolved ? 'line-through' : 'none',
                  }}
                >
                  {g.text}
                </div>
                <div
                  className="text-[10px] mt-1"
                  style={{ color: 'var(--text-dim)' }}
                >
                  {fmtDate(g.date)}
                </div>
              </div>
              {!g.resolved && (
                <button
                  onClick={() => resolveGap(g.id)}
                  className="px-2 py-1 rounded-lg text-[10px] font-bold shrink-0"
                  style={{ background: '#10B98120', color: '#10B981' }}
                >
                  ✓ Resolvido
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* INSEGURANÇAS */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-base">🤔</span>
          <SectionLabel>Inseguranças — reconhecer ≠ lembrar</SectionLabel>
          <span
            className="text-[10px] font-bold px-2 py-0.5 rounded-full ml-auto"
            style={{
              background: openIns.length > 0 ? '#F59E0B20' : '#10B98120',
              color: openIns.length > 0 ? '#F59E0B' : '#10B981',
            }}
          >
            {openIns.length} aberta{openIns.length !== 1 ? 's' : ''}
          </span>
        </div>
        <div
          className="p-2 rounded-lg text-[10px] mb-2"
          style={{ background: '#F59E0B10', color: '#F59E0B' }}
        >
          ⚠ Sentiu dúvida mesmo acertando? Insegurança = lacuna real. Registre
          aqui para atacar antes da prova.
        </div>
        <div className="flex gap-2 mb-3">
          <input
            value={newInsecurity}
            onChange={e => setNewInsecurity(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addInsecurity()}
            placeholder="Ex: não tenho certeza se o prazo é útil ou corrido..."
            className="flex-1 px-3 py-2.5 rounded-xl text-sm border outline-none"
            style={{
              background: 'var(--bg-surface-2)',
              borderColor: 'var(--border)',
              color: 'var(--text-main)',
            }}
          />
          <button
            onClick={addInsecurity}
            className="px-4 py-2.5 rounded-xl text-sm font-bold text-white"
            style={{ background: '#F59E0B' }}
          >
            +
          </button>
        </div>
        <div className="space-y-2">
          {insecurities.length === 0 && (
            <EmptyState icon="🤔" text="Nenhuma insegurança registrada" />
          )}
          {insecurities.map(ins => (
            <div
              key={ins.id}
              className="flex items-start gap-3 p-3 rounded-xl border"
              style={{
                background: ins.resolved ? 'var(--bg-surface)' : '#F59E0B08',
                borderColor: ins.resolved ? 'var(--border)' : '#F59E0B33',
              }}
            >
              <div className="flex-1 min-w-0">
                <div
                  className="text-sm"
                  style={{
                    color: ins.resolved
                      ? 'var(--text-dim)'
                      : 'var(--text-main)',
                    textDecoration: ins.resolved ? 'line-through' : 'none',
                  }}
                >
                  {ins.text}
                </div>
                <div
                  className="text-[10px] mt-1"
                  style={{ color: 'var(--text-dim)' }}
                >
                  {fmtDate(ins.date)}
                </div>
              </div>
              {!ins.resolved && (
                <button
                  onClick={() => resolveInsecurity(ins.id)}
                  className="px-2 py-1 rounded-lg text-[10px] font-bold shrink-0"
                  style={{ background: '#10B98120', color: '#10B981' }}
                >
                  ✓ Resolvido
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// 7. HISTÓRICO
function TabHistory({ subtopic, subjects, subjectId }) {
  const sessions = useSessionStore(s => s.sessions);
  const subSessions = useMemo(
    () =>
      sessions
        .filter(s => s.subtopicId === subtopic.id)
        .sort((a, b) => (b.finishedAt || 0) - (a.finishedAt || 0)),
    [sessions, subtopic.id]
  );

  const totalMins = subSessions.reduce((a, s) => a + (s.totalMinutes || 0), 0);
  const totalQ = subSessions.reduce(
    (a, s) => a + (s.questionsAnswered || 0),
    0
  );
  const totalC = subSessions.reduce((a, s) => a + (s.questionsCorrect || 0), 0);
  const acc = totalQ > 0 ? Math.round((totalC / totalQ) * 100) : null;

  return (
    <div className="space-y-4">
      {/* stats */}
      <div className="grid grid-cols-3 gap-3">
        <div
          className="p-3 rounded-xl border text-center"
          style={{
            background: 'var(--bg-surface)',
            borderColor: 'var(--border)',
          }}
        >
          <div
            className="text-lg font-black"
            style={{ color: 'var(--text-main)' }}
          >
            {formatMinutes(totalMins)}
          </div>
          <div
            className="text-[9px] uppercase tracking-widest"
            style={{ color: 'var(--text-dim)' }}
          >
            Total
          </div>
        </div>
        <div
          className="p-3 rounded-xl border text-center"
          style={{
            background: 'var(--bg-surface)',
            borderColor: 'var(--border)',
          }}
        >
          <div
            className="text-lg font-black"
            style={{ color: 'var(--text-main)' }}
          >
            {subSessions.length}
          </div>
          <div
            className="text-[9px] uppercase tracking-widest"
            style={{ color: 'var(--text-dim)' }}
          >
            Sessões
          </div>
        </div>
        <div
          className="p-3 rounded-xl border text-center"
          style={{
            background: 'var(--bg-surface)',
            borderColor: 'var(--border)',
          }}
        >
          <div
            className="text-lg font-black"
            style={{
              color:
                acc !== null
                  ? acc >= 70
                    ? '#10B981'
                    : '#F59E0B'
                  : 'var(--text-dim)',
            }}
          >
            {acc !== null ? `${acc}%` : '—'}
          </div>
          <div
            className="text-[9px] uppercase tracking-widest"
            style={{ color: 'var(--text-dim)' }}
          >
            Acerto
          </div>
        </div>
      </div>

      {/* lista de sessões */}
      {subSessions.length === 0 ? (
        <EmptyState icon="📚" text="Nenhuma sessão neste subtópico ainda" />
      ) : (
        <div className="space-y-2">
          {subSessions.map(s => {
            const modes = s.modes || (s.studyType ? [s.studyType] : []);
            const sAcc =
              s.questionsAnswered > 0
                ? Math.round((s.questionsCorrect / s.questionsAnswered) * 100)
                : null;
            const badges = [
              s.connection && '🧠',
              s.gaps && '⚠️',
              s.feynmanNote && '🎤',
              s.recallText && '⚡',
              s.anchor && '🔗',
              s.insecurity && '🤔',
            ].filter(Boolean);
            return (
              <div
                key={s.id}
                className="flex items-center gap-3 p-3 rounded-xl border"
                style={{
                  background: 'var(--bg-surface)',
                  borderColor: 'var(--border)',
                }}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {modes.map(m => {
                      const info = MODE_LABELS[m];
                      return info ? (
                        <span key={m} className="text-[11px]">
                          {info.icon}
                        </span>
                      ) : null;
                    })}
                    {badges.map((b, i) => (
                      <span key={i} className="text-[11px]">
                        {b}
                      </span>
                    ))}
                    <span
                      className="text-[10px]"
                      style={{ color: 'var(--text-dim)' }}
                    >
                      {fmtDate(s.date)}
                    </span>
                  </div>
                  <div
                    className="text-sm font-medium"
                    style={{ color: 'var(--text-main)' }}
                  >
                    {formatMinutes(s.totalMinutes)}
                    {s.questionsAnswered > 0 &&
                      ` · ${s.questionsAnswered} questões`}
                  </div>
                  {s.connection && (
                    <div
                      className="text-xs mt-1 italic truncate"
                      style={{ color: '#8B5CF6' }}
                    >
                      "{s.connection}"
                    </div>
                  )}
                </div>
                {sAcc !== null && (
                  <div
                    className="text-sm font-black shrink-0"
                    style={{ color: sAcc >= 70 ? '#10B981' : '#F59E0B' }}
                  >
                    {sAcc}%
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── componente principal ──────────────────────────────────────────────────────

export function StudySubtopicPage() {
  const { subjectId, topicId, subtopicId } = useParams();
  const navigate = useNavigate();
  const { subjects, updateSubtopic } = useStudyStore();
  const generateRevisions = useRevisionStore(s => s.generateRevisions);
  const openSessionModal = useSessionModalStore(s => s.openModal);

  const [tab, setTab] = useState('teoria');

  const subject = subjects.find(s => s.id === subjectId);
  const topic = subject?.topics?.find(t => t.id === topicId);
  const subtopic = topic?.subtopics?.find(ss => ss.id === subtopicId);
  const accent = subject?.color || 'var(--primary)';

  if (!subtopic)
    return (
      <StudyLayout>
        <div className="flex flex-col items-center justify-center h-full gap-4">
          <span className="text-4xl">⚠️</span>
          <p className="text-sm" style={{ color: 'var(--text-dim)' }}>
            Aula não encontrada.
          </p>
          <button
            onClick={() => navigate('/study/subjects')}
            className="px-5 py-2 rounded-xl text-sm font-bold text-white"
            style={{ background: 'var(--primary)' }}
          >
            Voltar para Matérias
          </button>
        </div>
      </StudyLayout>
    );

  const status =
    STATUS_OPTS.find(s => s.id === subtopic.status) || STATUS_OPTS[0];

  const openGaps = (subtopic.gaps || []).filter(g => !g.resolved).length;
  const openIns = (subtopic.insecurities || []).filter(i => !i.resolved).length;
  const hasAlerts = openGaps > 0 || openIns > 0;

  const TABS = [
    { id: 'teoria', label: 'Teoria', icon: '📝' },
    { id: 'mapa', label: 'Mapa', icon: '🗺️' },
    {
      id: 'flashcards',
      label: 'Flashcards',
      icon: '🃏',
      count: subtopic.flashcards?.length,
    },
    {
      id: 'feynman',
      label: 'Feynman',
      icon: '🧠',
      count: (subtopic.feynmanNotes || []).length,
    },
    {
      id: 'memorizacao',
      label: 'Memorização',
      icon: '🧩',
      count: (subtopic.anchors || []).length + (subtopic.loci || []).length,
    },
    {
      id: 'gaps',
      label: 'Gaps',
      icon: '⚠️',
      count: openGaps + openIns,
      alert: hasAlerts,
    },
    { id: 'historico', label: 'Histórico', icon: '📊' },
  ];

  return (
    <StudyLayout>
      <div className="flex flex-col max-h-[calc(100vh-80px)] overflow-y-auto custom-scrollbar pr-1 pb-10 space-y-4 animate-fade-in">
        {/* breadcrumb */}
        <div
          className="flex items-center gap-2 text-xs"
          style={{ color: 'var(--text-dim)' }}
        >
          <button
            onClick={() => navigate('/study/subjects')}
            className="hover:underline"
          >
            Matérias
          </button>
          <span>/</span>
          <button
            onClick={() => navigate(`/study/subjects/${subjectId}`)}
            className="hover:underline"
            style={{ color: accent }}
          >
            {subject?.name}
          </button>
          <span>/</span>
          <span style={{ color: 'var(--text-main)' }}>{subtopic.name}</span>
        </div>

        {/* header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h1
              className="text-xl font-extrabold tracking-tight truncate"
              style={{ color: 'var(--text-main)' }}
            >
              {subtopic.name}
            </h1>
            {topic && (
              <div
                className="text-xs mt-0.5"
                style={{ color: 'var(--text-dim)' }}
              >
                {topic.name}
              </div>
            )}
          </div>
          {/* status */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() =>
                openSessionModal({
                  preSubjectId: subjectId,
                  preTopicId: topicId,
                  preSubtopicId: subtopicId,
                })
              }
              className="px-3 py-1.5 rounded-xl text-xs font-bold text-white uppercase tracking-wider hover:scale-105 transition-transform"
              style={{ background: accent }}
            >
              ▶ Estudar
            </button>
            <div className="relative">
              <select
                value={subtopic.status || 'nao_estudado'}
                onChange={e =>
                  updateSubtopic(subjectId, topicId, subtopicId, {
                    status: e.target.value,
                  })
                }
                className="px-3 py-1.5 rounded-xl text-xs font-bold border outline-none appearance-none pr-7"
                style={{
                  background: status.bg,
                  borderColor: status.color,
                  color: status.color,
                }}
              >
                {STATUS_OPTS.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* alerta de gaps abertos */}
        {hasAlerts && (
          <WarnBanner>
            {openGaps > 0 &&
              `${openGaps} gap${openGaps > 1 ? 's' : ''} não resolvido${openGaps > 1 ? 's' : ''}. `}
            {openIns > 0 &&
              `${openIns} insegurança${openIns > 1 ? 's' : ''} não resolvida${openIns > 1 ? 's' : ''}.`}{' '}
            Revise a aba Gaps antes da próxima sessão.
          </WarnBanner>
        )}

        {/* tabs das 7 abas */}
        <div className="overflow-x-auto scrollbar-hide -mx-1 px-1">
          <div
            className="flex gap-1 min-w-max p-1 rounded-xl"
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border)',
            }}
          >
            {TABS.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className="relative flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap"
                style={{
                  background: tab === t.id ? accent : 'transparent',
                  color: tab === t.id ? 'white' : 'var(--text-muted)',
                }}
              >
                <span>{t.icon}</span>
                <span>{t.label}</span>
                {t.count > 0 && (
                  <span
                    className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center text-white"
                    style={{ background: t.alert ? '#EF4444' : accent }}
                  >
                    {t.count > 9 ? '9+' : t.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* conteúdo das abas */}
        <div>
          {tab === 'teoria' && (
            <TabTheory
              subtopic={subtopic}
              subjectId={subjectId}
              topicId={topicId}
              subtopicId={subtopicId}
              accent={accent}
            />
          )}
          {tab === 'mapa' && (
            <TabMapa
              subtopic={subtopic}
              subjectId={subjectId}
              topicId={topicId}
              subtopicId={subtopicId}
            />
          )}
          {tab === 'flashcards' && (
            <TabFlashcards
              subtopic={subtopic}
              subjectId={subjectId}
              topicId={topicId}
              subtopicId={subtopicId}
              accent={accent}
            />
          )}
          {tab === 'feynman' && (
            <TabFeynman
              subtopic={subtopic}
              subjectId={subjectId}
              topicId={topicId}
              subtopicId={subtopicId}
            />
          )}
          {tab === 'memorizacao' && (
            <TabMemorization
              subtopic={subtopic}
              subjectId={subjectId}
              topicId={topicId}
              subtopicId={subtopicId}
              accent={accent}
            />
          )}
          {tab === 'gaps' && (
            <TabGaps
              subtopic={subtopic}
              subjectId={subjectId}
              topicId={topicId}
              subtopicId={subtopicId}
            />
          )}
          {tab === 'historico' && (
            <TabHistory
              subtopic={subtopic}
              subjects={subjects}
              subjectId={subjectId}
            />
          )}
        </div>

        {/* gerar revisão manual */}
        <div
          className="flex gap-3 pt-2 border-t"
          style={{ borderColor: 'var(--border)' }}
        >
          <button
            onClick={() => {
              generateRevisions(subjectId, topicId, subtopicId);
              toast.success('Revisão R1 gerada!');
            }}
            className="flex-1 py-2.5 rounded-xl text-xs font-bold border transition-all hover:bg-white/5"
            style={{ borderColor: 'var(--border)', color: 'var(--text-dim)' }}
          >
            🔄 Gerar revisão R1
          </button>
          <button
            onClick={() => navigate(`/study/subjects/${subjectId}`)}
            className="flex-1 py-2.5 rounded-xl text-xs font-bold border transition-all hover:bg-white/5"
            style={{ borderColor: 'var(--border)', color: 'var(--text-dim)' }}
          >
            ← Voltar à matéria
          </button>
        </div>
      </div>
    </StudyLayout>
  );
}
