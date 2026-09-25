# BUSINESS OS — NEW DESIGN MASTER SPEC

## Purpose
Создать новый Premium UI с нуля поверх завершённой функциональности B00–B14.

Ключевое правило: дизайн не меняет бизнес-логику и не придумывает функции, которых нет в текущем продукте. Каждое визуальное решение обслуживает существующие сценарии: Lead → Client → Proposal → Project → Invoice → Payment → Expense → Profit → Cashflow → Repeat.

Старый B05 UI остаётся frozen reference и не развивается как финальный визуальный слой.

## Product design principles
1. Function-first — существующие функции остаются рабочими.
2. Commercial clarity — пользователь быстро понимает состояние бизнеса и следующий полезный шаг.
3. Premium without decoration — качество через типографику, сетку, spacing, hierarchy, states и interaction quality.
4. One primary action per screen/state — вторичные действия визуально подчинены.
5. Progressive disclosure — сложные детали открываются по необходимости.
6. Real data first — empty, populated, validation, error, archive, import/export и zero states проектируются как реальные состояния.
7. Responsive from the start — desktop/tablet/mobile являются одной системой.
8. Five-language integrity — EN/RU/ES/DE/FR не ломают layout.
9. Local-first trust — export/import и локальное сохранение понятны, но не мешают работе.
10. Accessibility — keyboard focus, contrast, semantic controls, readable density.

## Design architecture
### Global shell
- Premium sidebar on desktop.
- Compact mobile navigation.
- Global top bar.
- Workspace identity.
- Search surface.
- Global New action.
- Export / Import access.
- Language switcher.
- Contextual status/toast feedback.

### Product areas
Overview, Leads, Clients, Proposals, Projects, Invoices, Payments, Expenses, Profit, Cashflow, Settings.

## Screen strategy
### Overview
Decision surface, not a wall of metrics. Existing KPIs, Revenue & Profit, Cashflow, Follow-ups, Overdue Invoices and Project Profitability remain visible and actionable.

### Leads
Pipeline is the main visual model. Search and stage filter remain first-class. Lead cards expose value, stage and next action. Existing create/edit and Won conversion stay intact.

### Clients
Relationship list/table with project, revenue and outstanding context. Empty state has a real create-client action.

### Proposals
Proposal list, financial summary, lifecycle/status, line items and Proposal → Project action.

### Projects
Project health is central: progress, revenue, cost, profit and margin. Existing Project → Invoice flow stays visible where valid.

### Invoices
Clear hierarchy for invoiced, paid, outstanding and overdue. Existing line items, tax, discount, due date and payment plan remain usable.

### Payments
Payment records, reconciliation and partial/full payment state. Invoice relationship is always understandable.

### Expenses
Fast expense capture with category/date/amount clarity and existing actual-vs-planned context.

### Profit
Gross revenue, direct costs, operating costs, net profit and project profitability. Existing export remains accessible.

### Cashflow
Received, expenses, net cashflow and forecast using existing calculations. Existing CSV export remains accessible.

### Settings
Local-first persistence, export/import, archive/restore, language and safe destructive actions.

## Component system
Build reusable primitives before screen-specific styling:
- AppShell
- Sidebar
- Topbar
- MobileNav
- PageHeader
- Primary/Secondary/Ghost/Danger buttons
- KPI card
- Stat card
- Data table
- Pipeline column
- Entity card
- Status badge
- Filter/search controls
- Form field
- Drawer/modal
- Confirmation dialog
- Empty state
- Loading/skeleton state
- Error state
- Toast
- Tooltip
- Progress/margin indicator
- Chart container
- Export/import controls

## Interaction rules
- Create/edit forms preserve current data models and validation.
- Destructive actions require confirmation where applicable.
- Successful CRUD gives concise feedback.
- Invalid input explains recovery.
- Empty screens always provide a relevant next action.
- Tables remain usable on narrow screens.
- Mobile navigation never exposes hidden desktop controls as clickable targets.
- Existing keyboard/focus behavior remains intact.

## Responsive strategy
Desktop: persistent navigation and dense but breathable data surfaces.
Tablet: reduced navigation/content density without data loss.
Mobile: bottom navigation, full-width drawers/forms where useful, readable data cards or controlled horizontal surfaces, no page overflow, reachable primary action.

## Visual direction
Credible commercial B2B product:
- restrained premium palette;
- strong neutral canvas;
- one controlled accent system;
- high-quality typography hierarchy;
- subtle borders and elevation;
- consistent radius and spacing;
- meaningful status colors only;
- restrained motion.

Avoid decorative redesigns, fake data, fake capabilities, excessive gradients, excessive glassmorphism and motion that slows work.

## Design QA
Every design block must be verified against all product screens, CRUD flows, relationships, persistence, export/import, archive/restore, financial calculations, five languages, desktop/tablet/mobile, empty/populated/error/validation states, keyboard/focus behavior and existing B14 E2E regression.

## Final acceptance
NEW DESIGN is 100% only when the new visual system is implemented across all screens, existing functionality still works, B14 regression remains green, responsive and five-language checks pass, and a live preview/deployment exists for manual clicking. The preview link must be recorded in project documentation.
