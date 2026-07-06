'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { AlertTriangle, Mail } from 'lucide-react';
import { BackButton } from '@frontend/components/shared/back-button';
import { api } from '@backend/lib/api';
import { enrolmentKeys } from '@backend/lib/query-keys';
import { MilestoneStepper } from '@frontend/components/shared/milestone-stepper';
import { ErrorState } from '@frontend/components/shared/error-state';
import { ProfileSkeleton } from '@frontend/components/shared/loading-skeleton';
import { VerifiedBadge } from '@frontend/components/shared/verified-badge';
import { formatCurrency, formatDateTime } from '@backend/lib/utils';
import { toast } from 'sonner';

export default function EnrolmentDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const queryClient = useQueryClient();
  const [showDispute, setShowDispute] = useState(false);
  const [disputeReason, setDisputeReason] = useState('');

  const { data: res, isLoading, isError } = useQuery({
    queryKey: enrolmentKeys.detail(id),
    queryFn: () => api.get<any>(`/enrolments/${id}`),
    enabled: !!id,
  });

  const enrolment = res?.data;

  const confirmMutation = useMutation({
    mutationFn: (milestoneId: string) =>
      api.post(`/enrolments/${id}/milestones/${milestoneId}/trainee-confirm`),
    onMutate: async (milestoneId) => {
      await queryClient.cancelQueries({ queryKey: enrolmentKeys.detail(id) });
      const prev = queryClient.getQueryData(enrolmentKeys.detail(id));
      queryClient.setQueryData(enrolmentKeys.detail(id), (old: any) => ({
        ...old,
        data: {
          ...old?.data,
          milestones: old?.data?.milestones?.map((m: any) =>
            m.id === milestoneId ? { ...m, status: 'TRAINEE_CONFIRMED', traineeConfirmedAt: new Date().toISOString() } : m
          ),
        },
      }));
      return { prev };
    },
    onError: (err: any, _, context) => {
      queryClient.setQueryData(enrolmentKeys.detail(id), context?.prev);
      toast.error(err.message || 'Failed to confirm attendance');
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: enrolmentKeys.detail(id) }),
  });

  const disputeMutation = useMutation({
    mutationFn: () =>
      api.post(`/enrolments/${id}/disputes`, { reason: disputeReason }),
    onSuccess: () => {
      toast.success('Dispute raised. Admin will review within 48 hours.');
      setShowDispute(false);
      setDisputeReason('');
    },
    onError: (err: any) => toast.error(err.message || 'Failed to raise dispute'),
  });

  if (isLoading) return <div><ProfileSkeleton /></div>;
  if (isError || !enrolment) return <ErrorState message="Enrolment not found" />;

  return (
    <div className="space-y-6 max-w-3xl">
      <BackButton href="/dashboard/trainee/enrolments" label="Back to Enrolments" />
      <div className="flex items-center gap-2">
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
          enrolment.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
          enrolment.status === 'COMPLETED' ? 'bg-blue-100 text-blue-700' :
          enrolment.status === 'CANCELLED' ? 'bg-red-100 text-red-700' :
          'bg-yellow-100 text-yellow-700'
        }`}>
          {enrolment.status}
        </span>
      </div>

      <div>
        <h1 className="text-xl font-bold text-dark">{enrolment.course?.title}</h1>
        <div className="flex items-center gap-2 mt-1 text-sm text-body">
          <span>Trainer: {enrolment.course?.trainer?.user?.fullName}</span>
          <VerifiedBadge isVerified={enrolment.course?.trainer?.isVerified} size="sm" />
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Started {enrolment.startedAt ? formatDateTime(enrolment.startedAt) : 'N/A'}
        </p>
      </div>

      <section>
        <h2 className="text-lg font-semibold text-dark mb-4">Milestone Tracker</h2>
        <MilestoneStepper
          milestones={enrolment.milestones || []}
          enrolmentStatus={enrolment.status}
          role="TRAINEE"
          onTraineeConfirm={(mid) => confirmMutation.mutate(mid)}
          isPending={confirmMutation.isPending}
        />
      </section>

      <section className="bg-white rounded-card shadow-card p-4">
        <h3 className="font-medium text-dark mb-2">Payment Summary</h3>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-body">Total paid</span>
            <span className="font-semibold text-dark">{formatCurrency(enrolment.pricePaidKes)}</span>
          </div>
          {(enrolment.milestones || []).map((m: any) => (
            <div key={m.id} className="flex justify-between text-muted-foreground">
              <span>{m.label} ({m.percentage}%)</span>
              <span>{m.status === 'RELEASED' ? formatCurrency(m.amountKes) : 'Pending'}</span>
            </div>
          ))}
        </div>
      </section>

      <button
        onClick={() => setShowDispute(true)}
        className="flex items-center gap-2 text-sm text-destructive hover:text-destructive/80"
      >
        <AlertTriangle size={16} /> Report an Issue
      </button>

      {showDispute && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setShowDispute(false)}>
          <div className="bg-white rounded-card shadow-modal w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-dark mb-4">Raise a Dispute</h3>
            <textarea
              value={disputeReason}
              onChange={(e) => setDisputeReason(e.target.value)}
              placeholder="Describe the issue (min 10 characters)..."
              rows={4}
              className="w-full px-3 py-2 border border-border rounded-btn text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => disputeMutation.mutate()}
                disabled={disputeReason.length < 10 || disputeMutation.isPending}
                className="flex-1 py-2 bg-destructive text-white font-medium rounded-btn hover:bg-destructive/90 disabled:opacity-50 transition-colors"
              >
                {disputeMutation.isPending ? 'Submitting...' : 'Submit Dispute'}
              </button>
              <button onClick={() => setShowDispute(false)} className="px-4 py-2 border border-border text-body rounded-btn hover:bg-accent">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
