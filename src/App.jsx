import React, { useState } from 'react';
import { useAuthStore } from './stores/useAuthStore';
import { useUserStore } from './stores/useUserStore';
import { useSecurityStore } from './stores/useSecurityStore';
import LoginPage from './modules/auth/LoginPage';
import LockScreen from './modules/auth/LockScreen';
import ProjectsView from './modules/projects/components/ProjectsView';
import UniversalCalendarView from './modules/calendar/components/UniversalCalendarView';
import SettingsPage from './modules/settings/SettingsPage';
import { Toaster } from 'react-hot-toast';
import { Briefcase, Calendar, Settings, Flame, Lock } from 'lucide-react';
import toast from 'react-hot-toast';

export default function App() {
  const { user, loading } = useAuthStore();
  const { isLocked, pinCode, lock } = useSecurityStore();
  const { displayName, level, xp } = useUserStore();
  const [activeTab, setActiveTab] = useState('projects'); // 'projects', 'calendar', 'settings'

  // If loading Auth state from Firebase, show a dark loading spinner
  if (loading) {
    return (
      <div id="loading-container" className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center gap-4">
        <div id="loading-spinner" className="w-12 h-12 border-4 border-orange-500/10 border-t-orange-500 rounded-full animate-spin" />
        <span id="loading-label" className="text-zinc-500 text-xs font-semibold uppercase tracking-wider animate-pulse">Carregando Phoenix OS...</span>
      </div>
    );
  }

  // Enforce LoginPage if user is not authenticated
  if (!user) {
    return (
      <>
        <LoginPage />
        <Toaster position="bottom-right" toastOptions={{ style: { background: '#18181b', color: '#fff', border: '1px solid #27272a' } }} />
      </>
    );
  }

  // Enforce LockScreen if device is locked
  if (isLocked && pinCode) {
    return (
      <>
        <LockScreen />
        <Toaster position="bottom-right" toastOptions={{ style: { background: '#18181b', color: '#fff', border: '1px solid #27272a' } }} />
      </>
    );
  }

  return (
    <div id="app-shell" className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col">
      {/* Top Header */}
      <header id="app-header" className="h-16 border-b border-zinc-800 bg-zinc-950/60 backdrop-blur-xl px-6 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-tr from-orange-500 to-red-600 rounded-lg flex items-center justify-center shadow shadow-orange-500/20">
            <Flame className="w-5 h-5 text-white" />
          </div>
          <div>
            <span id="header-brand-title" className="text-sm font-black tracking-tight bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">Phoenix OS</span>
            <span id="header-brand-version" className="text-[10px] text-orange-500 font-bold ml-1.5 uppercase tracking-widest bg-orange-500/10 px-1.5 py-0.5 rounded">v3.0</span>
          </div>
        </div>

        {/* User Level, XP and profile stats in Header */}
        <div id="header-user-panel" className="flex items-center gap-6">
          <div className="hidden sm:flex flex-col items-end gap-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-zinc-400">Progresso do Operador</span>
              <span className="text-xs font-black text-orange-500">Nível {level}</span>
            </div>
            <div className="w-40 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-orange-500 to-red-500 rounded-full transition-all duration-300" style={{ width: `${(xp / (level * 100)) * 100}%` }} />
            </div>
          </div>

          <div id="header-user-meta" className="flex items-center gap-3 border-l border-zinc-800 pl-6">
            <div className="flex flex-col text-right">
              <span id="user-display-name-header" className="text-xs font-bold text-white truncate max-w-[120px]">{displayName}</span>
              <span id="user-email-header" className="text-[9px] text-zinc-500 truncate max-w-[120px]">{user.email}</span>
            </div>
            {user.photoURL ? (
              <img src={user.photoURL} alt={user.displayName} className="w-8 h-8 rounded-full border border-zinc-700" />
            ) : (
              <div className="w-8 h-8 bg-zinc-800 rounded-full border border-zinc-700 flex items-center justify-center text-xs font-bold uppercase">{displayName[0]}</div>
            )}
          </div>
        </div>
      </header>

      {/* Main Grid: Sidebar + Active Tab Workspace */}
      <div id="app-body-container" className="flex-grow flex flex-col md:flex-row">
        {/* Navigation Rail / Sidebar */}
        <nav id="app-sidebar-nav" className="w-full md:w-64 border-r border-zinc-800 bg-zinc-950/20 p-4 space-y-2 flex-shrink-0 md:sticky md:top-16 md:h-[calc(100vh-64px)]">
          <button
            id="nav-projects-tab"
            onClick={() => setActiveTab('projects')}
            className={`w-full p-3 rounded-xl flex items-center gap-3.5 font-semibold text-xs tracking-wide transition cursor-pointer ${
              activeTab === 'projects'
                ? 'bg-orange-500/10 text-orange-500 border border-orange-500/20 shadow shadow-orange-500/5 font-extrabold'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900/40 border border-transparent'
            }`}
          >
            <Briefcase className="w-4.5 h-4.5" />
            <span>Projetos</span>
          </button>

          <button
            id="nav-calendar-tab"
            onClick={() => setActiveTab('calendar')}
            className={`w-full p-3 rounded-xl flex items-center gap-3.5 font-semibold text-xs tracking-wide transition cursor-pointer ${
              activeTab === 'calendar'
                ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20 shadow shadow-blue-500/5 font-extrabold'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900/40 border border-transparent'
            }`}
          >
            <Calendar className="w-4.5 h-4.5" />
            <span>Calendário</span>
          </button>

          <button
            id="nav-settings-tab"
            onClick={() => setActiveTab('settings')}
            className={`w-full p-3 rounded-xl flex items-center gap-3.5 font-semibold text-xs tracking-wide transition cursor-pointer ${
              activeTab === 'settings'
                ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20 shadow shadow-purple-500/5 font-extrabold'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900/40 border border-transparent'
            }`}
          >
            <Settings className="w-4.5 h-4.5" />
            <span>Definições</span>
          </button>

          {/* Quick Lock Button */}
          {pinCode && (
            <div id="quick-lock-rail-container" className="pt-6 border-t border-zinc-800/60 mt-6">
              <button
                id="quick-lock-console-btn"
                onClick={() => {
                  lock();
                  toast.success('Dispositivo bloqueado!');
                }}
                className="w-full p-3 bg-zinc-900/20 hover:bg-zinc-900/60 text-zinc-400 hover:text-white border border-zinc-800 rounded-xl flex items-center gap-3.5 text-xs font-semibold transition cursor-pointer"
              >
                <Lock className="w-4.5 h-4.5" />
                <span>Bloquear Consola</span>
              </button>
            </div>
          )}
        </nav>

        {/* Workspace panel */}
        <main id="app-workspace-main" className="flex-grow p-6 md:p-8 max-w-7xl mx-auto w-full overflow-y-auto">
          {activeTab === 'projects' && <ProjectsView />}
          {activeTab === 'calendar' && <UniversalCalendarView />}
          {activeTab === 'settings' && <SettingsPage />}
        </main>
      </div>

      <Toaster position="bottom-right" toastOptions={{ style: { background: '#18181b', color: '#fff', border: '1px solid #27272a' } }} />
    </div>
  );
}
