import { Link } from 'react-router-dom';
import { BookOpen, Monitor, MapPin } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { StatusBadge } from './status-badge';
import { MilestoneProgress } from './milestone-progress';

interface EnrolmentCardProps {
  enrolment: any;
  role: 'trainee' | 'trainer';
  showPrice?: boolean;
}

import React from 'react';

export const EnrolmentCard = React.memo(function EnrolmentCard({ enrolment, role, showPrice }: EnrolmentCardProps) {
  const milestones = enrolment.milestones || [];
  const completedCount = milestones.filter((m: any) => m.status === 'COMPLETED').length;
  const totalCount = milestones.length;

  return (
    <Link
      to={`/${role}/enrolments/${enrolment.id}`}
      className="block bg-white rounded-card shadow-card hover:shadow-cardHover transition-shadow p-4"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {enrolment.course?.mode === 'PHYSICAL' ? (
              <MapPin size={14} className="text-muted-foreground" />
            ) : enrolment.course?.mode === 'VIRTUAL' ? (
              <Monitor size={14} className="text-muted-foreground" />
            ) : (
              <BookOpen size={14} className="text-muted-foreground" />
            )}
            <h3 className="font-medium text-dark text-sm truncate">{enrolment.course?.title || 'Course'}</h3>
          </div>
          <p className="text-xs text-muted-foreground">
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
