import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
  exit: { opacity: 0, y: 15, scale: 0.8, transition: { duration: 0.15 } },
};

/* ═══════════════════════════════════════════════════════
   BOTTOM BAR — Unified: Mobile (nav+hex) + Desktop (floating hex)
   ════════════════════════════════════════════════════════ */

export default function BottomBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [hexOpen, setHexOpen] = useState(false);
  const openSessionModal = useSessionModalStore(s => s.openModal || s.openSessionModal);
  const { isSessionActive, timeLeft, totalTime, subjectName, topicName } = useActiveSessionUIStore();

  // Desktop: detect screen size
  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth >= 1024 : false
  );
  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= 1024);
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const progressRatio = totalTime > 0 ? timeLeft / totalTime : 0;
  const clampedRatio = Math.max(0, Math.min(1, progressRatio));

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

  // Desktop radial menu items
  const desktopMenuItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Home' },
    { path: '/calendar', icon: Calendar, label: 'Calendário' },
    { path: '/study', icon: BookOpen, label: 'Estudo' },
    { path: '/health', icon: Dumbbell, label: 'Saúde' },
    { path: '/rpg', icon: Swords, label: 'Aventura' },
    { path: '/achievements', icon: Trophy, label: 'Conquistas' },
    { path: '/finance', icon: Wallet, label: 'Finanças' },
    { path: '/analytics', icon: BarChart3, label: 'Analytics' },
    { path: '/settings', icon: Settings, label: 'Config' },
  ];

  // Mobile nav items
  const mobileNavItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Home' },
    { path: '/calendar', icon: Calendar, label: 'Calendário' },
    { path: '/study', icon: BookOpen, label: 'Estudo' },
    { path: '/health', icon: Dumbbell, label: 'Saúde' },
  ];

  return (
    <>
      {/* ═══ MOBILE: Bottom Nav + Hex Center ═══ */}
      <div
        className="lg:hidden fixed bottom-0 left-0 right-0 z-[89] border-t backdrop-blur-xl"
        style={{
          background: 'rgba(17, 17, 24, 0.92)',
          borderColor: 'var(--nav-border)',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
      >
        <div className="flex items-center justify-center h-20 px-2 max-w-lg mx-auto gap-2">
          {/* 4 nav items */}
          {mobileNavItems.map((item) => {
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

          {/* Hex FAB — center of nav */}
          <motion.button
            onClick={handleHexTap}
            whileTap={{ scale: 0.95 }}
            className={`w-14 h-14 rounded-full flex items-center justify-center text-primary shadow-xl ${
              hexOpen
                ? 'bg-gradient-to-br from-primary to-secondary shadow-lg shadow-primary/30'
                : 'bg-gradient-to-br from-primary/80 to-secondary/80 shadow-md'
            }`}
            style={hexClipStyle}
          >
            <motion.div
              animate={{ rotate: hexOpen ? 180 : 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="text-2xl"
              style={{ fontFamily: 'serif' }}
            >
              🜁
            </motion.div>
          </motion.button>
        </div>

        {/* Mobile radial menu — opens above nav */}
        <AnimatePresence>
          {!isSessionActive && hexOpen && (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              className="absolute bottom-full left-0 right-0 z-[99] flex flex-col items-center gap-2 pb-8 pt-4"
              style={{ background: 'rgba(17, 17, 24, 0.95)', backdropFilter: 'blur(12px)' }}
            >
              {desktopMenuItems.map((item) => {
                const IconComponent = item.icon;
                return (
                  <motion.div key={item.path} variants={itemVariants}>
                    <button
                      onClick={() => handleNav(item.path)}
                      style={hexClipStyle}
                      className="w-11 h-11 flex items-center justify-center card-surface shadow-lg text-white cursor-pointer hover:scale-105 transition-all"
                    >
                      <IconComponent size={16} />
                    </button>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ═══ DESKTOP: Floating Hex FAB + Radial Menu ═══ */}
      {isDesktop && (
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

          {/* Radial Menu */}
          <AnimatePresence>
            {!isSessionActive && hexOpen && (
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
                className="absolute bottom-0 left-0 right-0 z-[99] flex flex-col items-center gap-2 pb-12 pt-12"
              >
                {desktopMenuItems.map((item) => {
                  const IconComponent = item.icon;
                  return (
                    <motion.div key={item.path} variants={itemVariants} className="relative group/item flex items-center justify-center">
                      <div className="absolute right-14 bg-background/95 backdrop-blur-md border border-white/10 text-text-main text-[10px] font-black uppercase tracking-wider py-1.5 px-3 rounded-lg shadow-xl opacity-0 group-hover/item:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
                        {item.label}
                      </div>
                      <button
                        onClick={() => handleNav(item.path)}
                        style={hexClipStyle}
                        className="w-12 h-12 flex items-center justify-center card-surface shadow-lg text-white cursor-pointer group-hover/item:scale-105 transition-all duration-300"
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

          {/* Hex Toggle Button */}
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
              onClick={handleHexTap}
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
                <div className="flex items-center justify-center animate-pulse">
                  <Activity size={24} strokeWidth={2.5} />
                </div>
              ) : (
                <motion.div
                  animate={{ rotate: hexOpen ? 180 : 0 }}
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
      )}
    </>
  );
}
