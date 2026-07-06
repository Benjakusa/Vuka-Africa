import { vi, describe, it, expect, beforeEach } from 'vitest';
vi.mock('@backend/lib/redis', () => ({ redis: { get: vi.fn(), set: vi.fn() } }));
describe('Idempotency', () => {
  let m: any;
  beforeEach(async () => { vi.clearAllMocks(); m = await import('@backend/lib/idempotency'); });
  it('should allow first request', async () => {
    const { redis } = await import('@backend/lib/redis');
    (redis.get as any).mockResolvedValue(null);
    expect(await m.checkAndMarkIdempotent('test', 'key', 300)).toBe(false);
  });
  it('should reject duplicate', async () => {
    const { redis } = await import('@backend/lib/redis');
    (redis.get as any).mockResolvedValue('processed');
    expect(await m.checkAndMarkIdempotent('test', 'key', 300)).toBe(true);
  });
  it('should deduplicate M-Pesa receipts', async () => {
    const { redis } = await import('@backend/lib/redis');
    (redis.get as any).mockResolvedValue(null);
    expect(await m.checkMpesaReceipt('MPS123')).toBe(false);
  });
});
