# Public Feedback Page (`/feedback`)

A publicly accessible, mobile-first, university-branded page where students enter a 3-word passphrase (or scan a QR code) to anonymously rate lecturers on a per-question carousel with 1–5 star Likert scale. Progress is server-side; students can resume by re-entering their passphrase. Each lecturer-module combo is a step; questions are shown one-at-a-time within each step.

## Decisions

- **Rating**: 1–5 stars with Likert labels (Strongly Disagree → Strongly Agree)
- **Progress**: Server-side only (DB is source of truth); localStorage caches passphraseId for convenience
- **Skip**: Saved as a record with null rating to distinguish from "not reached yet"
- **Submit**: Save per lecturer step, finalize at end
- **Questions**: One-at-a-time carousel per lecturer (compact card per question)
- **Comment**: Always-visible textarea below rating
- **Navigation**: Previous/Next buttons + dual progress (lecturer X of Y, question Z of N)
- **Passphrase input**: 3 separate Autocomplete inputs with client-side BIP-39 word list (~2,048 words, ~15KB gzipped)
- **QR landing**: Auto-validate passphrase from URL and enter directly into feedback form
- **Anonymity**: Prominent banner on entry page
- **Completion**: Simple "Thank you" card with checkmark
- **Branding**: University logo (`logo-dark.png` / `logo-light.png`) + primary colors
- **Mobile**: Mobile-first responsive design (QR scan = phone)
- **Expired cycle**: Friendly "This feedback cycle has ended" message page
- **Used passphrase**: Block with "This passphrase has already been used" message
- **Word list**: Client-side for instant autocomplete, zero network latency

## File Structure

```
src/app/feedback/
├── layout.tsx                          # Minimal public layout (no shell/sidebar)
├── page.tsx                            # Server component orchestrator
├── _server/
│   ├── repository.ts                   # DB queries (public feedback)
│   └── actions.ts                      # Server actions (withAuth ['all'])
├── _components/
│   ├── PassphraseEntry.tsx             # 3-word autocomplete entry + branding
│   ├── FeedbackForm.tsx                # Main feedback orchestrator (state machine)
│   ├── LecturerStep.tsx                # Current lecturer card + question carousel
│   ├── QuestionCard.tsx                # Single question with rating + comment
│   ├── LecturerProgress.tsx            # Top progress bar for lecturers
│   ├── ThankYou.tsx                    # Completion screen
│   ├── ExpiredCycle.tsx                # Cycle expired message
│   └── AlreadySubmitted.tsx            # Passphrase already used message
└── _lib/
    └── wordList.ts                     # Re-export of BIP-39 word list
```

## Step 1: Schema Change — Skip Marker

The `feedbackResponses` table currently has `rating: integer().notNull()`. To support "skip = record saved with null rating":

**Option chosen**: Make `rating` nullable in `feedbackResponses` schema. A single row per skipped lecturer-question with `rating: null` marks the skip. This avoids a new table and keeps the data model simple.

**File**: `src/app/academic/feedback/_schema/feedbackResponses.ts`
- Change `rating: integer().notNull()` → `rating: integer()`

Then run `pnpm db:generate` to create the migration.

## Step 2: Word List Extraction

**File**: `src/app/feedback/_lib/wordList.ts`
- Re-export the `wordList` array from `src/app/academic/feedback/_shared/lib/passphrase.ts`
- Or move the array to a shared location if needed

```typescript
export { wordList } from '@academic/feedback/_shared/lib/passphrase';
```

If `wordList` is not exported from `passphrase.ts`, add the export there first.

## Step 3: Create the Feedback Repository

**File**: `src/app/feedback/_server/repository.ts`

Imports `db` from `@/core/database`. Functions:

### `validatePassphrase(passphrase: string)`
- Query `feedbackPassphrases` WHERE `passphrase = input` (case-insensitive)
- Join `feedbackCycles` to get `name`, `startDate`, `endDate`, `termId`
- Compute status: `today < startDate` → "upcoming", `today > endDate` → "closed", else → "open"
- Return `{ passphraseId, cycleId, cycleName, termId, structureSemesterId, used, cycleStatus }` or `null`

### `getLecturersForClass(structureSemesterId: number, termId: number)`
- Query `assignedModules` WHERE `termId = termId` AND `active = true`
- Join `semesterModules` WHERE `semesterId = structureSemesterId`
- Join `modules` for `code`, `name`
- Join `users` for `name`, `image`
- Return `{ assignedModuleId: number, lecturerName: string, lecturerImage: string | null, moduleCode: string, moduleName: string }[]`

### `getQuestionsByCategory()`
- Query `feedbackQuestions` joined with `feedbackCategories`
- Order by `categoryName`, then `questionId`
- Return `{ categoryId: string, categoryName: string, questionId: string, questionText: string }[]`

### `getExistingResponses(passphraseId: string)`
- Query `feedbackResponses` WHERE `passphraseId = input`
- Return `{ assignedModuleId: number, questionId: string, rating: number | null, comment: string | null }[]`

### `saveResponses(passphraseId: string, assignedModuleId: number, responses: { questionId: string, rating: number | null, comment: string | null }[])`
- Use `db.insert(feedbackResponses).values([...]).onConflictDoUpdate(...)` targeting the unique constraint `(passphraseId, assignedModuleId, questionId)`
- Update `rating` and `comment` on conflict

### `markSkipped(passphraseId: string, assignedModuleId: number, questionIds: string[])`
- Insert rows with `rating: null` and `comment: null` for each questionId
- Uses `onConflictDoUpdate` to overwrite any existing responses

### `finalize(passphraseId: string)`
- `db.update(feedbackPassphrases).set({ used: true, usedAt: new Date() }).where(eq(feedbackPassphrases.id, passphraseId))`

## Step 4: Create Server Actions

**File**: `src/app/feedback/_server/actions.ts`

All actions use `withAuth(fn, ['all'])` — fully public, no authentication.

```typescript
'use server';

async function validatePassphrase(passphrase: string)
// Returns: { passphraseId, cycleId, cycleName, termId, structureSemesterId, used, cycleStatus } | { error: string }

async function getFeedbackData(passphraseId: string)
// Single call that returns:
// { lecturers: [...], questions: [...], existingResponses: [...] }
// Internally calls repository.getLecturersForClass(), getQuestionsByCategory(), getExistingResponses()

async function submitLecturerFeedback(passphraseId: string, assignedModuleId: number, responses: { questionId: string, rating: number, comment: string | null }[])
// Saves responses for one lecturer step

async function skipLecturer(passphraseId: string, assignedModuleId: number, questionIds: string[])
// Marks all questions for this lecturer as skipped (rating = null)

async function finalizeFeedback(passphraseId: string)
// Marks passphrase as used; returns success/error
```

## Step 5: Layout

**File**: `src/app/feedback/layout.tsx`

Minimal layout — no shell, no sidebar. Just metadata + children.

```typescript
import { ReactNode } from 'react';

export const metadata = {
  title: 'Student Feedback',
  description: 'Provide anonymous feedback on your lecturers',
};

export default function FeedbackLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
```

## Step 6: Page (Server Component Orchestrator)

**File**: `src/app/feedback/page.tsx`

- Reads `searchParams.passphrase`
- If passphrase present:
  - Calls `validatePassphrase()` server-side
  - **Valid + open + not used** → Calls `getFeedbackData()` → Renders `<FeedbackForm>` with all data as props
  - **Expired/closed** → Renders `<ExpiredCycle cycleName={...} endDate={...} />`
  - **Used** → Renders `<AlreadySubmitted />`
  - **Invalid** → Renders `<PassphraseEntry error="Invalid passphrase" />`
- If no passphrase: Renders `<PassphraseEntry />`

## Step 7: PassphraseEntry Component

**File**: `src/app/feedback/_components/PassphraseEntry.tsx` — `'use client'`

### Layout
- `Container size="xs"` for focused, centered content
- University logo at top (switches between `logo-dark.png` and `logo-light.png` via `useComputedColorScheme()`)
- Title: "Student Feedback Portal"
- Subtitle: "Enter your passphrase to provide anonymous feedback"

### Anonymity Banner
- `Alert` component with `IconShieldCheck` icon
- Text: "Your responses are completely anonymous. We cannot trace feedback to individuals."
- Color: `teal` or `blue`

### Passphrase Input
- Three `Autocomplete` components from Mantine
- Each filters the `wordList` array as the user types
- Labels: "Word 1", "Word 2", "Word 3"
- On mobile: stacked vertically (`SimpleGrid cols={{ base: 1, sm: 3 }}`)
- On desktop: side by side

### Auto-fill from URL
- On mount, check `searchParams` for `passphrase` query param
- If present, split by space, populate all 3 inputs, auto-submit

### Resume
- On mount, check localStorage for cached `passphraseId`
- If found, show a "Resume your feedback?" prompt with the cached passphrase words
- If student clicks "Resume", re-validate and continue

### Validation
- All 3 words must be from the `wordList`
- Joins words with space → calls `validatePassphrase()` action
- On success: `router.push('/feedback?passphrase=word1+word2+word3')`
- On error: shows inline error message

## Step 8: FeedbackForm Component

**File**: `src/app/feedback/_components/FeedbackForm.tsx` — `'use client'`

### Props
```typescript
type Props = {
  passphraseId: string;
  passphrase: string;
  cycleName: string;
  lecturers: { assignedModuleId: number; lecturerName: string; lecturerImage: string | null; moduleCode: string; moduleName: string }[];
  questions: { categoryId: string; categoryName: string; questionId: string; questionText: string }[];
  existingResponses: { assignedModuleId: number; questionId: string; rating: number | null; comment: string | null }[];
};
```

### State Machine
- `currentLecturerIndex`: Which lecturer step we're on
- `currentQuestionIndex`: Which question within the current lecturer
- `responses`: `Map<string, { rating: number | null, comment: string | null }>` keyed by `${assignedModuleId}-${questionId}`
- `skippedLecturers`: `Set<number>` of assignedModuleIds
- `completedLecturers`: `Set<number>` of assignedModuleIds that have been saved
- `isFinalized`: boolean

### Resume Logic
- On mount, populate `responses` from `existingResponses`
- Determine which lecturers are completed (all questions answered or skipped)
- Set `currentLecturerIndex` to the first incomplete lecturer

### Flow
1. Show `<LecturerProgress>` at top
2. Show `<LecturerStep>` for current lecturer
3. Within the lecturer step, show `<QuestionCard>` carousel
4. When all questions for a lecturer are answered, "Next Lecturer" button appears
5. On "Next Lecturer": save responses via `submitLecturerFeedback()`, advance to next
6. On "Skip Lecturer": call `skipLecturer()`, advance to next
7. After last lecturer: show a "Review & Submit" step
8. On "Submit All": call `finalizeFeedback()`, show `<ThankYou>`

## Step 9: LecturerProgress Component

**File**: `src/app/feedback/_components/LecturerProgress.tsx` — `'use client'`

- Shows overall progress: "Lecturer 2 of 5"
- A `Progress` bar with `(completedCount / totalCount) * 100` percent
- Optionally shows small avatars/names of all lecturers with checkmarks for completed ones
- Mobile: Just the progress bar + "2 of 5" text

## Step 10: LecturerStep Component

**File**: `src/app/feedback/_components/LecturerStep.tsx` — `'use client'`

### Header
- Lecturer avatar (`Avatar` component with `src={lecturerImage}`)
- Lecturer name (prominent)
- Module: `moduleCode — moduleName` (smaller text below)
- "Skip this lecturer" link button at top-right

### Question Carousel
- Shows `<QuestionCard>` for `currentQuestionIndex`
- Navigation: "Previous" / "Next" buttons
- Progress: "Question 3 of 8" text + dots

## Step 11: QuestionCard Component

**File**: `src/app/feedback/_components/QuestionCard.tsx` — `'use client'`

### Layout
- `Paper` with `withBorder`, `p="lg"`, `radius="md"`
- Category badge at top (small `Badge` with category name)
- Question text (prominent, `Text size="lg"`)
- `Rating` component from Mantine:
  - `size="xl"` for touch-friendly stars
  - `count={5}`
  - Labels below: "Strongly Disagree" (left) ... "Strongly Agree" (right)
- `Textarea` always visible below rating:
  - `placeholder="Add a comment (optional)"`
  - `autosize`, `minRows={2}`, `maxRows={4}`

### Behavior
- Rating and comment are stored in the parent's state (lifted up to `FeedbackForm`)
- Changes are immediate (controlled inputs)
- Pre-populated from `existingResponses` if resuming

## Step 12: ThankYou Component

**File**: `src/app/feedback/_components/ThankYou.tsx` — `'use client'`

- `Container size="xs"`, centered
- Large `IconCircleCheck` in green
- Title: "Thank you for your feedback!"
- Subtitle: cycle name
- Text: "X lecturers rated"
- Reassurance: "Your feedback is anonymous and helps improve teaching quality."
- Clears localStorage passphrase cache on mount

## Step 13: ExpiredCycle Component

**File**: `src/app/feedback/_components/ExpiredCycle.tsx`

- `Container size="xs"`, centered
- `IconCalendarOff` icon
- Title: "This feedback cycle has ended"
- Shows cycle name and end date
- "If you believe this is an error, please contact your class representative."

## Step 14: AlreadySubmitted Component

**File**: `src/app/feedback/_components/AlreadySubmitted.tsx`

- `Container size="xs"`, centered
- `IconChecks` icon (double check)
- Title: "Feedback already submitted"
- "This passphrase has already been used to submit feedback."
- "Each passphrase can only be used once to ensure fairness."

## Step 15: Dark Mode & Mobile Optimization

### Dark Mode
- All colors use Mantine tokens (`var(--mantine-color-*)`)
- Logo switches via `useComputedColorScheme()`
- Cards use `Paper withBorder` for contrast
- Rating stars use default Mantine yellow

### Mobile-First
- `Container size="xs"` (~420px) for all content
- Inputs stack vertically: `SimpleGrid cols={{ base: 1, sm: 3 }}`
- Rating stars: `size="xl"` for touch targets
- Buttons: full-width on mobile (`fullWidth` prop on `base`, normal on `sm+`)
- Question card: full-width, generous padding
- Lecturer progress: compact bar + text on mobile

## Verification

After implementation:
1. `pnpm tsc --noEmit` — ensure no type errors
2. `pnpm lint:fix` — ensure Biome is clean
3. Manual test flows:
   - Visit `/feedback` → enter valid passphrase → complete full flow
   - Visit `/feedback?passphrase=word1+word2+word3` → auto-validate → land on form
   - Close browser mid-flow → return → re-enter passphrase → resume from last completed lecturer
   - Try expired cycle passphrase → see expired message
   - Try already-used passphrase → see "already submitted" message
   - Mobile viewport test: ensure full flow works on phone-sized screen
