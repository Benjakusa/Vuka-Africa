export async function setup() {
  process.env.NODE_ENV = 'test';
  process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/vuka_test';
  process.env.REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
  process.env.JWT_ACCESS_SECRET = 'integration-test-secret-32-chars-long!!';
  process.env.JWT_REFRESH_SECRET = 'integration-refresh-secret-32-chars!!';
  process.env.MPESA_ENV = 'sandbox';
  process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';
  process.env.ENCRYPTION_KEY = 'integration-encryption-key-32-bytes';
}

export async function teardown() {
  // Cleanup resources if needed
}
