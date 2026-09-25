const DEFAULT_PIPELINE_STAGES = Object.freeze(['New','Qualified','Proposal','Negotiation','Won']);
const TERMINAL_STAGES = Object.freeze(['Won','Lost','Closed','Cancelled']);

function normalizeStage(value) {
  const raw = String(value || '').trim();
  const match = DEFAULT_PIPELINE_STAGES.find(stage => stage.toLowerCase() === raw.toLowerCase());
  return match || 'New';
}

function normalizeLead(lead = {}) {
  const now = new Date().toISOString();
  return {
    id: String(lead.id || ''),
    name: String(lead.name || lead.title || '').trim(),
    company: String(lead.company || '').trim(),
    email: String(lead.email || '').trim(),
    phone: String(lead.phone || '').trim(),
    source: String(lead.source || '').trim(),
    status: normalizeStage(lead.status),
    value: Math.max(Number(lead.value || 0), 0),
    probability: Math.min(Math.max(Number(lead.probability ?? 0), 0), 100),
    nextAction: String(lead.nextAction || '').trim(),
    nextActionDate: lead.nextActionDate || null,
    clientId: lead.clientId || null,
    notes: String(lead.notes || '').trim(),
    createdAt: lead.createdAt || now,
    updatedAt: now
  };
}

function calculateCrmPipeline(leads = [], options = {}) {
  const source = Array.isArray(leads) ? leads : [];
  const query = String(options.query || '').trim().toLowerCase();
  const stage = options.stage ? normalizeStage(options.stage) : null;
  const filtered = source
    .map(normalizeLead)
    .filter(lead => !query || [lead.name, lead.company, lead.email, lead.phone, lead.source].some(value => value.toLowerCase().includes(query)))
    .filter(lead => !stage || lead.status === stage);
  const active = filtered.filter(lead => !TERMINAL_STAGES.includes(lead.status));
  const pipelineValue = active.reduce((sum, lead) => sum + lead.value, 0);
  const weightedValue = active.reduce((sum, lead) => sum + lead.value * lead.probability / 100, 0);
  const byStage = Object.fromEntries(DEFAULT_PIPELINE_STAGES.map(name => [name, filtered.filter(lead => lead.status === name)]));
  return {
    stages: DEFAULT_PIPELINE_STAGES,
    leads: filtered,
    byStage,
    activeCount: active.length,
    pipelineValue: Math.round((pipelineValue + Number.EPSILON) * 100) / 100,
    weightedValue: Math.round((weightedValue + Number.EPSILON) * 100) / 100
  };
}

function convertLeadToClient(lead, clients = []) {
  const source = normalizeLead(lead);
  if (!source.id) throw new Error('Lead id is required');
  if (source.status !== 'Won') throw new Error('Only Won leads can be converted');
  if (source.clientId) return { client: null, lead: source, existingClientId: source.clientId };
  const duplicate = (Array.isArray(clients) ? clients : []).find(client => {
    const email = String(client.email || '').trim().toLowerCase();
    return email && source.email && email === source.email.toLowerCase();
  });
  if (duplicate) return { client: duplicate, lead: { ...source, clientId: duplicate.id }, existingClientId: duplicate.id };
  const client = {
    id: 'client_' + source.id,
    name: source.name || source.company || 'Unnamed client',
    company: source.company || '',
    email: source.email || '',
    phone: source.phone || '',
    sourceLeadId: source.id,
    status: 'Active',
    createdAt: source.createdAt,
    updatedAt: new Date().toISOString()
  };
  return { client, lead: { ...source, clientId: client.id }, existingClientId: null };
}

function validateCrm(store = {}) {
  const errors = [];
  const leads = Array.isArray(store.leads) ? store.leads : [];
  const clients = Array.isArray(store.clients) ? store.clients : [];
  const clientIds = new Set(clients.map(client => client.id));
  const leadIds = new Set();
  for (const lead of leads) {
    if (!lead || typeof lead !== 'object' || !lead.id) errors.push('lead must have an id');
    if (leadIds.has(lead.id)) errors.push('duplicate lead id: ' + lead.id);
    leadIds.add(lead.id);
    if (lead.clientId && !clientIds.has(lead.clientId)) errors.push('lead client relation missing: ' + lead.clientId);
    if (Number(lead.value || 0) < 0) errors.push('lead value must be non-negative: ' + lead.id);
    if (Number(lead.probability || 0) < 0 || Number(lead.probability || 0) > 100) errors.push('lead probability out of range: ' + lead.id);
  }
  return { valid: errors.length === 0, errors };
}

export {
  DEFAULT_PIPELINE_STAGES,
  TERMINAL_STAGES,
  normalizeStage,
  normalizeLead,
  calculateCrmPipeline,
  convertLeadToClient,
  validateCrm
};
