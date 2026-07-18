import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

interface BackButtonProps {
  href?: string;
  label?: string;
  fallbackHref?: string;
}

export function BackButton({ href, label = 'Back', fallbackHref = '/trainers' }: BackButtonProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (href) {
      navigate(href);
    } else if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate(fallbackHref);
    }
  };

  return (
    <button
      onClick={handleClick}
      className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors mb-4"
      aria-label={`Go back to ${label.toLowerCase()}`}
    >
      <ArrowLeft size={16} aria-hidden="true" />
      {label}
    </button>
  );
}
