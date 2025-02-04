'use client';

import { useState } from 'react';
import { Table, Title, Paper } from '@mantine/core';
import FilterSelect from './FilterSelect';
import { getModulesByStructure } from '@/server/modules/actions';

interface Module {
  moduleId: number;
  moduleCode: string;
  moduleName: string;
  moduleType: string;
  moduleCredits: number;
  semesterNumber: number;
  semesterName: string;
}

export default function ProgramsPage() {
  const [modules, setModules] = useState<Module[]>([]);

  const handleStructureSelect = async (structureId: number) => {
    const moduleData = await getModulesByStructure(structureId);
    setModules(moduleData);
  };

  return (
    <div className='p-4 space-y-4'>
      <Title order={2}>Program Structure Modules</Title>

      <Paper shadow='xs' p='md'>
        <FilterSelect onStructureSelect={handleStructureSelect} />
      </Paper>

      <Paper shadow='xs' p='md'>
        <Table>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Code</Table.Th>
              <Table.Th>Name</Table.Th>
              <Table.Th>Type</Table.Th>
              <Table.Th>Credits</Table.Th>
              <Table.Th>Semester</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {modules.map((module) => (
              <Table.Tr key={`${module.moduleId}-${module.semesterNumber}`}>
                <Table.Td>{module.moduleCode}</Table.Td>
                <Table.Td>{module.moduleName}</Table.Td>
                <Table.Td>{module.moduleType}</Table.Td>
                <Table.Td>{module.moduleCredits}</Table.Td>
                <Table.Td>{`${module.semesterNumber} - ${module.semesterName}`}</Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Paper>
    </div>
  );
}
