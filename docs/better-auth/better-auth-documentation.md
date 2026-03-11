# Better Auth 1.5.4 Steering Documentation

## Purpose

This file is the authoritative Better Auth migration and implementation reference for this repository.

Use this file as the main steering document for every Better Auth change.

If any item in `001_phase-1-foundation.md`, `002_phase-2-database-migration.md`, `003_phase-3-authorization-layer-replacement.md`, or `004_phase-4-cleanup-and-testing.md` conflicts with this file, this file wins.

This document is based only on Better Auth public documentation and changelog content from `better-auth.com`, reviewed on 2026-03-11.

## Version Baseline

- Latest public release on Better Auth changelog at review time: `v1.5.4`.
- Release note called out for `v1.5.4`: adapter packages moved to dependencies to fix missing module errors.
- Major 1.5 changes relevant to this repo: new `npx auth` CLI, extracted adapter packages, unified hooks, documented background tasks, dynamic base URL support, stricter rate-limit defaults for auth flows, non-destructive secret rotation, updated session APIs.

## Official Better Auth Sources Used

- `https://better-auth.com/changelog`
- `https://better-auth.com/llms.txt`
- `https://better-auth.com/docs/introduction`
- `https://better-auth.com/docs/installation`
- `https://better-auth.com/docs/basic-usage`
- `https://better-auth.com/docs/integrations/next`
- `https://better-auth.com/docs/adapters/drizzle`
- `https://better-auth.com/docs/concepts/database`
- `https://better-auth.com/docs/concepts/session-management`
- `https://better-auth.com/docs/concepts/hooks`
- `https://better-auth.com/docs/concepts/cli`
- `https://better-auth.com/docs/concepts/typescript`
- `https://better-auth.com/docs/reference/options`
- `https://better-auth.com/docs/authentication/google`
- `https://better-auth.com/docs/plugins/admin`
- `https://better-auth.com/docs/plugins/organization`
- `https://better-auth.com/docs/guides/optimizing-for-performance`
- `https://better-auth.com/docs/guides/next-auth-migration-guide`

## Repo Reality Check

The current repo still uses Auth.js.

- Current server auth entrypoint: `src/core/auth.ts`
- Current route handler: `src/app/api/auth/[...nextauth]/route.ts`
- Current client session provider: `src/app/providers.tsx`
- Current authorization wrapper: `src/core/platform/withAuth.ts`
- Current auth dependency state in `package.json`: `next-auth` and `@auth/drizzle-adapter` are still installed, Better Auth is not yet installed.
- Current Next.js config does not yet include `serverExternalPackages: ['better-auth']`.
- Current auth callback performs two extra queries during session creation and refresh:
  - student lookup for `stdNo`
  - account lookup for access token

That current callback behavior matters because Better Auth migration should remove session-time database round-trips wherever possible.

## Steering Rules For This Repository

- Keep the migration side-by-side until the Better Auth path is fully working.
- Preserve existing user IDs unless a deliberate migration step says otherwise.
- Use Better Auth database-backed sessions, not stateless sessions, for this app.
- Use Better Auth as the authentication system and keep authorization logic repo-owned.
- Treat Better Auth admin access control as role defaults, not as the complete replacement for repo-specific per-user overrides.
- Keep `stdNo` out of the session payload and fetch student identity on demand.
- Prefer one session lookup and one permission lookup per request over repeated DB queries.
- Keep Better Auth route protection optimistic in `proxy.ts` and perform real authorization inside pages, route handlers, and server actions.
- Use documented Better Auth APIs only. Do not rely on older `@better-auth/cli` guidance.

## What Changed Since The Existing Plan Was Written

The existing phase docs are directionally correct, but several items are stale or incomplete against current Better Auth documentation.

- The current CLI is `npx auth@latest`, not `npx @better-auth/cli@latest`.
- Better Auth 1.5 extracted adapters into their own packages. The main package still re-exports adapters, but explicit adapter installation is now part of the public guidance.
- `advanced.backgroundTasks` is now officially documented.
- Better Auth hooks now explicitly support `ctx.context.runInBackground` and `ctx.context.runInBackgroundOrAwait`.
- Database `after` hooks run after transaction commit in 1.5, not inside the transaction.
- Secret rotation is now documented through `secrets` and `BETTER_AUTH_SECRETS`.
- Dynamic base URL is now a documented feature, though it is optional for this repo.
- Better Auth now documents stronger performance guidance around joins, cookie cache, indexes, and SSR session prefetch.
- The official Auth.js migration guide now clearly documents model differences and session API replacements.

## Canonical Repo Architecture

### 1. Package Baseline

For this repo, the package baseline should be:

```bash
pnpm add better-auth@1.5.4 @better-auth/drizzle-adapter @vercel/functions
pnpm remove next-auth @auth/drizzle-adapter
```

Rationale:

- `better-auth@1.5.4` pins the version this document targets.
- `@better-auth/drizzle-adapter` aligns with current adapter extraction guidance.
- `@vercel/functions` is needed if we use Vercel `waitUntil` for deferred work outside of Better Auth hook helpers.

## 2. Required Top-Level Files

The Better Auth file layout for this repo should be:

- `src/core/auth.ts`
- `src/core/auth-client.ts`
- `src/core/auth/permissions.ts`
- `src/app/api/auth/[...all]/route.ts`
- `proxy.ts`

The legacy Auth.js route should be removed only after Better Auth is functioning end to end.

## 3. Canonical Server Auth Shape

Use `better-auth/minimal` because this app uses Drizzle and wants smaller bundles.

Use the Drizzle adapter.

Use explicit `baseURL` behavior through `BETTER_AUTH_URL`.

Use `nextCookies()` and keep it last in the plugin array.

Use `experimental: { joins: true }` only after relations are fully wired and exported through the adapter schema.

Recommended structure:

```ts
import { betterAuth } from 'better-auth/minimal';
import { drizzleAdapter } from '@better-auth/drizzle-adapter';
import { nextCookies } from 'better-auth/next-js';
import { admin } from 'better-auth/plugins';
import { db, schema } from '@/core/database';
import { ac, roles } from '@/core/auth/permissions';

export const auth = betterAuth({
	baseURL: process.env.BETTER_AUTH_URL,
	database: drizzleAdapter(db, {
		provider: 'pg',
		usePlural: true,
		schema,
	}),
	trustedOrigins: [
		process.env.BETTER_AUTH_URL!,
		...(process.env.BETTER_AUTH_TRUSTED_ORIGINS?.split(',').map((origin) => origin.trim()) ?? []),
	],
	user: {
		additionalFields: {
			role: {
				type: [
					'user',
					'applicant',
					'student',
					'finance',
					'registry',
					'library',
					'academic',
					'marketing',
					'student_services',
					'resource',
					'leap',
					'admin',
				],
				required: false,
				defaultValue: 'user',
				input: false,
			},
		},
	},
	session: {
		expiresIn: 60 * 60 * 24 * 7,
		updateAge: 60 * 60 * 24,
		freshAge: 60 * 5,
		cookieCache: {
			enabled: true,
			maxAge: 60 * 5,
			strategy: 'compact',
			version: '1',
		},
	},
	account: {
		encryptOAuthTokens: true,
		updateAccountOnSignIn: true,
		accountLinking: {
			enabled: true,
			trustedProviders: ['google'],
		},
	},
	rateLimit: {
		enabled: true,
		storage: 'database',
		window: 60,
		max: 100,
		customRules: {
			'/sign-in/social': {
				window: 10,
				max: 3,
			},
		},
	},
	experimental: {
		joins: true,
	},
	advanced: {
		useSecureCookies: process.env.NODE_ENV === 'production',
		database: {
			generateId: () => crypto.randomUUID(),
		},
	},
	socialProviders: {
		google: {
			clientId: process.env.GOOGLE_CLIENT_ID!,
			clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
			prompt: 'select_account',
		},
	},
	plugins: [
		admin({
			ac,
			roles,
			defaultRole: 'user',
		}),
		nextCookies(),
	],
});

export type Session = typeof auth.$Infer.Session;
```

## 4. Canonical Client Auth Shape

For a Next.js React app, use the React client creator and add the plugins needed for type-safe custom fields and admin APIs.

Recommended shape:

```ts
import { createAuthClient } from 'better-auth/react';
import { adminClient, inferAdditionalFields } from 'better-auth/client/plugins';
import type { auth } from '@/core/auth';
import { ac, roles } from '@/core/auth/permissions';

export const authClient = createAuthClient({
	plugins: [
		inferAdditionalFields<typeof auth>(),
		adminClient({
			ac,
			roles,
		}),
	],
});
```

Notes:

- Better Auth docs show both `better-auth/react` and `better-auth/client` examples. For this repo, use the React client creator because the app is Next.js with client hooks.
- Keep client typing driven by server auth types whenever possible.
- Use `inferAdditionalFields<typeof auth>()` so the custom `role` field is typed on the client.

## 5. Canonical Route Handler

The official Better Auth route shape for this repo is:

```ts
import { toNextJsHandler } from 'better-auth/next-js';
import { auth } from '@/core/auth';

export const { GET, POST } = toNextJsHandler(auth);
```

The path should be `src/app/api/auth/[...all]/route.ts`.

The old `src/app/api/auth/[...nextauth]/route.ts` path should be deleted after cutover.

## 6. Canonical Next.js Protection Model

Current Better Auth guidance for Next.js 16 is:

- Use `proxy.ts` for optimistic redirects only.
- Do real session validation in pages, route handlers, and server actions.
- Do not treat proxy as the final security layer.

Recommended proxy strategy for this repo:

```ts
import { NextRequest, NextResponse } from 'next/server';
import { getCookieCache } from 'better-auth/cookies';

export async function proxy(request: NextRequest) {
	const session = await getCookieCache(request);

	if (!session) {
		return NextResponse.redirect(new URL('/auth/login', request.url));
	}

	return NextResponse.next();
}
```

Important:

- `getSessionCookie()` only checks cookie existence and is not sufficient for security.
- `getCookieCache()` is stronger than a raw cookie existence check, but this still does not replace server-side authorization.
- Every protected page and action must validate the session again through `auth.api.getSession({ headers: await headers() })` or through the repo-owned permission wrapper.

## 7. Session Access Rules

Use these patterns consistently.

Server:

```ts
import { headers } from 'next/headers';
import { auth } from '@/core/auth';

const session = await auth.api.getSession({
	headers: await headers(),
});
```

Client:

```ts
import { authClient } from '@/core/auth-client';

const { data: session, isPending, error } = authClient.useSession();
```

Do not keep Auth.js-style session augmentation behavior where every session fetch triggers additional database reads for student data or account tokens.

## 8. Session Payload Rules For This Repo

Do keep in session:

- user id
- role
- core Better Auth session fields

Do not keep in session:

- `stdNo`
- LMS access token convenience copies
- ad hoc cross-module derived data

Reason:

- Better Auth cookie cache works best with small, stable session payloads.
- Custom session enrichment runs on every fetch and bypasses the performance benefit of simple session reads.
- The current Auth.js callback already shows the cost of session-time DB lookups.

## 9. Student Identity Strategy

The repo should replace `session.user.stdNo` access with an on-demand server action.

Recommended direction:

- Keep `students.userId` as the source of truth.
- Add `getStudentByUserId(userId)` in the student module.
- Update student portal and shared hooks to use that action through TanStack Query.

This change is mandatory for performance and separation of concerns.

## 10. Role And Permission Strategy

### What Better Auth Documents

The admin plugin supports:

- built-in user and session admin permissions
- custom access control via `createAccessControl`
- role-based permission checks through `hasPermission`, `userHasPermission`, and `checkRolePermission`
- optional multiple roles stored as comma-separated values

### What This Repo Needs Beyond Better Auth

This repo needs more than static role definitions.

The current migration plan includes a custom `user_permissions` table for:

- preset-based grants
- per-user overrides
- grant and revoke semantics separate from the base role

That custom table is not a built-in Better Auth feature.

Steering decision:

- Keep Better Auth admin access control for role defaults.
- Keep repo-owned `user_permissions` for per-user overrides.
- Build `withPermission` to merge the two layers.

Target evaluation order:

1. Better Auth role defaults
2. repo preset expansion into `user_permissions`
3. repo per-user grant rows
4. repo per-user revoke rows

## 11. `withPermission` Contract

The Better Auth side gives authentication and role defaults.

The repo side still needs a wrapper that:

- gets the session through Better Auth
- allows `'all'`
- allows `'auth'`
- accepts permission requirements
- bypasses checks for `admin` if that remains the repo rule
- caches the merged permission set per request

The current plan to use React `cache()` for per-request permission deduplication remains valid and should be kept.

## 12. Google OAuth Rules

Documented Better Auth Google requirements:

- `BETTER_AUTH_URL` or explicit `baseURL` must be set to avoid callback URL mismatch.
- Local callback URI is `http://localhost:3000/api/auth/callback/google`.
- Production callback URI is `https://your-domain/api/auth/callback/google`.
- `prompt: 'select_account'` always shows the account picker.
- If refresh tokens are required consistently, use `accessType: 'offline'` and `prompt: 'select_account consent'`.

Steering decision for this repo:

- Baseline sign-in flow uses `prompt: 'select_account'`.
- Do not request offline access unless a feature explicitly needs Google refresh tokens.
- If LMS or future Google integrations need broader scopes, request them later with `linkSocial` instead of bloating initial auth scope.

## 13. Environment Variable Contract

Required baseline variables:

- `BETTER_AUTH_SECRET`
- `BETTER_AUTH_URL`
- `BETTER_AUTH_TRUSTED_ORIGINS`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`

Recommended rotation-ready variables:

- `BETTER_AUTH_SECRETS`

Steering decisions:

- Use `BETTER_AUTH_URL` explicitly even though Better Auth can infer from requests.
- Keep `BETTER_AUTH_TRUSTED_ORIGINS` explicit instead of depending entirely on inference.
- Do not add `NEXT_PUBLIC_BETTER_AUTH_URL` unless the client is on a different origin.
- Plan for secret rotation with `BETTER_AUTH_SECRETS` even if the first rollout starts with a single secret.

## 14. Trusted Origins And Preview Deployments

Better Auth now documents wildcard trusted origins and dynamic trusted origin functions.

For this repo, a static env-driven list is the simplest initial implementation.

Acceptable examples:

- `http://localhost:3000`
- `https://*.vercel.app`
- `https://registry.example.com`

If preview domain logic becomes more complex, Better Auth also documents a function form for `trustedOrigins`.

## 15. Cookie Cache Strategy

Better Auth documents three cookie cache strategies:

- `compact`
- `jwt`
- `jwe`

Steering decision:

- Use `compact` for this repo.

Why:

- smallest cookie size
- best fit for internal-only session validation
- best performance default according to the docs

Caveats:

- Revoked sessions can remain usable on another device until cookie cache expires.
- For sensitive actions, either shorten cache lifetime or force a DB-backed session fetch with `disableCookieCache: true`.

## 16. Session Freshness Strategy

Better Auth documents `freshAge` and uses it for sensitive endpoints.

Steering decision:

- Keep `freshAge: 300`.

That gives a short re-auth freshness window without being overly aggressive.

## 17. Session Refresh Strategy

Documented options now include:

- default refresh behavior
- `disableSessionRefresh`
- `deferSessionRefresh`

Steering decision:

- Keep default refresh behavior initially.
- Consider `deferSessionRefresh: true` later if read-replica routing is introduced.

## 18. Database Schema Mapping From Auth.js

The official Better Auth migration guide confirms these model differences.

User table:

- `emailVerified` becomes boolean in Better Auth.
- `name`, `email`, and `emailVerified` are treated as required in Better Auth.
- `createdAt` and `updatedAt` are part of the Better Auth core schema.

Session table:

- `sessionToken` becomes `token`.
- `expires` becomes `expiresAt`.
- `ipAddress`, `userAgent`, `createdAt`, and `updatedAt` are part of the Better Auth model.

Account table:

- `provider` becomes `providerId`.
- `providerAccountId` becomes `accountId`.
- `type`, `token_type`, and `session_state` are not part of Better Auth core account semantics.
- Better Auth adds `accessTokenExpiresAt`, `refreshTokenExpiresAt`, `createdAt`, and `updatedAt`.

Verification table:

- `verification_tokens` becomes `verifications`.
- composite key becomes single `id` primary key.
- `token` becomes `value`.
- `expires` becomes `expiresAt`.
- `createdAt` and `updatedAt` are added.

## 19. Additional Fields Strategy

Better Auth documents `additionalFields` on `user` and `session`.

For this repo:

- Keep only `role` as a Better Auth `user.additionalFields` field.
- Do not move LMS credentials into Better Auth `additionalFields`.
- Do not use `session.additionalFields` for `stdNo`.

The current plan to move LMS secrets into a separate `lms_credentials` table remains the right direction.

## 20. Multi-Role Caveat

The admin plugin supports multiple roles, stored as comma-separated strings.

This repo currently behaves like a single-role system with additional override concepts.

Steering decision:

- Keep the operational model single-role-first during migration.
- Do not expand to multi-role UI behavior during the initial Better Auth migration.
- If multiple roles are ever enabled later, treat that as a separate feature and revisit `withPermission` merge logic.

## 21. Drizzle Adapter Rules

Documented Better Auth Drizzle requirements:

- install the Drizzle adapter package
- use `provider: 'pg'`
- use `usePlural: true` if tables are plural
- define relations for experimental joins
- pass the relations through the adapter `schema` object

This repo must ensure that:

- auth tables and auth relations are all exported from the relevant auth `_database` barrels
- `@/core/database` exports the full schema object used by Better Auth
- relations are not omitted from that schema object

If relations are missing, `experimental.joins` silently falls back to multiple queries.

## 22. Indexes Required For Performance

The Better Auth performance guide explicitly recommends indexing:

- `users.email`
- `accounts.userId`
- `sessions.userId`
- `sessions.token`
- `verifications.identifier`

For this repo, also create the unique index on the rate limit key if `storage: 'database'` is used.

## 23. Rate Limiting Strategy

Better Auth documents:

- `enabled`
- `window`
- `max`
- `customRules`
- `storage`
- `modelName`

Important 1.5 details:

- default behavior is `true` in production and `false` in development
- 1.5 hardened auth flow defaults
- database and secondary storage are both valid storage backends

Steering decision:

- Set `enabled: true` explicitly.
- Use `storage: 'database'` for this rollout.
- Create the rate limit table manually through Drizzle migration flow.
- Add a strict custom rule for `/sign-in/social`.

## 24. Rate Limit Table Requirement

If using database-backed rate limiting, the repo must own the table creation.

The current phase plan is correct that a table is required.

Use the Better Auth rate limit model name consistently. The options reference documents the default model name as `rateLimit`, while the existing plan uses a physical table name `rate_limit` through SQL naming.

Steering decision:

- Keep the physical database table in snake case according to repo conventions.
- Map model naming consistently through Drizzle schema if needed.

## 25. Background Tasks And Hooks

This area needs special care because the public docs changed.

What Better Auth now documents:

- `advanced.backgroundTasks.handler`
- `ctx.context.runInBackground`
- `ctx.context.runInBackgroundOrAwait`

What Better Auth also documents in 1.5 developer changes:

- database `after` hooks now run after transaction commit

Steering decision:

- Use Better Auth request hooks with `advanced.backgroundTasks` when you need deferred work tied to request lifecycle.
- Do not assume request hook helpers are available inside `databaseHooks`.
- If activity logging is tied to auth endpoints, prefer request hooks when possible.
- If activity logging remains in `databaseHooks`, treat those as post-commit side effects and keep them lightweight.

For Vercel, the documented Better Auth way to defer hook work is:

```ts
import { betterAuth } from 'better-auth';
import { waitUntil } from '@vercel/functions';

export const auth = betterAuth({
	advanced: {
		backgroundTasks: {
			handler: waitUntil,
		},
	},
});
```

## 26. Secret Rotation Strategy

Better Auth 1.5 documents non-destructive rotation through `secrets` and `BETTER_AUTH_SECRETS`.

Steering decision:

- Initial rollout may use `BETTER_AUTH_SECRET` only.
- Production documentation must include the future rotation format.
- Secret rotation should not require forced logout if migrated using documented versioned secrets.

## 27. Auth.js To Better Auth API Replacement Map

Use this map during code migration.

Client sign in:

- Auth.js: `signIn('google')`
- Better Auth: `authClient.signIn.social({ provider: 'google' })`

Client sign out:

- Auth.js: `signOut()`
- Better Auth: `authClient.signOut()`

Client session hook:

- Auth.js: `useSession()`
- Better Auth: `authClient.useSession()`

Client session fetch:

- Auth.js: session provider or `getSession`
- Better Auth: `authClient.getSession()`

Server session fetch:

- Auth.js: `auth()`
- Better Auth: `auth.api.getSession({ headers: await headers() })`

Route handler:

- Auth.js: `handlers`
- Better Auth: `toNextJsHandler(auth)`

## 28. Current Repo Migration Inventory

The high-risk repo areas are already visible from current code search.

Server side:

- `src/core/auth.ts`
- `src/core/platform/withAuth.ts`
- `src/core/platform/BaseService.ts`
- many module services calling `withAuth`

Client side:

- `src/app/providers.tsx`
- dashboard and student portal session consumers
- shared hooks using `next-auth/react`
- UI components importing `useSession` and `signOut`

Routing:

- `src/app/api/auth/[...nextauth]/route.ts`

This means migration sequencing must preserve compile safety while both paths exist temporarily.

## 29. Recommended Sequencing

Use this sequence.

1. Install Better Auth packages and remove Auth.js packages only when code changes for route handling and providers are ready.
2. Create `src/core/auth/permissions.ts`.
3. Create `src/core/auth-client.ts`.
4. Replace `src/core/auth.ts`.
5. Add `src/app/api/auth/[...all]/route.ts`.
6. Add `proxy.ts`.
7. Update database schema files and relations.
8. Generate Drizzle migration assets.
9. Apply custom migration logic for schema conversion and data migration.
10. Create `withPermission`.
11. Move `BaseService` and server actions to Better Auth session access.
12. Remove `SessionProvider` and client Auth.js calls.
13. Replace `stdNo` session access with on-demand student lookup.
14. Delete the old Auth.js route and types.

## 30. CLI Rules

Use the documented CLI form:

```bash
npx auth@latest generate
```

Do not use the old `@better-auth/cli` commands in new documentation.

For Drizzle:

- Better Auth generates schema artifacts.
- Drizzle owns actual migration generation and application.

The docs also note CLI resolution issues with import aliases.

Steering decision:

- If the Better Auth CLI cannot resolve alias-heavy config, use a minimal temporary config or relative-import-safe entry while generating schema.
- Do not let CLI limitations force architecture changes in runtime code.

## 31. Next.js Config Rule

The existing phase plan includes `serverExternalPackages: ['better-auth']`.

Keep that change for this repo.

Recommended shape:

```ts
const nextConfig = {
	serverExternalPackages: ['better-auth'],
};
```

Even though that exact snippet was not pulled from the pages above, it remains aligned with Better Auth bundling concerns and the repo plan.

## 32. Better Auth Features We Are Not Adopting In Phase One

Do not scope-creep the migration with these unless the feature is explicitly requested.

- organizations
- dynamic organization access control
- teams
- email and password auth
- passkeys
- 2FA
- stateless sessions
- secondary storage session backend
- infrastructure plugins

These are documented, but not required for replacing the current Auth.js Google flow.

## 33. Known Ambiguities To Handle Carefully

There are a few places where Better Auth docs show multiple valid patterns.

Client creator import:

- React docs use `better-auth/react`.
- Some generic/plugin docs use `better-auth/client`.

Adapter import:

- adapter docs show `better-auth/adapters/drizzle`
- 1.5 changelog highlights extracted packages like `@better-auth/drizzle-adapter`

Steering resolution for this repo:

- use `better-auth/react` for the client creator
- install `@better-auth/drizzle-adapter`
- import the Drizzle adapter from `@better-auth/drizzle-adapter`

If the installed 1.5.4 package surface differs, prefer the installed package's actual exports while keeping the documented package split.

## 34. Validation Checklist

Functional:

- Google sign-in works.
- Google callback URL matches environment.
- Better Auth route is mounted at `/api/auth/[...all]`.
- `authClient.useSession()` resolves on the client.
- server session fetch works with `auth.api.getSession({ headers: await headers() })`.
- proxy only performs optimistic redirects.
- protected pages still enforce real server-side auth.
- cookie cache is enabled and session reads stop hammering the database.

Schema:

- `users` contains Better Auth-compatible fields.
- `accounts`, `sessions`, and `verifications` match Better Auth naming.
- `sessions` includes `impersonatedBy` support if admin plugin is enabled.
- auth relations are present and exported.
- joins work without fallback.

Security:

- `BETTER_AUTH_URL` is set.
- trusted origins are explicit.
- secure cookies are enabled in production.
- rate limiting is explicitly enabled.
- OAuth tokens are encrypted.

Performance:

- recommended indexes exist.
- session callback-style extra queries are gone.
- `stdNo` is fetched only where needed.
- permission resolution is request-cached.

Cleanup:

- no `next-auth` imports remain.
- no `@auth/drizzle-adapter` imports remain.
- old route and old type augmentation files are removed.

## 35. Final Steering Summary

The migration target is not just “replace Auth.js with Better Auth.”

The real target is:

- Better Auth 1.5.4 for authentication
- Drizzle-backed Better Auth core schema
- repo-owned permission composition through `withPermission`
- no session-time extra database lookups for student identity or OAuth token convenience data
- explicit env-driven origin and base URL handling
- cookie cache plus joins for performance
- request-level permission caching

That is the stable, documented, and repo-appropriate target state.