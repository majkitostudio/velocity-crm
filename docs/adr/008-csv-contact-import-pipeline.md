# ADR-008: CSV Contact Import Pipeline

**Stav:** Přijato  
**Datum:** 2026-06-20  
**Schváleno:** 2026-06-20  
**Související:** [ADR-006](./006-contacts-list-and-navigation.md), [ADR-007](./007-contact-phone-normalization.md)

## Kontext

Slice 8 Commit 3 přidává hromadný import kontaktů z CSV pro manažery a adminy. Import musí být bezpečný (tenant scope, role guard), predikovatelný (preview před commitem) a připravený na další zdroje dat (Excel, API).

## Rozhodnutí

### Adapter-based pipeline

Import probíhá jako pipeline:

`adapter.parse → column map → normalize → validate → dedupe (CREATE/SKIP) → batch insert`

Commit 3 implementuje pouze `CsvImportAdapter`. Business pravidla (validace, deduplikace, assign) zůstávají ve `import.service.ts`.

### Sdílený katalog polí — `contact-fields.ts`

Interní definice polí nesou plná metadata (`exportable`, `searchable`, `filterable`, `aiVisible`, `aliases`, `requiredOnImport`). Veřejné helpery (`listContactFieldCatalog`, `listImportMappableContactFields`) vystavují stabilní API bez nutnosti měnit volající kód při přidání metadat.

Import a budoucí export sdílejí katalog polí a validační jádro (`contact-field-validation.ts`), ne společnou import/export pipeline.

### Dedup strategie v1

- Match v DB (normalizovaný telefon nebo e-mail) → **SKIP**
- Duplicita v souboru → **SKIP** (první řádek vyhrává)
- **UPDATE** duplicit se neimplementuje

Batch lookup přes `findExistingContactsByPhonesAndEmails` místo N× dotazů.

### Minimální `ContactImportBatch`

Batch záznam se vytváří až při execute importu. `stats` JSON drží souhrn (`created`, `skipped`, `failed`, `createdContactIds`, `skipReasons`). Preview je stateless (response z action).

### Oprávnění

Import pouze pro **ADMIN** a **MANAGER** (`canManageCompanyData`). Operátor je z `/contacts/import` přesměrován na seznam.

### Limity v1

- 5 MB / 5 000 řádků
- Insert po chunku 200 kontaktů
- Preview max 50 řádků na sekci v UI

## Důsledky

- Nové zdroje dat = nový adapter + stejná service pipeline
- Commit 4 může přidat filtr seznamu `?importBatch=` a bohatší souhrn bez změny jádra pipeline
- Klient drží `csvText` v paměti mezi kroky wizardu (bez server-side staging)
