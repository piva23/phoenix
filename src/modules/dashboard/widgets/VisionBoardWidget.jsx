import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVisionStore } from '../../../stores/useVisionStore';
import { usePersonaStore } from '../../../stores/usePersonaStore';
import { VisionItemModal } from './VisionItemModal';
import { VisionManagerModal } from './VisionManagerModal';

function getYouTubeId(url) {
  // Regex expandido para aceitar links normais, shorts, embeds e compartilhamentos curtos
  const m = url?.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([^&\n?#]+)/
  );
  return m ? m[1] : null;
}

function getInstagramEmbedUrl(url) {
  if (!url) return null;
  // Limpa parâmetros de consulta e garante o sufixo /embed
  const cleanUrl = url.split('?')[0].replace(/\/$/, '');
  return `${cleanUrl}/embed`;
}

function VisionItem({ item }) {
  const [playing, setPlaying] = useState(false);

  // Renderização: YouTube
  if (item.type === 'youtube') {
    const vid = getYouTubeId(item.url);
    return (
      <div className="relative w-full h-full bg-black rounded-2xl overflow-hidden">
        {!playing ? (
          <div
            className="w-full h-full flex items-center justify-center cursor-pointer relative"
            onClick={() => setPlaying(true)}
          >
            <img
              src={`https://img.youtube.com/vi/${vid}/maxresdefault.jpg`}
              alt={item.title || ''}
              className="w-full h-full object-cover"
              onError={e => {
                e.target.src = `https://img.youtube.com/vi/${vid}/hqdefault.jpg`;
              }}
            />
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center text-3xl"
                style={{
                  background: 'var(--primary)',
                  boxShadow: '0 0 32px var(--glow)',
                }}
              >
                ▶
              </div>
            </div>
            {item.title && (
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                <p className="text-white font-semibold text-sm">{item.title}</p>
              </div>
            )}
          </div>
        ) : (
          <iframe
            src={`https://www.youtube.com/embed/${vid}?autoplay=1`}
            className="w-full h-full"
            allow="autoplay; encrypted-media"
            allowFullScreen
            frameBorder="0"
          />
        )}
      </div>
    );
  }

  // Renderização: Instagram (Posts / Reels)
  if (item.type === 'instagram') {
    const embedUrl = getInstagramEmbedUrl(item.url);
    return (
      <div className="w-full h-full bg-[#121212] rounded-2xl overflow-hidden relative flex items-center justify-center">
        {embedUrl ? (
          <iframe
            src={embedUrl}
            className="w-full h-full"
            frameBorder="0"
            scrolling="no"
            allowTransparency="true"
            allow="encrypted-media"
          />
        ) : (
          <p className="text-xs text-text-dim">Link do Instagram inválido</p>
        )}
        {item.title && (
          <div className="absolute top-0 left-0 right-0 p-3 bg-gradient-to-b from-black/60 to-transparent pointer-events-none z-10">
            <p className="text-white font-semibold text-xs truncate">
              {item.title}
            </p>
          </div>
        )}
      </div>
    );
  }

  // Renderização: Imagens
  if (item.type === 'image_url' || item.type === 'image_upload') {
    return (
      <div className="relative w-full h-full rounded-2xl overflow-hidden">
        <img
          src={item.url}
          alt={item.title || ''}
          className="w-full h-full object-cover"
        />
        {(item.title || item.text) && (
          <div className="absolute bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
            {item.title && (
              <p className="text-white font-bold text-base mb-1">
                {item.title}
              </p>
            )}
            {item.text && (
              <p className="text-white/80 text-sm leading-relaxed">
                {item.text}
              </p>
            )}
          </div>
        )}
      </div>
    );
  }

  // Renderização: Áudio
  if (item.type === 'audio_url') {
    return (
      <div
        className="w-full h-full rounded-2xl flex flex-col items-center justify-center gap-6 p-6"
        style={{
          background:
            'linear-gradient(135deg,var(--primary)22,var(--secondary)11)',
          border: '1px solid var(--border)',
        }}
      >
        <div className="text-5xl">🎵</div>
        {item.title && (
          <p className="text-text-main font-bold text-lg text-center">
            {item.title}
          </p>
        )}
        <audio controls src={item.url} className="w-full max-w-xs" />
        {item.text && (
          <p className="text-text-muted text-sm text-center italic">
            "{item.text}"
          </p>
        )}
      </div>
    );
  }

  // Renderização Padrão: Afirmação / Texto puro
  return (
    <div
      className="w-full h-full rounded-2xl flex flex-col items-center justify-center p-8 text-center"
      style={{
        background:
          'linear-gradient(135deg,var(--primary)18,var(--secondary)0a,var(--bg-surface))',
      }}
    >
      <div className="text-5xl mb-6 opacity-30">"</div>
      <p
        className="font-bold leading-relaxed mb-4"
        style={{
          fontSize:
            item.text?.length > 100
              ? '1.1rem'
              : item.text?.length > 60
                ? '1.4rem'
                : '1.75rem',
          color: 'var(--text-main)',
        }}
      >
        {item.text}
      </p>
      {item.title && (
        <p
          className="text-sm font-medium mt-4"
          style={{ color: 'var(--primary)' }}
        >
          — {item.title}
        </p>
      )}
      <div className="text-5xl mt-4 opacity-30 rotate-180">"</div>
    </div>
  );
}

export function VisionBoardWidget() {
  const getItemsForPersona = useVisionStore(s => s.getItemsForPersona);
  const activePersonaId = usePersonaStore(s => s.activePersonaId);
  const items = getItemsForPersona(activePersonaId);
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [addOpen, setAddOpen] = useState(false);
  const [manageOpen, setManageOpen] = useState(false);

  useEffect(() => {
    if (items.length > 0) setIndex(Math.floor(Math.random() * items.length));
  }, [activePersonaId]);

  useEffect(() => {
    if (index >= items.length && items.length > 0) setIndex(items.length - 1);
  }, [items.length]);

  const go = dir => {
    setDirection(dir);
    setIndex(i => (i + dir + items.length) % items.length);
  };

  if (items.length === 0)
    return (
      <div
        className="rounded-2xl border border-dashed flex flex-col items-center justify-center gap-4 p-8 text-center"
        style={{
          borderColor: 'var(--border-strong)',
          minHeight: 280,
          background: 'var(--bg-surface)',
        }}
      >
        <div className="text-4xl opacity-30">🎯</div>
        <div>
          <p className="font-semibold text-text-muted mb-1">
            Vision Board vazio
          </p>
          <p className="text-sm text-text-dim">
            Adicione imagens, vídeos, posts do Instagram e afirmações que te
            inspiram
          </p>
        </div>
        <button
          onClick={() => setAddOpen(true)}
          className="px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
          style={{ background: 'var(--primary)' }}
        >
          + Adicionar primeiro item
        </button>
        {addOpen && (
          <VisionItemModal
            onClose={() => setAddOpen(false)}
            activePersonaId={activePersonaId}
          />
        )}
      </div>
    );

  const current = items[index];
  return (
    <div
      className="relative rounded-2xl overflow-hidden"
      style={{ minHeight: 300 }}
    >
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={current.id}
          custom={direction}
          variants={{
            enter: d => ({ x: d > 0 ? 60 : -60, opacity: 0 }),
            center: { x: 0, opacity: 1 },
            exit: d => ({ x: d > 0 ? -60 : 60, opacity: 0 }),
          }}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.25, ease: 'easeInOut' }}
          style={{ height: 300 }}
        >
          <VisionItem item={current} />
        </motion.div>
      </AnimatePresence>

      {items.length > 1 && (
        <>
          <button
            onClick={() => go(-1)}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold transition-all hover:scale-110 z-10"
            style={{
              background: 'rgba(0,0,0,0.5)',
              backdropFilter: 'blur(8px)',
            }}
          >
            ‹
          </button>
          <button
            onClick={() => go(1)}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold transition-all hover:scale-110 z-10"
            style={{
              background: 'rgba(0,0,0,0.5)',
              backdropFilter: 'blur(8px)',
            }}
          >
            ›
          </button>
        </>
      )}

      {items.length > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
          {items.map((_, i) => (
            <button
              key={i}
              onClick={() => {
                setDirection(i > index ? 1 : -1);
                setIndex(i);
              }}
              className="rounded-full transition-all"
              style={{
                width: i === index ? 20 : 6,
                height: 6,
                background:
                  i === index ? 'var(--primary)' : 'rgba(255,255,255,0.3)',
              }}
            />
          ))}
        </div>
      )}

      <div className="absolute top-3 right-3 flex gap-2 z-10">
        <button
          onClick={() => setAddOpen(true)}
          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all hover:scale-110"
          style={{
            background: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(8px)',
            color: 'white',
          }}
        >
          +
        </button>
        <button
          onClick={() => setManageOpen(true)}
          className="w-8 h-8 rounded-full flex items-center justify-center text-xs transition-all hover:scale-110"
          style={{
            background: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(8px)',
            color: 'white',
          }}
        >
          ⋯
        </button>
      </div>

      <div
        className="absolute top-3 left-3 px-2 py-1 rounded-full text-xs font-medium z-10"
        style={{
          background: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(8px)',
          color: 'rgba(255,255,255,0.7)',
        }}
      >
        {index + 1} / {items.length}
      </div>

      {addOpen && (
        <VisionItemModal
          onClose={() => setAddOpen(false)}
          activePersonaId={activePersonaId}
        />
      )}
      {manageOpen && (
        <VisionManagerModal
          onClose={() => setManageOpen(false)}
          activePersonaId={activePersonaId}
        />
      )}
    </div>
  );
}
