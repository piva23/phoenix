import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { ThemeEffect } from './ThemeEffect';
import { MainLayout } from '../layouts/MainLayout';
import { PersonaSwitcherSheet } from '../modules/personas/PersonaSwitcherSheet';
import { SessionQuickModal } from '../modules/study/components/SessionQuickModal';
import { LockScreen } from '../layouts/LockScreen';
import { usePersonaScheduler } from '../shared/hooks/usePersonaScheduler';
import { useQuestionListener } from '../shared/hooks/useQuestionListener';

// Auth Pages and Protection
import LoginPage from '../modules/auth/LoginPage';
import ProtectedRoute from '../shared/components/ProtectedRoute';

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

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      
      {/* Proteção Global envolve o Layout Principal */}
      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          {/* Core */}
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="personas" element={<PersonasPage />} />
          <Route path="calendar" element={<CalendarPage />} />
          <Route path="inbox" element={<InboxPage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="rpg" element={<RPGPage />} />

          {/* Study Module */}
          <Route path="study" element={<Navigate to="/study/today" replace />} />
          <Route path="study/today" element={<StudyTodayPage />} />
          <Route path="study/overview" element={<StudyOverviewPage />} />
          <Route path="study/concursos" element={<StudyConcursosPage />} />

          {/* Hierarquia de Matérias (Geral -> Detalhe -> Subtópico) */}
          <Route path="study/subjects" element={<StudySubjectsPage />} />
          <Route path="study/subjects/:subjectId" element={<StudySubjectDetailPage />} />
          <Route path="study/subjects/:subjectId/:topicId/:subtopicId" element={<StudySubtopicPage />} />

          {/* Outras ferramentas de estudo */}
          <Route path="study/cycle" element={<StudyCyclePage />} />
          <Route path="study/session" element={<StudySessionPage />} />
          <Route path="study/revisions" element={<StudyRevisionsPage />} />
          <Route path="study/redacao" element={<StudyRedacaoPage />} />
          <Route path="study/analytics" element={<StudyAnalyticsPage />} />
          <Route path="study/simulados" element={<StudySimuladosPage />} />
          <Route path="study/questoes" element={<StudyQuestoesPage />} />
          <Route path="study/techniques" element={<StudyTechniquesPage />} />
          <Route path="study/difficulty-map" element={<StudyDifficultyMapPage />} />

          {/* Outros Módulos */}
          <Route path="projects" element={<ProjectsPage />} />
          <Route path="projects/:id" element={<ProjectDetailPage />} />
          <Route path="knowledge" element={<KnowledgePage />} />
          <Route path="knowledge/mental-models" element={<MentalModelsPage />} />
          <Route path="finance" element={<FinancePage />} />
          <Route path="health" element={<HealthPage />} />
          <Route path="relationships" element={<RelationshipsPage />} />
          <Route path="spiritual" element={<SpiritualPage />} />
        </Route>
      </Route>
    </Routes>
  );
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
