import test from 'node:test';
import assert from 'node:assert/strict';
import { createEmptyStore, normalizeStore, migrateStore, loadStore, saveStore, upsertRecord, removeRecord, exportStore, importStore, clearStore, validateStore, archiveRecord, restoreRecord } from './persistence.js';

function memoryStorage() {
  const data = new Map();
  return { getItem:k=>data.get(k) ?? null, setItem:(k,v)=>data.set(k,v), removeItem:k=>data.delete(k) };
}

test('creates a versioned empty store',()=>assert.equal(createEmptyStore().schemaVersion,2));
test('migrates schema v1 to current schema',()=>assert.equal(normalizeStore({schemaVersion:1}).schemaVersion,2));
test('rejects malformed schema versions during migration',()=>{
  assert.throws(()=>migrateStore({schemaVersion:'abc'}),/Invalid BUSINESS OS schema version/);
  assert.throws(()=>migrateStore({schemaVersion:0}),/Invalid BUSINESS OS schema version/);
  assert.throws(()=>migrateStore({schemaVersion:1.5}),/Invalid BUSINESS OS schema version/);
});
test('normalize treats missing schema version as legacy v1',()=>assert.equal(normalizeStore({clients:[{id:'c1'}]}).schemaVersion,2));
test('normalizes missing collections',()=>assert.deepEqual(normalizeStore({clients:[{id:'c1'}]}).leads,[]));
test('loads and saves JSON store',()=>{const s=memoryStorage(); let store=createEmptyStore(); store.clients.push({id:'c1',name:'Nova'}); store=saveStore(s,store); const loaded=loadStore(s); assert.equal(loaded.clients[0].name,'Nova');});
test('loadStore surfaces malformed persisted JSON instead of resetting data',()=>{
  const s=memoryStorage();
  s.setItem('business-os-store-v1','{broken-json');
  assert.throws(()=>loadStore(s),/Cannot load BUSINESS OS store/);
});
test('loadStore surfaces invalid persisted relationships instead of resetting data',()=>{
  const s=memoryStorage();
  s.setItem('business-os-store-v1',JSON.stringify({schemaVersion:2,clients:[],projects:[{id:'p1',clientId:'missing'}]}));
  assert.throws(()=>loadStore(s),/BUSINESS OS schema|BUSINESS OS store/);
});
test('upserts and removes records',()=>{let store=createEmptyStore(); store=upsertRecord(store,'clients',{id:'c1',name:'Nova'}); store=upsertRecord(store,'clients',{id:'c1',name:'Nova Studio'}); assert.equal(store.clients.length,1); assert.equal(store.clients[0].name,'Nova Studio'); store=removeRecord(store,'clients','c1'); assert.equal(store.clients.length,0);});
test('exports and imports portable JSON',()=>{let store=createEmptyStore(); store=upsertRecord(store,'projects',{id:'p1',name:'Website'}); const restored=importStore(exportStore(store)); assert.equal(restored.projects[0].name,'Website');});
test('rejects future schema versions',()=>assert.throws(()=>importStore({schemaVersion:99}),/Unsupported/));
test('rejects malformed schema versions during import',()=>{
  assert.throws(()=>importStore({schemaVersion:'abc'}),/Invalid BUSINESS OS schema version/);
  assert.throws(()=>importStore({schemaVersion:1.5}),/Invalid BUSINESS OS schema version/);
});
test('validates entity relationships',()=>{const store=createEmptyStore();store.clients.push({id:'c1'});store.projects.push({id:'p1',clientId:'c1'});assert.equal(validateStore(store).valid,true);store.projects[0].clientId='missing';assert.equal(validateStore(store).valid,false);});
test('validateStore rejects a non-current schema version',()=>{
  const store=createEmptyStore();
  store.schemaVersion=1;
  const validation=validateStore(store);
  assert.equal(validation.valid,false);
  assert.ok(validation.errors.some(error=>error.includes('schemaVersion')));
});
test('rejects invalid relationship import',()=>assert.throws(()=>importStore({schemaVersion:2,projects:[{id:'p1',clientId:'missing'}]}),/relationships/));
test('archives and restores',()=>{let store=upsertRecord(createEmptyStore(),'clients',{id:'c1',name:'Nova'});store=archiveRecord(store,'clients','c1');assert.equal(store.clients.length,0);store=restoreRecord(store,'c1');assert.equal(store.clients[0].name,'Nova');});
test('archiveRecord refuses to return an invalid candidate store',()=>{
  let store=createEmptyStore();
  store.clients=[{id:'c1',name:'Nova'}];
  store.archivedRecords=[
    {id:'arch1',collection:'clients',name:'Old'},
    {id:'arch1',collection:'clients',name:'Duplicate'}
  ];
  assert.throws(()=>archiveRecord(store,'clients','c1'),/Cannot archive invalid BUSINESS OS store/);
});
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
test('blocks archiving a record that still has active dependents',()=>{
  let store=createEmptyStore();
  store.clients=[{id:'c1'}];
  store.projects=[{id:'p1',clientId:'c1'}];
  assert.throws(()=>archiveRecord(store,'clients','c1'),/active dependents/);
  assert.equal(store.clients.length,1);
});
test('allows archiving a leaf record and restores it safely',()=>{
  let store=createEmptyStore();
  store.clients=[{id:'c1'}];
  store.projects=[{id:'p1',clientId:'c1'}];
  store=archiveRecord(store,'projects','p1');
  assert.equal(store.projects.length,0);
  store=restoreRecord(store,'p1');
  assert.equal(store.projects.length,1);
});
test('blocks restoring a record when its required relationship is missing',()=>{
  let store=createEmptyStore();
  store.archivedRecords=[{id:'p1',name:'Website',collection:'projects',clientId:'missing'}];
  assert.throws(()=>restoreRecord(store,'p1'),/Cannot restore record/);
});
test('enforces cross-entity client consistency across proposal, project, invoice, payment and expense',()=>{
  const store=createEmptyStore();
  store.clients=[{id:'c1'},{id:'c2'}];
  store.leads=[{id:'l1',clientId:'c1'}];
  store.proposals=[{id:'prop1',clientId:'c1',leadId:'l1'}];
  store.projects=[{id:'p1',clientId:'c1',proposalId:'prop1'}];
  store.invoices=[{id:'i1',clientId:'c1',projectId:'p1'}];
  store.payments=[{id:'pay1',clientId:'c1',invoiceId:'i1',amount:100}];
  store.expenses=[{id:'e1',clientId:'c1',projectId:'p1',amount:50}];
  assert.equal(validateStore(store).valid,true);
  store.payments[0].clientId='c2';
  assert.equal(validateStore(store).valid,false);
  assert.ok(validateStore(store).errors.some(error=>error.includes('payments.pay1.invoiceId client mismatch')));
});
test('allows a payment to move to another invoice only when its client relation is consistent',()=>{
  const store=createEmptyStore();
  store.clients=[{id:'c1'},{id:'c2'}];
  store.invoices=[{id:'i1',clientId:'c1'},{id:'i2',clientId:'c2'}];
  store.payments=[{id:'pay1',invoiceId:'i1',clientId:'c1',amount:100}];
  store.payments[0].invoiceId='i2';
  store.payments[0].clientId='c2';
  assert.equal(validateStore(store).valid,true);
});
test('saveStore rejects invalid relationship state instead of persisting it',()=>{
  const storage=memoryStorage();
  const store=createEmptyStore();
  store.clients=[{id:'c1'}];
  store.projects=[{id:'p1',clientId:'missing'}];
  assert.throws(()=>saveStore(storage,store),/Cannot save invalid BUSINESS OS store/);
  assert.equal(storage.getItem('business-os-store-v1'),null);
});
test('archive chain blocks parent archiving until every active dependent is removed',()=>{
  let store=createEmptyStore();
  store.clients=[{id:'c1'}];
  store.proposals=[{id:'pr1',clientId:'c1'}];
  store.projects=[{id:'p1',clientId:'c1',proposalId:'pr1'}];
  store.invoices=[{id:'i1',clientId:'c1',projectId:'p1'}];
  store.payments=[{id:'pay1',clientId:'c1',invoiceId:'i1',amount:10}];
  store.expenses=[{id:'e1',clientId:'c1',projectId:'p1',amount:5}];
  assert.throws(()=>archiveRecord(store,'clients','c1'),/active dependents/);
  store=archiveRecord(store,'payments','pay1');
  store=archiveRecord(store,'expenses','e1');
  store=archiveRecord(store,'invoices','i1');
  store=archiveRecord(store,'projects','p1');
  store=archiveRecord(store,'projects','p1');
  store=archiveRecord(store,'proposals','pr1');
  store=archiveRecord(store,'clients','c1');
  assert.equal(store.clients.length,0);
  assert.equal(store.archivedRecords.length,6);
});
test('enforces the full downstream client chain when relations are edited',()=>{
  const store=createEmptyStore();
  store.clients=[{id:'c1'},{id:'c2'}];
  store.leads=[{id:'l1',clientId:'c1'}];
  store.proposals=[{id:'pr1',clientId:'c1',leadId:'l1'}];
  store.projects=[{id:'p1',clientId:'c1',proposalId:'pr1'}];
  store.invoices=[{id:'i1',clientId:'c1',projectId:'p1'}];
  store.expenses=[{id:'e1',clientId:'c1',projectId:'p1',amount:10}];
  store.proposals[0].clientId='c2';
  assert.equal(validateStore(store).valid,false);
  assert.ok(validateStore(store).errors.some(error=>error.includes('proposals.pr1.leadId client mismatch')));
  store.proposals[0].clientId='c1';
  store.projects[0].clientId='c2';
  assert.equal(validateStore(store).valid,false);
  assert.ok(validateStore(store).errors.some(error=>error.includes('projects.p1.proposalId client mismatch')));
  store.projects[0].clientId='c1';
  store.invoices[0].clientId='c2';
  assert.equal(validateStore(store).valid,false);
  assert.ok(validateStore(store).errors.some(error=>error.includes('invoices.i1.projectId client mismatch')));
  store.invoices[0].clientId='c1';
  store.expenses[0].clientId='c2';
  assert.equal(validateStore(store).valid,false);
  assert.ok(validateStore(store).errors.some(error=>error.includes('expenses.e1.projectId client mismatch')));
});
test('export/import preserves archived records',()=>{
  let store=createEmptyStore();
  store.clients=[{id:'c1',name:'Nova'}];
  store=archiveRecord(store,'clients','c1');
  const restored=importStore(exportStore(store));
  assert.equal(restored.clients.length,0);
  assert.equal(restored.archivedRecords.length,1);
  assert.equal(restored.archivedRecords[0].collection,'clients');
  assert.equal(restored.archivedRecords[0].name,'Nova');
});
test('schema v1 export imports into a complete current store',()=>{
  const restored=importStore({schemaVersion:1,clients:[{id:'c1',name:'Legacy'}]});
  assert.equal(restored.schemaVersion,2);
  assert.equal(restored.clients[0].name,'Legacy');
  assert.deepEqual(restored.projects,[]);
  assert.deepEqual(restored.archivedRecords,[]);
});
test('removeRecord refuses to break active relationships',()=>{
  let store=createEmptyStore();
  store.clients=[{id:'c1'}];
  store.projects=[{id:'p1',clientId:'c1'}];
  assert.throws(()=>removeRecord(store,'clients','c1'),/Cannot remove record/);
  assert.equal(store.clients.length,1);
});
test('removeRecord removes a leaf record without breaking relationships',()=>{
  let store=createEmptyStore();
  store.clients=[{id:'c1'}];
  store.projects=[{id:'p1',clientId:'c1'}];
  store=removeRecord(store,'projects','p1');
  assert.equal(store.projects.length,0);
});
test('persistence mutators reject unknown collections',()=>{
  const store=createEmptyStore();
  assert.throws(()=>upsertRecord(store,'unknown',{id:'x'}),/Unknown BUSINESS OS collection/);
  assert.throws(()=>removeRecord(store,'unknown','x'),/Unknown BUSINESS OS collection/);
  assert.throws(()=>archiveRecord(store,'unknown','x'),/Unknown BUSINESS OS collection/);
  assert.throws(()=>restoreRecord(store,'unknown','x'),/Unknown BUSINESS OS collection/);
});
test('upsertRecord rejects a relationship-breaking edit',()=>{
  let store=createEmptyStore();
  store.clients=[{id:'c1'},{id:'c2'}];
  store.projects=[{id:'p1',clientId:'c1'}];
  assert.throws(()=>upsertRecord(store,'projects',{id:'p1',clientId:'missing'}),/Cannot upsert invalid BUSINESS OS store/);
  assert.equal(store.projects[0].clientId,'c1');
});
test('upsertRecord accepts a valid create and update',()=>{
  let store=createEmptyStore();
  store=upsertRecord(store,'clients',{id:'c1',name:'Alpha'});
  assert.equal(store.clients.length,1);
  assert.equal(store.clients[0].name,'Alpha');
  store=upsertRecord(store,'clients',{id:'c1',name:'Beta'});
  assert.equal(store.clients.length,1);
  assert.equal(store.clients[0].name,'Beta');
});
test('restoreRecord rejects malformed archived collection metadata',()=>{
  const store=createEmptyStore();
  store.archivedRecords=[{id:'arch1',collection:'unknown',name:'Broken'}];
  assert.throws(()=>restoreRecord(store,'arch1'),/Unknown BUSINESS OS collection/);
  assert.equal(store.archivedRecords.length,1);
});
test('validateStore rejects malformed archived records and duplicate archived ids',()=>{
  const store=createEmptyStore();
  store.archivedRecords=[
    {id:'arch1',collection:'unknown',name:'Broken'},
    {id:'arch2',collection:'clients',name:'One'},
    {id:'arch2',collection:'clients',name:'Duplicate'}
  ];
  const validation=validateStore(store);
  assert.equal(validation.valid,false);
  assert.ok(validation.errors.some(error=>error.includes('invalid collection')));
  assert.ok(validation.errors.some(error=>error.includes('duplicate archived id')));
});
test('validateStore rejects archived records that collide with active ids',()=>{
  const store=createEmptyStore();
  store.clients=[{id:'c1',name:'Active'}];
  store.archivedRecords=[{id:'c1',collection:'clients',name:'Archived duplicate'}];
  const validation=validateStore(store);
  assert.equal(validation.valid,false);
  assert.ok(validation.errors.some(error=>error.includes('archived record conflicts with active record: clients:c1')));
});
test('collection guard is available to all persistence mutators',()=>{
  const store=createEmptyStore();
  assert.throws(()=>upsertRecord(store,'unknown',{id:'x'}),/Unknown BUSINESS OS collection/);
  assert.throws(()=>removeRecord(store,'unknown','x'),/Unknown BUSINESS OS collection/);
  assert.throws(()=>archiveRecord(store,'unknown','x'),/Unknown BUSINESS OS collection/);
});
test('restoreRecord rejects ambiguous archived ids across collections',()=>{
  const store=createEmptyStore();
  store.archivedRecords=[
    {id:'same',collection:'clients',name:'Client'},
    {id:'same',collection:'leads',name:'Lead'}
  ];
  assert.throws(()=>restoreRecord(store,'same'),/ambiguous archived record/);
  assert.equal(store.archivedRecords.length,2);
});
