import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export function BackButton({ href, label = 'Back' }: { href?: string; label?: string }) {
  if (href) {
    return (
      <Link href={href} className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline mb-4">
        <ArrowLeft size={16} /> {label}
      </Link>
    );
  }
  return (
    <button onClick={() => window.history.back()} className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline mb-4">
      <ArrowLeft size={16} /> {label}
    </button>
  );
}
