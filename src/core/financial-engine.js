function roundMoney(value, decimals = 2) {
  const factor = 10 ** decimals;
  return Math.round((Number(value) + Number.EPSILON) * factor) / factor;
}

function lineTotal(line) {
  return roundMoney(Number(line.quantity || 0) * Number(line.unitPrice || 0));
}

function calculateInvoice(invoice, now = new Date()) {
  const items = Array.isArray(invoice.lineItems) ? invoice.lineItems : [];
  const subtotal = roundMoney(items.reduce((sum, item) => sum + lineTotal(item), 0));
  const discountType = invoice.discountType === 'percent' ? 'percent' : invoice.discountType === 'fixed' ? 'fixed' : 'none';
  const rawDiscount = Math.max(Number(invoice.discountValue || 0), 0);
  const discount = roundMoney(Math.min(discountType === 'percent' ? subtotal * (rawDiscount / 100) : rawDiscount, subtotal));
  const taxableSubtotal = roundMoney(Math.max(subtotal - discount, 0));
  const tax = roundMoney(taxableSubtotal * (Number(invoice.taxRate || 0) / 100));
  const total = roundMoney(taxableSubtotal + tax);
  const paid = roundMoney(Number(invoice.paid || 0));
  const outstanding = roundMoney(Math.max(total - paid, 0));

  let status = invoice.status || 'Draft';
  if (status !== 'Cancelled') {
    if (outstanding <= 0 && total > 0) status = 'Paid';
    else if (paid > 0) status = 'Partially Paid';
    else if (status !== 'Draft' && invoice.dueDate && new Date(invoice.dueDate) < now && total > 0) status = 'Overdue';
    else if (status !== 'Draft') status = 'Sent';
  }

  return { subtotal, discount, discountType, discountValue: rawDiscount, taxableSubtotal, tax, total, paid, outstanding, status };
}

function calculatePaymentPlan(invoiceTotal, installments = [], now = new Date()) {
  const total = roundMoney(Math.max(Number(invoiceTotal || 0), 0));
  const source = Array.isArray(installments) ? installments : [];
  const fixed = source.filter(x => x.amountType === 'fixed').reduce((sum, x) => sum + Math.max(Number(x.amount || 0), 0), 0);
  const percentage = source.filter(x => x.amountType === 'percent').reduce((sum, x) => sum + Math.max(Number(x.amount || 0), 0), 0);
  const equal = source.filter(x => x.amountType === 'equal');
  const percentAmount = roundMoney(total * percentage / 100);
  const remainingForEqual = Math.max(total - fixed - percentAmount, 0);
  const equalAmount = equal.length ? roundMoney(remainingForEqual / equal.length) : 0;
  const calculated = source.map((item, index) => {
    const amount = item.amountType === 'fixed'
      ? Math.max(Number(item.amount || 0), 0)
      : item.amountType === 'percent'
        ? roundMoney(total * Math.max(Number(item.amount || 0), 0) / 100)
        : equalAmount;
    const dueDate = item.dueDate ? new Date(item.dueDate) : null;
    return { ...item, index, calculatedAmount: roundMoney(amount), overdue: Boolean(dueDate && dueDate < now && !item.paid) };
  });
  const plannedTotal = roundMoney(calculated.reduce((sum, item) => sum + item.calculatedAmount, 0));
  return {
    total,
    installments: calculated,
    plannedTotal,
    difference: roundMoney(total - plannedTotal),
    valid: Math.abs(total - plannedTotal) <= 0.01 && fixed <= total && percentage <= 100
  };
}

function allocatePaymentPlan(invoice, payments = [], now = new Date()) {
  const plan = calculatePaymentPlan(
    calculateInvoice(invoice, now).total,
    invoice && invoice.paymentPlan && Array.isArray(invoice.paymentPlan.installments) ? invoice.paymentPlan.installments : [],
    now
  );
  if (!plan.installments.length) return { ...plan, installments: [], allocatedPayments: 0, unallocatedPayments: 0 };
  const linked = (Array.isArray(payments) ? payments : [])
    .filter(payment => payment.invoiceId === invoice.id)
    .map(payment => ({ ...payment, amount: roundMoney(Math.max(Number(payment.amount || 0), 0)) }))
    .filter(payment => payment.amount > 0)
    .sort((a, b) => new Date(a.paymentDate || a.date || a.createdAt || 0) - new Date(b.paymentDate || b.date || b.createdAt || 0));

  const remaining = plan.installments.map(item => item.calculatedAmount);
  let allocatedPayments = 0;
  let unallocatedPayments = 0;
  const allocations = [];

  for (const payment of linked) {
    let amountLeft = payment.amount;
    const explicit = Number.isInteger(payment.installmentIndex) ? payment.installmentIndex : null;
    const order = explicit !== null ? [explicit, ...remaining.map((_, i) => i).filter(i => i !== explicit)] : remaining.map((_, i) => i);
    for (const index of order) {
      if (amountLeft <= 0.01 || index < 0 || index >= remaining.length) break;
      const applied = roundMoney(Math.min(amountLeft, Math.max(remaining[index], 0)));
      if (applied <= 0) continue;
      remaining[index] = roundMoney(Math.max(remaining[index] - applied, 0));
      amountLeft = roundMoney(amountLeft - applied);
      allocatedPayments = roundMoney(allocatedPayments + applied);
      allocations.push({ paymentId: payment.id, installmentIndex: index, amount: applied, explicit: explicit !== null });
    }
    if (amountLeft > 0.01) unallocatedPayments = roundMoney(unallocatedPayments + amountLeft);
  }

  const installments = plan.installments.map((item, index) => {
    const paid = roundMoney(item.calculatedAmount - remaining[index]);
    const outstanding = roundMoney(Math.max(item.calculatedAmount - paid, 0));
    const dueDate = item.dueDate ? new Date(item.dueDate) : null;
    let status = paid >= item.calculatedAmount - 0.01 ? 'Paid' : paid > 0 ? 'Partially Paid' : dueDate && dueDate < now ? 'Overdue' : dueDate && dueDate <= now ? 'Due' : 'Upcoming';
    if (status === 'Overdue' && paid > 0) status = 'Partially Paid';
    return { ...item, paid, outstanding, status };
  });
  return { ...plan, installments, allocations, allocatedPayments, unallocatedPayments };
}

function calculateInvoicePaymentStatus(invoice, payments = [], now = new Date()) {
  const linkedPayments = (Array.isArray(payments) ? payments : [])
    .filter(payment => payment.invoiceId === invoice.id);
  const linkedPaid = roundMoney(linkedPayments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0));
  return calculateInvoice({ ...invoice, paid: linkedPaid }, now);
}

function calculateProjectProfit(project, related = {}) {
  const revenue = Number(project.revenue || 0);
  const directCosts = Number(project.actualCosts || 0);
  const actualHours = Number(project.actualHours || 0);
  const labourRate = Number(project.labourRate || 0);
  const labourCost = roundMoney(actualHours * labourRate);
  const expenses = Array.isArray(related.expenses) ? related.expenses : [];
  const projectExpenses = expenses
    .filter(expense => expense.projectId === project.id && expense.status !== 'Planned' && expense.planned !== true)
    .reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
  const plannedExpenses = expenses
    .filter(expense => expense.projectId === project.id && (expense.status === 'Planned' || expense.planned === true))
    .reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
  const totalActualCosts = roundMoney(directCosts + projectExpenses + labourCost);
  const profit = roundMoney(revenue - totalActualCosts);
  const margin = revenue > 0 ? roundMoney((profit / revenue) * 100) : null;
  const budget = Number(project.budget || 0);
  const budgetUsed = project.budgetType === 'Time' ? actualHours : totalActualCosts;
  const budgetRemaining = budget > 0 ? roundMoney(Math.max(budget - budgetUsed, 0)) : null;
  const forecastCosts = roundMoney(totalActualCosts + plannedExpenses);
  const forecastProfit = roundMoney(revenue - forecastCosts);
  const forecastMargin = revenue > 0 ? roundMoney((forecastProfit / revenue) * 100) : null;
  return {
    revenue: roundMoney(revenue),
    actualCosts: totalActualCosts,
    directCosts: roundMoney(directCosts),
    projectExpenses: roundMoney(projectExpenses),
    plannedExpenses: roundMoney(plannedExpenses),
    labourCost,
    budget: roundMoney(budget),
    budgetUsed: roundMoney(budgetUsed),
    budgetRemaining,
    forecastCosts,
    forecastProfit,
    forecastMargin,
    profit,
    margin
  };
}

function calculatePipeline(opportunities) {
  const list = Array.isArray(opportunities) ? opportunities : [];
  const active = list.filter(item => {
    const status = String(item.status || '').toLowerCase();
    return !['won', 'lost', 'closed', 'cancelled'].includes(status);
  });
  const pipeline = roundMoney(active.reduce((sum, item) => sum + Number(item.value || 0), 0));
  const weightedPipeline = roundMoney(active.reduce((sum, item) => sum + Number(item.value || 0) * (Number(item.probability || 0) / 100), 0));
  return { pipeline, weightedPipeline };
}

function calculateCashflow(invoices, payments, expenses) {
  const inv = Array.isArray(invoices) ? invoices : [];
  const pay = Array.isArray(payments) ? payments : [];
  const exp = Array.isArray(expenses) ? expenses : [];
  const invoiced = roundMoney(inv.reduce((sum, x) => sum + Number(x.total || 0), 0));
  const paid = roundMoney(pay.reduce((sum, x) => sum + Number(x.amount || 0), 0));
  const expensesTotal = roundMoney(exp.reduce((sum, x) => sum + Number(x.amount || 0), 0));
  const outstanding = roundMoney(Math.max(invoiced - paid, 0));
  const profit = roundMoney(paid - expensesTotal);
  return { invoiced, paid, outstanding, expenses: expensesTotal, profit };
}

function calculateCashflowForecast(store, now = new Date(), horizonDays = 30) {
  const source = store && typeof store === 'object' ? store : {};
  const invoices = Array.isArray(source.invoices) ? source.invoices : [];
  const payments = Array.isArray(source.payments) ? source.payments : [];
  const expenses = Array.isArray(source.expenses) ? source.expenses : [];
  const horizon = new Date(now);
  horizon.setDate(horizon.getDate() + Math.max(Number(horizonDays || 0), 0));

  const events = [];
  for (const invoice of invoices) {
    const allocation = allocatePaymentPlan(invoice, payments, now);
    if (allocation.installments.length) {
      allocation.installments.forEach((item, index) => {
        if (item.outstanding <= 0) return;
        const dueDate = item.dueDate ? new Date(item.dueDate) : null;
        if (!dueDate || dueDate > horizon || dueDate < now) return;
        events.push({
          type: 'payment',
          date: dueDate.toISOString().slice(0, 10),
          amount: roundMoney(item.outstanding),
          invoiceId: invoice.id,
          installmentIndex: index,
          label: invoice.name || invoice.title || invoice.id,
          status: item.status
        });
      });
    } else {
      const metric = calculateInvoicePaymentStatus(invoice, payments, now);
      if (metric.outstanding > 0 && invoice.dueDate) {
        const dueDate = new Date(invoice.dueDate);
        if (dueDate >= now && dueDate <= horizon) {
          events.push({
            type: 'payment',
            date: dueDate.toISOString().slice(0, 10),
            amount: metric.outstanding,
            invoiceId: invoice.id,
            installmentIndex: null,
            label: invoice.name || invoice.title || invoice.id,
            status: metric.status
          });
        }
      }
    }
  }

  for (const expense of expenses) {
    if (expense.status !== 'Planned' && expense.planned !== true) continue;
    const dateValue = expense.expenseDate || expense.date;
    if (!dateValue) continue;
    const date = new Date(dateValue);
    if (date < now || date > horizon) continue;
    events.push({
      type: 'expense',
      date: date.toISOString().slice(0, 10),
      amount: roundMoney(Math.max(Number(expense.amount || 0), 0)),
      expenseId: expense.id,
      label: expense.name || expense.title || expense.id,
      status: 'Planned'
    });
  }

  events.sort((a, b) => a.date.localeCompare(b.date) || (a.type === 'expense' ? 1 : -1));
  const futureInflows = roundMoney(events.filter(x => x.type === 'payment').reduce((sum, x) => sum + x.amount, 0));
  const futureExpenses = roundMoney(events.filter(x => x.type === 'expense').reduce((sum, x) => sum + x.amount, 0));
  const actualExpenses = roundMoney(expenses.filter(x => x.status !== 'Planned' && x.planned !== true).reduce((sum, x) => sum + Number(x.amount || 0), 0));
  const actualPaid = roundMoney(payments.reduce((sum, x) => sum + Number(x.amount || 0), 0));
  const currentNetCash = roundMoney(actualPaid - actualExpenses);
  return {
    horizonDays: Math.max(Number(horizonDays || 0), 0),
    events,
    futureInflows,
    futureExpenses,
    currentNetCash,
    forecastNetCash: roundMoney(currentNetCash + futureInflows - futureExpenses)
  };
}

function calculateBusinessMetrics(store, now = new Date()) {
  const source = store && typeof store === 'object' ? store : {};
  const invoices = Array.isArray(source.invoices) ? source.invoices : [];
  const payments = Array.isArray(source.payments) ? source.payments : [];
  const expenses = Array.isArray(source.expenses) ? source.expenses : [];
  const leads = Array.isArray(source.leads) ? source.leads : [];

  const actualExpenses = expenses.filter(expense => expense.status !== 'Planned' && expense.planned !== true);
  const plannedExpensesList = expenses.filter(expense => expense.status === 'Planned' || expense.planned === true);

  const invoiceMetrics = invoices.map(invoice => {
    const linkedPaid = payments
      .filter(payment => payment.invoiceId === invoice.id)
      .reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
    return calculateInvoice({ ...invoice, paid: linkedPaid }, now);
  });
  const invoiced = roundMoney(invoiceMetrics.reduce((sum, metric) => sum + metric.total, 0));
  const paid = roundMoney(payments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0));
  const actualExpensesTotal = roundMoney(actualExpenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0));
  const plannedExpenses = roundMoney(plannedExpensesList.reduce((sum, expense) => sum + Number(expense.amount || 0), 0));
  const pipeline = calculatePipeline(leads);
  const outstanding = roundMoney(invoiceMetrics.reduce((sum, metric) => sum + metric.outstanding, 0));
  const actualProfit = roundMoney(paid - actualExpensesTotal);

  const expectedPayments = roundMoney(invoiceMetrics.reduce((sum, metric, index) => {
    const derivedStatus = String(metric.status || '').toLowerCase();
    return sum + (!['paid', 'cancelled'].includes(derivedStatus) ? metric.outstanding : 0);
  }, 0));

  const forecastCash = roundMoney(paid + expectedPayments - actualExpensesTotal - plannedExpenses);
  const overdue = roundMoney(invoiceMetrics.reduce((sum, metric, index) => {
    const invoice = invoices[index];
    return sum + (metric.outstanding > 0 && invoice.dueDate && new Date(invoice.dueDate) < now ? metric.outstanding : 0);
  }, 0));

  return {
    invoiced,
    paid,
    outstanding,
    expenses: actualExpensesTotal,
    actualProfit,
    pipeline: pipeline.pipeline,
    weightedPipeline: pipeline.weightedPipeline,
    expectedPayments,
    plannedExpenses,
    forecastCash,
    overdue
  };
}

function formatMoney(value, currency = 'EUR', locale = 'en-US') {
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(Number(value || 0));
}

export { roundMoney, lineTotal, calculateInvoice, calculatePaymentPlan, allocatePaymentPlan, calculateInvoicePaymentStatus, calculateProjectProfit, calculatePipeline, calculateCashflow, calculateCashflowForecast, formatMoney, calculateBusinessMetrics };
