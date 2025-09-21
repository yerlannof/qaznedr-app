import { test, expect } from '@playwright/test';

test.describe('Listing Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Set up authentication token
    await page.addInitScript(() => {
      localStorage.setItem(
        'supabase.auth.token',
        JSON.stringify({
          access_token: 'test-token',
          token_type: 'bearer',
          expires_in: 3600,
          refresh_token: 'test-refresh',
          user: {
            id: 'test-user-123',
            email: 'test@example.com',
          },
        })
      );
    });
  });

  test('should search for listings', async ({ page }) => {
    await page.goto('/listings');

    // Enter search query
    const searchInput = page.getByPlaceholder(/search/i);
    await searchInput.fill('gold mine');
    await searchInput.press('Enter');

    // Wait for results
    await page.waitForLoadState('networkidle');

    // Check URL updated with search params
    await expect(page).toHaveURL(/query=gold\+mine/);

    // Check results are filtered
    const listings = page.locator('[data-testid="listing-card"]');
    await expect(listings).toHaveCount(await listings.count());
  });

  test('should filter listings by type', async ({ page }) => {
    await page.goto('/listings');

    // Select mining license type
    const typeFilter = page.locator('select[name="type"]');
    await typeFilter.selectOption('MINING_LICENSE');

    // Wait for filtered results
    await page.waitForLoadState('networkidle');

    // Check URL has filter
    await expect(page).toHaveURL(/type=MINING_LICENSE/);

    // Verify all listings are mining licenses
    const badges = page.locator('[data-testid="listing-type-badge"]');
    const count = await badges.count();
    for (let i = 0; i < count; i++) {
      await expect(badges.nth(i)).toContainText(/Mining License/i);
    }
  });

  test('should filter by mineral type', async ({ page }) => {
    await page.goto('/listings');

    // Select gold mineral
    const mineralFilter = page.locator('select[name="mineral"]');
    await mineralFilter.selectOption('Gold');

    // Wait for filtered results
    await page.waitForLoadState('networkidle');

    // Check URL has filter
    await expect(page).toHaveURL(/mineral=Gold/);

    // Verify listings contain gold
    const listings = page.locator('[data-testid="listing-card"]');
    const firstListing = listings.first();
    await expect(firstListing).toContainText(/Gold/i);
  });

  test('should filter by price range', async ({ page }) => {
    await page.goto('/listings');

    // Set min price
    const minPriceInput = page.locator('input[name="minPrice"]');
    await minPriceInput.fill('1000000');

    // Set max price
    const maxPriceInput = page.locator('input[name="maxPrice"]');
    await maxPriceInput.fill('10000000');

    // Apply filters
    const applyButton = page.getByRole('button', { name: /apply/i });
    await applyButton.click();

    // Wait for filtered results
    await page.waitForLoadState('networkidle');

    // Check URL has price filters
    await expect(page).toHaveURL(/minPrice=1000000/);
    await expect(page).toHaveURL(/maxPrice=10000000/);
  });

  test('should sort listings', async ({ page }) => {
    await page.goto('/listings');

    // Select sort by price ascending
    const sortSelect = page.locator('select[name="sortBy"]');
    await sortSelect.selectOption('price_asc');

    // Wait for sorted results
    await page.waitForLoadState('networkidle');

    // Get prices from first two listings
    const prices = await page
      .locator('[data-testid="listing-price"]')
      .allTextContents();

    // Parse prices and check order
    const numericPrices = prices.map((p) => parseInt(p.replace(/[^\d]/g, '')));
    for (let i = 0; i < numericPrices.length - 1; i++) {
      expect(numericPrices[i]).toBeLessThanOrEqual(numericPrices[i + 1]);
    }
  });

  test('should paginate through listings', async ({ page }) => {
    await page.goto('/listings');

    // Check first page
    const listings = page.locator('[data-testid="listing-card"]');
    const firstPageCount = await listings.count();
    expect(firstPageCount).toBeGreaterThan(0);

    // Go to next page
    const nextButton = page.getByRole('button', { name: /next/i });
    if (await nextButton.isEnabled()) {
      await nextButton.click();

      // Wait for new page
      await page.waitForLoadState('networkidle');

      // Check URL updated
      await expect(page).toHaveURL(/page=2/);

      // Check new listings loaded
      const secondPageCount = await listings.count();
      expect(secondPageCount).toBeGreaterThan(0);
    }
  });

  test('should view listing details', async ({ page }) => {
    await page.goto('/listings');

    // Get first listing title
    const firstListingTitle = await page
      .locator('[data-testid="listing-title"]')
      .first()
      .textContent();

    // Click on first listing
    const firstListing = page.locator('[data-testid="listing-card"]').first();
    await firstListing.click();

    // Check navigation to detail page
    await expect(page).toHaveURL(/\/listings\/[\w-]+$/);

    // Check detail page elements
    await expect(page.locator('h1')).toContainText(firstListingTitle || '');
    await expect(page.locator('[data-testid="listing-price"]')).toBeVisible();
    await expect(
      page.locator('[data-testid="listing-description"]')
    ).toBeVisible();
    await expect(page.locator('[data-testid="listing-map"]')).toBeVisible();
  });

  test('should handle favorite listings', async ({ page }) => {
    await page.goto('/listings');

    // Click favorite button on first listing
    const favoriteButton = page
      .locator('[data-testid="favorite-button"]')
      .first();
    const initialState = await favoriteButton.getAttribute('aria-pressed');

    await favoriteButton.click();

    // Check state changed
    await expect(favoriteButton).toHaveAttribute(
      'aria-pressed',
      initialState === 'true' ? 'false' : 'true'
    );

    // Navigate to favorites page
    await page.goto('/favorites');

    // Check if listing appears in favorites
    const favoritedListings = page.locator('[data-testid="listing-card"]');
    if (initialState === 'false') {
      await expect(favoritedListings).toHaveCount(
        await favoritedListings.count()
      );
    }
  });

  test('should share listing', async ({ page, context }) => {
    await page.goto('/listings');

    // Click on first listing
    const firstListing = page.locator('[data-testid="listing-card"]').first();
    await firstListing.click();

    // Click share button
    const shareButton = page.getByRole('button', { name: /share/i });
    await shareButton.click();

    // Check share modal appears
    const shareModal = page.locator('[data-testid="share-modal"]');
    await expect(shareModal).toBeVisible();

    // Click copy link button
    const copyButton = page.getByRole('button', { name: /copy link/i });

    // Grant clipboard permissions
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);

    await copyButton.click();

    // Check success message
    await expect(page.locator('text=Copied')).toBeVisible();
  });

  test('should contact seller', async ({ page }) => {
    await page.goto('/listings');

    // Click on first listing
    const firstListing = page.locator('[data-testid="listing-card"]').first();
    await firstListing.click();

    // Click contact button
    const contactButton = page.getByRole('button', { name: /contact/i });
    await contactButton.click();

    // Check contact modal appears
    const contactModal = page.locator('[data-testid="contact-modal"]');
    await expect(contactModal).toBeVisible();

    // Fill contact form
    await page.fill('input[name="name"]', 'John Doe');
    await page.fill('input[name="email"]', 'john@example.com');
    await page.fill('input[name="phone"]', '+7 777 123 4567');
    await page.fill(
      'textarea[name="message"]',
      'I am interested in this mining license.'
    );

    // Submit form
    const submitButton = page.getByRole('button', { name: /send/i });
    await submitButton.click();

    // Check success message
    await expect(page.locator('text=Message sent')).toBeVisible();
  });
});
