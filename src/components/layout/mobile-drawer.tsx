import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth-store';
import { traineeLinks, trainerLinks, adminLinks } from './dashboard-sidebar';

export function MobileDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const { user, logout } = useAuthStore();

  const links = user?.role === 'TRAINER' ? trainerLinks : user?.role === 'ADMIN' ? adminLinks : traineeLinks;

  // Close drawer on route change
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  return (
    <>
      {/* Mobile Top Header */}
      <div className="md:hidden flex items-center justify-between px-4 h-16 bg-white border-b border-border sticky top-0 z-40">
        <Link to="/" className="flex items-center">
          <img src="/brand/VUKA AFRIQUE MAIN WHITE BACKGROUND.png" alt="" className="h-10" />
        </Link>
        <button
          onClick={() => setIsOpen(true)}
          className="p-2 -mr-2 text-dark hover:bg-surface rounded-btn transition-colors"
          aria-label="Open menu"
        >
          <Menu size={24} />
        </button>
      </div>

      {/* Drawer Overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 md:hidden" onClick={() => setIsOpen(false)} aria-hidden="true" />
      )}

      {/* Drawer Panel */}
      <aside
        className={cn(
          'fixed inset-y-0 right-0 w-72 bg-white z-50 shadow-xl transform transition-transform duration-300 ease-in-out flex flex-col md:hidden',
          isOpen ? 'translate-x-0' : 'translate-x-full',
        )}
      >
        <div className="flex items-center justify-between px-4 h-16 border-b border-border">
          <span className="text-lg font-bold text-dark">Menu</span>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 -mr-2 text-body-foreground hover:bg-surface rounded-btn transition-colors"
            aria-label="Close menu"
          >
            <X size={24} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {links.map((link) => {
            const isActive = location.pathname === link.href || location.pathname.startsWith(link.href + '/');
            return (
              <Link
                key={link.href}
                to={link.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-3 rounded-btn text-sm font-medium transition-colors',
                  isActive ? 'bg-primary text-white' : 'text-body-foreground hover:bg-accent hover:text-dark',
                )}
              >
                <link.icon size={20} className={isActive ? 'text-white' : ''} />
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border bg-surface">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-bold text-base shadow-sm">
              {user?.fullName?.[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-dark truncate">{user?.fullName}</p>
              <p className="text-xs text-body capitalize font-medium">{user?.role?.toLowerCase()}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-btn bg-white border border-border text-primary font-medium hover:bg-primary hover:text-white transition-colors"
          >
            <LogOut size={18} /> Logout
          </button>
        </div>
      </aside>
    </>
  );
}
