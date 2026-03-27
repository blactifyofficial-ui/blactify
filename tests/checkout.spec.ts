import { test, expect } from '@playwright/test';

test.describe('Checkout Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Start at home page
    await page.goto('/');
  });

  test('should navigate to shop and add to cart', async ({ page }) => {
    // 1. Navigate to shop
    await page.click('text=Shop');
    await expect(page).toHaveURL(/.*shop/);

    // 2. Select a product (targeting first product card)
    const product = page.locator('.group\\/card').first();
    await product.click();

    // 3. Select size if present (optional depending on product)
    const sizeButton = page.locator('button:has-text("M")').or(page.locator('button:has-text("S")')).first();
    if (await sizeButton.isVisible()) {
      await sizeButton.click();
    }

    // 4. Add to bag
    await page.click('button:has-text("Add to Bag")');
    
    // 5. Verify cart sidebar opens
    await expect(page.locator('text=Shopping Bag')).toBeVisible();
    
    // 6. Go to checkout
    await page.click('button:has-text("Checkout")');
    await expect(page).toHaveURL(/.*checkout/);
  });

  test('should show auth modal if not logged in at checkout', async ({ page }) => {
    // Indirectly go to checkout with an empty cart
    await page.goto('/checkout');
    
    // Since we are not logged in (mocked or fresh session), it should show restricted screen
    await expect(page.locator('text=Authentication Required')).toBeVisible();
    
    // Clicking Log In should open auth modal
    await page.click('button:has-text("Log In / Sign Up")');
    await expect(page.locator('text=Welcome Back').or(page.locator('text=Create Account'))).toBeVisible();
  });
});

