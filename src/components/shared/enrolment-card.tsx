import React, { useCallback } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Monitor, MapPin } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { formatCurrency } from '@/lib/utils';
import { StatusBadge } from './status-badge';
import { MilestoneProgress } from './milestone-progress';
import { getEnrolment } from '@/services/enrolmentService';

interface EnrolmentCardProps {
  enrolment: any;
  role: 'trainee' | 'trainer';
  showPrice?: boolean;
}

export const EnrolmentCard = React.memo(function EnrolmentCard({ enrolment, role, showPrice }: EnrolmentCardProps) {
  const milestones = enrolment.milestones || [];
  const completedCount = milestones.filter((m: any) => m.status === 'COMPLETED').length;
  const totalCount = milestones.length;
  const queryClient = useQueryClient();

  const prefetch = useCallback(() => {
    queryClient.prefetchQuery({
      queryKey: ['enrolment', enrolment.id],
      queryFn: () => getEnrolment(enrolment.id),
      staleTime: 60_000,
    });
  }, [queryClient, enrolment.id]);

  return (
    <Link
      to={`/${role}/enrolments/${enrolment.id}`}
      onMouseEnter={prefetch}
      className="block bg-white rounded-card shadow-card card-hover p-4"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {enrolment.course?.mode === 'PHYSICAL' ? (
              <MapPin size={14} className="text-body-foreground" />
            ) : enrolment.course?.mode === 'VIRTUAL' ? (
              <Monitor size={14} className="text-body-foreground" />
            ) : (
              <BookOpen size={14} className="text-body-foreground" />
            )}
            <h3 className="font-medium text-dark text-sm truncate">{enrolment.course?.title || 'Course'}</h3>
          </div>
          <p className="text-xs text-body-foreground">
            {role === 'trainee' ? `Trainer: ${enrolment.trainer?.fullName}` : `Trainee: ${enrolment.trainee?.fullName}`}
          </p>
          {showPrice && enrolment.pricePaidKes && (
            <p className="text-xs font-medium text-primary mt-1">{formatCurrency(enrolment.pricePaidKes)}</p>
          )}
          {role === 'trainee' && enrolment.status === 'ACTIVE' && totalCount > 0 && (
            <div className="mt-2">
              <MilestoneProgress completed={completedCount} total={totalCount} size="sm" />
            </div>
          )}
        </div>
        <StatusBadge status={enrolment.status} />
      </div>
    </Link>
  );
});
