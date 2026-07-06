import { vi, describe, it, expect, beforeEach } from 'vitest';
const mockPrisma = {
  payout: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn() },
  payoutCode: { create: vi.fn(), findFirst: vi.fn(), delete: vi.fn() },
  trainer: { findUnique: vi.fn(), update: vi.fn() },
  transactionLedger: { create: vi.fn() },
  $transaction: vi.fn((fn: any) => fn(mockPrisma)),
};
vi.mock('@backend/lib/prisma', () => ({ prisma: mockPrisma }));
vi.mock('@backend/lib/redis', () => ({ redis: { get: vi.fn(), setex: vi.fn(), set: vi.fn(), del: vi.fn(), incr: vi.fn(), ttl: vi.fn(), expire: vi.fn() } }));
vi.mock('@backend/workers/payout-worker', () => ({ addPayoutJob: vi.fn() }));
vi.mock('@backend/workers/email-worker', () => ({ addEmailToQueue: vi.fn() }));

describe('Payout Service', () => {
  let s: any;
  beforeEach(async () => { vi.clearAllMocks(); s = await import('@backend/services/payout.service'); });

  it('should request payout with 2FA code', async () => {
    const { redis } = await import('@backend/lib/redis');
    (redis.get as any).mockResolvedValue(null);
    const r = await s.requestPayout('tr1', 500);
    expect(r.payoutId).toBeTruthy();
  });

  it('should enforce 60s resend cooldown', async () => {
    const { redis } = await import('@backend/lib/redis');
    (redis.get as any).mockResolvedValue('123456');
    (redis.ttl as any).mockResolvedValue(55);
    await expect(s.requestPayout('tr1', 500)).rejects.toThrow('wait');
  });

  it('should confirm payout with valid 2FA', async () => {
    const { redis } = await import('@backend/lib/redis');
    (redis.get as any).mockResolvedValue('123456');
    mockPrisma.trainer.findUnique.mockResolvedValue({ id: 'tr1', userId: 'u1', availableBalance: 500 });
    mockPrisma.$transaction.mockImplementation(async (fn: any) => fn({
      payout: { update: vi.fn().mockResolvedValue({ id: 'p1', status: 'PROCESSING' }) },
      trainer: { update: vi.fn() },
      transactionLedger: { create: vi.fn() },
    }));
    const r = await s.confirmPayout('tr1', 'p1', '123456');
    expect(r.status).toBe('PROCESSING');
  });

  it('should throw on wrong 2FA code', async () => {
    const { redis } = await import('@backend/lib/redis');
    (redis.get as any).mockResolvedValue('123456');
    await expect(s.confirmPayout('tr1', 'p1', '000000')).rejects.toThrow('Invalid');
  });
});
