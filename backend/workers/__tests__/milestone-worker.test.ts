import { vi, describe, it, expect, beforeEach } from 'vitest';
const mockPrisma = {
  milestone: { findUnique: vi.fn(), findMany: vi.fn(), update: vi.fn() },
  trainer: { findUnique: vi.fn(), update: vi.fn() },
  enrolment: { update: vi.fn() },
  transactionLedger: { create: vi.fn() },
};
vi.mock('@backend/lib/db', () => ({ supabaseDb: mockPrisma, supabaseAdmin: {} }));
vi.mock('@backend/workers/email-worker', () => ({ addEmailToQueue: vi.fn() }));

describe('Milestone Worker', () => {
  let w: any;
  beforeEach(async () => {
    vi.clearAllMocks();
    w = await import('@backend/workers/milestone-worker');
  });

  it('should release milestone after delay', async () => {
    mockPrisma.milestone.findUnique.mockResolvedValue({
      id: 'm1',
      enrolmentId: 'e1',
      sequence: 1,
      amountKes: 500,
      status: 'TRAINEE_CONFIRMED',
      enrolment: {
        id: 'e1',
        trainerId: 'tr1',
        traineeId: 't1',
        status: 'ACTIVE',
        course: { title: 'Test' },
        trainer: { user: { email: 'tr@t.com' } },
        trainee: { email: 'tn@t.com', fullName: 'TN' },
      },
    });
    mockPrisma.trainer.findUnique.mockResolvedValue({ id: 'tr1', userId: 'tu1', availableBalance: 1000 });
    mockPrisma.milestone.findMany.mockResolvedValue([{ status: 'RELEASED' }, { status: 'TRAINEE_CONFIRMED' }]);
    const r = await w.processDelayedRelease('m1');
    expect(r.status).toBe('RELEASED');
  });

  it('should skip if already released', async () => {
    mockPrisma.milestone.findUnique.mockResolvedValue({
      id: 'm2',
      status: 'RELEASED',
      enrolment: { course: { title: 'T' }, trainer: { user: {} }, trainee: {} },
    });
    const r = await w.processDelayedRelease('m2');
    expect(r.skipped).toBe(true);
  });
});
