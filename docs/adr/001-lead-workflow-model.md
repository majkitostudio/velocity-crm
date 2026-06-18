# ADR-001: Lead Workflow Model

**Stav:** Přijato  
**Datum:** 2026-06-18  
**Schváleno:** 2026-06-18  
**Související:** [PROJECT_VISION.md](../PROJECT_VISION.md), [TARGET_ARCHITECTURE.md](../TARGET_ARCHITECTURE.md)

## Kontext

Dokumentace popisuje dva paralelní koncepty:

1. **Contact status** (explicitní v schema): `LEAD`, `CUSTOMER`, `VIP`, `LOST`
2. **Lead workflow stavy** (v PROJECT_VISION): New, Assigned, In Progress, Converted, Failed

Zároveň platí invariant: Lead není samostatná entita — existuje pouze `Contact`.

Bez rozhodnutí nelze správně navrhnout dashboard, frontu operátora, reporting ani automatické přechody stavů po hovoru.

## Varianty

### Varianta A: Odvozený workflow bez nového pole

Workflow stavy se **nevyskytují v databázi**. UI a reporty je odvozují z kombinace:

| Workflow stav | Odvození |
|---------------|----------|
| New | `status = LEAD` AND `assignedUserId IS NULL` |
| Assigned | `status = LEAD` AND `assignedUserId IS NOT NULL` AND žádný nedokončený call v relaci |
| In Progress | `status = LEAD` AND existuje nedokončený call / aktivní session (vyžaduje definici „start call") |
| Converted | `status IN (CUSTOMER, VIP)` |
| Failed | `status = LOST` OR poslední call outcome = `FAIL` (závisí na ADR-003) |

**Výhody:**

- Žádná změna schema
- Jednoduchý datový model
- Konzistentní s invariantem „jedna entita Contact"

**Nevýhody:**

- Složitější dotazy a UI logika
- „In Progress" vyžaduje buď odvození z call historie, nebo nový koncept „active call session"
- Hranice mezi Assigned a In Progress může být nejasná pro operátory

### Varianta B: Explicitní `workflowStatus` na Contact

Přidat enum pole `workflowStatus` na `Contact` oddělené od `status`:

```text
workflowStatus: NEW | ASSIGNED | IN_PROGRESS | CONVERTED | FAILED
status: LEAD | CUSTOMER | VIP | LOST
```

**Výhody:**

- Jasná UI reprezentace pro operátory a managery
- Jednoduché filtrování a reporting
- Explicitní přechody v business logice

**Nevýhody:**

- Dva paralelní stavové automaty — riziko nekonzistence (`workflowStatus = CONVERTED` ale `status = LEAD`)
- Nutnost synchronizačních pravidel při každém call outcome
- Rozšíření schema a migrace

### Varianta C: Workflow pouze z `CallActivity` a `assignedUserId`

Lead workflow je **čistě operativní koncept** bez vlastního stavu:

- Fronta = `assignedUserId` + `status = LEAD` + callbacky
- „In Progress" = operátor má otevřený detail kontaktu (UI state, ne DB)
- Converted/Failed = pouze `Contact.status` po call outcome

**Výhody:**

- Minimální schema
- Odpovídá současné implementaci `operator-queue`
- Rychlé MVP

**Nevýhody:**

- Reporting „kolik leadů je In Progress" vyžaduje jiný zdroj (session/audit)
- Produktová dokumentace používá termíny, které v DB neexistují
- Manager dashboard může být omezený

## Doporučení architekta

Pro MVP doporučuji **Variantu C** s postupným zpřesněním:

1. MVP: workflow = queue + assignment + call outcomes (bez nového DB pole)
2. Pokud reporting vyžaduje „In Progress", zavést lightweight `CallSession` nebo audit event `call.started`
3. `Converted` mapovat na `CUSTOMER`/`VIP`; `Failed` řešit v ADR-003

Pokud bude reporting a manager dashboard prioritou hned v MVP, zvážit **Variantu B** s přísnými synchronizačními pravidly v `CallWorkflow`.

## Důsledky

| Varianta | Schema | CallWorkflow | UI |
|----------|--------|--------------|-----|
| A | Beze změny | Odvozovací pravidla | Složitější view modely |
| B | Nové pole | Synchronizace obou stavů | Jednoduché labely |
| C | Beze změny | Minimální | Queue-centric UX |

## Rozhodnutí

**Přijata varianta C** — queue-centric workflow bez nového DB pole.

Schválená pravidla:

- Fronta = due callbacky + assigned leady (`status = LEAD`), viz [WORKFLOW_RULES.md](../WORKFLOW_RULES.md).
- Workflow stavy New / Assigned / Converted / Failed se odvozují z `Contact.status`, `assignedUserId` a call historie.
- **In Progress** je pouze UI stav (otevřený detail kontaktu), ne DB pole.
- Reporting „In Progress" v budoucnu přes audit event `call.started` (není v MVP).

Detailní pravidla: [WORKFLOW_RULES.md](../WORKFLOW_RULES.md#operator-workflow).
