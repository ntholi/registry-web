'use client';

import { getModulesByLecturer } from '@/server/assigned-modules/actions';
import { users } from '@/db/schema';
import { useQuery } from '@tanstack/react-query';
import { Badge, Card, Group, Loader, Stack, Text, Title } from '@mantine/core';

type Props = {
  user: NonNullable<typeof users.$inferSelect>;
};

export default function AssignedModules({ user }: Props) {
  const { data: assignedModules, isLoading } = useQuery({
    queryKey: ['assigned-modules', user.id],
    queryFn: () => getModulesByLecturer(user.id),
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
    <Stack gap='md'>
      <Title order={4} fw={500}>
        {assignedModules.length} Assigned Module
        {assignedModules.length !== 1 ? 's' : ''}
      </Title>

      <Stack gap='sm'>
        {assignedModules.map((assignment) => (
          <Card key={assignment.id} withBorder p='md'>
            <Group justify='space-between' wrap='nowrap'>
              <Stack gap='xs'>
                <Group gap='xs'>
                  <Text fw={500}>
                    {assignment.semesterModule?.module?.name ||
                      'Unknown Module'}
                  </Text>
                  <Text size='sm' c='dimmed'>
                    ({assignment.semesterModule?.module?.code || 'N/A'})
                  </Text>
                </Group>

                <Group gap='xs'>
                  {assignment.semesterModule?.semester?.name && (
                    <Badge variant='light' color='blue'>
                      {assignment.semesterModule.semester.name}
                    </Badge>
                  )}
                  {assignment.semesterModule?.semester?.structure?.program && (
                    <Badge variant='outline'>
                      {
                        assignment.semesterModule.semester.structure.program
                          .name
                      }
                    </Badge>
                  )}
                </Group>
              </Stack>
            </Group>
          </Card>
        ))}
      </Stack>
    </Stack>
  );
}
