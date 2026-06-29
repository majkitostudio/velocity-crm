# Velocity CRM Roadmap

## Fáze 0 — Architektura a základy

### Cíl

Připravit stabilní základ projektu.

### Úkoly

* Nastavení Prisma
* Nastavení Supabase
* Databázový model
* Multi-tenant architektura
* Git workflow
* Environment variables
* Database migrations
* Základní struktura projektu

### Výstup

* Funkční backend základ
* Připraveno pro SaaS
* Připraveno pro další vývoj

---

# Fáze 1 — Autentizace a uživatelé

### Cíl

Přihlášení a správa uživatelů.

### Úkoly

* Login
* Logout
* Session management
* Role systém
* Admin
* Manager
* Operator

### Výstup

* Bezpečný přístup do CRM

---

# Fáze 2 — Dashboard

### Cíl

Úvodní obrazovka operátora.

### Úkoly

* Dnešní leady
* Callbacky
* Statistiky
* Poslední aktivita

### Výstup

* Přehled práce operátora

---

# Fáze 3 — Contacts

### Cíl

Centrální databáze kontaktů.

### Úkoly

* Seznam kontaktů
* Detail kontaktu
* Vyhledávání
* Filtrace
* Tagy
* Historie aktivit

**Implementation:** Slice 15 ✅

### Statusy

* LEAD
* CUSTOMER
* VIP
* LOST

### Výstup

* Kompletní CRM databáze kontaktů

---

# Fáze 4 — Import leadů

### Cíl

Dostat leady do systému.

### Úkoly

* CSV import
* Validace dat
* Duplicitní kontrola
* Hromadné přiřazení operátorům

### Výstup

* Funkční lead management

---

# Fáze 5 — Call Workflow

### Cíl

Řízení hovoru a výsledků.

### Úkoly

* Zahájení hovoru
* Ukončení hovoru
* Povinný výsledek hovoru
* Historie hovorů

### Výsledky hovoru

* ORDER
* CALL_LATER
* SCHEDULE_CALL
* FAIL

### Výstup

* Kompletní workflow operátora

---

# Fáze 6 — Callback systém

### Cíl

Správa budoucích kontaktů.

### Úkoly

* Vytvoření callbacku
* Kalendář callbacků
* Připomínky
* Prioritizace

### Výstup

* Operátor nikdy nezapomene zavolat

---

# Fáze 7 — Produkty

### Cíl

Správa produktového katalogu.

### Úkoly

* Kategorie
* Produkty
* Ceník
* Aktivní / Neaktivní produkt

### Výstup

* Produktová databáze

---

# Fáze 8 — Objednávky

### Cíl

Vytváření objednávek po hovoru.

### Úkoly

* Nová objednávka
* Položky objednávky
* Historie objednávek
* Stav objednávky

### Výstup

* Kompletní objednávkový systém

---

# Fáze 9 — AI Assistant V1

### Cíl

První AI funkce.

### Úkoly

* Shrnutí zákazníka
* Shrnutí historie
* Doporučení dalšího kroku

### Výstup

* AI asistent operátora

---

# Fáze 10 — Reporting

### Cíl

Manažerské statistiky.

### Úkoly

* Výkon operátorů
* Počet hovorů
* Konverze
* Objednávky

### Výstup

* Manažerský dashboard

**Implementation:** Slice 14 ✅ — viz [IMPLEMENTATION_SEQUENCE.md](./IMPLEMENTATION_SEQUENCE.md)

---

# Implementation track — další práce

Product roadmap po uzavření AI platformy (Slice 10–13). Detailní scope v [IMPLEMENTATION_SEQUENCE.md](./IMPLEMENTATION_SEQUENCE.md).

### Dokončeno

| Slice | Název |
|-------|-------|
| 14 | Reporting & Dashboard Analytics ✅ |
| 15 | Tags & Contact Segmentation ✅ |

### Pořadí další práce

| # | Položka | Stav |
|---|---------|------|
| **1** | E2E pro `CALL_LATER` / `SCHEDULE_CALL` / `FAIL` | ✅ Hotovo |
| **2** | Slice 15.1 — CSV import tagů | ✅ Hotovo |
| **3** | Slice 16 — Dashboard v2 (kompletní redesign) | **Další** — návrh TBD |
| **4** | ADR pro Slice 17 (Automation) | Plánováno |
| **5** | Slice 17 — Automation & Workflows | Plánováno |
| **6** | Slice 18 — Production AI Providers | Deferred |

---

# Call outcome E2E (quality gate)

### Cíl

Playwright pokrytí výsledků hovoru `CALL_LATER`, `SCHEDULE_CALL` a `FAIL` (dnes E2E pouze `ORDER`).

### Výstup

* Jistota, že celý call workflow je pokrytý před dalšími feature slice

**Implementation:** ✅ `tests/e2e/workflow/call-outcomes.spec.ts`

---

# Slice 15.1 — CSV import tagů

### Cíl

Tagy z CSV sloupce při hromadném importu kontaktů.

### Výstup

* Import s segmentací v jednom kroku

---

# Slice 16 — Dashboard v2

### Cíl

Kompletní redesign úvodní obrazovky — denní KPI, prioritní práce, týmové přehledy.

### Proces

1. Produktový návrh redesignu (product owner)
2. Architektonický review a scope
3. Implementace

### Úkoly (upřesní se po návrhu)

* Osobní denní výsledky operátora
* Prioritní práce — leady, callbacky
* Manager: týmový snapshot (sdílená logika s `/reports`)

### Výstup

* Akční dashboard místo statického přehledu

---

# Slice 17 — Automation & Workflows

### Cíl

Pravidla a automatizace nad call workflow.

### Úkoly

* Callback připomínky
* Automatické přechody (např. FAIL threshold)
* Rozšíření pravidel přiřazení leadů

### Výstup

* Méně manuální operátorské práce, konzistentní workflow

**Předpoklad:** ADR pro scope automatizace (**pořadí #4**, před implementací Slice 17)

---

# Slice 18 — Production AI Providers

**Stav:** Deferred (planned after MVP) — viz [AI_PRODUCTION_LLM.md](./AI_PRODUCTION_LLM.md)

Provider abstraction je hotová (AI Platform Phase 1). Produkční adaptéry vzniknou jako samostatné implementace `LlmVendorAdapter`. Vývoj a CI používají **Fake LLM** jako oficiální development provider.

| Pod-slice | Provider |
|-----------|----------|
| 18.1 | OpenAI Responses Adapter |
| 18.2 | Azure OpenAI Adapter |
| 18.3 | Anthropic Adapter |
| 18.4 | Ollama Adapter |

---

# Fáze 11 — SaaS Foundation

### Cíl

Připravit CRM pro další firmy.

### Úkoly

* Oddělení tenantů
* Company management
* Company settings
* Audit log

### Výstup

* Multi-tenant CRM

---

# Fáze 12 — AI Assistant V2

### Cíl

Pokročilá doporučení.

### Úkoly

* Doporučení produktů
* Prioritizace leadů
* Retenční doporučení

### Výstup

* AI obchodní asistent

---

# Fáze 13 — AI Sales Copilot

### Cíl

AI mozek CRM.

### Úkoly

* Kontext zákazníka
* Kontext objednávek
* Kontext komunikace
* Inteligentní doporučení

### Výstup

* AI obchodní kopilot

---

# Fáze 14 — Integrace

### Budoucí rozvoj

* E-shop
* API
* Telefonie
* SMS
* Email
* Automatizace
* Externí systémy
