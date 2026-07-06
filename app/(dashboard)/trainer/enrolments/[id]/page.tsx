'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, AlertTriangle } from 'lucide-react';
import { api } from '@backend/lib/api';
import { MilestoneStepper } from '@frontend/components/shared/milestone-stepper';
import { ProfileSkeleton } from '@frontend/components/shared/loading-skeleton';
import { formatCurrency, formatDateTime } from '@backend/lib/utils';
import { toast } from 'sonner';

export default function TrainerEnrolmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['enrolment', id],
    queryFn: () => api.get<any>(`/enrolments/${id}`),
  });

  const confirmMutation = useMutation({
    mutationFn: (milestoneId: string) => api.post(`/milestones/${milestoneId}/confirm`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enrolment', id] });
      toast.success('Milestone confirmed');
    },
    onError: (err: any) => toast.error(err.message),
  });

  const enr = data?.data;

  if (isLoading) return <ProfileSkeleton />;
  if (!enr) return <div className="p-8 text-center text-muted-foreground">Enrolment not found</div>;

  return (
    <div className="space-y-6 max-w-3xl">
      <Link href="/dashboard/trainer/enrolments" className="flex items-center gap-1.5 text-sm text-primary hover:underline">
        <ArrowLeft size={16} /> Back to Enrolments
      </Link>

      <div className="bg-white rounded-card shadow-card p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
            {enr.trainee?.fullName?.[0]}
          </div>
          <div>
            <h1 className="text-xl font-bold text-dark">{enr.trainee?.fullName}</h1>
            <p className="text-sm text-muted-foreground">{enr.course?.title}</p>
          </div>
          <span className={`ml-auto px-3 py-1 rounded-full text-xs font-medium ${
            enr.status === 'COMPLETED' ? 'bg-accent text-body' :
            enr.status === 'IN_PROGRESS' ? 'bg-primary/10 text-primary' :
            enr.status === 'PENDING' ? 'bg-warning/10 text-warning' :
            'bg-accent text-muted-foreground'
          }`}>
            {enr.status === 'IN_PROGRESS' ? 'In Progress' : enr.status.charAt(0) + enr.status.slice(1).toLowerCase()}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm mb-6">
          <div><span className="text-muted-foreground">Enrolled:</span> <span className="text-dark">{formatDateTime(enr.createdAt)}</span></div>
          <div><span className="text-muted-foreground">Total Paid:</span> <span className="text-dark font-medium">{formatCurrency(enr.totalPaid)}</span></div>
          {enr.course?.mode && <div><span className="text-muted-foreground">Mode:</span> <span className="text-dark">{enr.course.mode}</span></div>}
          {enr.course?.duration && <div><span className="text-muted-foreground">Duration:</span> <span className="text-dark">{enr.course.duration}</span></div>}
        </div>

        <div className="border-t border-border pt-6">
          <h3 className="text-sm font-semibold text-dark mb-4">Milestones</h3>
          <MilestoneStepper
            milestones={enr.milestones}
            role="TRAINER"
            onConfirm={(milestoneId) => confirmMutation.mutate(milestoneId)}
            isConfirming={confirmMutation.isPending}
          />
        </div>
      </div>
    </div>
  );
}
