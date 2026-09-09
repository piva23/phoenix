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
import { useSyncStore } from '../stores/useSyncStore';
import { useAuthStore } from '../stores/useAuthStore';
import { useHealthStore } from '../stores/useHealthStore';

// Auth (não lazy — necessário para proteção de rotas)
import LoginPage from '../modules/auth/LoginPage';
import ProtectedRoute from '../shared/components/ProtectedRoute';

// Core — lazy loaded
const DashboardPage = lazy(() => import('../modules/dashboard/DashboardPage'));
const CalendarPage = lazy(() => import('../modules/calendar/pages/CalendarPage'));
const AnalyticsPage = lazy(() => import('../modules/analytics/AnalyticsPage'));
const SettingsPage = lazy(() => import('../modules/settings/SettingsPage'));
const RPGPage = lazy(() => import('../modules/rpg/pages/RPGPage'));
const AchievementsPage = lazy(() => import('../modules/achievements/AchievementsPage'));

// Health — lazy loaded
const HealthPage = lazy(() => import('../modules/health/pages/HealthPage'));

// Finance — lazy loaded
const FinancePage = lazy(() => import('../modules/finance/pages/FinancePage'));

// Study — lazy loaded
const StudyPage = lazy(() => import('../modules/study/pages/StudyPage'));
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
            <Route path="achievements" element={<AchievementsPage />} />
            <Route path="health" element={<HealthPage />} />
            <Route path="finance" element={<FinancePage />} />
            <Route path="analytics" element={<AnalyticsPage />} />
            <Route path="settings" element={<SettingsPage />} />

            {/* Study — single entry point with local tab state */}
            <Route path="study" element={<StudyPage />} />
            <Route path="study/subjects/:subjectId" element={<StudyPage />} />
            <Route path="study/subjects/:subjectId/:topicId/:subtopicId" element={<StudyPage />} />

          </Route>
        </Route>
      </Routes>
    </Suspense>
  );
}

export default function App() {
  useQuestionListener();

  // Auto-load health plan if store is empty
  useEffect(() => {
    try {
      const { plans, programs } = useHealthStore.getState();
      const hasHabits = (plans?.habits || []).length > 0;
      const hasWorkout = plans?.workout && Object.keys(plans.workout).length > 0;
      if (!hasHabits && !hasWorkout && !programs?.activeProgramId) {
        useHealthStore.getState().loadBuiltinPlan('std_health_v1');
      }
    } catch (_) {}
  }, []);

  // No carregamento: expira missões diárias/semanais vencidas e gera novas
  // (reset diário de missões mesmo sem dispatchXP).
  useEffect(() => {
    try { useGameStore.getState().refreshDynamicMissions(); } catch (_) {}
  }, []);

  // Start/stop auto sync based on auth state
  useEffect(() => {
    // Check initial state and subscribe for changes
    const checkAndSync = (prevUser) => {
      const { user } = useAuthStore.getState();
      if (user && !prevUser) {
        // User logged in — start auto sync only (NO auto-restore)
        useSyncStore.getState().startAutoSync();
      } else if (!user && prevUser) {
        // User logged out — stop auto sync
        useSyncStore.getState().stopAutoSync();
      }
    };

    let prevUser = useAuthStore.getState().user;

    // If already logged in, start sync only
    if (prevUser) {
      useSyncStore.getState().startAutoSync();
    }

    const unsubscribe = useAuthStore.subscribe((state) => {
      checkAndSync(prevUser);
      prevUser = state.user;
    });

    return () => unsubscribe();
  }, []);

  // Sync to cloud when app goes to background
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        const user = useAuthStore.getState().user;
        if (user) {
          useSyncStore.getState().syncToCloud();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Clean up sync timer on unmount
  useEffect(() => {
    return () => {
      useSyncStore.getState().stopAutoSync();
    };
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
