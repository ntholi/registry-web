'use client';

import SemesterStatus from '@/components/SemesterStatus';
import { ModuleStatus } from '@/db/schema';
import { formatSemester } from '@/lib/utils';
import { getAcademicHistory, getStudent } from '@/server/students/actions';
import { calculateGPA, summarizeModules } from '@/utils/grades';
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
  Text,
  ThemeIcon,
} from '@mantine/core';
import { IconSchool } from '@tabler/icons-react';
import Link from 'next/link';
import { useState } from 'react';
import GpaDisplay from './GpaDisplay';
import SemesterTable from './SemesterTable';
import { useQuery } from '@tanstack/react-query';

type Props = {
  stdNo: number;
  showMarks?: boolean;
  isActive?: boolean;
};

export default function AcademicsView({
  stdNo,
  showMarks,
  isActive = false,
}: Props) {
  const { data: student, isLoading } = useQuery({
    queryKey: ['student', stdNo],
    queryFn: () => getAcademicHistory(stdNo),
    enabled: isActive,
  });

  const [openPrograms, setOpenPrograms] = useState<string[]>(
    student?.programs
      .filter((program) => program.status === 'Active')
      .map((program) => program.id?.toString() ?? '') ?? [],
  );

  if (isLoading) {
    return <Text>Loading...</Text>;
  }

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
                    <Anchor
                      size='0.715rem'
                      c={'gray'}
                      component={Link}
                      href={`/admin/programs?structure=${program.structureId}`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {program.structure.code}
                    </Anchor>
                  </Group>
                </Stack>
              </Group>
            </Accordion.Control>

            <Accordion.Panel>
              <Stack gap='xl'>
                {program.semesters?.length ? (
                  (() => {
                    let cumulativePoints = 0;
                    let cumulativeCreditsForGPA = 0;

                    return program.semesters.map((semester) => {
                      const summary = summarizeModules(
                        semester.studentModules.map((sm) => ({
                          grade: sm.grade,
                          credits: Number(sm.semesterModule.credits),
                          status: (sm as { status?: ModuleStatus }).status,
                        })),
                      );
                      cumulativePoints += summary.points;
                      const semesterCreditsForGPA = semester.studentModules
                        .filter(
                          (sm) => !['Delete', 'Drop'].includes(sm.status || ''),
                        )
                        .filter((sm) => sm.grade && sm.grade !== 'NM')
                        .reduce(
                          (sum, sm) => sum + Number(sm.semesterModule.credits),
                          0,
                        );

                      cumulativeCreditsForGPA += semesterCreditsForGPA;

                      const cumulativeGPA = calculateGPA(
                        cumulativePoints,
                        cumulativeCreditsForGPA,
                      );

                      return (
                        <Paper key={semester.id} p='md' withBorder>
                          <Stack gap='md'>
                            <Flex align='flex-end' justify='space-between'>
                              <Group gap={'xs'} align='flex-end'>
                                <Badge radius={'xs'} variant='default'>
                                  {semester.term}
                                </Badge>
                                <Text size='sm'>
                                  {formatSemester(semester.semesterNumber)}
                                </Text>
                              </Group>
                              <Group gap='md' align='flex-end'>
                                <GpaDisplay
                                  gpa={summary.gpa}
                                  cgpa={cumulativeGPA}
                                />
                                <SemesterStatus status={semester.status} />
                              </Group>
                            </Flex>

                            <Divider />

                            {semester.studentModules?.length ? (
                              <SemesterTable
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
