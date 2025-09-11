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
  Badge,
  Divider,
  Box,
  Grid,
  Paper,
  ThemeIcon,
  Collapse,
  ActionIcon,
} from '@mantine/core';
import {
  IconFilter,
  IconCalendar,
  IconBuilding,
  IconBook,
  IconSchool,
  IconChevronDown,
  IconChevronUp,
  IconX,
  IconSearch,
} from '@tabler/icons-react';
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

export interface RegistrationReportFilter {
  termId?: number;
  schoolId?: number;
  programId?: number;
  semesterNumber?: number;
}

interface RegistrationFilterProps {
  filter: RegistrationReportFilter;
  onFilterChange: (filter: RegistrationReportFilter) => void;
}

export default function RegistrationFilter({
  filter,
  onFilterChange,
}: RegistrationFilterProps) {
  const [opened, { toggle, close }] = useDisclosure(false);
  const [showAdvanced, { toggle: toggleAdvanced }] = useDisclosure(false);

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

  const previewDescription = useMemo(() => {
    const { term, school, program, semester } = selectedInfo;

    if (!term) {
      return 'Please select a term to generate reports';
    }

    let desc = `${term.name} registration report`;

    if (program) {
      desc = `${program.code} students for ${term.name}`;
    } else if (school) {
      desc = `${school.code} students for ${term.name}`;
    }

    if (semester) {
      desc += ` (${getSemesterShortLabel(semester)})`;
    }

    return desc;
  }, [selectedInfo]);

  const handleApplyFilters = () => {
    const newFilter: RegistrationReportFilter = {
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
      <Card withBorder radius='md' style={{ minWidth: '300px' }}>
        <Group justify='space-between' mb='sm'>
          <Group>
            <ThemeIcon variant='light' size='sm'>
              <IconFilter size={14} />
            </ThemeIcon>
            <Text fw={500} size='sm'>
              Report Filters
            </Text>
          </Group>
          <Button
            variant={hasActiveFilters ? 'filled' : 'light'}
            size='xs'
            onClick={toggle}
            leftSection={<IconSearch size={14} />}
          >
            Configure
          </Button>
        </Group>

        {hasActiveFilters && (
          <Stack gap='xs'>
            {filter.termId && selectedInfo.term && (
              <Badge
                variant='light'
                color='blue'
                leftSection={<IconCalendar size={12} />}
                rightSection={
                  <ActionIcon
                    size='xs'
                    variant='transparent'
                    onClick={() => {
                      const newFilter = { ...filter };
                      delete newFilter.termId;
                      onFilterChange(newFilter);
                    }}
                  >
                    <IconX size={10} />
                  </ActionIcon>
                }
              >
                {selectedInfo.term.name}
              </Badge>
            )}

            {filter.schoolId && selectedInfo.school && (
              <Badge
                variant='light'
                color='green'
                leftSection={<IconBuilding size={12} />}
                rightSection={
                  <ActionIcon
                    size='xs'
                    variant='transparent'
                    onClick={() => {
                      const newFilter = { ...filter };
                      delete newFilter.schoolId;
                      delete newFilter.programId; // Clear program too
                      onFilterChange(newFilter);
                    }}
                  >
                    <IconX size={10} />
                  </ActionIcon>
                }
              >
                {selectedInfo.school.code}
              </Badge>
            )}

            {filter.programId && selectedInfo.program && (
              <Badge
                variant='light'
                color='orange'
                leftSection={<IconBook size={12} />}
                rightSection={
                  <ActionIcon
                    size='xs'
                    variant='transparent'
                    onClick={() => {
                      const newFilter = { ...filter };
                      delete newFilter.programId;
                      onFilterChange(newFilter);
                    }}
                  >
                    <IconX size={10} />
                  </ActionIcon>
                }
              >
                {selectedInfo.program.code}
              </Badge>
            )}

            {filter.semesterNumber && (
              <Badge
                variant='light'
                color='purple'
                leftSection={<IconSchool size={12} />}
                rightSection={
                  <ActionIcon
                    size='xs'
                    variant='transparent'
                    onClick={() => {
                      const newFilter = { ...filter };
                      delete newFilter.semesterNumber;
                      onFilterChange(newFilter);
                    }}
                  >
                    <IconX size={10} />
                  </ActionIcon>
                }
              >
                {getSemesterShortLabel(filter.semesterNumber)}
              </Badge>
            )}

            <Text size='xs' c='dimmed' mt='xs'>
              {previewDescription}
            </Text>
          </Stack>
        )}

        {!hasActiveFilters && (
          <Text size='sm' c='dimmed'>
            No filters applied - showing all data
          </Text>
        )}
      </Card>

      <Modal
        opened={opened}
        onClose={close}
        title='Configure Report Filters'
        size='lg'
        centered
      >
        <Stack gap='md'>
          <Paper p='md' withBorder>
            <Group justify='space-between' mb='md'>
              <Group>
                <ThemeIcon variant='light' color='blue'>
                  <IconCalendar size={16} />
                </ThemeIcon>
                <Text fw={500}>Required Selection</Text>
              </Group>
            </Group>

            <Select
              label='Academic Term'
              placeholder='Select the academic term for the report'
              data={terms.map((term) => ({
                value: term.id?.toString() || '',
                label: term.name,
              }))}
              rightSection={termsLoading && <Loader size='xs' />}
              value={localFilter.termId || null}
              onChange={(value) =>
                setLocalFilter((prev) => ({
                  ...prev,
                  termId: value || '',
                }))
              }
              searchable
              clearable
              required
              description='Select the academic term to generate reports for'
            />
          </Paper>

          <Paper p='md' withBorder>
            <Group
              justify='space-between'
              mb='md'
              onClick={toggleAdvanced}
              style={{ cursor: 'pointer' }}
            >
              <Group>
                <ThemeIcon variant='light' color='green'>
                  <IconFilter size={16} />
                </ThemeIcon>
                <Text fw={500}>Advanced Filters</Text>
                <Text size='xs' c='dimmed'>
                  (Optional)
                </Text>
              </Group>
              <ActionIcon variant='subtle'>
                {showAdvanced ? (
                  <IconChevronUp size={16} />
                ) : (
                  <IconChevronDown size={16} />
                )}
              </ActionIcon>
            </Group>

            <Collapse in={showAdvanced}>
              <Grid>
                <Grid.Col span={6}>
                  <Select
                    label='School/Faculty'
                    placeholder='Filter by school'
                    data={schools.map((school) => ({
                      value: school.id?.toString() || '',
                      label: `${school.code} - ${school.name}`,
                    }))}
                    rightSection={schoolsLoading && <Loader size='xs' />}
                    value={localFilter.schoolId || null}
                    onChange={(value) =>
                      setLocalFilter((prev) => ({
                        ...prev,
                        schoolId: value || '',
                        programId: '',
                      }))
                    }
                    searchable
                    clearable
                    description='Narrow results to a specific school'
                  />
                </Grid.Col>

                <Grid.Col span={6}>
                  <Select
                    label='Program'
                    placeholder='Filter by program'
                    data={programs.map((program) => ({
                      value: program.id?.toString() || '',
                      label: `${program.code} - ${program.name}`,
                    }))}
                    rightSection={programsLoading && <Loader size='xs' />}
                    value={localFilter.programId || null}
                    onChange={(value) =>
                      setLocalFilter((prev) => ({
                        ...prev,
                        programId: value || '',
                      }))
                    }
                    searchable
                    clearable
                    disabled={!localFilter.schoolId}
                    description='Select a program within the chosen school'
                  />
                </Grid.Col>

                <Grid.Col span={12}>
                  <Select
                    label='Semester Level'
                    placeholder='Filter by semester'
                    data={semesterOptions}
                    value={localFilter.semesterNumber || null}
                    onChange={(value) =>
                      setLocalFilter((prev) => ({
                        ...prev,
                        semesterNumber: value || '',
                      }))
                    }
                    searchable
                    clearable
                    description='Filter students by their current semester level'
                  />
                </Grid.Col>
              </Grid>
            </Collapse>
          </Paper>

          <Divider />

          <Box>
            <Text size='sm' fw={500} mb='xs'>
              Preview:
            </Text>
            <Paper p='sm' bg='gray.0' style={{ borderRadius: '8px' }}>
              <Text size='sm' c={hasValidSelection ? 'dark' : 'dimmed'}>
                {previewDescription}
              </Text>
            </Paper>
          </Box>

          <Group justify='space-between'>
            <Button variant='subtle' onClick={handleClearAll} color='red'>
              Clear All
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
                Apply Filters
              </Button>
            </Group>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}
