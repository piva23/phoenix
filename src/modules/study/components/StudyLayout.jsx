import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useRevisionStore } from '../../../stores/useRevisionStore';
import { PageHeader } from '../../../components/layout/PageHeader';
import {
  Zap,
  BookOpen,
  Landmark,
  RotateCcw,
  HelpCircle,
  Repeat,
  FileText,
  BarChart3,
  PenTool,
} from 'lucide-react';

const TABS = [
  { path: '/study/today',      label: 'Hoje',      icon: Zap,        color: '#F59E0B' },
  { path: '/study/subjects',   label: 'Matérias',   icon: BookOpen,   color: '#3B82F6' },
  { path: '/study/subject',    label: 'Detalhe',    icon: null,       hidden: true },
  { path: '/study/concursos',  label: 'Concursos',  icon: Landmark,   color: '#8B5CF6' },
  { path: '/study/cycle',      label: 'Ciclos',     icon: RotateCcw,  color: '#06B6D4' },
  { path: '/study/questoes',   label: 'Questões',   icon: HelpCircle, color: '#A855F7' },
  { path: '/study/revisions',  label: 'Revisões',   icon: Repeat,     color: '#10B981', badge: true },
  { path: '/study/simulados',  label: 'Simulados',  icon: FileText,   color: '#EC4899' },
  { path: '/study/analytics',  label: 'Analytics',  icon: BarChart3,  color: '#3B82F6' },
  { path: '/study/redacao',    label: 'Redação',    icon: PenTool,    color: '#F97316' },
];

export function StudyLayout({ children, title, subtitle }) {
  const location = useLocation();
  const getPendingToday = useRevisionStore(s => s.getPendingToday);
  const pending = getPendingToday();

  const activeTab = TABS.find(
    t => !t.hidden && (location.pathname === t.path || location.pathname.startsWith(t.path + '/'))
  );

  const visibleTabs = TABS.filter(t => !t.hidden);

  const headerTitle = title || 'Estudo';
  const headerSubtitle = subtitle || new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  return (
    <div className="page-container">
      {/* ── HEADER ──────────────────────────────────────────────────────── */}
      <PageHeader
        icon="📚"
        title={headerTitle}
        subtitle={headerSubtitle}
      />

      {/* ── TAB BAR (horizontal scrollable, same as Health) ─────────────── */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide p-1.5 card-surface mb-6">
        {visibleTabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab?.path === tab.path;
          return (
            <NavLink
              key={tab.path}
              to={tab.path}
              className={`flex-shrink-0 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300 flex items-center gap-2 cursor-pointer select-none ${
                isActive
                  ? 'bg-gradient-to-r from-primary to-indigo-600 text-white shadow-lg shadow-primary/25'
                  : 'text-text-dim hover:text-white hover:bg-white/5'
              }`}
            >
              {Icon && <Icon size={14} style={{ color: isActive ? 'inherit' : tab.color }} />}
              {tab.label}
              {tab.badge && pending.length > 0 && (
                <span
                  className="ml-0.5 w-4 h-4 rounded-full text-[8px] font-black flex items-center justify-center text-white"
                  style={{ background: '#EF4444' }}
                >
                  {pending.length > 9 ? '9+' : pending.length}
                </span>
              )}
            </NavLink>
          );
        })}
      </div>

      {/* ── CONTENT ──────────────────────────────────────────────────────── */}
      <main className="overflow-x-hidden">
        {children}
      </main>
    </div>
  );
}
