import { useUserStore } from '../stores/useUserStore'
import { calcXPProgress } from '../shared/utils/xp'
import { PersonaSwitcher } from './PersonaSwitcher'
import { useUIStore } from '../stores/useUIStore'

export function Topbar() {
  const { xp } = useUserStore()
  const { toggleSidebar } = useUIStore()
  const xpData = calcXPProgress(xp)

  return (
    <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border px-6 py-3 flex items-center justify-between flex-shrink-0">
      <button onClick={toggleSidebar}
        className="hidden lg:flex w-8 h-8 items-center justify-center rounded-lg hover:bg-white/8 text-text-muted hover:text-text-main transition-colors text-base">
        ☰
      </button>
      <div className="flex items-center gap-3 ml-auto">
        <div className="hidden lg:flex items-center gap-2">
          <span className="text-xs text-text-dim font-medium">Lv.{xpData.level}</span>
          <div className="w-24 h-1.5 rounded-full bg-surface-2 overflow-hidden">
            <div className="h-full rounded-full" style={{ width: `${xpData.progress}%`, background: 'var(--primary)' }} />
          </div>
          <span className="text-xs text-text-dim">{xp} XP</span>
        </div>
        <PersonaSwitcher />
      </div>
    </header>
  )
}
