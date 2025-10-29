'use client';

import { formatSemester } from '@/lib/utils';
import { getStructure } from '@/server/structures/actions';
import {
  Box,
  Breadcrumbs,
  Card,
  Flex,
  Group,
  Paper,
  Skeleton,
  Stack,
  Table,
  Text,
  ThemeIcon,
  Title,
} from '@mantine/core';
import {
  IconArrowLeft,
  IconBook,
  IconChevronRight,
  IconSchool,
} from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { Session } from 'next-auth';
import { useSession } from 'next-auth/react';
import Link from '@/components/Link';
import { useParams } from 'next/navigation';
import EditButton from './EditButton';
import HideButton from './HideButton';
import PrerequisiteDisplay from './PrerequisiteDisplay';

export default function StructureDetailsPage() {
  const params = useParams();
  const structureId = Number(params.id);
  const { data: session } = useSession();

  const { data: structure, isLoading } = useQuery({
    queryKey: ['structure', structureId],
    queryFn: () => getStructure(structureId),
    enabled: !!structureId && !isNaN(structureId),
  });

  if (isLoading) {
    return (
      <Box p='lg'>
        <Stack gap='lg'>
          <Skeleton height={40} width='60%' />
          <Skeleton height={100} />
          {[1, 2, 3].map((i) => (
            <Paper key={i} shadow='sm' p='md' radius='md' withBorder>
              <Stack gap='md'>
                <Skeleton height={30} width='40%' />
                <Skeleton height={200} />
              </Stack>
            </Paper>
          ))}
        </Stack>
      </Box>
    );
  }

  if (!structure) {
    return (
      <Box p='lg'>
        <Paper shadow='sm' p='xl' withBorder>
          <Stack align='center' gap='xs'>
            <IconSchool size={48} />
            <Text size='lg' fw={500}>
              Structure Not Found
            </Text>
            <Text size='sm' c='dimmed' ta='center'>
              The requested program structure could not be found.
            </Text>
            <Link href='/dashboard/schools'>
              <Group gap='xs'>
                <IconArrowLeft size={16} />
                <Text size='sm'>Back to Schools</Text>
              </Group>
            </Link>
          </Stack>
        </Paper>
      </Box>
    );
  }

  const breadcrumbItems = [
    { title: 'Schools', href: '/dashboard/schools' },
    {
      title: structure.program?.school?.name || 'School',
      href: `/dashboard/schools/structures?schoolId=${structure.program?.school?.id}`,
    },
    {
      title: structure.program?.name || 'Program',
      href: `/dashboard/schools/structures?schoolId=${structure.program?.school?.id}`,
    },
  ].map((item, index) => (
    <Link
      key={index}
      href={item.href}
      size='sm'
      c={index === 2 ? 'gray' : 'dimmed'}
    >
      {item.title}
    </Link>
  ));

  return (
    <Box p='lg'>
      <Stack gap='lg'>
        <Paper shadow='sm' p='md' withBorder>
          <Stack gap='md'>
            <Breadcrumbs separator={<IconChevronRight size={14} />}>
              {breadcrumbItems}
            </Breadcrumbs>

            <Group>
              <ThemeIcon variant='light' color='gray' size='xl'>
                <IconBook size='1.1rem' />
              </ThemeIcon>
              <Box>
                <Group gap='md' align='baseline'>
                  <Title order={2}>{structure.code}</Title>
                </Group>
              </Box>
            </Group>
          </Stack>
        </Paper>

        <Stack gap='lg'>
          {structure.semesters?.map((semester) => (
            <Paper key={semester.id} shadow='sm' p='md' radius='md' withBorder>
              <Stack gap='md'>
                <Group justify='space-between' align='center'>
                  <Group gap='xs'>
                    <Title order={5} fw={500}>
                      {formatSemester(semester.semesterNumber)}
                    </Title>
                  </Group>
                  <Text size='sm' c='dimmed'>
                    {semester.semesterModules?.length || 0} modules
                  </Text>
                </Group>

                {semester.semesterModules &&
                semester.semesterModules.length > 0 ? (
                  <Table withTableBorder withColumnBorders>
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th w={120}>Code</Table.Th>
                        <Table.Th w={330}>Name</Table.Th>
                        <Table.Th w={120}>Type</Table.Th>
                        <Table.Th w={100}>Credits</Table.Th>
                        <Table.Th w={400}>Prerequisites</Table.Th>
                        {session?.user?.role === 'admin' && (
                          <Table.Th w={100}>Actions</Table.Th>
                        )}
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {semester.semesterModules.map((semModule) => (
                        <Table.Tr
                          key={semModule.id}
                          className={
                            semModule.hidden ? 'bg-yellow-50/20' : undefined
                          }
                        >
                          <Table.Td>
                            <Link
                              size='sm'
                              href={`/dashboard/semester-modules/${semModule.id}`}
                              c={semModule.hidden ? 'dark' : undefined}
                            >
                              {semModule.module?.code}
                            </Link>
                          </Table.Td>
                          <Table.Td>
                            <Text
                              size='sm'
                              c={semModule.hidden ? 'dark' : undefined}
                            >
                              {semModule.module?.name}
                            </Text>
                          </Table.Td>
                          <Table.Td>
                            <Text
                              size='sm'
                              c={semModule.hidden ? 'dark' : undefined}
                            >
                              {semModule.type}
                            </Text>
                          </Table.Td>
                          <Table.Td>
                            <Text
                              size='sm'
                              c={semModule.hidden ? 'dark' : undefined}
                            >
                              {semModule.credits}
                            </Text>
                          </Table.Td>
                          <Table.Td>
                            <PrerequisiteDisplay
                              prerequisites={semModule.prerequisites}
                              hidden={semModule.hidden}
                            />
                          </Table.Td>
                          {canEditModule(session) && (
                            <Table.Td>
                              <Flex gap='xs'>
                                <EditButton
                                  moduleId={semModule.id}
                                  structureId={structureId}
                                />
                                <HideButton
                                  moduleId={semModule.id}
                                  hidden={semModule.hidden}
                                  structureId={structureId}
                                />
                              </Flex>
                            </Table.Td>
                          )}
                        </Table.Tr>
                      ))}
                    </Table.Tbody>
                  </Table>
                ) : (
                  <Card withBorder variant='light' p='md'>
                    <Text size='sm' c='dimmed' ta='center'>
                      No modules found for this semester
                    </Text>
                  </Card>
                )}
              </Stack>
            </Paper>
          ))}
        </Stack>

        {(!structure.semesters || structure.semesters.length === 0) && (
          <Paper shadow='sm' p='xl' withBorder>
            <Stack align='center' gap='xs'>
              <IconSchool size={48} />
              <Text size='lg' fw={500}>
                No Semesters Found
              </Text>
              <Text size='sm' c='dimmed' ta='center'>
                This program structure currently has no semesters defined.
              </Text>
            </Stack>
          </Paper>
        )}
      </Stack>
    </Box>
  );
}

function canEditModule(session: Session | null) {
  if (!session) return false;
  return (
    session?.user?.role === 'admin' ||
    session?.user?.role === 'registry' ||
    (session?.user?.role == 'academic' &&
      (session.user.position === 'manager' ||
        session.user.position === 'program_leader'))
  );
}
