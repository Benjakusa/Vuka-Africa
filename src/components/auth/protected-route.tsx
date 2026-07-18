import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth-store';
import { LoadingSpinner } from '@/components/shared/loading-spinner';

interface ProtectedRouteProps {
  children?: React.ReactNode;
  allowedRoles?: string[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, isLoading, isAuthenticated } = useAuthStore();
  const location = useLocation();

  // ── Loading state ──────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-surface">
        <LoadingSpinner size="md" />
      </div>
    );
  }

  // ── Not authenticated → redirect to login ──────────────────
  if (!isAuthenticated) {
    return <Navigate to="/auth/login" state={{ from: location.pathname }} replace />;
  }

  // ── Authenticated but wrong role → redirect to dashboard ───
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    const dashboardPath = getDashboardPath(user.role);
    return <Navigate to={dashboardPath} replace />;
  }

  // ── Authorized ─────────────────────────────────────────────
  return <>{children || <Outlet />}</>;
}

/** Returns the dashboard path for a given role */
function getDashboardPath(role: string): string {
  switch (role) {
    case 'ADMIN':
      return '/admin';
    case 'TRAINER':
      return '/trainer';
    case 'TRAINEE':
    default:
      return '/trainee';
  }
}
