import { Card, Group, Stack, Title, Badge, Text } from '@mantine/core';
import { IconBook, IconCalendar, IconUserCheck } from '@tabler/icons-react';

type ModuleDetailsCardProps = {
  module: {
    name: string;
    code: string;
    semesterId: number | null;
    id: number;
  };
  studentsCount?: number;
};

export default function ModuleDetailsCard({
  module,
  studentsCount,
}: ModuleDetailsCardProps) {
  return (
    <Card withBorder radius='md' shadow='sm' p='lg' mb='lg'>
      <Group justify='space-between' wrap='nowrap'>
        <Stack gap='xs'>
          <Group gap='xs'>
            <IconBook size={20} stroke={1.5} />
            <Title order={2} fw={600}>
              {module.name}
            </Title>
          </Group>

          <Group gap='md'>
            <Group gap='xs'>
              <IconCalendar size={16} stroke={1.5} />
              <Text size='sm' c='dimmed'>
                {module.semesterId
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
    </Card>
  );
}
