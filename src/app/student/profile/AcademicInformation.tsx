'use client';
import { formatSemester } from '@/lib/utils';
import {
  Badge,
  Box,
  Card,
  Divider,
  Flex,
  Grid,
  Group,
  Paper,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from '@mantine/core';
import { IconBook, IconCalendar, IconTrophy } from '@tabler/icons-react';
import { getStatusColor } from '../utils/colors';

import { AcademicRemarks } from '@/lib/helpers/students';

type Program = ReturnType<
  typeof import('@/lib/helpers/students').getActiveProgram
>;
type Semester = ReturnType<
  typeof import('@/lib/helpers/students').getCurrentSemester
>;

type Props = {
  program: Program;
  semester: Semester;
  remarks: AcademicRemarks;
};

function InfoItem({
  label,
  value,
  icon,
}: {
  label: string;
  value: string | null | undefined;
  icon?: React.ReactNode;
}) {
  return (
    <Group gap='xs' align='flex-start'>
      {icon && (
        <ThemeIcon variant='light' size='sm' color='gray' mt={2}>
          {icon}
        </ThemeIcon>
      )}
      <Box>
        <Text size='sm' c='dimmed'>
          {label}
        </Text>
        <Text size='sm' fw={500}>
          {value || 'Not available'}
        </Text>
      </Box>
    </Group>
  );
}

export default function AcademicInformation({ program, semester }: Props) {
  if (!program) {
    return (
      <Card withBorder shadow='sm' p='xl' radius='md'>
        <Title order={3} size='h4' mb='lg' fw={500}>
          Academic Information
        </Title>
        <Text c='dimmed' ta='center' py='xl'>
          No active program found
        </Text>
      </Card>
    );
  }

  return (
    <Paper withBorder shadow='sm' p='xl' radius='md'>
      <Flex justify='space-between' align='baseline'>
        <Title order={3} size='h4' mb='lg' fw={500}>
          Academic Information
        </Title>
        <Badge color={getStatusColor(program.status)} variant='light' size='md'>
          {program.status}
        </Badge>
      </Flex>

      <Stack>
        <Box>
          <Group justify='space-between'>
            <Text fw={600}>{program.name}</Text>
          </Group>

          <Text size='sm' c='dimmed' mb='lg'>
            Program Code: {program.code}
          </Text>

          <Grid gutter='lg'>
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <InfoItem label='School' value={program.schoolName} />
            </Grid.Col>

            <Grid.Col span={{ base: 12, sm: 6 }}>
              <InfoItem
                label='Structure ID'
                value={program.structureId?.toString()}
              />
            </Grid.Col>
          </Grid>
        </Box>

        {semester && (
          <>
            <Divider />
            <div>
              <Text size='md' fw={600} mb='md'>
                Current Semester
              </Text>
              <Grid gutter='lg'>
                <Grid.Col span={{ base: 12, sm: 6 }}>
                  <InfoItem
                    label='Semester'
                    value={formatSemester(semester.semesterNumber)}
                    icon={<IconBook size={14} />}
                  />
                </Grid.Col>

                <Grid.Col span={{ base: 12, sm: 6 }}>
                  <InfoItem
                    label='Term'
                    value={semester.term}
                    icon={<IconCalendar size={14} />}
                  />
                </Grid.Col>

                <Grid.Col span={{ base: 12, sm: 6 }}>
                  <Group gap='xs' align='flex-start'>
                    <ThemeIcon variant='light' size='sm' color='gray' mt={2}>
                      <IconTrophy size={14} />
                    </ThemeIcon>
                    <Box>
                      <Text size='sm' c='dimmed'>
                        Status
                      </Text>
                      <Badge
                        color={getStatusColor(semester.status)}
                        variant='dot'
                        size='sm'
                        radius={'xs'}
                      >
                        {semester.status}
                      </Badge>
                    </Box>
                  </Group>
                </Grid.Col>
              </Grid>
            </div>
          </>
        )}
      </Stack>
    </Paper>
  );
}
