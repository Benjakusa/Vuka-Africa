import { type NextRequest, NextResponse } from 'next/server';
import { createClient } from './app/lib/supabase/middleware';

const publicPaths = ['/auth/login', '/auth/register', '/auth/forgot-password', '/auth/reset-password'];

export async function middleware(request: NextRequest) {
  const { supabase, supabaseResponse } = createClient(request);
  const { pathname } = request.nextUrl;

  const { data: { session } } = await supabase.auth.getSession();

  if (pathname.startsWith('/dashboard/')) {
    if (!session) {
      const loginUrl = new URL('/auth/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  if (publicPaths.includes(pathname) && session) {
    return NextResponse.redirect(new URL('/dashboard/trainee', request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: ['/dashboard/:path*', '/auth/login', '/auth/register', '/auth/forgot-password', '/auth/reset-password'],
};
