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
      className="fixed top-0 left-0 h-screen z-50 flex flex-col overflow-hidden card-glass border-r border-white/5"
      style={{ background: 'linear-gradient(180deg, rgba(12,12,16,0.95) 0%, rgba(8,8,12,0.98) 100%)' }}
    >
      {/* ── LOGO ───────────────────────────────────────────────────────────── */}
      <button
        onClick={toggleSidebar}
        className="group flex items-center gap-3 p-4 border-b border-white/5 hover:bg-white/[0.03] transition-all w-full text-left flex-shrink-0"
      >
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 transition-shadow duration-300 group-hover:shadow-[0_0_20px_rgba(139,92,246,0.3)]"
          style={{ background: 'linear-gradient(135deg, var(--primary), var(--secondary))' }}
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
              <div className="font-bold text-sm text-text-main whitespace-nowrap">Phoenix OS</div>
              <div className="text-[10px] whitespace-nowrap text-text-dim">v5.0.0-alpha</div>
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
                  className="text-[10px] font-bold text-text-dim uppercase tracking-wider px-3 block select-none mb-1"
                >
                  {block.title}
                </motion.span>
              )}
            </AnimatePresence>

            <div className={clsx(
              'rounded-xl border border-white/5 bg-white/[0.02] p-1.5 space-y-0.5 transition-all duration-300',
              !sidebarOpen && 'bg-transparent border-none p-0 space-y-1'
            )}>
              {block.items.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    clsx(
                      'group/nav flex items-center gap-3 py-2.5 text-sm font-medium transition-all relative w-full rounded-lg',
                      sidebarOpen ? 'px-3 justify-start' : 'px-0 justify-center h-11 w-11 mx-auto',
                      isActive
                        ? 'bg-primary/10 text-primary border-l-2 border-primary shadow-[0_0_12px_rgba(139,92,246,0.2)]'
                        : 'text-text-muted hover:text-text-main hover:bg-white/5 border-l-2 border-transparent'
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <span className={clsx(
                        'text-base flex-shrink-0 transition-all duration-200',
                        isActive && 'drop-shadow-[0_0_6px_rgba(139,92,246,0.5)]'
                      )}>
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
      <div className="flex-shrink-0 border-t border-white/5 p-3">
        <button
          onClick={() => navigate('/settings')}
          className={clsx(
            'flex items-center gap-3 w-full rounded-xl py-2.5 transition-all duration-200 hover:bg-white/5 group cursor-pointer',
            sidebarOpen ? 'px-3 justify-start' : 'px-0 justify-center'
          )}
        >
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black text-white flex-shrink-0 transition-shadow duration-300 group-hover:shadow-[0_0_16px_rgba(139,92,246,0.35)]"
            style={{ background: 'linear-gradient(135deg, var(--primary), var(--secondary))' }}
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
                <div className="text-xs font-bold text-text-main whitespace-nowrap">{firstName}</div>
                <div className="text-[10px] text-text-dim whitespace-nowrap">Ver perfil →</div>
              </motion.div>
            )}
          </AnimatePresence>
        </button>
      </div>
    </motion.aside>
  );
}
