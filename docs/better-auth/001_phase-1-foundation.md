# Phase 1: Foundation

Status: maintain this phase document together with `better-auth-documentation.md`.

If this file conflicts with `better-auth-documentation.md`, use `better-auth-documentation.md` as the authoritative source.

## Essential Outcomes

- Replace Auth.js with Better Auth while keeping Google OAuth only.
- Keep database-backed sessions.
- Preserve the repo-owned authorization model using role defaults plus `user_permissions` overrides.
- Preserve existing user IDs and migrate existing Google-linked accounts.
- Remove session-time `stdNo` loading and fetch student identity on demand.
- Keep rollout phased and side-by-side until Better Auth is fully working.

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
  -> load user_permissions overrides
  -> merge defaults and overrides
  -> allow or reject
```

## 1.1 Install Dependencies

```bash
pnpm add better-auth@1.5.4 @better-auth/drizzle-adapter
pnpm remove next-auth @auth/drizzle-adapter
```

Use `better-auth/minimal` in the server implementation.

## 1.2 Update Next.js Config

Add `better-auth` to `serverExternalPackages` in `next.config.ts`.

## 1.3 Rename Environment Variables

Remove:

- `AUTH_SECRET`
- `AUTH_URL`
- `AUTH_GOOGLE_ID`
- `AUTH_GOOGLE_SECRET`

Add:

- `BETTER_AUTH_SECRET`
- `BETTER_AUTH_URL`
- `BETTER_AUTH_TRUSTED_ORIGINS`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`

Do not introduce `NEXT_PUBLIC_BETTER_AUTH_URL` unless the client and server are intentionally split across domains.

## 1.4 Create Better Auth Server Entry

Replace `src/core/auth.ts` with a Better Auth server using:

- `better-auth/minimal`
- `@better-auth/drizzle-adapter`
- Google social provider
- database sessions
- `nextCookies()`
- Better Auth admin plugin
- `additionalFields.role`
- trusted origins from environment variables

Keep the server entry focused on authentication and authorization wiring only. Do not include auth activity hooks, background-task wiring, or rate-limit configuration in this first plan.

## 1.5 Create Access Control Definitions

Create `src/core/auth/permissions.ts` with:

- resource-action statements for the app's owned authorization model
- role defaults mapped onto those statements
- exports consumed by Better Auth admin plugin and repo authorization checks

The goal here is parity with the existing authorization surface, not a redesign beyond what is required for migration.

## 1.6 Create Better Auth Client Entry

Create `src/core/auth-client.ts` with:

- `createAuthClient`
- plugin support for admin APIs
- full typing for the custom `role` field

Keep the client focused on session access plus the permission APIs needed by existing UI flows.

## 1.7 Add Route Handler And Proxy

Create:

- `src/app/api/auth/[...all]/route.ts`
- `proxy.ts`

Use the proxy only for optimistic route protection. Real access checks remain inside pages, route handlers, and server actions.

## Exit Criteria

- Better Auth packages are installed and Auth.js packages are removed.
- Better Auth env names are defined.
- `src/core/auth.ts` and `src/core/auth-client.ts` exist.
- Access control definitions exist.
- Auth route and proxy exist.
- No nonessential hardening work is bundled into this phase.
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

## 1.5 Permission Presets (replaces `position`)

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

## 1.6 User Permissions Table

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

## 1.7 LMS Credentials Table

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

## 1.8 Create Auth Client

File: `src/core/auth-client.ts`

```ts
import { createAuthClient } from "better-auth/react";
import { adminClient } from "better-auth/client/plugins";
import type { auth } from "@/core/auth";
import { ac, roles } from "@/core/auth/permissions";

export const authClient = createAuthClient<typeof auth>({
  plugins: [
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

## 1.9 Update Route Handler

Rename: `src/app/api/auth/[...nextauth]/` → `src/app/api/auth/[...all]/`

File: `src/app/api/auth/[...all]/route.ts`

```ts
import { auth } from "@/core/auth";
import { toNextJsHandler } from "better-auth/next-js";
export const { POST, GET } = toNextJsHandler(auth);
```

## 1.10 Add Next.js 16 Proxy (NOT Middleware)

**IMPORTANT**: This file MUST be at the project root (same level as `next.config.ts`), NOT inside `src/`.

File: `proxy.ts` (project root)

```ts
import { NextRequest, NextResponse } from "next/server";
import { getCookieCache } from "better-auth/cookies";

export async function proxy(request: NextRequest) {
  const session = await getCookieCache(request);

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

> **Why `getCookieCache`?** Better Auth docs state: proxy/middleware is for
> "optimistic redirects" only. Unlike `getSessionCookie()` (which only checks
> cookie existence and can be faked), `getCookieCache()` **decodes and verifies
> the signed cookie cache** without hitting the DB. This validates the HMAC
> signature and checks expiry — much stronger than an existence check, while
> still being fast (no DB round-trip). Real security enforcement still happens
> in `withPermission()` at the server action/page level via `auth.api.getSession()`.
```
