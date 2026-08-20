import { useState } from 'react';
import { useVisionStore } from '../../../stores/useVisionStore';
import { usePersonaStore } from '../../../stores/usePersonaStore';
import { VisionItemModal } from './VisionItemModal';
import { motion } from 'framer-motion';

const TYPE_ICONS = {
  affirmation: '💬',
  text: '💬',
  image_url: '🖼️',
  image_upload: '🖼️',
  youtube: '▶️',
  instagram: '📸', // <-- Adicionado suporte ao ícone do Instagram
  audio_url: '🎵',
};

export function VisionManagerModal({ onClose, activePersonaId }) {
  const { items, toggleItem, deleteItem } = useVisionStore();
  const personas = usePersonaStore(s => s.personas);
  const [editItem, setEditItem] = useState(null);
  const getPersonaName = id =>
    !id ? 'Global' : personas.find(p => p.id === id)?.name || id;

  return (
    <>
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
            maxHeight: '80vh',
          }}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={e => e.stopPropagation()}
        >
          <div
            className="flex items-center justify-between p-5 border-b flex-shrink-0"
            style={{ borderColor: 'var(--border)' }}
          >
            <h2 className="font-semibold text-text-main">
              Gerenciar Vision Board
            </h2>
            <div className="flex items-center gap-2">
              <span className="text-xs text-text-dim">
                {items.length} itens
              </span>
              <button
                onClick={onClose}
                className="text-text-dim hover:text-text-main w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5"
              >
                ✕
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {items.length === 0 ? (
              <div className="text-center py-8 text-text-dim text-sm">
                Nenhum item ainda.
              </div>
            ) : (
              items.map(item => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 p-3 rounded-xl border transition-all"
                  style={{
                    borderColor: 'var(--border)',
                    background: item.active
                      ? 'var(--bg-surface-2)'
                      : 'transparent',
                    opacity: item.active ? 1 : 0.45,
                  }}
                >
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-xl flex-shrink-0"
                    style={{
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border)',
                    }}
                  >
                    {TYPE_ICONS[item.type] || '📄'}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-text-main truncate">
                      {item.title ||
                        item.text?.slice(0, 40) ||
                        item.url?.slice(0, 40) ||
                        'Sem título'}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-text-dim">{item.type}</span>
                      <span className="text-text-dim">·</span>
                      <span
                        className="text-xs px-1.5 py-0.5 rounded-full"
                        style={{
                          background: item.personaId
                            ? 'var(--primary)18'
                            : 'rgba(255,255,255,0.06)',
                          color: item.personaId
                            ? 'var(--primary)'
                            : 'var(--text-dim)',
                        }}
                      >
                        {getPersonaName(item.personaId)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => toggleItem(item.id)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg text-sm transition-all hover:bg-white/8"
                      style={{
                        color: item.active ? '#10B981' : 'var(--text-dim)',
                      }}
                    >
                      {item.active ? '●' : '○'}
                    </button>
                    <button
                      onClick={() => setEditItem(item)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg text-sm transition-all hover:bg-white/8 text-text-muted hover:text-text-main"
                    >
                      ✎
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm('Excluir?')) deleteItem(item.id);
                      }}
                      className="w-8 h-8 flex items-center justify-center rounded-lg text-sm transition-all hover:bg-red-500/10 text-text-dim hover:text-red-400"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </div>
      {editItem && (
        <VisionItemModal
          editItem={editItem}
          onClose={() => setEditItem(null)}
          activePersonaId={activePersonaId}
        />
      )}
    </>
  );
}
