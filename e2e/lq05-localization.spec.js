import { test, expect } from 'playwright/test';

test.describe('LQ05 localization acceptance', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/app/index.html');
    await page.waitForLoadState('networkidle');
  });

  test('all five locales expose translated operational UI', async ({ page }) => {
    const operationalScreens = ['0','1','2','3','4','5','6','7','8','9','10'];
    for (const code of ['en','ru','es','de','fr']) {
      await page.locator('#lang').selectOption(code);
      await expect(page.locator('#lang')).toHaveValue(code);
      for (const screen of operationalScreens) {
        await page.locator(`#nav button[data-screen="${screen}"]`).click();
        const active = page.locator('.screen.active');
        await expect(active).toBeVisible();
        const untranslated = await active.locator('[data-ui]').evaluateAll(nodes =>
          nodes.filter(node => !(node.textContent || '').trim()).map(node => node.getAttribute('data-ui'))
        );
        expect(untranslated, `${code}: empty data-ui values on screen ${screen}`).toEqual([]);
      }
    }
  });

  test('Russian operational screens contain no known English UI phrases', async ({ page }) => {
    await page.locator('#lang').selectOption('ru');
    const forbidden = [
      'Dashboard','Leads','Clients','Proposals','Projects','Invoices','Payments','Expenses',
      'Profit','Cashflow','Settings','New lead','New client','New proposal','New project',
      'New invoice','Record payment','Add expense','Export','Import','This month','This year',
      'Revenue','Outstanding','Pipeline','Net Profit','Total Income','Total Expenses',
      'Follow-ups Today','Overdue Invoices','Project Profitability','Name','Status','Cancel','Save record'
    ];
    for (const screen of ['0','1','2','3','4','5','6','7','8','9','10']) {
      await page.locator(`#nav button[data-screen="${screen}"]`).click();
      const activeText = await page.locator('.screen.active').innerText();
      for (const phrase of forbidden) {
        expect(activeText, `Russian screen ${screen} still contains "${phrase}"`).not.toContain(phrase);
      }
    }
  });

  test('language switching keeps all operational controls usable', async ({ page }) => {
    for (const code of ['en','es','de','fr','ru']) {
      await page.locator('#lang').selectOption(code);
      await page.locator('#nav button[data-screen="1"]').click();
      await page.locator('button[data-i18n="newLead"]').click();
      await expect(page.locator('#detailDrawer')).toHaveClass(/open/);
      await expect(page.locator('#drawerSave')).toBeEnabled();
      await expect(page.locator('#drawerCancel')).toBeEnabled();
      await page.locator('#drawerCancel').click();
      await expect(page.locator('#detailDrawer')).not.toHaveClass(/open/);
    }
  });
});
