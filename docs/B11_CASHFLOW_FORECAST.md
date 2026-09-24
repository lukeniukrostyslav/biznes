# B11 — Cashflow Forecast Checkpoint

Дата: 2026-09-24

## Реализовано

BUSINESS OS теперь имеет date-aware cashflow forecast на 30 дней.

Источник данных:
- реальные Payments;
- реальные Expenses;
- Payment Plan installments;
- Invoice dueDate для счетов без payment plan;
- Planned Expenses.

Для каждого будущего cash movement рассчитываются:
- дата;
- тип: expected payment / planned expense;
- сумма;
- invoice/installment или expense;
- статус installment.

Рассчитываются:
- currentNetCash = actual paid - actual expenses;
- futureInflows;
- futureExpenses;
- forecastNetCash = currentNetCash + futureInflows - futureExpenses.

## Важное правило

Прошедшие overdue payments не считаются будущим cashflow. Они остаются outstanding/overdue и требуют отдельного follow-up, но не создают ложного будущего притока денег.

Actual cash и Forecast cash разделены.

## UX

Статический Cashflow prototype заменён на данные из persistence store:
- Cash received;
- Outstanding;
- Next 30 days;
- Planned expenses;
- Current net cash;
- Expected inflows;
- Expected outflows;
- timeline ближайших движений.

## Конкурентный benchmark

Dubsado использует payment-plan due dates для определения ожидаемых платежей и overdue reporting, а также различает payment plans и recurring invoices. citeturn0search0turn0search3

BUSINESS OS пока намеренно не добавляет:
- autopay;
- email reminders;
- payment processor;
- client portal;
- recurring billing.

Это отдельные будущие решения, а не обязательные функции для текущего ядра.

## QA

Добавлен unit-test для:
- installment due dates;
- partial payment allocation;
- future inflows;
- planned future expenses;
- 30-day forecast net cash.

Полный browser/E2E QA ещё не завершён, поэтому B13/B14 не повышаются.
