import { useState, useEffect } from 'react';
import { useSearchParams, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
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

import StudyTodayPage from './StudyTodayPage';
import StudySubjectsPage from './StudySubjectsPage';
import StudySubjectDetailPage from './StudySubjectDetailPage';
import StudySubtopicPage from './StudySubtopicPage';
import StudyConcursosPage from './StudyConcursosPage';
import StudyCyclePage from './StudyCyclePage';
import StudyQuestoesPage from './StudyQuestoesPage';
import StudyRevisionsPage from './StudyRevisionsPage';
import StudySimuladosPage from './StudySimuladosPage';
import StudyAnalyticsPage from './StudyAnalyticsPage';
import StudyRedacaoPage from './StudyRedacaoPage';
import StudySessionPage from './StudySessionPage';

const TABS = [
  { id: 'today',      label: 'Hoje',      icon: Zap,        color: '#F59E0B' },
  { id: 'subjects',   label: 'Matérias',   icon: BookOpen,   color: '#3B82F6' },
  { id: 'concursos',  label: 'Concursos',  icon: Landmark,   color: '#8B5CF6' },
  { id: 'cycle',      label: 'Ciclos',     icon: RotateCcw,  color: '#06B6D4' },
  { id: 'questoes',   label: 'Questões',   icon: HelpCircle, color: '#A855F7' },
  { id: 'revisions',  label: 'Revisões',   icon: Repeat,     color: '#10B981' },
  { id: 'simulados',  label: 'Simulados',  icon: FileText,   color: '#EC4899' },
  { id: 'analytics',  label: 'Analytics',  icon: BarChart3,  color: '#3B82F6' },
  { id: 'redacao',    label: 'Redação',    icon: PenTool,    color: '#F97316' },
  { id: 'session',    label: 'Sessões',    icon: null,       hidden: true },
];

const VALID_TABS = TABS.map(t => t.id);

export default function StudyPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { subjectId, topicId, subtopicId } = useParams();

  const urlTab = searchParams.get('tab');
  const [tab, setTab] = useState(
    urlTab && VALID_TABS.includes(urlTab) ? urlTab : 'today'
  );

  // Sync URL when tab changes
  useEffect(() => {
    if (tab !== 'today') {
      setSearchParams({ tab }, { replace: true });
    } else {
      setSearchParams({}, { replace: true });
    }
  }, [tab, setSearchParams]);

  // Detail routes: render the detail page directly (hooks already called above)
  if (subjectId && topicId && subtopicId) {
    return (
      <div className="page-container">
        <StudySubtopicPage />
      </div>
    );
  }
  if (subjectId) {
    return (
      <div className="page-container">
        <StudySubjectDetailPage />
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* ── HEADER ──────────────────────────────────────────────────────── */}
      <PageHeader
        icon="📚"
        title="Estudo"
        subtitle={new Date().toLocaleDateString('pt-BR', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
        })}
      />

      {/* ── TAB BAR (wrap on desktop, scroll on mobile) ─────────────────── */}
      <div className="flex flex-wrap lg:flex-nowrap gap-2 p-1.5 card-surface mb-6">
        {TABS.filter(t => !t.hidden).map(t => {
          const Icon = t.icon;
          const isActive = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300 flex items-center gap-2 cursor-pointer ${
                isActive
                  ? 'bg-gradient-to-r from-primary to-indigo-600 text-white shadow-lg shadow-primary/25'
                  : 'text-text-dim hover:text-white hover:bg-white/5'
              }`}
            >
              {Icon && <Icon size={14} style={{ color: isActive ? 'inherit' : t.color }} />}
              {t.label}
            </button>
          );
        })}
      </div>

      {/* ── CONTENT ──────────────────────────────────────────────────────── */}
      <main className="overflow-x-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            {tab === 'today' && <StudyTodayPage />}
            {tab === 'subjects' && <StudySubjectsPage />}
            {tab === 'concursos' && <StudyConcursosPage />}
            {tab === 'cycle' && <StudyCyclePage />}
            {tab === 'questoes' && <StudyQuestoesPage />}
            {tab === 'revisions' && <StudyRevisionsPage />}
            {tab === 'simulados' && <StudySimuladosPage />}
            {tab === 'analytics' && <StudyAnalyticsPage />}
            {tab === 'redacao' && <StudyRedacaoPage />}
            {tab === 'session' && <StudySessionPage />}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
