# B18 CORE AUDIT 07 — Persistence contract

## Решение
Persistence теперь сама гарантирует целостность при `saveStore()`, а не полагается только на UI.

## Изменение
`saveStore()`:
1. normalizes store;
2. запускает `validateStore()`;
3. при ошибках не пишет данные в storage;
4. выбрасывает ошибку с причинами.

Это закрывает риск, при котором другой caller мог записать в localStorage некорректные relations, duplicate IDs или отрицательные monetary fields.

## QA coverage added
Добавлены тесты:
- invalid relationship state cannot be persisted;
- полный archive dependency chain Client → Proposal → Project → Invoice → Payment / Expense.

## Важное ограничение
Автоматический runtime test execution в этой сессии не подтверждён. Поэтому тесты добавлены и код проверен статически, но результат выполнения test runner не объявляется PASS.

## Коммиты
Persistence: `ecb3504f2c4d7c46fc6a97d79108ba4cb28ca1a9`
Tests: `f93bf2d1d185b581b6b198d558013a937fd3a27f`
