import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@backend/lib/prisma';
import { authenticate } from '@backend/middleware/auth';
import { handleError } from '@frontend/utils/error-handler';
import { success } from '@backend/lib/api-response';
import { ValidationError, NotFoundError } from '@backend/lib/errors';

const updateSchema = z.object({
  fullName: z.string().min(2).max(100).optional(),
  avatarUrl: z.string().url().optional(),
  phone: z.string().regex(/^\+254\d{9}$/).optional(),
});

export async function GET(req: NextRequest) {
  try {
    const user = await authenticate(req);
    const profile = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        trainer: {
          select: {
            id: true,
            bio: true,
            skills: true,
            isVerified: true,
            verificationStatus: true,
            commissionRate: true,
            availableBalance: true,
            averageRating: true,
            totalReviews: true,
            totalStudents: true,
          },
        },
      },
    });
    if (!profile) throw new NotFoundError('User');
    return success(profile);
  } catch (err) {
    return handleError(err);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const auth = await authenticate(req);

    let body;
    try {
      body = await req.json();
    } catch {
      throw new ValidationError('Invalid JSON body');
    }

    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError(parsed.error.issues.map(i => ({
        path: i.path.join('.'),
        message: i.message,
      })));
    }

    const updated = await prisma.user.update({
      where: { id: auth.id },
      data: parsed.data,
    });

    return success(updated);
  } catch (err) {
    return handleError(err);
  }
}
