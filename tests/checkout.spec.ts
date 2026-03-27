import { test, expect } from '@playwright/test';

test.describe('Checkout Flow', () => {
  test.beforeEach(async ({ context }) => {
    // Skip animation/overlays for all pages in this context
    await context.addInitScript(() => {
      window.sessionStorage.setItem('welcome-animation-shown', 'true');
      window.localStorage.setItem('welcome-offer-dismissed', 'true');
    });
  });

  test('should navigate to shop and add to cart', async ({ page }) => {
    // 1. Go directly to shop
    await page.goto('/shop');
    
    // Wait for skeleton to disappear
    await expect(page.locator('img[alt="Blactify"].animate-pulse')).not.toBeVisible({ timeout: 30000 });
    await expect(page).toHaveURL(/.*shop/);

    // 2. Select a product - trying different class name patterns after UI changes
    const product = page.locator('div[class*="ProductCard"], a[href*="/product/"], div[class*="group/card"]').first();
    await expect(product).toBeVisible({ timeout: 15000 });
    await product.click();

    // 3. Select size if present
    const sizeButton = page.locator('button:has-text("M"), button:has-text("S"), button:has-text("L")').first();
    if (await sizeButton.count() > 0 && await sizeButton.isVisible()) {
      await sizeButton.click();
    }

    // 4. Add to bag
    const addToBagBtn = page.locator('button:has-text("Add to Bag")').or(page.locator('button:has-text("ADD TO BAG")'));
    await expect(addToBagBtn).toBeVisible({ timeout: 15000 });
    await addToBagBtn.click();
    
    // 5. Open bag and verify
    await page.goto('/shop?openCart=true');
    await expect(page.locator('text=Bag').or(page.locator('text=Shopping Bag')).or(page.locator('text=Your Bag'))).toBeVisible({ timeout: 20000 });
    
    // 6. Go to checkout
    const checkoutBtn = page.locator('button:has-text("Checkout")').or(page.locator('button:has-text("CHECKOUT")'));
    await checkoutBtn.click();
    await expect(page).toHaveURL(/.*checkout/);
  });

  test('should show auth modal if not logged in at checkout', async ({ page }) => {
    // Indirectly go to checkout with an empty cart
    await page.goto('/checkout');
    
    // Wait for initial loading to finish
    await expect(page.locator('.animate-spin')).not.toBeVisible({ timeout: 30000 });
    
    // Auth required check
    await expect(page.getByText(/Authentication Required/i).or(page.getByText(/Log In/i))).toBeVisible({ timeout: 20000 });
    
    // Opening auth modal
    const loginBtn = page.getByRole('button', { name: /Log In/i });
    if (await loginBtn.count() > 0) {
        await loginBtn.click();
        await expect(page.getByText(/Welcome/i).or(page.getByText(/Sign In/i)).or(page.getByText(/Create Account/i))).toBeVisible({ timeout: 15000 });
    }
  });
});

