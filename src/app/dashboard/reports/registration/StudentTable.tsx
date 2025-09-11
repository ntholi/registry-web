'use client';
import React from 'react';
import { useMediaQuery } from '@mantine/hooks';
import { Table, ScrollArea, Text, Badge, Group, Loader } from '@mantine/core';
import { formatSemester } from '@/lib/utils';

interface Student {
  stdNo: number;
  name: string;
  programName: string;
  semesterNumber: number;
  schoolName: string;
  schoolCode: string;
  phone: string;
}

interface StudentTableProps {
  data: Student[];
  isLoading: boolean;
}

export default function StudentTable({ data, isLoading }: StudentTableProps) {
  const isMobile = useMediaQuery('(max-width: 768px)');

  if (isLoading) {
    return (
      <Group justify='center' p='xl'>
        <Loader size='lg' />
        <Text>Loading students...</Text>
      </Group>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Group justify='center' p='xl'>
        <Text c='dimmed'>No students found for the selected criteria.</Text>
      </Group>
    );
  }

  return (
    <ScrollArea>
      <Table striped highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th miw={80}>Student No.</Table.Th>
            <Table.Th miw={isMobile ? 120 : 200}>Name</Table.Th>
            <Table.Th miw={isMobile ? 150 : 250}>Program</Table.Th>
            <Table.Th ta='center' miw={60}>
              Semester
            </Table.Th>
            <Table.Th miw={isMobile ? 100 : 150}>School</Table.Th>
            <Table.Th miw={isMobile ? 100 : 150}>School Code</Table.Th>
            <Table.Th miw={isMobile ? 120 : 150}>Phone</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {data.map((student, index) => (
            <Table.Tr key={`${student.stdNo}-${index}`}>
              <Table.Td fw={500}>
                <Text size={isMobile ? 'xs' : 'sm'}>{student.stdNo}</Text>
              </Table.Td>
              <Table.Td>
                <Text size={isMobile ? 'xs' : 'sm'}>{student.name}</Text>
              </Table.Td>
              <Table.Td>
                <Text size={isMobile ? 'xs' : 'sm'} c='dimmed'>
                  {student.programName}
                </Text>
              </Table.Td>
              <Table.Td ta='center'>
                <Badge variant='light' size={isMobile ? 'xs' : 'sm'}>
                  {formatSemester(student.semesterNumber, 'mini')}
                </Badge>
              </Table.Td>
              <Table.Td>
                <Text size={isMobile ? 'xs' : 'sm'}>{student.schoolName}</Text>
              </Table.Td>
              <Table.Td>
                <Text size={isMobile ? 'xs' : 'sm'} fw={500}>
                  {student.schoolCode}
                </Text>
              </Table.Td>
              <Table.Td>
                <Text size={isMobile ? 'xs' : 'sm'}>
                  {student.phone || 'N/A'}
                </Text>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>

      <Group justify='space-between' mt='md' p='sm'>
        <Text size='sm' c='dimmed'>
          Showing {data.length} student{data.length !== 1 ? 's' : ''}
        </Text>
      </Group>
    </ScrollArea>
  );
}
