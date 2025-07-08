'use client';

import SemesterStatus from '@/components/SemesterStatus';
import { formatSemester } from '@/lib/utils';
import { getStudent } from '@/server/students/actions';
import { getBlockedStudentByStdNo } from '@/server/blocked-students/actions';
import {
  Accordion,
  Anchor,
  Badge,
  Card,
  Divider,
  Flex,
  Group,
  Paper,
  Stack,
  Table,
  Text,
  ThemeIcon,
  Tooltip,
  Box,
  Center,
  useMantineColorScheme,
  useMantineTheme,
} from '@mantine/core';
import { IconSchool, IconLock } from '@tabler/icons-react';
import { useState } from 'react';
import GpaDisplay from './GpaDisplay';

type Props = {
  student: NonNullable<Awaited<ReturnType<typeof getStudent>>>;
  showMarks?: boolean;
  blockedStudent: NonNullable<
    Awaited<ReturnType<typeof getBlockedStudentByStdNo>>
  >;
};

export default function BlockedAcademicsView({
  student,
  showMarks,
  blockedStudent,
}: Props) {
  const [openPrograms, setOpenPrograms] = useState<string[]>(
    student.programs
      .filter((program) => program.status === 'Active')
      .map((program) => program.id?.toString() ?? ''),
  );

  const { colorScheme } = useMantineColorScheme();
  const theme = useMantineTheme();

  const isDark = colorScheme === 'dark';

  const overlayBackground = isDark
    ? 'rgba(0, 0, 0, 0.3)'
    : 'rgba(255, 255, 255, 0.8)';

  if (!student?.programs?.length) {
    return (
      <Card shadow='sm' padding='lg' radius='md' withBorder>
        <Text fw={500} c='dimmed'>
          No academic programs found
        </Text>
      </Card>
    );
  }

  return (
    <Stack gap='md'>
      <Accordion
        variant='separated'
        radius='md'
        multiple
        value={openPrograms}
        onChange={setOpenPrograms}
      >
        {student.programs.map((program) => (
          <Accordion.Item key={program.id} value={program.id?.toString() ?? ''}>
            <Accordion.Control>
              <Group>
                <ThemeIcon variant='light' color='gray' size={'xl'}>
                  <IconSchool size='1.1rem' />
                </ThemeIcon>
                <Stack gap={5}>
                  <Text fw={500}>{program.structure.program.name}</Text>
                  <Group gap={'xs'}>
                    <Badge
                      color={getProgramStatusColor(program.status)}
                      size='xs'
                      variant='transparent'
                    >
                      {program.status}
                    </Badge>
                    <Anchor size='0.715rem' c={'gray'} component='span'>
                      {program.structure.code}
                    </Anchor>
                  </Group>
                </Stack>
              </Group>
            </Accordion.Control>

            <Accordion.Panel>
              <Box pos='relative'>
                <Box
                  style={{
                    filter: 'blur(4px)',
                    opacity: 0.3,
                    pointerEvents: 'none',
                  }}
                >
                  <Stack gap='xl'>
                    {program.semesters?.length ? (
                      program.semesters.map((semester) => (
                        <Paper key={semester.id} p='md' withBorder>
                          <Stack gap='md'>
                            <Flex align='flex-end' justify='space-between'>
                              <Group gap={'xs'} align='flex-end'>
                                <Badge radius={'xs'} variant='default'>
                                  ████████
                                </Badge>
                                <Text size='sm'>████████████</Text>
                              </Group>
                              <Group gap='md' align='flex-end'>
                                <GpaDisplay gpa={0} cgpa={0} />
                                <SemesterStatus status='Active' />
                              </Group>
                            </Flex>

                            <Divider />

                            <BlockedModuleTable
                              moduleCount={semester.studentModules?.length || 3}
                              showMarks={showMarks}
                            />
                          </Stack>
                        </Paper>
                      ))
                    ) : (
                      <Text c='dimmed'>
                        No semesters available for this program
                      </Text>
                    )}
                  </Stack>
                </Box>

                <Box
                  pos='absolute'
                  top={0}
                  left={0}
                  right={0}
                  bottom={0}
                  style={{
                    background: overlayBackground,
                    backdropFilter: 'blur(2px)',
                    display: 'flex',
                    paddingTop: '80px',
                    justifyContent: 'center',
                    zIndex: 10,
                  }}
                >
                  <Stack align='center' gap='md'>
                    <ThemeIcon size={60} color='red' variant='light'>
                      <IconLock size={30} />
                    </ThemeIcon>
                    <Text size='xl' fw={700} c='red'>
                      BLOCKED
                    </Text>
                    <Stack align='center' gap='xs'>
                      <Text size='sm' c='dimmed' ta='center'>
                        Academic records are restricted
                      </Text>
                      <Box
                        style={{
                          borderTop: '1px solid var(--mantine-color-gray-4)',
                          paddingTop: '8px',
                        }}
                      >
                        <Stack align='center' gap={4}>
                          <Text size='xs' fw={500} c='red'>
                            Reason: {blockedStudent.reason}
                          </Text>
                          <Text size='xs' c='dimmed'>
                            Blocked by: {blockedStudent.byDepartment}
                          </Text>
                        </Stack>
                      </Box>
                    </Stack>
                  </Stack>
                </Box>
              </Box>
            </Accordion.Panel>
          </Accordion.Item>
        ))}
      </Accordion>
    </Stack>
  );
}

const getProgramStatusColor = (status: string) => {
  switch (status) {
    case 'Active':
      return 'green';
    case 'Changed':
      return 'blue';
    case 'Completed':
      return 'cyan';
    case 'Deleted':
      return 'red';
    case 'Inactive':
      return 'gray';
    default:
      return 'gray';
  }
};

type BlockedModuleTableProps = {
  moduleCount: number;
  showMarks?: boolean;
};

function BlockedModuleTable({
  moduleCount,
  showMarks,
}: BlockedModuleTableProps) {
  const { colorScheme } = useMantineColorScheme();
  const isDark = colorScheme === 'dark';

  const placeholderChar = isDark ? '░░░░░░░░' : '████████';
  const shortPlaceholderChar = isDark ? '░░' : '██';

  const placeholderModules = Array.from({ length: moduleCount }, (_, i) => ({
    id: i,
    code: placeholderChar,
    name: `${placeholderChar}${placeholderChar}${placeholderChar}`,
    type: placeholderChar,
    status: placeholderChar,
    marks: shortPlaceholderChar,
    grade: shortPlaceholderChar,
    credits: shortPlaceholderChar,
  }));

  return (
    <Table>
      <Table.Thead>
        <Table.Tr>
          <Table.Th w={105}>Code</Table.Th>
          <Table.Th w={270}>Name</Table.Th>
          <Table.Th w={105}>Status</Table.Th>
          <Table.Th w={50}>Cr</Table.Th>
          {showMarks && <Table.Th w={50}>Mk</Table.Th>}
          <Table.Th w={60}>Gd</Table.Th>
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {placeholderModules.map((module, idx) => (
          <Table.Tr key={idx}>
            <Table.Td>
              <Text size='sm'>{module.code}</Text>
            </Table.Td>
            <Table.Td>
              <Text size='sm'>{module.name}</Text>
            </Table.Td>
            <Table.Td>
              <Text size='sm'>{module.status}</Text>
            </Table.Td>
            <Table.Td>
              <Text size='sm'>{module.credits}</Text>
            </Table.Td>
            {showMarks && (
              <Table.Td>
                <Text size='sm'>{module.marks}</Text>
              </Table.Td>
            )}
            <Table.Td>
              <Badge size='sm' variant='light' color='gray'>
                {module.grade}
              </Badge>
            </Table.Td>
          </Table.Tr>
        ))}
      </Table.Tbody>
    </Table>
  );
}
