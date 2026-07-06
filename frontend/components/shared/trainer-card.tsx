'use client';

import Link from 'next/link';
import { VerifiedBadge } from './verified-badge';
import { RatingStars } from './rating-stars';
import { formatCurrency } from '@backend/lib/utils';

interface TrainerCardProps {
  id: string;
  fullName: string;
  avatarUrl: string | null;
  skills: string[];
  isVerified: boolean;
  averageRating: number;
  totalReviews: number;
  startingPrice: number | null;
}

export function TrainerCard({ id, fullName, avatarUrl, skills, isVerified, averageRating, totalReviews, startingPrice }: TrainerCardProps) {
  return (
    <Link href={`/trainer/${id}`} className="block">
      <div className="rounded-card bg-white shadow-card hover:shadow-cardHover transition-shadow p-4 h-full flex flex-col">
        <div className="flex items-start gap-3 mb-3">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex-shrink-0 overflow-hidden">
            {avatarUrl ? (
              <img src={avatarUrl} alt={fullName} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-primary font-bold text-lg">
                {fullName[0]}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="font-semibold text-dark truncate">{fullName}</h3>
              <VerifiedBadge isVerified={isVerified} size="sm" />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5 mb-3">
          {skills.slice(0, 3).map(s => (
            <span key={s} className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full font-medium">
              {s}
            </span>
          ))}
          {skills.length > 3 && (
            <span className="px-2 py-0.5 bg-accent text-muted-foreground text-xs rounded-full">
              +{skills.length - 3}
            </span>
          )}
        </div>

        <div className="mt-auto">
          <div className="flex items-center gap-1.5 mb-1">
            <RatingStars rating={averageRating} size={14} />
            <span className="text-sm text-muted-foreground">({totalReviews})</span>
          </div>
          {startingPrice && (
            <p className="text-sm font-semibold text-dark">
              From {formatCurrency(startingPrice)}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}
