'use client';

import { Star, StarHalf } from 'lucide-react';
import { cn } from '@backend/lib/utils';

interface RatingStarsProps {
  rating: number;
  maxRating?: number;
  size?: number;
  interactive?: boolean;
  onChange?: (rating: number) => void;
}

export function RatingStars({ rating, maxRating = 5, size = 16, interactive, onChange }: RatingStarsProps) {
  const fullStars = Math.floor(rating);
  const hasHalf = rating - fullStars >= 0.25 && rating - fullStars < 0.75;
  const displayFull = rating - fullStars >= 0.75 ? fullStars + 1 : fullStars;

  return (
    <span className="inline-flex items-center gap-0.5">
      {Array.from({ length: maxRating }).map((_, i) => {
        const starValue = i + 1;
        const filled = starValue <= displayFull;
        const half = !filled && starValue === fullStars + 1 && hasHalf;

        if (interactive) {
          return (
            <button
              key={i}
              type="button"
              onClick={() => onChange?.(starValue)}
              className={cn('transition-colors', starValue <= rating ? 'text-primary' : 'text-gray-200')}
            >
              <Star size={size} fill={starValue <= rating ? 'currentColor' : 'none'} />
            </button>
          );
        }

        return (
          <Star
            key={i}
            size={size}
            className={cn(filled || half ? 'text-primary' : 'text-gray-200')}
          />
        );
      })}
    </span>
  );
}
