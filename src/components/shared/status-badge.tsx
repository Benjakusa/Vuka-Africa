import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: string;
  className?: string;
}

const statusStyles: Record<string, string> = {
  ACTIVE: 'bg-surface text-foreground',
  COMPLETED: 'bg-surface text-foreground',
  CANCELLED: 'bg-gray-100 text-gray-500',
  PENDING: 'bg-surface text-body',
  PENDING_ACCEPTANCE: 'bg-surface text-body',
  APPROVED: 'bg-surface text-foreground',
  REJECTED: 'bg-surface text-primary',
  OPEN: 'bg-surface text-body',
  RESOLVED: 'bg-surface text-foreground',
  PAID: 'bg-surface text-foreground',
  FAILED: 'bg-surface text-primary',
  IN_REVIEW: 'bg-surface text-foreground',
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const style = statusStyles[status] || 'bg-gray-100 text-gray-600';
  return <span className={cn(`px-2.5 py-0.5 rounded-full text-xs font-medium ${style}`, className)}>{status}</span>;
}
