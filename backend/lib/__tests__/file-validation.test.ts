import { vi, describe, it, expect, beforeEach } from 'vitest';
vi.mock('@backend/lib/redis', () => ({ redis: { get: vi.fn(), setex: vi.fn(), del: vi.fn(), set: vi.fn() } }));
describe('File Validation', () => {
  let m: any;
  beforeEach(async () => { vi.clearAllMocks(); m = await import('@backend/lib/file-validation'); });
  it('should accept PDF magic bytes', () => {
    const buf = Buffer.alloc(1024); buf[0] = 0x25; buf[1] = 0x50; buf[2] = 0x44; buf[3] = 0x46;
    expect(m.validateFileType(buf, 'application/pdf')).toBe(true);
  });
  it('should accept JPEG magic bytes', () => {
    const buf = Buffer.alloc(1024); buf[0] = 0xFF; buf[1] = 0xD8; buf[2] = 0xFF;
    expect(m.validateFileType(buf, 'image/jpeg')).toBe(true);
  });
  it('should reject mismatched MIME', () => {
    const buf = Buffer.alloc(1024); buf[0] = 0xFF; buf[1] = 0xD8; buf[2] = 0xFF;
    expect(m.validateFileType(buf, 'application/pdf')).toBe(false);
  });
  it('should generate UUID filename', () => {
    expect(m.generateFileName('doc.pdf')).toMatch(/^[0-9a-f-]+\.pdf$/);
  });
  it('should sanitize paths', () => {
    expect(m.sanitizeFileName('../../etc/passwd')).not.toContain('..');
  });
});
