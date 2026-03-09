# 04 — Anti-Patterns

## 🟠 HIGH: useEffect for Data Fetching / Side Effects

### CourseSelectionForm.tsx — Render-Time State Initialization

**File:** `src/app/apply/[id]/(wizard)/program/_components/CourseSelectionForm.tsx`

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

**Problem:**
This updates React state during render. Even if it only runs once in practice, it is still a render-phase side effect and can lead to unstable behavior, especially under Strict Mode or future refactors.

**Fix:**
Initialize from a derived value or move the synchronization into an explicit event/effect pattern that does not write state during render.

### PersonalInfoForm.tsx — Async Form Initialization Drift

**File:** `src/app/apply/[id]/(wizard)/personal-info/_components/PersonalInfoForm.tsx`

```ts
const form = useForm({
  mode: 'uncontrolled',
  initialValues: {
    fullName: applicant?.fullName ?? '',
    ...
  },
});
```

**Problem:**
The form is initialized before applicant data is guaranteed to be available. Because the component mounts immediately and applicant data arrives asynchronously from `useApplicant()`, the displayed form values can remain empty and later submissions can overwrite existing profile data with blanks.

**Fix:**
Delay rendering until applicant data is ready, or explicitly initialize/reset the form once applicant data has loaded.

### useApplicant.ts — Geolocation Capture (lines 155–168)

```ts
const hasSetLocation = useRef(false);

useEffect(() => {
  if (!hasSetLocation.current && applicant && !applicant.location) {
    hasSetLocation.current = true;
    navigator.geolocation.getCurrentPosition((pos) => {
      // mutation call
    });
  }
}, [applicant]);
```

**Problem:** Side effect (geolocation + mutation) triggered via useEffect with a ref guard. This is fragile — the ref persists across re-renders but resets on remount, potentially triggering the mutation again.

**Fix:** Move geolocation capture to the onboarding flow (e.g., `welcome/page.tsx` or `new/page.tsx`) as a one-time server action, or use a proper event handler.

### useApplicant.ts — Eligibility Redirect (lines 137–145)

```ts
useEffect(() => {
  if (
    redirectIfRestricted &&
    eligibilityQuery.data &&
    !eligibilityQuery.data.canApply
  ) {
    router.replace('/apply/restricted');
  }
}, [eligibilityQuery.data, router, redirectIfRestricted]);
```

**Problem:** Client-side redirect in useEffect. If eligibility fails, the page content can still flash before redirect.

**Fix:** Use middleware or server-side redirect in the layout's `auth()` call.

### MobilePayment.tsx — Payment Polling (lines 114–148)

```ts
useEffect(() => {
  if (transactionRef) {
    const interval = setInterval(async () => {
      const result = await checkPaymentStatus(transactionRef);
      // handle result
    }, POLL_INTERVAL);
    return () => clearInterval(interval);
  }
}, [transactionRef]);
```

**Problem:** Manual setInterval polling inside useEffect. TanStack Query has built-in `refetchInterval` for exactly this pattern.

**Fix:**
```ts
const { data } = useQuery({
  queryKey: ['payment-status', transactionRef],
  queryFn: () => checkPaymentStatus(transactionRef),
  refetchInterval: 5000,
  enabled: !!transactionRef,
});
```

---

## 🟠 HIGH: Hardcoded Business Constants

### Payment Validation — `src/app/apply/[id]/(wizard)/payment/_server/validation.ts`

```ts
const BENEFICIARY_NAME = 'LIMKOKWING';
const BENEFICIARY_ACCOUNT = '9080003987813';
const BENEFICIARY_VARIATIONS = ['LIMKOKWING', 'LIMKOK WING', ...];
const SALES_RECEIPT_ISSUERS = ['LIMKOKWING', ...];
```

### ReceiptUpload — `src/app/apply/[id]/(wizard)/payment/_components/ReceiptUpload.tsx`

```ts
// Hardcoded in JSX:
// Account: 9080003987813
// Branch Code: 060667
```

### MobilePayment — `src/app/apply/[id]/(wizard)/payment/_components/MobilePayment.tsx`

```ts
const POLL_INTERVAL = 5000;
const TIMEOUT_SECONDS = 90;
```

**Problem:** Business-critical values scattered across components and server files. Changing bank details requires editing multiple files. Mismatch risk is high.

### Fix
1. Create `src/app/apply/_lib/constants.ts` for module-level constants
2. Banking details should be in environment variables or a centralized config
3. `MAX_FILE_SIZE`, `POLL_INTERVAL`, `TIMEOUT_SECONDS` should be in the constants file

---

## 🟠 HIGH: Missing Form Validation

**File:** `src/app/apply/[id]/(wizard)/personal-info/_components/PersonalInfoForm.tsx`

The form uses `useForm` with only one validation rule:
```ts
validate: {
  fullName: (v) => (!v ? 'Full name is required' : null),
}
```

**Missing validations:**
- Date of birth: no age range check, no future date prevention
- National ID format (country-specific)
- Phone numbers: no format validation
- Gender: no required check
- Multiple fields can be submitted empty

### Fix
Add Zod schema validation or Mantine form `validate` rules for all required fields. At minimum validate date of birth is in a reasonable range and not in the future.

---

## 🟡 MEDIUM: Console Statements in Production Code

**File:** `src/app/apply/[id]/(wizard)/qualifications/_server/actions.ts`
- Line 162: `console.info('Skipping academic record prepopulation...')`
- Line 190: `console.error('Failed to prepopulate...', error)`

**File:** `src/app/apply/[id]/(wizard)/payment/_server/actions.ts`
- Line 120: `console.error` in catch block

### Fix
Remove or replace with structured logging if server-side observability is needed.

---

## 🟡 MEDIUM: Module-Scope Date Computation

**File:** `src/app/apply/[id]/(wizard)/qualifications/_server/actions.ts`

```ts
const CURRENT_YEAR = new Date().getFullYear();
```

**Problem:** Computed at module load time. In long-running server processes, this value becomes stale across year boundaries.

### Fix
Compute inside the function that uses it, or pass as a parameter.

---

## 🟡 MEDIUM: Math.random() for ID Generation

**File:** `src/app/apply/[id]/(wizard)/payment/_components/ReceiptUpload.tsx`

```ts
function generateId() {
  return Math.random().toString(36).slice(2, 11);
}
```

**Problem:** While acceptable for ephemeral client IDs, the project already uses `nanoid` (imported in payment/actions.ts). Inconsistent approach.

### Fix
Use `nanoid()` consistently, or import `crypto.randomUUID()` for client-side IDs.
