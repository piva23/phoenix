import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useRevisionStore } from '../../../stores/useRevisionStore';
import clsx from 'clsx';

const TABS = [
  { path: '/study/today', label: 'Hoje', icon: '⚡' },
  { path: '/study/subjects', label: 'Matérias', icon: '📖' },
  { path: '/study/subject', label: 'Detalhe', icon: '🔍', hidden: true },
  { path: '/study/concursos', label: 'Concursos', icon: '🏛️' },
  { path: '/study/cycle', label: 'Ciclos', icon: '🔄' },
  { path: '/study/questoes', label: 'Questões', icon: '❓' },
  { path: '/study/revisions', label: 'Revisões', icon: '🔁', badge: true },
  { path: '/study/simulados', label: 'Simulados', icon: '📝' },
  { path: '/study/analytics', label: 'Analytics', icon: '📊' },
  { path: '/study/redacao', label: 'Redação', icon: '✍️' },
];

export function StudyLayout({ children, title, subtitle }) {
  const location = useLocation();
  const getPendingToday = useRevisionStore(s => s.getPendingToday);
  const pending = getPendingToday();

  const activeTab = TABS.find(
    t => location.pathname === t.path || location.pathname.startsWith(t.path + '/')
  );

  const visibleTabs = TABS.filter(t => !t.hidden);

  return (
    <div className="max-w-7xl mx-auto animate-fade-in">
      {/* Page Header (mobile) */}
      {(title || subtitle) && (
        <div className="mb-4 md:hidden">
          <div className="flex items-center gap-3">
            <span className="text-xl">📚</span>
            <div>
              <h1 className="text-lg font-extrabold tracking-tight" style={{ color: 'var(--text-main)' }}>
                {title}
              </h1>
              {subtitle && (
                <p className="text-[11px]" style={{ color: 'var(--text-dim)' }}>{subtitle}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Desktop Tab bar (hidden on mobile) */}
      <div className="mb-6 hidden md:block">
        <div className="flex gap-1 p-1.5 rounded-2xl backdrop-blur-xl bg-white/[0.03] border border-white/[0.06]">
          {visibleTabs.map(tab => {
            const isActive = activeTab?.path === tab.path;
            return (
              <NavLink
                key={tab.path}
                to={tab.path}
                className="relative flex-1 flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-colors whitespace-nowrap select-none min-w-0"
                style={{ color: isActive ? '#10B981' : 'var(--text-dim)' }}
              >
                {isActive && (
                  <motion.div
                    layoutId="studyTabV2"
                    className="absolute inset-0 rounded-xl"
                    style={{
                      background: 'rgba(16,185,129,0.08)',
                      border: '1px solid rgba(16,185,129,0.2)',
                      boxShadow: '0 0 20px rgba(16,185,129,0.1)',
                    }}
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative z-10 text-sm">{tab.icon}</span>
                <span className="relative z-10 hidden sm:inline">{tab.label}</span>
                {tab.badge && pending.length > 0 && (
                  <span
                    className="relative z-10 ml-1 w-4 h-4 rounded-full text-[8px] font-black flex items-center justify-center text-white"
                    style={{ background: '#EF4444' }}
                  >
                    {pending.length > 9 ? '9+' : pending.length}
                  </span>
                )}
              </NavLink>
            );
          })}
        </div>
      </div>

      {/* Content */}
      {children}

      {/* Mobile Bottom Nav (fixed, scrollable, ALL tabs) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        <div className="bg-[#0C0C10]/95 backdrop-blur-xl border-t border-white/[0.08] pt-1.5 pb-2">
          <div className="flex items-center gap-1 px-1.5 overflow-x-auto scrollbar-hide">
            {visibleTabs.map(tab => {
              const isActive = activeTab?.path === tab.path;
              return (
                <NavLink
                  key={tab.path}
                  to={tab.path}
                  className="relative flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl transition-all select-none flex-shrink-0 min-w-[52px]"
                  style={{ color: isActive ? '#10B981' : 'var(--text-dim)' }}
                >
                  <span className="text-base leading-none">{tab.icon}</span>
                  <span className="text-[8px] font-bold uppercase tracking-wider whitespace-nowrap">{tab.label}</span>
                  {isActive && (
                    <motion.div
                      layoutId="studyBottomNav"
                      className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-5 h-0.5 rounded-full"
                      style={{ background: '#10B981' }}
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                  {tab.badge && pending.length > 0 && (
                    <span
                      className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full text-[7px] font-black flex items-center justify-center text-white"
                      style={{ background: '#EF4444' }}
                    >
                      {pending.length > 9 ? '9+' : pending.length}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
