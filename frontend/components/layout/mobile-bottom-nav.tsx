'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, BookOpen, Book, Users, Wallet, ShieldCheck,
  AlertTriangle, List, Star, Receipt, Search,
} from 'lucide-react';
import { cn } from '@backend/lib/utils';
import { useAuthStore } from '@frontend/stores/auth-store';

const traineeTabs = [
  { href: '/trainee', label: 'Home', icon: LayoutDashboard },
  { href: '/trainee/enrolments', label: 'Courses', icon: BookOpen },
  { href: '/trainee/reviews', label: 'Reviews', icon: Star },
  { href: '/trainers', label: 'Browse', icon: Search },
];

const trainerTabs = [
  { href: '/trainer', label: 'Home', icon: LayoutDashboard },
  { href: '/trainer/courses', label: 'Courses', icon: Book },
  { href: '/trainer/enrolments', label: 'Students', icon: Users },
  { href: '/trainer/earnings', label: 'Earnings', icon: Wallet },
  { href: '/trainer/reviews', label: 'Reviews', icon: Star },
];

const adminTabs = [
  { href: '/admin', label: 'Home', icon: LayoutDashboard },
  { href: '/admin/verifications', label: 'Verify', icon: ShieldCheck },
  { href: '/admin/disputes', label: 'Issues', icon: AlertTriangle },
  { href: '/admin/transactions', label: 'Ledger', icon: List },
];

export function MobileBottomNav() {
  const pathname = usePathname();
  const { user } = useAuthStore();

  const tabs = user?.role === 'TRAINER' ? trainerTabs
    : user?.role === 'ADMIN' ? adminTabs
    : traineeTabs;

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-border z-50 safe-area-bottom">
      <div className="flex items-center justify-around h-16">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href || pathname.startsWith(tab.href + '/');
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                'flex flex-col items-center gap-0.5 px-3 py-1.5 text-xs font-medium transition-colors',
                isActive ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <tab.icon size={20} />
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
