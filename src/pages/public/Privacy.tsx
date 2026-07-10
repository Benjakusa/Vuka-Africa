import { Link } from 'react-router-dom';
import { Shield, ArrowLeft, Database, Share2, Lock, Clock, FileText, Mail, Eye } from 'lucide-react';

const sections = [
  {
    icon: Database,
    title: '1. Information We Collect',
    items: [
      'Account Information: Full name, email, phone number, and password (stored securely via Supabase Auth).',
      'Trainer Profile: Bio, skills, photos, ID documents, and verification videos.',
      'Payment Data: M-Pesa transaction IDs and receipts. We do not store your M-Pesa PIN or passwords.',
      'Usage Data: Pages visited, courses viewed, enrolment history, and device information.',
      'Communications: Emails and support messages you send us.',
    ],
  },
  {
    icon: Share2,
    title: '2. How We Use Your Information',
    items: [
      'To create and manage your account.',
      'To process payments and trainer payouts through M-Pesa.',
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
      'With Other Users: Your public profile is visible as needed for the marketplace.',
      'Service Providers: We use Supabase and Cloudflare R2. These providers only process data on our instructions.',
      'M-Pesa/Safaricom: Transaction data is shared to facilitate payments.',
      'Legal Requirements: We may disclose information if required by law.',
    ],
  },
  {
    icon: Lock,
    title: '4. Data Security',
    items: [
      'We implement industry-standard security measures (encryption in transit and at rest, strict access controls).',
    ],
  },
  {
    icon: Clock,
    title: '5. Data Retention',
    items: [
      'We retain your data for as long as your account is active. Financial records are kept for at least 7 years as required by Kenyan law.',
    ],
  },
  {
    icon: FileText,
    title: '6. Your Rights',
    items: [
      'Access & Correction: You can update your profile information at any time.',
      'Deletion: You may request deletion of your account and personal data.',
      'Objection: You may object to processing for marketing purposes.',
      'Data Portability: Upon request, we will provide your data in a machine-readable format.',
    ],
  },
  {
    icon: FileText,
    title: '7. Changes to This Policy',
    items: ['We may update this Privacy Policy from time to time. We will notify you of significant changes.'],
  },
  {
    icon: Mail,
    title: '8. Contact Us',
    items: ['For privacy-related inquiries, contact our Data Protection Officer at privacy@vuka.africa.'],
  },
];

export default function Privacy() {
  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-gray-900 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-white mb-8 transition-colors"
          >
            <ArrowLeft size={16} /> Back to Home
          </Link>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center">
              <Shield size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">Privacy Policy</h1>
              <p className="mt-1 text-sm text-gray-400">Last updated: July 2026</p>
            </div>
          </div>
          <p className="mt-4 text-lg text-gray-300 max-w-2xl leading-relaxed">
            Vuka is committed to protecting your privacy.
          </p>
        </div>
      </div>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-10 pb-16">
        <div className="space-y-6">
          {sections.map((section, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-200 p-8">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white">
                  <section.icon size={20} />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-lg font-bold text-gray-900 mb-3">{section.title}</h2>
                  <ul className="space-y-2">
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
      </div>
    </div>
  );
}
