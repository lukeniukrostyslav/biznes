import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateInvoice, calculateProjectProfit, calculatePipeline, calculateCashflow, calculateBusinessMetrics, lineTotal, allocatePaymentPlan, calculateCashflowForecast, calculatePaymentPlan } from './financial-engine.js';

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
  assert.equal(result.forecastCash, 1350);
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


test('project profit includes linked actual and planned expenses plus budget forecast', () => {
  const result = calculateProjectProfit({
    id: 'project-1',
    revenue: 5000,
    actualCosts: 200,
    actualHours: 10,
    labourRate: 100,
    budget: 1500,
    budgetType: 'Fee'
  }, {
    expenses: [
      { id: 'exp-1', projectId: 'project-1', amount: 300, status: 'Paid' },
      { id: 'exp-2', projectId: 'project-1', amount: 400, status: 'Planned' },
      { id: 'exp-3', projectId: 'other', amount: 900, status: 'Paid' }
    ]
  });

  assert.equal(result.labourCost, 1000);
  assert.equal(result.projectExpenses, 300);
  assert.equal(result.actualCosts, 1500);
  assert.equal(result.plannedExpenses, 400);
  assert.equal(result.profit, 3500);
  assert.equal(result.margin, 70);
  assert.equal(result.budgetUsed, 1500);
  assert.equal(result.budgetRemaining, 0);
  assert.equal(result.forecastCosts, 1900);
  assert.equal(result.forecastProfit, 3100);
  assert.equal(result.forecastMargin, 62);
});

test('time budget tracks actual hours and does not confuse hours with money', () => {
  const result = calculateProjectProfit({
    id: 'project-time',
    revenue: 3000,
    actualHours: 12,
    labourRate: 50,
    budget: 20,
    budgetType: 'Time'
  });

  assert.equal(result.budgetUsed, 12);
  assert.equal(result.budgetRemaining, 8);
  assert.equal(result.labourCost, 600);
});


test('invoice status transitions from Draft to Partially Paid or Paid from linked payments', () => {
  const partially = calculateBusinessMetrics({
    invoices: [{ id: 'draft-1', lineItems: [{ quantity: 1, unitPrice: 1000 }], status: 'Draft' }],
    payments: [{ invoiceId: 'draft-1', amount: 250 }]
  }, new Date('2026-01-01'));
  assert.equal(partially.outstanding, 750);
  assert.equal(partially.expectedPayments, 750);

  const paid = calculateBusinessMetrics({
    invoices: [{ id: 'draft-2', lineItems: [{ quantity: 1, unitPrice: 1000 }], status: 'Draft' }],
    payments: [{ invoiceId: 'draft-2', amount: 1000 }]
  }, new Date('2026-01-01'));
  assert.equal(paid.outstanding, 0);
  assert.equal(paid.expectedPayments, 0);
});

test('forecast payments use derived invoice status, not stale stored status', () => {
  const result = calculateBusinessMetrics({
    invoices: [{ id: 'stale-paid', lineItems: [{ quantity: 1, unitPrice: 1000 }], status: 'Paid', paid: 1000 }],
    payments: [{ invoiceId: 'stale-paid', amount: 250 }]
  }, new Date('2026-01-01'));
  assert.equal(result.outstanding, 750);
  assert.equal(result.expectedPayments, 750);
});

test('multi-line invoice calculates subtotal and tax correctly', () => {
  const result = calculateInvoice({
    lineItems: [
      { description: 'Design', quantity: 2, unitPrice: 500 },
      { description: 'Development', quantity: 3, unitPrice: 750 }
    ],
    taxRate: 20,
    status: 'Sent'
  });
  assert.equal(result.subtotal, 3250);
  assert.equal(result.tax, 650);
  assert.equal(result.total, 3900);
  assert.equal(result.outstanding, 3900);
});

test('invoice discount is applied before tax', () => {
  const result = calculateInvoice({
    lineItems: [{ quantity: 1, unitPrice: 1000 }],
    discountType: 'percent',
    discountValue: 10,
    taxRate: 20,
    status: 'Sent'
  });
  assert.equal(result.subtotal, 1000);
  assert.equal(result.discount, 100);
  assert.equal(result.taxableSubtotal, 900);
  assert.equal(result.tax, 180);
  assert.equal(result.total, 1080);
});

test('payment plan validates fixed, percentage and equal installments', () => {
  const result = calculatePaymentPlan(1000, [
    { amountType: 'fixed', amount: 200, dueDate: '2099-01-01' },
    { amountType: 'percent', amount: 30, dueDate: '2099-02-01' },
    { amountType: 'equal', amount: 0, dueDate: '2099-03-01' },
    { amountType: 'equal', amount: 0, dueDate: '2099-04-01' }
  ], new Date('2026-01-01'));
  assert.equal(result.plannedTotal, 1000);
  assert.equal(result.difference, 0);
  assert.equal(result.installments[0].calculatedAmount, 200);
  assert.equal(result.installments[1].calculatedAmount, 300);
  assert.equal(result.installments[2].calculatedAmount, 250);
  assert.equal(result.installments[3].calculatedAmount, 250);
  assert.equal(result.valid, true);
});

test('payment plan rejects percentages above 100%', () => {
  const result = calculatePaymentPlan(1000, [{ amountType: 'percent', amount: 110 }]);
  assert.equal(result.valid, false);
});


test('allocatePaymentPlan derives FIFO installment status and remaining balance', () => {
  const invoice = {
    id: 'inv_1',
    lineItems: [{ description: 'Project', quantity: 1, unitPrice: 1000 }],
    taxRate: 0,
    paymentPlan: {
      installments: [
        { amountType: 'equal', amount: 0, dueDate: '2026-09-20' },
        { amountType: 'equal', amount: 0, dueDate: '2026-10-20' }
      ]
    }
  };
  const result = allocatePaymentPlan(invoice, [
    { id: 'p1', invoiceId: 'inv_1', amount: 600, paymentDate: '2026-09-21' }
  ], new Date('2026-09-24T00:00:00Z'));
  assert.equal(result.installments[0].paid, 500);
  assert.equal(result.installments[0].status, 'Paid');
  assert.equal(result.installments[1].paid, 100);
  assert.equal(result.installments[1].status, 'Partially Paid');
  assert.equal(result.installments[1].outstanding, 400);
  assert.equal(result.unallocatedPayments, 0);
});

test('allocatePaymentPlan respects explicit installment and reports overflow as unallocated', () => {
  const invoice = {
    id: 'inv_2',
    lineItems: [{ description: 'Project', quantity: 1, unitPrice: 1000 }],
    paymentPlan: {
      installments: [
        { amountType: 'fixed', amount: 300, dueDate: '2026-09-20' },
        { amountType: 'fixed', amount: 700, dueDate: '2026-10-20' }
      ]
    }
  };
  const result = allocatePaymentPlan(invoice, [
    { id: 'p1', invoiceId: 'inv_2', amount: 350, installmentIndex: 0, paymentDate: '2026-09-24' },
    { id: 'p2', invoiceId: 'inv_2', amount: 800, installmentIndex: 1, paymentDate: '2026-09-24' }
  ], new Date('2026-09-24T00:00:00Z'));
  assert.equal(result.installments[0].paid, 300);
  assert.equal(result.installments[0].status, 'Paid');
  assert.equal(result.installments[1].paid, 700);
  assert.equal(result.installments[1].status, 'Paid');
  assert.equal(result.unallocatedPayments, 150);
});


test('cashflow forecast uses installment due dates and planned expenses within horizon', () => {
  const store = {
    invoices: [{
      id: 'inv_cf',
      name: 'Website',
      lineItems: [{ quantity: 1, unitPrice: 1000 }],
      taxRate: 0,
      paymentPlan: { installments: [
        { amountType: 'fixed', amount: 400, dueDate: '2026-09-27' },
        { amountType: 'fixed', amount: 600, dueDate: '2026-10-20' }
      ]}
    }],
    payments: [{ id: 'pay_cf', invoiceId: 'inv_cf', amount: 100, paymentDate: '2026-09-24' }],
    expenses: [{ id: 'exp_cf', name: 'Hosting', amount: 120, status: 'Planned', expenseDate: '2026-10-01' }]
  };
  const result = calculateCashflowForecast(store, new Date('2026-09-24T00:00:00Z'), 30);
  assert.equal(result.futureInflows, 900);
  assert.equal(result.futureExpenses, 120);
  assert.equal(result.forecastNetCash, 880);
  assert.equal(result.events.length, 3);
});
