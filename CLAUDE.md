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

4.  **UI Design Principles**:
    *   **Visual Quality**: Create beautiful, minimalistic, and highly professional interfaces.
    *   **Mantine Native**: Use Mantine's native components and their built-in props exclusively. Avoid external CSS customization.
    *   **Theme Awareness**: Design for both dark and light modes. Optimize for dark mode as it's the primary usage mode. 
    *   **Minimal Interactions**: Avoid hover effects and unnecessary animations unless absolutely essential for functionality.
    *   **Pattern Consistency**: Strictly follow existing UI patterns (ListLayout, DetailsView). Do not invent new patterns; mimic existing screens.
    *   **Native Styling**: Use only Mantine's component props (size, variant, color, radius, etc.) for styling. No custom CSS classes.

5.  **No Comments**:
    *   Never generate comments in code. Keep code clean and self-explanatory.

6.  **local_activity_utils first**:
    *   Study the README at `C:\Users\nthol\Documents\Projects\Limkokwing\Registry\moodle-plugins\moodle-local_activity_utils\README.md` before touching Moodle APIs or adding changes, especially helpers named `local_activity_utils_*` (they are part of my project).
    *   Source code is at `C:\Users\nthol\Documents\Projects\Limkokwing\Registry\moodle-plugins\moodle-local_activity_utils`. You may make adjustments it if necessary.
    *   If you need functionality that isn’t already defined there, tell me so I can extend `local_activity_utils`.
    *   Any new `lms` module functionality must have every server action (`*/lms/**/actions.ts`) call the `local_activity_utils` helpers unless the needed behavior already exists in the standard Moodle API.

---

## Directory Structure

```
src/
├── app/(module)/feature/           # Next.js routes
│   ├── layout.tsx                  # ListLayout with sidebar
│   ├── page.tsx                    # NothingSelected
│   ├── new/page.tsx                # Create form
│   └── [id]/
│       ├── page.tsx                # DetailsView
│       └── edit/page.tsx           # Edit form
│
├── modules/[module]/               # Business logic (8 modules)
│   ├── database/
│   │   ├── schema/entity.ts        # Drizzle tables
│   │   ├── index.ts                # Export all schemas
│   │   └── relations.ts            # Module relations
│   ├── features/[feature]/
│   │   ├── server/
│   │   │   ├── repository.ts       # extends BaseRepository
│   │   │   ├── service.ts          # extends BaseService + serviceWrapper
│   │   │   └── actions.ts          # 'use server' exports
│   │   ├── components/Form.tsx
│   │   ├── index.ts                # Export components + actions
│   │   └── types.ts
│   └── shared/                     # Module-level shared
│
├── core/
│   ├── database/
│   │   ├── index.ts                # Aggregates all module schemas
│   │   ├── relations.ts            # CENTRALIZED relations (all modules)
│   │   └── types.ts                # Common type exports
│   ├── platform/
│   │   ├── BaseRepository.ts       # Generic CRUD + pagination
│   │   ├── BaseService.ts          # Role-based auth wrapper
│   │   ├── withAuth.ts             # Authorization HOF
│   │   └── serviceWrapper.ts       # Logging proxy
│   ├── auth.ts                     # NextAuth config
│   └── integrations/               # Google, AWS S3
│
└── shared/
    ├── ui/adease/                  # Custom components (Form, ListLayout, etc)
    ├── lib/hooks/                  # use-current-term, use-user-schools, etc
    └── lib/utils/                  # gradeCalculations, auditUtils, etc
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

5.  **Data Fetching**: Never use useEffect for data fetching but always use TanStack Query. TanStack Query keys should use kebab-case.


Never run pnpm:db generate, I will do that manually, and never run migration script or the push script