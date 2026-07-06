import { vi, describe, it, expect, beforeEach } from 'vitest';
const mockPrisma = {
  enrolment: { findUnique: vi.fn(), update: vi.fn() },
  milestone: { findUnique: vi.fn(), findFirst: vi.fn(), update: vi.fn() },
  trainer: { findUnique: vi.fn(), update: vi.fn() },
  transactionLedger: { create: vi.fn() },
  $transaction: vi.fn((fn: any) => fn(mockPrisma)),
};
vi.mock('@backend/lib/prisma', () => ({ prisma: mockPrisma }));
vi.mock('@backend/lib/redis', () => ({ redis: {} }));
vi.mock('@backend/workers/milestone-worker', () => ({ addMilestoneReleaseJob: vi.fn() }));

describe('Milestone Service', () => {
  let s: any;
  const enrolment = { id: 'e1', status: 'ACTIVE', traineeId: 't1', trainerId: 'tr1', trainer: { userId: 'tu1' }, course: { title: 'Test' } };
  const milestone = { id: 'm1', enrolmentId: 'e1', sequence: 1, label: 'Start', percentage: 25, amountKes: 500, status: 'PENDING' };
  beforeEach(async () => { vi.clearAllMocks(); s = await import('@backend/services/milestone.service'); });

  it('should confirm milestone by trainer', async () => {
    mockPrisma.enrolment.findUnique.mockResolvedValue(enrolment);
    mockPrisma.milestone.findUnique.mockResolvedValue(milestone);
    mockPrisma.milestone.update.mockResolvedValue({ ...milestone, status: 'TRAINER_CONFIRMED' });
    mockPrisma.milestone.findFirst.mockResolvedValue(null);
    const r = await s.confirmByTrainer('m1', 'e1', 'tu1');
    expect(r.status).toBe('TRAINER_CONFIRMED');
  });

  it('should throw when not the trainer', async () => {
    mockPrisma.enrolment.findUnique.mockResolvedValue(enrolment);
    await expect(s.confirmByTrainer('m1', 'e1', 'other')).rejects.toThrow('Not your enrolment');
  });

  it('should confirm by trainee', async () => {
    mockPrisma.enrolment.findUnique.mockResolvedValue(enrolment);
    mockPrisma.milestone.findUnique.mockResolvedValue({ ...milestone, status: 'TRAINER_CONFIRMED', trainerConfirmedAt: new Date() });
    mockPrisma.milestone.update.mockResolvedValue({ ...milestone, status: 'TRAINEE_CONFIRMED' });
    mockPrisma.milestone.findFirst.mockResolvedValue({ id: 'm1' });
    const r = await s.confirmByTrainee('m1', 'e1', 't1');
    expect(r.status).toBe('TRAINEE_CONFIRMED');
  });
});
