'use client';
import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useDebouncedValue } from '@mantine/hooks';
import {
  Container,
  Title,
  Stack,
  Box,
  Paper,
  Group,
  Button,
  Text,
  ThemeIcon,
  Alert,
  Tabs,
  Divider,
} from '@mantine/core';
import {
  IconFileText,
  IconUsers,
  IconChartBar,
  IconDownload,
  IconInfoCircle,
} from '@tabler/icons-react';
import {
  getRegistrationDataPreview,
  getPaginatedRegistrationStudents,
  generateFullRegistrationReport,
  generateSummaryRegistrationReport,
  generateStudentsListReport,
} from '@/server/reports/registration/actions';
import ProgramBreakdownTable from './ProgramBreakdownTable';
import StudentTable from './StudentTable';
import RegistrationFilter, { type ReportFilter } from './RegistrationFilter';
import { notifications } from '@mantine/notifications';

const PAGE_SIZE = 20;

export default function RegistrationReportPage() {
  const [filter, setFilter] = useState<ReportFilter>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch] = useDebouncedValue(searchQuery, 500);
  const [isExportingSummary, setIsExportingSummary] = useState(false);
  const [isExportingStudents, setIsExportingStudents] = useState(false);

  const {
    data: reportData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['registration-data-preview', filter],
    queryFn: async () => {
      if (!filter.termId) return null;
      const result = await getRegistrationDataPreview(filter.termId, filter);
      return result.success ? result.data : null;
    },
    enabled: Boolean(filter.termId),
  });

  const { data: studentsData, isLoading: isLoadingStudents } = useQuery({
    queryKey: [
      'registration-students-paginated',
      filter,
      currentPage,
      debouncedSearch,
    ],
    queryFn: async () => {
      if (!filter.termId) return null;
      const result = await getPaginatedRegistrationStudents(
        filter.termId,
        currentPage,
        PAGE_SIZE,
        { ...filter, searchQuery: debouncedSearch }
      );
      return result.success ? result.data : null;
    },
    enabled: Boolean(filter.termId),
  });

  const canGenerateReport = Boolean(filter.termId);
  const hasData = Boolean(
    reportData &&
      ((reportData.summaryData?.schools &&
        reportData.summaryData.schools.length > 0) ||
        (studentsData?.students && studentsData.students.length > 0))
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleFilterChange = (newFilter: ReportFilter) => {
    setFilter(newFilter);
    setCurrentPage(1);
    setSearchQuery('');
  };

  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  }, []);

  const handleExportSummary = async () => {
    if (!filter.termId) return;

    setIsExportingSummary(true);
    try {
      const result = await generateSummaryRegistrationReport(
        filter.termId,
        filter
      );

      if (result.success && result.data) {
        const byteCharacters = atob(result.data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], {
          type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        });

        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `program-enrollment-summary-${new Date().toISOString().split('T')[0]}.docx`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        notifications.show({
          title: 'Success',
          message: 'Summary report exported successfully',
          color: 'green',
        });
      } else {
        notifications.show({
          title: 'Error',
          message: result.error || 'Failed to export summary report',
          color: 'red',
        });
      }
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'An unexpected error occurred while exporting',
        color: 'red',
      });
    } finally {
      setIsExportingSummary(false);
    }
  };

  const handleExportStudents = async () => {
    if (!filter.termId) return;

    setIsExportingStudents(true);
    try {
      const result = await generateStudentsListReport(filter.termId, filter);

      if (result.success && result.data) {
        const byteCharacters = atob(result.data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        });

        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `registered-students-${new Date().toISOString().split('T')[0]}.xlsx`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        notifications.show({
          title: 'Success',
          message: 'Students list exported successfully',
          color: 'green',
        });
      } else {
        notifications.show({
          title: 'Error',
          message: result.error || 'Failed to export students list',
          color: 'red',
        });
      }
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'An unexpected error occurred while exporting',
        color: 'red',
      });
    } finally {
      setIsExportingStudents(false);
    }
  };

  return (
    <Container size='xl' p='lg'>
      <Stack gap='lg'>
        <Paper p='lg' withBorder>
          <Group justify='space-between' align='flex-start' mb='md'>
            <Box>
              <Group mb='sm'>
                <ThemeIcon variant='light' size='lg'>
                  <IconFileText size={20} />
                </ThemeIcon>
                <Box>
                  <Title order={2} size='h3'>
                    Registration Reports
                  </Title>
                  <Text size='sm' c='dimmed'>
                    Comprehensive student registration data and program
                    enrollment statistics
                  </Text>
                </Box>
              </Group>
            </Box>
          </Group>
          <RegistrationFilter
            filter={filter}
            onFilterChange={handleFilterChange}
          />

          {canGenerateReport && !hasData && !isLoading && (
            <Alert
              icon={<IconInfoCircle size={16} />}
              title='No Data Available'
              color='yellow'
              variant='light'
            >
              No registration data found for the selected criteria. Try
              adjusting your filters or selecting a different academic term.
            </Alert>
          )}
        </Paper>

        {canGenerateReport && (
          <Tabs defaultValue='summary' variant='default'>
            <Tabs.List grow>
              <Tabs.Tab
                value='summary'
                leftSection={<IconChartBar size={16} />}
              >
                Summary View
              </Tabs.Tab>
              <Tabs.Tab value='students' leftSection={<IconUsers size={16} />}>
                Student List
              </Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value='summary' pt='lg'>
              <Paper withBorder p={0} style={{ overflow: 'hidden' }}>
                <Box p='md'>
                  <Group justify='space-between'>
                    <Group>
                      <ThemeIcon variant='light' color='blue'>
                        <IconChartBar size={16} />
                      </ThemeIcon>
                      <Box>
                        <Text fw={500}>Program Enrollment Summary</Text>
                        <Text size='sm' c='dimmed'>
                          Registration statistics grouped by academic programs
                        </Text>
                      </Box>
                    </Group>
                    {hasData && (
                      <Button
                        leftSection={<IconDownload size={16} />}
                        onClick={handleExportSummary}
                        variant='light'
                        loading={isExportingSummary}
                        disabled={isExportingSummary}
                        size='sm'
                      >
                        Export
                      </Button>
                    )}
                  </Group>
                </Box>
                <Stack gap='md'>
                  {reportData?.summaryData?.schools?.map((school, index) => (
                    <ProgramBreakdownTable key={index} school={school} />
                  ))}
                  {(!reportData?.summaryData?.schools ||
                    reportData.summaryData.schools.length === 0) && (
                    <Alert color='blue' variant='light'>
                      No program data available for the selected criteria.
                    </Alert>
                  )}
                </Stack>
              </Paper>
            </Tabs.Panel>

            <Tabs.Panel value='students' pt='lg'>
              <Paper withBorder p={0} style={{ overflow: 'hidden' }}>
                <Box p='md'>
                  <Group justify='space-between'>
                    <Group>
                      <ThemeIcon variant='light' color='green'>
                        <IconUsers size={16} />
                      </ThemeIcon>
                      <Box>
                        <Text fw={500}>Registered Students</Text>
                        <Text size='sm' c='dimmed'>
                          Complete list of students matching the selected
                          criteria
                        </Text>
                      </Box>
                    </Group>
                    {hasData && (
                      <Button
                        leftSection={<IconDownload size={16} />}
                        onClick={handleExportStudents}
                        variant='light'
                        loading={isExportingStudents}
                        disabled={isExportingStudents}
                        size='sm'
                      >
                        Export
                      </Button>
                    )}
                  </Group>
                </Box>
                <Divider />
                <StudentTable
                  data={studentsData?.students || []}
                  isLoading={isLoadingStudents}
                  totalCount={studentsData?.totalCount || 0}
                  currentPage={studentsData?.currentPage || 1}
                  totalPages={studentsData?.totalPages || 0}
                  onPageChange={handlePageChange}
                  searchQuery={searchQuery}
                  onSearchChange={handleSearchChange}
                />
              </Paper>
            </Tabs.Panel>
          </Tabs>
        )}

        {error && (
          <Alert
            icon={<IconInfoCircle size={16} />}
            title='Error Loading Report'
            color='red'
            variant='light'
          >
            {error instanceof Error
              ? error.message
              : 'An unexpected error occurred'}
          </Alert>
        )}
      </Stack>
    </Container>
  );
}
