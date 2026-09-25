import { test, expect } from 'playwright/test';

const unique = (prefix) => `${prefix} ${Date.now()}-${Math.floor(Math.random() * 10000)}`;

async function openCreate(page, screen, key) {
  await page.locator(`#nav button[data-screen="${screen}"]`).click();
  await page.locator(`button[data-i18n="${key}"]`).click();
  await expect(page.locator('#detailDrawer')).toHaveClass(/open/);
}

async function saveNamed(page, name) {
  await page.locator('#fName').fill(name);
  await page.locator('#drawerSave').click();
  await expect(page.locator('#detailDrawer')).not.toHaveClass(/open/);
}

async function editAndVerify(page, screen, original, updated) {
  await page.locator(`#nav button[data-screen="${screen}"]`).click();
  const row = page.locator('[data-record-id]').filter({ hasText: original }).first();
  await expect(row).toBeVisible();
  await row.click();
  await expect(page.locator('#detailDrawer')).toHaveClass(/open/);
  await page.locator('#fName').fill(updated);
  await page.locator('#drawerSave').click();
  await expect(page.locator('#detailDrawer')).not.toHaveClass(/open/);
  await expect(page.locator('[data-record-id]').filter({ hasText: updated }).first()).toBeVisible();
}

async function cancelEditAndVerify(page, screen, currentName) {
  await page.locator(`#nav button[data-screen="${screen}"]`).click();
  const row = page.locator('[data-record-id]').filter({ hasText: currentName }).first();
  await row.click();
  if (screen === '2') {
    await expect(page.locator('#entityScreen')).toHaveClass(/active/);
    await page.locator('#entityEdit').click();
  }
  await expect(page.locator('#detailDrawer')).toHaveClass(/open/);
  await page.locator('#fName').fill('SHOULD NOT BE SAVED');
  await page.locator('#drawerCancel').click();
  await expect(page.locator('#detailDrawer')).not.toHaveClass(/open/);
  if (screen === '2') {
    await page.locator('#entityBack').click();
    await expect(page.locator('#entityScreen')).not.toHaveClass(/active/);
  }
  await expect(page.locator('[data-record-id]').filter({ hasText: currentName }).first()).toBeVisible();
  await expect(page.locator('[data-record-id]').filter({ hasText: 'SHOULD NOT BE SAVED' })).toHaveCount(0);
}

test.describe('LQ04 CRUD acceptance — create / edit / save / cancel', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/app/index.html');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForLoadState('networkidle');
  });

  test('Lead full CRUD flow', async ({ page }) => {
    const original = unique('LQ04 Lead');
    const updated = original + ' Updated';
    await openCreate(page, '1', 'newLead');
    await saveNamed(page, original);
    await editAndVerify(page, '1', original, updated);
    await cancelEditAndVerify(page, '1', updated);
  });

  test('Client full CRUD flow through entity detail', async ({ page }) => {
    const original = unique('LQ04 Client');
    const updated = original + ' Updated';
    await openCreate(page, '2', 'newClient');
    await saveNamed(page, original);
    await page.locator('#nav button[data-screen="2"]').click();
    const row = page.locator('[data-record-id]').filter({ hasText: original }).first();
    await row.click();
    await expect(page.locator('#entityScreen')).toHaveClass(/active/);
    await page.locator('#entityEdit').click();
    await page.locator('#fName').fill(updated);
    await page.locator('#drawerSave').click();
    await expect(page.locator('#detailDrawer')).not.toHaveClass(/open/);
    await expect(page.locator('#clientsScreen')).toContainText(updated);
    await cancelEditAndVerify(page, '2', updated);
  });

  test('Proposal full CRUD flow', async ({ page }) => {
    const original = unique('LQ04 Proposal');
    const updated = original + ' Updated';
    await openCreate(page, '3', 'newProposal');
    await saveNamed(page, original);
    await editAndVerify(page, '3', original, updated);
    await cancelEditAndVerify(page, '3', updated);
  });

  test('Project full CRUD flow', async ({ page }) => {
    const original = unique('LQ04 Project');
    const updated = original + ' Updated';
    await openCreate(page, '4', 'newProject');
    await page.locator('#fProjectBudget').fill('5000');
    await page.locator('#fProjectRevenue').fill('5000');
    await page.locator('#fProjectActualCosts').fill('1000');
    await saveNamed(page, original);
    await editAndVerify(page, '4', original, updated);
    await cancelEditAndVerify(page, '4', updated);
  });

  test('Invoice full CRUD flow', async ({ page }) => {
    const original = unique('LQ04 Invoice');
    const updated = original + ' Updated';
    await openCreate(page, '5', 'newInvoice');
    await page.locator('#fInvoiceLines .invoice-line input').first().fill('LQ04 service');
    await page.locator('#fInvoiceLines .invoice-line input').nth(1).fill('1');
    await page.locator('#fInvoiceLines .invoice-line input').nth(2).fill('1000');
    await saveNamed(page, original);
    await editAndVerify(page, '5', original, updated);
    await cancelEditAndVerify(page, '5', updated);
  });

  test('Payment create/edit/cancel flow', async ({ page }) => {
    const invoice = unique('LQ04 Invoice for Payment');
    const payment = unique('LQ04 Payment');
    const updated = payment + ' Updated';
    await openCreate(page, '5', 'newInvoice');
    await page.locator('#fInvoiceLines .invoice-line input').first().fill('LQ04 payment service');
    await page.locator('#fInvoiceLines .invoice-line input').nth(1).fill('1');
    await page.locator('#fInvoiceLines .invoice-line input').nth(2).fill('1000');
    await saveNamed(page, invoice);
    await openCreate(page, '6', 'recordPayment');
    await page.locator('#fInvoiceId').selectOption({ index: 1 });
    await page.locator('#fPaymentAmount').fill('500');
    await saveNamed(page, payment);
    await editAndVerify(page, '6', payment, updated);
    await cancelEditAndVerify(page, '6', updated);
  });

  test('Expense full CRUD flow', async ({ page }) => {
    const original = unique('LQ04 Expense');
    const updated = original + ' Updated';
    await openCreate(page, '7', 'addExpense');
    await page.locator('#fValue').fill('150');
    await saveNamed(page, original);
    await editAndVerify(page, '7', original, updated);
    await cancelEditAndVerify(page, '7', updated);
  });
});
