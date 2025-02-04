'use client';

import { useState } from 'react';
import { Table, Title, Paper, Text, Stack } from '@mantine/core';
import FilterSelect from './FilterSelect';
import { getModulesByStructure } from '@/server/modules/actions';

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

  const handleStructureSelect = async (structureId: number) => {
    const data = await getModulesByStructure(structureId);
    setSemesters(data);
  };

  return (
    <div className='p-4 space-y-4'>
      <Title order={2}>Program Structure Modules</Title>

      <Paper shadow='xs' p='md'>
        <FilterSelect onStructureSelect={handleStructureSelect} />
      </Paper>

      <Stack gap='lg'>
        {semesters.map((semester) => (
          <Paper key={semester.id} shadow='xs' p='md'>
            <Stack gap='md'>
              <div className='flex justify-between items-center'>
                <Title order={3}>
                  Semester {semester.semesterNumber} - {semester.name}
                </Title>
                <Text size='sm' c='dimmed'>
                  Total Credits: {semester.totalCredits}
                </Text>
              </div>

              <Table>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Code</Table.Th>
                    <Table.Th>Name</Table.Th>
                    <Table.Th>Type</Table.Th>
                    <Table.Th>Credits</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {semester.modules.map((module) => (
                    <Table.Tr key={module.moduleId}>
                      <Table.Td>{module.moduleCode}</Table.Td>
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
    </div>
  );
}
