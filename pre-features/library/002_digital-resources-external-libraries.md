# Step 002: Digital Resources & External Libraries Schema

## Introduction

This step extends the library database schema to include digital resources (e-books, past papers, research documents) and external library links. This builds upon Step 001 which established the core books, authors, and categories schema.

**Previous Step Completed:**
- ✅ Books, Authors, Categories tables created
- ✅ Junction tables for many-to-many relationships
- ✅ Enums defined (bookCondition, loanStatus, fineStatus, resourceType)
- ✅ Relations configured

---

## Context

Digital resources are documents uploaded to the system (past papers, research papers, theses, journals). They:
- Are stored using the existing `src/core/integrations/storage.ts` (Cloudflare R2)
- Have their own categories (reusing the `resourceType` enum from Step 001)
- Can be marked as downloadable or view-only
- Have a 10MB file size limit
- Accept any file type

External libraries are links to third-party online library services with credentials that librarians manage.

---

## Requirements

### 1. Schema Files to Create/Update

Update the schema structure:
```
src/app/library/_database/schema/
├── enums.ts          # (Already created - no changes needed)
├── books.ts          # (Already created - no changes needed)
├── authors.ts        # (Already created - no changes needed)
├── categories.ts     # (Already created - no changes needed)
├── resources.ts      # NEW - Digital resources
└── external.ts       # NEW - External libraries
```

### 2. Digital Resources Schema (`resources.ts`)

#### `digitalResources` Table

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `serial` | Primary Key | Auto-increment ID |
| `title` | `text` | Not Null | Resource title |
| `description` | `text` | Nullable | Brief description |
| `type` | `resourceType` enum | Not Null | Type (PastPaper, ResearchPaper, etc.) |
| `fileName` | `text` | Not Null | Stored file name in R2 |
| `originalName` | `text` | Not Null | Original uploaded file name |
| `fileSize` | `integer` | Not Null | File size in bytes |
| `mimeType` | `text` | Not Null | MIME type of the file |
| `isDownloadable` | `boolean` | Not Null, Default true | Whether users can download |
| `uploadedBy` | `text` | Foreign Key → `users.id`, On Delete Set Null | User who uploaded |
| `createdAt` | `timestamp` | Default Now | Upload timestamp |

**Indexes:**
- Trigram index on `title` for text search
- Index on `type` for filtering by resource type
- Index on `uploadedBy`

**Storage Path Convention:**
Files should be stored in: `library/resources/{fileName}`

### 3. Resource Categories Schema (Optional Junction)

Since resources use the `resourceType` enum directly (PastPaper, ResearchPaper, Thesis, Journal, Other), a separate categories junction table is NOT needed. The enum serves as the categorization.

### 4. External Libraries Schema (`external.ts`)

#### `externalLibraries` Table

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `serial` | Primary Key | Auto-increment ID |
| `name` | `text` | Not Null | Library service name |
| `url` | `text` | Not Null | URL to access the library |
| `username` | `text` | Nullable | Login username (if required) |
| `password` | `text` | Nullable | Login password (if required) |
| `description` | `text` | Nullable | Instructions/description |
| `createdAt` | `timestamp` | Default Now | Record creation timestamp |

**Security Note:**
- Passwords are stored as plain text for display to users
- Only admin/librarian roles should have access to view credentials
- Consider encrypting in a future iteration if sensitive

### 5. Update Relations (`relations.ts`)

Add relations for:
- **digitalResources** → **users** (many-to-one via `uploadedBy`)

### 6. Update Index File (`index.ts`)

Re-export new tables:
- `digitalResources`
- `externalLibraries`

### 7. Update Core Database Schema

Ensure `src/core/database/schema/index.ts` includes the new tables from `@library/_database`.

---

## File Upload Integration

The system already has `src/core/integrations/storage.ts` with:
- `uploadDocument(file, fileName, folder)` - Uploads to R2
- `deleteDocument(url)` - Deletes from R2

**Usage for Digital Resources:**
```
Folder: "library/resources"
File naming: Use nanoid or preserve original with unique prefix
```

**File Validation (to be implemented in Step 006):**
- Maximum size: 10MB (10 * 1024 * 1024 bytes)
- Allowed types: Any (no restriction)

---

## Expected Files

| File Path | Purpose |
|-----------|---------|
| `src/app/library/_database/schema/resources.ts` | Digital resources table |
| `src/app/library/_database/schema/external.ts` | External libraries table |
| `src/app/library/_database/relations.ts` | Updated with new relations |
| `src/app/library/_database/index.ts` | Updated exports |

---

## Database Diagram (After This Step)

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   authors   │────<│ bookAuthors  │>────│    books    │
└─────────────┘     └──────────────┘     └──────┬──────┘
                                                │
                    ┌──────────────┐            │
                    │bookCategories│>───────────┘
                    └──────┬───────┘
                           │
                    ┌──────┴──────┐
                    │  categories │
                    └─────────────┘

┌──────────────────┐     ┌───────────────────┐
│ digitalResources │────>│      users        │
└──────────────────┘     └───────────────────┘

┌──────────────────┐
│externalLibraries │  (standalone)
└──────────────────┘
```

---

## Validation Criteria

After implementation:
1. Run `pnpm db:generate` to generate migration
2. Run `pnpm db:push` or apply migration
3. Run `pnpm tsc --noEmit` - no type errors
4. Run `pnpm lint:fix` - no lint errors
5. Verify tables exist: `digitalResources`, `externalLibraries`

---

## Notes

- The `uploadedBy` references the `users` table from `@auth/_database`
- External library credentials are displayed to logged-in users (students/staff) so they can access those resources
- Digital resources are NOT linked to academic modules per requirements
- The `resourceType` enum provides sufficient categorization without a junction table
