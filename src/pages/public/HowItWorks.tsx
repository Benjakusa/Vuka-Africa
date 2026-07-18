import { Link } from 'react-router-dom';
import {
  Search,
  CreditCard,
  CalendarCheck,
  ShieldCheck,
  Star,
  UserPlus,
  BadgeCheck,
  Bell,
  HandCoins,
  Trophy,
  ArrowLeft,
} from 'lucide-react';

const traineeSteps = [
  {
    icon: Search,
    title: 'Browse Skills',
    desc: 'Search our marketplace by category, location, or mode (physical/virtual). Each trainer has a profile with ratings, courses, and prices.',
  },
  {
    icon: CalendarCheck,
    title: 'Choose a Course & Enrol',
    desc: "Select a course that fits your needs. You'll see a clear milestone breakdown: 25% released at the start, 50% mid-way, and 25% on completion.",
  },
  {
    icon: CreditCard,
    title: 'Pay Securely with M-Pesa',
    desc: 'Pay the full course fee via M-Pesa. The money is held safely in escrow — the trainer cannot access it until you confirm the training has taken place.',
  },
  {
    icon: ShieldCheck,
    title: 'Attend Sessions & Confirm',
    desc: 'After each milestone session, your trainer marks it as delivered. You then confirm attendance with one click. Both parties must agree before funds are released.',
  },
  {
    icon: HandCoins,
    title: 'Funds Released in Milestones',
    desc: 'Once you confirm a milestone, a 24-hour cooling-off period begins. After that, the funds are credited to the trainer.',
  },
  {
    icon: Star,
    title: 'Leave a Review',
    desc: 'Help the community by rating your trainer and sharing your experience.',
  },
];

const trainerSteps = [
  {
    icon: UserPlus,
    title: 'Create Your Profile',
    desc: 'Sign up, list your skills, set your prices, and publish courses.',
  },
  {
    icon: BadgeCheck,
    title: 'Get Verified (Optional)',
    desc: 'Earn the Verified Badge by uploading your ID and a short video. Verified trainers enjoy lower commission (12% instead of 20%).',
  },
  {
    icon: Bell,
    title: 'Receive Enrolments',
    desc: "When a trainee enrols and pays, you'll be notified. The payment is held safely until training milestones are confirmed.",
  },
  {
    icon: CalendarCheck,
    title: 'Deliver Training & Confirm Milestones',
    desc: 'After each completed stage, mark the milestone as delivered.',
  },
  { icon: HandCoins, title: 'Withdraw Your Earnings', desc: 'Request a payout to your M-Pesa number at any time.' },
  {
    icon: Trophy,
    title: 'Build Your Reputation',
    desc: 'Positive reviews and a verified badge help you attract more clients.',
  },
];

function StepCard({ icon: Icon, title, desc, index }: { icon: any; title: string; desc: string; index: number }) {
  return (
    <div className="group relative bg-white rounded-2xl border border-gray-200 p-6 transition-all duration-300 hover:border-primary-200 hover:-translate-y-1">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-primary flex items-center justify-center text-white group-hover:scale-110 transition-transform">
          <Icon size={22} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Step {index + 1}</span>
          </div>
          <h3 className="font-semibold text-gray-900">{title}</h3>
          <p className="mt-1 text-sm text-gray-500 leading-relaxed">{desc}</p>
        </div>
      </div>
    </div>
  );
}

import { usePageTitle } from '@/hooks/use-page-title';

export default function HowItWorks() {
  usePageTitle(
    'About Vuka Afrique | Our Mission',
    "Learn about Vuka Afrique's mission to connect African trainers and trainees through a skills-first marketplace.",
  );

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
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">How It Works</h1>
          <p className="mt-4 text-lg text-gray-300 max-w-2xl leading-relaxed">
            Vuka Afrique connects you with trusted skill trainers across Kenya. Learn in person or online — and your
            money is safely held until you&apos;re satisfied.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-10">
        <div className="bg-white rounded-2xl border border-gray-200 p-8 sm:p-10 mb-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white">
              <Search size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">For Trainees (Learners)</h2>
              <p className="text-sm text-gray-500">Learn new skills with confidence</p>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {traineeSteps.map((step, i) => (
              <StepCard key={i} {...step} index={i} />
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-8 sm:p-10 mb-16">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white">
              <UserPlus size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">For Trainers (Skill Experts)</h2>
              <p className="text-sm text-gray-500">Share your skills and earn</p>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {trainerSteps.map((step, i) => (
              <StepCard key={i} {...step} index={i} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
