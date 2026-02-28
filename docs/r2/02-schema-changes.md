# Step 2: Schema Changes

> **Priority:** High (prerequisite for migration script)  
> **Risk:** Low (additive columns, no destructive changes)  
> **Estimated effort:** 1 hour

---

## Objective

Add database columns to track photo storage keys for students and employees. Standardize how file references are stored across all modules.

## 2.1 — Add `photoKey` to Students

Add a nullable `text` column to the `students` table to store the R2 object key for the student's photo.

### Schema change in `src/app/registry/students/_schema/students.ts`:

```typescript
// Add to the students table columns:
photoKey: text(), // e.g. "registry/students/photos/901234.jpg"
```

### Why nullable:
- Existing students won't have a value until the migration script runs (Step 3)
- Not all students have photos
- The column is set on upload and cleared on delete

## 2.2 — Add `photoKey` to Employees

Same pattern for the employees table.

### Schema change in `src/app/human-resource/employees/_schema/employees.ts`:

```typescript
// Add to the employees table columns:
photoKey: text(), // e.g. "human-resource/employees/photos/EMP001.jpg"
```

## 2.3 — Standardize `documents.fileUrl` Storage

Currently, `documents.fileUrl` stores **full URLs** like:
```
https://pub-2b37ce26bd70421e9e59e4fe805c6873.r2.dev/library/question-papers/abc123.pdf
```

Going forward, it should store only the **R2 object key**:
```
library/question-papers/abc123.pdf
```

The full URL is then computed at read-time using `getPublicUrl(key)`.

### Why store keys instead of full URLs:
1. **Domain portability** — If the R2 public URL changes (custom domain, CDN), we update one env var instead of every row in the DB
2. **Consistency** — Some modules already store just `fileName` (publication_attachments), others store full URLs. This unifies the approach
3. **Smaller footprint** — Keys are shorter than full URLs

### Migration approach for existing `fileUrl` values:
- The migration script (Step 3) will strip the base URL prefix from all existing `fileUrl` values
- Application code will use `getPublicUrl()` to reconstruct full URLs at read-time

## 2.4 — Add `storageKey` to `publication_attachments`

The `publication_attachments` table currently stores `fileName` and computes the URL at read-time using `getAttachmentFolder()`. Replace this with a full `storageKey` column.

```typescript
// Add to publication_attachments:
storageKey: text(), // e.g. "registry/terms/publications/2025-02/scanned-pdf/results.pdf"
```

This column is populated on upload and used directly for URL construction and deletion.

## 2.5 — Generate Migration

After all schema changes:

```bash
pnpm db:generate
```

This creates a single migration file covering all changes. The migration is purely additive (nullable columns), so it's safe to run in production with no downtime.

### Expected SQL:

```sql
ALTER TABLE "students" ADD COLUMN "photo_key" text;
ALTER TABLE "employees" ADD COLUMN "photo_key" text;
ALTER TABLE "publication_attachments" ADD COLUMN "storage_key" text;
```

No destructive changes. No column renames. No data modifications.

## 2.6 — Run Migration

```bash
# Local development
psql postgresql://dev:111111@localhost:5432/registry -P pager=off -c "
  ALTER TABLE students ADD COLUMN IF NOT EXISTS photo_key text;
  ALTER TABLE employees ADD COLUMN IF NOT EXISTS photo_key text;
  ALTER TABLE publication_attachments ADD COLUMN IF NOT EXISTS storage_key text;
"

# Or via Drizzle
pnpm db:generate
# Then apply the generated migration
```

## Files Changed

| File | Change |
|------|--------|
| `src/app/registry/students/_schema/students.ts` | Add `photoKey: text()` |
| `src/app/human-resource/employees/_schema/employees.ts` | Add `photoKey: text()` |
| `src/app/registry/terms/_schema/publicationAttachments.ts` | Add `storageKey: text()` |
| `drizzle/XXXX_*.sql` | Auto-generated migration |

## Verification

After this step:
- All new columns exist in the database (nullable, no data yet)
- Existing application code is unaffected (columns are unused until Step 4-5)
- `pnpm tsc --noEmit` passes cleanly
- `pnpm db:generate` produces clean output with no pending changes
