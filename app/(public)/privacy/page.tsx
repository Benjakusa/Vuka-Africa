'use client';

import Link from 'next/link';
import { Shield, ArrowLeft, Database, Share2, Lock, Clock, FileText, Mail, Eye } from 'lucide-react';

const sections = [
  {
    icon: Database,
    title: '1. Information We Collect',
    items: [
      'Account Information: Full name, email address, phone number, and password (stored securely via Supabase Auth).',
      'Trainer Profile: Bio, skills, photos, ID documents, and verification videos (if you choose to become verified).',
      'Payment Data: M‑Pesa transaction IDs and receipts. We do not store your M‑Pesa PIN or passwords.',
      'Usage Data: Pages visited, courses viewed, enrolment history, and device information (browser type, IP address).',
      'Communications: Emails and support messages you send us.',
    ],
  },
  {
    icon: Share2,
    title: '2. How We Use Your Information',
    items: [
      'To create and manage your account.',
      'To process payments and trainer payouts through M‑Pesa.',
      'To display trainer profiles and reviews to other users.',
      'To communicate with you about your enrolments, milestones, and platform updates.',
      'To improve our Service and prevent fraud.',
      'To comply with legal obligations.',
    ],
  },
  {
    icon: Eye,
    title: '3. How We Share Your Information',
    items: [
      'With Other Users: Your public profile (name, skills, ratings) is visible to trainees and trainers as needed for the marketplace.',
      'Service Providers: We use Supabase for authentication and Cloudflare R2 for file storage. These providers only process your data on our instructions.',
      'M‑Pesa/Safaricom: Transaction data is shared to facilitate payments. We do not share personal data with Safaricom beyond what\'s required for the transaction.',
      'Legal Requirements: We may disclose information if required by law or to protect our rights.',
    ],
  },
  {
    icon: Lock,
    title: '4. Data Security',
    items: [
      'We implement industry‑standard security measures (encryption in transit and at rest, strict access controls) to protect your data. However, no method of transmission over the Internet is 100% secure.',
    ],
  },
  {
    icon: Clock,
    title: '5. Data Retention',
    items: [
      'We retain your personal data for as long as your account is active. You may request deletion of your account and associated data by contacting us. Financial records are kept for at least 7 years as required by Kenyan law.',
    ],
  },
  {
    icon: FileText,
    title: '6. Your Rights',
    items: [
      'Access & Correction: You can update your profile information at any time.',
      'Deletion: You may request deletion of your account and personal data.',
      'Objection: You may object to the processing of your data for marketing purposes.',
      'Data Portability: Upon request, we will provide your data in a machine‑readable format.',
    ],
  },
  {
    icon: FileText,
    title: '7. Changes to This Policy',
    items: [
      'We may update this Privacy Policy from time to time. We will notify you of significant changes via email or a notice on the platform.',
    ],
  },
  {
    icon: Mail,
    title: '8. Contact Us',
    items: [
      'For privacy‑related inquiries, contact our Data Protection Officer at privacy@vuka.africa.',
    ],
  },
];

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-white mb-8 transition-colors">
            <ArrowLeft size={16} /> Back to Home
          </Link>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center">
              <Shield size={24} className="text-primary" />
            </div>
            <div>
              <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">Privacy Policy</h1>
              <p className="mt-1 text-sm text-gray-400">Last updated: July 2026</p>
            </div>
          </div>
          <p className="mt-4 text-lg text-gray-300 max-w-2xl leading-relaxed">
            Vuka (&ldquo;we,&rdquo; &ldquo;our,&rdquo; or &ldquo;us&rdquo;) is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-10 pb-16">
        <div className="space-y-6">
          {sections.map((section, i) => (
            <div key={i} className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 transition-all duration-300 hover:shadow-xl">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center text-primary">
                  <section.icon size={20} />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-lg font-bold text-gray-900 mb-3">{section.title}</h2>
                  <ul className="space-y-2">
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
      </div>
    </div>
  );
}
