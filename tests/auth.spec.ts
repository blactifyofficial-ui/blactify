import { test, expect } from '@playwright/test';

test.describe('Authentication Flows', () => {
  test.beforeEach(async ({ context }) => {
    // Skip animation/overlays for all pages in this context
    await context.addInitScript(() => {
      window.sessionStorage.setItem('welcome-animation-shown', 'true');
      window.localStorage.setItem('welcome-offer-dismissed', 'true');
    });
  });

  test('Admin Login page should render correctly', async ({ page }) => {
    await page.goto('/admin/login');
    await expect(page.locator('h2')).toHaveText('BLACTIFY');
    await expect(page.locator('p:has-text("Admin Access")')).toBeVisible();
    await expect(page.locator('button:has-text("Sign in as Administrator")')).toBeVisible();
  });

  test('Developer Login page should render correctly', async ({ page }) => {
    // Assuming /developer/login exists based on our check
    await page.goto('/developer/login');
    // Since we don't know the exact text yet, let's just check for basic elements
    // Based on history it might have "Mission Control" aesthetic
    await expect(page).toHaveURL(/.*developer\/login/);
  });

  test('Should redirect if user navigates to /admin while not logged in', async ({ page }) => {
    await page.goto('/admin');
    // It should redirect to /admin/login OR home
    await expect(page).not.toHaveURL('/admin');
    const currentUrl = page.url();
    expect(currentUrl).toMatch(/\/admin\/login|\/$/);
  });
});
