'use client';

import { useState } from 'react';
import SemesterStatus from '@/components/SemesterStatus';
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
} from '@mantine/core';
import { IconSchool } from '@tabler/icons-react';
import { formatSemester } from '@/lib/utils';

type Props = {
  student: NonNullable<Awaited<ReturnType<typeof getStudent>>>;
  showMarks?: boolean;
};

export default function AcademicsView({ student, showMarks }: Props) {
  const [openPrograms, setOpenPrograms] = useState<string[]>([]);
  const [selectedModule, setSelectedModule] = useState<{
    code: string;
    attempts: {
      term: string;
      grade: string;
      semesterNumber: number;
    }[];
  } | null>(null);

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
                  program.semesters.map((semester) => (
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
                          <SemesterStatus status={semester.status} />
                        </Group>

                        <Divider />

                        {semester.studentModules?.length ? (
                          <ModuleTable
                            modules={semester.studentModules.map((sm) => ({
                              id: sm.moduleId,
                              code: sm.module.code,
                              name: sm.module.name,
                              type: sm.module.type,
                              status: sm.status,
                              marks: sm.marks,
                              grade: sm.grade,
                              credits: sm.module.credits,
                            }))}
                            showMarks={showMarks}
                            allSemesters={program.semesters}
                          />
                        ) : (
                          <Text c='dimmed'>
                            No modules found for this semester
                          </Text>
                        )}
                      </Stack>
                    </Paper>
                  ))
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
      module: {
        code: string;
      };
      grade: string;
    }[];
  }[];
};

function ModuleTable({ modules, showMarks, allSemesters }: ModuleTableProps) {
  const getModuleAttempts = (moduleCode: string) => {
    if (!allSemesters) return [];

    return allSemesters
      .filter((sem) =>
        sem.studentModules.some((m) => m.module.code === moduleCode),
      )
      .map((sem) => ({
        term: sem.term,
        semesterNumber: sem.semesterNumber ?? 0,
        grade:
          sem.studentModules.find((m) => m.module.code === moduleCode)?.grade ??
          '',
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

  const renderAttemptHistory = (moduleCode: string) => {
    const attempts = getModuleAttempts(moduleCode);

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
          Module Attempt History
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
                  color={failed(attempt.grade) ? 'red' : 'green'}
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
          <Table.Th w={95}>Code</Table.Th>
          <Table.Th w={270}>Name</Table.Th>
          <Table.Th w={100}>Status</Table.Th>
          <Table.Th>Credits</Table.Th>
          {showMarks && <Table.Th>Marks</Table.Th>}
          <Table.Th>Grade</Table.Th>
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {modules.map((module) => (
          <Table.Tr key={`${module.id}-${module.marks}`}>
            <Table.Td>
              {failed(module.grade) ? (
                <Tooltip
                  label={renderAttemptHistory(module.code)}
                  color='gray'
                  withArrow
                  multiline
                  position='right'
                  transitionProps={{ transition: 'fade', duration: 200 }}
                >
                  <Anchor size='sm'>{module.code}</Anchor>
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
