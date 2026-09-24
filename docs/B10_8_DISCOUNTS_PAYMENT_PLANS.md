# B10.8 — Discounts + Payment Plans

Дата: 2026-09-24

## Реализовано
- Invoice поддерживает скидку: None / Percentage / Fixed amount.
- Скидка применяется до налога.
- Percentage discount ограничен 0–100%.
- Fixed discount не может уменьшить taxable subtotal ниже нуля.
- Добавлен Payment Plan с несколькими installments.
- Типы installments: Equal, Percentage, Fixed.
- Каждая installment может иметь отдельную дату платежа.
- Payment Plan проверяется относительно итоговой суммы Invoice.
- План с расхождением более 0.01 блокируется при сохранении.
- Старые invoices без скидки и paymentPlan остаются совместимыми.
- Financial engine экспортирует calculatePaymentPlan.
- Добавлены тесты discount-before-tax и payment-plan validation.

## Конкурентное исследование
Dubsado поддерживает скидки fixed/percentage и payment plans с Fixed, Percentage и Divide equally, а также отдельными due dates. citeturn0search0turn0search1turn0search4
В BUSINESS OS реализована та же бизнес-математика на local-first основе, но без обязательного платёжного процессора или сервера.

## Следующий приоритет
B10.9 — Payment Plan ↔ actual Payments: распределение фактических платежей по installments, paid/partial/overdue статус каждой installment и Forecast Cash по датам.