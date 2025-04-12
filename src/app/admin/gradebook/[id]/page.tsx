import { getLecturesModule } from '@/server/lecturer-modules/actions';
import {
  Box,
  Container,
  Paper,
  Title,
  Text,
  Group,
  Divider,
  Badge,
  Card,
  Stack,
} from '@mantine/core';
import { notFound } from 'next/navigation';
import StudentTable from './StudentTable';
import { IconCalendar, IconBook, IconUserCheck } from '@tabler/icons-react';

type Props = {
  params: Promise<{ id: string }>;
};

export default async function GradebookModuleView({ params }: Props) {
  const { id } = await params;
  const lecturesModule = await getLecturesModule(Number(id));

  if (!lecturesModule) {
    return notFound();
  }

  return (
    <Container size='xl' p='md'>
      <Card withBorder radius='md' shadow='sm' p='lg' mb='lg'>
        <Group justify='space-between' wrap='nowrap'>
          <Stack gap='xs'>
            <Group gap='xs'>
              <IconBook size={20} stroke={1.5} />
              <Title order={2} fw={600}>
                {lecturesModule.semesterModule.name}
              </Title>
              <Badge size='lg' variant='light'>
                {lecturesModule.semesterModule.code}
              </Badge>
            </Group>

            <Group gap='md'>
              <Group gap='xs'>
                <IconCalendar size={16} stroke={1.5} />
                <Text size='sm' c='dimmed'>
                  {lecturesModule.semesterModule.semesterId
                    ? 'Current Semester'
                    : 'No Semester Assigned'}
                </Text>
              </Group>

              <Group gap='xs'>
                <IconUserCheck size={16} stroke={1.5} />
                <Text size='sm' c='dimmed'>
                  Students Enrolled
                </Text>
              </Group>
            </Group>
          </Stack>
        </Group>
      </Card>

      <Paper withBorder radius='md' shadow='sm' p='lg'>
        <Title order={4} fw={500} mb='md'>
          Student Gradebook
        </Title>
        <Divider mb='lg' />
        <Box>
          <StudentTable semesterModuleId={lecturesModule.semesterModule.id} />
        </Box>
      </Paper>
    </Container>
  );
}
