import { test, expect } from '@playwright/test';

test.describe('Checkout Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Start at home page
    await page.goto('/');
  });

  test('should navigate to shop and add to cart', async ({ page }) => {
    // 1. Go directly to shop
    await page.goto('/shop');
    await expect(page).toHaveURL(/.*shop/);

    // 2. Select a product
    const product = page.locator('div[class*="group/card"], a[href*="/product/"]').first();
    await product.click();

    // 3. Select size if present
    const sizeButton = page.locator('button[class*="border-black"], button:has-text("M")').first();
    if (await sizeButton.count() > 0) {
      await sizeButton.click();
    }

    // 4. Add to bag
    await page.click('button:has-text("Add to Bag")');
    
    // 5. Open bag and verify
    await page.goto('/shop?openCart=true');
    await expect(page.locator('text=Shopping Bag').or(page.locator('text=Your Bag'))).toBeVisible({ timeout: 10000 });
    
    // 6. Go to checkout
    await page.click('button:has-text("Checkout")');
    await expect(page).toHaveURL(/.*checkout/);
  });

  test('should show auth modal if not logged in at checkout', async ({ page }) => {
    // Indirectly go to checkout with an empty cart
    await page.goto('/checkout');
    
    // Auth required check
    await expect(page.locator('text=Authentication Required').or(page.locator('text=Log In'))).toBeVisible({ timeout: 15000 });
    
    // Opening auth modal
    const loginBtn = page.locator('button:has-text("Log In / Sign Up")');
    if (await loginBtn.count() > 0) {
        await loginBtn.click();
        await expect(page.locator('text=Welcome Back').or(page.locator('text=Create Account')).or(page.locator('text=Sign In'))).toBeVisible();
    }
  });
});

