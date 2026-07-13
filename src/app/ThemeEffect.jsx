import { useEffect } from 'react'
import { usePersonaStore } from '../stores/usePersonaStore'

export function ThemeEffect() {
  const activePersonaId = usePersonaStore(s => s.activePersonaId)
  const getActivePersona = usePersonaStore(s => s.getActivePersona)

  useEffect(() => {
    const persona = getActivePersona()
    if (!persona) return
    const root = document.documentElement
    root.style.setProperty('--primary',   persona.colorPrimary)
    root.style.setProperty('--secondary', persona.colorSecondary)
    root.style.setProperty('--accent',    persona.colorAccent)
    root.style.setProperty('--glow',      persona.glow || persona.colorPrimary + '55')
  }, [activePersonaId])

  return null
}
