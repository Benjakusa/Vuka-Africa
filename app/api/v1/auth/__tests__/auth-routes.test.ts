import { vi, describe, it, expect, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const mockSignAccessToken = vi.fn().mockReturnValue('access-token');
const mockSignRefreshToken = vi.fn().mockReturnValue('refresh-token');
const mockIncrementTokenVersion = vi.fn().mockResolvedValue(1);

vi.mock('@backend/lib/jwt', () => ({
  signAccessToken: mockSignAccessToken,
  signRefreshToken: mockSignRefreshToken,
  incrementTokenVersion: mockIncrementTokenVersion,
}));

const mockPrisma = {
  user: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn() },
  $transaction: vi.fn(),
};

vi.mock('@backend/lib/prisma', () => ({ prisma: mockPrisma }));

vi.mock('@backend/workers/email-worker', () => ({
  addEmailToQueue: vi.fn(),
}));

vi.mock('bcryptjs', () => ({
  hash: vi.fn().mockResolvedValue('$2a$10$hashed'),
  compare: vi.fn().mockResolvedValue(true),
}));

vi.mock('@backend/lib/redis', () => ({
  redis: { get: vi.fn(), setex: vi.fn(), set: vi.fn(), del: vi.fn(), incr: vi.fn() },
}));

vi.mock('@backend/middleware/rate-limit', () => ({
  rateLimit: vi.fn().mockResolvedValue(null),
}));

vi.mock('@backend/lib/env', () => ({
  env: {
    JWT_ACCESS_SECRET: 'test-secret-32-chars-long!!!!!!!!!!!!!',
    JWT_REFRESH_SECRET: 'test-refresh-secret-32-chars-long!!!!',
    ENCRYPTION_KEY: 'test-encryption-key-32-bytes-long!!',
    NODE_ENV: 'test',
  },
}));

describe('POST /api/auth/register', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 400 for invalid input', async () => {
    const { POST } = await import('@/app/api/auth/register/route');

    const req = new NextRequest('http://localhost:3000/api/auth/register', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'invalid', password: 'short' }),
    });

    const response = await POST(req);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBeDefined();
  });

  it('should return 409 for duplicate email', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ id: 'existing' });

    const { POST } = await import('@/app/api/auth/register/route');

    const req = new NextRequest('http://localhost:3000/api/auth/register', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        email: 'test@test.com',
        password: 'Password1',
        name: 'Test User',
      }),
    });

    const response = await POST(req);
    expect(response.status).toBe(409);
  });
});

describe('POST /api/auth/login', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 200 with tokens for valid credentials', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      email: 'test@test.com',
      password: '$2a$10$hashed',
      role: 'TRAINEE',
      emailVerified: true,
      suspendedAt: null,
      tokenVersion: 0,
    });

    const { POST } = await import('@/app/api/auth/login/route');

    const req = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'test@test.com', password: 'Password1' }),
    });

    const response = await POST(req);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.user.email).toBe('test@test.com');
  });

  it('should return 401 for wrong password', async () => {
    const bcrypt = await import('bcryptjs');
    (bcrypt.compare as any).mockResolvedValue(false);

    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      email: 'test@test.com',
      password: '$2a$10$hashed',
      emailVerified: true,
      suspendedAt: null,
    });

    const { POST } = await import('@/app/api/auth/login/route');

    const req = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'test@test.com', password: 'wrong' }),
    });

    const response = await POST(req);
    expect(response.status).toBe(401);
  });
});

describe('POST /api/auth/logout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should clear cookies on logout', async () => {
    const { POST } = await import('@/app/api/auth/logout/route');

    const req = new NextRequest('http://localhost:3000/api/auth/logout', {
      method: 'POST',
      headers: { cookie: 'access_token=some-token; refresh_token=some-refresh' },
    });

    const response = await POST(req);
    expect(response.status).toBe(200);
    const setCookie = response.headers.get('set-cookie') || '';
    expect(setCookie).toContain('Max-Age=0');
  });
});
