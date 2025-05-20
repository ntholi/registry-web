'use client';
import { Anchor, Stack, Table, TextInput } from '@mantine/core';
import Link from 'next/link';
import { useState } from 'react';
import { useStudentsQuery } from './useStudentsQuery';

type Props = {
  moduleId: number;
};

export default function StudentTable({ moduleId }: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const { data: students } = useStudentsQuery({ moduleId, searchQuery });

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
