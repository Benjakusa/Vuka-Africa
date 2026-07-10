import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 text-center">
      <h1 className="text-6xl font-bold text-primary mb-4">404</h1>
      <h2 className="text-xl font-semibold text-dark mb-2">Page Not Found</h2>
      <p className="text-body mb-6 max-w-md">The page you&apos;re looking for doesn&apos;t exist or has been moved.</p>
      <Link
        to="/"
        className="px-6 py-2.5 bg-primary text-white font-medium rounded-btn hover:bg-surface transition-colors"
      >
        Go Home
      </Link>
    </div>
  );
}
