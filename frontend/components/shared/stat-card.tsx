import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@backend/lib/utils';

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  color?: string;
  trend?: { value: number; isUp: boolean };
  href?: string;
  onClick?: () => void;
  badge?: number;
}

export function StatCard({ icon: Icon, label, value, color = 'bg-primary/10 text-primary', trend, href, onClick, badge }: StatCardProps) {
  const CardTag = href ? 'a' : onClick ? 'button' : 'div';
  const props = href ? { href } : onClick ? { onClick } : {};

  return (
    <CardTag
      {...props}
      className={cn(
        'bg-white rounded-card shadow-card p-4 hover:shadow-cardHover transition-shadow relative',
        (href || onClick) && 'cursor-pointer'
      )}
    >
      {badge !== undefined && badge > 0 && (
        <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-destructive text-white text-[10px] font-bold rounded-full flex items-center justify-center">
          {badge > 99 ? '99+' : badge}
        </span>
      )}
      <div className="flex items-center gap-3">
        <div className={cn('w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0', color)}>
          <Icon size={20} />
        </div>
        <div className="min-w-0">
          <p className="text-2xl font-bold text-dark truncate">{value}</p>
          <div className="flex items-center gap-1.5">
            <p className="text-xs text-muted-foreground truncate">{label}</p>
            {trend && (
              <span className={cn('inline-flex items-center gap-0.5 text-xs font-medium', trend.isUp ? 'text-primary' : 'text-destructive')}>
                {trend.isUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                {trend.value}%
              </span>
            )}
          </div>
        </div>
      </div>
    </CardTag>
  );
}
