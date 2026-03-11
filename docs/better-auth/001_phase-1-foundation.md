# Phase 1: Foundation

Status: maintain this phase document together with `better-auth-documentation.md`.

If this file conflicts with `better-auth-documentation.md`, use `better-auth-documentation.md` as the authoritative source.

## Essential Outcomes

- Install Better Auth alongside Auth.js (both coexist).
- Create all Better Auth config files, schema files, and proxy.
- Do NOT swap the auth route handler yet (that happens at the end of Phase 2 after DB is ready).
- Preserve existing user IDs using `nanoid()` for ID generation.

## Decisions Summary

| Decision | Choice |
|----------|--------|
| Auth provider | Google OAuth only |
| Session strategy | Database sessions |
| Authorization | Better Auth admin plugin + repo-owned permission layer |
| Permission storage | `user_permissions` table |
| User custom fields | Keep only `role` on Better Auth user |
| Student identity access | Fetch on demand, not from session |
| Migration style | Side-by-side schema and code migration |
| Env migration | Move to Better Auth env names |
| Better Auth version | Pin to `1.5.4` during migration |
| ID generation | Keep `nanoid()` for consistency with existing user IDs |

## Access Model

Permission resolution order:

```text
1. Role defaults from Better Auth access control
2. Permission presets written into user_permissions
3. Per-user grant/revoke overrides from user_permissions
```

Request flow:

```text
Request -> Better Auth session lookup -> withPermission(...)
  -> load session role
  -> load user_permissions overrides (React cache() deduped per request)
  -> merge defaults and overrides
  -> allow or reject
```

## 1.1 Install Dependencies

```bash
pnpm add better-auth@1.5.4 @better-auth/drizzle-adapter
```

Do NOT remove `next-auth` or `@auth/drizzle-adapter` yet. Both auth systems must coexist until Phase 4 cleanup. Removing Auth.js packages now would break 60+ files that still import from `next-auth`.

Use `better-auth/minimal` in the server implementation. Import the adapter from `better-auth/adapters/drizzle` (not from `@better-auth/drizzle-adapter` directly).

## 1.2 Update Next.js Config

Add `better-auth` to `serverExternalPackages` in `next.config.ts`. Do NOT remove `authInterrupts: true` yet (that happens in Phase 2 when the route handler swaps).

## 1.3 Add Environment Variables

Add these alongside existing Auth.js env vars (both coexist during migration):

- `BETTER_AUTH_SECRET`
- `BETTER_AUTH_URL`
- `BETTER_AUTH_TRUSTED_ORIGINS`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`

Do not introduce `NEXT_PUBLIC_BETTER_AUTH_URL` unless the client and server are intentionally split across domains.

Do not remove Auth.js env vars yet (`AUTH_SECRET`, `AUTH_URL`, etc.). They stay until Phase 4 cleanup.

## 1.4 Create Better Auth Server Entry

Create a NEW `src/core/auth.ts` with Better Auth server config. Keep the old Auth.js `auth.ts` content available (e.g., renamed to `auth.legacy.ts`) until the route handler swap in Phase 2.

The server entry uses:

- `better-auth/minimal`
- `better-auth/adapters/drizzle`
- Google social provider
- database sessions
- `nextCookies()` (last in plugin array)
- Better Auth admin plugin
- `additionalFields.role`
- trusted origins from environment variables
- `nanoid()` for ID generation (preserves existing ID format)
- rate limiting with `storage: 'database'`

## 1.5 Create Access Control Definitions

Create `src/core/auth/permissions.ts` with:

- resource-action statements for the app's owned authorization model
- role defaults mapped onto those statements
- exports consumed by Better Auth admin plugin and repo authorization checks

The goal here is parity with the existing authorization surface, not a redesign beyond what is required for migration.

Reference role definitions:

```ts
import { createAccessControl } from "better-auth/plugins/access";
import { adminAc } from "better-auth/plugins";

const statements = {
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
  human_resource: ac.newRole({
    student: ["view"],
    report: ["view"],
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

## 1.6 Create Permission Presets (replaces `position`)

File: `src/core/auth/presets.ts`

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

## 1.7 Create New Schema Files

### User Permissions Table

File: `src/app/auth/users/_schema/userPermissions.ts`

```ts
export const userPermissions = pgTable("user_permissions", {
  id: serial().primaryKey(),
  userId: text().notNull().references(() => user.id, { onDelete: "cascade" }),
  resource: text().notNull(),
  action: text().notNull(),
  granted: boolean().notNull(),
  createdAt: timestamp({ mode: "date" }).defaultNow().notNull(),
  createdBy: text().references(() => user.id, { onDelete: "set null" }),
}, (t) => ({
  userResourceAction: unique().on(t.userId, t.resource, t.action),
  userIdx: index("user_permissions_user_idx").on(t.userId),
}));
```

### LMS Credentials Table

File: `src/app/lms/_schema/lmsCredentials.ts`

```ts
export const lmsCredentials = pgTable("lms_credentials", {
  id: serial().primaryKey(),
  userId: text().notNull().unique().references(() => user.id, { onDelete: "cascade" }),
  lmsUserId: integer().notNull(),
  lmsToken: text(),
  updatedAt: timestamp({ mode: "date" }).defaultNow().$onUpdate(() => new Date()).notNull(),
});
```

### Rate Limits Table

File: `src/app/auth/auth-providers/_schema/rateLimits.ts`

```ts
export const rateLimits = pgTable('rate_limits', {
  id: text().primaryKey(),
  key: text().notNull(),
  count: integer().notNull(),
  lastRequest: bigint({ mode: 'number' }).notNull(),
}, (t) => ({
  keyIdx: uniqueIndex('rate_limits_key_idx').on(t.key),
}));
```

## 1.8 Update Barrel Exports

Each new schema file must be re-exported from its module's `_database/index.ts` barrel:

- Add `userPermissions` to `src/app/auth/_database/index.ts`
- Add `lmsCredentials` to `src/app/lms/_database/index.ts`
- Add `rateLimits` to `src/app/auth/_database/index.ts`

These will be picked up by `src/core/database/index.ts` schema aggregation in Phase 2.

## 1.9 Create Auth Client

File: `src/core/auth-client.ts`

```ts
import { createAuthClient } from "better-auth/react";
import { adminClient, inferAdditionalFields } from "better-auth/client/plugins";
import type { auth } from "@/core/auth";
import { ac, roles } from "@/core/auth/permissions";

export const authClient = createAuthClient({
  plugins: [
    inferAdditionalFields<typeof auth>(),
    adminClient({ ac, roles }),
  ],
  fetchOptions: {
    onError: async (context) => {
      const { response } = context;
      if (response.status === 429) {
        const retryAfter = response.headers.get("X-Retry-After");
        console.warn(`Rate limit exceeded. Retry after ${retryAfter} seconds`);
      }
    },
  },
});

export const { signIn, signUp, signOut, useSession } = authClient;
```

Important: Use `inferAdditionalFields<typeof auth>()` plugin for client-side type inference of the custom `role` field. Do NOT use `createAuthClient<typeof auth>()` type parameter — that is not the documented approach.

## 1.10 Add Next.js 16 Proxy

**IMPORTANT**: This file MUST be at the project root (same level as `next.config.ts`), NOT inside `src/`.

File: `proxy.ts` (project root)

```ts
import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

export async function proxy(request: NextRequest) {
  const sessionCookie = getSessionCookie(request);

  if (!sessionCookie) {
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
    "/apply/:path*",
  ],
};
```

The proxy uses `getSessionCookie()` for optimistic cookie existence checks only. This is NOT a security layer — it is the documented Next.js 16 proxy pattern. Real session validation and authorization happen in `withPermission()` at the page/action level via `auth.api.getSession()`.

## Exit Criteria

- Better Auth packages are installed alongside existing Auth.js packages (both coexist).
- Better Auth env vars are defined alongside existing Auth.js env vars.
- `src/core/auth.ts` exists with Better Auth server config (old content preserved as `auth.legacy.ts`).
- `src/core/auth-client.ts` exists with `inferAdditionalFields<typeof auth>()`.
- `src/core/auth/permissions.ts` and `src/core/auth/presets.ts` exist.
- New schema files created: `userPermissions`, `lmsCredentials`, `rateLimits`.
- Barrel exports updated for all new schemas.
- `proxy.ts` exists at project root with `/apply/:path*` in matcher.
- Auth route handler is NOT yet swapped (still `[...nextauth]`).
- No nonessential hardening work is bundled into this phase.
