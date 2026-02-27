# Part 2: Employee UI — Details Tab, Card Tab, Form & Detail Page

## Overview

Build the complete employee UI: the create/edit form, the detail page with two tabs (Details and Card), photo management, employee card preview (matching the physical card design), card PDF generation, and print audit logging. Card print history is read from `audit_logs` (no dedicated prints table).

## Execution Phases

- **Phase 2A (Reuse-First Refactor):** extract shared UI from students to `src/shared/ui/` and refactor students to consume shared components.
- **Phase 2B (Employee UI Build):** implement employee form, detail page, tabs, photo, card preview, print, and history.
- **Phase 2C (Cross-Feature Validation):** verify no duplication remains and both student + employee flows still work.

## Locked Alignment Decisions (Validated)

- Keep line-by-line convention parity with `registry/students/*` where feasible.
- Keep full scope (do not trim current ideas).
- Keep print history source as `audit_logs` only.
- Keep authorization scope to `human_resource` + `admin` only.
- Prefer shared extraction over feature-local duplication.

---

## 2.0 — Shared Component Extractions (PREREQUISITE)

Before implementing any Part 2 employee components, extract these shared components from the student module. This is **mandatory** per the no-duplication rule.

### Files to create (shared)

| File | Purpose |
|------|---------|
| `src/shared/ui/InfoItem.tsx` | Extracted from `StudentView.tsx` private component |
| `src/shared/ui/PhotoInputModal.tsx` | Extracted from `students/_components/info/PhotoInputModal.tsx` |
| `src/shared/ui/PhotoPreviewModal.tsx` | Extracted from `students/_components/info/PhotoPreviewModal.tsx` |
| `src/shared/ui/IDCardPreview.tsx` | Shared card preview shell (header + body + footer layout) |

### Files to modify (student refactor)

| File | Change |
|------|--------|
| `src/app/registry/students/_components/info/StudentView.tsx` | Import `InfoItem` from `@/shared/ui/InfoItem`, remove private component |
| `src/app/registry/students/_components/info/PhotoView.tsx` | Import `PhotoInputModal`, `PhotoPreviewModal` from `@/shared/ui/` |
| `src/app/registry/students/_components/card/PhotoSelection.tsx` | Import `PhotoInputModal` from `@/shared/ui/` |
| `src/app/registry/students/_components/card/StudentCardView.tsx` | Import `IDCardPreview` from `@/shared/ui/`, pass student-specific fields as props |

### InfoItem Extraction

The `InfoItem` component in `StudentView.tsx` is a private component that handles:
- Label + value display
- Optional `href` (renders as Link)
- Optional `displayValue` (shown instead of raw value)
- Optional copyable behavior (CopyButton with hover reveal)

Extract it exactly as-is to `src/shared/ui/InfoItem.tsx` and export it. No changes to API needed — it's already generic.

### PhotoInputModal Extraction

Already a standalone file at `students/_components/info/PhotoInputModal.tsx`. Move to `src/shared/ui/PhotoInputModal.tsx`. The component is fully generic — it accepts `onPhotoSubmit`, `title`, `renderTrigger`, `onOpen`, `onClose`, `onConfirm` props with no student-specific logic.

### PhotoPreviewModal Extraction

Already a standalone file at `students/_components/info/PhotoPreviewModal.tsx`. Move to `src/shared/ui/PhotoPreviewModal.tsx`. Fully generic — accepts `photoUrl`, `title`, `alt`, `width`, `height`, `onEdit`, `onDelete`, `canEdit` props.

### IDCardPreview Extraction

Extract the shared card preview visual shell from `StudentCardView.tsx`'s private `StudentCardPreview` component. The shared component should accept:

```typescript
type IDCardPreviewProps = {
  photoUrl: string | null | undefined;
  fields: Array<{ value: string }>;
};
```

Fields are rendered in order on the left side. The header (black with university logo), photo section (right side), and footer (return info + LUCT LESOTHO) are shared. Both student and employee cards will use this shell.

---

## 2.1 — Employee Form (Create/Edit)

### Files to create

| File | Purpose |
|------|---------|
| `src/app/human-resource/employees/_components/Form.tsx` | Employee create/edit form |
| `src/app/human-resource/employees/new/page.tsx` | New employee page |
| `src/app/human-resource/employees/[id]/edit/page.tsx` | Edit employee page |

### Form Component

Mirrors the SKILL.md form template and codebase form patterns. Uses `getAllSchools` from `@academic/schools` (same pattern as `timetable/venues/Form.tsx` and `registry/students/StudentsFilter.tsx`).

**Fields:**
- `empNo` — TextInput (Employee Number, e.g., LUCT456). Disabled on edit.
- `name` — TextInput (Full Name)
- `status` — Select (from `employeeStatus` enum values)
- `type` — Select (from `employeeType` enum values)
- `schoolId` — Select (from schools list, loaded via `getAllSchools` + TanStack Query)

```tsx
'use client';

import { getAllSchools } from '@academic/schools';
import { employees } from '@human-resource/_database';
import { Select, TextInput } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
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

  const { data: schools = [] } = useQuery({
    queryKey: ['schools'],
    queryFn: getAllSchools,
  });

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
          <Select
            label='School / Department'
            data={schools.map((s) => ({
              value: String(s.id),
              label: s.name,
            }))}
            searchable
            clearable
            {...form.getInputProps('schoolId')}
          />
        </>
      )}
    </Form>
  );
}
```

> **Reuse note**: The `getAllSchools` + `useQuery` pattern for populating a school Select is used in:
> - `timetable/venues/_components/Form.tsx`
> - `registry/students/_components/StudentsFilter.tsx`
> - `registry/students/_components/academics/CreateStudentProgramModal.tsx`
> - `admissions/entry-requirements/_components/EntryRequirementsFilter.tsx`

### New Employee Page

Mirrors `registry/students/new/page.tsx` exactly.

```tsx
import { Box } from '@mantine/core';
import { createEmployee } from '../_server/actions';
import EmployeeForm from '../_components/Form';

export default function NewPage() {
  return (
    <Box p='lg'>
      <EmployeeForm title='New Employee' onSubmit={createEmployee} />
    </Box>
  );
}
```

### Edit Employee Page

```tsx
import { Box } from '@mantine/core';
import { notFound } from 'next/navigation';
import { getEmployee, updateEmployee } from '../../_server/actions';
import EmployeeForm from '../../_components/Form';

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EditPage({ params }: Props) {
  const { id } = await params;
  const employee = await getEmployee(id);

  if (!employee) return notFound();

  return (
    <Box p='lg'>
      <EmployeeForm
        title='Edit Employee'
        defaultValues={employee}
        onSubmit={async (values) => {
          'use server';
          return await updateEmployee(id, values);
        }}
      />
    </Box>
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

Mirrors `registry/students/[id]/page.tsx`. Uses `DetailsView` + `DetailsViewHeader` from adease, then renders `EmployeeTabs`. Includes `handleDelete` and `editUrl` on the header (students hide edit, employees show it).

```tsx
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { DetailsView, DetailsViewHeader } from '@/shared/ui/adease';
import EmployeeTabs from '../_components/EmployeeTabs';
import { deleteEmployee, getEmployee } from '../_server/actions';

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
  const employee = await getEmployee(id);

  if (!employee) return notFound();

  return (
    <DetailsView>
      <DetailsViewHeader
        title={employee.name}
        queryKey={['employees']}
        editUrl={`/human-resource/employees/${employee.empNo}/edit`}
        handleDelete={async () => {
          'use server';
          await deleteEmployee(employee.empNo);
        }}
      />
      <EmployeeTabs employee={employee} />
    </DetailsView>
  );
}
```

> **Difference from students**: Student page uses `hideEdit={true}` and has no `handleDelete`. Employee page provides both edit URL and delete handler.

---

## 2.3 — Employee Tabs Component

### Files to create

| File | Purpose |
|------|---------|
| `src/app/human-resource/employees/_components/EmployeeTabs.tsx` | Tab container (Details + Card) |

### Details

Uses `useQueryState` from `nuqs` for URL-persistent tab state (matching `StudentTabs.tsx`). Only 2 tabs — uses standard Mantine `TabsList` (not `ScrollableTabsList` which is for 6+ tabs). The print button renders inside the `TabsList` area when the Card tab is active.

```tsx
'use client';

import { Tabs, TabsList, TabsPanel, TabsTab } from '@mantine/core';
import { useQueryState } from 'nuqs';
import type { getEmployee } from '../_server/actions';
import EmployeeCardView from './card/EmployeeCardView';
import EmployeeCardPrinter from './card/EmployeeCardPrinter';
import EmployeeView from './info/EmployeeView';

type Props = {
  employee: NonNullable<Awaited<ReturnType<typeof getEmployee>>>;
};

export default function EmployeeTabs({ employee }: Props) {
  const [activeTab, setActiveTab] = useQueryState('tab', {
    defaultValue: 'info',
  });

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

> **Alignment with students**: `StudentTabs.tsx` uses `useQueryState` from `nuqs` for URL persistence (`?tab=academics`). Employee tabs follow the exact same pattern. Student tabs use `ScrollableTabsList` because there are 8+ tabs with role-based visibility; employee tabs use plain `TabsList` since there are only 2 tabs.

---

## 2.4 — Details Tab (EmployeeView)

### Files to create

| File | Purpose |
|------|---------|
| `src/app/human-resource/employees/_components/info/EmployeeView.tsx` | Employee detail info display |
| `src/app/human-resource/employees/_components/info/PhotoView.tsx` | Employee photo display + upload |

### EmployeeView

Mirrors `StudentView.tsx` layout. Shows:

1. **Photo** (small card, left side) + **User account link** (right side) — same row as student
2. **Employee section** — Paper card with Grid:
   - Employee Number (copyable via `InfoItem`)
   - Full Name (copyable via `InfoItem`)
   - Status (badge using `getStatusColor`)
   - Type
   - Department/School (link to school page via `InfoItem` href)

Uses the shared `InfoItem` component extracted in Step 2.0.

```tsx
'use client';

import {
  Badge,
  Card,
  Grid,
  Group,
  Paper,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { getStatusColor } from '@/shared/lib/utils/colors';
import InfoItem from '@/shared/ui/InfoItem';
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
        <Card withBorder flex={1} p='md' h={76}>
          <Group wrap='nowrap' gap='xs'>
            <div style={{ flex: 1 }}>
              <Text size='sm' c='dimmed'>User</Text>
              {employee.user ? (
                <Link href={`/admin/users/${employee.user.id}`} size='sm' fw={500}>
                  {employee.user.name}
                </Link>
              ) : (
                <Text size='sm' c='dimmed' fs='italic'>Not linked</Text>
              )}
            </div>
          </Group>
        </Card>
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
              <InfoItem label='Employee Number' value={employee.empNo} copyable />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <InfoItem label='Full Name' value={employee.name} copyable />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <InfoItem label='Type' value={employee.type} />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <InfoItem
                label='Department / School'
                value={employee.school?.name ?? 'N/A'}
                href={employee.schoolId ? `/academic/schools/${employee.schoolId}` : undefined}
              />
            </Grid.Col>
          </Grid>
        </Paper>
      </div>
    </Stack>
  );
}
```

### PhotoView

Mirrors `students/_components/info/PhotoView.tsx`. Uses the shared `PhotoInputModal` and `PhotoPreviewModal` from `@/shared/ui/`. Storage path: `photos/employees/{empNo}.jpg`.

```tsx
'use client';

import { Card, Center } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconUser } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { deleteDocument, uploadDocument } from '@/core/integrations/storage';
import PhotoInputModal from '@/shared/ui/PhotoInputModal';
import PhotoPreviewModal from '@/shared/ui/PhotoPreviewModal';
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

  // Render: PhotoPreviewModal if photo exists, else placeholder icon
  // PhotoInputModal for uploading/changing photo
  // Mirror student PhotoView structure exactly, using shared modal components
}
```

---

## 2.5 — Card Tab (EmployeeCardView)

### Files to create

| File | Purpose |
|------|---------|
| `src/app/human-resource/employees/_components/card/EmployeeCardView.tsx` | Card tab with preview + history |
| `src/app/human-resource/employees/_components/card/EmployeeCardPrinter.tsx` | Print button (no receipt modal) |
| `src/app/human-resource/employees/_components/card/EmployeeCardPDF.tsx` | PDF generation for printing |
| `src/app/human-resource/employees/_components/card/PrintHistoryView.tsx` | Print history from audit logs |
| `src/app/human-resource/employees/_components/card/PhotoSelection.tsx` | Photo upload/camera for card tab |

### EmployeeCardView

Mirrors `StudentCardView.tsx`. Has inner tabs: "Preview" and "History".

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
import PhotoSelection from './PhotoSelection';
import PrintHistoryView from './PrintHistoryView';
import IDCardPreview from '@/shared/ui/IDCardPreview';

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
          <IDCardPreview
            photoUrl={finalPhotoUrl}
            fields={[
              { value: employee.name },
              { value: employee.empNo },
              { value: employee.school?.name || 'N/A' },
            ]}
          />
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

> **Shared IDCardPreview**: The card visual shell (black header with logo, body with fields on left + photo on right, footer) is extracted to `src/shared/ui/IDCardPreview.tsx`. Both `StudentCardView` and `EmployeeCardView` pass entity-specific fields as props.

### EmployeeCardPDF

Separate from the shared preview shell (PDF components use `@react-pdf/renderer` which has different APIs). Mirrors `StudentCardPDF.tsx` structure exactly, with employee-specific field labels.

Key differences from student card PDF:
- Fields: Employee name, empNo, department (school name)
- No "STUDENT" type text or year
- Labels: "EMPLOYEE NAMES", "EMPLOYEE NUMBER", "DEPARTMENT"

```tsx
import {
  Document,
  Font,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
} from '@react-pdf/renderer';
import type { getEmployee } from '../../_server/actions';

// Font registration and styles mirror StudentCardPDF exactly
// (same page size, same layout structure)

type Props = {
  employee: NonNullable<Awaited<ReturnType<typeof getEmployee>>>;
  photoUrl: string | null;
};

export default function EmployeeCardPDF({ employee, photoUrl }: Props) {
  const departmentCode = employee.school?.name || 'N/A';

  return (
    <Document>
      <Page size={[242.6, 175]} style={styles.page}>
        <View style={styles.cardContainer}>
          <View style={styles.blackHeader}>
            <Image style={styles.universityLogo} src='/images/logo-dark.png' />
          </View>
          <View style={styles.cardBody}>
            <View style={styles.leftSection}>
              <Text style={styles.name}>{employee.name}</Text>
              <Text style={styles.id}>{employee.empNo}</Text>
              <Text style={styles.department}>{departmentCode}</Text>
              <View style={styles.cardFooter}>
                <Text style={styles.footerText}>If found please return to:</Text>
                <Text style={styles.footerText}>Limkokwing University Lesotho Campus</Text>
                <Text style={styles.footerText}>Tel: 22315747</Text>
              </View>
            </View>
            <View style={styles.rightSection}>
              <View style={styles.photoContainer}>
                {photoUrl ? (
                  <Image style={styles.photo} src={photoUrl} />
                ) : (
                  <View style={styles.photoPlaceholder}>
                    <Text style={styles.photoPlaceholderText}>NO PHOTO</Text>
                  </View>
                )}
              </View>
              <Text style={styles.campusInfo}>LUCT LESOTHO</Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
}
```

### EmployeeCardPrinter

Simple print button — **no receipt modal** (employees don't pay for cards). Clicking the print button generates the PDF and opens the print dialog. The print action is audited via a dedicated server action that calls `writeAuditLog`.

```tsx
'use client';

import { Button, Loader } from '@mantine/core';
import { pdf } from '@react-pdf/renderer';
import { IconPrinter } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { useState } from 'react';
import { convertUrlToBase64 } from '@/shared/lib/utils/utils';
import { type getEmployee, getEmployeePhoto } from '../../_server/actions';
import { logEmployeeCardPrint } from '../../_server/actions';
import EmployeeCardPDF from './EmployeeCardPDF';

type Props = {
  employee: NonNullable<Awaited<ReturnType<typeof getEmployee>>>;
  isActive?: boolean;
};

export default function EmployeeCardPrinter({ employee, isActive = true }: Props) {
  const [isGenerating, setIsGenerating] = useState(false);
  const { data: session } = useSession();

  const { data: photoUrl } = useQuery({
    queryKey: ['employee-photo', employee.empNo],
    queryFn: () => getEmployeePhoto(employee.empNo),
    staleTime: 1000 * 60 * 3,
    enabled: isActive,
  });

  const handlePrint = async () => {
    if (!employee || !photoUrl) return;

    setIsGenerating(true);
    try {
      await logEmployeeCardPrint(employee.empNo);

      const processedPhotoUrl = photoUrl.startsWith('http')
        ? await convertUrlToBase64(photoUrl)
        : photoUrl;

      const blob = await pdf(
        <EmployeeCardPDF employee={employee} photoUrl={processedPhotoUrl} />
      ).toBlob();

      const url = URL.createObjectURL(blob);
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.src = url;
      document.body.appendChild(iframe);
      iframe.onload = () => {
        iframe.contentWindow?.print();
        setTimeout(() => {
          document.body.removeChild(iframe);
          URL.revokeObjectURL(url);
        }, 1000);
      };
    } catch (error) {
      console.error('Print failed:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Button
      variant='light'
      size='compact-sm'
      leftSection={isGenerating ? <Loader size={14} /> : <IconPrinter size={16} />}
      disabled={isGenerating || !photoUrl}
      onClick={handlePrint}
      ml='auto'
    >
      Print
    </Button>
  );
}
```

> **Difference from students**: `StudentCardPrinter` opens a receipt modal (`setModalOpened(true)`) before printing and calls `createStudentCardPrintWithReceipt`. The employee version is a simple one-click print button that logs an audit entry.

### Server Action for Print Audit

Add to `src/app/human-resource/employees/_server/actions.ts`:

```typescript
export async function logEmployeeCardPrint(empNo: string) {
  return employeesService.logCardPrint(empNo);
}
```

Add to `EmployeeService`:

```typescript
async logCardPrint(empNo: string) {
  return withAuth(
    async (session) => {
      await this.repository.logCardPrint(empNo, {
        userId: requireSessionUserId(session),
        role: session!.user!.role!,
        activityType: 'employee_card_print',
      });
    },
    ['human_resource', 'admin']
  );
}
```

Add to `EmployeeRepository`:

```typescript
async logCardPrint(empNo: string, audit: AuditOptions) {
  await db.transaction(async (tx) => {
    await this.writeAuditLog(
      tx,
      'INSERT',
      empNo,
      null,
      { empNo, action: 'card_print' },
      audit
    );
  });
}
```

### PrintHistoryView

Reads from `audit_logs` table filtered by `tableName = 'employees'` and `activityType = 'employee_card_print'`. Uses the same visual layout as `students/card/PrintHistoryView.tsx` (Paper cards with printer name + date), minus the receipt display.

```tsx
'use client';

import { Group, Paper, Skeleton, Stack, Text, ThemeIcon } from '@mantine/core';
import { IconPrinter } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { formatDateTime } from '@/shared/lib/utils/dates';
import { getEmployeeCardPrintHistory } from '../../_server/actions';

type Props = {
  empNo: string;
  isActive: boolean;
};

export default function PrintHistoryView({ empNo, isActive }: Props) {
  const { data: prints, isLoading } = useQuery({
    queryKey: ['employee-card-prints', empNo],
    queryFn: () => getEmployeeCardPrintHistory(empNo),
    enabled: isActive,
  });

  if (isLoading) {
    return (
      <Stack>
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} height={80} radius='md' />
        ))}
      </Stack>
    );
  }

  if (!prints || prints.length === 0) {
    return (
      <Text size='sm' c='dimmed' fs='italic' ta='center' py='xl'>
        No print history found
      </Text>
    );
  }

  return (
    <Stack>
      {prints.map((print) => (
        <Paper key={print.id} withBorder p='md' radius='sm'>
          <Group justify='space-between' align='flex-start'>
            <Group gap='sm'>
              <ThemeIcon variant='light' size='lg' color='gray'>
                <IconPrinter size={18} />
              </ThemeIcon>
              <Stack gap={2}>
                <Text size='sm' fw={500}>
                  {print.changedByName}
                </Text>
                <Text size='xs' c='dimmed'>
                  {formatDateTime(print.createdAt, 'short')}
                </Text>
              </Stack>
            </Group>
          </Group>
        </Paper>
      ))}
    </Stack>
  );
}
```

The `getEmployeeCardPrintHistory` server action queries `audit_logs`:

```typescript
export async function getEmployeeCardPrintHistory(empNo: string) {
  return employeesService.getCardPrintHistory(empNo);
}
```

Service method:
```typescript
async getCardPrintHistory(empNo: string) {
  return withAuth(
    async () => this.repo.findCardPrintHistory(empNo),
    ['human_resource', 'admin']
  );
}
```

Repository method:
```typescript
async findCardPrintHistory(empNo: string) {
  return db
    .select({
      id: auditLogs.id,
      createdAt: auditLogs.createdAt,
      changedByName: users.name,
    })
    .from(auditLogs)
    .innerJoin(users, eq(auditLogs.changedBy, users.id))
    .where(
      and(
        eq(auditLogs.tableName, 'employees'),
        eq(auditLogs.activityType, 'employee_card_print'),
        eq(auditLogs.recordId, empNo)
      )
    )
    .orderBy(desc(auditLogs.createdAt));
}
```

### PhotoSelection

Feature-specific component (different storage path from students). Mirrors `students/_components/card/PhotoSelection.tsx` but imports shared `PhotoInputModal` from `@/shared/ui/PhotoInputModal`. Uses R2 storage path `photos/employees/{empNo}.{ext}`.

---

## 2.6 — Status Color Mapping

### Files to modify

| File | Change |
|------|--------|
| `src/shared/lib/utils/colors.ts` | Add employee status mappings |

Add employee statuses that don't already have mappings:

```typescript
// In statusColors.enrollment, add:
resigned: semantic.caution,
retired: semantic.neutral,
onleave: semantic.warning,
```

Add `EmployeeStatus` to the `AllStatusType` union:

```typescript
import type { employeeStatus } from '@human-resource/_database';
type EmployeeStatus = (typeof employeeStatus.enumValues)[number];

export type AllStatusType =
  | keyof typeof allStatuses
  | StudentStatus
  | EmployeeStatus  // ← ADD
  | StudentProgramStatus
  | SemesterStatus
  | StudentModuleStatus
  | ModuleType
  | 'verified';
```

Existing mappings already cover: `Active` → `activity.active`, `Suspended` → `enrollment.suspended`, `Terminated` → `enrollment.terminated`, `Deceased` → `enrollment.deceased`.

---

## 2.7 — File Summary

### New Files (Part 2)

| File | Purpose |
|------|---------|
| `src/shared/ui/InfoItem.tsx` | Shared info item (extracted from StudentView) |
| `src/shared/ui/PhotoInputModal.tsx` | Shared photo input modal (extracted from students) |
| `src/shared/ui/PhotoPreviewModal.tsx` | Shared photo preview modal (extracted from students) |
| `src/shared/ui/IDCardPreview.tsx` | Shared card preview shell |
| `src/app/human-resource/employees/_components/Form.tsx` | Employee form |
| `src/app/human-resource/employees/_components/EmployeeTabs.tsx` | Tab container |
| `src/app/human-resource/employees/_components/info/EmployeeView.tsx` | Details display |
| `src/app/human-resource/employees/_components/info/PhotoView.tsx` | Photo display |
| `src/app/human-resource/employees/_components/card/EmployeeCardView.tsx` | Card tab |
| `src/app/human-resource/employees/_components/card/EmployeeCardPDF.tsx` | PDF for printing |
| `src/app/human-resource/employees/_components/card/EmployeeCardPrinter.tsx` | Print button |
| `src/app/human-resource/employees/_components/card/PrintHistoryView.tsx` | Print history from audit logs |
| `src/app/human-resource/employees/_components/card/PhotoSelection.tsx` | Photo upload |
| `src/app/human-resource/employees/new/page.tsx` | Create page |
| `src/app/human-resource/employees/[id]/page.tsx` | Detail page |
| `src/app/human-resource/employees/[id]/edit/page.tsx` | Edit page |

### Modified Files (Part 2)

| File | Change |
|------|--------|
| `src/app/registry/students/_components/info/StudentView.tsx` | Import `InfoItem` from `@/shared/ui/InfoItem`, remove private component |
| `src/app/registry/students/_components/info/PhotoView.tsx` | Import modals from `@/shared/ui/` |
| `src/app/registry/students/_components/card/PhotoSelection.tsx` | Import `PhotoInputModal` from `@/shared/ui/` |
| `src/app/registry/students/_components/card/StudentCardView.tsx` | Import `IDCardPreview` from `@/shared/ui/`, pass student fields |
| `src/shared/lib/utils/colors.ts` | Add employee status color mappings |
| `src/app/human-resource/employees/_server/repository.ts` | Add `logCardPrint` and `findCardPrintHistory` methods |
| `src/app/human-resource/employees/_server/service.ts` | Add `logCardPrint` and `getCardPrintHistory` methods |
| `src/app/human-resource/employees/_server/actions.ts` | Add `logEmployeeCardPrint` and `getEmployeeCardPrintHistory` actions |

---

## Part 2 Verification Checklist

- [ ] `InfoItem` extracted to `src/shared/ui/InfoItem.tsx` and reused in both student and employee views
- [ ] `PhotoInputModal` extracted to `src/shared/ui/PhotoInputModal.tsx`
- [ ] `PhotoPreviewModal` extracted to `src/shared/ui/PhotoPreviewModal.tsx`
- [ ] `IDCardPreview` extracted to `src/shared/ui/IDCardPreview.tsx` (shared card visual shell)
- [ ] Student components updated to import from `@/shared/ui/` after extraction
- [ ] Employee Form renders with all fields (empNo, name, status, type, schoolId via `getAllSchools`)
- [ ] New employee page creates employee and redirects
- [ ] Edit employee page loads existing data and updates
- [ ] Detail page shows DetailsView with header (edit + delete buttons) and tabs
- [ ] EmployeeTabs uses `useQueryState` from `nuqs` for URL-persistent tabs
- [ ] Details tab shows employee info using shared `InfoItem` + `PhotoView`
- [ ] Card tab shows employee card preview using shared `IDCardPreview` shell
- [ ] Card tab has Preview and History sub-tabs
- [ ] Print History sub-tab queries `audit_logs` for `employee_card_print` activity type
- [ ] Employee card PDF generates correctly for printing (separate from shared preview)
- [ ] Print button generates PDF directly (no receipt modal)
- [ ] Print action logs audit entry via `writeAuditLog` in repository
- [ ] Photo upload works with R2 storage at `photos/employees/`
- [ ] Employee status colors added to `src/shared/lib/utils/colors.ts`
- [ ] No code duplication between student and employee components
- [ ] Run `pnpm tsc --noEmit && pnpm lint:fix` — clean

---

## Complete Directory Structure After Part 2

```
src/app/human-resource/
├── _database/
│   └── index.ts
├── human-resource.config.ts
└── employees/
    ├── index.ts
    ├── layout.tsx
    ├── page.tsx
    ├── new/
    │   └── page.tsx
    ├── [id]/
    │   ├── page.tsx
    │   └── edit/
    │       └── page.tsx
    ├── _schema/
    │   ├── employees.ts
    │   ├── types.ts
    │   └── relations.ts
    ├── _server/
    │   ├── repository.ts
    │   ├── service.ts
    │   └── actions.ts
    ├── _lib/
    │   └── types.ts
    └── _components/
        ├── Form.tsx
        ├── EmployeeTabs.tsx
        ├── info/
        │   ├── EmployeeView.tsx
        │   └── PhotoView.tsx
        └── card/
            ├── EmployeeCardView.tsx
            ├── EmployeeCardPDF.tsx
            ├── EmployeeCardPrinter.tsx
            ├── PrintHistoryView.tsx
            └── PhotoSelection.tsx

src/shared/ui/               (new shared extractions)
├── InfoItem.tsx
├── PhotoInputModal.tsx
├── PhotoPreviewModal.tsx
└── IDCardPreview.tsx
```

---

## Cross-Cutting Concerns

### Shared Component Extractions Summary

| Component | From | To | Notes |
|-----------|------|----|-------|
| `InfoItem` | Private in `StudentView.tsx` | `src/shared/ui/InfoItem.tsx` | Generic — no changes needed |
| `PhotoInputModal` | `students/_components/info/PhotoInputModal.tsx` | `src/shared/ui/PhotoInputModal.tsx` | Generic — no changes needed |
| `PhotoPreviewModal` | `students/_components/info/PhotoPreviewModal.tsx` | `src/shared/ui/PhotoPreviewModal.tsx` | Generic — no changes needed |
| `IDCardPreview` | Private in `StudentCardView.tsx` | `src/shared/ui/IDCardPreview.tsx` | Parameterized with `fields` prop |

### Feature-Specific Components (NOT shared)

| Component | Why separate |
|-----------|-------------|
| `PhotoSelection` | Different storage paths, entity-specific data sources |
| `EmployeeCardPDF` | PDF renderer has different API than Mantine, separate from shared preview |
| `PrintHistoryView` | Different data source (audit logs vs dedicated table) |
| `EmployeeCardPrinter` | Different flow (no receipt modal vs receipt modal) |
