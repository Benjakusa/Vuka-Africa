import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { BookOpen, MapPin, Calendar } from 'lucide-react';
import { toast } from 'sonner';

import { getEnrolment, confirmMilestone } from '@/services/enrolmentService';
import { enrolmentKeys } from '@/lib/query-keys';
import { BackButton } from '@/components/shared/back-button';
import { StatusBadge } from '@/components/shared/status-badge';
import { MilestoneStepper } from '@/components/shared/milestone-stepper';
import { CardSkeleton } from '@/components/shared/loading-skeleton';
import { ErrorState } from '@/components/shared/error-state';
import { formatCurrency, formatDate, getInitials } from '@/lib/utils';

export default function TrainerEnrolmentDetail() {
  const { id } = useParams<{ id: string }>();
  const [confirming, setConfirming] = useState<string | null>(null);

  const {
    data: enrolment,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: enrolmentKeys.detail(id!),
    queryFn: () => getEnrolment(id!),
    enabled: !!id,
  });

  const handleConfirmMilestone = async (milestoneId: string) => {
    setConfirming(milestoneId);
    try {
      await confirmMilestone(milestoneId, 'trainer');
      toast.success('Milestone confirmed');
      refetch();
    } catch (err: any) {
      toast.error(err.message || 'Failed to confirm milestone');
    } finally {
      setConfirming(null);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto">
        <CardSkeleton />
        <div className="mt-4">
          <CardSkeleton />
        </div>
      </div>
    );
  }

  if (isError || !enrolment) {
    return <ErrorState message="Failed to load enrolment" />;
  }

  const course = enrolment.course || {};
  const trainee = enrolment.trainee || {};
  const milestones = enrolment.milestones || [];



  return (
    <div className="max-w-4xl mx-auto">
      <BackButton href="/trainer/enrolments" label="Back to Enrolments" />

      <div className="bg-white rounded-card shadow-card p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-dark mb-1">{course.title || 'Course'}</h1>
            <p className="text-xs text-muted-foreground">Enrolled {formatDate(enrolment.createdAt)}</p>
          </div>
          <StatusBadge status={enrolment.status} />
        </div>

        <div className="flex flex-wrap gap-4 text-sm text-body mb-4">
          <span className="flex items-center gap-1">
            <MapPin size={14} className="text-muted-foreground" />
            {course.mode || 'N/A'}
          </span>
          <span className="flex items-center gap-1">
            <Calendar size={14} className="text-muted-foreground" />
            {course.duration || 'Flexible'}
          </span>
          <span className="flex items-center gap-1">
            <BookOpen size={14} className="text-muted-foreground" />
            {course.sessionCount || 0} sessions
          </span>
        </div>

        {enrolment.pricePaidKes && <p className="text-primary font-bold">{formatCurrency(enrolment.pricePaidKes)}</p>}
      </div>

      <div className="bg-white rounded-card shadow-card p-6 mb-6">
        <h2 className="text-lg font-bold text-dark mb-4">Trainee</h2>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
            {getInitials(trainee.fullName || 'T')}
          </div>
          <div>
            <p className="font-medium text-dark">{trainee.fullName || 'Unknown'}</p>
            <p className="text-xs text-muted-foreground">
              {trainee.email} • {trainee.phone}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-card shadow-card p-6">
        <h2 className="text-lg font-bold text-dark mb-4">Milestones</h2>
        <MilestoneStepper
          milestones={milestones}
          role="trainer"
          onConfirm={handleConfirmMilestone}
          confirming={confirming}
        />
      </div>
    </div>
  );
}
