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
  NumberInput,
  Paper,
  Stack,
  Table,
  Text,
  Title,
  Transition,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconAlertCircle } from '@tabler/icons-react';
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
              <Grid.Col span={8}>
                <NumberInput
                  label='Student Number'
                  required
                  {...form.getInputProps('stdNo')}
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
                    <Text size='sm'>
                      {formatSemester((results?.student.semester ?? -1) + 1)}
                    </Text>
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
                    {results?.modules.map((m) => (
                      <Table.Tr key={m.id}>
                        <Table.Td fw={500}>{m.code}</Table.Td>
                        <Table.Td>{m.name}</Table.Td>
                        <Table.Td>{m.type}</Table.Td>
                        <Table.Td>{m.credits}</Table.Td>
                        <Table.Td>
                          <Badge variant='dot' radius='sm'>
                            {m.status}
                          </Badge>
                        </Table.Td>
                        <Table.Td>
                          <Group gap={4}>
                            {m.prerequisites?.map((code) => (
                              <Badge
                                key={code}
                                size='sm'
                                variant='default'
                                radius='sm'
                              >
                                {code}
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
