# Step 003: Loans & Fines Schema

## Introduction

This step completes the library database schema by adding loans, loan renewals, and fines tables. This is the final schema step before implementing the feature CRUD operations.

**Previous Steps Completed:**
- ✅ Step 001: Books, Authors, Categories schema
- ✅ Step 002: Digital Resources, External Libraries schema

---

## Context

The loan system enables:
- Librarians to issue books to students (staff support planned for future)
- Tracking of loan dates, due dates, and return dates
- Loan renewals with tracked history
- Automatic fine calculation for overdue books (M per day - Maluti currency)
- Fine payment recording linked to `paymentReceipts` from finance module

Students are automatic members—no separate membership table needed. The system will reference `students.stdNo` directly.

---

## Requirements

### 1. Schema Files to Create

```
src/app/library/_database/schema/
├── loans.ts          # NEW - Loans and renewals
└── fines.ts          # NEW - Fines
```

### 2. Loans Schema (`loans.ts`)

#### `loans` Table

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `serial` | Primary Key | Auto-increment ID |
| `bookCopyId` | `integer` | Foreign Key → `bookCopies.id`, Not Null | Specific copy being borrowed |
| `stdNo` | `bigint` | Foreign Key → `students.stdNo`, Not Null | Student borrowing |
| `loanDate` | `timestamp` | Not Null, Default Now | Date book was borrowed |
| `dueDate` | `timestamp` | Not Null | Date book should be returned |
| `returnDate` | `timestamp` | Nullable | Actual return date (null if not returned) |
| `status` | `loanStatus` enum | Not Null, Default 'Active' | Active, Returned, Overdue |
| `issuedBy` | `text` | Foreign Key → `users.id`, On Delete Set Null | Librarian who issued |
| `returnedTo` | `text` | Foreign Key → `users.id`, On Delete Set Null | Librarian who received return |
| `createdAt` | `timestamp` | Default Now | Record creation timestamp |

**Indexes:**
- Index on `bookCopyId`
- Index on `stdNo`
- Index on `status`
- Index on `dueDate` (for overdue queries)
- Composite index on (`stdNo`, `status`) for student loan lookups

**Business Rules:**
- When a copy is loaned, set `bookCopies.status` to 'OnLoan'
- When a copy is returned, set `bookCopies.status` to 'Available'
- A loan becomes "Overdue" when current date > `dueDate` and `returnDate` is null
- `dueDate` is set by librarian at loan creation (no default period)

#### `loanRenewals` Table

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `serial` | Primary Key | Auto-increment ID |
| `loanId` | `integer` | Foreign Key → `loans.id`, On Delete Cascade, Not Null | Parent loan |
| `previousDueDate` | `timestamp` | Not Null | Due date before renewal |
| `newDueDate` | `timestamp` | Not Null | New due date after renewal |
| `renewedBy` | `text` | Foreign Key → `users.id`, On Delete Set Null | Librarian who processed |
| `renewedAt` | `timestamp` | Default Now | When renewal occurred |

**Indexes:**
- Index on `loanId`

**Business Rules:**
- No maximum renewals limit
- Each renewal creates a new record for audit trail
- Updates the parent loan's `dueDate` to match `newDueDate`

### 3. Fines Schema (`fines.ts`)

#### `fines` Table

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `serial` | Primary Key | Auto-increment ID |
| `loanId` | `integer` | Foreign Key → `loans.id`, On Delete Cascade, Not Null | Related loan |
| `stdNo` | `bigint` | Foreign Key → `students.stdNo`, Not Null | Student who owes |
| `amount` | `real` | Not Null | Fine amount in Maluti (M) |
| `daysOverdue` | `integer` | Not Null | Number of days overdue |
| `status` | `fineStatus` enum | Not Null, Default 'Unpaid' | Paid/Unpaid |
| `receiptId` | `text` | Foreign Key → `paymentReceipts.id`, On Delete Set Null | Payment receipt (if paid) |
| `createdAt` | `timestamp` | Default Now | When fine was created |
| `paidAt` | `timestamp` | Nullable | When fine was paid |

**Indexes:**
- Index on `loanId`
- Index on `stdNo`
- Index on `status`
- Index on `receiptId`

**Fine Calculation:**
- Rate: 1 M (Maluti) per day overdue (hardcoded)
- Formula: `amount = daysOverdue * 1`
- Fines are created when:
  1. A book is returned late
  2. Or periodically calculated for active overdue loans

**Payment Integration:**
- When a fine is paid, create a `paymentReceipt` in finance module
- Link via `receiptId`
- Update `status` to 'Paid' and set `paidAt`

### 4. Update Relations (`relations.ts`)

Add relations for:

**loans:**
- `loans` → `bookCopies` (many-to-one)
- `loans` → `students` (many-to-one)
- `loans` → `users` as issuedBy (many-to-one)
- `loans` → `users` as returnedTo (many-to-one)
- `loans` → `loanRenewals` (one-to-many)
- `loans` → `fines` (one-to-one or one-to-many)

**bookCopies:**
- `bookCopies` → `loans` (one-to-many)

**loanRenewals:**
- `loanRenewals` → `loans` (many-to-one)
- `loanRenewals` → `users` as renewedBy (many-to-one)

**fines:**
- `fines` → `loans` (many-to-one)
- `fines` → `students` (many-to-one)
- `fines` → `paymentReceipts` (many-to-one, optional)

### 5. Update Index File (`index.ts`)

Re-export new tables:
- `loans`
- `loanRenewals`
- `fines`

---

## Database Diagram (Complete Schema)

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   authors   │────<│ bookAuthors  │>────│    books    │
└─────────────┘     └──────────────┘     └──────┬──────┘
                                                │
                    ┌──────────────┐            │
                    │bookCategories│>───────────┤
                    └──────┬───────┘            │
                           │                    │
                    ┌──────┴──────┐            │
                    │  categories │            │
                    └─────────────┘            │
                                               │
                         ┌─────────────────────┘
                         │
                    ┌────┴────────┐
                    │ bookCopies  │
                    └──────┬───────┘
                           │
┌──────────────┐   ┌──────┴──────┐   ┌─────────────┐
│   students   │──<│    loans    │>──│    users    │
└──────┬───────┘   └──────┬──────┘   └─────────────┘
       │                  │
       │           ┌──────┴──────┐
       │           │loanRenewals │
       │           └─────────────┘
       │                  │
       │           ┌──────┴──────┐     ┌─────────────────┐
       └──────────<│    fines    │>────│ paymentReceipts │
                   └─────────────┘     └─────────────────┘

┌──────────────────┐     ┌───────────────────┐
│ digitalResources │────>│      users        │
└──────────────────┘     └───────────────────┘

┌──────────────────┐
│externalLibraries │
└──────────────────┘
```

---

## Cross-Module References

This schema references tables from other modules:

| Table | Module | Import Path |
|-------|--------|-------------|
| `students` | Registry | `@registry/_database` |
| `users` | Auth | `@auth/_database` |
| `paymentReceipts` | Finance | `@finance/_database` |
| `bookCopies` | Library | `@library/_database` |

---

## Expected Files

| File Path | Purpose |
|-----------|---------|
| `src/app/library/_database/schema/loans.ts` | Loans and renewals tables |
| `src/app/library/_database/schema/fines.ts` | Fines table |
| `src/app/library/_database/relations.ts` | Updated with all relations |
| `src/app/library/_database/index.ts` | Updated exports |

---

## Validation Criteria

After implementation:
1. Run `pnpm db:generate` to generate migration
2. Run `pnpm db:push` or apply migration
3. Run `pnpm tsc --noEmit` - no type errors
4. Run `pnpm lint:fix` - no lint errors
5. Verify all tables exist in database
6. Test foreign key constraints with sample data

---

## Notes

- Students table uses `bigint` for `stdNo` (mode: 'number')
- Payment receipts use `text` for `id` (nanoid)
- The fine rate (1 M/day) is hardcoded, not configurable
- Overdue status is calculated dynamically, not stored (unless explicitly updated)
- Future: Add `staffId` column to `loans` when staff table is created
