'use client';

import { formatSemester } from '@/lib/utils';
import {
  Badge,
  Card,
  Group,
  Loader,
  Select,
  Stack,
  Text,
  Title,
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
  onSemesterChange: (data: SemesterData) => void;
  isLoading?: boolean;
};

export default function SemesterInfoCard({
  semesterData,
  selectedModules,
  onSemesterChange,
  isLoading = false,
}: Props) {
  if (selectedModules.size === 0) {
    return null;
  }

  const semesterOptions = Array.from({ length: 8 }, (_, i) => ({
    value: (i + 1).toString(),
    label: formatSemester(i + 1),
  }));

  const statusOptions = [
    { value: 'Active', label: 'Active' },
    { value: 'Repeat', label: 'Repeat' },
  ];

  const handleSemesterChange = (semesterNo: number) => {
    if (semesterData) {
      onSemesterChange({
        ...semesterData,
        semesterNo,
      });
    }
  };

  const handleStatusChange = (status: 'Active' | 'Repeat') => {
    if (semesterData) {
      onSemesterChange({
        ...semesterData,
        status,
      });
    }
  };

  return (
    <Card withBorder p='md'>
      <Stack gap='md'>
        <Group justify='space-between'>
          <Title order={4} size='h5'>
            Semester Information
          </Title>
          {isLoading ? (
            <Group gap='xs'>
              <Loader size='sm' />
              <Text size='sm' c='dimmed'>
                Determining...
              </Text>
            </Group>
          ) : (
            <Badge
              radius={'sm'}
              color={semesterData?.status === 'Active' ? 'blue' : 'orange'}
            >
              {semesterData?.status}
            </Badge>
          )}
        </Group>

        <Group grow>
          <Select
            label='Semester'
            data={semesterOptions}
            value={semesterData?.semesterNo.toString()}
            onChange={(value) => {
              if (value) {
                handleSemesterChange(parseInt(value));
              }
            }}
            disabled={isLoading}
          />
          <Select
            label='Status'
            data={statusOptions}
            value={semesterData?.status}
            onChange={(value) => {
              if (value) {
                handleStatusChange(value as 'Active' | 'Repeat');
              }
            }}
            disabled={isLoading}
          />
        </Group>
      </Stack>
    </Card>
  );
}
