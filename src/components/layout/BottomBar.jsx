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

const hexClip = {
  clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
};

/* ═══════════════════════════════════════════════════════
   BOTTOM BAR — Mobile (5 items + hex last) + Desktop (floating hex)
   ════════════════════════════════════════════════════════ */

// Links úteis para a bottom bar mobile
const NAV_ITEMS = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Home' },
  { path: '/calendar', icon: Calendar, label: 'Calendário' },
  { path: '/study', icon: BookOpen, label: 'Estudo' },
  { path: '/health', icon: Dumbbell, label: 'Saúde' },
];

// Links extras (abertos pelo hex)
const EXTRA_ITEMS = [
  { path: '/achievements', icon: Trophy, label: 'Conquistas' },
  { path: '/finance', icon: Wallet, label: 'Finanças' },
  { path: '/rpg', icon: Swords, label: 'Aventura' },
  { path: '/analytics', icon: BarChart3, label: 'Analytics' },
  { path: '/settings', icon: Settings, label: 'Config' },
];

// Todos os itens (para radial desktop + bottom sheet mobile)
const ALL_ITEMS = [...NAV_ITEMS, ...EXTRA_ITEMS];

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

  return (
    <>
      {/* ═══════════════════════════════════════════════════════════
          MOBILE — Bottom bar com 5 itens (hex é o último)
          ═══════════════════════════════════════════════════════════ */}
      <div
        className="lg:hidden fixed bottom-0 left-0 right-0 z-[89] border-t"
        style={{
          background: 'rgba(17, 17, 24, 0.97)',
          borderColor: 'var(--nav-border)',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
      >
        <div className="flex items-center justify-around h-[68px] px-2 max-w-lg mx-auto">
          {/* 4 nav items */}
          {NAV_ITEMS.map((item) => {
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
                <Icon size={22} strokeWidth={active ? 2.5 : 1.8} />
                <span className={`text-[10px] font-medium leading-none ${active ? 'font-bold' : ''}`}>
                  {item.label}
                </span>
              </button>
            );
          })}

          {/* Hex — último botão da barra */}
          <motion.button
            onClick={handleHexTap}
            whileTap={{ scale: 0.9 }}
            className="flex flex-col items-center justify-center gap-1 w-14 h-14 rounded-2xl transition-all duration-200"
            style={{
              color: hexOpen ? 'var(--primary)' : isSessionActive ? '#3B82F6' : 'var(--text-dim)',
              background: hexOpen ? 'rgba(139,92,246,0.12)' : 'transparent',
            }}
          >
            <motion.span
              animate={{ rotate: hexOpen ? 180 : 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="text-xl leading-none"
              style={{ fontFamily: 'serif' }}
            >
              🜁
            </motion.span>
            <span className="text-[10px] font-medium leading-none mt-0.5">
              {isSessionActive ? fmtTimer(timeLeft) : 'Menu'}
            </span>
          </motion.button>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          MOBILE — Bottom sheet (extras ao tocar no hex)
          ═══════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {hexOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setHexOpen(false)}
              className="lg:hidden fixed inset-0 z-[91] bg-black/60"
            />
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
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-10 h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.15)' }} />
              </div>
              <div className="px-4 pb-6">
                <p className="text-[10px] font-bold uppercase tracking-widest mb-3 px-1" style={{ color: 'var(--text-dim)' }}>
                  Mais
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {EXTRA_ITEMS.map((item) => {
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

      {/* ═══════════════════════════════════════════════════════════
          DESKTOP — Floating hex FAB + radial menu
          ═══════════════════════════════════════════════════════════ */}
      {isDesktop && (
        <div className="hidden lg:flex fixed bottom-6 right-6 z-[999] flex-col items-end select-none group">
          {/* Session tooltip */}
          {isSessionActive && (
            <div className="absolute bottom-[72px] right-0 bg-background/90 backdrop-blur-xl border border-white/10 px-4 py-2 rounded-full shadow-2xl flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none whitespace-nowrap">
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

          {/* Radial menu */}
          <AnimatePresence>
            {!isSessionActive && hexOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: 20 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                className="absolute bottom-[72px] right-0 z-[99] flex flex-col items-end gap-2"
              >
                {ALL_ITEMS.map((item, i) => {
                  const Icon = item.icon;
                  const active = isActive(item.path);
                  return (
                    <motion.div
                      key={item.path}
                      initial={{ opacity: 0, x: 30 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 30 }}
                      transition={{ delay: i * 0.04, type: 'spring', stiffness: 400, damping: 25 }}
                      className="flex items-center gap-3"
                    >
                      {/* Label */}
                      <div className="bg-background/95 backdrop-blur-md border border-white/10 text-[10px] font-bold uppercase tracking-wider py-1.5 px-3 rounded-lg shadow-xl opacity-0 group-hover:opacity-0 group-hover/item:opacity-100 transition-opacity pointer-events-none whitespace-nowrap"
                        style={{ color: active ? 'var(--nav-active)' : 'var(--text-main)' }}
                      >
                        {item.label}
                      </div>
                      {/* Hex button */}
                      <button
                        onClick={() => handleNav(item.path)}
                        className="relative group/item"
                      >
                        <div
                          className={`w-11 h-11 flex items-center justify-center shadow-lg transition-all duration-200 group-hover/item:scale-110 group-hover/item:shadow-xl cursor-pointer ${
                            active ? 'text-white' : 'text-white/80'
                          }`}
                          style={{
                            ...hexClip,
                            background: active
                              ? 'linear-gradient(135deg, var(--nav-active), var(--primary))'
                              : 'rgba(255,255,255,0.08)',
                          }}
                        >
                          <Icon size={16} />
                        </div>
                      </button>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Main hex toggle */}
          <div className="relative w-[68px] h-[68px] flex items-center justify-center">
            {/* Progress ring (session active) */}
            {isSessionActive && (
              <svg className="absolute w-[64px] h-[64px] -rotate-90 pointer-events-none z-20" viewBox="0 0 64 64">
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
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              className="relative z-10 w-[56px] h-[56px] flex items-center justify-center text-white cursor-pointer transition-all duration-300"
              style={{
                ...hexClip,
                background: isSessionActive
                  ? 'linear-gradient(135deg, #2563EB, #3B82F6)'
                  : hexOpen
                    ? 'linear-gradient(135deg, #EC4899, #8B5CF6)'
                    : 'linear-gradient(135deg, #8B5CF6, #EC4899)',
                boxShadow: isSessionActive
                  ? '0 4px 24px rgba(37,99,235,0.4)'
                  : '0 4px 24px rgba(139,92,246,0.3)',
              }}
            >
              {isSessionActive ? (
                <Activity size={22} strokeWidth={2.5} />
              ) : (
                <motion.span
                  animate={{ rotate: hexOpen ? 180 : 0 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  className="text-2xl font-bold"
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
