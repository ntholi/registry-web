- Only use pnpm not npm or yarn
- the server code is stored in src/server and the pattern I use for all server code is actions.ts -> service.ts -> repository ts. Never use api route handlers, always use actions.ts files to handle server code
- action.ts only contains calls to service.ts methods, service.ts contains business logic and calls to repository.ts methods, and repository.ts contains direct database calls using drizzle
- service.ts files should make use of withAuth.ts for authorization and always creates an instance of the service class using serviceWrapper.ts
- When creating types from the schema file, please use the syntax: `type TableName = typeof tableName.$inferSelect`.
- When writting drizzle queries, use the db.query method and try to only return the necessary columns
- When calling server code in the client components, use tanstack query and strictly call code in actions.ts files
  When creating modals if possible the button/action-icon should be extracted to the same file/component as the modal to avoid prop drilling and make it easier to manage state
- When breaking up components or creating additional functionality, put the new component in the same directory as the parent component, unless the component is a shared component, then put it in src/app/components
- Use mantine for UI components, and use the latest version of mantine, and create responsive very beautiful but minimalistic UI and very professional looking designs
