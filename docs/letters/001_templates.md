# Part 1: Letter Templates

> Implements template CRUD with card grid UI and modal-based create/edit.

## Schema

### `letter_templates` table (`_schema/letterTemplates.ts`)

| Column | Type | Notes |
|---|---|---|
| `id` | `text` PK | nanoid |
| `name` | `text` NOT NULL | Template display name (e.g. "Completion Letter") |
| `content` | `text` NOT NULL | Rich text HTML with `{{placeholder}}` tokens |
| `role` | `text` NULL | `DashboardRole` scope. NULL = system-wide |
| `isActive` | `boolean` NOT NULL DEFAULT true | Soft disable |
| `createdBy` | `text` FK → users.id | Manager who created it |
| `createdAt` | `timestamp` DEFAULT now() | |
| `updatedAt` | `timestamp` | |

---

## Repository

`LetterTemplateRepository` extends `BaseRepository<typeof letterTemplates>`

Methods:
- Inherits standard CRUD from `BaseRepository`
- `findAllActive(role?: DashboardRole)` — returns templates where `isActive = true`, filtered by `role` (or NULL for system-wide). Used when generating letters so staff only sees templates relevant to their department.

---

## Service

`LetterTemplateService` extends `BaseService`

Config:
```
findAllAuth: 'dashboard'
byIdAuth: 'dashboard'
createAuth: { 'letter-templates': ['create'] }
updateAuth: { 'letter-templates': ['update'] }
deleteAuth: { 'letter-templates': ['delete'] }
activityTypes: { create: 'letter-template:create', update: 'letter-template:update', delete: 'letter-template:delete' }
```

---

## Actions

| Action | Type | Description |
|---|---|---|
| `getLetterTemplates(page, search)` | Query | Paginated list for card grid |
| `getLetterTemplate(id)` | Query | Single template by ID |
| `getActiveTemplates(role?)` | Query | Active templates for letter generation |
| `createLetterTemplate(data)` | Mutation | Creates template, wrapped in `createAction` |
| `updateLetterTemplate(id, data)` | Mutation | Updates template, wrapped in `createAction` |
| `deleteLetterTemplate(id)` | Mutation | Deletes template, wrapped in `createAction` |
| `toggleTemplateActive(id)` | Mutation | Toggles `isActive`, wrapped in `createAction` |

---

## UI: Templates Page (`/registry/letters/templates`)

A **single page** displaying all templates as a **card grid** using `SimpleGrid`.

### TemplateCard Component
Each card displays:
- Template name (title)
- Role scope badge (e.g. "Registry", "Academic") or "System-wide" if `role` is NULL
- Active/Inactive badge
- `ActionIcon` with `IconDotsVertical` that opens a `Menu`:
  - **Edit** → opens modal with `TemplateForm` pre-populated
  - **Toggle Active** → calls `toggleTemplateActive`
  - **Delete** → `DeleteModal` confirmation then `deleteLetterTemplate`

### New Template Button
A button at the top of the page opens a **modal** containing the `TemplateForm`.

### TemplateForm Component (in modal)
- `TextInput` for template name (required)
- `Select` for role scope (optional — `DashboardRole` values, NULL = system-wide)
- `RichTextField` (toolbar = `'full'`) with a custom **"Insert Placeholder"** toolbar button
  - The placeholder button opens a dropdown menu listing all available tokens from `PLACEHOLDERS`
  - Clicking a token inserts `{{tokenName}}` at the current cursor position in the editor
- Template **auto-saves** when the modal is closed (if name and content are non-empty)

### Placeholder Insertion
Extend the `RichTextField` toolbar with an additional `ControlsGroup` containing a button that opens a menu of placeholder tokens. Uses the TipTap editor's `insertContent` command to inject `{{token}}` at the cursor.

---

## Permissions Setup

1. Add `'letter-templates'` to `RESOURCES` in `src/core/auth/permissions.ts`
2. Add grants to manager presets in `catalog.ts`: `read`, `create`, `update`, `delete`
3. Add `read` grant to staff presets in `catalog.ts`
4. Create a custom migration via `pnpm db:generate --custom` to seed the new permissions

---

## Activity Logging

Fragment in `_lib/activities.ts`:
- `letter-template:create`
- `letter-template:update`
- `letter-template:delete`

Register in `src/app/admin/activity-tracker/_lib/registry.ts`.

---

## Steps

1. Add `'letter-templates'` to `RESOURCES`
2. Create `_schema/letterTemplates.ts`
3. Create `_schema/relations.ts`
4. Add to `_database/index.ts` barrel export and `core/database`
5. Run `pnpm db:generate`
6. Create `_lib/placeholders.ts` with token definitions
7. Create `_lib/activities.ts`
8. Create `_server/repository.ts`
9. Create `_server/service.ts`
10. Create `_server/actions.ts`
11. Create `_components/TemplateForm.tsx`
12. Create `_components/TemplateCard.tsx`
13. Create `templates/page.tsx`
14. Add navigation entry
15. Grant permissions in `catalog.ts` + custom migration
16. Register activity types
17. Run `pnpm tsc --noEmit & pnpm lint:fix`
