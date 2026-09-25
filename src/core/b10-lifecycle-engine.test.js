import test from 'node:test';
import assert from 'node:assert/strict';
import { createEmptyStore } from './persistence.js';
import {
  normalizeProposalStatus,
  canConvertProposalToProject,
  buildProjectFromProposal,
  canCreateInvoiceFromProject,
  buildInvoiceFromProject,
  validateB10Lifecycle
} from './b10-lifecycle-engine.js';

const date = new Date('2026-09-25T10:00:00.000Z');
const id = prefix => prefix + '_1';
const client = { id: 'client_1', name: 'Acme' };

function baseStore() {
  const store = createEmptyStore();
  store.clients = [client];
  store.leads = [{ id: 'lead_1', clientId: 'client_1', status: 'Won', value: 1000 }];
  store.proposals = [{ id: 'proposal_1', clientId: 'client_1', leadId: 'lead_1', status: 'Accepted', value: 1200, name: 'Website' }];
  return store;
}

test('normalizes proposal lifecycle statuses', () => {
  assert.equal(normalizeProposalStatus(' Accepted '), 'accepted');
  assert.equal(normalizeProposalStatus(''), 'draft');
});

test('accepted/won proposals are convertible', () => {
  const proposal = baseStore().proposals[0];
  assert.equal(canConvertProposalToProject(proposal, []).valid, true);
  assert.equal(canConvertProposalToProject({ ...proposal, status: 'Sent' }, []).valid, false);
});

test('conversion blocks duplicate projects and missing client/value', () => {
  const proposal = baseStore().proposals[0];
  assert.equal(canConvertProposalToProject(proposal, [{ id: 'p', proposalId: proposal.id }]).reason, 'project-already-exists');
  assert.equal(canConvertProposalToProject({ ...proposal, clientId: null }, []).reason, 'proposal-client-required');
  assert.equal(canConvertProposalToProject({ ...proposal, value: 0 }, []).reason, 'proposal-value-required');
});

test('builds project from accepted proposal with financial seed', () => {
  const proposal = baseStore().proposals[0];
  const project = buildProjectFromProposal(proposal, [], id, date);
  assert.equal(project.clientId, 'client_1');
  assert.equal(project.proposalId, 'proposal_1');
  assert.equal(project.revenue, 1200);
  assert.equal(project.budget, 1200);
  assert.equal(project.billingType, 'Fixed Fee');
});

test('invoice creation blocks non-billable and duplicates', () => {
  const project = { id: 'project_1', clientId: 'client_1', revenue: 500, billingType: 'Non-Billable' };
  assert.equal(canCreateInvoiceFromProject(project, []).reason, 'project-non-billable');
  const billable = { ...project, billingType: 'Fixed Fee' };
  assert.equal(canCreateInvoiceFromProject(billable, [{ id: 'i', projectId: 'project_1' }]).reason, 'invoice-already-exists');
});

test('builds invoice from project with canonical relation and one line item', () => {
  const project = { id: 'project_1', clientId: 'client_1', revenue: 500, name: 'Branding', notes: 'Kickoff' };
  const invoice = buildInvoiceFromProject(project, [], id, date);
  assert.equal(invoice.clientId, 'client_1');
  assert.equal(invoice.projectId, 'project_1');
  assert.equal(invoice.value, 500);
  assert.deepEqual(invoice.lineItems, [{ description: 'Branding', quantity: 1, unitPrice: 500 }]);
});

test('validates complete proposal → project → invoice → payment lifecycle', () => {
  const store = baseStore();
  store.projects = [buildProjectFromProposal(store.proposals[0], [], id, date)];
  store.invoices = [buildInvoiceFromProject(store.projects[0], [], id, date)];
  store.payments = [{ id: 'payment_1', invoiceId: 'invoice_1', clientId: 'client_1', amount: 200, paymentDate: '2026-09-25' }];
  const result = validateB10Lifecycle(store, date);
  assert.equal(result.valid, true, result.errors.join('; '));
});

test('rejects mismatched downstream client relationships', () => {
  const store = baseStore();
  store.clients.push({ id: 'client_2', name: 'Other' });
  store.projects = [{ id: 'project_1', clientId: 'client_2', proposalId: 'proposal_1', revenue: 100 }];
  const result = validateB10Lifecycle(store, date);
  assert.equal(result.valid, false);
  assert.match(result.errors.join('\n'), /client mismatch/);
});

test('rejects payment beyond payment-plan allocation', () => {
  const store = baseStore();
  store.projects = [{ id: 'project_1', clientId: 'client_1', proposalId: 'proposal_1', revenue: 100 }];
  store.invoices = [{ id: 'invoice_1', clientId: 'client_1', projectId: 'project_1', status: 'Sent', lineItems: [{ description: 'x', quantity: 1, unitPrice: 100 }], paymentPlan: { installments: [{ amountType: 'equal', amount: 0, dueDate: '2026-10-01' }] } }];
  store.payments = [{ id: 'payment_1', invoiceId: 'invoice_1', clientId: 'client_1', amount: 100 }];
  const result = validateB10Lifecycle(store, date);
  assert.equal(result.valid, false);
  assert.match(result.errors.join('\n'), /payment exceeds invoice payment plan/);
});
