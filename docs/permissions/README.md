# Permission Audit

## Goal

Systematically review **every** permission check across the entire codebase to ensure each role/user is granted **exactly** the right permissions — not too many, not too few. This is a security and correctness audit.

### Workflow

1. **Review phase** — Go through each module file one at a time. For each module:
   - Perform an **in-depth analysis** of exactly which permissions each user role is granted for every service method and navigation item in the module
   - Cross-reference the codebase (services, actions, preset catalog) to verify what each role can actually do
   - Determine whether any role has **too many** or **too few** permissions for legitimate business needs
   - **Always use `vscode_askQuestions`** to present findings and suggest specific permission changes for approval before writing anything
   - Document all approved recommended changes directly in the module's `.md` file (without implementing code)
   - Mark the module's **Review** status as ✅ in the tracking table below
   - If the review finds **no changes needed**, mark both **Review** and **Implementation** as ✅ (nothing to implement)
2. **Implementation phase** — After all modules are reviewed, implement the approved changes one module at a time, marking each **Implementation** status as ✅ upon completion.

## Progress Tracker

| # | Module | File | Review | Implementation |
|---|--------|------|--------|----------------|
| 1 | Academic | [academic.md](academic.md) | ⬜ | ⬜ |
| 2 | Registry | [registry.md](registry.md) | ⬜ | ⬜ |
| 3 | Admissions | [admissions.md](admissions.md) | ⬜ | ⬜ |
| 4 | Finance | [finance.md](finance.md) | ⬜ | ⬜ |
| 5 | Library | [library.md](library.md) | ⬜ | ⬜ |
| 6 | Timetable | [timetable.md](timetable.md) | ⬜ | ⬜ |
| 7 | Admin | [admin.md](admin.md) | ⬜ | ⬜ |
| 8 | Reports | [reports.md](reports.md) | ⬜ | ⬜ |
| 9 | Human Resource | [human-resource.md](human-resource.md) | ⬜ | ⬜ |
| 10 | Audit Logs | [audit-logs.md](audit-logs.md) | ⬜ | ⬜ |
| 11 | Feedback | [feedback.md](feedback.md) | ⬜ | ⬜ |
| 12 | Student Portal | [student-portal.md](student-portal.md) | ⬜ | ⬜ |

**Legend:** ⬜ = Pending · ✅ = Done

---

## Reference

### Auth Patterns

| Pattern | Description |
|---------|-------------|
| `'all'` | No authentication required |
| `'auth'` | Any authenticated user |
| `'dashboard'` | Any user with a dashboard role |
| `{ resource: ['action'] }` | Requires specific permission grant |
| `async (session) => boolean` | Custom access check function |
| `denyAccess` (default) | BaseService default for create/update/delete — blocks all access |

### BaseService Defaults

When a service extends `BaseService`, unconfigured operations default to:
- `byIdAuth`: `'dashboard'`
- `findAllAuth`: `'dashboard'`
- `createAuth`: `denyAccess` (blocked)
- `updateAuth`: `denyAccess` (blocked)
- `deleteAuth`: `denyAccess` (blocked)
- `countAuth`: `denyAccess` (blocked)

### Permission Catalog

- **54 resources** defined in `src/core/auth/permissions.ts`
- **6 actions**: `read`, `create`, `update`, `delete`, `approve`, `reject`
- **16 preset roles** defined in `src/app/auth/permission-presets/_lib/catalog.ts`
- **Admin bypass**: users with `role: 'admin'` bypass all permission checks
- [audit-logs.md](audit-logs.md) — Audit logs module
- [feedback.md](feedback.md) — Student feedback (public)
- [student-portal.md](student-portal.md) — Student portal (fortinet registration)
