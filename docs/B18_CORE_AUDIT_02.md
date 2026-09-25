# B18 Core Audit 02 — Archive integrity

Дата: 2026-09-25

## Найдено

UI содержал собственную копию правил зависимостей для архивации:
- Client → Leads/Proposals/Projects/Invoices/Payments/Expenses
- Lead → Proposals
- Proposal → Projects
- Project → Invoices/Expenses
- Invoice → Payments

Одновременно эти правила уже находились в `src/core/persistence.js` через `RELATION_FIELDS` и `archiveRecord()`.

Это создавало риск расхождения двух реализаций.

## Исправление

UI теперь импортирует `archiveRecord()` из persistence core.

Поток:

UI archive action
→ persistence.archiveRecord()
→ dependency integrity
→ archivedRecords
→ saveStore()

Таким образом правило целостности хранится в одном месте.

## Проверка

Source-level verification выполнена.

Runtime npm test не подтверждён в текущей среде.

Проценты не повышены автоматически.

## Commit

bf58e3adf99a601e8e7492ff64d7339d78affce3
