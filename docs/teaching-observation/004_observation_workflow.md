# Part 4: Observation Workflow

> CRUD, observation form, draft/submit/acknowledge flow, notifications, and lecturer access.

## Feature Path

```
src/app/appraisals/teaching-observations/
├── _server/
│   ├── repository.ts
│   ├── service.ts
│   └── actions.ts
├── _components/
│   ├── ObservationForm.tsx
│   ├── RatingInput.tsx
│   ├── ObservationDetail.tsx
│   └── AcknowledgeButton.tsx
├── _lib/
│   └── types.ts
├── layout.tsx
├── page.tsx
├── new/page.tsx
└── [id]/
    ├── page.tsx
    └── edit/page.tsx
```

---

## Status Workflow

```
  ┌─────────┐     Submit      ┌───────────┐    Acknowledge    ┌──────────────┐
  │  Draft   │ ──────────────► │ Submitted  │ ────────────────► │ Acknowledged │
  └─────────┘                  └───────────┘                   └──────────────┘
       │                             │
   Edit/Delete               Edit (admin only)
```

| Status | Who can see | Who can edit | Who can delete |
|--------|-------------|--------------|----------------|
| `draft` | Observer only | Observer | Observer |
| `submitted` | Observer + Lecturer + Admin/HR | Admin/Manager only | Admin only |
| `acknowledged` | Observer + Lecturer + Admin/HR | Nobody (read-only) | Admin only |

---

## Repository

`ObservationRepository` extends `BaseRepository<typeof observations, 'id'>`.

### Key Methods

| Method | Description |
|--------|-------------|
| `findById(id)` | Observation with cycle, assignedModule (with semesterModule → module, user), observer, ratings (with criterion → category) |
| `query(options, filters)` | Paginated list with filters: `cycleId`, `observerId`, `status`, `schoolId` |
| `create(data, ratings)` | Insert observation + bulk insert rating rows (one per criterion) in a transaction |
| `update(id, data, ratings)` | Update observation fields + upsert ratings in a transaction |
| `submit(id)` | Set `status = 'submitted'`, `submittedAt = now()` |
| `acknowledge(id, comment?)` | Set `status = 'acknowledged'`, `acknowledgedAt = now()`, `acknowledgmentComment` |
| `findByLecturer(userId, options)` | All observations where `assignedModules.userId = userId` |
| `checkExists(cycleId, assignedModuleId)` | Check uniqueness before creation |

### `findById` Query Shape

```typescript
async findById(id: string) {
  return db.query.observations.findFirst({
    where: eq(observations.id, id),
    with: {
      cycle: { with: { term: true } },
      assignedModule: {
        with: {
          semesterModule: {
            with: {
              module: true,
              semester: { with: { structure: { with: { program: true } } } },
            },
          },
          user: true,  // the observed lecturer
        },
      },
      observer: true,
      ratings: {
        with: { criterion: { with: { category: true } } },
      },
    },
  });
}
```

### `create` Transaction

```typescript
async create(
  data: typeof observations.$inferInsert,
  criterionIds: string[],
) {
  return db.transaction(async (tx) => {
    const [obs] = await tx.insert(observations).values(data).returning();
    if (criterionIds.length > 0) {
      await tx.insert(observationRatings).values(
        criterionIds.map((criterionId) => ({
          observationId: obs.id,
          criterionId,
          rating: null,
        })),
      );
    }
    // audit log
    return obs;
  });
}
```

---

## Service

`ObservationService` extends `BaseService`.

### Permission Config

```typescript
{
  findAllAuth: { 'teaching-observations': ['read'] },
  byIdAuth: { 'teaching-observations': ['read'] },
  createAuth: { 'teaching-observations': ['create'] },
  updateAuth: { 'teaching-observations': ['update'] },
  deleteAuth: { 'teaching-observations': ['delete'] },
  activityTypes: {
    create: 'teaching_observation_created',
    update: 'teaching_observation_updated',
    delete: 'teaching_observation_deleted',
  },
}
```

### Key Methods

| Method | Access | Description |
|--------|--------|-------------|
| `create(data, criterionIds)` | Program Leaders | Creates observation + empty rating rows |
| `saveRatings(id, ratings)` | Observer (draft only) | Updates rating values |
| `submit(id)` | Observer (draft → submitted) | Validates all criteria rated, transitions status |
| `acknowledge(id, comment?)` | Lecturer (submitted → acknowledged) | Transitions status, sets timestamp |
| `findForLecturer(userId, options)` | Lecturers | Returns only their observations (submitted/acknowledged) |
| `getObservationsForList(params)` | Scoped by school | Paginated list with school scoping |

### Submit Validation

Before submitting, validate:
1. All criteria have a non-null `rating` (1–5)
2. `strengths` is not empty
3. `improvements` is not empty
4. Status is currently `draft`

If validation fails, return error without transitioning.

### Lecturer Scoping

When a lecturer calls `findForLecturer`, the repository joins through `assigned_modules` to filter only observations on their teaching assignments:

```sql
WHERE assigned_modules.user_id = :lecturerUserId
  AND observations.status IN ('submitted', 'acknowledged')
```

---

## Actions

```typescript
'use server';

export async function getObservations(page: number, search: string)
export async function getObservation(id: string)
export const createObservation = createAction(...)
export const updateObservation = createAction(...)
export const submitObservation = createAction(...)
export const acknowledgeObservation = createAction(...)
export const deleteObservation = createAction(...)
export async function getMyObservations(page: number, search: string)  // for lecturers
export async function checkObservationExists(cycleId: string, assignedModuleId: number)

// Dropdown data for the form
export async function getActiveCycles()        // cycles active for observer's schools
export async function getLecturersForSchool()   // lecturers in same school
export async function getAssignedModules(lecturerUserId: string, termId: number)
```

---

## UI Components

### `ObservationForm.tsx` — The Main Form

A single-page form with Mantine `Accordion` sections. Used for both create and edit.

**Header Fields** (top of form):
- **Cycle** — Select dropdown (active cycles for the observer's school)
- **Lecturer** — Select dropdown (lecturers in same school, filtered after cycle selected to use cycle's term)
- **Assigned Module** — Select dropdown (modules assigned to selected lecturer in the cycle's term)

When cycle + lecturer + module are selected, check uniqueness. If an observation already exists, show a warning and link to the existing one.

**Criteria Sections** (accordion):
Three accordion items for each section. Each section contains its categories. Each category is a sub-section with a label and its criteria listed vertically.

For each criterion:
- Criterion text (bold label)
- Description/guidance text (muted, smaller text below)
- `RatingInput` component (1–5 selector)

**Remarks Section** (below criteria):
- **Strengths** — Textarea
- **Areas for Improvement** — Textarea
- **Recommendations** — Textarea
- **Identified Training Area** — Textarea

**Actions**:
- "Save as Draft" button (saves current state, keeps `draft` status)
- "Submit" button (validates completeness, transitions to `submitted`)

### `RatingInput.tsx`

A reusable 1–5 rating input. Options:
- Mantine `SegmentedControl` with values 1–5 (compact, visual)
- Or Mantine `Rating` component (stars) — star-based may not fit the formal context
- Or `Radio.Group` with 5 radio buttons labeled 1–5

Recommended: `SegmentedControl` — clean, compact, fits the grid feel of the PRL form.

```typescript
type RatingInputProps = {
  value: number | null;
  onChange: (value: number) => void;
  disabled?: boolean;
};
```

### `ObservationDetail.tsx`

Read-only view of a completed observation. Shows:
- **Header**: Cycle name, term, lecturer name, module code + name, programme, observer name, date
- **Scoring Summary**: Overall score badge, section averages
- **Criteria Sections**: Each section with categories, each criterion showing the rating (highlighted number or filled indicator)
- **Remarks**: Strengths, improvements, recommendations, training area
- **Status**: Current status badge (Draft/Submitted/Acknowledged)
- **Acknowledgment**: If acknowledged, show lecturer's comment and timestamp

### `AcknowledgeButton.tsx`

A button that opens a modal. Lecturer clicks "Acknowledge", optionally types a comment, confirms.

```typescript
type AcknowledgeButtonProps = {
  observationId: string;
  onAcknowledged?: () => void;
};
```

---

## Pages

### `page.tsx` — List Page

Uses `ListLayout` with:
- `getData`: `getObservations(page, search)` or `getMyObservations(page, search)` depending on role
- Filters: cycle dropdown, status dropdown
- Each list item shows: lecturer name, module, date, status badge
- `NewLink` for Program Leaders to create new observations

### `new/page.tsx` — Create Page

RSC page that:
1. Fetches active cycles, initial lecturer list
2. Fetches categories with criteria (`getCategoriesWithCriteria()`)
3. Renders `ObservationForm` with empty state

### `[id]/page.tsx` — Detail Page

RSC page that:
1. Fetches observation by ID (with all relations)
2. If current user is the observed lecturer and status is `submitted`, shows `AcknowledgeButton`
3. If current user is the observer and status is `draft`, shows "Edit" and "Delete" buttons
4. Otherwise shows read-only `ObservationDetail`

### `[id]/edit/page.tsx` — Edit Page

RSC page that:
1. Fetches observation (must be `draft` or user is admin)
2. Fetches categories with criteria
3. Renders `ObservationForm` pre-populated with existing data

### `layout.tsx`

Standard layout with `ListLayout` wrapping:
```typescript
<ListLayout
  path="/appraisals/teaching-observations"
  getData={getObservations}
  // ...
>
  {children}
</ListLayout>
```

---

## Notifications

### On Submit (Observer → Lecturer)

When an observer submits an observation:
- Create in-app notification for the observed lecturer
- Notification text: "Your teaching has been observed for [Module Code]. Please review and acknowledge."
- Link: `/appraisals/teaching-observations/[id]`

### On Acknowledge (Lecturer → Observer)

When a lecturer acknowledges:
- Create in-app notification for the observer
- Notification text: "[Lecturer Name] has acknowledged the observation for [Module Code]."
- Link: `/appraisals/teaching-observations/[id]`

### Implementation

Use whatever notification system the codebase already has. If none exists, this can be deferred to a later phase and the workflow still functions without notifications (lecturers manually check their observations list).

---

## Zod Validation (`_lib/types.ts`)

```typescript
import { z } from 'zod/v4';

export const observationFormSchema = z.object({
  cycleId: z.string().min(1),
  assignedModuleId: z.number().int().positive(),
  ratings: z.array(z.object({
    criterionId: z.string().min(1),
    rating: z.number().int().min(1).max(5).nullable(),
  })),
  strengths: z.string().nullable(),
  improvements: z.string().nullable(),
  recommendations: z.string().nullable(),
  trainingArea: z.string().nullable(),
});

export const submitObservationSchema = observationFormSchema.extend({
  ratings: z.array(z.object({
    criterionId: z.string().min(1),
    rating: z.number().int().min(1).max(5),  // required for submit
  })),
  strengths: z.string().min(1),       // required for submit
  improvements: z.string().min(1),    // required for submit
});

export const acknowledgeSchema = z.object({
  comment: z.string().nullable(),
});
```
