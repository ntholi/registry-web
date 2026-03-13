# Limkokwing Registry Portal

Student information system for Limkokwing University covering enrollment, classes, finance, and admin workflows.

## Stack

- Next.js 16 (App Router, React 19, Server/Client Components, Server Actions)
- TypeScript (strict) with Biome
- Mantine 8 UI, Adease components, Tabler Icons
- TanStack Query 5, Zod validation
- Better Auth (Google OAuth)
- Drizzle ORM + PostgreSQL (Neon or local)
- pnpm as package manager

## Architecture

- Next.js App Router with shared shell in `src/app/layout.tsx` and providers (Mantine, TanStack Query, Better Auth client, Nuqs) in `src/app/providers.tsx`.
- Feature folders under `src/app/*` (academic, registry, finance, admin, lms, timetable, auth, audit-logs, student-portal) own their UI, server actions, services, repositories, and Drizzle schemas.
- Server Actions call feature services/repositories in `_server/`; repositories are the only place that import Drizzle tables and handle transactions when needed.
- Data flow: initial load via React Server Components; mutations/forms use Adease `Form` + TanStack Query in client leaf components.
- Styling stays within Mantine tokens; shared colors/status helpers live in `src/shared/lib/utils/`.

## Project Structure

```
src/
	app/
		academic/      # academic domain
		registry/      # student records & registration
		finance/       # payments & sponsors
		admin/         # users & tasks
		lms/           # Moodle integration
		timetable/     # class scheduling
		auth/          # authentication
		audit-logs/    # activity logs
		student-portal/# student-facing area
	core/            # db instance, platform base classes
	shared/          # Adease UI, utilities, theme helpers
	config/          # app-level configuration
drizzle/           # generated SQL migrations
public/            # static assets
```

## Setup

Requirements: Node.js 18+, pnpm 9+, PostgreSQL running locally or Neon.

Create `.env.local` with at least:

```
BETTER_AUTH_SECRET=
BETTER_AUTH_URL=
BETTER_AUTH_TRUSTED_ORIGINS=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
DATABASE_ENV=local|remote
DATABASE_LOCAL_URL=postgresql://...
DATABASE_REMOTE_URL=
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=
NEXT_PUBLIC_R2_PUBLIC_URL=
```

## Commands

```
pnpm install             # install deps
pnpm db:generate         # generate migrations from Drizzle schema (do not handcraft new .sql files)
pnpm db:migrate          # apply migrations
pnpm dev                 # start dev server
pnpm lint:fix            # lint and format
pnpm tsc --noEmit        # type-check
pnpm test                # run tests
pnpm build && pnpm start # production build + serve
```

## Development Notes

- Keep modules self-contained; reuse actions/services via path aliases rather than duplicating logic.
- Use Adease layout components for lists/details and Mantine form primitives for inputs.
- Prefer early returns with Zod validation for all inputs.

## R2 Storage

Files are stored in Cloudflare R2 with a structured folder hierarchy:

```
registry/students/photos/         — Student profile photos (keyed by stdNo)
registry/students/documents/      — Student documents (transcripts, etc.)
registry/terms/publications/      — Term publication attachments
human-resource/employees/photos/  — Employee profile photos (keyed by empNo)
admissions/applicants/documents/  — Applicant supporting documents
admissions/deposits/              — Deposit receipt scans
library/question-papers/          — Past exam papers
library/publications/             — Faculty publications
```

- **Path builders**: Use `StoragePaths` from `@/core/integrations/storage-utils` for all R2 keys.
- **URL resolution**: Use `getPublicUrl(key)` — never hardcode the R2 domain.
- **Upload**: Use `uploadFile(file, key)` from `@/core/integrations/storage` — never construct keys manually.
- **DB storage**: Store R2 keys (not full URLs) in `fileUrl` / `storageKey` / `photoKey` columns.
- **New modules**: Add a new path builder to `StoragePaths` when adding file storage to a new feature.

Env vars: `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `NEXT_PUBLIC_R2_PUBLIC_URL`.
