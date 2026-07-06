'use client';

import Link from 'next/link';
import { FileText, ArrowLeft, UserCheck, BookOpen, CreditCard, Scale, AlertTriangle, Ban, Copyright, ShieldAlert, Gavel, Mail } from 'lucide-react';

const sections = [
  {
    icon: FileText,
    title: '1. About Vuka',
    items: [
      'Vuka is a marketplace that connects skill trainers (&ldquo;Trainers&rdquo;) with individuals seeking to learn those skills (&ldquo;Trainees&rdquo;). We are not a training provider. We facilitate payments, hold funds in escrow, and provide a platform for communication and reviews.',
    ],
  },
  {
    icon: UserCheck,
    title: '2. Eligibility',
    items: [
      'You must be at least 18 years old to use the Service. By registering, you represent that you meet this requirement.',
    ],
  },
  {
    icon: BookOpen,
    title: '3. Account Registration',
    items: [
      'You must provide accurate and complete information during registration.',
      'You are responsible for maintaining the confidentiality of your login credentials.',
      'You may not share your account with others.',
    ],
  },
  {
    icon: BookOpen,
    title: '4. Trainer Obligations',
    items: [
      'Course Listings: Courses must accurately describe the skill, mode (physical/virtual), duration, and price. Misleading listings may be removed.',
      'Training Delivery: Trainers must deliver the sessions as promised and confirm milestones truthfully.',
      'Verification (Optional): Verified trainers pay a one‑time KES 5,000 fee and provide valid ID and a video introduction. Verification can be revoked for policy violations.',
      'Commission: For each course fee, Vuka retains a commission of 20% (or 12% for verified trainers, 0% for Founding Trainers in the first 100). The remainder is released to the trainer after milestone confirmations.',
      'Payouts: Trainers may withdraw their available balance to their M‑Pesa number at any time, subject to our 2‑factor authentication process.',
    ],
  },
  {
    icon: CreditCard,
    title: '5. Trainee Obligations',
    items: [
      'Payment: Trainees pay the full course fee upfront via M‑Pesa. Funds are held in escrow.',
      'Attendance: Trainees must attend scheduled sessions and promptly confirm or dispute milestone completions.',
      'Reviews: Reviews must be honest and based on genuine experiences. Fake or malicious reviews will be removed.',
    ],
  },
  {
    icon: CreditCard,
    title: '6. Fees & Payments',
    items: [
      'All payments are processed through Safaricom\'s M‑Pesa. We do not charge trainees any additional fees beyond the course price.',
      'Trainer commission is deducted automatically before funds are released.',
      'Payment disputes must be raised within 48 hours of a milestone confirmation.',
    ],
  },
  {
    icon: Scale,
    title: '7. Disputes',
    items: [
      'If a milestone is not confirmed by both parties or a complaint is lodged, our team will investigate.',
      'We may, at our sole discretion, release funds to either party, issue a refund, or split the amount based on available evidence.',
      'Our decision is final unless required otherwise by law.',
    ],
  },
  {
    icon: Ban,
    title: '8. Prohibited Conduct',
    items: [
      'Fraud, misrepresentation, or identity theft.',
      'Harassment, abuse, or discrimination of any kind.',
      'Offering or soliciting payments outside the platform (off‑platform deals).',
      'Violation of any applicable laws.',
    ],
  },
  {
    icon: Copyright,
    title: '9. Intellectual Property',
    items: [
      'All content on the platform (excluding user‑generated content) is owned by Vuka. Trainers retain rights to their course materials but grant us a license to display them on the Service.',
    ],
  },
  {
    icon: ShieldAlert,
    title: '10. Limitation of Liability',
    items: [
      'Vuka is a technology platform that connects Trainers and Trainees. We are not liable for the quality or accuracy of training provided, any injuries, losses, or damages arising from physical training sessions, or M‑Pesa network failures or delays in payment processing.',
      'In no event shall Vuka\'s total liability exceed the commission amount earned on a disputed transaction.',
    ],
  },
  {
    icon: Gavel,
    title: '11. Termination',
    items: [
      'We may suspend or terminate your account at any time for violation of these Terms. You may close your account by contacting support. Upon termination, your available balance (if any) will be paid out according to our payout process.',
    ],
  },
  {
    icon: Gavel,
    title: '12. Governing Law',
    items: [
      'These Terms are governed by the laws of the Republic of Kenya. Any disputes shall be resolved in the courts of Nairobi.',
    ],
  },
  {
    icon: FileText,
    title: '13. Changes to Terms',
    items: [
      'We may update these Terms from time to time. We will notify users of material changes. Continued use after the update constitutes acceptance.',
    ],
  },
  {
    icon: Mail,
    title: '14. Contact',
    items: [
      'For questions or legal notices, reach us at info@vuka.africa.',
    ],
  },
];

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-white mb-8 transition-colors">
            <ArrowLeft size={16} /> Back to Home
          </Link>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center">
              <FileText size={24} className="text-primary" />
            </div>
            <div>
              <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">Terms of Service</h1>
              <p className="mt-1 text-sm text-gray-400">Last updated: July 2026</p>
            </div>
          </div>
          <p className="mt-4 text-lg text-gray-300 max-w-2xl leading-relaxed">
            Welcome to Vuka. By accessing or using our website and services, you agree to be bound by these Terms of Service. Please read them carefully.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-10 pb-16">
        <div className="space-y-6">
          {sections.map((section, i) => (
            <div key={i} className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 transition-all duration-300 hover:shadow-xl">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-primary">
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
