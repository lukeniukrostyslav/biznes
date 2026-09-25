function roundMoney(value, decimals = 2) {
  const factor = 10 ** decimals;
  return Math.round((Number(value) + Number.EPSILON) * factor) / factor;
}

function asDate(value) {
  const date = value instanceof Date ? new Date(value) : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfDay(date) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

export function getDashboardDateRange(period = 'month', now = new Date()) {
  const current = asDate(now) || new Date();
  const year = current.getFullYear();
  const month = current.getMonth();
  let start;
  let end = endOfDay(current);

  if (period === 'quarter') {
    const quarterStartMonth = Math.floor(month / 3) * 3;
    start = new Date(year, quarterStartMonth, 1);
  } else if (period === 'year') {
    start = new Date(year, 0, 1);
  } else if (period === 'all') {
    start = new Date(0);
  } else {
    start = new Date(year, month, 1);
  }

  return { start: startOfDay(start), end };
}

export function isDateInRange(value, range) {
  const date = asDate(value);
  return Boolean(date && range && date >= range.start && date <= range.end);
}

export function filterByDateRange(records = [], dateFields = [], range) {
  const list = Array.isArray(records) ? records : [];
  return list.filter(record => dateFields.some(field => isDateInRange(record?.[field], range)));
}

function amount(value) {
  return Number.isFinite(Number(value)) ? Number(value) : 0;
}

export function calculateDashboardAnalytics(store = {}, period = 'month', now = new Date()) {
  const source = store && typeof store === 'object' ? store : {};
  const range = getDashboardDateRange(period, now);
  const invoices = Array.isArray(source.invoices) ? source.invoices : [];
  const payments = Array.isArray(source.payments) ? source.payments : [];
  const expenses = Array.isArray(source.expenses) ? source.expenses : [];
  const leads = Array.isArray(source.leads) ? source.leads : [];

  const scopedPayments = filterByDateRange(payments, ['paymentDate', 'date', 'createdAt'], range);
  const scopedExpenses = filterByDateRange(expenses, ['expenseDate', 'date', 'createdAt'], range);
  const scopedInvoices = filterByDateRange(invoices, ['issueDate', 'invoiceDate', 'createdAt'], range);
  const activeLeads = leads.filter(item => !['won', 'lost', 'closed', 'cancelled'].includes(String(item.status || '').toLowerCase()));

  const paid = roundMoney(scopedPayments.reduce((sum, item) => sum + amount(item.amount), 0));
  const expensesTotal = roundMoney(scopedExpenses
    .filter(item => item.status !== 'Planned' && item.planned !== true)
    .reduce((sum, item) => sum + amount(item.amount), 0));

  const invoiced = roundMoney(scopedInvoices.reduce((sum, invoice) => sum + amount(invoice.total ?? invoice.amount ?? invoice.value), 0));
  const outstanding = roundMoney(scopedInvoices.reduce((sum, invoice) => {
    const total = amount(invoice.total ?? invoice.amount ?? invoice.value);
    const linkedPaid = payments
      .filter(payment => payment.invoiceId === invoice.id)
      .reduce((totalPaid, payment) => totalPaid + amount(payment.amount), 0);
    return sum + Math.max(total - linkedPaid, 0);
  }, 0));

  const pipeline = roundMoney(activeLeads.reduce((sum, lead) => sum + amount(lead.value), 0));
  const weightedPipeline = roundMoney(activeLeads.reduce((sum, lead) => sum + amount(lead.value) * Math.max(0, Math.min(100, amount(lead.probability))) / 100, 0));
  const actualProfit = roundMoney(paid - expensesTotal);

  return {
    period,
    range,
    invoiced,
    paid,
    outstanding,
    expenses: expensesTotal,
    actualProfit,
    pipeline,
    weightedPipeline,
    counts: {
      invoices: scopedInvoices.length,
      payments: scopedPayments.length,
      expenses: scopedExpenses.length,
      activeLeads: activeLeads.length
    },
    empty: scopedInvoices.length === 0 && scopedPayments.length === 0 && scopedExpenses.length === 0 && activeLeads.length === 0
  };
}

export function buildDashboardSeries(store = {}, period = 'year', now = new Date()) {
  const source = store && typeof store === 'object' ? store : {};
  const current = asDate(now) || new Date();
  const buckets = [];
  const count = period === 'month' ? 4 : period === 'quarter' ? 3 : 12;
  const payments = Array.isArray(source.payments) ? source.payments : [];
  const expenses = Array.isArray(source.expenses) ? source.expenses : [];

  if (period === 'month') {
    for (let i = count - 1; i >= 0; i -= 1) {
      const end = new Date(current);
      end.setDate(end.getDate() - (i * 7));
      const start = new Date(end);
      start.setDate(start.getDate() - 6);
      buckets.push({ start: startOfDay(start), end: endOfDay(end), label: `W${count - i}`, income: 0, expenses: 0, net: 0 });
    }
  } else if (period === 'quarter') {
    for (let i = count - 1; i >= 0; i -= 1) {
      const d = new Date(current.getFullYear(), current.getMonth() - i, 1);
      buckets.push({ start: startOfDay(d), end: endOfDay(new Date(d.getFullYear(), d.getMonth() + 1, 0)), label: d.toLocaleString('en', { month: 'short' }), income: 0, expenses: 0, net: 0 });
    }
  } else {
    for (let i = count - 1; i >= 0; i -= 1) {
      const d = new Date(current.getFullYear(), current.getMonth() - i, 1);
      buckets.push({ start: startOfDay(d), end: endOfDay(new Date(d.getFullYear(), d.getMonth() + 1, 0)), label: d.toLocaleString('en', { month: 'short' }), income: 0, expenses: 0, net: 0 });
    }
  }

  payments.forEach(item => {
    const date = asDate(item.paymentDate || item.date || item.createdAt);
    if (!date) return;
    const bucket = buckets.find(x => date >= x.start && date <= x.end);
    if (bucket) bucket.income = roundMoney(bucket.income + amount(item.amount));
  });

  expenses.filter(item => item.status !== 'Planned' && item.planned !== true).forEach(item => {
    const date = asDate(item.expenseDate || item.date || item.createdAt);
    if (!date) return;
    const bucket = buckets.find(x => date >= x.start && date <= x.end);
    if (bucket) bucket.expenses = roundMoney(bucket.expenses + amount(item.amount));
  });

  return buckets.map(bucket => ({ ...bucket, net: roundMoney(bucket.income - bucket.expenses) }));
}

export function getDashboardLabels(language = 'en') {
  const labels = {
    en: { month: 'This month', quarter: 'This quarter', year: 'This year', all: 'All time', empty: 'No financial data for this period.' },
    ru: { month: 'Этот месяц', quarter: 'Этот квартал', year: 'Этот год', all: 'Всё время', empty: 'За этот период нет финансовых данных.' },
    es: { month: 'Este mes', quarter: 'Este trimestre', year: 'Este año', all: 'Todo el tiempo', empty: 'No hay datos financieros para este periodo.' },
    de: { month: 'Dieser Monat', quarter: 'Dieses Quartal', year: 'Dieses Jahr', all: 'Gesamtzeitraum', empty: 'Keine Finanzdaten für diesen Zeitraum.' },
    fr: { month: 'Ce mois', quarter: 'Ce trimestre', year: 'Cette année', all: 'Toute la période', empty: 'Aucune donnée financière pour cette période.' }
  };
  return labels[language] || labels.en;
}

export function buildCashflowExportRows(store = {}, period = 'month', now = new Date()) {
  const analytics = calculateDashboardAnalytics(store, period, now);
  return [
    ['Metric', 'Value'],
    ['Period', period],
    ['Invoiced', analytics.invoiced],
    ['Paid', analytics.paid],
    ['Outstanding', analytics.outstanding],
    ['Expenses', analytics.expenses],
    ['Actual Profit', analytics.actualProfit],
    ['Pipeline', analytics.pipeline],
    ['Weighted Pipeline', analytics.weightedPipeline]
  ];
}

export function buildProfitExportRows(store = {}, period = 'month', now = new Date()) {
  const analytics = calculateDashboardAnalytics(store, period, now);
  return [
    ['Metric', 'Value'],
    ['Period', period],
    ['Revenue / Paid', analytics.paid],
    ['Expenses', analytics.expenses],
    ['Net Profit', analytics.actualProfit]
  ];
}
