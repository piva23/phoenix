import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  BookOpen,
  Calendar,
  Dumbbell,
  Swords,
  Wallet,
  BarChart3,
  Settings,
  Activity,
} from 'lucide-react';
import { useSessionModalStore } from '../../stores/useSessionModalStore';
import { useActiveSessionUIStore } from '../../stores/useActiveSessionUIStore';

/* ═══════════════════════════════════════════════════════
   NAV ITEMS — Bottom Bar
   ═══════════════════════════════════════════════════════ */

const NAV_ITEMS = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Home' },
  { path: '/calendar', icon: Calendar, label: 'Calendário' },
  { path: '/study', icon: BookOpen, label: 'Estudo' },
  { path: '/health', icon: Dumbbell, label: 'Saúde' },
];

/* ═══════════════════════════════════════════════════════
   EXTRA ITEMS — Hex radial menu
   ═══════════════════════════════════════════════════════ */

const EXTRA_ITEMS = [
  { path: '/rpg', icon: Swords, label: 'Aventura', color: 'text-purple-400' },
  { path: '/finance', icon: Wallet, label: 'Finanças', color: 'text-amber-400' },
  { path: '/analytics', icon: BarChart3, label: 'Analytics', color: 'text-blue-400' },
  { path: '/settings', icon: Settings, label: 'Config', color: 'text-zinc-400' },
];

const itemVariants = {
  hidden: { opacity: 0, y: 16, scale: 0.85 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 400, damping: 25 } },
  exit: { opacity: 0, y: 10, scale: 0.85, transition: { duration: 0.15 } },
};

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.04, staggerDirection: -1 } },
};

/* ═══════════════════════════════════════════════════════
   BOTTOM BAR — Mobile
   ═══════════════════════════════════════════════════════ */

export default function BottomBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [hexOpen, setHexOpen] = useState(false);
  const openSessionModal = useSessionModalStore(s => s.openModal || s.openSessionModal);
  const { isSessionActive } = useActiveSessionUIStore();
  const menuRef = useRef(null);

  // Click outside to close
  useEffect(() => {
    if (!hexOpen) return;
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setHexOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [hexOpen]);

  // Close on route change
  useEffect(() => {
    setHexOpen(false);
  }, [location.pathname]);

  const handleHexTap = () => {
    if (isSessionActive && openSessionModal) {
      openSessionModal();
    } else {
      setHexOpen(!hexOpen);
    }
  };

  const handleNav = (path) => {
    setHexOpen(false);
    navigate(path);
  };

  const handleExtra = (path) => {
    setHexOpen(false);
    navigate(path);
  };

  return (
    <div ref={menuRef}>
      {/* Radial menu — floats above bottom bar, no backdrop */}
      <AnimatePresence>
        {hexOpen && (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="fixed bottom-[76px] left-0 right-0 z-[91] flex flex-col items-center gap-2.5 px-4 pb-2 lg:hidden"
          >
            {/* Session button */}
            <motion.div variants={itemVariants}>
              <button
                onClick={() => { if (openSessionModal) openSessionModal(); setHexOpen(false); }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-full border text-xs font-bold shadow-lg backdrop-blur-xl transition-colors"
                style={{
                  background: 'rgba(16,185,129,0.12)',
                  borderColor: 'rgba(16,185,129,0.25)',
                  color: '#10B981',
                }}
              >
                <BookOpen size={14} />
                Sessão de Estudo
              </button>
            </motion.div>
            {/* Extra items in a row */}
            <motion.div variants={itemVariants} className="flex items-center gap-2">
              {EXTRA_ITEMS.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.path}
                    onClick={() => handleExtra(item.path)}
                    className="w-11 h-11 flex items-center justify-center rounded-2xl border shadow-lg backdrop-blur-xl transition-all active:scale-95"
                    style={{
                      background: 'rgba(15,15,20,0.85)',
                      borderColor: 'rgba(255,255,255,0.08)',
                    }}
                  >
                    <Icon size={18} className={item.color} />
                  </button>
                );
              })}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Bar */}
      <div
        className="fixed bottom-0 left-0 right-0 z-[89] lg:hidden border-t backdrop-blur-xl"
        style={{
          background: 'rgba(17, 17, 24, 0.92)',
          borderColor: 'var(--nav-border)',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
      >
        <div className="flex items-center justify-around h-16 px-2 max-w-lg mx-auto">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.startsWith(item.path);
            return (
              <button
                key={item.path}
                onClick={() => handleNav(item.path)}
                className="flex flex-col items-center justify-center gap-0.5 w-14 h-14 rounded-xl transition-all duration-200 relative"
                style={{
                  color: isActive ? 'var(--nav-active)' : 'var(--text-dim)',
                  background: isActive ? 'rgba(var(--nav-active-rgb), 0.08)' : 'transparent',
                }}
              >
                {isActive && (
                  <div
                    className="absolute top-0.5 left-1/2 -translate-x-1/2 w-5 h-[2px] rounded-full"
                    style={{ background: 'var(--nav-active)' }}
                  />
                )}
                <Icon size={20} strokeWidth={isActive ? 2.2 : 1.8} />
                <span className="text-[9px] font-semibold leading-none mt-0.5">{item.label}</span>
              </button>
            );
          })}

          {/* HEX BUTTON — integrated into bottom bar */}
          <div className="relative w-14 h-14 flex items-center justify-center">
            {isSessionActive && (
              <svg className="absolute w-[52px] h-[52px] -rotate-90 pointer-events-none z-20" viewBox="0 0 52 52">
                <circle cx="26" cy="26" r="23" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="2" />
                <circle
                  cx="26" cy="26" r="23" fill="none" stroke="#60A5FA" strokeWidth="2" strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 23}`}
                  strokeDashoffset={`${2 * Math.PI * 23 * 0.5}`}
                  className="transition-all duration-300"
                />
              </svg>
            )}
            <motion.button
              onClick={handleHexTap}
              className={`w-11 h-12 flex items-center justify-center text-white relative z-10 transition-all duration-200 rounded-2xl ${
                isSessionActive
                  ? 'bg-blue-600 shadow-lg shadow-blue-500/30'
                  : hexOpen
                    ? 'bg-gradient-to-br from-primary to-secondary shadow-lg shadow-primary/30'
                    : 'bg-gradient-to-br from-primary/80 to-secondary/80 shadow-md'
              }`}
              whileTap={{ scale: 0.92 }}
            >
              {isSessionActive ? (
                <div className="flex items-center justify-center animate-pulse">
                  <Activity size={18} strokeWidth={2.5} />
                </div>
              ) : (
                <motion.span
                  animate={{ rotate: hexOpen ? 45 : 0 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  className="text-lg font-bold"
                >
                  +
                </motion.span>
              )}
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
}
