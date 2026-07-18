import { usePageTitle } from '@/hooks/use-page-title';
import { Link } from 'react-router-dom';

export default function BecomeTrainer() {
  usePageTitle(
    'Become a Trainer | Vuka Afrique',
    'Share your skills and earn income. List your training services on Vuka Afrique and connect with eager trainees across Africa.',
  );

  return (
    <div className="py-16 bg-white min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h1 className="text-3xl md:text-4xl font-bold text-dark mb-6">Become a Trainer</h1>
        <p className="text-lg text-body mb-8 max-w-2xl mx-auto">
          Share your skills and earn income. List your training services on Vuka Afrique and connect with eager trainees
          across Africa.
        </p>
        <Link
          to="/auth/register"
          className="inline-block px-8 py-3 bg-primary text-white font-medium rounded-btn hover:bg-surface transition-colors"
        >
          Start Training Now
        </Link>
      </div>
    </div>
  );
}
