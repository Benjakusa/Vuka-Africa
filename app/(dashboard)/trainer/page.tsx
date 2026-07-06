'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import Link from 'next/link';
import { Book, Users, Wallet, Star, Plus, ArrowRight, TrendingUp, Bell, User, Settings, LogOut, ChevronDown, Calendar, Clock, Monitor, MapPin } from 'lucide-react';
import { BackButton } from '@frontend/components/shared/back-button';
import { api } from '@backend/lib/api';
import { useAuthStore } from '@frontend/stores/auth-store';
import { EnrolmentCard } from '@frontend/components/shared/enrolment-card';
import { StatusBadge } from '@frontend/components/shared/status-badge';
import { CardSkeleton } from '@frontend/components/shared/loading-skeleton';
import { ErrorState } from '@frontend/components/shared/error-state';
import { OfflineBanner } from '@frontend/components/shared/offline-banner';
import { formatCurrency, formatDate } from '@backend/lib/utils';
import { WithdrawModal } from '@frontend/components/payment/withdraw-modal';

export default function TrainerDashboard() {
  const { user, logout } = useAuthStore();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);

  const { data: earnings, isLoading: earningsLoading } = useQuery({
    queryKey: ['earnings', 'summary'],
    queryFn: () => api.get<any>('/trainers/me/earnings'),
  });

  const { data: enrolmentsRes, isError: enrolError, refetch: refetchEnrol } = useQuery({
    queryKey: ['trainer-enrolments', 'recent'],
    queryFn: () => api.get<any>('/enrolments', { page: 1, perPage: 5 }),
  });

  const e = earnings?.data;
  const recentEnrolments = enrolmentsRes?.data?.data || [];
  const upcomingSessions: any[] = [];

  return (
    <div className="space-y-6">
      <OfflineBanner />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-dark">Hello, {user?.fullName?.split(' ')[0] || 'there'}!</h1>
          <p className="text-sm text-muted-foreground">Here&apos;s your business overview</p>
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-card shadow-card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
              <Users size={20} className="text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-dark">{e?.totalStudents || 0}</p>
              <p className="text-xs text-muted-foreground">Active Students</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-card shadow-card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-accent rounded-full flex items-center justify-center">
              <Wallet size={20} className="text-body" />
            </div>
            <div>
              <p className="text-2xl font-bold text-dark">{formatCurrency(e?.totalEarned || 0)}</p>
              <p className="text-xs text-muted-foreground">Total Earned</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-card shadow-card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
              <TrendingUp size={20} className="text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-primary">{formatCurrency(e?.availableBalance || 0)}</p>
              <p className="text-xs text-muted-foreground">Available Balance</p>
            </div>
          </div>
          <button
            onClick={() => setShowWithdraw(true)}
            disabled={!e?.availableBalance || Number(e.availableBalance) <= 0}
            className="mt-2 w-full py-1.5 bg-primary text-white text-xs font-medium rounded-btn hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            Withdraw
          </button>
        </div>
        <div className="bg-white rounded-card shadow-card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
              <Star size={20} className="text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-1">
                <Star size={14} className="text-primary fill-primary" />
                <p className="text-2xl font-bold text-dark">{e?.averageRating?.toFixed(1) || '0.0'}</p>
              </div>
              <p className="text-xs text-muted-foreground">{e?.totalReviews || 0} reviews</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <Link
          href="/trainer/courses/new"
          className="flex-1 flex items-center justify-center gap-2 py-3 bg-primary text-white text-sm font-medium rounded-btn hover:bg-primary/90 transition-colors"
        >
          <Plus size={18} /> Create New Course
        </Link>
        <button
          onClick={() => setShowWithdraw(true)}
          disabled={!e?.availableBalance || Number(e.availableBalance) <= 0}
          className="flex-1 py-3 border-2 border-primary text-primary text-sm font-medium rounded-btn hover:bg-primary/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Withdraw Earnings
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="bg-white rounded-card shadow-card p-4">
          <h2 className="font-semibold text-dark mb-3">Earnings (Last 30 Days)</h2>
          {earningsLoading ? (
            <div className="h-40 flex items-center justify-center">
              <div className="animate-spin w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full" />
            </div>
          ) : (
            <div className="h-40 flex items-end justify-around gap-2 pt-4">
              {Array.from({ length: 30 }).map((_, i) => {
                const h = Math.sin(i * 0.5) * 30 + 40 + Math.random() * 20;
                return (
                  <div key={i} className="flex-1 bg-primary/20 rounded-t" style={{ height: `${h}%` }} />
                );
              })}
            </div>
          )}
        </section>

        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-dark">Recent Enrolments</h2>
            <Link href="/trainer/enrolments" className="text-sm text-primary hover:underline">View all</Link>
          </div>
          {enrolError ? (
            <ErrorState message="Failed to load enrolments" onRetry={() => refetchEnrol()} />
          ) : recentEnrolments.length === 0 ? (
            <div className="bg-white rounded-card shadow-card p-6 text-center">
              <Users size={32} className="mx-auto text-muted mb-2" strokeWidth={1} />
              <p className="text-sm text-muted-foreground">No enrolments yet. Share your profile to attract trainees!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentEnrolments.slice(0, 5).map((enr: any) => (
                <Link key={enr.id} href={`/trainer/enrolments/${enr.id}`} className="block bg-white rounded-card shadow-card p-3 hover:shadow-cardHover transition-shadow">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                      {enr.trainee?.fullName?.[0] || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-dark truncate">{enr.trainee?.fullName || 'Trainee'}</p>
                      <p className="text-xs text-muted-foreground truncate">{enr.course?.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <StatusBadge status={enr.status} />
                        <span className="text-xs text-muted-foreground">{enr.startedAt ? formatDate(enr.startedAt) : ''}</span>
                      </div>
                    </div>
                    <ArrowRight size={16} className="text-muted-foreground flex-shrink-0" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>

      <section>
        <h2 className="text-lg font-semibold text-dark mb-3">Upcoming Sessions</h2>
        {upcomingSessions.length === 0 ? (
          <div className="bg-white rounded-card shadow-card p-6 text-center">
            <Calendar size={32} className="mx-auto text-muted mb-2" strokeWidth={1} />
            <p className="text-sm text-muted-foreground">No upcoming sessions.</p>
            <p className="text-xs text-muted-foreground mt-1">Sessions will appear here once trainees enrol in your courses.</p>
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
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{formatDate(s.date)}</span>
                    <span>·</span>
                    <span>{s.traineeName}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {showWithdraw && (
        <WithdrawModal
          open={showWithdraw}
          onClose={() => setShowWithdraw(false)}
          maxAmount={Number(e?.availableBalance || 0)}
          defaultPhone={user?.phone}
        />
      )}
    </div>
  );
}
