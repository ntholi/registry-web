'use client';
import { findByModuleId } from '@/server/students/actions';
import { Anchor, Stack, Table, TextInput } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useQueryState } from 'nuqs';
import { useState } from 'react';

type Props = {
  moduleId: number;
};

export default function StudentTable({ moduleId }: Props) {
  const [semesterModuleId] = useQueryState('semesterModuleId');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: students } = useQuery({
    queryKey: ['students', moduleId],
    queryFn: () => findByModuleId(moduleId),
    select(data) {
      let filteredData = data;

      if (semesterModuleId) {
        filteredData = data.filter((it) =>
          it.programs.some((it) =>
            it.semesters.some((it) =>
              it.studentModules.some(
                (it) => it.semesterModule?.id?.toString() === semesterModuleId,
              ),
            ),
          ),
        );
      }

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        filteredData = filteredData.filter(
          (student) =>
            student.name.toLowerCase().includes(query) ||
            student.stdNo.toString().toLowerCase().includes(query),
        );
      }

      return filteredData;
    },
  });

  const rows =
    students?.map((it) => (
      <Table.Tr key={it.stdNo}>
        <Table.Td>
          <Anchor
            size='sm'
            component={Link}
            href={`/admin/students/${it.stdNo}`}
          >
            {it.stdNo}
          </Anchor>
        </Table.Td>
        <Table.Td>{it.name}</Table.Td>
      </Table.Tr>
    )) || [];

  return (
    <Stack>
      <TextInput
        placeholder='Search by name or student number'
        value={searchQuery}
        onChange={(event) => setSearchQuery(event.currentTarget.value)}
      />
      <Table highlightOnHover withTableBorder>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Student Number</Table.Th>
            <Table.Th>Name</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>{rows}</Table.Tbody>
      </Table>
    </Stack>
  );
}
