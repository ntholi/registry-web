'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
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
} from '@mantine/core';
import {
  IconFileText,
  IconUsers,
  IconChartBar,
  IconDownload,
  IconInfoCircle,
} from '@tabler/icons-react';
import { getRegistrationDataPreview } from '@/server/reports/registration/actions';
import ProgramBreakdownTable from './ProgramBreakdownTable';
import StudentTable from './StudentTable';
import RegistrationFilter, { type ReportFilter } from './RegistrationFilter';

export default function RegistrationReportPage() {
  const [filter, setFilter] = useState<ReportFilter>({});

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

  const canGenerateReport = Boolean(filter.termId);
  const hasData = Boolean(
    reportData &&
      ((reportData.summaryData?.schools &&
        reportData.summaryData.schools.length > 0) ||
        (reportData.fullData?.students &&
          reportData.fullData.students.length > 0))
  );

  const handleExportReport = () => {
    // TODO: Implement report export functionality
    console.log('Exporting report...', { filter, reportData });
  };

  return (
    <Container size='xl' p='lg'>
      <Stack gap='lg'>
        {/* Header Section */}
        <Paper p='lg' withBorder radius='md'>
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

            {hasData && (
              <Button
                leftSection={<IconDownload size={16} />}
                onClick={handleExportReport}
                variant='light'
              >
                Export Report
              </Button>
            )}
          </Group>
          <RegistrationFilter filter={filter} onFilterChange={setFilter} />

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

        {/* Report Content */}
        {canGenerateReport && (
          <Tabs defaultValue='summary' variant='outline'>
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
              <Paper
                withBorder
                radius='md'
                p={0}
                style={{ overflow: 'hidden' }}
              >
                <Box p='md' bg='gray.0'>
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
              <Paper
                withBorder
                radius='md'
                p={0}
                style={{ overflow: 'hidden' }}
              >
                <Box p='md' bg='gray.0'>
                  <Group>
                    <ThemeIcon variant='light' color='green'>
                      <IconUsers size={16} />
                    </ThemeIcon>
                    <Box>
                      <Text fw={500}>Registered Students</Text>
                      <Text size='sm' c='dimmed'>
                        Complete list of students matching the selected criteria
                      </Text>
                    </Box>
                  </Group>
                </Box>
                <StudentTable
                  data={reportData?.fullData?.students || []}
                  isLoading={isLoading}
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
