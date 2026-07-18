import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, Bell, LogOut, User, Settings, HelpCircle } from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';
import { useUIStore } from '@/stores/ui-store';

export function DashboardHeader() {
  const { user, logout } = useAuthStore();
  const { mobileMenuOpen, setMobileMenuOpen } = useUIStore();
  const navigate = useNavigate();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };

    if (userMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [userMenuOpen]);

  // Close menu on Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setUserMenuOpen(false);
    };

    if (userMenuOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [userMenuOpen]);

  const handleLogout = async () => {
    setUserMenuOpen(false);
    await logout();
    navigate('/');
  };

  const dashboardPath = user?.role === 'ADMIN' ? '/admin' : user?.role === 'TRAINER' ? '/trainer' : '/trainee';

  const settingsPath =
    user?.role === 'TRAINER' ? '/trainer/profile' : user?.role === 'ADMIN' ? '/admin/config' : '/trainee';

  const roleLabel = user?.role === 'ADMIN' ? 'Admin' : user?.role === 'TRAINER' ? 'Trainer' : 'Student';

  return (
    <header className="sticky top-0 z-20 bg-white border-b border-border h-16">
      <div className="flex items-center justify-between h-full px-4 sm:px-6">
        {/* Left: Mobile menu toggle + Logo */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 -ml-2 text-muted-foreground hover:text-dark transition-colors rounded"
            aria-label={mobileMenuOpen ? 'Close sidebar' : 'Open sidebar'}
          >
            <Menu size={20} aria-hidden="true" />
          </button>
          <Link to={dashboardPath} className="text-lg font-bold text-primary hidden sm:block">
            Vuka
          </Link>
        </div>

        {/* Right: Notifications + User Menu */}
        <div className="flex items-center gap-2">
          {/* Notifications (placeholder) */}
          <button
            className="p-2 text-muted-foreground hover:text-dark transition-colors rounded relative"
            aria-label="Notifications"
          >
            <Bell size={20} aria-hidden="true" />
            {/* Notification badge — show when there are notifications */}
            {/* <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full" /> */}
          </button>

          {/* User Menu */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-2 p-1.5 hover:bg-accent rounded-btn transition-colors"
              aria-expanded={userMenuOpen}
              aria-haspopup="true"
              aria-label="User menu"
            >
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                {user?.fullName?.[0]?.toUpperCase() || '?'}
              </div>
              <span className="hidden sm:block text-sm font-medium text-dark max-w-[100px] truncate">
                {user?.fullName || 'User'}
              </span>
            </button>

            {/* Dropdown */}
            {userMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-card shadow-modal border border-border py-1 z-50">
                {/* User Info */}
                <div className="px-4 py-3 border-b border-border">
                  <p className="text-sm font-medium text-dark truncate">{user?.fullName || 'User'}</p>
                  <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                  <span className="inline-block mt-1 px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full font-medium">
                    {roleLabel}
                  </span>
                </div>

                {/* Menu Items */}
                <div className="py-1">
                  <Link
                    to={dashboardPath}
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-dark hover:bg-accent transition-colors"
                  >
                    <User size={16} className="text-muted-foreground" aria-hidden="true" />
                    Dashboard
                  </Link>
                  <Link
                    to={settingsPath}
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-dark hover:bg-accent transition-colors"
                  >
                    <Settings size={16} className="text-muted-foreground" aria-hidden="true" />
                    Settings
                  </Link>
                  <a
                    href="mailto:hello@vuka.africa"
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-dark hover:bg-accent transition-colors"
                  >
                    <HelpCircle size={16} className="text-muted-foreground" aria-hidden="true" />
                    Help & Support
                  </a>
                </div>

                {/* Logout */}
                <div className="border-t border-border pt-1">
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-destructive hover:bg-destructive/10 w-full transition-colors"
                  >
                    <LogOut size={16} aria-hidden="true" />
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
