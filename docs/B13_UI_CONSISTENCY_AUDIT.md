# B13 — UI Consistency Audit

Дата: 2026-09-24

## Цель
Проверить существующий интерфейс BUSINESS OS после добавления финансовых функций, не меняя дизайн-систему и не добавляя функции ради количества.

## Проверено по исходному коду
- Dashboard;
- Leads;
- Clients;
- Proposals;
- Projects;
- Invoices;
- Payments;
- Expenses;
- Profit;
- Cashflow;
- общий create/edit drawer;
- responsive CSS;
- EN/RU/ES/DE/FR language switcher.

## Найденные реальные несоответствия

### 1. Локализация покрывает не весь UI

**Статус: частично исправлено.** Основные Dashboard, drawer, invoice lines и payment-plan динамические элементы теперь имеют общий translation layer; отдельные статические таблицы и вторичные labels ещё требуют browser pass.
Основные заголовки и часть описаний переводятся, но значительная часть dashboard и drawer остаётся с hardcoded English labels.
Примеры: Invoice line — Description / Qty / Unit price; Payment Plan — Type / Amount / Due date / Remove; Invoice — Tax rate / Discount / Due date; Project finance fields; Expense fields; часть таблиц и статусов; верхние действия Export / Import / New.
Следствие: при переключении языка экран не становится полностью однородным.

### 2. Валюта

**Статус: исправлено для текущей V1-модели.** UI и financial engine выровнены на EUR через единый UI source-of-truth. Пользовательская смена валюты пока намеренно не добавлялась как отдельная функция.
UI-функция money() форматирует USD, тогда как financial engine по умолчанию использует EUR. Это создаёт риск расхождения между отображением и расчётной моделью.
Решение: определить единый source of truth для currency и провести один системный pass.

### 3. Dashboard содержит остаточные demo-блоки

**Статус: исправлено в ключевых областях.** Revenue & Profit, Cashflow Overview, Follow-ups, Overdue Invoices и Project Profitability теперь строятся из store/financial engine; при отсутствии данных показывается empty state.
Некоторые элементы dashboard ещё имеют статические demo-значения: Revenue & Profit chart; часть Cashflow Overview; Follow-ups; Overdue Invoices; Project Profitability.
Основные финансовые метрики и Cashflow уже подключены к store/engine.
Следствие: до полноценного E2E нельзя считать dashboard полностью data-driven.

### 4. Mobile
Responsive CSS уже есть, включая mobile bottom navigation, горизонтальные таблицы и узкие payment-plan/invoice rows. Полноценная browser/mobile QA ещё не выполнена.

## Следующий шаг
Не добавлять новые бизнес-функции.
1. UI localization consistency pass EN/RU/ES/DE/FR.
2. Currency source-of-truth pass.
3. Убрать только те статические demo-значения, которые уже имеют реальные данные в store/engine.
4. Проверить create/edit drawer на mobile.
5. Проверить длинные локализованные строки.
6. После этого выполнить browser/E2E QA.

## Правило прогресса
B13 и B14 не повышаются только за наличие CSS или кода. Процент увеличивается после фактически выполненной и проверенной части QA.

## Последний checkpoint — 2026-09-24

Выполнен data-driven Dashboard pass и дополнительный localization consistency pass. Следующий обязательный этап — browser/mobile visual QA; без него B13 не закрывается.
