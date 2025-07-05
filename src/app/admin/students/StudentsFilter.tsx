'use client';

import {
  ActionIcon,
  Text,
  Tooltip,
  Modal,
  Stack,
  Select,
  Button,
  Group,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconFilter } from '@tabler/icons-react';
import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getAllSchools } from '@/server/schools/actions';
import {
  getAllPrograms,
  getProgramsBySchoolId,
} from '@/server/students/actions';
import { getAllTerms } from '@/server/terms/actions';
import { useQueryState } from 'nuqs';

// Utility function to convert semester number to readable format
const getSemesterLabel = (semesterNumber: number): string => {
  const year = Math.ceil(semesterNumber / 2);
  const semester = semesterNumber % 2 === 0 ? 2 : 1;
  return `Year ${year} Semester ${semester}`;
};

// Generate semester options (1-10)
const semesterOptions = Array.from({ length: 10 }, (_, i) => {
  const semesterNumber = i + 1;
  return {
    value: semesterNumber.toString(),
    label: getSemesterLabel(semesterNumber),
  };
});

export default function StudentsFilter() {
  const [opened, { toggle, close }] = useDisclosure(false);

  const [schoolId, setSchoolId] = useQueryState('schoolId');
  const [programId, setProgramId] = useQueryState('programId');
  const [termId, setTermId] = useQueryState('termId');
  const [semesterNumber, setSemesterNumber] = useQueryState('semesterNumber');

  const [filters, setFilters] = useState({
    schoolId: schoolId || '',
    programId: programId || '',
    termId: termId || '',
    semesterNumber: semesterNumber || '',
  });

  useEffect(() => {
    setFilters({
      schoolId: schoolId || '',
      programId: programId || '',
      termId: termId || '',
      semesterNumber: semesterNumber || '',
    });
  }, [schoolId, programId, termId, semesterNumber]);

  const { data: schools = [] } = useQuery({
    queryKey: ['schools'],
    queryFn: getAllSchools,
  });

  // Only fetch programs when a school is selected
  const { data: programs = [] } = useQuery({
    queryKey: ['programs', filters.schoolId],
    queryFn: () =>
      filters.schoolId
        ? getProgramsBySchoolId(Number(filters.schoolId))
        : getAllPrograms(),
    enabled: true, // Always enabled, but will fetch all programs if no school is selected
  });

  const { data: terms = [] } = useQuery({
    queryKey: ['terms'],
    queryFn: getAllTerms,
  });

  // Reset program when school changes
  useEffect(() => {
    if (filters.schoolId !== schoolId) {
      setFilters((prev) => ({ ...prev, programId: '' }));
    }
  }, [filters.schoolId, schoolId]);

  const handleApplyFilters = () => {
    setSchoolId(filters.schoolId || null);
    setProgramId(filters.programId || null);
    setTermId(filters.termId || null);
    setSemesterNumber(filters.semesterNumber || null);
    close();
  };

  const handleClearFilters = () => {
    setFilters({
      schoolId: '',
      programId: '',
      termId: '',
      semesterNumber: '',
    });
    setSchoolId(null);
    setProgramId(null);
    setTermId(null);
    setSemesterNumber(null);
    close();
  };

  const hasActiveFilters = schoolId || programId || termId || semesterNumber;

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
            value={filters.schoolId || null}
            onChange={(value) =>
              setFilters((prev) => ({
                ...prev,
                schoolId: value || '',
                programId: '', // Reset program when school changes
              }))
            }
            searchable
            clearable
          />

          <Select
            label='Program'
            placeholder='Select program'
            data={programs.map((program) => ({
              value: program.id.toString(),
              label: program.name,
            }))}
            value={filters.programId || null}
            onChange={(value) =>
              setFilters((prev) => ({
                ...prev,
                programId: value || '',
              }))
            }
            searchable
            clearable
            disabled={!filters.schoolId}
          />

          <Select
            label='Term'
            placeholder='Select term'
            data={terms.map((term) => ({
              value: term.id.toString(),
              label: term.name,
            }))}
            value={filters.termId || null}
            onChange={(value) =>
              setFilters((prev) => ({
                ...prev,
                termId: value || '',
              }))
            }
            searchable
            clearable
          />

          <Select
            label='Semester'
            placeholder='Select semester'
            data={semesterOptions}
            value={filters.semesterNumber || null}
            onChange={(value) =>
              setFilters((prev) => ({
                ...prev,
                semesterNumber: value || '',
              }))
            }
            searchable
            clearable
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
