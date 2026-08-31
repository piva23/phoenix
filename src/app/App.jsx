import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { ThemeEffect } from './ThemeEffect';
import { MainLayout } from '../layouts/MainLayout';
import { SessionQuickModal } from '../shared/components/SessionQuickModal';
import { AchievementToast } from '../shared/components/AchievementToast';
import { LockScreen } from '../layouts/LockScreen';
import { useQuestionListener } from '../shared/hooks/useQuestionListener';
import LoadingScreen from '../shared/components/LoadingScreen';
import { useGameStore } from '../stores/useGameStore';

// Auth (não lazy — necessário para proteção de rotas)
import LoginPage from '../modules/auth/LoginPage';
import ProtectedRoute from '../shared/components/ProtectedRoute';

// Core — lazy loaded
const DashboardPage = lazy(() => import('../modules/dashboard/DashboardPage'));
const CalendarPage = lazy(() => import('../modules/calendar/pages/CalendarPage'));
const AnalyticsPage = lazy(() => import('../modules/analytics/AnalyticsPage'));
const SettingsPage = lazy(() => import('../modules/settings/SettingsPage'));
const RPGPage = lazy(() => import('../modules/rpg/pages/RPGPage'));

// Health — lazy loaded
const HealthPage = lazy(() => import('../modules/health/pages/HealthPage'));

// Finance — lazy loaded
const FinancePage = lazy(() => import('../modules/finance/pages/FinancePage'));

// Study — lazy loaded
const StudyTodayPage = lazy(() => import('../modules/study/pages/StudyTodayPage'));
const StudySubjectsPage = lazy(() => import('../modules/study/pages/StudySubjectsPage'));
const StudySubjectDetailPage = lazy(() => import('../modules/study/pages/StudySubjectDetailPage'));
const StudySubtopicPage = lazy(() => import('../modules/study/pages/StudySubtopicPage'));
const StudySessionPage = lazy(() => import('../modules/study/pages/StudySessionPage'));
const StudyRevisionsPage = lazy(() => import('../modules/study/pages/StudyRevisionsPage'));
const StudyCyclePage = lazy(() => import('../modules/study/pages/StudyCyclePage'));
const StudyConcursosPage = lazy(() => import('../modules/study/pages/StudyConcursosPage'));
const StudyRedacaoPage = lazy(() => import('../modules/study/pages/StudyRedacaoPage'));
const StudyAnalyticsPage = lazy(() => import('../modules/study/pages/StudyAnalyticsPage'));
const StudySimuladosPage = lazy(() => import('../modules/study/pages/StudySimuladosPage'));
const StudyQuestoesPage = lazy(() => import('../modules/study/pages/StudyQuestoesPage'));
const StudyTechniquesPage = lazy(() => import('../modules/study/pages/StudyTechniquesPage'));


function AppRoutes() {
  return (
    <Suspense fallback={<LoadingScreen />}>
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
            <Route path="study/questoes/:materia" element={<StudyQuestoesPage />} />
            <Route path="study/techniques" element={<StudyTechniquesPage />} />

          </Route>
        </Route>
      </Routes>
    </Suspense>
  );
}

export default function App() {
  useQuestionListener();

  // No carregamento: expira missões diárias/semanais vencidas e gera novas
  // (reset diário de missões mesmo sem dispatchXP).
  useEffect(() => {
    try { useGameStore.getState().refreshDynamicMissions(); } catch (_) {}
  }, []);

  return (
    <BrowserRouter>
      <ThemeEffect />
      <AppRoutes />
      <LockScreen />
      <SessionQuickModal />
      <AchievementToast />
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
