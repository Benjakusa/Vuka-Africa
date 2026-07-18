import { cn } from '@/lib/utils';

interface MilestoneProgressProps {
  completed: number;
  total: number;
  size?: 'sm' | 'md';
}

export function MilestoneProgress({ completed, total, size = 'md' }: MilestoneProgressProps) {
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="space-y-1">
      <div className={cn('flex items-center justify-between', size === 'sm' ? 'text-xs' : 'text-sm')}>
        <span className="text-body">
          {completed} of {total} sessions
        </span>
        <span className="font-medium text-dark">{percent}%</span>
      </div>
      <div className={cn('w-full bg-gray-200 rounded-full', size === 'sm' ? 'h-1.5' : 'h-2')}>
        <div className="bg-primary rounded-full transition-all duration-500" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
