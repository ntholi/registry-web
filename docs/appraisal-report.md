# AI-Powered Appraisal Report — Implementation Plan

## 1. Overview

Modernize the existing Appraisal Reports module (`src/app/appraisals/reports/`) by adding a new **AI Insights** tab that uses Google Gemini to analyze selected appraisal data and generate actionable, high-level summaries. The AI tab surfaces insights as a grid of categorized cards, filtered by auto-generated chip tags derived from the feedback content itself.

### Current State

The appraisal reports page (`src/app/appraisals/reports/page.tsx`) is a client component with three tabs:

| Tab                    | Data Source                                       |
| ---------------------- | ------------------------------------------------- |
| **Overview**           | Combined feedback + observation averages, heatmaps, trends |
| **Student Feedback**   | `feedback_responses` → ratings, comments, distributions    |
| **Teaching Observation**| `observations` / `observation_ratings` → criteria scores  |

Each tab already loads rich data through `AppraisalReportRepository` (2 400+ lines) and is protected by role-based access via `AppraisalReportService`.

### Goal

Add a fourth tab — **AI Insights** — that:

1. Takes the **currently filtered** report data (term, cycle, school, program, module, lecturer).
2. Sends it to Google Gemini for structured analysis.
3. Renders the AI response as a **card grid** with auto-generated **chip filters**.

---

## 2. User Experience

### 2.1 New Tab: "AI Insights"

Appears as the **last tab** in the existing `Tabs` component, gated by `hasFeedbackAccess || hasObservationAccess`.

#### Layout (top → bottom)

```
┌──────────────────────────────────────────────────────────┐
│  [Generate Insights]  button (primary, centered)         │
│  ─ disabled until a term filter is selected              │
│  ─ shows Loader while streaming                          │
├──────────────────────────────────────────────────────────┤
│  Chip filter bar (horizontal, scrollable)                │
│  ┌──────┐ ┌────────────┐ ┌──────────┐ ┌──────────────┐  │
│  │ All  │ │ Strengths  │ │ Concerns │ │ Training     │  │
│  └──────┘ └────────────┘ └──────────┘ └──────────────┘  │
│  ┌────────────────┐ ┌────────────────┐                   │
│  │ Communication  │ │ Assessment ... │  (auto-generated) │
│  └────────────────┘ └────────────────┘                   │
├──────────────────────────────────────────────────────────┤
│  Executive Summary card (full width, highlighted)        │
│  ┌──────────────────────────────────────────────────────┐│
│  │ 📋 Executive Summary                                ││
│  │ A 3-5 sentence overview of the appraisal period ... ││
│  └──────────────────────────────────────────────────────┘│
├──────────────────────────────────────────────────────────┤
│  Insight cards grid (responsive: 1 / 2 / 3 cols)        │
│                                                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐      │
│  │ ✅ Strengths│  │ ⚠️ Concerns │  │ 📈 Trends   │      │
│  │ • item 1    │  │ • item 1    │  │ • item 1    │      │
│  │ • item 2    │  │ • item 2    │  │ • item 2    │      │
│  └─────────────┘  └─────────────┘  └─────────────┘      │
│                                                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐      │
│  │ 🎓 Training │  │ 🏫 School   │  │ 💬 Student  │      │
│  │ Suggestions │  │ Highlights  │  │ Sentiment   │      │
│  │ • item 1    │  │ • item 1    │  │ • item 1    │      │
│  └─────────────┘  └─────────────┘  └─────────────┘      │
│                                                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐      │
│  │ 🔄 Action   │  │ 👨‍🏫 Lecturer│  │ 📊 Category │      │
│  │ Items       │  │ Spotlights  │  │ Insights    │      │
│  │ • item 1    │  │ • item 1    │  │ • item 1    │      │
│  └─────────────┘  └─────────────┘  └─────────────┘      │
└──────────────────────────────────────────────────────────┘
```

### 2.2 Insight Card Categories

Each card has a **category** (used for chip filtering), an **icon**, a **color**, a **title**, and a list of **items** (bullet points with optional lecturer/module references).

| Category             | Icon              | Color  | Description                                                      |
| -------------------- | ----------------- | ------ | ---------------------------------------------------------------- |
| `executive-summary`  | `IconFileText`    | blue   | High-level overview of the entire appraisal period               |
| `strengths`          | `IconThumbUp`     | green  | Top-performing areas, lecturers, and modules                     |
| `concerns`           | `IconAlertTriangle`| red   | Lowest-rated areas, declining trends, critical feedback themes   |
| `training`           | `IconSchool`      | violet | Specific training/workshop recommendations for lecturers         |
| `trends`             | `IconTrendingUp`  | cyan   | Term-over-term changes, improving/declining patterns             |
| `school-highlights`  | `IconBuilding`    | orange | Per-school standout insights and comparisons                     |
| `student-sentiment`  | `IconMoodSmile`   | teal   | Themes from student free-text comments (positive/negative)       |
| `action-items`       | `IconChecklist`   | indigo | Prioritized recommendations for management action                |
| `lecturer-spotlights`| `IconUser`        | grape  | Exceptional or struggling lecturers (anonymized if limited access)|
| `category-insights`  | `IconChartBar`    | yellow | Deep dives per feedback/observation category                     |

### 2.3 Chip Filter Behavior

- **Static chips**: `All`, `Strengths`, `Concerns`, `Training`, `Action Items` — always present.
- **Dynamic chips**: Auto-generated by the AI based on themes found in feedback (e.g., "Communication", "Assessment Methods", "Punctuality", "Course Materials"). These are returned as `tags` in the AI response.
- **Selection**: Single-select. Clicking a chip filters the card grid to only show cards that match the selected tag. `All` resets the filter.
- **Mantine component**: `Chip.Group` with `Chip` from `@mantine/core`, wrapped in `ScrollArea` for horizontal overflow.

---

## 3. Architecture

### 3.1 Data Flow

```
Filter (term, cycle, school, ...) 
  │
  ▼
[Generate Insights] button click
  │
  ▼
Client calls server action: generateAppraisalInsights(filter)
  │
  ▼
Service: appraisalReportService.generateInsights(filter)
  ├─ Permission check (hasFeedbackAccess || hasObservationAccess)
  ├─ Scope filter (own data only for lecturers)
  │
  ▼
Repository: collect raw data for AI context
  ├─ feedbackOverview + categoryAverages + questionBreakdown
  ├─ observationOverview + categoryAverages + criteriaBreakdown
  ├─ lecturerRankings (top & bottom performers)
  ├─ studentComments (sampled, anonymized)
  ├─ trendData (term-over-term)
  └─ schoolComparison
  │
  ▼
AI Layer: buildAppraisalPrompt(collectedData) → Gemini → parse structured output
  │
  ▼
Return AppraisalInsightsResult to client
  │
  ▼
Render card grid + chip filters
```

### 3.2 File Structure (New / Modified Files)

```
src/app/appraisals/reports/
├── _lib/
│   └── types.ts                          # ← MODIFY: add AI insight types
├── _server/
│   ├── actions.ts                        # ← MODIFY: add generateAppraisalInsights action
│   ├── service.ts                        # ← MODIFY: add generateInsights method
│   └── repository.ts                     # ← MODIFY: add collectInsightContext method
├── _components/
│   ├── AIInsightsTab.tsx                 # ← NEW: main tab component
│   ├── InsightCard.tsx                   # ← NEW: individual card component
│   └── InsightChipFilter.tsx            # ← NEW: chip filter bar component
├── page.tsx                              # ← MODIFY: add AI Insights tab
src/core/integrations/ai/
│   └── appraisal.ts                      # ← NEW: Gemini prompt + schema for appraisals
```

---

## 4. Type Definitions

Add to `src/app/appraisals/reports/_lib/types.ts`:

```typescript
interface InsightItem {
  text: string;
  lecturerName?: string;
  moduleName?: string;
  schoolCode?: string;
  rating?: number;
  severity?: 'low' | 'medium' | 'high';
}

interface InsightCard {
  category: InsightCategory;
  title: string;
  items: InsightItem[];
  tags: string[];
}

type InsightCategory =
  | 'executive-summary'
  | 'strengths'
  | 'concerns'
  | 'training'
  | 'trends'
  | 'school-highlights'
  | 'student-sentiment'
  | 'action-items'
  | 'lecturer-spotlights'
  | 'category-insights';

interface AppraisalInsightsResult {
  cards: InsightCard[];
  tags: string[];          // union of all unique tags across cards (for chip filters)
  generatedAt: string;     // ISO timestamp
  filterSummary: string;   // "Term 2025-02, All Schools" — displayed under title
}
```

---

## 5. AI Integration

### 5.1 New File: `src/core/integrations/ai/appraisal.ts`

Uses the existing `@ai-sdk/google` + `ai` SDK pattern (see `documents.ts`).

**Model**: `google('gemini-2.5-flash-preview-05-20')` (or latest available).

**Approach**: Structured output via `generateObject()` with a Zod schema matching `AppraisalInsightsResult`.

### 5.2 Prompt Design

```text
System: You are an academic quality assurance analyst at a university.
Analyze the following appraisal data for the selected period and produce
structured insights. Be specific — reference school codes, module names,
and lecturer names where relevant. Prioritize actionable recommendations.

Data Context:
- Overview: {feedbackAvg, observationAvg, lecturersEvaluated, responseRate}
- Category Averages: [{categoryName, avgRating}]
- Question Breakdown: [{questionText, avgRating, responseCount}]
- Criteria Breakdown: [{criterionText, avgRating, section}]
- Top Lecturers: [{name, school, avgRating}]
- Bottom Lecturers: [{name, school, avgRating}]
- Student Comments (sample): ["{comment}"]
- School Comparison: [{schoolCode, feedbackAvg, observationAvg}]
- Trend Data: [{termCode, feedbackAvg, observationAvg}]

Instructions:
1. Generate an executive summary (3-5 sentences).
2. Identify 3-5 key strengths with supporting data.
3. Identify 3-5 areas of concern with severity levels.
4. Suggest 3-5 specific training programs/workshops.
5. Highlight term-over-term trends.
6. Provide per-school highlights.
7. Summarize student sentiment themes from comments.
8. List 3-5 prioritized action items for management.
9. Spotlight exceptional and struggling lecturers.
10. Provide category-level insights for each feedback/observation category.
11. Auto-generate 5-10 thematic tags based on the content (e.g., "Communication",
    "Assessment", "Punctuality"). Assign relevant tags to each card.

Output MUST conform to the provided JSON schema.
```

### 5.3 Data Collection for AI Context

Add a new repository method `collectInsightContext(filter)` that reuses existing query methods:

```typescript
async collectInsightContext(filter: ReportFilter) {
  const [
    feedbackData,
    observationData,
    overview,
    comments,
  ] = await Promise.all([
    this.getFeedbackReportData(filter),     // existing method
    this.getObservationReportData(filter),  // existing method
    this.getOverviewData(filter),           // existing method
    this.sampleStudentComments(filter, 50), // NEW: random sample of 50 comments
  ]);

  return {
    feedbackOverview: feedbackData.overview,
    feedbackCategories: feedbackData.categoryAverages,
    feedbackQuestions: feedbackData.questionBreakdown,
    observationOverview: observationData.overview,
    observationCategories: observationData.categoryAverages,
    observationCriteria: observationData.criteriaBreakdown,
    topLecturers: overview.lecturerRankings.slice(0, 10),
    bottomLecturers: overview.lecturerRankings.slice(-10).reverse(),
    schoolComparison: overview.schoolComparison,
    trendData: overview.trendData,
    comments,
  };
}
```

### 5.4 Comment Sampling

New repository method: `sampleStudentComments(filter, limit)` — selects up to `limit` non-empty comments from `feedback_responses` matching the filter, ordered by `random()`. Comments are anonymized (no student identifiers).

---

## 6. UI Components

### 6.1 `AIInsightsTab.tsx`

```
Props: { filter: ReportFilter }

State:
  - insights: AppraisalInsightsResult | null
  - activeTag: string | null ('All' = null)
  - isGenerating: boolean

Behavior:
  - On "Generate Insights" click → call generateAppraisalInsights(filter)
  - Store result in state (NOT in React Query — regeneration is intentional)
  - Filter cards by activeTag
  - Show generation timestamp + filter summary
```

**Mantine components used**: `Button`, `Chip`, `Chip.Group`, `ScrollArea`, `Grid`, `Card`, `Text`, `Badge`, `Stack`, `Group`, `ThemeIcon`, `Loader`, `Alert`.

### 6.2 `InsightCard.tsx`

```
Props: { card: InsightCard }

Layout:
  ┌─────────────────────────────┐
  │ [Icon] Title        [Badge] │  ← category icon + severity/tag badge
  │─────────────────────────────│
  │ • Item text                 │
  │   └ Lecturer: Name (FICT)  │  ← optional metadata line
  │ • Item text                 │
  │ • Item text                 │
  │─────────────────────────────│
  │ tag1  tag2  tag3            │  ← small chip/badge tags
  └─────────────────────────────┘
```

**Mantine components**: `Card`, `Text`, `List`, `Badge`, `Group`, `ThemeIcon`, `Stack`.

### 6.3 `InsightChipFilter.tsx`

```
Props: {
  tags: string[];
  activeTag: string | null;
  onChange: (tag: string | null) => void;
}

Layout:
  ScrollArea horizontal:
    [All] [Strengths] [Concerns] [Training] [Action Items] | [Tag1] [Tag2] ...
                                                              ↑ auto-generated
```

**Mantine components**: `Chip`, `Chip.Group`, `ScrollArea`, `Divider`.

---

## 7. Server-Side Changes

### 7.1 Repository Changes (`repository.ts`)

| Method                       | Type   | Description                              |
| ---------------------------- | ------ | ---------------------------------------- |
| `collectInsightContext(filter)` | NEW  | Aggregates all data needed for AI prompt |
| `sampleStudentComments(filter, limit)` | NEW | Random sample of anonymized comments |

### 7.2 Service Changes (`service.ts`)

| Method                       | Type   | Description                               |
| ---------------------------- | ------ | ----------------------------------------- |
| `generateInsights(filter)`   | NEW    | Permission check → collect data → call AI |

Permission: `hasFeedbackAccess || hasObservationAccess` (same as tab visibility).

### 7.3 Action Changes (`actions.ts`)

| Action                                   | Type | Description                          |
| ---------------------------------------- | ---- | ------------------------------------ |
| `generateAppraisalInsights(filter)`      | NEW  | `'use server'` wrapper for service   |

This is a **query** (not a mutation), so it stays as a plain `async function` export — no `createAction` wrapping needed.

---

## 8. Implementation Steps

### Phase 1: Types & AI Layer

- [ ] **Step 1.1**: Add `InsightItem`, `InsightCard`, `InsightCategory`, `AppraisalInsightsResult` types to `_lib/types.ts`
- [ ] **Step 1.2**: Create `src/core/integrations/ai/appraisal.ts` with Gemini prompt, Zod output schema, and `generateAppraisalInsights()` function
- [ ] **Step 1.3**: Add `sampleStudentComments()` method to repository
- [ ] **Step 1.4**: Add `collectInsightContext()` method to repository

### Phase 2: Server Layer

- [ ] **Step 2.1**: Add `generateInsights(filter)` method to service with permission checks
- [ ] **Step 2.2**: Add `generateAppraisalInsights(filter)` server action to actions.ts

### Phase 3: UI Components

- [ ] **Step 3.1**: Create `InsightCard.tsx` component
- [ ] **Step 3.2**: Create `InsightChipFilter.tsx` component
- [ ] **Step 3.3**: Create `AIInsightsTab.tsx` component (composes InsightCard + InsightChipFilter)
- [ ] **Step 3.4**: Modify `page.tsx` to add the "AI Insights" tab

### Phase 4: Polish & Edge Cases

- [ ] **Step 4.1**: Handle empty data (no feedback/observations for selected filters)
- [ ] **Step 4.2**: Handle AI errors gracefully (show Alert with retry button)
- [ ] **Step 4.3**: Add loading skeleton while generating (show placeholder cards with `Skeleton`)
- [ ] **Step 4.4**: Anonymize lecturer names when user has limited access (own results only)
- [ ] **Step 4.5**: Truncate/limit AI input to stay within Gemini token limits (~100k context)

### Phase 5: Validation

- [ ] **Step 5.1**: Run `pnpm tsc --noEmit` — fix type errors
- [ ] **Step 5.2**: Run `pnpm lint:fix` — fix lint issues
- [ ] **Step 5.3**: Manual testing with different filter combinations

---

## 9. Performance Considerations

| Concern                          | Mitigation                                                   |
| -------------------------------- | ------------------------------------------------------------ |
| AI generation latency (5-15s)    | Show Loader + progress text; do NOT block other tabs         |
| Duplicate DB queries             | `collectInsightContext` reuses existing repo methods in `Promise.all` |
| Large comment volume             | `sampleStudentComments` limits to 50 random comments         |
| Gemini token limits              | Truncate lecturer rankings to top/bottom 10; cap comments at 50 |
| Re-generation on filter change   | Do NOT auto-regenerate; require explicit button click         |
| Cost                             | Cache result in component state; user must click to regenerate |

---

## 10. Access Control

| User Role         | AI Insights Tab Visible | Data Scope                                |
| ----------------- | ----------------------- | ----------------------------------------- |
| `admin`           | ✅                      | All data, full lecturer names              |
| `human_resource`  | ✅                      | All data, full lecturer names              |
| Lecturer (limited)| ✅                      | Own data only, anonymized peers            |
| No access         | ❌                      | Tab hidden                                 |

When a lecturer with limited access generates insights, the AI context is scoped to their own data via `scopeFilter()`. The prompt instructs the AI to focus on personal improvement areas.

---

## 11. Future Enhancements (Out of Scope)

- **PDF Export**: Export AI insights as a formatted PDF report alongside the existing charts.
- **Historical Comparison**: "Compare with previous term" toggle that adds prior term data to the AI context.
- **Streaming**: Use Vercel AI SDK `streamObject()` for real-time card rendering as the AI generates.
- **Caching**: Server-side cache of generated insights per filter combination (Redis/KV).
- **Feedback Loop**: "Was this insight helpful?" thumbs up/down per card to improve prompt quality.
- **Scheduled Reports**: Auto-generate insights at cycle close and email to department heads.
