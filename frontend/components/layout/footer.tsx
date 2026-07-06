import Link from 'next/link';
import { Mail } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-dark text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <span className="text-2xl font-bold text-white">Vuka</span>
            <p className="mt-2 text-sm text-gray-400">
              Africa&apos;s trusted skill marketplace.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-3">Platform</h4>
            <div className="space-y-2 text-sm text-gray-400">
              <Link href="/trainers" className="block hover:text-white">Browse Trainers</Link>
              <Link href="/how-it-works" className="block hover:text-white">How It Works</Link>
              <Link href="/trust" className="block hover:text-white">Trust & Safety</Link>
            </div>
          </div>
          <div>
            <h4 className="font-semibold mb-3">Legal</h4>
            <div className="space-y-2 text-sm text-gray-400">
              <Link href="/privacy" className="block hover:text-white">Privacy Policy</Link>
              <Link href="/terms" className="block hover:text-white">Terms of Service</Link>
            </div>
          </div>
          <div>
            <h4 className="font-semibold mb-3">Support</h4>
            <div className="space-y-2 text-sm text-gray-400">
              <a href="mailto:hello@vuka.africa" className="flex items-center gap-2 hover:text-white">
                <Mail size={14} /> hello@vuka.africa
              </a>
            </div>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-gray-700 text-center text-sm text-gray-500">
          &copy; {new Date().getFullYear()} Vuka. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
