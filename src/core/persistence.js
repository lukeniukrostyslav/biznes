const STORAGE_KEY = 'business-os-store-v1';
const CURRENT_SCHEMA_VERSION = 1;

const EMPTY_STORE = Object.freeze({
  schemaVersion: CURRENT_SCHEMA_VERSION,
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

function normalizeStore(input) {
  const source = migrateStore(input);
  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
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
  storage.setItem(STORAGE_KEY, JSON.stringify(normalized));
  return normalized;
}

function upsertRecord(store, collection, record) {
  const list = Array.isArray(store[collection]) ? [...store[collection]] : [];
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
  return normalizeStore({ ...store, [collection]: list });
}

function removeRecord(store, collection, id) {
  return normalizeStore({
    ...store,
    [collection]: (store[collection] || []).filter(item => item.id !== id)
  });
}

function exportStore(store) {
  return JSON.stringify(normalizeStore(store), null, 2);
}

function importStore(json) {
  const parsed = typeof json === 'string' ? JSON.parse(json) : json;
  if (!parsed || typeof parsed !== 'object') throw new Error('Invalid BUSINESS OS export');
  if (parsed.schemaVersion && Number(parsed.schemaVersion) > CURRENT_SCHEMA_VERSION) throw new Error('Unsupported BUSINESS OS schema version');
  return normalizeStore(parsed);
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
  clearStore
};
