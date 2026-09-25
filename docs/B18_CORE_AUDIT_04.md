# B18 CORE AUDIT 04 — Invoice, Client and Project Health Consistency

Date: 2026-09-25

## Findings

### 1. Invoice total was recalculated in UI

The invoice drawer manually reproduced subtotal, discount and tax math even though `calculateInvoice()` is the canonical financial engine.

**Fix:** invoice creation/edit now derives the total through `calculateInvoice()`, then passes that canonical total into `calculatePaymentPlan()`.

### 2. Client outstanding duplicated invoice arithmetic

The Clients table previously calculated:

`invoice amount total - all client payments`

This could diverge from invoice discounts/tax and the canonical payment status calculation.

**Fix:** client outstanding now sums `calculateInvoicePaymentStatus()` for each client invoice using linked client payments.

Client revenue remains the sum of received payments.

### 3. Project health over-budget condition was unreachable

`calculateProjectProfit()` intentionally clamps `budgetRemaining` to zero when a project is over budget. The UI checked `budgetRemaining < 0`, so the warning could never appear.

**Fix:** Project Health now checks the canonical `budgetUsed > budget` condition and reports the actual overage.

## Deliberately unchanged

- Proposal → Project conversion remains a domain workflow using the proposal's stored commercial value. No separate proposal calculator was introduced without a defined proposal pricing model.
- Project → Invoice conversion remains a workflow that seeds one invoice line from the project's billable revenue/budget. The invoice engine remains responsible for subsequent invoice math.
- Runtime browser QA and npm test execution are still not confirmed in this environment.

## Commit

Code: `7047962960bbb8ff185157b6d16ba2d339ee0817`
