# Part 2: Letters (Generated Instances)

> Implements letter generation, storage, viewing, and PDF printing.

## Schema

### `letters` table (`_schema/letters.ts`)

| Column | Type | Notes |
|---|---|---|
| `id` | `text` PK | nanoid |
| `serialNumber` | `text` NOT NULL UNIQUE | e.g. `LTR260302/0001` |
| `templateId` | `text` FK → letter_templates.id | Source template |
| `stdNo` | `bigint` FK → students.stdNo | Target student |
| `content` | `text` NOT NULL | Rendered HTML with placeholders resolved |
| `statusId` | `text` FK → student_statuses.id NULL | Optional link to status change |
| `createdBy` | `text` FK → users.id | Staff who generated it |
| `createdAt` | `timestamp` DEFAULT now() | |

### `letter_serial_counters` table (`_schema/letterSerialCounters.ts`)

| Column | Type | Notes |
|---|---|---|
| `datePrefix` | `text` PK | `YYMMDD` e.g. `260302` |
| `counter` | `integer` NOT NULL DEFAULT 0 | Incremented atomically per letter |

### Serial Number Generation

Format: `LTR` + `YYMMDD` + `/` + `NNNN`

Inside a transaction:
1. `INSERT INTO letter_serial_counters (date_prefix, counter) VALUES ($1, 1) ON CONFLICT (date_prefix) DO UPDATE SET counter = letter_serial_counters.counter + 1 RETURNING counter`
2. Format as `LTR${datePrefix}/${counter.toString().padStart(4, '0')}`
3. Store in `letters.serialNumber`

---

## Repository

`LetterRepository` extends `BaseRepository<typeof letters>`

Methods:
- `findByStudent(stdNo: number, page, search)` — paginated letters for a student
- `findBySerial(serialNumber: string)` — lookup by serial number
- `generateSerial(tx: Transaction)` — atomic counter increment, returns formatted serial
- Custom `create(data, audit?)` — wraps insert + serial generation in a transaction

### Student Data Query

`getStudentForLetter(stdNo: number)` in the repository fetches all placeholder data in a **single query** joining:
- `students` (name, nationalId, gender)
- `studentPrograms` → `structures` → `programs` (programName)
- `programs` → `schools` (schoolName)
- Latest `studentSemesters` → `structureSemesters` (semester, termCode)

Returns a typed object ready for placeholder resolution.

---

## Service

`LetterService` extends `BaseService`

Config:
```
findAllAuth: 'dashboard'
byIdAuth: 'dashboard'
createAuth: { 'letters': ['create'] }
deleteAuth: { 'letters': ['delete'] }
activityTypes: { create: 'letter:create', delete: 'letter:delete' }
```

Key method:
- `generate(templateId, stdNo, statusId?)`:
  1. Fetch template by ID
  2. Fetch student data via `getStudentForLetter(stdNo)`
  3. Generate serial number (inside transaction)
  4. Resolve placeholders: `resolveTemplate(template.content, studentData, serialNumber)`
  5. Insert letter record with rendered content
  6. Return the created letter

---

## Actions

| Action | Type | Description |
|---|---|---|
| `getLetters(page, search)` | Query | Paginated list of all generated letters |
| `getLetter(id)` | Query | Single letter by ID |
| `getLettersByStudent(stdNo)` | Query | Letters for a specific student |
| `generateLetter(templateId, stdNo, statusId?)` | Mutation | Resolves template + creates letter with serial |
| `deleteLetter(id)` | Mutation | Deletes a letter |
| `getStudentForLetter(stdNo)` | Query | Fetches student data for preview before generation |

---

## Placeholder Resolution (`_lib/placeholders.ts`)

`resolveTemplate(html: string, data: StudentLetterData, serialNumber: string): string`

Replaces all `{{token}}` occurrences with actual values. Runs server-side during letter generation.

Gender mapping:
- `Male` → He / His
- `Female` → She / Her
- Default → They / Their

Date formatting uses `dates.ts` utilities.

---

## UI: Letter Generation — Student-First Flow

### Generate Letter Page (`/registry/letters/new`)

Reuses existing shared components:
- **`StudentInput`** from `@/shared/ui/StudentInput` — autocomplete search
- **`StudentPreviewCard`** from `@registry/_components/StudentPreviewCard` — shows selected student

#### Flow:
1. `StudentInput` to search/select a student
2. On selection, `StudentPreviewCard` displays student info (name, stdNo, photo)
3. `Select` to choose a letter template (fetched via `getActiveTemplates(userRole)`)
4. Optional `Select` for linking to a student status (populated from student's status records)
5. "Preview" button → renders the template with resolved placeholders shown below
6. "Generate" button → calls `generateLetter` → redirects to letter detail page

### Letters List Page (`/registry/letters`)

`ListLayout` showing all generated letters:
- Displays: serial number, student name, template name, created by, date
- Searchable by serial number or student name/number
- "Generate Letter" button links to `/registry/letters/new`

### Letter Detail Page (`/registry/letters/[id]`)

- **Metadata**: Serial number, student info, template used, created by, date
- **Letter preview**: Rendered HTML content displayed in a card
- **Print button**: Generates PDF using `@react-pdf/renderer` and prints via hidden iframe (same pattern as `StatementOfResultsPrinter`)
- **Delete button**: `DeleteModal` (managers only)

---

## PDF Layout (`_components/LetterPDF.tsx`)

Uses `@react-pdf/renderer`. The system wraps the template body with a standard layout:

### Structure:
1. **University Header**
   - Logo image (`/images/logo.png` or from R2 branding)
   - "Limkokwing University of Creative Technology"
   - University address / contact

2. **Date & Reference**
   - Date: formatted generation date
   - Ref: serial number (e.g. `LTR260302/0001`)

3. **Letter Body**
   - The resolved template HTML content rendered as PDF elements
   - HTML → PDF conversion: parse the HTML and map tags to `@react-pdf/renderer` primitives (`Text`, `View`, etc.)

4. **Signature Block** (same as Statement of Results)
   - Registrar signature image: `/images/signature_small.png`
   - Horizontal line (border-bottom)
   - "Registrar" label text below the line

5. **Footer**
   - University copyright / address

---

## Activity Logging

Fragment in `_lib/activities.ts`:
- `letter:create`
- `letter:delete`

Pass `stdNo` in `AuditOptions` for student tracing.

Register in `src/app/admin/activity-tracker/_lib/registry.ts`.

---

## Steps

1. Create `_schema/letters.ts`
2. Create `_schema/letterSerialCounters.ts`
3. Update `_schema/relations.ts` with letter relations
4. Add to `_database/index.ts` barrel export and `core/database`
5. Run `pnpm db:generate`
6. Add `getStudentForLetter` query to repository
7. Add serial generation logic to repository
8. Add `generate` method to service
9. Add letter actions
10. Create `_components/GenerateLetterForm.tsx`
11. Create `new/page.tsx`
12. Create `page.tsx` (letters list)
13. Create `[id]/page.tsx` (letter detail + print)
14. Create `_components/LetterPDF.tsx`
15. Add `'letters'` to `RESOURCES` + permission grants + custom migration
16. Register activity types
17. Add navigation entry for "Letters"
18. Run `pnpm tsc --noEmit & pnpm lint:fix`
