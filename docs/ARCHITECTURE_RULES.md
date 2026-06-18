# Architecture Rules

> **Závazný layered standard:** [TARGET_ARCHITECTURE.md](./TARGET_ARCHITECTURE.md)  
> **Otevřená rozhodnutí:** [adr/README.md](./adr/README.md)  
> **Pořadí implementace:** [IMPLEMENTATION_SEQUENCE.md](./IMPLEMENTATION_SEQUENCE.md)

## Technology Stack

- Use TypeScript with strict mode enabled
- Use Next.js App Router
- Use Prisma ORM
- Use PostgreSQL (Supabase)

## General Rules

- Every business entity must include a companyId field
- Never create mock data unless explicitly requested
- Never use the any type
- Prefer Server Components over Client Components when possible
- Prefer Server Actions over custom API routes when appropriate
- Design everything for a multi-tenant SaaS architecture
- Follow clean architecture principles
- Keep business logic separated from UI components

## Multi-Tenant Requirements

- Every Company owns its own data
- Data must be isolated between companies
- Users can only access data belonging to their Company
- Future subscription and billing support must be possible

## User Roles

- Admin
- Manager
- Operator

## Contact Statuses

- LEAD
- CUSTOMER
- VIP
- LOST

## Call Outcomes

- ORDER
- CALL_LATER
- SCHEDULE_CALL
- FAIL

## Development Workflow

Before implementing any feature:

1. Read PROJECT_VISION.md
2. Follow ARCHITECTURE_RULES.md and TARGET_ARCHITECTURE.md
3. Check open ADRs in docs/adr/ for unresolved decisions
4. Explain architectural decisions
5. Implement the solution
6. Explain what was created

## Current Priority

1. Database architecture
2. Authentication
3. Contacts module
4. Products module
5. Orders module
6. Callbacks module
7. AI Assistant
8. SaaS features