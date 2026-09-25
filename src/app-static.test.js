import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const appPath = new URL('../app/index.html', import.meta.url);
const html = fs.readFileSync(appPath, 'utf8');

test('app module script is syntactically valid JavaScript', () => {
  const match = html.match(/<script type="module">([\s\S]*?)<\/script>/);
  assert.ok(match, 'module script must exist');
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
  for (const key of ['dashboard','leadsTitle','clientsTitle','proposalsTitle','projectsTitle','invoicesTitle','paymentsTitle','expensesTitle','profitTitle','cashflowTitle','settingsTitle']) {
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
