import { ShieldCheck } from 'lucide-react';

interface VerifiedBadgeProps {
  isVerified: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function VerifiedBadge({ isVerified, size = 'sm' }: VerifiedBadgeProps) {
  if (!isVerified) return null;

  const sizeMap = { sm: 14, md: 18, lg: 22 };
  const s = sizeMap[size];

  return (
    <span className="inline-flex items-center gap-1 text-foreground" title="Verified Trainer">
      <ShieldCheck size={s} className="fill-blue-500 text-white" />
    </span>
  );
}
