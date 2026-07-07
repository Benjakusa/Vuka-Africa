import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  iconBg?: string;
  iconColor?: string;
}

export function StatCard({
  icon: Icon,
  label,
  value,
  iconBg = 'bg-primary/10',
  iconColor = 'text-primary',
}: StatCardProps) {
  return (
    <div className="bg-white rounded-card shadow-card p-4">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 ${iconBg} rounded-full flex items-center justify-center`}>
          <Icon size={20} className={iconColor} />
        </div>
        <div>
          <p className="text-2xl font-bold text-dark">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </div>
    </div>
  );
}
