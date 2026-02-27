# Auth Migration Plan: Auth.js → Better Auth + RBAC/Permissions

## Decisions Summary

| Decision | Choice |
|----------|--------|
| Auth provider | Google OAuth only (keep existing) |
| Session strategy | DB sessions (Better Auth default) |
| Permission storage | `user_permissions` table (normalized, per-user overrides) |
| Permission format | Resource:action (Better Auth native `createAccessControl`) |
| DB migration | Side-by-side (new tables alongside old → migrate data → drop old) |
| RBAC approach | Better Auth admin plugin + custom permission layer |
| Custom user fields | `additionalFields` for role only; lmsUserId/lmsToken → separate `lms_credentials` table |
| stdNo in session | Removed; query on-demand |
| Position field | Removed; replaced by code-defined permission presets (e.g. "lecturer", "year_leader") |
| Environment vars | Rename all to Better Auth conventions |
| Rollout | Phased (4 phases) |
| Better Auth version | Pin to latest stable at migration time |
| pgEnums | Drop all 3 (user_roles, user_positions, dashboard_users) → use text |
| Google UX | `prompt: "select_account"` (force account picker) |
| Route protection | Next.js 16 proxy (full session validation via `auth.api.getSession()`) |

---

## Architecture Overview

### Permission Resolution Order
```
1. Role defaults (defined in Better Auth access control statements)
2. Permission presets (code-defined templates like "program_leader" → writes DB rows)
3. Per-user overrides (individual grant/revoke in user_permissions table)
```

### Access Check Flow
```
Request → getSession (Better Auth) → withPermission(permissions)
  ├─ Get user.role from session
  ├─ Get role's default permissions (from access control config)
  ├─ Query user_permissions table for overrides
  ├─ Merge: role_defaults + grants - revokes
  └─ Return allowed/forbidden
```

---

## Phase 1: Foundation (Better Auth Core + DB Migration)

### 1.1 Install Dependencies
```
pnpm add better-auth@latest
pnpm remove next-auth @auth/drizzle-adapter
```
**Pin the version** in `package.json` (remove `^` prefix) to prevent unexpected breaking changes.

### 1.2 Environment Variables
**Remove:**
- `AUTH_SECRET`
- `AUTH_URL`
- `AUTH_GOOGLE_ID`
- `AUTH_GOOGLE_SECRET`

**Add:**
- `BETTER_AUTH_SECRET` (32+ chars: `openssl rand -base64 32`)
- `BETTER_AUTH_URL` (e.g., `http://localhost:3000`)
- `NEXT_PUBLIC_BETTER_AUTH_URL` (same value — needed for client-side auth requests)
- `GOOGLE_CLIENT_ID` (same value as old AUTH_GOOGLE_ID)
- `GOOGLE_CLIENT_SECRET` (same value as old AUTH_GOOGLE_SECRET)

### 1.3 Create Better Auth Server Instance
**File:** `src/core/auth.ts` (replace entirely)

Better Auth uses the Drizzle adapter. Config:
```ts
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin } from "better-auth/plugins/admin";
import { nextCookies } from "better-auth/next-js";
import { nanoid } from "nanoid";
import { db } from "@/core/database";
import { ac, roles } from "@/core/auth/permissions";
import { logActivity } from "@audit-logs/activity-logs/_server/actions";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    usePlural: true,
  }),
  trustedOrigins: [
    process.env.BETTER_AUTH_URL!,
    // Add production domain(s) here
  ],
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      prompt: "select_account",
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5 minutes
      strategy: "compact",
    },
  },
  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ["google"],
    },
    encryptOAuthTokens: true,
  },
  rateLimit: {
    enabled: true,
    window: 60,
    max: 100,
    storage: "database",
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "user",
        input: false,
      },
    },
  },
  advanced: {
    useSecureCookies: process.env.NODE_ENV === "production",
    database: {
      generateId: () => nanoid(),
    },
  },
  databaseHooks: {
    session: {
      create: {
        after: async (session) => {
          // Audit: track sign-in events
          await logActivity({
            userId: session.userId,
            type: "auth:sign_in",
          }).catch(() => {});
        },
      },
    },
    user: {
      update: {
        after: async (user) => {
          // Audit: track user updates (role changes, bans, etc.)
          await logActivity({
            userId: user.id,
            type: "auth:user_update",
          }).catch(() => {});
        },
      },
    },
  },
  plugins: [
    admin({ ac, roles }),
    nextCookies(), // MUST be the last plugin in the array
  ],
});

export type Session = typeof auth.$Infer.Session;
```

Key notes:
- `usePlural: true` is required because our existing tables use plural names (users, sessions, accounts)
- `trustedOrigins` protects against CSRF and open redirect attacks
- `prompt: "select_account"` forces Google account picker (essential for shared university workstations)
- `cookieCache` with `compact` strategy avoids DB hits on every request (5 min cache)
- `accountLinking` with Google as trusted provider prevents duplicate accounts when Google data changes
- `encryptOAuthTokens: true` encrypts stored Google access/refresh tokens in the database (security best practice)
- `rateLimit` with `database` storage protects all endpoints against brute-force attacks
- `advanced.useSecureCookies` enforces HTTPS cookies in production
- `advanced.database.generateId` uses nanoid() to match existing ~12K user IDs format
- `nextCookies()` **MUST** be the last plugin in the array (Better Auth requirement)
- `admin` plugin provides RBAC with `userHasPermission` API
- `additionalFields` adds `role` to user model (auto-included in session)
- `databaseHooks` maintain audit trail continuity — track sign-ins and user updates in the activity log
- `position` field is NOT carried over (replaced by permission presets)
- `lmsUserId` / `lmsToken` NOT on user anymore (moved to `lms_credentials` table)

### 1.4 Create Access Control Definitions
**File:** `src/core/auth/permissions.ts`

> **Client-safety note:** This file is imported by both `auth.ts` (server) and `auth-client.ts` (client). The imports `better-auth/plugins/access` and `better-auth/plugins/admin/access` are designed to be client-safe (they only contain type definitions and pure functions for access control). Verified against Better Auth docs — these are explicitly intended for shared client/server usage.

```ts
import { createAccessControl } from "better-auth/plugins/access";
import { defaultStatements, adminAc } from "better-auth/plugins/admin/access";

export const statements = {
  ...defaultStatements,
  student: ["view", "edit", "register", "print_card", "print_transcript", "graduate", "manage_status"],
  module: ["view", "manage", "assign"],
  grade: ["view", "edit", "approve"],
  clearance: ["view", "manage", "approve"],
  finance: ["view", "manage_payments", "receipts"],
  library: ["view", "manage_loans", "manage_settings"],
  timetable: ["view", "manage"],
  report: ["view", "generate"],
  admission: ["view", "manage", "score"],
  feedback: ["view", "manage_cycles"],
  lms: ["view", "sync"],
} as const;

export const ac = createAccessControl(statements);

export const roles = {
  user: ac.newRole({}),
  applicant: ac.newRole({}),
  student: ac.newRole({
    student: ["view"],
    grade: ["view"],
  }),
  finance: ac.newRole({
    student: ["view"],
    finance: ["view", "manage_payments", "receipts"],
    clearance: ["view", "approve"],
    report: ["view", "generate"],
  }),
  registry: ac.newRole({
    student: ["view", "edit", "register", "print_card", "print_transcript", "graduate", "manage_status"],
    clearance: ["view", "manage", "approve"],
    report: ["view", "generate"],
    admission: ["view"],
  }),
  library: ac.newRole({
    student: ["view"],
    library: ["view", "manage_loans", "manage_settings"],
    clearance: ["view", "approve"],
  }),
  academic: ac.newRole({
    student: ["view"],
    module: ["view", "manage", "assign"],
    grade: ["view", "edit"],
    timetable: ["view"],
    feedback: ["view", "manage_cycles"],
    lms: ["view", "sync"],
    report: ["view"],
  }),
  marketing: ac.newRole({
    student: ["view"],
    report: ["view"],
  }),
  student_services: ac.newRole({
    student: ["view"],
    clearance: ["view"],
  }),
  resource: ac.newRole({
    timetable: ["view", "manage"],
  }),
  leap: ac.newRole({
    student: ["view"],
    module: ["view"],
  }),
  admin: ac.newRole({
    ...adminAc.statements,
    student: ["view", "edit", "register", "print_card", "print_transcript", "graduate", "manage_status"],
    module: ["view", "manage", "assign"],
    grade: ["view", "edit", "approve"],
    clearance: ["view", "manage", "approve"],
    finance: ["view", "manage_payments", "receipts"],
    library: ["view", "manage_loans", "manage_settings"],
    timetable: ["view", "manage"],
    report: ["view", "generate"],
    admission: ["view", "manage", "score"],
    feedback: ["view", "manage_cycles"],
    lms: ["view", "sync"],
  }),
};
```

### 1.5 Permission Presets (replaces `position`)
**File:** `src/core/auth/presets.ts`

```ts
export const permissionPresets = {
  lecturer: {
    grade: ["view", "edit"],
    module: ["view"],
    student: ["view"],
    lms: ["view"],
  },
  year_leader: {
    grade: ["view", "edit"],
    module: ["view", "manage"],
    student: ["view", "edit"],
    lms: ["view"],
    report: ["view"],
  },
  program_leader: {
    grade: ["view", "edit", "approve"],
    module: ["view", "manage", "assign"],
    student: ["view", "edit"],
    lms: ["view", "sync"],
    report: ["view", "generate"],
  },
  principal_lecturer: {
    grade: ["view", "edit"],
    module: ["view", "manage"],
    student: ["view"],
    lms: ["view"],
  },
  manager: {
    grade: ["view", "edit", "approve"],
    module: ["view", "manage", "assign"],
    student: ["view", "edit", "register"],
    timetable: ["view", "manage"],
    lms: ["view", "sync"],
    report: ["view", "generate"],
    feedback: ["view", "manage_cycles"],
  },
} as const satisfies Record<string, Partial<typeof import("./permissions").statements>>;

export type PermissionPreset = keyof typeof permissionPresets;
```

When an admin applies a preset to a user, the system writes individual rows to `user_permissions`.

### 1.6 User Permissions Table
**File:** `src/app/auth/users/_schema/userPermissions.ts`

```ts
export const userPermissions = pgTable("user_permissions", {
  id: serial().primaryKey(),
  userId: text().notNull().references(() => user.id, { onDelete: "cascade" }),
  resource: text().notNull(),     // e.g., "student", "grade"
  action: text().notNull(),       // e.g., "print_card", "edit"
  granted: boolean().notNull(),   // true = grant, false = revoke
  createdAt: timestamp({ mode: "date" }).defaultNow().notNull(),
  createdBy: text().references(() => user.id, { onDelete: "set null" }),
}, (t) => ({
  userResourceAction: unique().on(t.userId, t.resource, t.action),
  userIdx: index("user_permissions_user_idx").on(t.userId),
}));
```

### 1.7 LMS Credentials Table
**File:** `src/app/lms/_schema/lmsCredentials.ts`

```ts
export const lmsCredentials = pgTable("lms_credentials", {
  id: serial().primaryKey(),
  userId: text().notNull().unique().references(() => user.id, { onDelete: "cascade" }),
  lmsUserId: integer().notNull(),
  lmsToken: text(),
  updatedAt: timestamp({ mode: "date" }).defaultNow().$onUpdate(() => new Date()).notNull(),
});
```

This replaces `lmsUserId` and `lmsToken` columns on the users table.

### 1.8 Create Auth Client
**File:** `src/core/auth-client.ts`

```ts
import { createAuthClient } from "better-auth/react";
import { adminClient } from "better-auth/client/plugins";
import { ac, roles } from "@/core/auth/permissions";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL,
  plugins: [
    adminClient({ ac, roles }),
  ],
});

export const { signIn, signUp, signOut, useSession } = authClient;
```

**Note:** Add `NEXT_PUBLIC_BETTER_AUTH_URL` to `.env` (same value as `BETTER_AUTH_URL`). Needed for client-side requests.

### 1.9 Update Route Handler
**Rename:** `src/app/api/auth/[...nextauth]/` → `src/app/api/auth/[...all]/`

**File:** `src/app/api/auth/[...all]/route.ts`
```ts
import { auth } from "@/core/auth";
import { toNextJsHandler } from "better-auth/next-js";
export const { POST, GET } = toNextJsHandler(auth);
```

### 1.10 Add Next.js 16 Proxy (NOT Middleware)
**File:** `src/proxy.ts`

> **CRITICAL:** Next.js 16 renamed `middleware` to `proxy` and runs it in Node.js runtime (not Edge). This means we can do **full session validation** with database checks, not just optimistic cookie presence checks.

```ts
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/core/auth";

export async function proxy(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/academic/:path*",
    "/registry/:path*",
    "/finance/:path*",
    "/admin/:path*",
    "/lms/:path*",
    "/timetable/:path*",
    "/library/:path*",
    "/admissions/:path*",
    "/student-portal/:path*",
  ],
};
```

**Key differences from the old middleware approach:**
- Uses `export async function proxy()` instead of `middleware()` (Next.js 16 convention)
- Runs in Node.js runtime → can access the database directly
- Full session validation via `auth.api.getSession()` — not just cookie presence
- Includes `/student-portal/:path*` which needs auth but has a different layout
- Properly validates the session token against the database, preventing forged cookies

**Migration note:** If you had an existing `middleware.ts`, run `npx @next/codemod@canary middleware-to-proxy .` to auto-migrate.

---

## Phase 2: Database Migration

**Note:** The database migration MUST be completed before any code changes in Phase 3. The new schema must be ready before the application code references it.

### 2.1 Side-by-Side Strategy
1. **Generate** Better Auth schema tables using CLI: `npx @better-auth/cli@latest generate --output src/core/auth/auth-schema.ts`
2. Better Auth will create its own tables: `user`, `session`, `account`, `verification`
3. Since we use `usePlural: true`, Better Auth will look for `users`, `sessions`, `accounts`, `verifications`
4. Write a **custom migration** that:
   a. Creates new Better Auth `sessions` table (different schema from old)
   b. Creates new Better Auth `accounts` table (different schema from old)  
   c. Creates new Better Auth `verifications` table
   d. Creates `user_permissions` table
   e. Creates `lms_credentials` table
   f. Alters `users` table:
      - Convert `role` from pgEnum to text (drop `user_roles` enum)
      - Add `email_verified` as `boolean` (convert from timestamp)
      - Add `created_at` and `updated_at` timestamps
      - Drop `position` column (after migrating to presets; drop `user_positions` enum)
      - Drop `lms_user_id` and `lms_token` (after migrating to lms_credentials)
      - Drop `dashboard_users` enum
   g. Migrates account data from old `accounts` → new format
   h. Drops old `sessions`, `accounts`, `verification_tokens`, `authenticators` tables
   i. Converts position → permission preset rows in `user_permissions`

### 2.2 User Table Changes
**Current users table:**
```
id, name, role (pgEnum), position (pgEnum), email, email_verified (timestamp), image, lms_user_id, lms_token
```

**Target users table (Better Auth compatible):**
```
id, name, role (text), email, email_verified (boolean), image, created_at, updated_at, banned, ban_reason, ban_expires
```

Changes:
- `role`: pgEnum → text (drop `user_roles` enum, convert column to plain text)
- `email_verified`: timestamp → boolean (`NOT NULL DEFAULT false`, set true where old value was NOT NULL)
- `email`: make NOT NULL (Better Auth requires it)
- `name`: make NOT NULL (Better Auth requires it; set default for NULL values)
- Add: `created_at`, `updated_at`, `banned`, `ban_reason`, `ban_expires` (admin plugin)
- Remove: `position`, `lms_user_id`, `lms_token`
- Remove: `user_positions` pgEnum (replaced by permission presets)
- Remove: `dashboard_users` pgEnum (no longer needed)
- Keep: `role` as text (used by admin plugin's RBAC; access control config is the source of truth for valid roles)

**Enum Cleanup SQL:**
```sql
ALTER TABLE users ALTER COLUMN role TYPE text;
ALTER TABLE users ALTER COLUMN role SET DEFAULT 'user';
DROP TYPE IF EXISTS user_roles;
DROP TYPE IF EXISTS user_positions;
DROP TYPE IF EXISTS dashboard_users;
```

### 2.3 Account Table Migration
**Old accounts (Auth.js):**
- Composite PK: (provider, provider_account_id)
- No `id` column

**New accounts (Better Auth):**
- `id` text PK
- `user_id`, `account_id`, `provider_id`, `access_token`, `refresh_token`, etc.

Migration SQL maps:
- `provider` → `provider_id`
- `provider_account_id` → `account_id`
- Generate `id` for each row

### 2.4 Session Table Migration
Old sessions can be dropped (active users will need to re-login). Better Auth creates:
- `id` text PK
- `token` (unique)
- `user_id`
- `expires_at`
- `ip_address`, `user_agent`
- `created_at`, `updated_at`

### 2.5 Enum Cleanup
All 3 PostgreSQL enums are being dropped as part of the migration:
- **`user_roles` pgEnum** → Drop and convert `role` column to plain `text` (access control config is the source of truth)
- **`user_positions` pgEnum** → Drop entirely (replaced by permission presets in `user_permissions` table)
- **`dashboard_users` pgEnum** → Drop entirely (no longer needed; use permissions instead)

```sql
ALTER TABLE users ALTER COLUMN role TYPE text;
ALTER TABLE users ALTER COLUMN role SET DEFAULT 'user';
ALTER TABLE users ALTER COLUMN position DROP NOT NULL;
ALTER TABLE users DROP COLUMN IF EXISTS position;
DROP TYPE IF EXISTS user_roles;
DROP TYPE IF EXISTS user_positions;
DROP TYPE IF EXISTS dashboard_users;
```

### 2.6 Drizzle Schema Updates
Update schema files to match Better Auth's expected format:
- `src/app/auth/users/_schema/users.ts` — Rewrite to match Better Auth user model
- `src/app/auth/auth-providers/_schema/accounts.ts` — Rewrite to match Better Auth account model
- `src/app/auth/auth-providers/_schema/sessions.ts` — Rewrite to match Better Auth session model
- `src/app/auth/auth-providers/_schema/verificationTokens.ts` — **RENAME to `verifications.ts`** and rewrite as Better Auth verification table
  - Better Auth with `usePlural: true` expects the table named `verifications` (not `verification_tokens`)
  - Schema: `id` text PK, `identifier` text, `value` text, `expires_at` timestamp, `created_at` timestamp, `updated_at` timestamp
- `src/app/auth/auth-providers/_schema/authenticators.ts` — DELETE (not used by Better Auth core; add passkey plugin later if needed)

---

## Phase 3: Authorization Layer Replacement

### 3.1 Replace `withAuth` → `withPermission`
**Delete:** `src/core/platform/withAuth.ts`
**Create:** `src/core/platform/withPermission.ts`

The new `withPermission` function:
1. Gets session via `auth.api.getSession({ headers: await headers() })`
2. Supports three auth modes:
   - `'all'` — no auth required
   - `'auth'` — any authenticated user
   - Permission check — checks role defaults + user_permissions overrides
3. For permission checks, merges:
   - Role default permissions (from `ac` config)
   - Per-user overrides (from `user_permissions` table, cached per request)
4. `admin` role always passes (like current behavior)

#### Signature concept:
```ts
type PermissionRequirement = {
  [resource: string]: string[];  // e.g., { student: ["print_card"] }
};

async function withPermission<T>(
  fn: (session: Session) => Promise<T>,
  requirement: 'all' | 'auth' | PermissionRequirement
): Promise<T>;
```

### 3.2 Update `BaseService`
**File:** `src/core/platform/BaseService.ts`

- Replace `import type { Session } from 'next-auth'` → `import type { Session } from '@/core/auth'`
- Replace `withAuth` → `withPermission`  
- Change config types from `Role[]` to `PermissionRequirement | 'all' | 'auth'`
- Update all role arrays like `['registry', 'admin']` → `{ student: ['edit'] }`

### 3.3 Update All Server Actions (~30+ files)
Every file that imports `withAuth` must be updated:
- Replace `withAuth(fn, ['registry', 'admin'])` → `withPermission(fn, { student: ['edit'] })`
- Replace `withAuth(fn, ['dashboard'])` → `withPermission(fn, 'auth')` or specific permission
- Replace `withAuth(fn, ['all'])` → `withPermission(fn, 'all')`
- Replace custom `AccessCheckFunction` patterns with permission checks

**Key files to update (non-exhaustive):**
- `src/app/academic/lecturers/_server/actions.ts`
- `src/app/registry/students/_server/service.ts` (largest, ~30 `withAuth` calls)
- `src/app/registry/certificate-reprints/_server/service.ts`
- `src/app/finance/*/_server/actions.ts`
- `src/app/admin/*/_server/actions.ts`
- `src/app/feedback/_server/actions.ts`
- All other services extending `BaseService`

### 3.4 Update All Client Components (~35+ files)
Every file importing from `next-auth/react` must be updated:

**Replace:**
- `import { useSession } from 'next-auth/react'` → `import { authClient } from '@/core/auth-client'` + `authClient.useSession()`
- `import { signOut } from 'next-auth/react'` → `authClient.signOut()`
- `import { SessionProvider } from 'next-auth/react'` → Remove (not needed with Better Auth)
- `import type { Session } from 'next-auth'` → `import type { Session } from '@/core/auth'`

**Client-side role checks** like `session.user.role === 'registry'` should migrate to:
```ts
const { data: hasAccess } = await authClient.admin.hasPermission({
  permissions: { student: ["print_card"] }
});
```

Or for synchronous UI checks:
```ts
authClient.admin.checkRolePermission({
  permissions: { student: ["edit"] },
  role: session.user.role,
});
```

**Important:** For per-user overrides that are DB-stored, client-side `checkRolePermission` won't know about them (it only checks role config). Use `hasPermission` (server call) or pass permission data from server via props.

### 3.5 Files referencing `next-auth` (complete list — 61 imports)

**Server-side (type/session imports):**
- `src/core/platform/withAuth.ts` — DELETE
- `src/core/platform/BaseService.ts` — Update Session type import
- `src/core/auth.ts` — REWRITE entirely
- `src/app/timetable/timetable.config.ts` — Update Session type
- `src/app/registry/students/_server/history/service.ts` — Update Session type
- `src/app/admin/tasks/_server/service.ts` — Update Session type
- `src/app/admin/activity-tracker/_server/service.ts` — Update Session type
- `src/app/academic/schools/structures/[id]/page.tsx` — Update Session type
- `src/app/registry/students/_components/StudentTabs.tsx` — Update Session type
- `src/app/registry/students/_components/academics/SemesterTable.tsx` — Update Session type + useSession
- `src/app/dashboard/module-config.types.ts` — Update Session type
- `src/app/dashboard/dashboard.tsx` — Update Session type + useSession + signOut
- `src/app/auth/auth-providers/_schema/accounts.ts` — Remove AdapterAccountType usage
- `next-auth.d.ts` — DELETE entirely
- `src/test/mock.withAuth.ts` — Update to match new withPermission

**Client-side (useSession/signOut/SessionProvider):**
- `src/app/providers.tsx` — Remove SessionProvider
- `src/shared/ui/adease/DetailsViewHeader.tsx` — useSession → authClient.useSession
- `src/shared/lib/hooks/use-user-student.tsx` — useSession → authClient.useSession
- `src/shared/lib/hooks/use-user-schools.tsx` — useSession → authClient.useSession
- `src/app/registry/students/_components/graduation/GraduationView.tsx`
- `src/app/registry/students/_components/sponsors/StudentSponsorsView.tsx`
- `src/app/registry/students/_components/graduation/reprints/CreateReprintModal.tsx`
- `src/app/registry/students/_components/graduation/transcript/TranscriptPrinter.tsx`
- `src/app/registry/students/_components/sponsors/SemesterSponsorsView.tsx`
- `src/app/registry/students/_components/sponsors/sponsor-modals/NewSponsorModal.tsx`
- `src/app/registry/students/_components/graduation/certificate/CertificateDownloader.tsx`
- `src/app/registry/students/_components/registration/RegistrationTabs.tsx`
- `src/app/registry/students/_components/info/PhotoView.tsx`
- `src/app/registry/students/_components/info/StudentView.tsx`
- `src/app/registry/students/_components/documents/DocumentsView.tsx`
- `src/app/registry/students/_components/card/StudentCardPrinter.tsx`
- `src/app/registry/students/_components/academics/AcademicsView.tsx`
- `src/app/registry/students/_components/academics/statements/StatementOfResultsPrinter.tsx`
- `src/app/registry/registration/clearance/_components/ClearanceSwitch.tsx`
- `src/app/registry/graduation/requests/_components/GraduationStatusSwitch.tsx`
- `src/app/registry/graduation/clearance/_components/GraduationClearanceDetails.tsx`
- `src/app/registry/graduation/clearance/_components/GraduationClearanceSwitch.tsx`
- `src/app/registry/clearance/auto-approve/_components/BulkImportModal.tsx`
- `src/app/registry/clearance/auto-approve/_components/Form.tsx`
- `src/app/registry/blocked-students/_components/ImportBlockedStudentsDialog.tsx`
- `src/app/lms/auth/_components/LmsAuthGuard.tsx`
- `src/app/dashboard/base/RoleDisplay.tsx`
- `src/app/auth/account-setup/page.tsx`
- `src/app/auth/login/page.tsx`
- `src/shared/ui/GoogleSignInForm.tsx`
- `src/app/student-portal/_shared/Navbar.tsx`
- `src/app/apply/_lib/useApplicant.ts`
- `src/app/apply/_components/ApplyHero.tsx`
- `src/app/apply/_components/ApplyHeader.tsx`
- `src/app/apply/restricted/page.tsx`
- `src/app/apply/profile/_components/ProfileView.tsx`
- `src/app/admin/activity-tracker/page.tsx`
- `src/app/admin/tasks/_components/TaskForm.tsx`
- `src/app/admissions/applicants/[id]/_components/ApplicantHeader.tsx`
- `src/app/academic/feedback/cycles/_components/Form.tsx`
- `src/app/academic/assessments/layout.tsx`
- `src/app/academic/gradebook/_components/ModuleDetailsCard.tsx`

---

## Phase 4: Cleanup & Testing

### 4.1 Remove Auth.js Artifacts
- Delete `next-auth.d.ts`
- Delete `src/core/platform/withAuth.ts`
- Remove `next-auth`, `@auth/drizzle-adapter` from package.json
- Remove `SessionProvider` from `src/app/providers.tsx`
- Remove all `import ... from 'next-auth'` / `'next-auth/react'`

### 4.2 Dashboard Navigation
**File:** `src/app/dashboard/module-config.types.ts`
- Update `NavItem.roles` to use permissions instead of `UserRole[]`
- Or keep roles for nav visibility and use permissions for action authorization

### 4.3 Delete Obsolete Files
- `src/app/api/auth/[...nextauth]/route.ts` (replaced by `[...all]`)
- `next-auth.d.ts`
- `src/core/platform/withAuth.ts`

### 4.4 Testing Checklist
- [ ] Google OAuth sign-in works (account selector prompt appears)
- [ ] Session persists across page refreshes
- [ ] Cookie cache is working (check response headers for cookie size)
- [ ] Middleware redirects unauthenticated users from protected routes
- [ ] Admin can manage user roles via Better Auth admin API
- [ ] Permission presets correctly populate user_permissions
- [ ] Per-user permission overrides work (grant + revoke)
- [ ] `withPermission` correctly merges role defaults + overrides
- [ ] All server actions enforce correct permissions
- [ ] Client-side conditional rendering uses permission checks
- [ ] Student portal auth works
- [ ] Apply portal auth works
- [ ] LMS auth guard works with new lms_credentials table
- [ ] Rate limiting is active (test with rapid requests)
- [ ] Account linking works (same Google account reconnects to existing user)
- [ ] All 61 files updated and no `next-auth` imports remain
- [ ] `pnpm tsc --noEmit && pnpm lint:fix` passes clean

---

## Rollback Plan

If the migration fails at any point, follow this rollback strategy:

### Before Starting (Mandatory)
1. **Full database backup:** `pg_dump -Fc registry > registry-pre-betterauth-$(date +%Y%m%d).dump`
2. **Git branch:** All changes on a dedicated `feat/better-auth-migration` branch. Never merge to `main` until fully tested.
3. **Environment backup:** Copy `.env` to `.env.backup` before changing any variables.

### Phase 1 Rollback (Config files only)
- `git checkout main` — no DB changes were made, old code works immediately.

### Phase 2 Rollback (Database migration)
- Restore from the pre-migration backup: `pg_restore -d registry registry-pre-betterauth-YYYYMMDD.dump`
- `git checkout main`
- Restore `.env.backup` → `.env`

### Phase 3-4 Rollback (Code changes)
- If Phase 2 succeeded but Phase 3/4 fails: the DB is in Better Auth format.
- Option A: Fix the code issues on the branch (preferred).
- Option B: Full rollback — restore DB backup + `git checkout main` + restore `.env.backup`.

### Communication Plan
- Schedule migration during low-usage hours (e.g., weekend night).
- Notify users: "Brief maintenance — you may need to sign in again."
- All ~32K sessions will be dropped; users must re-authenticate.

---

## Key Implementation Notes

### Better Auth Session Access (Server Components)
```ts
import { auth } from "@/core/auth";
import { headers } from "next/headers";

const session = await auth.api.getSession({ headers: await headers() });
```

### Better Auth Session Access (Client Components)
```ts
import { authClient } from "@/core/auth-client";

const { data: session, isPending } = authClient.useSession();
```

### Better Auth Sign-In (Server Action — recommended for GoogleSignInForm)
```ts
import { auth } from "@/core/auth";
import { redirect } from "next/navigation";
import { headers } from "next/headers";

async function handleSignIn() {
  "use server";
  const result = await auth.api.signInSocial({
    body: { provider: "google", callbackURL: "/dashboard" },
    headers: await headers(),
  });
  if (result.url) redirect(result.url);
}
```

> **Note:** `signInSocial` returns `{ url, redirect }`. Always check `result.url` and pass it to Next.js `redirect()`. The `headers` must be forwarded so Better Auth can set cookies correctly via the `nextCookies()` plugin.

### Better Auth Sign-Out (Client)
```ts
import { authClient } from "@/core/auth-client";
await authClient.signOut();
```

### Permission Check (Server)
```ts
await auth.api.userHasPermission({
  body: {
    userId: session.user.id,
    permissions: { student: ["print_card"] },
  },
});
```

### Permission Check (Client)
```ts
const { data } = await authClient.admin.hasPermission({
  permissions: { student: ["print_card"] },
});
```

---

## File Creation/Modification Summary

### New Files
| File | Purpose |
|------|---------|
| `src/proxy.ts` | Next.js 16 proxy for full session validation (replaces middleware) |
| `src/core/auth/permissions.ts` | Access control statements + role definitions |
| `src/core/auth/presets.ts` | Permission preset templates (replaces position) |
| `src/core/auth-client.ts` | Better Auth React client |
| `src/core/platform/withPermission.ts` | Replaces withAuth with permission-based checks |
| `src/app/auth/users/_schema/userPermissions.ts` | Per-user permission overrides table |
| `src/app/lms/_schema/lmsCredentials.ts` | LMS credentials (moved from user table) |
| `src/app/api/auth/[...all]/route.ts` | Better Auth route handler |


### Deleted Files
| File | Reason |
|------|--------|
| `next-auth.d.ts` | No longer needed |
| `src/core/platform/withAuth.ts` | Replaced by withPermission |
| `src/app/api/auth/[...nextauth]/route.ts` | Replaced by [...all] |
| `src/app/auth/auth-providers/_schema/authenticators.ts` | Not used by Better Auth |

### Modified Files (61 files with `next-auth` imports + additional)
See "Phase 2, Section 2.5" for the complete list.

---

## Data Volume & Risk Assessment
- **~12K users** — All preserved, IDs unchanged (nanoid format maintained via `advanced.database.generateId`)
- **~12K accounts** — Migrated to new format (provider/account_id mapping)
- **~32K sessions** — Dropped (users re-login; this is standard for auth migrations)
- **147 academic users with positions** — Migrated to permission presets in `user_permissions`
- **9 LMS-connected users** — `lmsUserId`/`lmsToken` migrated to `lms_credentials`
- **`accessToken`** — Dropped from session (unused — Google tokens still stored in Better Auth's account table)

---

## Migration Execution Order

### Phase 1: Foundation (config files, no DB changes yet)
1. Install `better-auth@latest` (pinned), remove `next-auth` + `@auth/drizzle-adapter`
2. Set environment variables (`BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `NEXT_PUBLIC_BETTER_AUTH_URL`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`)
3. Create `src/core/auth/permissions.ts` + `presets.ts`
4. Create `src/core/auth.ts` (Better Auth config)
5. Create `src/core/auth-client.ts`
6. Create `src/app/api/auth/[...all]/route.ts`
7. Create `src/proxy.ts` (Next.js 16 proxy with full session validation)

### Phase 2: Database Migration
8. Create new schema files (`user_permissions`, `lms_credentials`, updated auth schemas)
9. Run `pnpm db:generate` (generates Drizzle migration SQL)
10. Write custom data migration SQL (enum → text, accounts mapping, position → permissions, lms migration)
11. Run `pnpm db:migrate`
12. Run data migration script
13. Verify data integrity

### Phase 3: Authorization Layer Replacement
14. Create `src/core/platform/withPermission.ts`
15. Update `BaseService.ts` to use withPermission
16. Update all server actions (30+ files)
17. Update all client components (35+ files)
18. Update `providers.tsx` (remove SessionProvider)
19. Update login page + GoogleSignInForm

### Phase 4: Cleanup & Testing
20. Delete Auth.js artifacts (`next-auth.d.ts`, `withAuth.ts`, `[...nextauth]`, `authenticators.ts`)
21. Remove `next-auth`, `@auth/drizzle-adapter` from package.json
22. Test all auth flows (see Testing Checklist in Phase 4)
23. `pnpm tsc --noEmit && pnpm lint:fix`
