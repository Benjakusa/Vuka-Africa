import { vi, describe, it, expect, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
const mockPrisma = { user: { findUnique: vi.fn() } };
vi.mock('@backend/lib/prisma', () => ({ prisma: mockPrisma }));
const mockRedis = { get: vi.fn(), setex: vi.fn(), del: vi.fn() };
vi.mock('@backend/lib/redis', () => ({ redis: mockRedis }));
vi.mock('@backend/lib/jwt', () => ({ verifyAccessToken: vi.fn(), isTokenBlacklisted: vi.fn() }));

describe('Auth Middleware', () => {
  let authenticate: any;
  beforeEach(async () => { vi.clearAllMocks(); const mod = await import('@backend/middleware/auth'); authenticate = mod.authenticate; });

  it('should return 401 when no token', async () => {
    const req = new NextRequest('http://localhost:3000/api/courses', { headers: {} });
    const r = await authenticate(req);
    expect(r.status).toBe(401);
  });

  it('should return 401 for blacklisted token', async () => {
    const { verifyAccessToken, isTokenBlacklisted } = await import('@backend/lib/jwt');
    (verifyAccessToken as any).mockReturnValue({ userId: 'u1', role: 'TRAINEE', jti: 'jti1' });
    (isTokenBlacklisted as any).mockResolvedValue(true);
    const req = new NextRequest('http://localhost:3000/api/courses', { headers: { cookie: 'accessToken=bad' } });
    const r = await authenticate(req);
    expect(r.status).toBe(401);
  });
});
