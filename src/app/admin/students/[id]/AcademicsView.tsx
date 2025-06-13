'use client';

import SemesterStatus from '@/components/SemesterStatus';
import { formatSemester } from '@/lib/utils';
import { getStudent } from '@/server/students/actions';
import {
  Accordion,
  Anchor,
  Badge,
  Card,
  Divider,
  Group,
  Paper,
  Stack,
  Table,
  Text,
  ThemeIcon,
  Tooltip,
  useComputedColorScheme,
} from '@mantine/core';
import { IconSchool } from '@tabler/icons-react';
import { useState } from 'react';
import { summarizeModules, calculateGPA } from '@/utils/grades';
import { ModuleStatus } from '@/db/schema';

type Props = {
  student: NonNullable<Awaited<ReturnType<typeof getStudent>>>;
  showMarks?: boolean;
};

export default function AcademicsView({ student, showMarks }: Props) {
  const [openPrograms, setOpenPrograms] = useState<string[]>(
    student.programs
      .filter((program) => program.status === 'Active')
      .map((program) => program.id?.toString() ?? ''),
  );

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
                  </Group>
                </Stack>
              </Group>
            </Accordion.Control>

            <Accordion.Panel>
              <Stack gap='xl'>
                {program.semesters?.length ? (
                  (() => {
                    let cumulativePoints = 0;
                    let cumulativeCreditsAttempted = 0;

                    return program.semesters.map((semester) => {
                      const summary = summarizeModules(
                          semester.studentModules.map((sm) => ({
                            grade: sm.grade,
                            credits: Number(sm.semesterModule.credits),
                            status: (sm as { status?: ModuleStatus }).status,
                          })),
                        );

                      cumulativePoints += summary.points;
                      cumulativeCreditsAttempted += summary.creditsCompleted;

                      const cumulativeGPA = calculateGPA(
                        cumulativePoints,
                        cumulativeCreditsAttempted,
                      );

                      return (
                        <Paper key={semester.id} p='md' withBorder>
                          <Stack gap='md'>
                            <Group justify='space-between'>
                              <Group gap={'xs'}>
                                <Badge radius={'xs'} variant='default'>
                                  {semester.term}
                                </Badge>
                                <Text size='sm'>
                                  {formatSemester(semester.semesterNumber)}
                                </Text>
                              </Group>
                              <Group gap='md'>
                                <Text size='sm' fw={500}>
                                  GPA: {summary.gpa.toFixed(2)}
                                </Text>
                                <Text size='sm' fw={500}>
                                  CGPA: {cumulativeGPA.toFixed(2)}
                                </Text>
                                <SemesterStatus status={semester.status} />
                              </Group>
                            </Group>

                            <Divider />

                            {semester.studentModules?.length ? (
                              <ModuleTable
                                modules={semester.studentModules.map((sm) => ({
                                  id: sm.semesterModuleId,
                                  code:
                                    sm.semesterModule.module?.code ??
                                    `${sm.semesterModuleId}`,
                                  name:
                                    sm.semesterModule.module?.name ??
                                    `<<Semester Module ID: ${sm.semesterModuleId}>>`,
                                  type: sm.semesterModule.type,
                                  status: sm.status,
                                  marks: sm.marks,
                                  grade: sm.grade,
                                  credits: sm.semesterModule.credits,
                                }))}
                                showMarks={showMarks}
                                allSemesters={program.semesters.map((sem) => ({
                                  term: sem.term,
                                  semesterNumber: sem.semesterNumber ?? 0,
                                  studentModules: sem.studentModules.map(
                                    (m) => ({
                                      semesterModule: {
                                        module: {
                                          code:
                                            m.semesterModule.module?.code ?? '',
                                        },
                                      },
                                      grade: m.grade,
                                    }),
                                  ),
                                }))}
                              />
                            ) : (
                              <Text c='dimmed'>
                                No modules found for this semester
                              </Text>
                            )}
                          </Stack>
                        </Paper>
                      );
                    });
                  })()
                ) : (
                  <Text c='dimmed'>
                    No semesters available for this program
                  </Text>
                )}
              </Stack>
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

type ModuleTableProps = {
  modules: {
    id: number;
    code: string;
    name: string;
    type: string;
    status: string;
    marks: string;
    grade: string;
    credits: number;
  }[];
  showMarks?: boolean;
  allSemesters?: {
    term: string;
    semesterNumber: number | null;
    studentModules: {
      semesterModule: {
        module: {
          code: string;
        };
      };
      grade: string;
    }[];
  }[];
};

function ModuleTable({ modules, showMarks, allSemesters }: ModuleTableProps) {
  const colorScheme = useComputedColorScheme('dark');

  const getModulesWithFailHistory = (moduleCode: string) => {
    if (!allSemesters) return false;

    const attempts = allSemesters
      .filter((sem) =>
        sem.studentModules.some(
          (m) => m.semesterModule.module.code === moduleCode,
        ),
      )
      .map((sem) => ({
        grade:
          sem.studentModules.find(
            (m) => m.semesterModule.module.code === moduleCode,
          )?.grade ?? '',
      }));

    return attempts.some((attempt) => failed(attempt.grade));
  };

  const modulesWithFailHistory = modules
    .filter((module) => getModulesWithFailHistory(module.code))
    .map((module) => module.code);

  const getModuleAttempts = (moduleCode: string) => {
    if (!allSemesters) return [];

    return allSemesters
      .filter((sem) =>
        sem.studentModules.some(
          (m) => m.semesterModule.module.code === moduleCode,
        ),
      )
      .map((sem) => ({
        term: sem.term,
        semesterNumber: sem.semesterNumber ?? 0,
        grade:
          sem.studentModules.find(
            (m) => m.semesterModule.module.code === moduleCode,
          )?.grade ?? '',
      }))
      .sort((a, b) => {
        const [yearA, monthA] = a.term.split('-').map(Number);
        const [yearB, monthB] = b.term.split('-').map(Number);
        if (yearA !== yearB) {
          return yearA - yearB;
        }
        return monthA - monthB;
      });
  };

  const renderAttemptHistory = (module: ModuleTableProps['modules'][0]) => {
    const attempts = getModuleAttempts(module.code);

    if (attempts.length <= 1) {
      return (
        <Stack p='md'>
          <Text size='sm' c='red'>
            Did not Repeat
          </Text>
        </Stack>
      );
    }

    return (
      <Stack p='xs' gap='md'>
        <Text fw={500} size='sm'>
          {module.name}
        </Text>
        <Stack gap='xs'>
          {attempts.map((attempt, index) => (
            <Card key={index} p='xs' withBorder>
              <Group justify='space-between' gap='xl'>
                <Stack gap={2}>
                  <Text size='sm' fw={500}>
                    {attempt.term}
                  </Text>
                  <Text size='xs' c='dimmed'>
                    {attempt.semesterNumber
                      ? formatSemester(attempt.semesterNumber)
                      : ''}
                  </Text>
                </Stack>
                <Badge
                  size='md'
                  variant='light'
                  color={
                    failed(attempt.grade)
                      ? 'red'
                      : attempt.grade === 'NM'
                        ? 'orange'
                        : 'green'
                  }
                >
                  {attempt.grade}
                </Badge>
              </Group>
            </Card>
          ))}
        </Stack>
      </Stack>
    );
  };

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
        {modules.map((module) => (
          <Table.Tr key={`${module.id}-${module.marks}-${module.status}`}>
            <Table.Td>
              {modulesWithFailHistory.includes(module.code) ? (
                <Tooltip
                  label={renderAttemptHistory(module)}
                  color={colorScheme}
                  withArrow
                  multiline
                  transitionProps={{ transition: 'fade', duration: 200 }}
                >
                  <Anchor size='sm' c={failed(module.grade) ? 'red' : 'blue'}>
                    {module.code}
                  </Anchor>
                </Tooltip>
              ) : (
                <Text size='sm'>{module.code}</Text>
              )}
            </Table.Td>
            <Table.Td>
              <Text size='sm'>{module.name}</Text>
            </Table.Td>
            <Table.Td>
              <Text
                size='sm'
                c={
                  ['Drop', 'Delete'].includes(module.status) ? 'red' : undefined
                }
              >
                {module.status}
              </Text>
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
              <Badge
                size='sm'
                variant='light'
                color={
                  failed(module.grade)
                    ? 'red'
                    : module.grade === 'NM'
                      ? 'orange'
                      : 'green'
                }
              >
                {module.grade}
              </Badge>
            </Table.Td>
          </Table.Tr>
        ))}
      </Table.Tbody>
    </Table>
  );
}

function failed(grade: string) {
  return [
    'F',
    'X',
    'GNS',
    'ANN',
    'FIN',
    'FX',
    'DNC',
    'DNA',
    'PP',
    'DNS',
  ].includes(grade);
}
