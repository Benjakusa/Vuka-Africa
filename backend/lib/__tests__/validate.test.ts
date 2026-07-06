import { describe, it, expect } from 'vitest';

describe('Validation Schemas', () => {
  it('should validate Kenyan phone numbers', async () => {
    const { z } = await import('zod');
    const s = z.string().regex(/^(?:\+?254|0)?[17]\d{8}$/);
    expect(s.safeParse('+254708374149').success).toBe(true);
    expect(s.safeParse('0708374149').success).toBe(true);
    expect(s.safeParse('0112345678').success).toBe(false);
  });

  it('should enforce password policy', async () => {
    const { z } = await import('zod');
    const s = z.string().min(8).regex(/^(?=.*[A-Za-z])(?=.*\d)/);
    expect(s.safeParse('Password1').success).toBe(true);
    expect(s.safeParse('short').success).toBe(false);
    expect(s.safeParse('abcdefgh').success).toBe(false);
  });

  it('should validate course prices', async () => {
    const { z } = await import('zod');
    const s = z.number().positive().max(10000000);
    expect(s.safeParse(1000).success).toBe(true);
    expect(s.safeParse(0).success).toBe(false);
    expect(s.safeParse(-500).success).toBe(false);
  });
});
