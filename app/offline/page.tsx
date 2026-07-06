'use client';

import { WifiOff } from 'lucide-react';

export default function OfflinePage() {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 text-center">
      <WifiOff size={64} className="text-muted-foreground mb-6" />
      <h1 className="text-xl font-semibold text-dark mb-2">You&apos;re Offline</h1>
      <p className="text-body mb-6 max-w-md">
        Please check your internet connection and try again.
      </p>
      <button
        onClick={() => window.location.reload()}
        className="px-6 py-2.5 bg-primary text-white font-medium rounded-btn hover:bg-primary/90 transition-colors"
      >
        Retry
      </button>
    </div>
  );
}
