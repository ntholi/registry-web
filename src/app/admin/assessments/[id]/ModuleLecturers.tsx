'use client';

import { getLecturersByModule } from '@/server/assigned-modules/actions';
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

type Props = {
  moduleId: number;
};

export default function ModuleLecturers({ moduleId }: Props) {
  const { data: lecturers, isLoading } = useQuery({
    queryKey: ['module-lecturers', moduleId],
    queryFn: () => getLecturersByModule(moduleId),
  });

  if (isLoading) {
    return (
      <Group justify='center' py='xl'>
        <Loader />
      </Group>
    );
  }

  if (!lecturers || lecturers.length === 0) {
    return (
      <Card withBorder p='md'>
        <Text c='dimmed' ta='center'>
          No lecturers assigned to this module
        </Text>
      </Card>
    );
  }

  return (
    <SimpleGrid cols={2} mt='md'>
      {lecturers.map((lecturer) => (
        <Card key={lecturer.id} withBorder p='md'>
          <Stack gap='xs'>
            <Group w='100%' style={{ rowGap: '0px', columnGap: '0.5rem' }}>
              <Text fw={500}>{lecturer.name || 'Unknown Lecturer'}</Text>
            </Group>

            <Group gap='xs'>
              {lecturer.position && (
                <Badge variant='light' color='blue'>
                  {lecturer.position}
                </Badge>
              )}
            </Group>
          </Stack>
        </Card>
      ))}
    </SimpleGrid>
  );
}
