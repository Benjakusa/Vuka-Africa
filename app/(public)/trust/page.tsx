'use client';

import Link from 'next/link';
import { ShieldCheck, BadgeCheck, Star, Scale, Shield, Mail, ArrowLeft, Lock, Users, FileText } from 'lucide-react';

const sections = [
  {
    icon: ShieldCheck,
    title: 'Payment Protection via Escrow',
    color: 'text-emerald-600',
    bg: 'from-emerald-500/20 to-emerald-500/5',
    items: [
      'Every payment is held in a secure M‑Pesa float account until the training milestone is confirmed by both trainer and trainee.',
      'Trainers are paid only for delivered and confirmed sessions — never before.',
      'A 24‑hour dispute window applies after each milestone confirmation. If something goes wrong, our team can investigate before funds are released.',
    ],
  },
  {
    icon: BadgeCheck,
    title: 'Verified Trainers',
    color: 'text-blue-600',
    bg: 'from-blue-500/20 to-blue-500/5',
    items: [
      'Trainers with the Verified Badge have submitted government‑issued ID and a video introduction.',
      'We manually review each verification application to ensure authenticity.',
      'While verification is optional, it\'s your signal of a trainer\'s commitment and identity.',
    ],
  },
  {
    icon: Star,
    title: 'Ratings & Reviews',
    color: 'text-amber-600',
    bg: 'from-amber-500/20 to-amber-500/5',
    items: [
      'After course completion, trainees can rate their trainer (1–5 stars) and leave a written review.',
      'Ratings are visible on trainer profiles, helping you make informed decisions.',
      'Consistent poor performance may lead to suspension or removal from the platform.',
    ],
  },
  {
    icon: Scale,
    title: 'Dispute Resolution',
    color: 'text-purple-600',
    bg: 'from-purple-500/20 to-purple-500/5',
    items: [
      'If a milestone is disputed, both parties can raise the issue directly on the platform.',
      'Our team reviews session logs, communication, and any evidence provided.',
      'We may release funds to the trainer, refund the trainee, or arrange a split based on our findings.',
    ],
  },
  {
    icon: Users,
    title: 'Code of Conduct',
    color: 'text-red-600',
    bg: 'from-red-500/20 to-red-500/5',
    items: [
      'For Trainers: Deliver the training as described in your course listing. Be professional, punctual, and respectful.',
      'For Trainees: Attend scheduled sessions, provide honest confirmations, and communicate clearly.',
      'Harassment, fraud, or misuse of the platform will result in immediate account suspension.',
    ],
  },
  {
    icon: Lock,
    title: 'Data Privacy',
    color: 'text-indigo-600',
    bg: 'from-indigo-500/20 to-indigo-500/5',
    items: [
      'Your personal information is stored securely and never shared without consent.',
      'M‑Pesa transactions are processed by Safaricom; we never store your M‑Pesa PIN or B2C passwords.',
    ],
  },
];

export default function TrustSafetyPage() {
  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-white mb-8 transition-colors">
            <ArrowLeft size={16} /> Back to Home
          </Link>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center">
              <Shield size={24} className="text-primary" />
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">Trust & Safety</h1>
          </div>
          <p className="mt-4 text-lg text-gray-300 max-w-2xl leading-relaxed">
            Your security is our priority. Vuka is built on transparency, escrow protection, and community accountability.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-10 pb-16">
        <div className="grid gap-6">
          {sections.map((section, i) => (
            <div key={i} className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5">
              <div className="flex items-start gap-4">
                <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center ${section.color}`}>
                  <section.icon size={22} />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-lg font-bold text-gray-900 mb-3">{section.title}</h2>
                  <ul className="space-y-2.5">
                    {section.items.map((item, j) => (
                      <li key={j} className="flex items-start gap-2.5 text-sm text-gray-600 leading-relaxed">
                        <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-primary/40 mt-2" />
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
            Email us at <a href="mailto:safety@vuka.africa" className="text-primary font-medium hover:underline">safety@vuka.africa</a>
          </p>
        </div>
      </div>
    </div>
  );
}
