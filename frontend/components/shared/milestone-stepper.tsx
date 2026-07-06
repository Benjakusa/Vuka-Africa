'use client';

import { Check, Clock, AlertTriangle, Circle } from 'lucide-react';
import { cn } from '@backend/lib/utils';
import { formatCurrency } from '@backend/lib/utils';

interface MilestoneData {
  id: string;
  sequence: number;
  label: string;
  percentage: number;
  amountKes: number;
  status: 'PENDING' | 'TRAINER_CONFIRMED' | 'TRAINEE_CONFIRMED' | 'RELEASED' | 'DISPUTED';
  trainerConfirmedAt?: string;
  traineeConfirmedAt?: string;
}

interface MilestoneStepperProps {
  milestones: MilestoneData[];
  enrolmentStatus: string;
  role: 'TRAINEE' | 'TRAINER';
  onTraineeConfirm?: (milestoneId: string) => void;
  onTrainerConfirm?: (milestoneId: string) => void;
  isPending?: boolean;
}

const statusConfig = {
  PENDING: {
    circle: 'border-2 border-gray-300 bg-white text-gray-400',
    line: 'bg-gray-200',
    text: 'text-muted-foreground',
    icon: Circle,
  },
  TRAINER_CONFIRMED: {
    circle: 'border-2 border-primary bg-white text-primary',
    line: 'bg-primary/30',
    text: 'text-primary',
    icon: Circle,
  },
  TRAINEE_CONFIRMED: {
    circle: 'bg-primary text-white',
    line: 'bg-primary',
    text: 'text-primary font-medium',
    icon: Clock,
  },
  RELEASED: {
    circle: 'bg-primary text-white',
    line: 'bg-primary',
    text: 'text-primary font-medium',
    icon: Check,
  },
  DISPUTED: {
    circle: 'bg-red-500 text-white',
    line: 'bg-red-200',
    text: 'text-red-600 font-medium',
    icon: AlertTriangle,
  },
};

export function MilestoneStepper({ milestones, enrolmentStatus, role, onTraineeConfirm, onTrainerConfirm, isPending }: MilestoneStepperProps) {
  return (
    <div className="space-y-0">
      {milestones.map((milestone, idx) => {
        const cfg = statusConfig[milestone.status];
        const Icon = cfg.icon;
        const isLast = idx === milestones.length - 1;

        const showTraineeAction = role === 'TRAINEE' && milestone.status === 'TRAINER_CONFIRMED' && onTraineeConfirm;
        const showTrainerAction = role === 'TRAINER' && milestone.status === 'PENDING' && onTrainerConfirm;
        const showCountdown = milestone.status === 'TRAINEE_CONFIRMED' && milestone.traineeConfirmedAt;

        return (
          <div key={milestone.id} className="flex gap-4">
            <div className="flex flex-col items-center">
              <div className={cn('w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0', cfg.circle)}>
                {milestone.status === 'RELEASED' ? <Check size={14} /> :
                 milestone.status === 'TRAINEE_CONFIRMED' ? <Clock size={14} /> :
                 milestone.status === 'DISPUTED' ? <AlertTriangle size={14} /> :
                 <span>{milestone.sequence}</span>}
              </div>
              {!isLast && <div className={cn('w-0.5 h-12', cfg.line)} />}
            </div>
            <div className={cn('pb-8 flex-1', isLast && 'pb-0')}>
              <div className="flex items-center justify-between mb-1">
                <h4 className="font-medium text-sm text-dark">
                  {milestone.label} — {milestone.percentage}%
                </h4>
                <span className="text-sm font-semibold text-dark">{formatCurrency(milestone.amountKes)}</span>
              </div>

              {milestone.status === 'PENDING' && (
                <p className="text-xs text-muted-foreground">Waiting for trainer confirmation</p>
              )}
              {milestone.status === 'TRAINER_CONFIRMED' && (
                <p className="text-xs text-muted-foreground">
                  {role === 'TRAINEE' ? 'Trainer confirmed. Confirm your attendance.' : 'Awaiting trainee confirmation'}
                </p>
              )}
              {milestone.status === 'TRAINEE_CONFIRMED' && showCountdown && (
                <div className="flex items-center gap-1 text-xs text-primary">
                  <Clock size={12} />
                  Release pending (24h cool-off)
                </div>
              )}
              {milestone.status === 'RELEASED' && (
                <p className="text-xs text-primary font-medium">Funds released ✓</p>
              )}
              {milestone.status === 'DISPUTED' && (
                <p className="text-xs text-red-600 font-medium">Under dispute</p>
              )}

              {showTraineeAction && (
                <button
                  onClick={() => onTraineeConfirm(milestone.id)}
                  disabled={isPending}
                  className="mt-2 px-4 py-1.5 bg-primary text-white text-xs font-medium rounded-btn hover:bg-primary/90 disabled:opacity-50 transition-colors"
                >
                  {isPending ? 'Confirming...' : 'I Attended This Session'}
                </button>
              )}

              {showTrainerAction && (
                <button
                  onClick={() => onTrainerConfirm(milestone.id)}
                  disabled={isPending}
                  className="mt-2 px-4 py-1.5 bg-primary text-white text-xs font-medium rounded-btn hover:bg-primary/90 disabled:opacity-50 transition-colors"
                >
                  {isPending ? 'Confirming...' : 'Mark as Delivered'}
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
