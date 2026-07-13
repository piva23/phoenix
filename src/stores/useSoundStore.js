import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Sons ambiente/foco que o usuário cadastra colando o link de um mp3 (ex:
// hospedado no Google Drive/Dropbox com link direto, freesound, etc).
// Guardamos só {id, name, url} — a reprodução em si acontece via <audio> no
// SessionQuickModal.

export const useSoundStore = create(
  persist(
    (set, get) => ({
      sounds: [], // { id, name, url }
      lastSoundId: null,
      volume: 0.5,

      addSound: data => {
        const sound = {
          id: `snd_${Date.now()}`,
          name: data.name?.trim() || 'Som sem nome',
          url: data.url?.trim(),
        };
        set(state => ({ sounds: [...state.sounds, sound] }));
        return sound;
      },

      removeSound: id =>
        set(state => ({
          sounds: state.sounds.filter(s => s.id !== id),
          lastSoundId: state.lastSoundId === id ? null : state.lastSoundId,
        })),

      setLastSound: id => set({ lastSoundId: id }),
      setVolume: v => set({ volume: v }),
    }),
    { name: 'phoenix-sounds' }
  )
);
