import { vi, describe, it, expect, beforeEach } from 'vitest';
const mockPrisma = {
  enrolment: { findUnique: vi.fn(), update: vi.fn() },
  milestone: { createMany: vi.fn() },
  payout: { findUnique: vi.fn(), update: vi.fn() },
  trainer: { findUnique: vi.fn(), update: vi.fn() },
  transactionLedger: { create: vi.fn() },
};
vi.mock('@backend/lib/db', () => ({ supabaseDb: mockPrisma, supabaseAdmin: {} }));
vi.mock('@backend/workers/email-worker', () => ({ addEmailToQueue: vi.fn() }));
vi.mock('@backend/lib/idempotency', () => ({
  checkMpesaReceipt: vi.fn().mockResolvedValue(false),
  checkB2cConversation: vi.fn().mockResolvedValue(false),
}));

describe('M-Pesa Worker', () => {
  let w: any;
  beforeEach(async () => {
    vi.clearAllMocks();
    w = await import('@backend/workers/mpesa-worker');
  });

  it('should activate enrolment on STK success', async () => {
    mockPrisma.enrolment.findUnique.mockResolvedValue({
      id: 'e1',
      status: 'PENDING_PAYMENT',
      course: { title: 'Test', trainerId: 'tr1' },
      trainer: { id: 'tr1' },
      traineeId: 't1',
    });
    mockPrisma.enrolment.update.mockResolvedValue({ status: 'ACTIVE' });
    const r = await w.processStkCallback({
      checkoutRequestId: 'crid',
      mpesaReceipt: 'MPS123',
      amount: 2000,
      phone: '254708374149',
    });
    expect(r.status).toBe('ACTIVE');
  });

  it('should handle STK failure', async () => {
    mockPrisma.enrolment.findUnique.mockResolvedValue({
      id: 'e1',
      status: 'PENDING_PAYMENT',
      course: { title: 'Test' },
    });
    mockPrisma.enrolment.update.mockResolvedValue({ status: 'CANCELLED' });
    const r = await w.processStkCallback({ checkoutRequestId: 'crid', resultCode: 1037 });
    expect(r.status).toBe('CANCELLED');
  });

  it('should mark payout completed on B2C success', async () => {
    mockPrisma.payout.findUnique.mockResolvedValue({
      id: 'p1',
      status: 'PROCESSING',
      amountKes: 500,
      trainerId: 'tr1',
    });
    mockPrisma.payout.update.mockResolvedValue({ status: 'COMPLETED' });
    const r = await w.processB2cCallback({ conversationId: 'conv1', resultCode: 0, transactionId: 'MPS789' });
    expect(r.status).toBe('COMPLETED');
  });
});
