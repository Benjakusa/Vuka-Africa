'use client';

import { ProtectedRoute } from '@frontend/components/auth/protected-route';
import { DashboardSidebar } from '@frontend/components/layout/dashboard-sidebar';
import { MobileBottomNav } from '@frontend/components/layout/mobile-bottom-nav';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <div className="flex min-h-screen bg-surface">
        <DashboardSidebar />
        <main className="flex-1 md:ml-64 pb-16 md:pb-0 p-4 md:p-8 overflow-y-auto">
          {children}
        </main>
        <MobileBottomNav />
      </div>
    </ProtectedRoute>
  );
}
