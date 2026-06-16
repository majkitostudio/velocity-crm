# Codex Instructions

Before starting any task:

1. Read:

   * docs/PROJECT_VISION.md
   * docs/ARCHITECTURE_RULES.md
   * docs/ROADMAP.md

2. Understand the project before making changes.

3. If requirements are unclear, ask for clarification instead of making assumptions.

---

# Project Context

Velocity CRM is an AI-powered CRM system designed for call centers selling:

* Natural supplements
* Cosmetic products

The first version is intended for internal use.

The architecture must be prepared for future SaaS deployment.

---

# Development Principles

* Keep solutions simple and maintainable.
* Avoid overengineering.
* Prioritize long-term scalability.
* Prefer readability over clever code.
* Write production-ready code.

---

# Technical Rules

* Use TypeScript strict mode.
* Never use the any type.
* Use Prisma ORM.
* Use PostgreSQL (Supabase).
* Use Next.js App Router.
* Prefer Server Components.
* Prefer Server Actions when appropriate.

---

# SaaS Rules

* Every business entity must belong to a Company.
* Data must be isolated between companies.
* Multi-tenant architecture is required.
* Future billing and subscriptions must be possible.

---

# Data Modeling Rules

* Do not create separate Lead and Customer entities.
* Use a single Contact entity.

Contact statuses:

* LEAD
* CUSTOMER
* VIP
* LOST

---

# AI Assistant Rules

The AI Assistant is a core feature of the product.

Version 1:

* Customer summary
* Communication history summary
* Suggested next action

Future versions:

* Product recommendations
* Retention recommendations
* AI Sales Copilot

Design architecture with future AI expansion in mind.

---

# Workflow Rules

After every call, the operator must select exactly one outcome:

* ORDER
* CALL_LATER
* SCHEDULE_CALL
* FAIL

This action is mandatory.

---

# Coding Rules

* Do not create mock data unless explicitly requested.
* Do not generate fake customers.
* Do not add unnecessary dependencies.
* Do not create functionality outside the current roadmap phase.
* Explain architectural decisions before implementation.
* Explain completed work after implementation.

---

# Current Priority

Focus only on:

1. Database architecture
2. Authentication
3. Contacts
4. Products
5. Orders
6. Callbacks
7. AI Assistant

Ignore future integrations until requested.
