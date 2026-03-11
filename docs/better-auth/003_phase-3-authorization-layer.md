# Phase 3: Authorization Layer Replacement

**Prerequisites**: Phase 2 complete. Read `000_steering-document.md` first.

## 3.1 Create `withPermission` Wrapper

Delete: `src/core/platform/withAuth.ts`

Create: `src/core/platform/withPermission.ts`

### Behavior

1. Gets session via `auth.api.getSession({ headers: await headers() })`
2. Supports these requirement types:
   - `'all'` — no auth required
   - `'auth'` — authenticated user required
   - `'dashboard'` — user role must be in `DASHBOARD_ROLES`
   - `PermissionRequirement` — checks user's preset permissions
   - `AccessCheckFunction` — custom function for complex logic
3. Admin role bypasses ALL checks (existing behavior preserved)
4. Uses React `cache()` to deduplicate preset permission loading per request

### Implementation Concept

```ts
import { cache } from 'react';
import { headers } from 'next/headers';
import { auth, type Session } from '@/core/auth';
import { db } from '@/core/database';
import { presetPermissions } from '@auth/permission-presets/_schema/presetPermissions';
import { eq } from 'drizzle-orm';
import {
  DASHBOARD_ROLES,
  type AuthRequirement,
  type PermissionRequirement,
  type DashboardRole,
} from '@/core/auth/permissions';
import { unauthorized, forbidden } from 'next/server';

type AccessCheckFunction = (session: Session) => Promise<boolean>;

const getSessionWithPreset = cache(async () => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;

  let permissions: { resource: string; action: string }[] = [];
  const { presetId } = session.user;
  if (presetId) {
    permissions = await db
      .select({ resource: presetPermissions.resource, action: presetPermissions.action })
      .from(presetPermissions)
      .where(eq(presetPermissions.presetId, presetId));
  }

  return { session, permissions };
});

function hasPermission(
  permissions: { resource: string; action: string }[],
  requirement: PermissionRequirement
): boolean {
  for (const [resource, actions] of Object.entries(requirement)) {
    for (const action of actions) {
      if (!permissions.some((p) => p.resource === resource && p.action === action)) {
        return false;
      }
    }
  }
  return true;
}

export async function withPermission<T>(
  fn: (session: Session) => Promise<T>,
  requirement: AuthRequirement | AccessCheckFunction,
): Promise<T> {
  if (requirement === 'all') {
    const result = await getSessionWithPreset();
    return fn(result?.session ?? null as unknown as Session);
  }

  const result = await getSessionWithPreset();
  if (!result) {
    unauthorized();
  }

  const { session, permissions } = result;

  if (requirement === 'auth') {
    return fn(session);
  }

  // Admin bypass
  if (session.user.role === 'admin') {
    return fn(session);
  }

  if (requirement === 'dashboard') {
    const isDashboard = (DASHBOARD_ROLES as readonly string[]).includes(session.user.role);
    if (!isDashboard) {
      forbidden();
    }
    return fn(session);
  }

  if (typeof requirement === 'function') {
    const allowed = await requirement(session);
    if (!allowed) {
      forbidden();
    }
    return fn(session);
  }

  // Permission requirement check
  if (!hasPermission(permissions, requirement)) {
    forbidden();
  }

  return fn(session);
}
```

**Key points:**
- `cache()` ensures that multiple `withPermission` calls in the same request only hit the DB once for preset permissions
- Admin bypass preserved (matches current behavior)
- `'dashboard'` shorthand preserved for the ~25 services using it
- The preset's permissions are loaded via a single query joining `preset_permissions` on `presetId`
- `AccessCheckFunction` still supported for complex cases during transition

### Exposing Session Helper

Also export a helper for pages/components that need session data:

```ts
export async function getSession() {
  const result = await getSessionWithPreset();
  return result?.session ?? null;
}

export async function getSessionPermissions() {
  const result = await getSessionWithPreset();
  if (!result) return null;
  return { session: result.session, permissions: result.permissions };
}
```

## 3.2 Update `BaseService`

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

## 3.3 Update All Service Files (~30+ files)

Each service extending `BaseService` must update its config from role arrays to permission requirements or access functions.

### Academic Module Services

| Service | File |
|---------|------|
| AssessmentService | `src/app/academic/assessments/_server/service.ts` |
| SemesterModuleService | `src/app/academic/semester-modules/_server/service.ts` |
| ModuleService | `src/app/academic/modules/_server/service.ts` |
| SchoolStructureService | `src/app/academic/schools/structures/_server/service.ts` |
| FeedbackQuestionService | `src/app/academic/feedback/questions/_server/service.ts` |
| FeedbackCategoryService | `src/app/academic/feedback/categories/_server/service.ts` |
| FeedbackCycleService | `src/app/academic/feedback/cycles/_server/service.ts` |
| FeedbackReportService | `src/app/academic/feedback/reports/_server/service.ts` |
| LecturerService | `src/app/academic/lecturers/_server/service.ts` |

**Example — FeedbackCycleService:**

**Before:**
```ts
const CRUD_POSITIONS = ['admin', 'manager'];
const VIEW_POSITIONS = ['admin', 'manager', 'year_leader'];

function canManageCycles(session: Session) {
  return Promise.resolve(
    session.user?.role === 'academic' &&
    CRUD_POSITIONS.includes(session.user.position ?? '')
  );
}
```

**After:**
```ts
// No position arrays needed — preset permissions handle this
constructor() {
  super(repo, {
    findAllAuth: { 'feedback-cycles': ['read'] },
    byIdAuth: { 'feedback-cycles': ['read'] },
    createAuth: { 'feedback-cycles': ['create'] },
    updateAuth: { 'feedback-cycles': ['update'] },
    deleteAuth: { 'feedback-cycles': ['delete'] },
  });
}
```

### Registry Module Services

| Service | File |
|---------|------|
| StudentService | `src/app/registry/students/_server/service.ts` |
| RegistrationRequestService | `src/app/registry/registration/requests/_server/requests/service.ts` |
| StudentStatusService | `src/app/registry/student-statuses/_server/service.ts` |
| DocumentService | `src/app/registry/documents/_server/service.ts` |
| TermSettingService | `src/app/registry/terms/settings/_server/service.ts` |
| CertificateReprintService | `src/app/registry/certificate-reprints/_server/service.ts` |

### Admin Module Services

| Service | File |
|---------|------|
| UserService | `src/app/admin/users/_server/service.ts` |
| TaskService | `src/app/admin/tasks/_server/service.ts` |
| ActivityTrackerService | `src/app/admin/activity-tracker/_server/service.ts` |
| NotificationService | `src/app/admin/notifications/_server/service.ts` |

### Additional Non-Service Files

These files use `withAuth` or session directly and must be migrated:

| File | Reason |
|------|--------|
| `src/app/admin/notifications/_server/actions.ts` | Uses `withAuth` directly |
| `src/app/admin/reports.config.ts` | References session role/position |

### Admissions Module Services

| Service | File |
|---------|------|
| ApplicantService | `src/app/admissions/applicants/_server/service.ts` |
| ApplicationService | `src/app/admissions/applications/_server/service.ts` |
| PaymentService | `src/app/admissions/payments/_server/service.ts` |
| EntryRequirementService | `src/app/admissions/entry-requirements/_server/service.ts` |
| SubjectService | `src/app/admissions/subjects/_server/service.ts` |
| CertificateTypeService | `src/app/admissions/certificate-types/_server/service.ts` |
| IntakePeriodService | `src/app/admissions/intake-periods/_server/service.ts` |
| RecognizedSchoolService | `src/app/admissions/recognized-schools/_server/service.ts` |

### Finance Module Services

| Service | File |
|---------|------|
| SponsorService | `src/app/finance/sponsors/_server/service.ts` |
| PaymentReceiptService | `src/app/finance/payment-receipts/_server/service.ts` |

### Timetable Module Services

| Service | File |
|---------|------|
| AllocationService | `src/app/timetable/timetable-allocations/_server/service.ts` |
| VenueService | `src/app/timetable/venues/_server/service.ts` |
| VenueTypeService | `src/app/timetable/venue-types/_server/service.ts` |
| SlotService | `src/app/timetable/slots/_server/service.ts` |

### Library Module Services

All library services → change to `{ library: ['read'] }` / `{ library: ['create'] }` etc.

## 3.4 Update Standalone Server Actions

Some files use `withAuth` directly (not through BaseService). These must be updated to `withPermission`:

**Pattern replacement:**
```ts
// Before
withAuth(fn, ['registry', 'admin'])
// After
withPermission(fn, { students: ['update'] })

// Before
withAuth(fn, ['dashboard'])
// After
withPermission(fn, 'dashboard')

// Before
withAuth(fn, ['all'])
// After
withPermission(fn, 'all')

// Before
withAuth(fn, ['auth'])
// After
withPermission(fn, 'auth')
```

## 3.5 Update All Client Components (~35+ files)

### Session Access

Replace:
- `useSession` from `next-auth/react` → `authClient.useSession()` from `@/core/auth-client`
- `signOut` from `next-auth/react` → `authClient.signOut()`
- `SessionProvider` from `next-auth/react` → remove entirely
- Session type from `next-auth` → `Session` from `@/core/auth`

### Server Components

Replace:
```ts
// Before
import { auth } from '@/core/auth';
const session = await auth();

// After
import { auth } from '@/core/auth';
import { headers } from 'next/headers';
const session = await auth.api.getSession({ headers: await headers() });
```

Or use the helper:
```ts
import { getSession } from '@/core/platform/withPermission';
const session = await getSession();
```

### Position Checks in UI Components

All `session.user.position` checks must be replaced with permission-based checks.

**Server component pattern:**
```ts
// Before
if (session.user.position === 'manager') { /* show edit button */ }

// After
import { getSessionPermissions } from '@/core/platform/withPermission';
const result = await getSessionPermissions();
const canEdit = result?.permissions.some(p => p.resource === 'school-structures' && p.action === 'update');
if (canEdit) { /* show edit button */ }
```

**Client component pattern (via server action):**
```ts
// Create a server action that checks permissions
'use server';
export async function checkPermission(resource: string, action: string) {
  const result = await getSessionPermissions();
  if (!result) return false;
  if (result.session.user.role === 'admin') return true;
  return result.permissions.some(p => p.resource === resource && p.action === action);
}
```

### Key Files Requiring Position → Permission Migration

- `src/app/academic/schools/structures/[id]/page.tsx` — position-based edit/delete visibility
- `src/app/academic/academic.config.ts` — `isVisible` position checks
- `src/app/registry/registry.config.ts` — `isVisible` position checks
- `src/app/admin/admin.config.ts` — `isVisible` position checks
- `src/app/timetable/timetable.config.ts` — `isVisible` position checks
- `src/app/admin/activity-tracker/_server/service.ts` — manager position check
- `src/app/admin/tasks/_server/service.ts` — manager position check
- All feedback service files — position arrays

## 3.6 Replace `stdNo` Session Access

Create a dedicated server action (on-demand):

File: `src/app/registry/students/_server/actions.ts` (add to existing)

```ts
export async function getStudentByUserId(userId: string) {
  return withPermission(async () => {
    return studentRepository.findByUserId(userId);
  }, 'auth');
}
```

Update all components using `session.user.stdNo`:
- `src/app/student-portal/**`
- `src/shared/lib/hooks/use-user-student.tsx`

## 3.7 Migrate LMS Credential Reads (~15 files)

Replace `session.user.lmsUserId` / `session.user.lmsToken` with on-demand reads from `lms_credentials` table.

Create: `src/app/auth/auth-providers/_server/lms-credentials.ts`

```ts
export async function getLmsCredentials(userId: string) {
  return db.query.lmsCredentials.findFirst({
    where: eq(lmsCredentials.userId, userId),
  });
}
```

Files requiring migration:
- `src/core/integrations/moodle.ts`
- `src/app/lms/students/_server/repository.ts`
- `src/app/lms/students/_server/actions.ts`
- `src/app/lms/courses/_server/actions.ts`
- `src/app/lms/quizzes/_server/actions.ts`
- `src/app/lms/auth/_components/LmsAuthGuard.tsx`
- `src/app/lms/auth/_server/actions.ts`
- `src/app/admin/users/_server/repository.ts`
- `src/app/admin/users/_components/Form.tsx`

## 3.8 Update Navigation Configs for Sub-Item Permissions

### Update NavItem Type

File: `src/app/dashboard/module-config.types.ts`

Add `permissions` field:

```ts
export type NavItem = {
  label: string | React.ReactNode;
  href?: string | ((department: string) => string);
  roles?: UserRole[];
  permissions?: { resource: string; action: string }[];
  isVisible?: (session: Session | null) => boolean;
  children?: NavItem[];
};
```

### Update Dashboard Shell

File: `src/app/dashboard/dashboard.tsx`

Update `isItemVisible` to check permissions when `item.permissions` is defined:

```ts
function isItemVisible(
  item: NavItem,
  session: Session | null,
  userPermissions: { resource: string; action: string }[]
): boolean {
  if (item.isVisible && !item.isVisible(session)) return false;

  if (item.roles && !item.roles.includes(session?.user?.role)) return false;

  if (item.permissions) {
    if (session?.user?.role === 'admin') return true;
    return item.permissions.every(({ resource, action }) =>
      userPermissions.some((p) => p.resource === resource && p.action === action)
    );
  }

  return true;
}
```

The dashboard shell (a server component) loads permissions once and passes them through the nav tree.

### Update Module Configs

Replace `isVisible` position checks with `permissions` field on sub-items:

**Example — academic.config.ts:**

```ts
// Before
{
  label: 'Lecturers',
  href: '/academic/lecturers',
  roles: ['academic'],
  isVisible: (session) => {
    const position = session?.user?.position;
    return !!(position && ['manager', 'admin', 'program_leader'].includes(position));
  },
}

// After
{
  label: 'Lecturers',
  href: '/academic/lecturers',
  roles: ['academic'],
  permissions: [{ resource: 'lecturers', action: 'read' }],
}
```

Top-level module visibility (`roles` field) stays unchanged.

## Exit Criteria

- [ ] `withPermission` wrapper created with cache()-deduped preset loading
- [ ] `withAuth` deleted
- [ ] `BaseService` updated to use `AuthConfig` / `withPermission`
- [ ] All ~30+ service files migrated from role arrays to permission requirements
- [ ] All standalone `withAuth` calls replaced with `withPermission`
- [ ] All ~35+ client components migrated from `next-auth` imports
- [ ] `SessionProvider` removed
- [ ] Position checks replaced with permission checks in all UI components
- [ ] `stdNo` fetched on-demand, removed from session
- [ ] LMS credentials read from `lms_credentials` table
- [ ] `NavItem` type supports `permissions` field
- [ ] Dashboard shell checks both roles and permissions for nav visibility
- [ ] Module configs updated with `permissions` on sub-items
- [ ] `session.accessToken` field removed (no consumers — verify with `grep -r 'session.accessToken' src/`)
- [ ] `pnpm tsc --noEmit` passes
