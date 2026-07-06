import { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createAdminClient } from '@/lib/supabase/admin';
import { AuthenticationError, ForbiddenError } from '@backend/lib/errors';

export interface AuthUser {
  id: string;
  role: 'TRAINEE' | 'TRAINER' | 'ADMIN';
  isActive: boolean;
}

function getSupabaseClient(request: NextRequest) {
  const cookieHeader = request.headers.get('cookie') || '';
  const cookies: Record<string, string> = {};
  cookieHeader.split(';').forEach(c => {
    const [name, ...rest] = c.trim().split('=');
    if (name) cookies[name] = rest.join('=');
  });

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return Object.entries(cookies).map(([name, value]) => ({ name, value }));
        },
        setAll() {},
      },
    }
  );
}

export async function authenticate(req: NextRequest): Promise<AuthUser> {
  const supabase = getSupabaseClient(req);
  const { data: { user: supabaseUser }, error } = await supabase.auth.getUser();

  if (error || !supabaseUser) {
    throw new AuthenticationError('Not authenticated');
  }

  const admin = createAdminClient();
  const { data: dbUser, error: dbError } = await admin
    .from('User')
    .select('id, role, isActive, suspendedAt, suspensionReason')
    .eq('id', supabaseUser.id)
    .single();

  if (dbError || !dbUser) {
    throw new AuthenticationError('User not found');
  }

  if (!dbUser.isActive || dbUser.suspendedAt) {
    throw new AuthenticationError('Account is suspended');
  }

  return { id: dbUser.id, role: dbUser.role, isActive: dbUser.isActive };
}

export function requireRole(...roles: string[]) {
  return (user: AuthUser): void => {
    if (!roles.includes(user.role)) {
      throw new ForbiddenError('Insufficient permissions for this action');
    }
  };
}

export async function optionalAuth(req: NextRequest): Promise<AuthUser | null> {
  try { return await authenticate(req); } catch { return null; }
}

export function getUserId(user: AuthUser): string {
  return user.id;
}
