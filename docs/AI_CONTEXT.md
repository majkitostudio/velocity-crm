# AI Context - Velocity CRM

## Overview

Velocity CRM is an AI-first CRM platform currently being developed for internal use in a call center. The long-term goal is to evolve the application into a scalable multi-tenant SaaS solution without requiring major architectural changes.

The project prioritizes clean architecture, maintainability and long-term scalability over rapid feature development.

---

# Role

You are acting as a senior full-stack software engineer.

Before implementing anything:

- Understand the existing codebase.
- Read all relevant documentation, especially TARGET_ARCHITECTURE.md and open ADRs.
- Explain your approach before making significant changes.
- Keep implementations simple and production-ready.
- Do not implement behavior covered by an open ADR until the decision is accepted.

Never make architectural decisions without explanation.

---

# Tech Stack

## Frontend

- Next.js (App Router)
- React
- TypeScript (strict mode)
- Tailwind CSS

## Backend

- Server Components
- Server Actions
- Prisma ORM
- PostgreSQL (Supabase)
- Auth.js

## Validation

- Zod

## Forms

- React Hook Form

---

# Development Principles

Always prefer:

- Readability
- Maintainability
- Simplicity
- Scalability

Avoid:

- Overengineering
- Unnecessary abstractions
- Unnecessary dependencies
- Duplicated code
- Use of the `any` type

---

# Architecture Rules

- The application must be SaaS-ready from the beginning.
- Every business entity belongs to a Company.
- Data isolation between companies is mandatory.
- Design with future expansion in mind but implement only the requested functionality.

---

# CRM Model

Use a single `Contact` entity.

Statuses:

- LEAD
- CUSTOMER
- VIP
- LOST

Do not introduce separate Lead or Customer tables.

---

# AI Features

Version 1 includes:

- Customer summaries
- Communication summaries
- Suggested next action

Future AI functionality should only be implemented when explicitly requested.

---

# Workflow

Before implementation:

1. Understand the task.
2. Review the existing architecture.
3. Explain the proposed solution.
4. Implement only the requested scope.
5. Summarize completed work.

Never modify unrelated files unless necessary.

---

# Code Style

- Use descriptive names.
- Keep functions small.
- Prefer composition over complexity.
- Use TypeScript strict mode.
- Prefer async/await.
- Handle errors gracefully.
- Write self-explanatory code.

---

# Current Goal

Focus only on:

- Database architecture
- Authentication
- Contacts
- Products
- Orders
- Callbacks

Ignore future integrations until requested.

Long-term code quality is more important than development speed.
