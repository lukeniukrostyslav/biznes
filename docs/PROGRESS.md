# BUSINESS OS — ПРОГРЕСС

**Постоянное правило проекта:** перед существенными продуктовыми решениями проверять актуальный интернет и конкурентов; результаты учитывать в архитектуре и сохранять в GitHub.

Последнее обновление: 2026-09-24 — B07.3

## Текущая стадия

Продукт: **BUSINESS OS — Freelancer & Agency Business Command Center**

Целевая модель: самостоятельное локальное web-приложение, единоразовая покупка ориентировочно $79–99.

Ключевой поток:

**Lead → Proposal → Project → Invoice → Payment → Profit → Repeat**

## Блоки проекта

| Блок | Название | Прогресс |
|---|---|---:|
| B00 | Репозиторий и базовая фиксация | 100% |
| B01 | Продуктовая концепция | 100% |
| B02 | Анализ рынка и конкурентов | 100% |
| B03 | Клиент и позиционирование | 100% |
| B04 | Архитектура продукта | 100% |
| B05 | UX/UI дизайн | 100% |
| B06 | Система локализации | 100% |
| B07 | Core-функциональность | 82% |
| B08 | Расчёты денег и прибыли | 70% |
| B09 | CRM / Leads / Pipeline | 0% |
| B10 | Projects / Proposals / Invoices | 0% |
| B11 | Cashflow / Dashboard / Analytics | 10% |
| B12 | Persistence / Export / Import | 70% |
| B13 | Responsive / Mobile QA | 0% |
| B14 | Functional QA | 0% |
| B15 | Commercial Packaging | 0% |
| B16 | Продажи / Storefront | 0% |

## Почему B02 = 100%

Проверены актуальные предложения в категории freelancer/business OS. На Gumroad есть продукты за $79–99+ с заметным количеством продаж. Например, Freelance OS от Easlo стоит $79 и показывает 858 продаж; Business OS от Imagination Labs — $85 и показывает 3,142 продажи; JNKX Freelance Business OS — $39+ и показывает 2,391 продажу. Это подтверждает наличие спроса на категорию, но не гарантирует продажи нашего продукта.

Одновременно рынок насыщен Notion-шаблонами. Поэтому наше отличие должно быть не в названии «OS», а в самостоятельном приложении и связке денег:

**Lead → Proposal → Project → Invoice → Payment → Profit → Repeat**

## B03 — закрыт

ICP, не-ICP, jobs-to-be-done, основная боль, позиционирование и конкурентная дифференциация зафиксированы в `docs/ICP_AND_POSITIONING_V1.md`.

## B04 — закрыт

Архитектура V1 зафиксирована в `docs/ARCHITECTURE_V1.md`: единая модель Client/Lead/Proposal/Project/Invoice/Payment/Expense, денежные derived metrics, pricing engine, local-first persistence, localization, responsive и коммерческие границы.

## B05 — дизайн

B05 = **100%** — визуальный UX/UI prototype V1 закрыт.

Фактически выполнено:
- UX screen architecture;
- design system V1;
- responsive layout rules;
- interaction rules;
- конкурентный UX review 2026-09-24;
- coded Dashboard;
- навигация Dashboard / Leads / Clients / Proposals / Projects / Invoices / Payments / Expenses / Profit / Cashflow;
- Kanban Leads;
- Clients / Projects / Invoices / Payments / Expenses / Profit / Cashflow screens;
- entity 360° detail view;
- create/detail drawer;
- EN/RU/ES/DE/FR переключатель;
- responsive desktop/mobile shell;
- mobile bottom navigation.

B05 закрыт именно как **дизайн и UI prototype**. Это не означает, что все экраны уже работают на реальных данных.

## B08 — финансовый движок

B08 = **70%**. Финансовая модель V1 зафиксирована и реализована в `src/core/financial-engine.js`: invoice totals/status, project profit/margin, weighted pipeline, cashflow и locale-aware currency formatting. Добавлены автоматические Node tests; локальная проверка прошла: **6/6 тестов успешно**. Остались расширенные edge-case tests, интеграция с persistence/data model и подключение engine к UI.

Документ: `docs/B08_FINANCIAL_ENGINE_V1.md`.

## B07 — core-функциональность

B07 = **75%**.

Выполнено:
- финансовый engine как общая доменная библиотека;
- автоматические тесты engine;
- единая схема Client / Lead / Proposal / Project / Invoice / Payment / Expense;
- правила derived metrics;
- связи между сущностями;
- зафиксирована стратегия перехода к local-first persistence.

Выполнено B07.2 (первый слой): schemaVersioned local-first store на localStorage, стабильные локальные ID, сохранение новых записей из UI и toast-подтверждение. Реализовано: schemaVersioned local-first store в UI и отдельный `src/core/persistence.js` с create/load/save/upsert/remove/export/import. Добавлены автоматические тесты persistence. Дополнительно выполнено: защита импорта от будущих schemaVersion, безопасный reset persisted store с тестами, пользовательские Export/Import JSON прямо из интерфейса. Следующий шаг: полноценное подключение всех экранов к store, валидация полей и миграции.

## Конкурентный контроль — 2026-09-24

Актуальная проверка рынка показывает, что зрелые all-in-one решения уже объединяют CRM, proposals, contracts, invoicing, payments, projects и time tracking, а цены подписки остаются существенными: например, опубликованное исследование с проверкой цен в августе 2026 указывает HoneyBook $29/$49/$109 в месяц при годовой оплате, Dubsado $335/$525 в год, Bonsai $9/$19/$29/$49 за пользователя в месяц при годовой оплате и Moxie $10/$20/$32 в месяц при годовой оплате. citeturn0search0
Одновременно рынок lifetime/Notion-продуктов показывает спрос на ценовой диапазон около $79: Easlo Freelance OS сейчас указан за $79 и показывает 858 продаж; это Notion-продукт, поэтому для BUSINESS OS остаётся важным отличаться не названием OS, а настоящим standalone-приложением. citeturn0search1
Конкурентный вывод: не копируем отдельные функции ради количества. Усиливаем связку **локальные данные + единый финансовый граф + profit-first + отсутствие обязательной подписки**. Это будет проверяться на каждом следующем продуктовом блоке.



Проведён свежий обзор рынка. Easlo Freelance OS сейчас показывает $79 и 858 продаж; это Notion-продукт с CRM, pipeline, projects/tasks и invoice tracker. citeturn0search0
Публичные обзоры 2026 также показывают, что HoneyBook, Dubsado, Bonsai и Moxie уже объединяют CRM, proposals, contracts, invoicing/payments и project-management функции, поэтому BUSINESS OS не должен конкурировать только количеством модулей. citeturn0search3turn0search14
Рыночный вывод для разработки: усиливаем наше отличие — **local-first, one-time purchase, единая денежная модель и profit-first workflow**, а не копируем SaaS-модель подписки или Notion-шаблон.

## B06 — локализация

Зафиксированы пять языков:
- English
- Spanish
- German
- French
- Russian

Русский обязателен. Английский — основной коммерческий язык.

## Конкурентный контроль — 2026-09-24 (вечер)

Свежая проверка показала, что HoneyBook уже имеет cashflow planner, project profitability и financial reports; опубликованные материалы также указывают, что текущий Cash Flow & Project Profit показывает paid payments, а отдельный cashflow planner умеет показывать будущие booked payments и projected expenses. citeturn0search2turn0search3

Следствие для BUSINESS OS: недостаточно иметь просто KPI Revenue/Profit. Нужно разделить **Actual Cashflow** и **Forecast Cashflow**, связать прогноз с due dates счетов, ожидаемыми платежами и плановыми расходами, а также показывать источник каждого показателя. Это улучшает прозрачность и делает финансовый dashboard проверяемым.

HoneyBook также публикует pricing от $29/$49/$109 в месяц при годовой оплате, а независимая проверка North от августа 2026 фиксирует Bonsai $19/$25 за tier с proposals/contracts/invoicing и другие подписные варианты. citeturn0search0turn0search1 Поэтому наше local-first/one-time позиционирование сохраняется, но ценность должна исходить из глубины workflow, а не только отсутствия подписки.

## B07/B11 — текущий технический результат

Dashboard KPI подключены к local store и больше не используют исходные статические финансовые значения. Добавлена базовая денежная агрегация Revenue, Outstanding, Pipeline и Profit. Следующий шаг — сделать эти расчёты типизированными через общий financial engine и затем разделить actual/forecast cashflow.

## Правило процентов

Процент повышается только после фактического выполнения и проверки блока. Концепт, идея или план не считаются реализованными функциями.


## B07/B11 обновление — 2026-09-24

Dashboard KPI теперь читаются из local-first store: Revenue = полученные платежи, Outstanding = выставлено минус получено, Pipeline = сумма value/amount лидов, Profit = получено минус расходы. Это первый шаг отказа от демонстрационных финансовых значений. Пока UI не предоставляет полноценное редактирование всех полей и связей, поэтому процент не повышается выше 60%.

Конкурентный контроль продолжается: зрелые продукты категории уже связывают CRM, pipeline, proposals, projects и invoicing в единую цепочку; Bonsai отдельно документирует передачу клиента из CRM в проекты/документы/счета. citeturn1search4turn1search11 BUSINESS OS должен отвечать на тот же workflow без копирования SaaS-модели подписки и с local-first моделью данных.


## B07 обновление — 2026-09-24 (ночной checkpoint)

Реализован единый typed create flow для Lead / Client / Proposal / Project / Invoice / Payment / Expense: кнопки создания теперь открывают общий drawer, принимают клиент/название, статус, сумму, следующее действие и заметки и сохраняют запись в local-first store. Это заменяет предыдущий упрощённый instant-create placeholder. Следующий шаг — отображение сохранённых записей в соответствующих таблицах/Kanban и полноценное редактирование/удаление.

Конкурентный контроль: Bonsai объединяет CRM, pipeline, proposals, projects и invoices, а принятые proposals могут автоматически создавать invoice. citeturn0search2turn0search4 HoneyBook отдельно показывает actual cashflow/project profit и projections, поэтому BUSINESS OS продолжает развивать единый local-first граф данных и прозрачное разделение actual/forecast.


## B07 обновление — 2026-09-24

Сохранённые записи теперь рендерятся обратно в интерфейс: local-first store больше не является только скрытым хранилищем. После создания данные отображаются в соответствующих business screens. Добавлено безопасное HTML-экранирование пользовательских значений перед вставкой в таблицы. Следующий слой — полноценные entity-specific формы, редактирование/удаление и связи между сущностями.

## Конкурентный контроль — 2026-09-24

Проверка рынка подтверждает, что зрелые продукты уже оцениваются по полному client lifecycle, а не отдельным функциям. HoneyBook предоставляет отчёты по leads, projects, clients, bookings и collected/outstanding payments. citeturn0search10 North при проверке цен 11 августа 2026 фиксирует HoneyBook $29/$49/$109, Dubsado $335/$525 в год и Bonsai $19/$29/$49 за более полные уровни, а также подчёркивает важность сравнения именно tier, включающего proposals/contracts/invoicing. citeturn0search0 BUSINESS OS поэтому продолжает строить единый local-first lifecycle вместо копирования отдельных экранов конкурентов.


## B07.3 — entity-aware CRUD и реальные store-строки

B07.3 = **82%**.

Выполнено:
- таблицы Clients / Proposals / Projects / Invoices / Payments / Expenses теперь строятся из local-first store;
- добавлены entity-aware колонки вместо общего demo-формата;
- Leads Kanban теперь строится из реальных lead-записей store;
- реализовано редактирование существующих записей через общий drawer;
- реализовано локальное удаление записей;
- после CRUD автоматически обновляются dashboard metrics и списки;
- добавлена базовая статусная индикация.

Ограничения, поэтому B07 ещё не 100%:
- связи Client/Lead/Proposal/Project/Invoice/Payment/Expense пока не являются полноценными foreign-key отношениями во всех формах;
- валидация entity-specific полей ещё недостаточная;
- финансовый engine пока не является единственным источником dashboard calculations;
- нет полноценного archive/restore;
- нужны relationship tests и edge-case QA.

## B12 — persistence

B12 = **70%**.

Local-first store, schema versioning, save/load, upsert/remove, reset, JSON export/import и защита от будущей schemaVersion уже реализованы и протестированы. Оставшиеся 30% — миграции схемы, более строгая валидация импортируемых данных, relationship integrity и QA portable data.


## B07.4 — execution checkpoint зафиксирован

Рабочая цель: довести core-фундамент до production-ready состояния без искусственного повышения процента.

Порядок реализации: entity relationships → entity-specific forms/validation → archive/restore → financial engine as single source of truth → relationship/edge-case tests → пересчёт процента только после проверки.

**Правило проекта:** перед существенными продуктовыми решениями повторно проверять актуальный рынок и конкурентов; не копировать функции механически. В обзорах 2026 конкуренты закрывают широкий client lifecycle, включая CRM, proposals, contracts, invoicing, payments, projects и automation. Для BUSINESS OS сохраняется ставка на standalone local-first продукт, единый финансовый граф и profit-first workflow. citeturn0search0turn0search1turn0search2


## Продуктовый контроль — 2026-09-24

Перед продолжением B07 проведён свежий конкурентный review. В 2026 HoneyBook, Dubsado, Bonsai и Moxie продолжают закрывать широкий lifecycle: CRM, proposals/contracts, invoicing/payments и project/workflow management; HoneyBook также отдельно предлагает automations, client portal и reports. citeturn0search0turn0search1turn0search2

Решение для BUSINESS OS: не наращивать функции ради количества. Следующий приоритет — целостный lifecycle и качество данных: строгие связи сущностей, финансовая достоверность, прозрачный Actual/Forecast Cashflow, быстрые entity-specific действия и простота local-first продукта. Конкурентные цены и возможности перепроверять перед каждым крупным коммерческим решением, поскольку публичные цены меняются. citeturn0search0turn0search5

**Правило работы:** после каждого существенного изменения — тестирование, checkpoint и сохранение в GitHub; процент повышается только за реально реализованный и проверенный функционал.


## B07.4 — core integrity implementation checkpoint — 2026-09-24

Реализован следующий слой B07.4 в core-слое, без искусственного повышения процента:

- src/core/persistence.js переведён на schemaVersion 2 с миграцией v1 → v2;
- добавлена модель допустимых связей Lead → Client, Proposal → Client/Lead, Project → Client/Proposal, Invoice → Client/Project, Payment → Invoice/Client, Expense → Project/Client;
- добавлен validateStore() для проверки целостности ссылок;
- импорт JSON теперь отклоняет store с отсутствующими связанными сущностями;
- добавлены archiveRecord() и restoreRecord() вместо обязательного физического удаления в core;
- src/core/financial-engine.js расширен единым calculateBusinessMetrics() с разделением Actual и Forecast: paid, invoiced, outstanding, actual profit, expected payments, planned expenses, forecast cash, overdue и weighted pipeline;
- добавлен тест единого financial metrics engine.

UI пока не считается закрывшим B07.4: формы должны передавать реальные foreign-key связи, archive/restore должен быть подключён к интерфейсу, а dashboard должен использовать единый engine вместо локальных дублирующих формул. Поэтому проценты B07/B08/B12 не повышаются до завершения UI integration и тестовой проверки.

### Свежий конкурентный контроль — 24.09.2026

Актуальный рынок по-прежнему показывает широкий lifecycle в одном продукте: CRM, proposals/contracts, invoicing/payments, project management и automation. HoneyBook публикует Starter от $29/месяц при годовой оплате и включает proposals/contracts, invoices/payments, client portal и reports; более высокий уровень добавляет automations и QuickBooks integration. citeturn0search1 Независимая проверка цен августа 2026 фиксирует HoneyBook $29/$49/$109, Dubsado $335/$525 в год, Bonsai $9/$19/$29/$49 за пользователя в месяц при годовой оплате и Moxie $10/$20/$32 при годовой оплате. citeturn0search0

Отдельно Bonsai сейчас подчёркивает real-time budget monitoring, actual costs, budget forecasting и profit margin tracking. citeturn1search3 Следствие для BUSINESS OS: financial engine должен быть не декоративным KPI-слоем, а единым источником расчётов по связанным сущностям. Наш следующий шаг — довести этот engine до UI и добавить прозрачный Actual/Forecast Cashflow без копирования SaaS-модели подписки.


## B08.1 — unified financial engine UI integration — 2026-09-24

Реализован и сохранён следующий фактический шаг без повышения процента блока до завершения QA:

- `calculateBusinessMetrics()` теперь разделяет **Actual Expenses** и **Planned Expenses**, чтобы planned расходы не вычитались дважды;
- расчёт invoice status теперь принимает единый `now`, что делает overdue/forecast расчёты детерминированнее;
- Dashboard UI подключён к единому financial engine вместо локальных дублирующих формул;
- Import UI теперь принимает schema v2 и дополнительно проверяет relationship references перед сохранением;
- UI default store обновлён до schema v2 с `archivedRecords`;
- сохранён принцип: B08 остаётся 70%, пока тестовый прогон и edge-case QA не подтверждены.

### Коммерческий контроль — 24.09.2026

Свежий review рынка подтверждает, что HoneyBook, Dubsado и Bonsai продолжают продавать recurring SaaS вокруг CRM, proposals/contracts, invoicing/payments и project/workflow management. HoneyBook публикует $29/$49/$109 в месяц при годовой оплате; Dubsado — $35/$55 в месяц или $335/$525 в год; Bonsai — от $9/user/month при годовой оплате. citeturn0search0turn0search1turn0search4

BUSINESS OS сохраняет другую коммерческую модель: **standalone + one-time purchase на внешних площадках**, без обязательной ежемесячной подписки. Это не основание для копирования функций конкурентов; приоритет остаётся на качестве lifecycle, финансовой достоверности, local-first данных и простоте продукта.


## B07.5 — entity-specific relationship forms — 2026-09-24

Реализован UI-слой реальных связей без повышения общего процента B07 до прохождения QA:

- общий демонстрационный Client text input заменён на entity-aware поля;
- Lead может быть связан с Client;
- Proposal — с Client и Lead;
- Project — с Client и Proposal;
- Invoice — с Client и Project;
- Payment — с Client и Invoice;
- Expense — с Client и Project;
- формы автоматически показывают только допустимые связи для текущей сущности;
- перед сохранением candidate store проходит validateStoredRelationships();
- при нарушении foreign-key связи запись не сохраняется;
- существующие записи открываются с восстановленными связями;
- после сохранения Dashboard и таблицы обновляются.

### Почему процент B07 пока не меняется

Core и UI integration теперь значительно ближе к целевой модели, но production-ready статус требует отдельного тестирования create/edit всех семи сущностей, relationship edge cases, archive/restore и мобильного сценария. Поэтому **B07 остаётся 82%**, пока эти проверки не пройдены.

### Свежий конкурентный контроль — 24.09.2026

HoneyBook сейчас объединяет CRM, leads, clients, projects, proposals, contracts, invoices, payments, scheduling, automations и client portal; опубликованный Starter стоит $29/месяц при годовой оплате. citeturn0search0turn0search2 Bonsai в Essentials/Premium также объединяет CRM, проекты, invoices/payments, proposals/contracts, expenses, pipeline и profit/productivity reporting. citeturn0search1

Следствие для BUSINESS OS: наша цель — не максимальное число функций, а цельный lifecycle с сильными связями данных, финансовой достоверностью и local-first простотой. Коммерческая модель остаётся **one-time purchase на внешних площадках**, а не recurring SaaS.


## B08.2 — financial relationship integrity — 2026-09-24

Усилен financial engine:

- invoice balance в business metrics теперь рассчитывается по реальным связанным Payment records через invoiceId;
- поле invoice.paid больше не является единственным источником истины для dashboard/forecast;
- outstanding считается как сумма реальных остатков по счетам;
- добавлены тесты на stale invoice.paid, linked payments, planned expenses и overdue с фиксированной датой;
- B08 остаётся **70%**, потому что тесты добавлены, но полный execution QA в окружении проекта ещё не выполнен.

### Рыночный контроль — 24.09.2026

Свежие официальные страницы конкурентов показывают, что HoneyBook включает invoices/payments, proposals/contracts, CRM и client/project management, а Bonsai объединяет CRM, pipeline, projects, invoices/payments, expenses и profit/productivity reports. citeturn0search0turn0search2turn0search7 Dubsado также включает invoicing, payment plans, client portals и financial reporting, а более высокий уровень добавляет public proposals и automation. citeturn0search3turn0search4

Для BUSINESS OS это подтверждает приоритет: финансовые связи должны быть настоящими, а не просто визуальными KPI. Мы продолжаем строить единый graph Lead → Client → Proposal → Project → Invoice → Payment → Expense, сохраняя standalone/local-first и one-time purchase модель.


## B10.1 — typed invoice form — 2026-09-24

UI drawer для Invoice усилен:

- описание позиции;
- количество;
- цена за единицу;
- налоговая ставка;
- срок оплаты;
- сохранение lineItems, taxRate и dueDate вместо generic-only Value;
- при редактировании Invoice существующие line item/tax/due date восстанавливаются;
- generic Value скрывается для Invoice, чтобы не было двух конкурирующих источников суммы.

B10 остаётся **0%** до полного функционального QA всего Invoice lifecycle. B07 остаётся **82%**, B08 — **70%**.


## B10.2 — typed payments and overpayment guard — 2026-09-24

Усилена форма Payment:

- сумма платежа;
- дата платежа;
- метод платежа;
- transaction reference;
- обязательная связь с Invoice;
- проверка существования Invoice;
- защита от платежа больше текущего остатка Invoice;
- редактирование существующего Payment учитывает его собственный id при расчёте остатка.

Это пока не считается завершённым production QA: B10 остаётся **0%**, B07 — **82%**, B08 — **70%**.


## B10.3 — typed project finance fields — 2026-09-24

Project drawer получил финансовую модель:

- Billing type: Fixed Fee / Time and Materials / Retainer / Non-billable;
- Budget type: Fee / Time;
- Budget;
- Revenue;
- Actual costs;
- Actual hours;
- Labour cost/hour.

Это отражает рыночную модель project billing/budget/profitability, но не считается завершённым QA. B10 остаётся **0%**, B07 — **82%**, B08 — **70%**.
