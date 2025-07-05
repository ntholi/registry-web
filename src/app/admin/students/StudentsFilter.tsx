'use client';

import {
  ActionIcon,
  Text,
  Tooltip,
  Modal,
  Stack,
  Select,
  NumberInput,
  Button,
  Group,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconFilter } from '@tabler/icons-react';
import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getAllSchools } from '@/server/schools/actions';
import { getAllPrograms } from '@/server/students/actions';
import { getAllTerms } from '@/server/terms/actions';
import { useSearchParams, useRouter } from 'next/navigation';

interface FilterState {
  schoolId?: number;
  programId?: number;
  termId?: number;
  semesterNumber?: number;
}

export default function StudentsFilter() {
  const [opened, { toggle, close }] = useDisclosure(false);
  const searchParams = useSearchParams();
  const router = useRouter();

  const [filters, setFilters] = useState<FilterState>({
    schoolId: searchParams.get('schoolId')
      ? Number(searchParams.get('schoolId'))
      : undefined,
    programId: searchParams.get('programId')
      ? Number(searchParams.get('programId'))
      : undefined,
    termId: searchParams.get('termId')
      ? Number(searchParams.get('termId'))
      : undefined,
    semesterNumber: searchParams.get('semesterNumber')
      ? Number(searchParams.get('semesterNumber'))
      : undefined,
  });

  const { data: schools = [] } = useQuery({
    queryKey: ['schools'],
    queryFn: getAllSchools,
  });

  const { data: programs = [] } = useQuery({
    queryKey: ['programs'],
    queryFn: getAllPrograms,
  });

  const { data: terms = [] } = useQuery({
    queryKey: ['terms'],
    queryFn: getAllTerms,
  });

  const handleApplyFilters = () => {
    const newSearchParams = new URLSearchParams(searchParams);

    // Remove existing filter params
    newSearchParams.delete('schoolId');
    newSearchParams.delete('programId');
    newSearchParams.delete('termId');
    newSearchParams.delete('semesterNumber');

    // Add new filter params
    if (filters.schoolId)
      newSearchParams.set('schoolId', filters.schoolId.toString());
    if (filters.programId)
      newSearchParams.set('programId', filters.programId.toString());
    if (filters.termId)
      newSearchParams.set('termId', filters.termId.toString());
    if (filters.semesterNumber)
      newSearchParams.set('semesterNumber', filters.semesterNumber.toString());

    // Reset to page 1 when filters change
    newSearchParams.set('page', '1');

    router.push(`?${newSearchParams.toString()}`);
    close();
  };

  const handleClearFilters = () => {
    setFilters({});
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.delete('schoolId');
    newSearchParams.delete('programId');
    newSearchParams.delete('termId');
    newSearchParams.delete('semesterNumber');
    newSearchParams.set('page', '1');
    router.push(`?${newSearchParams.toString()}`);
    close();
  };

  const hasActiveFilters =
    filters.schoolId ||
    filters.programId ||
    filters.termId ||
    filters.semesterNumber;

  return (
    <>
      <Tooltip label='Filter Students' color='gray'>
        <ActionIcon
          variant={hasActiveFilters ? 'filled' : 'outline'}
          size={33}
          onClick={toggle}
          color={hasActiveFilters ? 'blue' : undefined}
        >
          <IconFilter size={'1rem'} />
        </ActionIcon>
      </Tooltip>
      <Modal opened={opened} onClose={close} title='Filter Students' size='md'>
        <Stack gap='md'>
          <Select
            label='School'
            placeholder='Select school'
            data={schools.map((school) => ({
              value: school.id.toString(),
              label: school.name,
            }))}
            value={filters.schoolId?.toString() || null}
            onChange={(value) =>
              setFilters((prev) => ({
                ...prev,
                schoolId: value ? Number(value) : undefined,
              }))
            }
            clearable
          />

          <Select
            label='Program'
            placeholder='Select program'
            data={programs.map((program) => ({
              value: program.id.toString(),
              label: program.name,
            }))}
            value={filters.programId?.toString() || null}
            onChange={(value) =>
              setFilters((prev) => ({
                ...prev,
                programId: value ? Number(value) : undefined,
              }))
            }
            clearable
          />

          <Select
            label='Term'
            placeholder='Select term'
            data={terms.map((term) => ({
              value: term.id.toString(),
              label: term.name,
            }))}
            value={filters.termId?.toString() || null}
            onChange={(value) =>
              setFilters((prev) => ({
                ...prev,
                termId: value ? Number(value) : undefined,
              }))
            }
            clearable
          />

          <NumberInput
            label='Semester Number'
            placeholder='Enter semester number'
            value={filters.semesterNumber || ''}
            onChange={(value) =>
              setFilters((prev) => ({
                ...prev,
                semesterNumber: typeof value === 'number' ? value : undefined,
              }))
            }
            min={1}
            max={10}
          />

          <Group justify='flex-end' gap='sm'>
            <Button variant='outline' onClick={handleClearFilters}>
              Clear All
            </Button>
            <Button onClick={handleApplyFilters}>Apply Filters</Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}
