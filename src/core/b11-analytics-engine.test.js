import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getDashboardDateRange,
  isDateInRange,
  filterByDateRange,
  calculateDashboardAnalytics,
  buildDashboardSeries,
  getDashboardLabels,
  buildCashflowExportRows,
  buildProfitExportRows
} from './b11-analytics-engine.js';

const now = new Date('2026-09-25T12:00:00');

test('B11.11 date ranges are deterministic for month, quarter and year', () => {
  assert.equal(getDashboardDateRange('month', now).start.toISOString().slice(0, 10), '2026-09-01');
  assert.equal(getDashboardDateRange('quarter', now).start.toISOString().slice(0, 10), '2026-07-01');
  assert.equal(getDashboardDateRange('year', now).start.toISOString().slice(0, 10), '2026-01-01');
});

test('B11.12 range filtering accepts multiple date fields', () => {
  const range = getDashboardDateRange('month', now);
  const records = [{ date: '2026-09-03' }, { paymentDate: '2026-08-31' }, { createdAt: '2026-09-20' }];
  assert.equal(filterByDateRange(records, ['paymentDate', 'date', 'createdAt'], range).length, 2);
  assert.equal(isDateInRange('2026-09-20', range), true);
});

test('B11.13 dashboard analytics use the same scoped period', () => {
  const store = {
    invoices: [{ id: 'i1', total: 100, createdAt: '2026-09-10' }, { id: 'i2', total: 200, createdAt: '2026-08-10' }],
    payments: [{ id: 'p1', invoiceId: 'i1', amount: 60, paymentDate: '2026-09-11' }, { id: 'p2', invoiceId: 'i2', amount: 50, paymentDate: '2026-08-12' }],
    expenses: [{ id: 'e1', amount: 20, expenseDate: '2026-09-12' }, { id: 'e2', amount: 30, expenseDate: '2026-08-12' }],
    leads: [{ id: 'l1', value: 500, probability: 50, status: 'New' }]
  };
  const result = calculateDashboardAnalytics(store, 'month', now);
  assert.equal(result.invoiced, 100);
  assert.equal(result.paid, 60);
  assert.equal(result.outstanding, 40);
  assert.equal(result.expenses, 20);
  assert.equal(result.actualProfit, 40);
  assert.equal(result.pipeline, 500);
  assert.equal(result.weightedPipeline, 250);
});

test('B11.14 empty state is explicit', () => {
  const result = calculateDashboardAnalytics({}, 'month', now);
  assert.equal(result.empty, true);
  assert.deepEqual(result.counts, { invoices: 0, payments: 0, expenses: 0, activeLeads: 0 });
});

test('B11.15 invalid numeric values do not poison analytics', () => {
  const result = calculateDashboardAnalytics({
    payments: [{ amount: 'bad', paymentDate: '2026-09-05' }],
    expenses: [{ amount: 'bad', expenseDate: '2026-09-05' }]
  }, 'month', now);
  assert.equal(result.paid, 0);
  assert.equal(result.expenses, 0);
  assert.equal(result.actualProfit, 0);
});

test('B11.16 series is stable and contains only numeric aggregates', () => {
  const result = buildDashboardSeries({
    payments: [{ amount: 100, paymentDate: '2026-09-20' }],
    expenses: [{ amount: 30, expenseDate: '2026-09-21' }]
  }, 'year', now);
  assert.equal(result.length, 12);
  assert.equal(result[result.length - 1].income, 100);
  assert.equal(result[result.length - 1].expenses, 30);
  assert.equal(result[result.length - 1].net, 70);
});

test('B11.17 localization has all required languages', () => {
  for (const language of ['en', 'es', 'de', 'fr', 'ru']) {
    const labels = getDashboardLabels(language);
    assert.ok(labels.month);
    assert.ok(labels.quarter);
    assert.ok(labels.year);
    assert.ok(labels.empty);
  }
});

test('B11.18 exports are derived from the same analytics engine', () => {
  const store = {
    invoices: [{ id: 'i1', total: 100, createdAt: '2026-09-10' }],
    payments: [{ invoiceId: 'i1', amount: 80, paymentDate: '2026-09-11' }],
    expenses: [{ amount: 20, expenseDate: '2026-09-12' }]
  };
  const cash = buildCashflowExportRows(store, 'month', now);
  const profit = buildProfitExportRows(store, 'month', now);
  assert.equal(cash.find(x => x[0] === 'Paid')[1], 80);
  assert.equal(cash.find(x => x[0] === 'Actual Profit')[1], 60);
  assert.equal(profit.find(x => x[0] === 'Net Profit')[1], 60);
});
