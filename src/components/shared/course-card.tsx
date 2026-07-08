import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Clock, MapPin, Monitor, Globe } from 'lucide-react';
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

export function CourseCard({ id, title, slug, mode, duration, sessionCount, priceKes, imageUrl }: CourseCardProps) {
  const [imgError, setImgError] = useState(false);
  const ModeIcon = modeIcons[mode] || MapPin;

  const colors = [
    'from-blue-500/20 to-blue-600/10',
    'from-green-500/20 to-green-600/10',
    'from-purple-500/20 to-purple-600/10',
    'from-orange-500/20 to-orange-600/10',
    'from-pink-500/20 to-pink-600/10',
    'from-teal-500/20 to-teal-600/10',
  ];
  const colorIndex = id ? id.charCodeAt(0) % colors.length : 0;

  return (
    <Link
      to={`/course/${slug}`}
      className="block bg-white rounded-card shadow-card hover:shadow-cardHover transition-shadow overflow-hidden"
    >
      <div className={`h-32 bg-gradient-to-br ${colors[colorIndex]} flex items-center justify-center`}>
        {imageUrl && !imgError ? (
          <img src={imageUrl} alt={title} className="w-full h-full object-cover" onError={() => setImgError(true)} />
        ) : (
          <span className="text-3xl font-bold text-primary/30">{title[0]}</span>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-dark text-sm mb-2 line-clamp-2">{title}</h3>
        <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
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
}
