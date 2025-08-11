'use client';

import { getAllSponsoredStudents } from '@/server/sponsors/actions';
import {
  Anchor,
  Center,
  Group,
  Pagination as MPagination,
  Skeleton,
  Stack,
  Table,
  Text,
  Title,
} from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import EditSponsorDetailsModal from './EditSponsorDetailsModal';
import ImportAccountDetailsModal from './ImportAccountDetailsModal';
import DownloadSponsoredStudentsButton from './DownloadButton';
import NewSponsoredStudentModal from './NewSponsoredStudentModal';
import SponsoredStudentsHeader from './SponsoredStudentsHeader';

export default function SponsoredStudentsTable() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSponsor, setSelectedSponsor] = useState<string | null>(null);
  const [selectedProgram, setSelectedProgram] = useState<string | null>(null);
  const [selectedConfirmation, setSelectedConfirmation] = useState<
    string | null
  >(null);
  const [selectedTerm, setSelectedTerm] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [debouncedSearch] = useDebouncedValue(searchQuery, 300);

  useEffect(() => {
    setPage(1);
  }, [
    debouncedSearch,
    selectedSponsor,
    selectedProgram,
    selectedConfirmation,
    selectedTerm,
  ]);

  const { data, isLoading } = useQuery({
    queryKey: [
      'all-sponsored-students',
      page,
      debouncedSearch,
      selectedSponsor,
      selectedProgram,
      selectedConfirmation,
      selectedTerm,
    ],
    queryFn: () =>
      getAllSponsoredStudents(
        page,
        debouncedSearch,
        selectedSponsor || undefined,
        selectedProgram || undefined,
        selectedConfirmation === 'confirmed'
          ? true
          : selectedConfirmation === 'pending'
            ? false
            : undefined,
        selectedTerm || undefined
      ),
  });

  const clearFilters = () => {
    setSelectedSponsor(null);
    setSelectedProgram(null);
    setSelectedConfirmation(null);
    setSelectedTerm(null);
    setSearchQuery('');
    setPage(1);
  };

  const hasActiveFilters = Boolean(
    selectedSponsor ||
      selectedProgram ||
      selectedConfirmation ||
      selectedTerm ||
      searchQuery
  );

  const renderTableHeaders = () => (
    <Table.Thead>
      <Table.Tr>
        <Table.Th>Std No.</Table.Th>
        <Table.Th>Names</Table.Th>
        <Table.Th>Program</Table.Th>
        <Table.Th>Sponsor</Table.Th>
        <Table.Th>Borrower Number</Table.Th>
        <Table.Th>Bank</Table.Th>
        <Table.Th>Account No.</Table.Th>
        <Table.Th>Confirmation</Table.Th>
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
                  <Skeleton height={20} width='80%' />
                </Table.Td>
                <Table.Td>
                  <Skeleton height={20} width='90%' />
                </Table.Td>
                <Table.Td>
                  <Skeleton height={20} width='85%' />
                </Table.Td>
                <Table.Td>
                  <Skeleton height={20} width='80%' />
                </Table.Td>
                <Table.Td>
                  <Skeleton height={20} width='75%' />
                </Table.Td>
                <Table.Td>
                  <Skeleton height={20} width='75%' />
                </Table.Td>
                <Table.Td>
                  <Skeleton height={20} width='85%' />
                </Table.Td>
                <Table.Td>
                  <Skeleton height={20} width='70%' />
                </Table.Td>
                <Table.Td>
                  <Skeleton height={20} width='60%' />
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
                    confirmed: sponsoredStudent.confirmed ?? false,
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
    <Stack gap='lg'>
      <Group justify='space-between' align='center'>
        <Title order={2} fw={500}>
          Sponsored Students
        </Title>
        <Group gap='sm'>
          <NewSponsoredStudentModal />
          <ImportAccountDetailsModal />
          <DownloadSponsoredStudentsButton
            searchQuery={searchQuery}
            sponsorId={selectedSponsor}
            programId={selectedProgram}
            confirmation={selectedConfirmation}
            termId={selectedTerm}
          />
        </Group>
      </Group>

      <SponsoredStudentsHeader
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedSponsor={selectedSponsor}
        onSponsorChange={setSelectedSponsor}
        selectedProgram={selectedProgram}
        onProgramChange={setSelectedProgram}
        selectedConfirmation={selectedConfirmation}
        onConfirmationChange={setSelectedConfirmation}
        selectedTerm={selectedTerm}
        onTermChange={setSelectedTerm}
        onClearFilters={clearFilters}
        hasActiveFilters={hasActiveFilters}
      />

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
