# Registry Web - LLM Context

**Stack**: Next.js 16 (App Router), Neon Postgres, Drizzle ORM, Mantine v8, Auth.js, TanStack Query. Modular monolith. Strict TypeScript. Biome linting.

## Critical Rules
1. **Architecture**: UI → Server Actions → Services → Repositories → DB. Only `repository.ts` imports `db`.
2. **Reuse First**: Check existing modules via aliases (`@registry/terms`, `@academic/module-grades`) before creating.
3. **Performance**: Use `db.transaction` for multi-step writes; avoid N+1 queries.
4. **UI**: Mantine-only styling (no custom CSS); follow existing ListLayout/DetailsView patterns; optimize for dark mode. Professional, clean, minimalist.
5. **No Comments**: Code should be self-explanatory.

## UI Colors & Status Icons
**Path**: `src/shared/lib/utils/colors.ts`, `src/shared/lib/utils/status.tsx`
**Rule**: Never hardcode colors for dynamic/semantic values. Always use the color utility functions. Similarly, never use hardcoded icons for status indicators; always use the status utility.

6. **Moodle/LMS**: every time before editing anything in the lms module, read `C:\Users\nthol\Documents\Projects\Limkokwing\Registry\moodle-plugins\moodle-local_activity_utils\README.md` first. You may edit this project if necessary, but always ask for approval first.
7. **Student Portal**: `src/app/student-portal` uses a unique layout. Unlike administration modules (Academic, Registry, etc.) which use `src/app/dashboard/dashboard.tsx` and `adease` patterns, the student portal does not follow these conventions.

## Path Aliases (tsconfig.json)
`@academic/*`, `@registry/*`, `@finance/*`, `@admin/*`, `@lms/*`, `@timetable/*`, `@auth/*`, `@audit-logs/*` → `src/modules/[module]/features/*`

## Structure
```
src/app/(module)/feature/           # Routes: layout.tsx, page.tsx, new/page.tsx, [id]/page.tsx, [id]/edit/page.tsx
src/modules/[module]/features/[feature]/
├── server/                         # repository.ts, service.ts, actions.ts
├── components/Form.tsx
├── index.ts                        # Re-export: components + actions
└── types.ts
src/core/database/                  # Aggregates schemas, centralized relations
src/core/platform/                  # BaseRepository, BaseService, withAuth, serviceWrapper
src/shared/ui/adease/               # Form, ListLayout, DetailsView, FieldView, ListItem, NewLink, NothingSelected
```

## Naming Conventions
| Layer | Pattern | Example |
|-------|---------|---------|
| Table | `snake_case` plural | `module_grades` |
| Column | `camelCase` | `stdNo`, `createdAt` |
| Schema export | `camelCase` plural | `export const moduleGrades = pgTable(...)` |
| Repository class | `PascalCase` + Repository | `ModuleGradeRepository` |
| Repository instance | `camelCase` + Repository | `moduleGradesRepository` |
| Service class | `PascalCase` + Service | `ModuleGradeService` |
| Service export | `camelCase` + Service | `moduleGradesService` |
| Actions | `verb` + `Entity` singular/plural | `getTerm`, `findAllTerms`, `createTerm`, `updateTerm`, `deleteTerm` |
| Form component | `PascalCase` + Form | `TermForm` |
| Query keys | kebab-case array | `['terms']`, `['module-grades']` |

## Standards
- Use `function name() {}` for exports, never arrow functions at top level
- Derive types from Drizzle: `typeof table.$inferInsert`, `typeof table.$inferSelect`
- Use TanStack Query for all data fetching (no `useEffect`)
- Dashboard features need `NavItem` in `module-name.config.ts` and inclusion in `src/app/dashboard/dashboard.tsx`
- Component order: Props type → constants → default export → private components
- **Always run**: `pnpm tsc --noEmit` and `pnpm lint:fix` (iterate until clean)