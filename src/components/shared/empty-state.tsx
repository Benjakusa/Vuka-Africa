import { Link } from 'react-router-dom';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  action?: { label: string; href?: string; onClick?: () => void };
}

export function EmptyState({ icon: Icon, title, subtitle, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <Icon size={48} className="text-body-foreground mb-4" strokeWidth={1} />
      <h3 className="text-lg font-semibold text-dark mb-1">{title}</h3>
      {subtitle && <p className="text-sm text-body-foreground mb-4 max-w-sm">{subtitle}</p>}
      {action &&
        (action.href ? (
          <Link
            to={action.href}
            className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-btn hover:bg-surface transition-colors"
          >
            {action.label}
          </Link>
        ) : (
          <button
            onClick={action.onClick}
            className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-btn hover:bg-surface transition-colors"
          >
            {action.label}
          </button>
        ))}
    </div>
  );
}
