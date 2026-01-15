# Timetable Slot Allocation System

## Overview

Build an automated timetable slot allocation system that assigns time slots to timetable allocations using an optimal constraint-based algorithm. The system must handle complex scheduling constraints while maximizing resource utilization and fairness.

---

## Core Concepts

### Slot
A **slot** represents a scheduled time block on the timetable. Each slot contains:
- **Venue**: The physical location where the class takes place
- **Day of Week**: The day the slot occurs (Monday-Friday)
- **Start Time & End Time**: The time boundaries of the slot
- **Allocations**: One or more `timetableAllocations` assigned to this slot

### Timetable Allocation
A **timetable allocation** represents a teaching assignment that needs to be scheduled. It includes:
- **Lecturer** (user): The person teaching the class
- **Semester Module**: The module being taught to a specific student class
- **Duration**: How long the class runs (variable, e.g., 60min, 90min, 120min, 180min)
- **Class Type**: The type of session (e.g., `lecture`, `tutorial`, `lab`)
- **Allowed Days**: Days when this allocation can be scheduled
- **Time Window**: `startTime` (earliest start) and `endTime` (latest end)
- **Number of Students**: Expected class size for venue capacity matching
- **Venue Types**: Optional restrictions on venue types (e.g., lab, lecture hall)

### Student Class
A **student class** is a cohort of students enrolled in the same program and semester. 

**Identification**: All `timetableAllocations` whose `semesterModules` share the same `semesterId` belong to the same student class.

**Naming Convention**: Use `getStudentClassName(structureSemester)` from `@/shared/lib/utils/utils` to generate the class identifier. Format: `[ProgramCode][YearSemester]` (e.g., `DITY1S1` = Diploma in IT, Year 1, Semester 1).

---

## Constraints (Priority Order)

### 1. Hard Constraints (Must Never Be Violated)

#### 1.1 Venue Exclusivity
A venue can only have **one slot at a time**, with one exception:

**Venue Sharing Rule**: A venue MAY share a time slot if and only if ALL of the following conditions are met:
- Same lecturer (userId)
- Same module (matching module code)
- Same class type

> **Note**: A lecturer **CANNOT** have overlapping slots in **different venues** - they can only be in one place at a time. However, they CAN have the same slot in the SAME venue if teaching multiple groups of the same module.

#### 1.2 Lecturer Conflict Prevention
- A lecturer **CANNOT** have overlapping slots of **different modules** (different module codes)
- A lecturer **CANNOT** have overlapping slots of the same module if the **class types are different** (e.g., cannot have a `lecture` and `tutorial` of the same module at the same time)
- A lecturer **CAN** have overlapping slots of the same module if the class types are **the same** (enables venue sharing for split groups)

#### 1.3 Student Class Conflict Prevention
A student class **CANNOT** have more than one slot at the same time. Students cannot attend two different modules simultaneously.

#### 1.4 School-Based Venue Access
A `timetableAllocation` can **ONLY** be assigned to a venue that belongs to the **same school** as the lecturer (user). Use:
- `userSchools` table to find lecturer's schools
- `venueSchools` table to find venue's schools
- Match where at least one school is common

#### 1.5 Venue Type Requirements
If a `timetableAllocation` specifies venue types (via `timetableAllocationVenueTypes`), the slot **MUST** be in a venue of one of those types. If no venue type is specified, any venue type is acceptable.

#### 1.6 Time Window Compliance
Each allocation must be scheduled within its specified time window:
- Slot start time ≥ allocation's `startTime`
- Slot end time ≤ allocation's `endTime`
- Slot must fit entirely within allowed days (`allowedDays` array)

#### 1.7 Venue Capacity
The assigned venue must accommodate the expected number of students:
- Venue capacity ≥ `numberOfStudents`
- **Exception**: Allow up to **10% overflow** (e.g., 55 students in a 50-capacity venue is acceptable; 56 is not)

### 2. Soft Constraints (Prefer, But May Violate When Necessary)

#### 2.1 Consecutive Slots Limit
Avoid scheduling **3 or more immediately consecutive slots** for:
- A single lecturer
- A single student class

**Definition**: Consecutive means back-to-back with no gap (e.g., 08:00-09:00, 09:00-10:00, 10:00-11:00 are 3 consecutive slots).

**Acceptable**: 08:00-09:00, 09:00-10:00, 11:00-12:00 (gap between 2nd and 3rd).

**Relaxation**: This constraint MAY be violated if no other valid placement exists.

#### 2.2 Maximum Slots Per Day
Limit the number of slots per day for both lecturers and student classes based on `maxSlotsPerDay` configuration value.

**Relaxation**: This constraint MAY be violated only if it is **absolutely impossible** to find another valid slot.

---

## Algorithm Requirements

### Slot Time Alignment
Slots must start at times consistent with the configuration:
- Use `startTime`, `endTime`, and `duration` from configuration
- Example: If `startTime` = 08:30, `endTime` = 17:30, `duration` = 3 hours
  - Valid start times: 08:30, 11:30, 14:30

### Randomization & Distribution
**DO NOT** cluster all slots in the morning. The algorithm must:
- Distribute slots **randomly** across valid time slots and days
- Prefer **even distribution** across different days/times to avoid clustering
- Ensure variety in scheduling (not always picking the earliest available slot)

### Venue Selection Strategy
When multiple venues are valid for an allocation:
1. **Filter** by school access, capacity, and venue type
2. **Prefer best-fit**: Choose the smallest venue that fits (with ≤10% overflow)
3. Among equal best-fits, randomize selection

### Venue Sharing Prioritization
Since resources are limited, **prioritize combining allocations** into shared slots when:
- Same lecturer
- Same module (by module code)
- Same class type
- Combined capacity still fits venue (with ≤10% overflow)

### Dynamic Reallocation
When a new `timetableAllocation` is created:
1. Attempt to place it without moving existing slots
2. If no valid placement exists, **recalculate and adjust** existing slots
3. Reallocation must **NOT violate** any allocation's original constraints
4. Use backtracking to find valid configurations

### Constraint Relaxation Order
When no valid placement exists with all constraints:
1. First, relax **consecutive slots** constraint
2. Then, relax **maxSlotsPerDay** constraint
3. **Never** relax hard constraints (1.1 - 1.7)

---

## Variable Duration Support

Allocations have **variable durations**:
- One class may be 60 minutes
- Another may be 90 minutes
- Another may be 180 minutes

The algorithm must handle this variability when:
- Finding valid time windows
- Checking for overlaps
- Combining slots (only same duration can share)

---

## Testing Requirements

### Test Coverage
Create comprehensive tests covering:

1. **Basic Allocation**: Single allocation placement
2. **Venue Constraints**: Type requirements, capacity limits, overflow rules
3. **Lecturer Constraints**: Module conflicts, class type conflicts, venue sharing
4. **Student Class Constraints**: No double-booking
5. **Time Constraints**: Window compliance, allowed days
6. **Consecutive Slot Avoidance**: For both lecturers and classes
7. **Max Slots Per Day**: Enforcement and relaxation
8. **School-Based Filtering**: Venue access restrictions
9. **Randomization**: Distribution across times/days
10. **Stress Tests**: High load scenarios (50+, 100+ allocations)
11. **Edge Cases**: Narrow windows, extreme durations, capacity variations
12. **Backtracking**: Complex reallocation scenarios
13. **Constraint Relaxation**: Proper order of relaxation

### Test Philosophy
- **Ruthless**: Tests should stress the algorithm to its limits
- **Comprehensive**: Cover all constraint combinations
- **Realistic**: Include scenarios matching actual university scheduling
- **Edge Cases**: Test boundary conditions thoroughly

---

## Summary of Key Rules

| Rule | Description | Violable? |
|------|-------------|-----------|
| Venue Exclusivity | One slot per venue per time (except sharing) | Never |
| Venue Sharing | Same lecturer + same module code + same class type | Never |
| Lecturer Single Location | Cannot be in different venues simultaneously | Never |
| Module Conflict | Cannot teach different modules simultaneously | Never |
| Class Type Conflict | Cannot have different class types of same module simultaneously | Never |
| Student Class Conflict | Class cannot have multiple slots at same time | Never |
| School Access | Venue must match lecturer's school | Never |
| Venue Type | Must match allocation's required types | Never |
| Time Window | Must fit within startTime-endTime | Never |
| Capacity | ≤110% of venue capacity | Never |
| 3+ Consecutive Slots | Avoid for lecturers and classes | Only if necessary |
| Max Slots Per Day | Limit daily slots | Only if absolutely impossible |
| Best-Fit Venue | Prefer smallest fitting venue | Preference only |
| Distribution | Spread across days/times | Preference only |

---

## Implementation Notes

### Related Tables
- `timetableSlots`: Stores scheduled slots
- `timetableAllocations`: Teaching assignments to schedule
- `timetableAllocationVenueTypes`: Venue type requirements
- `venues`: Physical locations with capacity
- `venueTypes`: Categories of venues
- `venueSchools`: Links venues to schools
- `userSchools`: Links users (lecturers) to schools
- `semesterModules`: Links modules to semesters (defines student classes)
- `modules`: Module definitions with id/code

### Configuration
- `maxSlotsPerDay`: From `src/config/`
- `startTime`, `endTime`, `duration`: Global timetable configuration
