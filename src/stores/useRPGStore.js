import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { usePersonaStore } from './usePersonaStore';
import { useXPStore } from './useXPStore';

const DEFAULT_MISSIONS = [
  {
    id: 'm-1',
    title: 'Trindade do Dia',
    type: 'diária',
    req: 'Estudar 2 horas + Treinar + Beber 2L de Água',
    xpReward: 120,
    status: 'claimable',
  },
  {
    id: 'm-2',
    title: 'Foco Absoluto',
    type: 'diária',
    req: 'Realizar uma sessão de estudo ou reflexão sem interrupções (mínimo 15 min)',
    xpReward: 50,
    status: 'locked',
  },
  {
    id: 'm-3',
    title: 'Guerreiro de Ferro',
    type: 'semanal',
    req: 'Registrar 4 treinos de Musculação no Módulo de Saúde',
    xpReward: 250,
    status: 'claimable',
  },
  {
    id: 'm-4',
    title: 'Conquistador do Olimpo',
    type: 'épica',
    req: 'Alcançar a marca de 30 dias livres de um mau hábito',
    xpReward: 1000,
    status: 'locked',
  },
];

const DEFAULT_BADGES = [
  {
    id: 'b-estudioso',
    title: 'Estudioso de Ferro',
    description: 'Complete 10 sessões de estudo focadas',
    icon: '🛡️',
    unlocked: true,
    unlockedAt: Date.now() - 86400000,
  },
  {
    id: 'b-leotauro',
    title: 'Corpo de Leotauro',
    description: 'Mantenha o registro de musculação por 2 semanas seguidas',
    icon: '🦁',
    unlocked: false,
    unlockedAt: null,
  },
  {
    id: 'b-alma-gemea',
    title: 'Alma Gêmea',
    description: 'Atingir harmonia máxima no Módulo de Relacionamentos',
    icon: '💖',
    unlocked: false,
    unlockedAt: null,
  },
  {
    id: 'b-fogo',
    title: 'Alma de Fogo',
    description: 'Despertar a primeira Persona no Nível 5',
    icon: '🔥',
    unlocked: false,
    unlockedAt: null,
  },
];

export const useRPGStore = create(
  persist(
    (set, get) => ({
      missions: [...DEFAULT_MISSIONS],
      badges: [...DEFAULT_BADGES],

      claimMissionReward: (missionId) => {
        const { missions } = get();
        const mission = missions.find((m) => m.id === missionId);

        if (!mission || mission.status !== 'claimable') return false;

        // Get active persona
        const activePersona = usePersonaStore.getState().getActivePersona();
        const personaId = activePersona?.id || 'horus';

        // 1. Update status to claimed
        set({
          missions: missions.map((m) =>
            m.id === missionId ? { ...m, status: 'claimed' } : m
          ),
        });

        // 2. Add XP to the Active Persona in PersonaStore
        usePersonaStore.getState().addPersonaXP(personaId, mission.xpReward);

        // 3. Log the XP globally in XPStore
        useXPStore.getState().logXP({
          action: `Missão RPG: ${mission.title}`,
          xp: mission.xpReward,
          moduleOrigin: 'rpg',
          personaId,
          radarAxis: 'disciplina', // default RPG radar axis
        });

        return true;
      },

      unlockBadge: (badgeId) => {
        const { badges } = get();
        set({
          badges: badges.map((b) =>
            b.id === badgeId
              ? { ...b, unlocked: true, unlockedAt: Date.now() }
              : b
          ),
        });
      },

      toggleBadge: (badgeId) => {
        const { badges } = get();
        set({
          badges: badges.map((b) =>
            b.id === badgeId
              ? {
                  ...b,
                  unlocked: !b.unlocked,
                  unlockedAt: !b.unlocked ? Date.now() : null,
                }
              : b
          ),
        });
      },

      toggleMissionStatus: (missionId) => {
        const { missions } = get();
        set({
          missions: missions.map((m) => {
            if (m.id !== missionId) return m;
            let nextStatus = 'locked';
            if (m.status === 'locked') nextStatus = 'claimable';
            else if (m.status === 'claimable') nextStatus = 'claimed';
            else nextStatus = 'locked';
            return { ...m, status: nextStatus };
          }),
        });
      },

      resetAllRPG: () => {
        set({
          missions: [...DEFAULT_MISSIONS],
          badges: [...DEFAULT_BADGES],
        });
      },
    }),
    {
      name: 'phoenix-rpg',
    }
  )
);
