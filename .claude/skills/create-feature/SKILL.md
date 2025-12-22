---
name: create-feature
description: Scaffolds a new feature module including database schema, repository, service, actions, UI components, and pages following the project's architectural standards.
allowed-tools: Read, Write, Bash
---

# Create Feature Skill

This skill automates the creation of a new feature within the Registry Web application. It follows the "Modular Monolith" architecture.

## Usage

1.  **Invoke**: "Create a new feature for [module] called [feature] for entity [Entity]."
    *   Example: "Create a new feature for `registry` called `terms` for entity `Term`."
2.  **Parameters needed**:
    *   `module`: Existing module folder (e.g., `academic`, `registry`).
    *   `feature`: URL-friendly feature name (e.g., `module-grades`).
    *   `Entity`: PascalCase entity name (e.g., `ModuleGrade`).
    *   `table_name`: snake_case database table name (e.g., `module_grades`).

## Steps

Follow these steps sequentially. If a file already exists, ask before overwriting.

### 1. Database Schema
**Path**: `src/modules/{{module}}/database/schema/{{table_name}}.ts`
```typescript
import { pgTable, serial, text, boolean, timestamp } from 'drizzle-orm/pg-core';

export const {{entities}} = pgTable('{{table_name}}', {
  id: serial().primaryKey(),
  name: text().notNull(), // Modify as needed
  isActive: boolean().notNull().default(true),
  createdAt: timestamp().defaultNow(),
  updatedAt: timestamp().defaultNow().$onUpdate(() => new Date()),
});
```

### 2. Repository
**Path**: `src/modules/{{module}}/features/{{feature}}/server/repository.ts`
```typescript
import { db, {{entities}} } from '@/core/database';
import BaseRepository from '@/core/platform/BaseRepository';
import { eq } from 'drizzle-orm';

export default class {{Entity}}Repository extends BaseRepository<typeof {{entities}}, 'id'> {
  constructor() {
    super({{entities}}, {{entities}}.id);
  }

  // Add custom queries here
  // async findActive() {
  //   return db.query.{{entities}}.findMany({ where: eq({{entities}}.isActive, true) });
  // }
}
```

### 3. Service
**Path**: `src/modules/{{module}}/features/{{feature}}/server/service.ts`
```typescript
import BaseService from '@/core/platform/BaseService';
import { serviceWrapper } from '@/core/platform/serviceWrapper';
import withAuth from '@/core/platform/withAuth';
import {{Entity}}Repository from './repository';
import type { {{entities}} } from '@/core/database';

class {{Entity}}Service extends BaseService<typeof {{entities}}, 'id'> {
  constructor() {
    super(new {{Entity}}Repository(), { 
        findAllRoles: ['dashboard'], // Adjust roles as needed
        createRoles: ['dashboard'],
        updateRoles: ['dashboard'],
        deleteRoles: ['dashboard']
    });
  }

  // Example custom method
  // async findActive() {
  //   return withAuth(() => (this.repository as {{Entity}}Repository).findActive(), ['dashboard']);
  // }
}

export const {{entity}}Service = serviceWrapper({{Entity}}Service, '{{Entity}}Service');
```

### 4. Server Actions
**Path**: `src/modules/{{module}}/features/{{feature}}/server/actions.ts`
```typescript
'use server';

import { {{entity}}Service as service } from './service';
import type { {{entities}} } from '@/core/database';

type {{Entity}} = typeof {{entities}}.$inferInsert;

export async function get{{Entity}}(id: number) {
  return service.get(id);
}

export async function findAll{{Entity}}s(page = 1, search = '') {
  return service.findAll({ 
    page, 
    search, 
    sort: [{ column: 'createdAt', order: 'desc' }] // Adjust default sort
  });
}

export async function create{{Entity}}(data: {{Entity}}) {
  return service.create(data);
}

export async function update{{Entity}}(id: number, data: {{Entity}}) {
  return service.update(id, data);
}

export async function delete{{Entity}}(id: number) {
  return service.delete(id);
}
```

### 5. Types & Index
**Path**: `src/modules/{{module}}/features/{{feature}}/types.ts`
```typescript
// Add specific types if needed, otherwise leave empty or export inferred types
export type {{Entity}}DTO = {
    // specific frontend types
};
```

**Path**: `src/modules/{{module}}/features/{{feature}}/index.ts`
```typescript
export { default as Form } from './components/Form';
export * from './server/actions';
export * from './types';
```

### 6. Form Component
**Path**: `src/modules/{{module}}/features/{{feature}}/components/Form.tsx`
```typescript
'use client';

import { TextInput, Switch } from '@mantine/core';
import { createInsertSchema } from 'drizzle-zod';
import { useRouter } from 'nextjs-toploader/app';
import { {{entities}} } from '@/modules/{{module}}/database';
import { Form } from '@/shared/ui/adease';

type {{Entity}} = typeof {{entities}}.$inferInsert;

type Props = {
  onSubmit: (values: {{Entity}}) => Promise<{{Entity}}>;
  defaultValues?: {{Entity}};
  title?: string;
};

// Adjust schema as needed (e.g., .omit({ id: true, createdAt: true }))
const schema = createInsertSchema({{entities}});

export default function {{Entity}}Form({ onSubmit, defaultValues, title }: Props) {
  const router = useRouter();
  return (
    <Form 
      title={title} 
      action={onSubmit} 
      queryKey={['{{entities}}']} 
      schema={schema} 
      defaultValues={defaultValues} 
      onSuccess={({ id }) => router.push(`/{{module}}/{{feature}}/${id}`)}
    >
      {(form) => (
        <>
          <TextInput label='Name' {...form.getInputProps('name')} />
          <Switch label='Active' {...form.getInputProps('isActive', { type: 'checkbox' })} />
        </>
      )}
    </Form>
  );
}
```

### 7. UI Pages (Layout)
**Path**: `src/app/(dashboard)/{{module}}/{{feature}}/layout.tsx` (Note: Check if `(dashboard)` group exists or just `{{module}}`)
```typescript
'use client';

import { findAll{{Entity}}s } from '@/modules/{{module}}/features/{{feature}}';
import { ListItem, ListLayout, NewLink } from '@/shared/ui/adease';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <ListLayout
      path={'/{{module}}/{{feature}}'}
      queryKey={['{{entities}}']}
      getData={findAll{{Entity}}s}
      actionIcons={[<NewLink key={'new'} href='/{{module}}/{{feature}}/new' />]}
      renderItem={(it) => <ListItem id={it.id} label={it.name} />}
    >
      {children}
    </ListLayout>
  );
}
```

### 8. UI Pages (Index/NothingSelected)
**Path**: `src/app/(dashboard)/{{module}}/{{feature}}/page.tsx`
```typescript
import { NothingSelected } from '@/shared/ui/adease';

export default function Page() {
  return <NothingSelected title='{{Entity}}s' />;
}
```

### 9. UI Pages (New)
**Path**: `src/app/(dashboard)/{{module}}/{{feature}}/new/page.tsx`
```typescript
import { Box } from '@mantine/core';
import { create{{Entity}}, Form } from '@/modules/{{module}}/features/{{feature}}';

export default async function NewPage() {
  return (
    <Box p={'lg'}>
      <Form title={'Create {{Entity}}'} onSubmit={create{{Entity}}} />
    </Box>
  );
}
```

### 10. UI Pages (Details)
**Path**: `src/app/(dashboard)/{{module}}/{{feature}}/[id]/page.tsx`
```typescript
import { delete{{Entity}}, get{{Entity}} } from '@/modules/{{module}}/features/{{feature}}';
import { notFound } from 'next/navigation';
import { DetailsView, DetailsViewBody, DetailsViewHeader, FieldView } from '@/shared/ui/adease';

export default async function {{Entity}}Details({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await get{{Entity}}(Number(id));
  if (!data) return notFound();

  return (
    <DetailsView>
      <DetailsViewHeader 
        title={'{{Entity}}'} 
        queryKey={['{{entities}}']} 
        handleDelete={async () => { 'use server'; await delete{{Entity}}(Number(id)); }} 
      />
      <DetailsViewBody>
        <FieldView label='Name'>{data.name}</FieldView>
        <FieldView label='Status'>{data.isActive ? 'Active' : 'Inactive'}</FieldView>
      </DetailsViewBody>
    </DetailsView>
  );
}
```

### 11. UI Pages (Edit)
**Path**: `src/app/(dashboard)/{{module}}/{{feature}}/[id]/edit/page.tsx`
```typescript
import { Box } from '@mantine/core';
import { Form, get{{Entity}}, update{{Entity}} } from '@/modules/{{module}}/features/{{feature}}';
import { notFound } from 'next/navigation';

export default async function {{Entity}}Edit({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await get{{Entity}}(Number(id));
  if (!data) return notFound();

  return (
    <Box p={'lg'}>
      <Form 
        title={'Edit {{Entity}}'} 
        defaultValues={data} 
        onSubmit={async (value) => { 'use server'; return await update{{Entity}}(Number(id), value); }} 
      />
    </Box>
  );
}
```

### 12. Final Manual Steps (User Action Required)
Remind the user to:
1.  **Register Schema**: Add `export * from './schema/{{table_name}}';` to `src/modules/{{module}}/database/index.ts` (or `schema/index.ts` if split).
2.  **Register TS Path**: Add `"@{{module}}/{{feature}}/*": ["./src/modules/{{module}}/features/{{feature}}/*"]` to `tsconfig.json`.
3.  **Run Migrations**: Run `pnpm db:generate` and `pnpm db:migrate` (or push).
4.  **Restart Server**: If paths changed.
