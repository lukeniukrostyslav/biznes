# BUSINESS OS — Architecture Reorder & Core Audit

Дата: 2026-09-25

## Решение

Дальнейшая разработка переводится на принцип:

**Data Model → Business Engine → Domain Functions → Integration → Persistence → UI → Localization → Responsive → QA → Commercial**

Цель — прекратить цикл переделок UI при изменении бизнес-логики.

## Фактическое состояние core

### Financial Engine
Файл: `src/core/financial-engine.js`

Подтверждены функции:
- roundMoney
- lineTotal
- calculateInvoice
- calculatePaymentPlan
- allocatePaymentPlan
- calculateInvoicePaymentStatus
- calculateProjectProfit
- calculatePipeline
- calculateCashflow
- calculateCashflowForecast
- calculateBusinessMetrics
- formatMoney

Размер: 15,470 символов.

Тесты:
- `src/core/financial-engine.test.js`
- 22 test() блока
- 89 assert-вызовов

### Persistence
Файл: `src/core/persistence.js`

Подтверждены функции:
- clone
- createId
- createEmptyStore
- migrateStore
- validateStore
- normalizeStore
- loadStore
- saveStore
- archiveRecord
- restoreRecord
- upsertRecord
- removeRecord
- exportStore
- importStore
- clearStore

Тесты:
- `src/core/persistence.test.js`
- 15 test() блоков
- 24 assert-вызова

## Важное ограничение

Наличие тестов подтверждено по source. Их успешный runtime-запуск в текущей среде не подтверждён, поэтому статус core QA не повышается только по наличию тестов.

## Новый порядок блоков

B00–B04 — сохранить как baseline.

Дальше:

B05 Data Model
B06 Financial / Business Engine
B07 Leads
B08 Clients
B09 Proposals
B10 Projects
B11 Invoices
B12 Payments
B13 Expenses
B14 Profit
B15 Cashflow
B16 Dashboard / Business Metrics
B17 Cross-entity workflows
B18 Persistence / Migration / Integrity
B19 Export / Import
B20 UX/UI
B21 Localization
B22 Responsive
B23 Functional QA
B24 Data Integrity QA
B25 Browser QA
B26 Mobile QA
B27 Regression QA
B28 Commercial Packaging
B29 Sales / Distribution

Нумерация является рабочей дорожной картой и не означает автоматического изменения старых исторических checkpoint-номеров.

## Правило перехода

UI считается готовым только после того, как underlying function существует и проверена.

Новые функции не добавляются ради увеличения количества. Сначала закрываются существующие бизнес-сценарии.

## Следующий рабочий этап

Не переделывать дизайн.

Сначала провести детальный аудит B05–B19:
1. Data Model
2. Financial Engine
3. Leads
4. Clients
5. Proposals
6. Projects
7. Invoices
8. Payments
9. Expenses
10. Profit
11. Cashflow
12. Dashboard Metrics
13. Cross-entity workflows
14. Persistence
15. Export/Import

После аудита — закрывать реальные пробелы core по одному блоку и только затем возвращаться к визуальному QA.

## Текущий baseline

B05 UX/UI остаётся исторически 100% как дизайн-архитектура, но финальный visual/browser QA не выполнен.

B13 Responsive/Mobile QA остаётся 22%.

B14 Functional/E2E QA остаётся 0%.

Не повышать проценты только на основании source inspection.
