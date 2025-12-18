# Registry Web - LLM Context

**Stack**: Next.js 16 (App Router), Neon Postgres, Drizzle ORM, Mantine v8, Auth.js, TanStack Query. Modular monolith. Strict TypeScript. Biome linting.

## Critical Rules
1. **Architecture**: UI → Server Actions → Services → Repositories → DB. Only `repository.ts` imports `db`.
2. **Reuse First**: Check existing modules via aliases (`@registry/terms`, `@academic/module-grades`) before creating.
3. **Performance**: Use `db.transaction` for multi-step writes; avoid N+1 queries.
4. **UI**: Mantine-only styling (no custom CSS); follow existing ListLayout/DetailsView patterns; optimize for dark mode. The UI should look extremely professional and clean, consistent with the rest of the system. It should be very beautiful but minimalist.
5. **No Comments**: Code should be self-explanatory.
6. **Moodle/LMS**: every time before editing anything in the lms module, read `C:\Users\nthol\Documents\Projects\Limkokwing\Registry\moodle-plugins\moodle-local_activity_utils\README.md` first. You may edit this project if necessary, but always ask for approval first.
7. **Student Portal**: `src/app/student-portal` uses a unique layout. Unlike administration modules (Academic, Registry, etc.) which use `src/app/dashboard/dashboard.tsx` and `adease` patterns, the student portal does not follow these conventions.

## Path Aliases (tsconfig.json)
`@academic/*`, `@registry/*`, `@finance/*`, `@admin/*`, `@lms/*`, `@timetable/*`, `@auth/*`, `@audit-logs/*` → `src/modules/[module]/features/*`

## Structure
```
src/app/(module)/feature/           # Routes: layout.tsx, page.tsx, new/page.tsx, [id]/page.tsx, [id]/edit/page.tsx
src/modules/[module]/features/[feature]/
├── server/                         # repository.ts, service.ts, actions.ts
├── components/Form.tsx
├── index.ts                        # Re-export: components + actions
└── types.ts
src/core/database/                  # Aggregates schemas, centralized relations
src/core/platform/                  # BaseRepository, BaseService, withAuth, serviceWrapper
src/shared/ui/adease/               # Form, ListLayout, DetailsView, FieldView, ListItem, NewLink, NothingSelected
```

## Naming Conventions
| Layer | Pattern | Example |
|-------|---------|---------|
| Table | `snake_case` plural | `module_grades` |
| Column | `camelCase` | `stdNo`, `createdAt` |
| Schema export | `camelCase` plural | `export const moduleGrades = pgTable(...)` |
| Repository class | `PascalCase` + Repository | `ModuleGradeRepository` |
| Repository instance | `camelCase` + Repository | `moduleGradesRepository` |
| Service class | `PascalCase` + Service | `ModuleGradeService` |
| Service export | `camelCase` + Service | `moduleGradesService` |
| Actions | `verb` + `Entity` singular/plural | `getTerm`, `findAllTerms`, `createTerm`, `updateTerm`, `deleteTerm` |
| Form component | `PascalCase` + Form | `TermForm` |
| Query keys | kebab-case array | `['terms']`, `['module-grades']` |

## Implementation Patterns (Reference: `@registry/terms`, `@academic/module-grades`)

### Schema (`modules/[module]/database/schema/[entity].ts`)
```ts
export const terms = pgTable('terms', {
  id: serial().primaryKey(),
  name: text().notNull().unique(),
  isActive: boolean().notNull().default(false),
  createdAt: timestamp().defaultNow(),
});
```

### Repository (`features/[feature]/server/repository.ts`)
```ts
import { db, terms } from '@/core/database';
import BaseRepository from '@/core/platform/BaseRepository';

export default class TermRepository extends BaseRepository<typeof terms, 'id'> {
  constructor() { super(terms, terms.id); }

  async getActive() {
    return db.query.terms.findFirst({ where: eq(terms.isActive, true) });
  }
}
```

### Service (`features/[feature]/server/service.ts`)
```ts
import BaseService from '@/core/platform/BaseService';
import { serviceWrapper } from '@/core/platform/serviceWrapper';
import withAuth from '@/core/platform/withAuth';
import TermRepository from './repository';

class TermService extends BaseService<typeof terms, 'id'> {
  constructor() { super(new TermRepository(), { findAllRoles: ['dashboard'] }); }

  async getActive() {
    return withAuth(() => (this.repository as TermRepository).getActive(), ['all']);
  }
}

export const termsService = serviceWrapper(TermService, 'TermsService');
```

### Actions (`features/[feature]/server/actions.ts`)
```ts
'use server';
import type { terms } from '@/core/database';
import { termsService as service } from './service';

type Term = typeof terms.$inferInsert;

export async function getTerm(id: number) { return service.get(id); }
export async function findAllTerms(page = 1, search = '') {
  return service.findAll({ page, search, sort: [{ column: 'name', order: 'desc' }] });
}
export async function createTerm(term: Term) { return service.create(term); }
export async function updateTerm(id: number, term: Term) { return service.update(id, term); }
export async function deleteTerm(id: number) { return service.delete(id); }
```

### Index (`features/[feature]/index.ts`)
```ts
export { default as Form } from './components/Form';
export * from './server/actions';
export * from './types';
```

### Layout (`app/(module)/feature/layout.tsx`)
```tsx
'use client';
import { findAllTerms } from '@registry/terms';
import { ListItem, ListLayout, NewLink } from '@/shared/ui/adease';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <ListLayout
      path={'/registry/terms'}
      queryKey={['terms']}
      getData={findAllTerms}
      actionIcons={[<NewLink key={'new'} href='/registry/terms/new' />]}
      renderItem={(it) => <ListItem id={it.id} label={it.name} />}
    >{children}</ListLayout>
  );
}
```

### Page (`app/(module)/feature/page.tsx`)
```tsx
import { NothingSelected } from '@/shared/ui/adease';
export default function Page() { return <NothingSelected title='Terms' />; }
```

### New Page (`app/(module)/feature/new/page.tsx`)
```tsx
import { Box } from '@mantine/core';
import { createTerm, Form } from '@registry/terms';

export default async function NewPage() {
  return <Box p={'lg'}><Form title={'Create Term'} onSubmit={createTerm} /></Box>;
}
```

### Details Page (`app/(module)/feature/[id]/page.tsx`)
```tsx
import { deleteTerm, getTerm } from '@registry/terms';
import { notFound } from 'next/navigation';
import { DetailsView, DetailsViewBody, DetailsViewHeader, FieldView } from '@/shared/ui/adease';

export default async function TermDetails({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const term = await getTerm(Number(id));
  if (!term) return notFound();

  return (
    <DetailsView>
      <DetailsViewHeader title={'Term'} queryKey={['terms']} handleDelete={async () => { 'use server'; await deleteTerm(Number(id)); }} />
      <DetailsViewBody>
        <FieldView label='Name'>{term.name}</FieldView>
      </DetailsViewBody>
    </DetailsView>
  );
}
```

### Edit Page (`app/(module)/feature/[id]/edit/page.tsx`)
```tsx
import { Box } from '@mantine/core';
import { Form, getTerm, updateTerm } from '@registry/terms';
import { notFound } from 'next/navigation';

export default async function TermEdit({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const term = await getTerm(Number(id));
  if (!term) return notFound();

  return (
    <Box p={'lg'}>
      <Form title={'Edit Term'} defaultValues={term} onSubmit={async (value) => { 'use server'; return await updateTerm(Number(id), value); }} />
    </Box>
  );
}
```

### Form Component (`features/[feature]/components/Form.tsx`)
```tsx
'use client';
import { TextInput, Switch } from '@mantine/core';
import { createInsertSchema } from 'drizzle-zod';
import { useRouter } from 'nextjs-toploader/app';
import { terms } from '@/modules/academic/database';
import { Form } from '@/shared/ui/adease';

type Term = typeof terms.$inferInsert;

type Props = {
  onSubmit: (values: Term) => Promise<Term>;
  defaultValues?: Term;
  title?: string;
};

export default function TermForm({ onSubmit, defaultValues, title }: Props) {
  const router = useRouter();
  return (
    <Form title={title} action={onSubmit} queryKey={['terms']} schema={createInsertSchema(terms)} defaultValues={defaultValues} onSuccess={({ id }) => router.push(`/registry/terms/${id}`)}>
      {(form) => (
        <>
          <TextInput label='Name' {...form.getInputProps('name')} />
          <Switch label='Set as Active' {...form.getInputProps('isActive', { type: 'checkbox' })} />
        </>
      )}
    </Form>
  );
}
```

## Standards
- Use `function name() {}` for exports, never arrow functions at top level
- Derive types from Drizzle: `typeof table.$inferInsert`, `typeof table.$inferSelect`
- Use TanStack Query for all data fetching (no `useEffect`)
- Dashboard features need `NavItem` in `module-name.config.ts` and inclusion in `src/app/dashboard/dashboard.tsx`
- Component order: Props type → constants → default export → private components
- **Always run**: `pnpm tsc --noEmit & pnpm lint:fix` (iterate until clean)
