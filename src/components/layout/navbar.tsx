import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, LogOut, User, LayoutDashboard, Users, LogIn } from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';
import { useUIStore } from '@/stores/ui-store';
import { cn } from '@/lib/utils';

export function Navbar() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const { mobileMenuOpen, setMobileMenuOpen } = useUIStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const dashboardLink = user?.role === 'TRAINER' ? '/trainer' : user?.role === 'ADMIN' ? '/admin' : '/trainee';

  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-2xl font-bold text-primary">Vuka</span>
          </Link>

          <div className="hidden md:flex items-center gap-6">
            <Link
              to="/trainers"
              className="flex items-center gap-1.5 text-sm text-body hover:text-dark transition-colors font-medium"
            >
              <Users size={16} /> Browse Trainers
            </Link>
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <Link
                  to={dashboardLink}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white text-sm font-medium rounded-btn hover:bg-primary/90 transition-colors"
                >
                  <LayoutDashboard size={16} />
                  Dashboard
                </Link>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-body">{user?.fullName}</span>
                  <button
                    onClick={handleLogout}
                    className="p-1.5 text-muted-foreground hover:text-dark transition-colors"
                  >
                    <LogOut size={16} />
                  </button>
                </div>
              </div>
            ) : (
              <Link
                to="/auth/login"
                className="flex items-center gap-1.5 px-4 py-1.5 bg-primary text-white text-sm font-medium rounded-btn hover:bg-primary/90 transition-colors"
              >
                <LogIn size={16} /> Get Started
              </Link>
            )}
          </div>

          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 text-body">
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-white px-4 py-4 space-y-3">
          <Link
            to="/trainers"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2 text-sm text-body font-medium"
          >
            <Users size={16} /> Browse Trainers
          </Link>
          {isAuthenticated ? (
            <>
              <Link
                to={dashboardLink}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 text-sm text-primary font-medium"
              >
                <LayoutDashboard size={16} /> Dashboard
              </Link>
              <button onClick={handleLogout} className="flex items-center gap-2 text-sm text-destructive font-medium">
                <LogOut size={16} /> Logout
              </button>
            </>
          ) : (
            <Link
              to="/auth/login"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 text-sm text-primary font-medium"
            >
              <LogIn size={16} /> Get Started
            </Link>
          )}
        </div>
      )}
    </nav>
  );
}
