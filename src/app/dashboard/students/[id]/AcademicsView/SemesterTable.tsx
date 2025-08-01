'use client';

import { formatSemester } from '@/lib/utils';
import { isFailingOrSupGrade as failed } from '@/utils/grades';
import {
  Anchor,
  Badge,
  Card,
  Group,
  Stack,
  Table,
  Text,
  Tooltip,
  useComputedColorScheme,
} from '@mantine/core';

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

export default function SemesterTable({
  modules,
  showMarks,
  allSemesters,
}: ModuleTableProps) {
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
        {modules.map((module, idx) => (
          <Table.Tr
            key={`${module.id}-${module.marks}-${module.status}-${idx}`}
          >
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
                    : module.grade === 'NM' || module.grade === 'Def'
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
