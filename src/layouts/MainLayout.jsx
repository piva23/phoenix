import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { BottomBar } from './BottomBar';
import { QuickActionFAB } from './QuickActionFAB';
import { GlobalAudioPlayer } from './components/GlobalAudioPlayer';
import { useUIStore } from '../stores/useUIStore';

export function MainLayout() {
  const sidebarOpen = useUIStore(s => s.sidebarOpen);

  return (
    <div className="flex min-h-screen bg-background text-text-main">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {/* Main content */}
      <div
        className={`flex flex-col flex-1 min-w-0 transition-all duration-250 ${
          sidebarOpen ? 'lg:ml-[240px]' : 'lg:ml-[72px]'
        }`}
      >
        <Topbar />

        <main className="flex-1 overflow-y-auto p-6 pb-32 lg:pb-8">
          <Outlet />
        </main>
      </div>

      {/* Mobile Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 lg:hidden z-50">
        <BottomBar />
      </div>

      {/* Quick Action FAB — Global (Desktop & Mobile) */}
      <QuickActionFAB />

      {/* Player de Áudio Global Persistente */}
      <GlobalAudioPlayer />
    </div>
  );
}
