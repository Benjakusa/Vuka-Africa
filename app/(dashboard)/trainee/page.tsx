'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import Link from 'next/link';
import { BookOpen, CheckCircle, Wallet, Star, Calendar, Bell, User, Settings, LogOut, ChevronDown, ArrowRight, Search, Monitor, MapPin } from 'lucide-react';
import { api } from '@backend/lib/api';
import { enrolmentKeys } from '@backend/lib/query-keys';
import { useAuthStore } from '@frontend/stores/auth-store';
import { EnrolmentCard } from '@frontend/components/shared/enrolment-card';
import { StatusBadge } from '@frontend/components/shared/status-badge';
import { EmptyState } from '@frontend/components/shared/empty-state';
import { ErrorState } from '@frontend/components/shared/error-state';
import { CardSkeleton } from '@frontend/components/shared/loading-skeleton';
import { OfflineBanner } from '@frontend/components/shared/offline-banner';
import { formatCurrency, formatDate } from '@backend/lib/utils';

export default function TraineeDashboard() {
  const { user, logout } = useAuthStore();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const { data: enrolmentsRes, isLoading, isError, refetch } = useQuery({
    queryKey: enrolmentKeys.list({ status: 'ACTIVE' }),
    queryFn: () => api.get<any>('/enrolments', { status: 'ACTIVE', page: 1, perPage: 50 }),
  });

  const { data: completedRes } = useQuery({
    queryKey: enrolmentKeys.list({ status: 'COMPLETED' }),
    queryFn: () => api.get<any>('/enrolments', { status: 'COMPLETED', page: 1, perPage: 50 }),
  });

  const activeEnrolments = enrolmentsRes?.data?.data || [];
  const completedEnrolments = completedRes?.data?.data || [];
  const totalSpent = completedEnrolments.reduce((sum: number, e: any) => sum + Number(e.pricePaidKes), 0);
  const pendingReviews = completedEnrolments.filter((e: any) => !e.reviews?.length);
  const upcomingSessions: any[] = [];

  return (
    <div className="space-y-6">
      <OfflineBanner />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-dark">Hello, {user?.fullName?.split(' ')[0] || 'there'}!</h1>
          <p className="text-sm text-muted-foreground">Here&apos;s your learning overview</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="relative p-2 text-muted-foreground hover:text-dark hover:bg-accent rounded-full transition-colors">
            <Bell size={20} />
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-destructive text-white text-[10px] font-bold rounded-full flex items-center justify-center">0</span>
          </button>
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 p-1.5 hover:bg-accent rounded-btn transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                {user?.fullName?.[0] || 'U'}
              </div>
              <ChevronDown size={14} className="text-muted-foreground" />
            </button>
            {showUserMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
                <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-card shadow-modal border border-border z-50 py-1">
                  <div className="px-3 py-2 border-b border-border">
                    <p className="text-sm font-medium text-dark truncate">{user?.fullName}</p>
                    <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                  </div>
                  <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-body hover:bg-accent transition-colors">
                    <User size={16} /> Profile
                  </button>
                  <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-body hover:bg-accent transition-colors">
                    <Settings size={16} /> Settings
                  </button>
                  <div className="border-t border-border mt-1 pt-1">
                    <button onClick={logout} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-accent transition-colors">
                      <LogOut size={16} /> Logout
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white rounded-card shadow-card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
              <BookOpen size={20} className="text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-dark">{activeEnrolments.length}</p>
              <p className="text-xs text-muted-foreground">Active Trainings</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-card shadow-card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-accent rounded-full flex items-center justify-center">
              <CheckCircle size={20} className="text-body" />
            </div>
            <div>
              <p className="text-2xl font-bold text-dark">{completedEnrolments.length}</p>
              <p className="text-xs text-muted-foreground">Completed</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-card shadow-card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
              <Wallet size={20} className="text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-dark">{formatCurrency(totalSpent)}</p>
              <p className="text-xs text-muted-foreground">Total Spent</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-card shadow-card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-warning/10 rounded-full flex items-center justify-center">
              <Star size={20} className="text-warning" />
            </div>
            <div>
              <p className="text-2xl font-bold text-dark">{pendingReviews.length}</p>
              <p className="text-xs text-muted-foreground">Pending Reviews</p>
            </div>
          </div>
        </div>
      </div>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-dark">Continue Learning</h2>
          <Link href="/trainee/enrolments" className="text-sm text-primary hover:underline flex items-center gap-1">
            View all <ArrowRight size={14} />
          </Link>
        </div>
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[1, 2].map(i => <CardSkeleton key={i} />)}
          </div>
        ) : isError ? (
          <ErrorState message="Failed to load enrolments" onRetry={() => refetch()} />
        ) : activeEnrolments.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title="No active enrolments"
            subtitle="You haven't enrolled in any courses yet. Browse trainers to find your first course!"
            action={{ label: 'Browse Trainers', href: '/trainers' }}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {activeEnrolments.map((e: any) => (
              <EnrolmentCard key={e.id} enrolment={e} role="trainee" />
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-lg font-semibold text-dark mb-3">Upcoming Sessions</h2>
        {upcomingSessions.length === 0 ? (
          <div className="bg-white rounded-card shadow-card p-6 text-center">
            <Calendar size={32} className="mx-auto text-muted mb-2" strokeWidth={1} />
            <p className="text-sm text-muted-foreground">No upcoming sessions scheduled.</p>
            {activeEnrolments.length > 0 && (
              <p className="text-xs text-muted-foreground mt-1">Sessions will appear here once your trainer schedules them.</p>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {upcomingSessions.slice(0, 3).map((s: any, i: number) => (
              <div key={i} className="bg-white rounded-card shadow-card p-3 flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                  {s.mode === 'PHYSICAL' ? <MapPin size={18} className="text-primary" /> : <Monitor size={18} className="text-primary" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-dark">{s.courseTitle}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(s.date)} · {s.trainerName}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {pendingReviews.length > 0 && (
        <section className="bg-warning/5 border border-warning/20 rounded-card p-4">
          <div className="flex items-center gap-3">
            <Star size={20} className="text-warning" />
            <div className="flex-1">
              <p className="text-sm font-medium text-dark">
                You have {pendingReviews.length} course{pendingReviews.length > 1 ? 's' : ''} waiting for your review
              </p>
            </div>
            <Link
              href="/trainee/reviews"
              className="flex items-center gap-1 px-3 py-1.5 bg-primary text-white text-xs font-medium rounded-btn hover:bg-primary/90 transition-colors"
            >
              Write a Review <ArrowRight size={14} />
            </Link>
          </div>
        </section>
      )}

      <div className="flex justify-center pt-2 pb-4">
        <Link
          href="/trainers"
          className="flex items-center gap-2 px-6 py-3 bg-primary/10 text-primary font-medium rounded-btn hover:bg-primary/20 transition-colors"
        >
          <Search size={18} /> Browse Trainers
        </Link>
      </div>
    </div>
  );
}
