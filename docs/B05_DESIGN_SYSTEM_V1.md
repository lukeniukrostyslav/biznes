# B05 — DESIGN SYSTEM V1

Дата: 2026-09-24

## Рыночный вывод

Публичный рынок 2026 показывает две группы: подписочные business-management продукты (HoneyBook, Dubsado, Bonsai, Moxie) и lifetime Notion/OS продукты. Подписочные продукты уже имеют широкий функциональный охват, поэтому BUSINESS OS не должен конкурировать количеством функций. citeturn0search0turn0search1turn0search7

## Design direction

### Визуальная идея
Premium financial command center:
- светлая рабочая область;
- тёмная навигационная панель;
- сдержанные акцентные цвета;
- высокая плотность информации без визуального шума;
- большие числовые KPI;
- чёткая типографическая иерархия.

### Layout

Desktop:
- sidebar 240–260px;
- topbar;
- content max-width;
- responsive grid.

Mobile:
- compact top bar;
- bottom navigation / compact navigation;
- stacked cards;
- sticky primary action.

## Основные UI primitives

- Button
- Input
- Select
- Currency Input
- Date Input
- Search
- Status Badge
- KPI Card
- Data Card
- Table
- Mobile List Card
- Empty State
- Modal
- Drawer
- Toast
- Confirm Dialog
- Progress
- Currency/Number formatter

## KPI hierarchy

Level 1:
Revenue / Outstanding / Pipeline / Profit

Level 2:
Margin / Overdue / Upcoming / At Risk

Level 3:
detailed charts and tables.

## Interaction rules

1. Primary action — одна очевидная.
2. Destructive action — всегда подтверждение.
3. Financial numbers — currency-aware.
4. Estimates и actuals визуально различаются.
5. Empty state всегда объясняет следующий шаг.
6. После изменения финансовой сущности связанные показатели обновляются.
7. Никаких hard-coded UI strings.

## Accessibility baseline

- keyboard navigation;
- visible focus;
- semantic labels;
- sufficient contrast;
- no information conveyed by color alone;
- touch targets suitable for mobile.

## B05 progress

B05 повышается с 20% до **35%**: design system primitives, layout direction, hierarchy и interaction rules зафиксированы документально.

Реальный coded UI ещё не считается завершённым.
