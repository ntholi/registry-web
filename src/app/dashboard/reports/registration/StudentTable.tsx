'use client';
import React from 'react';
import { useMediaQuery } from '@mantine/hooks';
import {
  Table,
  ScrollArea,
  Text,
  Badge,
  Group,
  Loader,
  Pagination,
  Box,
  Anchor,
  TextInput,
} from '@mantine/core';
import { IconSearch } from '@tabler/icons-react';
import { formatPhoneNumber, formatSemester } from '@/lib/utils';
import Link from 'next/link';

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
  totalCount?: number;
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
}

export default function StudentTable({
  data,
  isLoading,
  totalCount = 0,
  currentPage = 1,
  totalPages = 0,
  onPageChange,
  searchQuery = '',
  onSearchChange,
}: StudentTableProps) {
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
    if (searchQuery) {
      return (
        <Group justify='center' p='xl'>
          <Text c='dimmed'>
            No students match your search criteria. Try a different search term.
          </Text>
        </Group>
      );
    }
    return (
      <Group justify='center' p='xl'>
        <Text c='dimmed'>No students found for the selected criteria.</Text>
      </Group>
    );
  }

  return (
    <Box>
      <Box p='md'>
        <TextInput
          placeholder='Search by student number, name, program, school, or phone...'
          leftSection={<IconSearch size={16} />}
          value={searchQuery}
          onChange={(event) => onSearchChange?.(event.currentTarget.value)}
          size='sm'
        />
      </Box>

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
              <Table.Th miw={isMobile ? 120 : 150}>Phone</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {data.map((student, index) => (
              <Table.Tr key={`${student.stdNo}-${index}`}>
                <Table.Td fw={500}>
                  <Anchor
                    component={Link}
                    href={`/dashboard/students/${student.stdNo}`}
                    size={isMobile ? 'xs' : 'sm'}
                  >
                    {student.stdNo}
                  </Anchor>
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
                  <Text size={isMobile ? 'xs' : 'sm'} fw={500}>
                    {student.schoolCode}
                  </Text>
                </Table.Td>
                <Table.Td>
                  <Text size={isMobile ? 'xs' : 'sm'}>
                    {formatPhoneNumber(student.phone)}
                  </Text>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </ScrollArea>

      <Group justify='space-between' mt='md' p='sm' wrap='wrap'>
        <Text size='sm' c='dimmed'>
          {searchQuery ? (
            <>
              Found {data.length} of {totalCount} student
              {totalCount !== 1 ? 's' : ''}
            </>
          ) : (
            <>
              Showing {data.length} of {totalCount} student
              {totalCount !== 1 ? 's' : ''}
            </>
          )}
        </Text>

        {totalPages > 1 && (
          <Pagination
            total={totalPages}
            value={currentPage}
            onChange={onPageChange}
            size={'sm'}
          />
        )}
      </Group>
    </Box>
  );
}
