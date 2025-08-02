'use client';

import { formatSemester } from '@/lib/utils';
import { Badge, Checkbox, Paper, Table, Text, Title } from '@mantine/core';

type ModuleWithStatus = {
  semesterModuleId: number;
  code: string;
  name: string;
  type: string;
  credits: number;
  status: 'Compulsory' | 'Elective' | `Repeat${number}`;
  semesterNo: number;
  prerequisites?: Array<{ id: number; code: string; name: string }>;
};

type Props = {
  modules: ModuleWithStatus[];
  selectedModules: Set<number>;
  onModuleToggle: (semesterModuleId: number) => void;
  error?: string;
};

export default function ModulesTable({
  modules,
  selectedModules,
  onModuleToggle,
  error,
}: Props) {
  return (
    <>
      <Title order={4} mb='md'>
        Available Modules
      </Title>
      <Paper withBorder>
        <Table>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Select</Table.Th>
              <Table.Th>Code</Table.Th>
              <Table.Th>Module Name</Table.Th>
              <Table.Th>Credits</Table.Th>
              <Table.Th>Status</Table.Th>
              <Table.Th>Semester</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {modules.map((module) => (
              <Table.Tr key={module.semesterModuleId}>
                <Table.Td>
                  <Checkbox
                    checked={selectedModules.has(module.semesterModuleId)}
                    onChange={() => onModuleToggle(module.semesterModuleId)}
                  />
                </Table.Td>
                <Table.Td>
                  <Text fw={500} size='sm'>
                    {module.code}
                  </Text>
                </Table.Td>
                <Table.Td>
                  <Text size='sm'>{module.name}</Text>
                </Table.Td>
                <Table.Td>
                  <Text size='sm'>{module.credits}</Text>
                </Table.Td>
                <Table.Td>
                  <Badge
                    size='sm'
                    variant='transparent'
                    color={
                      module.status === 'Compulsory'
                        ? 'blue'
                        : module.status === 'Elective'
                          ? 'green'
                          : 'orange'
                    }
                  >
                    {module.status}
                  </Badge>
                </Table.Td>
                <Table.Td>
                  <Text size='sm'>
                    {formatSemester(module.semesterNo, 'mini')}
                  </Text>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Paper>
      {error && (
        <Text size='sm' c='red' mt='xs'>
          {error}
        </Text>
      )}
    </>
  );
}
