import React, { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Clock, MapPin, Monitor, Globe } from 'lucide-react';
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
}

const modeIcons: Record<string, any> = {
  PHYSICAL: MapPin,
  VIRTUAL: Monitor,
  HYBRID: Globe,
};

export const CourseCard = React.memo(function CourseCard({
  id,
  title,
  slug,
  mode,
  duration,
  priceKes,
  imageUrl,
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

  // Colors array removed to comply with strict design rules

  return (
    <Link
      to={`/course/${slug}`}
      onMouseEnter={prefetch}
      className="block bg-white rounded-card shadow-card card-hover overflow-hidden border border-border"
    >
      <div className={`h-32 bg-surface flex items-center justify-center`}>
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
