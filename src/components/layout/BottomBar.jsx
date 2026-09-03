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

/* ═══════════════════════════════════════════════════════
   BOTTOM BAR — Unified: Mobile (nav + floating hex) + Desktop (radial hex)
   ════════════════════════════════════════════════════════ */

export default function BottomBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [hexOpen, setHexOpen] = useState(false);
  const openSessionModal = useSessionModalStore(s => s.openModal || s.openSessionModal);
  const { isSessionActive, timeLeft, totalTime, subjectName, topicName } = useActiveSessionUIStore();

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

  const allMenuItems = [
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

  const mobileNavItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Home' },
    { path: '/calendar', icon: Calendar, label: 'Calendário' },
    { path: '/study', icon: BookOpen, label: 'Estudo' },
    { path: '/health', icon: Dumbbell, label: 'Saúde' },
  ];

  return (
    <>
      {/* ═══ MOBILE: Bottom Nav Bar ═══ */}
      <div
        className="lg:hidden fixed bottom-0 left-0 right-0 z-[89] border-t backdrop-blur-xl"
        style={{
          background: 'rgba(17, 17, 24, 0.95)',
          borderColor: 'var(--nav-border)',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
      >
        <div className="flex items-center justify-around h-[68px] px-4 max-w-lg mx-auto">
          {mobileNavItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <button
                key={item.path}
                onClick={() => handleNav(item.path)}
                className="flex flex-col items-center justify-center gap-1 w-14 h-14 rounded-2xl transition-all duration-200"
                style={{
                  color: active ? 'var(--nav-active)' : 'var(--text-dim)',
                  background: active ? 'rgba(var(--nav-active-rgb), 0.1)' : 'transparent',
                }}
              >
                <Icon size={22} strokeWidth={active ? 2.5 : 2} />
                <span className={`text-[10px] font-medium leading-none ${active ? 'font-bold' : ''}`}>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ═══ MOBILE: Hex FAB Flutuante (above bottom nav) ═══ */}
      <div className="lg:hidden fixed bottom-[84px] right-4 z-[90]">
        {/* Session badge */}
        {isSessionActive && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute -top-12 right-0 bg-blue-600/90 backdrop-blur-sm px-3 py-1.5 rounded-full flex items-center gap-2 whitespace-nowrap shadow-lg"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
            <span className="text-[10px] font-bold text-white">{fmtTimer(timeLeft)}</span>
          </motion.div>
        )}

        <motion.button
          onClick={handleHexTap}
          whileTap={{ scale: 0.9 }}
          className={`w-12 h-12 flex items-center justify-center text-white shadow-lg transition-all duration-200 ${
            isSessionActive
              ? 'bg-blue-600 shadow-blue-500/30'
              : hexOpen
                ? 'bg-gradient-to-br from-primary to-secondary shadow-primary/30'
                : 'bg-gradient-to-br from-primary/80 to-secondary/80 shadow-md'
          }`}
          style={hexClipStyle}
        >
          {isSessionActive ? (
            <Activity size={18} strokeWidth={2.5} />
          ) : (
            <motion.span
              animate={{ rotate: hexOpen ? 180 : 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="text-lg font-bold"
              style={{ fontFamily: 'serif' }}
            >
              🜁
            </motion.span>
          )}
        </motion.button>
      </div>

      {/* ═══ MOBILE: Bottom Sheet Menu ═══ */}
      <AnimatePresence>
        {hexOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setHexOpen(false)}
              className="lg:hidden fixed inset-0 z-[91] bg-black/60 backdrop-blur-sm"
            />
            {/* Sheet */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="lg:hidden fixed bottom-0 left-0 right-0 z-[92] rounded-t-3xl border-t"
              style={{
                background: 'rgba(17, 17, 24, 0.98)',
                borderColor: 'rgba(255,255,255,0.08)',
                paddingBottom: 'env(safe-area-inset-bottom, 0px)',
              }}
            >
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-10 h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.15)' }} />
              </div>

              <div className="px-4 pb-6">
                <p className="text-[10px] font-bold uppercase tracking-widest mb-3 px-1" style={{ color: 'var(--text-dim)' }}>
                  Navegação
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {allMenuItems.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.path);
                    return (
                      <button
                        key={item.path}
                        onClick={() => handleNav(item.path)}
                        className="flex flex-col items-center gap-2 py-3 rounded-2xl transition-all duration-200"
                        style={{
                          background: active ? 'rgba(var(--nav-active-rgb), 0.12)' : 'rgba(255,255,255,0.03)',
                          color: active ? 'var(--nav-active)' : 'var(--text-dim)',
                        }}
                      >
                        <Icon size={22} strokeWidth={active ? 2.5 : 1.8} />
                        <span className="text-[10px] font-semibold leading-none">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

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
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                className="absolute bottom-0 right-0 z-[99] flex flex-col items-end gap-2 pb-20 pr-2"
              >
                {allMenuItems.map((item, i) => {
                  const Icon = item.icon;
                  return (
                    <motion.div
                      key={item.path}
                      initial={{ opacity: 0, x: 20, scale: 0.8 }}
                      animate={{ opacity: 1, x: 0, scale: 1 }}
                      exit={{ opacity: 0, x: 20, scale: 0.8 }}
                      transition={{ delay: i * 0.03, type: 'spring', stiffness: 400, damping: 25 }}
                      className="relative group/item flex items-center gap-3"
                    >
                      <div className="bg-background/95 backdrop-blur-md border border-white/10 text-text-main text-[10px] font-black uppercase tracking-wider py-1.5 px-3 rounded-lg shadow-xl opacity-0 group-hover/item:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
                        {item.label}
                      </div>
                      <button
                        onClick={() => handleNav(item.path)}
                        style={hexClipStyle}
                        className="w-11 h-11 flex items-center justify-center card-surface shadow-lg text-white cursor-pointer group-hover/item:scale-110 transition-all duration-200"
                      >
                        <Icon size={16} />
                      </button>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Hex Toggle */}
          <div className="relative w-14 h-14 flex items-center justify-center">
            {isSessionActive && (
              <svg className="absolute w-[56px] h-[56px] -rotate-90 pointer-events-none z-20" viewBox="0 0 64 64">
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
              className={`w-12 h-12 flex items-center justify-center text-white cursor-pointer relative z-10 transition-all duration-300 ${
                isSessionActive
                  ? 'bg-blue-600 shadow-lg shadow-blue-500/40'
                  : 'bg-gradient-to-br from-primary to-secondary shadow-xl hover:shadow-2xl hover:shadow-primary/20'
              }`}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
            >
              {isSessionActive ? (
                <Activity size={20} strokeWidth={2.5} />
              ) : (
                <motion.span
                  animate={{ rotate: hexOpen ? 180 : 0 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  className="text-lg font-bold"
                  style={{ fontFamily: 'serif' }}
                >
                  🜁
                </motion.span>
              )}
            </motion.button>
          </div>
        </div>
      )}
    </>
  );
}
