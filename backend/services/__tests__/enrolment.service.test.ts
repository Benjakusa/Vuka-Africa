import { vi, describe, it, expect, beforeEach } from 'vitest';
const mockPrisma = {
  course: { findUnique: vi.fn() },
  enrolment: { findUnique: vi.fn(), findFirst: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
  user: { findUnique: vi.fn() },
  $transaction: vi.fn((fn: any) => fn(mockPrisma)),
};
vi.mock('@backend/lib/prisma', () => ({ prisma: mockPrisma }));
vi.mock('@backend/lib/mpesa', () => ({ mpesaClient: { stkPush: vi.fn() } }));
vi.mock('@backend/lib/redis', () => ({ redis: { get: vi.fn(), setex: vi.fn() } }));
vi.mock('@backend/lib/idempotency', () => ({ checkAndMarkIdempotent: vi.fn().mockResolvedValue(false) }));
vi.mock('@backend/workers/email-worker', () => ({ addEmailToQueue: vi.fn() }));

describe('Enrolment Service', () => {
  let s: any;
  beforeEach(async () => { vi.clearAllMocks(); s = await import('@backend/services/enrolment.service'); });
  it('should throw when course not found', async () => {
    mockPrisma.course.findUnique.mockResolvedValue(null);
    await expect(s.createEnrolment({ traineeId: 't1', courseId: 'c1' })).rejects.toThrow('Course not found');
  });
  it('should throw when enrolling in own course', async () => {
    mockPrisma.course.findUnique.mockResolvedValue({ id: 'c1', isPublished: true, trainer: { userId: 't1', commissionRate: 20 }, _count: { enrolments: 0 } });
    await expect(s.createEnrolment({ traineeId: 't1', courseId: 'c1' })).rejects.toThrow('own course');
  });
  it('should create enrolment and call STK Push', async () => {
    mockPrisma.course.findUnique.mockResolvedValue({ id: 'c1', title: 'Test', isPublished: true, priceKes: 2000, maxStudents: 10, trainer: { id: 'tr1', userId: 'tu1', commissionRate: 20 }, _count: { enrolments: 0 } });
    mockPrisma.user.findUnique.mockResolvedValue({ id: 't1', phone: '254708374149' });
    mockPrisma.enrolment.findFirst.mockResolvedValue(null);
    mockPrisma.enrolment.create.mockResolvedValue({ id: 'e1' });
    const { mpesaClient } = await import('@backend/lib/mpesa');
    (mpesaClient.stkPush as any).mockResolvedValue({ CheckoutRequestID: 'crid', MerchantRequestID: 'mrid', ResponseCode: '0' });
    const r = await s.createEnrolment({ traineeId: 't1', courseId: 'c1' });
    expect(r.enrolmentId).toBe('e1');
  });
  it('should delete enrolment on STK failure', async () => {
    mockPrisma.course.findUnique.mockResolvedValue({ id: 'c1', isPublished: true, priceKes: 2000, maxStudents: 10, trainer: { id: 'tr1', userId: 'tu1', commissionRate: 20 }, _count: { enrolments: 0 } });
    mockPrisma.user.findUnique.mockResolvedValue({ id: 't1', phone: '254708374149' });
    mockPrisma.enrolment.findFirst.mockResolvedValue(null);
    mockPrisma.enrolment.create.mockResolvedValue({ id: 'e1' });
    const { mpesaClient } = await import('@backend/lib/mpesa');
    (mpesaClient.stkPush as any).mockRejectedValue(new Error('M-Pesa error'));
    await expect(s.createEnrolment({ traineeId: 't1', courseId: 'c1' })).rejects.toThrow('M-Pesa error');
    expect(mockPrisma.enrolment.delete).toHaveBeenCalledWith({ where: { id: 'e1' } });
  });
});
