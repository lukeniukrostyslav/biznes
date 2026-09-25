# B18 CORE AUDIT 03 — Validation Centralization + Dashboard Overdue Fix

Date: 2026-09-25

## Scope

Audit of the Leads → Clients → Proposals → Projects → Invoices → Payments → Expenses flow with focus on duplicate business rules and incorrect UI projections.

## Findings

### 1. UI relationship validation duplicated persistence core

The UI contained its own `validateStoredRelationships()` implementation duplicating:
- relation existence checks;
- cross-entity client consistency checks.

The canonical implementation already exists in `src/core/persistence.js` as `validateStore()`.

### Fix

The UI now imports `validateStore` and delegates:

```js
function validateStoredRelationships(store){
  return validateStore(store).errors;
}
```

This preserves the existing UI caller contract while making persistence the single source of truth.

### 2. Dashboard overdue list had a real status-object bug

The dashboard mapped invoices to:

```js
{ i, status: calculateInvoicePaymentStatus(...) }
```

but filtered with `x.status === 'Overdue'`, comparing the status object to a string.

### Fix

The filter now checks:

```js
x.status.status === 'Overdue'
```

This restores overdue invoice rendering in that dashboard path and keeps the status calculation centralized in the financial engine.

## Deliberately not changed

- `saveStore()` was not changed to throw on invalid state in this pass. That is a separate persistence-contract decision and should be covered by dedicated tests before changing runtime behavior.
- Proposal/project conversion and project/invoice creation were not given new engines merely to increase abstraction. Existing logic was retained where no duplicated financial calculation was identified.
- No UI redesign was performed. Core-first sequencing remains active.

## Verification status

Static source audit: completed.

Runtime browser verification: not completed in this environment.

Automated npm test runtime: not confirmed in this environment.

## Commit

Code commit: `0a8bf5dc0df1de7f4ea0edbf2014ee9890764b4f`
