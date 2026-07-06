import { vi, describe, it, expect, beforeEach } from 'vitest';
process.env.ENCRYPTION_KEY = 'test-encryption-key-32-bytes-long!!';
describe('Encryption', () => {
  let m: any;
  beforeEach(async () => { vi.resetModules(); m = await import('@backend/lib/encryption'); });
  it('should encrypt and decrypt', () => {
    const e = m.encrypt('254708374149');
    expect(e).not.toBe('254708374149');
    expect(e).toContain(':');
    expect(m.decrypt(e)).toBe('254708374149');
  });
  it('should produce different ciphertexts', () => {
    expect(m.encrypt('test')).not.toBe(m.encrypt('test'));
  });
  it('should mask phone', () => { expect(m.maskPhone('254708374149')).toBe('2547****4149'); });
  it('should mask email', () => { expect(m.maskEmail('john@example.com')).toBe('jo****@example.com'); });
  it('should throw on invalid ciphertext', () => { expect(() => m.decrypt('bad')).toThrow(); });
});
