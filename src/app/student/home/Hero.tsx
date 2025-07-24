'use client';
import useUserStudent from '@/hooks/use-user-student';
import { formatSemester } from '@/lib/utils';
import {
  Avatar,
  Divider,
  Grid,
  Group,
  Paper,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { IconUser } from '@tabler/icons-react';

export default function Header() {
  const { student, program, semester, remarks } = useUserStudent();
  return (
    <Paper shadow='sm' p='xl' radius='md' withBorder>
      <Stack gap='xl'>
        <Group gap='lg'>
          <Avatar size={60} radius='sm' color='gray' variant='filled'>
            <IconUser size='1.8rem' />
          </Avatar>
          <Stack gap={4} flex={1}>
            <Title order={2} size='h3' fw={600} lh={1.2}>
              {student?.name}
            </Title>
            <Text size='sm' c='dimmed' fw={500}>
              {student?.stdNo}
            </Text>
          </Stack>
        </Group>

        <Divider />

        <Stack gap='lg'>
          <Group justify='space-between'>
            <Stack gap={2}>
              <Text size='xs' c='dimmed' tt='uppercase' fw={600} lts={0.5}>
                Course of Study
              </Text>
              <Text size='sm' fw={500}>
                {program?.name}
              </Text>
              <Text size='xs' c='dimmed'>
                {program?.schoolName}
              </Text>
            </Stack>
          </Group>

          <Grid gutter='xl'>
            <Grid.Col span={{ base: 12, xs: 4 }}>
              <Stack gap={4} ta='center'>
                <Text size='xs' c='dimmed' tt='uppercase' fw={600} lts={0.5}>
                  Year
                </Text>
                <Text size='lg' fw={600}>
                  {formatSemester(semester?.semesterNumber)}
                </Text>
              </Stack>
            </Grid.Col>

            <Grid.Col span={{ base: 6, xs: 4 }}>
              <Stack gap={4} ta='center'>
                <Text size='xs' c='dimmed' tt='uppercase' fw={600} lts={0.5}>
                  CGPA
                </Text>
                <Text size='lg' fw={600}>
                  {remarks.latestPoints.cgpa.toFixed(2)}
                </Text>
              </Stack>
            </Grid.Col>

            <Grid.Col span={{ base: 6, xs: 4 }}>
              <Stack gap={4} ta='center'>
                <Text size='xs' c='dimmed' tt='uppercase' fw={600} lts={0.5}>
                  Credits
                </Text>
                <Text size='lg' fw={600}>
                  {remarks.latestPoints.creditsCompleted}
                </Text>
              </Stack>
            </Grid.Col>
          </Grid>
        </Stack>
      </Stack>
    </Paper>
  );
}
