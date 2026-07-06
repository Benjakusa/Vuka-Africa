'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useState } from 'react';
import { BookOpen, Users, Wallet, Star, Plus, ArrowRight, TrendingUp } from 'lucide-react';
import { BackButton } from '@frontend/components/shared/back-button';
import { api } from '@backend/lib/api';
import { useAuthStore } from '@frontend/stores/auth-store';
import { CardSkeleton } from '@frontend/components/shared/loading-skeleton';
import { formatCurrency } from '@backend/lib/utils';
import { WithdrawModal } from '@frontend/components/payment/withdraw-modal';

export default function TrainerDashboard() {
  const { user } = useAuthStore();
  const [showWithdraw, setShowWithdraw] = useState(false);

  const { data: earnings, isLoading: earningsLoading } = useQuery({
    queryKey: ['earnings', 'summary'],
    queryFn: () => api.get<any>('/trainers/me/earnings'),
  });

  const { data: enrolmentsRes } = useQuery({
    queryKey: ['trainer-enrolments', 'recent'],
    queryFn: () => api.get<any>('/enrolments', { page: 1, perPage: 5 }),
  });

  const e = earnings?.data;
  const recentEnrolments = enrolmentsRes?.data?.data || [];

  return (
    <div className="space-y-6">
      <BackButton href="/" />
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-dark">Trainer Dashboard</h1>
        <Link
          href="/dashboard/trainer/courses/new"
          className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white text-sm font-medium rounded-btn hover:bg-primary/90 transition-colors"
        >
          <Plus size={16} /> New Course
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-card shadow-card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <Users size={20} className="text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-dark">{e?.totalStudents || 0}</p>
              <p className="text-xs text-muted-foreground">Students</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-card shadow-card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <Wallet size={20} className="text-green-600" />
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
              <p className="text-xs text-muted-foreground">Available</p>
            </div>
          </div>
          <button
            onClick={() => setShowWithdraw(true)}
            className="mt-2 w-full py-1.5 bg-primary text-white text-xs font-medium rounded-btn hover:bg-primary/90 transition-colors"
          >
            Withdraw
          </button>
        </div>
        <div className="bg-white rounded-card shadow-card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
              <Star size={20} className="text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-dark">{e?.averageRating?.toFixed(1) || '0.0'}</p>
              <p className="text-xs text-muted-foreground">Rating ({e?.totalReviews || 0})</p>
            </div>
          </div>
        </div>
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
            <Link href="/dashboard/trainer/enrolments" className="text-sm text-primary hover:underline">View all</Link>
          </div>
          <div className="space-y-2">
            {recentEnrolments.slice(0, 5).map((e: any) => (
              <Link key={e.id} href={`/dashboard/trainer/enrolments/${e.id}`} className="block bg-white rounded-card shadow-card p-3 hover:shadow-cardHover transition-shadow">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                    {e.trainee?.fullName?.[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-dark truncate">{e.trainee?.fullName}</p>
                    <p className="text-xs text-muted-foreground truncate">{e.course?.title}</p>
                  </div>
                  <ArrowRight size={16} className="text-muted-foreground" />
                </div>
              </Link>
            ))}
            {recentEnrolments.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">No enrolments yet</p>
            )}
          </div>
        </section>
      </div>

      <div className="flex gap-3">
        <Link href="/dashboard/trainer/courses/new" className="flex-1 py-3 bg-primary text-white text-sm font-medium rounded-btn text-center hover:bg-primary/90 transition-colors">
          + Create New Course
        </Link>
        <button onClick={() => setShowWithdraw(true)} className="flex-1 py-3 border-2 border-primary text-primary text-sm font-medium rounded-btn hover:bg-primary/5 transition-colors">
          Withdraw Funds
        </button>
      </div>

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
