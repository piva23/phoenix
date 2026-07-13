// StudyVisionWidget.jsx — Mini vision board do módulo Study
// Fica no canto superior direito, alternando frases/imagens que o usuário cadastra.
// Usa o useVisionStore já existente, marcando os itens com module: 'study'
// pra não se misturar com o Vision Board geral do Dashboard.
import { useEffect, useMemo, useState } from 'react';
import { useVisionStore } from '../../../stores/useVisionStore';

const AUTO_MS = 7000;

// ── Modal de configuração ───────────────────────────────────────────────────

function VisionConfigModal({ items, onClose }) {
  const addItem = useVisionStore(s => s.addItem);
  const updateItem = useVisionStore(s => s.updateItem);
  const deleteItem = useVisionStore(s => s.deleteItem);
  const toggleItem = useVisionStore(s => s.toggleItem);

  const [type, setType] = useState('text');
  const [content, setContent] = useState('');
  const [caption, setCaption] = useState('');

  const inp = {
    background: 'var(--bg-surface-2)',
    border: '1px solid var(--border)',
    color: 'var(--text-main)',
  };

  function handleAdd() {
    if (!content.trim()) return;
    addItem({
      module: 'study',
      type,
      content: content.trim(),
      caption: caption.trim(),
    });
    setContent('');
    setCaption('');
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(12px)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl overflow-hidden flex flex-col"
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-strong)',
          maxHeight: '85vh',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div
          className="flex items-center justify-between p-4 border-b flex-shrink-0"
          style={{ borderColor: 'var(--border)' }}
        >
          <div>
            <h3
              className="font-bold text-sm"
              style={{ color: 'var(--text-main)' }}
            >
              ✨ Vision Board — Estudo
            </h3>
            <p
              className="text-[11px] mt-0.5"
              style={{ color: 'var(--text-dim)' }}
            >
              Frases e imagens pra te manter inspirado
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-text-dim w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5"
          >
            ✕
          </button>
        </div>

        {/* form de adicionar */}
        <div
          className="p-4 space-y-2.5 border-b flex-shrink-0"
          style={{ borderColor: 'var(--border)' }}
        >
          <div className="flex gap-2">
            {[
              { v: 'text', label: '📝 Frase' },
              { v: 'image', label: '🖼 Imagem (URL)' },
            ].map(opt => (
              <button
                key={opt.v}
                onClick={() => setType(opt.v)}
                className="flex-1 py-2 rounded-xl text-xs font-bold border transition-all"
                style={{
                  borderColor:
                    type === opt.v ? 'var(--primary)' : 'var(--border)',
                  background:
                    type === opt.v ? 'var(--primary)18' : 'transparent',
                  color:
                    type === opt.v ? 'var(--primary)' : 'var(--text-muted)',
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
          {type === 'text' ? (
            <textarea
              rows={2}
              className="w-full px-3 py-2 rounded-xl text-sm outline-none resize-none"
              style={inp}
              placeholder="Ex: A disciplina é a ponte entre metas e realizações."
              value={content}
              onChange={e => setContent(e.target.value)}
            />
          ) : (
            <input
              className="w-full px-3 py-2 rounded-xl text-sm outline-none"
              style={inp}
              placeholder="https://..."
              value={content}
              onChange={e => setContent(e.target.value)}
            />
          )}
          <input
            className="w-full px-3 py-2 rounded-xl text-xs outline-none"
            style={inp}
            placeholder="Legenda / autor (opcional)"
            value={caption}
            onChange={e => setCaption(e.target.value)}
          />
          <button
            onClick={handleAdd}
            disabled={!content.trim()}
            className="w-full py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-40"
            style={{ background: 'var(--primary)' }}
          >
            + Adicionar
          </button>
        </div>

        {/* lista */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {items.length === 0 && (
            <p
              className="text-center text-xs py-6"
              style={{ color: 'var(--text-dim)' }}
            >
              Nada cadastrado ainda.
            </p>
          )}
          {items.map(item => (
            <div
              key={item.id}
              className="flex items-center gap-2 p-2.5 rounded-xl border"
              style={{
                borderColor: 'var(--border)',
                background: 'var(--bg-surface-2)',
                opacity: item.active ? 1 : 0.45,
              }}
            >
              {item.type === 'image' ? (
                <img
                  src={item.content}
                  alt=""
                  className="w-10 h-10 rounded-lg object-cover shrink-0"
                />
              ) : (
                <span className="text-lg shrink-0">📝</span>
              )}
              <div className="flex-1 min-w-0">
                <p
                  className="text-xs truncate"
                  style={{ color: 'var(--text-main)' }}
                >
                  {item.type === 'image'
                    ? item.caption || item.content
                    : item.content}
                </p>
                {item.type === 'image' && item.caption && (
                  <p
                    className="text-[10px] truncate"
                    style={{ color: 'var(--text-dim)' }}
                  >
                    {item.caption}
                  </p>
                )}
              </div>
              <button
                onClick={() => toggleItem(item.id)}
                title={item.active ? 'Ocultar' : 'Reativar'}
                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/5 text-xs shrink-0"
                style={{ color: 'var(--text-dim)' }}
              >
                {item.active ? '👁' : '🚫'}
              </button>
              <button
                onClick={() => deleteItem(item.id)}
                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-500/20 text-xs shrink-0"
                style={{ color: 'var(--text-dim)' }}
              >
                🗑
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Widget principal ─────────────────────────────────────────────────────────

export function StudyVisionWidget() {
  const allItems = useVisionStore(s => s.items);
  const items = useMemo(
    () => allItems.filter(i => i.module === 'study' && i.active),
    [allItems]
  );

  const [index, setIndex] = useState(0);
  const [configOpen, setConfigOpen] = useState(false);
  const [paused, setPaused] = useState(false);

  // garante índice válido quando a lista muda
  useEffect(() => {
    if (index >= items.length) setIndex(0);
  }, [items.length, index]);

  // autoplay
  useEffect(() => {
    if (items.length <= 1 || paused) return;
    const t = setInterval(() => {
      setIndex(i => (i + 1) % items.length);
    }, AUTO_MS);
    return () => clearInterval(t);
  }, [items.length, paused]);

  const current = items[index];

  function next() {
    if (items.length === 0) return;
    setIndex(i => (i + 1) % items.length);
  }
  function prev() {
    if (items.length === 0) return;
    setIndex(i => (i - 1 + items.length) % items.length);
  }

  return (
    <>
      <div
        className="relative w-full sm:w-72 h-24 rounded-2xl overflow-hidden border shrink-0 group"
        style={{
          borderColor: 'var(--border)',
          background: 'var(--bg-surface)',
        }}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {!current ? (
          <button
            onClick={() => setConfigOpen(true)}
            className="w-full h-full flex flex-col items-center justify-center gap-1 text-xs font-bold"
            style={{ color: 'var(--text-dim)' }}
          >
            <span className="text-xl">✨</span>
            Adicionar inspiração
          </button>
        ) : (
          <>
            {current.type === 'image' ? (
              <div className="w-full h-full relative">
                <img
                  src={current.content}
                  alt=""
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                {current.caption && (
                  <p className="absolute bottom-1.5 left-2.5 right-2.5 text-[10px] font-semibold text-white truncate">
                    {current.caption}
                  </p>
                )}
              </div>
            ) : (
              <div
                className="w-full h-full flex flex-col items-center justify-center text-center px-4"
                style={{
                  background:
                    'linear-gradient(135deg, var(--primary)18, var(--secondary)18)',
                }}
              >
                <p
                  className="text-xs font-semibold leading-snug line-clamp-3"
                  style={{ color: 'var(--text-main)' }}
                >
                  “{current.content}”
                </p>
                {current.caption && (
                  <p
                    className="text-[10px] mt-1 font-bold"
                    style={{ color: 'var(--primary)' }}
                  >
                    — {current.caption}
                  </p>
                )}
              </div>
            )}

            {/* controles — aparecem no hover */}
            {items.length > 1 && (
              <>
                <button
                  onClick={prev}
                  className="absolute left-1 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ background: 'rgba(0,0,0,0.5)', color: 'white' }}
                >
                  ‹
                </button>
                <button
                  onClick={next}
                  className="absolute right-1 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ background: 'rgba(0,0,0,0.5)', color: 'white' }}
                >
                  ›
                </button>
              </>
            )}

            <button
              onClick={() => setConfigOpen(true)}
              className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ background: 'rgba(0,0,0,0.5)', color: 'white' }}
              title="Configurar"
            >
              ⚙
            </button>

            {/* dots */}
            {items.length > 1 && (
              <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 flex gap-1">
                {items.map((_, i) => (
                  <div
                    key={i}
                    className="w-1 h-1 rounded-full"
                    style={{
                      background:
                        i === index ? 'white' : 'rgba(255,255,255,0.4)',
                    }}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {configOpen && (
        <VisionConfigModal
          items={allItems.filter(i => i.module === 'study')}
          onClose={() => setConfigOpen(false)}
        />
      )}
    </>
  );
}
