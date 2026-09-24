# B05–B12 Core Audit 01

Дата: 2026-09-25

## Найденная проблема

UI-валидация нового/редактируемого платежа самостоятельно пересчитывала outstanding invoice как subtotal + tax, не учитывая discount.

Это создавало риск расхождения между UI и Financial Engine.

## Исправление

Payment validation теперь использует:

`calculateInvoicePaymentStatus(invoice, linkedPayments, now)`

как единственный источник outstanding.

Это автоматически учитывает:
- line items;
- discount;
- tax;
- фактически связанные payments;
- редактируемый payment исключается из расчёта.

## Commit

66ca7ad98fca39dc30a53cdced0514ac3be6bf7c

## Статус

Source-level audit выполнен.
Runtime test не подтверждён в текущей среде.
Проценты блоков не повышены только из-за этого исправления.
