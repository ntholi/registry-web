import { getAssignedModuleByUserAndModule } from '@/server/assigned-modules/actions';
import { Paper, Group, Stack, Text, Title } from '@mantine/core';
import { IconBook, IconCalendar, IconUserCheck } from '@tabler/icons-react';

type ModuleDetailsCardProps = {
  module: NonNullable<
    Awaited<ReturnType<typeof getAssignedModuleByUserAndModule>>
  >;
  studentsCount?: number;
};

export default function ModuleDetailsCard({
  module,
  studentsCount,
}: ModuleDetailsCardProps) {
  return (
    <Paper withBorder p='lg' mb='lg'>
      <Group justify='space-between' wrap='nowrap'>
        <Stack gap='xs'>
          <Group gap='xs'>
            <Title order={2} fw={100}>
              {module.semesterModule.module!.name}
            </Title>
          </Group>

          <Group gap='md'>
            <Group gap='xs'>
              <IconCalendar size={16} stroke={1.5} />
              <Text size='sm' c='dimmed'>
                {module.semesterModule.semesterId
                  ? 'Current Semester'
                  : 'No Semester Assigned'}
              </Text>
            </Group>

            <Group gap='xs'>
              <IconUserCheck size={16} stroke={1.5} />
              <Text size='sm' c='dimmed'>
                {studentsCount !== undefined
                  ? `${studentsCount} Students Enrolled`
                  : 'Students Enrolled'}
              </Text>
            </Group>
          </Group>
        </Stack>
      </Group>
    </Paper>
  );
}
