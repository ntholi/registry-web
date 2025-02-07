'use client';

import { getModulesByStructure } from '@/server/modules/actions';
import {
  Anchor,
  Badge,
  Box,
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
import { IconSchool } from '@tabler/icons-react';
import Link from 'next/link';
import { useCallback, useState } from 'react';
import FilterSelect from './FilterSelect';

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
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [loading, setLoading] = useState(false);

  const handleStructureSelect = useCallback(async (structureId: number) => {
    try {
      setLoading(true);
      const data = await getModulesByStructure(structureId);
      setSemesters(data);
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <Paper withBorder p={'lg'} m={'md'}>
      <Stack gap='xl'>
        <Box>
          <Title order={2} fw={500}>
            Program Structure
          </Title>
          <Divider mt={5} />
        </Box>

        <Paper shadow='sm' p='md' radius='md' withBorder>
          <FilterSelect onStructureSelect={handleStructureSelect} />
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

        <Transition
          mounted={!loading && semesters.length > 0}
          transition='fade'
          duration={400}
        >
          {(styles) => (
            <Stack gap='lg' style={styles}>
              {semesters.map((semester) => (
                <Paper
                  key={semester.id}
                  shadow='sm'
                  p='md'
                  radius='md'
                  withBorder
                >
                  <Stack gap='md'>
                    <Group justify='space-between' align='center'>
                      <div>
                        <Group gap='xs' mb={4}>
                          <IconSchool size={20} />
                          <Title order={3} className='!m-0'>
                            Semester {semester.semesterNumber}
                          </Title>
                          <Text size='sm' c='dimmed'>
                            {' '}
                            - {semester.name}
                          </Text>
                        </Group>
                      </div>
                      <Badge variant='default'>
                        {semester.totalCredits} Credits
                      </Badge>
                    </Group>

                    <Table highlightOnHover withTableBorder withColumnBorders>
                      <Table.Thead>
                        <Table.Tr>
                          <Table.Th>Module Code</Table.Th>
                          <Table.Th>Module Name</Table.Th>
                          <Table.Th>Type</Table.Th>
                          <Table.Th>Credits</Table.Th>
                        </Table.Tr>
                      </Table.Thead>
                      <Table.Tbody>
                        {semester.modules.map((module) => (
                          <Table.Tr key={module.moduleId}>
                            <Table.Td>
                              <Anchor
                                size='sm'
                                component={Link}
                                href={`/admin/modules/${module.moduleId}`}
                              >
                                {module.moduleCode}
                              </Anchor>
                            </Table.Td>
                            <Table.Td>{module.moduleName}</Table.Td>
                            <Table.Td>{module.moduleType}</Table.Td>
                            <Table.Td>{module.moduleCredits}</Table.Td>
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

        {!loading && semesters.length === 0 && (
          <Paper shadow='sm' p='xl' radius='md' withBorder>
            <Stack align='center' gap='xs'>
              <IconSchool size={48} />
              <Text size='lg' fw={500}>
                No Program Structure Selected
              </Text>
            </Stack>
          </Paper>
        )}
      </Stack>
    </Paper>
  );
}
