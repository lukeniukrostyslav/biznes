# B05 — SCREEN ARCHITECTURE V1

Дата: 2026-09-24

## Цель

Перевести UX-концепцию в конкретную карту продукта до начала массовой реализации UI.

## Главная навигация

1. Dashboard
2. Leads
3. Clients
4. Proposals
5. Projects
6. Invoices
7. Payments
8. Expenses
9. Profit
10. Cashflow
11. Settings

## Dashboard

### Верхний уровень
- Revenue
- Outstanding
- Pipeline
- Profit

### Action layer
- Follow-ups today
- Overdue invoices
- Projects at risk
- Proposals awaiting response

### Context layer
- Revenue trend
- Pipeline by stage
- Project margin
- Recent payments

## Leads

Список → карточка лида → следующее действие.

Обязательные действия:
- создать лид
- изменить stage
- назначить next action
- создать/связать Client
- создать Proposal

## Clients

Карточка клиента должна быть единым контекстом:
- контактные данные
- leads
- proposals
- projects
- invoices
- payments
- lifetime revenue
- outstanding
- notes

## Proposals

Proposal создаётся из Lead/Client.

Основные действия:
- Draft
- Send
- Accept
- Reject
- Convert to Project

## Projects

Карточка проекта:
- revenue
- estimated cost
- actual cost
- estimated hours
- actual hours
- profit
- margin
- invoices
- payments
- expenses
- deadline

Главный CTA: финансовый контроль проекта.

## Invoices

Основные статусы:
- Draft
- Sent
- Partially Paid
- Paid
- Overdue
- Cancelled

Invoice связан с Client и Project.

## Payments

Каждый платёж привязан к Invoice.

После записи платежа Dashboard и Client/Project financial metrics пересчитываются автоматически.

## Profit

Экран отвечает на:
- какие проекты прибыльны;
- где маржа снижается;
- сколько времени съедает проект;
- где расходы превышают ожидание.

## Cashflow

Разделяет:
- expected
- invoiced
- paid
- outstanding
- overdue

Не смешивать ожидаемые деньги с реально полученными.

## Mobile UX

На мобильном:
- Dashboard сохраняет 4 главных KPI;
- списки превращаются в карточки;
- detail screens используют вертикальную иерархию;
- primary CTA всегда доступен;
- вторичные поля раскрываются по необходимости.

## Design system requirements

- единая spacing scale;
- единые card/button/input primitives;
- единые статусные компоненты;
- единые currency/date/number formats;
- все тексты через locale dictionaries;
- accessibility: keyboard/focus/contrast/labels.

## B05 completion rule

Текущий B05 остаётся 20%.

Карта экранов и UX-архитектура подготовлены, но реальные UI-компоненты ещё не реализованы и не проверены.
