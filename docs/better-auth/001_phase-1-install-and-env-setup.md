# Phase 1: Install Dependencies & Environment Setup

> Estimated Implementation Time: 0.5 to 1 hour

**Status**: `DONE` on `2026-03-12`

**Prerequisites**: Read `000_overview.md` first. It is the authoritative reference.

## Essential Outcomes

- Install Better Auth alongside Auth.js (both coexist temporarily)
- Configure Next.js for Better Auth
- Set up environment variables
- Create the permission catalog

## 1.1 Install Dependencies

```bash
pnpm add better-auth @better-auth/drizzle-adapter
```

Do NOT remove `next-auth` or `@auth/drizzle-adapter` yet.

## 1.2 Update Next.js Config

Add `better-auth` to `serverExternalPackages` in `next.config.ts`:

```ts
serverExternalPackages: ['better-auth'],
```

Keep `authInterrupts: true` until Phase 6 route swap.

## 1.3 Add Environment Variables

Add alongside existing Auth.js env vars:

- `BETTER_AUTH_SECRET` — **MUST be a unique, high-entropy random value**. Generate with: `openssl rand -base64 32`. Do NOT reuse OAuth secrets or other credentials as the auth secret.
- `BETTER_AUTH_URL`
- `BETTER_AUTH_TRUSTED_ORIGINS`
- `GOOGLE_CLIENT_ID` (already exists)
- `GOOGLE_CLIENT_SECRET` (already exists)

> **SECURITY**: The `BETTER_AUTH_SECRET` is used to sign session tokens and encrypt sensitive data. It must be at least 32 characters of cryptographically random data. Better Auth will reject weak secrets in production.

Do NOT remove Auth.js env vars (`AUTH_SECRET`, `AUTH_URL`, etc.) yet — they are cleaned up in Phase 23.

> **Note**: After migration, `AUTH_SECRET`, `AUTH_URL`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET` will be removed. Only `BETTER_AUTH_*` and `GOOGLE_*` vars will remain.

## 1.4 Create Permission Catalog

File: `src/core/auth/permissions.ts`

This file defines the complete resource:action permission catalog and TypeScript types used throughout the app:

```ts
export const RESOURCES = [
  'lecturers',
  'assessments',
  'semester-modules',
  'modules',
  'school-structures',
  'feedback-questions',
  'feedback-categories',
  'feedback-cycles',
  'feedback-reports',
  'timetable',
  'venues',
  'gradebook',
  'students',
  'registration',
  'student-statuses',
  'documents',
  'terms-settings',
  'graduation',
  'certificate-reprints',
  'applicants',
  'applications',
  'admissions-payments',
  'admissions-documents',
  'entry-requirements',
  'sponsors',
  'users',
  'permission-presets',
  'tasks',
  'activity-tracker',
  'library',
] as const;

export type Resource = (typeof RESOURCES)[number];

export const ACTIONS = [
  'read',
  'create',
  'update',
  'delete',
  'approve',
] as const;

export type Action = (typeof ACTIONS)[number];

export type PermissionRequirement = {
  [R in Resource]?: Action[];
};

export type AuthRequirement =
  | 'all'
  | 'auth'
  | 'dashboard'
  | PermissionRequirement;

export const DASHBOARD_ROLES = [
  'finance',
  'registry',
  'library',
  'resource',
  'academic',
  'marketing',
  'student_services',
  'admin',
  'leap',
  'human_resource',
] as const;

export type DashboardRole = (typeof DASHBOARD_ROLES)[number];

export const USER_ROLES = ['student', ...DASHBOARD_ROLES] as const;

export type UserRole = (typeof USER_ROLES)[number];
```

## Exit Criteria

- [ ] `better-auth` installed
- [ ] `next.config.ts` has `serverExternalPackages: ['better-auth']`
- [ ] New env vars documented and set locally
- [ ] `src/core/auth/permissions.ts` defines full resource:action catalog and `UserRole` type
- [ ] `pnpm tsc --noEmit` passes (no type errors from new files)
