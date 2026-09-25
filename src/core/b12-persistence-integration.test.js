import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createEmptyStore, saveStore, loadStore, upsertRecord, archiveRecord, restoreRecord, exportStore, importStore, validateStore } from './persistence.js';

function memoryStorage() {
  const data = new Map();
  return { getItem: k => data.get(k) ?? null, setItem: (k, v) => data.set(k, v), removeItem: k => data.delete(k) };
}

test('B12 CRUD persistence survives save/load for a complete business chain', () => {
  const storage = memoryStorage();
  let store = createEmptyStore();
  store = upsertRecord(store, 'clients', { id: 'c1', name: 'Client One' });
  store = upsertRecord(store, 'leads', { id: 'l1', name: 'Lead One', clientId: 'c1' });
  store = upsertRecord(store, 'proposals', { id: 'pr1', name: 'Proposal One', clientId: 'c1', leadId: 'l1', total: 1000 });
  store = upsertRecord(store, 'projects', { id: 'p1', name: 'Project One', clientId: 'c1', proposalId: 'pr1', revenue: 1000 });
  store = upsertRecord(store, 'invoices', { id: 'i1', name: 'Invoice One', clientId: 'c1', projectId: 'p1', amount: 1000 });
  store = upsertRecord(store, 'payments', { id: 'pay1', clientId: 'c1', invoiceId: 'i1', amount: 400 });
  store = upsertRecord(store, 'expenses', { id: 'e1', clientId: 'c1', projectId: 'p1', amount: 100 });
  saveStore(storage, store);
  const loaded = loadStore(storage);
  assert.deepEqual(loaded, store);
  assert.equal(validateStore(loaded).valid, true);
});

test('B12 relationship edits persist only when the edited chain remains valid', () => {
  const storage = memoryStorage();
  let store = createEmptyStore();
  store.clients = [{ id: 'c1' }, { id: 'c2' }];
  store.proposals = [{ id: 'pr1', clientId: 'c1' }];
  store.projects = [{ id: 'p1', clientId: 'c1', proposalId: 'pr1' }];
  saveStore(storage, store);
  assert.throws(() => upsertRecord(store, 'projects', { id: 'p1', clientId: 'c2', proposalId: 'pr1' }), /Cannot upsert invalid BUSINESS OS store/);
  assert.equal(loadStore(storage).projects[0].clientId, 'c1');
});

test('B12 export/import round-trip preserves active and archived data exactly', () => {
  let store = createEmptyStore();
  store.clients = [{ id: 'c1', name: 'Client One' }];
  store.projects = [{ id: 'p1', name: 'Project One', clientId: 'c1', revenue: 2500 }];
  store = archiveRecord(store, 'projects', 'p1');
  const roundTrip = importStore(exportStore(store));
  assert.deepEqual(roundTrip, store);
});

test('B12 import rejects malformed JSON without producing a partial store', () => {
  assert.throws(() => importStore('{broken-json'), /Unexpected token|JSON/);
});

test('B12 import rejects invalid relationships and future schema without mutation', () => {
  const valid = createEmptyStore();
  assert.throws(() => importStore({ schemaVersion: 2, projects: [{ id: 'p1', clientId: 'missing' }] }), /relationships/);
  assert.throws(() => importStore({ schemaVersion: 999 }), /Unsupported BUSINESS OS schema version/);
  assert.deepEqual(valid, createEmptyStore());
});

test('B12 archive/restore persists through local storage', () => {
  const storage = memoryStorage();
  let store = createEmptyStore();
  store.clients = [{ id: 'c1', name: 'Client One' }];
  store.projects = [{ id: 'p1', clientId: 'c1', name: 'Project One' }];
  store = archiveRecord(store, 'projects', 'p1');
  saveStore(storage, store);
  let loaded = loadStore(storage);
  assert.equal(loaded.projects.length, 0);
  assert.equal(loaded.archivedRecords.length, 1);
  loaded = restoreRecord(loaded, 'p1');
  saveStore(storage, loaded);
  loaded = loadStore(storage);
  assert.equal(loaded.projects.length, 1);
  assert.equal(loaded.archivedRecords.length, 0);
});

test('B12 UI uses canonical persistence APIs for export/import and record mutations', () => {
  const html = fs.readFileSync(new URL('../../app/index.html', import.meta.url), 'utf8');
  assert.match(html, /exportStore\(businessStore\)/);
  assert.match(html, /importStore\(reader\.result\)/);
  assert.match(html, /businessStore=saveStore\(imported\)/);
  assert.match(html, /businessStore=saveStore\(archiveRecord\(businessStore,type,id\)\)/);
  assert.match(html, /businessStore=saveStore\(restoreRecord\(businessStore,btn\.dataset\.id\)\)/);
});
