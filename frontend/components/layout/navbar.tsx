'use client';

import Link from 'next/link';
import { Menu, X, LogOut, User, LayoutDashboard } from 'lucide-react';
import { useAuthStore } from '@frontend/stores/auth-store';
import { useUIStore } from '@frontend/stores/ui-store';
import { useRouter } from 'next/navigation';
import { cn } from '@backend/lib/utils';

export function Navbar() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const { mobileMenuOpen, setMobileMenuOpen } = useUIStore();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  const dashboardLink = user?.role === 'TRAINER'
    ? '/dashboard/trainer'
    : user?.role === 'ADMIN'
    ? '/dashboard/admin'
    : '/dashboard/trainee';

  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl font-bold text-primary">Vuka</span>
          </Link>

          <div className="hidden md:flex items-center gap-6">
            <Link href="/trainers" className="text-sm text-body hover:text-dark transition-colors font-medium">
              Browse Trainers
            </Link>
            <Link href="/trust" className="text-sm text-body hover:text-dark transition-colors font-medium">
              How It Works
            </Link>
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <Link
                  href={dashboardLink}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white text-sm font-medium rounded-btn hover:bg-primary/90 transition-colors"
                >
                  <LayoutDashboard size={16} />
                  Dashboard
                </Link>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-body">{user?.fullName}</span>
                  <button onClick={handleLogout} className="p-1.5 text-muted-foreground hover:text-dark transition-colors">
                    <LogOut size={16} />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link href="/auth/login" className="text-sm text-body hover:text-dark font-medium">
                  Login
                </Link>
                <Link
                  href="/auth/register"
                  className="px-4 py-1.5 bg-primary text-white text-sm font-medium rounded-btn hover:bg-primary/90 transition-colors"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-body"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-white px-4 py-4 space-y-3">
          <Link href="/trainers" onClick={() => setMobileMenuOpen(false)} className="block text-sm text-body font-medium">
            Browse Trainers
          </Link>
          <Link href="/trust" onClick={() => setMobileMenuOpen(false)} className="block text-sm text-body font-medium">
            How It Works
          </Link>
          {isAuthenticated ? (
            <>
              <Link href={dashboardLink} onClick={() => setMobileMenuOpen(false)} className="block text-sm text-primary font-medium">
                Dashboard
              </Link>
              <button onClick={handleLogout} className="block text-sm text-destructive font-medium">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link href="/auth/login" onClick={() => setMobileMenuOpen(false)} className="block text-sm text-body font-medium">
                Login
              </Link>
              <Link href="/auth/register" onClick={() => setMobileMenuOpen(false)} className="block text-sm text-primary font-medium">
                Get Started
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
