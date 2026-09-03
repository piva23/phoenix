import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  BookOpen,
  Wallet,
  Activity,
  Calendar,
  Dumbbell,
  Swords,
  Trophy,
  BarChart3,
  Settings,
} from 'lucide-react';
import { useSessionModalStore } from '../../stores/useSessionModalStore';
import { useActiveSessionUIStore } from '../../stores/useActiveSessionUIStore';

function fmtTimer(sec) {
  if (sec === null || sec === undefined) return '00:00';
  return `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`;
}

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
  exit: { opacity: 0, y: 15, scale: 0.8, transition: { duration: 0.15} },
};

/* ════════════════════════════════════════════════════════
   HEX FAB — Mobile + Desktop
   ════════════════════════════════════════════════════════ */

function HexFAB({ isOpen, setIsOpen }) {
  const navigate = useNavigate();
  const openSessionModal = useSessionModalStore(s => s.openModal || s.openSessionModal);
  const { isSessionActive, timeLeft, totalTime, subjectName, topicName } = useActiveSessionUIStore();
  const progressRatio = totalTime > 0 ? timeLeft / totalTime : 0;
  const clampedRatio = Math.max(0, Math.min(1, progressRatio));

  const handleToggle = () => {
    if (isSessionActive && openSessionModal) {
      openSessionModal();
    } else {
      setIsOpen(!isOpen);
    }
  };

  // Check if on large screen (desktop) vs mobile
  const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 1024;

  // Menu items — desktop shows labels, mobile shows icons only
  const menuItems = isDesktop
    ? [
        { path: '/dashboard', icon: LayoutDashboard, label: 'Home' },
        { path: '/calendar', icon: Calendar, label: 'Calendário' },
        { path: '/study', icon: BookOpen, label: 'Estudo' },
        { path: '/health', icon: Dumbbell, label: 'Saúde' },
        { path: '/rpg', icon: Swords, label: 'Aventura' },
        { path: '/achievements', icon: Trophy, label: 'Conquistas' },
        { path: '/finance', icon: Wallet, label: 'Finanças' },
        { path: '/analytics', icon: BarChart3, label: 'Analytics' },
        { path: '/settings', icon: Settings, label: 'Config' },
      ]
    : [
        { path: '/dashboard', icon: LayoutDashboard },
        { path: '/calendar', icon: Calendar },
        { path: '/study', icon: BookOpen },
        { path: '/health', icon: Dumbbell },
        { path: '/rpg', icon: Swords },
        { path: '/achievements', icon: Trophy },
        { path: '/finance', icon: Wallet },
        { path: '/analytics', icon: BarChart3 },
        { path: '/settings', icon: Settings },
      ];

  return (
    <div className="fixed bottom-24 right-4 lg:bottom-6 lg:right-6 z-[92] lg:z-[999] flex-col items-center select-none group">
      {/* Session Tooltip — desktop only */}
      {isSessionActive && isDesktop && (
        <div className="hidden lg:block absolute bottom-20 bg-background/90 backdrop-blur-xl border border-white/10 px-4 py-2 rounded-full shadow-2xl flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none transform translate-y-2 group-hover:translate-y-0 z-[1000] whitespace-nowrap">
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
            className="absolute bottom-0 left-0 right-0 z-[99] flex flex-col items-center gap-2 pb-8 pt-8 md:pb-12 md:pt-12"
          >
            {menuItems.map((item) => {
              const IconComponent = item.icon;
              return (
                <motion.div key={item.label || item.name} variants={itemVariants} className="relative group/item flex items-center justify-center">
                  <div className="hidden lg:block absolute right-14 bg-background/95 backdrop-blur-md border border-white/10 text-text-main text-[10px] font-black uppercase tracking-wider py-1.5 px-3 rounded-lg shadow-xl opacity-0 group-hover/item:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
                    {item.label || item.name}
                  </div>
                  <button
                    onClick={item.path ? navigate(item.path) : item.action}
                    style={hexClipStyle}
                    className={`w-10 h-10 lg:w-12 lg:h-12 flex items-center justify-center card-surface shadow-lg transition-all duration-300 relative group-hover/item:scale-105 cursor-pointer ${item.label ? item.color : 'text-white'}`}
                  >
                    <IconComponent size={16} className="lg:hidden" />
                    <IconComponent size={18} className="hidden lg:block" />
                    <div className="absolute inset-0 bg-white/[0.02] group-hover/item:bg-transparent transition-colors" />
                  </button>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Master Toggle */}
      <div className="relative w-12 h-12 lg:w-16 lg:h-16 flex items-center justify-center">
        {isSessionActive && (
          <svg className="absolute w-[48px] h-[48px] lg:w-[62px] lg:h-[62px] -rotate-90 pointer-events-none z-20" viewBox="0 0 64 64">
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
          className={`w-11 h-11 lg:w-14 lg:h-14 flex items-center justify-center text-white cursor-pointer relative z-10 transition-all duration-300 ${
            isSessionActive
              ? 'bg-blue-600 shadow-lg shadow-blue-500/40 hover:scale-105'
              : 'bg-gradient-to-br from-primary to-secondary shadow-xl hover:shadow-2xl hover:shadow-primary/20'
          }`}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {isSessionActive ? (
            <div className="flex items-center justify-center animate-pulse"><Activity size={20} className="lg:hidden" strokeWidth={2.5} /><Activity size={24} className="hidden lg:block" strokeWidth={2.5} /></div>
          ) : (
            <motion.div
              animate={{ rotate: isOpen ? 180 : 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="flex items-center justify-center text-xl lg:text-2xl font-bold"
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

/* ════════════════════════════════════════════════════════
   EXPORT — HexMenu
   ════════════════════════════════════════════════════════ */

export default function HexMenu() {
  const [hexOpen, setHexOpen] = useState(false);
  return (
    <div className="flex">
      <HexFAB isOpen={hexOpen} setIsOpen={setHexOpen} />
    </div>
  );
}