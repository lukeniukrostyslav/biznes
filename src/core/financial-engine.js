function roundMoney(value, decimals = 2) {
  const factor = 10 ** decimals;
  return Math.round((Number(value) + Number.EPSILON) * factor) / factor;
}

function lineTotal(line) {
  return roundMoney(Number(line.quantity || 0) * Number(line.unitPrice || 0));
}

function calculateInvoice(invoice) {
  const items = Array.isArray(invoice.lineItems) ? invoice.lineItems : [];
  const subtotal = roundMoney(items.reduce((sum, item) => sum + lineTotal(item), 0));
  const tax = roundMoney(subtotal * (Number(invoice.taxRate || 0) / 100));
  const total = roundMoney(subtotal + tax);
  const paid = roundMoney(Number(invoice.paid || 0));
  const outstanding = roundMoney(Math.max(total - paid, 0));

  let status = invoice.status || 'Draft';
  if (status !== 'Cancelled' && status !== 'Draft') {
    if (outstanding <= 0 && total > 0) status = 'Paid';
    else if (paid > 0) status = 'Partially Paid';
    else if (invoice.dueDate && new Date(invoice.dueDate) < new Date() && total > 0) status = 'Overdue';
    else status = 'Sent';
  }

  return { subtotal, tax, total, paid, outstanding, status };
}

function calculateProjectProfit(project) {
  const revenue = Number(project.revenue || 0);
  const actualCosts = Number(project.actualCosts || 0);
  const actualHours = Number(project.actualHours || 0);
  const labourRate = Number(project.labourRate || 0);
  const labourCost = roundMoney(actualHours * labourRate);
  const profit = roundMoney(revenue - actualCosts - labourCost);
  const margin = revenue > 0 ? roundMoney((profit / revenue) * 100) : null;
  return { revenue: roundMoney(revenue), actualCosts: roundMoney(actualCosts), labourCost, profit, margin };
}

function calculatePipeline(opportunities) {
  const list = Array.isArray(opportunities) ? opportunities : [];
  const pipeline = roundMoney(list.reduce((sum, item) => sum + Number(item.value || 0), 0));
  const weightedPipeline = roundMoney(list.reduce((sum, item) => sum + Number(item.value || 0) * (Number(item.probability || 0) / 100), 0));
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

function formatMoney(value, currency = 'EUR', locale = 'en-US') {
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(Number(value || 0));
}

export { roundMoney, lineTotal, calculateInvoice, calculateProjectProfit, calculatePipeline, calculateCashflow, formatMoney };
