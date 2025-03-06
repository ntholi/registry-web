'use client';

import { formatSemester } from '@/lib/utils';
import {
  Alert,
  Badge,
  Box,
  Button,
  Card,
  Divider,
  Flex,
  Grid,
  Group,
  Paper,
  Stack,
  Table,
  Text,
  TextInput,
  Title,
  Transition,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconAlertCircle, IconSearch } from '@tabler/icons-react';
import { useState } from 'react';
import { getStudentModules } from './actions';

export default function ModuleSimulator() {
  const [results, setResults] =
    useState<Awaited<ReturnType<typeof getStudentModules>>>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm({
    initialValues: {
      stdNo: '',
    },
  });

  const handleSubmit = async (values: typeof form.values) => {
    setLoading(true);
    setError(null);
    try {
      const response = await getStudentModules(Number(values.stdNo));
      setResults(response);
    } catch (error) {
      console.error('Error fetching modules:', error);
      setError(
        error instanceof Error ? error.message : 'An unexpected error occurred',
      );
      setResults(undefined);
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
              <Grid.Col span={10}>
                <TextInput
                  label='Student Number'
                  required
                  {...form.getInputProps('stdNo')}
                />
              </Grid.Col>
              <Grid.Col span={2}>
                <Button
                  type='submit'
                  loading={loading}
                  leftSection={<IconSearch size={'1rem'} />}
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

      {error && (
        <Alert icon={<IconAlertCircle size={16} />} color='red' title='Error'>
          {error}
        </Alert>
      )}

      <Transition mounted={!!results} transition='fade' duration={400}>
        {(styles) => (
          <Paper withBorder shadow='sm' p='lg' radius='md' style={styles}>
            <Stack gap='lg'>
              <Stack gap={4}>
                <Box>
                  <Title order={5} fw={400}>
                    {results?.student.program.code}
                  </Title>
                  <Text c='dimmed' size='xs'>
                    {results?.student.program.structureCode}
                  </Text>
                </Box>
                <Card mt={'sm'}>
                  <Flex justify={'space-between'}>
                    <Text size='sm'>
                      {results?.student.name} ({results?.student.stdNo})
                    </Text>
                    <Text size='sm'>{formatSemester(results?.semesterNo)}</Text>
                  </Flex>
                </Card>
              </Stack>

              <Divider />

              <Group justify='space-between' align='center'>
                <Title order={3} fw={600}>
                  Modules
                </Title>
                <Text size='sm' c='dimmed'>
                  {results?.modules.length} modules found
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
                    {results?.modules.map((m) => {
                      const preFailed =
                        m.prerequisites && m.prerequisites.length > 0;
                      return (
                        <Table.Tr key={m.id}>
                          <Table.Td fw={500}>
                            <Text
                              size='sm'
                              td={preFailed ? 'line-through' : undefined}
                              c={preFailed ? 'dark' : undefined}
                            >
                              {m.code}
                            </Text>
                          </Table.Td>
                          <Table.Td>
                            <Text
                              size='sm'
                              td={preFailed ? 'line-through' : undefined}
                              c={preFailed ? 'dark' : undefined}
                            >
                              {m.name}
                            </Text>
                          </Table.Td>
                          <Table.Td>
                            <Text
                              size='sm'
                              td={preFailed ? 'line-through' : undefined}
                              c={preFailed ? 'dark' : undefined}
                            >
                              {m.type}
                            </Text>
                          </Table.Td>
                          <Table.Td>
                            <Text
                              size='sm'
                              td={preFailed ? 'line-through' : undefined}
                              c={preFailed ? 'dark' : undefined}
                            >
                              {m.credits}
                            </Text>
                          </Table.Td>
                          <Table.Td>
                            <Badge
                              variant='dot'
                              radius='sm'
                              color={preFailed ? 'red' : undefined}
                            >
                              {m.status}
                            </Badge>
                          </Table.Td>
                          <Table.Td>
                            <Group gap={4}>
                              {m.prerequisites?.map((p) => (
                                <Text key={p.code} size='sm' c='red'>
                                  {p.name}
                                </Text>
                              ))}
                            </Group>
                          </Table.Td>
                        </Table.Tr>
                      );
                    })}
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
