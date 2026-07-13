import React, { useState } from 'react';

const TRACKS = [
  { id: '1', title: 'Frequência Solfeggio 528Hz', subtitle: 'Reparação de DNA & Clareza', duration: '45:00', icon: '🧘' },
  { id: '2', title: 'O Obstáculo é o Caminho', subtitle: 'Audiolivro · Capítulo 3', duration: '18:24', icon: '📘' },
  { id: '3', title: 'Ondas Alfa para Foco Profundo', subtitle: 'Foco e Cognição Ativa', duration: '60:00', icon: '🧠' },
];

export function MediaWidget() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeTrack, setActiveTrack] = useState(TRACKS[0]);
  const [progress, setProgress] = useState(35); // simulated percent

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  return (
    <div
      className="rounded-3xl p-5 border flex flex-col justify-between relative overflow-hidden select-none"
      style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
    >
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-36 h-36 rounded-full blur-[80px] opacity-10 pointer-events-none" style={{ background: 'var(--primary)' }} />

      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <h4 className="text-[10px] font-bold text-text-dim uppercase tracking-wider">
              Áudio & Frequências
            </h4>
            <p className="text-xs text-text-muted">Apoio mental integrado</p>
          </div>
          <span className="text-xl">🎧</span>
        </div>

        {/* Currently playing info */}
        <div className="flex items-center gap-3 bg-white/[0.02] border border-white/5 p-3 rounded-2xl">
          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-lg shadow-inner">
            {activeTrack.icon}
          </div>
          <div className="flex-1 min-w-0">
            <h5 className="text-xs font-semibold text-text-main truncate">{activeTrack.title}</h5>
            <p className="text-[10px] text-text-dim truncate">{activeTrack.subtitle}</p>
          </div>
        </div>

        {/* Wave visualizer */}
        <div className="flex items-end justify-center gap-1 h-8 px-2">
          {[20, 60, 45, 80, 50, 90, 35, 70, 40, 60, 30, 85, 50, 65, 45, 95, 30].map((val, idx) => (
            <div
              key={idx}
              className={`w-1 rounded-full transition-all duration-300 ${
                isPlaying ? 'animate-pulse' : ''
              }`}
              style={{
                height: isPlaying ? `${val}%` : '15%',
                background: `linear-gradient(to top, var(--primary), var(--secondary))`,
                animationDelay: `${idx * 0.05}s`,
              }}
            />
          ))}
        </div>

        {/* Progress bar */}
        <div className="space-y-1">
          <div className="relative w-full h-1 bg-white/5 rounded-full overflow-hidden cursor-pointer">
            <div
              className="absolute left-0 top-0 h-full bg-gradient-to-r from-primary to-secondary transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between text-[9px] font-mono text-text-dim">
            <span>04:12</span>
            <span>{activeTrack.duration}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-5">
          <button
            onClick={() => {
              const idx = TRACKS.findIndex(t => t.id === activeTrack.id);
              const prevIdx = idx === 0 ? TRACKS.length - 1 : idx - 1;
              setActiveTrack(TRACKS[prevIdx]);
              setProgress(0);
            }}
            className="text-text-dim hover:text-text-main text-sm transition-colors p-1"
          >
            ⏮
          </button>
          
          <button
            onClick={togglePlay}
            className="w-10 h-10 rounded-full flex items-center justify-center text-white bg-gradient-to-br from-primary to-secondary hover:opacity-90 transition-all shadow-lg shadow-primary/20 scale-100 hover:scale-105 active:scale-95"
          >
            {isPlaying ? '⏸' : '▶'}
          </button>

          <button
            onClick={() => {
              const idx = TRACKS.findIndex(t => t.id === activeTrack.id);
              const nextIdx = idx === TRACKS.length - 1 ? 0 : idx + 1;
              setActiveTrack(TRACKS[nextIdx]);
              setProgress(0);
            }}
            className="text-text-dim hover:text-text-main text-sm transition-colors p-1"
          >
            ⏭
          </button>
        </div>
      </div>
    </div>
  );
}
