import { vi, describe, it, expect, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
vi.mock('@backend/lib/redis', () => ({ redis: { get: vi.fn(), setex: vi.fn() } }));

describe('CSRF Middleware', () => {
  let validateCsrf: any;
  beforeEach(async () => { vi.clearAllMocks(); validateCsrf = (await import('@backend/middleware/csrf')).validateCsrf; });

  it('should allow GET requests', async () => {
    const req = new NextRequest('http://localhost:3000/api/courses', { method: 'GET' });
    const r = await validateCsrf(req, async () => new Response(null, { status: 200 }));
    expect(r.status).toBe(200);
  });

  it('should block POST without CSRF cookie', async () => {
    const req = new NextRequest('http://localhost:3000/api/enrolments', { method: 'POST', headers: { 'x-csrf-token': 'abc' } });
    const r = await validateCsrf(req, async () => new Response(null, { status: 200 }));
    expect(r.status).toBe(403);
  });
});
