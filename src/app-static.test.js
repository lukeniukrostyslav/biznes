import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const appPath = new URL('../app/index.html', import.meta.url);
const html = fs.readFileSync(appPath, 'utf8');

test('app runtime module is syntactically valid JavaScript', () => {
  const match = html.match(/<script type="module">([\s\S]*?)<\/script>/);
  assert.ok(match, 'runtime module script must exist');
  const file = path.join(os.tmpdir(), 'business-os-app-check.mjs');
  fs.writeFileSync(file, match[1], 'utf8');
  try { execFileSync(process.execPath, ['--check', file], { stdio: 'pipe' }); }
  finally { fs.rmSync(file, { force: true }); }
});

test('app exposes every primary navigation screen', () => {
  for (const id of ['dashboardScreen','leadsScreen','clientsScreen','proposalsScreen','projectsScreen','invoicesScreen','paymentsScreen','expensesScreen','profitScreen','cashflowScreen','settingsScreen']) {
    assert.match(html, new RegExp('id="' + id + '"'));
  }
});

test('app wires every primary create action to a collection', () => {
  for (const key of ['newLead','newClient','newProposal','newProject','newInvoice','recordPayment','addExpense']) {
    assert.match(html, new RegExp(key + ':'));
  }
});

test('dashboard and cashflow render functions stay explicitly wired', () => {
  for (const fn of ['renderCashflow','renderDashboardRealData','refreshDashboardMetrics','refreshDashboardVisuals','exportCashflowReport']) {
    assert.match(html, new RegExp('function\\s+' + fn + '\\s*\\('));
  }
  assert.match(html, /refreshDashboardMetrics\(\);/);
  assert.match(html, /refreshDashboardVisuals\(\);/);
  assert.match(html, /renderDashboardRealData\(\);/);
});


test('B13 responsive layout covers desktop, tablet and mobile breakpoints', () => {
  assert.match(html, /@media\(max-width:1050px\)/);
  assert.match(html, /@media\(max-width:900px\)/);
  assert.match(html, /@media\(max-width:720px\)/);
  assert.match(html, /@media\(max-width:600px\)/);
  assert.match(html, /\.table-card\{overflow:auto\}/);
  assert.match(html, /\.pipeline\{[^}]*overflow:auto/);
});

test('B13 focus and form accessibility hooks are present', () => {
  assert.match(html, /:focus-visible/);
  assert.match(html, /<label[^>]*data-ui="nameLabel"/);
  assert.match(html, /<input[^>]*type="email"/);
  assert.match(html, /<input[^>]*type="tel"/);
  assert.match(html, /<input[^>]*type="date"/);
  assert.match(html, /aria-label="Dashboard period"/);
  assert.match(html, /aria-label="Search leads"/);
  assert.match(html, /aria-label="Lead stage filter"/);
});

test('B13 localization covers all five required languages', () => {
  for (const lang of ['en','ru','es','de','fr']) {
    assert.match(html, new RegExp(lang + ':\\{'));
  }
  assert.match(html, /document\.documentElement\.lang=lang/);
});

test('B13 UI localization is wired across primary screens', () => {
  for (const key of ['leadsTitle','clientsTitle','proposalsTitle','projectsTitle','invoicesTitle','paymentsTitle','expensesTitle','profitTitle','cashflowTitle']) {
    assert.match(html, new RegExp('data-i18n="' + key + '"'));
  }
});

test('B13 long content and data tables remain horizontally safe', () => {
  assert.match(html, /overflow:auto/);
  assert.match(html, /overflow-x:auto|overflow:auto/);
  assert.match(html, /word-break|overflow-wrap|white-space:nowrap/);
});

test('B13 semantic form controls have explicit input types and labels', () => {
  const inputs = [...html.matchAll(/<input\b[^>]*>/g)].map(m => m[0]);
  assert.ok(inputs.some(x => /type="email"/.test(x)));
  assert.ok(inputs.some(x => /type="tel"/.test(x)));
  assert.ok(inputs.some(x => /type="date"/.test(x)));
  assert.ok(inputs.some(x => /type="number"/.test(x)));
  assert.match(html, /<label[^>]*>Name<\/label>|data-ui="nameLabel"/);
});


test('B14 functional flow wiring covers all primary entities', () => {
  for (const key of ['newLead','newClient','newProposal','newProject','newInvoice','recordPayment','addExpense']) {
    assert.match(html, new RegExp(key + ':'));
  }
  for (const fn of ['addRecord','openEditDrawer','renderStoredRecords','refreshDashboardMetrics','refreshDashboardVisuals','exportBusinessData','importBusinessData']) {
    assert.match(html, new RegExp('function\\s+' + fn + '\\s*\\('));
  }
});

test('B14 lifecycle conversions are wired to canonical engines', () => {
  assert.match(html, /buildProjectFromProposal/);
  assert.match(html, /buildInvoiceFromProject/);
  assert.match(html, /convertLeadToClient/);
  assert.match(html, /validateStoredRelationships/);
});

test('B14 persistence actions are wired to canonical persistence API', () => {
  for (const fn of ['loadPersistentStore','savePersistentStore','exportStore','importStore','archiveRecord','restoreRecord','validateStore']) {
    assert.match(html, new RegExp(fn));
  }
  assert.match(html, /localStorage/);
});

test('B14 financial lifecycle is wired to financial engine', () => {
  for (const fn of ['calculateBusinessMetrics','calculateProjectProfit','calculatePaymentPlan','allocatePaymentPlan','calculateCashflowForecast','calculateInvoicePaymentStatus','calculateInvoice']) {
    assert.match(html, new RegExp(fn));
  }
});

test('B14 dashboard analytics is wired to B11 engine', () => {
  for (const fn of ['calculateDashboardAnalytics','buildDashboardSeries','getDashboardLabels']) {
    assert.match(html, new RegExp(fn));
  }
  assert.match(html, /dashboardPeriod/);
});

test('B14 export workflows create user-downloadable files', () => {
  assert.match(html, /exportCashflowReport/);
  assert.match(html, /exportProfitAnalysis/);
  assert.match(html, /exportBusinessData/);
  assert.match(html, /URL\.createObjectURL/);
});

test('B14 validation and recovery UI hooks exist', () => {
  assert.match(html, /try\s*\{/);
  assert.match(html, /catch\s*\(/);
  assert.match(html, /toast\(/);
  assert.match(html, /No data yet|Пока нет данных/);
});

test('B14 required screens expose stable identifiers', () => {
  for (const id of ['dashboardScreen','leadsScreen','clientsScreen','proposalsScreen','projectsScreen','invoicesScreen','paymentsScreen','expensesScreen','profitScreen','cashflowScreen','settingsScreen']) {
    assert.match(html, new RegExp('id="' + id + '"'));
  }
});

test('B14 localization runtime supports all required languages', () => {
  for (const lang of ['en','ru','es','de','fr']) {
    assert.match(html, new RegExp(lang + ':\\{'));
  }
  assert.match(html, /let activeLanguage='en'/);
  assert.match(html, /document\.documentElement\.lang=lang/);
});

test('B14 responsive functional surfaces exist for desktop, tablet and mobile', () => {
  assert.match(html, /@media\(max-width:1050px\)/);
  assert.match(html, /@media\(max-width:900px\)/);
  assert.match(html, /@media\(max-width:720px\)/);
  assert.match(html, /@media\(max-width:600px\)/);
  assert.match(html, /\.drawer-panel/);
  assert.match(html, /\.table-card\{overflow:auto\}/);
});


test('production create bridge is exposed to the fallback click handler', () => {
  assert.match(html, /window\.openCreateDrawer\s*=\s*openCreateDrawer/);
  assert.doesNotMatch(html, /\}\);\\nfunction bindNav/);
  assert.doesNotMatch(html, /\n\s*\\n\s*const lower/);
});

test('fresh BUSINESS OS workspace is clean and contains no seeded demo records', () => {
  assert.match(html, /const EMPTY_STORE = Object\.freeze\(\{[\s\S]*clients: \[\][\s\S]*leads: \[\][\s\S]*proposals: \[\][\s\S]*projects: \[\][\s\S]*invoices: \[\][\s\S]*payments: \[\][\s\S]*expenses: \[\][\s\S]*\}\);/);
  assert.match(html, /function loadPersistentStore\(storage\)[\s\S]*if \(!raw\) return createEmptyStore\(\);/);
  for (const demoText of ['Rossi Studio','AB Design','Studio Nova','#INV-1048','Website redesign','Brand system','Landing page']) {
    assert.equal(html.includes(demoText), false, 'production app must not contain demo record: ' + demoText);
  }
});

test('empty workspace renders zero financial state before user data exists', () => {
  for (const id of ['metricRevenue','metricOutstanding','metricPipeline','metricProfit','dashIncome','dashExpenses','dashNetProfit','dashCashInBank','invoicesInvoiced','invoicesPaid','invoicesOutstanding','invoicesOverdue']) {
    assert.match(html, new RegExp('id="' + id + '">€0<'));
  }
});


test('commercial financial chain uses user records rather than seeded dashboard values', () => {
  assert.match(html, /calculateDashboardAnalytics\(store/);
  assert.match(html, /calculateBusinessMetrics\(store/);
  assert.match(html, /renderStoredRecords\(store/);
  assert.match(html, /refreshDashboardMetrics\(store/);
  for (const demoText of ['€24,680','€10,920','€8,420','€18,640','€31.4k','€14.8k','#INV-1048','Rossi Studio','AB Design']) {
    assert.equal(html.includes(demoText), false, 'commercial app must not ship hardcoded demo financial data: ' + demoText);
  }
});

test('commercial lifecycle exposes client-to-project-to-invoice-to-payment relations', () => {
  for (const fn of ['buildProjectFromProposal','buildInvoiceFromProject','calculateInvoicePaymentStatus','allocatePaymentPlan']) {
    assert.match(html, new RegExp('function\\s+' + fn + '\\s*\\('));
  }
  assert.match(html, /projectId/);
  assert.match(html, /invoiceId/);
  assert.match(html, /clientId/);
});

