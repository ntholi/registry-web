# Better Auth Best Practices for Next.js 16

## Purpose

This document is a generic, vendor-focused reference for using Better Auth with Next.js 16.

It is intentionally not tied to any specific application, schema, directory structure, or business rules. It exists to capture current Better Auth guidance, Better Auth-first architecture decisions, and practical migration advice from Auth.js to Better Auth.

## Documentation Baseline

This document reflects public Better Auth and Next.js documentation reviewed on 2026-03-11.

- Latest Better Auth release visible in the public changelog at review time: `v1.5.4`
- Next.js baseline used here: `16.1.x`

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

## What Matters Most

- Use Better Auth as the source of truth for authentication.
- Keep authorization logic explicit and application-owned.
- Prefer database-backed sessions unless there is a clear reason to move to stateless or secondary-storage-only patterns.
- Keep session payloads small and stable.
- Use Next.js 16 `proxy.ts` only for optimistic redirects, not as the final security boundary.
- Perform real session validation inside pages, route handlers, and server actions.
- Use documented Better Auth APIs and current CLI commands.
- Keep the first rollout lean. Do not add optional plugins or advanced behavior until the base authentication flow is stable.

## Better Auth 1.5 Highlights Relevant to New Work

- The CLI is now `npx auth`, replacing the older `@better-auth/cli` flow.
- Database adapters were extracted into separate packages.
- Unified hooks are now documented across core and plugins.
- `advanced.backgroundTasks` is documented.
- Database `after` hooks run after transaction commit.
- Secret rotation is supported through `secrets` and `BETTER_AUTH_SECRETS`.
- Dynamic base URL handling is documented.
- Session APIs, rate limiting, and cookie behavior were hardened further in 1.5.

## Recommended Generic File Layout

For a Next.js 16 App Router application, the minimal Better Auth layout should usually be:

- `src/lib/auth.ts`
- `src/lib/auth-client.ts`
- `src/app/api/auth/[...all]/route.ts`
- `proxy.ts`

Use equivalent paths if your project does not use `src/`.

## Installation Best Practices

Install Better Auth and the adapter package for your database explicitly.

```bash
pnpm add better-auth@latest @better-auth/drizzle-adapter
```

If you are migrating from Auth.js, keep both systems installed only for the shortest possible overlap period. Remove Auth.js packages after the Better Auth route, session access, and client hooks are all working.

Common CLI commands:

```bash
npx auth init
npx auth generate
npx auth migrate
npx auth upgrade
```

If your project uses complex path aliases and the CLI has trouble resolving them, use a minimal temporary auth entry or relative imports for generation. Do not contort runtime architecture to satisfy CLI limitations.

## Canonical Server Setup

For a Next.js app using Drizzle, a strong default is `better-auth/minimal` with the Drizzle adapter and the Next.js cookies plugin.

```ts
import { betterAuth } from 'better-auth/minimal'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { nextCookies } from 'better-auth/next-js'

import { db, schema } from '@/lib/db'

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
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
    freshAge: 60 * 5,
    cookieCache: {
      enabled: true,
      strategy: 'compact',
      maxAge: 60 * 5,
      version: '1',
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
  account: {
    encryptOAuthTokens: true,
    updateAccountOnSignIn: true,
    accountLinking: {
      enabled: true,
      trustedProviders: ['google'],
    },
  },
  advanced: {
    useSecureCookies: process.env.NODE_ENV === 'production',
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      prompt: 'select_account',
    },
  },
  plugins: [nextCookies()],
})

export type Session = typeof auth.$Infer.Session
```

## Server Configuration Rules

- Prefer `better-auth/minimal` when you do not need the larger surface area.
- Set `baseURL` explicitly in production.
- Keep `trustedOrigins` explicit unless you genuinely need dynamic resolution.
- Use `useSecureCookies` in production.
- Enable rate limiting explicitly instead of relying on environment defaults.
- Encrypt OAuth tokens if you store them.
- Only add `additionalFields` that are stable, security-reviewed, and truly belong in the Better Auth data model.

## Client Setup Best Practices

For React and Next.js, use the React client creator.

```ts
import { createAuthClient } from 'better-auth/react'
import { inferAdditionalFields } from 'better-auth/client/plugins'

import type { auth } from '@/lib/auth'

export const authClient = createAuthClient({
  plugins: [inferAdditionalFields<typeof auth>()],
})
```

Guidelines:

- Prefer `better-auth/react` for React apps.
- Use `inferAdditionalFields<typeof auth>()` when you expose custom user fields.
- Keep client configuration minimal. Add client plugins only when you actually use them.
- Do not mirror server-only auth logic in the client.

## Route Handler Setup

The canonical Next.js route handler is:

```ts
import { toNextJsHandler } from 'better-auth/next-js'

import { auth } from '@/lib/auth'

export const { GET, POST } = toNextJsHandler(auth)
```

Use it at:

- `src/app/api/auth/[...all]/route.ts`

This aligns with current Better Auth guidance for Next.js App Router.

## Next.js 16 Protection Model

Next.js 16 uses `proxy.ts` rather than the older middleware naming. Better Auth and Next.js guidance both support using proxy only for optimistic redirects.

Fast cookie-only proxy check:

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

export const config = {
  matcher: ['/dashboard'],
}
```

Full validation in proxy is possible in Next.js 16, but it should still be treated as a convenience layer rather than the true authorization boundary.

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

export const config = {
  matcher: ['/dashboard'],
}
```

### Protection Rules

- Use proxy for optimistic redirects and route convenience.
- Do real auth checks inside server components, route handlers, and server actions.
- Never rely on proxy alone to protect sensitive resources.
- Prefer the cookie-only check in proxy when you want lower latency and fewer database hits.

## Session Access Patterns

### Server

```ts
import { headers } from 'next/headers'

import { auth } from '@/lib/auth'

const session = await auth.api.getSession({
  headers: await headers(),
})
```

### Client

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

### Session Best Practices

- Keep session reads simple and cheap.
- Do not enrich every session fetch with unrelated database reads.
- Keep the session payload limited to identity and a small number of stable fields.
- Fetch related domain data on demand rather than attaching it to the session.
- Use `disableCookieCache: true` for especially sensitive checks when you want to force a database-backed session read.

## Session Payload Guidance

Good session fields are:

- user id
- role or other small authorization hints
- core Better Auth session fields

Avoid putting these into session unless there is a strong reason:

- large derived objects
- frequently changing domain data
- third-party access token convenience copies unless a specific feature needs them
- fields that trigger extra joins or lookups on every session read

The smaller and more stable the session payload is, the more value you get from cookie caching.

## Cookie Cache Strategy

Better Auth supports `compact`, `jwt`, and `jwe` cookie cache strategies.

For most internal or first-party web apps, `compact` is the best default because it minimizes cookie size and keeps session reads fast.

```ts
session: {
  cookieCache: {
    enabled: true,
    strategy: 'compact',
    maxAge: 60 * 5,
    version: '1',
  },
}
```

Tradeoff:

- Revoked sessions can remain usable on another device until the cookie cache window expires.

For sensitive operations, prefer a fresh server-side validation path.

## Database and Adapter Best Practices

### Adapter Installation

Better Auth 1.5 extracts adapters into separate packages. Install the dedicated adapter package even though the main package still re-exports adapters.

For Drizzle:

```bash
pnpm add better-auth @better-auth/drizzle-adapter
```

Recommended import path:

```ts
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
```

### Drizzle Rules

- Pass the full schema object to the adapter.
- Export all auth-related tables and relations from the schema object.
- Set `provider: 'pg'` for PostgreSQL.
- Set `usePlural: true` if your physical table names are plural.
- If you want join optimization, ensure relations are defined and included.

If relations are missing, join-based optimizations can silently degrade into multiple queries.

## Indexes That Should Exist

Better Auth performance guidance calls out these indexes as important:

- `users.email`
- `accounts.userId`
- `sessions.userId`
- `sessions.token`
- `verifications.identifier`

If you enable database-backed rate limiting, index the rate limit key as well.

## Rate Limiting Best Practices

Enable rate limiting explicitly.

```ts
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
}
```

Guidelines:

- Prefer explicit settings over default assumptions.
- Use stricter rules on sign-in, sign-up, password reset, and social auth endpoints.
- If you use `storage: 'database'`, create and migrate the backing table yourself.
- Consider IPv6 subnet handling if your application is exposed broadly on the public internet.

## Base URL and Trusted Origins

Better Auth supports explicit base URLs and dynamic base URL resolution.

Static configuration is simpler and should be the default for most apps:

```ts
baseURL: process.env.BETTER_AUTH_URL,
trustedOrigins: [
  process.env.BETTER_AUTH_URL!,
  'https://*.vercel.app',
]
```

Dynamic base URL support is useful for preview deployments, multi-domain environments, or reverse proxies.

```ts
baseURL: {
  allowedHosts: ['myapp.com', '*.vercel.app'],
  fallback: 'https://myapp.com',
  protocol: 'auto',
}
```

Best practices:

- Set `BETTER_AUTH_URL` explicitly for stable environments.
- Keep `trustedOrigins` tight.
- Only allow wildcards you actually control.
- Do not trust arbitrary origins just to make local development easier.

## Secret Management and Rotation

For initial setups, `BETTER_AUTH_SECRET` is enough.

For production operations, prefer rotation-ready configuration:

```ts
secrets: [
  { version: 2, value: 'new-secret-key-at-least-32-chars' },
  { version: 1, value: 'old-secret-key-still-used-to-decrypt' },
]
```

Or:

```bash
BETTER_AUTH_SECRETS="2:new-secret-key,1:old-secret-key"
```

Best practices:

- Use long, random secrets.
- Rotate without destroying active sessions by keeping previous keys available for decryption.
- Document an operational rotation procedure before production rollout.

## Hooks and Background Tasks

Better Auth 1.5 documents unified before and after hooks and background task helpers.

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

Best practices:

- Keep hooks lightweight.
- Use hooks for cross-cutting auth concerns, not heavy domain orchestration.
- Use request-level background task helpers when you need deferred work tied to request lifecycle.
- Remember that database `after` hooks now run after commit, not inside the transaction.
- Do not assume post-commit hooks can safely perform extra transactional writes.

If you need deferred execution on platforms like Vercel:

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

## Social Sign-In Best Practices

For Google, a strong baseline is:

```ts
socialProviders: {
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    prompt: 'select_account',
  },
}
```

Guidelines:

- Set the callback URL correctly for both local and production environments.
- Use `prompt: 'select_account'` when you want the account chooser every time.
- Only request offline access if you truly need refresh tokens.
- Restrict account linking to trusted providers.
- Encrypt stored OAuth tokens.

Typical callback URLs:

- Local: `http://localhost:3000/api/auth/callback/google`
- Production: `https://your-domain/api/auth/callback/google`

## Authorization Design Guidance

Better Auth handles authentication and can provide role and plugin-based access control. That does not remove the need for application-owned authorization design.

Recommended approach:

- Use Better Auth for identity, session handling, providers, and auth lifecycle.
- Use Better Auth plugin permissions for standardized role defaults when they fit.
- Keep complex business authorization in application code.
- Treat auth session lookup and permission resolution as separate concerns.
- Cache permission resolution per request if the same checks happen multiple times in a render or action path.

## Better Auth and Next.js 16 App Router Practices

- Prefer server components for initial session-aware rendering.
- Use `auth.api.getSession({ headers: await headers() })` on the server.
- Use `authClient.useSession()` only in client components that truly need reactive session state.
- Keep auth route handlers in App Router, not Pages Router.
- Use `proxy.ts` for optimistic redirect behavior.
- Re-check authorization inside server actions and route handlers.

## Auth.js to Better Auth Migration

## Migration Goals

- Replace Auth.js route handling with Better Auth route handling.
- Replace Auth.js client session APIs with Better Auth client APIs.
- Move away from callback-based session enrichment that causes repeated database reads.
- Align database tables with Better Auth naming and model expectations.

## Recommended Migration Sequence

1. Install Better Auth and the required adapter package.
2. Add a new Better Auth server entry and client entry.
3. Create the Better Auth route handler in App Router.
4. Update session access in server components, route handlers, and server actions.
5. Update client components from Auth.js hooks to Better Auth hooks.
6. Migrate database tables and indexes.
7. Verify sign-in, sign-out, callback URLs, and session reads.
8. Remove Auth.js packages and old auth artifacts only after full cutover.

## API Replacement Map

Client sign in:

- Auth.js: `signIn('google')`
- Better Auth: `authClient.signIn.social({ provider: 'google' })`

Client sign out:

- Auth.js: `signOut()`
- Better Auth: `authClient.signOut()`

Client session hook:

- Auth.js: `useSession()`
- Better Auth: `authClient.useSession()`

Server session fetch:

- Auth.js: `auth()`
- Better Auth: `auth.api.getSession({ headers: await headers() })`

Route handler:

- Auth.js: framework-specific `handlers`
- Better Auth: `toNextJsHandler(auth)`

## Social Sign-In Migration Pattern

If you previously used a server-side Auth.js social sign-in helper, Better Auth uses `signInSocial` and returns a redirect URL.

```ts
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

import { auth } from '@/lib/auth'

export async function signInWithGoogle(callbackURL: string) {
  const result = await auth.api.signInSocial({
    body: {
      provider: 'google',
      callbackURL,
    },
    headers: await headers(),
  })

  if (result.url) {
    redirect(result.url)
  }
}
```

## Database Model Differences to Expect

From the public migration guide, these are the important model shifts to plan for:

### User

- `emailVerified` is boolean in Better Auth.
- `name`, `email`, and `emailVerified` are required by Better Auth core expectations.
- `createdAt` and `updatedAt` are part of the standard model.

### Session

- `sessionToken` becomes `token`.
- `expires` becomes `expiresAt`.
- `ipAddress`, `userAgent`, `createdAt`, and `updatedAt` are part of the model.

### Account

- `provider` becomes `providerId`.
- `providerAccountId` becomes `accountId`.
- Better Auth adds timestamp fields and provider token expiry fields.

### Verification

- `verification_tokens` becomes `verifications`.
- `token` becomes `value`.
- `expires` becomes `expiresAt`.
- Better Auth uses a single `id` primary key.

## Migration Best Practices

- Keep migration steps reversible until cutover is complete.
- Preserve user IDs unless there is a compelling reason to re-key identities.
- Validate OAuth callback behavior before removing the old system.
- Remove old type augmentations and provider wrappers only after application code compiles cleanly against Better Auth.
- Audit for fields previously injected into the Auth.js session and replace them with on-demand reads where appropriate.

## Performance Best Practices

- Enable cookie cache for common session reads.
- Keep sessions small.
- Export the full schema and relations for adapter-based joins.
- Add the documented indexes before large-scale rollout.
- Avoid repeated session fetches and repeated permission queries within the same request path.
- Consider `deferSessionRefresh` only if you have a real read-replica or latency need.

## Security Best Practices

- Set `BETTER_AUTH_URL` explicitly.
- Keep `trustedOrigins` explicit and narrow.
- Enable secure cookies in production.
- Enable rate limiting explicitly.
- Encrypt OAuth tokens.
- Rotate secrets without invalidating all sessions at once.
- Re-check auth server-side for any sensitive mutation or privileged read.

## Operational Checklist

Before production rollout:

- Better Auth route is mounted and reachable.
- Google or other provider callbacks are correct.
- Session reads work on both server and client.
- Proxy behavior is limited to optimistic redirects.
- Secure cookies are enabled in production.
- Trusted origins are correct for production and preview environments.
- Recommended indexes exist.
- Rate limiting is enabled and tested.
- Secrets are stored securely and rotation is documented.
- Old auth packages and dead code are removed after cutover.

## Final Guidance

The highest-value Better Auth setup for a modern Next.js 16 application is usually simple:

- Better Auth owns authentication.
- The application owns business authorization.
- Proxy handles optimistic redirects only.
- Server components and server actions perform real session validation.
- Sessions stay small.
- Schema and relations are exported correctly.
- Rate limits, trusted origins, secure cookies, and secret rotation are configured deliberately.

Start with the documented core. Add plugins and advanced behavior only when there is a real product or operational need.