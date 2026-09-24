# BUSINESS OS — UX/UI COMPETITIVE BRIEF V1

Дата: 2026-09-24

## Что проверено

Перед проектированием интерфейса повторно проверены актуальные публичные предложения freelancer/business-management software.

- Bonsai: CRM, projects, proposals/contracts, invoices/payments, expenses/income; Premium добавляет pipeline и profit/productivity reports. citeturn0search1
- HoneyBook/Dubsado/Bonsai/Moxie находятся в подписочной модели; актуальные публичные цены и состав функций проверены в августе 2026. citeturn0search0turn0search3
- Easlo Freelance OS: $79 lifetime, 858 sales; Notion-система с CRM, deals pipeline, projects/tasks и invoice tracker. citeturn0search4
- Notion4Agencies продаёт Business OS за $99+ и специализированные OS в диапазоне от $49 до $249+. citeturn0search5turn0search10
- Agency Lab OS отдельно подчёркивает прибыль, margin, клиентские и подрядные счета и расходы проекта. citeturn0search14

## UX-решение BUSINESS OS

Мы не копируем структуру Notion-шаблонов и не пытаемся повторить SaaS по количеству функций.

### Главный экран

Dashboard должен отвечать на 6 вопросов:

1. Сколько денег в pipeline?
2. Сколько уже заработано?
3. Сколько должны заплатить?
4. Какие проекты дают прибыль?
5. Какие лиды требуют действия?
6. Что нужно сделать сегодня?

### Навигация

Dashboard
Leads
Clients
Proposals
Projects
Invoices
Payments
Expenses
Profit
Cashflow
Settings

## Ключевой UX-принцип

Каждая сущность должна вести к следующему действию.

Lead → Next action
Client → Open opportunities / projects
Proposal → Convert to project
Project → Create invoice
Invoice → Record payment / follow-up
Project → Profit

## Финансовая иерархия

На Dashboard не перегружать пользователя десятками KPI.

Первый уровень:
- Revenue
- Outstanding
- Pipeline
- Profit

Второй уровень:
- margin
- overdue invoices
- upcoming payments
- project profitability

Третий уровень:
- детальная аналитика.

## Главная дифференциация

Конкуренты уже закрывают широкий workflow. Поэтому наша UX-ценность должна быть не «у нас больше кнопок», а:

**меньше ручного ввода → меньше переключений → быстрее понять деньги → быстрее принять решение.**

## Mobile

На мобильном первый экран должен сохранять четыре ключевых числа:
Revenue / Outstanding / Pipeline / Profit.

Таблицы превращаются в карточки, вторичные поля скрываются до раскрытия, primary action остаётся доступным.

## UX acceptance criteria

B05 может перейти выше 20% только после создания и проверки реальных экранов.

Concept ≠ implementation.
Mockup ≠ functional UI.
Красивый экран без связанной data flow не считается готовым блоком.
