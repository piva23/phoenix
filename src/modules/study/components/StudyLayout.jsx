import { NavLink } from 'react-router-dom';
import { useRevisionStore } from '../../../stores/useRevisionStore';
import clsx from 'clsx';

const TABS = [
  { path: '/study/today', label: 'Hoje', icon: '🎯' },
  { path: '/study/concursos', label: 'Concursos', icon: '🏛️' },
  { path: '/study/subjects', label: 'Matérias', icon: '📚' },
  { path: '/study/cycle', label: 'Ciclo', icon: '🔄' },
  { path: '/study/revisions', label: 'Revisões', icon: '🔁', badge: true },
  { path: '/study/questoes', label: 'Questões', icon: '❓' },
  { path: '/study/simulados', label: 'Simulados', icon: '📝' },
  { path: '/study/techniques', label: 'Técnicas', icon: '🧠' },
  { path: '/study/analytics', label: 'Analytics', icon: '📊' },
];

export function StudyLayout({ children }) {
  const getPendingToday = useRevisionStore(s => s.getPendingToday);
  const pending = getPendingToday();

  return (
    <div className="space-y-5">
      {/* barra de abas — sticky pra nunca sumir com conteúdo grande */}
      <div
        className="sticky top-0 z-20 -mt-6 pt-6 pb-2 overflow-x-auto scrollbar-hide -mx-1 px-1"
        style={{ background: 'var(--background)' }}
      >
        <div
          className="flex gap-1 min-w-max p-1 rounded-xl card-surface"
        >
          {TABS.map(tab => (
            <NavLink
              key={tab.path}
              to={tab.path}
              className={({ isActive }) =>
                clsx(
                  'relative flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap select-none',
                  isActive
                    ? 'bg-primary text-white shadow-md shadow-primary/20'
                    : 'text-text-muted hover:text-text-main hover:bg-white/5'
                )
              }
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
              {tab.badge && pending.length > 0 && (
                <span
                  className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center text-white"
                  style={{ background: '#EF4444' }}
                >
                  {pending.length > 9 ? '9+' : pending.length}
                </span>
              )}
            </NavLink>
          ))}
        </div>
      </div>

      {/* conteúdo */}
      {children}
    </div>
  );
}
