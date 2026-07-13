import { useState } from 'react';
import { useAudioStore } from '../../stores/useAudioStore';

export function GlobalAudioPlayer() {
  const {
    tracks,
    currentTrack,
    isPlaying,
    progress,
    volume,
    play,
    pause,
    setTrack,
    setProgress,
    setVolume,
    isVisible,
    closePlayer,
  } = useAudioStore();

  const [showPlaylist, setShowPlaylist] = useState(false);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);

  if (!currentTrack || !isVisible) return null;

  const fmtTime = (sec) => {
    if (isNaN(sec) || sec === undefined || sec === null) return '0:00';
    const m = Math.floor(sec / 60);
    const s = String(sec % 60).padStart(2, '0');
    return `${m}:${s}`;
  };

  const handlePlayPause = () => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  };

  const handleProgressBarChange = (e) => {
    setProgress(Number(e.target.value));
  };

  return (
    <div
      className="fixed z-50 bottom-[84px] left-4 right-4 md:left-6 md:right-auto md:bottom-6 w-auto md:w-80 rounded-2xl border transition-all duration-300"
      style={{
        background: 'rgba(23, 23, 27, 0.75)',
        backdropFilter: 'blur(16px)',
        borderColor: 'var(--border-strong)',
        boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.5)',
      }}
    >
      {/* Lista de Faixas Expansível (abre para cima) */}
      {showPlaylist && (
        <div
          className="border-b overflow-hidden max-h-52 overflow-y-auto custom-scrollbar transition-all duration-300 rounded-t-2xl"
          style={{ borderColor: 'var(--border)' }}
        >
          <div className="p-3 text-[10px] font-bold text-text-dim uppercase tracking-wider bg-white/2">
            🎧 Escolha a Frequência / Audiobook
          </div>
          <div className="divide-y divide-white/5">
            {tracks.map((track) => {
              const isSelected = track.id === currentTrack.id;
              return (
                <button
                  key={track.id}
                  onClick={() => {
                    setTrack(track);
                    setShowPlaylist(false);
                  }}
                  className="w-full text-left px-4 py-2.5 text-xs flex items-center justify-between hover:bg-white/5 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <p
                      className={`font-semibold truncate ${isSelected ? 'text-[var(--primary)]' : 'text-text-main'}`}
                    >
                      {track.title}
                    </p>
                    <p className="text-[10px] text-text-dim truncate">{track.author}</p>
                  </div>
                  {isSelected && (
                    <span className="text-[10px] font-bold text-[var(--primary)] shrink-0 ml-2">
                      {isPlaying ? '● TOCANDO' : 'PAUSADO'}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Interface Principal do Player */}
      <div className="p-3.5 flex flex-col space-y-2">
        <div className="flex items-center justify-between gap-3">
          {/* Informações da Faixa */}
          <div className="min-w-0 flex-1 flex items-center gap-2.5">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0 ${isPlaying ? 'animate-spin-slow' : ''}`}
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid var(--border)',
              }}
            >
              {currentTrack.id.includes('hertz') || currentTrack.id.includes('alpha') || currentTrack.id.includes('gamma') ? '🧠' : '📚'}
            </div>
            <div className="min-w-0 flex-1">
              <p
                className="text-xs font-bold text-text-main truncate"
                style={{ letterSpacing: '-0.01em' }}
              >
                {currentTrack.title}
              </p>
              <p className="text-[10px] text-text-dim truncate">{currentTrack.author}</p>
            </div>
          </div>

          {/* Controles de Ação rápida */}
          <div className="flex items-center gap-1 shrink-0">
            {/* Playlist Toggle */}
            <button
              onClick={() => setShowPlaylist(!showPlaylist)}
              className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/5 transition-colors text-xs text-text-dim hover:text-text-main"
              title="Playlist"
            >
              {showPlaylist ? '✕' : '🎵'}
            </button>

            {/* Controle de Volume */}
            <div className="relative flex items-center">
              <button
                onClick={() => setShowVolumeSlider(!showVolumeSlider)}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/5 transition-colors text-xs text-text-dim hover:text-text-main"
                title="Ajustar Volume"
              >
                {volume === 0 ? '🔇' : volume < 0.4 ? '🔈' : '🔊'}
              </button>
              {showVolumeSlider && (
                <div
                  className="absolute bottom-10 right-0 bg-zinc-900 border border-white/10 p-2.5 rounded-xl flex items-center justify-center shadow-xl z-20"
                  onMouseLeave={() => setShowVolumeSlider(false)}
                >
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={volume}
                    onChange={(e) => setVolume(Number(e.target.value))}
                    className="w-20 h-1 accent-[var(--primary)] bg-zinc-700 rounded-lg cursor-pointer"
                  />
                </div>
              )}
            </div>

            {/* Botão Principal de Play/Pause */}
            <button
              onClick={handlePlayPause}
              className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold transition-all hover:scale-105 shadow-md shrink-0"
              style={{
                background: 'var(--primary)',
              }}
              title={isPlaying ? 'Pausar' : 'Tocar'}
            >
              {isPlaying ? '⏸' : '▶'}
            </button>

            {/* Botão Fechar / Minimizar (X) */}
            <button
              onClick={closePlayer}
              className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-red-500/10 hover:text-red-400 transition-colors text-xs text-text-dim"
              title="Fechar"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Barra de Progresso do Áudio */}
        <div className="flex flex-col space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[9px] text-text-dim font-medium tabular-nums">
              {fmtTime(progress)}
            </span>
            <input
              type="range"
              min="0"
              max={currentTrack.duration || 100}
              value={progress}
              onChange={handleProgressBarChange}
              className="flex-1 h-1 accent-[var(--primary)] bg-white/10 rounded-lg cursor-pointer"
            />
            <span className="text-[9px] text-text-dim font-medium tabular-nums">
              {fmtTime(currentTrack.duration)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
