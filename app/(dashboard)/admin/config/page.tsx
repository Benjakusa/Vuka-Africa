'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Settings, Save, Loader2 } from 'lucide-react';
import { BackButton } from '@frontend/components/shared/back-button';
import { api } from '@backend/lib/api';
import { ErrorState } from '@frontend/components/shared/error-state';
import { CardSkeleton } from '@frontend/components/shared/loading-skeleton';
import { OfflineBanner } from '@frontend/components/shared/offline-banner';
import { formatCurrency } from '@backend/lib/utils';
import { toast } from 'sonner';

export default function AdminConfigPage() {
  const queryClient = useQueryClient();
  const [dirty, setDirty] = useState(false);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin', 'config'],
    queryFn: () => api.get<any>('/admin/config'),
  });

  const statsQuery = useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: () => api.get<any>('/admin/stats'),
  });

  const config = data?.data || {};
  const stats = statsQuery?.data?.data || {};

  const [form, setForm] = useState<Record<string, string>>({});

  if (data && !dirty && Object.keys(form).length === 0) {
    const initial: Record<string, string> = {};
    for (const [key, value] of Object.entries(config)) {
      initial[key] = String(value ?? '');
    }
    setForm(initial);
    setDirty(true);
  }

  const saveMutation = useMutation({
    mutationFn: () => api.patch('/admin/config', form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'config'] });
      toast.success('Platform configuration updated');
    },
    onError: (err: any) => toast.error(err.message),
  });

  const fields = [
    { key: 'defaultCommission', label: 'Default Commission (%)', desc: 'Commission for unverified trainers', min: 0, max: 100 },
    { key: 'verifiedCommission', label: 'Verified Commission (%)', desc: 'Commission for verified trainers', min: 0, max: 100 },
    { key: 'foundingCommission', label: 'Founding Trainer Commission (%)', desc: 'Commission for first 100 trainers', min: 0, max: 100 },
    { key: 'freeTrainerLimit', label: 'Free Trainer Limit', desc: 'How many trainers get founding status', min: 0 },
    { key: 'verificationFee', label: 'Verification Fee (KES)', desc: 'One-time fee for verification badge', min: 0 },
    { key: 'payout2faExpiry', label: 'Payout 2FA Expiry (minutes)', desc: 'How long the email code is valid', min: 1 },
    { key: 'milestoneCoolingPeriod', label: 'Milestone Cooling Period (hours)', desc: 'Delay before funds are released', min: 0 },
    { key: 'maxCoursePrice', label: 'Max Course Price (KES)', desc: 'Upper limit for course pricing', min: 0 },
    { key: 'minWithdrawal', label: 'Min Withdrawal (KES)', desc: 'Minimum amount trainers can withdraw', min: 0 },
  ];

  const handleChange = (key: string, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const freeTrainerLimit = Number(form.freeTrainerLimit) || 100;
  const trainersRegistered = stats?.totalTrainers || 0;
  const remainingFreeSpots = Math.max(0, freeTrainerLimit - trainersRegistered);

  return (
    <div className="space-y-6 max-w-2xl">
      <OfflineBanner />
      <BackButton href="/admin" label="Back to Admin" />
      <h1 className="text-2xl font-bold text-dark">Platform Configuration</h1>

      {isLoading ? (
        <div className="space-y-3">{[1,2,3].map(i => <CardSkeleton key={i} />)}</div>
      ) : isError ? (
        <ErrorState message="Failed to load configuration" onRetry={() => refetch()} />
      ) : (
        <>
          <div className="bg-white rounded-card shadow-card p-6 space-y-5">
            <h2 className="font-semibold text-dark flex items-center gap-2">
              <Settings size={18} /> Commission & Fee Settings
            </h2>
            {fields.map(f => (
              <div key={f.key}>
                <label className="text-sm font-medium text-dark mb-1 block">{f.label}</label>
                <p className="text-xs text-muted-foreground mb-1">{f.desc}</p>
                <input
                  type="number"
                  value={form[f.key] ?? ''}
                  onChange={(e) => handleChange(f.key, e.target.value)}
                  min={f.min}
                  max={f.max}
                  className="w-full px-3 py-2 border border-border rounded-btn text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            ))}
            <button
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
              className="w-full py-2.5 bg-primary text-white font-medium rounded-btn hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              {saveMutation.isPending ? <><Loader2 size={16} className="animate-spin" /> Saving...</> : <><Save size={16} /> Save Configuration</>}
            </button>
          </div>

          <div className="bg-white rounded-card shadow-card p-6">
            <h2 className="font-semibold text-dark mb-4">Current Platform Stats</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Trainers registered</p>
                <p className="text-xl font-bold text-dark">{trainersRegistered} / {freeTrainerLimit}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Remaining free spots</p>
                <p className="text-xl font-bold text-primary">{remainingFreeSpots}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Total platform revenue</p>
                <p className="text-xl font-bold text-dark">{formatCurrency(stats?.totalRevenue || 0)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Active enrolments</p>
                <p className="text-xl font-bold text-dark">{stats?.activeEnrolments || 0}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Total users</p>
                <p className="text-xl font-bold text-dark">{stats?.totalUsers || 0}</p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
