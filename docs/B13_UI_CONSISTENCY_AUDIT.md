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


## B13 — localization/data re-render consistency — 2026-09-24

Выполнен дополнительный consistency pass без добавления новых бизнес-функций.

### Исправлено

- после смены языка Dashboard теперь повторно рендерит реальные данные, поэтому demo Follow-ups больше не может остаться поверх local-first данных;
- Project Profitability headers теперь переводятся EN/RU/ES/DE/FR динамически;
- dynamic status badges используют локализованные названия статусов;
- существующие Dashboard calculations остаются привязанными к financial engine/local-first store.

### QA status

Кодовый review после изменения выполнен через GitHub source inspection. Полный browser/mobile visual QA и npm test execution в текущей среде недоступны из-за отсутствия сетевого доступа к репозиторию/runtime. Поэтому B13 и B14 не закрываются по этому checkpoint.

Commit: `f754e10ad8b1896be22e11611c715a2915938fe6` + syntax repair `7a1b1d7cdca74c8d2fc59b213f5aff6547d83266`.


## B13 — Dashboard demo data removal checkpoint — 2026-09-24

Удалены оставшиеся статические финансовые примеры из двух Dashboard-зон: Overdue Invoices и Project Profitability. Теперь они строятся из local-first store и financial engine. Для Overdue используются реальные invoice/payment статусы; для Project Profitability используются calculateProjectProfit(). При отсутствии данных отображается empty state.

После source review обнаружена и исправлена ошибка интеграции полей: UI использует возвращаемые engine поля `profit` и `margin`.

Commits: `f2546a2d50d0394b52abea2cf2038712b4092024`, `1e0c7f505aaa847bd9c882b36bdf4a56e05d29df`.

Browser/mobile visual QA и npm test execution всё ещё не подтверждены; процент B13 не повышается.


## B13 — Follow-ups data-driven checkpoint — 2026-09-24

Последний оставшийся demo-счётчик Dashboard Follow-ups Today заменён на данные из local-first Leads. Счётчик теперь показывает количество отображаемых follow-ups, строки строятся из lead name/nextAction/value, при отсутствии данных используется empty state.

Commit: `bb1f1e4b5ee608615638de18fa59be43a449a75d`.

Browser/mobile visual QA и test execution по-прежнему не подтверждены; B13 процент не повышен.


## B13 — stored tables localization checkpoint — 2026-09-24

Выполнен следующий узкий consistency pass без добавления новых бизнес-функций.

Сделано:
- заголовки таблиц Clients / Proposals / Projects / Invoices / Payments / Expenses локализуются для EN/RU/ES/DE/FR;
- действия Edit / Delete локализуются;
- подписи Forecast / Budget left локализуются;
- остаточные строки Leads: No leads / Opportunity / Next action локализуются;
- существующие Create invoice / Create project сохраняют локализацию;
- при смене языка таблицы перерисовываются через `renderStoredRecords()`.

GitHub commit: `bea6a9412cbddea57206747a81e87a6733922c9d`.

QA status: выполнена source-level проверка изменения. Browser/mobile visual QA и полный npm test execution по-прежнему не подтверждены; процент B13 не повышается.


## B13 — operational KPI data checkpoint — 2026-09-24

Следующий consistency pass заменил демонстрационные KPI на Payments и Expenses на реальные данные local-first store.

Сделано:
- Payments: Received this month, Expected, Overdue и Collection rate теперь рассчитываются из реальных payments/invoices и financial engine;
- Expenses: This month, Project costs, Operating и Unassigned теперь рассчитываются из реальных expenses;
- значения используют единую EUR-форматизацию;
- существующая локализация подписей сохранена для EN/RU/ES/DE/FR;
- новые бизнес-функции не добавлялись.

GitHub commit: `c9411001c4e8bdc1618f74ad1ee1cc2ba68f6176`.

QA status: source-level проверка выполнена. Browser/mobile visual QA и полный npm test execution ещё не подтверждены; B13 остаётся 22%.


## B13.10 — Localization scope + mobile navigation consistency

Дата: 2026-09-25

Исправлено:
- устранён scope-bug после локализации stored tables: общий словарь переименован в `recordUiCopy` и используется и таблицами, и Leads pipeline;
- mobile bottom navigation больше не содержит постоянно зашитые русские подписи;
- добавлена локализация mobile navigation для EN/RU/ES/DE/FR;
- подписи mobile navigation обновляются при смене языка через общий UI-copy refresh.

Проверка:
- source-level verification выполнена;
- browser/mobile runtime QA ещё не выполнена;
- полный npm test не запускался из-за отсутствия подтверждённого network/runtime доступа к clone окружению.

B13 остаётся 22% до фактической browser/mobile QA и закрытия остальных UI inconsistencies.


## B13.11 — Profit screen demo-data removal

Дата: 2026-09-25

Исправлено:
- удалены статические KPI Profit ($53,980 / $7,920 / $4,920 / $41,140);
- удалена статическая таблица проектов;
- Profit теперь рассчитывается из local-first store и financial engine;
- Gross revenue берётся из фактических Payments;
- direct/project costs рассчитываются через `calculateProjectProfit`;
- operating costs берутся из фактических расходов без projectId;
- Net profit рассчитывается из фактических поступлений минус фактические project/operating costs;
- таблица Profit показывает реальные проекты, Revenue, Costs, Profit и Margin;
- добавлена локализация новых Profit KPI/заголовков для EN/RU/ES/DE/FR.

Проверка:
- source-level verification выполнена;
- browser/mobile runtime QA ещё не выполнена;
- полный npm test не запускался.

B13 остаётся 22% до фактической browser/mobile QA и закрытия остальных UI inconsistencies.


## B13.12 — Dashboard Profit integration + Cashflow localization

Дата: 2026-09-25

Исправлено:
- Dashboard Project Profitability теперь использует фактические поля financial engine `profit` и `margin`, вместо несуществующих `actualProfit` / `actualMargin`;
- Cashflow UI переведён с hardcoded English на локализуемые подписи EN/RU/ES/DE/FR;
- timeline Cashflow использует локализованные типы событий и подписи installment;
- Cashflow labels обновляются при смене языка.

Проверка:
- source-level verification выполнена;
- browser/mobile runtime QA ещё не выполнена;
- полный npm test не запускался.

B13 остаётся 22% до фактической browser/mobile QA и закрытия оставшихся UI inconsistencies.


## B13.13 — Drawer/action localization cleanup

Дата: 2026-09-25

Исправлено:
- заголовки Create/Edit drawer локализуются EN/RU/ES/DE/FR;
- подтверждение Archive и сообщения Archive blocked/archived локализуются;
- пустые relation options (Client/Lead/Proposal/Project/Invoice) локализуются;
- удалён лишний статический demo follow-up render из `render()`: источник Follow-ups теперь только local-first store;
- сохранена единая type localization для сущностей.

Проверка:
- source-level verification выполнена;
- browser/mobile runtime QA ещё не выполнена;
- полный npm test не запускался.

B13 остаётся 22% до фактической browser/mobile QA.


## B13.14 — Invoice/Proposal KPI demo-data removal

Дата: 2026-09-25

Исправлено:
- устранён scope-bug: recordUiCopy вынесен из renderStoredRecords() в общий scope, поэтому Leads pipeline может безопасно использовать тот же словарь локализации;
- Invoices KPI теперь считаются из local-first invoices/payments и financial engine: Invoiced, Paid, Outstanding, Overdue;
- Proposals KPI теперь считаются из local-first proposals: Drafts, Sent, Awaiting decision и Win rate;
- для Win rate используется только решённый набор статусов (Won/Accepted против Lost/Cancelled/Closed), при отсутствии решённых предложений показывается 0%;
- добавлена локализация KPI-подписей EN/RU/ES/DE/FR;
- статические demo-значения $62,400, $53,980, $8,420, $3,980, 3, 7, $31,250, 64% больше не являются источником данных.

Проверка:
- source-level verification выполнена после GitHub commit;
- browser/mobile runtime QA ещё не выполнена;
- полный npm test не запускался из-за отсутствия подтверждённого network/runtime доступа к clone окружению.

B13 остаётся 22% до фактической browser/mobile QA и закрытия оставшихся UI inconsistencies.

GitHub commit кода: 06c9d90bf0bac8106b49e4352ded6f11905794a2.


## B13.15 — Client Entity 360° demo-data removal

Дата: 2026-09-25

Исправлено:
- статический клиент Nova Studio и его demo-метрики удалены из Entity 360°;
- Entity view теперь получает выбранного клиента из local-first store;
- Revenue, Outstanding и Margin рассчитываются из реальных payments, invoices, projects и expenses;
- количество проектов и счетов рассчитывается из связанных записей;
- Timeline строится из реальных проектов, счетов и платежей;
- Next actions строятся из фактических непогашенных счетов;
- клик по клиенту в таблице открывает его 360° Entity view; Edit возвращает к существующему drawer;
- добавлена локализация Entity view для EN/RU/ES/DE/FR.

Проверка:
- source-level verification выполнена;
- browser/mobile runtime QA ещё не выполнена;
- полный npm test не запускался.

B13 остаётся 22% до фактической browser/mobile QA и проверки оставшихся UI inconsistencies.

GitHub commit кода: be2a7d983e9932ea7bf395dfb46367568518828f.


## B13.16 — Projects KPI demo-data removal + shell localization

Дата: 2026-09-25

Исправлено:
- Projects KPI strip больше не использует статические 8 / $86,400 / $49,180 / 61%;
- Active projects, Contracted, Expected profit и Avg. margin теперь рассчитываются из local-first Projects + financial engine;
- Project KPI labels локализованы EN/RU/ES/DE/FR;
- удалена лишняя статическая инициализация Dashboard chart, которая могла создавать demo-bars до реального render;
- sidebar brand tagline, workspace label и Local-first mode получили единый localization pass;
- основные drawer placeholders (Record name, Follow up, Notes) теперь локализуются EN/RU/ES/DE/FR;
- Value label drawer переведён в общий UI-copy layer.

Проверка:
- source-level verification выполнена после GitHub commit;
- browser/mobile runtime QA ещё не выполнена;
- полный npm test не запускался.

B13 остаётся 22%: этот checkpoint закрывает ещё один слой source-level consistency, но не заменяет browser/mobile QA.

GitHub commit кода: 55e112cf2969c7659a90a1967fb9c2391cf45055.


## B13.17 — Invoice Paid KPI relationship integrity

Дата: 2026-09-25

Исправлено:
- Invoices KPI Paid больше не суммирует несвязанные payments;
- в Paid учитываются только платежи с invoiceId, соответствующие модели «invoice → payment»;
- это предотвращает завышение оплаченной суммы за счёт standalone/unlinked payments.

Проверка:
- source-level verification выполнена;
- browser/mobile runtime QA ещё не выполнена;
- полный npm test не запускался.

B13 остаётся 22% до фактической browser/mobile QA.

GitHub commit кода: f6c4ee2fff54c50b8e452e5ca7c338b2ac06d251.


## B13.18 — Complete status localization

Дата: 2026-09-25

Исправлено:
- drawer status selector теперь содержит полный набор используемых lifecycle-статусов, включая Accepted, Viewed, Draft, Lost и Closed;
- все эти статусы локализуются EN/RU/ES/DE/FR;
- dynamic status badges больше не оставляют новые/terminal статусы на английском при смене языка.

Проверка:
- source-level verification выполнена;
- browser/mobile runtime QA ещё не выполнена;
- полный npm test не запускался.

B13 остаётся 22% до browser/mobile QA.

GitHub commit кода: dc73666dc3cd9a8a4633ea38ba4fd40838201b89.


## B13.19 — Projects demo-data removal + explicit empty states

Дата: 2026-09-25

Исправлено:
- статическая таблица Projects (Website Redesign, Brand Identity, Mobile App Design, Marketing Website) удалена как источник demo-данных;
- Project health больше не показывает статические demo-риски/метрики;
- Projects table и Project health теперь строятся из local-first Projects + financial engine;
- Project health показывает только реальные сигналы: маржа, превышение бюджета и просроченные связанные счета;
- при отсутствии проектов показывается локализованный empty state;
- для Clients / Proposals / Projects / Invoices / Payments / Expenses добавлен явный локализованный empty state вместо пустой таблицы;
- локализация Project health добавлена для EN/RU/ES/DE/FR.

Проверка:
- source-level verification выполнена после GitHub commit;
- browser/mobile runtime QA ещё не выполнена;
- полный npm test не запускался.

B13 остаётся 22%: source cleanup продолжен, но процент не повышен до фактической browser/mobile QA.

GitHub commit кода: 7bdbfb3e8caad14d0e5eca366c93b56925aa1fc0.
