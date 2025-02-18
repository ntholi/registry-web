'use client';

import {
  Button,
  Card,
  Grid,
  NumberInput,
  Select,
  Stack,
  Table,
  Text,
  Title,
  rem,
  Group,
  Badge,
  Transition,
  Paper,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { useState } from 'react';
import { getStudentModules, type ModuleResult } from './actions';

const queryTypes = [
  { value: 'semester', label: 'Semester Modules' },
  { value: 'repeat', label: 'Repeat Modules' },
] as const;

export default function ModuleSimulator() {
  const [results, setResults] = useState<ModuleResult[]>([]);
  const [loading, setLoading] = useState(false);

  const form = useForm({
    initialValues: {
      stdNo: '',
      queryType: 'semester' as const,
    },
  });

  const handleSubmit = async (values: typeof form.values) => {
    setLoading(true);
    try {
      const modules = await getStudentModules(
        Number(values.stdNo),
        values.queryType,
      );
      setResults(modules);
    } catch (error) {
      console.error('Error fetching modules:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Stack>
      <Paper withBorder shadow='sm' p='lg' radius='md'>
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack gap='lg'>
            <Group justify='space-between' align='center'>
              <Title order={3} fw={600}>
                Query Simulator
              </Title>
            </Group>

            <Grid>
              <Grid.Col span={5}>
                <NumberInput
                  label='Student Number'
                  required
                  {...form.getInputProps('stdNo')}
                />
              </Grid.Col>
              <Grid.Col span={5}>
                <Select
                  label='Query Type'
                  data={queryTypes}
                  {...form.getInputProps('queryType')}
                />
              </Grid.Col>
              <Grid.Col span={2}>
                <Button
                  type='submit'
                  loading={loading}
                  fullWidth
                  mt={24}
                  size='sm'
                >
                  Fetch Modules
                </Button>
              </Grid.Col>
            </Grid>
          </Stack>
        </form>
      </Paper>

      <Transition mounted={results.length > 0} transition='fade' duration={400}>
        {(styles) => (
          <Paper withBorder shadow='sm' p='lg' radius='md' style={styles}>
            <Stack gap='lg'>
              <Group justify='space-between' align='center'>
                <Title order={3} fw={600}>
                  Results
                </Title>
                <Text size='sm' c='dimmed'>
                  {results.length} modules found
                </Text>
              </Group>

              <Paper withBorder radius='md'>
                <Table>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Code</Table.Th>
                      <Table.Th>Name</Table.Th>
                      <Table.Th>Type</Table.Th>
                      <Table.Th>Credits</Table.Th>
                      <Table.Th>Status</Table.Th>
                      <Table.Th>Prerequisites</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {results.map((module) => (
                      <Table.Tr key={module.id}>
                        <Table.Td fw={500}>{module.code}</Table.Td>
                        <Table.Td>{module.name}</Table.Td>
                        <Table.Td>{module.type}</Table.Td>
                        <Table.Td>{module.credits}</Table.Td>
                        <Table.Td>
                          <Badge variant='dot' radius='sm'>
                            {module.status}
                          </Badge>
                        </Table.Td>
                        <Table.Td>
                          <Group gap={4}>
                            {module.prerequisites?.map((it) => (
                              <Badge
                                key={it.prerequisiteCode}
                                size='sm'
                                variant='default'
                                radius='sm'
                              >
                                {it.prerequisiteCode}
                              </Badge>
                            ))}
                          </Group>
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </Paper>
            </Stack>
          </Paper>
        )}
      </Transition>
    </Stack>
  );
}
