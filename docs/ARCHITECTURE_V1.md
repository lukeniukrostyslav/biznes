# BUSINESS OS — АРХИТЕКТУРА V1

Дата: 2026-09-24

## 1. Архитектурный принцип

BUSINESS OS — local-first web application.

Core data lives in the user's browser. The product must work without a mandatory backend, account, subscription or paid API.

The application is organised around one connected business data model rather than isolated tools.

## 2. Главная бизнес-цепочка

**Lead → Client → Proposal → Project → Invoice → Payment → Profit → Repeat**

One record must be able to connect to the next stage without re-entering the same information.

## 3. Core entities

### Client
- id
- name
- company
- email
- phone
- status
- source
- lifetimeRevenue
- notes
- createdAt
- updatedAt

### Lead
- id
- name
- company
- contact
- source
- stage
- estimatedValue
- probability
- nextAction
- nextActionDate
- notes
- clientId (nullable)
- createdAt
- updatedAt

### Proposal
- id
- clientId
- leadId (nullable)
- title
- problem
- scope
- deliverables
- timeline
- price
- status
- sentAt
- expiresAt
- notes

### Project
- id
- clientId
- proposalId (nullable)
- name
- status
- budget
- estimatedHours
- actualHours
- directCosts
- startDate
- deadline
- progress
- notes

### Invoice
- id
- clientId
- projectId
- number
- issueDate
- dueDate
- currency
- taxRate
- lineItems
- subtotal
- tax
- total
- status

### Payment
- id
- invoiceId
- clientId
- amount
- date
- method
- reference
- notes

### Expense
- id
- projectId (nullable)
- clientId (nullable)
- category
- amount
- date
- description

## 4. Derived financial metrics

The dashboard must calculate rather than duplicate:

- pipeline value
- weighted pipeline
- contracted revenue
- invoiced revenue
- paid revenue
- outstanding invoices
- project cost
- project profit
- project margin
- client lifetime revenue
- monthly revenue
- monthly profit

### Project profit

**Profit = Project Revenue - Direct Costs - Allocated Labour Cost**

### Margin

**Margin = Profit / Project Revenue × 100**

The UI must distinguish estimates from actuals.

## 5. Product modules

1. Dashboard
2. Leads
3. Clients
4. Proposals
5. Projects
6. Invoices
7. Payments
8. Expenses
9. Pricing Engine
10. Profitability
11. Cashflow
12. Settings / Export / Import

## 6. Dashboard principle

The first screen should answer:

- How much money is expected?
- How much is outstanding?
- How much has been earned?
- Which projects are profitable?
- Which leads need action?
- What needs attention today?

Avoid vanity metrics that do not change an action.

## 7. Pricing Engine

Inputs:
- target annual income
- working weeks
- working hours/week
- billable utilisation
- business costs
- taxes/reserve
- target profit margin

Outputs:
- minimum hourly rate
- target hourly rate
- premium hourly rate
- daily rate
- project-rate guidance
- retainer guidance

Pricing recommendations must show assumptions so the user can understand the calculation.

## 8. Local-first persistence

State is stored locally.

Required:
- versioned state schema
- migration strategy
- autosave
- manual save status
- JSON export
- JSON import
- validation on import
- reset with confirmation

No sensitive business data is sent to a server by the core application.

## 9. Localization

Launch languages:
- English
- Spanish
- German
- French
- Russian

No hard-coded user-facing strings outside the localization system.

## 10. Responsive boundary

Desktop:
- persistent sidebar
- multi-column dashboard

Mobile:
- compact navigation
- single-column primary workflow
- bottom/sticky primary actions where useful
- tables become cards/stacked rows

The mobile version must remain fully functional.

## 11. Commercial boundary

Target:
- one-time purchase
- $79–99 price hypothesis

Not part of the core architecture:
- mandatory subscription
- mandatory cloud backend
- Notion integration
- paid AI/search API
- guaranteed income claims

## 12. Competitive design requirement

Current marketplace research shows $79–99 OS products are already sold, particularly as Notion systems. Easlo Freelance OS is listed at $79 with 858 sales and includes CRM, deals pipeline, projects/tasks and invoice tracking. Notion4Agencies lists Business OS at $99+ and multiple niche OS products between $49 and $249. citeturn0search0turn0search1

Therefore BUSINESS OS must not be differentiated merely by having the same list of modules.

Primary differentiation:
**connected money flow + local-first software + one-time purchase + private data + actionable profitability.**

## 13. Architecture acceptance criteria

B04 is complete only when:
- entity relationships are documented;
- derived financial calculations are defined;
- module boundaries are defined;
- persistence contract is defined;
- localization boundary is defined;
- responsive boundary is defined;
- commercial exclusions are defined;
- implementation can proceed without inventing core data relationships.
