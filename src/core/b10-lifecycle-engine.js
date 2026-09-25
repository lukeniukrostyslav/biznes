import { calculateInvoice, calculateInvoicePaymentStatus, calculatePaymentPlan, allocatePaymentPlan } from './financial-engine.js';
import { validateStore } from './persistence.js';

const PROPOSAL_CONVERTIBLE_STATUSES = new Set(['won', 'accepted']);
const PROPOSAL_TERMINAL_STATUSES = new Set(['won', 'accepted', 'lost', 'cancelled', 'closed']);
const PROJECT_STATUSES = new Set(['new', 'active', 'on hold', 'completed', 'cancelled']);
const INVOICE_STATUSES = new Set(['draft', 'sent', 'partially paid', 'paid', 'overdue', 'cancelled']);

function normalizeStatus(value) {
  return String(value || '').trim().toLowerCase();
}

function normalizeProposalStatus(value) {
  const status = normalizeStatus(value);
  return status || 'draft';
}

function canConvertProposalToProject(proposal, projects = []) {
  if (!proposal || !PROPOSAL_CONVERTIBLE_STATUSES.has(normalizeProposalStatus(proposal.status))) {
    return { valid: false, reason: 'proposal-not-accepted' };
  }
  if (!proposal.clientId) return { valid: false, reason: 'proposal-client-required' };
  if ((Array.isArray(projects) ? projects : []).some(project => project.proposalId === proposal.id)) {
    return { valid: false, reason: 'project-already-exists' };
  }
  const value = Number(proposal.value ?? proposal.amount ?? proposal.total ?? 0);
  if (!Number.isFinite(value) || value <= 0) return { valid: false, reason: 'proposal-value-required' };
  return { valid: true };
}

function buildProjectFromProposal(proposal, projects = [], createId = () => 'project', now = new Date()) {
  const check = canConvertProposalToProject(proposal, projects);
  if (!check.valid) throw new Error(check.reason);
  const value = Number(proposal.value ?? proposal.amount ?? proposal.total ?? 0);
  const timestamp = now.toISOString();
  return {
    id: createId('project'),
    createdAt: timestamp,
    updatedAt: timestamp,
    name: (proposal.name || proposal.title || 'Untitled proposal') + ' Project',
    status: 'Active',
    clientId: proposal.clientId,
    proposalId: proposal.id,
    revenue: value,
    budget: value,
    budgetType: 'Fee',
    billingType: 'Fixed Fee',
    actualCosts: 0,
    actualHours: 0,
    labourRate: 0,
    nextAction: proposal.nextAction || 'Define project kickoff',
    notes: proposal.notes || ''
  };
}

function canCreateInvoiceFromProject(project, invoices = []) {
  if (!project) return { valid: false, reason: 'project-not-found' };
  if (normalizeStatus(project.billingType) === 'non-billable') return { valid: false, reason: 'project-non-billable' };
  if (!project.clientId) return { valid: false, reason: 'project-client-required' };
  if ((Array.isArray(invoices) ? invoices : []).some(invoice => invoice.projectId === project.id)) {
    return { valid: false, reason: 'invoice-already-exists' };
  }
  const amount = Number(project.revenue ?? project.budget ?? 0);
  if (!Number.isFinite(amount) || amount <= 0) return { valid: false, reason: 'project-amount-required' };
  return { valid: true };
}

function buildInvoiceFromProject(project, invoices = [], createId = () => 'invoice', now = new Date()) {
  const check = canCreateInvoiceFromProject(project, invoices);
  if (!check.valid) throw new Error(check.reason);
  const amount = Number(project.revenue ?? project.budget ?? 0);
  const timestamp = now.toISOString();
  return {
    id: createId('invoice'),
    createdAt: timestamp,
    updatedAt: timestamp,
    name: (project.name || 'Project') + ' Invoice',
    status: 'Draft',
    clientId: project.clientId,
    projectId: project.id,
    value: amount,
    amount,
    taxRate: 0,
    discountType: 'none',
    discountValue: 0,
    dueDate: null,
    lineItems: [{ description: project.name || 'Project services', quantity: 1, unitPrice: amount }],
    nextAction: 'Send invoice',
    notes: project.notes || ''
  };
}

function validateB10Lifecycle(store, now = new Date()) {
  const source = store && typeof store === 'object' ? store : {};
  const errors = [...validateStore(source).errors];
  const clients = Array.isArray(source.clients) ? source.clients : [];
  const clientIds = new Set(clients.map(x => x.id));
  const proposals = Array.isArray(source.proposals) ? source.proposals : [];
  const projects = Array.isArray(source.projects) ? source.projects : [];
  const invoices = Array.isArray(source.invoices) ? source.invoices : [];
  const payments = Array.isArray(source.payments) ? source.payments : [];
  const projectIds = new Set(projects.map(x => x.id));
  const invoiceIds = new Set(invoices.map(x => x.id));

  for (const proposal of proposals) {
    if (proposal.clientId && !clientIds.has(proposal.clientId)) errors.push('proposal client missing: ' + proposal.id);
    if (proposal.leadId && !Array.isArray(source.leads) ? true : false) errors.push('proposal lead relation invalid: ' + proposal.id);
  }
  for (const project of projects) {
    if (project.proposalId && !proposals.some(x => x.id === project.proposalId)) errors.push('project proposal missing: ' + project.id);
    if (project.status && !PROJECT_STATUSES.has(normalizeStatus(project.status))) errors.push('invalid project status: ' + project.id);
  }
  for (const invoice of invoices) {
    const metric = calculateInvoice(invoice, now);
    if (metric.total < 0 || metric.outstanding < 0) errors.push('invalid invoice financial state: ' + invoice.id);
    if (invoice.status && !INVOICE_STATUSES.has(normalizeStatus(invoice.status))) errors.push('invalid invoice status: ' + invoice.id);
    if (invoice.paymentPlan?.installments) {
      const plan = calculatePaymentPlan(metric.total, invoice.paymentPlan.installments, now);
      if (!plan.valid) errors.push('invalid invoice payment plan: ' + invoice.id);
    }
  }
  for (const payment of payments) {
    if (payment.invoiceId && !invoiceIds.has(payment.invoiceId)) errors.push('payment invoice missing: ' + payment.id);
    if (payment.amount == null || Number(payment.amount) <= 0) errors.push('payment amount must be positive: ' + payment.id);
    if (payment.installmentIndex != null) {
      const invoice = invoices.find(x => x.id === payment.invoiceId);
      const count = invoice?.paymentPlan?.installments?.length || 0;
      if (!Number.isInteger(payment.installmentIndex) || payment.installmentIndex < 0 || payment.installmentIndex >= count) {
        errors.push('payment installment index invalid: ' + payment.id);
      }
    }
  }
  for (const invoice of invoices) {
    const allocation = allocatePaymentPlan(invoice, payments, now);
    if (allocation.unallocatedPayments > 0.01) errors.push('payment exceeds invoice payment plan: ' + invoice.id);
    const state = calculateInvoicePaymentStatus(invoice, payments, now);
    if (state.outstanding < 0) errors.push('invoice outstanding below zero: ' + invoice.id);
  }
  return { valid: errors.length === 0, errors };
}

export {
  PROPOSAL_CONVERTIBLE_STATUSES,
  PROPOSAL_TERMINAL_STATUSES,
  PROJECT_STATUSES,
  INVOICE_STATUSES,
  normalizeProposalStatus,
  canConvertProposalToProject,
  buildProjectFromProposal,
  canCreateInvoiceFromProject,
  buildInvoiceFromProject,
  validateB10Lifecycle
};
