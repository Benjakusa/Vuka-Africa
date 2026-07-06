'use client';

import Link from 'next/link';
import { ArrowRight, MapPin, Monitor } from 'lucide-react';
import { StatusBadge } from './status-badge';
import { ProgressBar } from './progress-bar';
import { VerifiedBadge } from './verified-badge';
import { formatCurrency } from '@backend/lib/utils';

interface EnrolmentCardProps {
  enrolment: {
    id: string;
    status: string;
    pricePaidKes?: number;
    startedAt?: string;
    course?: {
      title: string;
      mode?: string;
      trainer?: {
        user?: { fullName?: string };
        isVerified?: boolean;
        avatarUrl?: string | null;
      };
    };
    milestones?: { status: string }[];
  };
  role: 'trainee' | 'trainer';
  showPrice?: boolean;
}

export function EnrolmentCard({ enrolment, role, showPrice }: EnrolmentCardProps) {
  const released = enrolment.milestones?.filter((m) => m.status === 'RELEASED').length || 0;
  const total = enrolment.milestones?.length || 3;
  const linkPrefix = role === 'trainee' ? '/trainee/enrolments' : '/trainer/enrolments';
  const trainer = enrolment.course?.trainer;
  const trainerName = trainer?.user?.fullName || 'Trainer';

  return (
    <Link
      href={`${linkPrefix}/${enrolment.id}`}
      className="block bg-white rounded-card shadow-card p-4 hover:shadow-cardHover transition-shadow"
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold flex-shrink-0">
          {trainerName[0]}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-medium text-sm text-dark truncate">{enrolment.course?.title}</h3>
            <StatusBadge status={enrolment.status} />
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-xs text-body truncate">{trainerName}</span>
            {trainer?.isVerified && <VerifiedBadge isVerified size="sm" />}
          </div>
          <div className="flex items-center gap-2 mt-1">
            {enrolment.course?.mode === 'PHYSICAL' ? (
              <span className="flex items-center gap-1 text-xs text-muted-foreground"><MapPin size={12} /> Physical</span>
            ) : (
              <span className="flex items-center gap-1 text-xs text-muted-foreground"><Monitor size={12} /> Virtual</span>
            )}
          </div>
          {enrolment.status === 'ACTIVE' && (
            <div className="mt-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                <span>Progress: {released}/{total} milestones</span>
                <span>{Math.round((released / total) * 100)}%</span>
              </div>
              <ProgressBar value={released} max={total} />
            </div>
          )}
        </div>
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          {showPrice && enrolment.pricePaidKes && (
            <span className="text-sm font-semibold text-dark">{formatCurrency(enrolment.pricePaidKes)}</span>
          )}
          <ArrowRight size={16} className="text-muted-foreground mt-1" />
        </div>
      </div>
    </Link>
  );
}
