# Step 007: Reports

## Introduction

This step implements the reporting functionality for the library module, providing insights into library operations through various reports with export capabilities.

**Previous Steps Completed:**
- ✅ Step 001-003: Complete database schema
- ✅ Step 004: Books, Authors, Categories CRUD
- ✅ Step 005: Loans management
- ✅ Step 006: Fines, Digital Resources, External Libraries

**All data sources are now available for comprehensive reporting.**

---

## Context

The library module requires four key reports:
1. **Popular Books** - Most borrowed books ranking
2. **Overdue Loans** - Current overdue loans requiring attention
3. **Borrowing History** - Complete loan transaction history
4. **Inventory** - Book catalog status report

All reports should be:
- Viewable in the browser
- Filterable by date range and other criteria
- Exportable to PDF and Excel

---

## Requirements

### Directory Structure

```
src/app/library/
├── reports/
│   ├── _server/
│   │   ├── repository.ts      # Report-specific queries
│   │   ├── service.ts
│   │   └── actions.ts
│   ├── _components/
│   │   ├── ReportFilters.tsx  # Common filter controls
│   │   ├── ReportTable.tsx    # Reusable report table
│   │   ├── ExportButtons.tsx  # PDF/Excel export buttons
│   │   └── DateRangePicker.tsx
│   ├── _lib/
│   │   ├── types.ts           # Report type definitions
│   │   ├── pdf-export.ts      # PDF generation
│   │   └── excel-export.ts    # Excel generation
│   ├── layout.tsx
│   ├── page.tsx               # Reports dashboard/index
│   ├── popular-books/
│   │   └── page.tsx
│   ├── overdue-loans/
│   │   └── page.tsx
│   ├── borrowing-history/
│   │   └── page.tsx
│   └── inventory/
│       └── page.tsx
```

---

## Report 1: Popular Books

### Purpose
Rank books by number of times borrowed within a date range.

### Query Logic
```sql
SELECT 
  b.id, b.isbn, b.title, 
  COUNT(l.id) as loan_count,
  COUNT(DISTINCT l.std_no) as unique_borrowers
FROM books b
LEFT JOIN book_copies bc ON bc.book_id = b.id
LEFT JOIN loans l ON l.book_copy_id = bc.id
WHERE l.loan_date BETWEEN :startDate AND :endDate
GROUP BY b.id
ORDER BY loan_count DESC
LIMIT :limit
```

### Filters
| Filter | Type | Default |
|--------|------|---------|
| Start Date | DateInput | 30 days ago |
| End Date | DateInput | Today |
| Limit | NumberInput | 20 |

### Display Columns
| Column | Description |
|--------|-------------|
| Rank | Position (1, 2, 3...) |
| ISBN | Book ISBN |
| Title | Book title |
| Loan Count | Times borrowed in period |
| Unique Borrowers | Distinct students who borrowed |
| Categories | Book categories (badges) |

### Actions
| Action | Signature |
|--------|-----------|
| `getPopularBooks` | `(startDate, endDate, limit)` |

---

## Report 2: Overdue Loans

### Purpose
List all currently overdue loans for follow-up action.

### Query Logic
```sql
SELECT 
  l.*, 
  b.title, b.isbn,
  s.std_no, s.name as student_name,
  CURRENT_DATE - l.due_date as days_overdue,
  (CURRENT_DATE - l.due_date) * 1 as fine_amount
FROM loans l
JOIN books b ON l.book_id = b.id
JOIN students s ON l.std_no = s.std_no
WHERE l.status = 'Active' 
  AND l.due_date < CURRENT_DATE
  AND l.return_date IS NULL
ORDER BY days_overdue DESC
```

### Filters
| Filter | Type | Default |
|--------|------|---------|
| Minimum Days Overdue | NumberInput | 0 |
| Sort By | Select | Days Overdue (desc) |

### Display Columns
| Column | Description |
|--------|-------------|
| Student No | Student number (link) |
| Student Name | Student full name |
| Book Title | Book title (link) |
| ISBN | Book ISBN |
| Loan Date | When borrowed |
| Due Date | When was due |
| Days Overdue | Number of days late |
| Estimated Fine | days × M1 |
| Actions | Return button |

### Summary Stats (Top of report)
- Total overdue loans
- Total students affected
- Total estimated fines

### Actions
| Action | Signature |
|--------|-----------|
| `getOverdueLoans` | `(minDaysOverdue, sortBy)` |

---

## Report 3: Borrowing History

### Purpose
Complete historical view of all loan transactions.

### Query Logic
```sql
SELECT 
  l.*, 
  bc.serial_number,
  b.title, b.isbn,
  s.std_no, s.name as student_name,
  u1.name as issued_by_name,
  u2.name as returned_to_name,
  f.amount as fine_amount, f.status as fine_status
FROM loans l
JOIN book_copies bc ON l.book_copy_id = bc.id
JOIN books b ON bc.book_id = b.id
JOIN students s ON l.std_no = s.std_no
LEFT JOIN users u1 ON l.issued_by = u1.id
LEFT JOIN users u2 ON l.returned_to = u2.id
LEFT JOIN fines f ON f.loan_id = l.id
WHERE l.loan_date BETWEEN :startDate AND :endDate
  AND (:status IS NULL OR l.status = :status)
  AND (:stdNo IS NULL OR l.std_no = :stdNo)
ORDER BY l.loan_date DESC
```

### Filters
| Filter | Type | Default |
|--------|------|---------|
| Start Date | DateInput | 30 days ago |
| End Date | DateInput | Today |
| Status | Select (All, Active, Returned, Overdue) | All |
| Student | StudentSearch (autocomplete) | None |
| Book | TextInput (search) | None |

### Display Columns
| Column | Description |
|--------|-------------|
| ID | Loan ID |
| Book Title | Book title |
| ISBN | Book ISBN |
| Student No | Student number |
| Student Name | Student name |
| Loan Date | When borrowed |
| Due Date | When due |
| Return Date | When returned (if applicable) |
| Status | Active/Returned/Overdue badge |
| Fine | Amount if applicable |
| Issued By | Librarian name |

### Summary Stats
- Total loans in period
- Books returned on time
- Books returned late
- Currently overdue
- Total fines generated

### Actions
| Action | Signature |
|--------|-----------|
| `getBorrowingHistory` | `(startDate, endDate, status?, stdNo?, bookSearch?)` |

---

## Report 4: Inventory

### Purpose
Current state of all books in the library catalog.

### Query Logic
```sql
SELECT 
  b.*,
  COUNT(DISTINCT ba.author_id) as author_count,
  COUNT(DISTINCT bcat.category_id) as category_count,
  COUNT(bc.id) FILTER (WHERE bc.status != 'Withdrawn') as total_copies,
  COUNT(bc.id) FILTER (WHERE bc.status = 'Available') as available_copies,
  COUNT(bc.id) FILTER (WHERE bc.status = 'OnLoan') as on_loan_copies,
  COUNT(DISTINCT l.id) as total_loans_ever
FROM books b
LEFT JOIN book_authors ba ON ba.book_id = b.id
LEFT JOIN book_categories bcat ON bcat.book_id = b.id
LEFT JOIN book_copies bc ON bc.book_id = b.id
LEFT JOIN loans l ON l.book_copy_id = bc.id
WHERE (:categoryId IS NULL OR bcat.category_id = :categoryId)
GROUP BY b.id
ORDER BY :sortBy
```

### Filters
| Filter | Type | Default |
|--------|------|---------|
| Category | Select (categories list) | All |
| Availability | Select (All, Has Available, All On Loan) | All |
| Sort By | Select (Title, Copies, Loans) | Title |

### Display Columns
| Column | Description |
|--------|-------------|
| ISBN | Book ISBN |
| Title | Book title |
| Publisher | Publisher name |
| Edition | Edition info |
| Total Copies | Total (non-withdrawn) in catalog |
| Available | Currently available copies |
| On Loan | Currently borrowed count |
| Categories | Category badges |
| Total Loans | Historical loan count |

### Summary Stats
- Total unique titles
- Total copies
- Currently available
- Currently on loan
- Damaged books
- Lost books

### Actions
| Action | Signature |
|--------|-----------|
| `getInventoryReport` | `(condition?, categoryId?, availability?, sortBy?)` |

---

## Export Functionality

### PDF Export (`_lib/pdf-export.ts`)

Use a library like `@react-pdf/renderer` or `jspdf` with `jspdf-autotable`.

**PDF Structure:**
- Header: Report title, date range, generated timestamp
- Filters applied (if any)
- Data table
- Summary statistics
- Footer: Page numbers, "Generated by Registry Web"

**Function:**
```
generatePdfReport(
  title: string,
  columns: Column[],
  data: Row[],
  summary?: Record<string, string | number>,
  filters?: Record<string, string>
): Blob
```

### Excel Export (`_lib/excel-export.ts`)

Use `xlsx` library (SheetJS).

**Excel Structure:**
- Sheet 1: Report data with headers
- Sheet 2: Summary statistics (optional)

**Function:**
```
generateExcelReport(
  title: string,
  columns: Column[],
  data: Row[],
  summary?: Record<string, string | number>
): Blob
```

### Export Buttons Component

**Features:**
- PDF button with download
- Excel button with download
- Loading state during generation
- Error handling

---

## UI Components

### Report Filters (`_components/ReportFilters.tsx`)

**Purpose:** Reusable filter form component

**Props:**
- `filters` - Array of filter configurations
- `values` - Current filter values
- `onChange` - Handler for filter changes
- `onApply` - Handler for applying filters

**Filter Types Supported:**
- Date (single date picker)
- DateRange (start + end date)
- Select (dropdown)
- Number (number input)
- Search (text with autocomplete)

### Report Table (`_components/ReportTable.tsx`)

**Purpose:** Reusable data table with sorting and pagination

**Props:**
- `columns` - Column definitions
- `data` - Row data
- `loading` - Loading state
- `onSort` - Sort handler
- `pagination` - Pagination config

**Features:**
- Sortable columns (click header)
- Loading skeleton
- Empty state
- Row click handler (optional)

### Date Range Picker (`_components/DateRangePicker.tsx`)

**Purpose:** Select start and end dates

**Features:**
- Two date inputs or single range picker
- Preset options: Today, Last 7 days, Last 30 days, This month, Last month, Custom
- Calendar starts on Sunday

---

## Reports Dashboard Page (`reports/page.tsx`)

**Purpose:** Landing page showing available reports

**Layout:**
- Grid of report cards
- Each card shows:
  - Report name
  - Brief description
  - Icon
  - Link to report page

**Report Cards:**
1. Popular Books - "See which books are most frequently borrowed"
2. Overdue Loans - "Track overdue books and estimated fines"
3. Borrowing History - "Complete loan transaction history"
4. Inventory - "Current book catalog status"

---

## Expected Files

| File Path | Purpose |
|-----------|---------|
| `src/app/library/reports/_server/repository.ts` | Report queries |
| `src/app/library/reports/_server/service.ts` | Report service |
| `src/app/library/reports/_server/actions.ts` | Report actions |
| `src/app/library/reports/_components/ReportFilters.tsx` | Filter component |
| `src/app/library/reports/_components/ReportTable.tsx` | Table component |
| `src/app/library/reports/_components/ExportButtons.tsx` | Export buttons |
| `src/app/library/reports/_components/DateRangePicker.tsx` | Date picker |
| `src/app/library/reports/_lib/types.ts` | Type definitions |
| `src/app/library/reports/_lib/pdf-export.ts` | PDF generation |
| `src/app/library/reports/_lib/excel-export.ts` | Excel generation |
| `src/app/library/reports/layout.tsx` | Reports layout |
| `src/app/library/reports/page.tsx` | Reports dashboard |
| `src/app/library/reports/popular-books/page.tsx` | Popular books report |
| `src/app/library/reports/overdue-loans/page.tsx` | Overdue loans report |
| `src/app/library/reports/borrowing-history/page.tsx` | Borrowing history |
| `src/app/library/reports/inventory/page.tsx` | Inventory report |

---

## Validation Criteria

1. `pnpm tsc --noEmit` - no type errors
2. `pnpm lint:fix` - no lint errors
3. Reports dashboard displays all report options
4. Each report loads with default filters
5. Filters update report data correctly
6. Date range filtering works
7. PDF export generates valid PDF file
8. Excel export generates valid XLSX file
9. Summary statistics calculate correctly
10. Tables support sorting
11. Loading states display during data fetch
12. Empty states display when no data

---

## Notes

- Reports are read-only; no data modifications
- Consider caching frequently accessed reports
- Large date ranges may need pagination or limits
- PDF generation happens client-side (no server load)
- Excel generation happens client-side
- Use `date-fns` for date calculations and formatting
- Follow existing report patterns from other modules (e.g., `@registry/reports`, `@academic/reports`)
