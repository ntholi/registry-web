# Letters Module — Overview

> Module: `src/app/registry/letters/`
> Date: 2026-03-23

## Summary

A letters feature that allows users to create **reusable letter templates** with placeholder tokens, then generate **individual letters** for students by filling those templates with real student data. Each generated letter receives a unique serial number for tracking.

## Progress Tracker

| # | Part | Status |
|---|------|--------|
| 1 | **Letter Templates** — Schema, repository, service, actions, card-grid UI with modal create/edit | ⬜ Not started |
| 2 | **Letters (Generated)** — Schema, repository, service, actions, student-first generation flow, PDF print | ⬜ Not started |

---

## Domain Concepts

### Letter Template
A reusable document blueprint created by managers. Contains rich text (HTML) with embedded placeholder tokens (e.g. `{{studentName}}`). A template can be:
- **System-wide** — available to all departments (`role = NULL`)
- **Department-scoped** — only visible/usable by users of a specific `DashboardRole` (e.g. `registry`, `finance`, `academic`)

Examples: "Status Change Letter (NMDS)", "Completion Letter", "Medium of Instruction Letter", "Enrollment Confirmation Letter".

### Letter (Generated Instance)
A concrete letter generated from a template for a specific student. The template's HTML is rendered with the student's data substituted into placeholders, then stored as rendered HTML in the database. Each letter gets a unique serial number. **Letters are immutable** — if corrections are needed, delete and regenerate.

### Serial Number Format
`LTR` + `YYMMDD` + `A-Z` + `NN`

Sequence starts at `A01`, ends at `Z99`, then continues as `A001`.

Example: `LTR260302A01` = first letter generated on 2026-03-02.

---

## Placeholder Tokens

Templates use `{{tokenName}}` syntax. Replaced with student data at generation time.

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

---

## Permissions

Add `'letter-templates'` and `'letters'` to `RESOURCES` in `src/core/auth/permissions.ts`.

| Action | letter-templates | letters |
|---|---|---|
| `read` | Dashboard staff | Dashboard staff |
| `create` | Managers only | Staff with permission |
| `update` | Managers only | — |
| `delete` | Managers only | Managers only |

**Managers**: Registry Manager, Academic Manager, Finance Manager, etc.

Grant in `catalog.ts`:
- **Manager presets**: full CRUD on `letter-templates` + `read`/`create`/`delete` on `letters`
- **Staff presets**: `read` on `letter-templates` + `read`/`create` on `letters`

---

## Navigation

Two separate nav items in the registry sidebar:
- **Letter Templates** — `permissions: [{ resource: 'letter-templates', action: 'read' }]`
- **Letters** — `permissions: [{ resource: 'letters', action: 'read' }]`

---

## Key Decisions

- **Student-first flow**: Staff enters student → picks template → preview → generate
- **Rich text → PDF** output using `@react-pdf/renderer` (same pattern as transcripts/statements)
- **System-managed letterhead/footer** — template authors only write the body. Signature uses the same registrar signature image as statement of results (`/images/signature_small.png`)
- **Immutable letters** — delete and regenerate if corrections needed
- **Staff-only** — not visible in student portal
- **Single generation** — no bulk, one letter at a time
- **No QR verification** — serial numbers for internal tracking only
- **Department = DashboardRole** scoping for templates
- **Optional link to student status** for NMDS-related letters
- **Reuse existing components**: `StudentInput`, `StudentPreviewCard`

---

## Directory Structure

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
│   ├── TemplateForm.tsx              # RichTextField with placeholder insertion (used in modal)
│   ├── TemplateCard.tsx              # Single template card with action menu
│   ├── GenerateLetterForm.tsx        # Student-first flow: search student → pick template → preview
│   └── LetterPDF.tsx                 # @react-pdf/renderer PDF component
├── _lib/
│   ├── placeholders.ts              # Token definitions & replacement logic
│   └── activities.ts                # Activity fragment
├── templates/
│   └── page.tsx                     # Card grid of all templates (single page)
├── new/
│   └── page.tsx                     # Generate a new letter (student-first flow)
├── page.tsx                         # List generated letters
├── layout.tsx
├── [id]/
│   └── page.tsx                     # View generated letter (with print)
└── index.ts
```
