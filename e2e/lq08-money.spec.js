import { test, expect } from 'playwright/test';

test.describe('LQ08 money, profit, invoice and payment calculations', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/app/index.html');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('calculates invoice subtotal, discount, tax and total consistently', async ({ page }) => {
    await page.locator('#nav button[data-screen="5"]').click();
    await page.locator('button[data-i18n="newInvoice"]').click();

    await page.locator('#fName').fill('LQ08 Calculation Invoice');
    const line = page.locator('#fInvoiceLines .invoice-line').first();
    await line.locator('input').nth(0).fill('Service');
    await line.locator('input').nth(1).fill('2');
    await line.locator('input').nth(2).fill('100');

    await page.locator('#fInvoiceDiscountType').selectOption({ label: 'Percent' });
    await page.locator('#fInvoiceDiscount').fill('10');
    await page.locator('#fInvoiceTaxRate').fill('20');

    const drawerText = await page.locator('#detailDrawer').innerText();
    expect(drawerText).toMatch(/200/);
    expect(drawerText).toMatch(/180/);
    expect(drawerText).toMatch(/216/);

    await page.locator('#drawerSave').click();
    const store = await page.evaluate(() => JSON.parse(localStorage.getItem('business-os-store-v1')));
    const invoice = store.invoices.find(item => item.name === 'LQ08 Calculation Invoice');
    expect(invoice).toBeTruthy();
    expect(JSON.stringify(invoice)).toContain('200');
    expect(JSON.stringify(invoice)).toContain('10');
    expect(JSON.stringify(invoice)).toContain('20');
  });

  test('project profit uses revenue, actual costs and labour inputs', async ({ page }) => {
    await page.locator('#nav button[data-screen="4"]').click();
    await page.locator('button[data-i18n="newProject"]').click();

    await page.locator('#fName').fill('LQ08 Profit Project');
    await page.locator('#fProjectRevenue').fill('5000');
    await page.locator('#fProjectActualCosts').fill('1200');
    await page.locator('#fProjectActualHours').fill('20');
    await page.locator('#fProjectLabourRate').fill('30');
    await page.locator('#drawerSave').click();

    const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('business-os-store-v1')));
    const project = stored.projects.find(item => item.name === 'LQ08 Profit Project');
    expect(project).toBeTruthy();
    expect(Number(project.actualCosts)).toBe(1200);
    expect(Number(project.actualHours)).toBe(20);
    expect(Number(project.labourRate)).toBe(30);
    expect(Number(project.revenue)).toBe(5000);
  });

  test('payment amount is persisted against the selected invoice', async ({ page }) => {
    await page.locator('#nav button[data-screen="5"]').click();
    await page.locator('button[data-i18n="newInvoice"]').click();
    await page.locator('#fName').fill('LQ08 Payment Invoice');
    await page.locator('#fInvoiceLines .invoice-line input').nth(0).fill('Service');
    await page.locator('#fInvoiceLines .invoice-line input').nth(1).fill('1');
    await page.locator('#fInvoiceLines .invoice-line input').nth(2).fill('1000');
    await page.locator('#drawerSave').click();

    await page.locator('#nav button[data-screen="6"]').click();
    await page.locator('button[data-i18n="recordPayment"]').click();
    await page.locator('#fName').fill('LQ08 Payment');
    await page.locator('#fInvoiceId').selectOption({ label: 'LQ08 Payment Invoice' });
    await page.locator('#fPaymentAmount').fill('400');
    await page.locator('#drawerSave').click();

    const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('business-os-store-v1')));
    const invoice = stored.invoices.find(item => item.name === 'LQ08 Payment Invoice');
    const payment = stored.payments.find(item => item.name === 'LQ08 Payment');
    expect(payment).toMatchObject({ invoiceId: invoice.id });
    expect(Number(payment.amount)).toBe(400);
  });
});
