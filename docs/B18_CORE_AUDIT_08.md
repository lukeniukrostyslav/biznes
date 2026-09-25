# B18 CORE AUDIT 08 — Canonical downstream relations

## Найдено
UI уже синхронизировал Client при переносе Payment на другой Invoice, но остальные downstream-связи требовали ручного согласования Client.

## Исправлено
При сохранении:
- Proposal + Lead → Client берётся от Lead;
- Project + Proposal → Client берётся от Proposal;
- Invoice + Project → Client берётся от Project;
- Expense + Project → Client берётся от Project;
- Payment + Invoice → Client уже синхронизировался ранее.

После этого весь candidate store всё равно проходит `validateStore()`.

## Результат
Перенос родительской связи больше не требует вручную менять Client в downstream-записи, а persistence остаётся последним барьером целостности.

## Коммиты
UI: `4c8df1c43d2457e9e4f65795ac01c04aab89f0c8`
Tests: `cb5dd2eb26869d9e5510ff3a4940cc3f596f33ae`

Runtime/browser QA всё ещё не подтверждён.
