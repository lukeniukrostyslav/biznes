import test from 'node:test';
import assert from 'node:assert/strict';
import { createEmptyStore, normalizeStore, loadStore, saveStore, upsertRecord, removeRecord, exportStore, importStore, clearStore, validateStore, archiveRecord, restoreRecord } from './persistence.js';

function memoryStorage() {
  const data = new Map();
  return { getItem:k=>data.get(k) ?? null, setItem:(k,v)=>data.set(k,v) };
}

test('creates a versioned empty store',()=>assert.equal(createEmptyStore().schemaVersion,2));
test('migrates schema v1 to current schema',()=>assert.equal(normalizeStore({schemaVersion:1}).schemaVersion,2));
test('normalizes missing collections',()=>assert.deepEqual(normalizeStore({clients:[{id:'c1'}]}).leads,[]));
test('loads and saves JSON store',()=>{const s=memoryStorage(); let store=createEmptyStore(); store.clients.push({id:'c1',name:'Nova'}); store=saveStore(s,store); const loaded=loadStore(s); assert.equal(loaded.clients[0].name,'Nova');});
test('upserts and removes records',()=>{let store=createEmptyStore(); store=upsertRecord(store,'clients',{id:'c1',name:'Nova'}); store=upsertRecord(store,'clients',{id:'c1',name:'Nova Studio'}); assert.equal(store.clients.length,1); assert.equal(store.clients[0].name,'Nova Studio'); store=removeRecord(store,'clients','c1'); assert.equal(store.clients.length,0);});
test('exports and imports portable JSON',()=>{let store=createEmptyStore(); store=upsertRecord(store,'projects',{id:'p1',name:'Website'}); const restored=importStore(exportStore(store)); assert.equal(restored.projects[0].name,'Website');});


test('rejects future schema versions',()=>assert.throws(()=>importStore({schemaVersion:99}),/Unsupported/));
test('validates entity relationships',()=>{const store=createEmptyStore();store.clients.push({id:'c1'});store.projects.push({id:'p1',clientId:'c1'});assert.equal(validateStore(store).valid,true);store.projects[0].clientId='missing';assert.equal(validateStore(store).valid,false);});
test('rejects invalid relationship import',()=>assert.throws(()=>importStore({schemaVersion:2,projects:[{id:'p1',clientId:'missing'}]}),/relationships/));
test('archives and restores',()=>{let store=upsertRecord(createEmptyStore(),'clients',{id:'c1',name:'Nova'});store=archiveRecord(store,'clients','c1');assert.equal(store.clients.length,0);store=restoreRecord(store,'c1');assert.equal(store.clients[0].name,'Nova');});
test('clears persisted store',()=>{const s=memoryStorage(); saveStore(s,upsertRecord(createEmptyStore(),'clients',{name:'Nova'})); clearStore(s); assert.equal(loadStore(s).clients.length,0);});

test('validateStore rejects duplicate ids and malformed money fields', () => {
  const store = createEmptyStore();
  store.clients = [{ id: 'client-1', name: 'A' }, { id: 'client-1', name: 'B' }];
  store.invoices = [{ id: 'invoice-1', amount: -10, lineItems: [{ quantity: 1, unitPrice: 'oops' }] }];
  const result = validateStore(store);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some(error => error.includes('duplicate id: clients:client-1')));
  assert.ok(result.errors.some(error => error.includes('invoices.invoice-1.amount')));
  assert.ok(result.errors.some(error => error.includes('lineItems.unitPrice')));
});
