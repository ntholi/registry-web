# Letters Module — Implementation Plan

> Module: `src/app/registry/letters/`
> Date: 2026-03-23

## Overview

A letters feature that allows users to create **reusable letter templates** with placeholder tokens, then generate **individual letters** for students by filling those templates with real student data. Each generated letter receives a unique serial number for tracking.

---

## 1. Domain Concepts

### Letter Template
A reusable document blueprint created by managers. Contains rich text (HTML) with embedded placeholder tokens (e.g. `{{studentName}}`). A template can be:
- **System-wide** — available to all departments (`role = NULL`)
- **Department-scoped** — only visible/usable by users of a specific `DashboardRole` (e.g. `registry`, `finance`, `academic`)

Examples: "Status Change Letter (NMDS)", "Completion Letter", "Medium of Instruction Letter", "Enrollment Confirmation Letter".

### Letter (Generated Instance)
A concrete letter generated from a template for a specific student. The template's HTML is rendered with the student's data substituted into placeholders, then stored as rendered HTML in the database. Each letter gets a unique serial number.

### Serial Number Format
`LTR` + `YYMMDD` + `/` + `NNNN` (4-digit zero-padded sequential counter per day)

Example: `LTR260302/0001` = first letter generated on 2026-03-02.

The counter resets daily. Stored as a string column. Generated via a DB sequence or application-level counter per date prefix.

---

## 2. Placeholder Tokens

Templates use `{{tokenName}}` syntax. The system replaces tokens with student data at generation time.

| Token | Description | Source |
|---|---|---|
| `{{studentName}}` | Full name | `students.name` |
| `{{stdNo}}` | Student number | `students.stdNo` |
| `{{nationalId}}` | National ID | `students.nationalId` |
| `{{programName}}` | Current program name | `programs.name` via `studentPrograms → structures → programs` |
| `{{schoolName}}` | School/Faculty name | `schools.name` via program |
| `{{currentDate}}` | Date letter is generated | System date, formatted `DD Month YYYY` |
| `{{gender}}` | He/She | Derived from `students.gender` |
| `{{genderPossessive}}` | His/Her | Derived from `students.gender` |
| `{{statusType}}` | Withdrawal/Deferment/Reinstatement | From linked `studentStatuses.type` (if applicable) |
| `{{termCode}}` | Current term code | Latest `studentSemesters.termCode` |
| `{{semester}}` | Latest enrolled semester | `formatSemester(structureSemester.semester, 'full')` |
| `{{serialNumber}}` | Letter serial number | Generated at creation time |
| `{{graduationDate}}` | Graduation date | `studentPrograms.graduationDate` |

### Placeholder Insertion UX
The `RichTextField` editor will have an **"Insert Placeholder"** dropdown/menu button in the toolbar that lists all available tokens. Clicking a token inserts `{{tokenName}}` at the cursor position. This prevents typos and makes the template authoring experience smooth.

---

## 3. Database Schema

### `letter_templates` table

```
src/app/registry/letters/_schema/letterTemplates.ts
```

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

### `letters` table

```
src/app/registry/letters/_schema/letters.ts
```

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

### `letter_serial_counters` table (for daily sequential numbering)

| Column | Type | Notes |
|---|---|---|
| `datePrefix` | `text` PK | `YYMMDD` e.g. `260302` |
| `counter` | `integer` NOT NULL DEFAULT 0 | Incremented atomically per letter |

Serial generation uses `UPDATE ... SET counter = counter + 1 RETURNING counter` in a transaction with the letter insert.

---

## 4. Directory Structure

```
src/app/registry/letters/
├── _schema/
│   ├── letterTemplates.ts
│   ├── letters.ts
│   ├── letterSerialCounters.ts
│   └── relations.ts
├── _server/
│   ├── repository.ts
│   ├── service.ts
│   └── actions.ts
├── _components/
│   ├── TemplateForm.tsx          # RichTextField with placeholder insertion
│   ├── GenerateLetterModal.tsx   # Select student → preview → generate
│   └── LetterPreview.tsx         # Rendered letter view with print button
├── _lib/
│   ├── placeholders.ts           # Token definitions & replacement logic
│   └── activities.ts             # Activity fragment
├── templates/
│   ├── page.tsx                  # List all templates
│   ├── layout.tsx
│   ├── new/
│   │   └── page.tsx
│   └── [id]/
│       ├── page.tsx              # View template details
│       └── edit/
│           └── page.tsx
├── page.tsx                      # List generated letters
├── layout.tsx
├── [id]/
│   └── page.tsx                  # View generated letter (with print)
└── index.ts
```

---

## 5. Permissions

Add `'letter-templates'` and `'letters'` to the `RESOURCES` array in `src/core/auth/permissions.ts`.

| Action | letter-templates | letters |
|---|---|---|
| `read` | Dashboard staff | Dashboard staff |
| `create` | Managers only | Staff with permission |
| `update` | Managers only | — |
| `delete` | Managers only | Managers only |

**Managers**: Users with presets like `Registry Manager`, `Academic Manager`, `Finance Manager`, etc.

Grant in `catalog.ts`:
- **Manager presets**: full CRUD on `letter-templates` + `read`/`create`/`delete` on `letters`
- **Staff presets**: `read` on `letter-templates` + `read`/`create` on `letters`

---

## 6. Implementation Layers

### Repository (`repository.ts`)

- `LetterTemplateRepository` extends `BaseRepository<typeof letterTemplates>`
  - `findAllActive(role?: DashboardRole)` — filter by role scope + isActive
- `LetterRepository` extends `BaseRepository<typeof letters>`
  - `findByStudent(stdNo: number)` — letters for a student
  - `findBySerial(serialNumber: string)` — lookup by serial
  - `generateSerial(tx)` — atomic counter increment + format
  - Custom `create` that generates serial inside a transaction

### Service (`service.ts`)

- `LetterTemplateService` extends `BaseService`
  - `createAuth` / `updateAuth` / `deleteAuth` = managers only
  - `findAllAuth` / `byIdAuth` = `'dashboard'`
- `LetterService` extends `BaseService`
  - `createAuth` = `{ 'letters': ['create'] }`
  - `generate(templateId, stdNo, statusId?)` — fetches student data, resolves placeholders, creates letter with serial

### Actions (`actions.ts`)

Templates:
- `getLetterTemplates(page, search)` — paginated list
- `getLetterTemplate(id)` — by ID
- `createLetterTemplate(data)` — mutation
- `updateLetterTemplate(id, data)` — mutation
- `deleteLetterTemplate(id)` — mutation

Letters:
- `getLetters(page, search)` — paginated list
- `getLetter(id)` — by ID
- `generateLetter(templateId, stdNo, statusId?)` — mutation, resolves placeholders and creates
- `getLettersByStudent(stdNo)` — for student letters list
- `deleteLetter(id)` — mutation
- `getStudentForLetter(stdNo)` — query: fetches student data with program/school/semester joins (single query) for preview and generation

---

## 7. Placeholder Resolution (`_lib/placeholders.ts`)

```ts
const PLACEHOLDERS = [
  { token: 'studentName', label: 'Student Name' },
  { token: 'stdNo', label: 'Student Number' },
  { token: 'nationalId', label: 'National ID' },
  { token: 'programName', label: 'Program Name' },
  { token: 'schoolName', label: 'School Name' },
  { token: 'currentDate', label: 'Current Date' },
  { token: 'gender', label: 'Gender (He/She)' },
  { token: 'genderPossessive', label: 'Gender Possessive (His/Her)' },
  { token: 'statusType', label: 'Status Type' },
  { token: 'termCode', label: 'Term Code' },
  { token: 'semester', label: 'Current Semester' },
  { token: 'serialNumber', label: 'Serial Number' },
  { token: 'graduationDate', label: 'Graduation Date' },
] as const;
```

The `resolveTemplate(html, data)` function replaces all `{{token}}` occurrences with actual values. Runs server-side during letter generation.

Student data is fetched in a **single query** joining:
`students` → `studentPrograms` → `structures` → `programs` → `schools`
plus latest `studentSemesters` → `structureSemesters` for semester info.

---

## 8. UI Flow

### Template Management (Managers)

1. **List page** (`/registry/letters/templates`) — `ListLayout` showing all templates
2. **Create page** — `TemplateForm` with:
   - Name input
   - Role selector (optional — NULL for system-wide)
   - `RichTextField` (toolbar = `'full'`) with custom **"Insert Placeholder"** menu button
   - The placeholder menu shows all available tokens; clicking one inserts `{{token}}` at cursor
3. **Detail page** — `DetailsView` showing template name, scope, preview of content
4. **Edit page** — Same form, pre-populated

### Letter Generation (Staff) — Student-First Flow

The primary workflow is **student-first**: staff enters a student number, then picks a template.

1. **Entry point**: `/registry/letters` → "Generate Letter" button
2. **Step 1**: Enter/search student number → system loads student data and shows student info card
3. **Step 2**: Select a letter template from available templates (filtered by user's role scope)
4. **Step 3**: Optionally link to a student status record (dropdown of student's statuses)
5. **Step 4**: Preview the rendered letter with all placeholders filled against the selected student
6. **Step 5**: Confirm → generates letter with serial number
7. **After generation**: Redirect to letter detail page

### Letter Viewing & Printing

1. **List page** (`/registry/letters`) — all generated letters, searchable by serial number or student
2. **Detail page** (`/registry/letters/[id]`) — rendered letter with:
   - Print button (uses `@react-pdf/renderer` pattern like transcript/statement printers — PDF generated client-side, opened in hidden iframe for printing)
   - Metadata: serial number, student, template used, created by, date

### Generated Letters Are Immutable

Once generated, letters **cannot be edited**. If corrections are needed, the letter must be deleted and regenerated. This preserves the audit trail: the serial number, content, and generation timestamp are permanent.

### Staff-Only

Letters are **not visible** in the student portal. Students receive physical printed copies.

---

## 9. Print / PDF Approach

Follow the existing pattern from `TranscriptPrinter` / `StatementOfResultsPrinter`:
- Use `@react-pdf/renderer` to create a `LetterPDF` component
- Rich text HTML is converted to PDF elements (parsed and re-rendered as `@react-pdf/renderer` components)
- Client-side: generate PDF blob → open in hidden iframe → trigger `window.print()`
- The letter content is already stored as rendered HTML, so no server round-trip needed for printing

### System-Managed Layout

The **template content defines the letter body only**. The system automatically wraps it with:
- **Header**: University letterhead (logo + university name)
- **Date line**: Generation date + serial number
- **Body**: The rendered template content (HTML → PDF)
- **Signature block**: Standard closing with signature line
- **Footer**: University address and contact info

Template authors do NOT control headers/footers — they only author the body text with placeholders. This ensures consistent branding across all letters.

---

## 10. Activity Logging

Fragment in `_lib/activities.ts`:
- `letter-template:create` / `update` / `delete`
- `letter:create` / `delete`

Register in `src/app/admin/activity-tracker/_lib/registry.ts`.

Letters should pass `stdNo` in `AuditOptions` for student tracing.

---

## 11. Navigation

Add two separate nav items to the registry module navigation config:
- **Letter Templates** — `permissions: [{ resource: 'letter-templates', action: 'read' }]`
- **Letters** — `permissions: [{ resource: 'letters', action: 'read' }]`

---

## 12. Migration Steps

1. Add `'letter-templates'` and `'letters'` to `RESOURCES` in `permissions.ts`
2. Create schema files under `_schema/`
3. Run `pnpm db:generate` to create migration
4. Run `pnpm db:generate --custom` to seed permissions into presets
5. Build repository → service → actions
6. Build UI components and pages
7. Register activity types
8. Add navigation entries
