import { NavLink } from 'react-router-dom';
import { useRevisionStore } from '../../../stores/useRevisionStore';
import { useSessionModalStore } from '../../../stores/useSessionModalStore';
import { SessionQuickModal } from './SessionQuickModal';
import clsx from 'clsx';

const TABS = [
  { path: '/study/today', label: 'Hoje', icon: '🎯' },
  { path: '/study/overview', label: 'Visão Geral', icon: '◧' },
  { path: '/study/concursos', label: 'Concursos', icon: '🏛️' },
  { path: '/study/subjects', label: 'Matérias', icon: '📚' },
  { path: '/study/cycle', label: 'Ciclo', icon: '🔄' },
  { path: '/study/revisions', label: 'Revisões', icon: '🔁', badge: true },
  { path: '/study/session', label: 'Sessão', icon: '▶' },
  { path: '/study/redacao', label: 'Redação', icon: '✍️' },
  { path: '/study/questoes', label: 'Questões', icon: '❓' },
  { path: '/study/techniques', label: 'Técnicas', icon: '🧠' },
  { path: '/study/difficulty-map', label: 'Mapa de Falhas', icon: '🗺️' },
  { path: '/study/analytics', label: 'Analytics', icon: '📊' },
  { path: '/study/simulados', label: 'Simulados', icon: '🎯' },
];

export function StudyLayout({ children }) {
  const getPendingToday = useRevisionStore(s => s.getPendingToday);
  const pending = getPendingToday();
  const openSessionModal = useSessionModalStore(s => s.openModal);

  return (
    <div className="space-y-5">
      {/* barra de abas — sticky pra nunca sumir com conteúdo grande */}
      <div
        className="sticky top-0 z-20 -mt-6 pt-6 pb-2 overflow-x-auto scrollbar-hide -mx-1 px-1"
        style={{ background: 'var(--background)' }}
      >
        <div
          className="flex gap-1 min-w-max p-1 rounded-xl"
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
          }}
        >
          {TABS.map(tab => (
            <NavLink
              key={tab.path}
              to={tab.path}
              className={({ isActive }) =>
                clsx(
                  'relative flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap select-none',
                  isActive
                    ? 'text-white'
                    : 'text-text-muted hover:text-text-main hover:bg-white/5',
                  tab.soon && 'opacity-40 pointer-events-none'
                )
              }
              style={({ isActive }) =>
                isActive ? { background: 'var(--primary)' } : {}
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
              {tab.soon && (
                <span className="text-[9px] opacity-70 ml-0.5">●</span>
              )}
            </NavLink>
          ))}
        </div>
      </div>

      {/* conteúdo */}
      {children}

      {/* FAB — abre o modal global de sessão (persiste entre navegações) */}
      <button
        onClick={() => openSessionModal()}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-5 py-3 rounded-full font-bold text-sm text-white transition-transform hover:scale-105 active:scale-95"
        style={{
          background: 'var(--primary)',
          boxShadow: '0 4px 24px rgba(0,0,0,0.45)',
        }}
        title="Nova sessão de estudo"
      >
        ▶ Nova sessão
      </button>

      {/* Modal global de sessão — montado uma única vez aqui, controlado
          de qualquer página via useSessionModalStore().openModal(...) */}
      <SessionQuickModal />
    </div>
  );
}
