'use client';
import { formatSemester } from '@/lib/utils';
import {
  Card,
  Grid,
  Group,
  Text,
  Title,
  Badge,
  Stack,
  Divider,
  ThemeIcon,
  Box,
} from '@mantine/core';
import {
  IconBook,
  IconSchool,
  IconCalendar,
  IconTrophy,
  IconUser,
} from '@tabler/icons-react';
import { studentColors, getStatusColor } from '../utils/colors';

import { Student, AcademicRemarks } from '@/lib/helpers/students';

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

export default function AcademicInformation({
  program,
  semester,
  remarks,
}: Props) {
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
    <Card withBorder shadow='sm' p='xl' radius='md'>
      <Title order={3} size='h4' mb='lg' fw={500}>
        Academic Information
      </Title>

      <Stack gap='xl'>
        <div>
          <Group justify='space-between' mb='md'>
            <Text size='lg' fw={600}>
              {program.structure.program.name}
            </Text>
            <Badge
              color={getStatusColor(program.status)}
              variant='light'
              size='md'
            >
              {program.status}
            </Badge>
          </Group>

          <Text size='sm' c='dimmed' mb='lg'>
            Program Code: {program.structure.program.code}
          </Text>

          <Grid gutter='lg'>
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <InfoItem
                label='School'
                value={program.schoolName}
                icon={<IconSchool size={14} />}
              />
            </Grid.Col>

            <Grid.Col span={{ base: 12, sm: 6 }}>
              <InfoItem
                label='Structure ID'
                value={program.structureId?.toString()}
                icon={<IconBook size={14} />}
              />
            </Grid.Col>
          </Grid>
        </div>

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
                        variant='light'
                        size='sm'
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

        {remarks && (
          <>
            <Divider />
            <div>
              <Text size='md' fw={600} mb='md'>
                Academic Status
              </Text>
              <Badge
                color={
                  remarks.status === 'Proceed'
                    ? 'green'
                    : remarks.status === 'Remain in Semester'
                      ? 'yellow'
                      : 'gray'
                }
                variant='light'
                size='lg'
              >
                {remarks.status}
              </Badge>
              {remarks.failedModules.length > 0 && (
                <div style={{ marginTop: '1rem' }}>
                  <Text size='sm' c='dimmed' mb='xs'>
                    Failed Modules: {remarks.failedModules.length}
                  </Text>
                </div>
              )}
            </div>
          </>
        )}
      </Stack>
    </Card>
  );
}
