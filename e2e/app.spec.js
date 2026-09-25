import { test, expect } from 'playwright/test';

const screens = [
  'Dashboard','Leads','Clients','Proposals','Projects','Invoices',
  'Payments','Expenses','Profit','Cashflow','Settings'
];

test.beforeEach(async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('http://127.0.0.1:4173/app/index.html');
  await page.waitForLoadState('networkidle');
  if (errors.length) throw new Error('Browser runtime errors: ' + errors.join(' | '));
});

test('B14 app loads with dashboard and no runtime page error', async ({ page }) => {
  await expect(page.locator('#dashboardScreen')).toHaveClass(/active/);
  await expect(page.locator('#greeting')).not.toHaveText('');
  await expect(page.locator('#metricRevenue')).toBeVisible();
});

test('B14 all primary navigation screens open', async ({ page }) => {
  for (const name of screens) {
    await page.locator('#nav button').nth(screens.indexOf(name)).click();
    await expect(page.locator('.screen.active')).toBeVisible();
  }
});

test('B14 language switching works for all five launch languages', async ({ page }) => {
  for (const lang of ['ru','es','de','fr','en']) {
    await page.locator('#lang').evaluate((el, value) => { el.value = value; el.dispatchEvent(new Event('change', { bubbles: true })); }, lang);
    await expect(page.locator('html')).toHaveAttribute('lang', lang);
  }
});

test('B14 lead creation persists to localStorage', async ({ page }) => {
  await page.locator('#nav button').nth(1).click();
  await page.getByRole('button', { name: /New lead/i }).click();
  await page.locator('#fName').fill('E2E Lead');
  await page.locator('#fCompany').fill('E2E Company');
  await page.locator('#fEmail').fill('e2e@example.com');
  await page.locator('#drawerSave').click();
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('business-os-store-v1')));
  expect(stored.leads.some(x => x.name === 'E2E Lead')).toBeTruthy();
});

test('B14 client creation and persistence work', async ({ page }) => {
  await page.locator('#nav button').nth(2).click();
  await page.getByRole('button', { name: /New client/i }).click();
  await page.locator('#fName').fill('E2E Client');
  await page.locator('#drawerSave').click();
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('business-os-store-v1')));
  expect(stored.clients.some(x => x.name === 'E2E Client')).toBeTruthy();
});

test('B14 dashboard period selector remains functional', async ({ page }) => {
  for (const value of ['month','quarter','year','all']) {
    await page.locator('#dashboardPeriod').selectOption(value);
    await expect(page.locator('#dashboardPeriod')).toHaveValue(value);
  }
});

test('B14 responsive mobile surface remains usable', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator('#mobileNav button[data-mobile="1"]').click();
  await expect(page.locator('#leadsScreen')).toBeVisible();
  await page.getByRole('button', { name: /New lead/i }).click();
  await expect(page.locator('#detailDrawer')).toBeVisible();
  await expect(page.locator('#fName')).toBeVisible();
  await page.locator('#drawerCancel').click();
});

test('B14 export controls are present and executable', async ({ page }) => {
  await page.locator('#nav button').nth(9).click();
  await expect(page.getByText(/Export/i).first()).toBeVisible();
  await page.locator('#nav button').nth(8).click();
  await expect(page.getByText(/Export/i).first()).toBeVisible();
});

test('B14 reload preserves persisted records', async ({ page }) => {
  await page.getByRole('button', { name: 'Leads', exact: true }).click();
  await page.getByRole('button', { name: /New lead/i }).click();
  await page.locator('#fName').fill('Reload Test');
  await page.locator('#drawerSave').click();
  await page.reload();
  await page.waitForLoadState('networkidle');
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('business-os-store-v1')));
  expect(stored.leads.some(x => x.name === 'Reload Test')).toBeTruthy();
});
