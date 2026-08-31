import { useEffect } from 'react'

export function ThemeEffect() {
  useEffect(() => {
    const root = document.documentElement
    root.style.setProperty('--primary', '#8B5CF6')
    root.style.setProperty('--secondary', '#EC4899')
    root.style.setProperty('--accent', '#10B981')
    root.style.setProperty('--glow', '#8B5CF655')
  }, [])

  return null
}
