import { vi, describe, it, expect, beforeEach } from 'vitest';
const mockPrisma = {
  user: { findUnique: vi.fn(), findFirst: vi.fn(), create: vi.fn(), update: vi.fn() },
  $transaction: vi.fn(),
};
vi.mock('@backend/lib/prisma', () => ({ prisma: mockPrisma }));
vi.mock('@backend/lib/redis', () => ({ redis: { get: vi.fn(), setex: vi.fn(), del: vi.fn(), incr: vi.fn() } }));
vi.mock('@backend/lib/jwt', () => ({ signAccessToken: vi.fn().mockReturnValue('at'), signRefreshToken: vi.fn().mockReturnValue('rt'), incrementTokenVersion: vi.fn().mockResolvedValue(1) }));
vi.mock('@backend/workers/email-worker', () => ({ addEmailToQueue: vi.fn() }));
vi.mock('bcryptjs', () => ({ hash: vi.fn().mockResolvedValue('$2a$10$hash'), compare: vi.fn().mockResolvedValue(true) }));

describe('Auth Service', () => {
  let s: any;
  beforeEach(async () => { vi.clearAllMocks(); s = await import('@backend/services/auth.service'); });

  it('should throw on duplicate email during register', async () => {
    mockPrisma.user.findFirst.mockResolvedValue({ id: 'existing' });
    await expect(s.register({ email: 't@t.com', password: 'Pw1', name: 'T' })).rejects.toThrow('already registered');
  });

  it('should login with valid credentials', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ id: 'u1', email: 't@t.com', password: '$2a$10$hash', role: 'TRAINEE', emailVerified: true, suspendedAt: null, tokenVersion: 0 });
    const r = await s.login({ email: 't@t.com', password: 'Pw1' });
    expect(r.accessToken).toBe('at');
  });

  it('should reject unverified email', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ id: 'u1', email: 't@t.com', password: '$2a$10$hash', emailVerified: false });
    await expect(s.login({ email: 't@t.com', password: 'Pw1' })).rejects.toThrow('verify');
  });
});
