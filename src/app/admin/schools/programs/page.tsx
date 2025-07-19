'use client';

import { formatSemester } from '@/lib/utils';
import { getStructure } from '@/server/structures/actions';
import {
  Anchor,
  Box,
  Card,
  Flex,
  Group,
  Paper,
  Skeleton,
  Stack,
  Table,
  Text,
  Title,
  Transition,
} from '@mantine/core';
import { IconSchool } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useCallback, useState } from 'react';
import EditButton from './EditButton';
import HideButton from './HideButton';
import PrerequisiteDisplay from './PrerequisiteDisplay';

export default function ProgramsPage() {
  const [selectedStructureId, setSelectedStructureId] = useState<number>();
  const { data: session } = useSession();

  const { data: structure, isLoading } = useQuery({
    queryKey: ['structure', selectedStructureId],
    queryFn: () =>
      selectedStructureId ? getStructure(selectedStructureId) : null,
    enabled: !!selectedStructureId,
  });

  const handleStructureSelect = useCallback((structureId: number) => {
    setSelectedStructureId(structureId);
  }, []);

  return (
    <Box p={'lg'}>
      <Stack gap='lg'>
        <Paper shadow='sm' p='md' withBorder>
          {structure && (
            <Card mt={'xl'} withBorder p='sm'>
              <Text fw={500}>{structure?.program?.name}</Text>
              <Text size='sm' c='dimmed'>
                {structure.code}
              </Text>
            </Card>
          )}
        </Paper>

        <Transition mounted={isLoading} transition='fade' duration={400}>
          {(styles) => (
            <Stack gap='md' style={styles}>
              {[1, 2, 3].map((i) => (
                <Paper key={i} shadow='sm' p='md' radius='md' withBorder>
                  <Stack gap='md'>
                    <Skeleton height={30} width='40%' />
                    <Skeleton height={200} />
                  </Stack>
                </Paper>
              ))}
            </Stack>
          )}
        </Transition>

        <Transition mounted={!isLoading} transition='fade' duration={400}>
          {(styles) => (
            <Stack gap='lg' style={styles}>
              {structure?.semesters.map((semester) => (
                <Paper
                  key={semester.id}
                  shadow='sm'
                  p='md'
                  radius='md'
                  withBorder
                >
                  <Stack gap='md'>
                    <Group justify='space-between' align='center'>
                      <Group gap='xs' mb={4}>
                        <IconSchool size={20} />
                        <Title order={5} fw={500}>
                          {formatSemester(semester.semesterNumber)}
                        </Title>
                      </Group>
                    </Group>

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
                              <Anchor
                                size='sm'
                                component={Link}
                                href={`/admin/semester-modules/${semModule.id}`}
                                c={semModule.hidden ? 'dark' : undefined}
                              >
                                {semModule.module!.code}
                              </Anchor>
                            </Table.Td>
                            <Table.Td>
                              <Text
                                size='sm'
                                c={semModule.hidden ? 'dark' : undefined}
                              >
                                {semModule.module!.name}
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
                            {session?.user?.role === 'admin' && (
                              <Table.Td>
                                <Flex>
                                  <EditButton
                                    moduleId={semModule.id}
                                    structureId={selectedStructureId!}
                                  />
                                  <HideButton
                                    moduleId={semModule.id}
                                    hidden={semModule.hidden}
                                    structureId={selectedStructureId!}
                                  />
                                </Flex>
                              </Table.Td>
                            )}
                          </Table.Tr>
                        ))}
                      </Table.Tbody>
                    </Table>
                  </Stack>
                </Paper>
              ))}
            </Stack>
          )}
        </Transition>

        {!isLoading && !structure && (
          <Paper shadow='sm' p='xl' withBorder>
            <Stack align='center' gap='xs'>
              <IconSchool size={48} />
              <Text size='lg' fw={500}>
                No Program Structure Selected
              </Text>
            </Stack>
          </Paper>
        )}
      </Stack>
    </Box>
  );
}
