import { CheckCircle, Circle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency, formatDate } from '@/lib/utils';

interface MilestoneStepperProps {
  milestones: any[];
  role: 'trainee' | 'trainer';
  onConfirm?: (milestoneId: string) => void;
  confirming?: string | null;
}

export function MilestoneStepper({ milestones, role, onConfirm, confirming }: MilestoneStepperProps) {
  const getStatus = (m: any) => {
    if (m.status === 'RELEASED') return 'completed';
    if (m.traineeConfirmedAt && m.trainerConfirmedAt) return 'releasing';
    if (m.traineeConfirmedAt || m.trainerConfirmedAt) return 'partial';
    return 'pending';
  };

  return (
    <div className="space-y-4">
      {milestones.map((m, i) => {
        const status = getStatus(m);
        const canConfirm = role === 'trainee' ? !m.traineeConfirmedAt : !m.trainerConfirmedAt;
        const otherConfirmed = role === 'trainee' ? !!m.trainerConfirmedAt : !!m.traineeConfirmedAt;

        return (
          <div key={m.id} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center',
                  status === 'completed'
                    ? 'bg-green-100 text-green-600'
                    : status === 'releasing'
                      ? 'bg-blue-100 text-blue-600'
                      : status === 'partial'
                        ? 'bg-yellow-100 text-yellow-600'
                        : 'bg-gray-100 text-gray-400',
                )}
              >
                {status === 'completed' ? (
                  <CheckCircle size={16} />
                ) : status === 'pending' ? (
                  <Circle size={16} />
                ) : (
                  <Clock size={16} />
                )}
              </div>
              {i < milestones.length - 1 && <div className="w-0.5 flex-1 bg-gray-200 my-1" />}
            </div>
            <div className="flex-1 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-dark">
                    Milestone {m.sequence}: {m.label || `Stage ${m.sequence}`}
                  </p>
                  <p className="text-xs text-muted-foreground">{formatCurrency(m.amountKes)}</p>
                </div>
                {canConfirm && status === 'partial' && otherConfirmed && (
                  <button
                    onClick={() => onConfirm?.(m.id)}
                    disabled={confirming === m.id}
                    className="px-3 py-1 bg-primary text-white text-xs font-medium rounded-btn hover:bg-primary/90 disabled:opacity-50"
                  >
                    {confirming === m.id ? 'Confirming...' : 'Confirm'}
                  </button>
                )}
              </div>
              {m.traineeConfirmedAt && (
                <p className="text-xs text-green-600 mt-1">Trainee confirmed {formatDate(m.traineeConfirmedAt)}</p>
              )}
              {m.trainerConfirmedAt && (
                <p className="text-xs text-blue-600 mt-1">Trainer confirmed {formatDate(m.trainerConfirmedAt)}</p>
              )}
              {m.releasedAt && <p className="text-xs text-green-600 mt-1">Released {formatDate(m.releasedAt)}</p>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
