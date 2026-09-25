import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_PIPELINE_STAGES, normalizeStage, normalizeLead,
  calculateCrmPipeline, convertLeadToClient, validateCrm
} from './crm-engine.js';

test('B09.1 defines canonical CRM pipeline stages', () => {
  assert.deepEqual(DEFAULT_PIPELINE_STAGES, ['New','Qualified','Proposal','Negotiation','Won']);
  assert.equal(normalizeStage('qualified'), 'Qualified');
  assert.equal(normalizeStage('unknown'), 'New');
});

test('B09.2 normalizes lead fields safely', () => {
  const lead = normalizeLead({id:'l1', title:'Acme', value:'1250', probability:80, status:'proposal'});
  assert.equal(lead.name, 'Acme');
  assert.equal(lead.value, 1250);
  assert.equal(lead.probability, 80);
  assert.equal(lead.status, 'Proposal');
  assert.equal(lead.updatedAt.length > 0, true);
});

test('B09.3 pipeline groups leads by stage', () => {
  const result = calculateCrmPipeline([
    {id:'1',name:'A',status:'New',value:100},
    {id:'2',name:'B',status:'Qualified',value:200},
    {id:'3',name:'C',status:'Won',value:500}
  ]);
  assert.equal(result.byStage.New.length, 1);
  assert.equal(result.byStage.Qualified.length, 1);
  assert.equal(result.byStage.Won.length, 1);
});

test('B09.4 active pipeline excludes terminal outcomes', () => {
  const result = calculateCrmPipeline([
    {id:'1',status:'New',value:100,probability:50},
    {id:'2',status:'Won',value:500,probability:100},
    {id:'3',status:'Lost',value:300,probability:50}
  ]);
  assert.equal(result.pipelineValue, 100);
  assert.equal(result.weightedValue, 50);
  assert.equal(result.activeCount, 1);
});

test('B09.5 search filters CRM records across common fields', () => {
  const result = calculateCrmPipeline([
    {id:'1',name:'Alpha Studio',email:'a@example.com'},
    {id:'2',name:'Beta Labs',email:'b@example.com'}
  ], {query:'alpha'});
  assert.equal(result.leads.length, 1);
});

test('B09.6 stage filter returns only the selected stage', () => {
  const result = calculateCrmPipeline([
    {id:'1',status:'New'},
    {id:'2',status:'Proposal'}
  ], {stage:'proposal'});
  assert.equal(result.leads.length, 1);
  assert.equal(result.leads[0].status, 'Proposal');
});

test('B09.7 lead to client conversion creates a linked client', () => {
  const result = convertLeadToClient({id:'lead_1',name:'Acme',email:'a@example.com',status:'Won'}, []);
  assert.equal(result.client.id, 'client_lead_1');
  assert.equal(result.lead.clientId, result.client.id);
});

test('B09.8 conversion reuses an existing client by email', () => {
  const client = {id:'client_9',name:'Acme',email:'a@example.com'};
  const result = convertLeadToClient({id:'lead_1',name:'Acme',email:'a@example.com',status:'Won'}, [client]);
  assert.equal(result.client.id, 'client_9');
  assert.equal(result.existingClientId, 'client_9');
});

test('B09.9 conversion rejects non-won leads', () => {
  assert.throws(() => convertLeadToClient({id:'lead_1',status:'Qualified'}, []), /Only Won leads/);
});

test('B09.10 CRM validation catches missing relations and invalid probability', () => {
  const result = validateCrm({
    clients: [],
    leads: [{id:'l1',clientId:'missing',probability:101}]
  });
  assert.equal(result.valid, false);
  assert.equal(result.errors.length, 2);
});

test('B09.11 pipeline handles empty and malformed collections', () => {
  const result = calculateCrmPipeline(null);
  assert.equal(result.leads.length, 0);
  assert.equal(result.pipelineValue, 0);
  assert.equal(result.weightedValue, 0);
});

test('B09.12 weighted pipeline is calculated from probability', () => {
  const result = calculateCrmPipeline([
    {id:'1',status:'Qualified',value:1234.56,probability:25},
    {id:'2',status:'Negotiation',value:1000,probability:80}
  ]);
  assert.equal(result.weightedValue, 1108.64);
});
