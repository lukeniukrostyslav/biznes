import { test, expect } from 'playwright/test';

test.describe('LQ02 Runtime / Boot acceptance', () => {
  test('boots cleanly with the Dashboard visible and no browser errors', async ({ page }) => {
    const pageErrors = [];
    const consoleErrors = [];
    const failedRequests = [];

    page.on('pageerror', error => pageErrors.push(error.message));
    page.on('console', message => {
      if (message.type() === 'error') consoleErrors.push(message.text());
    });
    page.on('requestfailed', request => {
      failedRequests.push(request.url() + ' :: ' + (request.failure()?.errorText || 'request failed'));
    });

    const response = await page.goto('/app/index.html', { waitUntil: 'networkidle' });
    expect(response, 'Application document response must exist').not.toBeNull();
    expect(response.status(), 'Application document must return HTTP 2xx').toBeGreaterThanOrEqual(200);
    expect(response.status()).toBeLessThan(300);

    await expect(page.locator('body')).toBeVisible();
    await expect(page.locator('#dashboardScreen')).toHaveClass(/active/);
    await expect(page.locator('#greeting')).not.toHaveText('');
    await expect(page.locator('#metricRevenue')).toBeVisible();
    await expect(page.locator('#nav')).toBeVisible();

    expect(pageErrors, 'No uncaught browser page errors').toEqual([]);
    expect(consoleErrors, 'No browser console errors during boot').toEqual([]);
    expect(failedRequests, 'No failed network requests during boot').toEqual([]);
  });

  test('boots after a hard reload without runtime errors', async ({ page }) => {
    const pageErrors = [];
    page.on('pageerror', error => pageErrors.push(error.message));

    await page.goto('/app/index.html', { waitUntil: 'networkidle' });
    await page.reload({ waitUntil: 'networkidle' });

    await expect(page.locator('#dashboardScreen')).toHaveClass(/active/);
    await expect(page.locator('#metricRevenue')).toBeVisible();
    expect(pageErrors, 'No uncaught browser errors across initial load and reload').toEqual([]);
  });
});
