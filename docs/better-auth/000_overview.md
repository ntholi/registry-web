# Better Auth Migration — Steering Document

> Estimated Implementation Time: 6 to 8 working days (~34–47 hours total, 24 phases each ≤ 2h)

This file is the **authoritative** reference for the entire Better Auth migration and permission redesign. If any phase document conflicts with this file, **this file wins**.

---

## Execution Tracker

> **IMPORTANT Instruction**: When the user says "execute next phase", do only the first `PENDING` phase in that session, then update this tracker to `DONE` with the completion date. If a phase is `BLOCKED`, resolve it or ask the user.

| # | Phase | Doc | Status | Completed | Notes |
|---|-------|-----|--------|-----------|-------|
| 1 | Install & Environment Setup | `001_phase-1-install-and-env-setup.md` | `DONE` | `2026-03-12` | |
| 2 | Auth Config & Schema Files | `002_phase-2-auth-config-and-schema-files.md` | `DONE` | `2026-03-12` | Rate-limits schema verified; auth table diffs deferred to Phase 3 |
| 3 | Auth Table Schema Updates | `003_phase-3-auth-table-schema-updates.md` | `DONE` | `2026-03-12` | Accounts kept in transitional old + new shape |
| 4 | Dependent Schemas & Migration | `004_phase-4-dependent-schemas-and-migration.md` | `DONE` | `2026-03-12` | Phase 2 tables (0183/0184) + Phase 3-4 schema migration (0185) applied together; student_notes table handled |
| 5 | Data Migration — Core Tables | `005_phase-5-data-migration-core-tables.md` | `DONE` | `2026-03-12` | Applied `pnpm db:migrate` and passed `pnpm migration:verify` |
| 6 | Preset Seeds & Route Swap | `006_phase-6-preset-seeds-and-route-swap.md` | `DONE` | `2026-03-13` | Applied `0187_phase-6-preset-seeds`; seeded presets and backfilled `preset_id`; route swap, proxy, and `position` removal deferred until final cutover |
| 7 | Create withPermission Wrapper | `007_phase-7-create-withpermission-wrapper.md` | `DONE` | `2026-03-13` | Added Better Auth-backed `withPermission`, request-scoped session caching, and migrated `requireSessionUserId` to the new module with transitional legacy role-array support |
| 8 | Update BaseService | `008_phase-8-update-base-service.md` | `DONE` | `2026-03-13` | Migrated `BaseService` to Better Auth session types and `withPermission` while keeping legacy role-array config compatibility for downstream phases |
| 9 | Academic Services — Part 1 | `009_phase-9-academic-services-part-1.md` | `DONE` | `2026-03-13` | Migrated the five phase 9 academic services to `*Auth`; removed feedback question position checks and updated custom methods where mappings were clear |
| 10 | Academic Services — Part 2 | `010_phase-10-academic-services-part-2.md` | `DONE` | `2026-03-13` | Migrated feedback categories, cycles, reports, and lecturers; fixed lecturer search to enforce `lecturers:read` with school scoping; removed remaining academic `withAuth` service aliases |
| 11 | Registry Services | `011_phase-11-registry-services.md` | `DONE` | `2026-03-13` | Migrated the six phase 11 registry services to permission-based auth; student/self-service paths kept transitional custom checks where Phase 17 still owns the portal flow |
| 12 | Admin Services | `012_phase-12-admin-services.md` | `DONE` | `2026-03-13` | Migrated users, tasks, activity tracker, and notifications to permission-based auth; reports nav now reads session permissions directly |
| 13 | Admissions & Finance Services | `013_phase-13-admissions-and-finance-services.md` | `DONE` | `2026-03-13` | Migrated targeted admissions and finance services to `*Auth` permission checks with applicant and student self-service fallbacks where presets do not apply |
| 14 | Timetable, Library & Standalone Actions | `014_phase-14-timetable-library-and-standalone-actions.md` | `DONE` | `2026-03-13` | Timetable and library services migrated to permission checks; remaining `withAuth` aliases removed from `src/` |
| 15 | Client Session Migration | `015_phase-15-client-session-migration.md` | `PENDING` | — | |
| 16 | Server Components, Sign-In & Permissions | `016_phase-16-server-components-and-sign-in.md` | `PENDING` | — | |
| 17 | Student Portal & stdNo Migration | `017_phase-17-student-portal-migration.md` | `PENDING` | — | |
| 18 | LMS Credential Migration | `018_phase-18-lms-credential-migration.md` | `PENDING` | — | |
| 19 | Navigation Config Migration | `019_phase-19-navigation-config-migration.md` | `PENDING` | — | |
| 20 | Permission Preset Backend & Actions | `020_phase-20-preset-backend-and-actions.md` | `PENDING` | — | |
| 21 | Permission Preset Pages | `021_phase-21-preset-pages.md` | `PENDING` | — | |
| 22 | Permission Matrix & Preset Form | `022_phase-22-permission-matrix-and-preset-form.md` | `PENDING` | — | |
| 23 | User Form Update & Navigation Entry | `023_phase-23-user-form-and-navigation-entry.md` | `PENDING` | — | |
| 24 | Cleanup, Verification & Testing | `024_phase-24-cleanup-and-verification.md` | `PENDING` | — | |

**Legend**: `PENDING` = not started | `IN_PROGRESS` = currently executing | `DONE` = completed | `BLOCKED` = waiting on something

### Pre-Migration Checklist (User)

These are one-time steps the user must complete **before** Phase 1 begins:

- [ ] Create git branch: `git checkout -b feat/better-auth-migration`
- [ ] Backup database (PowerShell): `pg_dump -Fc registry | Out-File -Encoding ascii registry-pre-betterauth.dump`
- [ ] Backup `.env` (PowerShell): `Copy-Item .env .env.backup`
- [ ] Confirm env vars are ready: `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `BETTER_AUTH_TRUSTED_ORIGINS`

### Post-Migration Checklist (User)

These must be completed **after** Phase 24:

- [ ] Update Google Console OAuth redirect URI to `/api/auth/callback/google`
- [ ] Test Google sign-in end-to-end in staging
- [ ] Verify all dashboard roles can log in and see correct navigation
- [ ] Merge `feat/better-auth-migration` → `develop` → `main`
- [ ] Deploy and monitor

### Phase-Specific User Actions

> Most phases are fully automated. The following phases require specific user involvement:

**Phase 1** — Run `pnpm add better-auth` and add env vars to `.env`
**Phase 4** — Run `pnpm migration:snapshot` (captures all user/account data), then `pnpm db:generate` and `pnpm db:migrate`
**Phase 5** — Run `pnpm db:generate --custom`, write migration SQL, run `pnpm db:migrate`, then `pnpm migration:verify` (asserts zero data loss across 59 checks)
**Phase 24** — Run `pnpm remove next-auth @auth/drizzle-adapter` and final verification commands

**Migration verification workflow:**
```
1. pnpm migration:snapshot    ← BEFORE Phase 4 migration (captures baseline)
2. pnpm db:migrate             ← Apply Phase 4 migration
3. pnpm migration:snapshot    ← Re-capture BEFORE Phase 5 (optional, updates baseline)
4. pnpm db:migrate             ← Apply Phase 5 migration
5. pnpm migration:verify       ← AFTER Phase 5 (asserts zero data loss)
```

All other phases (2–3, 6–23) are fully automated code changes with no user intervention required.

---

## Version Baseline

- Better Auth target: `^1.5.4` (latest compatible 1.x)
- Drizzle ORM: `0.45`
- Next.js: `16.1`

## Decision Summary

| Decision | Choice |
|----------|--------|
| Auth provider | Google OAuth only |
| Session strategy | Database sessions with cookie cache (compact) |
| Auth library | Better Auth (replaces Auth.js) |
| Admin plugin | Used for auth/user management APIs only (ban, impersonate, list) — NOT for permission checking |
| Role column | Kept on users as department identifier |
| Position column | Removed — replaced by permission presets |
| Permission model | Presets only — no per-user overrides |
| Preset storage | DB tables (`permission_presets` + `preset_permissions`) |
| Preset scope | Role-scoped (each preset is associated with a role) |
| Preset linkage | Live link — users reference a preset via `presetId` FK |
| Preset per user | One preset per user (nullable) |
| Null preset | No extra permissions (role-only access, admin bypasses all) |
| Permission format | Resource:Action (e.g., `students:read`, `grades:approve`) |
| Session permission shape | `PermissionGrant[]` objects: `{ resource, action }` |
| Predefined presets | One per current role+position combo (migration creates them) |
| Preset catalog source | Single typed catalog in `src/app/auth/permission-presets/_lib/catalog.ts` |
| Preset management | Dedicated admin page at `/admin/permission-presets` |
| User form | Preset dropdown + read-only shared permission matrix |
| Navigation model | Role for top-level modules, preset permissions for sub-items |
| Session payload | No stdNo, no LMS credentials — fetch on demand; permissions embedded via `customSession` plugin |
| Migration style | All-in-one with incremental commits within one branch |
| Migration execution | Phase 4 generated schema migration via `pnpm db:generate`; Phase 5 custom data migration via `pnpm db:generate --custom` |
| ID generation | Keep `nanoid()` for consistency (all tables, including presets) |
| Import path | `better-auth/minimal` (documented bundle-size optimization for adapter-based setups) |
| Better Auth CLI | Use the current `npx auth ...` command family |
| Env vars | Consolidate to `BETTER_AUTH_SECRET` / `BETTER_AUTH_URL` (remove old `AUTH_*` vars) |
| presetId in session | Declared via `user.additionalFields` (type: `'string'`) for proper typing |
| Session permissions | `customSession` plugin enriches session with preset permissions (cached in cookie) |
| customSession permission lookup | `src/core/auth.ts` may import `db` for adapter wiring, but permission lookup should call auth-owned repository code, not inline query logic |
| CSRF protection | Built-in via `trustedOrigins` — verified in Phase 12 |
| OAuth token encryption | `encryptOAuthTokens: true` — direct DB reads return encrypted data |
| Middleware/proxy.ts | Cookie-only optimistic redirect layer (created in Phase 6) — uses `proxy.ts` per Next.js 16 convention — NOT the final auth boundary |
| Preset change strategy | Revoke user sessions when admin changes their preset (forces re-login with fresh permissions) |
| Auth-owned writes | LMS credential writes, preset assignment side effects, and session revocation stay in auth-owned repository/service code |
| Preset backend ownership | `permission_presets` schema, repository, service, and actions live under `src/app/auth/permission-presets`; admin pages import them |
| Google OAuth callback | Must update Google Console redirect URI after route swap (`/api/auth/callback/google`) |
| requireSessionUserId | Migrated to `withPermission` module (used in ~4 service files) |

## Architecture Overview

### Permission Resolution Flow

```
Request → Better Auth session lookup (includes permissions from customSession) → withPermission(...)
  → session already contains `permissions: PermissionGrant[]` (from customSession plugin + cookie cache)
  → if role === 'admin' → allow (bypass)
  → if requirement is 'all' → allow
  → if requirement is 'auth' → allow if authenticated
  → if requirement is 'dashboard' → check role ∈ DASHBOARD_ROLES
  → if requirement is PermissionRequirement → check embedded permission grants
```

### Tables

```
permission_presets
├── id (text PK, nanoid)
├── name (text, unique, e.g., "Academic Manager")
├── role (text, e.g., "academic") — scopes which role this preset is for
├── description (text, nullable)
├── created_at (timestamp)
└── updated_at (timestamp, $onUpdate)

preset_permissions
├── id (text PK, nanoid)
├── preset_id (FK → permission_presets.id, cascade delete)
├── resource (text, e.g., "students")
├── action (text, e.g., "read")
├── index on preset_id
└── unique(preset_id, resource, action)

users
├── ... existing Better Auth fields ...
├── role (text, default 'user') — declared in additionalFields
├── preset_id (FK → permission_presets.id, nullable, set null on delete) — declared in additionalFields
├── index on preset_id
└── All updatedAt columns use $onUpdate(() => new Date())

Indexes (Better Auth standard):
├── sessions: sessions_userId_idx on user_id
├── accounts: accounts_userId_idx on user_id
├── verifications: verifications_identifier_idx on identifier
└── users: users_preset_id_idx on preset_id
```

### Data Flow

```
Admin creates preset → defines resource:action rows in preset_permissions
Admin assigns preset to user → users.presetId = preset.id
Preset update or preset reassignment → auth-owned service revokes affected sessions
Runtime check → read embedded `PermissionGrant[]` from session → check resource:action
```

### Navigation Model

```
Top-level module visibility → role-based (existing NavItem.roles)
Sub-item visibility → permission-based (new NavItem.permissions field)
Action authorization → permission-based (withPermission in server actions)
```

### Dashboard Roles (Hardcoded)

```ts
const DASHBOARD_ROLES = [
  'finance', 'registry', 'library', 'resource', 'academic',
  'marketing', 'student_services', 'admin', 'leap', 'human_resource',
] as const;
```

## Resource:Action Permission Catalog

These are the normalized permissions for the migration target. Avoid catch-all verbs like `manage`; use explicit actions instead. If a future workflow needs something beyond CRUD or approval, introduce a narrowly named action for that workflow rather than reintroducing `manage`.

### Academic Resources

| Resource | Actions | Currently gated by |
|----------|---------|--------------------|
| `lecturers` | `read`, `create`, `update`, `delete` | academic + position in [manager, program_leader, admin] |
| `assessments` | `read`, `create`, `update`, `delete` | academic, leap |
| `semester-modules` | `read`, `create`, `update` | dashboard (read), registry (write) |
| `modules` | `read`, `create` | dashboard (read), registry (create) |
| `school-structures` | `read`, `update`, `delete` | dashboard (read), position-based (write) |
| `feedback-questions` | `read`, `create`, `update`, `delete` | academic (read), position in [manager, program_leader, admin] (write) |
| `feedback-categories` | `read`, `create`, `update`, `delete` | academic (read), position in [manager, program_leader, admin] (write) |
| `feedback-cycles` | `read`, `create`, `update`, `delete` | position in [manager, year_leader, admin] (read), position in [manager, admin] (write) |
| `feedback-reports` | `read`, `update` | academic + HR (read), position in [manager, admin] (write) |
| `timetable` | `read`, `create`, `update`, `delete` | dashboard (read), academic (write) |
| `venues` | `read`, `create`, `update`, `delete` | dashboard (read), academic + registry (write) |
| `gradebook` | `read`, `update`, `approve` | academic (varies by position) |
| `attendance` | `read`, `create`, `update`, `delete` | academic, leap |
| `assigned-modules` | `read`, `create`, `delete` | academic, leap |

### Registry Resources

| Resource | Actions | Currently gated by |
|----------|---------|--------------------|
| `students` | `read`, `update`, `delete` | dashboard (read), registry + student_services (write) |
| `registration` | `read`, `create`, `update`, `delete` | registry, leap, student_services, academic leaders |
| `registration-clearance` | `read`, `approve`, `reject` | finance, library, resource (dept-scoped response) |
| `student-statuses` | `read`, `create`, `update`, `delete` | registry, admin, student_services, finance |
| `documents` | `read`, `create` | admin, registry, student_services, managers |
| `terms-settings` | `read`, `update` | registry only |
| `graduation` | `read`, `approve` | finance, library, academic leaders |
| `graduation-clearance` | `read`, `approve`, `reject` | finance, library, academic leaders |
| `certificate-reprints` | `read`, `create`, `update`, `delete` | registry |
| `student-notes` | `read`, `create`, `update`, `delete` | dashboard (creator-only edit/delete, admin bypass) |
| `blocked-students` | `read`, `create`, `update`, `delete` | finance (read), finance/registry/library (create), dept-scoped unblock |
| `auto-approvals` | `read`, `create`, `update`, `delete` | finance, library, admin (dept-scoped for non-admin) |

### Admissions Resources

| Resource | Actions | Currently gated by |
|----------|---------|--------------------|
| `applicants` | `read`, `create`, `update` | registry, marketing, admin |
| `applications` | `read`, `create`, `update`, `delete` | registry, marketing, admin |
| `admissions-payments` | `read`, `create`, `update`, `delete` | registry, marketing, admin, finance |
| `admissions-documents` | `read`, `create`, `update`, `delete` | registry, marketing, admin, finance |
| `entry-requirements` | `read`, `create`, `update`, `delete` | registry, marketing, admin |
| `recognized-schools` | `read`, `create`, `update`, `delete` | registry, marketing, admin |
| `intake-periods` | `read`, `create`, `update`, `delete` | registry, marketing, admin |
| `certificate-types` | `read`, `create`, `update`, `delete` | registry, marketing, admin |
| `subjects` | `read`, `create`, `update`, `delete` | registry, marketing, admin |

### Finance Resources

| Resource | Actions | Currently gated by |
|----------|---------|--------------------|
| `sponsors` | `read`, `create`, `update`, `delete` | finance, admin, registry |

### Admin Resources

| Resource | Actions | Currently gated by |
|----------|---------|--------------------|
| `users` | `read`, `create`, `update`, `delete` | dashboard (CRUD), admin (nav) |
| `permission-presets` | `read`, `create`, `update`, `delete` | admin only (preset admin backend) |
| `tasks` | `read`, `create`, `update`, `delete` | admin, managers |
| `activity-tracker` | `read` | admin, managers |
| `notifications` | `read`, `create`, `update`, `delete` | admin (CRUD), all users (read active) |

### Library Resources

| Resource | Actions | Currently gated by |
|----------|---------|--------------------|
| `library` | `read`, `create`, `update`, `delete` | library, admin |

### HR Resources

| Resource | Actions | Currently gated by |
|----------|---------|--------------------|
| `employees` | `read`, `create`, `update`, `delete` | human_resource, admin |

### Report Resources

| Resource | Actions | Currently gated by |
|----------|---------|--------------------|
| `reports-attendance` | `read` | academic, registry, leap |
| `reports-course-summary` | `read` | academic |
| `reports-boe` | `read` | academic (manager, program_leader positions) |
| `reports-enrollments` | `read` | registry, admin, finance, academic, leap |
| `reports-progression` | `read` | registry, admin, finance, academic, leap |
| `reports-distribution` | `read` | registry, admin, finance, academic, leap |
| `reports-graduation` | `read` | registry, admin, finance, academic |
| `reports-sponsored-students` | `read` | finance |

## Predefined Presets (Migration Seeds)

### Academic Presets

| Preset Name | Role | Permissions |
|-------------|------|-------------|
| Academic Manager | academic | lecturers:full, assessments:full, feedback-questions:full, feedback-categories:full, feedback-cycles:full, feedback-reports:read/update, school-structures:read/update/delete, timetable:full, venues:full, registration:read/update, graduation:read/approve, graduation-clearance:read/approve/reject, activity-tracker:read, tasks:full, gradebook:read/update/approve, students:read, attendance:full, assigned-modules:full, reports-attendance:read, reports-course-summary:read, reports-boe:read, reports-enrollments:read, reports-progression:read, reports-distribution:read, reports-graduation:read |
| Academic Program Leader | academic | lecturers:full, feedback-questions:full, feedback-categories:full, school-structures:read/update, registration:read/update, timetable:read, students:read, gradebook:read/update/approve, attendance:read, assigned-modules:full, reports-attendance:read, reports-course-summary:read, reports-boe:read, reports-enrollments:read, reports-progression:read, reports-distribution:read, reports-graduation:read |
| Academic Year Leader | academic | feedback-cycles:read, registration:read, students:read, timetable:read, attendance:read, reports-attendance:read, reports-enrollments:read, reports-progression:read, reports-distribution:read |
| Academic Lecturer | academic | assessments:full, gradebook:read/update, feedback-reports:read, timetable:read, attendance:read/create/update, assigned-modules:read, reports-attendance:read, reports-course-summary:read |
| Academic Principal Lecturer | academic | assessments:full, gradebook:read/update/approve, feedback-reports:read, timetable:read, attendance:read/create/update, assigned-modules:read, reports-attendance:read, reports-course-summary:read |
| Academic Admin | academic | assessments:full, feedback-questions:full, feedback-categories:full, feedback-cycles:full, timetable:read, attendance:read |

### Registry Presets

| Preset Name | Role | Permissions |
|-------------|------|-------------|
| Registry Staff | registry | students:read/update/delete, registration:full, registration-clearance:read, documents:read/create, student-statuses:full, terms-settings:read/update, certificate-reprints:full, modules:create, semester-modules:create/update, venues:create/update/delete, graduation:read, student-notes:full, blocked-students:read/create/update, reports-enrollments:read, reports-progression:read, reports-distribution:read, reports-attendance:read |
| Registry Manager | registry | Everything in Registry Staff + activity-tracker:read, tasks:full, school-structures:update, blocked-students:full, notifications:read, reports-graduation:read |

### Finance Presets

| Preset Name | Role | Permissions |
|-------------|------|-------------|
| Finance Staff | finance | sponsors:full, admissions-payments:read/update, student-statuses:read, graduation:read, students:read, registration-clearance:read/approve/reject, graduation-clearance:read/approve/reject, blocked-students:read/create/update, reports-enrollments:read, reports-progression:read, reports-distribution:read, reports-graduation:read, reports-sponsored-students:read |
| Finance Manager | finance | Everything in Finance Staff + activity-tracker:read, tasks:full, blocked-students:full, auto-approvals:full |

### Other Role Presets

| Preset Name | Role | Permissions |
|-------------|------|-------------|
| Library Staff | library | library:full, students:read, registration-clearance:read/approve/reject, graduation-clearance:read/approve/reject, blocked-students:read/create/update, auto-approvals:full |
| Marketing Staff | marketing | applicants:full, applications:full, entry-requirements:full, admissions-payments:read, admissions-documents:read, recognized-schools:full, intake-periods:full, certificate-types:full, subjects:full |
| Student Services Staff | student_services | students:read/update, registration:read/update, documents:read/create, student-statuses:read/create/update, student-notes:full |
| LEAP Staff | leap | assessments:full, registration:read/update, registration-clearance:read, students:read, attendance:read/create/update, assigned-modules:read, reports-attendance:read, reports-enrollments:read, reports-progression:read, reports-distribution:read |
| Human Resource Staff | human_resource | feedback-reports:read, employees:full |
| Resource Staff | resource | timetable:read, venues:read, registration-clearance:read/approve/reject, auto-approvals:full |
| Admin Superuser | admin | (admin role bypasses all checks — this preset is optional/ceremonial) |

> **Note**: These presets are the STARTING POINT. Admins can create new presets and modify existing ones via the UI after migration.

## File Layout

### New Files

```
src/core/auth.ts                              — Better Auth server config (includes customSession plugin)
src/core/auth-client.ts                       — Better Auth React client (includes customSessionClient)
src/core/auth/permissions.ts                  — Resource:Action catalog + preset type definitions
src/core/platform/withPermission.ts           — Authorization wrapper (replaces withAuth)
src/app/api/auth/[...all]/route.ts            — Better Auth route handler
proxy.ts                                      — Next.js 16 proxy (optimistic redirect, cookie check only; replaces deprecated middleware.ts)
src/app/auth/permission-presets/_lib/catalog.ts — single source of truth for preset seeds, UI grouping, and legacy position → preset mapping
src/app/auth/permission-presets/_lib/types.ts — shared preset form/action types
src/app/auth/permission-presets/_server/repository.ts — auth-owned preset queries used by customSession and admin pages
src/app/auth/permission-presets/_server/service.ts    — auth-owned preset service
src/app/auth/permission-presets/_server/actions.ts    — auth-owned preset actions imported by admin pages
src/shared/ui/PermissionMatrix.tsx            — shared permission matrix used by preset pages and user form

src/app/auth/permission-presets/_schema/permissionPresets.ts
src/app/auth/permission-presets/_schema/presetPermissions.ts
src/app/auth/permission-presets/_schema/relations.ts
src/app/auth/auth-providers/_schema/rateLimits.ts
src/app/auth/auth-providers/_schema/lmsCredentials.ts

src/app/admin/permission-presets/             — Preset management feature (CRUD)
├── _components/Form.tsx
├── page.tsx
├── new/page.tsx
├── [id]/page.tsx
├── [id]/edit/page.tsx
└── layout.tsx
```

### Modified Files (Key)

```
src/app/auth/users/_schema/users.ts           — Add presetId, remove position, enums → text
src/core/platform/BaseService.ts              — withAuth → withPermission
src/app/admin/users/_components/Form.tsx       — Add preset dropdown + read-only matrix
src/app/dashboard/module-config.types.ts       — Add permissions field to NavItem
src/app/dashboard/dashboard.tsx                — Update isItemVisible for permissions
src/app/academic/academic.config.ts            — Add permission-based sub-item visibility
src/app/registry/registry.config.ts            — Same
src/app/reports/reports.config.ts              — Replace UserRole/UserPosition type imports
src/app/admin/notifications/_server/service.ts — Replace UserPosition type
src/app/admin/notifications/_server/actions.ts — Replace UserPosition type
src/app/admin/notifications/_components/Form.tsx — Replace enum imports
src/app/registry/clearance/_schema/clearance.ts — dashboardUsers enum → text
src/app/registry/clearance/auto-approve/_schema/autoApprovals.ts — enum → text
src/app/registry/blocked-students/_schema/blockedStudents.ts     — enum → text
src/app/registry/student-notes/_schema/studentNotes.ts           — userRoles enum → text
(~30+ service files, ~35+ client files)
```

### Deleted Files

```
src/core/platform/withAuth.ts
src/app/api/auth/[...nextauth]/route.ts
src/app/auth/auth-providers/_schema/authenticators.ts
next-auth.d.ts
```

## Commit Strategy

```
Commit 1: Install Better Auth, create config files, schema files (Phases 1–2)
Commit 2: Database migration prep (non-destructive schema changes + generated migration) (Phases 3–4)
Commit 3: Data migration, preset seeding, and route swap (Phases 5–6)
Commit 4: withPermission wrapper + BaseService update (Phases 7–8)
Commit 5: Migrate academic module services/actions (Phases 9–10)
Commit 6: Migrate registry + admin module services/actions (Phases 11–12)
Commit 7: Migrate admissions/finance/timetable/library services (Phases 13–14)
Commit 8: Migrate all client components (useSession, signOut, etc.) (Phases 15–17)
Commit 9: LMS credential separation + navigation config (Phases 18–19)
Commit 10: Permission preset management backend + pages (Phases 20–21)
Commit 11: Shared permission matrix, preset form, user form update (Phases 22–23)
Commit 12: Cleanup (remove Auth.js artifacts, old imports) + verification (Phase 24)
```

## Rollback Plan

1. Full DB backup before starting (PowerShell): `pg_dump -Fc registry | Out-File -Encoding ascii registry-pre-betterauth.dump`
2. Work on `feat/better-auth-migration` branch
3. Backup `.env` to `.env.backup` with `Copy-Item .env .env.backup`
4. Rollback: `pg_restore -d registry registry-pre-betterauth.dump` + `git checkout develop`
5. Schedule migration in low-usage window — users will need to re-sign-in
