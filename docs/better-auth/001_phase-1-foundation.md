# Phase 1: Foundation (Better Auth Core + DB Migration)

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
| Route protection | Next.js 16 proxy (cookie-only check via `getSessionCookie()`, real validation in pages/routes) |

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

## 1.1 Install Dependencies
```
pnpm add better-auth@latest @vercel/functions
pnpm remove next-auth @auth/drizzle-adapter
```

Pin the version in `package.json` (remove `^` prefix) to prevent unexpected breaking changes.

## 1.1b Update `next.config.ts`

Add `better-auth` to `serverExternalPackages` to prevent bundler-level resolution issues (recommended by Better Auth FAQ):

```ts
const nextConfig: NextConfig = {
  serverExternalPackages: ['better-auth'],
  // ... rest of existing config
};
```

## 1.2 Environment Variables

Remove:
- `AUTH_SECRET`
- `AUTH_URL`
- `AUTH_GOOGLE_ID`
- `AUTH_GOOGLE_SECRET`

Add:
- `BETTER_AUTH_SECRET` (32+ chars: `openssl rand -base64 32`)
- `BETTER_AUTH_URL` (e.g., `http://localhost:3000`)
- `NEXT_PUBLIC_BETTER_AUTH_URL` (same value — needed for client-side auth requests)
- `GOOGLE_CLIENT_ID` (same value as old AUTH_GOOGLE_ID)
- `GOOGLE_CLIENT_SECRET` (same value as old AUTH_GOOGLE_SECRET)

## 1.3 Create Better Auth Server Instance

File: `src/core/auth.ts` (replace entirely)

```ts
import { betterAuth } from "better-auth/minimal";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin } from "better-auth/plugins/admin";
import { nextCookies } from "better-auth/next-js";
import { nanoid } from "nanoid";
import { waitUntil } from "@vercel/functions";
import { db } from "@/core/database";
import { ac, roles } from "@/core/auth/permissions";
import { logActivity } from "@audit-logs/activity-logs/_server/actions";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    usePlural: true,
  }),
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      prompt: "select_account",
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60,
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
    backgroundTasks: {
      handler: waitUntil,
    },
  },
  databaseHooks: {
    session: {
      create: {
        after: async (session) => {
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
          await logActivity({
            userId: user.id,
            type: "auth:user_update",
          }).catch(() => {});
        },
      },
    },
  },
  plugins: [
    admin({
      ac,
      roles,
      defaultRole: "user",
    }),
    nextCookies(),
  ],
});

export type Session = typeof auth.$Infer.Session;
```

## 1.4 Create Access Control Definitions

File: `src/core/auth/permissions.ts`

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
import { ac, roles } from "@/core/auth/permissions";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL,
  plugins: [
    adminClient({ ac, roles }),
  ],
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
  ],
};
```

> **Why cookie-only?** Better Auth docs explicitly state: proxy/middleware is for
> "optimistic redirects" only. The `getSessionCookie()` check is fast (no DB hit)
> and prevents unauthenticated users from seeing protected pages. Real security
> enforcement happens in `withPermission()` at the server action/page level,
> which calls `auth.api.getSession()` with full DB validation.
```
