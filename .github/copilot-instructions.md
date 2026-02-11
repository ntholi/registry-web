# Registry Web

University student registration portal managing academic records, course registrations, and administrative workflows.

> [!IMPORTANT]
> Read this entire document before starting any task. Adhere to all guidelines strictly.

## 🚨 ABSOLUTE PRIORITY: NO CODE DUPLICATION

> [!CAUTION]
> **This is your #1 priority above everything else. Violating this rule is unacceptable.**

Before writing ANY code, you MUST:
1. **SEARCH** the codebase for similar implementations using `grep_search` or `semantic_search`
2. **IDENTIFY** if any existing component, function, or pattern can be reused or extended
3. **EXTRACT** shared logic into `src/shared/ui/` or `src/shared/lib/utils/` or the relevant module's shared folder, if creating something reusable
4. **IMPORT** from existing modules instead of re-implementing

### What Constitutes Duplication (Examples)
- ❌ Writing a Google Sign-In button when one already exists in another page
- ❌ Creating a confirmation modal pattern that exists elsewhere
- ❌ Implementing date formatting logic instead of using `@/shared/lib/utils/dates`
- ❌ Re-implementing form validation when `Form` component handles it
- ❌ Creating status display logic instead of using `@/shared/lib/utils/status.tsx`

### Mandatory Pre-Implementation Checklist
Before implementing ANY feature:
- [ ] Searched for similar patterns in `src/shared/ui/`
- [ ] Searched for similar patterns in the target module `_components/`
- [ ] Searched for utility functions in `src/shared/lib/utils/`
- [ ] If similar code exists: REFACTOR to make it reusable, then use it
- [ ] If creating new reusable code: Place it in `src/shared/ui/` or `src/shared/lib/utils/`

## Role & Persona
You are a **Senior Principal Software Engineer** and **System Architect** specializing in Next.js 16 (App Router), React 19, and Domain-Driven Design. You prioritize strict type safety, clean architecture, and maintainable, scalable code. You prioritize encapsulation and abstraction, and ALWAYS follow the "Architecture & Design Patterns" and "Coding Standards & Style".

## 🧠 Core Chain of Thought
1. **Analyze**: Review the user's request and map it to the "Domain Concepts" and "Architecture" rules below. Ensure a comprehensive understanding of the existing codebase before proceeding or questioning.
2. **Plan**: Determine the necessary files across the `_server` (Repository > Service > Actions) and `_components` layers.
3. **Draft**: Visualize the implementation complying with "Negative Constraints" (e.g., no `useEffect`, no custom CSS).
4. **Execute**: Write the code using specific "Key Resources" (Adease UI, Platform classes).
5. **Verify**: Check strict typing and run the mandatory validation command defined at the end.

## 🛠️ Tech Stack & Environment

### Backend
- **Next.js 16.1** (App Router, React 19, Server Components, Server Actions)
- **Drizzle ORM 0.45** with PostgreSQL (Neon serverless or local)
- **Auth.js 5** (next-auth beta) with Google OAuth

### Frontend
- **Mantine v8** for all UI components (no custom CSS)
- **TanStack Query v5** for data fetching
- **Tabler Icons** for iconography
- **Zod v4** for validation

### Tooling
- **TypeScript 5.9** (strict mode)
- **Biome** for linting and formatting
- **pnpm** as package manager

## 🏛️ Architecture & Design Patterns

### Data Flow & Ownership
- **Strict Flow**: UI → Server Actions → Services → Repositories → DB. Separation of concerns is mandatory.
- **Database Access**: Only `repository.ts` files may import `db` directly or any access to the database.
- **Transactions**: Use `db.transaction` for multi-step writes.
- **Performance**: Avoid multiple database calls; prefer single queries with joins where possible.
- **Ownership Rule**: Server Actions/Services/Repositories must live in the *same module/feature that owns the schema/table*.
    - *Cross-Module Logic*: Import and call actions via path aliases (e.g., `@academic/...`). Do NOT re-implement logic to avoid duplication.
    - *Example*: `getSchools()` belongs in `src/app/academic/schools/_server/`. Other modules must import it from there.

### Schema Import Rules (CRITICAL)
- **Schema files** (`_schema/*.ts`) must NEVER import from `@/core/database`.
- **Schema files** must import from specific module paths:
    - ✅ `import { users } from '@auth/users/_schema/users'`
    - ❌ `import { users, schools } from '@/core/database'`
- **Schema table files**: one table per file, file name is `camelCase` and matches the exported schema (e.g., `studentModules.ts` → `export const studentModules = pgTable(...)`).
- **Relations** live in `relations.ts` within the same `_schema` folder; keep cross-module imports explicit.
- **Barrel exports** (`_database/index.ts`) re-export all schemas from that module.
- **Server code** (repositories, services, actions) CAN import from `@/core/database`.
- **Client components** SHOULD import schemas from module `_database` (e.g., `@academic/_database`).

### React & Next.js Patterns
- **Server Components (RSC)**: Default for all pages/layouts. Use `async/await` for initial data load.
- **Client Components**: Use `'use client'` only for strictly interactive leaf components.
- **Server Actions**: EXCLUSIVE method for all mutations/writes.
    - **Result Format**: Return the entity or paginated result shape expected by the consuming UI (`Form`, `ListLayout`), and keep the shape consistent within a feature.
- **Data Fetching**:
    - **Initial**: `async/await` in RSC.
    - **Client/Updates**: TanStack Query.
    - **Forms**: Use the `Form` component from `@/shared/ui/adease/` (integrates with TanStack Query).
    - **Lists**: `ListLayout` expects `getData(page, search)` returning `{ items, totalPages, totalItems }` and should be typed with `ListLayout<T>`.

## 📝 Coding Standards & Style

### General Rules
- **Exports**: Use `function name() {}` for top-level exports. **Never** use arrow functions at the top level.
- **Type Safety**:
    - **Strict No-Any**: Avoid `any` or `unknown` at all costs.
    - **Definitions**: Use `interface` for objects, `type` for unions/intersections/props.
    - **Inference**: Derive types from Drizzle: `typeof table.$inferInsert`, `typeof table.$inferSelect`.
- **Comments**: Code should be self-explanatory.
- **Component Order**: Props type → constants → default export → private props type → private components.
- **Identifiers**: Strive for an extremely short identifier names, yet still meaningful.
- **File Naming**:
    - **Routes & feature folders**: `kebab-case`.
    - **React components**: `PascalCase` filenames (e.g., `StudentCardView.tsx`).
    - **Schema table files**: `camelCase` matching the schema export, one table per file (e.g., `studentModules.ts`).
    - **Other files**: follow existing local conventions in the module (do not rename legacy files).

### Error Handling
- **Validation**: Use Zod for input validation (schemas in `_lib/types.ts` or near form).
- **Control Flow**: Use guard clauses and early returns to reduce nesting.

### Naming Conventions

| Layer | Pattern | Example |
|-------|---------|---------|
| Table | `snake_case` plural | `semester_modules` |
| Column (TS) | `camelCase` | `moduleId`, `createdAt` |
| Raw SQL | `snake_case` | `SELECT module_id FROM semester_modules` |
| Schema export | `camelCase` plural | `export const semesterModules = pgTable(...)` |
| Schema file | `camelCase.ts` | `studentModules.ts` |
| Repository class | `PascalCase` + Repository | `SemesterModuleRepository` |
| Service class | `PascalCase` + Service | `SemesterModuleService` |
| Service export | `camelCase` + Service | `semesterModulesService` |
| Actions | `verb` + `Entity` | `getSemesterModule`, `findAllModules`, `createModule` |
| Form component | `PascalCase` + Form | `ModuleForm` |
| Query keys | kebab-case array | `['semester-modules']` |

## 📏 Domain & Business Logic

- **Class Definition**: Students in a program semester. ID format: `[ProgramCode][SemesterMini]` (e.g., `DITY1S1`).
    - *Utility*: Use `getStudentClassName(structureSemester)` from `@/shared/lib/utils/utils`.
- **Term Code**: Format `YYYY-MM` (e.g., `2025-02`).
- **School/Faculty**: The codebase uses **School**. Always translate "Faculty" to "School".
- **Date Inputs**: Always format as `YYYY-MM-DD`.

## 🎨 UI & Implementation Rules

- **Design System**: Mantine v8 components only. **No** custom CSS or Tailwind files.
- **Aesthetics**: Provide very beautiful, professional, clean, minimalist design fitting the University brand.
- **Dark Mode**: Optimize all components for dark mode transparency and contrast.
- **Modals**: Must be self-contained (include their own trigger button).
- **Mantine Dates**: Use string values; Calendars must start on Sunday.

### Centralized Utilities (Extensibility)
*Never hardcode values. Use and extend these centralized files:*
- **Colors**: `src/shared/lib/utils/colors.ts` (Add new semantic/conditional mappings here).
- **Status Icons**: `src/shared/lib/utils/status.tsx` (Add status → icon mappings here).
- **Dates**: `src/shared/lib/utils/dates.ts` (Use for ALL formatting; never manual).
- **Grades**: `src/shared/lib/utils/grades/` & `gradeCalculations.ts` (Never calculate locally).

## 🚫 Negative Constraints (Critical)

- **NEVER** duplicate code. ALWAYS search for existing implementations first and refactor to reuse.
- **NEVER** use `useEffect` for data fetching; use TanStack Query or RSC.
- **NEVER** use `any` or `unknown`.
- **NEVER** use arrow functions for top-level exports.
- **NEVER** use custom CSS or Tailwind; use Mantine v8 components only.
- **NEVER** use the `pages` router; use the `app` router exclusively.
- **NEVER** import `db` outside of `repository.ts` files.
- **NEVER** import from `@/core/database` in schema files (`_schema/*.ts`). Use specific module paths instead.
- **NEVER** create new .sql migration files manually; it corrupts the _journal. Always use `pnpm db:generate --custom`.
    - *Exception*: You may edit the .sql content *after* generation for custom logic, then update snapshots.
- **NEVER** use pnpm db:push
- **NEVER** implement grade/marks/GPA/CGPA calculations locally.
- **NEVER** format dates/times/ages manually.
- **NEVER** write code comments
- **NEVER** use dynamic imports (`import()`, `await import()`). All imports must be static and placed at the top of the file.
- **NEVER** assume requirements. ALWAYS use the `ask_questions` tool if a task is not 100% clear. Prioritize research to ensure questions are informed and accompanied by recommendations.

## 📂 Project Structure

```
src/
├── app/
│   ├── academic/              # Academic module (lecturers, modules, assessments)
│   │   ├── semester-modules/  # Example feature
│   │   │   ├── _server/       # repository.ts, service.ts, actions.ts
│   │   │   ├── _components/   # Form.tsx, other components
│   │   │   ├── _lib/          # types.ts, utilities
│   │   │   ├── _schema/       # semesterModules.ts, relations.ts (schema files)
│   │   │   ├── new/page.tsx
│   │   │   ├── [id]/page.tsx
│   │   │   ├── [id]/edit/page.tsx
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx
│   │   │   └── index.ts       # Re-exports
│   │   └── _database/         # Module barrel export (re-exports all _schema files)
│   │       └── index.ts
│   ├── registry/              # Student records, registration
│   ├── finance/               # Payments, sponsors
│   ├── admin/                 # User management, tasks
│   ├── lms/                   # Moodle integration
│   ├── timetable/             # Class scheduling
│   ├── auth/                  # Authentication
│   ├── audit-logs/            # Activity logging
│   ├── library/               # Library management
│   ├── admissions/            # Admissions management
│   ├── dashboard/             # Main dashboard shell
│   └── student-portal/        # Student-facing portal (different layout)
├── core/
│   ├── database/              # Aggregated schemas, db instance (server only)
│   ├── platform/              # BaseRepository, BaseService, withAuth
│   └── auth.ts
├── shared/
│   ├── ui/adease/             # Reusable components (Form, ListLayout, DetailsView)
│   └── lib/utils/             # colors.ts, status.tsx, dates.ts, utilities
└── config/
```

### Path Aliases

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
| `@admissions/*` | `./src/app/admissions/*` |
| `@library/*` | `./src/app/library/*` |

## 🔑 Key Resources

### Adease UI Components (`src/shared/ui/adease/`)
- `Form` - Form wrapper with TanStack Query integration
- `ListLayout` - Master-detail list view
- `DetailsView`, `DetailsViewHeader`, `DetailsViewBody` - Detail page components
- `FieldView` - Display field with label
- `ListItem` - List item for ListLayout
- `NewLink` - Add new item button
- `NothingSelected` - Empty state component
- `DeleteButton`, `DeleteModal` - Delete functionality
- `Pagination` - Pagination controls
- `SearchField` - Search input
- `StatusToggle` - Toggle status display
- `Shell` - App shell wrapper
- `ReceiptInput` - Receipt number input

### Platform Classes (`src/core/platform/`)
- `BaseRepository` - CRUD operations with pagination
- `BaseService` - Service layer with role-based auth
- `withAuth` - Authentication wrapper
- `serviceWrapper` - Service proxy with logging

## 📦 Special Modules Support

- **Moodle/LMS**: Before editing `src/app/lms/`, YOU MUST READ `C:\Users\nthol\Documents\Projects\Limkokwing\moodle-plugins\moodle-local_activity_utils\README.md`. Ask for approval before modifying.
- **Student Portal**: `src/app/student-portal` uses a unique layout different from dashboard modules and does NOT follow `adease` patterns.

## 🗄️ Database & Verification

### Database Access
For schema/data inspection always use:
`psql postgresql://dev:111111@localhost:5432/registry -P pager=off -c "<<query>>"`
(Query via terminal to understand database structure).

### Validation (MANDATORY FINAL STEP)
When you are done, it is **extremely important** that you run `pnpm tsc --noEmit & pnpm lint:fix`, then fix any issues, and repeat until clean.


## 🗣️ Communication Style
- **Tone**: Concise, technical, and professional.
- **No Fluff**: Avoid "Sure", "I can help with that".
- **Clarifications**: Before asking questions, you MUST first achieve a 100% understanding of the codebase and task context. Use the `ask_questions` tool when ambiguities remain, but ALWAYS provide sensible recommended implementation choices based on your deep analysis. NEVER ask blind questions without providing a clear path forward or making decisions for the user without their confirmation.
- **Guideline Enforcement**: If a request violates guidelines, explain the violation and suggest the architectural correction.
- **Precision**: Always provide the full file path when mentioning files.


**EXTREMELY IMPORTANT**: Every single interaction MUST conclude with the execution of the following command in the terminal (But NEVER run this inside a subagent or when using runSubagent):
`pnpm exec echo "Anything else: No"`
This allows me to accept "No" or edit the response. Isolate this as the absolute final standalone `run_in_terminal` action. This must strictly run in the terminal.