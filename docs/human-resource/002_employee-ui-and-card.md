# Part 2: Employee UI — Details Tab, Card Tab, Form & Detail Page

## Overview

Build the complete employee UI: the create/edit form, the detail page with two tabs (Details and Card), photo management, employee card preview (matching the physical card design), card PDF generation, and print history.

---

## 2.1 — Employee Form (Create/Edit)

### Files to create

| File | Purpose |
|------|---------|
| `src/app/human-resource/employees/_components/Form.tsx` | Employee create/edit form |
| `src/app/human-resource/employees/new/page.tsx` | New employee page |
| `src/app/human-resource/employees/[id]/edit/page.tsx` | Edit employee page |

### Form Component

Mirrors the student `Form.tsx` pattern. Uses the `Form` component from `@/shared/ui/adease/` with Drizzle Zod schema validation.

**Fields:**
- `empNo` — TextInput (Employee Number, e.g., LUCT456). Editable only on create.
- `name` — TextInput (Full Name)
- `status` — Select (from `employeeStatus` enum values)
- `type` — Select (from `employeeType` enum values)
- `schoolId` — Select (from schools list, loaded via server action)

**Implementation reference** (follows student Form.tsx pattern):

```tsx
'use client';

import { Select, TextInput } from '@mantine/core';
import { employees } from '@human-resource/_database';
import { createInsertSchema } from 'drizzle-zod';
import { useRouter } from 'nextjs-toploader/app';
import { Form } from '@/shared/ui/adease';

type Employee = typeof employees.$inferInsert;

type Props = {
  onSubmit: (values: Employee) => Promise<Employee>;
  defaultValues?: Employee;
  title?: string;
};

export default function EmployeeForm({ onSubmit, defaultValues, title }: Props) {
  const router = useRouter();
  const isEdit = !!defaultValues;

  return (
    <Form
      title={title}
      action={onSubmit}
      queryKey={['employees']}
      schema={createInsertSchema(employees)}
      defaultValues={defaultValues}
      onSuccess={({ empNo }) => {
        router.push(`/human-resource/employees/${empNo}`);
      }}
    >
      {(form) => (
        <>
          <TextInput
            label='Employee Number'
            placeholder='e.g., LUCT456'
            disabled={isEdit}
            {...form.getInputProps('empNo')}
          />
          <TextInput
            label='Full Name'
            {...form.getInputProps('name')}
          />
          <Select
            label='Status'
            data={['Active', 'Suspended', 'Terminated', 'Resigned', 'Retired', 'Deceased', 'On Leave']}
            {...form.getInputProps('status')}
          />
          <Select
            label='Type'
            data={['Full-time', 'Part-time', 'Contract', 'Intern']}
            {...form.getInputProps('type')}
          />
          {/* schoolId: fetch schools via server action, render as Select */}
        </>
      )}
    </Form>
  );
}
```

> **Note**: For the `schoolId` Select, import and call the existing `findAllSchools` action from `@academic/schools` to populate the dropdown (reuse, no duplication). Check how other forms in the codebase load schools for Select fields and follow the same pattern.

### New Employee Page

```tsx
import { createEmployee } from '../_server/actions';
import EmployeeForm from '../_components/Form';

export default function NewEmployeePage() {
  return <EmployeeForm title='New Employee' onSubmit={createEmployee} />;
}
```

### Edit Employee Page

```tsx
import { notFound } from 'next/navigation';
import { getEmployee, updateEmployee } from '../../_server/actions';
import EmployeeForm from '../../_components/Form';

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EditEmployeePage({ params }: Props) {
  const { id } = await params;
  const employee = await getEmployee(id);

  if (!employee) return notFound();

  return (
    <EmployeeForm
      title='Edit Employee'
      onSubmit={(values) => updateEmployee(id, values)}
      defaultValues={employee}
    />
  );
}
```

---

## 2.2 — Employee Detail Page

### Files to create

| File | Purpose |
|------|---------|
| `src/app/human-resource/employees/[id]/page.tsx` | Employee detail page (RSC) |

### Details

Mirrors the student `[id]/page.tsx` exactly. Uses `DetailsView` + `DetailsViewHeader` from adease, then renders `EmployeeTabs`.

```tsx
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { auth } from '@/core/auth';
import { DetailsView, DetailsViewHeader } from '@/shared/ui/adease';
import EmployeeTabs from '../_components/EmployeeTabs';
import { getEmployee } from '../_server/actions';

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const employee = await getEmployee(id);
  return {
    title: `${employee?.name} | Limkokwing`,
  };
}

export default async function EmployeeDetailPage({ params }: Props) {
  const { id } = await params;
  const [employee, session] = await Promise.all([
    getEmployee(id),
    auth(),
  ]);

  if (!employee) return notFound();

  return (
    <DetailsView>
      <DetailsViewHeader
        title={employee.name}
        queryKey={['employees']}
        editUrl={`/human-resource/employees/${employee.empNo}/edit`}
      />
      <EmployeeTabs employee={employee} />
    </DetailsView>
  );
}
```

---

## 2.3 — Employee Tabs Component

### Files to create

| File | Purpose |
|------|---------|
| `src/app/human-resource/employees/_components/EmployeeTabs.tsx` | Tab container (Details + Card) |

### Details

Only 2 tabs (no scrolling as requested). Uses standard Mantine `Tabs` with `TabsList` (NOT `ScrollableTabsList`). Mirrors the structure of `StudentTabs.tsx` but simplified.

```tsx
'use client';

import { Tabs, TabsList, TabsPanel, TabsTab } from '@mantine/core';
import { useState } from 'react';
import type { getEmployee } from '../_server/actions';
import EmployeeCardView from './card/EmployeeCardView';
import EmployeeCardPrinter from './card/EmployeeCardPrinter';
import EmployeeView from './info/EmployeeView';

type Props = {
  employee: NonNullable<Awaited<ReturnType<typeof getEmployee>>>;
};

export default function EmployeeTabs({ employee }: Props) {
  const [activeTab, setActiveTab] = useState<string | null>('info');

  const renderTabActions = () => {
    if (activeTab === 'card') {
      return (
        <EmployeeCardPrinter
          employee={employee}
          isActive={activeTab === 'card'}
        />
      );
    }
    return null;
  };

  return (
    <Tabs value={activeTab} onChange={setActiveTab} variant='outline' mt='xl'>
      <TabsList>
        <TabsTab value='info'>Details</TabsTab>
        <TabsTab value='card'>Card</TabsTab>
        {renderTabActions()}
      </TabsList>
      <TabsPanel value='info' pt='xl' p='sm'>
        <EmployeeView employee={employee} />
      </TabsPanel>
      <TabsPanel value='card' pt='xl' p='sm'>
        <EmployeeCardView employee={employee} isActive={activeTab === 'card'} />
      </TabsPanel>
    </Tabs>
  );
}
```

> **Important**: Tab actions (print button) are rendered inside the `TabsList` as right-aligned content, matching the student cards tab pattern. If the student tabs use `ScrollableTabsList` for actions, replicate that layout mechanic but without the scrolling behavior (simply place the print button to the right of the tabs).

---

## 2.4 — Details Tab (EmployeeView)

### Files to create

| File | Purpose |
|------|---------|
| `src/app/human-resource/employees/_components/info/EmployeeView.tsx` | Employee detail info display |
| `src/app/human-resource/employees/_components/info/PhotoView.tsx` | Employee photo display + upload |

### EmployeeView

Mirrors `StudentView.tsx` layout but ultra-minimal. Shows:

1. **Photo** (small card, left side) + **User account link** (right side) — same row as student
2. **Employee section** — Paper card with Grid:
   - Employee Number (copyable)
   - Full Name (copyable)
   - Status (badge)
   - Type
   - Department/School (link to school page)

**Implementation Reference:**

```tsx
'use client';

import {
  Badge,
  Grid,
  Group,
  Paper,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { getStatusColor } from '@/shared/lib/utils/colors';
import Link from '@/shared/ui/Link';
import type { getEmployee } from '../../_server/actions';
import PhotoView from './PhotoView';

type Props = {
  employee: NonNullable<Awaited<ReturnType<typeof getEmployee>>>;
};

export default function EmployeeView({ employee }: Props) {
  return (
    <Stack gap='xl'>
      <Group gap='xs' align='stretch'>
        <PhotoView employee={employee} />
      </Group>

      <div>
        <Group justify='space-between' mb='xs'>
          <Title order={4} fw={100}>Employee</Title>
          <Badge radius='sm' color={getStatusColor(employee.status)} variant='light'>
            {employee.status}
          </Badge>
        </Group>
        <Paper p='md' radius='md' withBorder>
          <Grid gutter='xl'>
            <Grid.Col span={{ base: 12, sm: 6 }}>
              {/* InfoItem: Employee Number — copyable */}
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6 }}>
              {/* InfoItem: Full Name — copyable */}
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6 }}>
              {/* InfoItem: Type */}
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6 }}>
              {/* InfoItem: Department/School — link to /academic/schools/{id} */}
            </Grid.Col>
          </Grid>
        </Paper>
      </div>
    </Stack>
  );
}
```

> **Critical — No Duplication**: The `InfoItem` private component in `StudentView.tsx` should be **extracted** to a shared location (e.g., `src/shared/ui/InfoItem.tsx`) and reused in both `StudentView` and `EmployeeView`. This is a mandatory refactor. The `InfoItem` component handles:
> - Label + value display
> - Optional href (renders as Link)
> - Optional displayValue (shown instead of raw value)
> - Optional copyable behavior (CopyButton with hover reveal)

### PhotoView

Follows the same pattern as the student `PhotoView.tsx`, but with employee-specific storage path (`photos/employees/{empNo}.jpg`).

```tsx
'use client';

import { Card, Center } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconUser } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { deleteDocument, uploadDocument } from '@/core/integrations/storage';
import { getEmployeePhoto } from '../../_server/actions';
import type { getEmployee } from '../../_server/actions';

type Props = {
  employee: NonNullable<Awaited<ReturnType<typeof getEmployee>>>;
};

export default function PhotoView({ employee }: Props) {
  const { data: photoUrl, refetch } = useQuery({
    queryKey: ['employee-photo', employee.empNo],
    queryFn: () => getEmployeePhoto(employee.empNo),
    staleTime: 1000 * 60 * 3,
  });

  const handlePhotoSubmit = async (croppedImageBlob: Blob) => {
    try {
      if (photoUrl) {
        await deleteDocument(photoUrl);
      }
      const fileName = `${employee.empNo}.jpg`;
      const photoFile = new File([croppedImageBlob], fileName, {
        type: 'image/jpeg',
      });
      await uploadDocument(photoFile, fileName, 'photos/employees');
      await refetch();
      notifications.show({
        title: 'Success',
        message: 'Photo updated successfully',
        color: 'green',
      });
    } catch (_error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to update photo',
        color: 'red',
      });
    }
  };

  // Render: Photo preview modal (if photo exists) or placeholder icon
  // Edit button (PhotoInputModal) for uploading/changing photo
  // Mirror student PhotoView structure
}
```

> **Mandatory Extraction**: Extract `PhotoInputModal` and `PhotoPreviewModal` from `@registry/students/_components/info/` to `src/shared/ui/PhotoInputModal.tsx` and `src/shared/ui/PhotoPreviewModal.tsx`. Both are already generic (no student-specific logic). Update student imports to use the shared versions.

---

## 2.5 — Card Tab (EmployeeCardView)

### Files to create

| File | Purpose |
|------|---------|
| `src/app/human-resource/employees/_components/card/EmployeeCardView.tsx` | Card tab with preview + history |
| `src/app/human-resource/employees/_components/card/EmployeeCardPreview.tsx` | Card visual preview (matches physical card) |
| `src/app/human-resource/employees/_components/card/EmployeeCardPrinter.tsx` | Print button + receipt modal |
| `src/app/human-resource/employees/_components/card/EmployeeCardPDF.tsx` | PDF generation for printing |
| `src/app/human-resource/employees/_components/card/PrintHistoryView.tsx` | Print history list |
| `src/app/human-resource/employees/_components/card/PhotoSelection.tsx` | Photo upload/camera for card tab |

### EmployeeCardView

Mirrors `StudentCardView.tsx` exactly. Has inner tabs: "Preview" and "History".

```tsx
'use client';

import {
  Card,
  Group,
  Skeleton,
  Stack,
  Tabs,
  TabsList,
  TabsPanel,
  TabsTab,
  Text,
} from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { getEmployeePhoto, type getEmployee } from '../../_server/actions';
import EmployeeCardPreview from './EmployeeCardPreview';
import PhotoSelection from './PhotoSelection';
import PrintHistoryView from './PrintHistoryView';

type Props = {
  employee: NonNullable<Awaited<ReturnType<typeof getEmployee>>>;
  isActive: boolean;
};

export default function EmployeeCardView({ employee, isActive }: Props) {
  const [activeTab, setActiveTab] = useState<string | null>('preview');
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const { data: existingPhotoUrl, isLoading } = useQuery({
    queryKey: ['employee-photo', employee.empNo],
    queryFn: () => getEmployeePhoto(employee.empNo),
    staleTime: 1000 * 60 * 3,
    enabled: isActive,
  });

  const finalPhotoUrl = photoPreview || existingPhotoUrl;

  const handlePhotoChange = (file: File | null, preview: string | null) => {
    setSelectedPhoto(file);
    setPhotoPreview(preview);
  };

  if (!isActive) return null;

  return (
    <Stack>
      <Card withBorder p='md'>
        <Group justify='space-between' align='center'>
          <Stack gap={4}>
            <Text fw={500} size='sm'>Employee Card</Text>
            <Text size='xs' c='dimmed'>
              Manage employee card photo and print history
            </Text>
          </Stack>
          <PhotoSelection
            selectedPhoto={selectedPhoto}
            photoPreview={photoPreview}
            onPhotoChange={handlePhotoChange}
            employeeNumber={employee.empNo}
            existingPhotoUrl={existingPhotoUrl}
            compact
          />
        </Group>
      </Card>

      <Tabs value={activeTab} onChange={setActiveTab} variant='default'>
        <TabsList>
          <TabsTab value='preview'>Preview</TabsTab>
          <TabsTab value='history'>History</TabsTab>
        </TabsList>
        <TabsPanel value='preview' pt='xl'>
          <EmployeeCardPreview employee={employee} photoUrl={finalPhotoUrl} />
        </TabsPanel>
        <TabsPanel value='history' pt='xl'>
          <PrintHistoryView
            empNo={employee.empNo}
            isActive={isActive && activeTab === 'history'}
          />
        </TabsPanel>
      </Tabs>
    </Stack>
  );
}
```

### EmployeeCardPreview

**This is the key visual component.** Must match the physical employee ID card from the shared image:

```
┌─────────────────────────────────────────────┐
│          ┌──────────────────────┐            │
│          │   LIMKOKWING         │            │
│          │   UNIVERSITY         │            │
│          │   OF CREATIVE        │            │
│          │   TECHNOLOGY         │            │
│          └──────────────────────┘            │
│ EMPLOYEE NAMES               ┌──────────┐   │
│ TEBOHO TALASI                │          │   │
│                              │  PHOTO   │   │
│ EMPLOYEE NUMBER              │          │   │
│ LUCT456                      │          │   │
│                              └──────────┘   │
│ DEPARTMENT                                  │
│ FICT                         LUCT LESOTHO   │
│                                             │
│ If found please return to:                  │
│ Limkokwing University, Lesotho Campus       │
│ Telephone Number: +26622314551              │
└─────────────────────────────────────────────┘
```

The card design uses:
- **Black header** with university logo (`/images/logo-dark.png`)
- **White body** with employee info on the left, photo on the right
- **Labels** in regular weight, **values** in bold
- **Footer** with return info and "LUCT LESOTHO" branding

```tsx
'use client';

import { Box, Flex, Group, Image, Paper, Stack, Text } from '@mantine/core';
import { IconCamera } from '@tabler/icons-react';
import type { getEmployee } from '../../_server/actions';

type Props = {
  employee: NonNullable<Awaited<ReturnType<typeof getEmployee>>>;
  photoUrl: string | null | undefined;
};

export default function EmployeeCardPreview({ employee, photoUrl }: Props) {
  const departmentCode = employee.school?.name || 'N/A';

  return (
    <Paper
      shadow='md'
      radius={0}
      style={{
        width: '320px',
        height: '200px',
        backgroundColor: '#ffffff',
        border: '1px solid #000',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Black header with logo — identical to student card */}
      <Box style={{
        width: '100%',
        height: '70px',
        backgroundColor: '#000000',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '4px',
      }}>
        <Image
          src='/images/logo-dark.png'
          alt='Limkokwing University'
          w={180}
          h={50}
          fit='contain'
        />
      </Box>

      {/* Body: Employee info left, photo right */}
      <Group align='flex-start' gap='sm' p='sm' style={{ height: 'calc(100% - 70px)' }}>
        <Box style={{ flex: 1 }}>
          <Text size='6px' c='black' lh={1.2}>EMPLOYEE NAMES</Text>
          <Text size='sm' fw={700} c='black' lh={1.2}>{employee.name}</Text>
          <Text size='6px' c='black' lh={1.2} mt={4}>EMPLOYEE NUMBER</Text>
          <Text size='xs' fw={700} c='black' lh={1.2}>{employee.empNo}</Text>
          <Text size='6px' c='black' lh={1.2} mt={4}>DEPARTMENT</Text>
          <Text size='xs' fw={700} c='black' lh={1.2}>{departmentCode}</Text>
        </Box>

        <Stack align='flex-end' gap={2}>
          {photoUrl ? (
            <Image
              src={photoUrl}
              alt='Employee photo'
              w={90}
              h={100}
              fit='cover'
              radius={0}
              style={{ border: '1px solid #000' }}
            />
          ) : (
            <Box w={90} h={90} style={{
              border: '1px solid #000',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#f0f0f0',
            }}>
              <IconCamera size={20} color='#666' />
            </Box>
          )}
        </Stack>
      </Group>

      {/* Footer */}
      <Box style={{ position: 'absolute', bottom: '5px', left: '12px', right: '8px' }}>
        <Flex justify='space-between' align='end'>
          <Box>
            <Text size='6px' c='black' lh={1.2}>If found please return to:</Text>
            <Text size='6px' c='black' lh={1.2}>Limkokwing University, Lesotho Campus</Text>
            <Text size='6px' c='black' lh={1.2}>Telephone Number: +26622314551</Text>
          </Box>
          <Text size='0.5rem' fw={700} c='black' ta='center' w={92} lh={1.2}>
            LUCT LESOTHO
          </Text>
        </Flex>
      </Box>
    </Paper>
  );
}
```

> **Note**: Compare with student's `StudentCardPreview` — the structure is nearly identical. The key differences are:
> - Labels read "EMPLOYEE NAMES", "EMPLOYEE NUMBER", "DEPARTMENT" instead of student fields
> - No "STUDENT" type label or year
> - Department derived from `employee.school?.name` instead of program code

### EmployeeCardPDF

Mirrors `StudentCardPDF.tsx` exactly, but with employee-specific fields. Uses `@react-pdf/renderer` for print-quality output.

Key differences from student card PDF:
- Field labels: EMPLOYEE NAMES, EMPLOYEE NUMBER, DEPARTMENT
- Data source: `employee.name`, `employee.empNo`, `employee.school?.name`
- No program code or "STUDENT" type text

### EmployeeCardPrinter

Mirrors `StudentCardPrinter.tsx`:
1. Print button (IconPrinter)
2. Receipt number modal (TextInput + confirm)
3. Creates print record via `createEmployeeCardPrint`
4. Generates PDF blob via `@react-pdf/renderer`
5. Opens print dialog via hidden iframe

### PrintHistoryView

Mirrors `PrintHistoryView.tsx` from students exactly. Uses `getEmployeeCardPrints` action. Shows list of prints with printer name, date/time, and receipt number.

### PhotoSelection

Mirrors `PhotoSelection.tsx` from students, adapted for employee photos:
- Storage path: `photos/employees/{empNo}.{ext}`
- Uses the same camera capture and file upload patterns
- Same crop/preview functionality

> **Mandatory Extraction**: `PhotoInputModal` and `PhotoPreviewModal` MUST be extracted to `src/shared/ui/` before implementing the employee card tab. Both are already generic with no student-specific logic. `PhotoSelection` remains feature-specific (different data sources/storage paths) but should import the shared modals. Update student components to import from `@/shared/ui/` after extraction.

---

## 2.6 — File Summary

### New Files (Part 2)

| File | Purpose |
|------|---------|
| `src/app/human-resource/employees/_components/Form.tsx` | Employee form |
| `src/app/human-resource/employees/_components/EmployeeTabs.tsx` | Tab container |
| `src/app/human-resource/employees/_components/info/EmployeeView.tsx` | Details display |
| `src/app/human-resource/employees/_components/info/PhotoView.tsx` | Photo display |
| `src/app/human-resource/employees/_components/card/EmployeeCardView.tsx` | Card tab |
| `src/app/human-resource/employees/_components/card/EmployeeCardPreview.tsx` | Card visual |
| `src/app/human-resource/employees/_components/card/EmployeeCardPDF.tsx` | PDF for printing |
| `src/app/human-resource/employees/_components/card/EmployeeCardPrinter.tsx` | Print button |
| `src/app/human-resource/employees/_components/card/PrintHistoryView.tsx` | Print history |
| `src/app/human-resource/employees/_components/card/PhotoSelection.tsx` | Photo upload |
| `src/app/human-resource/employees/new/page.tsx` | Create page |
| `src/app/human-resource/employees/[id]/page.tsx` | Detail page |
| `src/app/human-resource/employees/[id]/edit/page.tsx` | Edit page |

### Modified/Extracted Files (Part 2)

| File | Change |
|------|--------|
| `src/shared/ui/InfoItem.tsx` (NEW) | Extract `InfoItem` from `StudentView.tsx` to shared |
| `src/shared/ui/PhotoInputModal.tsx` (NEW) | Extract from `students/_components/info/PhotoInputModal.tsx` to shared |
| `src/shared/ui/PhotoPreviewModal.tsx` (NEW) | Extract from `students/_components/info/PhotoPreviewModal.tsx` to shared |
| `src/app/registry/students/_components/info/StudentView.tsx` | Refactor to import shared `InfoItem` |
| `src/app/registry/students/_components/info/PhotoView.tsx` | Refactor to import from `@/shared/ui/` |
| `src/app/registry/students/_components/card/PhotoSelection.tsx` | Refactor to import from `@/shared/ui/` |
| `src/app/registry/students/index.ts` | Update re-exports to point to shared locations |

---

## Part 2 Verification Checklist

- [ ] Employee Form renders with all fields (empNo, name, status, type, schoolId)
- [ ] New employee page creates employee and redirects
- [ ] Edit employee page loads existing data and updates
- [ ] Detail page shows DetailsView with header and tabs
- [ ] Details tab shows minimal employee info with photo
- [ ] Card tab shows employee card preview matching physical card design
- [ ] Card tab has Preview and History sub-tabs
- [ ] Employee card PDF generates correctly for printing
- [ ] Print button opens receipt modal and creates print record
- [ ] Print history shows all previous prints
- [ ] Photo upload works with R2 storage at `photos/employees/`
- [ ] `InfoItem` extracted to `src/shared/ui/InfoItem.tsx` and reused in both student and employee views
- [ ] `PhotoInputModal` extracted to `src/shared/ui/PhotoInputModal.tsx`
- [ ] `PhotoPreviewModal` extracted to `src/shared/ui/PhotoPreviewModal.tsx`
- [ ] Student components updated to import from shared locations
- [ ] No code duplication between student and employee components
- [ ] Run `pnpm tsc --noEmit && pnpm lint:fix` — clean

---

## Complete Directory Structure After Part 2

```
src/app/human-resource/
├── _database/
│   └── index.ts
├── human-resource.config.ts
├── employees/
│   ├── index.ts
│   ├── layout.tsx
│   ├── page.tsx
│   ├── new/
│   │   └── page.tsx
│   ├── [id]/
│   │   ├── page.tsx
│   │   └── edit/
│   │       └── page.tsx
│   ├── _schema/
│   │   ├── employees.ts
│   │   ├── types.ts
│   │   └── relations.ts
│   ├── _server/
│   │   ├── repository.ts
│   │   ├── service.ts
│   │   └── actions.ts
│   └── _components/
│       ├── Form.tsx
│       ├── EmployeeTabs.tsx
│       ├── info/
│       │   ├── EmployeeView.tsx
│       │   └── PhotoView.tsx
│       └── card/
│           ├── EmployeeCardView.tsx
│           ├── EmployeeCardPreview.tsx
│           ├── EmployeeCardPDF.tsx
│           ├── EmployeeCardPrinter.tsx
│           ├── PrintHistoryView.tsx
│           └── PhotoSelection.tsx
└── print/
    ├── index.ts
    ├── _schema/
    │   ├── employeeCardPrints.ts
    │   └── relations.ts
    └── _server/
        ├── repository.ts
        ├── service.ts
        └── actions.ts
```

---

## Cross-Cutting Concerns

### Shared Component Extractions (Mandatory)

These components MUST be extracted to `src/shared/ui/` before implementing Part 2:

| Component | Student Location | Shared Path | Parameterization |
|-----------|-----------------|-------------|------------------|
| `InfoItem` | `students/_components/info/StudentView.tsx` (private) | `src/shared/ui/InfoItem.tsx` | None needed — already generic |
| `PhotoInputModal` | `students/_components/info/PhotoInputModal.tsx` | `src/shared/ui/PhotoInputModal.tsx` | None needed — already generic |
| `PhotoPreviewModal` | `students/_components/info/PhotoPreviewModal.tsx` | `src/shared/ui/PhotoPreviewModal.tsx` | None needed — already generic |

These remain feature-specific (different data sources):

| Component | Notes |
|-----------|-------|
| `PhotoSelection` | Employee-specific (different storage path, data source) |
| `PrintHistoryView` | Employee-specific (different query key, fetch function) |

### Status Color Mapping

Add employee statuses to `src/shared/lib/utils/colors.ts`.

**Add to `statusColors.enrollment`:**
```typescript
resigned: semantic.caution,
retired: semantic.neutral,
onleave: semantic.warning,
```

**Add employee status type to `AllStatusType` union:**
```typescript
import type { employeeStatus } from '@human-resource/_database';
type EmployeeStatus = (typeof employeeStatus.enumValues)[number];

export type AllStatusType =
  | keyof typeof allStatuses
  | StudentStatus
  | EmployeeStatus  // ← ADD
  | ...
```

The existing mappings already cover: Active → `activity.active`, Suspended → `enrollment.suspended`, Terminated → `enrollment.terminated`, Deceased → `enrollment.deceased`.
