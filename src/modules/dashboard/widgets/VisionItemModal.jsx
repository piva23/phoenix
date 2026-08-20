import { useState } from 'react';
import { useVisionStore } from '../../../stores/useVisionStore';
import { usePersonaStore } from '../../../stores/usePersonaStore';
import { motion } from 'framer-motion';

const TYPES = [
  { id: 'affirmation', label: 'Afirmação / Texto', icon: '💬' },
  { id: 'image_url', label: 'Imagem (URL)', icon: '🖼️' },
  { id: 'youtube', label: 'Vídeo YouTube', icon: '▶️' },
  { id: 'instagram', label: 'Post Instagram', icon: '📸' },
  { id: 'audio_url', label: 'Áudio (URL)', icon: '🎵' },
];

export function VisionItemModal({ onClose, activePersonaId, editItem = null }) {
  const { addItem, updateItem } = useVisionStore();
  const personas = usePersonaStore(s => s.personas);
  const [type, setType] = useState(editItem?.type || 'affirmation');
  const [form, setForm] = useState({
    title: editItem?.title || '',
    text: editItem?.text || '',
    url: editItem?.url || '',
    personaId: editItem?.personaId ?? null,
  });
  const s = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = () => {
    if (type === 'affirmation' && !form.text.trim()) return;
    if (
      ['image_url', 'youtube', 'audio_url'].includes(type) &&
      !form.url.trim()
    )
      return;
    if (editItem) updateItem(editItem.id, { ...form, type });
    else addItem({ ...form, type });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(12px)' }}
      onClick={onClose}
    >
      <motion.div
        className="w-full max-w-md rounded-2xl overflow-hidden"
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-strong)',
        }}
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        onClick={e => e.stopPropagation()}
      >
        <div
          className="flex items-center justify-between p-5 border-b"
          style={{ borderColor: 'var(--border)' }}
        >
          <h2 className="font-semibold text-text-main">
            {editItem ? 'Editar item' : 'Novo item — Vision Board'}
          </h2>
          <button
            onClick={onClose}
            className="text-text-dim hover:text-text-main w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5"
          >
            ✕
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="text-xs font-semibold text-text-muted uppercase tracking-wider block mb-2">
              Tipo
            </label>
            <div className="grid grid-cols-2 gap-2">
              {TYPES.map(t => (
                <button
                  key={t.id}
                  onClick={() => setType(t.id)}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all border"
                  style={{
                    borderColor:
                      type === t.id ? 'var(--primary)' : 'var(--border)',
                    background:
                      type === t.id
                        ? 'var(--primary)18'
                        : 'var(--bg-surface-2)',
                    color:
                      type === t.id ? 'var(--primary)' : 'var(--text-muted)',
                  }}
                >
                  <span>{t.icon}</span>
                  <span>{t.label}</span>
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-text-muted uppercase tracking-wider block mb-1.5">
              Título{' '}
              <span className="text-text-dim font-normal normal-case">
                (opcional)
              </span>
            </label>
            <input
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none transition-all"
              style={{
                background: 'var(--bg-surface-2)',
                border: '1px solid var(--border)',
                color: 'var(--text-main)',
              }}
              placeholder="Ex: Aprovação TJRS..."
              value={form.title}
              onChange={e => s('title', e.target.value)}
              onFocus={e => (e.target.style.borderColor = 'var(--primary)')}
              onBlur={e => (e.target.style.borderColor = 'var(--border)')}
            />
          </div>
          {type !== 'affirmation' && (
            <div>
              <label className="text-xs font-semibold text-text-muted uppercase tracking-wider block mb-1.5">
                {type === 'youtube'
                  ? 'URL do YouTube'
                  : type === 'instagram'
                    ? 'URL do Instagram'
                    : type === 'audio_url'
                      ? 'URL do Áudio'
                      : 'URL da Imagem'}
              </label>
              <input
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none transition-all"
                style={{
                  background: 'var(--bg-surface-2)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-main)',
                }}
                placeholder={
                  type === 'instagram'
                    ? 'https://www.instagram.com/p/...'
                    : 'https://...'
                }
                value={form.url}
                onChange={e => s('url', e.target.value)}
                onFocus={e => (e.target.style.borderColor = 'var(--primary)')}
                onBlur={e => (e.target.style.borderColor = 'var(--border)')}
              />
            </div>
          )}
          <div>
            <label className="text-xs font-semibold text-text-muted uppercase tracking-wider block mb-1.5">
              {type === 'affirmation'
                ? 'Afirmação *'
                : 'Texto sobreposto (opcional)'}
            </label>
            <textarea
              rows={3}
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none transition-all resize-none"
              style={{
                background: 'var(--bg-surface-2)',
                border: '1px solid var(--border)',
                color: 'var(--text-main)',
              }}
              placeholder={
                type === 'affirmation'
                  ? 'Eu sou aprovado no TJRS...'
                  : 'Texto sobre a mídia...'
              }
              value={form.text}
              onChange={e => s('text', e.target.value)}
              onFocus={e => (e.target.style.borderColor = 'var(--primary)')}
              onBlur={e => (e.target.style.borderColor = 'var(--border)')}
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-text-muted uppercase tracking-wider block mb-1.5">
              Visível para
            </label>
            <select
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
              style={{
                background: 'var(--bg-surface-2)',
                border: '1px solid var(--border)',
                color: 'var(--text-main)',
              }}
              value={form.personaId || ''}
              onChange={e => s('personaId', e.target.value || null)}
            >
              <option value="">🌐 Todas as personas (global)</option>
              {personas.map(p => (
                <option key={p.id} value={p.id}>
                  {p.icon} {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div
          className="flex gap-3 p-5 border-t"
          style={{ borderColor: 'var(--border)' }}
        >
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium text-text-muted border transition-all hover:text-text-main hover:bg-white/5"
            style={{ borderColor: 'var(--border)' }}
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
            style={{ background: 'var(--primary)' }}
          >
            {editItem ? 'Salvar' : 'Adicionar'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
