'use client';
import React from 'react';
import { useMediaQuery } from '@mantine/hooks';
import {
  Table,
  ScrollArea,
  Text,
  Badge,
  Group,
  Skeleton,
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

  const searchInput = (
    <Box p='md'>
      <TextInput
        placeholder='Search by student number, name, program, school, or phone...'
        leftSection={<IconSearch size={16} />}
        rightSection={isLoading ? <Loader size='xs' /> : null}
        value={searchQuery}
        onChange={(event) => onSearchChange?.(event.currentTarget.value)}
        size='sm'
      />
    </Box>
  );

  if (isLoading) {
    const rowCount = isMobile ? 4 : 6;
    return (
      <Box>
        {searchInput}

        <ScrollArea>
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Student No.</Table.Th>
                <Table.Th>Name</Table.Th>
                <Table.Th>Program</Table.Th>
                <Table.Th ta='center'>Semester</Table.Th>
                <Table.Th>School</Table.Th>
                <Table.Th>Phone</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {Array.from({ length: rowCount }).map((_, i) => (
                <Table.Tr key={i}>
                  <Table.Td>
                    <Skeleton height={16} width={80} />
                  </Table.Td>
                  <Table.Td>
                    <Skeleton height={16} width='60%' />
                  </Table.Td>
                  <Table.Td>
                    <Skeleton height={14} width='50%' />
                  </Table.Td>
                  <Table.Td ta='center'>
                    <Skeleton height={20} width={60} radius='xl' />
                  </Table.Td>
                  <Table.Td>
                    <Skeleton height={16} width='40%' />
                  </Table.Td>
                  <Table.Td>
                    <Skeleton height={16} width='50%' />
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </ScrollArea>

        <Group justify='center' mt='md' p='sm'>
          <Text c='dimmed'>Loading students...</Text>
        </Group>
      </Box>
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
      {searchInput}

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
