import { cn } from '@backend/lib/utils';

interface ProgressBarProps {
  value: number;
  max?: number;
  size?: 'sm' | 'md';
  showLabel?: boolean;
  className?: string;
}

export function ProgressBar({ value, max = 3, size = 'sm', showLabel, className }: ProgressBarProps) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className={cn('flex-1 bg-accent rounded-full', size === 'sm' ? 'h-2' : 'h-3')}>
        <div
          className={cn('bg-primary rounded-full transition-all', size === 'sm' ? 'h-2' : 'h-3')}
          style={{ width: `${pct}%` }}
        />
      </div>
      {showLabel && <span className="text-xs text-muted-foreground flex-shrink-0">{pct}%</span>}
    </div>
  );
}
