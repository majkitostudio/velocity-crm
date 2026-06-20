# ADR-007: Contact Phone Normalization

**Stav:** Přijato  
**Datum:** 2026-06-20  
**Schváleno:** 2026-06-20  
**Související:** [ADR-006](./006-contacts-list-and-navigation.md), Slice 8 import (Commit 3)

## Kontext

Telefon je primární identifikátor kontaktu v call centru. Ruční vytvoření, import CSV a budoucí deduplikace musí používat stejnou normalizaci a validaci, jinak `@@unique([companyId, phone])` nebude spolehlivě fungovat.

## Varianty

### Varianta A: Ukládat telefon beze změny

**Nevýhody:** `+420 601 100 001` vs `420601100001` = falešné duplicity nebo obejití unique constraintu.

### Varianta B: Sdílená normalizace na E.164-like tvar (doporučeno)

Modul `src/features/contacts/lib/phone.ts`:

- odstraní mezery, pomlčky, závorky
- `00` → `+`
- české lokální formáty (`0…`, 9 číslic) → `+420…`
- validace: `^\+[1-9]\d{7,14}$`

Použití v Zod schématu (create) i v service před dedup dotazem. Import (Commit 3) reuse stejné funkce.

**Nevýhody:** mezinárodní edge cases vyžadují pozdější rozšíření (libphonenumber).

### Varianta C: Externí knihovna hned

**Nevýhody:** závislost a scope navíc pro V1 s predominantly CZ numbers.

## Rozhodnutí

**Varianta B** — lightweight normalizace v `phone.ts`, sdílená across create/import.

Email: lowercase trim v `email.ts` (stejný pattern, jednodušší pravidla).

## Důsledky

- `createContactSchema` transformuje telefon před uložením.
- `createContact` service volá normalizaci před `findContactDuplicateInCompany`.
- Import adapter (Commit 3) importuje stejné helpery, ne duplicitní logiku.
