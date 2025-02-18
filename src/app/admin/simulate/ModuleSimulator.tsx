'use client';

import {
  getRepeatModules,
  getSemesterModules,
} from '@/app/(main)/(auth)/registration/request/actions';
import {
  Button,
  Card,
  Group,
  NumberInput,
  Radio,
  Stack,
  Table,
  Text,
  Title,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { useState } from 'react';

type ModuleResult = {
  id: number;
  code: string;
  name: string;
  type: string;
  credits: number;
  status: string;
  prerequisites?: { code: string; name: string }[];
};

export default function ModuleSimulator() {
  const [results, setResults] = useState<ModuleResult[]>([]);
  const [loading, setLoading] = useState(false);

  const form = useForm({
    initialValues: {
      stdNo: '',
      queryType: 'semester',
      semester: 1,
      structureId: 1,
    },
  });

  const handleSubmit = async (values: typeof form.values) => {
    setLoading(true);
    try {
      if (values.queryType === 'semester') {
        const modules = await getSemesterModules(
          Number(values.stdNo),
          values.semester,
          values.structureId,
        );
        setResults(modules);
      } else {
        const modules = await getRepeatModules(
          Number(values.stdNo),
          values.semester,
        );
        setResults(modules);
      }
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
            <Title order={3}>Module Query Simulator</Title>

            <NumberInput
              label='Student Number'
              placeholder='Enter student number'
              required
              {...form.getInputProps('stdNo')}
            />

            <Radio.Group
              label='Query Type'
              {...form.getInputProps('queryType')}
            >
              <Group mt='xs'>
                <Radio value='semester' label='Semester Modules' />
                <Radio value='repeat' label='Repeat Modules' />
              </Group>
            </Radio.Group>

            <Group grow>
              <NumberInput
                label='Semester'
                min={1}
                max={10}
                {...form.getInputProps('semester')}
              />
              {form.values.queryType === 'semester' && (
                <NumberInput
                  label='Structure ID'
                  min={1}
                  {...form.getInputProps('structureId')}
                />
              )}
            </Group>

            <Button type='submit' loading={loading}>
              Fetch Modules
            </Button>
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
                      {module.prerequisites?.map((prereq) => (
                        <Text key={prereq.code} size='sm'>
                          {prereq.code} - {prereq.name}
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
