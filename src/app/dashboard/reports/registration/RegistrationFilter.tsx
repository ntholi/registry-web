'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useDisclosure } from '@mantine/hooks';
import {
  Button,
  Card,
  Group,
  Loader,
  Modal,
  Select,
  Stack,
  Text,
  ThemeIcon,
  Divider,
} from '@mantine/core';
import { IconFilter, IconSearch } from '@tabler/icons-react';
import {
  getAvailableTermsForReport,
  getAvailableSchoolsForReports,
  getAvailableProgramsForReports,
} from '@/server/reports/registration/actions';

const getSemesterLabel = (semesterNumber: number): string => {
  const year = Math.ceil(semesterNumber / 2);
  const semester = semesterNumber % 2 === 0 ? 2 : 1;
  return `Year ${year} Semester ${semester}`;
};

const getSemesterShortLabel = (semesterNumber: number): string => {
  const year = Math.ceil(semesterNumber / 2);
  const semester = semesterNumber % 2 === 0 ? 2 : 1;
  return `Y${year}S${semester}`;
};

const semesterOptions = Array.from({ length: 8 }, (_, i) => {
  const semesterNumber = i + 1;
  return {
    value: semesterNumber.toString(),
    label: getSemesterLabel(semesterNumber),
  };
});

export interface ReportFilter {
  termId?: number;
  schoolId?: number;
  programId?: number;
  semesterNumber?: number;
}

interface Props {
  filter: ReportFilter;
  onFilterChange: (filter: ReportFilter) => void;
}

export default function RegistrationFilter({ filter, onFilterChange }: Props) {
  const [opened, { toggle, close }] = useDisclosure(false);

  const [localFilter, setLocalFilter] = useState<{
    termId: string;
    schoolId: string;
    programId: string;
    semesterNumber: string;
  }>({
    termId: filter.termId?.toString() || '',
    schoolId: filter.schoolId?.toString() || '',
    programId: filter.programId?.toString() || '',
    semesterNumber: filter.semesterNumber?.toString() || '',
  });

  useEffect(() => {
    setLocalFilter({
      termId: filter.termId?.toString() || '',
      schoolId: filter.schoolId?.toString() || '',
      programId: filter.programId?.toString() || '',
      semesterNumber: filter.semesterNumber?.toString() || '',
    });
  }, [filter]);

  const { data: terms = [], isLoading: termsLoading } = useQuery({
    queryKey: ['registration-report-terms'],
    queryFn: async () => {
      const result = await getAvailableTermsForReport();
      return result.success ? result.data : [];
    },
    enabled: opened,
  });

  const { data: schools = [], isLoading: schoolsLoading } = useQuery({
    queryKey: ['registration-report-schools'],
    queryFn: async () => {
      const result = await getAvailableSchoolsForReports();
      return result.success ? result.data : [];
    },
    enabled: opened,
  });

  const { data: programs = [], isLoading: programsLoading } = useQuery({
    queryKey: ['registration-report-programs', localFilter.schoolId],
    queryFn: async () => {
      const result = await getAvailableProgramsForReports(
        localFilter.schoolId ? Number(localFilter.schoolId) : undefined
      );
      return result.success ? result.data : [];
    },
    enabled: !!localFilter.schoolId && opened,
  });

  useEffect(() => {
    if (localFilter.schoolId !== filter.schoolId?.toString()) {
      setLocalFilter((prev) => ({ ...prev, programId: '' }));
    }
  }, [localFilter.schoolId, filter.schoolId]);

  const selectedInfo = useMemo(() => {
    const selectedTerm = terms.find(
      (t) => t.id?.toString() === localFilter.termId
    );
    const selectedSchool = schools.find(
      (s) => s.id?.toString() === localFilter.schoolId
    );
    const selectedProgram = programs.find(
      (p) => p.id?.toString() === localFilter.programId
    );
    const selectedSemester = localFilter.semesterNumber
      ? Number(localFilter.semesterNumber)
      : null;

    return {
      term: selectedTerm,
      school: selectedSchool,
      program: selectedProgram,
      semester: selectedSemester,
    };
  }, [localFilter, terms, schools, programs]);

  const summaryText = useMemo(() => {
    const { term, school, program, semester } = selectedInfo;
    if (!term) return 'Select a term to start';
    const detail = program
      ? program.code
      : school
        ? school.code
        : 'All Schools';
    const sem = semester ? ` · ${getSemesterShortLabel(semester)}` : '';
    return `${term.name} · ${detail}${sem}`;
  }, [selectedInfo]);

  const handleApplyFilters = () => {
    const newFilter: ReportFilter = {
      termId: localFilter.termId ? Number(localFilter.termId) : undefined,
      schoolId: localFilter.schoolId ? Number(localFilter.schoolId) : undefined,
      programId: localFilter.programId
        ? Number(localFilter.programId)
        : undefined,
      semesterNumber: localFilter.semesterNumber
        ? Number(localFilter.semesterNumber)
        : undefined,
    };
    onFilterChange(newFilter);
    close();
  };

  const handleClearFilters = () => {
    setLocalFilter({
      termId: '',
      schoolId: '',
      programId: '',
      semesterNumber: '',
    });
  };

  const handleClearAll = () => {
    handleClearFilters();
    onFilterChange({});
    close();
  };

  const hasActiveFilters = Boolean(
    filter.termId ||
      filter.schoolId ||
      filter.programId ||
      filter.semesterNumber
  );

  const hasValidSelection = Boolean(localFilter.termId);

  return (
    <>
      <Card withBorder style={{ minWidth: '300px' }}>
        <Group justify='space-between' mb='xs'>
          <Text size='sm' c='dimmed'>
            {summaryText}
          </Text>
          <Button
            variant={hasActiveFilters ? 'white' : 'light'}
            size='sm'
            onClick={toggle}
            leftSection={<IconFilter size={14} />}
          >
            {hasActiveFilters ? 'Edit' : 'Filter'}
          </Button>
        </Group>
      </Card>

      <Modal
        opened={opened}
        onClose={close}
        title='Report Filters'
        size='md'
        centered
      >
        <Stack gap='md'>
          <Select
            label='Academic Term'
            placeholder='Select term'
            data={terms.map((term) => ({
              value: term.id?.toString() || '',
              label: term.name,
            }))}
            rightSection={termsLoading && <Loader size='xs' />}
            value={localFilter.termId || null}
            onChange={(value) => {
              const updated = { ...localFilter, termId: value || '' };
              setLocalFilter(updated);
              if (value === null) {
                const newFilter: ReportFilter = {
                  termId: undefined,
                  schoolId: updated.schoolId
                    ? Number(updated.schoolId)
                    : undefined,
                  programId: updated.programId
                    ? Number(updated.programId)
                    : undefined,
                  semesterNumber: updated.semesterNumber
                    ? Number(updated.semesterNumber)
                    : undefined,
                };
                onFilterChange(newFilter);
              }
            }}
            searchable
            clearable
            required
          />
          <Select
            label='School'
            placeholder='All schools'
            data={schools.map((school) => ({
              value: school.id?.toString() || '',
              label: `${school.code} - ${school.name}`,
            }))}
            rightSection={schoolsLoading && <Loader size='xs' />}
            value={localFilter.schoolId || null}
            onChange={(value) => {
              const updated = {
                ...localFilter,
                schoolId: value || '',
                programId: '',
              };
              setLocalFilter(updated);
              if (value === null) {
                const newFilter: ReportFilter = {
                  termId: updated.termId ? Number(updated.termId) : undefined,
                  schoolId: undefined,
                  programId: undefined,
                  semesterNumber: updated.semesterNumber
                    ? Number(updated.semesterNumber)
                    : undefined,
                };
                onFilterChange(newFilter);
              }
            }}
            searchable
            clearable
          />
          <Select
            label='Program'
            placeholder='All programs'
            data={programs.map((program) => ({
              value: program.id?.toString() || '',
              label: `${program.code} - ${program.name}`,
            }))}
            rightSection={programsLoading && <Loader size='xs' />}
            value={localFilter.programId || null}
            onChange={(value) => {
              const updated = { ...localFilter, programId: value || '' };
              setLocalFilter(updated);
              if (value === null) {
                const newFilter: ReportFilter = {
                  termId: updated.termId ? Number(updated.termId) : undefined,
                  schoolId: updated.schoolId
                    ? Number(updated.schoolId)
                    : undefined,
                  programId: undefined,
                  semesterNumber: updated.semesterNumber
                    ? Number(updated.semesterNumber)
                    : undefined,
                };
                onFilterChange(newFilter);
              }
            }}
            searchable
            clearable
            disabled={!localFilter.schoolId}
          />
          <Select
            label='Semester'
            placeholder='Any'
            data={semesterOptions}
            value={localFilter.semesterNumber || null}
            onChange={(value) => {
              const updated = { ...localFilter, semesterNumber: value || '' };
              setLocalFilter(updated);
              if (value === null) {
                const newFilter: ReportFilter = {
                  termId: updated.termId ? Number(updated.termId) : undefined,
                  schoolId: updated.schoolId
                    ? Number(updated.schoolId)
                    : undefined,
                  programId: updated.programId
                    ? Number(updated.programId)
                    : undefined,
                  semesterNumber: undefined,
                };
                onFilterChange(newFilter);
              }
            }}
            searchable
            clearable
          />
          <Divider />
          <Group justify='space-between'>
            <Button variant='light' color='red' onClick={handleClearAll}>
              Reset
            </Button>
            <Group>
              <Button variant='outline' onClick={close}>
                Cancel
              </Button>
              <Button
                onClick={handleApplyFilters}
                disabled={!hasValidSelection}
                leftSection={<IconSearch size={16} />}
              >
                Apply
              </Button>
            </Group>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}
