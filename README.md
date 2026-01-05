# Registry Web

University student registration portal managing academic records, course registrations, and administrative workflows for Limkokwing University.

## Overview

Registry Web is a comprehensive Next.js-based modular monolith application that provides:

- **Academic Management**: Semester modules, assessments, attendance, gradebook, lecturers, and schools
- **Student Registry**: Student records, registration, graduation, certificates, and documents
- **Finance**: Payments, sponsors, blocked students, and financial reports
- **LMS Integration**: Moodle course sync, assignments, quizzes, gradebook, and virtual classroom
- **Timetable**: Class scheduling, venue management, and allocation
- **Administration**: User management, tasks, notifications, and reporting
- **Student Portal**: Self-service portal for students with different layout
- **Audit Logs**: Activity tracking and compliance

## Tech Stack

### Backend
- **Next.js 16** - App Router, React 19, Server Components, Server Actions
- **Drizzle ORM** - Type-safe SQL with PostgreSQL (Neon serverless or local)
- **Auth.js v5** - Google OAuth authentication
- **Winston** - Logging

### Frontend
- **React 19** - Server Components and Client Components
- **Mantine v8** - Complete UI component library
- **TanStack Query v5** - Server state management and data fetching
- **Tabler Icons** - Icon library
- **Jotai** - Lightweight state management
- **React Hook Form** - Form management
- **Zod** - Schema validation

### Additional Services
- **Cloudflare R2** - Object storage for files and documents
- **Google Sheets API** - Data exports and imports
- **Moodle** - LMS integration via REST API

### Tooling
- **TypeScript** - Strict mode enabled
- **Biome** - Fast linter and formatter
- **pnpm** - Fast, efficient package manager
- **Vitest** - Unit testing framework
- **Drizzle Kit** - Database migrations

## Project Structure

```
src/
├── app/
│   ├── academic/              # Academic module
│   │   ├── _database/         # Academic schemas
│   │   ├── semester-modules/  # Feature: Semester modules
│   │   ├── assessments/       # Feature: Assessments
│   │   ├── attendance/        # Feature: Attendance
│   │   ├── gradebook/         # Feature: Gradebook
│   │   ├── lecturers/         # Feature: Lecturers
│   │   ├── modules/           # Feature: Academic modules
│   │   ├── schools/           # Feature: Schools/Programs
│   │   └── academic.config.ts
│   ├── registry/              # Student registry module
│   │   ├── _database/
│   │   ├── students/          # Student records
│   │   ├── registration/      # Course registration
│   │   ├── graduation/        # Graduation management
│   │   ├── certificates/      # Certificate generation
│   │   └── registry.config.ts
│   ├── finance/               # Finance module
│   │   ├── _database/
│   │   ├── sponsors/          # Sponsor management
│   │   ├── blocked-students/  # Financial blocks
│   │   └── finance.config.ts
│   ├── admin/                 # Administration module
│   │   ├── _database/
│   │   ├── users/             # User management
│   │   ├── tasks/             # Task management
│   │   ├── notifications/     # Notifications
│   │   └── admin.config.ts
│   ├── lms/                   # Moodle integration
│   │   ├── courses/           # Course sync
│   │   ├── assignments/       # Assignment management
│   │   ├── quizzes/           # Quiz management
│   │   └── lms.config.tsx
│   ├── timetable/             # Timetable module
│   │   ├── _database/
│   │   ├── venues/            # Venue management
│   │   ├── slots/             # Time slots
│   │   └── timetable.config.ts
│   ├── audit-logs/            # Activity logging
│   ├── student-portal/        # Student-facing portal
│   │   ├── home/
│   │   ├── registration/
│   │   ├── graduation/
│   │   └── profile/
│   ├── dashboard/             # Main dashboard shell
│   └── auth/                  # Authentication
├── core/
│   ├── database/              # Centralized schema exports and db instance
│   ├── platform/              # Base classes and utilities
│   │   ├── BaseRepository.ts  # CRUD operations
│   │   ├── BaseService.ts     # Role-based auth layer
│   │   ├── withAuth.ts        # Auth wrapper
│   │   ├── serviceWrapper.ts  # Service proxy with logging
│   │   └── logger.ts
│   ├── integrations/
│   │   ├── moodle.ts          # Moodle API client
│   │   ├── storage.ts         # R2 storage
│   │   └── google-sheets.ts   # Google Sheets
│   └── auth.ts                # Auth.js configuration
├── shared/
│   ├── ui/
│   │   ├── adease/            # Reusable components
│   │   │   ├── Form.tsx
│   │   │   ├── ListLayout.tsx
│   │   │   ├── DetailsView.tsx
│   │   │   └── ...
│   │   └── ...
│   └── lib/
│       └── utils/
│           ├── colors.ts      # Semantic color mappings
│           ├── status.tsx     # Status icon mappings
│           └── utils.ts       # Utility functions
├── config/
│   └── modules.config.ts      # Module enable/disable config
└── test/
    └── setup.ts
```

## Architecture

### Layered Architecture
The application follows a strict layered architecture:

```
UI Components (Client/Server)
        ↓
Server Actions ('use server')
        ↓
Service Layer (BaseService + role auth)
        ↓
Repository Layer (BaseRepository + db queries)
        ↓
Database (PostgreSQL via Drizzle ORM)
```

### Key Principles
- **Ownership Rule**: Server Actions/Services/Repositories must live in the same module/feature that owns the schema/table
- **Single Database Import**: Only `repository.ts` files import `db` directly
- **Transaction Support**: Use `db.transaction` for multi-step writes
- **Query Optimization**: Avoid N+1 queries
- **Type Safety**: Derive types from Drizzle schemas using `$inferInsert` and `$inferSelect`

### Modular Structure
Each feature follows this structure:
```
feature-name/
├── _server/
│   ├── repository.ts    # Database queries
│   ├── service.ts       # Business logic + auth
│   └── actions.ts       # Server actions
├── _components/
│   └── Form.tsx         # UI components
├── _lib/
│   └── types.ts         # Type definitions
├── [id]/
│   ├── page.tsx         # Detail view
│   └── edit/page.tsx    # Edit page
├── new/page.tsx         # Create page
├── layout.tsx           # List layout
├── page.tsx             # Index page
└── index.ts             # Re-exports
```

## Getting Started

### Prerequisites
- **Node.js** 18+ (20+ recommended)
- **pnpm** 9+
- **PostgreSQL** (local or Neon serverless)
- **Google OAuth** credentials
- **Cloudflare R2** account (for file storage)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/ntholi/registry-web.git
   cd registry-web
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Configure environment variables**
   
   Create `.env.local` file in the root:
   ```env
   # Authentication
   AUTH_URL=http://localhost:3000
   AUTH_SECRET=your-secret-key-here
   AUTH_GOOGLE_ID=your-google-client-id
   AUTH_GOOGLE_SECRET=your-google-client-secret

   # Database
   DATABASE_ENV=local          # or 'remote' for Neon
   DATABASE_LOCAL_URL=postgresql://user:password@localhost:5432/registry
   DATABASE_REMOTE_URL=your-neon-connection-string

   # Cloudflare R2
   R2_ACCOUNT_ID=your-account-id
   R2_ACCESS_KEY_ID=your-access-key
   R2_SECRET_ACCESS_KEY=your-secret-key
   R2_BUCKET_NAME=your-bucket-name

   # Optional: Module toggles (default: all enabled)
   ENABLE_MODULE_ACADEMIC=true
   ENABLE_MODULE_REGISTRY=true
   ENABLE_MODULE_FINANCE=true
   ENABLE_MODULE_LMS=true
   ENABLE_MODULE_TIMETABLE=true
   ENABLE_MODULE_ADMIN=true
   ENABLE_MODULE_STUDENT_PORTAL=true
   ENABLE_MODULE_AUDIT_LOGS=true
   ```

4. **Initialize database**
   ```bash
   # Generate migrations
   pnpm db:generate

   # Apply migrations
   pnpm db:migrate

   # Optional: Open Drizzle Studio
   pnpm db:studio
   ```

5. **Start development server**
   ```bash
   pnpm dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server on port 3000 |
| `pnpm build` | Build for production |
| `pnpm start` | Start production server |
| `pnpm lint` | Run Biome linter |
| `pnpm lint:fix` | Fix linting issues automatically |
| `pnpm format` | Format code with Biome |
| `pnpm check` | Run linter and formatter |
| `pnpm test` | Run tests with Vitest |
| `pnpm db:generate` | Generate database migrations |
| `pnpm db:migrate` | Apply database migrations |
| `pnpm db:push` | Push schema to database (dev only) |
| `pnpm db:studio` | Open Drizzle Studio |

## Path Aliases

The project uses TypeScript path aliases for cleaner imports:

| Alias | Path | Usage |
|-------|------|-------|
| `@/*` | `./src/*` | Core imports |
| `@academic/*` | `./src/app/academic/*` | Academic module |
| `@registry/*` | `./src/app/registry/*` | Registry module |
| `@finance/*` | `./src/app/finance/*` | Finance module |
| `@admin/*` | `./src/app/admin/*` | Admin module |
| `@lms/*` | `./src/app/lms/*` | LMS module |
| `@timetable/*` | `./src/app/timetable/*` | Timetable module |
| `@auth/*` | `./src/app/auth/*` | Auth module |
| `@audit-logs/*` | `./src/app/audit-logs/*` | Audit logs module |
| `@student-portal/*` | `./src/app/student-portal/*` | Student portal module |

## Development Guidelines

### Naming Conventions

| Layer | Pattern | Example |
|-------|---------|---------|
| Database table | `snake_case` plural | `semester_modules` |
| TypeScript column | `camelCase` | `moduleId`, `createdAt` |
| Schema export | `camelCase` plural | `export const semesterModules = pgTable(...)` |
| Repository class | `PascalCase` + Repository | `SemesterModuleRepository` |
| Service class | `PascalCase` + Service | `SemesterModuleService` |
| Service export | `camelCase` + Service | `semesterModulesService` |
| Server actions | `verb` + `Entity` | `getSemesterModule`, `createModule` |
| Form component | `PascalCase` + Form | `ModuleForm` |
| Files/directories | `kebab-case` | `semester-modules/` |
| Query keys | `kebab-case` array | `['semester-modules']` |

### Code Style

- Use `function name() {}` for exports, never arrow functions at top level
- Derive types from Drizzle: `typeof table.$inferInsert`, `typeof table.$inferSelect`
- No comments - code should be self-explanatory
- Component order: Props type → constants → default export → private components
- Use short but meaningful identifier names
- Avoid `any` at all costs - use strict typing
- Use `interface` for object definitions, `type` for unions/intersections

### React & Next.js Patterns

- **Server Components**: Use by default. Only add `'use client'` for interactivity
- **Server Actions**: Use for all mutations (marked with `'use server'`)
- **Data Fetching**: Use async/await in RSC for initial load, TanStack Query for client state
- **Forms**: Use `Form` component from `@/shared/ui/adease/`
- **Error Handling**: Use guard clauses and early returns
- **Action Results**: Return consistent `{ data, error }` or `{ success, message }` objects

### UI Development

- **Styling**: Mantine v8 only - no custom CSS or Tailwind
- **Colors**: Use `src/shared/lib/utils/colors.ts` for all semantic colors
- **Status Icons**: Use `src/shared/lib/utils/status.tsx` for status icons
- **Dark Mode**: Optimize all UI for dark mode
- **Dates**: Use `YYYY-MM-DD` format
- **Modals**: Must be self-contained with their own trigger

### Domain Concepts

- **Class**: Student cohort ID format: `[ProgramCode][SemesterMini]` (e.g., `DITY1S1`)
  - Use `getStudentClassName(structureSemester)` from `@/shared/lib/utils/utils`
- **Term Code**: Format as `YYYY-MM` (e.g., `2025-02`)
- **School/Faculty**: Use "School" throughout the codebase
- **Dates**: Always format as `YYYY-MM-DD`

### What NOT to Do

- ❌ Never use `useEffect` for data fetching
- ❌ Never use custom CSS or Tailwind
- ❌ Never use the `pages` router
- ❌ Never import `db` outside of `repository.ts` files
- ❌ Never use arrow functions for top-level exports
- ❌ Never hardcode colors or status icons
- ❌ Never use `any` or `unknown` without good reason

## Testing

The project uses Vitest for testing:

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test --watch

# Run tests with coverage
pnpm test --coverage
```

Test configuration: `vitest.config.mjs`
Test setup: `src/test/setup.ts`

## Module Overview

### Academic Module
Manages academic operations including:
- Schools and programs
- Modules and semester modules
- Assessments and marks
- Attendance tracking
- Gradebook
- Lecturer management

### Registry Module
Handles student records and registration:
- Student profiles and records
- Course registration
- Graduation management
- Certificate generation
- Document management

### Finance Module
Financial operations:
- Sponsor management
- Payment tracking
- Blocked students (financial holds)
- Financial reports

### LMS Module (Moodle Integration)
Integrates with Moodle LMS:
- Course synchronization
- Assignment management
- Quiz management
- Gradebook sync
- Virtual classroom
- Material distribution

### Timetable Module
Class scheduling:
- Venue management
- Time slot configuration
- Timetable allocation
- Schedule viewer

### Admin Module
Administrative functions:
- User management
- Task tracking
- Notifications
- Bulk operations
- System reports

### Student Portal
Self-service portal for students:
- Personal dashboard
- Course registration
- Graduation application
- Profile management
- Different layout from admin dashboard

### Audit Logs
Activity tracking and compliance logging

## Deployment

The application is designed to be deployed on platforms that support Next.js:

- **Vercel** (recommended)
- **Railway**
- **Render**
- **Self-hosted** with Node.js

### Build for Production

```bash
pnpm build
pnpm start
```

### Environment Variables

Ensure all required environment variables are set in your deployment platform.

## Contributing

When contributing to this project:

1. Follow the established architecture and patterns
2. Use the provided `create-feature` skill for scaffolding new features
3. Run linter and type checker before committing:
   ```bash
   pnpm tsc --noEmit && pnpm lint:fix
   ```
4. Write self-documenting code (no comments needed)
5. Test your changes thoroughly

## License

Private - Limkokwing University

## Support

For issues or questions, contact the development team or create an issue in the repository.
