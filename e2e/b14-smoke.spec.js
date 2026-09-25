import { test, expect } from 'playwright/test';

test.describe('B14 Functional / E2E smoke', () => {
  test('dashboard loads without visible runtime failure', async ({ page }) => {
    const runtimeErrors = [];
    page.on('pageerror', error => runtimeErrors.push(error.message));
    await page.goto('/app/index.html');
    await expect(page.locator('#dashboardScreen')).toBeVisible();
    await expect(page.locator('#metricRevenue')).toBeVisible();
    await expect(page.locator('#metricOutstanding')).toBeVisible();
    await expect(page.locator('#metricPipeline')).toBeVisible();
    await expect(page.locator('#metricProfit')).toBeVisible();
    expect(runtimeErrors, runtimeErrors.join('\n')).toEqual([]);
  });

  test('all five launch languages can be selected and rendered', async ({ page }) => {
    await page.goto('/app/index.html');
    const language = page.locator('#lang');
    for (const code of ['en', 'es', 'de', 'fr', 'ru']) {
      await language.selectOption(code);
      await expect(language).toHaveValue(code);
      await expect(page.locator('#dashboardScreen')).toBeVisible();
      await expect(page.locator('#greeting')).not.toHaveText('');
    }
  });

  test('dashboard period filter changes without runtime failure', async ({ page }) => {
    const runtimeErrors = [];
    page.on('pageerror', error => runtimeErrors.push(error.message));
    await page.goto('/app/index.html');
    const period = page.locator('#dashboardPeriod');
    for (const value of ['month', 'quarter', 'year', 'all']) {
      await period.selectOption(value);
      await expect(period).toHaveValue(value);
      await expect(page.locator('#metricRevenue')).toBeVisible();
    }
    expect(runtimeErrors, runtimeErrors.join('\n')).toEqual([]);
  });

  test('export and import controls are wired', async ({ page }) => {
    await page.goto('/app/index.html');
    await expect(page.locator('#exportData')).toBeVisible();
    await expect(page.locator('#importData')).toBeVisible();
    await expect(page.locator('#importDataInput')).toHaveAttribute('accept', 'application/json');
  });

  test('mobile layout exposes the mobile navigation', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/app/index.html');
    await expect(page.locator('.mobile-nav')).toBeVisible();
    await expect(page.locator('.content')).toBeVisible();
  });
});