import { vi, describe, it, expect, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
const mockRedis = { incr: vi.fn(), expire: vi.fn(), get: vi.fn() };
vi.mock('@backend/lib/redis', () => ({ redis: mockRedis }));

describe('Rate Limit Middleware', () => {
  let rateLimit: any;
  beforeEach(async () => { vi.clearAllMocks(); rateLimit = (await import('@backend/middleware/rate-limit')).rateLimit; });

  it('should allow under limit', async () => {
    mockRedis.incr.mockResolvedValue(1);
    mockRedis.expire.mockResolvedValue(1);
    const req = new NextRequest('http://localhost:3000/api/auth/login', { headers: { 'x-forwarded-for': '127.0.0.1' } });
    expect(await rateLimit(req, { max: 5, window: 900, key: 'login' })).toBeNull();
  });

  it('should block over limit', async () => {
    mockRedis.incr.mockResolvedValue(6);
    const req = new NextRequest('http://localhost:3000/api/auth/login', { headers: { 'x-forwarded-for': '127.0.0.1' } });
    const r = await rateLimit(req, { max: 5, window: 900, key: 'login' });
    expect(r!.status).toBe(429);
  });
});
