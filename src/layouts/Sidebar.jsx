import { NavLink } from 'react-router-dom';
import { useUIStore } from '../stores/useUIStore';
import clsx from 'clsx';

const MENU_BLOCKS = [
  {
    title: 'Visão',
    items: [
      { path: '/dashboard', label: 'Dashboard', icon: '⬡' },
      { path: '/calendar', label: 'Calendário', icon: '📅' },
      { path: '/rpg', label: 'Aventura', icon: '⚔️' },
    ],
  },
  {
    title: 'Execução',
    items: [
      { path: '/health', label: 'Saúde', icon: '🏃' },
      { path: '/study', label: 'Estudo', icon: '📚' },
      { path: '/finance', label: 'Finanças', icon: '💰' },
    ],
  },
  {
    title: 'Sistema',
    items: [
      { path: '/analytics', label: 'Analytics', icon: '📊' },
      { path: '/settings', label: 'Configurações', icon: '⚙️' },
    ],
  },
];

export function Sidebar() {
  const { sidebarOpen, toggleSidebar } = useUIStore();
  const w = sidebarOpen ? 240 : 72;

  return (
    <div
      className="fixed top-0 left-0 h-screen bg-surface border-r border-border flex flex-col z-50 overflow-hidden"
      style={{ width: w, transition: 'width 0.25s cubic-bezier(.4,0,.2,1)' }}
    >
      {/* Logo */}
      <button
        onClick={toggleSidebar}
        className="flex items-center gap-3 p-4 border-b border-border hover:bg-white/5 transition-colors w-full text-left flex-shrink-0"
      >
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0 glow"
          style={{ background: 'linear-gradient(135deg, var(--primary), var(--secondary))' }}
        >
          🜁
        </div>
        {sidebarOpen && (
          <div className="overflow-hidden">
            <div className="font-bold text-sm text-text-main whitespace-nowrap">Phoenix OS</div>
            <div className="text-[10px] whitespace-nowrap text-text-dim">v5.0.0-alpha</div>
          </div>
        )}
      </button>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden p-3 space-y-4 scrollbar-hide">
        {MENU_BLOCKS.map((block, bIdx) => (
          <div key={bIdx} className="space-y-1">
            {sidebarOpen && (
              <span className="text-[10px] font-bold text-text-dim uppercase tracking-wider px-2 block select-none">
                {block.title}
              </span>
            )}
            <div className={clsx(
              'rounded-xl border border-white/5 bg-white/[0.02] p-1.5 space-y-1 transition-all duration-300',
              !sidebarOpen && 'bg-transparent border-none p-0 space-y-2'
            )}>
              {block.items.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    clsx(
                      'flex items-center gap-3 py-2 text-sm font-medium transition-all relative w-full rounded-lg',
                      sidebarOpen ? 'px-3 justify-start' : 'px-0 justify-center h-10 w-10 mx-auto',
                      isActive
                        ? 'text-text-main bg-white/10 shadow-sm border border-white/5'
                        : 'text-text-muted hover:text-text-main hover:bg-white/5'
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      {isActive && (
                        <div
                          className="absolute left-1.5 top-2 bottom-2 w-0.5 rounded-full"
                          style={{ background: 'var(--primary)' }}
                        />
                      )}
                      <span className="text-base flex-shrink-0">{item.icon}</span>
                      {sidebarOpen && (
                        <span className="flex-1 whitespace-nowrap overflow-hidden text-xs">{item.label}</span>
                      )}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>
    </div>
  );
}
