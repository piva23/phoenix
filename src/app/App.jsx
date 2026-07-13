import { BrowserRouter, useRoutes, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { ThemeEffect } from './ThemeEffect';
import { MainLayout } from '../layouts/MainLayout';
import { PersonaSwitcherSheet } from '../modules/personas/PersonaSwitcherSheet';
import { SessionQuickModal } from '../modules/study/components/SessionQuickModal';
import { LockScreen } from '../layouts/LockScreen';
import { usePersonaScheduler } from '../shared/hooks/usePersonaScheduler';
import { useQuestionListener } from '../shared/hooks/useQuestionListener';

// Main Pages
import { DashboardPage } from '../modules/dashboard/DashboardPage';
import { PersonasPage } from '../modules/personas/PersonasPage';
import { CalendarPage } from '../modules/calendar/pages/CalendarPage';
import { InboxPage } from '../modules/inbox/InboxPage';

// Study
import { StudyTodayPage } from '../modules/study/pages/StudyTodayPage';
import { StudyOverviewPage } from '../modules/study/pages/StudyOverviewPage';
import { StudySubjectsPage } from '../modules/study/pages/StudySubjectsPage';
import { StudySubtopicPage } from '../modules/study/pages/StudySubtopicPage';
import { StudySessionPage } from '../modules/study/pages/StudySessionPage';
import { StudyRevisionsPage } from '../modules/study/pages/StudyRevisionsPage';
import { StudyCyclePage } from '../modules/study/pages/StudyCyclePage';
import { StudyConcursosPage } from '../modules/study/pages/StudyConcursosPage';
import { StudyRedacaoPage } from '../modules/study/pages/StudyRedacaoPage';
import { StudyAnalyticsPage } from '../modules/study/pages/StudyAnalyticsPage';
import { StudySimuladosPage } from '../modules/study/pages/StudySimuladosPage';
import { StudySubjectDetailPage } from '../modules/study/pages/StudySubjectDetailPage';
import { StudyQuestoesPage } from '../modules/study/pages/StudyQuestoesPage';
import { StudyTechniquesPage } from '../modules/study/pages/StudyTechniquesPage';
import { StudyDifficultyMapPage } from '../modules/study/pages/StudyDifficultyMapPage';

//Projects
import { ProjectsPage } from '../modules/projects/ProjectsPage';
import { ProjectDetailPage } from '../modules/projects/ProjectDetailPage';

//Knowledge
import { KnowledgePage } from '../modules/knowledge/pages/KnowledgePage';
import { MentalModelsPage } from '../modules/knowledge/pages/MentalModelsPage';

//Finance
import { FinancePage } from '../modules/finance/pages/FinancePage';

//Health
import { HealthPage } from '../modules/health/pages/HealthPage';

//Relationships
import { RelationshipsPage } from '../modules/relationships/pages/RelationshipsPage';

//Spiritual
import { SpiritualPage } from '../modules/spiritual/pages/SpiritualPage';

//Analytics
import { AnalyticsPage } from '../modules/analytics/AnalyticsPage';

//Settings
import { SettingsPage } from '../modules/settings/SettingsPage';

//RPG Module
import { RPGPage } from '../modules/rpg/pages/RPGPage';

const routes = [
  {
    path: '/',
    element: <MainLayout />,
    children: [
      // Core
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard', element: <DashboardPage /> },
      { path: 'personas', element: <PersonasPage /> },
      { path: 'calendar', element: <CalendarPage /> },
      { path: 'inbox', element: <InboxPage /> },
      { path: 'analytics', element: <AnalyticsPage /> },
      { path: 'settings', element: <SettingsPage /> },
      { path: 'rpg', element: <RPGPage /> },

      // Study Module
      { path: 'study', element: <Navigate to="/study/today" replace /> },
      { path: 'study/today', element: <StudyTodayPage /> },
      { path: 'study/overview', element: <StudyOverviewPage /> },
      { path: 'study/concursos', element: <StudyConcursosPage /> },

      // Hierarquia de Matérias (Geral -> Detalhe -> Subtópico)
      { path: 'study/subjects', element: <StudySubjectsPage /> },
      {
        path: 'study/subjects/:subjectId',
        element: <StudySubjectDetailPage />,
      },
      {
        path: 'study/subjects/:subjectId/:topicId/:subtopicId',
        element: <StudySubtopicPage />,
      },

      // Outras ferramentas de estudo
      { path: 'study/cycle', element: <StudyCyclePage /> },
      { path: 'study/session', element: <StudySessionPage /> },
      { path: 'study/revisions', element: <StudyRevisionsPage /> },
      { path: 'study/redacao', element: <StudyRedacaoPage /> },
      { path: 'study/analytics', element: <StudyAnalyticsPage /> },
      { path: 'study/simulados', element: <StudySimuladosPage /> },
      { path: 'study/questoes', element: <StudyQuestoesPage /> },
      { path: 'study/techniques', element: <StudyTechniquesPage /> },
      { path: 'study/difficulty-map', element: <StudyDifficultyMapPage /> },

      // Outros Módulos
      { path: 'projects', element: <ProjectsPage /> },
      { path: 'projects/:id', element: <ProjectDetailPage /> },
      { path: 'knowledge', element: <KnowledgePage /> },
      { path: 'knowledge/mental-models', element: <MentalModelsPage /> },
      { path: 'finance', element: <FinancePage /> },
      { path: 'health', element: <HealthPage /> },
      { path: 'relationships', element: <RelationshipsPage /> },
      { path: 'spiritual', element: <SpiritualPage /> },
    ],
  },
];

function AppRoutes() {
  return useRoutes(routes);
}

export default function App() {
  // Ativa o agendamento de personas global
  usePersonaScheduler();

  // Ativa o listener automático para a extensão de questões (Caderno de Erros)
  useQuestionListener();

  return (
    <BrowserRouter>
      <ThemeEffect />
      <AppRoutes />
      <LockScreen />
      <PersonaSwitcherSheet />
      <SessionQuickModal />
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: 'var(--bg-surface)',
            color: 'var(--text-main)',
            border: '1px solid var(--border-strong)',
            borderRadius: 'var(--radius)',
            fontSize: '13px',
          },
        }}
      />
    </BrowserRouter>
  );
}
