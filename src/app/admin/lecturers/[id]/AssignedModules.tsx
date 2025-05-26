'use client';

import { users } from '@/db/schema';
import { toClassName } from '@/lib/utils';
import { getAssignedModulesByUser } from '@/server/assigned-modules/actions';
import {
  Badge,
  Card,
  Group,
  Loader,
  SimpleGrid,
  Stack,
  Text,
} from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import DeleteModuleButton from './DeleteModuleButton';

type Props = {
  user: NonNullable<typeof users.$inferSelect>;
};

export default function AssignedModules({ user }: Props) {
  const { data: assignedModules, isLoading } = useQuery({
    queryKey: ['assigned-modules', user.id],
    queryFn: () => getAssignedModulesByUser(user.id),
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
        <Card key={assignment.id} withBorder p='md' pos='relative'>
          <DeleteModuleButton
            assignmentId={assignment.id}
            moduleName={
              assignment.semesterModule?.module?.name || 'Unknown Module'
            }
            userId={user.id}
            pos='absolute'
            top={3}
            right={3}
          />
          <Stack gap='xs'>
            <Group w='100%'>
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
        </Card>
      ))}
    </SimpleGrid>
  );
}
