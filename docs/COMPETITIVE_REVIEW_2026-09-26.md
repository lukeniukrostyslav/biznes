# Competitive Review — 2026-09-26

## Scope
Review of current official product pages for freelancer and small-business management software. The purpose is to identify expected workflows and quality gates for BUSINESS OS, not to copy another product.

## Competitor observations

### Bonsai
Current product materials cover CRM, clients/projects, time tracking, tasks, invoices/payments, proposals/contracts, expenses/income, project insights, deals pipeline, profitability reporting and integrations. Bonsai also documents client/project-specific rate cards, role-based rates, budgeting and margin tracking.

### HoneyBook
Current product materials combine CRM, leads, projects, proposals, contracts, invoices, payments, scheduling, automations and client portal workflows. Its pricing materials also highlight payment tracking, recurring/custom invoices, reminders, payment plans, discounts and late fees.

### Indy
Current product materials cover proposals, contracts, invoices, clients, projects, calendar, forms, tasks, time tracking and file storage. Its current pricing materials distinguish a free tier from a paid bundle with unlimited proposals/contracts/invoices/clients, templates, recurring invoices and integrations.

### FreshBooks
Current product materials emphasize invoicing, expenses, estimates/proposals, payments, financial reports and project profitability. Its profitability documentation covers billed income, costs, profit, margin, capacity, cost rates, estimates and expense markup.

## Product requirements derived from the review

1. Production starts with an empty workspace.
2. No fake clients, leads, projects, invoices, payments, expenses, prices or profit metrics are seeded.
3. Financial totals remain zero until the user creates real records.
4. Every financial number must be derived from stored user records rather than hardcoded demo values.
5. Client context should connect clients to projects, invoices, payments and activity.
6. Project profitability must show revenue, costs, profit and margin from real records.
7. Pricing/rate assumptions must be editable rather than hidden constants.
8. Invoice workflows need line items, discounts, tax, due dates and payment plans.
9. Payment workflows need invoice linkage and allocation.
10. Cashflow must distinguish received, outstanding, expected and planned amounts.
11. Export/import must preserve the user's complete local dataset.
12. Demo/sample content, when needed for marketing screenshots, must stay outside the production data store and must never be inserted automatically into a user's workspace.
13. The UI must remain useful with zero records: clear empty states and explicit first actions instead of fake activity.

## Current BUSINESS OS implementation note

The functional app already uses an EMPTY_STORE with all seven business collections initialized as empty arrays and loads that store when no persisted data exists. Regression coverage now protects this behavior.
