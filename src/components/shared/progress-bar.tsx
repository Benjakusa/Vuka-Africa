interface ProgressBarProps {
  value: number;
  max: number;
  label?: string;
}

export function ProgressBar({ value, max, label }: ProgressBarProps) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
        <div className="h-2 bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
      </div>
      {label && <span className="text-xs text-body-foreground">{label}</span>}
    </div>
  );
}
