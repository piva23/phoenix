import { create } from 'zustand';

const DEFAULT_TRACKS = [
  {
    id: 'tr_alpha',
    title: 'Frequência Alpha (8Hz - Super Aprendizado)',
    author: 'Foco Mental Hertz',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    duration: 372, // em segundos
  },
  {
    id: 'tr_gamma',
    title: 'Frequência Gamma (40Hz - Hiper Foco & Cognição)',
    author: 'Foco Mental Hertz',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    duration: 425,
  },
  {
    id: 'tr_lofi',
    title: 'Deep Focus (Lofi Beats para Programar)',
    author: 'Phoenix Study Sessions',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
    duration: 302,
  },
  {
    id: 'tr_audiobook_1',
    title: 'Audiobook: Foco Extremo (Capítulo 1)',
    author: 'Phoenix Audiobooks',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3',
    duration: 318,
  },
];

// Instância singleton do elemento Audio do HTML5
let globalAudio = null;

if (typeof window !== 'undefined') {
  globalAudio = new Audio();
  globalAudio.preload = 'auto';
}

export const useAudioStore = create((set, get) => {
  // Configurar listeners do elemento de áudio real para atualizar o progresso no Zustand
  if (globalAudio) {
    globalAudio.addEventListener('timeupdate', () => {
      set({ progress: Math.floor(globalAudio.currentTime) });
    });

    globalAudio.addEventListener('ended', () => {
      const { tracks, currentTrack } = get();
      const currentIdx = tracks.findIndex(t => t.id === currentTrack?.id);
      if (currentIdx !== -1 && currentIdx < tracks.length - 1) {
        get().setTrack(tracks[currentIdx + 1]);
      } else {
        set({ isPlaying: false, progress: 0 });
      }
    });

    globalAudio.addEventListener('durationchange', () => {
      if (globalAudio.duration) {
        set(state => ({
          currentTrack: state.currentTrack 
            ? { ...state.currentTrack, duration: Math.floor(globalAudio.duration) } 
            : null
        }));
      }
    });
  }

  return {
    tracks: DEFAULT_TRACKS,
    currentTrack: DEFAULT_TRACKS[0],
    isPlaying: false,
    progress: 0,
    volume: 0.5,
    isVisible: true,

    closePlayer: () => {
      get().pause();
      set({ isVisible: false });
    },

    play: () => {
      if (!globalAudio) return;
      const { currentTrack } = get();
      if (currentTrack) {
        if (globalAudio.src !== currentTrack.url) {
          globalAudio.src = currentTrack.url;
        }
        globalAudio.volume = get().volume;
        globalAudio.play()
          .then(() => set({ isPlaying: true }))
          .catch(err => console.log('Interação do usuário necessária para tocar áudio:', err));
      }
    },

    pause: () => {
      if (!globalAudio) return;
      globalAudio.pause();
      set({ isPlaying: false });
    },

    setTrack: (track) => {
      if (!globalAudio) return;
      const wasPlaying = get().isPlaying;
      
      // Carregar nova fonte
      globalAudio.src = track.url;
      globalAudio.currentTime = 0;
      globalAudio.volume = get().volume;
      
      set({ currentTrack: track, progress: 0, isVisible: true });

      if (wasPlaying || true) { // Autoplay quando seleciona nova track
        globalAudio.play()
          .then(() => set({ isPlaying: true }))
          .catch(err => console.log('Erro de reprodução de áudio:', err));
      }
    },

    setProgress: (secs) => {
      if (!globalAudio) return;
      globalAudio.currentTime = secs;
      set({ progress: secs });
    },

    setVolume: (vol) => {
      if (!globalAudio) return;
      const safeVol = Math.max(0, Math.min(1, vol));
      globalAudio.volume = safeVol;
      set({ volume: safeVol });
    },
  };
});
