import { type NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/middleware';

const publicPaths = ['/auth/login', '/auth/register', '/auth/forgot-password', '/auth/reset-password'];

export async function middleware(request: NextRequest) {
  const { supabase, supabaseResponse } = createClient(request);
  const { pathname } = request.nextUrl;

  const { data: { session }, error: sessionError } = await supabase.auth.getSession();

  const dashboardPaths = ['/trainee', '/trainer', '/admin'];
  if (dashboardPaths.some(p => pathname === p || pathname.startsWith(p + '/'))) {
    if (!session || sessionError) {
      const loginUrl = new URL('/auth/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  if (publicPaths.includes(pathname) && session) {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    let role = 'TRAINEE';
    if (authUser?.user_metadata?.role) {
      role = authUser.user_metadata.role as string;
    }
    const dashboard = role === 'TRAINER' ? '/trainer' : role === 'ADMIN' ? '/admin' : '/trainee';
    return NextResponse.redirect(new URL(dashboard, request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: ['/trainee/:path*', '/trainer/:path*', '/admin/:path*', '/auth/login', '/auth/register', '/auth/forgot-password', '/auth/reset-password'],
};
