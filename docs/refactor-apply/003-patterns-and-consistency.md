# Part 3 — Patterns & Consistency

Fixes anti-patterns (useEffect misuse, render-time state), adds missing validation, and cleans up style/export inconsistencies.

**Priority**: 🟠 High (anti-patterns) / 🟡 Medium (style)
**Can partially overlap with**: Part 2

## Legend
- ✅ Done
- 🔲 Not started

---

### 🔲 3.1 Fix CourseSelectionForm Render-Time State

**File**: `src/app/apply/[id]/(wizard)/program/_components/CourseSelectionForm.tsx`

**Problem**: Updates React state during render:
```ts
if (appLoaded && !initialized) {
  if (currentApplication?.firstChoiceProgramId) {
    setFirstChoice(String(currentApplication.firstChoiceProgramId));
  }
  if (currentApplication?.secondChoiceProgramId) {
    setSecondChoice(String(currentApplication.secondChoiceProgramId));
  }
  setInitialized(true);
}
```

**Action**: Conditionally render form only when application data is ready; pass existing values as default props. Remove the render-phase state update block.

---

### 🔲 3.2 Gate PersonalInfoForm on Data Ready

**File**: `src/app/apply/[id]/(wizard)/personal-info/_components/PersonalInfoForm.tsx`

**Problem**: Form initializes with `applicant?.fullName ?? ''` fallbacks and can render empty fields before data loads, risking blank overwrites on submit.

**Action**:
1. Show loading skeleton until `applicant` data arrives from `useApplicant()`
2. Mount form only with correct initial values

---

### 🔲 3.3 Relocate Geolocation Capture

**File**: `src/app/apply/_lib/useApplicant.ts` (lines 150–168)

**Problem**: Geolocation capture + mutation triggered via `useEffect` with a `useRef` guard. Fragile — the ref resets on remount, potentially re-triggering.

**Action**:
1. Move geolocation capture to `welcome/page.tsx` or `new/page.tsx` as a one-time action after user consent
2. Remove `useEffect` + `useRef` geolocation pattern from `useApplicant`

---

### 🔲 3.4 Server-Side Eligibility Redirect

**File**: `src/app/apply/_lib/useApplicant.ts` (lines 138–145)

**Problem**: Client-side redirect in `useEffect` — page content can flash before redirect fires.

```ts
useEffect(() => {
  if (redirectIfRestricted && eligibilityQuery.data && !eligibilityQuery.data.canApply) {
    router.replace('/apply/restricted');
  }
}, [eligibilityQuery.data, router, redirectIfRestricted]);
```

**Action**: Move eligibility check to server-side (layout.tsx server component or middleware). Remove client-side `useEffect` redirect.

---

### 🔲 3.5 Replace Manual Polling with TanStack Query

**File**: `src/app/apply/[id]/(wizard)/payment/_components/MobilePayment.tsx` (lines 120–144)

**Problem**: Two `setInterval` calls in `useEffect` — one for polling verification, one for countdown timer.

**Action**: Replace with TanStack Query's `refetchInterval`:
```ts
useQuery({
  queryKey: ['payment-status', transactionRef],
  queryFn: () => checkPaymentStatus(transactionRef),
  refetchInterval: POLL_INTERVAL,
  enabled: !!transactionRef,
});
```

---

### ✅ 3.6 Remove Console Statements (qualifications)

**Status**: Console statements in `qualifications/_server/actions.ts` have been removed.

**Remaining**: `payment/_server/actions.ts` line 131 still has `console.error` for R2 cleanup failure — acceptable as recoverable-error logging, but consider structured logging.

---

### 🔲 3.7 Fix Module-Scope Date Computation

**File**: `src/app/apply/[id]/(wizard)/qualifications/_server/actions.ts` (line 26)

```ts
const CURRENT_YEAR = new Date().getFullYear();
```

**Problem**: Computed at module load time. Becomes stale in long-running server processes across year boundaries.

**Action**: Move `CURRENT_YEAR` inside the function that uses it.

---

### 🔲 3.8 Batch Convert Default Exports to Named

**Action**: Convert ALL default exports in the apply module to named exports.

**Files** (at minimum):
- `WizardLayout.tsx`, `WizardNavigation.tsx`
- `ApplyHeader.tsx`, `ApplyHero.tsx`
- `CourseSelectionForm.tsx`, `PersonalInfoForm.tsx`
- `ReceiptUpload.tsx`
- All other default-exported components in `src/app/apply/`

**Update**: All import sites.

---

### 🔲 3.9 Extend WizardNavigation for Submit + Inline Styles Audit

#### 3.9a — WizardNavigation Submit Support

**File**: `src/app/apply/[id]/(wizard)/_components/WizardNavigation.tsx`

**Problem**: `ReviewForm.tsx` bypasses WizardNavigation with custom back/submit buttons:
```tsx
<Group justify="space-between">
  <Button variant="default" onClick={() => router.back()}>Back</Button>
  <Button type="submit" loading={isPending}>Submit Application</Button>
</Group>
```

**Action**: Add `onSubmit` prop and custom submit label support to WizardNavigation. Refactor `ReviewForm.tsx` to use the extended WizardNavigation.

#### 3.9b — Inline Styles Audit

30+ `style={{}}` instances across 15 files. Replace with Mantine props:
- `style={{ opacity: 0.7 }}` → `opacity={0.7}`
- `style={{ flex: 1 }}` → `flex={1}`
- `<div style={...}>` → `<Box ...>`
- `ProfileView.tsx`: Replace `styles={{}}` on Tabs with Mantine variants or `classNames`

**Highest concentration files**: ProfileView.tsx, DocumentUpload.tsx / MobileDocumentUpload.tsx, CourseSelectionForm.tsx

---

### 🔲 3.10 Remaining Cleanup

#### 3.10a — Convert [id]/layout.tsx to Server Component

**File**: `src/app/apply/[id]/layout.tsx`

**Problem**: Marked `'use client'` solely for `useMantineColorScheme()`:
```tsx
const { colorScheme } = useMantineColorScheme();
const bg = colorScheme === 'dark' ? 'dark.8' : 'gray.1';
```

**Action**: Remove `'use client'`, use Mantine's `light-dark()` CSS function or CSS variables instead.

#### 3.10b — Rename Wizard CourseCard to ProgramChoiceCard

**File**: `src/app/apply/[id]/(wizard)/program/_components/CourseCard.tsx`

**Problem**: Two components named `CourseCard.tsx` in different directories.

**Action**: Rename to `ProgramChoiceCard.tsx`, update all imports.

#### 3.10c — Add PersonalInfoForm Validation

**File**: `src/app/apply/[id]/(wizard)/personal-info/_components/PersonalInfoForm.tsx`

Currently only validates `fullName`. **Add validation for**:
- Date of birth: reasonable range, not in future
- National ID format
- Phone number format
- Gender: required
- Other required fields

Use Zod schema or Mantine form `validate` rules.
