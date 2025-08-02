'use client';

import { formatSemester } from '@/lib/utils';
import {
  Alert,
  Badge,
  Card,
  Group,
  LoadingOverlay,
  Select,
  Stack,
  Text,
} from '@mantine/core';

type ModuleWithStatus = {
  semesterModuleId: number;
  code: string;
  name: string;
  type: string;
  credits: number;
  status: 'Compulsory' | 'Elective' | `Repeat${number}`;
  semesterNo: number;
  prerequisites?: Array<{ id: number; code: string; name: string }>;
};

type SemesterData = {
  semesterNo: number;
  status: 'Active' | 'Repeat';
};

type Props = {
  semesterData: SemesterData | null;
  selectedModules: Set<number>;
  availableModules: ModuleWithStatus[];
  isLoading: boolean;
  onSemesterChange: (semesterNo: number) => void;
  onStatusChange: (status: 'Active' | 'Repeat') => void;
};

export default function SemesterInfoCard({
  semesterData,
  selectedModules,
  availableModules,
  isLoading,
  onSemesterChange,
  onStatusChange,
}: Props) {
  if (selectedModules.size === 0) {
    return null;
  }

  const totalCredits = availableModules
    .filter((m) => selectedModules.has(m.semesterModuleId))
    .reduce((sum, m) => sum + m.credits, 0);

  const semesterOptions = Array.from({ length: 8 }, (_, i) => ({
    value: (i + 1).toString(),
    label: formatSemester(i + 1),
  }));

  const statusOptions = [
    { value: 'Active', label: 'Active' },
    { value: 'Repeat', label: 'Repeat' },
  ];

  return (
    <Card withBorder p='md' pos='relative'>
      <LoadingOverlay visible={isLoading} />
      {semesterData && (
        <Stack gap='md'>
          <Group justify='space-between'>
            <Text fw={500}>Semester Information</Text>
            <Badge color={semesterData.status === 'Active' ? 'blue' : 'orange'}>
              {semesterData.status}
            </Badge>
          </Group>

          <Group grow>
            <Select
              label='Semester'
              data={semesterOptions}
              value={semesterData.semesterNo.toString()}
              onChange={(value) => {
                if (value) {
                  onSemesterChange(parseInt(value));
                }
              }}
            />
            <Select
              label='Status'
              data={statusOptions}
              value={semesterData.status}
              onChange={(value) => {
                if (value) {
                  onStatusChange(value as 'Active' | 'Repeat');
                }
              }}
            />
          </Group>

          <Group>
            <Text size='sm'>Modules: {selectedModules.size}</Text>
            <Text size='sm'>Credits: {totalCredits}</Text>
          </Group>

          {semesterData.status === 'Repeat' && (
            <Alert color='orange'>Student is repeating this semester</Alert>
          )}
        </Stack>
      )}
      {!semesterData && (
        <Stack gap='xs'>
          <Text fw={500}>Determining semester status...</Text>
        </Stack>
      )}
    </Card>
  );
}
