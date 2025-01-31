'use client';

import { useState, useMemo, useCallback } from 'react';
import SemesterStatus from '@/components/SemesterStatus';
import { getStudent } from '@/server/students/actions';
import {
  Accordion,
  Badge,
  Card,
  Divider,
  Group,
  Paper,
  Stack,
  Table,
  Text,
  ThemeIcon,
  Title,
  Anchor,
} from '@mantine/core';
import { IconSchool } from '@tabler/icons-react';

type Props = {
  student: Awaited<ReturnType<typeof getStudent>>;
};

export default function AcademicsView({ student }: Props) {
  const [openPrograms, setOpenPrograms] = useState<string[]>([]);

  const moduleLocations = useMemo(() => {
    const locations: Record<
      string,
      Array<{ programId: string; moduleId: number }>
    > = {};

    student?.programs.forEach((program) => {
      program.semesters?.forEach((semester) => {
        semester.modules?.forEach((module) => {
          if (!locations[module.code]) {
            locations[module.code] = [];
          }
          locations[module.code].push({
            programId: program.id?.toString() ?? '',
            moduleId: module.id,
          });
        });
      });
    });

    return locations;
  }, [student?.programs]);

  const scrollToModule = useCallback(
    (moduleId: number, programId: string) => {
      if (!openPrograms.includes(programId)) {
        setOpenPrograms((prev) => [...prev, programId]);
        setTimeout(() => {
          const element = document.querySelector(
            `[data-module-id="${moduleId}"]`
          );
          element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 300);
      } else {
        const element = document.querySelector(
          `[data-module-id="${moduleId}"]`
        );
        element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    },
    [openPrograms]
  );

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
                  <Text fw={500}>{program.name}</Text>
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
                          <Title order={4} size={'1rem'}>
                            {semester.term}
                          </Title>
                          <SemesterStatus status={semester.status} />
                        </Group>

                        <Divider />

                        {semester.modules?.length ? (
                          <ModuleTable
                            modules={semester.modules}
                            moduleLocations={moduleLocations}
                            onModuleClick={(moduleId, code) => {
                              const locations = moduleLocations[code];
                              if (!locations || locations.length <= 1) return;

                              const currentIndex = locations.findIndex(
                                (loc) => loc.moduleId === moduleId
                              );

                              const nextLocation =
                                locations[
                                  (currentIndex + 1) % locations.length
                                ];

                              scrollToModule(
                                nextLocation.moduleId,
                                nextLocation.programId
                              );
                            }}
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
  moduleLocations: Record<
    string,
    Array<{ programId: string; moduleId: number }>
  >;
  onModuleClick: (moduleId: number, code: string) => void;
};

function ModuleTable({
  modules,
  moduleLocations,
  onModuleClick,
}: ModuleTableProps) {
  return (
    <Table verticalSpacing='xs'>
      <Table.Thead>
        <Table.Tr>
          <Table.Th w={95}>Code</Table.Th>
          <Table.Th>Name</Table.Th>
          <Table.Th w={100}>Status</Table.Th>
          <Table.Th w={62}>Marks</Table.Th>
          <Table.Th w={60}>Grade</Table.Th>
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {modules.map((module) => (
          <Table.Tr key={module.id} data-module-id={module.id}>
            <Table.Td>
              {moduleLocations[module.code].length > 1 ? (
                <Anchor
                  size='sm'
                  onClick={() => onModuleClick(module.id, module.code)}
                >
                  {module.code}
                </Anchor>
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
              <Text size='sm'>{module.marks}</Text>
            </Table.Td>
            <Table.Td>
              <Badge
                size='sm'
                variant='light'
                color={
                  module.grade === 'F' || module.grade === 'NM'
                    ? 'red'
                    : module.grade === 'D'
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
