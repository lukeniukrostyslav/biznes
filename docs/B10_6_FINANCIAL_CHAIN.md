# B10.6 — Финансовая цепочка Payment → Invoice → Profit → Cashflow

Дата: 2026-09-24

## Реализовано

- Статус Invoice теперь выводится из связанных Payment.
- Даже если Invoice был сохранён как Draft, реальный Payment переводит его в Partially Paid или Paid.
- Forecast Payments больше не использует устаревший invoice.status; используется вычисленный финансовый статус.
- Полностью оплаченный Invoice с устаревшим статусом больше не попадает в ожидаемые платежи.
- Actual Cash остаётся основанным на фактически полученных Payment.
- Forecast Cash = фактические платежи + ожидаемые остатки − фактические расходы − плановые расходы.

## Проверки

Добавлены тесты на:
1. Draft → Partially Paid.
2. Draft → Paid.
3. stale Paid status + частичная фактическая оплата.
4. отсутствие ожидаемого платежа после полной оплаты.

## Конкурентный контекст

В актуальной документации HoneyBook указано, что их Cash Flow и Project Profit показывают только оплаченные платежи и не прогнозируют будущие запланированные платежи. BUSINESS OS сохраняет прозрачное разделение Actual и Forecast, чтобы пользователь видел не только уже полученные деньги, но и ожидаемый остаток по счетам. citeturn0search0

Dubsado и Bonsai также связывают Proposal с Invoice/Payment workflows; это подтверждает важность сквозного lifecycle, но BUSINESS OS реализует его как local-first систему без обязательного сервера. citeturn0search2turn0search9turn0search18

## Следующий технический приоритет

B10.7 — полноценный multi-line Invoice editor + discounts/tax correctness + payment schedule semantics.