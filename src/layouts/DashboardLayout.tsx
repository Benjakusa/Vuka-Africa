import { Outlet } from 'react-router-dom';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { DashboardSidebar } from '@/components/layout/dashboard-sidebar';
import { MobileDrawer } from '@/components/layout/mobile-drawer';
import { useRealtimeSync } from '@/hooks/use-realtime-sync';

export function DashboardLayout() {
  useRealtimeSync();

  return (
    <ProtectedRoute>
      <div className="flex flex-col md:flex-row min-h-screen bg-surface">
        <MobileDrawer />
        <DashboardSidebar />
        <main className="flex-1 md:ml-64 p-4 md:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </ProtectedRoute>
  );
}
