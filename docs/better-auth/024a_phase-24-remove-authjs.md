# Phase 24a: Remove Auth.js Artifacts

> Estimated Implementation Time: 20–30 minutes

**Prerequisites**: Phases 1–23 complete. Read `000_overview.md` first.

## 24a.1 Delete Obsolete Files

- `next-auth.d.ts`
- `src/core/auth.legacy.ts` (the renamed old Auth.js config)
- `src/core/platform/withAuth.ts` (already deleted in Phase 7, verify)
- `src/app/auth/auth-providers/_schema/authenticators.ts` (already deleted in Phase 3, verify)
- `src/app/api/auth/[...nextauth]/route.ts` (delete if it still exists)
- Any test mocks for withAuth (e.g., `src/test/mock.withAuth.ts`)

## 24a.2 Clean Up `src/core/auth.ts` Legacy Re-exports

After deleting `src/core/auth.legacy.ts`, update `src/core/auth.ts` to remove all legacy NextAuth re-exports:

- Remove `import { handlers, auth as legacyAuth, signIn, signOut } from './auth.legacy'`
- Remove `export const auth = legacyAuth`
- Remove `export { handlers, legacyAuth, signIn, signOut }`
- Rename `betterAuthServer` to `auth` so downstream code uses `auth` directly
- Update `src/app/api/auth/[...all]/route.ts` to import `auth` (instead of `betterAuthServer`)

## 24a.3 Remove from Relations

- Remove `authenticatorsRelations` from `src/app/auth/auth-providers/_schema/relations.ts`

## 24a.4 Remove Packages

```bash
pnpm remove next-auth @auth/drizzle-adapter
```

## 24a.5 Remove SessionProvider

- Remove `SessionProvider` wrapper from `src/app/providers.tsx` (already done in Phase 15, verify)
- Remove `next-auth/react` import from providers

## 24a.6 Remove Old Environment Variables

Delete from `.env` and any deployment configs:
- `AUTH_SECRET` (replaced by `BETTER_AUTH_SECRET`)
- `AUTH_URL` (replaced by `BETTER_AUTH_URL`)
- `AUTH_GOOGLE_ID` (replaced by `GOOGLE_CLIENT_ID`)
- `AUTH_GOOGLE_SECRET` (replaced by `GOOGLE_CLIENT_SECRET`)

## 24a.7 Keep `authInterrupts`

**Keep `authInterrupts: true`** in `next.config.ts` — it is still required for `unauthorized()` and `forbidden()` support in `withPermission`. Do NOT remove it.
