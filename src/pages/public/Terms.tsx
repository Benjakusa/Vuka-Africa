import { Link } from 'react-router-dom';
import { FileText, ArrowLeft, UserCheck, BookOpen, CreditCard, Scale, Ban, Mail } from 'lucide-react';

const sections = [
  {
    icon: FileText,
    title: '1. About Vuka Afrique',
    items: [
      'Vuka Afrique is a marketplace that connects skill trainers with individuals seeking to learn. We facilitate payments, hold funds in escrow, and provide a platform for communication and reviews.',
    ],
  },
  { icon: UserCheck, title: '2. Eligibility', items: ['You must be at least 18 years old to use the Service.'] },
  {
    icon: BookOpen,
    title: '3. Account Registration',
    items: [
      'You must provide accurate information.',
      'You are responsible for your login credentials.',
      'You may not share your account.',
    ],
  },
  {
    icon: BookOpen,
    title: '4. Trainer Obligations',
    items: [
      'Courses must accurately describe the skill, mode, duration, and price.',
      'Trainers must deliver sessions as promised.',
      'Verified trainers pay a one-time KES 5,000 fee.',
      'Commission: 20% standard, 12% for verified, 0% for Founding Trainers (first 100).',
    ],
  },
  {
    icon: CreditCard,
    title: '5. Trainee Obligations',
    items: [
      'Pay the full course fee upfront via M-Pesa.',
      'Attend scheduled sessions and promptly confirm or dispute milestones.',
      'Reviews must be honest.',
    ],
  },
  {
    icon: Scale,
    title: '6. Disputes',
    items: ['Disputes must be raised within 48 hours.', 'Our team reviews evidence and makes a final decision.'],
  },
  {
    icon: Ban,
    title: '7. Prohibited Conduct',
    items: ['Fraud, harassment, or discrimination.', 'Off-platform payments.', 'Violation of applicable laws.'],
  },
  { icon: Mail, title: '8. Contact', items: ['For questions, reach us at info@vukaafrique.com.'] },
];

export default function Terms() {
  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-gray-900 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-white mb-8">
            <ArrowLeft size={16} /> Back to Home
          </Link>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center">
              <FileText size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">Terms of Service</h1>
              <p className="mt-1 text-sm text-gray-400">Last updated: July 2026</p>
            </div>
          </div>
          <p className="mt-4 text-lg text-gray-300 max-w-2xl leading-relaxed">
            Welcome to Vuka Afrique. By accessing or using our website and services, you agree to be bound by these
            Terms of Service.
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
