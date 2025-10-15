## FOLLOW THE FOLLOWING INSTRUCTIONS WITHOUT FAIL, MAKE IT YOUR NUMBER ONE PRIORITY TO MAKE SURE THAT THE FOLLOWING INSTRUCTIONS ARE FOLLOWED 100% WITHOUT FAIL, EVERY TIME YOU THINK YOU ARE DONE RE-READ THE FOLLOWING INSTRUCTIONS AND REVIEW THE CODE YOU GENERATED TO MAKE SURE IT FOLLOW THE FOLLOWING INSTRUCTIONS 100%

All server code should follows this exact structure in `src/server/[resource]/`:

1. **`actions.ts`** - Server actions for client consumption (uses `'use server'`)
2. **`service.ts`** - Business logic with authentication via `withAuth()`, wrapped with `serviceWrapper()`
3. **`repository.ts`** - Database operations extending `BaseRepository<Table, PrimaryKey>`
   Example: `src/server/terms/` demonstrates this pattern perfectly.

- Avoid by all means multiple calls to the database
- Use **Turso SQLite** via Drizzle ORM with schema in `src/db/schema.ts`
- Use `db.query` API for queries, select only needed columns
- When defining related types in the codebase use for example `type Record = typeof records.$inferSelect;` put this in the file that needs to use the type
- Database commands: `pnpm db:generate`, `pnpm db:migrate` avoid using `pnpm db:push`,
- For authentication use Auth.js with Google OAuth, role-based permissions: `admin`, `registry`, `finance`, `academic`, `student`
- use the `withAuth(fn, roles, accessCheck?)` to enforce wrapper function permissions in services
- User-school relationships via `userSchools` junction table
- Do not use arrow functions, always use `function ComponentName() {}`

## Development Guidelines

- **Use pnpm exclusively** - never npm/yarn

### Frontend Patterns

- **Never use API routes** - call server actions directly via `actions.ts`
- **TanStack Query** for all data fetching, avoid useEffect
- **List-detail layout**: Use `ListLayout` component with responsive mobile support
- **Co-locate modals** with their triggers to avoid prop drilling
- **Self-contained components** - extract logic, minimize prop drilling

### UI Framework (Mantine v8)

- Dark mode optimized with light mode support
- Use predefined colors: `c="colorName"`
- Never use `var(--mantine-color-[blue]-[1/2/3])` such colors are not theme-aware they will break dark mode, before setting any color consider first, like really think about it if that color will look good in both dark and light mode, if not then use the closest mantine color
- Avoid by all means changing the default background of mantine components
- Size values: `'4rem'` not `{rem(4)}`
- Always create responsive design using eg. `Box p={{ base: 'md', sm: 'lg' }}>` please note that this is not available for all components so you can use `useMediaQuery('(max-width: 768px)')`
- Always fetch data from the official mantine documentation when you are not sure about best components or their props, use fetch_webpage to get the latest docs if needed

### Code Quality

- NEVER USE AND NEVER DEFINE `any` TYPES, NEVER EVER DO THAT! Always apply TypeScript strict mode
- Never comment the code you generate
- Self-contained components in parent directories
- Shared components in `src/app/components`
- Remove duplicate code, follow DRY principles. avoid code duplication by all means possible. Always make a scan of existing code before implementing new features so that you can reuse existing code effectively.

### Other Things to Note

- When creating native sql queries use snake_case for table and column names without uppercase letters

- **NEVER generate documentation files** - Do not create or update `.md`, `.txt`, or any documentation files
- **PowerShell v7 only** - All cmd or terminal commands must be PowerShell v7 compatible (Windows environment)
