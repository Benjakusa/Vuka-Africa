'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, BookOpen, Book, Users, Wallet, ShieldCheck,
  AlertTriangle, List, Star, Receipt, LogOut,
} from 'lucide-react';
import { cn } from '@backend/lib/utils';
import { useAuthStore } from '@frontend/stores/auth-store';

const traineeLinks = [
  { href: '/dashboard/trainee', label: 'Overview', icon: LayoutDashboard },
  { href: '/dashboard/trainee/enrolments', label: 'My Enrolments', icon: BookOpen },
  { href: '/dashboard/trainee/payments', label: 'Payments', icon: Receipt },
  { href: '/dashboard/trainee/reviews', label: 'Reviews', icon: Star },
];

const trainerLinks = [
  { href: '/dashboard/trainer', label: 'Overview', icon: LayoutDashboard },
  { href: '/dashboard/trainer/courses', label: 'My Courses', icon: Book },
  { href: '/dashboard/trainer/enrolments', label: 'Enrolments', icon: Users },
  { href: '/dashboard/trainer/earnings', label: 'Earnings', icon: Wallet },
  { href: '/dashboard/trainer/verification', label: 'Verification', icon: ShieldCheck },
];

const adminLinks = [
  { href: '/dashboard/admin', label: 'Overview', icon: LayoutDashboard },
  { href: '/dashboard/admin/verifications', label: 'Verifications', icon: ShieldCheck },
  { href: '/dashboard/admin/disputes', label: 'Disputes', icon: AlertTriangle },
  { href: '/dashboard/admin/transactions', label: 'Transactions', icon: List },
  { href: '/dashboard/admin/users', label: 'Users', icon: Users },
];

export function DashboardSidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();

  const links = user?.role === 'TRAINER' ? trainerLinks
    : user?.role === 'ADMIN' ? adminLinks
    : traineeLinks;

  return (
    <aside className="hidden md:flex flex-col w-64 bg-white border-r border-border h-screen fixed left-0 top-0">
      <Link href="/" className="flex items-center gap-2 px-6 h-16 border-b border-border">
        <span className="text-xl font-bold text-primary">Vuka</span>
      </Link>

      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {links.map((link) => {
          const isActive = pathname === link.href || pathname.startsWith(link.href + '/');
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-btn text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary/10 text-primary border-r-2 border-primary'
                  : 'text-muted-foreground hover:bg-accent hover:text-dark'
              )}
            >
              <link.icon size={18} />
              {link.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-border">
        <div className="flex items-center gap-3 px-3 py-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
            {user?.fullName?.[0]}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-dark truncate">{user?.fullName}</p>
            <p className="text-xs text-muted-foreground capitalize">{user?.role?.toLowerCase()}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-btn text-sm text-muted-foreground hover:bg-accent hover:text-destructive w-full transition-colors"
        >
          <LogOut size={18} /> Logout
        </button>
      </div>
    </aside>
  );
}
