import { Link } from 'react-router-dom';
import { ShieldCheck, BadgeCheck, Star, Scale, Shield, Mail, ArrowLeft, Lock, Users } from 'lucide-react';

const sections = [
  {
    icon: ShieldCheck,
    title: 'Payment Protection via Escrow',
    items: [
      'Every payment is held in a secure M-Pesa float account until the training milestone is confirmed by both parties.',
      'Trainers are paid only for delivered and confirmed sessions.',
      'A 24-hour dispute window applies after each milestone confirmation.',
    ],
  },
  {
    icon: BadgeCheck,
    title: 'Verified Trainers',
    items: [
      'Trainers with the Verified Badge have submitted government-issued ID and a video introduction.',
      'We manually review each verification application.',
    ],
  },
  {
    icon: Star,
    title: 'Ratings & Reviews',
    items: [
      'After course completion, trainees can rate their trainer and leave a written review.',
      'Ratings help you make informed decisions.',
    ],
  },
  {
    icon: Scale,
    title: 'Dispute Resolution',
    items: [
      'If a milestone is disputed, both parties can raise the issue on the platform.',
      'Our team reviews evidence and makes a decision.',
    ],
  },
  {
    icon: Users,
    title: 'Code of Conduct',
    items: [
      'Trainers: Deliver training as described. Be professional and respectful.',
      'Trainees: Attend sessions and provide honest confirmations.',
      'Harassment or fraud results in immediate account suspension.',
    ],
  },
  {
    icon: Lock,
    title: 'Data Privacy',
    items: ['Your personal information is stored securely and never shared without consent.'],
  },
];

export default function TrustSafety() {
  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-gray-900 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-white mb-8">
            <ArrowLeft size={16} /> Back to Home
          </Link>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center">
              <Shield size={24} className="text-white" />
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">Trust & Safety</h1>
          </div>
          <p className="mt-4 text-lg text-gray-300 max-w-2xl leading-relaxed">
            Your security is our priority. Vuka Afrique is built on transparency, escrow protection, and community
            accountability.
          </p>
        </div>
      </div>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-10 pb-16">
        <div className="grid gap-6">
          {sections.map((section, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-gray-200 p-8 hover:-translate-y-0.5 transition-transform"
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-primary flex items-center justify-center text-white">
                  <section.icon size={22} />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-lg font-bold text-gray-900 mb-3">{section.title}</h2>
                  <ul className="space-y-2.5">
                    {section.items.map((item, j) => (
                      <li key={j} className="flex items-start gap-2.5 text-sm text-gray-600 leading-relaxed">
                        <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-gray-300 mt-2" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-8 bg-primary-50 rounded-2xl border border-primary-200 p-8 text-center">
          <Mail size={24} className="mx-auto text-primary mb-3" />
          <h3 className="font-semibold text-gray-900">Have a safety concern?</h3>
          <p className="mt-1 text-sm text-gray-600">
            Email us at{' '}
            <a href="mailto:safety@vukaafrique.com" className="text-primary font-medium hover:underline">
              safety@vukaafrique.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
