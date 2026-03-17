# Part 2: Schema & Permissions

> Database tables, relations, indexes, enums, and permission resources for the Teaching Observation feature.

## Section Enum

The PRL form has three distinct sections. Model this as a Drizzle `pgEnum`:

```typescript
export const observationSection = pgEnum('observation_section', [
  'teaching_observation',
  'assessments',
  'other',
]);
```

## Rating Scale (Reference)

Fixed 1–5, not stored as a table — just a constant for UI and validation:

| Rating | Label |
|--------|-------|
| 1 | Unsatisfactory performance |
| 2 | Performance not fully satisfactory |
| 3 | Satisfactory performance |
| 4 | Above satisfactory performance |
| 5 | Excellent performance |

## Tables

### `observation_categories`

Groups observation criteria into named categories within a section (e.g., "Instructional Delivery" under `teaching_observation`).

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `text` | PK, nanoid | |
| `name` | `text` | NOT NULL | e.g., "Instructional Delivery" |
| `section` | `observation_section` | NOT NULL | Enum: `teaching_observation`, `assessments`, `other` |
| `sort_order` | `integer` | NOT NULL, default 0 | Display ordering within section |
| `created_at` | `timestamp` | default now | |

**Schema file**: `src/app/appraisals/teaching-observations/_schema/observationCategories.ts`

```typescript
import { integer, pgEnum, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { nanoid } from 'nanoid';

export const observationSection = pgEnum('observation_section', [
  'teaching_observation',
  'assessments',
  'other',
]);

export const observationCategories = pgTable('observation_categories', {
  id: text().primaryKey().$defaultFn(() => nanoid()),
  name: text().notNull(),
  section: observationSection().notNull(),
  sortOrder: integer().notNull().default(0),
  createdAt: timestamp().defaultNow(),
});
```

---

### `observation_criteria`

Individual rateable criteria within a category. Each has a label (the question) and optional guidance text (bullet-point descriptors from the PRL form).

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `text` | PK, nanoid | |
| `category_id` | `text` | FK → `observation_categories.id`, CASCADE, NOT NULL | |
| `text` | `text` | NOT NULL | The question/criterion text |
| `description` | `text` | Nullable | Guidance descriptors for the observer (bullet points) |
| `sort_order` | `integer` | NOT NULL, default 0 | Display ordering within category |
| `created_at` | `timestamp` | default now | |

**Indexes**: `idx_observation_criteria_category_id` on `category_id`

**Schema file**: `src/app/appraisals/teaching-observations/_schema/observationCriteria.ts`

```typescript
import { index, integer, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { nanoid } from 'nanoid';
import { observationCategories } from './observationCategories';

export const observationCriteria = pgTable(
  'observation_criteria',
  {
    id: text().primaryKey().$defaultFn(() => nanoid()),
    categoryId: text()
      .references(() => observationCategories.id, { onDelete: 'cascade' })
      .notNull(),
    text: text().notNull(),
    description: text(),
    sortOrder: integer().notNull().default(0),
    createdAt: timestamp().defaultNow(),
  },
  (table) => ({
    categoryIdIdx: index('idx_observation_criteria_category_id').on(table.categoryId),
  }),
);
```

---

### `observations`

The main observation record. Links an observer to a specific assigned module within a cycle.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `text` | PK, nanoid | |
| `cycle_id` | `text` | FK → `feedback_cycles.id`, NOT NULL | Shared cycle |
| `assigned_module_id` | `integer` | FK → `assigned_modules.id`, NOT NULL | The module being observed |
| `observer_id` | `text` | FK → `user.id`, NOT NULL | Who conducted the observation |
| `status` | `text` (check) | NOT NULL, default `'draft'` | `draft` / `submitted` / `acknowledged` |
| `strengths` | `text` | Nullable | PRL Remarks — strengths identified |
| `improvements` | `text` | Nullable | PRL Remarks — areas for improvement |
| `recommendations` | `text` | Nullable | PRL Remarks — recommendations |
| `training_area` | `text` | Nullable | Identified training area |
| `submitted_at` | `timestamp` | Nullable | When observer submitted |
| `acknowledged_at` | `timestamp` | Nullable | When lecturer acknowledged |
| `acknowledgment_comment` | `text` | Nullable | Lecturer's optional comment on acknowledgment |
| `created_at` | `timestamp` | default now | |
| `updated_at` | `timestamp` | default now | |

**Unique constraint**: `(cycle_id, assigned_module_id)` — one observation per module assignment per cycle  
**Indexes**:
- `idx_observations_cycle_id` on `cycle_id`
- `idx_observations_observer_id` on `observer_id`
- `idx_observations_assigned_module_id` on `assigned_module_id`
- `idx_observations_status` on `status`

**Schema file**: `src/app/appraisals/teaching-observations/_schema/observations.ts`

```typescript
import { assignedModules } from '@academic/assigned-modules/_schema/assignedModules';
import { user } from '@auth/users/_schema/users';
import { index, integer, pgTable, text, timestamp, unique } from 'drizzle-orm/pg-core';
import { nanoid } from 'nanoid';
import { feedbackCycles } from '../../cycles/_schema/feedbackCycles';

export const observations = pgTable(
  'observations',
  {
    id: text().primaryKey().$defaultFn(() => nanoid()),
    cycleId: text()
      .references(() => feedbackCycles.id)
      .notNull(),
    assignedModuleId: integer()
      .references(() => assignedModules.id)
      .notNull(),
    observerId: text()
      .references(() => user.id)
      .notNull(),
    status: text().notNull().default('draft'),
    strengths: text(),
    improvements: text(),
    recommendations: text(),
    trainingArea: text(),
    submittedAt: timestamp(),
    acknowledgedAt: timestamp(),
    acknowledgmentComment: text(),
    createdAt: timestamp().defaultNow(),
    updatedAt: timestamp().defaultNow(),
  },
  (table) => ({
    uniqueCycleModule: unique().on(table.cycleId, table.assignedModuleId),
    cycleIdIdx: index('idx_observations_cycle_id').on(table.cycleId),
    observerIdIdx: index('idx_observations_observer_id').on(table.observerId),
    assignedModuleIdIdx: index('idx_observations_assigned_module_id').on(table.assignedModuleId),
    statusIdx: index('idx_observations_status').on(table.status),
  }),
);
```

---

### `observation_ratings`

Individual criterion ratings within an observation. One row per criterion per observation.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `text` | PK, nanoid | |
| `observation_id` | `text` | FK → `observations.id`, CASCADE DELETE, NOT NULL | |
| `criterion_id` | `text` | FK → `observation_criteria.id`, NOT NULL | |
| `rating` | `integer` | Nullable | 1–5, null if not yet rated |
| `created_at` | `timestamp` | default now | |

**Unique constraint**: `(observation_id, criterion_id)` — one rating per criterion per observation  
**Index**: `idx_observation_ratings_observation_id` on `observation_id`

**Schema file**: `src/app/appraisals/teaching-observations/_schema/observationRatings.ts`

```typescript
import { index, integer, pgTable, text, timestamp, unique } from 'drizzle-orm/pg-core';
import { nanoid } from 'nanoid';
import { observationCriteria } from './observationCriteria';
import { observations } from './observations';

export const observationRatings = pgTable(
  'observation_ratings',
  {
    id: text().primaryKey().$defaultFn(() => nanoid()),
    observationId: text()
      .references(() => observations.id, { onDelete: 'cascade' })
      .notNull(),
    criterionId: text()
      .references(() => observationCriteria.id)
      .notNull(),
    rating: integer(),
    createdAt: timestamp().defaultNow(),
  },
  (table) => ({
    uniqueObsCriterion: unique().on(table.observationId, table.criterionId),
    observationIdIdx: index('idx_observation_ratings_observation_id').on(table.observationId),
  }),
);
```

---

## Relations

**File**: `src/app/appraisals/teaching-observations/_schema/relations.ts`

```typescript
import { assignedModules } from '@academic/assigned-modules/_schema/assignedModules';
import { user } from '@auth/users/_schema/users';
import { relations } from 'drizzle-orm';
import { feedbackCycles } from '../../cycles/_schema/feedbackCycles';
import { observationCategories } from './observationCategories';
import { observationCriteria } from './observationCriteria';
import { observationRatings } from './observationRatings';
import { observations } from './observations';

export const observationCategoriesRelations = relations(
  observationCategories,
  ({ many }) => ({
    criteria: many(observationCriteria),
  }),
);

export const observationCriteriaRelations = relations(
  observationCriteria,
  ({ one, many }) => ({
    category: one(observationCategories, {
      fields: [observationCriteria.categoryId],
      references: [observationCategories.id],
    }),
    ratings: many(observationRatings),
  }),
);

export const observationsRelations = relations(
  observations,
  ({ one, many }) => ({
    cycle: one(feedbackCycles, {
      fields: [observations.cycleId],
      references: [feedbackCycles.id],
    }),
    assignedModule: one(assignedModules, {
      fields: [observations.assignedModuleId],
      references: [assignedModules.id],
    }),
    observer: one(user, {
      fields: [observations.observerId],
      references: [user.id],
    }),
    ratings: many(observationRatings),
  }),
);

export const observationRatingsRelations = relations(
  observationRatings,
  ({ one }) => ({
    observation: one(observations, {
      fields: [observationRatings.observationId],
      references: [observations.id],
    }),
    criterion: one(observationCriteria, {
      fields: [observationRatings.criterionId],
      references: [observationCriteria.id],
    }),
  }),
);
```

## Barrel Export

**Add to `appraisals/_database/index.ts`**:

```typescript
export * from '../teaching-observations/_schema/observationCategories';
export * from '../teaching-observations/_schema/observationCriteria';
export * from '../teaching-observations/_schema/observations';
export * from '../teaching-observations/_schema/observationRatings';
export * from '../teaching-observations/_schema/relations';
```

---

## Permissions

### New Resources (add to permission catalog)

| Resource | Actions | Purpose |
|----------|---------|---------|
| `teaching-observations` | `read`, `create`, `update`, `delete` | CRUD on observation records |
| `teaching-observation-criteria` | `read`, `create`, `update`, `delete` | Manage categories + criteria |
| `teaching-observation-reports` | `read` | View analytics/reports |

### Preset Assignments

| Preset | `teaching-observations` | `teaching-observation-criteria` | `teaching-observation-reports` |
|--------|------------------------|-------------------------------|-------------------------------|
| Academic Manager | read, update | read, create, update, delete | read |
| Academic Program Leader | read, create, update, delete | read | read |
| Academic Year Leader | read | — | — |
| Academic Lecturer | read *(own only)* | — | — |
| Academic Principal Lecturer | read | — | read |
| Academic Admin | read | read, create, update, delete | read |
| HR Manager | read | read, create, update, delete | read |

### Access Scoping Rules

- **Program Leaders**: Can create/edit/delete observations where they are the `observer_id`. Can read all observations in their school.
- **Lecturers**: Can only read observations where `assigned_modules.user_id = session.user.id` (their own teaching assignments). Implemented in the repository/service layer, not at the permission level.
- **Managers / HR / Admin**: Read all observations across schools they have access to.
- **Admin role**: Bypasses all permission checks (standard platform behavior).

### Implementation

In the permission catalog (`src/app/auth/permission-presets/_lib/catalog.ts`):

1. Add `'teaching-observations'`, `'teaching-observation-criteria'`, `'teaching-observation-reports'` to the `Resource` type
2. Add permission grants to each preset definition listed above
3. Update the `resources` array that drives the UI

---

## Migration

After creating all schema files:

```bash
pnpm db:generate
```

This generates the SQL migration with:
- `CREATE TYPE observation_section` enum
- `CREATE TABLE observation_categories`
- `CREATE TABLE observation_criteria` + index
- `CREATE TABLE observations` + unique constraint + 4 indexes
- `CREATE TABLE observation_ratings` + unique constraint + index
