import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useUIStore } from '../stores/useUIStore';
import { useGameStore } from '../stores/useGameStore';
import clsx from 'clsx';

const MENU_BLOCKS = [
  {
    title: 'Visão',
    items: [
      { path: '/dashboard', label: 'Dashboard', icon: '⬡' },
      { path: '/calendar', label: 'Calendário', icon: '📅' },
      { path: '/rpg', label: 'Aventura', icon: '⚔️' },
      { path: '/achievements', label: 'Conquistas', icon: '🏆' },
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
  const name = useGameStore(s => s.name);
  const navigate = useNavigate();
  const w = sidebarOpen ? 260 : 80;
  const firstName = (name || 'Felipe').split(' ')[0];
  const initials = firstName.charAt(0).toUpperCase();

  return (
    <motion.aside
      animate={{ width: w }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      className="fixed top-0 left-0 h-screen z-50 flex flex-col overflow-hidden"
      style={{
        background: 'var(--bg-surface)',
        borderRight: '1px solid var(--nav-border)',
      }}
    >
      {/* ── LOGO ───────────────────────────────────────────────────────────── */}
      <button
        onClick={toggleSidebar}
        className="group flex items-center gap-3 p-4 border-b transition-all w-full text-left flex-shrink-0"
        style={{ borderColor: 'var(--nav-border)' }}
      >
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 transition-shadow duration-300 group-hover:shadow-[0_0_20px_rgba(16,185,129,0.25)]"
          style={{ background: 'linear-gradient(135deg, #10B981, #06B6D4)' }}
        >
          🜁
        </div>
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="font-bold text-sm whitespace-nowrap" style={{ color: 'var(--text-main)' }}>
                Phoenix OS
              </div>
              <div className="text-[10px] whitespace-nowrap" style={{ color: 'var(--text-dim)' }}>
                v5.0.0-alpha
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </button>

      {/* ── NAV ────────────────────────────────────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden p-3 space-y-4 scrollbar-hide">
        {MENU_BLOCKS.map((block, bIdx) => (
          <div key={bIdx} className="space-y-1">
            <AnimatePresence>
              {sidebarOpen && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-[10px] font-bold uppercase tracking-wider px-3 block select-none mb-1"
                  style={{ color: 'var(--text-dim)' }}
                >
                  {block.title}
                </motion.span>
              )}
            </AnimatePresence>

            <div
              className={clsx(
                'rounded-xl p-1.5 space-y-0.5 transition-all duration-300',
                !sidebarOpen && 'p-0 space-y-1'
              )}
              style={{
                background: sidebarOpen ? 'var(--nav-surface)' : 'transparent',
                border: sidebarOpen ? '1px solid var(--nav-border)' : '1px solid transparent',
              }}
            >
              {block.items.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    clsx(
                      'group/nav flex items-center gap-3 py-2.5 text-sm font-medium transition-all relative w-full rounded-lg',
                      sidebarOpen ? 'px-3 justify-start' : 'px-0 justify-center h-11 w-11 mx-auto',
                      isActive
                        ? 'border-l-2'
                        : 'border-l-2 border-transparent'
                    )
                  }
                  style={({ isActive }) =>
                    isActive
                      ? {
                          background: 'rgba(var(--nav-active-rgb), 0.1)',
                          color: 'var(--nav-active)',
                          borderLeftColor: 'var(--nav-active)',
                          boxShadow: '0 0 12px rgba(var(--nav-active-rgb), 0.15)',
                        }
                      : {
                          color: 'var(--text-muted)',
                        }
                  }
                >
                  {({ isActive }) => (
                    <>
                      <span
                        className={clsx(
                          'text-base flex-shrink-0 transition-all duration-200'
                        )}
                        style={
                          isActive
                            ? { filter: 'drop-shadow(0 0 6px rgba(var(--nav-active-rgb), 0.5))' }
                            : {}
                        }
                      >
                        {item.icon}
                      </span>
                      <AnimatePresence>
                        {sidebarOpen && (
                          <motion.span
                            initial={{ opacity: 0, x: -4 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -4 }}
                            transition={{ duration: 0.15 }}
                            className={clsx(
                              'flex-1 whitespace-nowrap overflow-hidden text-xs',
                              isActive && 'font-bold'
                            )}
                          >
                            {item.label}
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* ── USER FOOTER ───────────────────────────────────────────────────── */}
      <div
        className="flex-shrink-0 border-t p-3"
        style={{ borderColor: 'var(--nav-border)' }}
      >
        <button
          onClick={() => navigate('/settings')}
          className={clsx(
            'flex items-center gap-3 w-full rounded-xl py-2.5 transition-all duration-200 group cursor-pointer',
            sidebarOpen ? 'px-3 justify-start' : 'px-0 justify-center'
          )}
          style={{ '--tw-ring-color': 'rgba(var(--nav-active-rgb), 0.3)' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--nav-hover)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
          }}
        >
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black text-white flex-shrink-0 transition-shadow duration-300 group-hover:shadow-[0_0_16px_rgba(16,185,129,0.3)]"
            style={{ background: 'linear-gradient(135deg, #10B981, #06B6D4)' }}
          >
            {initials}
          </div>
          <AnimatePresence>
            {sidebarOpen && (
              <motion.div
                initial={{ opacity: 0, x: -4 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -4 }}
                transition={{ duration: 0.15 }}
                className="text-left overflow-hidden"
              >
                <div className="text-xs font-bold whitespace-nowrap" style={{ color: 'var(--text-main)' }}>
                  {firstName}
                </div>
                <div className="text-[10px] whitespace-nowrap" style={{ color: 'var(--text-dim)' }}>
                  Ver perfil →
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </button>
      </div>
    </motion.aside>
  );
}
