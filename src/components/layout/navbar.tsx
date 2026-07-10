import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, Phone, Mail, MapPin, LogIn, LayoutDashboard, LogOut, ChevronDown } from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';
import { cn } from '@/lib/utils';

export function Navbar() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const dashboardLink = user?.role === 'TRAINER' ? '/trainer' : user?.role === 'ADMIN' ? '/admin' : '/trainee';
  const isActive = (href: string) => location.pathname === href;

  const scrollToCourses = () => {
    if (location.pathname === '/') {
      document.getElementById('courses')?.scrollIntoView({ behavior: 'smooth' });
    } else {
      navigate('/');
      setTimeout(() => {
        document.getElementById('courses')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
    setMobileOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-[72px] gap-4">
          <Link to="/" className="flex items-center flex-shrink-0">
            <img src="/brand/VUKA AFRICA MAIN WHITE BACKGROUND.png" alt="" className="h-10 lg:h-11" />
          </Link>

          <nav className="hidden lg:flex items-center gap-1 bg-dark text-white px-1.5 py-1.5 rounded-full">
            <Link
              to="/"
              className={cn(
                'px-4 py-1.5 text-sm font-medium rounded-full transition-colors',
                isActive('/') ? 'bg-white/15 text-white' : 'text-white/70 hover:text-white hover:bg-white/10',
              )}
            >
              Home
            </Link>
            <button
              onClick={scrollToCourses}
              className="px-4 py-1.5 text-sm font-medium rounded-full transition-colors text-white/70 hover:text-white hover:bg-white/10"
            >
              Browse Courses
            </button>
            <Link
              to="/trainers"
              className={cn(
                'px-4 py-1.5 text-sm font-medium rounded-full transition-colors',
                isActive('/trainers') ? 'bg-white/15 text-white' : 'text-white/70 hover:text-white hover:bg-white/10',
              )}
            >
              Browse Trainers
            </Link>
            {isAuthenticated ? (
              <div className="relative group ml-2">
                <button className="flex items-center gap-2 px-4 py-1.5 text-sm font-medium rounded-full bg-primary text-white hover:bg-surface transition-colors">
                  <LayoutDashboard size={14} />
                  <span>{user?.fullName?.split(' ')[0] || 'Dashboard'}</span>
                  <ChevronDown size={12} />
                </button>
                <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl -modal border border-border py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                  <Link
                    to={dashboardLink}
                    className="block px-4 py-2 text-sm text-dark hover:bg-surface/80 transition-colors"
                  >
                    Dashboard
                  </Link>
                  <Link
                    to="/trainer/profile"
                    className="block px-4 py-2 text-sm text-dark hover:bg-surface/80 transition-colors"
                  >
                    My Profile
                  </Link>
                  <hr className="my-1 border-border/50" />
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-primary hover:bg-surface/80 transition-colors flex items-center gap-2"
                  >
                    <LogOut size={14} /> Logout
                  </button>
                </div>
              </div>
            ) : (
              <Link
                to="/auth/register"
                className="ml-2 px-5 py-1.5 text-sm font-semibold rounded-full bg-primary text-white hover:bg-surface transition-colors"
              >
                Get Started
              </Link>
            )}
          </nav>

          <div className="hidden lg:flex items-center gap-4 text-xs text-body-foreground flex-shrink-0">
            <span className="flex items-center gap-1.5">
              <Phone size={12} className="text-primary" />
              +254 712 345 678
            </span>
            <span className="text-border">|</span>
            <span className="flex items-center gap-1.5">
              <Mail size={12} className="text-primary" />
              hello@vuka.africa
            </span>
            <span className="text-border">|</span>
            <span className="flex items-center gap-1.5">
              <MapPin size={12} className="text-primary" />
              Kasarani, Nairobi
            </span>
          </div>

          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden flex items-center gap-2 text-body hover:text-dark transition-colors"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="lg:hidden border-t border-border bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 space-y-4">
            <div className="space-y-2 text-sm text-body-foreground pb-3 border-b border-border/50">
              <div className="flex items-center gap-2">
                <Phone size={14} className="text-primary" />
                +254 712 345 678
              </div>
              <div className="flex items-center gap-2">
                <Mail size={14} className="text-primary" />
                hello@vuka.africa
              </div>
              <div className="flex items-center gap-2">
                <MapPin size={14} className="text-primary" />
                Kasarani, Nairobi, Kenya
              </div>
            </div>

            <div className="space-y-1">
              <Link
                to="/"
                onClick={() => setMobileOpen(false)}
                className={cn(
                  'block px-3 py-2.5 text-sm font-medium rounded-lg transition-colors',
                  isActive('/') ? 'bg-surface text-primary' : 'text-dark hover:bg-surface/80',
                )}
              >
                Home
              </Link>
              <button
                onClick={scrollToCourses}
                className="block w-full text-left px-3 py-2.5 text-sm font-medium rounded-lg text-dark hover:bg-surface/80 transition-colors"
              >
                Browse Courses
              </button>
              <Link
                to="/trainers"
                onClick={() => setMobileOpen(false)}
                className={cn(
                  'block px-3 py-2.5 text-sm font-medium rounded-lg transition-colors',
                  isActive('/trainers') ? 'bg-surface text-primary' : 'text-dark hover:bg-surface/80',
                )}
              >
                Browse Trainers
              </Link>
            </div>

            <div className="pt-2 border-t border-border/50 space-y-2">
              {isAuthenticated ? (
                <>
                  <Link
                    to={dashboardLink}
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-primary rounded-lg hover:bg-surface/80 transition-colors"
                  >
                    <LayoutDashboard size={16} /> Dashboard
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-primary rounded-lg hover:bg-surface/80 transition-colors w-full text-left"
                  >
                    <LogOut size={16} /> Logout
                  </button>
                </>
              ) : (
                <div className="flex flex-col gap-2">
                  <Link
                    to="/auth/login"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-white text-sm font-semibold rounded-full hover:bg-surface transition-colors"
                  >
                    <LogIn size={16} /> Sign In
                  </Link>
                  <Link
                    to="/auth/register"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 border-2 border-primary text-primary text-sm font-semibold rounded-full hover:bg-surface transition-colors"
                  >
                    Get Started
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
