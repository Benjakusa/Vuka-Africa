import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  BookOpen,
  Book,
  Users,
  Wallet,
  ShieldCheck,
  AlertTriangle,
  List,
  Star,
  Receipt,
  LogOut,
  Search,
  Settings,
  UserCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth-store';

export const traineeLinks = [
  { href: '/trainee', label: 'Overview', icon: LayoutDashboard },
  { href: '/trainee/enrolments', label: 'My Enrolments', icon: BookOpen },
  { href: '/trainee/payments', label: 'Payments', icon: Receipt },
  { href: '/trainee/reviews', label: 'Reviews', icon: Star },
  { href: '/trainers', label: 'Browse Trainers', icon: Search },
];

export const trainerLinks = [
  { href: '/trainer', label: 'Overview', icon: LayoutDashboard },
  { href: '/trainer/courses', label: 'My Courses', icon: Book },
  { href: '/trainer/enrolments', label: 'Enrolments', icon: Users },
  { href: '/trainer/earnings', label: 'Earnings', icon: Wallet },
  { href: '/trainer/profile', label: 'Profile', icon: UserCircle },
  { href: '/trainer/verification', label: 'Verification', icon: ShieldCheck },
  { href: '/trainer/reviews', label: 'Reviews', icon: Star },
];

export const adminLinks = [
  { href: '/admin', label: 'Overview', icon: LayoutDashboard },
  { href: '/admin/earnings', label: 'Earnings', icon: Wallet },
  { href: '/admin/courses', label: 'Courses', icon: BookOpen },
  { href: '/admin/verifications', label: 'Verifications', icon: ShieldCheck },
  { href: '/admin/disputes', label: 'Disputes', icon: AlertTriangle },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/transactions', label: 'Transactions', icon: List },
  { href: '/admin/config', label: 'Platform Config', icon: Settings },
];

export function DashboardSidebar() {
  const location = useLocation();
  const { user, logout } = useAuthStore();

  const links = user?.role === 'TRAINER' ? trainerLinks : user?.role === 'ADMIN' ? adminLinks : traineeLinks;

  return (
    <aside className="hidden md:flex flex-col w-64 bg-white border-r border-border h-screen fixed left-0 top-0">
      <Link to="/" className="flex items-center gap-2 px-6 h-16 border-b border-border">
        <span className="text-xl font-bold text-primary">Vuka</span>
      </Link>

      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {links.map((link) => {
          const isActive = location.pathname === link.href || location.pathname.startsWith(link.href + '/');
          return (
            <Link
              key={link.href}
              to={link.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-btn text-sm font-medium transition-colors',
                isActive ? 'bg-primary text-white' : 'text-body-foreground hover:bg-accent hover:text-dark',
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
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white font-bold text-sm">
            {user?.fullName?.[0]}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-dark truncate">{user?.fullName}</p>
            <p className="text-xs text-body-foreground capitalize">{user?.role?.toLowerCase()}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-btn text-sm text-body-foreground hover:bg-accent hover:text-primary w-full transition-colors"
        >
          <LogOut size={18} /> Logout
        </button>
      </div>
    </aside>
  );
}
