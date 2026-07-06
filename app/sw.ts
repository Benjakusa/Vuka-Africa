import { defaultCache } from '@serwist/next/worker';
import { installSerwist } from '@serwist/sw';

declare const self: ServiceWorkerGlobalScope & { __SW_MANIFEST: any };

installSerwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: defaultCache,
  fallbacks: {
    entries: [
      {
        url: '/offline',
        matcher: ({ request }) => request.mode === 'navigate',
      },
    ],
  },
});
