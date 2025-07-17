'use client';

import SemesterStatus from '@/components/SemesterStatus';
import { StudentModuleStatus } from '@/db/schema';
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
  Skeleton,
  Stack,
  Text,
  ThemeIcon,
} from '@mantine/core';
import { IconSchool } from '@tabler/icons-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
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
  const [openPrograms, setOpenPrograms] = useState<string[]>();

  useEffect(() => {
    setOpenPrograms(
      student?.programs
        .filter((program) => program.status === 'Active')
        .map((program) => program.id?.toString() ?? '') ?? [],
    );
  }, [student]);

  if (isLoading) {
    return <Loader />;
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
                      const summary = summarizeModules(semester.studentModules);
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

function Loader() {
  return (
    <Stack gap='md'>
      <Accordion variant='separated' value={['0']} radius='md' multiple>
        {Array.from({ length: 1 }).map((_, index) => (
          <Accordion.Item key={index} value={index.toString()}>
            <Accordion.Control>
              <Group>
                <Skeleton height={40} width={40} radius='md' />
                <Stack gap={5}>
                  <Skeleton height={20} width={250} radius='sm' />
                  <Group gap='xs'>
                    <Skeleton height={16} width={60} radius='sm' />
                    <Skeleton height={16} width={80} radius='sm' />
                  </Group>
                </Stack>
              </Group>
            </Accordion.Control>
            <Accordion.Panel>
              <Stack gap='xl'>
                {Array.from({ length: 3 }).map((_, semIndex) => (
                  <Paper key={semIndex} p='md' withBorder>
                    <Stack gap='md'>
                      <Flex align='flex-end' justify='space-between'>
                        <Group gap='xs' align='flex-end'>
                          <Skeleton height={20} width={80} radius='xs' />
                          <Skeleton height={16} width={100} radius='sm' />
                        </Group>
                        <Group gap='md' align='flex-end'>
                          <Stack gap={4} align='flex-end'>
                            <Skeleton height={14} width={60} radius='sm' />
                            <Skeleton height={14} width={70} radius='sm' />
                          </Stack>
                          <Skeleton height={20} width={80} radius='sm' />
                        </Group>
                      </Flex>
                      <Divider />
                      <Stack gap='xs'>
                        {Array.from({ length: 4 }).map((_, moduleIndex) => (
                          <Group
                            key={moduleIndex}
                            justify='space-between'
                            p='xs'
                          >
                            <Group gap='md' style={{ flex: 1 }}>
                              <Skeleton height={16} width={80} radius='sm' />
                              <Skeleton height={16} width={200} radius='sm' />
                              <Skeleton height={16} width={60} radius='sm' />
                            </Group>
                            <Group gap='md'>
                              <Skeleton height={16} width={40} radius='sm' />
                              <Skeleton height={16} width={30} radius='sm' />
                              <Skeleton height={16} width={50} radius='sm' />
                            </Group>
                          </Group>
                        ))}
                      </Stack>
                    </Stack>
                  </Paper>
                ))}
              </Stack>
            </Accordion.Panel>
          </Accordion.Item>
        ))}
      </Accordion>
    </Stack>
  );
}

export const getProgramStatusColor = (status: string) => {
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
