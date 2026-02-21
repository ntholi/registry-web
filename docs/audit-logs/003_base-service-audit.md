# Step 003: BaseService Audit Integration

## Introduction

With `BaseRepository` now supporting `AuditOptions`, this step modifies `BaseService` to automatically pass `session.user.id` to repository methods. This ensures that every write going through the standard service layer is audited with user attribution — zero per-feature code needed.

## Requirements

### 1. Import AuditOptions

Add to `BaseService.ts`:

```typescript
import type { AuditOptions } from './BaseRepository';
```

### 2. Modify Write Methods

#### `create(data)`

```typescript
async create(data: ModelInsert<T>) {
  const roles = this.createRoles() as Role[] | AccessCheckFunction;
  return withAuth(async (session) => {
    const audit = this.buildAuditOptions(session);
    return this.repository.create(data, audit);
  }, roles as Role[]);
}
```

#### `update(id, data)`

```typescript
async update(id: ModelSelect<T>[PK], data: Partial<ModelInsert<T>>) {
  const roles = this.updateRoles() as Role[] | AccessCheckFunction;
  return withAuth(async (session) => {
    const audit = this.buildAuditOptions(session);
    return this.repository.update(id, data, audit);
  }, roles as Role[]);
}
```

#### `delete(id)`

```typescript
async delete(id: ModelSelect<T>[PK]) {
  const roles = this.deleteRoles() as Role[] | AccessCheckFunction;
  return withAuth(async (session) => {
    const audit = this.buildAuditOptions(session);
    return this.repository.delete(id, audit);
  }, roles as Role[]);
}
```

### 3. New Protected Method: `buildAuditOptions()`

Subclasses can override to add custom metadata:

```typescript
protected buildAuditOptions(session?: Session | null): AuditOptions | undefined {
  if (!session?.user?.id) return undefined;
  return { userId: session.user.id };
}
```

### 4. Custom Metadata in Service Subclasses

Services that need entity-specific metadata (e.g., `reasons`) create custom methods:

```typescript
class StudentModuleService extends BaseService<typeof studentModules, 'id'> {
  async updateWithReason(
    id: number,
    data: Partial<typeof studentModules.$inferInsert>,
    reasons: string
  ) {
    const roles = this.updateRoles() as Role[] | AccessCheckFunction;
    return withAuth(async (session) => {
      return this.repository.update(id, data, {
        userId: session!.user.id,
        metadata: { reasons },
      });
    }, roles as Role[]);
  }
}
```

### 5. Reasons Flow: UI → Action → Service → Repository

The edit modals for students, student programs, student semesters, and student modules collect a `reasons` text field. Here's the full flow for passing reasons through to audit metadata:

**Action signature:**
```typescript
async function updateStudent(stdNo: number, data: Partial<typeof students.$inferInsert>, reasons: string) {
  return service.updateWithReasons(stdNo, data, reasons);
}
```

**Service method:**
```typescript
class StudentService extends BaseService<typeof students, 'stdNo'> {
  async updateWithReasons(
    stdNo: number,
    data: Partial<typeof students.$inferInsert>,
    reasons: string
  ) {
    const roles = this.updateRoles() as Role[] | AccessCheckFunction;
    return withAuth(async (session) => {
      return this.repository.update(stdNo, data, {
        userId: session!.user.id,
        metadata: { reasons },
      });
    }, roles as Role[]);
  }
}
```

**This pattern applies to ALL entities with reasons:**

| Entity | Action | Service Method |
|--------|--------|----------------|
| Student | `updateStudent(stdNo, data, reasons)` | `studentService.updateWithReasons(stdNo, data, reasons)` |
| Student Program | `updateStudentProgram(id, data, reasons)` | `studentProgramService.updateWithReasons(id, data, reasons)` |
| Student Program | `createStudentProgram(data, reasons?)` | `studentProgramService.createWithReasons(data, reasons)` |
| Student Semester | `updateStudentSemester(id, data, reasons)` | `studentSemesterService.updateWithReasons(id, data, reasons)` |
| Student Module | `updateStudentModule(id, data, reasons)` | `studentModuleService.updateWithReasons(id, data, reasons)` |

> **Key**: The `reasons` parameter is a first-class parameter on the action (not hidden in a generic object). The action calls a dedicated service method that constructs the `AuditOptions` with `metadata: { reasons }`. This keeps the API clean and type-safe.

### 6. Custom Overrides: Threading AuditOptions to Repositories with Custom Signatures

Repositories that override `create`/`update`/`delete` with different signatures (like `AssessmentRepository.create(data, lmsData?)`) do NOT receive audit options through the standard `BaseService.create()` call. Instead, their **service subclasses** must pass `AuditOptions` explicitly:

```typescript
class AssessmentService extends BaseService<typeof assessments, 'id'> {
  async create(
    data: typeof assessments.$inferInsert,
    lmsData?: Omit<typeof lmsAssessments.$inferInsert, 'assessmentId'>
  ) {
    const roles = this.createRoles() as Role[] | AccessCheckFunction;
    return withAuth(async (session) => {
      const audit = this.buildAuditOptions(session);
      return (this.repository as AssessmentRepository).create(data, lmsData, audit);
    }, roles as Role[]);
  }
}
```

The corresponding repository method signature becomes:
```typescript
override async create(
  data: typeof assessments.$inferInsert,
  lmsData?: ...,
  audit?: AuditOptions
) { ... }
```

This pattern applies to:
- `AssessmentService` → `AssessmentRepository.create(data, lmsData?, audit?)`
- `AssessmentService` → `AssessmentRepository.updateWithGradeRecalculation(id, data, lmsData?, audit?)`
- `ClearanceService` → `ClearanceRepository.create(data, audit?)`
- `ClearanceService` → `ClearanceRepository.update(id, data, audit?)`
- `AssessmentMarksService` → `AssessmentMarkRepository.createOrUpdateMarks(data, audit?)`
- `AssessmentMarksService` → `AssessmentMarkRepository.createOrUpdateMarksInBulk(dataArray, batchSize?, audit?)`

### 7. Read-Only Methods — No Changes

These methods are NOT modified (no audit needed for reads):

- `get(id)` — read by ID
- `findAll(params)` — paginated query
- `getAll()` — full list
- `first()` — first record
- `count()` — count

## Full Modified BaseService

```typescript
import type { PgTable as Table } from 'drizzle-orm/pg-core';
import type { Session } from 'next-auth';
import type { UserRole } from '@/core/database';
import type BaseRepository from './BaseRepository';
import type { AuditOptions, QueryOptions } from './BaseRepository';
import withAuth from './withAuth';

type ModelInsert<T extends Table> = T['$inferInsert'];
type ModelSelect<T extends Table> = T['$inferSelect'];

type Role = UserRole | 'all' | 'auth' | 'dashboard';
type AccessCheckFunction = (session: Session) => Promise<boolean>;
type AuthConfig = Role[] | AccessCheckFunction;

interface BaseServiceConfig {
  byIdRoles?: AuthConfig;
  findAllRoles?: AuthConfig;
  createRoles?: AuthConfig;
  updateRoles?: AuthConfig;
  deleteRoles?: AuthConfig;
  countRoles?: AuthConfig;
}

abstract class BaseService<
  T extends Table,
  PK extends keyof T & keyof ModelSelect<T>,
> {
  private defaultByIdRoles: AuthConfig;
  private defaultFindAllRoles: AuthConfig;
  private defaultCreateRoles: AuthConfig;
  private defaultUpdateRoles: AuthConfig;
  private defaultDeleteRoles: AuthConfig;
  private defaultCountRoles: AuthConfig;

  constructor(
    protected readonly repository: BaseRepository<T, PK>,
    config: BaseServiceConfig = {}
  ) {
    this.defaultByIdRoles = config.byIdRoles ?? ['dashboard'];
    this.defaultFindAllRoles = config.findAllRoles ?? ['dashboard'];
    this.defaultCreateRoles = config.createRoles ?? [];
    this.defaultUpdateRoles = config.updateRoles ?? [];
    this.defaultDeleteRoles = config.deleteRoles ?? [];
    this.defaultCountRoles = config.countRoles ?? [];
  }

  // --- Role accessors (unchanged) ---
  protected byIdRoles(): AuthConfig { return this.defaultByIdRoles; }
  protected findAllRoles(): AuthConfig { return this.defaultFindAllRoles; }
  protected createRoles(): AuthConfig { return this.defaultCreateRoles; }
  protected updateRoles(): AuthConfig { return this.defaultUpdateRoles; }
  protected deleteRoles(): AuthConfig { return this.defaultDeleteRoles; }
  protected countRoles(): AuthConfig { return this.defaultCountRoles; }

  // --- Audit options builder (overridable) ---
  protected buildAuditOptions(session?: Session | null): AuditOptions | undefined {
    if (!session?.user?.id) return undefined;
    return { userId: session.user.id };
  }

  // --- Read methods (unchanged) ---
  async get(id: ModelSelect<T>[PK]) {
    const roles = this.byIdRoles() as Role[] | AccessCheckFunction;
    return withAuth(async () => this.repository.findById(id), roles as Role[]);
  }

  async findAll(params: QueryOptions<T>) {
    const roles = this.findAllRoles() as Role[] | AccessCheckFunction;
    return withAuth(async () => this.repository.query(params), roles as Role[]);
  }

  async getAll() {
    const roles = this.findAllRoles() as Role[] | AccessCheckFunction;
    return withAuth(async () => this.repository.findAll(), roles as Role[]);
  }

  async first() {
    const roles = this.byIdRoles() as Role[] | AccessCheckFunction;
    return withAuth(async () => this.repository.findFirst(), roles as Role[]);
  }

  async count() {
    const roles = this.countRoles() as Role[] | AccessCheckFunction;
    return withAuth(async () => this.repository.count(), roles as Role[]);
  }

  // --- Write methods (now with audit) ---
  async create(data: ModelInsert<T>) {
    const roles = this.createRoles() as Role[] | AccessCheckFunction;
    return withAuth(async (session) => {
      const audit = this.buildAuditOptions(session);
      return this.repository.create(data, audit);
    }, roles as Role[]);
  }

  async update(id: ModelSelect<T>[PK], data: Partial<ModelInsert<T>>) {
    const roles = this.updateRoles() as Role[] | AccessCheckFunction;
    return withAuth(async (session) => {
      const audit = this.buildAuditOptions(session);
      return this.repository.update(id, data, audit);
    }, roles as Role[]);
  }

  async delete(id: ModelSelect<T>[PK]) {
    const roles = this.deleteRoles() as Role[] | AccessCheckFunction;
    return withAuth(async (session) => {
      const audit = this.buildAuditOptions(session);
      return this.repository.delete(id, audit);
    }, roles as Role[]);
  }
}

export default BaseService;
```

## Impact Analysis

### What Changes

| Component | Change |
|-----------|--------|
| `BaseService.create` | Now passes `{ userId }` to `repository.create` |
| `BaseService.update` | Now passes `{ userId }` to `repository.update` |
| `BaseService.delete` | Now passes `{ userId }` to `repository.delete` |
| `BaseService.buildAuditOptions` | New overridable method |

### What Does NOT Change

| Component | Reason |
|-----------|--------|
| All read methods | No audit for reads |
| `BaseServiceConfig` | No new config properties |
| All existing subclasses | `buildAuditOptions` has a default implementation |
| All existing server actions | They call service methods — automatically get audit |
| `withAuth` | No modifications needed |
| `serviceWrapper` | No modifications needed |

### What About `createMany`?

`BaseService` does NOT currently expose a `createMany` method. Repositories that use `createMany` do so via direct repository calls in custom service methods. These custom methods need to be updated individually to pass `AuditOptions` — see Step 006 (Cleanup).

If a `createMany` is added to `BaseService` in the future, it should follow the same pattern:

```typescript
async createMany(data: ModelInsert<T>[]) {
  const roles = this.createRoles() as Role[] | AccessCheckFunction;
  return withAuth(async (session) => {
    const audit = this.buildAuditOptions(session);
    return this.repository.createMany(data, audit);
  }, roles as Role[]);
}
```

### Automatic Coverage

After this step, every service extending `BaseService` that uses the standard `create`/`update`/`delete` methods will automatically audit with user attribution. No per-feature code changes needed.

Services with **custom write methods** (e.g., `updateStudentWithAudit`, `bulkUpdateMarks`) need to be updated individually to pass `AuditOptions` — this is done in Step 006 (Cleanup).

## Validation Criteria

1. `BaseService.create` passes audit options to repository
2. `BaseService.update` passes audit options to repository
3. `BaseService.delete` passes audit options to repository
4. `buildAuditOptions` returns `undefined` when no session (system operations)
5. Subclasses can override `buildAuditOptions` to add custom metadata
6. All read methods remain unchanged
7. `pnpm tsc --noEmit` passes

## Notes

- The `session` parameter in `withAuth`'s callback can be `null` for `'all'` role — `buildAuditOptions` handles this gracefully
- Custom service methods (like `updateWithReason`) bypass `buildAuditOptions` and pass metadata directly — this is intentional for flexibility
- `BaseService` does NOT need to know about `auditEnabled` — that's the repository's concern. If a repository has `auditEnabled = false`, passing audit options is a no-op
