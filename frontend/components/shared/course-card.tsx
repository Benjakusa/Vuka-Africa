'use client';

import Link from 'next/link';
import { MapPin, Monitor, Globe } from 'lucide-react';
import { RatingStars } from './rating-stars';
import { formatCurrency } from '@backend/lib/utils';

interface CourseCardProps {
  id: string;
  title: string;
  slug: string;
  mode: 'PHYSICAL' | 'VIRTUAL' | 'HYBRID';
  duration: string;
  sessionCount: number;
  priceKes: number;
  imageUrl: string | null;
  averageRating?: number;
  totalReviews?: number;
}

const modeConfig = {
  PHYSICAL: { icon: MapPin, label: 'Physical', className: 'bg-blue-100 text-blue-700' },
  VIRTUAL: { icon: Monitor, label: 'Virtual', className: 'bg-purple-100 text-purple-700' },
  HYBRID: { icon: Globe, label: 'Hybrid', className: 'bg-green-100 text-green-700' },
};

export function CourseCard({ id, title, slug, mode, duration, sessionCount, priceKes, imageUrl, averageRating, totalReviews }: CourseCardProps) {
  const cfg = modeConfig[mode];
  const ModeIcon = cfg.icon;

  return (
    <Link href={`/course/${slug}`} className="block">
      <div className="rounded-card bg-white shadow-card hover:shadow-cardHover transition-shadow overflow-hidden h-full flex flex-col">
        <div className="h-36 bg-gradient-to-br from-primary/5 to-primary/20 relative">
          {imageUrl && <img src={imageUrl} alt={title} className="w-full h-full object-cover" />}
          <span className={`absolute top-2 right-2 px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1 ${cfg.className}`}>
            <ModeIcon size={12} /> {cfg.label}
          </span>
        </div>
        <div className="p-4 flex-1 flex flex-col">
          <h3 className="font-semibold text-dark mb-1 line-clamp-2">{title}</h3>
          <p className="text-xs text-muted-foreground mb-2">{duration}, {sessionCount} sessions</p>
          {averageRating !== undefined && (
            <div className="flex items-center gap-1.5 mb-2">
              <RatingStars rating={averageRating} size={14} />
              {totalReviews !== undefined && (
                <span className="text-xs text-muted-foreground">({totalReviews})</span>
              )}
            </div>
          )}
          <p className="text-lg font-bold text-primary mt-auto">{formatCurrency(priceKes)}</p>
        </div>
      </div>
    </Link>
  );
}
