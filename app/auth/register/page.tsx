'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * /auth/register redirects to /auth/login#register so the
 * combined sliding panel opens on the Sign-Up side.
 */
export default function RegisterRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/auth/login?panel=register');
  }, [router]);
  return null;
}
