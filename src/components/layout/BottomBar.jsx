import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  BookOpen,
  Calendar,
  Dumbbell,
  Settings,
} from 'lucide-react';
import { useSessionModalStore } from '../../stores/useSessionModalStore';
import { useActiveSessionUIStore } from '../../stores/useActiveSessionUIStore';

function fmtTimer(sec) {
  if (sec === null || sec === undefined) return '00:00';
  return `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`;
}

const itemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.9 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 400, damping: 30 } },
  exit: { opacity: 0, y: 15, scale: 0.9, transition: { duration: 0.15 } },
};

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06, staggerDirection: -1 } },
};

/* ═══════════════════════════════════════════════════════
   BOTTOM BAR — Mobile (apresentação clean, 4 itens + hex FAB)
   ════════════════════════════════════════════════════════ */

export default function BottomBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [hexOpen, setHexOpen] = useState(false);
  const openSessionModal = useSessionModalStore(s => s.openModal || s.openSessionModal);
  const { isSessionActive, timeLeft } = useActiveSessionUIStore();

  const handleNav = (path) => {
    setHexOpen(false);
    navigate(path);
  };

  const handleHexTap = () => {
    if (isSessionActive && openSessionModal) {
      openSessionModal();
    } else {
      setHexOpen(!hexOpen);
    }
  };

  const isActive = (path) => location.pathname.startsWith(path);

  return (
    <>
      {/* Hex/Fab button — always visible on mobile bottom */}
      <motion.button
        onClick={handleHexTap}
        whileTap={{ scale: 0.95 }}
        className={`w-14 h-14 rounded-full flex items-center justify-center text-primary shadow-xl ${
          hexOpen
            ? 'bg-gradient-to-br from-primary to-secondary shadow-lg shadow-primary/30'
            : 'bg-gradient-to-br from-primary/80 to-secondary/80 shadow-md'
        }`}
        style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}
      >
        <span className="text-2xl" style={{ fontFamily: 'serif' }}>🜁</span>
      </motion.button>

      {/* Bottom nav — fixed at bottom, visible only on mobile (lg:hidden) */}
      <div
        className="fixed bottom-0 left-0 right-0 z-[89] lg:hidden border-t backdrop-blur-xl"
        style={{
          background: 'rgba(17, 17, 24, 0.92)',
          borderColor: 'var(--nav-border)',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
      >
        <div className="flex items-center justify-around h-20 px-2 max-w-lg mx-auto">
          {[
            { path: '/dashboard', icon: LayoutDashboard, label: 'Home' },
            { path: '/calendar', icon: Calendar, label: 'Calendário' },
            { path: '/study', icon: BookOpen, label: 'Estudo' },
            { path: '/health', icon: Dumbbell, label: 'Saúde' },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.path}
                onClick={() => handleNav(item.path)}
                className="flex flex-col items-center justify-center gap-1 w-12 h-12 rounded-xl transition-all duration-200 relative"
                style={{
                  color: isActive(item.path) ? 'var(--nav-active)' : 'var(--text-dim)',
                  background: isActive(item.path) ? 'rgba(var(--nav-active-rgb), 0.08)' : 'transparent',
                }}
              >
<Icon size={20} className="text-[20px]" />
                <span className="text-[8px] font-medium leading-none mt-0.5">{item.label}</span>
              </button>
            );
          })}

          {/* Session quick card — appears when session active, below nav */}
          {isSessionActive && (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              className="mt-2 flex flex-col items-center gap-2 bg-card rounded-xl p-3 backdrop-blur-sm border border-border-base text-center text-[10px]"
            >
              <span className="font-bold text-accent uppercase tracking-wider">
                Sessão Ativa
              </span>
              <div className="flex items-center justify-center gap-2 my-1">
                <BookOpen size={12} className="text-emerald-400" />
                <span className="text-emerald-300 text-[10px]">
                  Continue study
                </span>
              </div>
              <span className="text-dim text-[9px]">
                {fmtTimer((timeLeft || 0))}
              </span>
            </motion.div>
          )}
        </div>
      </div>
    </>
  );
}