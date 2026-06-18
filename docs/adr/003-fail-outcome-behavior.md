# ADR-003: Fail Outcome Behavior

**Stav:** Přijato  
**Datum:** 2026-06-18  
**Schváleno:** 2026-06-18  
**Související:** ADR-001, [TARGET_ARCHITECTURE.md](../TARGET_ARCHITECTURE.md)

## Kontext

Outcome `FAIL` znamená neúspěšný hovor. Schema obsahuje `ContactStatus.LOST`, ale současný kód ho při `FAIL` nenastavuje.

Dokumentace uvádí lead workflow stav „Failed" a Contact status `LOST`, ale vztah mezi nimi není definován.

## Varianty

### Varianta A: Automatické `LOST` při každém `FAIL`

`CallWorkflow` po outcome `FAIL` nastaví `Contact.status = LOST`.

**Výhody:**

- Jednoduché pravidlo — operátor nemusí nic dalšího dělat
- Kontakt zmizí z operator queue
- Konzistentní s workflow stavem „Failed"

**Nevýhody:**

- Jeden neúspěšný pokus uzavře lead natrvalo
- Není vhodné pro retry strategie (např. 3 pokusy před LOST)
- Retenční kampaně na „soft fail" nejsou možné bez další logiky

### Varianta B: `FAIL` pouze zaznamená call, status beze změny

`CallActivity` s outcome `FAIL` se vytvoří. `Contact.status` zůstává `LEAD` (nebo aktuální).

**Výhody:**

- Operátor/manager může lead znovu zkusit
- Vhodné pro call centra s více pokusy
- Flexibilní — LOST až po N fails nebo manuálně

**Nevýhody:**

- Lead zůstává ve frontě i po jasném neúspěchu
- Nutnost pravidla pro automatický přechod na LOST (počet fails, čas)
- Reporting „failed leads" vyžaduje agregaci z `CallActivity`

### Varianta C: Konfigurovatelný práh (N fails → LOST)

`FAIL` inkrementuje počítadlo neúspěšných pokusů. Po dosažení prahu (např. 3) se nastaví `LOST`.

Implementace: pole `failedCallCount` na Contact, nebo odvození z `CallActivity` COUNT.

**Výhody:**

- Vyvážený přístup pro call centrum
- Podporuje retry bez manuálního zásahu
- Konfigurovatelné per company (budoucí settings)

**Nevýhody:**

- Složitější `CallWorkflow`
- Nové pole nebo agregační dotaz při každém fail
- Práh musí být definován i pro MVP

### Varianta D: Operátor volí při `FAIL` — „uzavřít" vs. „zkusit znovu"

UI při outcome `FAIL` nabídne: ponechat lead otevřený, nebo označit jako `LOST`.

**Výhody:**

- Maximální flexibilita pro operátora
- Žádné skryté automatické pravidlo

**Nevýhody:**

- Další rozhodnutí v UI — zpomaluje workflow
- Nekonzistentní data, pokud operátoři volí různě
- Obtížnější automatizace a reporting

## Doporučení architekta

Pro call centrum s opakovanými pokusy doporučuji **Variantu C** s MVP zjednodušením:

- MVP: práh **3× FAIL** → `LOST` (hardcoded)
- Mezitím lead zůstává `LEAD` ve frontě
- Po přechodu na LOST audit event `contact.status_changed`

Pokud je prioritou maximální rychlost MVP, dočasně **Varianta B** s manuálním LOST pro managera.

## Důsledky

| Varianta | Queue | Reporting | CallWorkflow |
|----------|-------|-----------|--------------|
| A | Okamžité odebrání | Jednoduchý | Minimální |
| B | Lead zůstává | Agregace z calls | Minimální |
| C | Lead do prahu | Počítadlo fails | Střední |
| D | Závisí na volbě | Smíšený | UI složitost |

## Rozhodnutí

**Přijata varianta C** — konfigurovatelný práh s MVP hardcoded hodnotou.

- Počet `FAIL` outcomes se **odvozuje z `CallActivity`** (bez nového pole na Contact).
- Práh **3× FAIL** (`FAIL_THRESHOLD`) → `Contact.status = LOST`.
- Do prahu zůstává `LEAD` ve frontě pro další pokus.
- Audit `contact.status_changed` při přechodu na LOST.

Detailní pravidla: [WORKFLOW_RULES.md](../WORKFLOW_RULES.md#fail).
