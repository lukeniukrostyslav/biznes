import test from 'node:test';
import assert from 'node:assert/strict';
import { createEmptyStore, normalizeStore, loadStore, saveStore, upsertRecord, removeRecord, exportStore, importStore } from './persistence.js';

function memoryStorage() {
  const data = new Map();
  return { getItem:k=>data.get(k) ?? null, setItem:(k,v)=>data.set(k,v) };
}

test('creates a versioned empty store',()=>assert.equal(createEmptyStore().schemaVersion,1));
test('normalizes missing collections',()=>assert.deepEqual(normalizeStore({clients:[{id:'c1'}]}).leads,[]));
test('loads and saves JSON store',()=>{const s=memoryStorage(); let store=createEmptyStore(); store.clients.push({id:'c1',name:'Nova'}); store=saveStore(s,store); const loaded=loadStore(s); assert.equal(loaded.clients[0].name,'Nova');});
test('upserts and removes records',()=>{let store=createEmptyStore(); store=upsertRecord(store,'clients',{id:'c1',name:'Nova'}); store=upsertRecord(store,'clients',{id:'c1',name:'Nova Studio'}); assert.equal(store.clients.length,1); assert.equal(store.clients[0].name,'Nova Studio'); store=removeRecord(store,'clients','c1'); assert.equal(store.clients.length,0);});
test('exports and imports portable JSON',()=>{let store=createEmptyStore(); store=upsertRecord(store,'projects',{id:'p1',name:'Website'}); const restored=importStore(exportStore(store)); assert.equal(restored.projects[0].name,'Website');});
