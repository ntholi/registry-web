# Part 3: Criteria Management

> Admin/HR CRUD for observation categories and criteria, plus PRL form seed data.

## Feature Path

```
src/app/appraisals/observation-criteria/
├── _server/
│   ├── repository.ts
│   ├── service.ts
│   └── actions.ts
├── _components/
│   ├── CriteriaManager.tsx
│   ├── CategoryForm.tsx
│   └── CriterionForm.tsx
├── layout.tsx
└── page.tsx
```

## Access

- **Permission**: `teaching-observation-criteria` with `read`, `create`, `update`, `delete`
- **Who manages**: Admin, HR Manager, Academic Admin, Academic Manager
- **Who can read**: Academic Program Leaders (for the observation form)

---

## Repository

`ObservationCriteriaRepository` manages both `observationCategories` and `observationCriteria` tables.

### Key Methods

| Method | Description |
|--------|-------------|
| `getAllCategories()` | All categories ordered by `section`, `sortOrder` |
| `getCategoryById(id)` | Category with its criteria |
| `createCategory(data)` | Insert category |
| `updateCategory(id, data)` | Update category name/section/order |
| `deleteCategory(id)` | Delete category (cascades criteria) |
| `getAllCriteria()` | All criteria with their category, ordered by category section → category sort → criterion sort |
| `getCriteriaByCategory(categoryId)` | Criteria for a specific category |
| `createCriterion(data)` | Insert criterion |
| `updateCriterion(id, data)` | Update criterion text/description/order |
| `deleteCriterion(id)` | Delete criterion |
| `getCategoriesWithCriteria()` | All categories with nested criteria (for the observation form) |
| `reorderCategories(orderedIds)` | Batch update `sortOrder` for categories |
| `reorderCriteria(categoryId, orderedIds)` | Batch update `sortOrder` for criteria within a category |

### `getCategoriesWithCriteria()` — Critical Query

This is the main query used by the observation form. Returns the full hierarchy:

```typescript
async getCategoriesWithCriteria() {
  return db.query.observationCategories.findMany({
    orderBy: [asc(observationCategories.sortOrder)],
    with: {
      criteria: {
        orderBy: [asc(observationCriteria.sortOrder)],
      },
    },
  });
}
```

Result shape (grouped by section in UI):

```typescript
[
  { id, name: "Learning Objectives and Goals", section: "teaching_observation", sortOrder: 0, criteria: [...] },
  { id, name: "Instructional Delivery", section: "teaching_observation", sortOrder: 1, criteria: [...] },
  ...
  { id, name: "Assessments", section: "assessments", sortOrder: 0, criteria: [...] },
  { id, name: "Other", section: "other", sortOrder: 0, criteria: [...] },
]
```

---

## Service

`ObservationCriteriaService` wraps the repository with permission checks.

- All write operations require `{ 'teaching-observation-criteria': ['create'] }` or `['update']` / `['delete']`
- Read operations require `{ 'teaching-observation-criteria': ['read'] }`
- Activity types: `observation_criteria_created`, `observation_criteria_updated`, `observation_criteria_deleted`

---

## Actions

```typescript
'use server';

export async function getCategories()
export async function getCategory(id: string)
export async function getCategoriesWithCriteria()
export const createCategory = createAction(...)
export const updateCategory = createAction(...)
export const deleteCategory = createAction(...)
export async function getCriteria(categoryId: string)
export const createCriterion = createAction(...)
export const updateCriterion = createAction(...)
export const deleteCriterion = createAction(...)
export const reorderCategories = createAction(...)
export const reorderCriteria = createAction(...)
```

---

## UI Components

### `CriteriaManager.tsx` (Main Page Component)

A single-page manager showing all categories grouped by section, with criteria nested under each.

**Layout**:
- Three Mantine `Accordion` sections: "Section 1: Teaching Observation", "Section 2: Assessments", "Section 3: Other"
- Each section expands to show its categories
- Each category is an accordion item showing its criteria as a list
- Inline "Add Category" button per section
- Inline "Add Criterion" button per category
- Edit/delete actions on each category and criterion

**Interactions**:
- Click category name → edit inline or opens `CategoryForm` modal
- Click criterion → edit inline or opens `CriterionForm` modal
- Drag-and-drop reorder for categories and criteria (using Mantine's DragDropContext or simple up/down buttons)

### `CategoryForm.tsx`

Modal form for creating/editing a category.

**Fields**:
- `name` (TextInput, required)
- `section` (Select, required — options: Teaching Observation, Assessments, Other)
- `sortOrder` (NumberInput, required)

### `CriterionForm.tsx`

Modal form for creating/editing a criterion.

**Fields**:
- `text` (TextInput, required) — the criterion/question text
- `description` (Textarea, optional) — guidance text for the observer
- `sortOrder` (NumberInput, required)
- `categoryId` — pre-set from context (hidden or disabled)

---

## Seed Data

Initial categories and criteria from the PRL form. This should be inserted via a seed script or custom migration.

### Section 1: Teaching Observation

**Category: Learning Objectives and Goals** (sortOrder: 0)

| # | Criterion | Description |
|---|-----------|-------------|
| 1 | Clarity: Are the learning objectives clearly stated and communicated to students? | — |
| 2 | Alignment: Do the teaching activities align with the stated objectives? | — |

**Category: Instructional Delivery** (sortOrder: 1)

| # | Criterion | Description |
|---|-----------|-------------|
| 1 | Engagement: Does the lecturer engage students actively through questioning, discussions, or interactive activities? | The lecturer asks open-ended questions; Encourages critical thinking; Provides constructive feedback; Incorporates group activities; Provides positive feedback; Offers positive reinforcement; Encourages peer feedback |
| 2 | Clarity and Organization: Is the content presented in a logical, clear, and organized manner? | Expertly defines complex concepts in simple terms; Lecturer emphasizes and summarizes key points clearly; Uses real world examples to illustrate key points; Speaks confidently, varying pace, tone, and pitch for emphasis; Uses visual aids, props, or integrates technology to enhance clarity and engagement where necessary |
| 3 | Pacing: Is the pace of the lesson appropriate for the students' understanding? | Balanced content coverage: lecturer covers necessary material without rushing or dragging; Clear time allocation: lecturer allocates sufficient time for each activity; Teacher flexibility: teacher adjusts pace in response to student needs or questions; The pace of talk is appropriate, not too fast, and not dragged |

**Category: Teaching Methods and Strategies** (sortOrder: 2)

| # | Criterion | Description |
|---|-----------|-------------|
| 1 | Variety: Are a variety of teaching methods used (e.g., lectures, group work, multimedia, case studies, presentations)? | — |
| 2 | Appropriateness: Are the methods and strategies suitable for the content and the students' learning styles? | Use of questions (open-ended and close ended-questions); Discussions (whole class discussions/small-group discussions/think-pair-share); Visual aids (diagrams/charts/graphs/videos); Hands-on activities (experiments/simulations/role-playing) |

**Category: Student Participation and Interaction** (sortOrder: 3)

| # | Criterion | Description |
|---|-----------|-------------|
| 1 | Inclusivity: Are all students given opportunities to participate? | Lecturer provides regular opportunities for participation with clear expectations; Lecturer acknowledges and values diverse perspectives and uses them constructively; Lecturer uses innovative strategies to engage quiet students |
| 2 | Feedback: How does the lecturer provide feedback during activities or discussions? | Provide constructive feedback; Offers positive reinforcement; Encourages peer feedback; The lecturer checks understanding and effectively uses student mistakes constructively to facilitate learning |

**Category: Classroom Management** (sortOrder: 4)

| # | Criterion | Description |
|---|-----------|-------------|
| 1 | Behavior: How does the lecturer handle disruptions or manage classroom behavior? | The lecturer keeps distractions to a minimum by handling any disruptive students; Students appear engaged in the classroom |

**Category: Use of Resources and Technology** (sortOrder: 5)

| # | Criterion | Description |
|---|-----------|-------------|
| 1 | Integration: How effectively does the lecturer integrate resources and technology into the lesson? | The classroom and learning resources are used effectively (e.g. writing on the whiteboard is clearly set out, presentation slides are clear and appropriate, using of projectors, use of computers) |

**Category: Student Understanding and Learning** (sortOrder: 6)

| # | Criterion | Description |
|---|-----------|-------------|
| 1 | Checking for Understanding: Does the lecturer use methods to check for student understanding throughout the lesson? | The lecturer continually provides time for questions throughout the lecture; The lecturer responds to questions with patience and understanding; The lecturer uses examples and/or illustrations to explain content; Lecturer responds to learners' questions with clarity and conciseness |
| 2 | Adaptability: How does the lecturer adjust their teaching based on student feedback or understanding? | The Lecturer frequently assesses students understanding, and modifies teaching strategies as necessary to increase effectiveness in achieving learning outcomes |

**Category: Professionalism and Attitude** (sortOrder: 7)

| # | Criterion | Description |
|---|-----------|-------------|
| 1 | Enthusiasm: Does the lecturer show enthusiasm and passion for the subject matter? | Maintains eye-contact with students throughout the lessons; Uses expressive voice, appropriate pauses, varying tone and pitch to convey the message and emphasis on important points; Maintains a good posture and a welcoming facial expression; Actively and steadily moves around the room to interact with students |
| 2 | Respect: Is there mutual respect between the lecturer and students? | Uses appropriate language to foster respect for all; Reprimands disrespectful behavior |

### Section 2: Assessments

**Category: Assessments** (sortOrder: 0)

| # | Criterion | Description |
|---|-----------|-------------|
| 1 | Sets appropriate student assessments and issues them on time | — |
| 2 | Analyzes student's progress records, monitors and takes remedial measures | — |
| 3 | Gives students feedback on time | — |

### Section 3: Other

**Category: Other** (sortOrder: 0)

| # | Criterion | Description |
|---|-----------|-------------|
| 1 | Lecturer has complete course files | — |

---

## Navigation

Add to `appraisals.config.ts` under the "Teaching Observation" nav group:

```typescript
{
  label: 'Criteria',
  href: '/appraisals/observation-criteria',
  icon: IconListCheck, // or IconChecklist
  permissions: [
    { resource: 'teaching-observation-criteria', action: 'read' },
  ],
}
```
