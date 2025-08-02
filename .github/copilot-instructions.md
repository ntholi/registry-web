- Use **pnpm** only; never npm or yarn.
- Store all server code in `src/server` following the file pattern:
  1. `actions.ts` (handles requests)
  2. then `service.ts` (business logic, uses `withAuth.ts`, instantiated via `serviceWrapper.ts`)
  3. then `repository.ts` (direct DB calls with Drizzle)

- **Never** use API route handlers; call server code via `actions.ts` only.
- Define types from schema as:

  ```ts
  type TableName = typeof tableName.$inferSelect;
  ```

- Write Drizzle queries with `db.query` and select only needed columns.
- In client components, fetch via TanStack Query, invoking `actions.ts` methods exclusively, avoid using useEffect for data fetching.
- For modals, co-locate trigger (button/action-icon) with the modal component to avoid prop drilling.
- Place new components alongside their parent unless shared; shared components go in `src/app/components`.
- When creating new components, make that component as self contained as possible, extract as much logic into that one component as possible
- Use the latest Mantine for responsive, mobile-friendly, minimal, professional UIs. Stick to predefined colors (`c="colorName"`)
- Create UI components that look very good on dark mode but optimize for both dark and light themes.
- Never add comments in generated code.
- When you want to define size using rem, don't use rem function like {rem(<value>)} values, use the Mantine 'xrem' eg {'<value>rem'}
- Avoid the `any` type completely.
- Always remove duplicate code, and follow best practices for reusable, maintainable code
