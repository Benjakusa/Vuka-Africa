import { vi, describe, it, expect, beforeEach } from 'vitest';
const mockPrisma = {
  enrolment: { findMany: vi.fn(), update: vi.fn() },
  payout: { findMany: vi.fn(), update: vi.fn() },
  trainer: { update: vi.fn() },
  transactionLedger: { findFirst: vi.fn(), create: vi.fn() },
  session: { deleteMany: vi.fn() },
};
vi.mock('@backend/lib/prisma', () => ({ prisma: mockPrisma }));
vi.mock('@backend/workers/email-worker', () => ({ addEmailToQueue: vi.fn() }));

describe('Cron Worker', () => {
  let w: any;
  beforeEach(async () => { vi.clearAllMocks(); w = await import('@backend/workers/cron-worker'); });

  it('should cancel stale enrolments', async () => {
    const stale = new Date(Date.now() - 31 * 60 * 1000);
    mockPrisma.enrolment.findMany.mockResolvedValue([{ id: 'e1', status: 'PENDING_PAYMENT', createdAt: stale, course: { title: 'T' } }]);
    mockPrisma.enrolment.update.mockResolvedValue({ status: 'CANCELLED' });
    expect(await w.reconcileStaleEnrolments()).toBe(1);
  });

  it('should refund stuck payouts', async () => {
    const stale = new Date(Date.now() - 3 * 3600 * 1000);
    mockPrisma.payout.findMany.mockResolvedValue([{ id: 'p1', status: 'PROCESSING', amountKes: 500, trainerId: 'tr1', createdAt: stale }]);
    mockPrisma.transactionLedger.findFirst.mockResolvedValue(null);
    expect(await w.reconcileStuckPayouts()).toBe(1);
  });

  it('should clean up old sessions', async () => {
    mockPrisma.session.deleteMany.mockResolvedValue({ count: 5 });
    expect(await w.cleanupOldSessions()).toBe(5);
  });
});
