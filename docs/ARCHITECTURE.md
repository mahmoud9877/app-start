# ERP Architecture

A **modular monolith** built with NestJS, PostgreSQL and Prisma. Each business domain is an isolated NestJS module, designed so that individual modules can be extracted into microservices later.

## Folder structure

```
prisma/
├── schema/                  # multi-file Prisma schema, one file per module
│   ├── schema.prisma        # generator + datasource only
│   ├── users.prisma
│   └── <module>.prisma
└── migrations/
prisma.config.ts             # Prisma CLI config (schema path, DATABASE_URL)

src/
├── main.ts                  # bootstrap: global prefix, ValidationPipe, filters
├── app.module.ts            # wires config, database and all feature modules
├── config/                  # typed config + env validation (fails fast)
├── database/                # global DatabaseModule exporting PrismaService
├── generated/prisma/        # Prisma client output (git-ignored, `npm run prisma:generate`)
├── common/                  # cross-cutting code with NO business knowledge
│   ├── decorators/          # @CurrentUser(), @RequirePermissions()
│   ├── guards/              # PermissionsGuard (global)
│   ├── filters/             # PrismaExceptionFilter (global)
│   ├── dto/                 # PaginationQueryDto
│   ├── types/               # AuthenticatedUser, PaginatedResult
│   └── utils/
└── modules/
    ├── auth/  users/  roles-permissions/  audit-logs/  notifications/
    ├── employees/  customers/  suppliers/  products/
    ├── inventory/  sales/  purchases/  accounting/
    └── reports/
```

### Inside a module

```
modules/sales/
├── sales.module.ts       # wiring; exports only SalesService
├── sales.controller.ts   # HTTP only: routes, DTO validation, permissions
├── sales.service.ts      # business rules
├── sales.repository.ts   # the ONLY file that touches Prisma for this module
├── dto/                  # request/response DTOs (class-validator)
└── index.ts              # public API: the only file other modules import
```

Add these files only when they're needed:

- `<module>.permissions.ts`: permission keys the module owns (`sales.order.create`).
- `<module>.events.ts`: events the module publishes.
- `<module>.listener.ts`: handlers for other modules' events.
- `<module>.types.ts`: domain types beyond what Prisma generates.

There is no `entities/` folder. Prisma generates the model types.

When a module grows (for example, sales gets quotations, orders and invoices), add sub-feature folders inside it. Each gets its own controller, service and repository, all under the same module.

### Layers

```
Controller → Service → Repository → PrismaService
```

Controllers contain no business logic. Services never call Prisma directly.

## How modules communicate

1. **Direct calls through dependency injection** when you need an answer right away. Import the other module and inject its exported service, always through its `index.ts`. Never import another module's repository or internal files.
2. **Domain events** for side effects. For example, `sales.order.confirmed` is picked up by Inventory, Accounting, Notifications and Audit Logs. Add `@nestjs/event-emitter` when the first event is needed.
3. **Data ownership.** A module reads and writes only its own tables. Cross-module references are plain ID fields (`customerId String`), not Prisma relations. Use relations freely inside a module.

### Dependency direction

Modules depend downward only. Communication upward goes through events.

```
Level 4  reports                          (read-only)
Level 3  sales · purchases · accounting
Level 2  inventory
Level 1  customers · suppliers · products · employees
Level 0  users · roles-permissions · audit-logs · notifications · auth
```

Needing `forwardRef()` is a design smell. Use an event instead.

### Deliberate exceptions

- **Cross-module atomic writes.** For example, confirming a sale also decreases stock. The calling service may open a Prisma transaction and pass the transaction client to the other module's service. Use this sparingly.
- **Reports** may run read-only queries across tables. It never writes.

## Global versus module-local

| Global | Module-local |
|---|---|
| ConfigModule, DatabaseModule | Controllers, services, repositories, DTOs |
| PermissionsGuard, ValidationPipe, PrismaExceptionFilter | Business rules and calculations |
| Decorators and types in `common/` | Permission keys, events, listeners |
| | The module's `.prisma` file |

Rule of thumb: code goes in `common/` only if it would work unchanged in a completely different business.

## Current state

- **Auth:** signup and login work against Postgres through `UsersService`. JWT issuing and a global `JwtAuthGuard` (in `modules/auth/guards/`, with a `@Public()` decorator) are **not implemented yet**.
- **Users:** has a minimal `User` model.
- **All other modules:** wired skeletons with no models, routes or logic.
- **PermissionsGuard:** registered globally. It only acts on routes marked with `@RequirePermissions(...)`, and none are marked yet.

## Path to microservices

What already prepares for it:

- Each module has a public API in `index.ts`.
- Each module owns its own data.
- There is one `.prisma` file per module.
- Side effects go through events.
- Dependencies point in one direction.

To extract a module:

1. Switch to Nest monorepo mode (`apps/erp`, `apps/<service>`, `libs/contracts`).
2. Move the module folder, its `.prisma` file and its tables into the new app.
3. Replace in-process service calls with a client that has the same method signatures but makes a network call (HTTP, gRPC or messaging).
4. Publish events to a broker (RabbitMQ or Kafka) using the outbox pattern.
5. Replace cross-module transactions with events or sagas.

Good first candidates to extract: `notifications`, `audit-logs` and `reports`.

## Commands

```bash
docker compose up -d postgres     # start Postgres
npm run prisma:migrate            # create/apply migrations (dev)
npm run prisma:generate           # regenerate client after schema changes
npm run start:dev
npm run prisma:deploy             # apply migrations in production
```
