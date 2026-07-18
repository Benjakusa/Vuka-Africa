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
  iconBg = 'bg-surface',
  iconColor = 'text-primary',
}: StatCardProps) {
  return (
    <div className="bg-white rounded-card shadow-card p-4">
      <div className="flex flex-col md:flex-row items-center justify-center md:justify-start text-center md:text-left gap-3">
        <div className={`w-10 h-10 ${iconBg} rounded-full flex items-center justify-center`}>
          <Icon size={20} className={iconColor} />
        </div>
        <div>
          <p className="text-2xl font-bold text-dark">{value}</p>
          <p className="text-xs text-body-foreground">{label}</p>
        </div>
      </div>
    </div>
  );
}
