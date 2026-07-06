'use client';

import { useQuery } from '@tanstack/react-query';
import { Users, BookOpen, DollarSign, ShieldCheck, AlertTriangle, TrendingUp } from 'lucide-react';
import { BackButton } from '@frontend/components/shared/back-button';
import { api } from '@backend/lib/api';
import { formatCurrency } from '@backend/lib/utils';
import Link from 'next/link';

export default function AdminDashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: () => api.get<any>('/admin/stats'),
  });

  const s = stats?.data;

  const cards = [
    { label: 'Total Users', value: s?.totalUsers || 0, icon: Users, color: 'bg-primary/10 text-primary', href: '/dashboard/admin/users' },
    { label: 'Total Courses', value: s?.totalCourses || 0, icon: BookOpen, color: 'bg-accent text-body', href: '#' },
    { label: 'Total Revenue', value: formatCurrency(s?.totalRevenue || 0), icon: DollarSign, color: 'bg-primary/10 text-primary', href: '/dashboard/admin/ledger' },
    { label: 'Pending Verifications', value: s?.pendingVerifications || 0, icon: ShieldCheck, color: 'bg-warning/10 text-warning', href: '/dashboard/admin/verifications' },
    { label: 'Active Disputes', value: s?.activeDisputes || 0, icon: AlertTriangle, color: 'bg-destructive/10 text-destructive', href: '/dashboard/admin/disputes' },
    { label: 'Commission Earned', value: formatCurrency(s?.commissionEarned || 0), icon: TrendingUp, color: 'bg-surface text-body', href: '/dashboard/admin/ledger' },
  ];

  return (
    <div className="space-y-6">
      <BackButton href="/" />
      <h1 className="text-2xl font-bold text-dark">Admin Dashboard</h1>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3,4,5,6].map(i => <div key={i} className="bg-white rounded-card shadow-card p-4 animate-pulse"><div className="h-10 bg-accent rounded w-2/3" /></div>)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {cards.map(c => (
            <Link key={c.label} href={c.href} className="bg-white rounded-card shadow-card p-4 hover:shadow-cardHover transition-shadow">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 ${c.color} rounded-full flex items-center justify-center`}>
                  <c.icon size={20} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-dark">{c.value}</p>
                  <p className="text-xs text-muted-foreground">{c.label}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="bg-white rounded-card shadow-card p-4">
          <h2 className="font-semibold text-dark mb-3">Recent Registrations</h2>
          {s?.recentRegistrations?.length > 0 ? (
            <div className="space-y-2">
              {s.recentRegistrations.slice(0, 5).map((u: any) => (
                <div key={u.id} className="flex items-center gap-3 text-sm">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">{u.fullName?.[0]}</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-dark truncate">{u.fullName}</p>
                    <p className="text-xs text-muted-foreground">{u.email}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${u.role === 'TRAINER' ? 'bg-accent text-body' : 'bg-surface text-body'}`}>{u.role}</span>
                </div>
              ))}
            </div>
          ) : <p className="text-sm text-muted-foreground text-center py-6">No recent registrations</p>}
        </section>

        <section className="bg-white rounded-card shadow-card p-4">
          <h2 className="font-semibold text-dark mb-3">Revenue (30 days)</h2>
          <div className="h-40 flex items-end justify-around gap-2 pt-4">
            {Array.from({ length: 30 }).map((_, i) => {
              const h = Math.sin(i * 0.4) * 25 + 35 + Math.random() * 25;
              return <div key={i} className="flex-1 bg-primary/20 rounded-t" style={{ height: `${h}%` }} />;
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
