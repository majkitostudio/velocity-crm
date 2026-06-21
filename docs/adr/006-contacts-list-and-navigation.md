# ADR-006: Contacts List Access and Navigation

**Stav:** Přijato  
**Datum:** 2026-06-20  
**Schváleno:** 2026-06-20  
**Související:** [Slice 8](../IMPLEMENTATION_SEQUENCE.md), [001-lead-workflow-model.md](./001-lead-workflow-model.md)

## Kontext

Slice 8 přidává seznam kontaktů (`/contacts`) jako druhou cestu do detailu vedle operátorské fronty. Je potřeba definovat přístup podle rolí, URL filtry, vyhledávání a navigaci zpět se zachováním kontextu.

## Varianty

### Varianta A: Operátor vidí všechny kontakty firmy

**Nevýhody:** Porušuje `assertContactAccess` (operátor u cizího kontaktu dostává 404) — seznam by odhaloval existenci kontaktů, které operátor otevřít nemůže.

### Varianta B: Operátor vidí jen přiřazené kontakty (doporučeno)

Service vrstva automaticky filtruje `assignedUserId = currentUser.id`. Manažer/admin vidí celou firmu a může filtrovat operátora.

**Výhody:** Konzistentní s detail stránkou a tenant bezpečností.  
**Nevýhody:** Operátor nevidí nepřiřazené leady — očekávané, řeší manager/import.

### Varianta C: URL filtry v client state

**Nevýhody:** Nelze sdílet odkaz, tlačítko zpět nefunguje, horší E2E.

## Rozhodnutí

### Přístup k seznamu — Varianta B

- **OPERATOR:** pouze `assignedUserId = self`
- **MANAGER / ADMIN:** všechny kontakty firmy, volitelný filtr operátora včetně „nepřiřazeno“

### Filtry a stránkování — URL `searchParams`

Filtry (`status`, `source`, `priority`, `operator`, `sort`, `page`, `q`, `importBatch`) jsou v URL. Server Components načítají data podle parametrů (vzor `/callbacks`).

Parametr `importBatch` filtruje seznam na kontakty z daného importu (`createdContactIds` v `ContactImportBatch.stats`). Pouze manager/admin; operátor dostane `ForbiddenError`.

### Vyhledávání — debounce / Enter

Parametr `q` se zapisuje do URL až po Enter nebo debounce 400 ms (client island). Server ignoruje `q` kratší než 2 znaky.

### Návrat z detailu — `returnTo`

Detail kontaktu: `/contacts/[id]?returnTo=<encoded /contacts?...>`. Breadcrumb a navigace zpět používají `returnTo`, ne holý `/contacts`.

### Breadcrumb — sdílená komponenta

`src/components/ui/breadcrumb.tsx` — pole `{ label, href? }`, poslední položka bez odkazu = aktuální stránka.

## Důsledky

- `contacts-list.service.ts` vynucuje role scope před dotazem do DB.
- List řádky generují odkaz na detail s `returnTo`.
- Import summary (Commit 4) naviguje na `/contacts?importBatch=<id>` se zachováním `returnTo` pro detail.
