'use client';

import {
  Badge,
  Card,
  Center,
  Divider,
  Group,
  SimpleGrid,
  Stack,
  Text,
} from '@mantine/core';
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

interface MobileTableProps {
  modules: StudentModule[];
}

export default function MobileTable({ modules }: MobileTableProps) {
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

  return (
    <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }}>
      {modules.map((studentModule) => (
        <Card
          key={studentModule.id}
          shadow='sm'
          padding='lg'
          radius='md'
          withBorder
        >
          <Stack gap='sm'>
            <Group justify='space-between' align='flex-start'>
              <Stack gap='xs'>
                <Text size='sm' fw={600} style={{ lineHeight: 1.2 }}>
                  {studentModule.semesterModule?.module?.code || 'N/A'}
                </Text>

                <Text size='xs'>
                  {studentModule.semesterModule?.module?.name || 'N/A'}
                </Text>
              </Stack>
              <Badge
                size='lg'
                color={getGradeColor(studentModule.grade)}
                variant='light'
                radius='md'
              >
                {studentModule.grade}
              </Badge>
            </Group>

            <Divider />

            <Group justify='space-between' align='center'>
              <Text size='sm' c='dimmed' fw={500}>
                Marks
              </Text>
              <Badge variant='light' color='gray' radius='md'>
                {studentModule.marks}
              </Badge>
            </Group>
          </Stack>
        </Card>
      ))}
    </SimpleGrid>
  );
}
