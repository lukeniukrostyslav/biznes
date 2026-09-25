# B18 CORE AUDIT 05 — Payments, Expenses and Profit/Cashflow Consistency

Date: 2026-09-25

## Findings

### 1. Editing/moving a payment could leave the client relation stale

When a payment was edited and its invoice changed, the drawer rejected the save if the previously selected client did not match the new invoice client.

**Fix:** the invoice is now the canonical source for the payment's client relation when an invoice has a client. The payment client is synchronized to the selected invoice client before persistence. This keeps payment → invoice → client integrity consistent while allowing a payment to be moved between invoices during editing.

### 2. Profit export included planned operating expenses

The Profit screen correctly excluded planned expenses from operating costs, but the CSV export used a broader `!projectId` filter and therefore could include Planned expenses in operating costs.

**Fix:** Profit export now uses the same actual-expense rule as the Profit screen:
- `status !== 'Planned'`
- `planned !== true`

This prevents planned expenses from reducing exported actual net profit.

### 3. Expense/project profit behavior

`calculateProjectProfit()` remains the canonical source for project-linked actual/planned expenses:
- actual project expenses contribute to actual costs;
- Planned expenses contribute only to forecast costs;
- labour cost is calculated separately from actual hours × labour rate.

No change was made to `actualCosts` semantics because the product currently treats that field as direct project costs while linked expenses are separate records. Changing this without a dedicated domain decision could create a migration/data interpretation problem.

### 4. Cashflow consistency

Dashboard and Cashflow use `calculateBusinessMetrics()` / `calculateCashflowForecast()` rather than the legacy `calculateCashflow()` helper. No active UI call to `calculateCashflow()` was found, so no change was made there.

### 5. Clients screen navigation typo

The Clients screen opening tag had the `class="screen"` attribute outside the element, which could break screen switching because navigation relies on the `.screen` class.

**Fix:** restored the correct `<div id="clientsScreen" class="screen">` markup.

### 6. Cross-entity workflow integrity tests

Added persistence tests covering the complete client consistency chain:
Lead → Proposal → Project → Invoice → Payment / Expense.

The tests also verify that a payment can move to another invoice only when its client relation is updated consistently.

## Deliberately unchanged

- Billable expense remains metadata only; there is no defined reimbursement/invoicing workflow yet.
- Planned expense classification remains `status === 'Planned' || planned === true` in the financial engine.
- Runtime browser QA and npm test execution remain unconfirmed in this environment.

## Commit

Code: a326469b44084059b7dcbef070406ed3b3c95c26
