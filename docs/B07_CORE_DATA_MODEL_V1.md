# B07 — CORE DATA MODEL V1

## Цель

Перевести BUSINESS OS из набора экранов в единую доменную модель, чтобы один объект проходил весь денежный цикл:

**Lead → Proposal → Project → Invoice → Payment → Expense → Profit**

## Основные сущности

### Client
- id
- name
- email
- phone
- company
- status
- notes
- createdAt
- updatedAt

### Lead
- id
- clientId
- title
- stage
- value
- probability
- nextAction
- nextActionAt
- notes
- createdAt
- updatedAt

### Proposal
- id
- clientId
- leadId
- title
- status
- subtotal
- tax
- total
- validUntil
- sentAt
- acceptedAt
- notes

### Project
- id
- clientId
- proposalId
- name
- status
- revenue
- estimatedHours
- actualHours
- labourRate
- estimatedCosts
- actualCosts
- startDate
- dueDate
- notes

### Invoice
- id
- clientId
- projectId
- number
- status
- issueDate
- dueDate
- lineItems[]
- taxRate
- paidAmount
- notes

### Payment
- id
- clientId
- projectId
- invoiceId
- amount
- date
- method
- reference
- notes

### Expense
- id
- projectId
- clientId
- category
- amount
- date
- description
- recurring

## Derived metrics

Не храним как независимую истину:
- outstanding;
- invoice status;
- project profit;
- project margin;
- weighted pipeline;
- cashflow totals;
- dashboard KPIs.

Они рассчитываются из исходных данных через финансовый engine. Это снижает риск расхождения между экранами.

## Связи

`Client 1:N Lead`

`Client 1:N Proposal`

`Client 1:N Project`

`Proposal 1:1 Project` — когда предложение принято и создан проект.

`Project 1:N Invoice`

`Invoice 1:N Payment`

`Project 1:N Expense`

## Правила идентификаторов

Все сущности получают стабильный локальный ID. UI не должен зависеть от названия клиента или номера строки таблицы.

## Следующий технический шаг

B07.2 — local-first persistence layer:
1. единый store;
2. schema version;
3. localStorage/IndexedDB стратегия;
4. create/update/delete;
5. связь UI с store;
6. экспорт/импорт JSON;
7. миграции schema version.

До подключения persistence демонстрационные значения UI не считаются реальными данными продукта.
