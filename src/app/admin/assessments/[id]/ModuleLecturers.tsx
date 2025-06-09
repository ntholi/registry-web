'use client';

import { toTitleCase } from '@/lib/utils';
import { getLecturersByModule } from '@/server/assigned-modules/actions';
import {
  Avatar,
  Badge,
  Card,
  Group,
  Loader,
  SimpleGrid,
  Stack,
  Text,
  Title,
  Box,
  ThemeIcon,
} from '@mantine/core';
import { IconUser, IconUsers, IconSchool } from '@tabler/icons-react';
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
      <Card withBorder shadow='sm' radius='md' p='xl'>
        <Group justify='center' py='xl'>
          <Stack align='center' gap='md'>
            <Loader size='lg' type='dots' />
            <Text c='dimmed' size='sm'>
              Loading lecturers...
            </Text>
          </Stack>
        </Group>
      </Card>
    );
  }
  if (!lecturers || lecturers.length === 0) {
    return (
      <Card withBorder shadow='sm' radius='md' p='xl'>
        <Stack align='center' gap='lg'>
          <ThemeIcon size={60} radius='xl' variant='light' color='gray'>
            <IconUsers size={30} />
          </ThemeIcon>
          <Stack gap='xs' align='center'>
            <Text fw={500} size='lg'>
              No Lecturers Assigned
            </Text>
            <Text c='dimmed' ta='center' size='sm'>
              This module doesn't have any lecturers assigned yet
            </Text>
          </Stack>
        </Stack>
      </Card>
    );
  }

  return (
    <SimpleGrid
      cols={{ base: 1, sm: 2, lg: 3 }}
      spacing='md'
      verticalSpacing='md'
    >
      {lecturers.map((lecturer) => (
        <Card key={lecturer.id} withBorder shadow='sm' p='sm'>
          <Stack gap='xs'>
            <Group gap='md' align='flex-start'>
              <Avatar
                size='lg'
                radius='xl'
                color='blue'
                variant='filled'
                src={lecturer.image}
              />

              <Box style={{ flex: 1 }}>
                <Text fw={600} size='lg' lineClamp={1}>
                  {lecturer.name || 'Unknown Lecturer'}
                </Text>

                {lecturer.position && (
                  <Text c='dimmed' size='sm'>
                    {toTitleCase(lecturer.position)}
                  </Text>
                )}
              </Box>
            </Group>
          </Stack>
        </Card>
      ))}
    </SimpleGrid>
  );
}
