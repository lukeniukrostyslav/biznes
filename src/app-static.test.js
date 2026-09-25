import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const appPath = new URL('../app/index.html', import.meta.url);
const html = fs.readFileSync(appPath, 'utf8');

test('app module script is syntactically valid JavaScript', () => {
  const match = html.match(/<script type="module">([\\s\\S]*?)<\\/script>/);
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
