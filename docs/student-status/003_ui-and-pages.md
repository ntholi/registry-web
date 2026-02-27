# Step 003: UI & Pages

## Introduction

This step creates all UI components, page routes, and navigation configuration for the Student Status feature. Steps 1 (schema) and 2 (backend) must be completed first. The UI follows the existing Adease patterns: `ListLayout` for the master list, `DetailsView` for detail pages, and `Form` for creation.

## Context

Existing UI patterns in the codebase:
- **ListLayout**: Used in `blocked-students/layout.tsx` — provides master-detail with search, pagination, action icons
- **DetailsView / DetailsViewHeader / DetailsViewBody**: Used in `blocked-students/[id]/page.tsx`
- **Form**: Used in `blocked-students/_components/Form.tsx` — wraps Mantine form with TanStack Query integration and Zod validation
- **StdNoInput**: Existing component at `src/app/dashboard/base/StdNoInput.tsx` for student number lookup
- **Colors**: `getStatusColor()` from `@/shared/lib/utils/colors.ts` already handles `pending`, `approved`, `rejected`
- **Status Icons**: `@/shared/lib/utils/status.tsx` for status → icon mappings
- All UI uses **Mantine v8** components only — no custom CSS

## Requirements

### 1. Navigation Configuration

**File to update:** `src/app/registry/registry.config.ts`

Add a new navigation item below "Blocked Students":

| Property          | Value                                       |
| ----------------- | ------------------------------------------- |
| `label`           | `'Student Status'`                          |
| `href`            | `'/registry/student-status'`                |
| `icon`            | `IconUserExclamation` (from `@tabler/icons-react`) |
| `isVisible`       | Function: visible to `admin`, `registry`, `academic`, `student_services`, `finance` roles |
| `notificationCount` | `{ queryKey: ['student-status-apps', 'pending'], queryFn: () => countPendingStudentStatusApps(), color: 'red' }` |

> **Important**: Use `isVisible` (not `roles`) because approvers (academic with year_leader/manager/program_leader positions, student_services, finance) need access to navigate to pending applications. The `countPendingStudentStatusApps` action should return the count of applications with at least one pending approval matching the current user's role/position.

### 2. Application Form (`_components/Form.tsx`)

A form for creating new student status change applications.

#### Behavior
1. **Student Number Input**: Use `StdNoInput` component — auto-fills student info
2. **Type Select**: Dropdown with options: Withdrawal, Deferment, Reinstatement
   - When type changes, filter the justification options accordingly
3. **Justification Select**: Dropdown, options filtered by selected type:
   - Withdrawal/Deferment: Medical, Transfer, Financial, Employment, Other
   - Reinstatement: After termination/withdrawal, After deferment, To pick up failed modules, Upgrading qualification, Other
4. **Notes Textarea**: Optional free-text field
5. **Term Code**: Auto-filled with the current active term code, but editable (text input)
6. **Semester**: Auto-detected from the student's active semester for the given term. For reinstatement this may be empty.

#### Validation
- Use `drizzle-zod` `createInsertSchema` from `studentStatuses`, omitting `status`, `createdBy`, `createdAt`, `updatedAt`
- `stdNo` required, `type` required, `justification` required, `termCode` required

#### Conditional Logic
- For **reinstatement**: only allow if the student's status is `Withdrawn`/`Terminated` or they have a `Deferred`/`Withdrawn` semester. Show a validation message otherwise.
- For **withdrawal/deferment**: only allow if the student has an active semester for the selected term.

#### Props Pattern
Follow the existing `BlockedStudentForm` pattern:
```
type Props = {
  onSubmit: (values: AppInsert) => Promise<AppSelect>;
  defaultValues?: AppInsert;
  title?: string;
}
```

### 3. Approval Panel (`_components/ApprovalPanel.tsx`)

A component displayed on the application detail page showing all approval steps and allowing authorized users to approve/reject.

#### Layout
- Use `Mantine.Table` or `Mantine.Stack` with one row per approval step
- Each row shows:
  - **Role Label**: e.g., "Year Leader", "Programme Leader / Manager", "Student Services", "Finance"
  - **Status Badge**: Colored badge (pending=yellow, approved=green, rejected=red) using `getStatusColor()`
  - **Responder Name**: Who approved/rejected (if responded)
  - **Response Date**: When responded (formatted with `formatDateTime`)
  - **Message**: Rejection message if any
  - **Action Buttons**: "Approve" and "Reject" buttons, only visible if:
    - The current user has the matching role/position for that approval step
    - The step is still `pending`
    - The application is still `pending`

#### Reject Action
- On clicking "Reject", show a small modal/popover with a textarea for the rejection message
- Call `rejectStudentStatusStep(approvalId, message)`

#### Approve Action
- On clicking "Approve", call `approveStudentStatusStep(approvalId)` directly
- On success, invalidate the query to refresh the detail view

### 4. Status Timeline (`_components/StatusTimeline.tsx`)

A visual timeline showing the progression of the application using `Mantine.Timeline`.

#### Timeline Items
1. **Application Created** — shows creator name, date
2. One item per approval step — shows role, status, responder, date
3. **Final Outcome** — shows final status (approved/rejected/cancelled) with date

Use appropriate colors and icons from `@tabler/icons-react` for each step.

### 5. Page Routes

#### `layout.tsx` — List Layout

```
Path: src/app/registry/student-status/layout.tsx
```

Use `ListLayout` component:
- `path`: `/registry/student-status`
- `queryKey`: `['student-status-apps']`
- `getData`: Call `findAllStudentStatusApps(page, search)` — returns paginated result
- `actionIcons`: `[<NewLink href='/registry/student-status/new' />]`
- `renderItem`: Show student number as label, student name as description, type and status as badges

#### `page.tsx` — Nothing Selected

```
Path: src/app/registry/student-status/page.tsx
```

Return `<NothingSelected title='Student Status' />`

#### `new/page.tsx` — Create Application

```
Path: src/app/registry/student-status/new/page.tsx
```

Render the `Form` component:
- `title`: `'New Application'`
- `onSubmit`: Call `createStudentStatusApp`
- On success, redirect to the created application's detail page

#### `[id]/page.tsx` — Application Detail

```
Path: src/app/registry/student-status/[id]/page.tsx
```

Client component using `useQuery` to fetch the application.

**Layout:**
- `DetailsView` wrapper
- `DetailsViewHeader`:
  - `title`: Student name
  - `queryKey`: `['student-status-apps']`
  - Cancel button visible for pending applications (registry/admin only)
- `DetailsViewBody`:
  - **Top Section**: Application info fields using `FieldView`:
    - Student Number (link to student profile)
    - Student Name
    - Type (badge with color)
    - Status (badge with color)
    - Justification (formatted label)
    - Notes
    - Term Code
    - Created By
    - Created Date
  - **Approval Panel**: The `ApprovalPanel` component showing all approval steps
  - **Timeline**: The `StatusTimeline` component at the bottom

### 6. Color & Status Mappings

**File to update:** `src/shared/lib/utils/colors.ts`

Verify that the following statuses already map correctly through `getStatusColor()`:

| Status      | Expected Color | Notes                                          |
| ----------- | -------------- | ---------------------------------------------- |
| `pending`   | `yellow`       | Already handled by normalized string matching  |
| `approved`  | `green`        | Already handled via `allStatuses` lookup       |
| `rejected`  | `red`          | Already handled by normalized string matching  |
| `cancelled` | `red`          | Already mapped as `semantic.error` at line 192 |

> No changes needed to `colors.ts` — all statuses are already covered by the existing `getStatusColor()` function.

**File to update:** `src/shared/lib/utils/status.tsx`

Add mappings for the application type:

| Type            | Icon                          |
| --------------- | ----------------------------- |
| `withdrawal`    | `IconUserMinus`               |
| `deferment`     | `IconUserPause`               |
| `reinstatement` | `IconUserPlus`                |

### 7. Utility: Label Formatters

Create a small utility file or add to the form component for formatting enum values to display labels:

| Enum Value            | Display Label                     |
| --------------------- | --------------------------------- |
| `withdrawal`          | Withdrawal                        |
| `deferment`           | Deferment                         |
| `reinstatement`       | Reinstatement                     |
| `medical`             | Medical                           |
| `transfer`            | Transfer                          |
| `financial`           | Financial                         |
| `employment`          | Employment                        |
| `after_withdrawal`    | After Termination / Withdrawal    |
| `after_deferment`     | After Deferment                   |
| `failed_modules`      | To Pick Up Failed Modules         |
| `upgrading`           | Upgrading Qualification           |
| `other`               | Other                             |
| `year_leader`         | Year Leader                       |
| `program_leader`      | Programme Leader / Manager        |
| `student_services`    | Student Services (Counselling)    |
| `finance`             | Finance                           |

## Expected Files

| File                                                               | Purpose                                     |
| ------------------------------------------------------------------ | ------------------------------------------- |
| `src/app/registry/student-status/layout.tsx`                      | ListLayout wrapper                          |
| `src/app/registry/student-status/page.tsx`                        | NothingSelected page                        |
| `src/app/registry/student-status/new/page.tsx`                    | Create application page                     |
| `src/app/registry/student-status/[id]/page.tsx`                   | Application detail page                     |
| `src/app/registry/student-status/_components/Form.tsx`            | Application creation form                   |
| `src/app/registry/student-status/_components/ApprovalPanel.tsx`   | Approval steps with action buttons          |
| `src/app/registry/student-status/_components/StatusTimeline.tsx`  | Visual timeline of application progress     |
| `src/app/registry/registry.config.ts`                             | Updated navigation (add Student Status)     |
| `src/shared/lib/utils/colors.ts`                                  | No changes needed (verified)                |
| `src/shared/lib/utils/status.tsx`                                 | Updated with application type icons         |

## Validation Criteria

1. Navigation item appears below "Blocked Students" in the Registry sidebar
2. List page renders with search and pagination working
3. Creating a new application form shows correct fields based on type selection
4. Justification options filter correctly based on selected type
5. Term code auto-fills from active term
6. Detail page shows all application information
7. Approval panel shows correct approval steps based on application type (4 for withdrawal/deferment, 2 for reinstatement)
8. Approve/Reject buttons only visible to authorized users for their matching step
9. Rejecting prompts for a message
10. After all approvals, application status auto-updates
11. Cancel button works for pending applications
12. Status badges use correct colors
13. `pnpm tsc --noEmit && pnpm lint:fix` passes clean

## Notes

- The `StdNoInput` component already handles student lookup and validation — reuse it as-is
- For the justification filtering logic (different options per type), use a simple object mapping in the form component rather than creating a separate utility
- The ApprovalPanel should use `useQuery` to check the current user's session/role to determine button visibility. Use the existing auth patterns from the codebase.
- All Mantine modals must be self-contained (include their own trigger button) — the reject confirmation should use `Mantine.Modal` opened by the reject button
- Use `Mantine.Badge` for status and type display throughout
- Use `Mantine.Select` for type and justification dropdowns
- Dark mode optimization: use Mantine's semantic colors (no hardcoded hex values)
