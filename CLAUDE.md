---
trigger: always_on
---

# Registry Web - Development Guide

**Project**: University Registry System - Next.js 16, Neon PostgreSQL, Drizzle ORM, Mantine v8, Auth.js

## Architecture Overview

Modular monolith with feature-based organization. Each module (academic, registry, admin, finance, student-portal, etc) contains its own database schemas, business logic, and UI components.

## Directory Structure

```
/src
  /app                          # Next.js App Router
    /(module-name)/             # Route groups (academic, registry, admin, etc.)
      /feature-name/            # Feature routes
        page.tsx                # List/overview page
        layout.tsx              # ListLayout with sidebar navigation
        new/page.tsx            # Create new entity page
        [id]/page.tsx           # Detail/view page
        [id]/edit/page.tsx      # Edit page
  /modules                      # Business logic modules
    /[module]/                  # Module name (academic, registry, admin, finance, etc.)
      /database/                # Database schema for this module
        /schema/                # Schema files (groups related entities or one per entity)
          entity.ts             # Table definitions
        index.ts                # Exports all schemas and relations
        relations.ts            # Drizzle relations
      /features/                # Feature modules
        /[feature]/             # Feature name (terms, schools, students, etc.)
          /server/              # Server-side code
            actions.ts          # Server actions ('use server')
            service.ts          # Business logic with auth
            repository.ts       # Database operations
          /components/          # UI components
            Form.tsx            # Entity form component
          index.ts              # Feature exports, exports all components used outside this /[feature]/ folder
          types.ts              # Feature types
      /shared/                  # Module-level shared code
  /core                         # Core platform functionality
    /auth/                      # Authentication (Auth.js)
    /database/                  # Database connection and schema aggregation
    /platform/                  # BaseRepository, withAuth, serviceWrapper
  /shared                       # Cross-module shared code
    /ui/                        # Shared UI components
      /adease/                  # Custom UI component library
    /lib/                       # Shared utilities
```

## Creating a New Feature (Step-by-Step)

Use **terms** (registry module) as reference implementations.

### 1. Database Schema

**Location**: `/src/modules/[module]/database/schema/[entity].ts`

```typescript
import { boolean, integer, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

export const tableName = pgTable('table_name', {
  id: serial().primaryKey(),
  name: text().notNull(),
  isActive: boolean().notNull().default(true),
  createdAt: timestamp().defaultNow(),
});
```

**Rules**:
- Table names: `snake_case`, lowercase, plural
- Column names: `camelCase` in code (Drizzle converts to `snake_case` via `casing: 'snake_case'`)
- Add `createdAt: timestamp().defaultNow()` for audit trail
- Add indexes for foreign keys: use second parameter of `pgTable` with callback

**Export Schema**: Add to `/src/modules/[module]/database/index.ts`
```typescript
export * from './schema/entity';
export * from './relations';
```

**Add Drizzle Relations** (if needed): In `/src/modules/[module]/database/relations.ts`

**Generate Migration**: `pnpm db:generate` always ask before running `pnpm db:migrate` and never run `pnpm db:push`

### 2. Repository Layer

**Location**: `/src/modules/[module]/features/[feature]/server/repository.ts`

```typescript
import { eq } from 'drizzle-orm';
import { db } from '@/core/database';
import { tableName } from '@/core/database';
import BaseRepository, { type QueryOptions } from '@/core/platform/BaseRepository';

export type EntityInsert = typeof tableName.$inferInsert;
export type EntityQueryOptions = QueryOptions<typeof tableName>;

export default class EntityRepository extends BaseRepository<typeof tableName, 'id'> {
  constructor() {
    super(tableName, tableName.id);
  }

  async customMethod(param: string) {
    return db.query.tableName.findFirst({
      columns: { id: true, name: true },
      where: eq(tableName.name, param),
    });
  }
}

export const entityRepository = new EntityRepository();
```

**Rules**:
- Extend `BaseRepository<typeof table, 'id'>`
- Export types: `EntityInsert` and `EntityQueryOptions`
- Use `db.query` for reads (select only needed columns)
- Use `db.transaction` for complex multi-step operations
- Export singleton instance: `export const xRepository = new XRepository()`
- Inherited methods: `findById`, `findFirst`, `findAll`, `query` (paginated), `create`, `update`, `delete`, `count` from `BaseRepository`

### 3. Service Layer

**Location**: `/src/modules/[module]/features/[feature]/server/service.ts`

```typescript
import type { tableName } from '@/core/database';
import BaseService from '@/core/platform/BaseService';
import { serviceWrapper } from '@/core/platform/serviceWrapper';
import EntityRepository from './repository';

class EntityService extends BaseService<typeof tableName, 'id'> {
  constructor() {
    super(new EntityRepository(), {
      byIdRoles: ['dashboard'],
      findAllRoles: ['dashboard'],
    });
  }
}

export const entityService = serviceWrapper(EntityService, 'EntityService');
```

**Rules**:
- Extend `BaseService<typeof table, 'id'>` for standard CRUD operations
- Pass roles config in constructor (optional): `byIdRoles`, `findAllRoles`, `createRoles`, `updateRoles`, `deleteRoles`, `countRoles`
- Default roles if not specified: `byIdRoles` and `findAllRoles` default to `['dashboard']`, others default to `[]` (admin only)
- Roles:
  - `[]` = admin only
  - `['dashboard']` = any staff user (admin, registry, finance, academic, student_service)
  - `['all']` = any authenticated user + unauthenticated
  - `['auth']` = authenticated users only
  - `['finance']`, `['student']`, etc = specific roles
- Override role methods for custom behavior: `protected byIdRoles()`, `protected findAllRoles()`, etc.
- Inherited methods: `get(id)`, `getAll()`, `findAll(params)`, `first()`, `create(data)`, `update(id, data)`, `delete(id)`, `count()`
- Override any method for custom behavior (e.g., custom delete logic)
- Add custom methods with `withAuth` wrapper as needed
- Export with `serviceWrapper(ClassName, 'ServiceName')` for logging

### 4. Actions Layer

**Location**: `/src/modules/[module]/features/[feature]/server/actions.ts`

```typescript
'use server';

import type { tableName } from '@/core/database';
import { entityService as service } from './service';

type Entity = typeof tableName.$inferInsert;

export async function getEntity(id: number) {
  return service.get(id);
}

export async function findAllEntities(page: number = 1, search = '') {
  return service.findAll({
    page,
    search,
    searchColumns: ['name'],
    sort: [{ column: 'name', order: 'desc' }],
  });
}

export async function getAllEntities() {
  return service.getAll();
}

export async function createEntity(entity: Entity) {
  return service.create(entity);
}

export async function updateEntity(id: number, entity: Partial<Entity>) {
  return service.update(id, entity);
}

export async function deleteEntity(id: number) {
  return service.delete(id);
}
```

**Rules**:
- MUST start with `'use server';`
- Simple pass-through functions to service
- Define type from schema: `type X = typeof table.$inferInsert`
- Use `Partial<X>` for updates
- Export all functions for client use

### 5. Feature Index

**Location**: `/src/modules/[module]/features/[feature]/index.ts`
- Exports all components that are used outside the `/src/modules/[module]/features/[feature]/` directory
- Exports everything in `[feature]/server/actions.ts`
- Never export service and repository files
- Each feature should be self contained and avoid exposing it's internals to the outside

```typescript
export { default as Form } from './components/Form';
export * from './server/actions';
export * from './types';
```

### 6. UI Components - Form

**Location**: `/src/modules/[module]/features/[feature]/components/Form.tsx`

```typescript
'use client';

import { NumberInput, Switch, TextInput } from '@mantine/core';
import { createInsertSchema } from 'drizzle-zod';
import { useRouter } from 'nextjs-toploader/app';
import { tableName } from '@/core/database';
import { Form } from '@/shared/ui/adease';

type Entity = typeof tableName.$inferInsert;

type Props = {
  onSubmit: (values: Entity) => Promise<Entity>;
  defaultValues?: Entity;
  title?: string;
};

export default function EntityForm({ onSubmit, defaultValues, title }: Props) {
  const router = useRouter();

  return (
    <Form
      title={title}
      action={onSubmit}
      queryKey={['entities']}
      schema={createInsertSchema(tableName)}
      defaultValues={defaultValues}
      onSuccess={({ id }) => {
        router.push(`/path/${id}`);
      }}
    >
      {(form) => (
        <>
          <TextInput label='Name' {...form.getInputProps('name')} />
          <NumberInput label='Order' {...form.getInputProps('order')} />
          <Switch label='Active' {...form.getInputProps('isActive', { type: 'checkbox' })} />
        </>
      )}
    </Form>
  );
}
```

**Rules**:
- Use `createInsertSchema` from `drizzle-zod` for validation
- Use Mantine form components
- Use `Form` from `@/shared/ui/adease`
- Router from `nextjs-toploader/app` for loading state
- `queryKey` should match the entity name (use kebab-case)

### 7. App Routes - Layout (List)

**Location**: `/src/app/([module])/[feature]/layout.tsx`

```typescript
'use client';

import { findAllEntities } from '@module/feature';
import type { PropsWithChildren } from 'react';
import { ListItem, ListLayout, NewLink } from '@/shared/ui/adease';

export default function Layout({ children }: PropsWithChildren) {
  return (
    <ListLayout
      path={'/feature'}
      queryKey={['entities']}
      getData={findAllEntities}
      actionIcons={[<NewLink key='new-link' href='/feature/new' />]}
      renderItem={(it) => (
        <ListItem
          id={it.id}
          label={it.name}
        />
      )}
    >
      {children}
    </ListLayout>
  );
}
```

### 8. App Routes - List Page

**Location**: `/src/app/([module])/[feature]/page.tsx`

```typescript
import { NothingSelected } from '@/shared/ui/adease';

export default function Page() {
  return <NothingSelected title='Entities' />;
}
```

### 9. App Routes - Detail Page

**Location**: `/src/app/([module])/[feature]/[id]/page.tsx`

```typescript
import { Badge } from '@mantine/core';
import { deleteEntity, getEntity } from '@module/feature';
import { notFound } from 'next/navigation';
import {
  DetailsView,
  DetailsViewBody,
  DetailsViewHeader,
  FieldView,
} from '@/shared/ui/adease';

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EntityDetails({ params }: Props) {
  const { id } = await params;
  const entity = await getEntity(Number(id));

  if (!entity) {
    return notFound();
  }

  return (
    <DetailsView>
      <DetailsViewHeader
        title='Entity'
        queryKey={['entities']}
        handleDelete={async () => {
          'use server';
          await deleteEntity(Number(id));
        }}
      />
      <DetailsViewBody>
        <FieldView label='Name'>{entity.name}</FieldView>
        <FieldView label='Active'>
          <Badge color={entity.isActive ? 'green' : 'red'}>
            {entity.isActive ? 'Active' : 'Inactive'}
          </Badge>
        </FieldView>
      </DetailsViewBody>
    </DetailsView>
  );
}
```

### 10. App Routes - Edit Page

**Location**: `/src/app/([module])/[feature]/[id]/edit/page.tsx`

```typescript
import { Box } from '@mantine/core';
import { Form } from '@module/feature';
import { notFound } from 'next/navigation';
import { getEntity, updateEntity } from '@[module]/[feature]';

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EntityEdit({ params }: Props) {
  const { id } = await params;
  const entity = await getEntity(Number(id));

  if (!entity) {
    return notFound();
  }

  return (
    <Box p='lg'>
      <Form
        title='Edit Entity'
        defaultValues={entity}
        onSubmit={async (value) => {
          'use server';
          const updated = await updateEntity(Number(id), value);
          if (!updated) {
            throw new Error('Failed to update entity');
          }
          return updated;
        }}
      />
    </Box>
  );
}
```

### 11. App Routes - New Page

**Location**: `/src/app/([module])/[feature]/new/page.tsx`

```typescript
import { Box } from '@mantine/core';
import { Form } from '@module/feature';
import { createEntity } from '@[module]/[feature]';

export default async function NewPage() {
  return (
    <Box p='lg'>
      <Form title='Create Entity' onSubmit={createEntity} />
    </Box>
  );
}
```

## Path Aliases

Configure in `tsconfig.json`:
- `@/*` → `./src/*`
- `@academic/*` → `./src/modules/academic/features/*`
- `@registry/*` → `./src/modules/registry/features/*`
- `@admin/*` → `./src/modules/admin/features/*`
- `@finance/*` → `./src/modules/finance/features/*`
- `@student-portal/*` → `./src/modules/student-portal/features/*`
- `@classroom/*` → `./src/modules/classroom/features/*`
- `@auth/*` → `./src/modules/auth/features/*`

**Usage**: `import { Form } from '@registry/terms';`

## Technology Stack

- **Framework**: Next.js 16 (App Router)
- **Database**: Neon PostgreSQL
- **ORM**: Drizzle ORM (snake_case schema)
- **UI**: Mantine v8
- **Auth**: Auth.js (Google OAuth)
- **State**: TanStack Query v5
- **Validation**: Zod + drizzle-zod
- **Linting**: Biome (NOT ESLint)
- **Package Manager**: pnpm (ONLY)

## Development Commands

```bash
pnpm dev                    # Start dev server
pnpm build                  # Production build
pnpm db:generate            # Generate migrations
pnpm db:migrate             # Run migrations (never run this command unless user has approved)
pnpm db:studio              # Open Drizzle Studio
pnpm tsc --noEmit           # Type check (run until 0 errors)
pnpm lint:fix               # Lint and fix (run until 0 errors)
pnpm check                  # Format and lint
```

## Code Style & Best Practices

### TypeScript
- Strict mode enabled
- NEVER use `any` type (Biome error)
- Use `type` for simple types, `interface` for objects with methods
- Infer types from schema: `typeof table.$inferInsert` / `.$inferSelect`

### Functions
- ALWAYS use `function name() {}` declarations
- NEVER use arrow functions for named functions
- Arrow functions OK for callbacks and inline functions

### Database
- Use `db.query.tableName.findX()` for reads (select specific columns)
- Use `db.insert/update/delete` for writes
- Use `db.transaction` for multi-step operations
- Avoid multiple sequential DB calls (use joins/relations)

### UI (Mantine v8)
- Dark mode first (light mode support)
- Use semantic colors: `c='blue'` NOT `c='var(--mantine-color-blue-6)'`
- Responsive: `p={{ base: 'md', sm: 'lg' }}`
- Size values: `'4rem'` NOT `{rem(4)}`
- Use Mantine components, avoid custom CSS

### Data Fetching
- Use TanStack Query (`useQuery`, `useMutation`)
- NEVER use `useEffect` for data fetching
- Call server actions directly (no API routes)
- Query keys: `['entityName']` or `['entityName', id]`

### Components
- Co-locate components with features
- Keep components self-contained (props, no global state)
- Shared components → `/src/shared/ui/`
- Use `PropsWithChildren` for layout components

### Code Organization
- NO comments
- Follow DRY principle
- One file = one responsibility
- Export types, constants, functions explicitly

## Testing & Quality

Before finishing ANY task:
1. Run `pnpm tsc --noEmit` repeatedly until 0 errors
2. Run `pnpm lint:fix` repeatedly until 0 errors
3. Test the feature manually in browser
4. Verify all CRUD operations work

## Common Patterns

### Conditional Rendering
```typescript
{isActive && <Badge>Active</Badge>}
{items.length > 0 ? <List /> : <Empty />}
```

### Error Handling
```typescript
if (!entity) {
  return notFound();  // Next.js 404
}

if (!entity) {
  throw new Error('Entity not found');  // 500 error
}
```

### Server Actions in Components
```typescript
onSubmit={async (data) => {
  'use server';
  return await createEntity(data);
}}
```

### TanStack Query
```typescript
const { data, isLoading } = useQuery({
  queryKey: ['entities'],
  queryFn: () => getAllEntities(),
});
```

## Reference Implementations

Study these for complete examples:
- **Terms** (registry): `/src/modules/registry/features/terms/`

## Important Constraints

- ❌ NO API routes - use server actions
- ❌ NO `any` type - explicit types only
- ❌ NO arrow functions for declarations - `function` only
- ❌ NO `pnpm db:push` - use `generate` + `migrate`
- ❌ NO comments - self-documenting code
- ❌ NO CSS-in-JS vars for colors - use Mantine's `c` prop
- ❌ NO `useEffect` for data fetching - use TanStack Query
- ❌ Never create/update docs (`.md`, `.txt`, etc.)
- ✅ ALWAYS run type check and lint before finishing
- ✅ ALWAYS extend `BaseService` for standard CRUD services
- ✅ ALWAYS use `serviceWrapper` for services
- ✅ ALWAYS export singleton instances of repos and services