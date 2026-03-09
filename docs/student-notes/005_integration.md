# Step 005: Integration & Verification

## Introduction

Steps 001-004 created the schema, server layer, activity logging, and UI components. This final step wires the Notes tab into the student detail page by modifying `StudentTabs.tsx` and runs the verification checks.

## Context

- `StudentTabs.tsx` uses role-based permission booleans to conditionally show tabs
- Each tab panel renders a component with `stdNo` and `isActive` props
- The Notes tab should be visible to all dashboard users (everyone except `user`, `applicant`, `student`)
- Position the Notes tab between Documents and History

## Requirements

### 1. Add Notes Tab to `StudentTabs`

File: `src/app/registry/students/_components/StudentTabs.tsx`

**Changes:**

1. **Import** `NotesView` from `./notes/NotesView`

2. **Add permission boolean** (after `showDocuments`):
   ```
   const showNotes = !['user', 'applicant', 'student'].includes(session?.user?.role ?? '');
   ```
   This allows all dashboard users to see the Notes tab.

3. **Add tab button** (between Documents and History in `ScrollableTabsList`):
   ```
   {showNotes && <TabsTab value='notes'>Notes</TabsTab>}
   ```

4. **Add tab panel** (between Documents and History panels):
   ```
   {showNotes && (
     <TabsPanel value='notes' pt='xl' p='sm' key='notes'>
       <NotesView stdNo={student.stdNo} isActive={activeTab === 'notes'} />
     </TabsPanel>
   )}
   ```

### 2. Barrel Exports

Ensure `src/app/registry/student-notes/index.ts` re-exports all server actions needed by the UI:

```
export {
  getStudentNotes,
  createStudentNote,
  updateStudentNote,
  deleteStudentNote,
  uploadNoteAttachment,
  deleteNoteAttachment,
} from './_server/actions';
```

### 3. Verification

Run the following commands in sequence:

1. `pnpm db:generate` — generate the migration for new tables
2. Apply migration to the database
3. `pnpm tsc --noEmit` — verify no type errors
4. `pnpm lint:fix` — verify no lint issues
5. Fix any issues and repeat until clean

### 4. Manual Testing Checklist

| # | Test | Expected Result |
|---|------|----------------|
| 1 | Open a student → click Notes tab | Tab appears, shows "No notes yet" or existing notes |
| 2 | Create a note with "My Department" visibility | Note appears in list with role badge |
| 3 | Create a note with "Only Me" visibility | Note visible to creator, hidden for others |
| 4 | Create a note with "Everyone" visibility | Note visible to all dashboard users |
| 5 | Edit a note (as creator) | Content updates, edit mode works |
| 6 | Delete a note (as creator) | Confirmation modal, note removed |
| 7 | Try to edit/delete another user's note (non-admin) | Edit/Delete actions not shown |
| 8 | Edit/delete another user's note as admin | Actions visible and functional |
| 9 | Upload a PDF attachment to a note | File appears in attachments list |
| 10 | Upload an image attachment | Thumbnail preview shown |
| 11 | Download an attachment | File downloads correctly |
| 12 | Delete an attachment | Confirmation, removed from list and R2 |
| 13 | Upload a file > 5 MB | Error message shown, file rejected |
| 14 | Check student History tab | Note/attachment activities appear |
| 15 | Check admin activity tracker | Student note activities appear under registry department |

## Expected Files

**Modified:**

| File | Change |
|------|--------|
| `src/app/registry/students/_components/StudentTabs.tsx` | Add Notes tab + panel |

**Verified:**

| File | Check |
|------|-------|
| `src/app/registry/student-notes/index.ts` | Barrel exports all actions |

## Validation Criteria

1. Notes tab appears for all dashboard users
2. Notes tab does NOT appear for `user`, `applicant`, `student` roles
3. Tab is positioned between Documents and History
4. `pnpm tsc --noEmit` passes
5. `pnpm lint:fix` passes
6. All 15 manual tests pass

## Notes

- The `DashboardUser` type from `src/app/auth/users/_schema/users.ts` lists all dashboard roles. Using a negative check (`!['user', 'applicant', 'student'].includes(...)`) is more future-proof than listing all dashboard roles explicitly.
- The `isActive` prop ensures the `useQuery` in `NotesView` only fires when the Notes tab is selected, avoiding unnecessary database calls.
