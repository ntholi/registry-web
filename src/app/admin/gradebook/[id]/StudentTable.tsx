'use client';
import { findByModuleId } from '@/server/students/actions';
import { Anchor, Table, Text } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useQueryState } from 'nuqs';

type Props = {
  moduleId: number;
};

export default function StudentTable({ moduleId }: Props) {
  const [semesterModuleId] = useQueryState('semesterModuleId');

  const { data: students } = useQuery({
    queryKey: ['students', moduleId],
    queryFn: () => findByModuleId(moduleId),
    select(data) {
      if (!semesterModuleId) {
        return data;
      }
      return data.filter((it) =>
        it.programs.some((it) =>
          it.semesters.some((it) =>
            it.studentModules.some(
              (it) => it.semesterModule?.id?.toString() === semesterModuleId,
            ),
          ),
        ),
      );
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
    <>
      <Table highlightOnHover withTableBorder>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Student Number</Table.Th>
            <Table.Th>Name</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>{rows}</Table.Tbody>
      </Table>
    </>
  );
}
