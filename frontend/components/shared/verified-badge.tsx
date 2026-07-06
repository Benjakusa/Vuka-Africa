'use client';

import { ShieldCheck, Shield } from 'lucide-react';
import { cn } from '@backend/lib/utils';

interface VerifiedBadgeProps {
  isVerified: boolean;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

const sizeMap = { sm: 14, md: 18, lg: 22 };

export function VerifiedBadge({ isVerified, size = 'md', showLabel }: VerifiedBadgeProps) {
  const px = sizeMap[size];

  if (!isVerified) {
    return (
      <span className="inline-flex items-center gap-1 text-muted-foreground" title="Not yet verified">
        <Shield size={px} className="text-muted" />
        {showLabel && <span className="text-xs">Unverified</span>}
      </span>
    );
  }

  return (
    <span
      className="inline-flex items-center gap-1"
      title="Verified identity & skills"
    >
      <ShieldCheck size={px} className="text-primary fill-primary/10" />
      {showLabel && <span className="text-xs text-primary font-medium">Verified</span>}
    </span>
  );
}
