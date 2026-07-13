import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { RADAR_AXES } from '../shared/constants/xpRules'

const initialRadar = Object.fromEntries(RADAR_AXES.map(a => [a, 0]))

export const useXPStore = create(
  persist(
    (set, get) => ({
      logs: [],
      radar: { ...initialRadar },

      logXP: ({ action, xp, moduleOrigin, personaId, radarAxis }) => {
        const log = { id: `xp_${Date.now()}`, action, xp, moduleOrigin, personaId, radarAxis: radarAxis || 'disciplina', timestamp: Date.now() }
        set(state => ({
          logs: [...state.logs, log],
          radar: { ...state.radar, [log.radarAxis]: (state.radar[log.radarAxis] || 0) + xp }
        }))
      },

      getRadarNormalized: () => {
        const radar = get().radar
        const max = Math.max(...Object.values(radar), 1)
        return Object.fromEntries(Object.entries(radar).map(([k, v]) => [k, Math.round((v / max) * 100)]))
      },

      getTotalXP: () => get().logs.reduce((s, l) => s + l.xp, 0),

      getXPByModule: () => get().logs.reduce((acc, l) => {
        acc[l.moduleOrigin] = (acc[l.moduleOrigin] || 0) + l.xp
        return acc
      }, {}),
    }),
    { name: 'phoenix-xp' }
  )
)
