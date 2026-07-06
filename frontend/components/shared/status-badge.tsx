import { cn } from '@backend/lib/utils';

const variants: Record<string, { bg: string; text: string }> = {
  ACTIVE: { bg: 'bg-primary/10', text: 'text-primary' },
  COMPLETED: { bg: 'bg-accent', text: 'text-body' },
  CANCELLED: { bg: 'bg-destructive/10', text: 'text-destructive' },
  DISPUTED: { bg: 'bg-warning/10', text: 'text-warning' },
  PENDING: { bg: 'bg-warning/10', text: 'text-warning' },
  TRAINER_CONFIRMED: { bg: 'bg-primary/10', text: 'text-primary' },
  TRAINEE_CONFIRMED: { bg: 'bg-primary/10', text: 'text-primary' },
  RELEASED: { bg: 'bg-accent', text: 'text-body' },
  REFUNDED: { bg: 'bg-destructive/10', text: 'text-destructive' },
  IN_PROGRESS: { bg: 'bg-primary/10', text: 'text-primary' },
  VERIFIED: { bg: 'bg-primary/10', text: 'text-primary' },
  PHYSICAL: { bg: 'bg-accent', text: 'text-body' },
  VIRTUAL: { bg: 'bg-primary/10', text: 'text-primary' },
};

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const v = variants[status] || { bg: 'bg-accent', text: 'text-body' };
  return (
    <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', v.bg, v.text, className)}>
      {status === 'ACTIVE' || status === 'IN_PROGRESS' ? 'Active' :
       status === 'COMPLETED' || status === 'RELEASED' ? 'Completed' :
       status === 'CANCELLED' ? 'Cancelled' :
       status === 'DISPUTED' ? 'Disputed' :
       status === 'PENDING' ? 'Pending' :
       status === 'TRAINER_CONFIRMED' ? 'Trainer Confirmed' :
       status === 'TRAINEE_CONFIRMED' ? 'Confirmed' :
       status === 'REFUNDED' ? 'Refunded' :
       status === 'VERIFIED' ? 'Verified' :
       status === 'PHYSICAL' ? 'Physical' :
       status === 'VIRTUAL' ? 'Virtual' :
       status}
    </span>
  );
}
