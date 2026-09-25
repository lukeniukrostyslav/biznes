import { test, expect } from 'playwright/test';

test.describe('B14 functional acceptance flows', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/app/index.html');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('creates a lead and persists it locally', async ({ page }) => {
    await page.locator('#nav button[data-screen="1"]').click();
    await page.locator('button[data-i18n="newLead"]').click();
    await expect(page.locator('#detailDrawer')).toHaveClass(/open/);
    await page.locator('#fName').fill('B14 E2E Lead');
    await page.locator('#fCompany').fill('B14 Test Company');
    await page.locator('#fEmail').fill('b14@example.test');
    await page.locator('#fValue').fill('1250');
    await page.locator('#drawerSave').click();
    await expect(page.locator('#detailDrawer')).not.toHaveClass(/open/);
    await expect(page.locator('#leadsPipeline')).toContainText('B14 E2E Lead');

    const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('business-os-store-v1')));
    expect(stored.leads.some(item => item.name === 'B14 E2E Lead')).toBeTruthy();
  });

  test('creates a project with financial inputs and exposes project metrics', async ({ page }) => {
    await page.locator('#nav button[data-screen="4"]').click();
    await page.locator('button[data-i18n="newProject"]').click();
    await page.locator('#fName').fill('B14 E2E Project');
    await page.locator('#fStatus').selectOption('Active');
    await page.locator('#fProjectBudget').fill('5000');
    await page.locator('#fProjectRevenue').fill('5000');
    await page.locator('#fProjectActualCosts').fill('1200');
    await page.locator('#fProjectActualHours').fill('20');
    await page.locator('#fProjectLabourRate').fill('30');
    await page.locator('#drawerSave').click();
    await expect(page.locator('#projectsScreen')).toContainText('B14 E2E Project');
    await expect(page.locator('#projectsContracted')).toContainText('€');
    await expect(page.locator('#projectsExpectedProfit')).toContainText('€');
  });

  test('invoice form exposes line items, tax, discount and payment plan controls', async ({ page }) => {
    await page.locator('#nav button[data-screen="5"]').click();
    await page.locator('button[data-i18n="newInvoice"]').click();
    await expect(page.locator('#fInvoiceLines')).toBeVisible();
    await expect(page.locator('#addInvoiceLine')).toBeVisible();
    await expect(page.locator('#fInvoiceDiscountType')).toBeVisible();
    await expect(page.locator('#fInvoiceTaxRate')).toBeVisible();
    await expect(page.locator('#fInvoiceDueDate')).toBeVisible();
    await expect(page.locator('#fInvoicePlanLines').locator('xpath=..')).toBeVisible();
    await page.locator('#addInvoicePlanLine').click();
    await expect(page.locator('#fInvoicePlanLines .plan-line')).toHaveCount(1);
    await page.locator('#addInvoiceLine').click();
    await expect(page.locator('#fInvoiceLines .invoice-line')).toHaveCount(2);
  });

  test('payment and expense forms expose their financial controls', async ({ page }) => {
    await page.locator('#nav button[data-screen="6"]').click();
    await page.locator('button[data-i18n="recordPayment"]').click();
    await expect(page.locator('#fPaymentAmount')).toBeVisible();
    await expect(page.locator('#fPaymentDate')).toBeVisible();
    await expect(page.locator('#fPaymentMethod')).toBeVisible();
    await page.locator('#drawerCancel').click();

    await page.locator('#nav button[data-screen="7"]').click();
    await page.locator('button[data-i18n="addExpense"]').click();
    await expect(page.locator('#fExpenseCategory')).toBeVisible();
    await expect(page.locator('#fExpenseDate')).toBeVisible();
    await expect(page.locator('#fExpenseBillable')).toBeVisible();
  });

  test('cashflow and profit export actions create downloadable reports', async ({ page }) => {
    await page.locator('#nav button[data-screen="9"]').click();
    const cashflowDownload = page.waitForEvent('download');
    await page.locator('#exportCashflow').click();
    await expect((await cashflowDownload).suggestedFilename()).toBe('business-os-cashflow-30d.csv');

    await page.locator('#nav button[data-screen="8"]').click();
    const profitDownload = page.waitForEvent('download');
    await page.locator('#exportProfitAnalysis').click();
    await expect((await profitDownload).suggestedFilename()).toBe('business-os-profit-analysis.csv');
  });

  test('invalid JSON import is rejected without replacing the current store', async ({ page }) => {
    await page.evaluate(() => localStorage.setItem('business-os-store-v1', JSON.stringify({
      schemaVersion: 2,
      clients: [{ id: 'client_keep', name: 'Keep Me' }],
      leads: [], proposals: [], projects: [], invoices: [], payments: [], expenses: [], archivedRecords: []
    })));
    await page.reload();
    await page.locator('#nav button[data-screen="10"]').click();
    await page.locator('#nav button[data-screen="10"]').click();
    await page.locator('#settingsImportData').click();
    const input = page.locator('#importDataInput');
    await input.setInputFiles({
      name: 'invalid.json',
      mimeType: 'application/json',
      buffer: Buffer.from('{invalid json')
    });
    await expect(page.locator('#toast')).toContainText('Import error');
    const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('business-os-store-v1')));
    expect(stored.clients[0].name).toBe('Keep Me');
  });

  test('all supported languages remain usable across operational modules', async ({ page }) => {
    for (const code of ['en', 'es', 'de', 'fr', 'ru']) {
      await page.locator('#lang').selectOption(code);
      await expect(page.locator('#lang')).toHaveValue(code);
      for (const index of ['1', '3', '4', '5', '6', '7', '8', '9', '10']) {
        await page.locator(`#nav button[data-screen="${index}"]`).click();
        await expect(page.locator('.screen.active')).toBeVisible();
      }
      await expect(page.locator('#greeting')).not.toHaveText('');
    }
  });

  test('Russian operational UI translates static table headers', async ({ page }) => {
    await page.locator('#lang').selectOption('ru');
    const expected = [
      ['4', ['Проект', 'Прогресс', 'Выручка', 'Маржа']],
      ['5', ['Счёт', 'Статус', 'Сумма', 'Следующее действие', 'Запись']],
      ['3', ['Предложение', 'Статус', 'Сумма', 'Следующее действие', 'Действие', 'Запись']],
      ['6', ['Платёж', 'Статус', 'Сумма', 'Следующее действие', 'Запись']],
      ['7', ['Расход', 'Статус', 'Сумма', 'Следующее действие', 'Запись']]
    ];
    for (const [index, labels] of expected) {
      await page.locator(`#nav button[data-screen="${index}"]`).click();
      for (const label of labels) await expect(page.locator('.screen.active')).toContainText(label);
    }
  });

  test('no horizontal overflow across primary mobile screens', async ({ page }) => {
    await page.setViewportSize({ width: 1200, height: 900 });
    for (const index of ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10']) {
      await page.locator(`#nav button[data-screen="${index}"]`).click();
      await page.setViewportSize({ width: 390, height: 844 });
      const overflow = await page.evaluate(() =>
        document.documentElement.scrollWidth > document.documentElement.clientWidth + 1
      );
      expect(overflow, `horizontal overflow on screen ${index}`).toBeFalsy();
      await page.setViewportSize({ width: 1200, height: 900 });
    }
  });

  test('browser runtime audit remains clean on dashboard and module navigation', async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    for (const index of ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10']) {
      await page.locator(`#nav button[data-screen="${index}"]`).click();
      await expect(page.locator('.screen.active')).toBeVisible();
    }
    expect(errors, errors.join('\n')).toEqual([]);
  });
});
