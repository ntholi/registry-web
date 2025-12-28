# Registry Web

University student registration portal managing academic records, course registrations, and administrative workflows.

## Tech Stack

### Backend
- **Next.js 16** (App Router, React 19, Server Components, Server Actions)
- **Drizzle ORM** with PostgreSQL (Neon serverless or local)
- **Auth.js** with Google OAuth

### Frontend
- **Mantine v8** for all UI components (no custom CSS)
- **TanStack Query v5** for data fetching
- **Tabler Icons** for iconography

### Tooling
- **TypeScript** (strict mode)
- **Biome** for linting and formatting
- **pnpm** as package manager

## Project Guidelines

### Domain Concepts
- **Class**: Students in a program semester. ID: `[ProgramCode][SemesterMini]` (e.g., `DITY1S1`). Use `getStudentClassName(structureSemester)` from `@/shared/lib/utils/utils`.
- **Term Code**: Formatted as `YYYY-MM` (e.g., `2025-02`).
- **School/Faculty**: Interchangeable. Codebase uses **School**. Always translate "Faculty" to "School".
- **Dates**: Always format as `YYYY-MM-DD`.

### Architecture
- **Flow**: UI → Server Actions → Services → Repositories → DB
- Only `repository.ts` files import `db` directly
- Use `db.transaction` for multi-step writes
- Avoid N+1 queries
- **Ownership rule**: Server Actions/Services/Repositories must live in the *same module/feature that owns the schema/table they operate on*. Cross-module features should import and call those actions via path aliases instead of re-implementing them elsewhere.
	- Example: if you need `getSchools()` and it queries the Academic `schools`/`programs` schema (`src/app/academic/_database/schema/schools.ts`), the function must be implemented under `src/app/academic/schools/_server/` (actions → service → repository), even if the UI using it lives in a different module.

### Code Style
- Use `function name() {}` for exports, never arrow functions at top level
- Derive types from Drizzle: `typeof table.$inferInsert`, `typeof table.$inferSelect`
- No comments - code should be self-explanatory
- Component order: Props type → constants → default export → private props type → private components
- Use short identifier names

### UI Rules
- Mantine-only styling (no custom CSS)
- Mantine Date components use string values and mantine calendars must start on Sunday.
- Modals must be self-contained (include their own trigger)
- Optimize for dark mode
- Provide very beautiful, professional, clean, minimalist design
- Never hardcode colors - use `src/shared/lib/utils/colors.ts`
- Never hardcode status icons - use `src/shared/lib/utils/status.tsx`
- If there is *any* conditional/semantic color mapping (statuses, grades, module types, etc.), add/extend the mapping in `colors.ts` and consume it from features.
- If there is *any* status icon mapping (status → icon, with optional color), add/extend it in `status.tsx` and consume it from features.


### Validation (MANDATORY FINAL STEP):
When you are done, it is extremely important crucial that you run `pnpm tsc --noEmit & pnpm lint:fix` then fix the issues, run the same commands again until there are no issues.

## Project Structure

```
src/
├── app/
│   ├── academic/              # Academic module (lecturers, modules, assessments)
│   │   ├── semester-modules/  # Example feature
│   │   │   ├── _server/       # repository.ts, service.ts, actions.ts
│   │   │   ├── _components/   # Form.tsx, other components
│   │   │   ├── _lib/          # types.ts, utilities
│   │   │   ├── new/page.tsx
│   │   │   ├── [id]/page.tsx
│   │   │   ├── [id]/edit/page.tsx
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx
│   │   │   └── index.ts       # Re-exports
│   │   └── _database/         # Module-specific schemas
│   │       ├── schema/
│   │       ├── relations.ts
│   │       └── index.ts
│   ├── registry/              # Student records, registration
│   ├── finance/               # Payments, sponsors
│   ├── admin/                 # User management, tasks
│   ├── lms/                   # Moodle integration
│   ├── timetable/             # Class scheduling
│   ├── auth/                  # Authentication
│   ├── audit-logs/            # Activity logging
│   ├── dashboard/             # Main dashboard shell
│   └── student-portal/        # Student-facing portal (different layout)
├── core/
│   ├── database/              # Aggregated schemas, db instance
│   ├── platform/              # BaseRepository, BaseService, withAuth
│   └── auth.ts
├── shared/
│   ├── ui/adease/             # Reusable components (Form, ListLayout, DetailsView)
│   └── lib/utils/             # colors.ts, status.tsx, utilities
└── config/
```

## Path Aliases

| Alias | Path |
|-------|------|
| `@/*` | `./src/*` |
| `@academic/*` | `./src/app/academic/*` |
| `@registry/*` | `./src/app/registry/*` |
| `@finance/*` | `./src/app/finance/*` |
| `@admin/*` | `./src/app/admin/*` |
| `@lms/*` | `./src/app/lms/*` |
| `@timetable/*` | `./src/app/timetable/*` |
| `@auth/*` | `./src/app/auth/*` |
| `@audit-logs/*` | `./src/app/audit-logs/*` |

## Naming Conventions

| Layer | Pattern | Example |
|-------|---------|---------|
| Table | `snake_case` plural | `semester_modules` |
| Column (TS) | `camelCase` | `moduleId`, `createdAt` |
| Raw SQL | `snake_case` | `SELECT module_id FROM semester_modules` |
| Schema export | `camelCase` plural | `export const semesterModules = pgTable(...)` |
| Repository class | `PascalCase` + Repository | `SemesterModuleRepository` |
| Service class | `PascalCase` + Service | `SemesterModuleService` |
| Service export | `camelCase` + Service | `semesterModulesService` |
| Actions | `verb` + `Entity` | `getSemesterModule`, `findAllModules`, `createModule` |
| Form component | `PascalCase` + Form | `ModuleForm` |
| Query keys | kebab-case array | `['semester-modules']` |

## Key Resources

### Adease UI Components
Located in `src/shared/ui/adease/`:
- `Form` - Form wrapper with TanStack Query integration
- `ListLayout` - Master-detail list view
- `DetailsView`, `DetailsViewHeader`, `DetailsViewBody` - Detail page components
- `FieldView` - Display field with label
- `ListItem` - List item for ListLayout
- `NewLink` - Add new item button
- `NothingSelected` - Empty state component

### Platform Classes
Located in `src/core/platform/`:
- `BaseRepository` - CRUD operations with pagination
- `BaseService` - Service layer with role-based auth
- `withAuth` - Authentication wrapper
- `serviceWrapper` - Service proxy with logging

### Color & Status Utilities
- `src/shared/lib/utils/colors.ts` - Semantic colors, status colors
- `src/shared/lib/utils/status.tsx` - Status icons

## Special Modules

### Moodle/LMS Integration
Before editing `src/app/lms/`, always read `C:\Users\nthol\Documents\Projects\Limkokwing\Registry\moodle-plugins\moodle-local_activity_utils\README.md` first. You may edit the moodle-local_activity_utils if necessary, but always ask for approval first. Ask for approval before modifying.

### Student Portal
`src/app/student-portal` uses a unique layout different from dashboard modules. Does not follow `adease` patterns.
