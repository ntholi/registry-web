# Better Auth Guidance for Next.js 16

## Purpose

This document is a verified reference for Better Auth with Next.js 16. It is limited to guidance that is directly supported by current Better Auth and Next.js documentation reviewed on 2026-03-11.

Where Better Auth presents something as optional, experimental, or situational, this document keeps that wording soft. Where Better Auth or Next.js explicitly warns against a pattern, this document treats that warning as authoritative.

## Documentation Baseline

- Better Auth changelog version visible at review time: `v1.5.4`
- Next.js baseline used for framework guidance: `16.1.x`

## Primary Sources

- `https://better-auth.com/changelog`
- `https://better-auth.com/docs/introduction`
- `https://better-auth.com/docs/installation`
- `https://better-auth.com/docs/basic-usage`
- `https://better-auth.com/docs/integrations/next`
- `https://better-auth.com/docs/adapters/drizzle`
- `https://better-auth.com/docs/concepts/database`
- `https://better-auth.com/docs/concepts/session-management`
- `https://better-auth.com/docs/concepts/hooks`
- `https://better-auth.com/docs/concepts/cli`
- `https://better-auth.com/docs/reference/options`
- `https://better-auth.com/docs/authentication/google`
- `https://better-auth.com/docs/guides/optimizing-for-performance`
- `https://better-auth.com/docs/guides/next-auth-migration-guide`
- `https://nextjs.org/docs/app/guides/authentication`

## Verified Headline Guidance

- Use Better Auth as the authentication system.
- Keep real authorization checks on the server.
- Treat `proxy.ts` only as an optimistic redirect layer, not the final security boundary.
- Validate sessions inside server components, route handlers, and server actions.
- Keep session payloads small so cookie caching remains effective.
- Configure `baseURL`, trusted origins, secrets, and production cookie security deliberately.
- Use the current `npx auth` CLI flow and the explicit adapter package for your ORM.

## Better Auth 1.5 Facts Relevant Here

These items are explicitly reflected in current Better Auth docs and changelog material:

- The current CLI command family is `npx auth`.
- Database adapters are now available as separate packages such as `@better-auth/drizzle-adapter`.
- Unified before and after hooks are documented through `createAuthMiddleware`.
- `advanced.backgroundTasks` is documented.
- Secret rotation is documented through `secrets` and `BETTER_AUTH_SECRETS`.
- Dynamic base URL handling is documented.
- Database `after` hooks now run after transaction commit.

## Recommended Generic File Layout

The Better Auth docs consistently use this Next.js App Router shape:

- `src/lib/auth.ts`
- `src/lib/auth-client.ts`
- `src/app/api/auth/[...all]/route.ts`
- `proxy.ts`

Equivalent paths are fine if your project does not use `src/`.

## Installation and CLI

For a Drizzle-based project, the documented installation path is:

```bash
pnpm add better-auth @better-auth/drizzle-adapter
```

Current documented CLI commands include:

```bash
npx auth init
npx auth generate
npx auth migrate
npx auth upgrade
npx auth info
npx auth secret
```

Important CLI constraints from the docs:

- `generate` creates schema output for adapters such as Drizzle and Prisma.
- `migrate` directly applies schema changes only for the built-in Kysely adapter.
- If the CLI cannot resolve path aliases in your auth config, Better Auth recommends temporarily using relative imports.

## Canonical Next.js Route Setup

Better Auth’s documented App Router route handler is:

```ts
import { auth } from '@/lib/auth'
import { toNextJsHandler } from 'better-auth/next-js'

export const { GET, POST } = toNextJsHandler(auth)
```

Use it at `src/app/api/auth/[...all]/route.ts` unless you intentionally customize the base path.

## Server Configuration

Documented baseline for a Next.js and Drizzle setup:

```ts
import { betterAuth } from 'better-auth/minimal'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { nextCookies } from 'better-auth/next-js'

import { db, schema } from '@/lib/db'

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL,
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema,
    usePlural: true,
  }),
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },
  plugins: [nextCookies()],
})
```

Notes that are directly supported by the docs:

- `better-auth/minimal` is a documented bundle-size optimization for adapter-based setups.
- If you use `nextCookies()`, Better Auth says it should be the last plugin in the array.
- `baseURL` should be set explicitly for stable environments.
- `useSecureCookies` should be enabled in production.
- `rateLimit.enabled` defaults to `true` in production and `false` in development, so setting it explicitly is clearer.
- `account.encryptOAuthTokens` is available and should be enabled if you store OAuth tokens.

## Client Setup

For React and Next.js, Better Auth documents `better-auth/react`:

```ts
import { createAuthClient } from 'better-auth/react'
import { inferAdditionalFields } from 'better-auth/client/plugins'

import type { auth } from '@/lib/auth'

export const authClient = createAuthClient({
  plugins: [inferAdditionalFields<typeof auth>()],
})
```

What is safe to rely on:

- Use `createAuthClient` from `better-auth/react` in React applications.
- Use `inferAdditionalFields<typeof auth>()` when client code needs typed access to user additional fields.
- Keep client config minimal unless you actually use extra client plugins.
- Do not treat client session state as the final authorization check for protected operations.

## Next.js 16 Protection Model

Better Auth’s Next.js integration docs are explicit on this point: `proxy.ts` can help with optimistic redirects, but Better Auth recommends handling real auth checks in each page or route.

Cookie-only proxy example from the docs:

```ts
import { NextRequest, NextResponse } from 'next/server'
import { getSessionCookie } from 'better-auth/cookies'

export async function proxy(request: NextRequest) {
  const sessionCookie = getSessionCookie(request)

  if (!sessionCookie) {
    return NextResponse.redirect(new URL('/sign-in', request.url))
  }

  return NextResponse.next()
}
```

Full validation in proxy is also documented:

```ts
import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'

import { auth } from '@/lib/auth'

export async function proxy(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) {
    return NextResponse.redirect(new URL('/sign-in', request.url))
  }

  return NextResponse.next()
}
```

However, Better Auth still labels proxy-based protection as an optimistic layer and recommends real checks in pages and routes. That means:

- Do not rely on cookie presence alone for final protection.
- Do not treat proxy as the only auth boundary.
- Re-check the session on the server before protected reads or writes.

## Session Access and Session Size

Documented server access pattern:

```ts
import { headers } from 'next/headers'

import { auth } from '@/lib/auth'

const session = await auth.api.getSession({
  headers: await headers(),
})
```

Documented client pattern:

```ts
'use client'

import { authClient } from '@/lib/auth-client'

export default function AccountPanel() {
  const { data, error, isPending } = authClient.useSession()

  if (isPending) return <div>Loading...</div>
  if (!data || error) return <div>Signed out</div>

  return <div>{data.user.email}</div>
}
```

Session guidance directly supported by Better Auth docs:

- Keep session reads simple and cheap.
- Avoid enriching every session fetch with unrelated domain queries.
- Keep the session payload limited to identity data and a small number of stable fields.
- Fetch domain-heavy or frequently changing data separately.
- Use `disableCookieCache: true` when you intentionally want a fresh server-side session read.

## Cookie Cache

Better Auth documents three cookie cache strategies:

- `compact`
- `jwt`
- `jwe`

The docs describe `compact` as the default and the most size-efficient option. A safe baseline is:

```ts
session: {
  cookieCache: {
    enabled: true,
    strategy: 'compact',
    maxAge: 60 * 5,
  },
}
```

Important tradeoff explicitly documented by Better Auth:

- Revoked sessions may remain usable on another device until the cookie cache expires.

For sensitive operations, use a fresh server-side validation path instead of relying only on cached session data.

## Database and Drizzle Adapter Guidance

Documented Drizzle adapter points:

- Install `@better-auth/drizzle-adapter` explicitly.
- Import `drizzleAdapter` from `better-auth/adapters/drizzle`.
- Set `provider` to the correct database family such as `pg` for PostgreSQL.
- Pass the schema object when you need schema mapping or join support.
- Use `usePlural: true` if your tables are pluralized.

For joins, Better Auth documents them as experimental and explicitly says:

- Drizzle relations need to exist.
- The related schema entries need to be passed through the adapter schema object.

If those relations are missing, Better Auth falls back to multiple queries instead of joined queries.

## Recommended Indexes

Better Auth’s performance guide calls out these indexes as important:

- `users.email`
- `accounts.userId`
- `sessions.userId`
- `sessions.token`
- `verifications.identifier`

If you use database-backed rate limiting, index the rate limit storage appropriately as well.

## Rate Limiting

Better Auth documents rate limiting as configurable through `rateLimit` and notes that defaults differ by environment. An explicit configuration is clearer than relying on defaults.

Example:

```ts
rateLimit: {
  enabled: true,
  window: 60,
  max: 100,
  storage: 'database',
  customRules: {
    '/sign-in/social': {
      window: 10,
      max: 3,
    },
  },
}
```

Documented points to keep in mind:

- `enabled` defaults to `true` in production and `false` in development.
- Storage can be `memory`, `database`, or `secondary-storage`.
- If the app is broadly internet-facing, IPv6 subnet handling is relevant and documented under advanced IP configuration.

## Base URL, Trusted Origins, and Secrets

Better Auth supports explicit and dynamic base URL handling.

What the docs recommend clearly:

- Set `BETTER_AUTH_URL` or `baseURL` explicitly for stable environments.
- Do not rely on request inference unless you intentionally need dynamic behavior.
- Keep `trustedOrigins` tight.
- Use wildcard origins only for domains you actually control.

Static example:

```ts
baseURL: process.env.BETTER_AUTH_URL,
trustedOrigins: ['http://localhost:3000', 'https://example.com']
```

Dynamic example:

```ts
baseURL: {
  allowedHosts: ['myapp.com', '*.vercel.app'],
  fallback: 'https://myapp.com',
  protocol: 'auto',
}
```

For secrets:

- `BETTER_AUTH_SECRET` is the standard initial setup.
- `BETTER_AUTH_SECRETS` and `secrets` are the documented path for non-destructive rotation.
- Secrets should be long, random, and never hardcoded in production source.

Rotation example:

```ts
secrets: [
  { version: 2, value: 'new-secret-key-at-least-32-chars' },
  { version: 1, value: 'old-secret-key-still-used-to-decrypt' },
]
```

## Hooks and Background Tasks

Better Auth documents hooks through `createAuthMiddleware`:

```ts
import { betterAuth } from 'better-auth'
import { createAuthMiddleware } from 'better-auth/api'

export const auth = betterAuth({
  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      void ctx.path
    }),
    after: createAuthMiddleware(async (ctx) => {
      void ctx.context.returned
    }),
  },
})
```

Supported guidance from the docs:

- Hooks are appropriate for auth-specific request and response customization.
- Use `ctx.context.runInBackground` or `runInBackgroundOrAwait` when you have configured `advanced.backgroundTasks`.
- Background tasks improve latency at the cost of eventual consistency.
- Database `after` hooks run after commit, so they should not be treated as in-transaction write hooks.

Vercel example:

```ts
import { betterAuth } from 'better-auth'
import { waitUntil } from '@vercel/functions'

export const auth = betterAuth({
  advanced: {
    backgroundTasks: {
      handler: waitUntil,
    },
  },
})
```

## Google Provider Guidance

Better Auth’s Google provider docs support the following baseline:

```ts
socialProviders: {
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID as string,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    prompt: 'select_account',
  },
}
```

Supported guidance:

- Configure the redirect URI correctly for local and production environments.
- Set `baseURL` explicitly to avoid `redirect_uri_mismatch` problems.
- Use `prompt: 'select_account'` if you want the account chooser every time.
- Use `accessType: 'offline'` together with `prompt: 'select_account consent'` only when you actually need refresh tokens.

Typical callback URLs:

- Local: `http://localhost:3000/api/auth/callback/google`
- Production: `https://your-domain.com/api/auth/callback/google`

## Auth.js to Better Auth Migration

Better Auth’s migration guide supports this sequence:

1. Install Better Auth and the adapter package you need.
2. Create the Better Auth server instance.
3. Create the Better Auth client instance.
4. Replace the Next.js auth route handler with `toNextJsHandler(auth)`.
5. Migrate server-side session access to `auth.api.getSession({ headers: await headers() })`.
6. Migrate client-side usage to `authClient` APIs.
7. Migrate database models if you use database-backed auth.
8. Remove Auth.js only after the new flow is verified.

Useful API replacements from the official migration guide:

- Auth.js `signIn('google')` -> Better Auth `authClient.signIn.social({ provider: 'google' })`
- Auth.js `signOut()` -> Better Auth `authClient.signOut()`
- Auth.js `useSession()` -> Better Auth `authClient.useSession()`
- Auth.js `auth()` -> Better Auth `auth.api.getSession({ headers: await headers() })`

## Database Model Differences in Migration

Better Auth’s migration guide documents these important schema differences.

User:

- `emailVerified` is boolean in Better Auth.
- Better Auth includes `createdAt` and `updatedAt`.

Session:

- `sessionToken` becomes `token`.
- `expires` becomes `expiresAt`.
- Better Auth includes `ipAddress`, `userAgent`, `createdAt`, and `updatedAt`.

Account:

- `provider` becomes `providerId`.
- `providerAccountId` becomes `accountId`.
- Better Auth includes provider token expiry fields and timestamps.

Verification:

- `VerificationToken` becomes `verification` or `verifications` depending on configured naming.
- `token` becomes `value`.
- `expires` becomes `expiresAt`.
- Better Auth uses a single `id` primary key instead of the Auth.js composite key.

## Practical Verification Checklist

Before calling a Better Auth integration complete, verify all of the following:

- The App Router route is mounted and reachable.
- Sign-in works.
- Sign-out works.
- Callback URLs work in the target environment.
- Session reads work on both server and client.
- Protected server actions and route handlers fail safely when the session is missing or invalid.
- Proxy behavior is limited to redirect convenience, not final enforcement.
- `baseURL`, trusted origins, secrets, and production cookie security are configured explicitly.
- Recommended indexes exist.
- Old Auth.js code is removed after the Better Auth flow is verified.

## Final Guidance

The most consistently supported Better Auth setup for a modern Next.js 16 app is straightforward:

- Use Better Auth for authentication.
- Do real protection checks on the server.
- Keep sessions small.
- Use cookie cache deliberately and understand its revocation tradeoff.
- Configure base URL, trusted origins, rate limiting, secure cookies, and secrets explicitly.
- Add adapter schema mappings and relations correctly when using Drizzle features such as joins.

Start from the documented core setup. Add optional plugins, dynamic base URL handling, joins, or background task behavior only when the application actually needs them.