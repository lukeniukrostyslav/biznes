import { test, expect } from 'playwright/test';

const unique = (prefix) => `${prefix} ${Date.now()}-${Math.floor(Math.random() * 10000)}`;

async function createRecord(page, screen, buttonKey, name, fields = {}) {
  await page.locator(`#nav button[data-screen="${screen}"]`).click();
  await page.locator(`button[data-i18n="${buttonKey}"]`).click();
  await expect(page.locator('#detailDrawer')).toHaveClass(/open/);
  await page.locator('#fName').fill(name);
  for (const [id, value] of Object.entries(fields)) {
    const locator = page.locator('#' + id);
    if (await locator.evaluate(el => el.tagName === 'SELECT')) await locator.selectOption({ label: value });
    else await locator.fill(String(value));
  }
  await page.locator('#drawerSave').click();
  await expect(page.locator('#detailDrawer')).not.toHaveClass(/open/);
}

test.describe('LQ06 lifecycle relationships — Lead → Client → Proposal → Project → Invoice → Payment → Expense', () => {
  test('persists and preserves the complete business lifecycle graph', async ({ page }) => {
    await page.goto('/app/index.html');
    await page.evaluate(() => localStorage.clear());
    await page.reload();

    const client = unique('LQ06 Client');
    const lead = unique('LQ06 Lead');
    const proposal = unique('LQ06 Proposal');
    const project = unique('LQ06 Project');
    const invoice = unique('LQ06 Invoice');
    const payment = unique('LQ06 Payment');
    const expense = unique('LQ06 Expense');

    await createRecord(page, '2', 'newClient', client);

    await createRecord(page, '1', 'newLead', lead, {
      fClientId: client,
      fValue: 5000,
      fProbability: 80
    });

    await createRecord(page, '3', 'newProposal', proposal, {
      fClientId: client,
      fLeadId: lead
    });

    await createRecord(page, '4', 'newProject', project, {
      fClientId: client,
      fProposalId: proposal,
      fProjectBudget: 5000,
      fProjectRevenue: 5000,
      fProjectActualCosts: 1000
    });

    await page.locator('#nav button[data-screen="5"]').click();
    await page.locator('button[data-i18n="newInvoice"]').click();
    await page.locator('#fName').fill(invoice);
    await page.locator('#fClientId').selectOption({ label: client });
    await page.locator('#fProposalId').selectOption({ label: proposal });
    await page.locator('#fProjectId').selectOption({ label: project });
    await page.locator('#fInvoiceLines .invoice-line input').first().fill('LQ06 service');
    await page.locator('#fInvoiceLines .invoice-line input').nth(1).fill('1');
    await page.locator('#fInvoiceLines .invoice-line input').nth(2).fill('5000');
    await page.locator('#drawerSave').click();
    await expect(page.locator('#detailDrawer')).not.toHaveClass(/open/);

    await createRecord(page, '6', 'recordPayment', payment, {
      fInvoiceId: invoice,
      fPaymentAmount: 2500
    });

    await createRecord(page, '7', 'addExpense', expense, {
      fClientId: client,
      fProjectId: project,
      fValue: 300
    });

    const store = await page.evaluate(() => JSON.parse(localStorage.getItem('business-os-store-v1')));
    const get = (collection, name) => store[collection].find(item => item.name === name);

    const c = get('clients', client);
    const l = get('leads', lead);
    const p = get('proposals', proposal);
    const pr = get('projects', project);
    const i = get('invoices', invoice);
    const pay = get('payments', payment);
    const ex = get('expenses', expense);

    expect(c).toBeTruthy();
    expect(l).toMatchObject({ clientId: c.id });
    expect(p).toMatchObject({ clientId: c.id, leadId: l.id });
    expect(pr).toMatchObject({ clientId: c.id, proposalId: p.id });
    expect(i).toMatchObject({ clientId: c.id, proposalId: p.id, projectId: pr.id });
    expect(pay).toMatchObject({ invoiceId: i.id });
    expect(ex).toMatchObject({ clientId: c.id, projectId: pr.id });

    await page.reload();
    const reloaded = await page.evaluate(() => JSON.parse(localStorage.getItem('business-os-store-v1')));
    expect(reloaded.clients.some(item => item.id === c.id)).toBeTruthy();
    expect(reloaded.leads.find(item => item.id === l.id).clientId).toBe(c.id);
    expect(reloaded.proposals.find(item => item.id === p.id).leadId).toBe(l.id);
    expect(reloaded.projects.find(item => item.id === pr.id).proposalId).toBe(p.id);
    expect(reloaded.invoices.find(item => item.id === i.id).projectId).toBe(pr.id);
    expect(reloaded.payments.find(item => item.id === pay.id).invoiceId).toBe(i.id);
    expect(reloaded.expenses.find(item => item.id === ex.id).projectId).toBe(pr.id);
  });
});
