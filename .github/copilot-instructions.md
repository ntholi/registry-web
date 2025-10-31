## MANDATORY INSTRUCTIONS — FOLLOW 100%  

### Server Structure (`src/server/[resource]/`)  
1. `actions.ts` – Server actions (`'use server'`) for client use  
2. `service.ts` – Business logic using `withAuth()` wrapped with `serviceWrapper()`  
3. `repository.ts` – DB ops extending `BaseRepository<Table, PrimaryKey>` (see `src/server/terms/`)  

- Avoid multiple DB calls  
- Use **Neon PostgreSQL** + Drizzle ORM (`src/db/schema.ts`)  
- Use `db.query`, select only required columns  
- For related types: `type Record = typeof records.$inferSelect`  
- DB cmds: `pnpm db:generate`, `pnpm db:migrate` (never `pnpm db:push`)  
- Auth: Auth.js (Google OAuth), roles = `admin`, `registry`, `finance`, `academic`, `student`  
- Use `withAuth(fn, roles, accessCheck?)` for permissions  
- User-school link: `userSchools` table  
- Never arrow functions — always `function Name() {}`  

### Development  
- Use **pnpm only**  

### Frontend  
- Never API routes — call server actions via `actions.ts`  
- Use **TanStack Query** (no `useEffect`)  
- Use **ListLayout** with responsive support  
- Co-locate modals with triggers  
- Keep components self-contained  

### UI (Mantine v8)  
- Dark mode first; support light  
- Use `c="colorName"`, never `var(--mantine-color-[blue]-[1/2/3])`  
- Don’t change Mantine default backgrounds  
- Size: `'4rem'` not `{rem(4)}`  
- Responsive: `p={{ base: 'md', sm: 'lg' }}` or `useMediaQuery('(max-width: 768px)')`  
- Check official docs (fetch if needed)  

### Code Quality  
- Never use/define `any`  
- TypeScript strict mode always  
- No comments  
- Self-contained: parent dirs  
- Shared comps in `src/app/components`  
- Follow DRY; reuse code  

### Very Important Rules  
- SQL names: snake_case, lowercase  
- Never create/update docs (`.md`, `.txt`, etc.)  
- PowerShell v7 only  
- Always fix all lint errors → `pnpm lint --fix` repeatedly until 0 errors  
- Always test and ensure commands/code run cleanly with no errors before finishing  
