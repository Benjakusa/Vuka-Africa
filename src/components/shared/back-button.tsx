import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

interface BackButtonProps {
  href?: string;
  label?: string;
}

export function BackButton({ href, label = 'Back' }: BackButtonProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (href) navigate(href);
    else navigate(-1);
  };

  return (
    <button
      onClick={handleClick}
      className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline mb-4"
    >
      <ArrowLeft size={16} /> {label}
    </button>
  );
}
