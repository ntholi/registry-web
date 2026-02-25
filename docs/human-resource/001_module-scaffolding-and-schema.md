# Part 1: Module Scaffolding, Schema & Backend

## Overview

Set up the Human Resource module infrastructure: database schema, role integration, repository/service/actions layers, module configuration, and dashboard navigation.

---

## 1.1 — Add `human_resource` Role

### Files to modify

| File | Change |
|------|--------|
| `src/app/auth/users/_schema/users.ts` | Add `'human_resource'` to `userRoles` and `dashboardUsers` enums |

### Migration

After editing the schema, run:

```bash
pnpm db:generate
```

This generates a migration that adds `'human_resource'` to both the `user_roles` and `dashboard_users` PostgreSQL enums.

### Details

**`src/app/auth/users/_schema/users.ts`**

Add `'human_resource'` to the `dashboardUsers` enum array:
```typescript
export const dashboardUsers = pgEnum('dashboard_users', [
  'finance',
  'registry',
  'library',
  'resource',
  'academic',
  'marketing',
  'student_services',
  'admin',
  'leap',
  'human_resource',  // ← ADD
]);
```

Add `'human_resource'` to the `userRoles` enum array:
```typescript
export const userRoles = pgEnum('user_roles', [
  'user',
  'applicant',
  'student',
  'finance',
  'registry',
  'library',
  'resource',
  'academic',
  'marketing',
  'student_services',
  'admin',
  'leap',
  'human_resource',  // ← ADD
]);
```

**Important**: The `UserRole` type is derived automatically: `export type UserRole = (typeof userRoles.enumValues)[number];` — no additional change needed.

---

## 1.2 — Path Alias

### Files to modify

| File | Change |
|------|--------|
| `tsconfig.json` | Add `@human-resource/*` alias |

### Details

Add to `compilerOptions.paths`:
```json
"@human-resource/*": ["./src/app/human-resource/*"]
```

---

## 1.3 — Employees Schema

### Files to create

| File | Purpose |
|------|---------|
| `src/app/human-resource/employees/_schema/employees.ts` | Employee table definition |
| `src/app/human-resource/employees/_schema/types.ts` | Employee-related enums |
| `src/app/human-resource/employees/_schema/relations.ts` | Drizzle ORM relations |
| `src/app/human-resource/_database/index.ts` | Barrel export for HR schemas |

### Table: `employees`

```
employees
├── empNo       TEXT       PK     (e.g., "LUCT456")
├── name        TEXT       NOT NULL
├── status      employee_status   NOT NULL DEFAULT 'Active'
├── type        employee_type     NOT NULL
├── schoolId    INTEGER    FK → schools.id  (nullable, for department/faculty)
├── userId      TEXT       FK → users.id    (nullable, ON DELETE SET NULL)
├── createdAt   TIMESTAMP  DEFAULT NOW()
```

### Schema Details

**`src/app/human-resource/employees/_schema/types.ts`**

```typescript
import { pgEnum } from 'drizzle-orm/pg-core';

export const employeeStatus = pgEnum('employee_status', [
  'Active',
  'Suspended',
  'Terminated',
  'Resigned',
  'Retired',
  'Deceased',
  'On Leave',
]);

export const employeeType = pgEnum('employee_type', [
  'Full-time',
  'Part-time',
  'Contract',
  'Intern',
]);
```

**`src/app/human-resource/employees/_schema/employees.ts`**

```typescript
import { schools } from '@academic/schools/_schema/schools';
import { users } from '@auth/users/_schema/users';
import { sql } from 'drizzle-orm';
import { index, integer, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { employeeStatus, employeeType } from './types';

export const employees = pgTable(
  'employees',
  {
    empNo: text().primaryKey(),
    name: text().notNull(),
    status: employeeStatus().notNull().default('Active'),
    type: employeeType().notNull(),
    schoolId: integer().references(() => schools.id, { onDelete: 'set null' }),
    userId: text().references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp().defaultNow(),
  },
  (table) => ({
    nameTrigramIdx: index('idx_employees_name_trgm').using(
      'gin',
      sql`${table.name} gin_trgm_ops`
    ),
    userIdIdx: index('fk_employees_user_id').on(table.userId),
    schoolIdIdx: index('fk_employees_school_id').on(table.schoolId),
  })
);
```

**`src/app/human-resource/employees/_schema/relations.ts`**

```typescript
import { schools } from '@academic/schools/_schema/schools';
import { users } from '@auth/users/_schema/users';
import { relations } from 'drizzle-orm';
import { employeeCardPrints } from '@human-resource/print/_schema/employeeCardPrints';
import { employees } from './employees';

export const employeesRelations = relations(employees, ({ one, many }) => ({
  user: one(users, {
    fields: [employees.userId],
    references: [users.id],
  }),
  school: one(schools, {
    fields: [employees.schoolId],
    references: [schools.id],
  }),
  employeeCardPrints: many(employeeCardPrints),
}));
```

> **Note**: The `employeeCardPrints` relation references a table defined in Part 2. When implementing Part 1 first, temporarily omit this relation and add it in Part 2.

**`src/app/human-resource/_database/index.ts`**

```typescript
export { employees } from '@human-resource/employees/_schema/employees';
export { employeeStatus, employeeType } from '@human-resource/employees/_schema/types';
```

### Register in Core Database

**`src/core/database/index.ts`** — Add the new schema imports to the aggregated schemas barrel file so Drizzle can discover them.

### Migration

After creating all schema files and registering them:

```bash
pnpm db:generate
```

---

## 1.4 — Employee Card Prints Schema

### Files to create

| File | Purpose |
|------|---------|
| `src/app/human-resource/print/_schema/employeeCardPrints.ts` | Print history table |
| `src/app/human-resource/print/_schema/relations.ts` | Relations for prints |

### Table: `employee_card_prints`

```
employee_card_prints
├── id          SERIAL     PK
├── empNo       TEXT       FK → employees.empNo  NOT NULL
├── printedBy   TEXT       FK → users.id          NOT NULL
├── receiptNo   TEXT       NOT NULL
├── createdAt   TIMESTAMP  DEFAULT NOW()
```

### Schema Details

**`src/app/human-resource/print/_schema/employeeCardPrints.ts`**

```typescript
import { users } from '@auth/users/_schema/users';
import { pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';
import { employees } from '@human-resource/employees/_schema/employees';

export const employeeCardPrints = pgTable('employee_card_prints', {
  id: serial().primaryKey(),
  empNo: text()
    .references(() => employees.empNo, { onDelete: 'cascade' })
    .notNull(),
  printedBy: text()
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  receiptNo: text().notNull(),
  createdAt: timestamp().defaultNow(),
});
```

**`src/app/human-resource/print/_schema/relations.ts`**

```typescript
import { users } from '@auth/users/_schema/users';
import { relations } from 'drizzle-orm';
import { employees } from '@human-resource/employees/_schema/employees';
import { employeeCardPrints } from './employeeCardPrints';

export const employeeCardPrintsRelations = relations(
  employeeCardPrints,
  ({ one }) => ({
    employee: one(employees, {
      fields: [employeeCardPrints.empNo],
      references: [employees.empNo],
    }),
    printedByUser: one(users, {
      fields: [employeeCardPrints.printedBy],
      references: [users.id],
    }),
  })
);
```

Add exports to `src/app/human-resource/_database/index.ts`:

```typescript
export { employeeCardPrints } from '@human-resource/print/_schema/employeeCardPrints';
```

---

## 1.5 — Repository Layer

### Files to create

| File | Purpose |
|------|---------|
| `src/app/human-resource/employees/_server/repository.ts` | Employee database access |

### Details

```typescript
import { eq } from 'drizzle-orm';
import { db, employees } from '@/core/database';
import BaseRepository from '@/core/platform/BaseRepository';

export default class EmployeeRepository extends BaseRepository<
  typeof employees,
  'empNo'
> {
  constructor() {
    super(employees, employees.empNo);
  }

  async findByEmpNo(empNo: string) {
    return db.query.employees.findFirst({
      where: eq(employees.empNo, empNo),
      with: {
        user: true,
        school: true,
      },
    });
  }
}
```

### Employee Card Print Repository

| File | Purpose |
|------|---------|
| `src/app/human-resource/print/_server/repository.ts` | Print history database access |

```typescript
import { eq, desc } from 'drizzle-orm';
import { db, employeeCardPrints } from '@/core/database';
import BaseRepository from '@/core/platform/BaseRepository';

export default class EmployeeCardPrintRepository extends BaseRepository<
  typeof employeeCardPrints,
  'id'
> {
  constructor() {
    super(employeeCardPrints, employeeCardPrints.id);
  }

  async findByEmpNo(empNo: string) {
    return db.query.employeeCardPrints.findMany({
      where: eq(employeeCardPrints.empNo, empNo),
      orderBy: [desc(employeeCardPrints.createdAt)],
      with: {
        printedByUser: {
          columns: { id: true, name: true },
        },
      },
    });
  }
}
```

---

## 1.6 — Service Layer

### Files to create

| File | Purpose |
|------|---------|
| `src/app/human-resource/employees/_server/service.ts` | Employee business logic + auth |

### Details

Follow the `BaseService` pattern. The service wraps the repository with role-based authorization.

```typescript
import type { employees } from '@/core/database';
import BaseService from '@/core/platform/BaseService';
import { serviceWrapper } from '@/core/platform/serviceWrapper';
import EmployeeRepository from './repository';

type Employee = typeof employees.$inferInsert;

class EmployeeService extends BaseService<typeof employees, 'empNo'> {
  private repo: EmployeeRepository;

  constructor() {
    const repository = new EmployeeRepository();
    super(repository, {
      byIdRoles: ['human_resource', 'admin'],
      findAllRoles: ['human_resource', 'admin'],
      createRoles: ['human_resource', 'admin'],
      updateRoles: ['human_resource', 'admin'],
      deleteRoles: ['admin'],
    });
    this.repo = repository;
  }
}

export const employeesService = serviceWrapper(new EmployeeService());
```

### Employee Card Print Service

| File | Purpose |
|------|---------|
| `src/app/human-resource/print/_server/service.ts` | Print business logic |

```typescript
import { serviceWrapper } from '@/core/platform/serviceWrapper';
import withAuth, { requireSessionUserId } from '@/core/platform/withAuth';
import EmployeeCardPrintRepository from './repository';

class EmployeeCardPrintService {
  private repository: EmployeeCardPrintRepository;

  constructor() {
    this.repository = new EmployeeCardPrintRepository();
  }

  async findByEmpNo(empNo: string) {
    return withAuth(
      async () => this.repository.findByEmpNo(empNo),
      ['human_resource', 'admin']
    );
  }

  async create(data: { empNo: string; printedBy: string; receiptNo: string }) {
    return withAuth(
      async () => this.repository.create(data),
      ['human_resource', 'admin']
    );
  }
}

export const employeeCardPrintService = serviceWrapper(
  new EmployeeCardPrintService()
);
```

---

## 1.7 — Server Actions

### Files to create

| File | Purpose |
|------|---------|
| `src/app/human-resource/employees/_server/actions.ts` | Employee server actions |
| `src/app/human-resource/print/_server/actions.ts` | Print server actions |

### Employee Actions

```typescript
'use server';

import type { employees } from '@/core/database';
import { employeesService as service } from './service';

type Employee = typeof employees.$inferInsert;

export async function getEmployee(empNo: string) {
  return service.get(empNo);
}

export async function findAllEmployees(page: number = 1, search = '') {
  return service.findAll({
    page,
    search,
    searchColumns: ['empNo', 'name'],
  });
}

export async function createEmployee(employee: Employee) {
  return service.create(employee);
}

export async function updateEmployee(empNo: string, employee: Employee) {
  return service.update(empNo, employee);
}

export async function deleteEmployee(empNo: string) {
  return service.delete(empNo);
}

export async function getEmployeePhoto(
  empNo: string | undefined | null
): Promise<string | null> {
  if (!empNo) return null;
  try {
    const extensions = ['jpg', 'jpeg', 'png', 'webp'];

    for (const ext of extensions) {
      const fileName = `${empNo}.${ext}`;
      const url = `https://pub-2b37ce26bd70421e9e59e4fe805c6873.r2.dev/photos/employees/${fileName}`;

      try {
        const response = await fetch(url, {
          method: 'HEAD',
          cache: 'no-store',
          next: { revalidate: 0 },
        });
        if (response.ok) {
          const etag = response.headers.get('etag')?.replace(/"/g, '') || '';
          const lastModified = response.headers.get('last-modified') || '';
          const versionSource = etag || lastModified || Date.now().toString();
          return `${url}?v=${encodeURIComponent(versionSource)}`;
        }
      } catch (error) {
        console.error('Error:', error);
      }
    }

    return null;
  } catch (error) {
    console.error('Error checking employee photo:', error);
    return null;
  }
}
```

### Print Actions

```typescript
'use server';

import { employeeCardPrintService as service } from './service';

export async function getEmployeeCardPrints(empNo: string) {
  return service.findByEmpNo(empNo);
}

export async function createEmployeeCardPrint(data: {
  empNo: string;
  printedBy: string;
  receiptNo: string;
}) {
  return service.create(data);
}
```

---

## 1.8 — Barrel Exports

### Files to create

| File | Purpose |
|------|---------|
| `src/app/human-resource/employees/index.ts` | Re-exports for employees feature |
| `src/app/human-resource/print/index.ts` | Re-exports for print feature |

**`employees/index.ts`**

```typescript
export { findAllEmployees, getEmployee, getEmployeePhoto } from './_server/actions';
```

**`print/index.ts`**

```typescript
export { getEmployeeCardPrints, createEmployeeCardPrint } from './_server/actions';
```

---

## 1.9 — Module Configuration & Navigation

### Files to create

| File | Purpose |
|------|---------|
| `src/app/human-resource/human-resource.config.ts` | Module config with nav items |

### Details

```typescript
import { IconId, IconUsers } from '@tabler/icons-react';
import type { ModuleConfig } from '@/app/dashboard/module-config.types';

export const humanResourceConfig: ModuleConfig = {
  id: 'human-resource',
  name: 'Human Resource',
  version: '1.0.0',
  category: 'core',
  navigation: {
    dashboard: [
      {
        label: 'Employees',
        href: '/human-resource/employees',
        icon: IconUsers,
        roles: ['human_resource', 'admin'],
      },
    ],
  },
  flags: {
    enabled: true,
    beta: false,
  },
};
```

### Files to modify

| File | Change |
|------|--------|
| `src/config/modules.config.ts` | Add `'human-resource'` module key |
| `src/app/dashboard/dashboard.tsx` | Import and register `humanResourceConfig` |

**`src/config/modules.config.ts`**

Add `'human-resource'` to `ModuleKey` union type, add env key mapping, and add to the `moduleConfig` object:

```typescript
export type ModuleKey =
  | 'academic'
  | 'admin'
  | 'admissions'
  | 'lms'
  | 'finance'
  | 'registry'
  | 'reports'
  | 'timetable'
  | 'student-portal'
  | 'audit-logs'
  | 'library'
  | 'human-resource';  // ← ADD
```

Add to `moduleEnvKeys`:
```typescript
'human-resource': 'ENABLE_MODULE_HUMAN_RESOURCE',
```

Add to `moduleConfig` and `getModuleConfig()`:
```typescript
humanResource: isModuleEnabled('human-resource'),
```

**`src/app/dashboard/dashboard.tsx`**

Import the config:
```typescript
import { humanResourceConfig } from '@/app/human-resource/human-resource.config';
```

Add to `allConfigs` array in `getNavigation()`:
```typescript
{ config: humanResourceConfig, enabled: moduleConfig.humanResource },
```

---

## 1.10 — Layout

### Files to create

| File | Purpose |
|------|---------|
| `src/app/human-resource/employees/layout.tsx` | List layout for employees |
| `src/app/human-resource/employees/page.tsx` | Empty state (NothingSelected) |

### Layout

The layout mirrors the student layout: a `ListLayout` with search showing employee name and number.

```tsx
'use client';

import { findAllEmployees } from '@human-resource/employees';
import type { PropsWithChildren } from 'react';
import { ListItem, ListLayout } from '@/shared/ui/adease';

export default function Layout({ children }: PropsWithChildren) {
  return (
    <ListLayout
      path='/human-resource/employees'
      queryKey={['employees']}
      getData={(page, search) => findAllEmployees(page, search)}
      renderItem={(it) => (
        <ListItem id={it.empNo} label={it.name} description={it.empNo} />
      )}
    >
      {children}
    </ListLayout>
  );
}
```

### Page (empty state)

```tsx
import { NothingSelected } from '@/shared/ui/adease';

export default function Page() {
  return <NothingSelected title='Employees' />;
}
```

---

## Part 1 Verification Checklist

- [ ] `human_resource` added to `userRoles` and `dashboardUsers` enums
- [ ] `@human-resource/*` path alias in `tsconfig.json`
- [ ] `employees` table schema created with text PK (`empNo`)
- [ ] `employee_card_prints` table schema created
- [ ] Relations defined for both tables
- [ ] Schemas registered in `src/core/database`
- [ ] Migration generated via `pnpm db:generate`
- [ ] Repository, Service, Actions layers created for employees
- [ ] Repository, Service, Actions layers created for prints
- [ ] Module config created with navigation
- [ ] Dashboard integration (module config + navigation)
- [ ] Layout with ListLayout and empty state page
- [ ] Run `pnpm tsc --noEmit && pnpm lint:fix` — clean
- [ ] Run migration against database

---

## File Summary

### New Files (Part 1)

| File | Purpose |
|------|---------|
| `src/app/human-resource/employees/_schema/types.ts` | Employee enums |
| `src/app/human-resource/employees/_schema/employees.ts` | Employee table |
| `src/app/human-resource/employees/_schema/relations.ts` | Employee relations |
| `src/app/human-resource/_database/index.ts` | HR barrel export |
| `src/app/human-resource/print/_schema/employeeCardPrints.ts` | Print history table |
| `src/app/human-resource/print/_schema/relations.ts` | Print relations |
| `src/app/human-resource/employees/_server/repository.ts` | Employee repository |
| `src/app/human-resource/employees/_server/service.ts` | Employee service |
| `src/app/human-resource/employees/_server/actions.ts` | Employee server actions |
| `src/app/human-resource/print/_server/repository.ts` | Print repository |
| `src/app/human-resource/print/_server/service.ts` | Print service |
| `src/app/human-resource/print/_server/actions.ts` | Print server actions |
| `src/app/human-resource/employees/index.ts` | Barrel export |
| `src/app/human-resource/print/index.ts` | Barrel export |
| `src/app/human-resource/human-resource.config.ts` | Module config |
| `src/app/human-resource/employees/layout.tsx` | List layout |
| `src/app/human-resource/employees/page.tsx` | Empty state |

### Modified Files (Part 1)

| File | Change |
|------|--------|
| `tsconfig.json` | Add `@human-resource/*` path alias |
| `src/app/auth/users/_schema/users.ts` | Add `human_resource` to role enums |
| `src/core/database/index.ts` | Register HR schemas |
| `src/config/modules.config.ts` | Add `human-resource` module key |
| `src/app/dashboard/dashboard.tsx` | Import and register HR config |
