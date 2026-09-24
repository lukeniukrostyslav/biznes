import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateInvoice, calculateProjectProfit, calculatePipeline, calculateCashflow, calculateBusinessMetrics, lineTotal } from './financial-engine.js';

test('line total', () => assert.equal(lineTotal({ quantity: 3, unitPrice: 120 }), 360));

test('invoice subtotal, tax and outstanding', () => {
  const result = calculateInvoice({ lineItems: [{ quantity: 2, unitPrice: 500 }, { quantity: 1, unitPrice: 250 }], taxRate: 20, paid: 600, status: 'Sent' });
  assert.equal(result.subtotal, 1250);
  assert.equal(result.tax, 250);
  assert.equal(result.total, 1500);
  assert.equal(result.outstanding, 900);
  assert.equal(result.status, 'Partially Paid');
});

test('project profit and margin', () => {
  const result = calculateProjectProfit({ revenue: 10000, actualCosts: 1800, actualHours: 60, labourRate: 35 });
  assert.equal(result.labourCost, 2100);
  assert.equal(result.profit, 6100);
  assert.equal(result.margin, 61);
});

test('zero revenue has no margin', () => {
  assert.equal(calculateProjectProfit({ revenue: 0, actualCosts: 100 }).margin, null);
});

test('weighted pipeline', () => {
  const result = calculatePipeline([{ value: 10000, probability: 60 }, { value: 5000, probability: 20 }]);
  assert.equal(result.pipeline, 15000);
  assert.equal(result.weightedPipeline, 7000);
});

test('cashflow separates paid and outstanding', () => {
  const result = calculateCashflow([{ total: 1500 }, { total: 500 }], [{ amount: 1200 }], [{ amount: 300 }]);
  assert.equal(result.invoiced, 2000);
  assert.equal(result.paid, 1200);
  assert.equal(result.outstanding, 800);
  assert.equal(result.expenses, 300);
  assert.equal(result.profit, 900);
});


test('business metrics use invoice engine and separate actual from forecast',()=>{
  const result=calculateBusinessMetrics({
    leads:[{value:10000,probability:50}],
    invoices:[{lineItems:[{quantity:1,unitPrice:1000}],taxRate:0,status:'Sent',dueDate:'2099-01-01'}],
    payments:[{amount:300}],
    expenses:[{amount:100,status:'Paid'},{amount:50,status:'Planned'}]
  },new Date('2026-01-01'));
  assert.equal(result.invoiced,1000);
  assert.equal(result.paid,300);
  assert.equal(result.outstanding,700);
  assert.equal(result.actualProfit,200);
  assert.equal(result.expectedPayments,700);
  assert.equal(result.plannedExpenses,50);
  assert.equal(result.forecastCash,850);
  assert.equal(result.weightedPipeline,5000);
});


test('business metrics derive invoice balance from linked payments', () => {
  const result = calculateBusinessMetrics({
    invoices: [
      { id: 'inv-1', lineItems: [{ quantity: 1, unitPrice: 1000 }], status: 'Sent', paid: 999 },
      { id: 'inv-2', lineItems: [{ quantity: 1, unitPrice: 500 }], status: 'Sent', paid: 500 }
    ],
    payments: [
      { id: 'pay-1', invoiceId: 'inv-1', amount: 250 },
      { id: 'pay-2', invoiceId: 'inv-2', amount: 100 }
    ],
    expenses: [
      { amount: 100, status: 'Paid' },
      { amount: 50, status: 'Planned' }
    ]
  }, new Date('2026-01-01'));

  assert.equal(result.invoiced, 1500);
  assert.equal(result.paid, 350);
  assert.equal(result.outstanding, 1150);
  assert.equal(result.expectedPayments, 1150);
  assert.equal(result.actualProfit, 250);
  assert.equal(result.forecastCash, 1150);
});

test('planned expenses are not double-counted in actual profit', () => {
  const result = calculateBusinessMetrics({
    payments: [{ amount: 1000 }],
    expenses: [{ amount: 200, status: 'Paid' }, { amount: 300, status: 'Planned' }]
  }, new Date('2026-01-01'));

  assert.equal(result.actualProfit, 800);
  assert.equal(result.plannedExpenses, 300);
  assert.equal(result.forecastCash, 500);
});

test('overdue metric uses supplied current date', () => {
  const result = calculateBusinessMetrics({
    invoices: [{
      id: 'inv-overdue',
      lineItems: [{ quantity: 1, unitPrice: 1000 }],
      status: 'Sent',
      dueDate: '2026-01-10'
    }]
  }, new Date('2026-02-01'));

  assert.equal(result.overdue, 1000);
});


test('overdue uses linked payments instead of stale invoice paid field', () => {
  const result = calculateBusinessMetrics({
    invoices: [{
      id: 'inv-overdue-linked',
      lineItems: [{ quantity: 1, unitPrice: 1000 }],
      paid: 900,
      status: 'Sent',
      dueDate: '2026-01-10'
    }],
    payments: [{ id: 'pay-1', invoiceId: 'inv-overdue-linked', amount: 250 }]
  }, new Date('2026-02-01'));

  assert.equal(result.outstanding, 750);
  assert.equal(result.overdue, 750);
});
