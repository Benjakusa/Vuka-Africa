import * as bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { prisma } from '@backend/lib/prisma';
import { redis } from '@backend/lib/redis';
import { env } from '@backend/lib/env';
import {
  signAccessToken,
  signRefreshToken,
  storeRefreshToken,
  validateRefreshToken,
  removeRefreshToken,
  removeAllRefreshTokens,
  verifyRefreshToken,
  incrementTokenVersion,
  getTokenVersion,
  generateCsrfToken,
  storeCsrfToken,
} from '@backend/lib/jwt';
import { AuthenticationError, ConflictError, NotFoundError, ValidationError } from '@backend/lib/errors';
import { addEmailToQueue } from '@backend/workers/email-worker';
import { clearAuthCache } from '@backend/middleware/auth';

interface RegisterInput {
  email: string;
  password: string;
  phone: string;
  fullName: string;
  role: 'TRAINEE' | 'TRAINER';
}

interface LoginInput {
  email: string;
  password: string;
}

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  csrfToken: string;
}

const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

function validatePassword(password: string): void {
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

function validatePhone(phone: string): void {
  const cleaned = phone.replace(/[^0-9]/g, '');
  const kenyanPhone = /^(?:\+?254|0)?[17]\d{8}$/;
  if (!kenyanPhone.test(cleaned)) {
    throw new ValidationError('Invalid Kenyan phone number format');
  }
}

function sanitizeString(input: string, maxLength: number = 255): string {
  return input.replace(/[<>]/g, '').trim().slice(0, maxLength);
}

async function generateTokens(userId: string, role: string): Promise<AuthTokens> {
  const tokenVersion = await incrementTokenVersion(userId);
  const payload = { userId, role };

  const accessToken = signAccessToken(payload);

  const refreshToken = signRefreshToken({ ...payload, tokenVersion });
  const decoded = crypto.createHash('sha256').update(refreshToken).digest('hex');
  await storeRefreshToken(userId, decoded);

  const csrfToken = generateCsrfToken(userId);
  await storeCsrfToken(userId, csrfToken);

  return { accessToken, refreshToken, csrfToken };
}

export async function register(input: RegisterInput) {
  validatePassword(input.password);
  validateEmail(input.email);
  validatePhone(input.phone);

  const sanitizedEmail = input.email.toLowerCase().trim();
  const sanitizedPhone = input.phone.replace(/[^0-9]/g, '');
  const sanitizedName = sanitizeString(input.fullName, 100);

  const existingEmail = await prisma.user.findUnique({ where: { email: sanitizedEmail } });
  if (existingEmail) {
    throw new ConflictError('Email already registered');
  }

  const existingPhone = await prisma.user.findUnique({ where: { phone: sanitizedPhone } });
  if (existingPhone) {
    throw new ConflictError('Phone number already registered');
  }

  const passwordHash = await bcrypt.hash(input.password, 12);

  const user = await prisma.user.create({
    data: {
      email: sanitizedEmail,
      phone: sanitizedPhone,
      fullName: sanitizedName,
      role: input.role,
      passwordHash,
      emailVerified: false,
    },
  });

  const tokens = await generateTokens(user.id, user.role);

  const verificationToken = crypto.randomBytes(32).toString('hex');
  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerificationToken: verificationToken,
      emailVerificationSentAt: new Date(),
    },
  });

  const verifyUrl = `${env.NEXT_PUBLIC_APP_URL}/verify-email?token=${verificationToken}`;

  await addEmailToQueue({
    to: user.email,
    subject: 'Welcome to Vuka — Verify Your Email',
    html: `<h1>Welcome ${sanitizedName}!</h1>
<p>Thank you for joining Vuka. Please verify your email address by clicking the link below:</p>
<p><a href="${verifyUrl}">Verify Email Address</a></p>
<p>This link expires in 24 hours.</p>
<p>If you did not create this account, ignore this email.</p>`,
  });

  return {
    user: {
      id: user.id,
      email: user.email,
      phone: user.phone,
      fullName: user.fullName,
      role: user.role,
      emailVerified: user.emailVerified,
      avatarUrl: user.avatarUrl,
    },
    ...tokens,
  };
}

export async function login(input: LoginInput) {
  const normalizedEmail = input.email.toLowerCase().trim();

  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (!user) {
    throw new AuthenticationError('Invalid email or password');
  }

  if (!user.isActive || user.suspendedAt) {
    throw new AuthenticationError('Account is suspended. Contact support.');
  }

  const valid = await bcrypt.compare(input.password, user.passwordHash);
  if (!valid) {
    throw new AuthenticationError('Invalid email or password');
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  const tokens = await generateTokens(user.id, user.role);

  await clearAuthCache(user.id);

  return {
    user: {
      id: user.id,
      email: user.email,
      phone: user.phone,
      fullName: user.fullName,
      role: user.role,
      emailVerified: user.emailVerified,
      avatarUrl: user.avatarUrl,
    },
    ...tokens,
  };
}

export async function refresh(refreshTokenRaw: string) {
  let payload;
  try {
    payload = verifyRefreshToken(refreshTokenRaw);
  } catch {
    throw new AuthenticationError('Invalid or expired refresh token');
  }

  const tokenHash = crypto.createHash('sha256').update(refreshTokenRaw).digest('hex');
  const valid = await validateRefreshToken(payload.userId, tokenHash);
  if (!valid) {
    await removeAllRefreshTokens(payload.userId);
    throw new AuthenticationError('Refresh token has been revoked. All sessions cleared.');
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { id: true, email: true, phone: true, fullName: true, role: true, emailVerified: true, avatarUrl: true, isActive: true, suspendedAt: true },
  });

  if (!user) {
    throw new NotFoundError('User');
  }

  if (!user.isActive || user.suspendedAt) {
    throw new AuthenticationError('Account is suspended');
  }

  await removeRefreshToken(payload.userId, tokenHash);

  const tokens = await generateTokens(payload.userId, payload.role);

  return { user, ...tokens };
}

export async function logout(userId: string, refreshToken?: string) {
  if (refreshToken) {
    try {
      const payload = verifyRefreshToken(refreshToken);
      const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
      await removeRefreshToken(userId, tokenHash);
    } catch {
      await removeAllRefreshTokens(userId);
    }
  } else {
    await removeAllRefreshTokens(userId);
  }

  await redis.del(`csrf:${userId}`);
  await clearAuthCache(userId);
}

export async function getCurrentUser(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
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

  if (!user) {
    throw new NotFoundError('User');
  }

  return user;
}

export async function verifyEmailWithToken(token: string) {
  const user = await prisma.user.findUnique({
    where: { emailVerificationToken: token },
  });

  if (!user) {
    throw new ValidationError('Invalid or expired verification token');
  }

  const sentAt = user.emailVerificationSentAt;
  if (sentAt && Date.now() - sentAt.getTime() > 24 * 60 * 60 * 1000) {
    throw new ValidationError('Verification token has expired. Request a new one.');
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerified: true,
      emailVerificationToken: null,
      emailVerificationSentAt: null,
    },
  });

  await clearAuthCache(user.id);

  return { message: 'Email verified successfully' };
}

export async function resendVerificationEmail(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new NotFoundError('User');
  if (user.emailVerified) throw new ValidationError('Email already verified');

  const lastSent = user.emailVerificationSentAt;
  if (lastSent && Date.now() - lastSent.getTime() < 60000) {
    throw new ValidationError('Please wait at least 1 minute before requesting a new verification email');
  }

  const verificationToken = crypto.randomBytes(32).toString('hex');

  const verifyUrl = `${env.NEXT_PUBLIC_APP_URL}/verify-email?token=${verificationToken}`;

  await prisma.user.update({
    where: { id: userId },
    data: {
      emailVerificationToken: verificationToken,
      emailVerificationSentAt: new Date(),
    },
  });

  await addEmailToQueue({
    to: user.email,
    subject: 'Verify your Vuka email address',
    html: `<p>Click the link to verify your email:</p><p><a href="${verifyUrl}">${verifyUrl}</a></p><p>Link expires in 24 hours.</p>`,
  });

  return { message: 'Verification email sent' };
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

  const resetUrl = `${env.NEXT_PUBLIC_APP_URL}/auth/reset-password?token=${resetToken}`;

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

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash },
  });

  await redis.del(`password_reset:${tokenHash}`);
  await removeAllRefreshTokens(userId);
  await clearAuthCache(userId);

  return { message: 'Password reset successfully. Please login with your new password.' };
}
