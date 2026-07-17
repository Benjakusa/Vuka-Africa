import React, { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Star, Clock, MapPin, Monitor, Globe, BookOpen, ShieldCheck, Eye } from 'lucide-react';
import { courseKeys } from '@/lib/query-keys';
import { getCourseBySlug } from '@/services/courseService';
import { formatCurrency } from '@/lib/utils';

interface CourseCardProps {
  id: string;
  title: string;
  slug: string;
  mode: string;
  duration: string;
  sessionCount: number;
  priceKes: number;
  imageUrl?: string | null;
  detailed?: boolean;
  category?: string;
  trainerName?: string;
  trainerIsVerified?: boolean;
  averageRating?: number;
  totalReviews?: number;
}

const modeIcons: Record<string, any> = {
  PHYSICAL: MapPin,
  VIRTUAL: Monitor,
  HYBRID: Globe,
};

const modeLabels: Record<string, string> = {
  PHYSICAL: 'Physical',
  VIRTUAL: 'Virtual',
  HYBRID: 'Hybrid',
};

export const CourseCard = React.memo(function CourseCard({
  title,
  slug,
  mode,
  duration,
  sessionCount,
  priceKes,
  imageUrl,
  detailed,
  category,
  trainerName,
  trainerIsVerified,
  averageRating,
  totalReviews,
}: CourseCardProps) {
  const [imgError, setImgError] = useState(false);
  const queryClient = useQueryClient();
  const ModeIcon = modeIcons[mode] || MapPin;

  const prefetch = useCallback(() => {
    queryClient.prefetchQuery({
      queryKey: courseKeys.detail(slug),
      queryFn: () => getCourseBySlug(slug),
      staleTime: 60_000,
    });
  }, [queryClient, slug]);

  if (detailed) {
    return (
      <Link
        to={`/course/${slug}`}
        onMouseEnter={prefetch}
        className="block bg-white rounded-card shadow-card card-hover overflow-hidden border border-border flex flex-col"
      >
        <div className="h-40 bg-surface flex items-center justify-center">
          {imageUrl && !imgError ? (
            <img src={imageUrl} alt={title} className="w-full h-full object-cover" onError={() => setImgError(true)} />
          ) : (
            <span className="text-4xl font-bold text-body">{title[0]}</span>
          )}
        </div>
        <div className="p-4 flex flex-col flex-1">
          <h3 className="font-semibold text-dark text-sm mb-1 line-clamp-2">{title}</h3>
          {trainerName && (
            <p className="text-xs text-body-foreground mb-2 flex items-center gap-1">
              <BookOpen size={12} />
              {trainerName}
              {trainerIsVerified && <ShieldCheck size={11} className="text-blue-500" />}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-2 text-xs text-body-foreground mb-2">
            {category && (
              <span className="px-1.5 py-0.5 bg-accent rounded text-xs">{category}</span>
            )}
            <span className="flex items-center gap-1">
              <ModeIcon size={11} /> {modeLabels[mode] || mode}
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs text-body-foreground mb-2">
            <span className="flex items-center gap-1">
              <Clock size={11} /> {duration}
            </span>
            <span>{sessionCount} sessions</span>
          </div>
          {averageRating !== undefined && (
            <div className="flex items-center gap-1 text-xs mb-2">
              <Star size={12} className="fill-[#FF4500] text-[#FF4500]" />
              <span className="font-medium text-dark">{averageRating.toFixed(1)}</span>
              <span className="text-body-foreground">({totalReviews || 0})</span>
            </div>
          )}
          <div className="mt-auto flex items-center justify-between pt-3 border-t border-border">
            <p className="text-primary font-bold text-sm">{formatCurrency(priceKes)}</p>
            <span className="px-3 py-1.5 bg-primary text-white text-xs font-medium rounded-btn inline-flex items-center gap-1">
              <Eye size={12} /> View Course
            </span>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link
      to={`/course/${slug}`}
      onMouseEnter={prefetch}
      className="block bg-white rounded-card shadow-card card-hover overflow-hidden border border-border"
    >
      <div className="h-32 bg-surface flex items-center justify-center">
        {imageUrl && !imgError ? (
          <img src={imageUrl} alt={title} className="w-full h-full object-cover" onError={() => setImgError(true)} />
        ) : (
          <span className="text-3xl font-bold text-body">{title[0]}</span>
        )}
      </div>
      <div className="p-4 md:p-5 flex flex-col items-center text-center md:items-start md:text-left">
        <h3 className="font-semibold text-dark text-sm mb-2 line-clamp-2">{title}</h3>
        <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 text-xs text-body-foreground mb-2">
          <span className="flex items-center gap-1">
            <ModeIcon size={12} /> {mode}
          </span>
          <span className="flex items-center gap-1">
            <Clock size={12} /> {duration}
          </span>
        </div>
        <p className="text-primary font-bold text-sm">{formatCurrency(priceKes)}</p>
      </div>
    </Link>
  );
});
