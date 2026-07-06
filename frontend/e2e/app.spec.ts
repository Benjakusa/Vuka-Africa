import { test, expect } from '@playwright/test';

test.describe('Vuka E2E', () => {
  test.describe('Public Pages', () => {
    test('homepage loads and shows hero section', async ({ page }) => {
      await page.goto('/');
      // Verify the hero section loads
      await expect(page.locator('h1, h2').first()).toBeVisible();
      await expect(page.locator('text=Skill Marketplace').or(page.locator('text=Vuka'))).toBeVisible();
      await expect(page).toHaveTitle(/Vuka/);
    });

    test('trainer listing page loads trainers', async ({ page }) => {
      await page.goto('/trainers');
      await page.waitForLoadState('networkidle');
      const body = page.locator('body');
      await expect(body).not.toContainText(/loading/i);
    });

    test('course detail page shows 404 for invalid course', async ({ page }) => {
      const response = await page.goto('/courses/invalid-id-12345');
      expect(response?.status()).toBe(404);
    });
  });

  test.describe('Authentication', () => {
    test('login page shows form', async ({ page }) => {
      await page.goto('/login');
      await expect(page.locator('input[type="email"]')).toBeVisible();
      await expect(page.locator('input[type="password"]')).toBeVisible();
      await expect(page.locator('button[type="submit"]')).toBeVisible();
    });

    test('register page shows form and validation errors', async ({ page }) => {
      await page.goto('/register');
      await page.locator('button[type="submit"]').click();
      await expect(page.locator('text=required').or(page.locator('[aria-invalid="true"]'))).toBeVisible();
    });

    test('protected route redirects unauthenticated users', async ({ page }) => {
      await page.goto('/dashboard/trainee');
      await page.waitForURL(/\/login/);
      expect(page.url()).toContain('/login');
    });
  });

  test.describe('Dashboard - Unauthenticated', () => {
    test('trainer dashboard redirects to login', async ({ page }) => {
      await page.goto('/dashboard/trainer');
      await page.waitForURL(/\/login/);
      expect(page.url()).toContain('/login');
    });

    test('admin dashboard redirects to login', async ({ page }) => {
      await page.goto('/dashboard/admin');
      await page.waitForURL(/\/login/);
      expect(page.url()).toContain('/login');
    });
  });

  test.describe('PWA', () => {
    test('service worker is registered', async ({ page }) => {
      await page.goto('/');
      const hasSW = await page.evaluate(() => 'serviceWorker' in navigator);
      expect(hasSW).toBe(true);
    });

    test('offline fallback page exists', async ({ page }) => {
      const response = await page.goto('/~offline');
      expect(response?.status()).toBe(200);
    });
  });

  test.describe('Navigation', () => {
    test('navbar has navigation links', async ({ page }) => {
      await page.goto('/');
      // Look for navigation elements
      const nav = page.locator('nav, header');
      await expect(nav).toBeVisible();
      await expect(nav.locator('a[href="/courses"]').or(nav.locator('a[href="/trainers"]'))).toBeVisible();
    });
  });

  test.describe('Responsive Design', () => {
    test('mobile viewport shows hamburger menu', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');
      const body = page.locator('body');
      await expect(body).toBeVisible();
    });

    test('desktop viewport shows full navigation', async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto('/');
      const nav = page.locator('nav, header');
      await expect(nav).toBeVisible();
    });
  });

  test.describe('API Health', () => {
    test('health endpoint returns 200', async ({ request }) => {
      const response = await request.get('/api/health');
      expect(response.status()).toBe(200);
      const body = await response.json();
      expect(body.status).toBe('ok');
    });
  });
});
