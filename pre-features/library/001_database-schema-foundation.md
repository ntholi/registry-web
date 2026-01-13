# Step 001: Database Schema Foundation

## Introduction

This is the first step in building the Library Management Module. This step establishes the foundational database schema for the library system, including core entities for books, authors, and categories. No prior steps exist—this is the starting point.

The library module will follow the established architecture patterns from other modules (academic, registry, finance) with its own `_database` folder containing schemas and relations.

---

## Context

The Registry Web application uses:
- **Drizzle ORM** with PostgreSQL
- **Module-based schema organization** (each module has `_database/schema/` and `relations.ts`)
- **Centralized database aggregation** in `src/core/database/`
- **Naming conventions**: `snake_case` for tables/columns in SQL, `camelCase` for TypeScript exports

---

## Requirements

### 1. Create Module Database Structure

Create the following directory structure:
```
src/app/library/
├── _database/
│   ├── schema/
│   │   ├── enums.ts
│   │   ├── books.ts
│   │   ├── book-copies.ts
│   │   ├── authors.ts
│   │   └── categories.ts
│   ├── relations.ts
│   └── index.ts
```

### 2. Enums Schema (`enums.ts`)

Define the following PostgreSQL enums:

| Enum Name | Values | Purpose |
|-----------|--------|---------|
| `bookCondition` | `New`, `Good`, `Damaged` | Track physical condition of book copies |
| `bookCopyStatus` | `Available`, `OnLoan`, `Withdrawn` | Track availability status of each copy |
| `loanStatus` | `Active`, `Returned`, `Overdue` | Status of a loan transaction |
| `fineStatus` | `Unpaid`, `Paid` | Payment status of fines |
| `resourceType` | `PastPaper`, `ResearchPaper`, `Thesis`, `Journal`, `Other` | Type of digital resource |

### 3. Books Schema (`books.ts`)

#### `books` Table

Represents a book title (not individual copies). Physical copies are tracked in `bookCopies`.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `serial` | Primary Key | Auto-increment ID |
| `isbn` | `text` | Not Null, Unique | International Standard Book Number |
| `title` | `text` | Not Null | Book title |
| `publisher` | `text` | Nullable | Publisher name |
| `publicationYear` | `integer` | Nullable | Year of publication |
| `edition` | `text` | Nullable | Edition (e.g., "2nd Edition") |
| `coverUrl` | `text` | Nullable | URL to cover image (from Google Books API) |
| `createdAt` | `timestamp` | Default Now | Record creation timestamp |

**Note:** `copiesAvailable` and `totalCopies` are computed from the `bookCopies` table.

**Indexes:**
- Trigram index on `title` for fast text search
- Index on `isbn`

### 3b. Book Copies Schema (`book-copies.ts`)

#### `bookCopies` Table

Represents individual physical copies of a book. When a student borrows, they borrow a specific copy.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `serial` | Primary Key | Auto-increment ID |
| `bookId` | `integer` | Foreign Key → `books.id`, On Delete Cascade, Not Null | Parent book |
| `serialNumber` | `text` | Not Null, Unique | Unique identifier for this copy (e.g., barcode) |
| `condition` | `bookCondition` enum | Not Null, Default 'Good' | Physical condition of this copy |
| `status` | `bookCopyStatus` enum | Not Null, Default 'Available' | Availability status |
| `location` | `text` | Nullable | Shelf/location in library (e.g., "Shelf A3") |
| `acquiredAt` | `date` | Nullable | Date copy was added to library |

**Indexes:**
- Index on `bookId`
- Index on `status`
- Index on `serialNumber`

**Business Rules:**
- When a copy is borrowed, set `status` to 'OnLoan'
- When returned, set `status` to 'Available'
- When lost/damaged beyond use, set `status` to 'Withdrawn' (soft delete)

#### `bookCategories` Junction Table

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | `serial` | Primary Key |
| `bookId` | `integer` | Foreign Key → `books.id`, On Delete Cascade |
| `categoryId` | `integer` | Foreign Key → `categories.id`, On Delete Cascade |

**Constraints:**
- Unique constraint on (`bookId`, `categoryId`)

#### `bookAuthors` Junction Table

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | `serial` | Primary Key |
| `bookId` | `integer` | Foreign Key → `books.id`, On Delete Cascade |
| `authorId` | `integer` | Foreign Key → `authors.id`, On Delete Cascade |

**Constraints:**
- Unique constraint on (`bookId`, `authorId`)

### 4. Authors Schema (`authors.ts`)

#### `authors` Table

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `serial` | Primary Key | Auto-increment ID |
| `name` | `text` | Not Null | Author's full name |
| `createdAt` | `timestamp` | Default Now | Record creation timestamp |

**Indexes:**
- Trigram index on `name` for fast text search

### 5. Categories Schema (`categories.ts`)

#### `categories` Table

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `serial` | Primary Key | Auto-increment ID |
| `name` | `text` | Not Null, Unique | Category name |
| `description` | `text` | Nullable | Category description |
| `createdAt` | `timestamp` | Default Now | Record creation timestamp |

### 6. Relations (`relations.ts`)

Define Drizzle relations for:

- **books** ↔ **bookAuthors** (one-to-many)
- **books** ↔ **bookCategories** (one-to-many)
- **books** ↔ **bookCopies** (one-to-many)
- **authors** ↔ **bookAuthors** (one-to-many)
- **categories** ↔ **bookCategories** (one-to-many)
- **bookAuthors** → **books** (many-to-one)
- **bookAuthors** → **authors** (many-to-one)
- **bookCategories** → **books** (many-to-one)
- **bookCategories** → **categories** (many-to-one)
- **bookCopies** → **books** (many-to-one)

### 7. Index File (`index.ts`)

Re-export all schemas and relations:
- All tables from schema files
- All enums
- Relations

### 8. Update Core Database

Update `src/core/database/schema/index.ts` to include library schemas using the `@library/*` path alias.

### 9. Path Alias

Add to `tsconfig.json`:
```
"@library/*": ["./src/app/library/*"]
```

---

## Expected Files

| File Path | Purpose |
|-----------|---------|
| `src/app/library/_database/schema/enums.ts` | Enum definitions |
| `src/app/library/_database/schema/books.ts` | Books, bookAuthors, bookCategories tables || `src/app/library/_database/schema/book-copies.ts` | Book copies table || `src/app/library/_database/schema/authors.ts` | Authors table |
| `src/app/library/_database/schema/categories.ts` | Categories table |
| `src/app/library/_database/relations.ts` | Drizzle relations |
| `src/app/library/_database/index.ts` | Re-exports |

---

## Validation Criteria

After implementation:
1. Run `pnpm db:generate` to generate migration
2. Run `pnpm db:push` or apply migration
3. Run `pnpm tsc --noEmit` - no type errors
4. Run `pnpm lint:fix` - no lint errors
5. Verify tables exist in database using psql

---

## Notes

- Do NOT manually create migration SQL files
- Use the existing patterns from `@academic/_database` and `@registry/_database` as reference
- The `coverUrl` will be populated via Google Books API in Step 004
- Junction tables enable many-to-many relationships (book ↔ authors, book ↔ categories)
