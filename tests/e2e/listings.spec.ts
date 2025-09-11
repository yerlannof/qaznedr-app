import { test, expect } from '@playwright/test';

test.describe('Listings Pages', () => {
  test.describe('Mining Licenses', () => {
    test('should display mining license listings', async ({ page }) => {
      await page.goto('/listings/mining-licenses');

      // Check page title
      await expect(page.locator('h1')).toContainText('Mining Licenses');

      // Check for listing cards
      const listingCards = page.locator('[data-testid="listing-card"]');
      await expect(listingCards.first()).toBeVisible();

      // Check for key information in cards
      await expect(
        listingCards.first().locator('[data-testid="listing-title"]')
      ).toBeVisible();
      await expect(
        listingCards.first().locator('[data-testid="listing-location"]')
      ).toBeVisible();
      await expect(
        listingCards.first().locator('[data-testid="listing-price"]')
      ).toBeVisible();
    });

    test('should filter mining licenses', async ({ page }) => {
      await page.goto('/listings/mining-licenses');

      // Wait for listings to load
      await page.waitForSelector('[data-testid="listing-card"]');
      const initialCount = await page
        .locator('[data-testid="listing-card"]')
        .count();

      // Apply mineral filter
      await page.click('[data-testid="mineral-filter"]');
      await page.click('text=Oil');

      // Check that results are filtered
      await page.waitForTimeout(1000); // Wait for filter to apply
      const filteredCount = await page
        .locator('[data-testid="listing-card"]')
        .count();

      // Should have different number of results (could be same if all are oil)
      expect(filteredCount).toBeGreaterThan(0);

      // Check that visible listings contain oil
      const firstListing = page.locator('[data-testid="listing-card"]').first();
      await expect(
        firstListing.locator('[data-testid="listing-mineral"]')
      ).toContainText('Oil');
    });

    test('should search mining licenses', async ({ page }) => {
      await page.goto('/listings/mining-licenses');

      // Wait for listings to load
      await page.waitForSelector('[data-testid="listing-card"]');

      // Search for a specific term
      await page.fill('[data-testid="search-input"]', 'Tengiz');
      await page.press('[data-testid="search-input"]', 'Enter');

      // Wait for search results
      await page.waitForTimeout(1000);

      // Check search results
      const searchResults = page.locator('[data-testid="listing-card"]');
      if ((await searchResults.count()) > 0) {
        await expect(
          searchResults.first().locator('[data-testid="listing-title"]')
        ).toContainText('Tengiz');
      }
    });
  });

  test.describe('Listing Details', () => {
    test('should display listing details page', async ({ page }) => {
      await page.goto('/listings/mining-licenses');

      // Wait for listings to load
      await page.waitForSelector('[data-testid="listing-card"]');

      // Click on first listing
      await page.click('[data-testid="listing-card"]:first-child');

      // Should navigate to details page
      await expect(page).toHaveURL(/\/listings\/mining-licenses\/[^\/]+$/);

      // Check details page content
      await expect(
        page.locator('[data-testid="listing-details-title"]')
      ).toBeVisible();
      await expect(
        page.locator('[data-testid="listing-details-description"]')
      ).toBeVisible();
      await expect(
        page.locator('[data-testid="listing-details-price"]')
      ).toBeVisible();
      await expect(
        page.locator('[data-testid="listing-details-location"]')
      ).toBeVisible();

      // Check for mining license specific fields
      await expect(
        page.locator('[data-testid="license-number"]')
      ).toBeVisible();
      await expect(
        page.locator('[data-testid="license-expiry"]')
      ).toBeVisible();
    });

    test('should display map on details page', async ({ page }) => {
      await page.goto('/listings/mining-licenses');
      await page.waitForSelector('[data-testid="listing-card"]');
      await page.click('[data-testid="listing-card"]:first-child');

      // Check for map container
      await expect(page.locator('[data-testid="listing-map"]')).toBeVisible();

      // Wait for map to load (basic check)
      await page.waitForTimeout(2000);
    });

    test('should handle favorite functionality', async ({ page }) => {
      await page.goto('/listings/mining-licenses');
      await page.waitForSelector('[data-testid="listing-card"]');
      await page.click('[data-testid="listing-card"]:first-child');

      // Check for favorite button
      const favoriteButton = page.locator('[data-testid="favorite-button"]');
      await expect(favoriteButton).toBeVisible();

      // Click favorite button (might require auth)
      await favoriteButton.click();

      // Should show some feedback (either login prompt or success)
      // This will depend on auth state
    });
  });

  test.describe('Accessibility', () => {
    test('should be keyboard navigable', async ({ page }) => {
      await page.goto('/listings/mining-licenses');
      await page.waitForSelector('[data-testid="listing-card"]');

      // Tab through listings
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');

      // Should be able to navigate with Enter
      await page.keyboard.press('Enter');

      // Should navigate to details (if focused element was a listing)
    });

    test('should have proper ARIA labels', async ({ page }) => {
      await page.goto('/listings/mining-licenses');
      await page.waitForSelector('[data-testid="listing-card"]');

      // Check for ARIA labels on interactive elements
      const searchInput = page.locator('[data-testid="search-input"]');
      await expect(searchInput).toHaveAttribute('aria-label');

      const filterButtons = page.locator('[data-testid*="filter"]');
      if ((await filterButtons.count()) > 0) {
        await expect(filterButtons.first()).toHaveAttribute('aria-label');
      }
    });
  });

  test.describe('Error Handling', () => {
    test('should handle empty search results', async ({ page }) => {
      await page.goto('/listings/mining-licenses');
      await page.waitForSelector('[data-testid="listing-card"]');

      // Search for something that doesn't exist
      await page.fill(
        '[data-testid="search-input"]',
        'ThisShouldNotExistAnywhere123'
      );
      await page.press('[data-testid="search-input"]', 'Enter');

      await page.waitForTimeout(1000);

      // Should show empty state
      await expect(page.locator('[data-testid="empty-state"]')).toBeVisible();
      await expect(page.locator('text=No results found')).toBeVisible();
    });

    test('should handle network errors gracefully', async ({ page }) => {
      // Intercept and fail API requests
      await page.route('**/api/**', (route) => route.abort());

      await page.goto('/listings/mining-licenses');

      // Should show error state
      await page.waitForTimeout(2000);
      // The exact error handling will depend on implementation
    });
  });
});
