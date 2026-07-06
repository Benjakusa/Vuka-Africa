import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@backend/lib/prisma';
import { handleError } from '@frontend/utils/error-handler';
import { AuthenticationError, NotFoundError } from '@backend/lib/errors';

export async function GET(_req: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user: supabaseUser }, error } = await supabase.auth.getUser();

    if (error || !supabaseUser) {
      throw new AuthenticationError('Not authenticated');
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: supabaseUser.id },
      include: {
        trainer: {
          select: {
            id: true,
            isVerified: true,
            verificationStatus: true,
            commissionRate: true,
            availableBalance: true,
            bio: true,
            skills: true,
          },
        },
      },
    });

    if (!dbUser) {
      throw new NotFoundError('User');
    }

    return NextResponse.json({ data: dbUser });
  } catch (err) {
    return handleError(err);
  }
}
