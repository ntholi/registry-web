# Duplicate Code Analysis Report

**Date**: 2026-01-06
**Repository**: registry-web
**Total TypeScript Files**: 811

## Executive Summary

This report identifies duplicate code patterns across the registry-web codebase. The application follows a modular monolith architecture with clear separation between features, but there are significant opportunities for code consolidation and reuse. The duplications fall into 6 major categories affecting both server-side and client-side code.

## Overview of Duplications Found

### Statistics
- **Server Actions Files**: 30+ files with duplicate CRUD patterns
- **Service Classes**: 20+ files with similar authentication wrappers
- **Repository Classes**: 26+ files with identical constructor patterns
- **Page Components**: 
  - New pages: 15 files with nearly identical structure
  - Edit pages: 16 files with nearly identical structure
  - Detail pages: 67 files with similar patterns
- **Layout Components**: 17 files using ListLayout with similar patterns
- **Form Components**: 14+ custom form components

---

## Category 1: Server Actions Duplication

### 1.1 Standard CRUD Actions Pattern

**Duplicate Count**: ~30 action files follow this exact pattern

**Pattern Found**:
```typescript
'use server';

export async function getEntity(id: number) {
  return service.get(id);
}

export async function findAllEntities(page = 1, search = '') {
  return service.findAll({ page, search, searchColumns: ['name'] });
}

export async function getAllEntities() {
  return service.getAll();
}

export async function createEntity(entity: Entity) {
  return service.create(entity);
}

export async function updateEntity(id: number, entity: Entity) {
  return service.update(id, entity);
}

export async function deleteEntity(id: number) {
  return service.delete(id);
}
```

**Examples**:
- `src/modules/academic/features/modules/server/actions.ts`
- `src/modules/timetable/features/venue-types/server/actions.ts`
- `src/modules/registry/features/terms/server/actions.ts`
- `src/modules/academic/features/assessments/server/actions.ts`
- `src/modules/finance/features/sponsors/server/actions.ts` (partial)

**Issue**: Each feature implements the same 5-6 CRUD operations as thin wrappers around service methods.

### 1.2 Variations in Naming

**Issue**: Inconsistent naming conventions across features:
- Some use `findAll` vs `getAll`
- Parameter naming varies (`page`, `search` vs other combinations)
- Some return paginated results, others return arrays

**Examples**:
- `findAllSchools()` vs `getAllSchools()` in the same file
- `getModules()` vs `findAllModules()`

---

## Category 2: Service Class Duplication

### 2.1 BaseService Extension Pattern

**Duplicate Count**: 20+ service files

**Pattern Found**:
```typescript
class EntityService extends BaseService<typeof entities, 'id'> {
  constructor() {
    super(new EntityRepository(), {
      byIdRoles: ['dashboard'],
      findAllRoles: ['dashboard'],
      createRoles: ['registry'],
      updateRoles: ['registry'],
      deleteRoles: ['registry'],
    });
  }
}

export const entityService = serviceWrapper(EntityService, 'EntityService');
```

**Examples**:
- `src/modules/academic/features/modules/server/service.ts`
- `src/modules/academic/features/assessments/server/service.ts`
- `src/modules/timetable/features/venues/server/service.ts`
- `src/modules/registry/features/terms/server/service.ts`
- `src/modules/timetable/features/venue-types/server/service.ts`

**Issue**: 
- Each service extends BaseService with nearly identical configuration
- Most services only override constructor to set roles
- 15+ files have services with ONLY a constructor (no custom methods)

### 2.2 withAuth Wrapper Repetition

**Pattern Found**:
```typescript
async getCustomMethod(id: number) {
  return withAuth(
    async () => (this.repository as CustomRepository).customMethod(id),
    ['dashboard']
  );
}
```

**Examples**:
- Found in 10+ service files
- Each service method wraps repository calls with withAuth
- Same pattern repeated for each custom method

**Issue**: Repetitive withAuth wrapping code that could be abstracted

---

## Category 3: Repository Class Duplication

### 3.1 Constructor Boilerplate

**Duplicate Count**: 26+ repository files

**Pattern Found**:
```typescript
export default class EntityRepository extends BaseRepository<
  typeof entities,
  'id'
> {
  constructor() {
    super(entities, entities.id);
  }
}

export const entityRepository = new EntityRepository();
```

**Examples**:
- `src/modules/academic/features/schools/server/repository.ts`
- `src/modules/academic/features/assessments/server/repository.ts`
- `src/modules/timetable/features/venues/server/repository.ts`
- `src/modules/timetable/features/venue-types/server/repository.ts`
- All 26+ repositories follow this exact pattern

**Issue**: 
- Identical constructor implementation across all repositories
- Always follows pattern: `super(table, table.id)`
- Export pattern is always the same

### 3.2 Query Pattern Duplication

**Pattern Found**:
```typescript
async getByEntityId(entityId: number) {
  return db.query.tableName.findMany({
    where: eq(tableName.entityId, entityId),
    orderBy: desc(tableName.id),
  });
}
```

**Issue**: Similar query patterns repeated across multiple repositories

---

## Category 4: Page Component Duplication

### 4.1 New Page Pattern

**Duplicate Count**: 15+ new page files

**Pattern Found**:
```typescript
import { createEntity, Form } from '@module/feature';
import { Box } from '@mantine/core';

export default async function NewPage() {
  return (
    <Box p={'lg'}>
      <Form title={'Create Entity'} onSubmit={createEntity} />
    </Box>
  );
}
```

**Examples**:
- `src/app/academic/modules/new/page.tsx`
- `src/app/registry/terms/new/page.tsx`
- `src/app/admin/users/new/page.tsx`
- `src/app/admin/tasks/new/page.tsx`
- `src/app/timetable/venue-types/new/page.tsx`
- 10+ more similar files

**Issue**: 
- Identical structure across all new pages
- Only differences are: entity name, import path, and title text
- Box padding has minor variations (`p={'lg'}` vs `p='lg'`)

### 4.2 Edit Page Pattern

**Duplicate Count**: 16+ edit page files

**Pattern Found**:
```typescript
import { Form, getEntity, updateEntity } from '@module/feature';
import { Box } from '@mantine/core';
import { notFound } from 'next/navigation';

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
    <Box p={'lg'}>
      <Form
        title={'Edit Entity'}
        defaultValues={entity}
        onSubmit={async (value) => {
          'use server';
          return await updateEntity(Number(id), value);
        }}
      />
    </Box>
  );
}
```

**Examples**:
- `src/app/academic/modules/[id]/edit/page.tsx`
- `src/app/registry/terms/[id]/edit/page.tsx`
- `src/app/admin/users/[id]/edit/page.tsx`
- `src/app/timetable/venues/[id]/edit/page.tsx`
- 12+ more similar files

**Issue**:
- Nearly identical structure across all edit pages
- All include same notFound() pattern
- All use inline 'use server' for onSubmit
- 40+ occurrences of notFound() pattern

### 4.3 Detail Page Pattern

**Duplicate Count**: Multiple detail pages (67 total page files)

**Pattern Found**:
```typescript
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
        title={'Entity'}
        queryKey={['entities']}
        handleDelete={async () => {
          'use server';
          await deleteEntity(Number(id));
        }}
      />
      <DetailsViewBody>
        <FieldView label='Field'>{entity.field}</FieldView>
        {/* More FieldViews */}
      </DetailsViewBody>
    </DetailsView>
  );
}
```

**Examples**:
- `src/app/academic/modules/[id]/page.tsx`
- `src/app/registry/terms/[id]/page.tsx`
- `src/app/timetable/venues/[id]/page.tsx`

**Issue**:
- Same structure: params unwrapping, data fetching, notFound check
- Same DetailsView/DetailsViewHeader/DetailsViewBody structure
- Inline 'use server' for delete handlers (30+ occurrences)

---

## Category 5: Layout Component Duplication

### 5.1 ListLayout Pattern

**Duplicate Count**: 17+ layout files

**Pattern Found**:
```typescript
'use client';

import { findAllEntities } from '@module/feature';
import type { PropsWithChildren } from 'react';
import { ListItem, ListLayout, NewLink } from '@/shared/ui/adease';

export default function Layout({ children }: PropsWithChildren) {
  return (
    <ListLayout
      path={'/module/feature'}
      queryKey={['entities']}
      getData={findAllEntities}
      actionIcons={[<NewLink key={'new-link'} href='/module/feature/new' />]}
      renderItem={(it) => (
        <ListItem id={it.id} label={it.name} />
      )}
    >
      {children}
    </ListLayout>
  );
}
```

**Examples**:
- `src/app/academic/modules/layout.tsx`
- `src/app/registry/terms/layout.tsx`
- `src/app/timetable/venues/layout.tsx`
- `src/app/admin/users/layout.tsx`
- 13+ more similar files

**Issue**:
- Identical structure with only different paths and entity names
- All use same NewLink pattern
- Minor variations in renderItem implementation
- queryKey always follows kebab-case pattern matching path

---

## Category 6: Form Component Duplication

### 6.1 Form Structure Pattern

**Duplicate Count**: 14+ form components

**Pattern Found**:
```typescript
'use client';

import { TextInput } from '@mantine/core';
import { createInsertSchema } from 'drizzle-zod';
import { useRouter } from 'nextjs-toploader/app';
import { entities } from '@/modules/module/database';
import { Form } from '@/shared/ui/adease';

type Entity = typeof entities.$inferInsert;

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
      schema={createInsertSchema(entities)}
      defaultValues={defaultValues}
      onSuccess={({ id }) => {
        router.push(`/module/feature/${id}`);
      }}
    >
      {(form) => (
        <>
          <TextInput label='Field' {...form.getInputProps('field')} />
          {/* More inputs */}
        </>
      )}
    </Form>
  );
}
```

**Examples**:
- `src/modules/academic/features/modules/components/Form.tsx`
- `src/modules/registry/features/terms/components/Form.tsx`
- `src/modules/timetable/features/venues/components/Form.tsx`
- 11+ more similar files

**Issue**:
- Identical TypeScript types (Entity, Props)
- Same router.push pattern in onSuccess
- Same Form wrapper structure with schema validation
- Only input fields differ

---

## Detailed TODO List for Refactoring

### Priority 1: Server-Side Abstraction (High Impact)

#### TODO 1.1: Create Action Generator Utility
**File**: `src/core/platform/createActions.ts`

**Task**:
- [ ] Create a utility function that generates standard CRUD actions
- [ ] Input: service instance, entity name, configuration options
- [ ] Output: object with get, findAll, getAll, create, update, delete functions
- [ ] Support optional custom actions via extension
- [ ] Handle naming conventions (findAll vs getAll) with configuration

**Implementation Approach**:
```typescript
// Create utility that generates actions like:
export function createStandardActions<T>(config: {
  service: BaseService<T, any>;
  entityName: string;
  searchColumns?: string[];
  includeGetAll?: boolean;
}) {
  return {
    [`get${config.entityName}`]: async (id) => service.get(id),
    [`findAll${config.entityName}s`]: async (page, search) => 
      service.findAll({ page, search, searchColumns: config.searchColumns }),
    // ... etc
  };
}
```

**Files to Update**:
- `src/modules/academic/features/modules/server/actions.ts`
- `src/modules/academic/features/assessments/server/actions.ts`
- `src/modules/timetable/features/venue-types/server/actions.ts`
- `src/modules/registry/features/terms/server/actions.ts`
- 26+ more action files with standard CRUD patterns

**Expected Reduction**: ~200-300 lines of code across all action files

#### TODO 1.2: Simplify Service Class Creation
**File**: `src/core/platform/createService.ts`

**Task**:
- [ ] Create a factory function for simple services that only need role configuration
- [ ] Eliminate need for class definition when no custom methods exist
- [ ] Keep class-based approach for services with custom methods
- [ ] Update serviceWrapper to work with factory output

**Implementation Approach**:
```typescript
// For simple services with just roles:
export const entityService = createSimpleService({
  repository: new EntityRepository(),
  roles: {
    byId: ['dashboard'],
    findAll: ['dashboard'],
    create: ['registry'],
    update: ['registry'],
    delete: ['registry'],
  },
  name: 'EntityService'
});
```

**Files to Update**:
- 15+ service files that only have constructors with role definitions
- Examples:
  - `src/modules/academic/features/modules/server/service.ts`
  - `src/modules/timetable/features/venue-types/server/service.ts`

**Expected Reduction**: ~150-200 lines of boilerplate service code

#### TODO 1.3: Eliminate Repository Constructor Boilerplate
**File**: `src/core/platform/BaseRepository.ts`

**Task**:
- [ ] Create a factory function that eliminates need for constructor
- [ ] Auto-detect primary key from table schema if it's `id`
- [ ] Support custom primary key via parameter
- [ ] Update all repositories to use factory

**Implementation Approach**:
```typescript
// Instead of class with constructor:
export const entityRepository = createRepository(entities);
// or with custom PK:
export const studentRepository = createRepository(students, 'stdNo');
```

**Files to Update**:
- All 26+ repository files
- Examples:
  - `src/modules/academic/features/schools/server/repository.ts`
  - `src/modules/academic/features/assessments/server/repository.ts`
  - `src/modules/timetable/features/venues/server/repository.ts`

**Expected Reduction**: ~100-150 lines of constructor boilerplate

---

### Priority 2: Page Component Abstraction (High Impact)

#### TODO 2.1: Create Standard New Page Component
**File**: `src/shared/ui/pages/StandardNewPage.tsx`

**Task**:
- [ ] Create reusable component that handles all new page logic
- [ ] Accept form component, title, and submit action as props
- [ ] Standardize Box padding to single style
- [ ] Update all new pages to use this component

**Implementation Approach**:
```typescript
// Create:
export function StandardNewPage<T>({ 
  Form, 
  title, 
  onSubmit 
}: StandardNewPageProps<T>) {
  return (
    <Box p="lg">
      <Form title={title} onSubmit={onSubmit} />
    </Box>
  );
}

// Usage:
export default function NewPage() {
  return <StandardNewPage 
    Form={EntityForm} 
    title="Create Entity" 
    onSubmit={createEntity} 
  />;
}
```

**Files to Update**:
- `src/app/academic/modules/new/page.tsx`
- `src/app/registry/terms/new/page.tsx`
- `src/app/admin/users/new/page.tsx`
- 12+ more new page files

**Expected Reduction**: ~50-75 lines of duplicate page code

#### TODO 2.2: Create Standard Edit Page Component
**File**: `src/shared/ui/pages/StandardEditPage.tsx`

**Task**:
- [ ] Create reusable component for edit pages
- [ ] Handle params unwrapping, data fetching, notFound check
- [ ] Accept form component, get/update actions, and title
- [ ] Standardize inline 'use server' pattern
- [ ] Update all edit pages to use this component

**Implementation Approach**:
```typescript
// Create:
export function StandardEditPage<T>({
  Form,
  getEntity,
  updateEntity,
  title,
  parseId = Number,
}: StandardEditPageProps<T>) {
  return async function EditPage({ params }) {
    const { id } = await params;
    const entity = await getEntity(parseId(id));
    if (!entity) return notFound();
    
    return (
      <Box p="lg">
        <Form
          title={title}
          defaultValues={entity}
          onSubmit={async (value) => {
            'use server';
            return await updateEntity(parseId(id), value);
          }}
        />
      </Box>
    );
  };
}
```

**Files to Update**:
- `src/app/academic/modules/[id]/edit/page.tsx`
- `src/app/registry/terms/[id]/edit/page.tsx`
- `src/app/admin/users/[id]/edit/page.tsx`
- 13+ more edit page files

**Expected Reduction**: ~200-250 lines of duplicate edit page code

#### TODO 2.3: Create Standard Detail Page Component
**File**: `src/shared/ui/pages/StandardDetailPage.tsx`

**Task**:
- [ ] Create reusable component for detail/view pages
- [ ] Handle params unwrapping, data fetching, notFound check
- [ ] Standardize DetailsView structure
- [ ] Accept render function for custom fields
- [ ] Handle delete action inline pattern

**Implementation Approach**:
```typescript
// Create:
export function StandardDetailPage<T>({
  getEntity,
  deleteEntity,
  title,
  queryKey,
  renderFields,
  parseId = Number,
}: StandardDetailPageProps<T>) {
  return async function DetailPage({ params }) {
    const { id } = await params;
    const entity = await getEntity(parseId(id));
    if (!entity) return notFound();
    
    return (
      <DetailsView>
        <DetailsViewHeader
          title={title}
          queryKey={queryKey}
          handleDelete={async () => {
            'use server';
            await deleteEntity(parseId(id));
          }}
        />
        <DetailsViewBody>
          {renderFields(entity)}
        </DetailsViewBody>
      </DetailsView>
    );
  };
}
```

**Files to Update**:
- Multiple detail page files across modules
- Examples:
  - `src/app/academic/modules/[id]/page.tsx`
  - `src/app/registry/terms/[id]/page.tsx`
  - `src/app/timetable/venues/[id]/page.tsx`

**Expected Reduction**: ~300-400 lines of duplicate detail page code

---

### Priority 3: Layout Component Abstraction (Medium Impact)

#### TODO 3.1: Create Standard List Layout Component
**File**: `src/shared/ui/layouts/StandardListLayout.tsx`

**Task**:
- [ ] Create wrapper that simplifies ListLayout usage
- [ ] Auto-generate paths and query keys from route
- [ ] Standardize NewLink pattern
- [ ] Provide sensible defaults for common patterns

**Implementation Approach**:
```typescript
// Create:
export function StandardListLayout<T>({
  basePath,
  getData,
  renderItem,
  children,
}: StandardListLayoutProps<T>) {
  const queryKey = [basePath.split('/').pop()]; // auto-generate
  
  return (
    <ListLayout
      path={basePath}
      queryKey={queryKey}
      getData={getData}
      actionIcons={[<NewLink key="new-link" href={`${basePath}/new`} />]}
      renderItem={renderItem}
    >
      {children}
    </ListLayout>
  );
}
```

**Files to Update**:
- `src/app/academic/modules/layout.tsx`
- `src/app/registry/terms/layout.tsx`
- `src/app/timetable/venues/layout.tsx`
- 14+ more layout files

**Expected Reduction**: ~50-80 lines of duplicate layout code

---

### Priority 4: Form Component Abstraction (Medium Impact)

#### TODO 4.1: Create Form Component Generator
**File**: `src/shared/ui/forms/createStandardForm.tsx`

**Task**:
- [ ] Create utility that generates form components
- [ ] Handle common patterns (schema, router, types)
- [ ] Reduce boilerplate in form prop types
- [ ] Keep flexibility for custom form logic

**Implementation Approach**:
```typescript
// Create:
export function createStandardForm<T>(config: {
  schema: ZodSchema;
  entityPath: string;
  renderFields: (form: FormInstance) => ReactNode;
}) {
  return function StandardForm({ onSubmit, defaultValues, title }) {
    const router = useRouter();
    
    return (
      <Form
        title={title}
        action={onSubmit}
        queryKey={[config.entityPath.split('/').pop()]}
        schema={config.schema}
        defaultValues={defaultValues}
        onSuccess={({ id }) => router.push(`${config.entityPath}/${id}`)}
      >
        {config.renderFields}
      </Form>
    );
  };
}
```

**Files to Consider** (may vary in implementation):
- `src/modules/academic/features/modules/components/Form.tsx`
- `src/modules/registry/features/terms/components/Form.tsx`
- Some forms have complex logic that may not fit this pattern

**Expected Reduction**: ~50-100 lines across simpler form components

---

### Priority 5: Code Organization and Consistency (Low Impact, High Value)

#### TODO 5.1: Standardize Action Naming Conventions
**Files**: All action files

**Task**:
- [ ] Decide on single convention: `findAll` vs `getAll`
- [ ] Create naming convention guide
- [ ] Update all action files to follow convention
- [ ] Consider: `findAll` for paginated, `getAll` for complete list
- [ ] Update all imports across the application

**Approach**:
- Use search/replace with careful testing
- Update documentation in CLAUDE.md

**Files to Update**:
- 30+ action files
- 100+ import statements across pages and components

#### TODO 5.2: Standardize Inline 'use server' Pattern
**Files**: All page files with inline server actions

**Task**:
- [ ] Document when to use inline 'use server' vs separate actions file
- [ ] Consider extracting frequently used patterns
- [ ] Standardize formatting (30+ occurrences found)

**Current Usage**:
- Edit pages: inline server action for update
- Detail pages: inline server action for delete
- Some new pages: inline server action for complex create logic

**Recommendation**:
- Keep inline 'use server' for page-specific logic
- Extract to actions.ts for reusable operations

#### TODO 5.3: Create Code Generation Templates
**Files**: New documentation

**Task**:
- [ ] Create templates for common patterns in docs
- [ ] Add CLI tool or snippets for generating new features
- [ ] Include templates for:
  - New CRUD feature (actions, service, repository, pages)
  - New form component
  - New list layout
- [ ] Reduce manual duplication in future development

---

## Summary of Expected Impact

### Code Reduction Estimates

| Category | Current LOC | After Refactor | Reduction |
|----------|-------------|----------------|-----------|
| Actions | ~1500 | ~600 | 60% |
| Services | ~800 | ~400 | 50% |
| Repositories | ~500 | ~250 | 50% |
| New Pages | ~300 | ~100 | 67% |
| Edit Pages | ~500 | ~200 | 60% |
| Detail Pages | ~800 | ~400 | 50% |
| Layouts | ~400 | ~250 | 38% |
| Forms | ~600 | ~450 | 25% |
| **TOTAL** | **~5400** | **~2650** | **51%** |

### Benefits

1. **Maintainability**: Changes to patterns need updates in fewer places
2. **Consistency**: Enforces consistent patterns across the codebase
3. **Developer Experience**: Easier onboarding, less boilerplate to write
4. **Testing**: Centralized utilities are easier to test thoroughly
5. **Bug Reduction**: Fixes in shared code benefit all features
6. **Performance**: No performance impact (same runtime behavior)

### Risks and Considerations

1. **Migration Effort**: Large refactoring requires careful testing
2. **Breaking Changes**: May need to update many files simultaneously
3. **Learning Curve**: Team needs to learn new abstractions
4. **Over-Abstraction**: Balance between DRY and readability
5. **Type Safety**: Ensure TypeScript types remain strong through abstractions

### Implementation Strategy

1. **Phase 1** (Week 1-2): 
   - Implement Priority 1 (Server-side abstractions)
   - Test thoroughly with existing features
   
2. **Phase 2** (Week 3-4):
   - Implement Priority 2 (Page components)
   - Migrate 2-3 features as proof of concept
   
3. **Phase 3** (Week 5-6):
   - Complete remaining migrations
   - Implement Priority 3 (Layouts)
   
4. **Phase 4** (Week 7-8):
   - Implement Priority 4 (Forms)
   - Standardize naming (Priority 5.1)
   - Create templates (Priority 5.3)

5. **Phase 5** (Ongoing):
   - Monitor for new patterns
   - Update documentation
   - Train team on new patterns

---

## Architectural Recommendations

### 1. Maintain Current Architecture
- **Keep**: Modular monolith structure
- **Keep**: Feature-based organization
- **Keep**: Clear separation of concerns (actions/services/repositories)
- **Enhance**: Add shared utilities without changing core architecture

### 2. Follow DRY Principle Selectively
- **Do Abstract**: Pure boilerplate (constructors, wrappers)
- **Do Abstract**: Repetitive patterns (CRUD operations)
- **Don't Abstract**: Business logic variations
- **Don't Abstract**: Feature-specific behavior

### 3. Documentation Updates Needed
- Update CLAUDE.md with new utility usage
- Add examples of using new abstractions
- Document when to use abstractions vs custom code
- Create migration guide for existing features

---

## Conclusion

The registry-web codebase has significant duplication primarily in infrastructure code (actions, services, repositories) and presentation layer (pages, layouts). This duplication is systematic and follows predictable patterns, making it an ideal candidate for abstraction.

The recommended refactoring will reduce codebase size by ~50% in affected areas while maintaining the same functionality. The abstractions are straightforward and align with the existing architecture, minimizing risk.

**Recommended Action**: Proceed with phased implementation starting with Priority 1 server-side abstractions, as they have the highest impact and lowest risk.
