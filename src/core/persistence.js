const STORAGE_KEY = 'business-os-store-v1';
const CURRENT_SCHEMA_VERSION = 2;

const COLLECTIONS = ['clients', 'leads', 'proposals', 'projects', 'invoices', 'payments', 'expenses'];
const RELATION_FIELDS = {
  leads: { clientId: 'clients' },
  proposals: { clientId: 'clients', leadId: 'leads' },
  projects: { clientId: 'clients', proposalId: 'proposals' },
  invoices: { clientId: 'clients', projectId: 'projects' },
  payments: { invoiceId: 'invoices', clientId: 'clients' },
  expenses: { projectId: 'projects', clientId: 'clients' }
};

const EMPTY_STORE = Object.freeze({
  schemaVersion: CURRENT_SCHEMA_VERSION,
  archivedRecords: [],
  clients: [],
  leads: [],
  proposals: [],
  projects: [],
  invoices: [],
  payments: [],
  expenses: []
});

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function createId(prefix = 'record') {
  return prefix + '_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
}

function createEmptyStore() {
  return clone(EMPTY_STORE);
}

function migrateStore(input) {
  const source = input && typeof input === 'object' ? input : {};
  const version = Number(source.schemaVersion || 1);
  if (version > CURRENT_SCHEMA_VERSION) throw new Error('Unsupported BUSINESS OS schema version');
  if (version === 1) return { ...source, schemaVersion: CURRENT_SCHEMA_VERSION, archivedRecords: Array.isArray(source.archivedRecords) ? source.archivedRecords : [] };
  return source;
}

function validateStore(input) {
  const source = input && typeof input === 'object' ? input : {};
  const errors = [];

  const findById = (collection, id) =>
    (Array.isArray(source[collection]) ? source[collection] : []).find(item => item.id === id);

  const archived = source.archivedRecords;
  if (!Array.isArray(archived)) {
    errors.push('archivedRecords must be an array');
  } else {
    const seenArchived = new Set();
    for (const record of archived) {
      if (!record || typeof record !== 'object' || Array.isArray(record)) {
        errors.push('archivedRecords contains a non-object record');
        continue;
      }
      if (!record.id || typeof record.id !== 'string') {
        errors.push('archivedRecords contains a record without a valid id');
      }
      if (!COLLECTIONS.includes(record.collection)) {
        errors.push('archivedRecords contains an invalid collection: ' + String(record.collection));
      }
      if (record.id && COLLECTIONS.includes(record.collection)) {
        const key = record.collection + ':' + record.id;
        if (seenArchived.has(key)) errors.push('duplicate archived id: ' + key);
        seenArchived.add(key);
      }
    }
  }

  const seenIds = new Set();
  for (const collection of COLLECTIONS) {
    const records = source[collection];
    if (!Array.isArray(records)) {
      errors.push(`${collection} must be an array`);
      continue;
    }
    for (const record of records) {
      if (!record || typeof record !== 'object' || Array.isArray(record)) {
        errors.push(`${collection} contains a non-object record`);
        continue;
      }
      if (!record.id || typeof record.id !== 'string') {
        errors.push(`${collection} contains a record without a valid id`);
      } else {
        const key = `${collection}:${record.id}`;
        if (seenIds.has(key)) errors.push(`duplicate id: ${key}`);
        seenIds.add(key);
      }
    }
  }

  for (const record of archived) {
    if (!record?.id || !COLLECTIONS.includes(record.collection)) continue;
    const active = Array.isArray(source[record.collection])
      ? source[record.collection].some(item => item?.id === record.id)
      : false;
    if (active) {
      errors.push('archived record conflicts with active record: ' + record.collection + ':' + record.id);
    }
  }

  const validateMoneyField = (collection, field) => {
    for (const record of Array.isArray(source[collection]) ? source[collection] : []) {
      if (record?.[field] == null || record[field] === '') continue;
      const value = Number(record[field]);
      if (!Number.isFinite(value) || value < 0) {
        errors.push(`${collection}.${record.id || '<unknown>'}.${field} must be a finite non-negative number`);
      }
    }
  };

  for (const [collection, field] of [
    ['leads', 'value'], ['proposals', 'subtotal'], ['proposals', 'tax'], ['proposals', 'total'],
    ['projects', 'revenue'], ['projects', 'estimatedCosts'], ['projects', 'actualCosts'],
    ['invoices', 'amount'], ['invoices', 'value'], ['payments', 'amount'], ['expenses', 'amount']
  ]) validateMoneyField(collection, field);

  for (const invoice of Array.isArray(source.invoices) ? source.invoices : []) {
    if (!Array.isArray(invoice.lineItems)) continue;
    for (const item of invoice.lineItems) {
      if (!item || typeof item !== 'object') {
        errors.push(`invoices.${invoice.id || '<unknown>'}.lineItems contains a non-object item`);
        continue;
      }
      const quantity = Number(item.quantity ?? 0);
      const unitPrice = Number(item.unitPrice ?? 0);
      if (!Number.isFinite(quantity) || quantity < 0) errors.push(`invoices.${invoice.id || '<unknown>'}.lineItems.quantity must be finite and non-negative`);
      if (!Number.isFinite(unitPrice) || unitPrice < 0) errors.push(`invoices.${invoice.id || '<unknown>'}.lineItems.unitPrice must be finite and non-negative`);
    }
  }

  for (const collection of COLLECTIONS) {
    for (const record of Array.isArray(source[collection]) ? source[collection] : []) {
      for (const [field, target] of Object.entries(RELATION_FIELDS[collection] || {})) {
        const value = record?.[field];
        if (value == null || value === '') continue;
        if (!findById(target, value)) {
          errors.push(`${collection}.${record.id || '<unknown>'}.${field} -> ${value}`);
        }
      }
    }
  }

  // Cross-entity integrity: related records must belong to the same client.
  const checks = [
    ['proposals', 'leadId', 'leads', 'clientId'],
    ['projects', 'proposalId', 'proposals', 'clientId'],
    ['invoices', 'projectId', 'projects', 'clientId'],
    ['payments', 'invoiceId', 'invoices', 'clientId'],
    ['expenses', 'projectId', 'projects', 'clientId']
  ];

  for (const [collection, relationField, targetCollection, clientField] of checks) {
    for (const record of Array.isArray(source[collection]) ? source[collection] : []) {
      const relationId = record?.[relationField];
      if (relationId == null || relationId === '') continue;

      const target = findById(targetCollection, relationId);
      if (!target) continue;

      const recordClient = record?.clientId;
      const targetClient = target?.[clientField];
      if (recordClient && targetClient && recordClient !== targetClient) {
        errors.push(
          `${collection}.${record.id || '<unknown>'}.${relationField} client mismatch: ${recordClient} != ${targetClient}`
        );
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

function normalizeStore(input) {
  const source = migrateStore(input);
  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    archivedRecords: Array.isArray(source.archivedRecords) ? source.archivedRecords : [],
    clients: Array.isArray(source.clients) ? source.clients : [],
    leads: Array.isArray(source.leads) ? source.leads : [],
    proposals: Array.isArray(source.proposals) ? source.proposals : [],
    projects: Array.isArray(source.projects) ? source.projects : [],
    invoices: Array.isArray(source.invoices) ? source.invoices : [],
    payments: Array.isArray(source.payments) ? source.payments : [],
    expenses: Array.isArray(source.expenses) ? source.expenses : []
  };
}

function loadStore(storage) {
  try {
    const raw = storage.getItem(STORAGE_KEY);
    return normalizeStore(raw ? JSON.parse(raw) : createEmptyStore());
  } catch {
    return createEmptyStore();
  }
}

function saveStore(storage, store) {
  const normalized = normalizeStore(store);
  const validation = validateStore(normalized);
  if (!validation.valid) {
    throw new Error('Cannot save invalid BUSINESS OS store: ' + validation.errors.join(', '));
  }
  storage.setItem(STORAGE_KEY, JSON.stringify(normalized));
  return normalized;
}

function assertCollection(collection) {
  if (!COLLECTIONS.includes(collection)) {
    throw new Error('Unknown BUSINESS OS collection: ' + collection);
  }
}

function archiveRecord(store, collection, id) {
  assertCollection(collection);
  const normalized = normalizeStore(store);
  const list = Array.isArray(normalized[collection]) ? normalized[collection] : [];
  const record = list.find(item => item.id === id);
  if (!record) return normalized;

  const dependents = [];
  for (const [childCollection, relations] of Object.entries(RELATION_FIELDS)) {
    for (const [field, targetCollection] of Object.entries(relations)) {
      if (targetCollection === collection) {
        for (const child of normalized[childCollection] || []) {
          if (child?.[field] === id) dependents.push(childCollection + '.' + child.id);
        }
      }
    }
  }
  if (dependents.length) {
    throw new Error('Cannot archive record with active dependents: ' + dependents.join(', '));
  }

  return normalizeStore({
    ...normalized,
    [collection]: list.filter(item => item.id !== id),
    archivedRecords: [...(normalized.archivedRecords || []), { ...record, collection, archivedAt: new Date().toISOString() }]
  });
}

function restoreRecord(store, archivedId) {
  const normalized = normalizeStore(store);
  const archived = (normalized.archivedRecords || []).find(item => item.id === archivedId);
  if (!archived) return normalized;
  assertCollection(archived.collection);

  const { collection, archivedAt, ...record } = archived;
  const candidate = normalizeStore({
    ...normalized,
    [collection]: [...(normalized[collection] || []), record],
    archivedRecords: (normalized.archivedRecords || []).filter(item => !(item.id === archivedId && item.collection === collection))
  });
  const validation = validateStore(candidate);
  if (!validation.valid) {
    throw new Error('Cannot restore record: ' + validation.errors.join(', '));
  }
  return candidate;
}

function upsertRecord(store, collection, record) {
  assertCollection(collection);
  const normalized = normalizeStore(store);
  const list = Array.isArray(normalized[collection]) ? [...normalized[collection]] : [];
  const now = new Date().toISOString();
  const next = {
    id: record.id || createId(collection.slice(0, -1)),
    createdAt: record.createdAt || now,
    updatedAt: now,
    ...record
  };
  const index = list.findIndex(item => item.id === next.id);
  if (index === -1) list.push(next);
  else list[index] = next;
  const candidate = normalizeStore({ ...normalized, [collection]: list });
  const validation = validateStore(candidate);
  if (!validation.valid) {
    throw new Error('Cannot upsert invalid BUSINESS OS store: ' + validation.errors.join(', '));
  }
  return candidate;
}

function removeRecord(store, collection, id) {
  assertCollection(collection);
  const normalized = normalizeStore(store);
  const candidate = normalizeStore({
    ...normalized,
    [collection]: (normalized[collection] || []).filter(item => item.id !== id)
  });
  const validation = validateStore(candidate);
  if (!validation.valid) {
    throw new Error('Cannot remove record: ' + validation.errors.join(', '));
  }
  return candidate;
}

function exportStore(store) {
  return JSON.stringify(normalizeStore(store), null, 2);
}

function importStore(json) {
  const parsed = typeof json === 'string' ? JSON.parse(json) : json;
  if (!parsed || typeof parsed !== 'object') throw new Error('Invalid BUSINESS OS export');
  if (parsed.schemaVersion && Number(parsed.schemaVersion) > CURRENT_SCHEMA_VERSION) throw new Error('Unsupported BUSINESS OS schema version');
  const normalized = normalizeStore(parsed);
  const validation = validateStore(normalized);
  if (!validation.valid) throw new Error(`Invalid BUSINESS OS relationships: ${validation.errors.join(', ')}`);
  return normalized;
}

function clearStore(storage) {
  storage.removeItem(STORAGE_KEY);
  return createEmptyStore();
}

export {
  STORAGE_KEY,
  CURRENT_SCHEMA_VERSION,
  createId,
  createEmptyStore,
  normalizeStore,
  migrateStore,
  loadStore,
  saveStore,
  upsertRecord,
  removeRecord,
  exportStore,
  importStore,
  clearStore,
  COLLECTIONS,
  RELATION_FIELDS,
  validateStore,
  archiveRecord,
  restoreRecord
};
