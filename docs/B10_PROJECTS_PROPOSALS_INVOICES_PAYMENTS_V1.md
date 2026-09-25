# B10 — Projects / Proposals / Invoices / Payments — CLOSED

Дата: 2026-09-25

## Итог

B10 закрыт на 100%. Основной lifecycle теперь имеет единый проверяемый путь:

Proposal → Project → Invoice → Payment → Outstanding / Paid state.

## Реализованные уровни

1. Proposal model, editing, pricing and lifecycle.
2. Proposal → Project conversion with client inheritance and duplicate protection.
3. Project model, revenue/budget/cost/hour/labour fields.
4. Project → Invoice conversion with billable and amount safeguards.
5. Multi-line Invoice calculation.
6. Discount and tax calculation.
7. Due-date and invoice payment status calculation.
8. Payment creation, invoice/client integrity and partial/full payment handling.
9. Payment plans with fixed/percentage/equal installments.
10. FIFO and explicit installment allocation for actual payments.
11. Proposal → Project → Invoice lifecycle.
12. Project → Invoice → Payment lifecycle.
13. Canonical relationship validation and persistence protection.
14. EN/ES/DE/FR/RU UI coverage and existing responsive/mobile surfaces.
15. Dedicated B10 lifecycle engine and regression tests.

## Новая архитектура

src/core/b10-lifecycle-engine.js содержит:

- proposal conversion guards;
- project builder from accepted/won proposal;
- invoice builder from billable project;
- lifecycle relationship validation;
- semantic financial-state validation.

UI conversion actions now use this shared engine instead of duplicating lifecycle construction logic in app/index.html.

## QA

GitHub Actions Run #81: **success**.

- Tests: 95/95
- Failures: 0
- Static app syntax/wiring: passed
- B10 lifecycle tests: passed

## Sub-blocks

B10.1–B10.33: **100%**.

Browser/E2E testing remains part of the later B14 QA block and is not falsely counted as completed here.

## GitHub

Relevant commits:
- db44cc86c7fa5289fe4a4b0018d17472f45287c1 — B10 lifecycle engine
- e5dc60885de9b40de4101b7cf5250580e0417e2d — B10 lifecycle tests
- 031a569113346722fccc4ea071790b27f6dc080f — UI integration
- 13412eb5ca5fbbd8fa89e34ab02699b816a1dfd3 — test correction + passing CI
- 9fc1ddb9d75d303fda92c9a99fe19a6dc175893a — progress closure

Следующий блок: B11 — Cashflow / Dashboard / Analytics.
