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
  const tax = roundMoney(subtotal * (Number(invoice.taxRate || 0) / 100));
  const total = roundMoney(subtotal + tax);
  const paid = roundMoney(Number(invoice.paid || 0));
  const outstanding = roundMoney(Math.max(total - paid, 0));

  let status = invoice.status || 'Draft';
  if (status !== 'Cancelled') {
    if (outstanding <= 0 && total > 0) status = 'Paid';
    else if (paid > 0) status = 'Partially Paid';
    else if (status !== 'Draft' && invoice.dueDate && new Date(invoice.dueDate) < now && total > 0) status = 'Overdue';
    else if (status !== 'Draft') status = 'Sent';
  }

  return { subtotal, tax, total, paid, outstanding, status };
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

export { roundMoney, lineTotal, calculateInvoice, calculateInvoicePaymentStatus, calculateProjectProfit, calculatePipeline, calculateCashflow, formatMoney, calculateBusinessMetrics };
