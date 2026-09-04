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
  X,
} from 'lucide-react';
import { useSessionModalStore } from '../../stores/useSessionModalStore';
import { useActiveSessionUIStore } from '../../stores/useActiveSessionUIStore';

function fmtTimer(sec) {
  if (sec === null || sec === undefined) return '00:00';
  return `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`;
}

const HEX = 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)';

const NAV = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Home' },
  { path: '/calendar', icon: Calendar, label: 'Calendário' },
  { path: '/study', icon: BookOpen, label: 'Estudo' },
  { path: '/health', icon: Dumbbell, label: 'Saúde' },
];

const EXTRAS = [
  { path: '/achievements', icon: Trophy, label: 'Conquistas' },
  { path: '/finance', icon: Wallet, label: 'Finanças' },
  { path: '/rpg', icon: Swords, label: 'Aventura' },
  { path: '/analytics', icon: BarChart3, label: 'Analytics' },
  { path: '/settings', icon: Settings, label: 'Config' },
];

const ALL = [...NAV, ...EXTRAS];

export default function BottomBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const openSessionModal = useSessionModalStore(s => s.openModal || s.openSessionModal);
  const { isSessionActive, timeLeft, totalTime, subjectName, topicName } = useActiveSessionUIStore();

  const [isDesktop, setIsDesktop] = useState(() => window.innerWidth >= 1024);
  useEffect(() => {
    const fn = () => setIsDesktop(window.innerWidth >= 1024);
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);

  const ratio = totalTime > 0 ? Math.max(0, Math.min(1, timeLeft / totalTime)) : 0;
  const active = (p) => location.pathname.startsWith(p);
  const go = (p) => { setOpen(false); navigate(p); };

  const toggleHex = () => {
    if (isSessionActive) {
      openSessionModal?.();
    } else {
      setOpen(o => !o);
    }
  };

  /* ═══════════════════════════════════════════════════════
     DESKTOP — Floating hex + radial menu
     ═══════════════════════════════════════════════════════ */
  if (isDesktop) {
    return (
      <div className="hidden lg:flex fixed bottom-6 right-6 z-[999] flex-col items-end group">
        {/* Session tooltip */}
        {isSessionActive && (
          <div className="absolute bottom-[72px] right-0 mb-2 bg-[#111118]/90 backdrop-blur-xl border border-white/10 px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none whitespace-nowrap">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative rounded-full h-2 w-2 bg-red-500"></span>
            </span>
            <span className="text-xs font-bold text-white max-w-[140px] truncate">{subjectName}</span>
            <span className="text-xs font-mono text-blue-400 font-black">{fmtTimer(timeLeft)}</span>
          </div>
        )}

        {/* Radial menu */}
        <AnimatePresence>
          {open && !isSessionActive && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="absolute bottom-[72px] right-0 z-[99] flex flex-col items-end gap-1.5 pb-4"
            >
              {ALL.map((item, i) => {
                const Ic = item.icon;
                const on = active(item.path);
                return (
                  <motion.div
                    key={item.path}
                    initial={{ opacity: 0, x: 24, scale: 0.8 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, x: 24, scale: 0.8 }}
                    transition={{ delay: i * 0.035, type: 'spring', stiffness: 500, damping: 30 }}
                    className="flex items-center gap-3"
                  >
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg opacity-0 group-hover:opacity-0 group-hover/item:opacity-100 transition-opacity pointer-events-none whitespace-nowrap bg-[#111118]/90 border border-white/10"
                      style={{ color: on ? 'var(--nav-active)' : 'rgba(255,255,255,0.7)' }}
                    >
                      {item.label}
                    </span>
                    <button onClick={() => go(item.path)} className="group/item">
                      <div
                        className="w-10 h-10 flex items-center justify-center transition-all duration-150 group-hover/item:scale-110 cursor-pointer"
                        style={{
                          clipPath: HEX,
                          background: on ? 'linear-gradient(135deg, var(--nav-active), var(--primary))' : 'rgba(255,255,255,0.07)',
                          color: on ? '#fff' : 'rgba(255,255,255,0.75)',
                        }}
                      >
                        <Ic size={15} strokeWidth={on ? 2.5 : 1.8} />
                      </div>
                    </button>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main hex */}
        <div className="relative w-[64px] h-[64px] flex items-center justify-center">
          {isSessionActive && (
            <svg className="absolute w-[60px] h-[60px] -rotate-90 pointer-events-none" viewBox="0 0 64 64">
              <circle cx="32" cy="32" r="29" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="2.5" />
              <circle cx="32" cy="32" r="29" fill="none" stroke="#60A5FA" strokeWidth="2.5" strokeLinecap="round"
                strokeDasharray={`${2*Math.PI*29}`} strokeDashoffset={`${2*Math.PI*29*(1-ratio)}`}
                className="transition-all duration-500" />
            </svg>
          )}
          <motion.button
            onClick={toggleHex}
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.94 }}
            className="relative z-10 w-12 h-12 flex items-center justify-center text-white cursor-pointer"
            style={{
              clipPath: HEX,
              background: isSessionActive
                ? 'linear-gradient(135deg, #2563EB, #3B82F6)'
                : open
                  ? 'linear-gradient(135deg, #EC4899, #8B5CF6)'
                  : 'linear-gradient(135deg, #8B5CF6, #EC4899)',
              boxShadow: '0 4px 20px rgba(139,92,246,0.3)',
            }}
          >
            {isSessionActive
              ? <Activity size={20} strokeWidth={2.5} />
              : <motion.span animate={{ rotate: open ? 90 : 0 }} transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                  className="text-lg font-bold" style={{ fontFamily: 'serif' }}>🜁</motion.span>
            }
          </motion.button>
        </div>
      </div>
    );
  }

  /* ═══════════════════════════════════════════════════════
     MOBILE — Bottom bar + hex menu
     ═══════════════════════════════════════════════════════ */
  return (
    <>
      {/* Bottom bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-[89] border-t"
        style={{ background: 'rgba(17,17,24,0.97)', borderColor: 'var(--nav-border)', paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        <div className="flex items-center justify-around h-[68px] px-2 max-w-lg mx-auto">
          {NAV.map((item) => {
            const Ic = item.icon;
            const on = active(item.path);
            return (
              <button key={item.path} onClick={() => go(item.path)}
                className="flex flex-col items-center justify-center gap-1 w-14 h-14 rounded-2xl transition-all"
                style={{ color: on ? 'var(--nav-active)' : 'var(--text-dim)', background: on ? 'rgba(var(--nav-active-rgb), 0.1)' : 'transparent' }}>
                <Ic size={22} strokeWidth={on ? 2.5 : 1.8} />
                <span className={`text-[10px] leading-none ${on ? 'font-bold' : 'font-medium'}`}>{item.label}</span>
              </button>
            );
          })}
          {/* Hex — last button */}
          <motion.button onClick={toggleHex} whileTap={{ scale: 0.85 }}
            className="flex flex-col items-center justify-center gap-1 w-14 h-14 rounded-2xl transition-all"
            style={{ color: isSessionActive ? '#3B82F6' : 'var(--text-dim)', background: open ? 'rgba(139,92,246,0.1)' : 'transparent' }}>
            <motion.span animate={{ rotate: open ? 90 : 0 }} transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              className="text-xl leading-none" style={{ fontFamily: 'serif' }}>🜁</motion.span>
            <span className="text-[10px] font-medium leading-none mt-0.5">
              {isSessionActive ? fmtTimer(timeLeft) : 'Menu'}
            </span>
          </motion.button>
        </div>
      </div>

      {/* Hex menu — radial above the hex button */}
      <AnimatePresence>
        {open && !isSessionActive && (
          <>
            <motion.div key="bg" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="lg:hidden fixed inset-0 z-[88] bg-black/40" />

            <div className="lg:hidden fixed z-[90]" style={{ bottom: '84px', right: '8px' }}>
              <div className="relative w-[140px] h-[140px]">
                {EXTRAS.map((item, i) => {
                  const Ic = item.icon;
                  const on = active(item.path);
                  const angle = -90 + (i * 36); // spread upward in arc
                  const rad = (angle * Math.PI) / 180;
                  const r = 56;
                  const x = Math.cos(rad) * r;
                  const y = Math.sin(rad) * r;

                  return (
                    <motion.button
                      key={item.path}
                      initial={{ opacity: 0, scale: 0.3, x: 0, y: 0 }}
                      animate={{ opacity: 1, scale: 1, x, y }}
                      exit={{ opacity: 0, scale: 0.3, x: 0, y: 0 }}
                      transition={{ delay: i * 0.04, type: 'spring', stiffness: 500, damping: 28 }}
                      onClick={() => go(item.path)}
                      className="absolute active:scale-90 transition-transform duration-100"
                      style={{ left: '50%', top: '50%', marginLeft: '-20px', marginTop: '-20px' }}
                    >
                      <div className="w-10 h-10 flex items-center justify-center"
                        style={{ clipPath: HEX, background: on ? 'linear-gradient(135deg, var(--nav-active), var(--primary))' : 'rgba(255,255,255,0.08)', color: on ? '#fff' : 'rgba(255,255,255,0.8)' }}>
                        <Ic size={16} strokeWidth={on ? 2.5 : 1.8} />
                      </div>
                      <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[7px] font-bold whitespace-nowrap"
                        style={{ color: 'rgba(255,255,255,0.5)' }}>{item.label}</span>
                    </motion.button>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* Session active — badge above hex */}
      <AnimatePresence>
        {isSessionActive && (
          <motion.div
            key="session-badge"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            onClick={openSessionModal}
            className="lg:hidden fixed z-[90] cursor-pointer active:scale-95 transition-transform"
            style={{ bottom: '80px', right: '12px' }}
          >
            <div className="flex items-center gap-2 bg-blue-600/90 backdrop-blur-sm px-3 py-2 rounded-xl shadow-lg">
              <Activity size={14} className="text-white" />
              <span className="text-[10px] font-bold text-white">{fmtTimer(timeLeft)}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
