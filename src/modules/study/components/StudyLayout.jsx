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

export function StudyLayout({ children }) {
  const location = useLocation();
  const getPendingToday = useRevisionStore(s => s.getPendingToday);
  const pending = getPendingToday();

  const activeTab = TABS.find(
    t => location.pathname === t.path || location.pathname.startsWith(t.path + '/')
  );

  const visibleTabs = TABS.filter(t => !t.hidden);

  return (
    <div className="max-w-7xl mx-auto animate-fade-in">
      {/* Tab bar */}
      <div className="mb-6">
        <div
          className="flex gap-1 p-1.5 rounded-2xl backdrop-blur-xl bg-white/[0.03] border border-white/[0.06]"
        >
          {visibleTabs.map(tab => {
            const isActive = activeTab?.path === tab.path;
            return (
              <NavLink
                key={tab.path}
                to={tab.path}
                className="relative flex-1 flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-colors whitespace-nowrap select-none min-w-0"
                style={{
                  color: isActive ? '#10B981' : 'var(--text-dim)',
                }}
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
    </div>
  );
}
