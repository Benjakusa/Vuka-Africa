import crypto from 'crypto';
import { prisma } from '@backend/lib/prisma';
import { redis } from '@backend/lib/redis';
import { ValidationError } from '@backend/lib/errors';
import { addEmailToQueue } from '@backend/workers/email-worker';

function validatePassword(password: string): void {
  const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;
  if (!PASSWORD_REGEX.test(password)) {
    throw new ValidationError('Password must be at least 8 characters with at least one letter and one number');
  }
}

function validateEmail(email: string): void {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new ValidationError('Invalid email format');
  }
  if (email.length > 254) {
    throw new ValidationError('Email must not exceed 254 characters');
  }
}

export async function forgotPassword(email: string) {
  validateEmail(email);

  const normalizedEmail = email.toLowerCase().trim();
  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (!user) {
    return { message: 'If an account with that email exists, a reset link has been sent.' };
  }

  const resetToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');

  await redis.set(`password_reset:${tokenHash}`, user.id, 'EX', 3600);

  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/reset-password?token=${resetToken}`;

  await addEmailToQueue({
    to: user.email,
    subject: 'Reset Your Vuka Password',
    html: `<p>You requested a password reset.</p><p><a href="${resetUrl}">Reset Password</a></p><p>This link expires in 1 hour.</p><p>If you didn't request this, ignore this email.</p>`,
  });

  return { message: 'If an account with that email exists, a reset link has been sent.' };
}

export async function resetPassword(token: string, newPassword: string) {
  validatePassword(newPassword);

  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const userId = await redis.get(`password_reset:${tokenHash}`);
  if (!userId) {
    throw new ValidationError('Invalid or expired reset token');
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const response = await fetch(`${supabaseUrl}/auth/v1/admin/users/${userId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'apikey': serviceKey!,
      'Authorization': `Bearer ${serviceKey}`,
    },
    body: JSON.stringify({ password: newPassword }),
  });

  if (!response.ok) {
    throw new ValidationError('Failed to reset password');
  }

  await redis.del(`password_reset:${tokenHash}`);

  return { message: 'Password reset successfully. Please login with your new password.' };
}
