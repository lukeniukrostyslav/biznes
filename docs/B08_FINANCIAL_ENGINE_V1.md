# B08 — ФИНАНСОВЫЙ ДВИЖОК V1

Дата: 2026-09-24

## Зачем

Конкуренты уже предлагают CRM, proposals, projects, invoices и payments. Например, HoneyBook включает invoices/payments, proposals/contracts и reports, а Moxie — client/project management, invoicing, proposals, time tracking, sales pipeline и basic accounting. Это означает, что финансовый движок BUSINESS OS должен быть частью основной бизнес-модели, а не дополнительным отчётом.

## 1. Денежные состояния

Разделять:

- Pipeline — потенциальная стоимость открытых opportunities.
- Weighted Pipeline — Pipeline × probability.
- Contracted — сумма принятых proposals/projects.
- Invoiced — сумма выставленных счетов.
- Paid — реально полученные платежи.
- Outstanding — Invoiced − Paid.
- Overdue — Outstanding по счетам после dueDate.
- Expenses — зарегистрированные расходы.
- Labour Cost — стоимость затраченного рабочего времени.
- Profit — Revenue − Expenses − Labour Cost.

## 2. Project economics

Для каждого проекта:

Revenue
Estimated Costs
Actual Costs
Estimated Hours
Actual Hours
Labour Rate
Labour Cost
Profit
Margin

### Формулы

Labour Cost = Actual Hours × Labour Rate

Profit = Revenue − Actual Costs − Labour Cost

Margin = Profit / Revenue × 100

Если Revenue = 0, Margin не вычисляется и показывается как тире.

## 3. Estimates vs Actuals

Оценка и факт никогда не смешиваются.

Пример:

Estimated:
Revenue €5,000
Costs €1,200
Hours 40

Actual:
Revenue €5,000
Costs €1,650
Hours 53

Dashboard должен показать отклонение.

## 4. Invoice calculations

Line total = quantity × unitPrice

Subtotal = sum(line totals)

Tax = Subtotal × taxRate / 100

Total = Subtotal + Tax

Paid = sum(successful payments)

Outstanding = max(Total − Paid, 0)

Invoice status:
Draft → Sent → Partially Paid → Paid
Sent → Overdue
Draft/Sent → Cancelled

## 5. Pipeline

Weighted Value = Deal Value × Probability

Пример:

€10,000 × 60% = €6,000 weighted pipeline.

Probability хранится у Lead/Opportunity.

## 6. Cashflow

Dashboard разделяет:

- Expected
- Invoiced
- Paid
- Outstanding
- Overdue

Expected никогда не показывается как полученные деньги.

## 7. Currency

Каждая финансовая сущность хранит currency.

Workspace имеет default currency.

UI форматирует деньги через locale-aware Intl.NumberFormat.

Никаких ручных символов валюты в production UI.

## 8. Precision

Внутри денежных расчётов использовать безопасное decimal representation.

UI округляет до 2 знаков, если валюта это допускает.

## 9. Pricing Engine

Inputs:
- target annual income
- annual business costs
- tax/reserve rate
- working weeks
- hours/week
- billable utilisation
- target profit margin

Расчётная последовательность должна быть прозрачной и показывать assumptions.

Pricing Engine выдаёт:
- minimum hourly rate
- target hourly rate
- premium hourly rate
- daily rate
- project guidance

## 10. Financial alerts

Dashboard может показывать:

- overdue invoice;
- project margin below target;
- project cost above estimate;
- unpaid invoice approaching due date;
- pipeline concentration;
- low upcoming cashflow.

Alerts должны приводить к действию, а не быть декоративными.

## 11. B08 acceptance criteria

B08 не считается завершённым до:
- unit tests расчётов;
- invoice status tests;
- payment reconciliation tests;
- project profit tests;
- margin edge-case tests;
- currency formatting tests;
- zero-revenue handling;
- estimate vs actual tests.

Текущий B08: 30% — финансовая модель и формулы V1 зафиксированы. Реальный расчётный код и тесты ещё не завершены.
