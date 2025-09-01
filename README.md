# Limkokwing Student Portal

A modern web portal for Limkokwing University's Registry Department that manages student records, course registrations, and administrative processes.

## Tech Stack

### Frontend

- Next.js 15
- TypeScript
- Tailwind CSS
- Tanstack Query
- shadcn/ui & mantine components

### Backend

- Next.js Server Actions
- Drizzle ORM
- Turso (SQLite-compatible) database
- NextAuth.js for authentication

## Getting Started

1. **Environment Variables**: Copy `.env.example` to `.env.local` and configure your environment variables:

   ```bash
   cp .env.example .env.local
   ```

   Required variables:
   - `TURSO_DATABASE_URL`: Your Turso database URL
   - `TURSO_AUTH_TOKEN`: Your Turso authentication token
   - `AUTH_SECRET`: Secret for NextAuth.js
   - `AUTH_GOOGLE_ID` & `AUTH_GOOGLE_SECRET`: Google OAuth credentials

2. **Install dependencies**:

```bash
pnpm install
```

3. **Database Setup**:
   - Create a Turso database: `turso db create your-db-name`
   - Get database URL: `turso db show your-db-name`
   - Create auth token: `turso db tokens create your-db-name`
   - Update your `.env.local` with the credentials
   - Push database schema: `pnpm db:push`

4. **Run the development server**:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
