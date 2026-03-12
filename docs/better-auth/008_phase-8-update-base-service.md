# Phase 8: Update BaseService

> Estimated Implementation Time: 1 to 1.5 hours

**Prerequisites**: Phase 7 complete. Read `000_overview.md` first.

This phase updates `BaseService` to use the new authorization model from `withPermission`. Individual service files are migrated in Phases 9–13.

## 8.1 Update `BaseService`

File: `src/core/platform/BaseService.ts`

### Type Changes

**Before:**
```ts
import { type Session } from 'next-auth';

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
```

**After:**
```ts
import { type Session } from '@/core/auth';
import { type AuthRequirement } from '@/core/auth/permissions';

type AccessCheckFunction = (session: Session) => Promise<boolean>;
type AuthConfig = AuthRequirement | AccessCheckFunction;

interface BaseServiceConfig {
  byIdAuth?: AuthConfig;
  findAllAuth?: AuthConfig;
  createAuth?: AuthConfig;
  updateAuth?: AuthConfig;
  deleteAuth?: AuthConfig;
  countAuth?: AuthConfig;
  activityTypes?: { create?: string; update?: string; delete?: string };
}
```

### Method Changes

Replace `withAuth` calls with `withPermission`:

```ts
async get(id: ID) {
  return withPermission(
    async () => this.repository.findById(id),
    this.config.byIdAuth ?? 'auth',
  );
}

async findAll(page: number, search: string) {
  return withPermission(
    async () => this.repository.findAll(page, search),
    this.config.findAllAuth ?? 'auth',
  );
}

async create(data: Insert) {
  return withPermission(
    async (session) => {
      const audit = this.buildAuditOptions(session, 'create');
      return this.repository.create(data, audit);
    },
    this.config.createAuth ?? 'auth',
  );
}
```

### Migration Note for Existing Services

Existing services use `Role[]` syntax like `['academic', 'leap']`. These must be converted to either:

1. **Permission requirements**: `{ assessments: ['read'] }` — preferred for new code
2. **`'dashboard'` shorthand**: for services that currently use `['dashboard']`
3. **Custom access functions**: for complex logic

**Conversion examples:**

| Before | After |
|--------|-------|
| `byIdRoles: ['academic', 'leap']` | `byIdAuth: { assessments: ['read'] }` |
| `findAllRoles: ['dashboard']` | `findAllAuth: 'dashboard'` |
| `createRoles: ['registry']` | `createAuth: { students: ['create'] }` |
| `deleteRoles: ['admin']` | `deleteAuth: { applications: ['delete'] }` |
| `findAllRoles: canViewCycles` | `findAllAuth: canViewCycles` (custom function preserved) |

## Exit Criteria

- [ ] `BaseService` updated: new type system (`AuthConfig`, `byIdAuth`/`findAllAuth`/etc.)
- [ ] `BaseService` methods use `withPermission` instead of `withAuth`
- [ ] All `BaseService` type exports updated (`Session` from `@/core/auth`)
- [ ] `pnpm tsc --noEmit` passes (existing services will have type errors — expected, fixed in Phases 9–13)
