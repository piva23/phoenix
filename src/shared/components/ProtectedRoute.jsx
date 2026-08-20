import React, { useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../stores/useAuthStore';

export default function ProtectedRoute() {
  const { user, loading, initializeAuth } = useAuthStore();

  useEffect(() => {
    // Start listening to auth state changes
    const unsubscribe = initializeAuth();
    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [initializeAuth]);

  if (loading) {
    return (
      <div id="phoenix-loading-screen" className="min-h-screen w-full flex flex-col items-center justify-center bg-[#0C0C10] text-[#F0EFF8] font-sans select-none">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-10 h-10 border-2 border-[rgba(255,255,255,0.07)] border-t-[#8B5CF6] rounded-full animate-spin"></div>
          <p className="text-xs font-semibold tracking-[0.2em] text-[#8B5CF6] uppercase animate-pulse">
            Inicializando Phoenix OS...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
