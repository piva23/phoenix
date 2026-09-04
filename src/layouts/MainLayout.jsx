import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import HexMenu from '../components/layout/HexMenu';
import BottomBar from '../components/layout/BottomBar';
import { useUIStore } from '../stores/useUIStore';

export function MainLayout() {
  const sidebarOpen = useUIStore(s => s.sidebarOpen);

  return (
    <div
      className="flex min-h-screen text-white font-sans overflow-hidden"
      style={{
        background: 'var(--bg)',
        selectionBackground: 'rgba(var(--nav-active-rgb), 0.3)',
      }}
    >
      {/* Subtle grid — barely visible, no distraction */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.015]"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.5) 1px, transparent 1px)',
          backgroundSize: '64px 64px',
        }}
      />

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

      {/* HexMenu — Desktop only (floating FAB) */}
      <HexMenu />

      {/* BottomBar — Mobile only (integrated nav + hex) */}
      <BottomBar />
    </div>
  );
}
