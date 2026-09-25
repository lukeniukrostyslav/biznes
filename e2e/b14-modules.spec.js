import { test, expect } from 'playwright/test';

const screens = [
  ['0', '#dashboardScreen'],
  ['1', '#leadsScreen'],
  ['2', '#clientsScreen'],
  ['3', '#proposalsScreen'],
  ['4', '#projectsScreen'],
  ['5', '#invoicesScreen'],
  ['6', '#paymentsScreen'],
  ['7', '#expensesScreen'],
  ['8', '#profitScreen'],
  ['9', '#cashflowScreen'],
  ['10', '#settingsScreen']
];

test.describe('B14 module navigation and functional surfaces', () => {
  test('all core modules are reachable from navigation', async ({ page }) => {
    await page.goto('/app/index.html');
    for (const [index, selector] of screens) {
      await page.locator(`#nav button[data-screen="${index}"]`).click();
      await expect(page.locator(selector)).toHaveClass(/active/);
    }
  });

  test('lead search and stage filter are interactive', async ({ page }) => {
    await page.goto('/app/index.html');
    await page.locator('#nav button[data-screen="1"]').click();
    await page.locator('#leadSearch').fill('test');
    await page.locator('#leadStageFilter').selectOption('Won');
    await expect(page.locator('#leadsPipeline')).toBeVisible();
  });

  test('dashboard, profit and cashflow surfaces expose their core outputs', async ({ page }) => {
    await page.goto('/app/index.html');
    for (const index of ['0', '8', '9']) {
      await page.locator(`#nav button[data-screen="${index}"]`).click();
      await expect(page.locator('.screen.active')).toBeVisible();
    }
    await expect(page.locator('#profitGrossRevenue')).toBeVisible();
    await expect(page.locator('#cashflowReceived')).toBeVisible();
  });

  test('settings exposes archive and persistence controls', async ({ page }) => {
    await page.goto('/app/index.html');
    await page.locator('#nav button[data-screen="10"]').click();
    await expect(page.locator('#settingsScreen')).toHaveClass(/active/);
    await expect(page.locator('#archiveList')).toBeVisible();
    await expect(page.locator('#exportData')).toBeVisible();
    await expect(page.locator('#importData')).toBeVisible();
  });

  test('all core screens remain horizontally contained on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/app/index.html');
    await page.setViewportSize({ width: 1200, height: 900 });
    for (const [index, selector] of screens) {
      await page.locator(`#nav button[data-screen="${index}"]`).click();
      await page.setViewportSize({ width: 390, height: 844 });
      await expect(page.locator(selector)).toHaveClass(/active/);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
      expect(overflow, `horizontal overflow on screen ${index}`).toBeFalsy();
      await page.setViewportSize({ width: 1200, height: 900 });
    }
  });
});
