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
  Stack,
  Paper,
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
    const rowCount = isMobile ? 5 : 10;
    return (
      <Paper withBorder p='md'>
        <Stack gap='md'>
          <TextInput
            placeholder='Search students...'
            leftSection={<IconSearch size={16} />}
            size='sm'
            disabled
          />

          <ScrollArea>
            <Table horizontalSpacing='md' verticalSpacing='sm'>
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
                      <Skeleton height={14} width={70} />
                    </Table.Td>
                    <Table.Td>
                      <Skeleton height={14} width='60%' />
                    </Table.Td>
                    <Table.Td>
                      <Skeleton height={14} width='70%' />
                    </Table.Td>
                    <Table.Td ta='center'>
                      <Skeleton height={18} width={50} radius='sm' />
                    </Table.Td>
                    <Table.Td>
                      <Skeleton height={14} width={60} />
                    </Table.Td>
                    <Table.Td>
                      <Skeleton height={14} width={90} />
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </ScrollArea>
        </Stack>
      </Paper>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Paper withBorder p='md'>
        <Stack gap='md'>
          <TextInput
            placeholder='Search students...'
            leftSection={<IconSearch size={16} />}
            rightSection={isLoading && <Loader size='xs' />}
            value={searchQuery}
            onChange={(event) => onSearchChange?.(event.currentTarget.value)}
            size='sm'
          />

          <Box py='xl' ta='center'>
            <Text c='dimmed'>
              {searchQuery
                ? 'No students match your search'
                : 'No students found'}
            </Text>
          </Box>
        </Stack>
      </Paper>
    );
  }

  return (
    <Paper withBorder p='md'>
      <Stack gap='md'>
        <TextInput
          placeholder='Search by student number, name, program, or school...'
          leftSection={<IconSearch size={16} />}
          rightSection={isLoading && <Loader size='xs' />}
          value={searchQuery}
          onChange={(event) => onSearchChange?.(event.currentTarget.value)}
          size='sm'
        />

        <ScrollArea>
          <Table>
            <Table.Thead>
              <Table.Tr>
                <Table.Th miw={90}>Student No.</Table.Th>
                <Table.Th miw={isMobile ? 140 : 200}>Name</Table.Th>
                <Table.Th miw={isMobile ? 160 : 250}>Program</Table.Th>
                <Table.Th ta='center' miw={90}>
                  Semester
                </Table.Th>
                <Table.Th miw={100}>School</Table.Th>
                <Table.Th miw={120}>Phone</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {data.map((student, index) => (
                <Table.Tr key={`${student.stdNo}-${index}`}>
                  <Table.Td>
                    <Anchor
                      component={Link}
                      href={`/dashboard/students/${student.stdNo}`}
                      size='sm'
                      fw={500}
                    >
                      {student.stdNo}
                    </Anchor>
                  </Table.Td>
                  <Table.Td>
                    <Text size='sm'>{student.name}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size='sm' c='dimmed'>
                      {student.programName}
                    </Text>
                  </Table.Td>
                  <Table.Td ta='center'>
                    <Badge variant='light' size='sm'>
                      {formatSemester(student.semesterNumber, 'mini')}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Text size='sm' fw={500}>
                      {student.schoolCode}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size='sm'>{formatPhoneNumber(student.phone)}</Text>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </ScrollArea>

        <Group justify='space-between' wrap='wrap'>
          <Text size='sm' c='dimmed'>
            Showing {data.length} of {totalCount} student
            {totalCount !== 1 ? 's' : ''}
          </Text>

          {totalPages > 1 && (
            <Pagination
              total={totalPages}
              value={currentPage}
              onChange={onPageChange}
              size='sm'
            />
          )}
        </Group>
      </Stack>
    </Paper>
  );
}
