# B18 CORE AUDIT 09 — Import / Export / Archive recovery

## Проверка
Аудирован полный путь локальных бизнес-данных:
- localStorage load/save;
- JSON Export;
- JSON Import;
- schema migration;
- relationship validation;
- archive;
- restore.

## Найдено и исправлено

### 1. App обходил persistence contract
В `app/index.html` были собственные `loadStore()` и `saveStore()`, которые напрямую работали с localStorage и обходили строгую валидацию из `src/core/persistence.js`.

Исправлено: app теперь использует canonical `loadStore/saveStore` из persistence через aliases.

### 2. Import/Export обходили canonical API
UI самостоятельно собирал JSON и проверял только часть структуры.

Исправлено:
- Export → `exportStore()`;
- Import → `importStore()`;
- затем `saveStore()`;
- schema version и relationship validation теперь проходят единый persistence contract.

### 3. Не было UI восстановления архива
Архивирование существовало в core, но пользовательского пути Restore не было.

Добавлен Settings → Archived records:
- список архивных записей;
- collection;
- дата архивации;
- Restore;
- подтверждение;
- повторная validation через `restoreRecord()` + `saveStore()`;
- локализация EN/RU/ES/DE/FR.

### 4. Добавлены тесты
- archived records сохраняются через Export → Import;
- schema v1 импортируется в текущую схему;
- missing collections нормализуются.

## GitHub
App:
- `6905730f06e9653076682c80c47d7040169722fb`
- `c7127a6ca158b9defbf4bd232fe0e9c108a91601`
- `3b4209d64db6096c0238e4fb35f7fb86bfb7d90e`
- `765b28a7a214cb3c89cbaa0a68b0193e8b393f09`

Tests:
- `1782fc0ee458eec5801ef7457528face506a89ea`

Runtime/browser tests пока не подтверждены.
