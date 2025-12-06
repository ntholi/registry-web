# Limkokwing Registry Portal

Next.js based portal for Limkokwing University that manages student records, course registrations, and administrative processes.

## Tech Stack

- Next.js 16 (App Router, React 19, TypeScript)
- Mantine 8, Jotai, React Hook Form, Zod
- TanStack Query 5
- Drizzle ORM + PostgreSQL (Neon or local)
- Auth.js (Google OAuth)
- Cloudflare R2, Google Sheets API

## Structure

```
src/
├ app/
├ components/
├ hooks/
├ server/
├ db/
├ utils/
├ atoms/
└ private/
```

## Setup

Requirements: Node.js 18+, pnpm 9+, PostgreSQL.

Create `.env.local`:

```
AUTH_URL=
AUTH_SECRET=
AUTH_GOOGLE_ID=
AUTH_GOOGLE_SECRET=
DATABASE_ENV=local|remote
DATABASE_LOCAL_URL=
DATABASE_REMOTE_URL=
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=
```

Commands:

```
pnpm install
pnpm db:generate
pnpm db:migrate
pnpm migrate:psql:full   # Neon sync
pnpm dev
pnpm lint
pnpm test
pnpm build
pnpm start
```

## Notes

- Actions → Service → Repository pattern with `withAuth` and `serviceWrapper`.
- Client data via TanStack Query calling server actions.
- Storage and exports use R2 and Google Sheets integrations.
