import { Outlet } from 'react-router-dom';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { DashboardSidebar } from '@/components/layout/dashboard-sidebar';
import { MobileBottomNav } from '@/components/layout/mobile-bottom-nav';

export function DashboardLayout() {
  return (
    <ProtectedRoute>
      <div className="flex min-h-screen bg-surface">
        <DashboardSidebar />
        <main className="flex-1 md:ml-64 pb-16 md:pb-0 p-4 md:p-8 overflow-y-auto">
          <Outlet />
        </main>
        <MobileBottomNav />
      </div>
    </ProtectedRoute>
  );
}
