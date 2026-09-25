import { test, expect } from 'playwright/test';
import fs from 'node:fs/promises';

test.describe('LQ07 persistence, reload, export and import', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/app/index.html');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('survives reload with created records and settings', async ({ page }) => {
    await page.locator('#lang').selectOption('ru');
    await page.locator('#nav button[data-screen="1"]').click();
    await page.locator('button[data-i18n="newLead"]').click();
    await page.locator('#fName').fill('LQ07 Persistence Lead');
    await page.locator('#fCompany').fill('LQ07 Company');
    await page.locator('#fEmail').fill('lq07@example.test');
    await page.locator('#fValue').fill('2750');
    await page.locator('#drawerSave').click();

    await page.reload();
    await expect(page.locator('#lang')).toHaveValue('ru');
    await page.locator('#nav button[data-screen="1"]').click();
    await expect(page.locator('#leadsPipeline')).toContainText('LQ07 Persistence Lead');

    const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('business-os-store-v1')));
    expect(stored.leads.some(item => item.name === 'LQ07 Persistence Lead')).toBeTruthy();
  });

  test('exports a complete JSON backup and imports it into a clean store', async ({ page }) => {
    await page.locator('#nav button[data-screen="2"]').click();
    await page.locator('button[data-i18n="newClient"]').click();
    await page.locator('#fName').fill('LQ07 Import Client');
    await page.locator('#fEmail').fill('import@example.test');
    await page.locator('#drawerSave').click();

    await page.locator('#nav button[data-screen="10"]').click();
    const downloadPromise = page.waitForEvent('download');
    await page.locator('#settingsExportData').click();
    const download = await downloadPromise;
    const sourcePath = await download.path();
    expect(sourcePath).toBeTruthy();

    const exportedText = await fs.readFile(sourcePath, 'utf8');
    const exported = JSON.parse(exportedText);
    expect(exported.schemaVersion).toBeTruthy();
    expect(exported.clients.some(item => item.name === 'LQ07 Import Client')).toBeTruthy();
    for (const collection of ['leads', 'clients', 'proposals', 'projects', 'invoices', 'payments', 'expenses']) {
      expect(Array.isArray(exported[collection]), `export collection missing: ${collection}`).toBeTruthy();
    }

    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.locator('#nav button[data-screen="10"]').click();

    const input = page.locator('#importDataInput');
    await input.setInputFiles({
      name: 'lq07-roundtrip.json',
      mimeType: 'application/json',
      buffer: Buffer.from(exportedText)
    });
    await expect(page.locator('#toast')).not.toContainText('Import error');
    await page.reload();
    await page.locator('#nav button[data-screen="2"]').click();
    await expect(page.locator('#clientsScreen')).toContainText('LQ07 Import Client');

    const restored = await page.evaluate(() => JSON.parse(localStorage.getItem('business-os-store-v1')));
    expect(restored.clients.some(item => item.name === 'LQ07 Import Client')).toBeTruthy();
  });

  test('rejects malformed and structurally invalid imports without data loss', async ({ page }) => {
    await page.locator('#nav button[data-screen="2"]').click();
    await page.locator('button[data-i18n="newClient"]').click();
    await page.locator('#fName').fill('LQ07 Keep Client');
    await page.locator('#drawerSave').click();

    await page.locator('#nav button[data-screen="10"]').click();
    const input = page.locator('#importDataInput');

    await input.setInputFiles({
      name: 'invalid.json',
      mimeType: 'application/json',
      buffer: Buffer.from('{invalid json')
    });
    await expect(page.locator('#toast')).toContainText('Import error');

    await input.setInputFiles({
      name: 'wrong-shape.json',
      mimeType: 'application/json',
      buffer: Buffer.from(JSON.stringify({ schemaVersion: 999, clients: 'not-an-array' }))
    });
    await expect(page.locator('#toast')).toContainText('Import error');

    const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('business-os-store-v1')));
    expect(stored.clients.some(item => item.name === 'LQ07 Keep Client')).toBeTruthy();
  });
});
