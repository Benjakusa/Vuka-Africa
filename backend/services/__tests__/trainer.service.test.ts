import { vi, describe, it, expect, beforeEach } from 'vitest';
const mockPrisma = {
  trainer: { findUnique: vi.fn(), update: vi.fn() },
  user: { findUnique: vi.fn(), update: vi.fn() },
  platformConfig: { findFirst: vi.fn(), findUnique: vi.fn() },
  $transaction: vi.fn((fn: any) => fn(mockPrisma)),
};
vi.mock('@backend/lib/prisma', () => ({ prisma: mockPrisma }));
vi.mock('@backend/lib/mpesa', () => ({ mpesaClient: { stkPush: vi.fn() } }));
vi.mock('@backend/lib/cache', () => ({ getCached: vi.fn(), setCached: vi.fn(), invalidateCache: vi.fn() }));
vi.mock('@backend/workers/email-worker', () => ({ addEmailToQueue: vi.fn() }));

describe('Trainer Service', () => {
  let s: any;
  beforeEach(async () => { vi.clearAllMocks(); s = await import('@backend/services/trainer.service'); });

  it('should apply for trainer with first-100-free', async () => {
    mockPrisma.$transaction.mockImplementation(async (fn: any) => fn({
      trainer: { findUnique: vi.fn().mockResolvedValue(null), create: vi.fn().mockResolvedValue({ id: 'tr1', userId: 'u1', commissionRate: 0 }) },
      user: { update: vi.fn() },
      platformConfig: { findUnique: vi.fn().mockResolvedValue({ trainerCount: 5, freeTrainerLimit: 100 }), update: vi.fn() },
    }));
    mockPrisma.user.findUnique.mockResolvedValue({ id: 'u1', email: 'test@test.com', fullName: 'Test', role: 'TRAINEE' });
    const r = await s.apply({ userId: 'u1', bio: 'test', skills: ['JS'] });
    expect(r.id).toBe('tr1');
  });

  it('should throw if already a trainer', async () => {
    mockPrisma.$transaction.mockImplementation(async (fn: any) => fn({
      trainer: { findUnique: vi.fn().mockResolvedValue({ id: 'existing' }) },
    }));
    await expect(s.apply({ userId: 'u1', bio: 'x', skills: ['x'] })).rejects.toThrow('already');
  });

  it('should initiate verification STK', async () => {
    mockPrisma.trainer.findUnique.mockResolvedValue({ id: 'tr1', user: { phone: '254708374149' }, isVerified: false, verificationStatus: 'UNSUBMITTED', verificationFeePaid: false });
    const { mpesaClient } = await import('@backend/lib/mpesa');
    (mpesaClient.stkPush as any).mockResolvedValue({ CheckoutRequestID: 'crid', ResponseCode: '0', MerchantRequestID: 'mrid' });
    const r = await s.initiateVerificationPayment('u1');
    expect(r.checkoutRequestID).toBe('crid');
  });
});
