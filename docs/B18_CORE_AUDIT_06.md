# B18 CORE AUDIT 06 — Canonical metrics alignment

## Цель
Проверить, что Dashboard, Invoices и Profit не используют устаревшие сохранённые денежные поля там, где уже существует Financial Engine как канонический источник.

## Найдено
1. Invoice KPI «Invoiced» суммировал `amount/value` из store напрямую. Это могло расходиться с line items, discount и tax.
2. Collection rate использовал тот же потенциально устаревший denominator.
3. Dashboard chart «Revenue & Profit» вычитал planned expenses из исторических месяцев, хотя KPI Profit считает только actual expenses.
4. Profit CSV экспортировал `directCosts`, тогда как экран Profitability показывает `actualCosts` (direct costs + project expenses + labour).

## Исправлено
- Invoice KPI теперь считает total через `calculateInvoice()`.
- Collection rate использует `metrics.invoiced`, рассчитанный Financial Engine.
- Dashboard chart учитывает только actual expenses.
- Profit CSV использует `actualCosts`, чтобы совпадать с экраном.
- Profit summary Direct Costs теперь соответствует тем же project-level actual costs, что используются в таблице.

## Коммит
`9075029130dd304e186388b87f2f0f57c2e17842`

## Ограничение QA
Runtime/browser QA ещё не выполнен. Поэтому это подтверждённое исправление исходного кода, а не утверждение, что UI уже прошёл браузерный тест.
