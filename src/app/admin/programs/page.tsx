'use client';

import { getModulesByStructure } from '@/server/modules/actions';
import {
  ActionIcon,
  Anchor,
  Badge,
  Box,
  Card,
  Divider,
  Group,
  Paper,
  Skeleton,
  Stack,
  Table,
  Text,
  Title,
  Transition,
} from '@mantine/core';
import { IconEdit, IconSchool, IconTrashFilled } from '@tabler/icons-react';
import Link from 'next/link';
import { useCallback, useState } from 'react';
import FilterSelect from './FilterSelect';
import { formatSemester } from '@/lib/utils';
import { getStructure } from '@/server/structures/actions';
import PrerequisiteDisplay from './PrerequisiteDisplay';
import { useSession } from 'next-auth/react';
import DeleteButton from './DeleteButton';
import EditButton from './EditButton';

interface Module {
  moduleId: number;
  moduleCode: string;
  moduleName: string;
  moduleType: string;
  moduleCredits: number;
}

interface Semester {
  id: number;
  semesterNumber: number;
  name: string;
  totalCredits: number;
  modules: Module[];
}

export default function ProgramsPage() {
  const [structure, setStructure] =
    useState<Awaited<ReturnType<typeof getStructure>>>();
  const [loading, setLoading] = useState(false);
  const { data: session } = useSession();

  const handleStructureSelect = useCallback(async (structureId: number) => {
    try {
      setLoading(true);
      const data = await getStructure(structureId);
      setStructure(data);
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <Box p={'lg'}>
      <Stack gap='lg'>
        <Paper shadow='sm' p='md' withBorder>
          <FilterSelect onStructureSelect={handleStructureSelect} />
          {structure && (
            <Card mt={'xl'} withBorder p='sm'>
              <Text fw={500}>{structure?.program?.name}</Text>
              <Text size='sm' c='dimmed'>
                {structure.code}
              </Text>
            </Card>
          )}
        </Paper>

        <Transition mounted={loading} transition='fade' duration={400}>
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

        <Transition mounted={!loading} transition='fade' duration={400}>
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
                        {semester.semesterModules.map(({ module, id }) => (
                          <Table.Tr key={module.id}>
                            <Table.Td>
                              <Anchor
                                size='sm'
                                component={Link}
                                href={`/admin/modules/${module.id}`}
                              >
                                {module.code}
                              </Anchor>
                            </Table.Td>
                            <Table.Td>{module.name}</Table.Td>
                            <Table.Td>{module.type}</Table.Td>
                            <Table.Td>{module.credits}</Table.Td>
                            <Table.Td>
                              <PrerequisiteDisplay moduleId={id} />
                            </Table.Td>
                            {session?.user?.role === 'admin' && (
                              <Table.Td>
                                <Group>
                                  <EditButton moduleId={module.id}/>
                                  <DeleteButton
                                    semesterModuleId={id}
                                    moduleName={module.name}
                                  />
                                </Group>
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

        {!loading && !structure && (
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
