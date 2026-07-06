import { vi, describe, it, expect, beforeEach } from 'vitest';
import nock from 'nock';

process.env.MPESA_ENV = 'sandbox';
process.env.MPESA_CONSUMER_KEY = 'test-key';
process.env.MPESA_CONSUMER_SECRET = 'test-secret';
process.env.MPESA_PASSKEY = 'test-passkey';
process.env.MPESA_SHORTCODE = '174379';

vi.mock('@backend/lib/redis', () => ({
  redis: { get: vi.fn().mockResolvedValue(null), setex: vi.fn(), set: vi.fn(), del: vi.fn() },
}));

describe('MpesaClient', () => {
  let mpesaClient: any;
  beforeEach(async () => { vi.clearAllMocks(); const mod = await import('@backend/lib/mpesa'); mpesaClient = mod.mpesaClient; });

  it('should fetch and cache access token', async () => {
    nock('https://sandbox.safaricom.co.ke').post('/oauth/v1/generate?grant_type=client_credentials').reply(200, { access_token: 'token', expires_in: 3599 });
    expect(await mpesaClient.getAccessToken()).toBe('token');
  });

  it('should send STK Push', async () => {
    nock('https://sandbox.safaricom.co.ke').post('/oauth/v1/generate?grant_type=client_credentials').reply(200, { access_token: 't', expires_in: 3599 });
    nock('https://sandbox.safaricom.co.ke').post('/mpesa/stkpush/v3/simulate').reply(200, { MerchantRequestID: 'mrid', CheckoutRequestID: 'crid', ResponseCode: '0', ResponseDescription: 'Success', CustomerMessage: 'Success' });
    const r = await mpesaClient.stkPush({ phone: '254708374149', amount: 1000, accountReference: 'TEST', transactionDesc: 'Test' });
    expect(r.ResponseCode).toBe('0');
  });

  it('should parse STK callback', () => {
    const r = mpesaClient.parseStkCallback({ Body: { stkCallback: { MerchantRequestID: 'm', CheckoutRequestID: 'c', ResultCode: 0, ResultDesc: 'OK', CallbackMetadata: { Item: [{ Name: 'MpesaReceiptNumber', Value: 'MPS123' }, { Name: 'Amount', Value: 1000 }] } } } });
    expect(r?.mpesaReceiptNumber).toBe('MPS123');
  });

  it('should return null for invalid callback', () => { expect(mpesaClient.parseStkCallback(null)).toBeNull(); });
  it('should allow sandbox IPs', () => { expect(mpesaClient.validateCallbackIp('1.2.3.4')).toBe(true); });
});
