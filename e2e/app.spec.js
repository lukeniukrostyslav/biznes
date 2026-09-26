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
  await page.locator('#mobileNav button[data-mobile="2"]').click();
  await expect(page.locator('#clientsScreen')).toBeVisible();
  await page.getByRole('button', { name: /New client/i }).click();
  await expect(page.locator('#detailDrawer')).toBeVisible();
  await expect(page.locator('#fName')).toBeVisible();
  await page.locator('#drawerCancel').click();
});

test('B14 export controls are present and executable', async ({ page }) => {
  await page.locator('#nav button[data-screen="9"]').click();
  await expect(page.locator('#exportCashflow')).toBeVisible();
  await page.locator('#nav button[data-screen="8"]').click();
  await expect(page.locator('#exportProfitAnalysis')).toBeVisible();
});

test('B14 reload preserves persisted records', async ({ page }) => {
  await page.locator('#nav button[data-screen="1"]').click();
  await page.getByRole('button', { name: /New lead/i }).click();
  await page.locator('#fName').fill('Reload Test');
  await page.locator('#drawerSave').click();
  await page.reload();
  await page.waitForLoadState('networkidle');
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('business-os-store-v1')));
  expect(stored.leads.some(x => x.name === 'Reload Test')).toBeTruthy();
});


test('B14 accessibility smoke: named controls and keyboard activation', async ({ page }) => {
  const unnamedButtons = await page.locator('button').evaluateAll(buttons =>
    buttons.filter(button => {
      const text = (button.innerText || '').trim();
      const aria = (button.getAttribute('aria-label') || '').trim();
      const title = (button.getAttribute('title') || '').trim();
      return !text && !aria && !title;
    }).length
  );
  expect(unnamedButtons).toBe(0);

  await page.locator('#nav button[data-screen="1"]').focus();
  await expect(page.locator('#nav button[data-screen="1"]')).toBeFocused();
  await page.locator('#nav button[data-screen="1"]').press('Enter');
  await expect(page.locator('#leadsScreen')).toHaveClass(/active/);

  const newLead = page.locator('button[data-i18n="newLead"]');
  await newLead.focus();
  await newLead.press('Enter');
  await expect(page.locator('#detailDrawer')).toHaveClass(/open/);
  await expect(page.locator('label[for="fName"]')).toBeVisible();
  await page.locator('#drawerCancel').click();
});


test('B07 fresh workspace is clean and has no demo financial records', async ({ page }) => {
  await page.goto('http://127.0.0.1:4173/app/index.html');
  await page.waitForLoadState('networkidle');
  await expect(page.locator('#metricRevenue')).toHaveText('€0');
  await expect(page.locator('#metricOutstanding')).toHaveText('€0');
  await expect(page.locator('#metricPipeline')).toHaveText('€0');
  await expect(page.locator('#metricProfit')).toHaveText('€0');
  await expect(page.locator('body')).not.toContainText('Rossi Studio');
  await expect(page.locator('body')).not.toContainText('AB Design');
  await expect(page.locator('body')).not.toContainText('#INV-1048');
});

test('B07 new client form starts empty after an earlier record was created', async ({ page }) => {
  await page.locator('#nav button[data-screen="2"]').click();
  await page.getByRole('button', { name: /New client/i }).click();
  await expect(page.locator('#fName')).toBeVisible();
  await expect(page.locator('#fStatus')).toBeVisible();
  await expect(page.locator('#fCompany')).toBeHidden();
  await expect(page.locator('#fEmail')).toBeHidden();
  await page.locator('#fName').fill('Temporary Client');
  await page.locator('#drawerSave').click();
  await page.getByRole('button', { name: /New client/i }).click();
  await expect(page.locator('#fName')).toHaveValue('');
  await expect(page.locator('#fCompany')).toHaveValue('');
  await expect(page.locator('#fEmail')).toHaveValue('');
  await expect(page.locator('#fValue')).toHaveValue('0');
  await page.locator('#drawerCancel').click();
});


test('B07.7 invoice create/edit calculates lines discount tax and status', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));

  await page.goto('http://127.0.0.1:4173/app/index.html');
  await page.waitForLoadState('networkidle');

  await page.locator('#nav button[data-screen="2"]').click();
  await page.getByRole('button', { name: /New client/i }).click();
  await page.locator('#fName').fill('B077 Client');
  await page.locator('#drawerSave').click();

  let stored = await page.evaluate(() => JSON.parse(localStorage.getItem('business-os-store-v1')));
  const client = stored.clients.find(x => x.name === 'B077 Client');
  expect(client).toBeTruthy();

  await page.locator('#nav button[data-screen="5"]').click();
  await page.getByRole('button', { name: /New invoice/i }).click();
  await page.locator('#fName').fill('B077 Invoice');
  await page.locator('#fClientId').selectOption(client.id);

  const line = page.locator('#fInvoiceLines .invoice-line').first();
  await line.locator('[data-line="description"]').fill('B077 Service');
  await line.locator('[data-line="quantity"]').fill('2');
  await line.locator('[data-line="unitPrice"]').fill('100');
  await page.locator('#fInvoiceDiscountType').selectOption('percent');
  await page.locator('#fInvoiceDiscountValue').fill('10');
  await page.locator('#fInvoiceTaxRate').fill('20');
  await page.locator('#fStatus').selectOption('Sent');
  await page.locator('#drawerSave').click();

  stored = await page.evaluate(() => JSON.parse(localStorage.getItem('business-os-store-v1')));
  let invoice = stored.invoices.find(x => x.name === 'B077 Invoice');
  expect(invoice).toBeTruthy();
  expect(invoice.clientId).toBe(client.id);
  expect(invoice.lineItems).toHaveLength(1);
  expect(invoice.lineItems[0]).toMatchObject({ description: 'B077 Service', quantity: 2, unitPrice: 100 });
  expect(invoice.discountType).toBe('percent');
  expect(invoice.discountValue).toBe(10);
  expect(invoice.taxRate).toBe(20);
  expect(invoice.value).toBe(216);
  expect(invoice.amount).toBe(216);
  expect(invoice.status).toBe('Sent');

  const invoiceRow = page.locator('#invoicesScreen tbody tr').filter({ hasText: 'B077 Invoice' }).first();
  await expect(invoiceRow).toContainText('€216');

  await invoiceRow.click();
  await expect(page.locator('#detailDrawer')).toHaveClass(/open/);
  await page.locator('#fInvoiceDiscountValue').fill('20');
  await page.locator('#fInvoiceTaxRate').fill('10');
  await page.locator('#drawerSave').click();

  stored = await page.evaluate(() => JSON.parse(localStorage.getItem('business-os-store-v1')));
  invoice = stored.invoices.find(x => x.name === 'B077 Invoice');
  expect(invoice.discountValue).toBe(20);
  expect(invoice.taxRate).toBe(10);
  expect(invoice.value).toBe(198);
  expect(invoice.amount).toBe(198);
  expect(invoice.status).toBe('Sent');

  await page.getByRole('button', { name: /New invoice/i }).click();
  await page.locator('#fName').fill('B077 Invalid Tax');
  await page.locator('#fClientId').selectOption(client.id);
  await page.locator('#fInvoiceLines .invoice-line [data-line="description"]').fill('Invalid tax test');
  await page.locator('#fInvoiceLines .invoice-line [data-line="quantity"]').fill('1');
  await page.locator('#fInvoiceLines .invoice-line [data-line="unitPrice"]').fill('100');
  await page.locator('#fInvoiceTaxRate').fill('101');
  await page.locator('#drawerSave').click();

  stored = await page.evaluate(() => JSON.parse(localStorage.getItem('business-os-store-v1')));
  expect(stored.invoices.some(x => x.name === 'B077 Invalid Tax')).toBeFalsy();
  expect(errors).toEqual([]);
});
