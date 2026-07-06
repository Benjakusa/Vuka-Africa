import { vi, describe, it, expect, beforeEach } from 'vitest';
import jwt from 'jsonwebtoken';
process.env.JWT_ACCESS_SECRET = 'test-access-secret-at-least-32-chars-long!!';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-at-least-32-chars-long!';
process.env.JWT_ISSUER = 'vuka-test';
vi.mock('@backend/lib/redis', () => ({ redis: { get: vi.fn(), setex: vi.fn(), incr: vi.fn().mockResolvedValue(1), del: vi.fn() } }));

describe('JWT', () => {
  let m: any;
  beforeEach(async () => { vi.clearAllMocks(); m = await import('@backend/lib/jwt'); });
  it('should sign and verify access token', () => {
    const t = m.signAccessToken({ userId: 'u1', role: 'TRAINEE' });
    expect(m.verifyAccessToken(t).userId).toBe('u1');
  });
  it('should reject wrong secret', () => {
    const t = jwt.sign({ userId: 'u1', role: 'TRAINEE', type: 'access' }, 'wrong');
    expect(() => m.verifyAccessToken(t)).toThrow();
  });
  it('should handle refresh tokens with version', () => {
    const t = m.signRefreshToken({ userId: 'u1', role: 'TRAINER', tokenVersion: 5 });
    expect(m.verifyRefreshToken(t).tokenVersion).toBe(5);
  });
});
