# ADR-005: SaaS Bootstrap for V1

**Stav:** Přijato  
**Datum:** 2026-06-18  
**Schváleno:** 2026-06-18  
**Související:** [PROJECT_VISION.md](../PROJECT_VISION.md), [ROADMAP.md](../ROADMAP.md) Phase 11

## Kontext

Architektura vyžaduje multi-tenant model od začátku (`companyId` všude). V1 je ale **interní použití v jednom call centru**.

Otázka: jak vznikne první `Company` a admin? Je potřeba company management UI hned, nebo stačí seed?

## Varianty

### Varianta A: Jedna seednutá Company (doporučeno pro V1)

- Migrace + seed script vytvoří jednu `Company` a jednoho `ADMIN`
- Žádné self-service registrace
- Všichni uživatelé patří pod seed company
- Multi-tenant schema zůstává, ale runtime = single tenant

**Výhody:**

- Nejrychlejší cesta k funkčnímu MVP
- Odpovídá „interní V1" z PROJECT_VISION
- Schema připravené na SaaS bez SaaS UI

**Nevýhody:**

- Nelze otestovat multi-tenant izolaci v produkci bez druhé company
- Seed credentials musí být bezpečně dokumentovány
- Roadmap Phase 11 stále čeká na company management

### Varianta B: Admin-only vytváření Company přes CLI/seed + UI pro uživatele

- Seed vytvoří pouze systémového admina nebo první company přes CLI
- Admin UI pro správu uživatelů v rámci company (bez multi-company)
- Bez veřejné registrace

**Výhody:**

- Admin může přidávat operátory bez DB přístupu
- Blíž Phase 1 roadmapy (user management)
- Stále bez full SaaS

**Nevýhody:**

- Více UI práce před operator dashboardem
- Nutnost users modulu napojeného na UI dříve

### Varianta C: Full multi-company od V1

- Company management UI
- Admin může vytvářet company a přiřazovat uživatele
- Příprava na SaaS od první verze

**Výhody:**

- Multi-tenant testovatelný ihned
- Žádný technický dluh v onboarding flow
- Sladění s „SaaS-ready from day one"

**Nevýhody:**

- Výrazně větší scope než interní V1 potřebuje
- Odvádí pozornost od operator workflow
- Phase 11 funkcionalita implementovaná předčasně

## Doporučení architekta

Doporučuji **Varianta A** pro první deploy, s přechodem na **Varianta B** v rámci Phase 1:

1. Seed: `Company` + `ADMIN` + volitelně test operátor
2. Admin UI pro `createCompanyUser` (již existuje server modul)
3. Multi-company UI až Phase 11
4. Integrační testy tenant isolation vytvářejí druhou company v test DB

**Poznámka k `User.email`:** Schema má globálně unikátní email. Pro true multi-tenant SaaS bude potřeba `@@unique([companyId, email])` — zaznamenat jako budoucí ADR při schválení SaaS fáze.

## Důsledky

| Varianta | Seed | UI priorita | SaaS timing |
|----------|------|-------------|-------------|
| A | Povinný | Operator first | Phase 11 |
| B | + user admin UI | Users + operator | Phase 11 |
| C | Multi-company | Company mgmt first | Immediate |

## Rozhodnutí

**Přijata varianta A** — jedna seednutá Company pro interní V1.

- `prisma/seed.ts` vytvoří `Company`, `ADMIN` a testovacího `OPERATOR`.
- Žádná self-service registrace ani multi-company UI v MVP.
- Admin UI pro uživatele přijde ve Slice 1 (Varianta B částečně).
