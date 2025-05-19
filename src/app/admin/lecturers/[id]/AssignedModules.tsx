'use client';

import { getAssignedModulesByLecturer } from '@/server/assigned-modules/actions';
import { users } from '@/db/schema';
import { useQuery } from '@tanstack/react-query';
import {
  Badge,
  Card,
  Group,
  Loader,
  SimpleGrid,
  Stack,
  Text,
  Title,
} from '@mantine/core';

type Props = {
  user: NonNullable<typeof users.$inferSelect>;
};

export default function AssignedModules({ user }: Props) {
  const { data: assignedModules, isLoading } = useQuery({
    queryKey: ['assigned-modules', user.id],
    queryFn: () => getAssignedModulesByLecturer(user.id),
  });

  if (isLoading) {
    return (
      <Group justify='center' py='xl'>
        <Loader />
      </Group>
    );
  }

  if (!assignedModules || assignedModules.length === 0) {
    return (
      <Card withBorder p='md'>
        <Text c='dimmed' ta='center'>
          No modules assigned yet
        </Text>
      </Card>
    );
  }

  return (
    <SimpleGrid cols={2} mt='md'>
      {assignedModules.map((assignment) => (
        <Card key={assignment.id} withBorder p='md'>
          <Group justify='space-between' wrap='nowrap'>
            <Stack gap='xs'>
              <Group gap='xs'>
                <Text fw={500}>
                  {assignment.semesterModule?.module?.name || 'Unknown Module'}
                </Text>
                <Text size='sm' c='dimmed'>
                  ({assignment.semesterModule?.module?.code || 'N/A'})
                </Text>
              </Group>

              <Group gap='xs'>
                {assignment.semesterModule?.semester?.name && (
                  <Badge variant='light' color='gray'>
                    {toClassName(
                      assignment.semesterModule.semester.structure.program.code,
                      assignment.semesterModule.semester.name,
                    )}
                  </Badge>
                )}
              </Group>
            </Stack>
          </Group>
        </Card>
      ))}
    </SimpleGrid>
  );
}

function toClassName(programCode: string, semesterName: string) {
  const year = semesterName.match(/Year (\d+)/)?.[1] || '';
  const semester = semesterName.match(/Sem (\d+)/)?.[1] || '';
  return `${programCode}Y${year}S${semester}`;
}
