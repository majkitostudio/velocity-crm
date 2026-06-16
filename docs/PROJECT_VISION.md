# Velocity CRM

## Cíl projektu

Vybudovat moderní AI CRM systém primárně určený pro call centra zaměřená na:

* přírodní suplementy
* kosmetické produkty
* opakované objednávky
* retenční kampaně

První verze bude používána interně.

Architektura však musí být od začátku připravena na budoucí SaaS model.

---

## Hlavní filozofie

Nejde o klasické CRM.

Systém má fungovat jako AI asistent operátora.

CRM má pomáhat odpovědět na otázky:

* Koho kontaktovat?
* Kdy kontaktovat?
* Co nabídnout?
* Jaký je další doporučený krok?

---

## Typický workflow

Lead přijde do systému.

Lead může být:

* importován z CSV
* vytvořen ručně operátorem
* v budoucnu importován automaticky

Operátor otevře lead.

Po ukončení hovoru musí zvolit jeden výsledek:

* Order
* Call Later
* Schedule Call
* Fail

Výsledek hovoru je povinný.

Bez něj nelze lead uzavřít.

---

## MVP funkce

### Dashboard

* Přehled práce operátora
* Callbacky
* Nové leady
* Dnešní výsledky

### Contacts

* Jméno
* Telefon
* Email
* Poznámky
* Historie komunikace

### Leads

Stavy:

* New
* Assigned
* In Progress
* Converted
* Failed

Lead není samostatná entita.

V databázi existuje pouze Contact.

Contact má status:

- LEAD
- CUSTOMER
- VIP
- LOST

### Products

* Produktový katalog
* Kategorie
* Cena

### Orders

* Vytvoření objednávky po hovoru
* Historie objednávek

### Callbacks

* Plánování budoucího kontaktu
* Připomínky

### Notes

* Poznámky operátora
* Historie aktivit

### AI Assistant

# Verze 1

- Shrnutí zákazníka
- Shrnutí historie komunikace
- Doporučení dalšího kroku

# Verze 2

- Doporučení vhodných produktů
- Doporučení pro udržení zákazníka
- Automatické vyhodnocení priority leadů

# Verze 3

- AI obchodní kopilot

AI zná:

- zákazníka
- historii komunikace
- objednávky
- poznámky
- callbacky

AI aktivně pomáhá operátorovi během práce a doporučuje nejlepší další akci.

---

## Funkce mimo MVP

Tyto funkce zatím neimplementovat:

* VoIP
* Telefonní ústředna
* Nahrávání hovorů
* Přepisy hovorů
* SMS marketing
* Email marketing
* Fakturace
* Skladové hospodářství

---

## SaaS požadavky na architekturu
Každá data musí být navázána na Company.

Každá firma musí mít oddělená data.

Systém musí být připraven na multi-tenant architekturu.
Takže musí podporovat více firem.

Každá obchodní entita musí být navázána na společnost.

Data jednotlivých firem musí být od sebe oddělena.

Do budoucna musí být možné přidat fakturaci a předplatné.

---

## Technologický stack

Frontend:

* Next.js
* TypeScript
* Tailwind

Backend:

* Next.js API Routes

Databáze:

* PostgreSQL (Supabase)

ORM:

* Prisma

AI:

* OpenAI API

---

## Priorita

1. Datový model
2. Contacts
3. Leads
4. Orders
5. Callbacks
6. AI Assistant
7. SaaS funkce
