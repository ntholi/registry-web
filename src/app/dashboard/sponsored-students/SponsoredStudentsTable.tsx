'use client';

import React, { useState, useEffect } from 'react';
import {
  Table,
  Stack,
  Group,
  TextInput,
  Paper,
  Text,
  Skeleton,
  Center,
  Anchor,
  Pagination as MPagination,
  CloseButton,
  Title,
  Select,
  Button,
  Grid,
  GridCol,
} from '@mantine/core';
import { IconSearch, IconFilter, IconFilterX } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import {
  getAllSponsoredStudents,
  findAllSponsors,
} from '@/server/sponsors/actions';
import { getAllPrograms } from '@/server/schools/actions';
import Link from 'next/link';
import { useDebouncedValue } from '@mantine/hooks';
import EditSponsorDetailsModal from './EditSponsorDetailsModal';
import ImportAccountDetailsModal from './ImportAccountDetailsModal';

export default function SponsoredStudentsTable() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSponsor, setSelectedSponsor] = useState<string | null>(null);
  const [selectedProgram, setSelectedProgram] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [debouncedSearch] = useDebouncedValue(searchQuery, 300);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, selectedSponsor, selectedProgram]);

  const { data, isLoading } = useQuery({
    queryKey: [
      'all-sponsored-students',
      page,
      debouncedSearch,
      selectedSponsor,
      selectedProgram,
    ],
    queryFn: () =>
      getAllSponsoredStudents(
        page,
        debouncedSearch,
        selectedSponsor || undefined,
        selectedProgram || undefined
      ),
  });

  const { data: sponsors, isLoading: isLoadingSponsors } = useQuery({
    queryKey: ['sponsors-for-filter'],
    queryFn: () => findAllSponsors(1, '').then((response) => response.items),
  });

  const { data: programs, isLoading: isLoadingPrograms } = useQuery({
    queryKey: ['programs-for-filter'],
    queryFn: () => getAllPrograms(),
  });

  const clearFilters = () => {
    setSelectedSponsor(null);
    setSelectedProgram(null);
    setSearchQuery('');
    setPage(1);
  };

  const hasActiveFilters = selectedSponsor || selectedProgram || searchQuery;

  const renderTableHeaders = () => (
    <Table.Thead>
      <Table.Tr>
        <Table.Th> Std No.</Table.Th>
        <Table.Th>Names</Table.Th>
        <Table.Th>Program</Table.Th>
        <Table.Th>Sponsor</Table.Th>
        <Table.Th>Borrower Number</Table.Th>
        <Table.Th>Bank Name</Table.Th>
        <Table.Th>Account No.</Table.Th>
        <Table.Th>Status</Table.Th>
        <Table.Th></Table.Th>
      </Table.Tr>
    </Table.Thead>
  );

  const renderTableRows = () => {
    if (isLoading) {
      return (
        <Table.Tbody>
          {Array(5)
            .fill(0)
            .map((_, index) => (
              <Table.Tr key={`skeleton-row-${index}`}>
                <Table.Td>
                  <Skeleton height={20} width={100} />
                </Table.Td>
                <Table.Td>
                  <Skeleton height={20} width={150} />
                </Table.Td>
                <Table.Td>
                  <Skeleton height={20} width={200} />
                </Table.Td>
                <Table.Td>
                  <Skeleton height={20} width={120} />
                </Table.Td>
                <Table.Td>
                  <Skeleton height={20} width={120} />
                </Table.Td>
                <Table.Td>
                  <Skeleton height={20} width={120} />
                </Table.Td>
                <Table.Td>
                  <Skeleton height={20} width={120} />
                </Table.Td>
                <Table.Td>
                  <Skeleton height={20} width={80} />
                </Table.Td>
              </Table.Tr>
            ))}
        </Table.Tbody>
      );
    }

    if (!data?.items || data.items.length === 0) {
      return (
        <Table.Tbody>
          <Table.Tr>
            <Table.Td colSpan={9}>
              <Center p='md'>
                <Text c='dimmed'>
                  {hasActiveFilters
                    ? 'No sponsored students match your search criteria.'
                    : 'No sponsored students found.'}
                </Text>
              </Center>
            </Table.Td>
          </Table.Tr>
        </Table.Tbody>
      );
    }

    return (
      <Table.Tbody>
        {data.items.map((sponsoredStudent) => {
          const student = sponsoredStudent.student;
          const activeProgram = student?.programs?.find(
            (p) => p.status === 'Active'
          );
          const programName = activeProgram?.structure?.program?.name || 'N/A';

          return (
            <Table.Tr key={sponsoredStudent.id}>
              <Table.Td>
                {student?.stdNo ? (
                  <Anchor
                    size='sm'
                    component={Link}
                    href={`/dashboard/students/${student.stdNo}`}
                  >
                    {student.stdNo}
                  </Anchor>
                ) : (
                  <Text size='sm' c='dimmed'>
                    N/A
                  </Text>
                )}
              </Table.Td>
              <Table.Td>
                <Text size='sm'>{student?.name || 'N/A'}</Text>
              </Table.Td>
              <Table.Td>
                <Text size='sm'>{programName}</Text>
              </Table.Td>
              <Table.Td>
                {sponsoredStudent.sponsor ? (
                  <Anchor
                    size='sm'
                    component={Link}
                    href={`/dashboard/sponsors/${sponsoredStudent.sponsor.id}`}
                  >
                    {sponsoredStudent.sponsor.name}
                  </Anchor>
                ) : (
                  <Text size='sm' c='dimmed'>
                    N/A
                  </Text>
                )}
              </Table.Td>
              <Table.Td>
                <Text size='sm'>{sponsoredStudent.borrowerNo || '-'}</Text>
              </Table.Td>
              <Table.Td>
                <Text size='sm'>{sponsoredStudent.bankName || '-'}</Text>
              </Table.Td>
              <Table.Td>
                <Text size='sm'>{sponsoredStudent.accountNumber || '-'}</Text>
              </Table.Td>
              <Table.Td>
                {sponsoredStudent.sponsor?.name === 'NMDS' ? (
                  <Text
                    size='sm'
                    c={sponsoredStudent.confirmed ? 'green' : 'orange'}
                    fw={500}
                  >
                    {sponsoredStudent.confirmed ? 'Confirmed' : 'Pending'}
                  </Text>
                ) : (
                  <Text size='sm' c='dimmed'>
                    N/A
                  </Text>
                )}
              </Table.Td>
              <Table.Td>
                <EditSponsorDetailsModal
                  sponsoredStudent={{
                    id: sponsoredStudent.id,
                    sponsorId: sponsoredStudent.sponsorId,
                    stdNo: sponsoredStudent.stdNo,
                    borrowerNo: sponsoredStudent.borrowerNo || undefined,
                    bankName: sponsoredStudent.bankName || undefined,
                    accountNumber: sponsoredStudent.accountNumber || undefined,
                    sponsor: sponsoredStudent.sponsor,
                    student: {
                      stdNo: student?.stdNo || 0,
                      name: student?.name || 'N/A',
                    },
                  }}
                />
              </Table.Td>
            </Table.Tr>
          );
        })}
      </Table.Tbody>
    );
  };

  return (
    <Stack gap='md'>
      <Group justify='space-between' align='center'>
        <div>
          <Title order={2} fw={'lighter'}>
            Sponsored Students
          </Title>
          {isLoading && <Skeleton height={16} width={200} mt={4} />}
        </div>
        <Group gap='sm'>
          <ImportAccountDetailsModal />
          {hasActiveFilters && (
            <Button
              variant='light'
              size='xs'
              leftSection={<IconFilterX size='1rem' />}
              onClick={clearFilters}
            >
              Clear Filters
            </Button>
          )}
        </Group>
      </Group>

      {/* Search and Filters */}
      <Paper withBorder p='md'>
        <Stack gap='md'>
          <Group align='flex-end' gap='md'>
            <TextInput
              placeholder='Search by student name, number, sponsor, borrower number, bank name, or account number'
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.currentTarget.value)}
              style={{ flex: 1 }}
              rightSection={
                searchQuery ? (
                  <CloseButton
                    onClick={() => setSearchQuery('')}
                    variant='subtle'
                    size='sm'
                  />
                ) : null
              }
              leftSection={<IconSearch size='1.2rem' />}
            />
            {!isLoading && data && (
              <Paper withBorder p={8.5}>
                <Stack gap={2}>
                  <Text size='xs' c='dimmed' style={{ whiteSpace: 'nowrap' }}>
                    {data.items.length} of {data.totalItems} student
                    {data.totalItems !== 1 ? 's' : ''}
                  </Text>
                </Stack>
              </Paper>
            )}
          </Group>

          <Grid>
            <GridCol span={{ base: 12, sm: 6 }}>
              <Select
                label='Filter by Sponsor'
                placeholder='All Sponsors'
                data={
                  sponsors?.map((sponsor) => ({
                    value: sponsor.id.toString(),
                    label: sponsor.name,
                  })) || []
                }
                value={selectedSponsor}
                onChange={setSelectedSponsor}
                clearable
                searchable
                disabled={isLoadingSponsors}
                leftSection={<IconFilter size='1rem' />}
              />
            </GridCol>
            <GridCol span={{ base: 12, sm: 6 }}>
              <Select
                label='Filter by Program'
                placeholder='All Programs'
                data={
                  programs?.map((program) => ({
                    value: program.id.toString(),
                    label: `${program.code} - ${program.name}`,
                  })) || []
                }
                value={selectedProgram}
                onChange={setSelectedProgram}
                clearable
                searchable
                disabled={isLoadingPrograms}
                leftSection={<IconFilter size='1rem' />}
              />
            </GridCol>
          </Grid>
        </Stack>
      </Paper>

      <Table highlightOnHover withTableBorder>
        {renderTableHeaders()}
        {renderTableRows()}
      </Table>

      {data && data.totalPages > 1 && (
        <Group justify='center'>
          <MPagination
            total={data.totalPages}
            value={page}
            onChange={setPage}
            size='sm'
          />
        </Group>
      )}
    </Stack>
  );
}
