'use client';

import { Badge, Center, Stack, Table, Text } from '@mantine/core';
import { IconBookmark } from '@tabler/icons-react';

interface StudentModule {
  id: number;
  grade: string;
  marks: string;
  status: string;
  semesterModule?: {
    module?: {
      id: number;
      code: string;
      name: string;
    } | null;
  };
}

interface DesktopTableProps {
  modules: StudentModule[];
}

export default function DesktopTable({ modules }: DesktopTableProps) {
  const getGradeColor = (grade: string) => {
    if (['A+', 'A', 'A-'].includes(grade)) return 'green';
    if (['B+', 'B', 'B-'].includes(grade)) return 'blue';
    if (['C+', 'C', 'C-'].includes(grade)) return 'yellow';
    return 'red';
  };

  if (modules.length === 0) {
    return (
      <Center py='xl'>
        <Stack align='center' gap='sm'>
          <IconBookmark size='3rem' color='var(--mantine-color-dimmed)' />
          <Text c='dimmed' size='lg'>
            No modules found for this semester
          </Text>
        </Stack>
      </Center>
    );
  }

  const rows = modules.map((studentModule) => (
    <Table.Tr key={studentModule.id}>
      <Table.Td>
        <Text size='sm' fw={600}>
          {studentModule.semesterModule?.module?.code || 'N/A'}
        </Text>
      </Table.Td>
      <Table.Td>
        <Text size='sm'>
          {studentModule.semesterModule?.module?.name || 'N/A'}
        </Text>
      </Table.Td>
      <Table.Td>
        <Text size='sm' ta='center'>
          {studentModule.marks}
        </Text>
      </Table.Td>
      <Table.Td>
        <Badge
          color={getGradeColor(studentModule.grade)}
          variant='light'
          radius='md'
        >
          {studentModule.grade}
        </Badge>
      </Table.Td>
    </Table.Tr>
  ));

  return (
    <Table striped highlightOnHover withTableBorder>
      <Table.Thead>
        <Table.Tr>
          <Table.Th>
            <Text size='sm' fw={600}>
              Module Code
            </Text>
          </Table.Th>
          <Table.Th>
            <Text size='sm' fw={600}>
              Module Name
            </Text>
          </Table.Th>
          <Table.Th>
            <Text size='sm' fw={600} ta='center'>
              Marks
            </Text>
          </Table.Th>
          <Table.Th>
            <Text size='sm' fw={600}>
              Grade
            </Text>
          </Table.Th>
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>{rows}</Table.Tbody>
    </Table>
  );
}
