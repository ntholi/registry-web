# Registry Web - LLM Developer Context

**Stack**: Next.js 16 (App Router), Neon Postgres, Drizzle ORM, Mantine v8, Auth.js, TanStack Query.
**Architecture**: Modular Monolith. Strict TypeScript. Biome Linting.

## 🚨 CRITICAL RULES (Do Not Ignore)

1.  **Strict Layered Architecture**:
    *   **UI** calls **Server Actions**.
    *   **Server Actions** call **Services**.
    *   **Services** call **Repositories**.
    *   **Repositories** call **Database**.
    *   *Constraint*: **Only** `repository.ts` files may import `db`. Never access the DB from actions or services directly.

2.  **Code Reuse First**:
    *   Before creating a function (e.g., `getSchools`), check if it exists in another module (e.g., `@registry/schools`).
    *   Import from existing features using path aliases (e.g., `import { getSchools } from '@registry/schools'`).
    *   Do not duplicate logic.

3.  **Performance**:
    *   Avoid multiple database calls
    *   Use `db.transaction` for multi-step writes.

4.  **UI Consistency**:
    *   Strictly follow the UI patterns below (ListLayout, DetailsView, Mantine components).
    *   Do not invent new UI patterns; mimic existing screens.
    * Always strive for a beautiful yet very simplistic design but very professional looking

---

## Directory Structure
```text
src/modules/[module]/features/[feature]/
├── database/schema/entity.ts      # DB Schema
├── server/
│   ├── actions.ts                 # 'use server' entry point
│   ├── service.ts                 # Business logic + Auth
│   └── repository.ts              # DB Access (The ONLY place db is imported)
├── components/                    # Feature-specific UI
└── index.ts                       # Public API (exports actions/types)
```

## Implementation Guide & Snippets

### 1. Database Schema
**File**: `src/modules/[module]/database/schema/[entity].ts`
*Rules*: `snake_case` tables, `camelCase` columns. Always include `createdAt`.
```typescript
import { boolean, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

export const tableName = pgTable('table_name', {
  id: serial().primaryKey(),
  name: text().notNull(),
  isActive: boolean().notNull().default(true),
  createdAt: timestamp().defaultNow(),
});
```

### 2. Repository (The ONLY DB Access)
**File**: `src/modules/[module]/features/[feature]/server/repository.ts`
*Rules*: Extend `BaseRepository`. Use `db.query` for reads.
```typescript
import { eq } from 'drizzle-orm';
import { db } from '@/core/database'; // <--- ONLY ALLOWED HERE
import { tableName } from '@/core/database';
import BaseRepository from '@/core/platform/BaseRepository';

export default class EntityRepository extends BaseRepository<typeof tableName, 'id'> {
  constructor() { super(tableName, tableName.id); }

  // Example: Optimized query with relations (Avoid N+1)
  async findWithRelations(id: number) {
    return db.query.tableName.findFirst({
      where: eq(tableName.id, id),
      with: { relatedTable: true }
    });
  }
}
export const entityRepository = new EntityRepository();
```

### 3. Service (Logic & Auth)
**File**: `src/modules/[module]/features/[feature]/server/service.ts`
*Rules*: Extend `BaseService`. Define roles.
```typescript
import BaseService from '@/core/platform/BaseService';
import { serviceWrapper } from '@/core/platform/serviceWrapper';
import { entityRepository } from './repository';

class EntityService extends BaseService<typeof entityRepository.table, 'id'> {
  constructor() {
    super(entityRepository, {
      byIdRoles: ['dashboard'], // Roles allowed to view details
      findAllRoles: ['dashboard'],
    });
  }
}
export const entityService = serviceWrapper(EntityService, 'EntityService');
```

### 4. Server Actions (Public API)
**File**: `src/modules/[module]/features/[feature]/server/actions.ts`
*Rules*: `'use server'`, pass-through to Service.
```typescript
'use server';
import { entityService as service } from './service';

export async function getAllEntities() { return service.getAll(); }
export async function createEntity(data: any) { return service.create(data); }
export async function updateEntity(id: number, data: any) { return service.update(id, data); }
```

### 5. UI: List Page
**File**: `src/app/(module)/[feature]/layout.tsx`
*Rules*: Use `ListLayout` and `ListItem`.
```typescript
'use client';
import { findAllEntities } from '@module/feature';
import { ListLayout, ListItem, NewLink } from '@/shared/ui/adease';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <ListLayout
      path='/feature'
      queryKey={['entities']} // TanStack Query key
      getData={findAllEntities}
      actionIcons={[<NewLink key='new' href='/feature/new' />]}
      renderItem={(it) => <ListItem id={it.id} label={it.name} />}
    >
      {children}
    </ListLayout>
  );
}
```

### 6. UI: Form
**File**: `src/modules/[module]/features/[feature]/components/Form.tsx`
*Rules*: Use `drizzle-zod`, `Form` from `@/shared/ui/adease`.
```typescript
'use client';
import { TextInput } from '@mantine/core';
import { createInsertSchema } from 'drizzle-zod';
import { Form } from '@/shared/ui/adease';
import { tableName } from '@/core/database';

export default function EntityForm({ onSubmit, defaultValues, title }: any) {
  return (
    <Form
      title={title}
      action={onSubmit}
      queryKey={['entities']}
      schema={createInsertSchema(tableName)}
      defaultValues={defaultValues}
      onSuccess={({ id }) => { /* redirect */ }}
    >
      {(form) => (
        <TextInput label='Name' {...form.getInputProps('name')} />
      )}
    </Form>
  );
}
```

## Coding Standards
1.  **Functions**: Use `function name() {}`. **NO** arrow functions for top-level exports.
2.  **Types**: Strict TS. No `any`. Infer from Drizzle (`typeof table.$inferSelect`).
3.  **Imports**: Use aliases (`@registry/terms`, `@shared/ui/adease`).
4.  **QA**:
    *   Run `pnpm tsc --noEmit` (run iteratively until no more issues).
    *   Run `pnpm lint:fix` (Must pass).


Never run pnpm:db generate, I will do that manually, and never run migration script or the push script