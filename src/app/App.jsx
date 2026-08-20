import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { ThemeEffect } from './ThemeEffect';
import { MainLayout } from '../layouts/MainLayout';
import { SessionQuickModal } from '../modules/study/components/SessionQuickModal';
import { LockScreen } from '../layouts/LockScreen';
import { useQuestionListener } from '../shared/hooks/useQuestionListener';

// Auth
import LoginPage from '../modules/auth/LoginPage';
import ProtectedRoute from '../shared/components/ProtectedRoute';

// Core
import { DashboardPage } from '../modules/dashboard/DashboardPage';
import { CalendarPage } from '../modules/calendar/pages/CalendarPage';
import { AnalyticsPage } from '../modules/analytics/AnalyticsPage';
import { SettingsPage } from '../modules/settings/SettingsPage';
import { RPGPage } from '../modules/rpg/pages/RPGPage';

// Health
import { HealthPage } from '../modules/health/pages/HealthPage';

// Finance
import { FinancePage } from '../modules/finance/pages/FinancePage';

// Study
import { StudyTodayPage } from '../modules/study/pages/StudyTodayPage';

import { StudySubjectsPage } from '../modules/study/pages/StudySubjectsPage';
import { StudySubjectDetailPage } from '../modules/study/pages/StudySubjectDetailPage';
import { StudySubtopicPage } from '../modules/study/pages/StudySubtopicPage';
import { StudySessionPage } from '../modules/study/pages/StudySessionPage';
import { StudyRevisionsPage } from '../modules/study/pages/StudyRevisionsPage';
import { StudyCyclePage } from '../modules/study/pages/StudyCyclePage';
import { StudyConcursosPage } from '../modules/study/pages/StudyConcursosPage';
import { StudyRedacaoPage } from '../modules/study/pages/StudyRedacaoPage';
import { StudyAnalyticsPage } from '../modules/study/pages/StudyAnalyticsPage';
import { StudySimuladosPage } from '../modules/study/pages/StudySimuladosPage';
import { StudyQuestoesPage } from '../modules/study/pages/StudyQuestoesPage';
import { StudyTechniquesPage } from '../modules/study/pages/StudyTechniquesPage';


function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          {/* Core */}
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="calendar" element={<CalendarPage />} />
          <Route path="rpg" element={<RPGPage />} />
          <Route path="health" element={<HealthPage />} />
          <Route path="finance" element={<FinancePage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
          <Route path="settings" element={<SettingsPage />} />

          {/* Study */}
          <Route path="study" element={<Navigate to="/study/today" replace />} />
          <Route path="study/today" element={<StudyTodayPage />} />

          <Route path="study/concursos" element={<StudyConcursosPage />} />
          <Route path="study/subjects" element={<StudySubjectsPage />} />
          <Route path="study/subjects/:subjectId" element={<StudySubjectDetailPage />} />
          <Route path="study/subjects/:subjectId/:topicId/:subtopicId" element={<StudySubtopicPage />} />
          <Route path="study/cycle" element={<StudyCyclePage />} />
          <Route path="study/session" element={<StudySessionPage />} />
          <Route path="study/revisions" element={<StudyRevisionsPage />} />
          <Route path="study/redacao" element={<StudyRedacaoPage />} />
          <Route path="study/analytics" element={<StudyAnalyticsPage />} />
          <Route path="study/simulados" element={<StudySimuladosPage />} />
          <Route path="study/questoes" element={<StudyQuestoesPage />} />
          <Route path="study/techniques" element={<StudyTechniquesPage />} />

        </Route>
      </Route>
    </Routes>
  );
}

export default function App() {
  useQuestionListener();

  return (
    <BrowserRouter>
      <ThemeEffect />
      <AppRoutes />
      <LockScreen />
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
