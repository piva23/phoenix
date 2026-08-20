import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import HexMenu from '../components/layout/HexMenu';
import { useUIStore } from '../stores/useUIStore';

export function MainLayout() {
  const sidebarOpen = useUIStore(s => s.sidebarOpen);

  return (
    <div className="flex min-h-screen bg-background text-white font-sans selection:bg-primary/30 overflow-hidden">
      {/* Cyber Grid Background */}
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#1f293708_1px,transparent_1px),linear-gradient(to_bottom,#1f293708_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

      {/* Desktop Sidebar */}
      <div className="hidden lg:block z-[100]">
        <Sidebar />
      </div>

      {/* Main content */}
      <div
        className={`flex flex-col flex-1 min-w-0 transition-all duration-300 ease-in-out relative z-10 ${
          sidebarOpen ? 'lg:ml-[260px]' : 'lg:ml-[80px]'
        }`}
      >
        <Topbar />
        <main className="flex-1 overflow-y-auto p-4 md:p-8 pb-24 lg:pb-12 relative z-10">
          <Outlet />
        </main>
      </div>

      {/* HexMenu — Bottom bar mobile + FAB desktop + Drawer */}
      <HexMenu />
    </div>
  );
}
