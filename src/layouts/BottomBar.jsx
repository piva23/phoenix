import { NavLink } from 'react-router-dom';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';

export function BottomBar() {
  const [menuOpen, setMenuOpen] = useState(false);

  // Itens fixos principais na barra inferior (4 + 1 Menu)
  const mainTabs = [
    { path: '/dashboard', icon: '⬡', label: 'Home' },
    { path: '/projects', icon: '◇', label: 'Projetos' },
    { path: '/study', icon: '📚', label: 'Estudo' },
    { path: '/finance', icon: '💰', label: 'Finanças' },
  ];

  // Restantes opções renderizadas dentro do Bottom Drawer / Menu
  const remainingModules = [
    { path: '/inbox', icon: '💡', label: 'Inbox (Dump)' },
    { path: '/rpg', icon: '⚔️', label: 'RPG' },
    { path: '/health', icon: '🏃', label: 'Saúde' },
    { path: '/relationships', icon: '👥', label: 'Relações' },
    { path: '/spiritual', icon: '🌿', label: 'Espiritual' },
    { path: '/knowledge', icon: '🧠', label: 'Conhecimento' },
    { path: '/calendar', icon: '📅', label: 'Calendário' },
    { path: '/personas', icon: '◈', label: 'Personas' },
    { path: '/settings', icon: '⚙️', label: 'Configurações' },
  ];

  return (
    <>
      {/* Bottom Drawer (Menu) */}
      <AnimatePresence>
        {menuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm"
              onClick={() => setMenuOpen(false)}
            />
            
            {/* Drawer Panel */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="fixed bottom-16 left-0 right-0 z-50 bg-surface border-t border-white/10 rounded-t-2xl p-4 shadow-2xl"
            >
              {/* Handle bar */}
              <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto mb-5 cursor-pointer" onClick={() => setMenuOpen(false)} />
              
              <div className="text-xs font-bold text-text-dim uppercase tracking-wider mb-4 px-1 select-none">
                Mais Ferramentas
              </div>

              {/* Grid das opções restantes */}
              <div className="grid grid-cols-4 gap-3">
                {remainingModules.map((mod) => (
                  <NavLink
                    key={mod.path}
                    to={mod.path}
                    onClick={() => setMenuOpen(false)}
                    className={({ isActive }) =>
                      clsx(
                        'flex flex-col items-center gap-2 p-3 rounded-xl border transition-all',
                        isActive
                          ? 'bg-white/10 border-white/10 text-text-main'
                          : 'bg-white/[0.02] border-white/5 hover:bg-white/5 text-text-muted hover:text-text-main'
                      )
                    }
                  >
                    <span className="text-2xl">{mod.icon}</span>
                    <span className="text-[10px] font-medium text-center truncate w-full">
                      {mod.label}
                    </span>
                  </NavLink>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Tab Bar */}
      <div className="bg-surface/90 backdrop-blur-xl border-t border-white/5 flex items-center h-16 justify-around px-2">
        {mainTabs.map((tab) => (
          <NavLink
            key={tab.path}
            to={tab.path}
            className={({ isActive }) =>
              clsx(
                'flex-1 flex flex-col items-center justify-center gap-1 h-full transition-all relative',
                isActive ? 'text-text-main font-semibold' : 'text-text-dim hover:text-text-muted'
              )
            }
          >
            {({ isActive }) => (
              <>
                <div className="relative flex items-center justify-center">
                  <span className="text-xl">{tab.icon}</span>
                  {isActive && (
                    <motion.div
                      layoutId="activeIndicator"
                      className="absolute -bottom-1.5 w-1 h-1 rounded-full"
                      style={{ background: 'var(--primary)', boxShadow: '0 0 6px var(--primary)' }}
                    />
                  )}
                </div>
                <span className="text-[9px] tracking-wide mt-0.5">{tab.label}</span>
              </>
            )}
          </NavLink>
        ))}

        {/* Menu Toggle Button */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className={clsx(
            'flex-1 flex flex-col items-center justify-center gap-1 h-full transition-all outline-none',
            menuOpen ? 'text-text-main font-semibold' : 'text-text-dim hover:text-text-muted'
          )}
        >
          <div className="relative flex items-center justify-center">
            <span className="text-xl">⋯</span>
            {menuOpen && (
              <div
                className="absolute -bottom-1.5 w-1 h-1 rounded-full"
                style={{ background: 'var(--primary)', boxShadow: '0 0 6px var(--primary)' }}
              />
            )}
          </div>
          <span className="text-[9px] tracking-wide mt-0.5">Menu</span>
        </button>
      </div>
    </>
  );
}
