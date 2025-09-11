import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test('should load successfully', async ({ page }) => {
    await page.goto('/');

    // Check that the page loads
    await expect(page).toHaveTitle(/QAZNEDR/);

    // Check for main heading
    await expect(page.locator('h1')).toContainText(
      'Kazakhstan Mining Platform'
    );

    // Check for navigation
    await expect(page.locator('nav')).toBeVisible();

    // Check for main sections
    await expect(page.locator('[data-testid="hero-section"]')).toBeVisible();
    await expect(
      page.locator('[data-testid="listings-preview"]')
    ).toBeVisible();
  });

  test('should navigate to listings pages', async ({ page }) => {
    await page.goto('/');

    // Test navigation to mining licenses
    await page.click('text=Mining Licenses');
    await expect(page).toHaveURL(/\/listings\/mining-licenses/);
    await expect(page.locator('h1')).toContainText('Mining Licenses');

    // Go back to homepage
    await page.goto('/');

    // Test navigation to exploration licenses
    await page.click('text=Exploration Licenses');
    await expect(page).toHaveURL(/\/listings\/exploration-licenses/);
    await expect(page.locator('h1')).toContainText('Exploration Licenses');

    // Go back to homepage
    await page.goto('/');

    // Test navigation to mineral occurrences
    await page.click('text=Mineral Occurrences');
    await expect(page).toHaveURL(/\/listings\/mineral-occurrences/);
    await expect(page.locator('h1')).toContainText('Mineral Occurrences');
  });

  test('should be responsive', async ({ page }) => {
    // Test desktop view
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.goto('/');
    await expect(page.locator('nav')).toBeVisible();

    // Test tablet view
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.reload();
    await expect(page.locator('nav')).toBeVisible();

    // Test mobile view
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();

    // Mobile menu should be visible
    const mobileMenuButton = page.locator('[data-testid="mobile-menu-button"]');
    if (await mobileMenuButton.isVisible()) {
      await mobileMenuButton.click();
      await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible();
    }
  });
});

test.describe('Performance', () => {
  test('should load within acceptable time', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;

    // Should load within 3 seconds
    expect(loadTime).toBeLessThan(3000);
  });

  test('should have good Core Web Vitals', async ({ page }) => {
    await page.goto('/');

    // Measure Largest Contentful Paint (LCP)
    const lcp = await page.evaluate(() => {
      return new Promise((resolve) => {
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          resolve(lastEntry.startTime);
        }).observe({ entryTypes: ['largest-contentful-paint'] });

        // Fallback timeout
        setTimeout(() => resolve(0), 5000);
      });
    });

    // LCP should be less than 2.5 seconds
    expect(lcp).toBeLessThan(2500);
  });
});
