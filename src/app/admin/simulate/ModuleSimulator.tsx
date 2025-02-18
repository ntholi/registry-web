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
    <Stack gap='md'>
      <Card withBorder>
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack gap='md'>
            <Title order={3}>Query Simulator</Title>

            <Grid>
              <Grid.Col span={4}>
                <NumberInput
                  label='Student Number'
                  placeholder='Enter student number'
                  required
                  {...form.getInputProps('stdNo')}
                />
              </Grid.Col>
              <Grid.Col span={4}>
                <Select
                  label='Query Type'
                  data={queryTypes}
                  {...form.getInputProps('queryType')}
                />
              </Grid.Col>
              <Grid.Col span={4}>
                <Button type='submit' loading={loading} fullWidth mt={24}>
                  Fetch Modules
                </Button>
              </Grid.Col>
            </Grid>
          </Stack>
        </form>
      </Card>

      {results.length > 0 && (
        <Card withBorder>
          <Stack gap='md'>
            <Title order={3}>Results</Title>
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
                    <Table.Td>{module.code}</Table.Td>
                    <Table.Td>{module.name}</Table.Td>
                    <Table.Td>{module.type}</Table.Td>
                    <Table.Td>{module.credits}</Table.Td>
                    <Table.Td>{module.status}</Table.Td>
                    <Table.Td>
                      {module.prerequisites?.map((it) => (
                        <Text size='sm' key={it.prerequisiteCode}>
                          {it.prerequisiteCode}
                        </Text>
                      ))}
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Stack>
        </Card>
      )}
    </Stack>
  );
}
