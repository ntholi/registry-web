# 05 — Inconsistencies & Style Issues

## 🟡 MEDIUM: Inconsistent Export Patterns

Most components in the project guidelines prefer named exports (`export function ComponentName`), but the apply module uses default exports broadly. The wizard components below are only the most visible examples:

| File | Pattern | Expected |
|------|---------|----------|
| `WizardLayout.tsx` | `export default function WizardLayout` | `export function WizardLayout` |
| `WizardNavigation.tsx` | `export default function WizardNavigation` | `export function WizardNavigation` |

Additional examples in the same module include:
- `src/app/apply/_components/ApplyHeader.tsx`
- `src/app/apply/_components/ApplyHero.tsx`
- `src/app/apply/[id]/(wizard)/program/_components/CourseSelectionForm.tsx`
- `src/app/apply/[id]/(wizard)/personal-info/_components/PersonalInfoForm.tsx`
- `src/app/apply/[id]/(wizard)/payment/_components/ReceiptUpload.tsx`

This is not isolated to two files, so the issue is module-wide consistency rather than a single local exception.

### Fix
Convert to named exports for consistency with the rest of the codebase.

---

## 🟡 MEDIUM: ReviewForm Bypasses WizardNavigation

**File:** `src/app/apply/[id]/(wizard)/review/_components/ReviewForm.tsx`

Every other wizard step uses `<WizardNavigation />` for the back/next buttons. ReviewForm implements its own back/submit buttons:

```tsx
<Group justify="space-between">
  <Button variant="default" onClick={() => router.back()}>Back</Button>
  <Button type="submit" loading={isPending}>Submit Application</Button>
</Group>
```

**Problem:** If `WizardNavigation` behavior changes (e.g., adding a save-draft button, changing styling), ReviewForm won't inherit the change.

### Fix
Either extend `WizardNavigation` to support a custom submit action, or extract the shared button layout.

---

## 🟡 MEDIUM: 30 Inline `style={{}}` Usages

Found 30 instances of inline `style={{}}` across 15 files in the apply module. This violates the Mantine-only styling rule. Many can be replaced with Mantine component props.

**Examples:**

```tsx
// ❌ Inline style
<Text style={{ opacity: 0.7 }}>...</Text>
// ✅ Mantine prop
<Text opacity={0.7}>...</Text>

// ❌ Inline style
<Box style={{ flex: 1 }}>...</Box>
// ✅ Mantine prop
<Box flex={1}>...</Box>

// ❌ Inline style
<div style={{ pointerEvents: 'none' }}>...</div>
// ✅ Mantine Box
<Box style={{ pointerEvents: 'none' }}>...</Box>
// or use Mantine's `mod` prop pattern
```

**Highest concentration files:**
- `ProfileView.tsx` — 5+ inline styles including a large `styles` object on Tabs
- `DocumentUpload.tsx` / `MobileDocumentUpload.tsx` — status overlay styling
- `CourseSelectionForm.tsx` — card selection states
- Various wizard step components — spacing and layout tweaks

### Fix
Audit each inline style and replace with Mantine props where possible. For complex cases (like ProfileView's Tabs styling), use Mantine's `classNames` API or built-in variant props.

---

## 🟡 MEDIUM: ProfileView Custom CSS Object

**File:** `src/app/apply/profile/_components/ProfileView.tsx`

```tsx
<Tabs
  styles={{
    tab: {
      fontWeight: 500,
      height: rem(42),
      '&[data-active]': { borderColor: 'var(--mantine-color-blue-filled)' },
    },
    tabLabel: { fontSize: rem(13) },
    panel: { paddingTop: rem(16) },
  }}
>
```

**Problem:** Verbose custom CSS styles passed via `styles` prop. The project rule is Mantine components only, no custom CSS.

### Fix
Use Mantine's built-in Tab variants or extract into a shared tab style if this pattern is needed elsewhere.

---

## 🟡 MEDIUM: `[id]/layout.tsx` Is Client Component Unnecessarily

**File:** `src/app/apply/[id]/layout.tsx`

Marked as `'use client'` solely to use `useMantineColorScheme()` for a dynamic background color:

```tsx
const { colorScheme } = useMantineColorScheme();
const bg = colorScheme === 'dark' ? 'dark.8' : 'gray.1';
```

**Problem:** Making the layout a client component prevents it from being a Server Component, which cascades to affect all children's rendering strategy.

### Fix
Use Mantine's `light`/`dark` color scheme utilities in CSS or use `computedColorScheme` if available in Mantine v8's server components support.

---

## 🟡 MEDIUM: Local `formatRole()` Utility

**File:** `src/app/apply/restricted/page.tsx`

Defines a local utility:
```ts
function formatRole(role: string) {
  return role.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase());
}
```

**Problem:** This is a generic string utility that could exist elsewhere or be needed by other modules.

### Fix
Check if a `formatRole` exists in shared utils. If not, add it to `src/shared/lib/utils/utils.ts` if it's useful broadly, or keep it local if this is the only usage.

---

## 🟡 MEDIUM: Duplicate CourseCard Component Names

Two completely different components share the name `CourseCard.tsx`:

1. `src/app/apply/[id]/(wizard)/program/_components/CourseCard.tsx` — Selectable card for program choice wizard
2. `src/app/apply/courses/_components/CourseCard.tsx` — Display card showing course details and entry requirements

**Problem:** While they live in different directories, the identical filename creates confusion. IDE searches for "CourseCard" return both, and imports can be accidentally swapped.

### Fix
Rename for clarity:
- Program's card → `ProgramChoiceCard.tsx`
- Courses' card → `CourseInfoCard.tsx` (or keep as `CourseCard.tsx` since it's in the courses context)
