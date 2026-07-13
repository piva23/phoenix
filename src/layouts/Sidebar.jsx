import { NavLink } from 'react-router-dom';
import { useUIStore } from '../stores/useUIStore';
import { usePersonaStore } from '../stores/usePersonaStore';
import { useUserStore } from '../stores/useUserStore';
import { calcXPProgress } from '../shared/utils/xp';
import clsx from 'clsx';

const MENU_BLOCKS = [
  {
    title: 'Visão',
    items: [
      { path: '/dashboard', label: 'Dashboard', icon: '⬡' },
      { path: '/inbox', label: 'Inbox (Brain Dump)', icon: '💡' },
      { path: '/rpg', label: 'Aventura RPG', icon: '⚔️' },
    ]
  },
  {
    title: 'Execução',
    items: [
      { path: '/projects', label: 'Projetos', icon: '◇' },
      { path: '/study', label: 'Estudo', icon: '📚' },
      { path: '/finance', label: 'Finanças', icon: '💰' },
    ]
  },
  {
    title: 'Vida',
    items: [
      { path: '/health', label: 'Saúde', icon: '🏃' },
      { path: '/relationships', label: 'Relacionamentos', icon: '👥' },
      { path: '/spiritual', label: 'Espiritual', icon: '🌿' },
      { path: '/knowledge', label: 'Conhecimento', icon: '🧠' },
    ]
  },
  {
    title: 'Sistema',
    items: [
      { path: '/calendar', label: 'Calendário', icon: '📅' },
      { path: '/settings', label: 'Configurações', icon: '⚙️' },
    ]
  }
];

export function Sidebar() {
  const { sidebarOpen, toggleSidebar, openPersonaSwitcher } = useUIStore();
  const getActivePersona = usePersonaStore(s => s.getActivePersona);
  const { xp } = useUserStore();
  const persona = getActivePersona();
  const xpData = calcXPProgress(xp);
  const w = sidebarOpen ? 240 : 72; // Um pouco mais de espaço para os blocos ficarem esteticamente confortáveis

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
          style={{
            background:
              'linear-gradient(135deg, var(--primary), var(--secondary))',
          }}
        >
          🜁
        </div>
        {sidebarOpen && (
          <div className="overflow-hidden">
            <div className="font-bold text-sm text-text-main whitespace-nowrap">
              Phoenix OS
            </div>
            <div
              className="text-xs whitespace-nowrap"
              style={{ color: 'var(--primary)' }}
            >
              v3.0 Pro
            </div>
          </div>
        )}
      </button>

      {/* Nav com divisão em blocos (Inspirado em Linear/Notion) */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden p-3 space-y-4 scrollbar-hide">
        {MENU_BLOCKS.map((block, bIdx) => (
          <div key={bIdx} className="space-y-1">
            {sidebarOpen && (
              <span className="text-[10px] font-bold text-text-dim uppercase tracking-wider px-2 block select-none">
                {block.title}
              </span>
            )}
            
            <div className={clsx(
              "rounded-xl border border-white/5 bg-white/[0.02] p-1.5 space-y-1 transition-all duration-300",
              !sidebarOpen && "bg-transparent border-none p-0 space-y-2"
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
                      <span className="text-base flex-shrink-0">
                        {item.icon}
                      </span>
                      {sidebarOpen && (
                        <span className="flex-1 whitespace-nowrap overflow-hidden text-xs">
                          {item.label}
                        </span>
                      )}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Persona + XP */}
      <div className="border-t border-border p-3 space-y-2 flex-shrink-0 select-none">
        <div className="flex items-center gap-2 w-full p-2 rounded-lg">
          <div className="text-xl flex-shrink-0">{persona?.icon}</div>
          {sidebarOpen && (
            <div className="flex-1 overflow-hidden">
              <div className="text-xs font-semibold text-text-main whitespace-nowrap">
                {persona?.name}
              </div>
              <div
                className="text-[10px] whitespace-nowrap opacity-65"
                style={{ color: 'var(--primary)' }}
              >
                Lente Ativa
              </div>
            </div>
          )}
        </div>
        {sidebarOpen && (
          <div>
            <div className="flex justify-between text-[10px] text-text-dim mb-1">
              <span>Lv. {xpData.level}</span>
              <span>
                {xpData.currentXP}/{xpData.neededXP} XP
              </span>
            </div>
            <div className="h-1 rounded-full bg-surface-2 overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${xpData.progress}%`,
                  background: 'var(--primary)',
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
