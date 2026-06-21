# ADR-007: Contact Phone Normalization

**Stav:** Přijato  
**Datum:** 2026-06-20  
**Schváleno:** 2026-06-20  
**Související:** [ADR-006](./006-contacts-list-and-navigation.md), [ADR-008](./008-csv-contact-import-pipeline.md)

## Kontext

Telefon je primární identifikátor kontaktu v call centru. Ruční vytvoření, import CSV a deduplikace musí používat stejnou normalizaci a validaci, jinak `@@unique([companyId, phone])` nebude spolehlivě fungovat.

## Varianty

### Varianta A: Ukládat telefon beze změny

**Nevýhody:** `+420 601 100 001` vs `420601100001` = falešné duplicity nebo obejití unique constraintu.

### Varianta B: Sdílená normalizace na E.164-like tvar (doporučeno)

Modul `src/features/contacts/lib/phone.ts`:

- odstraní mezery, pomlčky, závorky
- `00` → `+`
- české lokální formáty (`0…`, 9 číslic) → `+420…`
- validace: `^\+[1-9]\d{7,14}$`

Email: lowercase trim v `email.ts` (stejný pattern, jednodušší pravidla).

Sdílené validační funkce v `contact-field-validation.ts` volají `phone.ts` / `email.ts` a používají je:

- Zod schémata (`contact-form-schemas.ts`) pro ruční vytvoření,
- import normalizer (`contact-normalizer.ts`) pro CSV pipeline.

**Nevýhody:** mezinárodní edge cases vyžadují pozdější rozšíření (libphonenumber).

### Varianta C: Externí knihovna hned

**Nevýhody:** závislost a scope navíc pro V1 s predominantly CZ numbers.

## Rozhodnutí

**Varianta B** — lightweight normalizace v `phone.ts` / `email.ts`, jednotné validační jádro v `contact-field-validation.ts`.

## Důsledky

- `createContactSchema` validuje a normalizuje telefon/e-mail přes sdílené helpery.
- `createContact` service volá deduplikaci na normalizovaných hodnotách.
- Import pipeline reuse stejné funkce, ne duplicitní logiku.
