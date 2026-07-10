import { Link } from 'react-router-dom';
import { ShieldCheck, BadgeCheck, Star, Scale, Shield, Mail, ArrowLeft, Lock, Users } from 'lucide-react';

const sections = [
  {
    icon: ShieldCheck,
    title: 'Payment Protection via Escrow',
    color: 'text-foreground',
    bg: 'from-emerald-500/20 to-emerald-500/5',
    items: [
      'Every payment is held in a secure M-Pesa float account until the training milestone is confirmed by both parties.',
      'Trainers are paid only for delivered and confirmed sessions.',
      'A 24-hour dispute window applies after each milestone confirmation.',
    ],
  },
  {
    icon: BadgeCheck,
    title: 'Verified Trainers',
    color: 'text-foreground',
    bg: 'from-blue-500/20 to-blue-500/5',
    items: [
      'Trainers with the Verified Badge have submitted government-issued ID and a video introduction.',
      'We manually review each verification application.',
    ],
  },
  {
    icon: Star,
    title: 'Ratings & Reviews',
    color: 'text-body',
    bg: 'from-amber-500/20 to-amber-500/5',
    items: [
      'After course completion, trainees can rate their trainer and leave a written review.',
      'Ratings help you make informed decisions.',
    ],
  },
  {
    icon: Scale,
    title: 'Dispute Resolution',
    color: 'text-purple-600',
    bg: 'from-purple-500/20 to-purple-500/5',
    items: [
      'If a milestone is disputed, both parties can raise the issue on the platform.',
      'Our team reviews evidence and makes a decision.',
    ],
  },
  {
    icon: Users,
    title: 'Code of Conduct',
    color: 'text-primary',
    bg: 'from-red-500/20 to-red-500/5',
    items: [
      'Trainers: Deliver training as described. Be professional and respectful.',
      'Trainees: Attend sessions and provide honest confirmations.',
      'Harassment or fraud results in immediate account suspension.',
    ],
  },
  {
    icon: Lock,
    title: 'Data Privacy',
    color: 'text-foreground',
    bg: 'from-indigo-500/20 to-indigo-500/5',
    items: ['Your personal information is stored securely and never shared without consent.'],
  },
];

export default function TrustSafety() {
  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-white mb-8">
            <ArrowLeft size={16} /> Back to Home
          </Link>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center">
              <Shield size={24} className="text-primary" />
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">Trust & Safety</h1>
          </div>
          <p className="mt-4 text-lg text-gray-300 max-w-2xl leading-relaxed">
            Your security is our priority. Vuka is built on transparency, escrow protection, and community
            accountability.
          </p>
        </div>
      </div>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-10 pb-16">
        <div className="grid gap-6">
          {sections.map((section, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-8 hover: hover:-translate-y-0.5">
              <div className="flex items-start gap-4">
                <div
                  className={`flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br ${section.bg} flex items-center justify-center ${section.color}`}
                >
                  <section.icon size={22} />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-lg font-bold text-gray-900 mb-3">{section.title}</h2>
                  <ul className="space-y-2.5">
                    {section.items.map((item, j) => (
                      <li key={j} className="flex items-start gap-2.5 text-sm text-gray-600 leading-relaxed">
                        <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-surface mt-2" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-8 bg-gradient-to-br from-primary/5 to-primary/10 rounded-2xl border border-primary/20 p-8 text-center">
          <Mail size={24} className="mx-auto text-primary mb-3" />
          <h3 className="font-semibold text-gray-900">Have a safety concern?</h3>
          <p className="mt-1 text-sm text-gray-600">
            Email us at{' '}
            <a href="mailto:safety@vuka.africa" className="text-primary font-medium hover:underline">
              safety@vuka.africa
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
