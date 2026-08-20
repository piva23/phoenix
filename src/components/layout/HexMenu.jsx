import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import {
  LayoutDashboard,
  BookOpen,
  Wallet,
  Activity,
  Calendar,
  Dumbbell,
  Swords,
  BarChart3,
  Settings,
} from 'lucide-react';
import { useSessionModalStore } from '../../stores/useSessionModalStore';
import { useActiveSessionUIStore } from '../../stores/useActiveSessionUIStore';

function fmtTimer(sec) {
  if (sec === null || sec === undefined) return '00:00';
  return `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`;
}

/* ═══════════════════════════════════════════════════════
   HEX MENU — FAB hexagonal + bottom bar mobile
   ═══════════════════════════════════════════════════════ */

// Itens principais (BottomBar mobile + menu desktop)
const MAIN_ITEMS = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Home', color: 'text-white hover:bg-white/10 border-white/20' },
  { path: '/calendar', icon: Calendar, label: 'Calendário', color: 'text-orange-400 hover:bg-orange-500/10 border-orange-500/20' },
  { path: '/study', icon: BookOpen, label: 'Estudo', color: 'text-emerald-400 hover:bg-emerald-500/10 border-emerald-500/20' },
  { path: '/health', icon: Dumbbell, label: 'Saúde', color: 'text-red-400 hover:bg-red-500/10 border-red-500/20' },
];

// Itens secundários (drawer "Mais")
const EXTRA_ITEMS = [
  { path: '/rpg', icon: Swords, label: 'Aventura', color: 'text-purple-400 hover:bg-purple-500/10 border-purple-500/20' },
  { path: '/finance', icon: Wallet, label: 'Finanças', color: 'text-amber-400 hover:bg-amber-500/10 border-amber-500/20' },
  { path: '/analytics', icon: BarChart3, label: 'Analytics', color: 'text-blue-400 hover:bg-blue-500/10 border-blue-500/20' },
  { path: '/settings', icon: Settings, label: 'Config', color: 'text-zinc-400 hover:bg-zinc-500/10 border-zinc-500/20' },
];

const hexClipStyle = {
  clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
};

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05, staggerDirection: -1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.8 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 350, damping: 22 } },
  exit: { opacity: 0, y: 15, scale: 0.8, transition: { duration: 0.15 } },
};

/* ═══════════════════════════════════════════════════════
   BOTTOM BAR — Mobile only (lg:hidden)
   ═══════════════════════════════════════════════════════ */

function BottomBar({ onOpenDrawer }) {
  return (
    <div className="fixed bottom-0 left-0 right-0 lg:hidden z-[90]">
      <div className="bg-surface/90 backdrop-blur-xl border-t border-white/5 flex items-center h-16 justify-around px-2">
        {MAIN_ITEMS.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
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
                  <item.icon size={20} />
                  {isActive && (
                    <motion.div
                      layoutId="bottomBarIndicator"
                      className="absolute -bottom-1.5 w-1 h-1 rounded-full"
                      style={{ background: 'var(--primary)', boxShadow: '0 0 6px var(--primary)' }}
                    />
                  )}
                </div>
                <span className="text-[9px] tracking-wide mt-0.5">{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
        <button
          onClick={onOpenDrawer}
          className="flex-1 flex flex-col items-center justify-center gap-1 h-full transition-all text-text-dim hover:text-text-muted"
        >
          <div className="relative flex items-center justify-center">
            <span className="text-xl">⋯</span>
          </div>
          <span className="text-[9px] tracking-wide mt-0.5">Menu</span>
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   HEX FAB — Desktop only (hidden below lg)
   ═══════════════════════════════════════════════════════ */

function HexFAB({ isOpen, setIsOpen }) {
  const navigate = useNavigate();
  const openSessionModal = useSessionModalStore(s => s.openModal);
  const { isSessionActive, timeLeft, totalTime, subjectName, topicName } = useActiveSessionUIStore();
  const progressRatio = totalTime > 0 ? timeLeft / totalTime : 0;
  const clampedRatio = Math.max(0, Math.min(1, progressRatio));

  const handleToggle = () => {
    if (isSessionActive) {
      openSessionModal();
    } else {
      setIsOpen(!isOpen);
    }
  };

  const desktopMenuItems = [
    ...MAIN_ITEMS.map(i => ({ ...i, action: () => { navigate(i.path); setIsOpen(false); } })),
    { name: 'Sessão de Estudo', icon: BookOpen, color: 'text-emerald-400 hover:bg-emerald-500/10 border-emerald-500/20', action: () => { openSessionModal(); setIsOpen(false); } },
    ...EXTRA_ITEMS.map(i => ({ ...i, name: i.label, action: () => { navigate(i.path); setIsOpen(false); } })),
  ];

  return (
    <div className="hidden lg:flex fixed bottom-6 right-6 z-[999] flex-col items-center select-none group">
      {/* Session Tooltip */}
      {isSessionActive && (
        <div className="absolute bottom-20 bg-background/90 backdrop-blur-xl border border-white/10 px-4 py-2 rounded-full shadow-2xl flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none transform translate-y-2 group-hover:translate-y-0 z-[1000] whitespace-nowrap">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
          </span>
          <span className="text-xs text-text-main font-bold max-w-[150px] truncate">
            {subjectName}{topicName ? ` • ${topicName}` : ''}
          </span>
          <span className="text-xs font-mono text-blue-400 font-black">{fmtTimer(timeLeft)}</span>
        </div>
      )}

      {/* Radial Menu Items */}
      <AnimatePresence>
        {!isSessionActive && isOpen && (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="flex flex-col items-center gap-3 mb-4"
          >
            {desktopMenuItems.map((item) => {
              const IconComponent = item.icon;
              return (
                <motion.div key={item.label || item.name} variants={itemVariants} className="relative group/item flex items-center justify-center">
                  <div className="absolute right-14 bg-background/95 backdrop-blur-md border border-white/10 text-text-main text-[10px] font-black uppercase tracking-wider py-1.5 px-3 rounded-lg shadow-xl opacity-0 group-hover/item:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
                    {item.label || item.name}
                  </div>
                  <button
                    onClick={item.action}
                    style={hexClipStyle}
                    className={`w-11 h-11 flex items-center justify-center card-surface shadow-lg transition-all duration-300 relative group-hover/item:scale-105 cursor-pointer ${item.color}`}
                  >
                    <IconComponent size={18} />
                    <div className="absolute inset-0 bg-white/[0.02] group-hover/item:bg-transparent transition-colors" />
                  </button>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Master Toggle */}
      <div className="relative w-16 h-16 flex items-center justify-center">
        {isSessionActive && (
          <svg className="absolute w-[62px] h-[62px] -rotate-90 pointer-events-none z-20" viewBox="0 0 64 64">
            <circle cx="32" cy="32" r="29" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="2.5" />
            <circle
              cx="32" cy="32" r="29" fill="none" stroke="#60A5FA" strokeWidth="2.5" strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 29}`}
              strokeDashoffset={`${2 * Math.PI * 29 * (1 - clampedRatio)}`}
              className="transition-all duration-300"
            />
          </svg>
        )}
        <motion.button
          onClick={handleToggle}
          style={hexClipStyle}
          className={`w-14 h-14 flex items-center justify-center text-white cursor-pointer relative z-10 transition-all duration-300 ${
            isSessionActive
              ? 'bg-blue-600 shadow-lg shadow-blue-500/40 hover:scale-105'
              : 'bg-gradient-to-br from-primary to-secondary shadow-xl hover:shadow-2xl hover:shadow-primary/20'
          }`}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {isSessionActive ? (
            <div className="flex items-center justify-center animate-pulse"><Activity size={24} strokeWidth={2.5} /></div>
          ) : (
            <motion.div
              animate={{ rotate: isOpen ? 180 : 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="flex items-center justify-center text-2xl font-bold"
              style={{ fontFamily: 'serif' }}
            >
              🜁
            </motion.div>
          )}
          <div className="absolute inset-0 bg-white/5 opacity-0 hover:opacity-100 transition-opacity" />
        </motion.button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   DRAWER — Extra items (shared mobile + desktop)
   ═══════════════════════════════════════════════════════ */

function Drawer({ open, onClose }) {
  const navigate = useNavigate();
  const openSessionModal = useSessionModalStore(s => s.openSessionModal || s.openModal);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[95] bg-black/70 backdrop-blur-sm lg:z-[998]"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            className="fixed bottom-16 left-0 right-0 z-[96] lg:z-[999] card-glass rounded-t-2xl p-4 shadow-2xl border-t border-white/10"
          >
            <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto mb-5 cursor-pointer" onClick={onClose} />
            <div className="text-xs font-bold text-text-dim uppercase tracking-wider mb-4 px-1 select-none">Mais Módulos</div>

            {/* Session shortcut */}
            <button
              onClick={() => { openSessionModal(); onClose(); }}
              className="w-full flex items-center gap-3 p-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10 text-emerald-400 transition-all mb-3"
            >
              <BookOpen size={20} />
              <div className="text-left">
                <div className="text-xs font-bold">Sessão de Estudo</div>
                <div className="text-[10px] text-text-dim">Abrir timer e sessão</div>
              </div>
            </button>

            <div className="grid grid-cols-2 gap-3">
              {EXTRA_ITEMS.map((mod) => (
                <NavLink
                  key={mod.path}
                  to={mod.path}
                  onClick={onClose}
                  className={({ isActive }) =>
                    clsx(
                      'flex flex-col items-center gap-2 p-3 rounded-xl border transition-all',
                      isActive
                        ? 'card-glass border-white/10 text-text-main'
                        : 'card-surface hover:bg-white/5 text-text-muted hover:text-text-main'
                    )
                  }
                >
                  <mod.icon size={20} />
                  <span className="text-[10px] font-medium text-center truncate w-full">{mod.label}</span>
                </NavLink>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/* ═══════════════════════════════════════════════════════
   EXPORT — HexMenu (renders BottomBar + HexFAB + Drawer)
   ═══════════════════════════════════════════════════════ */

export default function HexMenu() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [hexOpen, setHexOpen] = useState(false);

  return (
    <>
      {/* Mobile Bottom Bar */}
      <BottomBar onOpenDrawer={() => setDrawerOpen(true)} />

      {/* Desktop Hex FAB */}
      <HexFAB isOpen={hexOpen} setIsOpen={setHexOpen} />

      {/* Shared Drawer */}
      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  );
}
