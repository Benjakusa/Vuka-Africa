import { NextResponse } from 'next/server';
import { prisma } from '@backend/lib/prisma';
import { redis } from '@backend/lib/redis';
import { env } from '@backend/lib/env';

export const runtime = 'nodejs';

export async function GET() {
  const checks: Record<string, { status: string; error?: string }> = {
    database: { status: 'unknown' },
    redis: { status: 'unknown' },
  };

  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database.status = 'ok';
  } catch (e) {
    checks.database.status = 'error';
    checks.database.error = e instanceof Error ? e.message : 'Database check failed';
  }

  try {
    await redis.ping();
    checks.redis.status = 'ok';
  } catch (e) {
    checks.redis.status = 'error';
    checks.redis.error = e instanceof Error ? e.message : 'Redis check failed';
  }

  const allOk = Object.values(checks).every((c) => c.status === 'ok');

  return NextResponse.json(
    {
      status: allOk ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: '1.0.0',
      environment: env.NODE_ENV,
      checks,
    },
    { status: allOk ? 200 : 503 },
  );
}
